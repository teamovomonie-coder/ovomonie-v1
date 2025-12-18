
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification } from '@/lib/notification-data';
import { ArrowLeftRight, Bell, DollarSign, ShieldAlert, BadgePercent } from 'lucide-react';
import { useAuth } from './auth-context';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'icon'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'transaction':
    case 'transfer':
      return ArrowLeftRight;
    case 'security':
      return ShieldAlert;
    case 'promotion':
      return BadgePercent;
    default:
      return Bell;
  }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Real-time notifications via Supabase PostgreSQL Changes when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      setNotifications([]);
      return;
    }

    console.log('[NotificationContext] Setting up real-time for user:', user.userId);

    // Initial fetch of existing notifications (use server API to avoid client-side Supabase CORS issues)
    const fetchNotifications = async () => {
      console.log('[NotificationContext] Fetching notifications via API for user:', user.userId);
      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          console.warn('[NotificationContext] No auth token, skipping notifications fetch');
          setNotifications([]);
          return;
        }
        const res = await fetch('/api/user/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            console.warn('[NotificationContext] Unauthorized, user needs to login');
          } else {
            const body = await res.text().catch(() => '');
            console.warn('[NotificationContext] API notifications fetch failed', { status: res.status, statusText: res.statusText, body });
          }
          setNotifications([]);
          return;
        }
        const data = await res.json();
        console.log('[NotificationContext] Raw API response:', data);
        const mapped: Notification[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title || '',
          description: item.body || item.description || '',
          category: (item.category || 'transaction') as Notification['category'],
          read: item.read || false,
          timestamp: new Date(item.createdAt || item.created_at || Date.now()),
          icon: getCategoryIcon(item.category),
          amount: item.amount,
          reference: item.reference,
          type: item.type,
          sender_name: item.sender_name,
          sender_phone: item.sender_phone,
          sender_account: item.sender_account,
          recipient_name: item.recipient_name,
          recipient_phone: item.recipient_phone,
          recipient_account: item.recipient_account,
        }));
        console.log('[NotificationContext] Setting mapped notifications from API:', mapped.length, mapped);
        setNotifications(mapped);
      } catch (err) {
        console.error('[NotificationContext] Exception during fetch via API:', err);
        setNotifications([]);
        return;
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications (skip if supabase is not configured)
    const channel = supabase
      ? supabase
          .channel(`notifications:${user.userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.userId}`,
            },
            (payload) => {
              console.log('[NotificationContext] Real-time notification event:', payload.eventType, payload);
              
              if (payload.eventType === 'INSERT') {
                const newData = payload.new as any;
                const category = (newData.category || 'transaction') as Notification['category'];
                const notification: Notification = {
                  id: newData.id,
                  title: newData.title || '',
                  description: newData.body || newData.description || '',
                  category,
                  read: newData.read || false,
                  timestamp: new Date(newData.created_at || Date.now()),
                  icon: getCategoryIcon(category),
                  amount: newData.amount,
                  reference: newData.reference,
                  type: newData.type,
                  sender_name: newData.sender_name,
                  sender_phone: newData.sender_phone,
                  sender_account: newData.sender_account,
                  recipient_name: newData.recipient_name,
                  recipient_phone: newData.recipient_phone,
                  recipient_account: newData.recipient_account,
                };
                setNotifications(prev => [notification, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedData = payload.new as any;
                setNotifications(prev =>
                  prev.map(n => n.id === updatedData.id ? { 
                    ...n, 
                    read: updatedData.read,
                    sender_name: updatedData.sender_name || n.sender_name,
                    sender_phone: updatedData.sender_phone || n.sender_phone,
                    sender_account: updatedData.sender_account || n.sender_account,
                    recipient_name: updatedData.recipient_name || n.recipient_name,
                    recipient_phone: updatedData.recipient_phone || n.recipient_phone,
                    recipient_account: updatedData.recipient_account || n.recipient_account,
                  } : n)
                );
              } else if (payload.eventType === 'DELETE') {
                const deletedData = payload.old as any;
                setNotifications(prev => prev.filter(n => n.id !== deletedData.id));
              }
            }
          )
          .subscribe((status) => {
            console.log('[NotificationContext] Subscription status:', status);
          })
      : null;

    return () => {
      console.log('[NotificationContext] Cleaning up subscription');
      channel?.unsubscribe();
    };
  }, [isAuthenticated, user?.userId]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'icon'>) => {
    console.log('[NotificationContext] addNotification called:', notification);
    // Insert into Supabase; the realtime channel will deliver it back for consistency.
    if (user?.userId) {
      console.log('[NotificationContext] Inserting notification for user:', user.userId);
      (async () => {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.userId,
            title: notification.title,
            body: notification.description || notification.title,
            category: notification.category,
            amount: notification.amount,
            reference: notification.reference,
            type: notification.type,
          });

        if (error) {
          console.error('[NotificationContext] Failed to insert notification:', error);
        } else {
          console.log('[NotificationContext] Notification inserted:', data);
        }
      })();
    } else {
      console.warn('[NotificationContext] No userId, creating local notification');
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        read: false,
        icon: getCategoryIcon(notification.category),
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [user?.userId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // Update in Supabase (non-blocking)
    (async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) {
        console.warn('Failed to mark notification as read:', error);
      }
    })();
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // Update all notifications in Supabase for this user (non-blocking)
    if (user?.userId) {
      (async () => {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.userId);
        if (error) {
          console.warn('Failed to mark all notifications as read:', error);
        }
      })();
    }
  }, [user?.userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
