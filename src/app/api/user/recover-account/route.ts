import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find closed account
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('account_status', 'closed')
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'No closed account found with this email' }, { status: 404 });
    }

    // Check if account is still recoverable (within 30 days)
    const now = new Date();
    const scheduledDeletion = new Date(user.scheduled_deletion_at);
    
    if (now > scheduledDeletion) {
      return NextResponse.json({ message: 'Account recovery period has expired' }, { status: 410 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    // Reactivate account
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        account_status: 'active',
        closed_at: null,
        scheduled_deletion_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to recover account', { error: updateError, userId: user.id });
      return NextResponse.json({ message: 'Failed to recover account' }, { status: 500 });
    }

    logger.info('Account recovered successfully', { userId: user.id, email });

    return NextResponse.json({ 
      message: 'Account recovered successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });

  } catch (error) {
    logger.error('Account recovery error', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}