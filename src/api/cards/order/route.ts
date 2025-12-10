import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

const CUSTOM_CARD_FEE = 1500_00; // ₦1,500 in kobo
const ESTIMATED_DELIVERY_DAYS = 7;

export async function POST(request: Request) {
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

    const {
      nameOnCard,
      designType,
      designValue,
      shippingInfo,
      clientReference,
    } = await request.json();

    // Validate required fields
    if (!nameOnCard || !designType || !designValue || !shippingInfo || !clientReference) {
      return NextResponse.json(
        { message: 'Missing required fields for card order.' },
        { status: 400 }
      );
    }

    // Get user data
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const userData = userSnapshot.data();
    const currentBalance = userData.balance || 0;

    // Check if user has sufficient balance
    if (currentBalance < CUSTOM_CARD_FEE) {
      return NextResponse.json(
        { message: `Insufficient balance. You need at least ₦${CUSTOM_CARD_FEE / 100} to order a custom card.` },
        { status: 400 }
      );
    }

    // Deduct fee
    const newBalance = currentBalance - CUSTOM_CARD_FEE;

    // Create card order record
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cardOrdersRef = collection(db, 'users', userId, 'cardOrders');

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + ESTIMATED_DELIVERY_DAYS);

    await setDoc(doc(cardOrdersRef, orderId), {
      orderId,
      nameOnCard,
      designType,
      designValue: designType !== 'upload' ? designValue : '[CUSTOM_UPLOAD]',
      shippingInfo,
      status: 'processing',
      createdAt: new Date(),
      estimatedDeliveryDate,
      clientReference,
      fee: CUSTOM_CARD_FEE,
    });

    // Update user balance
    await updateDoc(userRef, {
      balance: newBalance,
    });

    logger.info(`Custom card order created for user ${userId}`, {
      orderId,
      nameOnCard,
      fee: CUSTOM_CARD_FEE,
      clientReference,
    });

    return NextResponse.json({
      success: true,
      orderId,
      newBalanceInKobo: newBalance,
      estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
      message: 'Card order placed successfully.',
    });
  } catch (error) {
    logger.error('Card order error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your card order.' },
      { status: 500 }
    );
  }
}
