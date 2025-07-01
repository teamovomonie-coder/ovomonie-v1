
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Bar, Tooltip } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { format } from 'date-fns';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Import Icons
import { Package, PackageSearch, DollarSign, PlusCircle, MoreHorizontal, Search, TrendingUp, Camera, VideoOff, AlertTriangle, ShoppingBag, Phone, Mail, Map, Loader2, FileClock, ClipboardList } from 'lucide-react';

const locationStockSchema = z.object({
    locationId: z.string(),
    quantity: z.coerce.number().nonnegative('Stock cannot be negative.'),
});

const productSchema = z.object({
  id: z.string().optional(),
  businessId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  name: z.string().min(3, 'Product name is required.'),
  sku: z.string().min(3, 'SKU is required.'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  costPrice: z.coerce.number().nonnegative('Cost price cannot be negative.'),
  stockByLocation: z.array(locationStockSchema).default([]),
  minStockLevel: z.coerce.number().nonnegative('Minimum stock level cannot be negative.'),
  unit: z.string().min(1, 'Unit is required.'),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  supplierId: z.string().optional(),
});

type Product = z.infer<typeof productSchema>;

const supplierSchema = z.object({
    id: z.string().optional(),
    businessId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    name: z.string().min(3, "Supplier name is required."),
    phone: z.string().optional(),
    email: z.string().email("Please enter a valid email.").optional(),
    address: z.string().optional(),
});
type Supplier = z.infer<typeof supplierSchema>;

const locationSchema = z.object({
    id: z.string().optional(),
    businessId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    name: z.string().min(3, 'Location name is required.'),
    address: z.string().optional(),
});
type Location = z.infer<typeof locationSchema>;

const categorySchema = z.object({
    id: z.string().optional(),
    businessId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    name: z.string().min(3, 'Category name is required.'),
    description: z.string().optional(),
});
type Category = z.infer<typeof categorySchema>;

const stockAdjustmentSchema = z.object({
  newStock: z.coerce.number().nonnegative('Stock cannot be negative.'),
  locationId: z.string().min(1, 'Please select a location'),
  reason: z.string().min(1, 'Please select a reason.'),
  notes: z.string().optional(),
});
type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface EnrichedTransaction {
    id: string;
    productId: string;
    locationId?: string;
    type: 'purchase' | 'sale' | 'return' | 'adjustment';
    quantity: number;
    previousStock: number;
    newStock: number;
    date: string;
    referenceId?: string;
    notes?: string;
    productName: string;
    locationName: string;
}


function ProductForm({ product, suppliers, locations, categories, onSave, onCancel }: { product: Partial<Product> | null, suppliers: Supplier[], locations: Location[], categories: Category[], onSave: (data: Product) => void, onCancel: () => void }) {
    const form = useForm<Product>({
        resolver: zodResolver(productSchema),
        defaultValues: product ? {
            ...product,
            stockByLocation: locations.map(loc => {
                const existing = product.stockByLocation?.find(s => s.locationId === loc.id);
                return existing || { locationId: loc.id!, quantity: 0 };
            }),
        } : {
            name: '', sku: '', barcode: '', categoryId: '', price: 0, costPrice: 0, stockByLocation: locations.map(loc => ({ locationId: loc.id!, quantity: 0 })), minStockLevel: 0, unit: 'pcs', supplierId: '', batchNumber: '', expiryDate: ''
        },
    });

    const onSubmit = (data: Product) => {
        onSave({ ...product, ...data });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Indomie Noodles" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="Unique Product Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>Barcode (Optional)</FormLabel><FormControl><Input placeholder="Scan or type barcode" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Selling Price (₦)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="costPrice" render={({ field }) => (<FormItem><FormLabel>Cost Price (₦)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <Card>
                    <CardHeader><CardTitle className="text-base">Stock Levels</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {locations.map((loc, index) => (
                             <FormField
                                key={loc.id}
                                control={form.control}
                                name={`stockByLocation.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{loc.name}</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="minStockLevel" render={({ field }) => (<FormItem><FormLabel>Min. Stock Level (Per Location)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., pcs, kg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         </div>
                    </CardContent>
                </Card>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="batchNumber" render={({ field }) => (<FormItem><FormLabel>Batch Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., B123XYZ" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ? field.value.split('T')[0] : ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supplier (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="sticky bottom-0 bg-background pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Product</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function SupplierForm({ supplier, onSave, onCancel }: { supplier: Partial<Supplier> | null, onSave: (data: Supplier) => void, onCancel: () => void }) {
    const form = useForm<Supplier>({
        resolver: zodResolver(supplierSchema),
        defaultValues: supplier || { name: '', phone: '', email: '', address: '' },
    });

    const onSubmit = (data: Supplier) => {
        onSave({ ...supplier, ...data });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="e.g., West African Foods Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="08012345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="orders@supplier.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Supplier's physical address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Supplier</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function LocationForm({ location, onSave, onCancel }: { location: Partial<Location> | null, onSave: (data: Location) => void, onCancel: () => void }) {
    const form = useForm<Location>({
        resolver: zodResolver(locationSchema),
        defaultValues: location || { name: '', address: '' },
    });
    
    const onSubmit = (data: Location) => { onSave({ ...location, ...data }); };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Main Store - Lekki" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input placeholder="Full address of the location" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Location</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function CategoryForm({ category, onSave, onCancel }: { category: Partial<Category> | null, onSave: (data: Category) => void, onCancel: () => void }) {
    const form = useForm<Category>({
        resolver: zodResolver(categorySchema),
        defaultValues: category || { name: '', description: '' },
    });
    
    const onSubmit = (data: Category) => { onSave({ ...category, ...data }); };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Category Name</FormLabel><FormControl><Input placeholder="e.g., Groceries" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="A short description of the category" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Category</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function StockAdjustmentDialog({ product, locations, onAdjust, open, onOpenChange }: { product: Product | null, locations: Location[], onAdjust: (productId: string, data: StockAdjustmentData) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!product) return null;

    const form = useForm<StockAdjustmentData>({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: { newStock: 0, reason: '', notes: '', locationId: '' },
    });

    const watchedLocationId = form.watch('locationId');
    const currentStockAtLocation = useMemo(() => {
        return product.stockByLocation.find(s => s.locationId === watchedLocationId)?.quantity || 0;
    }, [product, watchedLocationId]);

    useEffect(() => {
        form.setValue('newStock', currentStockAtLocation);
    }, [currentStockAtLocation, form]);
    
    const onSubmit = (data: StockAdjustmentData) => {
        onAdjust(product.id!, data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Stock for {product.name}</DialogTitle>
                     <DialogDescription>
                        Select a location to adjust its stock level.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="locationId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a location to adjust" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {locations.map(loc => <SelectItem key={loc.id} value={loc.id!}>{loc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        {watchedLocationId && (
                            <div className="text-sm">Current stock at this location: <span className="font-bold">{currentStockAtLocation} {product.unit}</span></div>
                        )}
                        <FormField control={form.control} name="newStock" render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Stock Quantity</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="reason" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason for Adjustment</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="stock-count">Stock Count Correction</SelectItem>
                                        <SelectItem value="damaged">Damaged Goods</SelectItem>
                                        <SelectItem value="return">Customer Return</SelectItem>
                                        <SelectItem value="theft-loss">Theft / Loss</SelectItem>
                                        <SelectItem value="promotion">Promotional Use</SelectItem>
                                        <SelectItem value="transfer-in">Stock Transfer In</SelectItem>
                                        <SelectItem value="transfer-out">Stock Transfer Out</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Add any relevant details..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={!watchedLocationId}>Confirm Adjustment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function BarcodeScannerDialog({ open, onOpenChange, onScanSuccess, onScanNew, products }: { open: boolean, onOpenChange: (open: boolean) => void, onScanSuccess: (sku: string, name: string) => void, onScanNew: (barcode: string) => void, products: Product[] }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!open) return;
        
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);
            if (videoRef.current) videoRef.current.srcObject = stream;
          } catch (error) {
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in browser settings.' });
          }
        };
        getCameraPermission();

        return () => {
          if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          }
        }
    }, [open, toast]);

    const handleSimulateScan = () => {
        const isExisting = Math.random() > 0.3;
        if (isExisting) {
            const productWithBarcode = products.find(p => p.barcode);
            if (productWithBarcode) {
                onScanSuccess(productWithBarcode.sku, productWithBarcode.name);
            }
        } else {
            const newBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
            onScanNew(newBarcode);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Product Barcode</DialogTitle>
                    <DialogDescription>Position the barcode within the frame. The scan will happen automatically.</DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-square mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute top-4 left-4 border-t-4 border-l-4 border-primary w-12 h-12 rounded-tl-lg"></div>
                        <div className="absolute top-4 right-4 border-t-4 border-r-4 border-primary w-12 h-12 rounded-tr-lg"></div>
                        <div className="absolute bottom-4 left-4 border-b-4 border-l-4 border-primary w-12 h-12 rounded-bl-lg"></div>
                        <div className="absolute bottom-4 right-4 border-b-4 border-r-4 border-primary w-12 h-12 rounded-br-lg"></div>
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20 p-4">
                            <VideoOff className="w-16 h-16 mb-4" />
                            <h3 className="text-xl font-bold">Camera Access Required</h3>
                            <p className="text-sm mt-2">Please allow camera access to scan QR codes.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSimulateScan} className="w-full" disabled={hasCameraPermission === false}>Simulate Scan</Button>
                </DialogFooter>
                 <style jsx>{`
                    @keyframes scan {
                        0%, 100% { transform: translateY(-120px); }
                        50% { transform: translateY(120px); }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

function TransactionHistory() {
    const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/inventory/transactions');
                if (!response.ok) throw new Error('Failed to fetch transactions');
                const data = await response.json();
                setTransactions(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load transaction history.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [toast]);

    if (isLoading) {
        return <div className="mt-4 flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stock Movement History</CardTitle>
                <CardDescription>A log of all changes to your inventory stock levels.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-center">Change</TableHead>
                            <TableHead className="text-center">New Qty</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Notes/Ref</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {transactions.map(txn => (
                                <TableRow key={txn.id}>
                                    <TableCell>{format(new Date(txn.date), 'dd MMM, yyyy HH:mm')}</TableCell>
                                    <TableCell>{txn.productName}</TableCell>
                                    <TableCell className="capitalize">{txn.type}</TableCell>
                                    <TableCell className={cn("text-center font-semibold", txn.quantity > 0 ? 'text-green-600' : 'text-destructive')}>
                                        {txn.quantity > 0 ? `+${txn.quantity}` : txn.quantity}
                                    </TableCell>
                                    <TableCell className="text-center">{txn.newStock}</TableCell>
                                    <TableCell>{txn.locationName}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{txn.notes || txn.referenceId || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {transactions.length === 0 && <div className="text-center py-10 text-muted-foreground">No stock movements recorded yet.</div>}
            </CardContent>
        </Card>
    );
}

export function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<Location> | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [productsRes, suppliersRes, locationsRes, categoriesRes] = await Promise.all([
            fetch('/api/inventory/products'),
            fetch('/api/inventory/suppliers'),
            fetch('/api/inventory/locations'),
            fetch('/api/inventory/categories'),
        ]);
        if (!productsRes.ok || !suppliersRes.ok || !locationsRes.ok || !categoriesRes.ok) {
            throw new Error('Failed to fetch initial data');
        }
        const productsData = await productsRes.json();
        const suppliersData = await suppliersRes.json();
        const locationsData = await locationsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setProducts(productsData);
        setSuppliers(suppliersData);
        setLocations(locationsData);
        setCategories(categoriesData);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching data', description: 'Could not load inventory data. Please try again later.' });
        console.error("Failed to fetch data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const salesData = [
    { date: 'Mon', sales: 40000 }, { date: 'Tue', sales: 30000 }, { date: 'Wed', sales: 20000 }, { date: 'Thu', sales: 27800 }, { date: 'Fri', sales: 18900 }, { date: 'Sat', sales: 23900 }, { date: 'Sun', sales: 34900 },
  ];
  
  const bestSellingProducts = [
    { name: 'Coca-Cola 50cl', sold: 120, revenue: 24000 }, { name: 'Indomie Noodles Chicken', sold: 98, revenue: 24500 }, { name: 'Peak Milk Evaporated', sold: 75, revenue: 30000 }, { name: 'Golden Penny Semovita 1kg', sold: 40, revenue: 48000 },
  ];

  const chartConfig = { sales: { label: "Sales (₦)", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);
  
  const lowStockProducts = useMemo(() => {
    const lowStockItems: (Product & { lowStockLocations: Location[] })[] = [];
    products.forEach(p => {
        const lowLocations: Location[] = [];
        p.stockByLocation.forEach(s => {
            const location = locations.find(l => l.id === s.locationId);
            if (location && s.quantity <= p.minStockLevel) {
                lowLocations.push(location);
            }
        });
        if (lowLocations.length > 0) {
            lowStockItems.push({ ...p, lowStockLocations: lowLocations });
        }
    });
    return lowStockItems;
  }, [products, locations]);

  const lowStockCount = lowStockProducts.length;

  const inventoryValue = useMemo(() => {
      return products.reduce((total, p) => {
          const productStock = p.stockByLocation.reduce((sum, s) => sum + s.quantity, 0);
          return total + (p.costPrice * productStock);
      }, 0);
  }, [products]);

  const getExpiryStatus = (expiryDateString?: string) => {
    if (!expiryDateString) return null;
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expiryDate < today) return 'expired';
    if (expiryDate <= thirtyDaysFromNow) return 'soon';
    return 'ok';
  }

  const expiringSoonCount = useMemo(() => {
    return products.filter(p => {
        const status = getExpiryStatus(p.expiryDate);
        return status === 'soon' || status === 'expired';
    }).length;
  }, [products]);

  const handleSaveProduct = async (data: Product) => {
    const url = data.id ? `/api/inventory/products/${data.id}` : '/api/inventory/products';
    const method = data.id ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save product');
        await fetchData(); // Refresh data
        toast({ title: `Product ${data.id ? 'Updated' : 'Added'}`, description: `${data.name} has been saved.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the product.' });
    } finally {
        setIsFormDialogOpen(false);
        setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
        const response = await fetch(`/api/inventory/products/${productId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete product');
        await fetchData(); // Refresh data
        toast({ variant: "destructive", title: "Product Deleted", description: "The product has been removed from your inventory."});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the product.' });
    }
  };

  const handleSaveSupplier = async (data: Supplier) => {
    const url = data.id ? `/api/inventory/suppliers/${data.id}` : '/api/inventory/suppliers';
    const method = data.id ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save supplier');
        await fetchData(); // Refresh data
        toast({ title: `Supplier ${data.id ? 'Updated' : 'Added'}`, description: `${data.name} has been saved.`});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the supplier.' });
    } finally {
        setIsSupplierFormOpen(false);
        setEditingSupplier(null);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
        const response = await fetch(`/api/inventory/suppliers/${supplierId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete supplier');
        await fetchData(); // Refresh data
        toast({ variant: "destructive", title: "Supplier Deleted"});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the supplier.' });
    }
  };
  
  const handleSaveLocation = async (data: Location) => {
     const url = data.id ? `/api/inventory/locations/${data.id}` : '/api/inventory/locations';
     const method = data.id ? 'PUT' : 'POST';
     try {
         const response = await fetch(url, {
             method: method,
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(data),
         });
         if (!response.ok) throw new Error('Failed to save location');
         await fetchData(); // Refresh data
         toast({ title: `Location ${data.id ? 'Updated' : 'Added'}`, description: `${data.name} has been saved.`});
     } catch (error) {
         toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the location.' });
     } finally {
         setIsLocationFormOpen(false);
         setEditingLocation(null);
     }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
        const response = await fetch(`/api/inventory/locations/${locationId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete location');
        await fetchData(); // Refresh data
        toast({ variant: "destructive", title: "Location Deleted"});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the location.' });
    }
  };

  const handleSaveCategory = async (data: Category) => {
     const url = data.id ? `/api/inventory/categories/${data.id}` : '/api/inventory/categories';
     const method = data.id ? 'PUT' : 'POST';
     try {
         const response = await fetch(url, {
             method: method,
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(data),
         });
         if (!response.ok) throw new Error('Failed to save category');
         await fetchData(); // Refresh data
         toast({ title: `Category ${data.id ? 'Updated' : 'Added'}`, description: `${data.name} has been saved.`});
     } catch (error) {
         toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the category.' });
     } finally {
         setIsCategoryFormOpen(false);
         setEditingCategory(null);
     }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Check if category is in use
    const isCategoryInUse = products.some(p => p.categoryId === categoryId);
    if (isCategoryInUse) {
        toast({
            variant: "destructive",
            title: "Cannot Delete Category",
            description: "This category is currently assigned to one or more products. Please reassign them before deleting."
        });
        return;
    }

    try {
        const response = await fetch(`/api/inventory/categories/${categoryId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete category');
        await fetchData(); // Refresh data
        toast({ variant: "destructive", title: "Category Deleted"});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the category.' });
    }
  };

  const handleStockAdjustment = async (productId: string, data: StockAdjustmentData) => {
    try {
        const response = await fetch('/api/inventory/stock/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, productId }),
        });
        if (!response.ok) throw new Error('Failed to adjust stock');
        
        await fetchData(); // Refresh data
        const locationName = locations.find(l => l.id === data.locationId)?.name;
        const productToAdjust = products.find(p => p.id === productId);
        toast({ title: "Stock Adjusted", description: `Stock for ${productToAdjust?.name} at ${locationName} has been updated to ${data.newStock}.`});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Adjustment Failed', description: 'Could not adjust stock.' });
    } finally {
        setAdjustingProduct(null);
    }
  };

  const handleScanSuccess = (sku: string, name: string) => {
    setSearchQuery(sku);
    setIsScannerOpen(false);
    toast({ title: 'Product Found!', description: `Displaying details for ${name}.` });
  };

  const handleScanNew = (barcode: string) => {
    setIsScannerOpen(false);
    setEditingProduct({ barcode, name: '', sku: '', categoryId: '', price: 0, costPrice: 0, stockByLocation: [], minStockLevel: 0, unit: 'pcs' });
    setIsFormDialogOpen(true);
    toast({ title: 'New Barcode Scanned', description: 'Please fill in the details for this new product.' });
  };
  
  const handleContactSupplier = (action: 'call' | 'email', supplierId?: string) => {
    if (!supplierId) {
        toast({ variant: 'destructive', title: 'No Supplier', description: 'This product has no assigned supplier.' });
        return;
    }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        toast({ variant: 'destructive', title: 'Supplier Not Found' });
        return;
    }

    if (action === 'call') {
        if (!supplier.phone) {
            toast({ variant: 'destructive', title: 'No Phone Number', description: `No phone number found for ${supplier.name}.` });
            return;
        }
        window.location.href = `tel:${supplier.phone}`;
        toast({ title: `Calling ${supplier.name}`, description: 'Opening phone app...' });
    } else if (action === 'email') {
        if (!supplier.email) {
            toast({ variant: 'destructive', title: 'No Email Address', description: `No email address found for ${supplier.name}.` });
            return;
        }
        window.location.href = `mailto:${supplier.email}`;
        toast({ title: `Emailing ${supplier.name}`, description: 'Opening email client...' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
             <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingProduct(null); setIsFormDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add a New Product'}</DialogTitle>
                    </DialogHeader>
                    <ProductForm 
                        product={editingProduct} 
                        suppliers={suppliers}
                        locations={locations}
                        categories={categories}
                        onSave={handleSaveProduct} 
                        onCancel={() => setIsFormDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>

        <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                </DialogHeader>
                <SupplierForm supplier={editingSupplier} onSave={handleSaveSupplier} onCancel={() => setIsSupplierFormOpen(false)} />
            </DialogContent>
        </Dialog>

         <Dialog open={isLocationFormOpen} onOpenChange={setIsLocationFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                </DialogHeader>
                <LocationForm location={editingLocation} onSave={handleSaveLocation} onCancel={() => setIsLocationFormOpen(false)} />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <CategoryForm category={editingCategory} onSave={handleSaveCategory} onCancel={() => setIsCategoryFormOpen(false)} />
            </DialogContent>
        </Dialog>

        <StockAdjustmentDialog 
            product={adjustingProduct} 
            locations={locations}
            open={!!adjustingProduct}
            onOpenChange={(open) => !open && setAdjustingProduct(null)}
            onAdjust={handleStockAdjustment}
        />
        
        <BarcodeScannerDialog 
            open={isScannerOpen} 
            onOpenChange={setIsScannerOpen}
            onScanSuccess={handleScanSuccess}
            onScanNew={handleScanNew}
            products={products}
        />

        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reorder" className="relative">Reorder
                    {lowStockCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{lowStockCount}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            {isLoading ? (
                <div className="mt-4 flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today's Sales</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₦{salesData.reduce((acc, s) => acc + s.sales, 0).toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock Items</CardTitle><PackageSearch className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{lowStockCount}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₦{inventoryValue.toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Expiring Soon</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{expiringSoonCount}</div></CardContent></Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Product List</CardTitle>
                                <CardDescription>Manage all products in your inventory.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="Search by name or SKU..." className="pl-10 pr-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setIsScannerOpen(true)}>
                                    <Camera className="h-5 w-5" />
                                    <span className="sr-only">Scan Barcode</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="hidden sm:table-cell">Category</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead className="text-right hidden sm:table-cell">Price</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    <div>{product.name}</div>
                                                    <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                                    {(product.batchNumber || product.expiryDate) && (
                                                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                            {product.batchNumber && <div>Batch: {product.batchNumber}</div>}
                                                            {product.expiryDate && (
                                                                <div className={cn({
                                                                    'text-destructive font-semibold': getExpiryStatus(product.expiryDate) === 'expired',
                                                                    'text-amber-600 font-semibold': getExpiryStatus(product.expiryDate) === 'soon',
                                                                })}>
                                                                    Expires: {format(new Date(product.expiryDate), 'dd MMM, yyyy')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">{categories.find(c => c.id === product.categoryId)?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="link" className={cn("p-0 h-auto font-bold", product.stockByLocation.reduce((sum, s) => sum + s.quantity, 0) <= product.minStockLevel && "text-destructive")}>
                                                                {product.stockByLocation.reduce((sum, s) => sum + s.quantity, 0)} {product.unit}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Stock by Location</h4>
                                                                {locations.map(loc => {
                                                                    const stock = product.stockByLocation.find(s => s.locationId === loc.id)?.quantity || 0;
                                                                    return (
                                                                        <div key={loc.id} className="text-sm flex justify-between">
                                                                            <span>{loc.name}:</span>
                                                                            <span className={cn("font-semibold", stock <= product.minStockLevel && "text-destructive")}>{stock}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                                <TableCell className="text-right hidden sm:table-cell">₦{product.price.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsFormDialogOpen(true); }}>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setAdjustingProduct(product)}>Adjust Stock</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id!)}>Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>No products found. Try adjusting your search.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="suppliers" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Suppliers</CardTitle>
                            <CardDescription>Manage your product suppliers.</CardDescription>
                        </div>
                            <Button onClick={() => { setEditingSupplier(null); setIsSupplierFormOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Contact</TableHead>
                                        <TableHead>Products</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div>{supplier.phone}</div>
                                                <div className="text-xs text-muted-foreground">{supplier.email}</div>
                                            </TableCell>
                                            <TableCell>{products.filter(p => p.supplierId === supplier.id).length}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setEditingSupplier(supplier); setIsSupplierFormOpen(true); }}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSupplier(supplier.id!)}>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="locations" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Locations</CardTitle>
                            <CardDescription>Manage your stores, warehouses, and other business locations.</CardDescription>
                        </div>
                            <Button onClick={() => { setEditingLocation(null); setIsLocationFormOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Location
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Address</TableHead>
                                        <TableHead>Products In Stock</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {locations.map((location) => (
                                        <TableRow key={location.id}>
                                            <TableCell className="font-medium">{location.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{location.address || 'N/A'}</TableCell>
                                            <TableCell>{products.filter(p => p.stockByLocation.some(s => s.locationId === location.id && s.quantity > 0)).length}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setEditingLocation(location); setIsLocationFormOpen(true); }}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLocation(location.id!)}>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="categories" className="space-y-4 mt-4">
                     <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>Organize your products into categories.</CardDescription>
                        </div>
                            <Button onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                                        <TableHead>Products</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{category.description || 'N/A'}</TableCell>
                                            <TableCell>{products.filter(p => p.categoryId === category.id).length}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setEditingCategory(category); setIsCategoryFormOpen(true); }}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category.id!)}>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="analytics" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Sales Trend</CardTitle>
                            <CardDescription>Sales performance over the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <RechartsBarChart accessibilityLayer data={salesData} margin={{ left: 12, right: 12 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickFormatter={(value) => `₦${Number(value) / 1000}k`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                            </RechartsBarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Best-Selling Products</CardTitle>
                            <CardDescription>Your top-performing products by revenue this week.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Units Sold</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bestSellingProducts.map((product) => (
                                            <TableRow key={product.name}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-right">{product.sold}</TableCell>
                                                <TableCell className="text-right">₦{product.revenue.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="reorder" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reorder Suggestions</CardTitle>
                            <CardDescription>These items are below their minimum stock level. Contact the supplier to restock.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Stock / Min. Level</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockProducts.flatMap(product =>
                                            product.lowStockLocations.map(location => {
                                                const supplier = suppliers.find(s => s.id === product.supplierId);
                                                const stockInfo = product.stockByLocation.find(s => s.locationId === location.id);
                                                return (
                                                    <TableRow key={`${product.id}-${location.id}`}>
                                                        <TableCell className="font-medium">{product.name}</TableCell>
                                                        <TableCell>{location.name}</TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-destructive">{stockInfo?.quantity}</span> / {product.minStockLevel}
                                                        </TableCell>
                                                        <TableCell>{supplier?.name || 'N/A'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm">Contact Supplier</Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleContactSupplier('call', product.supplierId)} disabled={!supplier?.phone}>
                                                                        <Phone className="mr-2 h-4 w-4" /> Call Supplier
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleContactSupplier('email', product.supplierId)} disabled={!supplier?.email}>
                                                                        <Mail className="mr-2 h-4 w-4" /> Email Supplier
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {lowStockProducts.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
                                    <p className="font-semibold">All stock levels are healthy!</p>
                                    <p>No reorder suggestions at this time.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history" className="space-y-4 mt-4">
                    <TransactionHistory />
                </TabsContent>
                </>
            )}
        </Tabs>
    </div>
  );
}
