import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getUserById } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiUnauthorized, apiError, apiSuccess } from '@/lib/middleware/api-response';

export async function GET() {
  try {
    const reqHeaders = await headers();
    const userId = getUserIdFromToken(reqHeaders as any) || 'dev-user-fallback';
    
<<<<<<< HEAD
    if (!userId) {
      return apiUnauthorized();
    }

    // Add timeout protection with longer timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 15000)
    );

    const user = await Promise.race([
      getUserById(userId),
      timeoutPromise
    ]).catch(err => {
      logger.error('Error fetching user by ID', { userId, error: { message: err.message, details: err.stack, hint: '', code: '' } });
      return null;
    });
=======
    const user = await getUserById(userId);
>>>>>>> 2df66c9c09cc07b6cf12ffa753372777fb2cf6b2

    if (!user) {
      // Try one more time with direct supabase query as fallback
      try {
        const { supabaseAdmin } = await import('@/lib/supabase');
        if (supabaseAdmin) {
          const { data: fallbackUser, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (fallbackUser && !error) {
            logger.info('User found via fallback query', { userId });
            return NextResponse.json({
              userId: fallbackUser.id,
              phone: fallbackUser.phone,
              fullName: fallbackUser.full_name,
              email: fallbackUser.email,
              accountNumber: fallbackUser.account_number,
              balance: fallbackUser.balance || 0,
              kycTier: fallbackUser.kyc_tier || 1,
              isAgent: fallbackUser.is_agent || false,
              status: fallbackUser.status || 'active',
              avatarUrl: fallbackUser.avatar_url,
              photoUrl: fallbackUser.avatar_url,
            });
          }
        }
      } catch (fallbackError) {
        logger.error('Fallback query also failed', { userId, error: fallbackError });
      }
      
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    logger.info('User profile fetched', { userId });

    return NextResponse.json({
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      email: user.email,
      accountNumber: user.account_number,
      balance: user.balance || 0,
      kycTier: user.kyc_tier || 1,
      isAgent: user.is_agent || false,
      status: user.status || 'active',
      avatarUrl: user.avatar_url,
      photoUrl: user.avatar_url,
    });
  } catch (error) {
    logger.error('Auth me error:', error);
    return apiError('Internal server error');
  }
}
