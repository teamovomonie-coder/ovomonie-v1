"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';

interface VFDCardPaymentProps {
  onSuccess?: (amount: number, reference: string) => void;
  onError?: (err: string) => void;
}

type CardType = 'visa' | 'mastercard' | 'verve' | 'unknown';

export function VFDCardPayment({ onSuccess, onError }: VFDCardPaymentProps) {
  const { toast } = useToast();
  const { syncBalance, updateBalance } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [cardType, setCardType] = useState<CardType>('unknown');
  
  const [formData, setFormData] = useState({
    amount: '',
    cardNumber: '',
    cardPin: '',
    cvv: '',
    expiry: '',
  });

  const detectCardType = (number: string): CardType => {
    const cleaned = number.replace(/\s/g, '');
    // Verve cards - Nigerian cards (506099, 507850, 507865-507869, 650002-650027, 5061)
    if (/^(506099|507850|50786[5-9]|650002|650010|650011|65002[0-7]|5061)/.test(cleaned)) return 'verve';
    // Visa cards - start with 4
    if (/^4/.test(cleaned)) return 'visa';
    // Mastercard - start with 51-55 or 2221-2720
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleaned)) return 'mastercard';
    return 'unknown';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '');
      if (cleaned.length <= 19 && /^\d*$/.test(cleaned)) {
        setFormData(prev => ({ ...prev, [field]: cleaned }));
        setCardType(detectCardType(cleaned));
      }
    } else if (field === 'cvv') {
      if (value.length <= 3 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else if (field === 'cardPin') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else if (field === 'expiry') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCardNumberPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = pastedText.replace(/\D/g, '');
    if (cleaned.length <= 19) {
      setFormData(prev => ({ ...prev, cardNumber: cleaned }));
      setCardType(detectCardType(cleaned));
    }
  };

  const getCardTypeBadge = () => {
    if (cardType === 'unknown' || !formData.cardNumber) return null;
    
    const colors = {
      visa: 'bg-blue-500',
      mastercard: 'bg-orange-500',
      verve: 'bg-green-500',
    };

    return (
      <Badge className={`${colors[cardType]} text-white`}>
        {cardType.toUpperCase()}
      </Badge>
    );
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return false;
    }
    if (formData.cardNumber.length < 16 || formData.cardNumber.length > 19) {
      toast({ title: 'Error', description: 'Card number must be 16-19 digits', variant: 'destructive' });
      return false;
    }
    if (formData.cardPin.length !== 4) {
      toast({ title: 'Error', description: 'Card PIN must be 4 digits', variant: 'destructive' });
      return false;
    }
    if (formData.cvv.length !== 3) {
      toast({ title: 'Error', description: 'CVV must be 3 digits', variant: 'destructive' });
      return false;
    }
    if (formData.expiry.length !== 4) {
      toast({ title: 'Error', description: 'Expiry must be 4 digits (YYMM)', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      const reference = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('/api/funding/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          reference,
          cardNumber: formData.cardNumber,
          cardPin: formData.cardPin,
          cvv2: formData.cvv,
          expiryDate: formData.expiry,
          shouldTokenize: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      if (data.requiresOTP) {
        setRequiresOTP(true);
        setPaymentReference(reference);
        toast({
          title: 'OTP Required',
          description: 'Please enter the OTP sent to your phone',
        });
      } else {
        // Sync balance after successful payment
        await syncBalance();
        toast({
          title: 'Success',
          description: 'Payment completed successfully',
        });
        onSuccess?.(parseFloat(formData.amount), reference);
        resetForm();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/funding/card/validate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: paymentReference,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP validation failed');
      }

      // Sync balance after successful OTP validation
      await syncBalance();
      toast({
        title: 'Success',
        description: 'Payment completed successfully',
      });
      onSuccess?.(parseFloat(formData.amount), paymentReference!);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP validation failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      cardNumber: '',
      cardPin: '',
      cvv: '',
      expiry: '',
    });
    setOtp('');
    setRequiresOTP(false);
    setPaymentReference(null);
    setCardType('unknown');
  };

  if (requiresOTP) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enter OTP</CardTitle>
          <CardDescription>Please enter the OTP sent to your phone</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Payment
        </CardTitle>
        <CardDescription>Fund your wallet using your debit card</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount"
              disabled={isLoading}
              min="100"
              step="0.01"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              {getCardTypeBadge()}
            </div>
            <Input
              id="cardNumber"
              type="text"
              inputMode="numeric"
              value={formatCardNumber(formData.cardNumber)}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              onPaste={handleCardNumberPaste}
              placeholder="1234 5678 9012 3456"
              disabled={isLoading}
              maxLength={23}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry Date (YYMM)</Label>
              <Input
                id="expiry"
                type="text"
                inputMode="numeric"
                value={formData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                placeholder="2512"
                disabled={isLoading}
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                inputMode="numeric"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder="123"
                disabled={isLoading}
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cardPin" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Card PIN
            </Label>
            <Input
              id="cardPin"
              type="password"
              inputMode="numeric"
              value={formData.cardPin}
              onChange={(e) => handleInputChange('cardPin', e.target.value)}
              placeholder="****"
              disabled={isLoading}
              maxLength={4}
            />
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your card details are encrypted and secure. We never store your card PIN.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fund Wallet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default VFDCardPayment;
