
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

// Mock data
const mockInvoices = [
  { id: 'INV-003', client: 'Tech Solutions Ltd.', amount: 150000, status: 'Paid', dueDate: '2024-07-20' },
  { id: 'INV-002', client: 'Creative Designs Inc.', amount: 75000, status: 'Unpaid', dueDate: '2024-08-15' },
  { id: 'INV-001', client: 'Global Exports', amount: 320000, status: 'Overdue', dueDate: '2024-07-01' },
];

export type Invoice = typeof mockInvoices[0];

export function InvoicingDashboard() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'viewer'>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleCreateNew = () => {
    setSelectedInvoice(null);
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

  const handleSaveInvoice = (invoiceData: any) => {
    console.log("Saving invoice", invoiceData);
    // Here you would add logic to save the new/updated invoice
    // For now, we just go back to the dashboard
    setView('dashboard');
  };

  if (view === 'editor') {
    return <InvoiceEditor invoice={selectedInvoice} onSave={handleSaveInvoice} onBack={() => setView('dashboard')} />;
  }
  
  if (view === 'viewer' && selectedInvoice) {
    return <InvoiceView invoice={selectedInvoice} onBack={() => setView('dashboard')} />;
  }

  const renderInvoices = (statusFilter?: 'Paid' | 'Unpaid' | 'Overdue') => {
    const invoices = statusFilter ? mockInvoices.filter(inv => inv.status === statusFilter) : mockInvoices;
    
    if (invoices.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No invoices in this category.</div>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} onClick={() => handleEdit(invoice)} className="cursor-pointer">
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Overdue' ? 'destructive' : 'secondary'}
                 className={`${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">₦{invoice.amount.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePreview(invoice); }}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
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
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
