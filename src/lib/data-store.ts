// DEPRECATED: Use DatabaseService from @/lib/services/database-service instead
// This file is kept for backward compatibility only

import { DatabaseService } from '@/lib/services/database-service';

type TransferInput = {
  senderId: string;
  recipientId: string;
  amountKobo: number;
  reference: string;
  narration: string;
};

export const getUserById = (userId: string) => DatabaseService.getUser(userId, 'id');

export const getDailyTotals = async (userId: string, dayStartISO: string, type: 'debit' | 'credit') => {
  const { debitTotal, creditTotal } = await DatabaseService.checkDailyLimits(userId);
  return type === 'debit' ? debitTotal : creditTotal;
};

export const performTransfer = (input: TransferInput) => {
  const { senderId, recipientId, amountKobo, reference, narration } = input;
  return DatabaseService.processTransfer(senderId, recipientId, amountKobo, reference, narration, '', '');
};
