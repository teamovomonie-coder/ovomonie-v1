
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

import { Plane, ArrowLeft, CalendarIcon, Users, Wallet, CheckCircle, Loader2, Download, Minus, Plus } from 'lucide-react';

const airports = [
    { code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos' },
    { code: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja' },
    { code: 'PHC', name: 'Port Harcourt International Airport', city: 'Port Harcourt' },
    { code: 'KAN', name: 'Mallam Aminu Kano International Airport', city: 'Kano' },
    { code: 'ENU', name: 'Akanu Ibiam International Airport', city: 'Enugu' },
];

export interface Flight {
    id: string;
    airline: { code: string; name: string };
    departure: { airport: string; time: string };
    arrival: { airport: string; time: string };
    duration: string;
    price: number;
}

const searchSchema = z.object({
    tripType: z.enum(['oneWay', 'roundTrip']),
    from: z.string().min(1, 'Please select a departure airport.'),
    to: z.string().min(1, 'Please select a destination airport.'),
    departureDate: z.date({ required_error: 'Departure date is required.' }),
    returnDate: z.date().optional(),
    passengers: z.coerce.number().min(1).max(9),
    travelClass: z.enum(['Economy', 'Business', 'First']),
}).refine(data => data.from !== data.to, {
    message: "Departure and destination airports cannot be the same.",
    path: ["to"],
}).refine(data => {
    return data.tripType === 'roundTrip' ? !!data.returnDate : true;
}, {
    message: 'Return date is required for round trip.',
    path: ['returnDate'],
});

const passengerSchema = z.object({
    fullName: z.string().min(3, 'Full name is required.'),
    email: z.string().email('A valid email is required for the e-ticket.'),
    phone: z.string().min(10, 'A valid phone number is required.'),
});

const bookingSchema = z.object({
    passengers: z.array(passengerSchema),
});

type SearchFormData = z.infer<typeof searchSchema>;
type BookingFormData = z.infer<typeof bookingSchema>;
type View = 'search' | 'results' | 'details' | 'payment' | 'confirmation';


function FlightSearchForm({ onSearch, isSearching }: { onSearch: (data: SearchFormData) => void; isSearching: boolean; }) {
    const form = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { tripType: 'oneWay', from: '', to: '', passengers: 1, travelClass: 'Economy', departureDate: new Date() },
    });
    const tripType = form.watch('tripType');

    const handlePassengerChange = (amount: number) => {
        const current = form.getValues('passengers');
        const newValue = Math.max(1, Math.min(9, current + amount));
        form.setValue('passengers', newValue);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
                <Tabs defaultValue="oneWay" onValueChange={(value) => form.setValue('tripType', value as 'oneWay' | 'roundTrip')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="oneWay">One Way</TabsTrigger>
                        <TabsTrigger value="roundTrip">Round Trip</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <FormField control={form.control} name="from" render={({ field }) => ( <FormItem><FormLabel>From</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select departure" /></SelectTrigger></FormControl><SelectContent>{airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="to" render={({ field }) => ( <FormItem><FormLabel>To</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl><SelectContent>{airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="departureDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Departure Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                     {tripType === 'roundTrip' && ( <FormField control={form.control} name="returnDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Return Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < (form.getValues('departureDate') || new Date())} /></PopoverContent></Popover><FormMessage /></FormItem> )} /> )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="passengers" render={({ field }) => (
                        <FormItem><FormLabel>Passengers</FormLabel>
                            <div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => handlePassengerChange(-1)}><Minus /></Button><FormControl><Input className="text-center" {...field} readOnly /></FormControl><Button type="button" variant="outline" size="icon" onClick={() => handlePassengerChange(1)}><Plus /></Button></div>
                        <FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="travelClass" render={({ field }) => ( <FormItem><FormLabel>Class</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Economy">Economy</SelectItem><SelectItem value="Business">Business</SelectItem><SelectItem value="First">First Class</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                 </div>
                 <Button type="submit" className="w-full !mt-8" disabled={isSearching}>{isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search Flights</Button>
            </form>
        </Form>
    );
}

function FlightResultsView({ searchData, flights, onSelectFlight, onBack }: { searchData: SearchFormData, flights: Flight[], onSelectFlight: (flight: Flight) => void, onBack: () => void }) {
    const fromAirport = airports.find(a => a.code === searchData.from)?.city;
    const toAirport = airports.find(a => a.code === searchData.to)?.city;
    
    return (
        <div className="space-y-4">
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2"/>New Search</Button>
             <div className="text-center">
                <h3 className="text-xl font-bold">Flights from {fromAirport} to {toAirport}</h3>
                <p className="text-muted-foreground">{format(searchData.departureDate, 'PPP')} | {searchData.passengers} Passenger(s)</p>
            </div>
            {flights.length === 0 ? (
                <Card className="text-center py-10">
                    <CardContent>
                        <p className="text-muted-foreground">No flights found for this route. Please try another search.</p>
                    </CardContent>
                </Card>
            ) : (
                flights.map(flight => (
                    <Card key={flight.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between gap-2 md:gap-4">
                            <div className="flex items-center gap-2 md:gap-4 flex-1">
                                <Plane className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-bold">{flight.airline.name}</p>
                                    <p className="text-xs text-muted-foreground">{flight.departure.time} ({flight.departure.airport}) &rarr; {flight.arrival.time} ({flight.arrival.airport})</p>
                                    <p className="text-xs font-semibold">{flight.duration}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                 <p className="text-xl font-bold">₦{flight.price.toLocaleString()}</p>
                                 <p className="text-xs text-muted-foreground">per person</p>
                                 <Button size="sm" className="mt-2" onClick={() => onSelectFlight(flight)}>Select</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}

function PassengerDetailsView({ flight, searchData, onBook, onBack }: { flight: Flight, searchData: SearchFormData, onBook: (data: BookingFormData) => void, onBack: () => void }) {
    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            passengers: Array.from({ length: searchData.passengers }, () => ({ fullName: '', email: '', phone: '' })),
        }
    });
    const { fields } = useFieldArray({ control: form.control, name: 'passengers' });
    const totalAmount = flight.price * searchData.passengers;

    return (
        <Card>
            <CardHeader>
                 <Button variant="ghost" onClick={onBack} className="-ml-4"><ArrowLeft className="mr-2"/>Back to Flights</Button>
                <CardTitle>Passenger Details</CardTitle>
                <CardDescription>Enter details for all passengers. The e-ticket will be sent to the first passenger's email.</CardDescription>
            </CardHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onBook)}>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4">
                                <h4 className="font-semibold">Passenger {index + 1}</h4>
                                <FormField control={form.control} name={`passengers.${index}.fullName`} render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="as shown on ID" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name={`passengers.${index}.email`} render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name={`passengers.${index}.phone`} render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="08012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        ))}
                         <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <p>Total Amount:</p>
                            <p>₦{totalAmount.toLocaleString()}</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full">Proceed to Payment</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

function ConfirmationView({ booking, onReset }: { booking: any, onReset: () => void }) {
    const { toast } = useToast();
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <CardTitle className="mt-4 text-2xl">Booking Confirmed!</CardTitle>
                <CardDescription>Your e-ticket has been sent to {booking.passengers[0].email}.</CardDescription>
            </CardHeader>
            <CardContent className="text-left bg-muted p-4 rounded-lg space-y-2">
                 <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref.</span><span className="font-semibold font-mono">{booking.bookingReference}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="font-semibold">{booking.flight.departure.airport} &rarr; {booking.flight.arrival.airport}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Flight Time</span><span className="font-semibold">{booking.flight.departure.time} - {booking.flight.arrival.time}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Passengers</span><span className="font-semibold">{booking.passengers.length}</span></div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
                 <Button className="w-full" onClick={() => toast({ title: "E-Ticket Downloaded" })}><Download className="mr-2" /> Download E-Ticket</Button>
                 <Button variant="outline" className="w-full" onClick={onReset}>Book Another Flight</Button>
            </CardFooter>
        </Card>
    )
}

function BookingHistory() {
    return (
        <Card>
            <CardHeader><CardTitle>My Bookings</CardTitle><CardDescription>A list of your past and upcoming flights.</CardDescription></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                        <TableRow><TableCell>Lagos (LOS) &rarr; Abuja (ABV)</TableCell><TableCell>{format(new Date(), 'PP')}</TableCell><TableCell><Badge>Upcoming</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button></TableCell></TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export function FlightBooking() {
  const [view, setView] = useState<View>('search');
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  
  const handleSearch = async (data: SearchFormData) => {
    setIsProcessing(true);
    setSearchData(data);
    try {
        const query = new URLSearchParams({
            from: data.from,
            to: data.to,
            departureDate: data.departureDate.toISOString(),
        }).toString();
        const response = await fetch(`/api/flights/search?${query}`);
        if (!response.ok) throw new Error("Could not fetch flights.");
        const results = await response.json();
        setFlights(results);
        setView('results');
    } catch(err) {
        toast({ variant: 'destructive', title: 'Search Failed', description: (err as Error).message });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleSelectFlight = (flight: Flight) => {
      setSelectedFlight(flight);
      setView('details');
  };

  const handleBook = (data: BookingFormData) => {
      setBookingData(data);
      setIsPinModalOpen(true);
  };
  
  const handlePay = async () => {
    if (!selectedFlight || !bookingData || !searchData) return;
    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/flights/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                flight: selectedFlight,
                passengers: bookingData.passengers,
                searchData,
                clientReference: `flight-book-${crypto.randomUUID()}`
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Booking failed.");
        
        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: "Flight Booked!",
            description: `Your flight to ${airports.find(a=>a.code === selectedFlight.arrival.airport)?.city} is confirmed.`,
            category: 'transaction',
        });
        toast({ title: "Booking Successful!" });
        setBookingData(prev => ({...prev!, bookingReference: result.bookingReference}));
        setView('confirmation');

    } catch (err) {
        setApiError((err as Error).message);
    } finally {
        setIsProcessing(false);
        setIsPinModalOpen(false);
    }
  };

  const reset = () => {
      setView('search');
      setSearchData(null);
      setFlights([]);
      setSelectedFlight(null);
      setBookingData(null);
  };

  const renderContent = () => {
    switch(view) {
        case 'results':
            return <FlightResultsView searchData={searchData!} flights={flights} onSelectFlight={handleSelectFlight} onBack={reset} />;
        case 'details':
            return <PassengerDetailsView flight={selectedFlight!} searchData={searchData!} onBook={handleBook} onBack={() => setView('results')} />;
        case 'confirmation':
            return <ConfirmationView booking={{...bookingData, flight: selectedFlight}} onReset={reset} />;
        case 'search':
        default:
            return <FlightSearchForm onSearch={handleSearch} isSearching={isProcessing}/>;
    }
  }

  return (
    <>
    <Tabs defaultValue="search_flight" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search_flight">Book a Flight</TabsTrigger>
        <TabsTrigger value="history">My Bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="search_flight" className="pt-6">
        {renderContent()}
      </TabsContent>
      <TabsContent value="history" className="pt-6">
        <BookingHistory />
      </TabsContent>
    </Tabs>
     <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePay}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Authorize Flight Booking"
      />
    </>
  );
}
