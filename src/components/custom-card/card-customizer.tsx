
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, ArrowLeft, CheckCircle, Truck, Info, Loader2, Wallet, Sparkles, Copy, Eye, EyeOff, CreditCard, Zap, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateCardDesign } from '@/ai/client-safe';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { VirtualCardDisplay } from './virtual-card-display';
import type { VirtualCard } from './virtual-card-display';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

// UUID polyfill for environments without crypto.randomUUID
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Card Customization Data ---
const templates = {
  colors: [
    { name: 'Ovo Navy', value: 'bg-gradient-to-br from-primary to-blue-700' },
    { name: 'Midnight Blue', value: 'bg-gradient-to-br from-gray-900 to-blue-900' },
    { name: 'Sunset Orange', value: 'bg-gradient-to-br from-yellow-400 to-orange-600' },
    { name: 'Royal Purple', value: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
  ],
};

interface CardDesign {
  type: 'color' | 'pattern' | 'upload';
  value: string;
}

// --- Card Preview Component ---
const CardPreview = ({ design, name }: { design: CardDesign, name: string }) => {
  return (
    <div className="w-full max-w-sm aspect-[1.586] rounded-xl shadow-lg overflow-hidden bg-gray-800 relative select-none">
      {design.type === 'color' && <div className={cn("w-full h-full", design.value)} />}
      {(design.type === 'pattern' || design.type === 'upload') && (
        <Image src={design.value} alt="Card background" layout="fill" objectFit="cover" data-ai-hint="background pattern" />
      )}
      
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex justify-between items-start">
          <div className="w-12 h-10 bg-yellow-400/80 rounded-md border border-yellow-500/50 backdrop-blur-sm" data-protected="chip">
            <div className="w-1/2 h-full bg-yellow-300/50" />
          </div>
          <div className="flex items-center gap-2" data-protected="bank-logo">
            <Wallet className="w-7 h-7 text-white/90" />
            <h3 className="text-white/90 font-bold text-lg">OVOMONIE</h3>
          </div>
        </div>

        <div>
          <p className="text-white font-mono text-xl sm:text-2xl tracking-widest text-shadow">
            4000 1234 5678 9010
          </p>
          <div className="flex justify-between items-end mt-2">
            <p className="text-white font-semibold uppercase text-sm sm:text-base text-shadow w-2/3 truncate">
              {name || 'YOUR NAME HERE'}
            </p>
            <p className="text-white font-bold text-lg sm:text-xl italic text-shadow">VISA</p>
          </div>
        </div>
      </div>
      <style jsx>{`
        .text-shadow {
          text-shadow: 0px 1px 3px rgba(0,0,0,0.7);
        }
      `}</style>
    </div>
  );
};

// --- Zod Schemas ---
const cardDetailsSchema = z.object({
  nameOnCard: z.string().min(3, "Name is too short").max(22, "Name is too long"),
  design: z.object({
    type: z.enum(['color', 'pattern', 'upload']),
    value: z.string().min(1, "A design must be selected."),
  }),
  imageTheme: z.string().optional(),
});

const shippingSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  address: z.string().min(10, "Please enter a full address."),
  city: z.string().min(3, "City is required."),
  state: z.string().min(2, "State is required."),
});

type CardDetailsForm = z.infer<typeof cardDetailsSchema>;
type ShippingForm = z.infer<typeof shippingSchema>;
type View = 'customize' | 'review' | 'success' | 'virtual-card';

