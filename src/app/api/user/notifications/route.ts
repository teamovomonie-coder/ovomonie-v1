import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    const notifications = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        category: data.category,
        read: !!data.read,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
      };
    });
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
