
"use client";

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { Plane, ArrowLeft, ArrowRight, CalendarIcon, Users, User, Armchair, Wallet, CheckCircle, Download, Share2, Loader2, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- Mock Data & Types ---

const airports = [
  { code: 'LOS', city: 'Lagos', name: 'Murtala Muhammed Intl.' },
  { code: 'ABV', city: 'Abuja', name: 'Nnamdi Azikiwe Intl.' },
  { code: 'PHC', city: 'Port Harcourt', name: 'Port Harcourt Intl.' },
  { code: 'KAN', city: 'Kano', name: 'Mallam Aminu Kano Intl.' },
  { code: 'ENu', city: 'Enugu', name: 'Akanu Ibiam Intl.' },
];

const airlines = {
  'APK': { name: 'Air Peace', Logo: () => <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm">AP</div> },
  'ARK': { name: 'Arik Air', Logo: () => <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">AK</div> },
  'DAN': { name: 'Dana Air', Logo: () => <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm">DA</div> },
};

type Flight = {
  id: string;
  airlineCode: keyof typeof airlines;
  flightNumber: string;
  departure: { airportCode: string; time: string };
  arrival: { airportCode: string; time: string };
  duration: string;
  price: number;
  seatsLeft: number;
};

const mockFlights: Flight[] = [
  { id: 'FLT001', airlineCode: 'APK', flightNumber: 'APK7124', departure: { airportCode: 'LOS', time: '08:00' }, arrival: { airportCode: 'ABV', time: '09:15' }, duration: '1h 15m', price: 45000, seatsLeft: 12 },
  { id: 'FLT002', airlineCode: 'ARK', flightNumber: 'ARK544', departure: { airportCode: 'LOS', time: '09:30' }, arrival: { airportCode: 'ABV', time: '10:45' }, duration: '1h 15m', price: 48500, seatsLeft: 8 },
  { id: 'FLT003', airlineCode: 'DAN', flightNumber: 'DAN361', departure: { airportCode: 'LOS', time: '11:00' }, arrival: { airportCode: 'ABV', time: '12:20' }, duration: '1h 20m', price: 42500, seatsLeft: 20 },
  { id: 'FLT004', airlineCode: 'APK', flightNumber: 'APK7128', departure: { airportCode: 'LOS', time: '14:00' }, arrival: { airportCode: 'ABV', time: '15:15' }, duration: '1h 15m', price: 55000, seatsLeft: 5 },
];

type View = 'search' | 'results' | 'details' | 'payment' | 'confirmation';

// --- Zod Schemas ---
const searchSchema = z.object({
  from: z.string().min(1, 'Departure airport is required.'),
  to: z.string().min(1, 'Arrival airport is required.'),
  departureDate: z.date({ required_error: "A departure date is required."}),
  passengers: z.coerce.number().min(1, 'At least one passenger is required.'),
});
type SearchCriteria = z.infer<typeof searchSchema>;

const passengerSchema = z.object({
    fullName: z.string().min(3, 'Full name is required.'),
});
const detailsSchema = z.object({
    passengers: z.array(passengerSchema).min(1),
    seats: z.array(z.string()).min(1, "Please select a seat for each passenger."),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

// --- Sub-components ---

function FlightSearchForm({ onSearch, isSearching }: { onSearch: (data: SearchCriteria) => void; isSearching: boolean }) {
  const form = useForm<SearchCriteria>({
    resolver: zodResolver(searchSchema),
    defaultValues: { passengers: 1 },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Your Flight</CardTitle>
        <CardDescription>Find the best deals on domestic and international flights.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSearch)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="from" render={({ field }) => ( <FormItem> <FormLabel>From</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select departure airport" /> </SelectTrigger> </FormControl> <SelectContent> {airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="to" render={({ field }) => ( <FormItem> <FormLabel>To</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select arrival airport" /> </SelectTrigger> </FormControl> <SelectContent> {airports.map(a => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Departure Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="passengers" render={({ field }) => ( <FormItem> <FormLabel>Passengers</FormLabel> <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}> <FormControl> <SelectTrigger> <SelectValue placeholder="Number of passengers" /> </SelectTrigger> </FormControl> <SelectContent> {[1, 2, 3, 4, 5].map(p => <SelectItem key={p} value={String(p)}>{p} Passenger{p > 1 ? 's' : ''}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching && <Loader2 className="animate-spin mr-2" />}
                Search Flights
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function FlightResults({ flights, onSelect, onBack }: { flights: Flight[]; onSelect: (flight: Flight) => void; onBack: () => void; }) {
    if (flights.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                        <CardTitle>No Flights Found</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="text-center py-10">
                    <p className="text-muted-foreground">We couldn't find any flights for your search criteria. Please try different dates or airports.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <CardTitle>Available Flights</CardTitle>
                </div>
                <CardDescription>Select a flight to proceed with your booking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {flights.map(flight => {
                    const airline = airlines[flight.airlineCode];
                    const AirlineLogo = airline.Logo;
                    return (
                        <Card key={flight.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <AirlineLogo />
                                <div>
                                    <p className="font-bold">{flight.departure.time} → {flight.arrival.time}</p>
                                    <p className="text-sm text-muted-foreground">{airline.name} • {flight.duration}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-bold text-lg">₦{flight.price.toLocaleString()}</p>
                                <Button onClick={() => onSelect(flight)}>Select</Button>
                            </div>
                        </Card>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function SeatSelection({ passengerCount, onProceed }: { passengerCount: number, onProceed: (data: DetailsFormData) => void }) {
    const form = useForm<DetailsFormData>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            passengers: Array.from({ length: passengerCount }, () => ({ fullName: '' })),
            seats: [],
        }
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "passengers",
    });

    const selectedSeats = form.watch('seats');

    const handleSeatSelect = (seat: string) => {
        const newSeats = [...selectedSeats];
        if (newSeats.includes(seat)) {
            form.setValue('seats', newSeats.filter(s => s !== seat));
        } else if (newSeats.length < passengerCount) {
            form.setValue('seats', [...newSeats, seat]);
        }
    }

    const seats = Array.from({ length: 15 }, (_, i) => i + 1).flatMap(row => ['A', 'B', 'C', 'D'].map(col => `${row}${col}`));
    const occupiedSeats = ['2A', '2B', '5C', '8D', '10A'];

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onProceed)} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Passenger Details</h3>
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <FormField key={field.id} control={form.control} name={`passengers.${index}.fullName`} render={({ field }) => (
                                    <FormItem><FormLabel>Passenger {index + 1}</FormLabel><FormControl><Input placeholder="Full name as on ID" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Select Your Seats ({selectedSeats.length}/{passengerCount})</h3>
                        <Card className="p-4 bg-muted">
                            <div className="grid grid-cols-4 gap-2">
                                {seats.map(seat => {
                                    const isOccupied = occupiedSeats.includes(seat);
                                    const isSelected = selectedSeats.includes(seat);
                                    return (
                                        <Button key={seat} variant={isSelected ? 'default' : 'outline'} size="sm" className={cn("h-8", isOccupied && "bg-destructive text-destructive-foreground cursor-not-allowed")} disabled={isOccupied} onClick={() => handleSeatSelect(seat)}>{seat}</Button>
                                    );
                                })}
                            </div>
                        </Card>
                        {form.formState.errors.seats && <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.seats.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={selectedSeats.length !== passengerCount}>Continue to Payment</Button>
                </form>
            </Form>
        </div>
    );
}

function PaymentView({ flight, passengers, seats, onPay, isPaying }: { flight: Flight, passengers: { fullName: string }[], seats: string[], onPay: () => void, isPaying: boolean }) {
    const totalAmount = flight.price * passengers.length;
    return (
        <Card>
            <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between font-bold"><span>{flight.departure.airportCode} → {flight.arrival.airportCode}</span><span>₦{flight.price.toLocaleString()} x {passengers.length}</span></div>
                    <p className="text-sm text-muted-foreground">{airlines[flight.airlineCode].name} - {flight.flightNumber}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Passengers</h4>
                    {passengers.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm"><p>{p.fullName}</p><p>Seat: {seats[i]}</p></div>
                    ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-xl">
                    <p>Total</p>
                    <p>₦{totalAmount.toLocaleString()}</p>
                </div>
                <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Pay with Ovomonie</AlertTitle>
                    <AlertDescription>The total amount will be securely deducted from your Ovomonie wallet.</AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={onPay} disabled={isPaying}>
                    {isPaying && <Loader2 className="animate-spin mr-2" />}
                    Pay Now
                </Button>
            </CardFooter>
        </Card>
    );
}

function ConfirmationView({ flight, searchCriteria, passengers, seats, onDone }: { flight: Flight, searchCriteria: SearchCriteria, passengers: {fullName: string}[], seats: string[], onDone: () => void }) {
    const airline = airlines[flight.airlineCode];
    const totalAmount = flight.price * passengers.length;
    return (
         <Card className="max-w-2xl mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <CardTitle>Booking Confirmed!</CardTitle>
                <CardDescription>Your flight is booked. Your e-ticket has been sent to your email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
                <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2"><airline.Logo /> <span className="font-bold">{airline.name}</span></div>
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded">PNR: {Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                    </div>
                     <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-xs text-muted-foreground">From</p><p className="font-bold text-2xl">{flight.departure.airportCode}</p><p>{flight.departure.time}</p></div>
                        <div className="flex items-center justify-center"><Plane className="text-muted-foreground"/></div>
                        <div><p className="text-xs text-muted-foreground">To</p><p className="font-bold text-2xl">{flight.arrival.airportCode}</p><p>{flight.arrival.time}</p></div>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(searchCriteria.departureDate, 'PPP')}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Passengers</span><span className="font-medium">{passengers.map(p => p.fullName).join(', ')}</span></div>
                         <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-medium">{seats.join(', ')}</span></div>
                         <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium">₦{totalAmount.toLocaleString()}</span></div>
                    </div>
                </div>
            </CardContent>
             <CardFooter className="flex-col gap-2">
                <div className="flex w-full gap-2">
                    <Button variant="outline" className="w-full"><Download className="mr-2" /> Download Ticket</Button>
                    <Button variant="outline" className="w-full"><Share2 className="mr-2" /> Share Itinerary</Button>
                </div>
                <Button className="w-full" onClick={onDone}>Done</Button>
            </CardFooter>
        </Card>
    )
}


export function FlightBooking() {
  const [view, setView] = useState<View>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [foundFlights, setFoundFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [passengerDetails, setPassengerDetails] = useState<DetailsFormData | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const { toast } = useToast();

  const handleSearch = (data: SearchCriteria) => {
    setIsSearching(true);
    setTimeout(() => {
        setSearchCriteria(data);
        setFoundFlights(mockFlights);
        setView('results');
        setIsSearching(false);
    }, 1500);
  };
  
  const handleSelectFlight = (flight: Flight) => {
      setSelectedFlight(flight);
      setView('details');
  };

  const handleDetailsSubmit = (data: DetailsFormData) => {
      setPassengerDetails(data);
      setView('payment');
  }

  const handlePay = () => {
      setIsPaying(true);
      setTimeout(() => {
          setView('confirmation');
          setIsPaying(false);
          toast({ title: "Payment Successful", description: "Your flight has been booked." });
      }, 1500);
  };

  const reset = () => {
    setView('search');
    setIsSearching(false);
    setSearchCriteria(null);
    setFoundFlights([]);
    setSelectedFlight(null);
    setPassengerDetails(null);
    setIsPaying(false);
  }

  const renderContent = () => {
    switch(view) {
        case 'search':
            return <FlightSearchForm onSearch={handleSearch} isSearching={isSearching} />;
        case 'results':
            return <FlightResults flights={foundFlights} onSelect={handleSelectFlight} onBack={() => setView('search')} />;
        case 'details':
            return (
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setView('results')}><ArrowLeft/></Button>
                            <CardTitle>Passenger Details & Seat Selection</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                       {searchCriteria && <SeatSelection passengerCount={searchCriteria.passengers} onProceed={handleDetailsSubmit} />}
                    </CardContent>
                </Card>
            )
        case 'payment':
            if (!selectedFlight || !passengerDetails || !searchCriteria) return null;
            return <PaymentView flight={selectedFlight} passengers={passengerDetails.passengers} seats={passengerDetails.seats} onPay={handlePay} isPaying={isPaying} />;
        case 'confirmation':
            if (!selectedFlight || !passengerDetails || !searchCriteria) return null;
            return <ConfirmationView flight={selectedFlight} searchCriteria={searchCriteria} passengers={passengerDetails.passengers} seats={passengerDetails.seats} onDone={reset} />;
        default:
            return <FlightSearchForm onSearch={handleSearch} isSearching={isSearching} />;
    }
  }

  return <div className="max-w-4xl mx-auto">{renderContent()}</div>;
}