// --- Main Customizer Component ---
export function CardCustomizer() {
  const [view, setView] = useState<View>('customize');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const { balance, updateBalance, logout, user } = useAuth();
  const { addNotification } = useNotifications();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Virtual Card State
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [isFetchingVirtualCards, setIsFetchingVirtualCards] = useState(false);
  const [showVirtualCardNumbers, setShowVirtualCardNumbers] = useState<Set<string>>(new Set());
  const [isActivatingCard, setIsActivatingCard] = useState(false);
  const [virtualCardApiError, setVirtualCardApiError] = useState<string | null>(null);


  const cardDetailsForm = useForm<CardDetailsForm>({
    resolver: zodResolver(cardDetailsSchema),
    defaultValues: {
      nameOnCard: "",
      design: { type: 'color', value: templates.colors[0].value },
      imageTheme: '',
    },
  });
  
  const shippingForm = useForm<ShippingForm>({
      resolver: zodResolver(shippingSchema),
      defaultValues: { fullName: "", address: "", city: "", state: "" },
  });

  const cardDesign = cardDetailsForm.watch('design');
  const nameOnCard = cardDetailsForm.watch('nameOnCard');

  const handleGenerateImage = async () => {
    const theme = cardDetailsForm.getValues('imageTheme');
    if (!theme) {
        toast({ variant: 'destructive', title: 'Theme required', description: 'Please enter a theme for the image.'});
        return;
    }
    setIsGeneratingImage(true);
    try {
        const result = await generateCardDesign({ prompt: theme });
        cardDetailsForm.setValue('design', { type: 'pattern', value: result.imageDataUri });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Image Generation Failed', description: 'Could not generate image. Please try again.' });
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image Too Large", description: "Please upload an image smaller than 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        cardDetailsForm.setValue('design', {
            type: 'upload',
            value: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomizationSubmit = async () => {
    const cardDataValid = await cardDetailsForm.trigger();
    if (cardDataValid) {
        setView('review');
    }
  };

  const handleOrderSubmit = async () => {
    const isValid = await shippingForm.trigger();
    if (!isValid) return;

    if (balance === null || balance < 1500_00) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You need at least ₦1,500 to order a custom card.' });
        return;
    }
    setIsPinModalOpen(true);
  };
  
  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');
        
        const cardData = cardDetailsForm.getValues();
        const shippingData = shippingForm.getValues();

        // Check balance
        if (balance === null || balance < 1500_00) {
            throw new Error('Insufficient funds. You need at least ₦1,500 to order a custom card.');
        }

        // Deduct fee and show success immediately for physical cards
        updateBalance(balance - 1500_00);
        
        addNotification({
            title: 'Custom Card Ordered!',
            description: 'Your physical card is being processed and will be delivered soon.',
            category: 'transaction',
        });
        
        toast({ title: "Card Ordered!", description: "Your custom card design has been submitted." });
        setView('success');

    } catch (error: any) {
        let description = 'An unknown error occurred.';
        if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsProcessing(false);
        setIsPinModalOpen(false);
    }
  };

  const handleCreateVirtualCard = async () => {
    if (balance === null || balance < 1000_00) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You need at least ₦1,000 to create a virtual card.' });
      return;
    }
    
    // Check if user already has an active virtual card
    const hasActiveCard = virtualCards.some(card => card.isActive);
    if (hasActiveCard) {
      toast({ variant: 'destructive', title: 'Card Limit Reached', description: 'You already have an active virtual card. Please delete your existing card first.' });
      return;
    }
    
    // Use VFD API directly
    await handleCreateVFDCard('VIRTUAL');
  };

  const handleCreateVFDCard = async (cardType: 'PHYSICAL' | 'VIRTUAL') => {
    if (balance === null || balance < 1000_00) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You need at least ₦1,000 to create a card.' });
      return;
    }
    setIsActivatingCard(true);
    setVirtualCardApiError(null);
    
    const tempId = `temp-${generateUUID()}`;
    if (cardType === 'VIRTUAL') {
      const tempCard: VirtualCard & { pending?: boolean } = {
        id: tempId,
        cardNumber: '•••• •••• •••• ••••',
        expiryDate: '',
        cvv: '',
        isActive: false,
        balance: typeof balance === 'number' ? balance : 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        pending: true,
      } as any;
      setVirtualCards(prev => [tempCard, ...prev]);
    }
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication token not found.');

      const response = await fetch('/api/cards/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create',
          cardType,
          deliveryAddress: cardType === 'PHYSICAL' ? shippingForm.getValues('address') : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create card.');

      toast({ title: `${cardType} Card Created!`, description: 'Your card is ready to use.' });
      
      if (cardType === 'VIRTUAL') {
        const newCard: VirtualCard = {
          id: result.data.cardId,
          cardNumber: result.data.cardNumber,
          expiryDate: result.data.expiryDate,
          cvv: result.data.cvv || '***',
          isActive: result.data.status === 'ACTIVE',
          balance: typeof balance === 'number' ? balance : 0,
          createdAt: new Date(),
          expiresAt: new Date(result.data.expiryDate),
          isVFDCard: true,
          cardType: cardType,
          status: result.data.status,
        };
        setVirtualCards(prev => prev.map(c => c.id === tempId ? newCard : c));
        setView('virtual-card');
      }
    } catch (error: any) {
      if (cardType === 'VIRTUAL') {
        setVirtualCards(prev => prev.filter(c => c.id !== tempId));
      }
      setVirtualCardApiError(error.message || 'Card creation failed');
      toast({ variant: 'destructive', title: 'Card Creation Failed', description: error.message });
    } finally {
      setIsActivatingCard(false);
    }
  };



  // Persist virtual cards to localStorage so they remain across navigation
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ovo-virtual-cards');
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        const hydrated = parsed.map((c) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          expiresAt: c.expiresAt ? new Date(c.expiresAt) : new Date(),
        })) as VirtualCard[];
        setVirtualCards(hydrated);
      }
    } catch (e) {
      console.error('Failed to load virtual cards from localStorage', e);
    }
    // we only want to run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh virtual cards from server (reusable)
  const refreshVirtualCards = useCallback(async () => {
    if (!user?.userId) return;
    let mounted = true;
    try {
      setIsFetchingVirtualCards(true);
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        console.warn('No auth token available for fetching virtual cards');
        return;
      }

      const response = await fetch('/api/cards/virtual', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        // Session expired or invalid token — log out user and prompt re-auth
        try { localStorage.removeItem('ovo-auth-token'); } catch (_) {}
        toast({ variant: 'destructive', title: 'Session Expired', description: 'Please sign in again.' });
        try { logout(); } catch (_) {}
        setVirtualCardApiError('Session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        let errMsg = 'Failed to fetch virtual cards';
        try { const err = await response.json(); if (err?.message) errMsg = err.message; } catch (_) {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      const cards = (result.cards || []).map((data: any) => ({
        id: data.id,
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        isActive: data.isActive ?? true,
        balance: typeof data.balance === 'number' ? data.balance : 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(),
      })) as VirtualCard[];

      if (mounted) {
        setVirtualCards(cards);
        try { localStorage.setItem('ovo-virtual-cards', JSON.stringify(cards.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), expiresAt: c.expiresAt.toISOString() })))); } catch (e) {}
      }
    } catch (e: any) {
      console.error('Failed to fetch virtual cards from API', e);
      setVirtualCardApiError(e?.message || 'Failed to fetch virtual cards');
    } finally {
      setIsFetchingVirtualCards(false);
    }
  }, [user?.userId, toast, logout]);

  // Load persisted virtual cards from Supabase API for the logged-in user
  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    refreshVirtualCards();
    return () => { mounted = false; };
  }, [user?.userId, refreshVirtualCards]);

  useEffect(() => {
    try {
      const toStore = virtualCards.map((c) => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        expiresAt: c.expiresAt instanceof Date ? c.expiresAt.toISOString() : c.expiresAt,
      }));
      localStorage.setItem('ovo-virtual-cards', JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to save virtual cards to localStorage', e);
    }
  }, [virtualCards]);

  const toggleCardNumberVisibility = (cardId: string) => {
    setShowVirtualCardNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const maskCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ').split('').map((char, idx) => idx < 12 ? '*' : char).join('');
  };

  const handleLoadBalance = (cardId: string) => {
    toast({ 
      title: "Feature Coming Soon", 
      description: "Load Balance feature will be available soon." 
    });
  };

  const resetFlow = () => {
      cardDetailsForm.reset({ 
        nameOnCard: "", 
        design: { type: 'color', value: templates.colors[0].value }
      });
      shippingForm.reset();
      setView('customize');
  };

  // Retry a failed virtual card creation by removing the failed card and opening create modal again
  const handleRetryVirtualCard = (cardId: string) => {
    setVirtualCards(prev => prev.filter(c => c.id !== cardId));
    setIsPinModalOpen(true);
  };

  // Manage (deactivate/delete) modal state
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageProcessing, setManageProcessing] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [pendingManageAction, setPendingManageAction] = useState<{ cardId: string; action: 'deactivate' | 'delete' } | null>(null);

  const openDeactivateConfirm = (cardId: string) => {
    setPendingManageAction({ cardId, action: 'deactivate' });
    setManageError(null);
    setManageModalOpen(true);
  };

  const openDeleteConfirm = (cardId: string) => {
    setPendingManageAction({ cardId, action: 'delete' });
    setManageError(null);
    setManageModalOpen(true);
  };

  const handleConfirmManage = async () => {
    if (!pendingManageAction) return;
    const { cardId, action } = pendingManageAction;
    setManageProcessing(true);
    setManageError(null);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication token not found.');

      const card = virtualCards.find(c => c.id === cardId);
      if (!card) {
        // If card not found in local state, just remove from UI
        setVirtualCards(prev => prev.filter(c => c.id !== cardId));
        setManageModalOpen(false);
        setPendingManageAction(null);
        toast({ title: 'Card Removed', description: 'Card has been removed from your list.' });
        return;
      }
      
      // Always use VFD API for card management
      const res = await fetch('/api/cards/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          action: action === 'deactivate' ? 'block' : action,
          cardId,
          reason: 'User requested'
        }),
      });
      const json = await res.json();
      
      // Always update UI state regardless of API response for deletion
      if (action === 'delete') {
        const updatedCards = virtualCards.filter(c => c.id !== cardId);
        setVirtualCards(updatedCards);
        // Update localStorage immediately to prevent deleted cards from reappearing
        try {
          localStorage.setItem('ovo-virtual-cards', JSON.stringify(updatedCards.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), expiresAt: c.expiresAt.toISOString() }))));
        } catch (e) {
          localStorage.removeItem('ovo-virtual-cards');
        }
        toast({ title: 'Card Deleted', description: 'Card has been removed.' });
      } else if (res.ok && action === 'deactivate') {
        setVirtualCards(prev => prev.map(c => c.id === cardId ? { ...c, isActive: false, status: 'BLOCKED' } : c));
        toast({ title: 'Card Blocked', description: json.message || 'Card has been blocked.' });
      } else if (!res.ok && action === 'deactivate') {
        throw new Error(json.message || 'Failed to deactivate card.');
      }

      setManageModalOpen(false);
      setPendingManageAction(null);
    } catch (e: any) {
      console.error('Manage action error', e);
      // For deletion, still remove from UI even if API fails
      if (pendingManageAction?.action === 'delete') {
        setVirtualCards(prev => prev.filter(c => c.id !== cardId));
        toast({ title: 'Card Deleted', description: 'Card has been removed from your list.' });
        setManageModalOpen(false);
        setPendingManageAction(null);
      } else {
        setManageError(e?.message || 'An error occurred while performing the action.');
        toast({ variant: 'destructive', title: 'Action Failed', description: e?.message || 'Could not complete the action.' });
      }
    } finally {
      setManageProcessing(false);
    }
  };

  const renderContent = () => {
    const showNavTabs = view === 'customize' || view === 'virtual-card';

    return (
      <>
        {showNavTabs && (
          <CardHeader className="border-b">
            <div className="relative w-full max-w-md mx-auto">
              <div className="relative bg-muted rounded-full p-1 w-full">
                <motion.div
                  className="absolute top-1 bottom-1 bg-primary rounded-full"
                  initial={false}
                  animate={{
                    left: view === 'customize' ? '4px' : '50%',
                    right: view === 'customize' ? '50%' : '4px',
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }}
                />
                <div className="relative flex w-full">
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors duration-200 z-10",
                      view === 'customize' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setView('customize')}
                  >
                    Physical Card
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors duration-200 z-10",
                      view === 'virtual-card' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setView('virtual-card')}
                  >
                    Virtual Card
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
        )}
        
        {view === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('customize')}><ArrowLeft/></Button>
                <div>
                  <CardTitle>Review Your Custom Card</CardTitle>
                  <CardDescription>Confirm your design and provide shipping details.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col items-center gap-2">
                <CardPreview design={cardDesign} name={nameOnCard} />
                <p className="text-sm text-muted-foreground">Final Preview</p>
              </div>
              <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Shipping Information</h3>
                 <Form {...shippingForm}>
                    <form id="shipping-form" onSubmit={(e) => { e.preventDefault(); handleOrderSubmit(); }} className="space-y-3">
                         <FormField control={shippingForm.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={shippingForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Delivery Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={shippingForm.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={shippingForm.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         </div>
                    </form>
                 </Form>
              </div>
            </CardContent>
            <CardFooter>
                 <Button form="shipping-form" type="submit" className="w-full md:w-auto ml-auto" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm &amp; Pay ₦1,500
                 </Button>
            </CardFooter>
          </motion.div>
        )}

        {view === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <CardHeader className="items-center pb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
              <CardDescription>Your custom physical card has been successfully ordered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Success Message */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-3 text-lg">🎉 Card Order Successful!</h3>
                <p className="text-green-800 mb-4">
                  Your custom physical card has been ordered and will be delivered to your address within <strong>5-7 working days</strong>.
                </p>
                <div className="bg-white/50 rounded-lg p-4 text-sm text-green-700">
                  <p className="font-medium mb-2">What happens next:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your card design will be reviewed and approved</li>
                    <li>Physical card will be printed with your custom design</li>
                    <li>Card will be shipped to your delivery address</li>
                    <li>You'll receive SMS and email notifications for tracking</li>
                  </ul>
                </div>
              </div>

              {/* Order Summary */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Card Name:</span>
                      <span className="font-mono font-semibold">{cardDetailsForm.getValues('nameOnCard')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Name:</span>
                      <span className="font-mono font-semibold">{shippingForm.getValues('fullName')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Address:</span>
                      <span className="font-mono font-semibold text-right max-w-xs">{shippingForm.getValues('address')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City / State:</span>
                      <span className="font-mono font-semibold">{shippingForm.getValues('city')}, {shippingForm.getValues('state')}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-3 mt-3 flex justify-between font-semibold">
                      <span>Order Fee:</span>
                      <span>₦1,500</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Delivery Time:</span>
                      <span className="font-semibold">5-7 Working Days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Timeline */}
              <div className="flex items-start gap-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <Truck className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-amber-900">Delivery Status: Processing</p>
                  <p className="text-sm text-amber-700 mt-1">Your order is being prepared for delivery.</p>
                  <p className="text-xs text-amber-600 mt-2">📍 Estimated Delivery: 5-7 working days</p>
                  <p className="text-xs text-amber-600">🔔 Track your order via SMS and email updates</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" onClick={resetFlow} className="flex-1">Order Another Card</Button>
              <Button onClick={() => setView('customize')} className="flex-1">Continue</Button>
            </CardFooter>
          </motion.div>
        )}

        {view === 'customize' && (
          <motion.div key="customize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardHeader>
              <CardTitle>Customize Your ATM Card</CardTitle>
              <CardDescription>Personalize your card by selecting a template and adding your name.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <CardPreview design={cardDesign} name={nameOnCard} />
                 <p className="text-sm text-muted-foreground mt-2">Live Preview</p>
              </div>
              <div className="space-y-6">
                <Form {...cardDetailsForm}>
                    <form id="customize-form" onSubmit={cardDetailsForm.handleSubmit(handleCustomizationSubmit)} className="space-y-6">
                         <FormField control={cardDetailsForm.control} name="nameOnCard" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name on Card</FormLabel>
                                <FormControl><Input placeholder="JOHN APPLESEED" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />

                        <div className="space-y-3">
                          <Label>1. Choose a Color</Label>
                          <div className="flex flex-wrap gap-2">
                            {templates.colors.map(color => (
                              <button
                                key={color.name}
                                type="button"
                                title={color.name}
                                onClick={() => cardDetailsForm.setValue('design', { type: 'color', value: color.value })}
                                className={cn(
                                  "w-10 h-10 rounded-full border-2 transition-transform hover:scale-110",
                                  cardDesign.type === 'color' && cardDesign.value === color.value ? 'border-primary' : 'border-transparent',
                                  color.value
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Label>2. Or Generate an AI Pattern</Label>
                             <FormField control={cardDetailsForm.control} name="imageTheme" render={({ field }) => (
                                <FormItem>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input placeholder="e.g., galaxy stars, blue waves" {...field} />
                                    </FormControl>
                                    <Button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                                        {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    </Button>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        
                         <FormField control={cardDetailsForm.control} name="design" render={() => (
                            <FormItem>
                                <Label>3. Or Upload Your Own Image</Label>
                                <div className="relative">
                                  <Input id="image-upload" type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} className="absolute h-full w-full opacity-0 cursor-pointer" />
                                  <label htmlFor="image-upload" className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <div className="text-center">
                                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                      <p className="mt-2 text-sm text-muted-foreground">Click to upload</p>
                                    </div>
                                  </label>
                                </div>
                             </FormItem>
                         )} />
                    </form>
                </Form>
                <Alert variant="default" className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Copyright Warning</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    By uploading an image, you agree that you own the rights to it. All submissions are moderated. Protected zones (chip, logos) cannot be covered.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="customize-form" className="w-full md:w-auto ml-auto">Proceed to Review</Button>
            </CardFooter>
          </motion.div>
        )}

        {view === 'virtual-card' && (
          <motion.div key="virtual-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardHeader>
              <CardTitle>Virtual Card</CardTitle>
              <CardDescription>Create and manage instant virtual cards for online transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {virtualCards.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <h3 className="text-xl font-semibold mb-2">No Virtual Cards Yet</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">Create your first virtual card for instant online transactions. Get activated instantly with just a ₦1,000 one-time fee.</p>
                  <div className="rounded-lg border border-dashed border-primary/30 p-6 bg-primary/5">
                    <p className="text-sm font-medium mb-1 text-primary">Activation Fee</p>
                    <p className="text-3xl font-bold text-primary mb-4">₦1,000</p>
                    <p className="text-xs text-muted-foreground mb-6">One-time fee per virtual card</p>
                    <Button onClick={handleCreateVirtualCard} disabled={isActivatingCard} size="lg" className="w-full">
                      {isActivatingCard ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Create Virtual Card
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                  <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={async () => { await refreshVirtualCards(); }}>
                        {isFetchingVirtualCards ? (<Loader2 className="h-4 w-4 animate-spin"/>) : 'Refresh'}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-8">
                    {virtualCards.map((card) => (
                      <VirtualCardDisplay
                        key={card.id}
                        card={card}
                        isNumberVisible={showVirtualCardNumbers.has(card.id)}
                        onToggleNumberVisibility={toggleCardNumberVisibility}
                        onCopyToClipboard={copyToClipboard}
                        onLoadBalance={handleLoadBalance}
                        onRetry={handleRetryVirtualCard}
                        onDeactivate={openDeactivateConfirm}
                        onDelete={openDeleteConfirm}
                      />
                    ))}
                  </div>

                  {!virtualCards.some(card => card.isActive) && (
                    <Button 
                      onClick={handleCreateVirtualCard} 
                      disabled={isActivatingCard}
                      size="lg"
                      className="w-full h-12 font-semibold"
                    >
                      {isActivatingCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Create Virtual Card
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <>
    <Card className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </Card>
     <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmOrder}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Confirm Card Order"
        description="A fee of ₦1,500 will be deducted from your wallet for the custom card."
      />

        <PinModal
          open={manageModalOpen}
          onOpenChange={setManageModalOpen}
          successUrl={null}
          onConfirm={handleConfirmManage}
          isProcessing={manageProcessing}
          error={manageError}
          onClearError={() => setManageError(null)}
          title={pendingManageAction?.action === 'delete' ? 'Confirm Delete' : 'Confirm Deactivate'}
          description={
            pendingManageAction?.action === 'delete'
              ? 'Enter your PIN to permanently delete this virtual card.'
              : 'Enter your PIN to deactivate this virtual card. Deactivated cards cannot be used for transactions.'
          }
        />
    </>
  );
}
