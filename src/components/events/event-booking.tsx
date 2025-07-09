
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PinModal } from '@/components/auth/pin-modal';

import { Ticket, Search, MapPin, Music, Mic, Dumbbell, ArrowLeft, Plus, Minus, Trash2, Wallet, CheckCircle, Loader2, Download, QrCode, Users, PlusCircle, Share2, Church, Moon, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

// Types & Schemas
type View = 'discovery' | 'details' | 'payment' | 'confirmation';
type OrganizerView = 'dashboard' | 'form' | 'payment' | 'event_details';
type EventCategory = 'All' | 'Music' | 'Comedy' | 'Sports' | 'Conference' | 'Church' | 'Islamic';

interface TicketType {
    id?: string;
    name: string;
    price: number;
    quantity: number;
}

interface EventData {
    id: string;
    name: string;
    description: string;
    category: EventCategory;
    date: string; // ISO string
    venue: string;
    city: string;
    flyerImage?: string;
    ticketTypes: TicketType[];
    userId: string;
}

interface BookingDetails {
    event: EventData;
    tickets: { name: string; quantity: number; price: number }[];
    total: number;
    bookingReference: string;
}

const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  price: z.coerce.number().min(0, "Price can be 0 for free events."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const eventCreationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(5, "Event name is too short."),
    category: z.string().min(1, "Category is required."),
    description: z.string().min(20, "Please provide more details."),
    date: z.date({required_error: "Please select a date."}),
    venue: z.string().min(3, "Venue is required."),
    city: z.string().min(1, "Please select a city."),
    flyerImage: z.any().optional(),
    ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required."),
});

type EventCreationFormData = z.infer<typeof eventCreationSchema>;

function OrganizerView() {
    const { toast } = useToast();
    const [view, setView] = useState<OrganizerView>('dashboard');
    const [hostedEvents, setHostedEvents] = useState<EventData[]>([]);
    const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { updateBalance } = useAuth();
    const { addNotification } = useNotifications();
    
    const fetchHostedEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            const response = await fetch('/api/events/organizer', { headers: { 'Authorization': `Bearer ${token}` }});
            if (!response.ok) throw new Error('Failed to fetch your events.');
            const data = await response.json();
            setHostedEvents(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (view === 'dashboard') {
            fetchHostedEvents();
        }
    }, [view, fetchHostedEvents]);

    const handleCreateEvent = (data: EventCreationFormData) => {
        const newEvent: Partial<EventData> & { date: Date } = {
            ...data,
            ticketTypes: data.ticketTypes.map(t => ({...t, id: `tix-${Math.random()}`})),
        };
        setActiveEvent(newEvent as EventData);
        setView('payment');
    };
    
    const handlePayListingFee = async () => {
        if (!activeEvent) return;
        setIsSubmitting(true);
        setApiError(null);
        
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error('Authentication failed.');

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({...activeEvent, clientReference: `event-listing-${Date.now()}`}),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to list event.');
            
            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Event Listed!',
                description: `${activeEvent.name} is now live.`,
                category: 'transaction',
            });
            toast({ title: "Event Listed Successfully!" });
            
            setActiveEvent(result.event);
            setView('event_details');

        } catch (error) {
             setApiError((error as Error).message);
        } finally {
            setIsSubmitting(false);
            setIsPinModalOpen(false);
        }
    };
    
    if (view === 'form') {
        return <EventCreationForm onSave={handleCreateEvent} onBack={() => setView('dashboard')} />;
    }
    
    if (view === 'payment' && activeEvent) {
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
                    <Button className="w-full" onClick={() => setIsPinModalOpen(true)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="animate-spin mr-2"/>} Pay & List Event
                    </Button>
                    <Button variant="ghost" onClick={() => setView('form')}>Back to Edit</Button>
                </CardFooter>
                 <PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handlePayListingFee} isProcessing={isSubmitting} error={apiError} onClearError={() => setApiError(null)} title="Confirm Listing Fee Payment" />
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
                {isLoading ? <div className="text-center p-8"><Loader2 className="animate-spin" /></div> : hostedEvents.length === 0 ? <p className="text-center text-muted-foreground p-8">You haven't created any events yet.</p> :
                hostedEvents.map(event => (
                    <Card key={event.id} className="mb-4">
                        <CardHeader className="flex-row justify-between items-start">
                            <div>
                                <p className="font-bold">{event.name}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'PPP')}</p>
                            </div>
                            <Button size="sm" onClick={() => { setActiveEvent(event); setView('event_details'); }}>View Details</Button>
                        </CardHeader>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

function HostEventDetails({ event, onBack }: { event: EventData, onBack: () => void }) {
    const totalRevenue = 565000;
    const commission = totalRevenue * 0.05;
    const netPayout = totalRevenue - commission;

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
                    <Card><CardContent className="pt-6 grid grid-cols-2 gap-4 text-center"><div><p className="text-sm text-muted-foreground">Tickets Sold</p><p className="text-2xl font-bold">30</p></div><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p></div></CardContent></Card>
                    <Card><CardContent className="pt-6 space-y-2"><div className="flex justify-between"><p>Gross Revenue</p><p>₦{totalRevenue.toLocaleString()}</p></div><div className="flex justify-between text-destructive"><p>Ovomonie Commission (5%)</p><p>- ₦{commission.toLocaleString()}</p></div><Separator /><div className="flex justify-between font-bold text-lg"><p>Net Payout</p><p>₦{netPayout.toLocaleString()}</p></div></CardContent></Card>
                </div>
                 <div>
                    <h3 className="font-semibold">Ticket Sales Breakdown</h3>
                     <Table><TableHeader><TableRow><TableHead>Ticket Type</TableHead><TableHead className="text-right">Sold</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Regular</TableCell><TableCell className="text-right">25</TableCell></TableRow><TableRow><TableCell>VIP</TableCell><TableCell className="text-right">5</TableCell></TableRow></TableBody></Table>
                </div>
            </CardContent>
        </Card>
    )
}

