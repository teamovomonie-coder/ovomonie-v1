
"use client";

import { useState } from 'react';
import { InvoiceEditor } from './invoice-editor';
import { InvoiceView } from './invoice-view';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceFormData } from './invoice-editor';
import { format } from 'date-fns';

export interface Invoice extends InvoiceFormData {
  id: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';
  client: string;
}

const mockInvoicesData: Invoice[] = [
  { 
    id: 'INV-003', 
    invoiceNumber: 'INV-003',
    client: 'Tech Solutions Ltd.',
    fromName: 'PAAGO DAVID (Ovo Thrive)', fromAddress: '123 Fintech Avenue, Lagos, Nigeria',
    toName: 'Tech Solutions Ltd.', 
    toEmail: 'billing@techsolutions.com',
    toAddress: '789 Tech Park, Abuja, Nigeria',
    issueDate: new Date('2024-07-10'), dueDate: new Date('2024-07-20'),
    lineItems: [{ description: 'Cloud Hosting Services', quantity: 1, price: 150000 }],
    notes: 'Thank you for your business.',
    status: 'Paid'
  },
  { 
    id: 'INV-002', 
    invoiceNumber: 'INV-002',
    client: 'Creative Designs Inc.',
    fromName: 'PAAGO DAVID (Ovo Thrive)', fromAddress: '123 Fintech Avenue, Lagos, Nigeria',
    toName: 'Creative Designs Inc.', 
    toEmail: 'accounts@creativedesigns.com',
    toAddress: '456 Art Plaza, Ibadan, Nigeria',
    issueDate: new Date('2024-07-15'), dueDate: new Date('2024-08-15'),
    lineItems: [{ description: 'Logo Design & Branding', quantity: 1, price: 75000 }],
    notes: 'Payment is due within 30 days.',
    status: 'Unpaid'
  },
  { 
    id: 'INV-001',
    invoiceNumber: 'INV-001', 
    client: 'Global Exports',
    fromName: 'PAAGO DAVID (Ovo Thrive)', fromAddress: '123 Fintech Avenue, Lagos, Nigeria',
    toName: 'Global Exports',
    toEmail: 'exports@global.com',
    toAddress: '101 Trade Fair, Port Harcourt, Nigeria',
    issueDate: new Date('2024-06-01'), dueDate: new Date('2024-07-01'),
    lineItems: [
        { description: 'Shipping & Logistics', quantity: 2, price: 100000 },
        { description: 'Export Documentation', quantity: 1, price: 120000 }
    ],
    notes: 'Please reference invoice number on payment.',
    status: 'Overdue'
  },
];

const calculateTotal = (lineItems: { quantity: number; price: number; }[]) => {
    const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * 0.075;
    return subtotal + tax;
}

export function InvoicingDashboard() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'viewer'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoicesData);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

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

  const upsertInvoice = (invoiceData: Invoice) => {
     setInvoices(prev => {
        const index = prev.findIndex(inv => inv.id === invoiceData.id);
        if (index > -1) {
            const newInvoices = [...prev];
            newInvoices[index] = invoiceData;
            return newInvoices;
        }
        return [...prev, invoiceData];
    });
  }

  const handleSaveInvoice = (data: InvoiceFormData) => {
    if (!selectedInvoice) return;
    
    const isOverdue = new Date() > data.dueDate;

    const finalInvoice: Invoice = {
      ...data,
      id: selectedInvoice.id.startsWith('DRAFT') ? data.invoiceNumber : selectedInvoice.id,
      status: isOverdue ? 'Overdue' : 'Unpaid',
      client: data.toName,
    };
    upsertInvoice(finalInvoice);
    setSelectedInvoice(finalInvoice);
    setView('viewer');
    toast({ title: 'Invoice Saved!', description: 'Your invoice has been saved and is ready to be sent.' });
  };

  const handleSaveDraft = (data: InvoiceFormData) => {
    if (!selectedInvoice) return;
    const draftInvoice: Invoice = {
      ...data,
      id: selectedInvoice.id,
      status: 'Draft',
      client: data.toName || 'N/A'
    };
    upsertInvoice(draftInvoice);
    toast({ title: 'Draft saved successfully' });
    setView('dashboard');
  };

  if (view === 'editor' && selectedInvoice) {
    return <InvoiceEditor invoice={selectedInvoice} onSave={handleSaveInvoice} onSaveDraft={handleSaveDraft} onBack={() => setView('dashboard')} />;
  }
  
  if (view === 'viewer' && selectedInvoice) {
    return <InvoiceView invoice={selectedInvoice} onBack={() => setView('dashboard')} />;
  }

  const renderInvoices = (statusFilter?: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft') => {
    const invoicesToRender = statusFilter ? invoices.filter(inv => inv.status === statusFilter) : invoices;
    
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
               <TableCell>{format(invoice.dueDate, 'PPP')}</TableCell>
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
