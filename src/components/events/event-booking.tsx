
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


// UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { Ticket, Search, MapPin, Music, Mic, Dumbbell, ArrowLeft, Plus, Minus, Wallet, CheckCircle, Loader2, Download, QrCode, Users, TrendingUp } from 'lucide-react';

// Types & Mock Data
type View = 'discovery' | 'details' | 'payment' | 'confirmation';
type EventCategory = 'All' | 'Music' | 'Comedy' | 'Sports' | 'Conference';

interface Event {
    id: string;
    name: string;
    category: EventCategory;
    date: Date;
    venue: string;
    city: string;
    image: string;
    description: string;
    hint: string;
}

interface TicketType {
    id: string;
    name: string;
    price: number;
}

interface UserBooking {
    id: string;
    eventName: string;
    date: Date;
    venue: string;
    status: 'Upcoming' | 'Completed';
}

interface BookingDetails {
    event: Event;
    tickets: { ticketTypeId: string; name: string; quantity: number; price: number }[];
    total: number;
}

const mockEvents: Event[] = [
    { id: 'evt-1', name: 'Burna Boy Live in Lagos', category: 'Music', date: new Date('2024-12-25'), venue: 'Eko Atlantic', city: 'Lagos', image: 'https://placehold.co/600x400.png', description: 'Experience the African Giant live on stage this Christmas!', hint: 'concert stage' },
    { id: 'evt-2', name: 'Basketmouth: Uncensored', category: 'Comedy', date: new Date('2024-11-10'), venue: 'Eko Hotel & Suites', city: 'Lagos', image: 'https://placehold.co/600x400.png', description: 'A night of raw, unfiltered comedy with the legendary Basketmouth.', hint: 'comedy show' },
    { id: 'evt-3', name: 'Nigeria vs Ghana AFCON Qualifier', category: 'Sports', date: new Date('2024-10-05'), venue: 'Godswill Akpabio Stadium', city: 'Uyo', image: 'https://placehold.co/600x400.png', description: 'The West African derby returns! Witness the clash of titans.', hint: 'soccer stadium' },
    { id: 'evt-4', name: 'Fintech Nigeria Summit', category: 'Conference', date: new Date('2024-09-20'), venue: 'Landmark Centre', city: 'Lagos', image: 'https://placehold.co/600x400.png', description: 'The biggest gathering of financial technology experts in West Africa.', hint: 'conference room' },
];

const mockTickets: Record<string, TicketType[]> = {
    'evt-1': [{ id: 'tix-1a', name: 'Regular', price: 15000 }, { id: 'tix-1b', name: 'VIP', price: 50000 }],
    'evt-2': [{ id: 'tix-2a', name: 'Regular', price: 10000 }, { id: 'tix-2b', name: 'Table of 10', price: 500000 }],
    'evt-3': [{ id: 'tix-3a', name: 'Regular', price: 5000 }, { id: 'tix-3b', name: 'VIP', price: 20000 }],
    'evt-4': [{ id: 'tix-4a', name: 'Delegate Pass', price: 25000 }, { id: 'tix-4b', name: 'Exhibitor Pass', price: 100000 }],
};

const mockUserBookings: UserBooking[] = [
    { id: 'book-1', eventName: 'Davido Timeless Concert', date: new Date('2024-08-15'), venue: 'Abuja National Stadium', status: 'Upcoming' },
    { id: 'book-2', eventName: 'TechCrunch Lagos', date: new Date('2024-06-01'), venue: 'Civic Centre', status: 'Completed' },
];