function EventCreationForm({ onSave, onBack }: { onSave: (data: EventCreationFormData) => void; onBack: () => void; }) {
    const form = useForm<EventCreationFormData>({
        resolver: zodResolver(eventCreationSchema),
        defaultValues: { name: "", category: "Music", description: "", venue: "", city: "", ticketTypes: [{ name: 'Regular', price: 0, quantity: 100 }] }
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
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <h2 className="text-2xl font-bold">Create New Event</h2>
                </div>
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
                        <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Music">Music</SelectItem><SelectItem value="Comedy">Comedy</SelectItem><SelectItem value="Sports">Sports</SelectItem><SelectItem value="Conference">Conference</SelectItem><SelectItem value="Church">Church</SelectItem><SelectItem value="Islamic">Islamic</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
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

// ... rest of the components remain the same ...

export function EventBooking() {
    const [view, setView] = useState<View>('discovery');
    const [allEvents, setAllEvents] = useState<EventData[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { toast } = useToast();
    const { updateBalance } = useAuth();
    const { addNotification } = useNotifications();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [pendingBooking, setPendingBooking] = useState<any>(null);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            const data = await response.json();
            setAllEvents(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (view === 'discovery') {
            fetchEvents();
        }
    }, [view, fetchEvents]);

    const handleSelectEvent = (event: EventData) => {
        setSelectedEvent(event);
        setView('details');
    };

    const handleBook = (details: Omit<BookingDetails, 'event' | 'bookingReference'>) => {
        if (!selectedEvent) return;
        setPendingBooking(details);
        setIsPinModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedEvent || !pendingBooking) return;
        setIsProcessing(true);
        setApiError(null);
        
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error('Authentication required.');

            const response = await fetch('/api/events/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    eventId: selectedEvent.id, 
                    tickets: pendingBooking.tickets, 
                    totalAmount: pendingBooking.total,
                    clientReference: `event-book-${Date.now()}` 
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Booking failed');
            
            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Event Booked!',
                description: `Your ticket for ${selectedEvent.name} is confirmed.`,
                category: 'transaction',
            });
            setBookingDetails({ ...pendingBooking, event: selectedEvent, bookingReference: result.bookingReference });
            setView('confirmation');

        } catch (error) {
            setApiError((error as Error).message);
        } finally {
            setIsProcessing(false);
            setIsPinModalOpen(false);
        }
    };

    const reset = () => {
        setView('discovery');
        setSelectedEvent(null);
        setBookingDetails(null);
        setPendingBooking(null);
    };

    const renderDiscoveryFlow = () => {
        if (isLoading) {
            return <div className="text-center p-10"><Loader2 className="animate-spin text-primary" /></div>;
        }

        switch (view) {
            case 'details': return <DetailsView event={selectedEvent!} onBook={handleBook} onBack={reset} />;
            case 'confirmation': return <ConfirmationView bookingDetails={bookingDetails!} onDone={reset} />;
            case 'discovery':
            default: return <DiscoveryView events={allEvents} onSelectEvent={handleSelectEvent} />;
        }
    };
    
    return (
        <>
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
            <PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handleConfirmPayment} isProcessing={isProcessing} error={apiError} onClearError={() => setApiError(null)} title="Confirm Ticket Payment" />
        </>
    );
}

