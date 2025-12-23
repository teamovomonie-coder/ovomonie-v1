import { verifyAuthToken } from './auth';
import { logger } from './logger';

/**
 * Extracts a user ID from a bearer token in the request headers.
 * @param headers The request headers from Next.js.
 * @returns The user ID string, or null if not found or invalid.
 */
type HeaderLike = { get(name: string): string | null };

export function getUserIdFromToken(headers: HeaderLike | Promise<HeaderLike>): string | null {
    const headerObj = headers as HeaderLike & { get?: HeaderLike['get'] };
    const authorization = headerObj.get?.('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.split(' ')[1];
    if (!token) return null;

    // Only accept signed tokens for security
    const payload = verifyAuthToken(token);
    return payload?.sub || null;
}

/**
 * Creates a notification in the Supabase 'notifications' collection.
 * @param userId The ID of the user to notify.
 * @param notificationData The notification data.
 * @returns True if successful, false otherwise.
 */
import { DbNotification } from '@/types/user';

export async function createNotification(userId: string, notificationData: Omit<DbNotification, 'id' | 'created_at' | 'user_id'>): Promise<boolean> {
    try {
        const { dbOperations } = await import('./database');
        const result = await dbOperations.createNotification({
            user_id: userId,
            title: notificationData.title,
            body: notificationData.body,
            type: notificationData.type || 'info',
            read: notificationData.read || false,
        });
        return result !== null;
    } catch (error) {
        logger.error('Failed to create notification', { error, userId, notificationData });
        return false;
    }
}