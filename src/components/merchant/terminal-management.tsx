
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, MapPin, Monitor, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';

interface Terminal {
  id: string;
  serialNumber: string;
  status: 'Active' | 'Inactive' | 'Faulty' | 'Pending';
  location: string;
  assignedTo: string;
  lastActivity: string;
  settlementAccount: string;
}

const posRequestSchema = z.object({
    businessName: z.string().min(3, { message: "Business name is required." }),
    address: z.string().min(10, { message: "A valid address is required." }),
    contactInfo: z.string().min(10, { message: "Contact phone number is required." }),
    posType: z.string({ required_error: "Please select a POS type." }),
    documents: z.any().optional(),
});
type PosRequestData = z.infer<typeof posRequestSchema>;

function RequestPosDialog() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PosRequestData>({
        resolver: zodResolver(posRequestSchema),
        defaultValues: { businessName: "", address: "", contactInfo: "", posType: "" },
    });

    const onSubmit = async (data: PosRequestData) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/agent/request-pos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...data, clientReference: `pos-req-${Date.now()}`})
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to submit request.");
            }

            toast({
                title: "Request Submitted!",
                description: "Your POS terminal request is being processed. We will contact you shortly."
            });
            setOpen(false);
            form.reset();

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error instanceof Error ? error.message : "An unknown error occurred."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Request New POS
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Request New POS Terminal</DialogTitle>
                    <DialogDescription>
                        Fill in your business details below to apply for a new terminal.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your registered business name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="Full business address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="contactInfo" render={({ field }) => ( <FormItem><FormLabel>Contact Phone Number</FormLabel><FormControl><Input placeholder="e.g., 08012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="posType" render={({ field }) => (
                            <FormItem><FormLabel>POS Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a terminal type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="android">Android POS</SelectItem>
                                        <SelectItem value="linux">Linux POS</SelectItem>
                                        <SelectItem value="smartpos">SmartPOS</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="documents" render={({ field }) => ( <FormItem><FormLabel>Upload Documents (CAC, ID, etc.)</FormLabel><FormControl><Input type="file" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


export function TerminalManagement() {
    const { toast } = useToast();
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTerminals = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('ovo-auth-token');
                if (!token) throw new Error("Authentication failed.");

                const response = await fetch('/api/agent/terminals', {
                     headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch terminals.");
                const data = await response.json();
                setTerminals(data);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error instanceof Error ? error.message : "Could not load terminal data."
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTerminals();
    }, [toast]);

    const handleAction = (action: string, terminalId: string) => {
        toast({
            title: `Action: ${action}`,
            description: `Performed ${action} on terminal ${terminalId}. (This is a demo)`,
        });
    }

    const totalTerminals = terminals.length;
    const activeTerminals = terminals.filter(t => t.status === 'Active').length;
    const inactiveTerminals = totalTerminals - activeTerminals;

  return (
    <div className="space-y-4 p-4">
        <h2 className="text-3xl font-bold tracking-tight">POS Terminal Management</h2>
        <p className="text-muted-foreground -mt-4">Monitor and manage all your POS devices.</p>

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Terminals</CardTitle>
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>{isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{totalTerminals}</div>}</CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Terminals</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>{isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{activeTerminals}</div>}</CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive/Faulty</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>{isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{inactiveTerminals}</div>}</CardContent>
            </Card>
        </div>

        <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>All Terminals</CardTitle>
                <CardDescription>A list of all POS devices assigned to your business.</CardDescription>
            </div>
            <RequestPosDialog />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Terminal ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {terminals.map((terminal) => (
                        <TableRow key={terminal.id}>
                            <TableCell className="font-medium">
                                <div>{terminal.id}</div>
                                <div className="text-xs text-muted-foreground">{terminal.serialNumber}</div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={cn(
                                        "capitalize border",
                                        terminal.status === 'Active' && 'bg-green-100 text-green-800 border-green-200',
                                        terminal.status === 'Inactive' && 'bg-gray-100 text-gray-800 border-gray-200',
                                        terminal.status === 'Faulty' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                        terminal.status === 'Pending' && 'bg-blue-100 text-blue-800 border-blue-200',
                                    )}
                                >
                                    {terminal.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div>{terminal.assignedTo}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {terminal.location}
                                </div>
                            </TableCell>
                            <TableCell>{terminal.lastActivity}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleAction('View Logs', terminal.id)}>View Terminal Logs</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAction('Reassign Agent', terminal.id)}>Reassign Agent</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-yellow-600" onClick={() => handleAction('Suspend Terminal', terminal.id)}>Suspend Terminal</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Report Fault', terminal.id)}>Report Fault</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
