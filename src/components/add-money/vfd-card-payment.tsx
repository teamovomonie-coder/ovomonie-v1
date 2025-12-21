/**
 * Enhanced VFD Card Payment Component
 * Features:
 * 1. Card Tokenization & Saved Cards
 * 2. Smart Card Detection (auto-detect Visa/Mastercard/Verve)
 * 3. Real-time Card Validation (Luhn, expiry, CVV)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useVFDPayment } from '@/hooks/use-vfd-payment';
import { Loader2, AlertCircle, CreditCard, Trash2, Star, ChevronDown, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  getCardInfo,
  formatCardNumber,
  validateExpiry,
  validateCVV,
  maskCardNumber,
  formatExpiryDisplay,
  type CardBrand,
} from '@/lib/card-utils';

// Validation schema with real-time validation
const cardSchema = z.object({
  amount: z.number().min(1000, 'Minimum amount is ₦1,000'),
  cardNumber: z.string().min(13, 'Invalid card number').max(23).optional(),
  expiry: z.string().min(4, 'Invalid expiry').optional(),
  cvv: z.string().min(3, 'Invalid CVV').optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
  saveCard: z.boolean().optional(),
});

// Convert expiry to VFD format YYMM
function convertToYYMM(expiry: string): string {
  if (expiry.length === 4 && !expiry.includes('/')) {
    return expiry;
  }
  const [mm, yy] = expiry.split('/');
  return `${yy}${mm}`;
}

type CardFormData = z.infer<typeof cardSchema>;

interface SavedCard {
  id: string;
  card_brand: CardBrand;
  last_four: string;
  expiry_display: string;
  card_token: string;
  nickname: string;
  is_default: boolean;
}

interface VFDCardPaymentProps {
  onSuccess?: (amount: number) => void;
  onError?: (error: string) => void;
}

// Card brand icons/colors
const BRAND_CONFIG: Record<CardBrand, { bg: string; text: string; label: string }> = {
  visa: { bg: 'bg-blue-600', text: 'text-white', label: 'VISA' },
  mastercard: { bg: 'bg-orange-500', text: 'text-white', label: 'MC' },
  verve: { bg: 'bg-green-600', text: 'text-white', label: 'VERVE' },
  amex: { bg: 'bg-blue-800', text: 'text-white', label: 'AMEX' },
  discover: { bg: 'bg-orange-600', text: 'text-white', label: 'DISC' },
  unknown: { bg: 'bg-gray-400', text: 'text-white', label: 'CARD' },
};

export function VFDCardPayment({ onSuccess, onError }: VFDCardPaymentProps) {
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const vfdPayment = useVFDPayment();

  // State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [cardData, setCardData] = useState<CardFormData | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<SavedCard | null>(null);
  const [showSavedCardsDropdown, setShowSavedCardsDropdown] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState<string | null>(null);

  // Real-time validation state
  const [cardNumberValue, setCardNumberValue] = useState('');
  const [expiryValue, setExpiryValue] = useState('');
  const [cvvValue, setCvvValue] = useState('');

  // Card detection
  const cardInfo = useMemo(() => getCardInfo(cardNumberValue), [cardNumberValue]);
  const expiryValidation = useMemo(() => validateExpiry(expiryValue), [expiryValue]);
  const cvvValidation = useMemo(() => validateCVV(cvvValue, cardNumberValue), [cvvValue, cardNumberValue]);

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      amount: 0,
      cardNumber: '',
      expiry: '',
      cvv: '',
      pin: '',
      saveCard: false,
    },
  });

  // Fetch saved cards on mount
  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      setIsLoadingSavedCards(true);
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return;

      const res = await fetch('/api/cards/saved', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.ok) {
        setSavedCards(data.data || []);
        // Auto-select default card
        const defaultCard = data.data?.find((c: SavedCard) => c.is_default);
        if (defaultCard) {
          setSelectedSavedCard(defaultCard);
        }
      }
    } catch (error) {
      console.error('Failed to fetch saved cards:', error);
    } finally {
      setIsLoadingSavedCards(false);
    }
  };

  const deleteSavedCard = async (cardId: string) => {
    try {
      setIsDeletingCard(cardId);
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return;

      const res = await fetch(`/api/cards/saved?id=${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.ok) {
        setSavedCards(prev => prev.filter(c => c.id !== cardId));
        if (selectedSavedCard?.id === cardId) {
          setSelectedSavedCard(null);
        }
        toast({ title: 'Card removed', description: 'Saved card has been deleted' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete card', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete card', variant: 'destructive' });
    } finally {
      setIsDeletingCard(null);
    }
  };

  // Format card number as user types
  const handleCardNumberChange = (value: string, onChange: (value: string) => void) => {
    const formatted = formatCardNumber(value);
    setCardNumberValue(formatted);
    onChange(formatted);
  };

  // Format expiry as user types (auto-insert / for MM/YY, or accept YYMM)
  const handleExpiryChange = (value: string, onChange: (value: string) => void) => {
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 4 digits
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4);
    }
    
    // Only auto-insert slash if it looks like MM/YY format
    // (first two digits are 01-12 and user is typing 3rd digit)
    if (cleaned.length === 3 && !value.includes('/')) {
      const firstTwo = parseInt(cleaned.slice(0, 2), 10);
      if (firstTwo >= 1 && firstTwo <= 12) {
        cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      }
    } else if (cleaned.length === 4 && !value.includes('/')) {
      // Check if it's MM/YY format
      const firstTwo = parseInt(cleaned.slice(0, 2), 10);
      if (firstTwo >= 1 && firstTwo <= 12) {
        cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      }
      // Otherwise keep as YYMM format (like 5003)
    }
    
    setExpiryValue(cleaned);
    onChange(cleaned);
  };

    const handlePaymentSuccess = useCallback(async (amount: number, shouldSaveCard?: boolean) => {
      // Force fetch updated balance from server
      const token = localStorage.getItem('ovo-auth-token');
      if (token) {
        const fetchBalance = async () => {
          try {
            const res = await fetch('/api/wallet/balance', {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store'
            });
            const data = await res.json();
            const newBal = data.balanceInKobo || data.data?.balance || 0;
            console.log('Success callback - balance:', newBal);
            updateBalance(newBal);
            return true;
          } catch (err) {
            console.error('Failed to fetch balance:', err);
            return false;
          }
        };
        
        await fetchBalance();
        setTimeout(fetchBalance, 2000);
        setTimeout(fetchBalance, 5000);
      }

      addNotification({
        title: 'Wallet Funded',
        description: `You successfully added ₦${amount.toLocaleString()} to your wallet via card.`,
        category: 'transaction',
      });

      toast({ title: 'Success', description: 'Payment completed successfully' });

      onSuccess?.(amount);
      vfdPayment.resetState();
      form.reset();
      setCardData(null);
      setOtp('');
      setPaymentReference(null);
      setCardNumberValue('');
      setExpiryValue('');
      setCvvValue('');
      setSelectedSavedCard(null);
    }, [addNotification, toast, onSuccess, vfdPayment, form, updateBalance]);

    // Poll payment status after 3D Secure redirect
  const pollPaymentStatus = useCallback(async (reference: string, amount: number) => {
    setIsPolling(true);
    const token = localStorage.getItem('ovo-auth-token');
    const maxAttempts = 30;
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 10000));
      
      try {
        const res = await fetch(`/api/vfd/cards/status?reference=${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (data.ok && data.data?.status === '00') {
          setIsPolling(false);
          if (data.newBalanceInKobo) {
            updateBalance(data.newBalanceInKobo);
          }
          handlePaymentSuccess(amount, cardData?.saveCard);
          return;
        } else if (data.data?.status && data.data.status !== '00' && data.data.status !== 'pending') {
          setIsPolling(false);
          setProcessingError(data.data?.message || 'Payment failed');
          return;
        }
      } catch (err) {
        // Continue polling on error
      }
    }
    
    setIsPolling(false);
    toast({
      title: 'Payment Status Unknown',
      description: 'Please check your transaction history for the payment status.',
      variant: 'destructive',
    });
  }, [cardData, toast, handlePaymentSuccess]);

  const onSubmit = async (data: CardFormData) => {
    // Validate card if entering new card
    if (!selectedSavedCard) {
      if (!cardNumberValue) {
        toast({
          title: 'Card Number Required',
          description: 'Please enter your card number',
          variant: 'destructive',
        });
        return;
      }

      if (!cardInfo.isValid && cardInfo.brand !== 'unknown') {
        toast({
          title: 'Invalid Card Number',
          description: 'Please check your card number',
          variant: 'destructive',
        });
        return;
      }

      if (!expiryValidation.isValid) {
        toast({
          title: 'Invalid Expiry',
          description: expiryValidation.message,
          variant: 'destructive',
        });
        return;
      }

      if (!cvvValidation.isValid) {
        toast({
          title: 'Invalid CVV',
          description: cvvValidation.message,
          variant: 'destructive',
        });
        return;
      }
    }

    setCardData({ ...data, cardNumber: cardNumberValue, expiry: expiryValue, cvv: cvvValue });
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async (inputPin?: string) => {
    if (!cardData) {
      toast({ title: 'Error', description: 'Card data is missing', variant: 'destructive' });
      return;
    }

    if (!inputPin) {
      toast({ title: 'Error', description: 'Please enter your authorization PIN', variant: 'destructive' });
      return;
    }

    setIsPinModalOpen(false);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Please login to continue', variant: 'destructive' });
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);

      // Verify account PIN
      const pinVerifyRes = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin: inputPin }),
      });

      const pinVerifyData = await pinVerifyRes.json();
      
      if (!pinVerifyData.success) {
        setIsProcessing(false);
        toast({ title: 'Error', description: 'Incorrect authorization PIN', variant: 'destructive' });
        return;
      }

      const reference = `ovopay-${Date.now()}`;
      setPaymentReference(reference);

      // Build request body based on saved card or new card
      let requestBody: Record<string, unknown>;
      
      if (selectedSavedCard) {
        // Use saved card token
        requestBody = {
          cardToken: selectedSavedCard.card_token,
          amount: cardData.amount,
          currency: 'NGN',
          reference,
          useExistingCard: true,
          cardPin: cardData.pin,
        };
      } else {
        // New card
        const expiryYYMM = convertToYYMM(cardData.expiry || '');
        requestBody = {
          cardNumber: (cardData.cardNumber || '').replace(/\s+/g, ''),
          expiryDate: expiryYYMM,
          cvv: cardData.cvv,
          cardPin: cardData.pin,
          amount: cardData.amount,
          currency: 'NGN',
          reference,
          shouldTokenize: cardData.saveCard,
        };
      }

      const res = await fetch('/api/vfd/cards/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (!data.ok) {
        setProcessingError(data.message || 'Payment initiation failed');
        onError?.(data.message || 'Payment failed');
        return;
      }

      const responseData = data.data?.data || data.data;
      
      // Handle 3D Secure redirect
      if (responseData?.redirectHtml) {
        window.open(responseData.redirectHtml, '_blank', 'width=500,height=600');
        toast({
          title: 'Complete Authentication',
          description: 'Please complete the card authentication in the opened window.',
        });
        pollPaymentStatus(reference, cardData.amount);
        return;
      }
      
      // Handle OTP required
      if (responseData?.code === '01' || 
          responseData?.narration?.toLowerCase().includes('otp') ||
          data.data?.requiresOTP || 
          data.data?.status === 'pending_otp') {
        setIsOTPModalOpen(true);
        toast({
          title: 'OTP Required',
          description: 'Please enter the OTP sent to your phone.',
        });
      } else if (responseData?.code === '00' || data.data?.status === 'success') {
        // Save card if tokenization was successful
        if (cardData.saveCard && data.data?.cardToken) {
          await saveCard(data.data.cardToken);
        }
        handlePaymentSuccess(cardData.amount, false);
      } else {
        const msg = responseData?.narration || responseData?.message || data.data?.message || 'Payment processing';
        toast({ title: 'Processing', description: msg });
      }
    } catch (err) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'Payment failed';
      setProcessingError(message);
      onError?.(message);
    }
  };

  const saveCard = async (cardToken: string) => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token || !cardData) return;

      const res = await fetch('/api/cards/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardToken,
          lastFour: (cardData.cardNumber || '').replace(/\s+/g, '').slice(-4),
          cardBrand: cardInfo.brand,
          expiryDisplay: formatExpiryDisplay(cardData.expiry || ''),
          setAsDefault: savedCards.length === 0,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Card Saved', description: 'Your card has been saved for future payments.' });
        fetchSavedCards();
      }
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otp || otp.length < 4) {
      toast({ title: 'Error', description: 'Please enter a valid OTP', variant: 'destructive' });
      return;
    }

    if (!paymentReference) {
      toast({ title: 'Error', description: 'Payment reference is missing', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Please login to continue', variant: 'destructive' });
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);

      // Call both VFD and complete-payment in parallel
      const [vfdRes, completeRes] = await Promise.all([
        fetch('/api/vfd/cards/validate-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference: paymentReference, otp }),
        }),
        fetch('/api/vfd/cards/complete-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference: paymentReference }),
        })
      ]);
      
      const completeData = await completeRes.json();
      setIsProcessing(false);
      
      if (completeData.ok) {
        setIsOTPModalOpen(false);
        if (completeData.newBalanceInKobo) {
          updateBalance(completeData.newBalanceInKobo);
        }
        if (cardData) {
          handlePaymentSuccess(cardData.amount, false);
        }
        return;
      }
      
      if (!completeData.ok) {
        
        // If timeout or processing, payment likely succeeded - refresh balance
        if ((completeData.message?.includes('timed out') || completeData.message?.includes('processing')) && cardData) {
          setIsOTPModalOpen(false);
          setIsProcessing(false);
          
          // Refresh balance from server with retries
          const refreshBalance = async (attempt = 1): Promise<boolean> => {
            try {
              const balRes = await fetch('/api/wallet/balance', {
                headers: { Authorization: `Bearer ${token}` },
              });
              const balData = await balRes.json();
              if (balData.ok || balData.success) {
                const newBal = balData.balanceInKobo || balData.data?.balance;
                updateBalance(newBal);
                return true;
              }
              return false;
            } catch (err) {
              console.error(`Failed to refresh balance (attempt ${attempt}):`, err);
              return false;
            }
          };
          
          // Refresh immediately
          await refreshBalance(1);
          
          // Retry up to 3 times with delays
          for (let i = 2; i <= 4; i++) {
            setTimeout(async () => {
              const success = await refreshBalance(i);
              if (success && i === 4) {
                // Final refresh successful
                handlePaymentSuccess(cardData.amount, false);
              }
            }, 2000 * i); // 4s, 6s, 8s
          }
          
          toast({ 
            title: 'Payment Processing', 
            description: 'Your payment is being processed. Balance will update shortly.',
            duration: 6000,
          });
          
          return;
        } else if (completeData.message?.includes('being processed')) {
          // Payment is processing, treat as success
          setIsOTPModalOpen(false);
          setIsProcessing(false);
          
          const refreshBalance = async () => {
            try {
              const balRes = await fetch('/api/wallet/balance', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
              });
              const balData = await balRes.json();
              const newBal = balData.balanceInKobo || balData.data?.balance || 0;
              console.log('Processing - refreshed balance:', newBal);
              updateBalance(newBal);
            } catch (err) {
              console.error('Failed to refresh balance:', err);
            }
          };
          
          await refreshBalance();
          setTimeout(refreshBalance, 2000);
          setTimeout(refreshBalance, 5000);
          setTimeout(refreshBalance, 8000);
          
          if (cardData) {
            handlePaymentSuccess(cardData.amount, false);
          }
          return;
          } else {
          toast({ title: 'Error', description: completeData.message || 'OTP validation failed', variant: 'destructive' });
        }
        return;
      }

      setIsOTPModalOpen(false);
      
      // Force balance refresh from server
      const forceRefreshBalance = async () => {
        try {
          const balRes = await fetch('/api/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          const balData = await balRes.json();
          const newBal = balData.balanceInKobo || balData.data?.balance || 0;
          console.log('Balance refreshed:', newBal);
          updateBalance(newBal);
          window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBal } }));
          return newBal;
        } catch (err) {
          console.error('Balance refresh failed:', err);
          return null;
        }
      };
      
      // Update balance immediately if provided
      if (completeData.newBalanceInKobo) {
        console.log('Updating balance from response:', completeData.newBalanceInKobo);
        updateBalance(completeData.newBalanceInKobo);
      }
      
      // Always force refresh from server as backup
      await forceRefreshBalance();
      setTimeout(forceRefreshBalance, 2000);
      setTimeout(forceRefreshBalance, 5000);
      
      // Save card if tokenization was requested
      if (cardData?.saveCard && completeData.data?.cardToken) {
        await saveCard(completeData.data.cardToken);
      }
      
      if (cardData) {
        handlePaymentSuccess(cardData.amount, false);
      }
    } catch (err) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'OTP validation failed';
      setProcessingError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };



  const selectSavedCard = (card: SavedCard | null) => {
    setSelectedSavedCard(card);
    setShowSavedCardsDropdown(false);
    
    if (card) {
      // Clear new card fields when selecting saved card
      form.setValue('cardNumber', '');
      form.setValue('expiry', '');
      form.setValue('cvv', '');
      setCardNumberValue('');
      setExpiryValue('');
      setCvvValue('');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {processingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}

          {isPolling && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Waiting for authentication to complete...</AlertDescription>
            </Alert>
          )}

          {/* Amount Field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    {...field}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    disabled={isProcessing || vfdPayment.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Saved Cards Dropdown */}
          {savedCards.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Payment Method</label>
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background",
                    "hover:bg-accent transition-colors"
                  )}
                  onClick={() => setShowSavedCardsDropdown(!showSavedCardsDropdown)}
                  disabled={isProcessing}
                >
                  {selectedSavedCard ? (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-bold rounded",
                        BRAND_CONFIG[selectedSavedCard.card_brand].bg,
                        BRAND_CONFIG[selectedSavedCard.card_brand].text
                      )}>
                        {BRAND_CONFIG[selectedSavedCard.card_brand].label}
                      </span>
                      <span className="text-sm">•••• {selectedSavedCard.last_four}</span>
                      {selectedSavedCard.is_default && (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Enter new card</span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showSavedCardsDropdown && "rotate-180")} />
                </button>

                {showSavedCardsDropdown && (
                  <div className="absolute z-10 w-full mt-1 border rounded-md bg-background shadow-lg max-h-60 overflow-auto">
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors",
                        !selectedSavedCard && "bg-accent"
                      )}
                      onClick={() => selectSavedCard(null)}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Enter new card</span>
                      {!selectedSavedCard && <Check className="h-4 w-4 ml-auto text-green-500" />}
                    </button>
                    
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors",
                          selectedSavedCard?.id === card.id && "bg-accent"
                        )}
                      >
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1"
                          onClick={() => selectSavedCard(card)}
                        >
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-bold rounded",
                            BRAND_CONFIG[card.card_brand].bg,
                            BRAND_CONFIG[card.card_brand].text
                          )}>
                            {BRAND_CONFIG[card.card_brand].label}
                          </span>
                          <span className="text-sm">•••• {card.last_four}</span>
                          {card.expiry_display && (
                            <span className="text-xs text-muted-foreground">{card.expiry_display}</span>
                          )}
                          {card.is_default && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                          {selectedSavedCard?.id === card.id && (
                            <Check className="h-4 w-4 ml-auto text-green-500" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="p-1 hover:bg-destructive/20 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedCard(card.id);
                          }}
                          disabled={isDeletingCard === card.id}
                        >
                          {isDeletingCard === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Card Form - Only show if no saved card selected */}
          {!selectedSavedCard && (
            <>
              {/* Card Number with Brand Detection */}
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Card Number</span>
                      {cardNumberValue && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-bold rounded transition-all",
                          BRAND_CONFIG[cardInfo.brand].bg,
                          BRAND_CONFIG[cardInfo.brand].text
                        )}>
                          {BRAND_CONFIG[cardInfo.brand].label}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="0000 0000 0000 0000"
                          value={cardNumberValue}
                          onChange={(e) => handleCardNumberChange(e.target.value, field.onChange)}
                          disabled={isProcessing || vfdPayment.isLoading}
                          maxLength={23}
                          className={cn(
                            "pr-10",
                            cardNumberValue && !cardInfo.isPotentiallyValid && "border-destructive",
                            cardNumberValue && cardInfo.isValid && "border-green-500"
                          )}
                        />
                        {cardNumberValue && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {cardInfo.isValid ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : !cardInfo.isPotentiallyValid ? (
                              <X className="h-4 w-4 text-destructive" />
                            ) : null}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    {cardNumberValue && !cardInfo.isPotentiallyValid && (
                      <p className="text-xs text-destructive">Invalid card number</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry with Validation */}
                <FormField
                  control={form.control}
                  name="expiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="MM/YY or YYMM"
                            value={expiryValue}
                            onChange={(e) => handleExpiryChange(e.target.value, field.onChange)}
                            disabled={isProcessing || vfdPayment.isLoading}
                            maxLength={7}
                            className={cn(
                              "pr-10",
                              expiryValue && !expiryValidation.isValid && "border-destructive",
                              expiryValue && expiryValidation.isValid && "border-green-500"
                            )}
                          />
                          {expiryValue && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              {expiryValidation.isValid ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      {expiryValue && !expiryValidation.isValid && (
                        <p className="text-xs text-destructive">{expiryValidation.message}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CVV with Validation */}
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder={cardInfo.cvvLength === 4 ? '0000' : '000'}
                            value={cvvValue}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, cardInfo.cvvLength);
                              setCvvValue(v);
                              field.onChange(v);
                            }}
                            disabled={isProcessing || vfdPayment.isLoading}
                            maxLength={cardInfo.cvvLength}
                            className={cn(
                              "pr-10",
                              cvvValue && !cvvValidation.isValid && cvvValue.length === cardInfo.cvvLength && "border-destructive",
                              cvvValue && cvvValidation.isValid && "border-green-500"
                            )}
                          />
                          {cvvValue && cvvValue.length === cardInfo.cvvLength && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              {cvvValidation.isValid ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {cardInfo.cvvLength} digits on {cardInfo.brand === 'amex' ? 'front' : 'back'} of card
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Card PIN */}
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••"
                        maxLength={4}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        disabled={isProcessing || vfdPayment.isLoading}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">4-digit ATM PIN</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Save Card Checkbox */}
              <FormField
                control={form.control}
                name="saveCard"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isProcessing || vfdPayment.isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Save this card for future payments</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Your card details are securely stored and encrypted
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Selected Saved Card - Show PIN input */}
          {selectedSavedCard && (
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card PIN</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      disabled={isProcessing || vfdPayment.isLoading}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Enter your 4-digit card PIN</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing || vfdPayment.isLoading || isPolling}
          >
            {isProcessing || vfdPayment.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isPolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for authentication...
              </>
            ) : (
              'Fund Wallet'
            )}
          </Button>
        </form>
      </Form>

      {/* PIN Modal */}
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing || vfdPayment.isLoading}
        title="Authorize Card Deposit"
        description="Enter your 4-digit Ovomonie PIN to authorize this card deposit"
        successUrl={null}
      />

      {/* OTP Modal */}
      <Dialog open={isOTPModalOpen} onOpenChange={setIsOTPModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              We've sent a One-Time Password to your registered phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">One-Time Password</label>
              <Input
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isProcessing}
                className="mt-2 text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleOTPSubmit}
              className="w-full"
              disabled={isProcessing || otp.length < 4}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsOTPModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VFDCardPayment;
