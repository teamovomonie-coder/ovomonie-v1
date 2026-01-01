import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { type, message } = await request.json();

    if (!type || !message) {
      return NextResponse.json({ message: 'Type and message are required' }, { status: 400 });
    }

    if (!['suggestion', 'bug', 'complaint', 'praise'].includes(type)) {
      return NextResponse.json({ message: 'Invalid feedback type' }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ message: 'Feedback must be at least 10 characters' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: userId,
        type,
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to submit feedback', { error, userId });
      return NextResponse.json({ message: 'Failed to submit feedback' }, { status: 500 });
    }

    logger.info('Feedback submitted successfully', { feedbackId: data.id, userId, type });

    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      feedback: data
    });

  } catch (error) {
    logger.error('Feedback submission error', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch feedback', { error, userId });
      return NextResponse.json({ message: 'Failed to fetch feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });

  } catch (error) {
    logger.error('Feedback fetch error', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}