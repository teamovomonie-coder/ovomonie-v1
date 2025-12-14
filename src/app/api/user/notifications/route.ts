import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';

// Initialize Supabase client (primary)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch from Supabase (primary)
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, title, body, category, read, created_at, amount, reference, type, sender_name, recipient_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Supabase error fetching notifications:', error);
      return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Transform response
    const transformedNotifications = (notifications || []).map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      category: notification.category,
      read: notification.read || false,
      createdAt: new Date(notification.created_at).getTime(),
      amount: notification.amount,
      reference: notification.reference,
      type: notification.type,
      senderName: notification.sender_name,
      recipientName: notification.recipient_name,
    }));

    return NextResponse.json(transformedNotifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
