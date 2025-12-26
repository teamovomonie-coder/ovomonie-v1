import { verifyAuthToken } from './auth';

export async function getUserIdFromToken(headers: Headers): Promise<string | null> {
  const authHeader = headers.get('authorization');
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
