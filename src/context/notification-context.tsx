
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockNotifications, Notification } from '@/lib/notification-data';
import { ArrowLeftRight, Bell } from 'lucide-react';
import { useAuth } from './auth-context';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'icon'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const { user, isAuthenticated } = useAuth();

  // Fetch persisted notifications from Firestore when authenticated
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!isAuthenticated || !user?.userId) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('ovo-auth-token') : null;
        const res = await fetch('/api/user/notifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          // Map server notifications into UI shape; default icon by category
          const mapped: Notification[] = data.notifications.map((n: any) => ({
            id: n.id || `notif-${n.createdAt || Date.now()}`,
            title: n.title || '',
            message: n.body || '',
            category: n.category || 'general',
            read: !!n.read,
            timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
            icon: (n.category === 'transaction') ? ArrowLeftRight : Bell,
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('Could not load notifications, using defaults.', err);
      }
    };
    fetchNotifications();
  }, [isAuthenticated, user?.userId]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'icon'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
      // Assign icon based on category
      icon: notification.category === 'transaction' ? ArrowLeftRight : Bell, 
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

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
