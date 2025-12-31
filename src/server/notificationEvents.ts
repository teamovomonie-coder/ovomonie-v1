import { shouldSendNotification, sendNotification } from '@/server/notificationService';

// Example: Debit Transaction
export async function handleDebitTransaction({ userId, amount, balance }: { userId: string; amount: number; balance: number; }) {
  if (await shouldSendNotification(userId, 'debit')) {
    await sendNotification({
      userId,
      type: 'debit',
      title: 'Debit Alert',
      message: `₦${amount.toLocaleString()} debited from your account.`,
      metadata: { amount, balance },
    });
  }
  if (amount > 50000 && await shouldSendNotification(userId, 'large_transaction')) {
    await sendNotification({
      userId,
      type: 'large_transaction',
      title: 'Large Transaction Alert',
      message: `A large debit of ₦${amount.toLocaleString()} occurred.`,
      metadata: { amount, balance },
    });
  }
  if (balance < 1000 && await shouldSendNotification(userId, 'low_balance')) {
    await sendNotification({
      userId,
      type: 'low_balance',
      title: 'Low Balance Alert',
      message: `Your account balance is low: ₦${balance.toLocaleString()}.`,
      metadata: { amount, balance },
    });
  }
}

// Example: Credit Transaction
export async function handleCreditTransaction({ userId, amount, balance }: { userId: string; amount: number; balance: number; }) {
  if (await shouldSendNotification(userId, 'credit')) {
    await sendNotification({
      userId,
      type: 'credit',
      title: 'Credit Alert',
      message: `₦${amount.toLocaleString()} credited to your account.`,
      metadata: { amount, balance },
    });
  }
}

// Example: Failed Transaction
export async function handleFailedTransaction({ userId, reason }: { userId: string; reason: string; }) {
  if (await shouldSendNotification(userId, 'failed_transaction')) {
    await sendNotification({
      userId,
      type: 'failed_transaction',
      title: 'Failed Transaction',
      message: `A transaction failed: ${reason}`,
      metadata: { reason },
    });
  }
}

// Example: Login from new device
export async function handleLoginAlert({ userId, deviceInfo }: { userId: string; deviceInfo: string; }) {
  if (await shouldSendNotification(userId, 'login_alert')) {
    await sendNotification({
      userId,
      type: 'login_alert',
      title: 'New Login Detected',
      message: `Login from new device: ${deviceInfo}`,
      metadata: { deviceInfo },
    });
  }
}
