/**
 * VFD Bills Payment API Route
 * Handles all bill payment operations through VFD Bills API
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import vfdBillsAPI, { type BillPaymentRequest } from '@/lib/vfd-bills';
import { getDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'categories':
        const categories = await vfdBillsAPI.getBillerCategories();
        return NextResponse.json({ success: true, data: categories });

      case 'billers':
        const categoryName = searchParams.get('category');
        const billers = await vfdBillsAPI.getBillerList(categoryName || undefined);
        return NextResponse.json({ success: true, data: billers });

      case 'items':
        const billerId = searchParams.get('billerId');
        const divisionId = searchParams.get('divisionId');
        const productId = searchParams.get('productId');

        if (!billerId || !divisionId || !productId) {
          return NextResponse.json(
            { message: 'Missing required parameters: billerId, divisionId, productId' },
            { status: 400 }
          );
        }

        const items = await vfdBillsAPI.getBillerItems(billerId, divisionId, productId);
        return NextResponse.json({ success: true, data: items });

      case 'validate':
        const customerId = searchParams.get('customerId');
        const division = searchParams.get('division');
        const paymentItem = searchParams.get('paymentItem');
        const biller = searchParams.get('billerId');

        if (!customerId || !division || !paymentItem || !biller) {
          return NextResponse.json(
            { message: 'Missing required parameters for validation' },
            { status: 400 }
          );
        }

        const validation = await vfdBillsAPI.validateCustomer(customerId, division, paymentItem, biller);
        return NextResponse.json({ success: validation.status === '00', data: validation });

      case 'status':
        const transactionId = searchParams.get('transactionId');

        if (!transactionId) {
          return NextResponse.json({ message: 'Missing transactionId' }, { status: 400 });
        }

        const status = await vfdBillsAPI.getTransactionStatus(transactionId);
        return NextResponse.json({ success: true, data: status });

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('[VFD Bills API] GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      amount,
      division,
      paymentItem,
      productId,
      billerId,
      reference,
      phoneNumber,
      billerName,
      category,
    } = body;

    // Validate required fields
    if (!customerId || !amount || !division || !paymentItem || !productId || !billerId || !reference) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate transaction
    const adminDb = await getDb();
    const existingTxn = await adminDb
      .collection('financialTransactions')
      .where('reference', '==', reference)
      .limit(1)
      .get()
      .then((snap) => (snap.empty ? null : snap.docs[0]))
      .catch(() => null);

    if (existingTxn) {
      logger.info(`[VFD Bills] Duplicate payment attempt for ${reference}`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        data: existingTxn.data(),
      });
    }

    // Prepare payment request
    const paymentRequest: BillPaymentRequest = {
      customerId,
      amount: String(amount),
      division,
      paymentItem,
      productId,
      billerId,
      reference,
      phoneNumber: phoneNumber || undefined,
    };

    logger.info('[VFD Bills] Initiating bill payment', { userId, reference, billerId, amount });

    // Make payment
    const paymentResult = await vfdBillsAPI.payBill(paymentRequest);

    // Log transaction to Firestore
    const txnDoc = adminDb.collection('financialTransactions').doc();
    await txnDoc.set({
      userId,
      reference,
      vfdReference: paymentResult.data.reference,
      type: 'debit',
      category: 'bill_payment',
      amount: Number(amount),
      description: `${billerName || billerId} - ${category || 'Bill'} Payment`,
      status: paymentResult.status === '00' ? 'completed' : paymentResult.status === '09' ? 'pending' : 'failed',
      paymentGateway: 'VFD',
      metadata: {
        billerId,
        billerName,
        customerId,
        division,
        paymentItem,
        productId,
        category,
        phoneNumber,
        token: paymentResult.data.token,
        KCT1: paymentResult.data.KCT1,
        KCT2: paymentResult.data.KCT2,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('[VFD Bills] Payment successful', {
      reference,
      status: paymentResult.status,
      token: paymentResult.data.token ? 'provided' : 'none',
    });

    return NextResponse.json({
      success: true,
      message: paymentResult.message,
      data: {
        ...paymentResult.data,
        transactionId: txnDoc.id,
        status: paymentResult.status,
      },
    });
  } catch (error: any) {
    logger.error('[VFD Bills API] POST error:', error);
    return NextResponse.json(
      { message: error.message || 'Payment failed' },
      { status: 500 }
    );
  }
}
