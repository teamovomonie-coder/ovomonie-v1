"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface VFDCardPaymentProps {
  onSuccess?: (amount: number) => void;
  onError?: (err: string) => void;
}

// Temporary simplified placeholder for VFD card payment component
// Purpose: unblock production builds. Replace with full implementation later.
export function VFDCardPayment(_props: VFDCardPaymentProps) {
  return (
    <div className="p-4">
      <p className="mb-2 text-sm text-muted-foreground">Card payment temporarily disabled for build.</p>
      <Button onClick={() => alert('Card payment temporarily unavailable')} className="w-full">
        Fund Wallet (disabled)
      </Button>
    </div>
  );
}

export default VFDCardPayment;
/**
 * Enhanced VFD Card Payment Component
 * Features:
 * 1. Card Tokenization & Saved Cards
 * 2. Smart Card Detection (auto-detect Visa/Mastercard/Verve)
 * 3. Real-time Card Validation (Luhn, expiry, CVV)
 */

'use client';
// Keep the simplified placeholder only to avoid previous large broken component causing parse errors
export function VFDCardPayment(_props: VFDCardPaymentProps) {
  return (
    <div className="p-4">
      <p className="mb-2 text-sm text-muted-foreground">Card payment temporarily disabled for build.</p>
      <Button onClick={() => alert('Card payment temporarily unavailable')} className="w-full">
        Fund Wallet (disabled)
      </Button>
    </div>
  );
}

export default VFDCardPayment;
import { useNotifications } from '@/context/notification-context';

import { useVFDPayment } from '@/hooks/use-vfd-payment';
