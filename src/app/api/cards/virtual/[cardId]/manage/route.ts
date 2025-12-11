import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const userId = decoded.sub;
    const { cardId } = params;
    const body = await request.json();
    const { action } = body; // 'deactivate' or 'delete'

    if (!['deactivate', 'delete'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
    }

    // Verify card belongs to user
    const cardRef = doc(db, 'users', userId, 'virtualCards', cardId);
    const cardSnap = await getDoc(cardRef);

    if (!cardSnap.exists()) {
      return NextResponse.json({ message: 'Virtual card not found.' }, { status: 404 });
    }

    if (action === 'deactivate') {
      // Mark card as inactive
      await updateDoc(cardRef, {
        isActive: false,
        deactivatedAt: new Date(),
      });

      logger.info(`Virtual card deactivated for user ${userId}`, { cardId });

      return NextResponse.json({
        success: true,
        cardId,
        message: 'Virtual card deactivated successfully.',
      });
    }

    if (action === 'delete') {
      // Delete the card document
      await deleteDoc(cardRef);

      logger.info(`Virtual card deleted for user ${userId}`, { cardId });

      return NextResponse.json({
        success: true,
        cardId,
        message: 'Virtual card deleted successfully.',
      });
    }
  } catch (error) {
    logger.error('Virtual card manage error:', error);
    return NextResponse.json(
      { message: 'An error occurred while managing the virtual card.' },
      { status: 500 }
    );
  }
}