function OrganizerView() {
    const interestFormSchema = z.object({
        organizerName: z.string().min(3, "Please enter your name or company name."),
        email: z.string().email("Please enter a valid email address."),
        phone: z.string().min(10, "A valid phone number is required."),
        eventName: z.string().min(5, "Tell us the name of your event."),
        eventDescription: z.string().min(20, "Please provide a brief description of your event.").max(500, "Description is too long."),
    });

    const form = useForm<z.infer<typeof interestFormSchema>>({
        resolver: zodResolver(interestFormSchema),
        defaultValues: {
            organizerName: "",
            email: "",
            phone: "",
            eventName: "",
            eventDescription: "",
        },
    });
    
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 1500));
        setIsLoading(false);
        setIsSubmitted(true);
        form.reset();
        toast({ title: "Thank you!", description: "Your interest has been recorded. Our team will contact you shortly." });
    };

    if (isSubmitted) {
        return (
             <Card className="text-center py-20">
                <CardHeader className="items-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle>Submission Received!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Thank you for your interest in hosting with Ovomonie. We will review your submission and get back to you within 2-3 business days.</p>
                </CardContent>
                <CardFooter>
                     <Button className="w-full" onClick={() => setIsSubmitted(false)}>Submit Another Event</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Host Your Event with Ovomonie</CardTitle>
                <CardDescription>Reach millions of users and manage your ticket sales seamlessly. Fill out the form below to get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Why Partner with Ovomonie?</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3"><Ticket className="h-6 w-6 text-primary flex-shrink-0"/><p><strong>Seamless Ticketing:</strong> Sell tickets directly within the app your audience already trusts.</p></li>
                            <li className="flex gap-3"><Users className="h-6 w-6 text-primary flex-shrink-0"/><p><strong>Vast Audience:</strong> Reach our large and engaged user base across Nigeria.</p></li>
                            <li className="flex gap-3"><Wallet className="h-6 w-6 text-primary flex-shrink-0"/><p><strong>Secure Payments:</strong> Instant and secure payment processing directly to your account.</p></li>
                            <li className="flex gap-3"><TrendingUp className="h-6 w-6 text-primary flex-shrink-0"/><p><strong>Real-time Analytics:</strong> Track sales and monitor your event's performance from your dashboard.</p></li>
                        </ul>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="organizerName" render={({ field }) => <FormItem><FormLabel>Your Name / Company</FormLabel><FormControl><Input placeholder="e.g., Starboy Fest Inc." {...field} /></FormControl><FormMessage /></FormItem>} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input type="tel" placeholder="080..." {...field} /></FormControl><FormMessage /></FormItem>} />
                            </div>
                            <FormField control={form.control} name="eventName" render={({ field }) => <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="e.g., Lagos Food Festival" {...field} /></FormControl><FormMessage /></FormItem>} />
                            <FormField control={form.control} name="eventDescription" render={({ field }) => <FormItem><FormLabel>Brief Event Description</FormLabel><FormControl><Textarea placeholder="Tell us about your event..." {...field} /></FormControl><FormMessage /></FormItem>} />
                            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Interest</Button>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}

