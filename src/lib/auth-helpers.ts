import { verifyAuthToken } from '@/lib/auth';

export function getUserIdFromToken(headers: Headers | any): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = verifyAuthToken(token);
  return payload?.sub || null;
}