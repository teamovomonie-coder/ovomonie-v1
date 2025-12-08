
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { faqData } from '@/lib/support-data';
import { format, parseISO } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Icons
import { Phone, MessageSquare, Mail, HelpCircle, ListChecks, FilePlus, PhoneIncoming, ShieldAlert, ArrowLeft, Send, Loader2 } from 'lucide-react';

type View = 'dashboard' | 'chat' | 'email' | 'faq' | 'track' | 'submit' | 'callback' | 'fraud';

export interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}

const supportOptions = [
    { view: 'chat', title: 'Live Chat', icon: MessageSquare, isWIP: true },
    { view: 'faq', title: 'Help Articles / FAQs', icon: HelpCircle },
    { view: 'track', title: 'Track My Complaints', icon: ListChecks },
    { view: 'submit', title: 'Submit New Complaint', icon: FilePlus },
    { view: 'callback', title: 'Request a Callback', icon: PhoneIncoming, isWIP: true },
    { view: 'fraud', title: 'Report Fraud', icon: ShieldAlert },
    { view: 'email', title: 'Email Support', icon: Mail, isWIP: true },
    { view: 'call', title: 'Call Support', icon: Phone },
];

const complaintSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  category: z.string().min(1, "Please select a category."),
  description: z.string().min(20, "Please provide a detailed description."),
  file: z.any().optional(),
});

function DashboardView({ setView }: { setView: (view: View, title: string) => void }) {
  const { toast } = useToast();
  
  const handleClick = (opt: typeof supportOptions[0]) => {
    if (opt.isWIP || opt.view === 'call') {
      toast({
        title: "Feature Not Available",
        description: opt.view === 'call' 
          ? "Phone support is available via 0700-OVOMONIE."
          : `The "${opt.title}" feature is under development.`
      });
    } else {
      setView(opt.view as View, opt.title);
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {supportOptions.map(opt => (
        <Card key={opt.view} className="cursor-pointer hover:shadow-lg transition-shadow text-center" onClick={() => handleClick(opt)}>
          <CardHeader className="items-center">
            <div className="p-3 bg-primary-light-bg rounded-full text-primary">
                <opt.icon className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{opt.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ComplaintView({ onNewComplaint, tickets, isLoading }: { onNewComplaint: () => void, tickets: SupportTicket[], isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Track Complaints</CardTitle>
                    <CardDescription>View the status of your support tickets.</CardDescription>
                </div>
                <Button onClick={onNewComplaint}>New Complaint</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">You have no support tickets.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticket ID</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-mono">{ticket.id.slice(0, 8).toUpperCase()}</TableCell>
                                    <TableCell>{ticket.subject}</TableCell>
                                    <TableCell><span className={cn('px-2 py-1 text-xs rounded-full', ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' : ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}>{ticket.status}</span></TableCell>
                                    <TableCell>{format(parseISO(ticket.updatedAt), 'dd MMM, yyyy')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function SubmitComplaintForm({ onSubmitted }: { onSubmitted: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof complaintSchema>>({
        resolver: zodResolver(complaintSchema),
        defaultValues: { subject: "", category: "", description: "" }
    });
    
    const onSubmit = async (data: z.infer<typeof complaintSchema>) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit complaint.');
            
            toast({ title: "Complaint Submitted", description: "Your ticket has been created. We will get back to you shortly." });
            onSubmitted();
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="subject" render={({ field }) => <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Failed Transfer" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="payment">Payment Issue</SelectItem><SelectItem value="login">Login Problem</SelectItem><SelectItem value="card">Card Issue</SelectItem><SelectItem value="fraud">Fraud Report</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Please describe the issue in detail..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />} Submit Complaint</Button>
            </form>
        </Form>
    );
}

export function SupportDashboard() {
    const [view, setView] = useState<View>('dashboard');
    const [title, setTitle] = useState('Support Center');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchTickets = useCallback(async () => {
        if (view !== 'track' && view !== 'dashboard') return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error('You must be logged in to view tickets.');
            const response = await fetch('/api/support/tickets', { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch support tickets.');
            const data = await response.json();
            setTickets(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast, view]);

    useEffect(() => {
        if (view === 'track') {
            fetchTickets();
        }
    }, [fetchTickets, view]);

    const handleSetView = (newView: View, newTitle: string) => {
        setView(newView);
        setTitle(newTitle);
    }
    
    const renderContent = () => {
        switch(view) {
            case 'faq': return <Card><CardHeader><CardTitle>Help Articles / FAQs</CardTitle></CardHeader><CardContent><Accordion type="single" collapsible className="w-full">{faqData.map(cat => (<div key={cat.category} className="mb-4"><h3 className="text-lg font-semibold mb-2">{cat.category}</h3>{cat.questions.map(qa => (<AccordionItem key={qa.question} value={qa.question}><AccordionTrigger>{qa.question}</AccordionTrigger><AccordionContent>{qa.answer}</AccordionContent></AccordionItem>))}</div>))}</Accordion></CardContent></Card>;
            case 'track': return <ComplaintView onNewComplaint={() => handleSetView('submit', 'Submit a New Complaint')} tickets={tickets} isLoading={isLoading} />;
            case 'submit': return <Card><CardHeader><CardTitle>Submit a New Complaint</CardTitle></CardHeader><CardContent><SubmitComplaintForm onSubmitted={() => handleSetView('track', 'Track My Complaints')} /></CardContent></Card>;
            case 'fraud': return <Card><CardHeader><CardTitle>Report Fraud</CardTitle><CardDescription>If you suspect fraudulent activity on your account, please describe it in detail below.</CardDescription></CardHeader><CardContent><SubmitComplaintForm onSubmitted={() => handleSetView('dashboard', 'Support Center')} /></CardContent></Card>;
            case 'dashboard':
            default: return <DashboardView setView={handleSetView} />;
        }
    }

    return (
        <div className="space-y-4">
             <div className="flex items-center gap-2">
                {view !== 'dashboard' && <Button variant="ghost" size="icon" onClick={() => handleSetView('dashboard', 'Support Center')}><ArrowLeft/></Button>}
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: view === 'dashboard' ? 0 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