// Main Component
export function EventBooking() {
    const [view, setView] = useState<View>('discovery');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSelectEvent = (event: Event) => {
        setSelectedEvent(event);
        setView('details');
    };

    const handleBook = (details: Omit<BookingDetails, 'event'>) => {
        if (!selectedEvent) return;
        setBookingDetails({ event: selectedEvent, ...details });
        setView('payment');
    };

    const handleConfirmPayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setView('confirmation');
            setIsProcessing(false);
        }, 1500);
    };

    const reset = () => {
        setView('discovery');
        setSelectedEvent(null);
        setBookingDetails(null);
    };

    const renderDiscoveryFlow = () => {
        switch (view) {
            case 'details': return <DetailsView event={selectedEvent!} onBook={handleBook} onBack={reset} />;
            case 'payment': return <PaymentView bookingDetails={bookingDetails!} onConfirm={handleConfirmPayment} onBack={() => setView('details')} isProcessing={isProcessing} />;
            case 'confirmation': return <ConfirmationView bookingDetails={bookingDetails!} onDone={reset} />;
            case 'discovery':
            default: return <DiscoveryView onSelectEvent={handleSelectEvent} />;
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Event Tickets</h2>
            <Tabs defaultValue="discover" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="discover">Discover Events</TabsTrigger>
                    <TabsTrigger value="history">My Tickets</TabsTrigger>
                    <TabsTrigger value="organize">Host an Event</TabsTrigger>
                </TabsList>
                <TabsContent value="discover" className="pt-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderDiscoveryFlow()}
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>
                <TabsContent value="history" className="pt-4">
                    <BookingHistoryView />
                </TabsContent>
                <TabsContent value="organize" className="pt-4">
                    <OrganizerView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Sub-components
function DiscoveryView({ onSelectEvent }: { onSelectEvent: (event: Event) => void }) {
    const [category, setCategory] = useState<EventCategory>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEvents = useMemo(() => {
        return mockEvents.filter(event => {
            const matchesCategory = category === 'All' || event.category === category;
            const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  event.venue.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [category, searchQuery]);

    const categories: { name: EventCategory, icon: React.ElementType }[] = [
        { name: 'All', icon: Ticket },
        { name: 'Music', icon: Music },
        { name: 'Comedy', icon: Mic },
        { name: 'Sports', icon: Dumbbell },
        { name: 'Conference', icon: Wallet },
    ];
    
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search events, city or venue..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} onClick={() => setCategory(cat.name)} className="flex-shrink-0">
                            <cat.icon className="mr-2 h-4 w-4" /> {cat.name}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => (
                    <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden" onClick={() => onSelectEvent(event)}>
                        <div className="relative h-40 w-full">
                            <Image src={event.image} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.hint} />
                            <Badge className="absolute top-2 right-2">{event.category}</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle>{event.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{format(event.date, 'PPP')}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.venue}, {event.city}</p>
                        </CardContent>
                         <CardFooter>
                            <p className="text-lg font-bold">From ₦{mockTickets[event.id][0].price.toLocaleString()}</p>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DetailsView({ event, onBook, onBack }: { event: Event, onBook: (details: Omit<BookingDetails, 'event'>) => void, onBack: () => void }) {
    const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
    const eventTickets = mockTickets[event.id] || [];

    const handleQuantityChange = (ticketTypeId: string, change: number) => {
        setTicketQuantities(prev => ({
            ...prev,
            [ticketTypeId]: Math.max(0, (prev[ticketTypeId] || 0) + change),
        }));
    };

    const bookingDetails = useMemo(() => {
        const tickets = eventTickets
            .map(ticket => ({
                ticketTypeId: ticket.id,
                name: ticket.name,
                quantity: ticketQuantities[ticket.id] || 0,
                price: ticket.price,
            }))
            .filter(t => t.quantity > 0);
        
        const total = tickets.reduce((acc, ticket) => acc + ticket.quantity * ticket.price, 0);
        return { tickets, total };
    }, [ticketQuantities, eventTickets]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <div>
                        <CardTitle className="text-2xl">{event.name}</CardTitle>
                        <CardDescription>{format(event.date, 'PPPP')} at {event.venue}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-48 w-full relative rounded-lg overflow-hidden"><Image src={event.image} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.hint} /></div>
                <p className="text-muted-foreground">{event.description}</p>
                <div>
                    <h3 className="font-semibold mb-2 text-lg">Select Tickets</h3>
                    <div className="space-y-4">
                        {eventTickets.map(ticket => (
                             <div key={ticket.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{ticket.name}</p>
                                    <p className="font-bold text-primary">₦{ticket.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" onClick={() => handleQuantityChange(ticket.id, -1)}><Minus/></Button>
                                    <Input className="w-16 text-center" readOnly value={ticketQuantities[ticket.id] || 0} />
                                    <Button size="icon" variant="outline" onClick={() => handleQuantityChange(ticket.id, 1)}><Plus/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 {bookingDetails.total > 0 && (
                    <>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-xl"><p>Total:</p><p>₦{bookingDetails.total.toLocaleString()}</p></div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => onBook(bookingDetails)} disabled={bookingDetails.total === 0}>Proceed to Payment</Button>
            </CardFooter>
        </Card>
    );
}

function PaymentView({ bookingDetails, onConfirm, onBack, isProcessing }: { bookingDetails: BookingDetails, onConfirm: () => void, onBack: () => void, isProcessing: boolean }) {
    const walletBalance = 1250345;
    const hasSufficientFunds = walletBalance >= bookingDetails.total;
    
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack} disabled={isProcessing}><ArrowLeft/></Button>
                    <CardTitle>Confirm Booking</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between font-bold"><p>{bookingDetails.event.name}</p></div>
                    <div className="flex justify-between text-sm"><p className="text-muted-foreground">Date</p><p>{format(bookingDetails.event.date, 'PPP')}</p></div>
                    <Separator />
                    {bookingDetails.tickets.map(t => (
                         <div key={t.ticketTypeId} className="flex justify-between text-sm"><p>{t.name} (x{t.quantity})</p><p>₦{(t.quantity * t.price).toLocaleString()}</p></div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><p>Total</p><p>₦{bookingDetails.total.toLocaleString()}</p></div>
                </div>
                <Alert variant={hasSufficientFunds ? "default" : "destructive"}>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                    <AlertDescription>
                        {hasSufficientFunds ? `Your balance of ₦${walletBalance.toLocaleString()} is sufficient.` : `Your balance of ₦${walletBalance.toLocaleString()} is insufficient.`}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={onConfirm} disabled={!hasSufficientFunds || isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                 </Button>
            </CardFooter>
        </Card>
    );
}

function ConfirmationView({ bookingDetails, onDone }: { bookingDetails: BookingDetails, onDone: () => void }) {
    const { toast } = useToast();
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <CardTitle className="mt-4 text-2xl">Booking Successful!</CardTitle>
                <CardDescription>Your tickets for {bookingDetails.event.name} are confirmed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="p-4 bg-white border rounded-lg flex flex-col items-center">
                    <QrCode className="w-32 h-32" />
                    <p className="font-mono text-sm mt-2">REF: OVO-EVT-{Date.now().toString().slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">Present this QR code at the gate for entry.</p>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
                 <Button className="w-full" onClick={() => toast({ title: "Ticket Downloaded." })}><Download className="mr-2" /> Save to Phone</Button>
                 <Button variant="outline" className="w-full" onClick={onDone}>Back to Events</Button>
            </CardFooter>
        </Card>
    );
}

function BookingHistoryView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>A list of your past and upcoming event bookings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockUserBookings.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="font-medium">{b.eventName}</TableCell>
                                <TableCell>{format(b.date, 'PPP')}</TableCell>
                                <TableCell><Badge variant={b.status === 'Completed' ? 'secondary' : 'default'}>{b.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">View Ticket</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
