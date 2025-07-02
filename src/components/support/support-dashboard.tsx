"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supportTickets, faqData, SupportTicket } from '@/lib/support-data';

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
import { Phone, MessageSquare, Mail, HelpCircle, ListChecks, FilePlus, UserClock, ShieldAlert, ArrowLeft, Send, Paperclip, Loader2 } from 'lucide-react';

type View = 'dashboard' | 'chat' | 'email' | 'faq' | 'track' | 'submit' | 'callback' | 'fraud';

const supportOptions = [
    { view: 'chat', title: 'Live Chat', icon: MessageSquare },
    { view: 'faq', title: 'Help Articles / FAQs', icon: HelpCircle },
    { view: 'track', title: 'Track My Complaints', icon: ListChecks },
    { view: 'submit', title: 'Submit New Complaint', icon: FilePlus },
    { view: 'callback', title: 'Request a Callback', icon: UserClock },
    { view: 'fraud', title: 'Report Fraud', icon: ShieldAlert },
    { view: 'email', title: 'Email Support', icon: Mail },
    { view: 'call', title: 'Call Support', icon: Phone },
];

const complaintSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  category: z.string().min(1, "Please select a category."),
  description: z.string().min(20, "Please provide a detailed description."),
  file: z.any().optional(),
});

const callbackSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(10, "A valid phone number is required."),
  time: z.string().min(1, "Please select a preferred time."),
});


function DashboardView({ setView }: { setView: (view: View) => void }) {
  const { toast } = useToast();
  
  const handleCall = () => {
    toast({
      title: "Calling Support...",
      description: "Our lines are open Mon–Fri 8am to 6pm."
    });
    // In a real app: window.location.href = 'tel:+23412345678';
  }

  const handleClick = (view: View) => {
    if (view === 'call') {
      handleCall();
    } else {
      setView(view);
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {supportOptions.map(opt => (
        <Card key={opt.view} className="cursor-pointer hover:shadow-lg transition-shadow text-center" onClick={() => handleClick(opt.view as View)}>
          <CardHeader className="items-center">
            <opt.icon className="h-10 w-10 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{opt.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChatView() {
    return (
        <Card className="h-[60vh] flex flex-col">
            <CardHeader><CardTitle>Live Chat</CardTitle><CardDescription>Chat with our support assistant.</CardDescription></CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-muted-foreground">
                <p>Live Chat Coming Soon</p>
            </CardContent>
            <CardFooter className="border-t pt-4">
                <div className="relative w-full">
                    <Input placeholder="Type your message..." />
                    <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"><Send className="h-4 w-4"/></Button>
                </div>
            </CardFooter>
        </Card>
    );
}

function FaqView() {
    return (
         <Accordion type="single" collapsible className="w-full">
            {faqData.map(category => (
                <div key={category.category} className="mb-4">
                     <h3 className="text-lg font-semibold mb-2">{category.category}</h3>
                     {category.questions.map(qa => (
                         <AccordionItem key={qa.question} value={qa.question}>
                            <AccordionTrigger>{qa.question}</AccordionTrigger>
                            <AccordionContent>{qa.answer}</AccordionContent>
                        </AccordionItem>
                     ))}
                </div>
            ))}
        </Accordion>
    );
}

function ComplaintView({ onNewComplaint }: { onNewComplaint: () => void }) {
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
                        {supportTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-mono">{ticket.id}</TableCell>
                                <TableCell>{ticket.subject}</TableCell>
                                <TableCell><span className={cn('px-2 py-1 text-xs rounded-full', ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' : ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}>{ticket.status}</span></TableCell>
                                <TableCell>{ticket.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SubmitComplaintForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof complaintSchema>>({
        resolver: zodResolver(complaintSchema),
        defaultValues: { subject: "", category: "", description: "" }
    });
    
    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        toast({ title: "Complaint Submitted", description: "Your ticket has been created. We will get back to you shortly." });
        form.reset();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="subject" render={({ field }) => <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Failed Transfer" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="payment">Payment Issue</SelectItem><SelectItem value="login">Login Problem</SelectItem><SelectItem value="card">Card Issue</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Please describe the issue in detail..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="file" render={({ field }) => <FormItem><FormLabel>Attach File (Optional)</FormLabel><FormControl><Input type="file" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>} />
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />} Submit Complaint</Button>
            </form>
        </Form>
    );
}

function CallbackForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof callbackSchema>>({
        resolver: zodResolver(callbackSchema),
        defaultValues: { name: "PAAGO DAVID", phone: "08012345678", time: "" }
    });

    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        toast({ title: "Callback Requested", description: "Our support team will call you back at your preferred time." });
        form.reset({ name: "PAAGO DAVID", phone: "08012345678", time: "" });
    }

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="time" render={({ field }) => <FormItem><FormLabel>Preferred Time</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl><SelectContent><SelectItem value="morning">Morning (9am-12pm)</SelectItem><SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem><SelectItem value="evening">Evening (4pm-6pm)</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />} Request Callback</Button>
            </form>
        </Form>
    );
}


export function SupportDashboard() {
    const [view, setView] = useState<View>('dashboard');
    const [title, setTitle] = useState('Support Center');
    
    const handleSetView = (newView: View, newTitle: string) => {
        setView(newView);
        setTitle(newTitle);
    }
    
    const renderContent = () => {
        switch(view) {
            case 'chat': return <ChatView />;
            case 'faq': return <FaqView />;
            case 'track': return <ComplaintView onNewComplaint={() => handleSetView('submit', 'Submit a New Complaint')} />;
            case 'submit': return <SubmitComplaintForm />;
            case 'callback': return <CallbackForm />;
            case 'fraud': return <Card><CardHeader><CardTitle>Report Fraud</CardTitle></CardHeader><CardContent><SubmitComplaintForm /></CardContent></Card>;
            case 'email': return <Card><CardHeader><CardTitle>Email Support</CardTitle></CardHeader><CardContent><SubmitComplaintForm /></CardContent></Card>;
            case 'dashboard':
            default: return <DashboardView setView={setView} />;
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
                    initial={{ opacity: 0, x: 50 }}
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