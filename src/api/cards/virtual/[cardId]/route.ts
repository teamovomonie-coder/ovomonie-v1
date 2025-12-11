import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

export async function POST(
  request: Request,
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

    // Get user data to retrieve current wallet balance
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const userData = userSnapshot.data();
    const currentWalletBalance = userData.balance || 0;

    // Get the virtual card to verify it belongs to this user
    const cardRef = doc(collection(db, 'users', userId, 'virtualCards'), cardId);
    const cardSnapshot = await getDoc(cardRef);

    if (!cardSnapshot.exists()) {
      return NextResponse.json({ message: 'Virtual card not found.' }, { status: 404 });
    }

    // Update the card balance to match the current wallet balance
    await updateDoc(cardRef, {
      balance: currentWalletBalance,
      lastSyncedAt: new Date(),
    });

    logger.info(`Virtual card balance synced for user ${userId}`, {
      cardId,
      newBalance: currentWalletBalance,
    });

    return NextResponse.json({
      success: true,
      cardId,
      balance: currentWalletBalance,
      message: 'Card balance synced successfully.',
    });
  } catch (error) {
    logger.error('Virtual card sync error:', error);
    return NextResponse.json(
      { message: 'An error occurred while syncing the card balance.' },
      { status: 500 }
    );
  }
}
