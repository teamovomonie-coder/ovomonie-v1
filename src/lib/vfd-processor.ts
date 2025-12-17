/**
 * VFD Payment Processor
 * Unified interface for handling all payment transactions through VFD APIs
 */

import vfdAPI from './vfd';
import { getDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export type PaymentCategory = 
  | 'card_funding'
  | 'bill_payment'
  | 'airtime'
  | 'betting'
  | 'loan_payment'
  | 'transfer'
  | 'shopping'
  | 'food_delivery'
  | 'ride'
  | 'flight'
  | 'hotel';

export interface VFDPaymentRequest {
  userId: string;
  amount: number;
  reference: string;
  category: PaymentCategory;
  description: string;
  metadata?: Record<string, any>;
  // For card payments
  cardNumber?: string;
  cardPin?: string;
  cvv2?: string;
  expiryDate?: string;
  // For bank transfers
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface VFDPaymentResponse {
  success: boolean;
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  message: string;
  vfdReference?: string;
  requiresOTP?: boolean;
  otpReference?: string;
  data?: Record<string, any>;
}

/**
 * Initialize a payment through VFD
 */
export async function initiateVFDPayment(
  request: VFDPaymentRequest
): Promise<VFDPaymentResponse> {
  try {
    const { userId, amount, reference, category, description, cardNumber, cardPin, cvv2, expiryDate } = request;

    // Log transaction initiation
    console.log(`[VFD] Initiating ${category} payment for user ${userId}:`, { amount, reference });

    // For card payments, use VFD card API
    if (category === 'card_funding' && cardNumber && cardPin && cvv2 && expiryDate) {
      const vfdResponse = await vfdAPI.initiateCardPayment({
        amount,
        reference,
        cardNumber,
        cardPin,
        cvv2,
        expiryDate,
        shouldTokenize: true,
      });

      console.log('[VFD] Card payment response:', vfdResponse);

      if (!vfdResponse.ok) {
        return {
          success: false,
          reference,
          status: 'failed',
          message: vfdResponse.data?.message || 'Card payment initiation failed',
          data: vfdResponse.data,
        };
      }

      // Check response code for OTP or redirect requirement
      // Code 01 = OTP required, Code 03 = Redirect required
      const responseCode = vfdResponse.data?.data?.code || vfdResponse.data?.code;
      const requiresOTP = responseCode === '01' || vfdResponse.data?.data?.narration?.toLowerCase().includes('otp');
      const requiresRedirect = responseCode === '03' || !!vfdResponse.data?.data?.redirectHtml;
      
      if (requiresRedirect) {
        return {
          success: false,
          reference,
          status: 'failed',
          message: 'This card requires 3D Secure authentication. Please use a different card.',
          data: vfdResponse.data,
        };
      }

      return {
        success: true,
        reference,
        status: requiresOTP ? 'processing' : 'pending',
        message: requiresOTP ? 'OTP required for confirmation' : 'Card payment initiated',
        vfdReference: reference,
        requiresOTP,
        otpReference: reference,
        data: vfdResponse.data,
      };
    }

    // For other payment types, create a pending transaction
    // that can be processed through other payment gateways
    return {
      success: true,
      reference,
      status: 'pending',
      message: `${category} payment pending. Please complete payment.`,
      data: { category, description, amount },
    };
  } catch (error) {
    console.error(`[VFD] Payment initiation error for reference ${request.reference}:`, error);
    return {
      success: false,
      reference: request.reference,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Payment initiation failed',
    };
  }
}

/**
 * Validate OTP for card payments
 */
export async function validateVFDPaymentOTP(
  reference: string,
  otp: string
): Promise<VFDPaymentResponse> {
  try {
    console.log(`[VFD] Validating OTP for reference ${reference}`);

    const vfdResponse = await vfdAPI.validateOtp(otp, reference);

    if (!vfdResponse.ok) {
      return {
        success: false,
        reference,
        status: 'failed',
        message: vfdResponse.data?.message || 'OTP validation failed',
        data: vfdResponse.data,
      };
    }

    return {
      success: true,
      reference,
      status: 'completed',
      message: 'OTP validated successfully. Payment completed.',
      vfdReference: reference,
      data: vfdResponse.data,
    };
  } catch (error) {
    console.error(`[VFD] OTP validation error:`, error);
    return {
      success: false,
      reference,
      status: 'failed',
      message: error instanceof Error ? error.message : 'OTP validation failed',
    };
  }
}

/**
 * Check payment status
 */
export async function checkVFDPaymentStatus(reference: string): Promise<VFDPaymentResponse> {
  try {
    console.log(`[VFD] Checking payment status for reference ${reference}`);

    const vfdResponse = await vfdAPI.paymentDetails(reference);

    if (!vfdResponse.ok) {
      return {
        success: false,
        reference,
        status: 'failed',
        message: vfdResponse.data?.message || 'Failed to check payment status',
        data: vfdResponse.data,
      };
    }

    const paymentData = vfdResponse.data;
    let status: VFDPaymentResponse['status'] = 'pending';

    if (paymentData?.status?.toLowerCase().includes('success') || paymentData?.status?.toLowerCase().includes('completed')) {
      status = 'completed';
    } else if (paymentData?.status?.toLowerCase().includes('failed')) {
      status = 'failed';
    } else if (paymentData?.status?.toLowerCase().includes('processing')) {
      status = 'processing';
    }

    return {
      success: status === 'completed',
      reference,
      status,
      message: paymentData?.message || 'Payment status retrieved',
      vfdReference: paymentData?.reference || reference,
      data: paymentData,
    };
  } catch (error) {
    console.error(`[VFD] Status check error:`, error);
    return {
      success: false,
      reference,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Failed to check payment status',
    };
  }
}

/**
 * Log payment transaction to Firestore
 */
export async function logVFDTransaction(
  userId: string,
  paymentRequest: VFDPaymentRequest,
  paymentResponse: VFDPaymentResponse,
  transactionType: 'debit' | 'credit' = 'debit'
) {
  try {
    const db = await getDb();
    const txnDoc = db.collection('financialTransactions').doc();

    const txnData = {
      userId,
      reference: paymentRequest.reference,
      vfdReference: paymentResponse.vfdReference,
      type: transactionType,
      category: paymentRequest.category,
      amount: paymentRequest.amount,
      description: paymentRequest.description,
      status: paymentResponse.status,
      paymentGateway: 'VFD',
      metadata: {
        ...paymentRequest.metadata,
        vfdData: paymentResponse.data,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await txnDoc.set(txnData);
    console.log(`[VFD] Transaction logged for reference ${paymentRequest.reference}`);

    return txnDoc.id;
  } catch (error) {
    console.error(`[VFD] Error logging transaction:`, error);
    throw error;
  }
}

/**
 * Process a complete payment flow (initiate → validate OTP → confirm)
 */
export async function processVFDPayment(
  userId: string,
  paymentRequest: VFDPaymentRequest,
  otp?: string
): Promise<{
  success: boolean;
  message: string;
  paymentResponse: VFDPaymentResponse;
  requiresOTP: boolean;
}> {
  try {
    // Step 1: Initiate payment
    const initiateResponse = await initiateVFDPayment(paymentRequest);

    if (!initiateResponse.success) {
      return {
        success: false,
        message: initiateResponse.message,
        paymentResponse: initiateResponse,
        requiresOTP: false,
      };
    }

    // Step 2: If OTP is required but not provided, ask for it
    if (initiateResponse.requiresOTP && !otp) {
      return {
        success: false,
        message: 'OTP required. Please provide OTP to complete payment.',
        paymentResponse: initiateResponse,
        requiresOTP: true,
      };
    }

    // Step 3: Validate OTP if provided
    if (otp && initiateResponse.otpReference) {
      const validateResponse = await validateVFDPaymentOTP(initiateResponse.otpReference, otp);

      if (!validateResponse.success) {
        return {
          success: false,
          message: validateResponse.message,
          paymentResponse: validateResponse,
          requiresOTP: false,
        };
      }

      // Log successful transaction
      await logVFDTransaction(userId, paymentRequest, validateResponse, 'debit');

      return {
        success: true,
        message: 'Payment completed successfully',
        paymentResponse: validateResponse,
        requiresOTP: false,
      };
    }

    // Log transaction
    await logVFDTransaction(userId, paymentRequest, initiateResponse, 'debit');

    return {
      success: initiateResponse.status === 'completed',
      message: initiateResponse.message,
      paymentResponse: initiateResponse,
      requiresOTP: initiateResponse.requiresOTP || false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    console.error(`[VFD] Payment processing error:`, error);
    return {
      success: false,
      message: errorMessage,
      paymentResponse: {
        success: false,
        reference: paymentRequest.reference,
        status: 'failed',
        message: errorMessage,
      },
      requiresOTP: false,
    };
  }
}

const vfdProcessor = {
  initiateVFDPayment,
  validateVFDPaymentOTP,
  checkVFDPaymentStatus,
  logVFDTransaction,
  processVFDPayment,
};

export default vfdProcessor;
