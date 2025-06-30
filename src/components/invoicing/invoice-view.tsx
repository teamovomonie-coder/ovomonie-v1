
"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, CreditCard } from 'lucide-react';
import type { Invoice } from './invoicing-dashboard';

interface InvoiceViewProps {
  invoice: Invoice; // Using the simple mock type for now, would be InvoiceFormData in a real app
  onBack: () => void;
}

export function InvoiceView({ invoice, onBack }: InvoiceViewProps) {
  // In a real app, these values would come from the full invoice object
  const subtotal = invoice.amount / 1.075;
  const tax = invoice.amount - subtotal;
  const total = invoice.amount;
  
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
       <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                <h2 className="text-3xl font-bold tracking-tight">Invoice Preview</h2>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Download className="mr-2" /> Download PDF</Button>
                <Button><Share2 className="mr-2" /> Share</Button>
            </div>
        </div>

        <Card className="max-w-4xl mx-auto p-4 sm:p-8 shadow-lg">
            <CardHeader className="p-0 sm:p-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                         {/* Placeholder for logo */}
                         <div className="w-32 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">Logo</div>
                    </div>
                    <div className="text-left md:text-right">
                        <h1 className="text-4xl font-bold text-primary tracking-tight">{invoice.id}</h1>
                         <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Overdue' ? 'destructive' : 'secondary'}
                           className={`mt-2 text-base ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {invoice.status}
                        </Badge>
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground mb-1">From</h3>
                        <p className="font-bold">PAAGO DAVID (Ovo Thrive)</p>
                        <p>123 Fintech Avenue,</p>
                        <p>Lagos, Nigeria</p>
                    </div>
                     <div className="text-left sm:text-right">
                        <h3 className="font-semibold text-muted-foreground mb-1">Bill To</h3>
                        <p className="font-bold">{invoice.client}</p>
                        <p>456 Client Street,</p>
                        <p>Abuja, Nigeria</p>
                    </div>
                </div>
                 <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground mb-1">Issue Date</h3>
                        <p>July 28, 2024</p>
                    </div>
                    <div className="text-left sm:text-right">
                         <h3 className="font-semibold text-muted-foreground mb-1">Due Date</h3>
                        <p>{invoice.dueDate}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-4 mt-8">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Description</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Premium UI/UX Design</TableCell>
                            <TableCell className="text-right">1</TableCell>
                            <TableCell className="text-right">₦100,000</TableCell>
                            <TableCell className="text-right">₦100,000</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Backend Development</TableCell>
                            <TableCell className="text-right">1</TableCell>
                            <TableCell className="text-right">₦200,000</TableCell>
                            <TableCell className="text-right">₦200,000</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Separator className="my-6" />
                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₦{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VAT (7.5%)</span>
                            <span>₦{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                         <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                            <span>Total</span>
                            <span>₦{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row items-center justify-between p-4 mt-8 border-t">
                <div className="text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
                    <p className="font-bold">Thank you for your business!</p>
                    <p>Powered by Ovomonie</p>
                </div>
                {invoice.status !== 'Paid' && (
                    <Button size="lg" className="w-full sm:w-auto">
                        <CreditCard className="mr-2" /> Pay Now
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
