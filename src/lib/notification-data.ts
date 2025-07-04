import type { LucideIcon } from 'lucide-react';
import { DollarSign, ShieldAlert, BadgePercent, ArrowLeftRight } from 'lucide-react';

export interface Notification {
  id: string;
  category: 'transaction' | 'security' | 'promotion';
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    category: 'transaction',
    icon: ArrowLeftRight,
    title: 'Transfer Successful',
    description: 'You sent ₦50,000 to John Doe.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
  },
  {
    id: '2',
    category: 'security',
    icon: ShieldAlert,
    title: 'New Device Login',
    description: 'A new device (Chrome on Windows) logged into your account.',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
    read: false,
  },
  {
    id: '3',
    category: 'transaction',
    icon: DollarSign,
    title: 'Deposit Received',
    description: 'You received a deposit of ₦250,000 from Company ABC.',
    timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
    read: true,
  },
  {
    id: '4',
    category: 'promotion',
    icon: BadgePercent,
    title: '5% Cashback Offer!',
    description: 'Get 5% cashback on all utility bill payments this weekend.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
  },
   {
    id: '5',
    category: 'security',
    icon: ShieldAlert,
    title: 'Password Changed',
    description: 'Your password was successfully changed.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    read: true,
  },
];
