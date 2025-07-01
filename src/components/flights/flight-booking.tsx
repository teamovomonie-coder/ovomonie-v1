
"use client";

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Plane, ArrowLeft, ArrowRight, CalendarIcon, Users, User, Trash2, Wallet, CheckCircle, Info, Loader2, Download, Minus, Plus } from 'lucide-react';

// --- Mock Data & Schemas ---

const airports = [
    { code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos' },
    { code: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja' },
    { code: 'PHC', name: 'Port Harcourt International Airport', city: 'Port Harcourt' },
    { code: 'KAN', name: 'Mallam Aminu Kano International Airport', city: 'Kano' },
    { code: 'ENU', name: 'Akanu Ibiam International Airport', city: 'Enugu' },
];

const airlines = [
    { code: 'P4', name: 'Air Peace' },
    { code: '9J', name: 'Dana Air' },
    { code: 'W3', name: 'Arik Air' },
    { code: 'Q9', name: 'Ibom Air' },
];

interface Flight {
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

// --- Sub-components for each step of the flow ---

function FlightSearchForm({ onSearch, isSearching }: { onSearch: (data: SearchFormData) => void; isSearching: boolean; }) {
    const form = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { tripType: 'oneWay', from: '', to: '', passengers: 1, travelClass: 'Economy' },
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

function FlightResultsView({ searchData, flights, onSelectFlight }: { searchData: SearchFormData, flights: Flight[], onSelectFlight: (flight: Flight) => void }) {
    const fromAirport = airports.find(a => a.code === searchData.from)?.city;
    const toAirport = airports.find(a => a.code === searchData.to)?.city;
    
    return (
        <div className="space-y-4">
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

function PassengerDetailsView({ flight, searchData, onBook }: { flight: Flight, searchData: SearchFormData, onBook: (data: BookingFormData) => void }) {
    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            passengers: Array.from({ length: searchData.passengers }, () => ({ fullName: '', email: '', phone: '' })),
        }
    });
    const { fields } = useFieldArray({ control: form.control, name: "passengers" });
    const totalAmount = flight.price * searchData.passengers;

    return (
        <Card>
            <CardHeader>
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

function PaymentView({ flight, searchData, bookingData, onPay, onBack }: { flight: Flight, searchData: SearchFormData, bookingData: BookingFormData, onPay: () => void, onBack: () => void }) {
    const totalAmount = flight.price * searchData.passengers;
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
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Flight</span><span className="font-semibold">{flight.airline.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="font-semibold">{flight.departure.airport} &rarr; {flight.arrival.airport}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{flight.departure.time} - {flight.arrival.time}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Passengers</span><span className="font-semibold">{searchData.passengers}</span></div>
                </div>
                <div className="flex justify-between items-center font-bold text-2xl"><p>Total:</p><p>₦{totalAmount.toLocaleString()}</p></div>
                 <Alert variant={hasSufficientFunds ? "default" : "destructive"}>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                    <AlertDescription>
                        {hasSufficientFunds ? (
                            `Your balance of ₦${walletBalance.toLocaleString()} is sufficient. The total amount will be deducted.`
                        ) : (
                             `Your balance of ₦${walletBalance.toLocaleString()} is insufficient.`
                        )}
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

function ConfirmationView({ flight, searchData, bookingData, onReset }: { flight: Flight, searchData: SearchFormData, bookingData: BookingFormData, onReset: () => void }) {
    const { toast } = useToast();
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <CardTitle className="mt-4 text-2xl">Booking Successful!</CardTitle>
                <CardDescription>Your e-ticket has been sent to {bookingData.passengers[0].email}.</CardDescription>
            </CardHeader>
            <CardContent className="text-left bg-muted p-4 rounded-lg space-y-2">
                 <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref.</span><span className="font-semibold font-mono">XYZ-12345</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="font-semibold">{searchData.from} &rarr; {searchData.to}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Flight Time</span><span className="font-semibold">{flight.departure.time} - {flight.arrival.time}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Passengers</span><span className="font-semibold">{bookingData.passengers.map(p => p.fullName).join(', ')}</span></div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
                 <Button className="w-full" onClick={() => toast({ title: "E-Ticket Downloaded" })}><Download className="mr-2" /> Download E-Ticket</Button>
                 <Button variant="outline" className="w-full" onClick={onReset}>Book Another Flight</Button>
            </CardFooter>
        </Card>
    )
}

function BookingHistory() {
    return ( <Card> <CardHeader> <CardTitle>My Bookings</CardTitle> <CardDescription>A list of your past and upcoming flights.</CardDescription> </CardHeader> <CardContent> <Table> <TableHeader> <TableRow> <TableHead>Route</TableHead> <TableHead>Date</TableHead> <TableHead>Status</TableHead> <TableHead className="text-right">Action</TableHead> </TableRow> </TableHeader> <TableBody> <TableRow> <TableCell>Lagos (LOS) &rarr; Abuja (ABV)</TableCell> <TableCell>2024-08-15</TableCell> <TableCell><Badge>Upcoming</Badge></TableCell> <TableCell className="text-right"> <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button> </TableCell> </TableRow> <TableRow> <TableCell>Kano (KAN) &rarr; Lagos (LOS)</TableCell> <TableCell>2024-06-01</TableCell> <TableCell><Badge variant="secondary">Completed</Badge></TableCell> <TableCell className="text-right"> <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button> </TableCell> </TableRow> </TableBody> </Table> </CardContent> </Card> )
}


export function FlightBooking() {
  const [view, setView] = useState<'search' | 'results' | 'details' | 'payment' | 'confirmation'>('search');
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [mockFlights, setMockFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const handleSearch = (data: SearchFormData) => {
    setIsSearching(true);
    setTimeout(() => {
        setSearchData(data);
        const generatedFlights: Flight[] = [
            { id: 'flight-1', airline: airlines[0], departure: { airport: data.from, time: '08:00' }, arrival: { airport: data.to, time: '09:15' }, duration: '1h 15m', price: 45500 },
            { id: 'flight-2', airline: airlines[3], departure: { airport: data.from, time: '10:30' }, arrival: { airport: data.to, time: '11:45' }, duration: '1h 15m', price: 48000 },
            { id: 'flight-3', airline: airlines[2], departure: { airport: data.from, time: '14:00' }, arrival: { airport: data.to, time: '15:15' }, duration: '1h 15m', price: 52000 },
        ];
        setMockFlights(generatedFlights);
        setView('results');
        setIsSearching(false);
    }, 1500);
  };
  
  const handleSelectFlight = (flight: Flight) => {
      setSelectedFlight(flight);
      setView('details');
  };

  const handleBook = (data: BookingFormData) => {
      setBookingData(data);
      setView('payment');
  };
  
  const handlePay = () => {
      setIsBooking(true);
      setTimeout(() => {
          setView('confirmation');
          setIsBooking(false);
      }, 1500);
  };

  const reset = () => {
      setView('search');
      setSearchData(null);
      setMockFlights([]);
      setSelectedFlight(null);
      setBookingData(null);
  };

  const renderContent = () => {
    switch(view) {
        case 'results':
            return <div><Button variant="link" onClick={reset}><ArrowLeft className="mr-2"/>New Search</Button><FlightResultsView searchData={searchData!} flights={mockFlights} onSelectFlight={handleSelectFlight} /></div>;
        case 'details':
            return <div><Button variant="link" onClick={() => setView('results')}><ArrowLeft className="mr-2"/>Back to Results</Button><PassengerDetailsView flight={selectedFlight!} searchData={searchData!} onBook={handleBook} /></div>
        case 'payment':
            return <PaymentView flight={selectedFlight!} searchData={searchData!} bookingData={bookingData!} onPay={handlePay} onBack={() => setView('details')} />;
        case 'confirmation':
            return <ConfirmationView flight={selectedFlight!} searchData={searchData!} bookingData={bookingData!} onReset={reset} />;
        case 'search':
        default:
            return <FlightSearchForm onSearch={handleSearch} isSearching={isSearching}/>;
    }
  }

  return (
    <Tabs defaultValue="search_flight" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search_flight">Book a Flight</TabsTrigger>
        <TabsTrigger value="history">My Bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="search_flight" className="pt-6">
        {isBooking ? (
             <Card className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></Card>
        ) : renderContent()}
      </TabsContent>
      <TabsContent value="history" className="pt-6">
        <BookingHistory />
      </TabsContent>
    </Tabs>
  );
}
