
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

// UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PinModal } from '@/components/auth/pin-modal';

// Icons
import { MapPin, ArrowLeft, Bike, Car, Gem, Star, Phone, Shield, Share2, Wallet, X, CheckCircle, Loader2 } from 'lucide-react';

// Auth and Notifications
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';


// Types
type View = 'search' | 'selection' | 'tracking' | 'rating' | 'receipt';
type RideType = {
    id: 'bike' | 'car' | 'luxury';
    name: string;
    icon: React.ElementType;
    eta: number;
    price: number;
    multiplier: number;
};

// Mock data
const rideTypes: RideType[] = [
    { id: 'bike', name: 'Bike', icon: Bike, eta: 5, price: 500, multiplier: 0.5 },
    { id: 'car', name: 'Car', icon: Car, eta: 8, price: 1200, multiplier: 1 },
    { id: 'luxury', name: 'Luxury', icon: Gem, eta: 10, price: 3500, multiplier: 2.5 },
];

const mockDriver = {
    name: 'Tunde Adebayo',
    avatarUrl: 'https://placehold.co/40x40.png',
    rating: 4.8,
    car: 'Toyota Camry (Black)',
    plate: 'LSD-123AB',
};

// Zod schema for search form
const searchSchema = z.object({
    pickup: z.string().min(3, 'Please enter a valid pickup location.'),
    destination: z.string().min(3, 'Please enter a valid destination.'),
});

interface ReceiptData {
    ride: RideType;
    searchDetails: { pickup: string; destination: string };
    bookingReference: string;
}

// Main Component
export function RideBooking() {
    const [view, setView] = useState<View>('search');
    const [searchDetails, setSearchDetails] = useState({ pickup: '', destination: '' });
    const [selectedRide, setSelectedRide] = useState<RideType | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { toast } = useToast();
    const { balance, updateBalance } = useAuth();
    const { addNotification } = useNotifications();


    const handleSearch = (data: z.infer<typeof searchSchema>) => {
        setIsSearching(true);
        setTimeout(() => {
            setSearchDetails(data);
            setView('selection');
            setIsSearching(false);
        }, 1500);
    };

    const handleSelectRide = (ride: RideType) => {
        if (balance === null) return;
        if (ride.price * 100 > balance) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Funds',
                description: 'Your wallet balance may not be enough for this ride. Please top up.',
            });
        }
        setSelectedRide(ride);
        setView('tracking');
    };

    const handleRequestPayment = () => {
        if (!selectedRide || balance === null) return;
        if (selectedRide.price * 100 > balance) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Funds',
                description: 'Cannot process payment. Please top up your wallet.',
            });
            return;
        }
        setIsPinModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedRide) return;
        setIsProcessing(true);
        setApiError(null);
        
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/rides/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ride: selectedRide,
                    searchDetails,
                    clientReference: `ride-book-${crypto.randomUUID()}`
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Ride payment failed.");

            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Ride Payment Successful',
                description: `Paid ₦${selectedRide.price.toLocaleString()} for your ride.`,
                category: 'transaction',
            });
            toast({ title: 'Payment Successful!' });
            setReceiptData({ ride: selectedRide, searchDetails, bookingReference: result.bookingReference });
            setView('rating');

        } catch (error) {
            setApiError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsProcessing(false);
            setIsPinModalOpen(false);
        }
    };


    const handleRatingSubmit = () => {
        toast({ title: 'Feedback Submitted', description: 'Thank you for rating your driver!' });
        setView('receipt');
    };

    const reset = () => {
        setView('search');
        setSearchDetails({ pickup: '', destination: '' });
        setSelectedRide(null);
        setReceiptData(null);
    };

    const renderView = () => {
        switch (view) {
            case 'search':
                return <SearchScreen onSearch={handleSearch} isSearching={isSearching} />;
            case 'selection':
                return <RideSelectionScreen onSelectRide={handleSelectRide} onBack={() => setView('search')} searchDetails={searchDetails} />;
            case 'tracking':
                return <TrackingScreen onEndRide={handleRequestPayment} ride={selectedRide!} searchDetails={searchDetails} />;
            case 'rating':
                return <RatingScreen onSubmit={handleRatingSubmit} ride={selectedRide!} />;
            case 'receipt':
                return <ReceiptScreen onDone={reset} receiptData={receiptData!} />;
            default:
                return <SearchScreen onSearch={handleSearch} isSearching={isSearching} />;
        }
    };
    
    return (
        <div className="w-full h-full bg-gray-100 flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex-grow flex flex-col"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
            <PinModal
                open={isPinModalOpen}
                onOpenChange={setIsPinModalOpen}
                onConfirm={handleConfirmPayment}
                isProcessing={isProcessing}
                error={apiError}
                onClearError={() => setApiError(null)}
                title="Authorize Ride Payment"
            />
        </div>
    );
}

