
"use client";

import { useNotifications } from '@/context/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notification-data';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };
  
  const handleMarkOneRead = (id: string) => {
    markAsRead(id);
  };

  const renderNotificationList = (list: Notification[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
            <Bell className="mx-auto h-12 w-12 mb-4" />
            <p>No notifications here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map(notification => (
          <div 
            key={notification.id} 
            className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted cursor-pointer"
            onClick={() => handleMarkOneRead(notification.id)}
          >
            <div className="relative">
              <div className="p-3 bg-primary-light-bg rounded-full text-primary">
                <notification.icon className="h-6 w-6" />
              </div>
              {!notification.read && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
            <div className="flex-grow">
              <p className={cn("font-semibold", !notification.read && "text-foreground")}>{notification.title}</p>
              <p className={cn("text-sm", !notification.read ? "text-muted-foreground" : "text-muted-foreground/70")}>{notification.description}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>You have {unreadCount} unread messages.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-4">
            {renderNotificationList(notifications)}
          </TabsContent>
          <TabsContent value="transactions" className="pt-4">
            {renderNotificationList(notifications.filter(n => n.category === 'transaction'))}
          </TabsContent>
           <TabsContent value="security" className="pt-4">
            {renderNotificationList(notifications.filter(n => n.category === 'security'))}
          </TabsContent>
           <TabsContent value="promotions" className="pt-4">
            {renderNotificationList(notifications.filter(n => n.category === 'promotion'))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
