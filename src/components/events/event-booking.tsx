
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


// Icons
import { Ticket, Search, MapPin, Music, Mic, Dumbbell, ArrowLeft, Plus, Minus, Wallet, CheckCircle, Loader2, Download, QrCode, Users, TrendingUp, Upload, Trash2, PlusCircle, BarChart, Church, Moon, Share2 } from 'lucide-react';

// Types & Mock Data
type View = 'discovery' | 'details' | 'payment' | 'confirmation';
type OrganizerView = 'dashboard' | 'form' | 'payment' | 'event_details';
type EventCategory = 'All' | 'Music' | 'Comedy' | 'Sports' | 'Conference' | 'Church' | 'Islamic';

interface Event {
    id: string;
    name: string;
    category: EventCategory;
    date: Date;
    venue: string;
    city: string;
    image: string; // fallback image
    flyerImage?: string; // uploaded flyer
    description: string;
    hint: string;
}

interface TicketType {
    id: string;
    name: string;
    price: number;
    quantity?: number; // for hosts
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
    { id: 'evt-5', name: 'Annual Shiloh Gathering', category: 'Church', date: new Date('2024-12-08'), venue: 'Faith Tabernacle', city: 'Ota', image: 'https://placehold.co/600x400.png', description: 'Join thousands for a life-changing spiritual encounter.', hint: 'church cross' },
    { id: 'evt-6', name: 'Eid al-Fitr Celebration', category: 'Islamic', date: new Date('2025-03-30'), venue: 'National Mosque', city: 'Abuja', image: 'https://placehold.co/600x400.png', description: 'Celebrate the end of Ramadan with prayers, food, and community.', hint: 'mosque dome' },
];

const mockTickets: Record<string, TicketType[]> = {
    'evt-1': [{ id: 'tix-1a', name: 'Regular', price: 15000 }, { id: 'tix-1b', name: 'VIP', price: 50000 }],
    'evt-2': [{ id: 'tix-2a', name: 'Regular', price: 10000 }, { id: 'tix-2b', name: 'Table of 10', price: 500000 }],
    'evt-3': [{ id: 'tix-3a', name: 'Regular', price: 5000 }, { id: 'tix-3b', name: 'VIP', price: 20000 }],
    'evt-4': [{ id: 'tix-4a', name: 'Delegate Pass', price: 25000 }, { id: 'tix-4b', name: 'Exhibitor Pass', price: 100000 }],
    'evt-5': [{ id: 'tix-5a', name: 'General Access', price: 0 }],
    'evt-6': [{ id: 'tix-6a', name: 'General Access', price: 0 }],
};

const mockUserBookings: UserBooking[] = [
    { id: 'book-1', eventName: 'Davido Timeless Concert', date: new Date('2024-08-15'), venue: 'Abuja National Stadium', status: 'Upcoming' },
    { id: 'book-2', eventName: 'TechCrunch Lagos', date: new Date('2024-06-01'), venue: 'Civic Centre', status: 'Completed' },
];

interface HostEvent extends Event {
    ticketTypes: TicketType[];
    ticketsSold: number;
    revenue: number;
}

