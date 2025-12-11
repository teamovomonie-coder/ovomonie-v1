
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { generateCardDesign } from '@/ai/flows/generate-card-design-flow';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { VirtualCardDisplay } from './virtual-card-display';
import type { VirtualCard } from './virtual-card-display';

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
  const [isPinModalOpenForVirtual, setIsPinModalOpenForVirtual] = useState(false);

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

        const response = await fetch('/api/cards/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                nameOnCard: cardData.nameOnCard,
                designType: cardData.design.type,
                designValue: cardData.design.value,
                shippingInfo: shippingData,
                clientReference: `card-order-${crypto.randomUUID()}`,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
             const error: any = new Error(result.message || 'Card order failed.');
             error.response = response;
             throw error;
        }

        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: 'Custom Card Ordered!',
            description: 'Your new card is being processed and will be shipped soon.',
            category: 'transaction',
        });
        toast({ title: "Card Ordered!", description: "Your custom card design has been submitted." });
        setView('success');

    } catch (error: any) {
        let description = 'An unknown error occurred.';
        if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
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
    setIsPinModalOpenForVirtual(true);
  };

  const handleConfirmVirtualCard = async () => {
    setIsActivatingCard(true);
    setVirtualCardApiError(null);
    const clientReference = `virtual-card-${crypto.randomUUID()}`;

    // Optimistic UI: add a temporary pending card so user sees immediate result
    const tempId = `temp-${crypto.randomUUID()}`;
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
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication token not found.');

      const response = await fetch('/api/cards/virtual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          clientReference,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const error: any = new Error(result.message || 'Failed to create virtual card.');
        error.response = response;
        throw error;
      }

      // Log for debugging
      console.log('Virtual card created:', result);

      const newCard: VirtualCard = {
        id: result.cardId,
        cardNumber: result.cardNumber,
        expiryDate: result.expiryDate,
        cvv: result.cvv,
        isActive: true,
        // Use the wallet balance returned by the API (in kobo)
        balance: typeof result.newBalanceInKobo === 'number' ? result.newBalanceInKobo : 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };

      // Replace the optimistic temp card with the server-provided card
      setVirtualCards(prev => {
        console.log('Replacing temp card with server card', tempId, newCard);
        return prev.map(c => c.id === tempId ? newCard : c);
      });
      
      updateBalance(result.newBalanceInKobo);

      addNotification({
        title: 'Virtual Card Created!',
        description: 'Your new virtual card is ready to use.',
        category: 'transaction',
      });

      toast({ title: "Virtual Card Created!", description: "Your card is ready to use for online transactions." });
      // Persist a pending receipt for the virtual card so `/success` can render it
      try {
        const pendingReceipt = {
          type: 'virtual-card',
          data: {
            cardId: result.cardId,
            cardNumber: result.cardNumber,
            expiryDate: result.expiryDate,
            cvv: result.cvv,
          },
          transactionId: clientReference,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem('ovo-pending-receipt', JSON.stringify(pendingReceipt));
        try { window.dispatchEvent(new Event('ovo-pending-receipt-updated')); } catch (e) {}
      } catch (e) {
        console.error('Failed to persist virtual-card pending receipt', e);
      }

      // Close modal and navigate to virtual card view
      setIsPinModalOpenForVirtual(false);
      
      // Use setTimeout to ensure state updates propagate before changing view
      setTimeout(() => {
        console.log('Setting view to virtual-card');
        setView('virtual-card');
      }, 100);
    } catch (error: any) {
      let description = 'An unknown error occurred.';
      if (error.response?.status === 401) {
        description = 'Your session has expired. Please log in again.';
        logout();
      } else if (error.message) {
        description = error.message;
      }
      console.error('Virtual card creation error:', error);
      setVirtualCardApiError(description);
      // Mark the optimistic card as failed so user can retry or see status
      setVirtualCards(prev => prev.map(c => c.id === tempId ? { ...c, pending: false, failed: true } : c));
      // Don't close modal on error
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

  // Load persisted virtual cards from Firestore for the logged-in user
  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    const fetchCards = async () => {
      try {
        setIsFetchingVirtualCards(true);
        const snap = await getDocs(collection(db, 'users', user.userId, 'virtualCards'));
        const cards = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            cardNumber: data.cardNumber,
            expiryDate: data.expiryDate,
            cvv: data.cvv,
            isActive: data.isActive ?? true,
            balance: typeof data.balance === 'number' ? data.balance : 0,
            createdAt: data.createdAt && (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            expiresAt: data.expiresAt && (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)),
          } as VirtualCard;
        });
        if (mounted) {
          if (cards.length > 0) {
            setVirtualCards(cards);
            try { localStorage.setItem('ovo-virtual-cards', JSON.stringify(cards.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), expiresAt: c.expiresAt.toISOString() })))); } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Failed to fetch virtual cards from Firestore', e);
      } finally {
        setIsFetchingVirtualCards(false);
      }
    };
    fetchCards();
    return () => { mounted = false; };
  }, [user?.userId]);

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

  const renderContent = () => {
    const showNavTabs = view === 'customize' || view === 'virtual-card';

    return (
      <>
        {showNavTabs && (
          <CardHeader className="border-b">
            <div className="flex gap-2">
              <Button
                variant={view === 'customize' ? 'default' : 'outline'}
                onClick={() => setView('customize')}
              >
                Physical Card
              </Button>
              <Button
                variant={view === 'virtual-card' ? 'default' : 'outline'}
                onClick={() => setView('virtual-card')}
              >
                Virtual Card
              </Button>
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
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <CardHeader className="items-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <CardTitle>Order Placed Successfully!</CardTitle>
              <CardDescription>Your custom card is being printed and will be shipped soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Estimated Delivery: Dec 15, 2024</p>
                  <p className="text-sm text-muted-foreground">You will be notified once it's shipped.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={resetFlow} className="w-full">Order Another Card</Button>
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
                          Creating Card...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
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
                      <Button variant="ghost" size="sm" onClick={async () => { if (!user?.userId) return; try { setIsFetchingVirtualCards(true); const snap = await getDocs(collection(db, 'users', user.userId, 'virtualCards')); const cards = snap.docs.map(d => { const data = d.data() as any; return { id: d.id, cardNumber: data.cardNumber, expiryDate: data.expiryDate, cvv: data.cvv, isActive: data.isActive ?? true, balance: typeof data.balance === 'number' ? data.balance : 0, createdAt: data.createdAt && (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)), expiresAt: data.expiresAt && (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)), } as VirtualCard }); setVirtualCards(cards); try { localStorage.setItem('ovo-virtual-cards', JSON.stringify(cards.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), expiresAt: c.expiresAt.toISOString() })))); } catch (e) {} } catch (e) { console.error(e) } finally { setIsFetchingVirtualCards(false) } }}>
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
                      />
                    ))}
                  </div>

                  <Button 
                    onClick={handleCreateVirtualCard} 
                    disabled={isActivatingCard}
                    size="lg"
                    className="w-full h-12 font-semibold"
                  >
                    {isActivatingCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Create Another Card (₦1,000)
                  </Button>
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
        open={isPinModalOpenForVirtual}
        onOpenChange={setIsPinModalOpenForVirtual}
        // Prevent PinModal from navigating to `/success` for virtual-card flows.
        // We want users to remain on the Virtual Card view so the newly created
        // card is immediately visible.
        successUrl={null}
        onConfirm={handleConfirmVirtualCard}
        isProcessing={isActivatingCard}
        error={virtualCardApiError}
        onClearError={() => setVirtualCardApiError(null)}
        title="Create Virtual Card"
        description="A one-time fee of ₦1,000 will be deducted from your wallet to activate this virtual card."
      />
    </>
  );
}
