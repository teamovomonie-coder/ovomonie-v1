import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

const VIRTUAL_CARD_FEE = 500_00; // ₦500 in kobo
const CARD_VALIDITY_YEARS = 1;

function generateCardNumber(): string {
  // Generate a 16-digit card number (4000-5999 range for Visa test cards)
  const prefix = '4000';
  const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + randomDigits;
}

function generateCVV(): string {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateExpiryDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + CARD_VALIDITY_YEARS).slice(-2);
  return `${month}/${year}`;
}

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

    const { clientReference } = await request.json();

    // Get user data
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const userData = userSnapshot.data();
    const currentBalance = userData.balance || 0;

    // Check if user has sufficient balance
    if (currentBalance < VIRTUAL_CARD_FEE) {
      return NextResponse.json(
        { message: `Insufficient balance. You need at least ₦${VIRTUAL_CARD_FEE / 100} to create a virtual card.` },
        { status: 400 }
      );
    }

    // Deduct fee
    const newBalance = currentBalance - VIRTUAL_CARD_FEE;

    // Generate card details
    const cardId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const expiryDate = generateExpiryDate();

    // Create virtual card record
    const virtualCardsRef = collection(db, 'users', userId, 'virtualCards');
    await setDoc(doc(virtualCardsRef, cardId), {
      cardId,
      cardNumber,
      expiryDate,
      cvv,
      isActive: true,
      balance: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + CARD_VALIDITY_YEARS * 365 * 24 * 60 * 60 * 1000),
      clientReference,
    });

    // Update user balance
    await updateDoc(userRef, {
      balance: newBalance,
    });

    logger.info(`Virtual card created for user ${userId}`, {
      cardId,
      fee: VIRTUAL_CARD_FEE,
      clientReference,
    });

    return NextResponse.json({
      success: true,
      cardId,
      cardNumber,
      expiryDate,
      cvv,
      newBalanceInKobo: newBalance,
      message: 'Virtual card created successfully.',
    });
  } catch (error) {
    logger.error('Virtual card creation error:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating the virtual card.' },
      { status: 500 }
    );
  }
}
