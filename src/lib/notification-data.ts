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
}
