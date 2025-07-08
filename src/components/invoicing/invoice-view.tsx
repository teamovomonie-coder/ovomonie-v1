
"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, CreditCard, Mail, MessageCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import type { Invoice } from './invoicing-dashboard';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react';

interface InvoiceViewProps {
  invoice: Invoice;
  onBack: () => void;
  onInvoiceUpdated: () => void;
}

export function InvoiceView({ invoice, onBack, onInvoiceUpdated }: InvoiceViewProps) {
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const tax = subtotal * 0.075;
  const total = subtotal + tax;

  const handleShare = (method: 'whatsapp' | 'email' | 'copy') => {
    const invoiceUrl = `https://ovomonie.ng/invoice/${invoice.id}`;
    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.fromName}`;
    const bodyText = `Hi ${invoice.toName},\n\nPlease find your invoice for ₦${total.toLocaleString()} from ${invoice.fromName}.\n\nYou can view and pay your invoice here: ${invoiceUrl}\n\nThank you!`;

    switch (method) {
        case 'whatsapp':
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(bodyText)}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            toast({ title: "Opening WhatsApp...", description: "Redirecting to share your invoice." });
            break;
        case 'email':
            const mailtoUrl = `mailto:${invoice.toEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
            window.location.href = mailtoUrl;
            toast({ title: "Opening Email Client...", description: "Please review and send your invoice." });
            break;
        case 'copy':
            navigator.clipboard.writeText(invoiceUrl);
            toast({
                title: "Link Copied!",
                description: "Invoice link copied to clipboard."
            });
            break;
    }
  }

  const handlePay = async () => {
    setIsProcessingPayment(true);
    try {
        const productsRes = await fetch('/api/inventory/products');
        if (!productsRes.ok) throw new Error('Could not fetch products for inventory update.');
        const allProducts: { id: string; name: string }[] = await productsRes.json();
        
        const saleLineItems = invoice.lineItems.map(item => {
            const product = allProducts.find(p => p.name.toLowerCase() === item.description.toLowerCase());
            return {
                productId: product?.id,
                quantity: item.quantity
            };
        }).filter((item): item is { productId: string; quantity: number } => !!item.productId);

        if (saleLineItems.length > 0) {
             const saleRes = await fetch('/api/inventory/stock/sale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lineItems: saleLineItems,
                    referenceId: invoice.invoiceNumber
                })
            });
            if (!saleRes.ok) throw new Error('Failed to update inventory stock.');
        }

        // Now, update the invoice status to Paid
        const updateRes = await fetch(`/api/invoicing/${invoice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...invoice, status: 'Paid' }),
        });
        if (!updateRes.ok) throw new Error('Failed to update invoice status.');
        
        toast({
            title: "Payment Successful & Inventory Updated!",
            description: `Stock for ${saleLineItems.length} item(s) has been updated and invoice marked as paid.`,
        });

        onInvoiceUpdated();
        onBack();

    } catch (error) {
        console.error("Failed to process payment:", error);
        let description = "There was an error processing this payment.";
        if (error instanceof Error) {
            description = error.message;
        }
        toast({
            variant: 'destructive',
            title: "Payment Failed",
            description: description,
        });
    } finally {
        setIsProcessingPayment(false);
    }
  }
  
  return (
    <div className="flex-1 space-y-4 p-2 sm:p-8 pt-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice Preview</h2>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
                <Button variant="outline"><Download className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">Download</span></Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button><Share2 className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">Share</span></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>WhatsApp</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('email')}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Email</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('copy')}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <span>Copy Link</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <Card className="max-w-4xl mx-auto p-4 sm:p-8 shadow-lg">
            <CardHeader className="p-0 sm:p-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                         {invoice.logo ? (
                             <div className="w-32 h-16 relative">
                                 <Image src={invoice.logo} alt="Business Logo" layout="fill" objectFit="contain" className="p-2" data-ai-hint="logo company" />
                             </div>
                         ) : (
                             <div className="w-32 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">Your Logo</div>
                         )}
                    </div>
                    <div className="text-left md:text-right">
                        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">{invoice.invoiceNumber}</h1>
                         <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Overdue' ? 'destructive' : 'secondary'}
                           className={`mt-2 text-base ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {invoice.status}
                        </Badge>
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground mb-1">From</h3>
                        <p className="font-bold">{invoice.fromName}</p>
                        <p>{invoice.fromAddress}</p>
                    </div>
                     <div className="text-left sm:text-right">
                        <h3 className="font-semibold text-muted-foreground mb-1">Bill To</h3>
                        <p className="font-bold">{invoice.toName}</p>
                        {invoice.toEmail && <p>{invoice.toEmail}</p>}
                        <p>{invoice.toAddress}</p>
                    </div>
                </div>
                 <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground mb-1">Issue Date</h3>
                        <p>{format(new Date(invoice.issueDate), 'PPP')}</p>
                    </div>
                    <div className="text-left sm:text-right">
                         <h3 className="font-semibold text-muted-foreground mb-1">Due Date</h3>
                        <p>{format(new Date(invoice.dueDate), 'PPP')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-4 mt-8">
                 <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {invoice.lineItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">₦{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-right">₦{(item.quantity * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                </TableRow>
                           ))}
                        </TableBody>
                    </Table>
                 </div>
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
                 {invoice.notes && (
                    <div className="mt-8 text-sm text-muted-foreground">
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p>{invoice.notes}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col sm:flex-row items-center justify-between p-4 mt-8 border-t">
                <div className="text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
                    <p className="font-bold">Thank you for your business!</p>
                    <p>Powered by Ovomonie</p>
                </div>
                {invoice.status !== 'Paid' && (
                    <Button size="lg" className="w-full sm:w-auto" onClick={handlePay} disabled={isProcessingPayment}>
                        {isProcessingPayment && <Loader2 className="mr-2 animate-spin" />}
                        <CreditCard className="mr-2" /> Mark as Paid & Update Stock
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
