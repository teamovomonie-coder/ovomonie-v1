
import { collection, addDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type { ReadonlyHeaders } from 'next/headers';

/**
 * Safely adds a document to a Firestore collection, catching potential errors.
 * @param path The path to the Firestore collection.
 * @param data The data to add to the document.
 * @returns The ID of the newly created document, or null if an error occurred.
 */
export async function safeAddDoc(path: string, data: DocumentData): Promise<string | null> {
    try {
        const docRef = await addDoc(collection(db, path), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${path}:`, error);
        return null;
    }
}

/**
 * Creates a notification in the Firestore 'notifications' collection.
 * @param userId The ID of the user to notify.
 * @param notificationData The notification data.
 * @returns True if successful, false otherwise.
 */
export async function createNotification(userId: string, notificationData: Omit<DocumentData, 'userId' | 'createdAt' | 'read'>): Promise<boolean> {
    const success = await safeAddDoc('notifications', {
        ...notificationData,
        userId,
        read: false,
    });
    return success !== null;
}

/**
 * Extracts a user ID from a bearer token in the request headers.
 * @param headers The request headers from Next.js.
 * @returns The user ID string, or null if not found or invalid.
 */
export function getUserIdFromToken(headers: ReadonlyHeaders): string | null {
    const authorization = headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.split(' ')[1];
    if (!token.startsWith('fake-token-')) {
        return null;
    }
    return token.split('-')[2] || null;
}
