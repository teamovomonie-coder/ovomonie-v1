import { NextResponse } from 'next/server';
import { getUserIdFromToken, createNotification } from '@/lib/firestore-helpers';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { title, body: message, category } = body;
    if (!title || !message) {
      return NextResponse.json({ message: 'Missing title or body' }, { status: 400 });
    }

    const ok = await createNotification(userId, {
      title,
      body: message,
      category: category || 'general',
    });
    if (!ok) {
      return NextResponse.json({ message: 'Failed to create notification' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Notification created' });
  } catch (err) {
    console.error('Notification create error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
