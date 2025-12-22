import { notificationService } from './db';
import fetch from 'node-fetch';
import { logger } from './logger';

export async function sendNotification(opts: {
  userId: string;
  title: string;
  body: string;
  reference?: string;
  amount?: number;
  channels?: Array<'in-app' | 'email' | 'push'>;
}) {
  const { userId, title, body, reference, amount, channels = ['in-app'] } = opts;

  // Always persist as in-app notification
  try {
    await notificationService.create({
      user_id: userId,
      title,
      body,
      category: 'payment',
      type: 'receipt',
      amount: amount ?? null,
      reference: reference ?? null,
    } as any);
  } catch (err) {
    logger.warn('Failed to persist in-app notification', err);
  }

  // Send push via FCM if requested and FCM key available
  if (channels.includes('push') && process.env.FCM_SERVER_KEY) {
    try {
      const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
      // In a real implementation, you'd resolve the user's device tokens from DB
      const tokens = [] as string[];
      if (tokens.length > 0) {
        await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_ids: tokens,
            notification: { title, body },
            data: { reference, amount },
          }),
        });
      }
    } catch (err) {
      logger.warn('FCM push send failed (non-fatal)', err);
    }
  }

  // Send email via SendGrid if requested and key available
  if (channels.includes('email') && process.env.SENDGRID_API_KEY) {
    try {
      // Resolve user email address from notifications table or users table in real app
      const toEmail = null as string | null;
      if (toEmail) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: process.env.SENDGRID_FROM || 'noreply@example.com' },
            subject: title,
            content: [{ type: 'text/plain', value: body }],
          }),
        });
      }
    } catch (err) {
      logger.warn('SendGrid send failed (non-fatal)', err);
    }
  }
}
