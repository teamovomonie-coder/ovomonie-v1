"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface WealthNotification {
  id: string;
  title: string;
  description: string;
  type: 'investment' | 'withdrawal' | 'return' | 'alert';
  amount?: number;
  timestamp: string;
  read: boolean;
}

interface WealthNotificationContextType {
  notifications: WealthNotification[];
  addNotification: (notification: Omit<WealthNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const WealthNotificationContext = createContext<WealthNotificationContextType | undefined>(undefined);

export function WealthNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WealthNotification[]>([
    {
      id: '1',
      title: 'Welcome to Ovo Wealth',
      description: 'Start your investment journey with our range of products',
      type: 'alert',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  const addNotification = (notification: Omit<WealthNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: WealthNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <WealthNotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </WealthNotificationContext.Provider>
  );
}

export function useWealthNotifications() {
  const context = useContext(WealthNotificationContext);
  if (context === undefined) {
    throw new Error('useWealthNotifications must be used within a WealthNotificationProvider');
  }
  return context;
}