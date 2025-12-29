import { verifyAuthToken } from './auth';
import { headers } from 'next/headers';

export async function getUserIdFromToken(headersParam?: Headers): Promise<string | null> {
  const headersList = headersParam || await headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyAuthToken(token);
    return payload?.sub || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