// Sub-components for each view

function SearchScreen({ onSearch, isSearching }: { onSearch: (data: any) => void, isSearching: boolean }) {
    const form = useForm<z.infer<typeof searchSchema>>({
        resolver: zodResolver(searchSchema),
        defaultValues: { pickup: 'Ikeja City Mall', destination: 'Lekki Phase 1' },
    });

    return (
        <>
            <div className="relative flex-grow">
                 <Image src="https://placehold.co/600x400.png" layout="fill" objectFit="cover" alt="Map of the city" data-ai-hint="city map" />
                 <div className="absolute inset-0 bg-primary/30"></div>
            </div>
            <Card className="rounded-t-2xl -mt-4 z-10">
                <CardHeader>
                    <CardTitle>Where to?</CardTitle>
                </CardHeader>
                <CardContent>
                     <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="pickup" className="text-sm font-medium">Pickup location</label>
                            <Input id="pickup" placeholder="Enter pickup location" {...form.register('pickup')} />
                            {form.formState.errors.pickup && <p className="text-sm text-destructive">{form.formState.errors.pickup.message}</p>}
                        </div>
                         <div className="space-y-1">
                            <label htmlFor="destination" className="text-sm font-medium">Destination</label>
                            <Input id="destination" placeholder="Enter destination" {...form.register('destination')} />
                            {form.formState.errors.destination && <p className="text-sm text-destructive">{form.formState.errors.destination.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin" /> : 'Find a Ride'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

function RideSelectionScreen({ onSelectRide, onBack, searchDetails }: { onSelectRide: (ride: RideType) => void, onBack: () => void, searchDetails: any }) {
    return (
        <Card className="h-full flex flex-col rounded-none sm:rounded-lg">
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <CardTitle>Choose a ride</CardTitle>
                </div>
                <div className="text-sm bg-muted p-2 rounded-md">
                    <p><span className="font-semibold">From:</span> {searchDetails.pickup}</p>
                    <p><span className="font-semibold">To:</span> {searchDetails.destination}</p>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                {rideTypes.map(ride => (
                    <Card key={ride.id} className="cursor-pointer hover:bg-muted" onClick={() => onSelectRide(ride)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ride.icon className="w-10 h-10 text-primary" />
                                <div>
                                    <p className="font-bold text-lg">{ride.name}</p>
                                    <p className="text-sm text-muted-foreground">{ride.eta} min</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">₦{ride.price.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Wallet</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
             <CardFooter>
                 <Alert>
                    <Wallet className="h-4 w-4"/>
                    <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                    <AlertDescription>Fares are estimates and will be finalized upon trip completion.</AlertDescription>
                </Alert>
            </CardFooter>
        </Card>
    );
}

function TrackingScreen({ onEndRide, ride, searchDetails }: { onEndRide: () => void, ride: RideType, searchDetails: any }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (progress < 100) {
                setProgress(p => Math.min(100, p + 10));
            } else {
                onEndRide();
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [progress, onEndRide]);
    
    return (
        <div className="flex flex-col h-full">
            <div className="relative flex-grow">
                <Image src="https://placehold.co/600x400.png" layout="fill" objectFit="cover" alt="Map with live route" data-ai-hint="map route" />
                <div className="absolute top-4 left-4 right-4 z-10">
                     <Card>
                        <CardContent className="p-2 text-sm">
                            <p><strong className="text-primary">From:</strong> {searchDetails.pickup}</p>
                            <p><strong className="text-primary">To:</strong> {searchDetails.destination}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Card className="rounded-t-2xl -mt-4 z-10">
                <CardHeader className="text-center">
                    <p className="text-muted-foreground">{progress < 10 ? 'Connecting you to your driver...' : `You are on your way!`}</p>
                    <CardTitle className="text-2xl">{ride.eta - Math.floor(ride.eta * (progress / 100))} mins remaining</CardTitle>
                    <Progress value={progress} />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <Avatar className="w-12 h-12">
                                <AvatarImage src={mockDriver.avatarUrl} data-ai-hint="person portrait"/>
                                <AvatarFallback>{mockDriver.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{mockDriver.name} <span className="font-normal text-muted-foreground">({mockDriver.rating} <Star className="inline h-4 w-4 mb-1" />)</span></p>
                                <p className="text-sm">{mockDriver.car}</p>
                                <p className="text-sm font-semibold text-primary bg-primary-light-bg px-2 py-1 rounded-md inline-block mt-1">{mockDriver.plate}</p>
                            </div>
                        </div>
                         <Button variant="outline" size="icon" className="w-12 h-12"><Phone className="h-6 w-6" /></Button>
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                    <Button variant="destructive" className="w-full"><Shield className="mr-2" /> SOS</Button>
                    <Button variant="secondary" className="w-full"><Share2 className="mr-2" /> Share Trip</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function RatingScreen({ onSubmit, ride }: { onSubmit: () => void, ride: RideType }) {
    const [rating, setRating] = useState(0);
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader className="text-center">
                    <CardTitle>How was your ride?</CardTitle>
                    <CardDescription>Your feedback helps us improve.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="p-2 bg-muted rounded-md text-center">
                        <p className="text-sm">You paid</p>
                        <p className="text-2xl font-bold">₦{ride.price.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star
                                key={star}
                                className={cn("w-10 h-10 cursor-pointer", rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    <Textarea placeholder="Add a comment... (optional)" />
                 </CardContent>
                 <CardFooter>
                    <Button className="w-full" onClick={onSubmit}>Submit Feedback</Button>
                 </CardFooter>
            </Card>
        </div>
    );
}

function ReceiptScreen({ onDone, receiptData }: { onDone: () => void, receiptData: ReceiptData }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-sm text-center">
                 <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <CardTitle className="text-2xl mt-4">Ride Complete!</CardTitle>
                    <CardDescription>Here is a summary of your trip.</CardDescription>
                </CardHeader>
                <CardContent className="text-left bg-muted p-4 rounded-lg space-y-2">
                     <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref.</span><span className="font-semibold font-mono text-xs">{receiptData.bookingReference}</span></div>
                     <div className="flex justify-between"><span className="text-muted-foreground">From</span><span className="font-semibold">{receiptData.searchDetails.pickup}</span></div>
                     <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-semibold">{receiptData.searchDetails.destination}</span></div>
                     <Separator />
                     <div className="flex justify-between"><span className="text-muted-foreground">Driver</span><span className="font-semibold">{mockDriver.name}</span></div>
                     <div className="flex justify-between"><span className="text-muted-foreground">Ride Type</span><span className="font-semibold">{receiptData.ride.name}</span></div>
                     <div className="flex justify-between text-lg font-bold"><span >Total Paid</span><span>₦{receiptData.ride.price.toLocaleString()}</span></div>
                </CardContent>
                <CardFooter>
                     <Button className="w-full" onClick={onDone}>Done</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