const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  price: z.coerce.number().positive("Price must be positive"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const eventCreationSchema = z.object({
    name: z.string().min(5, "Event name is too short."),
    description: z.string().min(20, "Please provide more details."),
    date: z.date({required_error: "Please select a date."}),
    venue: z.string().min(3, "Venue is required."),
    city: z.string().min(1, "Please select a city."),
    flyerImage: z.any().optional(),
    ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required."),
});

type EventCreationData = z.infer<typeof eventCreationSchema>;

function OrganizerView() {
    const { toast } = useToast();
    const [view, setView] = useState<OrganizerView>('dashboard');
    const [hostedEvents, setHostedEvents] = useState<HostEvent[]>([]);
    const [activeEvent, setActiveEvent] = useState<HostEvent | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateEvent = (data: EventCreationData) => {
        const newEvent: HostEvent = {
            id: `host-${Date.now()}`,
            category: 'Music', // Default category for now
            hint: 'concert stage',
            image: 'https://placehold.co/600x400.png',
            ...data,
            // Mocked stats
            ticketsSold: 0,
            revenue: 0,
        };
        setActiveEvent(newEvent);
        setView('payment');
    };
    
    const handlePayListingFee = () => {
        if (!activeEvent) return;
        setIsProcessing(true);
        setTimeout(() => {
            setHostedEvents(prev => [...prev, activeEvent]);
            toast({ title: "Event Listed!", description: `${activeEvent.name} is now live on Ovomonie.` });
            setView('event_details');
            setIsProcessing(false);
        }, 1500);
    }
    
    if (view === 'form' || (view === 'dashboard' && hostedEvents.length === 0)) {
        return <EventCreationForm onSave={handleCreateEvent} />;
    }
    
    if (view === 'payment') {
        return (
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Pay Listing Fee</CardTitle>
                    <CardDescription>A non-refundable fee is required to list your event.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">₦20,000</p>
                    <p className="text-muted-foreground mt-2">This covers platform access and promotional support.</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button className="w-full" onClick={handlePayListingFee} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="animate-spin mr-2"/>} Pay & List Event
                    </Button>
                    <Button variant="ghost" onClick={() => setView('form')}>Back to Edit</Button>
                </CardFooter>
            </Card>
        );
    }
    
    if (view === 'event_details' && activeEvent) {
        return <HostEventDetails event={activeEvent} onBack={() => setView('dashboard')} />
    }
    
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>My Events Dashboard</CardTitle>
                    <CardDescription>Track the performance of your listed events.</CardDescription>
                </div>
                <Button onClick={() => setView('form')}><PlusCircle className="mr-2" /> List New Event</Button>
            </CardHeader>
            <CardContent>
                {hostedEvents.map(event => (
                    <Card key={event.id} className="mb-4">
                        <CardHeader className="flex-row justify-between items-start">
                            <div>
                                <p className="font-bold">{event.name}</p>
                                <p className="text-sm text-muted-foreground">{format(event.date, 'PPP')}</p>
                            </div>
                            <Button size="sm" onClick={() => { setActiveEvent(event); setView('event_details'); }}>View Details</Button>
                        </CardHeader>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

function HostEventDetails({ event, onBack }: { event: HostEvent, onBack: () => void }) {
    const totalRevenue = 565000; // Mock data
    const commission = totalRevenue * 0.05;
    const netPayout = totalRevenue - commission;
    const ticketsSold = { Regular: 25, VIP: 5 }; // Mock data

    return (
        <Card>
             <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <CardTitle>{event.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold">Performance Summary</h3>
                    <Card>
                        <CardContent className="pt-6 grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-sm text-muted-foreground">Tickets Sold</p><p className="text-2xl font-bold">30</p></div>
                            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardContent className="pt-6 space-y-2">
                             <div className="flex justify-between"><p>Gross Revenue</p><p>₦{totalRevenue.toLocaleString()}</p></div>
                             <div className="flex justify-between text-destructive"><p>Ovomonie Commission (5%)</p><p>- ₦{commission.toLocaleString()}</p></div>
                             <Separator />
                             <div className="flex justify-between font-bold text-lg"><p>Net Payout</p><p>₦{netPayout.toLocaleString()}</p></div>
                         </CardContent>
                    </Card>
                </div>
                 <div>
                    <h3 className="font-semibold">Ticket Sales Breakdown</h3>
                     <Table><TableHeader><TableRow><TableHead>Ticket Type</TableHead><TableHead className="text-right">Sold</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Regular</TableCell><TableCell className="text-right">25</TableCell></TableRow><TableRow><TableCell>VIP</TableCell><TableCell className="text-right">5</TableCell></TableRow></TableBody></Table>
                </div>
            </CardContent>
        </Card>
    )
}

function EventCreationForm({ onSave }: { onSave: (data: EventCreationData) => void }) {
    const form = useForm<EventCreationData>({
        resolver: zodResolver(eventCreationSchema),
        defaultValues: { name: "", description: "", venue: "", city: "", ticketTypes: [{ name: 'Regular', price: 0, quantity: 100 }] }
    });
    
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "ticketTypes" });
    const [flyerPreview, setFlyerPreview] = useState<string | null>(null);

    const handleFlyerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFlyerPreview(reader.result as string);
                form.setValue('flyerImage', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="flyerImage" render={() => (
                        <FormItem>
                            <FormLabel>Event Flyer</FormLabel>
                             <div className="relative w-full aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer">
                                <Input id="flyer-upload" type="file" accept="image/*" onChange={handleFlyerUpload} className="absolute h-full w-full opacity-0 cursor-pointer" />
                                {flyerPreview ? (<Image src={flyerPreview} alt="Flyer Preview" layout="fill" objectFit="contain" className="p-2" data-ai-hint="event poster"/>) : (<div className="text-center"><Upload className="mx-auto h-8 w-8" /><p className="text-xs mt-1">Upload Flyer</p></div>)}
                            </div>
                        </FormItem>
                    )} />
                    <div className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Event Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Event Description</FormLabel><FormControl><Textarea {...field} rows={5}/></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} onChange={e => field.onChange(new Date(e.target.value))} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="venue" render={({ field }) => (<FormItem><FormLabel>Venue</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Ticket Types</h3>
                    <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <FormField control={form.control} name={`ticketTypes.${index}.name`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g. VIP"/></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`ticketTypes.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Price (₦)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`ticketTypes.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="text-destructive"/></Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', price: 0, quantity: 0 })}><PlusCircle className="mr-2" />Add Ticket Type</Button>
                </div>
                 <Button type="submit" className="w-full">Continue to Payment</Button>
            </form>
        </Form>
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
                            className="h-full"
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
        { name: 'Church', icon: Church },
        { name: 'Islamic', icon: Moon },
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
                            <Image src={event.flyerImage || event.image} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.hint} />
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
                            <p className="text-lg font-bold">From ₦{mockTickets[event.id]?.[0]?.price.toLocaleString() || 'N/A'}</p>
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
    const { toast } = useToast();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.name,
                    text: `${event.description}\n\nVenue: ${event.venue}, ${event.city}`,
                    url: window.location.href,
                });
                toast({ title: 'Event Shared!' });
            } catch (error) {
                if (!(error instanceof Error && error.name === 'AbortError')) {
                    console.error('Share failed:', error);
                    toast({ variant: 'destructive', title: 'Could not share event.' });
                }
            }
        } else {
            navigator.clipboard.writeText(`${event.name}: ${window.location.href}`);
            toast({ title: 'Link Copied!', description: 'Sharing is not supported on your browser. Event link copied to clipboard.' });
        }
    };

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
                 <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                        <div>
                            <CardTitle className="text-2xl">{event.name}</CardTitle>
                            <CardDescription>{format(event.date, 'PPPP')} at {event.venue}</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleShare}><Share2 /></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-48 w-full relative rounded-lg overflow-hidden"><Image src={event.flyerImage || event.image} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.hint} /></div>
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

function TicketViewDialog({ booking, open, onOpenChange }: { booking: UserBooking | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!booking) return null;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader className="text-center items-center">
                    <Ticket className="w-16 h-16 text-primary mb-2" />
                    <DialogTitle className="text-2xl">{booking.eventName}</DialogTitle>
                    <DialogDescription>Present this ticket at the event entrance.</DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-white border rounded-lg flex flex-col items-center">
                    <QrCode className="w-32 h-32" />
                    <p className="font-mono text-sm mt-2">REF: {booking.id.toUpperCase()}</p>
                </div>
                <div className="text-sm space-y-1 mt-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="font-semibold">{format(booking.date, 'PPP')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Venue:</span><span className="font-semibold">{booking.venue}</span></div>
                </div>
                <DialogFooter className="mt-4">
                    <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BookingHistoryView() {
    const [viewingTicket, setViewingTicket] = useState<UserBooking | null>(null);

    return (
        <>
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
                                        <Button variant="outline" size="sm" onClick={() => setViewingTicket(b)}>View Ticket</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <TicketViewDialog booking={viewingTicket} open={!!viewingTicket} onOpenChange={() => setViewingTicket(null)} />
        </>
    );
}
