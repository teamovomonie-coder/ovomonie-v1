/**
 * Unified VFD Payment Processing Route
 * Handles all payment types (card, bills, airtime, etc.) through VFD APIs
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import {
  initiateVFDPayment,
  validateVFDPaymentOTP,
  checkVFDPaymentStatus,
  processVFDPayment,
  type VFDPaymentRequest,
  type PaymentCategory,
} from '@/lib/vfd-processor';
import { getDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount, reference, category, description, metadata, ...paymentDetails } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json({ message: 'Action is required (initiate, validate-otp, status)' }, { status: 400 });
    }

    logger.info(`[VFD Payment] User ${userId} action: ${action}`);

    // ===== ACTION: INITIATE PAYMENT =====
    if (action === 'initiate') {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ message: 'Valid positive amount is required' }, { status: 400 });
      }
      if (!reference) {
        return NextResponse.json({ message: 'Payment reference is required' }, { status: 400 });
      }
      if (!category) {
        return NextResponse.json({ message: 'Payment category is required' }, { status: 400 });
      }

      const paymentRequest: VFDPaymentRequest = {
        userId,
        amount,
        reference,
        category: category as PaymentCategory,
        description: description || `${category} payment`,
        metadata,
        ...paymentDetails, // card details, bank details, etc.
      };

      try {
        // Check for idempotent request
        const adminDb = await getDb();
        const existingTxn = await adminDb
          .collection('financialTransactions')
          .where('reference', '==', reference)
          .limit(1)
          .get()
          .then((snap) => (snap.empty ? null : snap.docs[0]))
          .catch(() => null);

        if (existingTxn) {
          logger.info(`[VFD Payment] Idempotent request for ${reference}`);
          return NextResponse.json({
            success: true,
            message: 'Payment already processed',
            reference,
            status: 'completed',
          }, { status: 200 });
        }

        // Initiate payment
        const response = await initiateVFDPayment(paymentRequest);

        // Log transaction
        await adminDb.collection('financialTransactions').add({
          userId,
          reference,
          category,
          amount,
          description,
          status: response.status,
          paymentGateway: 'VFD',
          vfdReference: response.vfdReference,
          requiresOTP: response.requiresOTP,
          metadata: paymentDetails,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        logger.info(`[VFD Payment] Initiated: ${reference}`, { status: response.status, requiresOTP: response.requiresOTP });

        return NextResponse.json({
          success: response.success,
          message: response.message,
          reference,
          status: response.status,
          vfdReference: response.vfdReference,
          requiresOTP: response.requiresOTP,
          data: response.data,
        }, { status: response.success ? 200 : 400 });
      } catch (error) {
        logger.error('[VFD Payment] Initiation error:', error);
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : 'Payment initiation failed',
          reference,
        }, { status: 500 });
      }
    }

    // ===== ACTION: VALIDATE OTP =====
    if (action === 'validate-otp') {
      if (!reference) {
        return NextResponse.json({ message: 'Reference is required' }, { status: 400 });
      }
      if (!body.otp) {
        return NextResponse.json({ message: 'OTP is required' }, { status: 400 });
      }

      try {
        const response = await validateVFDPaymentOTP(reference, body.otp);

        // Update transaction status
        const adminDb = await getDb();
        await adminDb
          .collection('financialTransactions')
          .where('reference', '==', reference)
          .get()
          .then(async (snap) => {
            if (!snap.empty) {
              await snap.docs[0].ref.update({
                status: response.status,
                otpValidated: response.success,
                updatedAt: new Date().toISOString(),
              });
            }
          });

        logger.info(`[VFD Payment] OTP validated for ${reference}:`, { success: response.success });

        return NextResponse.json({
          success: response.success,
          message: response.message,
          reference,
          status: response.status,
          data: response.data,
        }, { status: response.success ? 200 : 400 });
      } catch (error) {
        logger.error('[VFD Payment] OTP validation error:', error);
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : 'OTP validation failed',
          reference,
        }, { status: 500 });
      }
    }

    // ===== ACTION: CHECK STATUS =====
    if (action === 'status') {
      if (!reference) {
        return NextResponse.json({ message: 'Reference is required' }, { status: 400 });
      }

      try {
        const response = await checkVFDPaymentStatus(reference);

        logger.info(`[VFD Payment] Status check for ${reference}:`, { status: response.status });

        return NextResponse.json({
          success: response.success,
          message: response.message,
          reference,
          status: response.status,
          vfdReference: response.vfdReference,
          data: response.data,
        }, { status: 200 });
      } catch (error) {
        logger.error('[VFD Payment] Status check error:', error);
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : 'Status check failed',
          reference,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: `Unknown action: ${action}. Use 'initiate', 'validate-otp', or 'status'`,
    }, { status: 400 });
  } catch (error) {
    logger.error('[VFD Payment] Unexpected error:', error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ message: 'Reference parameter is required' }, { status: 400 });
    }

    const response = await checkVFDPaymentStatus(reference);

    return NextResponse.json({
      success: response.success,
      reference,
      status: response.status,
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    logger.error('[VFD Payment] GET error:', error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Failed to fetch payment status',
    }, { status: 500 });
  }
}
