import type { LucideIcon } from 'lucide-react';
import { DollarSign, ShieldAlert, BadgePercent, ArrowLeftRight } from 'lucide-react';

export interface Notification {
  id: string;
  category: 'transaction' | 'security' | 'promotion' | 'transfer';
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  amount?: number;
  reference?: string;
  metadata?: any;
  type?: 'debit' | 'credit';
  sender_name?: string;
  sender_phone?: string;
  sender_account?: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_account?: string;
  body?: string;
}
