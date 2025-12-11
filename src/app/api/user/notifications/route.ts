import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '@/lib/firebase';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const baseCollection = collection(db, 'notifications');
    let snap;
    try {
      const q = query(
        baseCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      );
      snap = await getDocs(q);
    } catch (err) {
      // If index is missing, fall back to unordered fetch to avoid 500s.
      if (err instanceof FirebaseError && err.code === 'failed-precondition') {
        const fallback = query(baseCollection, where('userId', '==', userId));
        snap = await getDocs(fallback);
      } else {
        throw err;
      }
    }
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
