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

import { Plane, ArrowRight, CalendarIcon, Users, User, Trash2, Wallet, CheckCircle, Info, Loader2, Download } from 'lucide-react';

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

type SearchFormData = z.infer<typeof searchSchema>;

// --- Sub-components for each step of the flow ---

function FlightSearchForm({ onSearch, isSearching }: { onSearch: (data: SearchFormData) => void; isSearching: boolean; }) {
    const form = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            tripType: 'oneWay',
            from: '',
            to: '',
            passengers: 1,
            travelClass: 'Economy',
        },
    });

    const tripType = form.watch('tripType');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
                <div className="flex items-center gap-4">
                    <FormField control={form.control} name="tripType" render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="oneWay">One Way</SelectItem>
                                    <SelectItem value="roundTrip">Round Trip</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="from" render={({ field }) => (
                        <FormItem><FormLabel>From</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select departure" /></SelectTrigger></FormControl>
                                <SelectContent>{airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                     )} />
                     <FormField control={form.control} name="to" render={({ field }) => (
                        <FormItem><FormLabel>To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl>
                                <SelectContent>{airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                     )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="departureDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Departure Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button>
                            </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} /></PopoverContent></Popover><FormMessage />
                        </FormItem>
                     )} />
                     {tripType === 'roundTrip' && (
                          <FormField control={form.control} name="returnDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Return Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button>
                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < (form.getValues('departureDate') || new Date())} /></PopoverContent></Popover><FormMessage />
                            </FormItem>
                         )} />
                     )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="passengers" render={({ field }) => (
                        <FormItem><FormLabel>Passengers</FormLabel><FormControl><Input type="number" min="1" max="9" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="travelClass" render={({ field }) => (
                        <FormItem><FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Economy">Economy</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="First">First Class</SelectItem>
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                      )} />
                 </div>
                 <Button type="submit" className="w-full" disabled={isSearching}>
                    {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Search Flights
                 </Button>
            </form>
        </Form>
    );
}

// ... other components to be defined in FlightBookingFlow

function FlightBookingFlow() {
    const [view, setView] = useState('search');
    const [searchData, setSearchData] = useState<SearchFormData | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleSearch = (data: SearchFormData) => {
        setIsSearching(true);
        setTimeout(() => {
            setSearchData(data);
            setView('results');
            setIsSearching(false);
        }, 1500);
    }
    
    const renderContent = () => {
        switch(view) {
            case 'search':
                return <FlightSearchForm onSearch={handleSearch} isSearching={isSearching}/>;
            case 'results':
                return (
                    <div>
                        <Button variant="link" onClick={() => setView('search')}>&larr; Modify Search</Button>
                        <p className="text-center font-bold text-lg mt-4">Search results for {searchData?.from} to {searchData?.to}</p>
                        <p className="text-center text-muted-foreground">This is a mock result. Select any flight to continue.</p>
                        <Card className="mt-4">
                            <CardContent className="p-4 flex items-center justify-between">
                                 <div>
                                    <p className="font-bold">Air Peace</p>
                                    <p className="text-sm text-muted-foreground">08:00 (LOS) - 09:15 (ABV)</p>
                                    <p className="text-xs">Duration: 1h 15m</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦45,500</p>
                                    <Button size="sm" onClick={() => setView('details')}>Select</Button>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="mt-4">
                            <CardContent className="p-4 flex items-center justify-between">
                                 <div>
                                    <p className="font-bold">Ibom Air</p>
                                    <p className="text-sm text-muted-foreground">10:30 (LOS) - 11:45 (ABV)</p>
                                     <p className="text-xs">Duration: 1h 15m</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦48,000</p>
                                    <Button size="sm" onClick={() => setView('details')}>Select</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'details':
                 return (
                    <div>
                        <Button variant="link" onClick={() => setView('results')}>&larr; Back to Results</Button>
                        <Card className="mt-2">
                             <CardHeader><CardTitle>Passenger Details</CardTitle><CardDescription>Please enter the details for all passengers.</CardDescription></CardHeader>
                             <CardContent className="space-y-4">
                                <Input placeholder="Full Name" />
                                <Input type="email" placeholder="Email Address" />
                                <Input type="tel" placeholder="Phone Number" />
                             </CardContent>
                             <CardFooter>
                                 <Button className="w-full" onClick={() => setView('payment')}>Proceed to Payment</Button>
                             </CardFooter>
                        </Card>
                    </div>
                 );
            case 'payment':
                return (
                     <div>
                        <Button variant="link" onClick={() => setView('details')}>&larr; Back to Details</Button>
                        <Card className="mt-2">
                             <CardHeader><CardTitle>Confirm Payment</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <div className="flex justify-between font-bold text-lg"><p>Total:</p><p>₦45,500</p></div>
                                <Alert>
                                    <Wallet className="h-4 w-4" />
                                    <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                                    <AlertDescription>The total amount will be deducted from your wallet balance.</AlertDescription>
                                </Alert>
                                <div className="text-sm">Your wallet balance: <span className="font-bold">₦1,250,345.00</span></div>
                             </CardContent>
                             <CardFooter>
                                 <Button className="w-full" onClick={() => setView('confirmation')}>Pay Now</Button>
                             </CardFooter>
                        </Card>
                    </div>
                )
            case 'confirmation':
                 return (
                     <div className="text-center p-4">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold">Booking Successful!</h2>
                        <p className="text-muted-foreground">Your e-ticket has been sent to your email.</p>
                        <Card className="mt-4 text-left">
                            <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>Booking Reference:</strong> WKN-XYZ123</p>
                                <p><strong>Route:</strong> Lagos (LOS) to Abuja (ABV)</p>
                                <p><strong>Airline:</strong> Air Peace</p>
                            </CardContent>
                        </Card>
                        <Button className="mt-6 w-full" onClick={() => setView('search')}>Book Another Flight</Button>
                     </div>
                 )
            default:
                return <FlightSearchForm onSearch={handleSearch} isSearching={isSearching}/>;
        }
    }

    return <div>{renderContent()}</div>
}

function BookingHistory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>A list of your past and upcoming flights.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Route</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell>Lagos (LOS) &rarr; Abuja (ABV)</TableCell>
                            <TableCell>2024-08-15</TableCell>
                            <TableCell><Badge>Upcoming</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                            </TableCell>
                         </TableRow>
                         <TableRow>
                            <TableCell>Kano (KAN) &rarr; Lagos (LOS)</TableCell>
                            <TableCell>2024-06-01</TableCell>
                            <TableCell><Badge variant="secondary">Completed</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                            </TableCell>
                         </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export function FlightBooking() {
  return (
    <Tabs defaultValue="search_flight" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search_flight">Book a Flight</TabsTrigger>
        <TabsTrigger value="history">My Bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="search_flight" className="pt-6">
        <FlightBookingFlow />
      </TabsContent>
      <TabsContent value="history" className="pt-6">
        <BookingHistory />
      </TabsContent>
    </Tabs>
  );
}
