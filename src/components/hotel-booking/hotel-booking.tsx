
// @ts-nocheck
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { Hotel, MapPin, Search, Star, Wifi, Wind, Utensils, CalendarIcon, Users, ArrowLeft, Wallet, CheckCircle, Loader2, Download, Minus, Plus } from 'lucide-react';

// Data & Auth
import type { Hotel, Room, UserBooking } from '@/lib/hotel-data';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';


// --- TYPES & SCHEMAS ---
type View = 'search' | 'results' | 'details' | 'payment' | 'confirmation';

const searchSchema = z.object({
    location: z.string().min(1, 'Please enter a location.'),
    dates: z.custom<DateRange>(val => val && 'from' in (val as object) && 'to' in (val as object), 'Please select check-in and check-out dates.'),
    guests: z.coerce.number().min(1),
});

const bookingSchema = z.object({
    fullName: z.string().min(3, 'Full name is required.'),
    email: z.string().email('A valid email is required.'),
    phone: z.string().min(10, 'A valid phone number is required.'),
});

type SearchFormData = z.infer<typeof searchSchema>;
type BookingFormData = z.infer<typeof bookingSchema>;
type DetailedHotel = Hotel & { rooms: Room[] };


// --- SUB-COMPONENTS ---

function SearchScreen({ onSearch, isSearching }: { onSearch: (data: SearchFormData) => void; isSearching: boolean; }) {
    const form = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { location: 'Lagos', guests: 1, dates: { from: new Date(), to: addDays(new Date(), 2) } },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find the perfect hotel</CardTitle>
                <CardDescription>Search for hotels in your destination city.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
                        <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Lagos, Abuja, or Hotel Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="dates" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Check-in / Check-out</FormLabel><Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value} onSelect={field.onChange} numberOfMonths={2} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="guests" render={({ field }) => ( <FormItem><FormLabel>Guests</FormLabel><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => form.setValue('guests', Math.max(1, field.value - 1))}><Minus /></Button><FormControl><Input className="text-center w-16" {...field} readOnly /></FormControl><Button type="button" variant="outline" size="icon" onClick={() => form.setValue('guests', field.value + 1)}><Plus /></Button></div><FormMessage /></FormItem> )} />
                        <Button type="submit" className="w-full !mt-6" disabled={isSearching}>{isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search Hotels</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

const facilityIcons = { wifi: Wifi, ac: Wind, breakfast: Utensils };
function ResultsScreen({ hotels, onSelectHotel, onBack, searchData }: { hotels: Hotel[], onSelectHotel: (hotelId: string) => void, onBack: () => void, searchData: SearchFormData }) {
    if (hotels.length === 0) {
        return (
            <Card className="text-center py-10">
                 <CardHeader>
                    <CardTitle>No Results Found</CardTitle>
                    <CardDescription>We couldn't find any hotels matching your search. Please try a different location or dates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={onBack}>New Search</Button>
                </CardContent>
            </Card>
        )
    }
    return (
        <div className="space-y-4">
             <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2"/>New Search</Button>
            {hotels.map(hotel => (
                <Card key={hotel.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelectHotel(hotel.id)}>
                    <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-1/3 relative h-48 sm:h-auto"><Image src={hotel.image} alt={hotel.name} layout="fill" objectFit="cover" data-ai-hint={hotel.hint} /></div>
                        <div className="sm:w-2/3 p-4 flex flex-col justify-between">
                            <div>
                                <CardTitle>{hotel.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{hotel.city}</CardDescription>
                                <div className="flex items-center gap-1 mt-2">{Array.from({ length: hotel.rating }).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}</div>
                                <div className="flex gap-2 mt-2">{hotel.facilities.map(fac => { const Icon = facilityIcons[fac as keyof typeof facilityIcons]; return <Icon key={fac} className="h-5 w-5 text-muted-foreground" />; })}</div>
                            </div>
                            <div className="text-right mt-4 sm:mt-0"><p className="text-xl font-bold">₦{hotel.price.toLocaleString()}</p><p className="text-xs text-muted-foreground">per night</p></div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function DetailsScreen({ hotel, searchData, onBook, onBack }: { hotel: DetailedHotel, searchData: SearchFormData, onBook: (data: BookingFormData, room: Room) => void, onBack: () => void }) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const form = useForm<BookingFormData>({ resolver: zodResolver(bookingSchema), defaultValues: { fullName: '', email: '', phone: '' } });
    
    const selectedRoom = hotel.rooms.find(r => r.id === selectedRoomId);
    const numberOfNights = differenceInDays(searchData.dates.to!, searchData.dates.from!);
    const totalAmount = selectedRoom ? selectedRoom.price * numberOfNights : 0;

    const onSubmit = (data: BookingFormData) => {
        if (!selectedRoom) return;
        onBook(data, selectedRoom);
    };

    return (
        <Card>
            <CardHeader><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button><div><CardTitle className="text-2xl">{hotel.name}</CardTitle><CardDescription>{hotel.city}</CardDescription></div></div></CardHeader>
            <CardContent className="space-y-6">
                <div className="h-48 w-full relative rounded-lg overflow-hidden"><Image src={hotel.image} alt={hotel.name} layout="fill" objectFit="cover" data-ai-hint={hotel.hint} /></div>
                <div><h3 className="font-semibold mb-2">Available Rooms</h3><div className="space-y-2">{hotel.rooms.map(room => ( <div key={room.id} className={cn("p-4 border rounded-lg cursor-pointer", selectedRoomId === room.id && "border-primary ring-2 ring-primary")} onClick={() => setSelectedRoomId(room.id)}><div className="flex justify-between"><p className="font-semibold">{room.name}</p><p className="font-bold">₦{room.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/night</span></p></div><p className="text-sm text-muted-foreground">{room.bed}</p></div> ))}</div></div>
                {selectedRoom && (<Form {...form}><form id="booking-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t"><h3 className="font-semibold">Guest Details</h3><FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="as on ID" {...field} /></FormControl><FormMessage /></FormItem> )} /><FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="for booking confirmation" {...field} /></FormControl><FormMessage /></FormItem> )} /><FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} /><div className="flex justify-between items-center font-bold text-lg pt-2 border-t"><p>Total ({numberOfNights} nights):</p><p>₦{totalAmount.toLocaleString()}</p></div></form></Form>)}
            </CardContent>
            <CardFooter><Button form="booking-form" type="submit" className="w-full" disabled={!selectedRoom}>Proceed to Payment</Button></CardFooter>
        </Card>
    );
}

function ConfirmationScreen({ hotel, room, searchData, bookingData, onReset, bookingReference }: { hotel: any, room: any, searchData: any, bookingData: any, onReset: () => void, bookingReference: string }) {
    const { toast } = useToast();
    const numberOfNights = differenceInDays(searchData.dates.to!, searchData.dates.from!);
    const totalAmount = room.price * numberOfNights;
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center"><CheckCircle className="w-16 h-16 text-green-500" /><CardTitle className="mt-4 text-2xl">Booking Confirmed!</CardTitle><CardDescription>Your reservation at {hotel.name} is complete.</CardDescription></CardHeader>
            <CardContent className="text-left bg-muted p-4 rounded-lg space-y-2">
                 <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref.</span><span className="font-semibold font-mono">{bookingReference}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-semibold">{bookingData.fullName}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-semibold">{format(searchData.dates.from, 'PPP')}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-semibold">{format(searchData.dates.to, 'PPP')}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-semibold">₦{totalAmount.toLocaleString()}</span></div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4"><Button className="w-full" onClick={() => toast({ title: "Receipt Downloaded" })}><Download className="mr-2" /> Download Receipt</Button><Button variant="outline" className="w-full" onClick={onReset}>Book Another Hotel</Button></CardFooter>
        </Card>
    )
}

function MyBookingsScreen() {
    const [bookings, setBookings] = useState<UserBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would be an API call
        setTimeout(() => {
            const mockBookings: UserBooking[] = [
                { id: 'book-1', hotelName: 'Eko Hotel & Suites', checkIn: '2024-06-15', checkOut: '2024-06-18', status: 'Completed', ref: 'H-XYZ123' },
                { id: 'book-2', hotelName: 'Transcorp Hilton', checkIn: '2024-09-10', checkOut: '2024-09-12', status: 'Upcoming', ref: 'H-ABC456' },
            ];
            setBookings(mockBookings);
            setIsLoading(false);
        }, 1000);
    }, []);

    return (
        <Card>
            <CardContent>
                {isLoading ? (
                    <div className="p-4 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">You have no hotel bookings.</div>
                ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Hotel</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>{bookings.map(b => (
                            <TableRow key={b.id}><TableCell>{b.hotelName}</TableCell><TableCell>{format(new Date(b.checkIn), 'MMM d')} - {format(new Date(b.checkOut), 'MMM d, yyyy')}</TableCell><TableCell><Badge variant={b.status === 'Completed' ? 'secondary' : 'default'}>{b.status}</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">View</Button></TableCell></TableRow>
                        ))}</TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// --- MAIN CONTROLLER COMPONENT ---
export function HotelBooking() {
  const [view, setView] = useState<View>('search');
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<DetailedHotel | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{ room: Room, formData: BookingFormData } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState('');

  const handleSearch = useCallback(async (data: SearchFormData) => {
    setIsProcessing(true);
    setSearchData(data);
    try {
        const query = new URLSearchParams({ location: data.location, from: data.dates.from.toISOString(), to: data.dates.to!.toISOString(), guests: String(data.guests) }).toString();
        const response = await fetch(`/api/hotels/search?${query}`);
        if (!response.ok) throw new Error("Could not fetch hotels.");
        const results = await response.json();
        setFilteredHotels(results);
        setView('results');
    } catch(err) {
        toast({ variant: 'destructive', title: 'Search Failed', description: (err as Error).message });
    } finally {
        setIsProcessing(false);
    }
  }, [toast]);
  
  const handleSelectHotel = useCallback(async (hotelId: string) => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/hotels/${hotelId}`);
        if (!response.ok) throw new Error("Could not fetch hotel details.");
        const hotelData = await response.json();
        setSelectedHotel(hotelData);
        setView('details');
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
      } finally {
        setIsProcessing(false);
      }
  }, [toast]);

  const handleBook = useCallback((formData: BookingFormData, room: Room) => {
      setBookingDetails({ formData, room });
      setIsPinModalOpen(true);
  }, []);
  
  const handlePay = useCallback(async () => {
    if (!selectedHotel || !bookingDetails || !searchData) return;
    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error("Authentication failed.");

        const numberOfNights = differenceInDays(searchData.dates.to!, searchData.dates.from!);
        const totalAmount = bookingDetails.room.price * numberOfNights;

        const response = await fetch('/api/hotels/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                hotel: selectedHotel,
                room: bookingDetails.room,
                dates: searchData.dates,
                guests: searchData.guests,
                guestInfo: bookingDetails.formData,
                totalAmount: totalAmount,
                clientReference: `hotel-book-${crypto.randomUUID()}`
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Booking failed.");
        
        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: "Hotel Booked!",
            description: `Your booking at ${selectedHotel.name} is confirmed.`,
            category: 'transaction',
        });
        toast({ title: "Booking Successful!" });
        setBookingReference(result.bookingReference);
        setView('confirmation');

    } catch (err) {
        setApiError((err as Error).message);
    } finally {
        setIsProcessing(false);
        setIsPinModalOpen(false);
    }
  }, [selectedHotel, bookingDetails, searchData, updateBalance, addNotification, toast]);

  const reset = useCallback(() => {
      setView('search');
      setSearchData(null);
      setFilteredHotels([]);
      setSelectedHotel(null);
      setBookingDetails(null);
      setBookingReference('');
  }, []);

  const renderContent = () => {
    switch(view) {
        case 'results': return <ResultsScreen hotels={filteredHotels} onSelectHotel={handleSelectHotel} onBack={reset} searchData={searchData!} />;
        case 'details': return <DetailsScreen hotel={selectedHotel!} searchData={searchData!} onBook={handleBook} onBack={() => setView('results')} />;
        case 'confirmation': return <ConfirmationScreen hotel={selectedHotel} room={bookingDetails?.room} searchData={searchData} bookingData={bookingDetails?.formData} onReset={reset} bookingReference={bookingReference} />;
        case 'search':
        default: return <SearchScreen onSearch={handleSearch} isSearching={isProcessing}/>;
    }
  }

  return (
    <>
    <h2 className="text-3xl font-bold tracking-tight">Hotel Booking</h2>
    <Tabs defaultValue="book_hotel" className="w-full">
      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="book_hotel">Book a Hotel</TabsTrigger><TabsTrigger value="history">My Bookings</TabsTrigger></TabsList>
      <TabsContent value="book_hotel" className="pt-6">
        {isProcessing && view !== 'search' ? (
            <Card className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></Card>
        ) : <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>{renderContent()}</motion.div></AnimatePresence>}
      </TabsContent>
      <TabsContent value="history" className="pt-6"><MyBookingsScreen /></TabsContent>
    </Tabs>
     <PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handlePay} isProcessing={isProcessing} error={apiError} onClearError={() => setApiError(null)} title="Authorize Hotel Booking"/>
    </>
  );
}
// @ts-nocheck
