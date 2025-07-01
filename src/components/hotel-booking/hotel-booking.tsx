
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

import { Hotel, MapPin, Search, Star, Wifi, Wind, Utensils, CalendarIcon, Users, User, ArrowLeft, Wallet, CheckCircle, Loader2, Download, Minus, Plus } from 'lucide-react';

// --- Mock Data ---

const mockHotels = [
    { id: 'hotel-1', name: 'Eko Hotel & Suites', city: 'Lagos', rating: 5, price: 150000, image: 'https://placehold.co/600x400.png', hint: 'luxury hotel', facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'hotel-2', name: 'Transcorp Hilton', city: 'Abuja', rating: 5, price: 180000, image: 'https://placehold.co/600x400.png', hint: 'modern hotel', facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'hotel-3', name: 'Hotel Presidential', city: 'Port Harcourt', rating: 4, price: 95000, image: 'https://placehold.co/600x400.png', hint: 'classic hotel', facilities: ['wifi', 'ac'] },
    { id: 'hotel-4', name: 'Protea Hotel by Marriott', city: 'Lagos', rating: 4, price: 120000, image: 'https://placehold.co/600x400.png', hint: 'business hotel', facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'hotel-5', name: 'Radisson Blu', city: 'Lagos', rating: 5, price: 165000, image: 'https://placehold.co/600x400.png', hint: 'sleek hotel', facilities: ['wifi', 'ac', 'breakfast'] },
];

const mockRooms = [
    { id: 'room-1', hotelId: 'hotel-1', name: 'Standard Room', price: 150000, bed: '1 Queen Bed', refundable: true, facilities: ['wifi', 'ac'] },
    { id: 'room-2', hotelId: 'hotel-1', name: 'Deluxe Suite', price: 250000, bed: '1 King Bed', refundable: true, facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'room-3', hotelId: 'hotel-2', name: 'Executive Room', price: 180000, bed: '1 King Bed', refundable: false, facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'room-4', hotelId: 'hotel-3', name: 'Classic Double', price: 95000, bed: '2 Double Beds', refundable: true, facilities: ['wifi', 'ac'] },
];

const mockBookings = [
    { id: 'book-1', hotelName: 'Eko Hotel & Suites', checkIn: '2024-06-15', checkOut: '2024-06-18', status: 'Completed', ref: 'H-XYZ123' },
    { id: 'book-2', hotelName: 'Transcorp Hilton', checkIn: '2024-08-10', checkOut: '2024-08-12', status: 'Upcoming', ref: 'H-ABC456' },
];

// --- Zod Schemas ---
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

// --- Sub-components for each step ---

function HotelSearchForm({ onSearch, isSearching }: { onSearch: (data: SearchFormData) => void; isSearching: boolean; }) {
    const form = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { location: '', guests: 1, dates: { from: new Date(), to: addDays(new Date(), 2) } },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="p-4 space-y-4 border rounded-lg bg-card">
                <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Lagos, Abuja, or Hotel Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="dates" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Check-in / Check-out</FormLabel><Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value.from && "text-muted-foreground")}>{field.value.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value.from} selected={field.value} onSelect={field.onChange} numberOfMonths={2} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="guests" render={({ field }) => ( <FormItem><FormLabel>Guests</FormLabel><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => form.setValue('guests', Math.max(1, field.value - 1))}><Minus /></Button><FormControl><Input className="text-center w-16" {...field} readOnly /></FormControl><Button type="button" variant="outline" size="icon" onClick={() => form.setValue('guests', field.value + 1)}><Plus /></Button></div><FormMessage /></FormItem> )} />
                <Button type="submit" className="w-full !mt-6" disabled={isSearching}>{isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search Hotels</Button>
            </form>
        </Form>
    );
}

const facilityIcons = { wifi: Wifi, ac: Wind, breakfast: Utensils };

