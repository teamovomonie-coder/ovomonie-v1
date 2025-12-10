import { db } from './firebase';

/**
 * Ensures Firestore is initialized on app start.
 * This does not make network calls; it simply touches the shared db instance.
 */
export function ensureFirestoreInit() {
  try {
    // Accessing db is enough to initialize the Firebase app/Firestore client.
    if (db) {
      console.log('Firestore initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Firestore', error);
  }
}