function DiscoveryView({ events, onSelectEvent }: { events: EventData[], onSelectEvent: (event: EventData) => void }) {
    const [category, setCategory] = useState<EventCategory>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesCategory = category === 'All' || event.category === category;
            const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  event.venue.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [category, searchQuery, events]);

    const categories: { name: EventCategory, icon: React.ElementType }[] = [
        { name: 'All', icon: Ticket }, { name: 'Music', icon: Music }, { name: 'Comedy', icon: Mic }, { name: 'Sports', icon: Dumbbell }, { name: 'Conference', icon: Users }, { name: 'Church', icon: Church }, { name: 'Islamic', icon: Moon },
    ];
    
    return (
        <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Search events, city or venue..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            <div><div className="flex gap-2 overflow-x-auto pb-2">{categories.map(cat => (<Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} onClick={() => setCategory(cat.name)} className="flex-shrink-0"><cat.icon className="mr-2 h-4 w-4" /> {cat.name}</Button>))}</div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => (
                    <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden" onClick={() => onSelectEvent(event)}>
                        <div className="relative h-40 w-full"><Image src={event.flyerImage || `https://placehold.co/600x400.png`} alt={event.name} layout="fill" objectFit="cover" data-ai-hint="event poster" /><Badge className="absolute top-2 right-2">{event.category}</Badge></div>
                        <CardHeader><CardTitle>{event.name}</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">{format(new Date(event.date), 'PPP')}</p><p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.venue}, {event.city}</p></CardContent>
                         <CardFooter><p className="text-lg font-bold">From ₦{event.ticketTypes?.[0]?.price.toLocaleString() || 'Free'}</p></CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DetailsView({ event, onBook, onBack }: { event: EventData, onBook: (details: Omit<BookingDetails, 'event' | 'bookingReference'>) => void, onBack: () => void }) {
    const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
    const { toast } = useToast();

    const handleShare = async () => {
        if (!navigator.share) {
            navigator.clipboard.writeText(`${event.name}: ${window.location.href}`);
            toast({ title: 'Link Copied!', description: 'Sharing is not supported. Link copied instead.' });
            return;
        }
        try {
            await navigator.share({ title: event.name, text: `${event.description}\n\nVenue: ${event.venue}, ${event.city}`, url: window.location.href });
        } catch (error) {
            if (!(error instanceof Error && error.name === 'AbortError')) {
                console.error('Share failed:', error);
                toast({ variant: 'destructive', title: 'Could not share event.' });
            }
        }
    };

    const handleQuantityChange = (ticketId: string, change: number) => {
        setTicketQuantities(prev => ({...prev, [ticketId]: Math.max(0, (prev[ticketId] || 0) + change)}));
    };

    const bookingDetails = useMemo(() => {
        const tickets = event.ticketTypes.map(ticket => ({...ticket, quantity: ticketQuantities[ticket.id!] || 0})).filter(t => t.quantity > 0);
        const total = tickets.reduce((acc, ticket) => acc + ticket.quantity * ticket.price, 0);
        return { tickets, total };
    }, [ticketQuantities, event.ticketTypes]);

    return (
        <Card>
            <CardHeader><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button><div><CardTitle className="text-2xl">{event.name}</CardTitle><CardDescription>{format(new Date(event.date), 'PPPP')} at {event.venue}</CardDescription></div></div><Button variant="outline" size="icon" onClick={handleShare}><Share2 /></Button></div></CardHeader>
            <CardContent className="space-y-6"><div className="h-48 w-full relative rounded-lg overflow-hidden"><Image src={event.flyerImage || `https://placehold.co/600x400.png`} alt={event.name} layout="fill" objectFit="cover" data-ai-hint="event poster" /></div><p className="text-muted-foreground">{event.description}</p>
                <div><h3 className="font-semibold mb-2 text-lg">Select Tickets</h3><div className="space-y-4">{event.ticketTypes.map(ticket => (<div key={ticket.id} className="p-4 border rounded-lg flex justify-between items-center"><div><p className="font-semibold">{ticket.name}</p><p className="font-bold text-primary">₦{ticket.price.toLocaleString()}</p></div><div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => handleQuantityChange(ticket.id!, -1)}><Minus/></Button><Input className="w-16 text-center" readOnly value={ticketQuantities[ticket.id!] || 0} /><Button size="icon" variant="outline" onClick={() => handleQuantityChange(ticket.id!, 1)}><Plus/></Button></div></div>))}</div></div>
                 {bookingDetails.total > 0 && (<><Separator /><div className="flex justify-between items-center font-bold text-xl"><p>Total:</p><p>₦{bookingDetails.total.toLocaleString()}</p></div></>)}
            </CardContent>
            <CardFooter><Button className="w-full" onClick={() => onBook(bookingDetails)} disabled={bookingDetails.total === 0}>Proceed to Payment</Button></CardFooter>
        </Card>
    );
}