function HotelResultsView({ hotels, onSelectHotel }: { hotels: typeof mockHotels, onSelectHotel: (hotelId: string) => void }) {
    return (
        <div className="space-y-4">
            {hotels.map(hotel => (
                <Card key={hotel.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelectHotel(hotel.id)}>
                    <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-1/3 relative h-48 sm:h-auto">
                            <Image src={hotel.image} alt={hotel.name} layout="fill" objectFit="cover" data-ai-hint={hotel.hint} />
                        </div>
                        <div className="sm:w-2/3 p-4 flex flex-col justify-between">
                            <div>
                                <CardTitle>{hotel.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{hotel.city}</CardDescription>
                                <div className="flex items-center gap-1 mt-2">{Array.from({ length: hotel.rating }).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}</div>
                                <div className="flex gap-2 mt-2">
                                    {hotel.facilities.map(fac => {
                                        const Icon = facilityIcons[fac as keyof typeof facilityIcons];
                                        return <Icon key={fac} className="h-5 w-5 text-muted-foreground" />;
                                    })}
                                </div>
                            </div>
                            <div className="text-right mt-4 sm:mt-0">
                                <p className="text-xl font-bold">₦{hotel.price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">per night</p>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function HotelDetailsView({ hotel, rooms, searchData, onBook }: { hotel: typeof mockHotels[0], rooms: typeof mockRooms, searchData: SearchFormData, onBook: (data: BookingFormData, room: typeof mockRooms[0]) => void }) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: { fullName: '', email: '', phone: '' },
    });
    
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    const numberOfNights = differenceInDays(searchData.dates.to!, searchData.dates.from!);
    const totalAmount = selectedRoom ? selectedRoom.price * numberOfNights : 0;

    const onSubmit = (data: BookingFormData) => {
        if (!selectedRoom) return;
        onBook(data, selectedRoom);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{hotel.name}</CardTitle>
                <CardDescription>{hotel.city}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-48 w-full relative rounded-lg overflow-hidden"><Image src={hotel.image} alt={hotel.name} layout="fill" objectFit="cover" data-ai-hint={hotel.hint} /></div>
                
                <div>
                    <h3 className="font-semibold mb-2">Available Rooms</h3>
                    <div className="space-y-2">
                        {rooms.map(room => (
                            <div key={room.id} className={cn("p-4 border rounded-lg cursor-pointer", selectedRoomId === room.id && "border-primary ring-2 ring-primary")} onClick={() => setSelectedRoomId(room.id)}>
                                <div className="flex justify-between">
                                    <p className="font-semibold">{room.name}</p>
                                    <p className="font-bold">₦{room.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                                </div>
                                <p className="text-sm text-muted-foreground">{room.bed}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedRoom && (
                    <Form {...form}>
                        <form id="booking-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Separator />
                            <h3 className="font-semibold">Guest Details</h3>
                            <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="as on ID" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="for booking confirmation" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-lg"><p>Total ({numberOfNights} nights):</p><p>₦{totalAmount.toLocaleString()}</p></div>
                        </form>
                    </Form>
                )}
            </CardContent>
            <CardFooter>
                 <Button form="booking-form" type="submit" className="w-full" disabled={!selectedRoom}>Proceed to Payment</Button>
            </CardFooter>
        </Card>
    );
}

function PaymentView({ onPay, onBack, totalAmount }: { onPay: () => void, onBack: () => void, totalAmount: number }) {
    const walletBalance = 1250345;
    const hasSufficientFunds = walletBalance >= totalAmount;

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <CardTitle>Confirm Payment</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center font-bold text-2xl"><p>Total Amount:</p><p>₦{totalAmount.toLocaleString()}</p></div>
                 <Alert variant={hasSufficientFunds ? "default" : "destructive"}>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                    <AlertDescription>
                        {hasSufficientFunds ? `Your balance of ₦${walletBalance.toLocaleString()} is sufficient.` : `Your balance of ₦${walletBalance.toLocaleString()} is insufficient.`}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={onPay} disabled={!hasSufficientFunds}>
                    {hasSufficientFunds ? 'Pay Now' : 'Insufficient Funds'}
                 </Button>
            </CardFooter>
        </Card>
    );
}

function ConfirmationView({ hotel, room, searchData, bookingData, onReset }: { hotel: any, room: any, searchData: any, bookingData: any, onReset: () => void }) {
    const { toast } = useToast();
    const numberOfNights = differenceInDays(searchData.dates.to!, searchData.dates.from!);
    const totalAmount = room.price * numberOfNights;
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <CardTitle className="mt-4 text-2xl">Booking Confirmed!</CardTitle>
                <CardDescription>Your reservation at {hotel.name} is complete.</CardDescription>
            </CardHeader>
            <CardContent className="text-left bg-muted p-4 rounded-lg space-y-2">
                 <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref.</span><span className="font-semibold font-mono">H-{Date.now().toString().slice(-6)}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-semibold">{bookingData.fullName}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-semibold">{format(searchData.dates.from, 'PPP')}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-semibold">{format(searchData.dates.to, 'PPP')}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-semibold">₦{totalAmount.toLocaleString()}</span></div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
                 <Button className="w-full" onClick={() => toast({ title: "Receipt Downloaded" })}><Download className="mr-2" /> Download Receipt</Button>
                 <Button variant="outline" className="w-full" onClick={onReset}>Book Another Hotel</Button>
            </CardFooter>
        </Card>
    )
}

function BookingHistoryView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>A list of your past and upcoming hotel stays.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hotel</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockBookings.map(b => (
                            <TableRow key={b.id}>
                                <TableCell>{b.hotelName}</TableCell>
                                <TableCell>{format(new Date(b.checkIn), 'MMM d')} - {format(new Date(b.checkOut), 'MMM d, yyyy')}</TableCell>
                                <TableCell><Badge variant={b.status === 'Completed' ? 'secondary' : 'default'}>{b.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">View</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export function HotelBooking() {
  const [view, setView] = useState<'search' | 'results' | 'details' | 'payment' | 'confirmation'>('search');
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [filteredHotels, setFilteredHotels] = useState<typeof mockHotels>([]);
  const [selectedHotel, setSelectedHotel] = useState<(typeof mockHotels)[0] | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<(typeof mockRooms)[0] | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSearch = (data: SearchFormData) => {
    setIsProcessing(true);
    setTimeout(() => {
        setSearchData(data);
        const results = mockHotels.filter(h => h.city.toLowerCase().includes(data.location.toLowerCase()) || h.name.toLowerCase().includes(data.location.toLowerCase()));
        setFilteredHotels(results);
        setView('results');
        setIsProcessing(false);
    }, 1500);
  };
  
  const handleSelectHotel = (hotelId: string) => {
      setSelectedHotel(mockHotels.find(h => h.id === hotelId) || null);
      setView('details');
  };

  const handleBook = (data: BookingFormData, room: typeof mockRooms[0]) => {
      setBookingData(data);
      setSelectedRoom(room);
      setView('payment');
  };
  
  const handlePay = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setView('confirmation');
          setIsProcessing(false);
          toast({ title: "Booking Confirmed!", description: `Your payment was successful.`})
      }, 1500);
  };

  const reset = () => {
      setView('search');
      setSearchData(null);
      setFilteredHotels([]);
      setSelectedHotel(null);
      setSelectedRoom(null);
      setBookingData(null);
  };

  const renderContent = () => {
    switch(view) {
        case 'results':
            return <div><Button variant="link" onClick={reset}><ArrowLeft className="mr-2"/>New Search</Button><HotelResultsView hotels={filteredHotels} onSelectHotel={handleSelectHotel} /></div>;
        case 'details':
            return <div><Button variant="link" onClick={() => setView('results')}><ArrowLeft className="mr-2"/>Back to Results</Button><HotelDetailsView hotel={selectedHotel!} rooms={mockRooms.filter(r => r.hotelId === selectedHotel?.id)} searchData={searchData!} onBook={handleBook} /></div>
        case 'payment':
            const numberOfNights = differenceInDays(searchData!.dates.to!, searchData!.dates.from!);
            const totalAmount = selectedRoom!.price * numberOfNights;
            return <PaymentView onPay={handlePay} onBack={() => setView('details')} totalAmount={totalAmount} />;
        case 'confirmation':
            return <ConfirmationView hotel={selectedHotel} room={selectedRoom} searchData={searchData} bookingData={bookingData} onReset={reset} />;
        case 'search':
        default:
            return <HotelSearchForm onSearch={handleSearch} isSearching={isProcessing}/>;
    }
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Hotel Booking</h2>
        </div>
      <Tabs defaultValue="book_hotel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book_hotel">Book a Hotel</TabsTrigger>
            <TabsTrigger value="history">My Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="book_hotel" className="pt-6">
            {isProcessing && view !== 'search' ? (
                <Card className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></Card>
            ) : renderContent()}
        </TabsContent>
        <TabsContent value="history" className="pt-6">
            <BookingHistoryView />
        </TabsContent>
      </Tabs>
    </>
  );
}
