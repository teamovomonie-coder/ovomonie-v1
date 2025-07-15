
"use client";

import { useState, useEffect } from 'react';
import { InvoiceEditor } from './invoice-editor';
import { InvoiceView } from './invoice-view';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceFormData } from './invoice-editor';
import { format } from 'date-fns';

export interface Invoice extends InvoiceFormData {
  id: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';
  client: string;
}

const calculateTotal = (lineItems: { quantity: number; price: number; }[]) => {
    if (!lineItems) return 0;
    const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * 0.075;
    return subtotal + tax;
}

export function InvoicingDashboard() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'viewer'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('You must be logged in to view invoices.');

        const response = await fetch('/api/invoicing', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        setInvoices(data);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load your invoices. Please try again later.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'dashboard') {
        fetchInvoices();
    }
  }, [view]);

  const handleCreateNew = () => {
    const newInvoice: Invoice = {
      id: `DRAFT-${Date.now()}`,
      invoiceNumber: `INV-${String(Date.now()).slice(-4)}`,
      fromName: 'PAAGO DAVID (Ovo Thrive)',
      fromAddress: '123 Fintech Avenue, Lagos, Nigeria',
      toName: '',
      toEmail: '',
      toAddress: '',
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      lineItems: [{ description: '', quantity: 1, price: 0 }],
      notes: 'Thank you for your business. Please pay within 30 days.',
      status: 'Draft',
      client: ''
    };
    setSelectedInvoice(newInvoice);
    setView('editor');
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('editor');
  };
  
  const handlePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('viewer');
  }

  const handleSaveInvoice = async (data: InvoiceFormData) => {
    if (!selectedInvoice) return;
    
    const isOverdue = new Date() > data.dueDate;
    const finalInvoice: Partial<Invoice> = {
      ...data,
      status: isOverdue ? 'Overdue' : 'Unpaid',
      client: data.toName,
    };

    const isNew = selectedInvoice.id.startsWith('DRAFT');
    const url = isNew ? '/api/invoicing' : `/api/invoicing/${selectedInvoice.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('You must be logged in to save an invoice.');

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(finalInvoice),
        });
        const savedInvoice = await response.json();
        if (!response.ok) throw new Error(savedInvoice.message || 'Failed to save invoice');
        
        setSelectedInvoice(savedInvoice);
        setView('viewer');
        toast({ title: 'Invoice Saved!', description: 'Your invoice has been saved and is ready to be sent.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the invoice.' });
    }
  };

  const handleSaveDraft = async (data: InvoiceFormData) => {
    if (!selectedInvoice) return;

    const isNew = selectedInvoice.id.startsWith('DRAFT');
    const draftData: Partial<Invoice> = { ...data, status: 'Draft', client: data.toName || 'N/A' };
    
    const url = isNew ? '/api/invoicing' : `/api/invoicing/${selectedInvoice.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('You must be logged in to save a draft.');
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(draftData),
        });

        if (!response.ok) throw new Error('Failed to save draft');
        
        toast({ title: 'Draft saved successfully' });
        setView('dashboard');
    } catch (error) {
         toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the draft.' });
    }
  };

  if (view === 'editor' && selectedInvoice) {
    return <InvoiceEditor invoice={selectedInvoice} onSave={handleSaveInvoice} onSaveDraft={handleSaveDraft} onBack={() => setView('dashboard')} />;
  }
  
  if (view === 'viewer' && selectedInvoice) {
    return <InvoiceView invoice={selectedInvoice} onBack={() => setView('dashboard')} onInvoiceUpdated={fetchInvoices} />;
  }

  const renderInvoices = (statusFilter?: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft') => {
    const invoicesToRender = statusFilter ? invoices.filter(inv => inv.status === statusFilter) : invoices;
    
    if (isLoading) {
        return <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (invoicesToRender.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No invoices in this category.</div>
    }

    return (
      <div className="overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoicesToRender.map((invoice) => (
            <TableRow key={invoice.id} onClick={() => handleEdit(invoice)} className="cursor-pointer">
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Draft' ? 'secondary' : invoice.status === 'Overdue' ? 'destructive' : 'outline'}
                 className={`${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : invoice.status === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                    {invoice.status}
                </Badge>
              </TableCell>
               <TableCell>{format(new Date(invoice.dueDate), 'PPP')}</TableCell>
              <TableCell className="text-right">₦{calculateTotal(invoice.lineItems).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePreview(invoice); }}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoicing</h2>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
           <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              {renderInvoices()}
            </TabsContent>
            <TabsContent value="unpaid" className="m-0">
              {renderInvoices('Unpaid')}
            </TabsContent>
            <TabsContent value="paid" className="m-0">
              {renderInvoices('Paid')}
            </TabsContent>
            <TabsContent value="overdue" className="m-0">
              {renderInvoices('Overdue')}
            </TabsContent>
             <TabsContent value="draft" className="m-0">
              {renderInvoices('Draft')}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
