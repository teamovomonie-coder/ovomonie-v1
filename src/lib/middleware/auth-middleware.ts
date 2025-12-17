import { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  user: any;
}

export async function authenticateRequest(request: NextRequest): Promise<{ success: boolean; userId?: string; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);

    if (!payload || !payload.sub) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Get user from Supabase (primary database)
    const user = await getUserById(payload.sub);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, userId: payload.sub, user };
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export function createAuthenticatedHandler<T = any>(
  handler: (request: NextRequest, context: { userId: string; user: any }) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const auth = await authenticateRequest(request);
    
    if (!auth.success) {
      return new Response(JSON.stringify({ message: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(request, { userId: auth.userId!, user: auth.user });
  };
}