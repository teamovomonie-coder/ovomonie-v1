/**
 * VFD Payment Hooks
 * React hooks for handling VFD payments in components
 */

'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { PaymentCategory } from '@/lib/vfd-processor';

export interface PaymentInitRequest {
  amount: number;
  reference: string;
  category: PaymentCategory;
  description: string;
  metadata?: Record<string, any>;
  // Card details
  cardNumber?: string;
  cardPin?: string;
  cvv?: string;
  expiryDate?: string; // YYMM format for VFD
  // Bank details
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface PaymentState {
  isLoading: boolean;
  isValidatingOTP: boolean;
  error: string | null;
  reference: string | null;
  requiresOTP: boolean;
  otpReference: string | null;
  paymentStatus: 'idle' | 'initiated' | 'otp-pending' | 'completed' | 'failed';
}

/**
 * Hook for initiating VFD payments
 */
export function useVFDPayment() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    isValidatingOTP: false,
    error: null,
    reference: null,
    requiresOTP: false,
    otpReference: null,
    paymentStatus: 'idle',
  });

  const initiatePayment = useCallback(
    async (request: PaymentInitRequest) => {
      if (!user?.userId) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('/api/payments/vfd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'initiate',
            ...request,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Payment initiation failed');
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          reference: data.reference,
          requiresOTP: data.requiresOTP || false,
          otpReference: data.vfdReference,
          paymentStatus: data.requiresOTP ? 'otp-pending' : 'initiated',
        }));

        toast({
          title: 'Success',
          description: data.requiresOTP
            ? 'Payment initiated. Please enter OTP to confirm.'
            : 'Payment initiated successfully',
        });

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          paymentStatus: 'failed',
        }));

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return false;
      }
    },
    [user?.userId, toast]
  );

  const validateOTP = useCallback(
    async (otp: string) => {
      if (!state.otpReference) {
        toast({
          title: 'Error',
          description: 'No pending payment for OTP validation',
          variant: 'destructive',
        });
        return false;
      }

      setState((prev) => ({
        ...prev,
        isValidatingOTP: true,
        error: null,
      }));

      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('/api/payments/vfd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'validate-otp',
            reference: state.otpReference,
            otp,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'OTP validation failed');
        }

        setState((prev) => ({
          ...prev,
          isValidatingOTP: false,
          paymentStatus: 'completed',
          requiresOTP: false,
        }));

        toast({
          title: 'Success',
          description: 'Payment completed successfully',
        });

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'OTP validation failed';
        setState((prev) => ({
          ...prev,
          isValidatingOTP: false,
          error: errorMessage,
          paymentStatus: 'failed',
        }));

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return false;
      }
    },
    [state.otpReference, toast]
  );

  const checkStatus = useCallback(
    async (reference: string) => {
      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`/api/payments/vfd?reference=${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Status check failed');
        }

        return {
          status: data.status,
          success: data.success,
          message: data.message,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Status check failed';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      }
    },
    [toast]
  );

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isValidatingOTP: false,
      error: null,
      reference: null,
      requiresOTP: false,
      otpReference: null,
      paymentStatus: 'idle',
    });
  }, []);

  return {
    ...state,
    initiatePayment,
    validateOTP,
    checkStatus,
    resetState,
  };
}

/**
 * Hook for specific payment types
 */
export function useCardPayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, cardDetails: {
      cardNumber: string;
      cardPin: string;
      cvv: string;
      expiry: string;
    }) => {
      const reference = `card_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'card_funding',
        description: 'Card funding',
        ...cardDetails,
      });
    },
    [vfdPayment]
  );

  return {
    ...vfdPayment,
    pay,
  };
}

export function useBillPayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, billDetails: {
      billType: string;
      provider: string;
      billNumber: string;
      metadata?: Record<string, any>;
    }) => {
      const reference = `bill_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'bill_payment',
        description: `${billDetails.billType} payment - ${billDetails.provider}`,
        metadata: billDetails.metadata,
      });
    },
    [vfdPayment]
  );

  return {
    ...vfdPayment,
    pay,
  };
}

export function useAirtimePayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, phoneNumber: string, provider: string) => {
      const reference = `airtime_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'airtime',
        description: `Airtime top-up - ${provider}`,
        metadata: {
          phoneNumber,
          provider,
        },
      });
    },
    [vfdPayment]
  );

  return {
    ...vfdPayment,
    pay,
  };
}

export function useBettingPayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, bettingDetails: {
      bettingProvider: string;
      oddsId?: string;
      metadata?: Record<string, any>;
    }) => {
      const reference = `betting_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'betting',
        description: `Betting deposit - ${bettingDetails.bettingProvider}`,
        metadata: bettingDetails.metadata,
      });
    },
    [vfdPayment]
  );

  return {
    ...vfdPayment,
    pay,
  };
}