function ConfirmationView({ bookingDetails, onDone }: { bookingDetails: BookingDetails, onDone: () => void }) {
    const { toast } = useToast();
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader className="items-center"><CheckCircle className="w-16 h-16 text-green-500" /><CardTitle className="mt-4 text-2xl">Booking Successful!</CardTitle><CardDescription>Your tickets for {bookingDetails.event.name} are confirmed.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="p-4 bg-white border rounded-lg flex flex-col items-center"><QrCode className="w-32 h-32" /><p className="font-mono text-sm mt-2">REF: {bookingDetails.bookingReference}</p><p className="text-xs text-muted-foreground">Present this QR code at the gate for entry.</p></div></CardContent>
            <CardFooter className="flex-col gap-2 pt-4"><Button className="w-full" onClick={() => toast({ title: "Ticket Downloaded." })}><Download className="mr-2" /> Save to Phone</Button><Button variant="outline" className="w-full" onClick={onDone}>Back to Events</Button></CardFooter>
        </Card>
    );
}

function TicketViewDialog({ booking, open, onOpenChange }: { booking: any | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!booking) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm"><DialogHeader className="text-center items-center"><Ticket className="w-16 h-16 text-primary mb-2" /><DialogTitle className="text-2xl">{booking.eventName}</DialogTitle><DialogDescription>Present this ticket at the event entrance.</DialogDescription></DialogHeader>
                <div className="p-4 bg-white border rounded-lg flex flex-col items-center"><QrCode className="w-32 h-32" /><p className="font-mono text-sm mt-2">REF: {booking.id.toUpperCase()}</p></div>
                <div className="text-sm space-y-1 mt-4"><div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="font-semibold">{format(new Date(booking.date), 'PPP')}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Venue:</span><span className="font-semibold">{booking.venue}</span></div></div>
                <DialogFooter className="mt-4"><Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BookingHistoryView() {
    const [viewingTicket, setViewingTicket] = useState<any | null>(null);
    return (
        <>
            <Card>
                <CardHeader><CardTitle>My Tickets</CardTitle><CardDescription>Your past and upcoming event bookings.</CardDescription></CardHeader>
                <CardContent><p className="text-muted-foreground text-center py-8">This feature is under construction.</p></CardContent>
            </Card>
            <TicketViewDialog booking={viewingTicket} open={!!viewingTicket} onOpenChange={() => setViewingTicket(null)} />
        </>
    );
}
