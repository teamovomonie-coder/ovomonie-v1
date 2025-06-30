
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, ArrowLeft, Upload } from 'lucide-react';
import type { Invoice } from './invoicing-dashboard';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
});

const invoiceSchema = z.object({
  fromName: z.string().min(1, 'Your name/business name is required.'),
  fromAddress: z.string().min(1, 'Your address is required.'),
  toName: z.string().min(1, "Client's name is required."),
  toAddress: z.string().min(1, "Client's address is required."),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
  logo: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceEditorProps {
  invoice: Invoice | null;
  onSave: (data: InvoiceFormData) => void;
  onBack: () => void;
}

export function InvoiceEditor({ invoice, onSave, onBack }: InvoiceEditorProps) {
  const defaultValues = {
    fromName: 'PAAGO DAVID (Ovo Thrive)',
    fromAddress: '123 Fintech Avenue, Lagos, Nigeria',
    toName: invoice?.client || '',
    toAddress: '',
    invoiceNumber: invoice?.id || `INV-${String(Date.now()).slice(-4)}`,
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    lineItems: [{ description: '', quantity: 1, price: 0 }],
    notes: 'Thank you for your business. Please pay within 30 days.',
    logo: null,
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  
  const watchedLineItems = form.watch('lineItems');
  
  const subtotal = watchedLineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + tax;

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        form.setValue('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <h2 className="text-3xl font-bold tracking-tight">{invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline">Save Draft</Button>
                    <Button type="submit">Preview & Send</Button>
                </div>
            </div>

            <Card className="p-6">
                {/* Header Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <FormField control={form.control} name="logo" render={() => (
                            <FormItem>
                                <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer">
                                    <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="absolute h-full w-full opacity-0 cursor-pointer" />
                                    {logoPreview ? (
                                        <Image src={logoPreview} alt="Logo Preview" layout="fill" objectFit="contain" className="p-2" data-ai-hint="logo company"/>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="mx-auto h-8 w-8" />
                                            <p className="text-xs mt-1">Upload Logo</p>
                                        </div>
                                    )}
                                </div>
                            </FormItem>
                        )} />
                    </div>
                    <div className="text-right">
                         <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                            <FormItem>
                                <Input {...field} className="text-2xl font-bold border-none text-right shadow-none focus-visible:ring-0 p-0 h-auto" />
                            </FormItem>
                        )} />
                        <p className="text-muted-foreground">Invoice</p>
                    </div>
                </div>

                {/* From/To Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold mb-2">From:</h3>
                        <FormField control={form.control} name="fromName" render={({ field }) => (<FormItem><FormControl><Input placeholder="Your Name / Business" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="fromAddress" render={({ field }) => (<FormItem className="mt-2"><FormControl><Textarea placeholder="Your Address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">To:</h3>
                        <FormField control={form.control} name="toName" render={({ field }) => (<FormItem><FormControl><Input placeholder="Client's Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="toAddress" render={({ field }) => (<FormItem className="mt-2"><FormControl><Textarea placeholder="Client's Address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>

                {/* Dates Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover><FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover><FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                <Separator className="my-8" />
                
                {/* Line Items Section */}
                <div>
                     <div className="grid grid-cols-[1fr,100px,100px,120px,auto] gap-2 mb-2 font-semibold">
                        <span>Description</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">Total</span>
                        <span></span>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-[1fr,100px,100px,120px,auto] gap-2 items-start mb-2">
                             <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (<FormItem><FormControl><Textarea {...field} placeholder="Item description" className="min-h-0" /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" {...field} className="text-right" /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`lineItems.${index}.price`} render={({ field }) => (<FormItem><FormControl><Input type="number" {...field} className="text-right" /></FormControl><FormMessage /></FormItem>)} />
                             <Input readOnly value={`₦${(watchedLineItems[index]?.quantity * watchedLineItems[index]?.price).toLocaleString()}`} className="text-right bg-muted" />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
                
                <Separator className="my-8" />

                {/* Totals Section */}
                <div className="grid md:grid-cols-2">
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any additional notes for the client" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="space-y-2 self-end text-right mt-4 md:mt-0">
                        <div className="flex justify-end gap-4 font-semibold"><span>Subtotal:</span><span>₦{subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-end gap-4 font-semibold"><span>Tax (7.5%):</span><span>₦{tax.toLocaleString()}</span></div>
                        <div className="flex justify-end gap-4 text-xl font-bold border-t pt-2 mt-2"><span>Total:</span><span>₦{total.toLocaleString()}</span></div>
                    </div>
                </div>
            </Card>
        </form>
      </Form>
    </div>
  );
}
