
"use client";

import { useState, useMemo } from 'react';
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
// Import Icons
import { Package, PackageSearch, DollarSign, PlusCircle, MoreHorizontal, Search, TrendingUp } from 'lucide-react';

// Product schema for validation
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Product name is required.'),
  sku: z.string().min(3, 'SKU is required.'),
  barcode: z.string().optional(),
  category: z.string().min(2, 'Category is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  costPrice: z.coerce.number().nonnegative('Cost price cannot be negative.'),
  stock: z.coerce.number().nonnegative('Stock cannot be negative.'),
  minStockLevel: z.coerce.number().nonnegative('Minimum stock level cannot be negative.'),
  unit: z.string().min(1, 'Unit is required.'),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
});

type Product = z.infer<typeof productSchema>;

const stockAdjustmentSchema = z.object({
  newStock: z.coerce.number().nonnegative('Stock cannot be negative.'),
  reason: z.string().min(1, 'Please select a reason.'),
  notes: z.string().optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

// Mock Data
const mockProducts: Product[] = [
  { id: 'prod_1', name: 'Indomie Noodles Chicken', sku: 'IN001', barcode: '615110002131', category: 'Groceries', price: 250, costPrice: 200, stock: 150, minStockLevel: 20, unit: 'pcs' },
  { id: 'prod_2', name: 'Peak Milk Evaporated', sku: 'PK001', category: 'Groceries', price: 400, costPrice: 350, stock: 80, minStockLevel: 10, unit: 'pcs' },
  { id: 'prod_3', name: 'Coca-Cola 50cl', sku: 'CC001', barcode: '5449000000996', category: 'Beverages', price: 200, costPrice: 150, stock: 200, minStockLevel: 50, unit: 'pcs' },
  { id: 'prod_4', name: 'Panadol Extra', sku: 'PN001', batchNumber: 'B12345', expiryDate: '2025-12-31', category: 'Pharmacy', price: 500, costPrice: 400, stock: 5, minStockLevel: 10, unit: 'pack' },
  { id: 'prod_5', name: 'Golden Penny Semovita 1kg', sku: 'GP001', category: 'Groceries', price: 1200, costPrice: 1000, stock: 45, minStockLevel: 10, unit: 'pack' },
];


function ProductForm({ product, onSave, onCancel }: { product: Partial<Product> | null, onSave: (data: Product) => void, onCancel: () => void }) {
    const form = useForm<Product>({
        resolver: zodResolver(productSchema),
        defaultValues: product || {
            name: '', sku: '', barcode: '', category: '', price: 0, costPrice: 0, stock: 0, minStockLevel: 0, unit: 'pcs'
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
                    <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Groceries" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="Unique Product Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>Barcode (Optional)</FormLabel><FormControl><Input placeholder="Scan or type barcode" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Selling Price (₦)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="costPrice" render={({ field }) => (<FormItem><FormLabel>Cost Price (₦)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="minStockLevel" render={({ field }) => (<FormItem><FormLabel>Min. Stock Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., pcs, kg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <DialogFooter className="sticky bottom-0 bg-background pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Product</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function StockAdjustmentDialog({ product, onAdjust, open, onOpenChange }: { product: Product | null, onAdjust: (productId: string, data: StockAdjustmentData) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!product) return null;

    const form = useForm<StockAdjustmentData>({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: { newStock: product.stock, reason: '', notes: '' },
    });

    const onSubmit = (data: StockAdjustmentData) => {
        onAdjust(product.id!, data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Stock for {product.name}</DialogTitle>
                    <DialogDescription>Current stock: {product.stock} {product.unit}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Button type="submit">Confirm Adjustment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const salesData = [
    { date: 'Mon', sales: 40000 },
    { date: 'Tue', sales: 30000 },
    { date: 'Wed', sales: 20000 },
    { date: 'Thu', sales: 27800 },
    { date: 'Fri', sales: 18900 },
    { date: 'Sat', sales: 23900 },
    { date: 'Sun', sales: 34900 },
  ];

  const bestSellingProducts = [
    { name: 'Coca-Cola 50cl', sold: 120, revenue: 24000 },
    { name: 'Indomie Noodles Chicken', sold: 98, revenue: 24500 },
    { name: 'Peak Milk Evaporated', sold: 75, revenue: 30000 },
    { name: 'Golden Penny Semovita 1kg', sold: 40, revenue: 48000 },
  ];

  const chartConfig = {
    sales: {
      label: "Sales (₦)",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;


  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);
  
  const lowStockCount = useMemo(() => products.filter(p => p.stock <= p.minStockLevel).length, [products]);
  const inventoryValue = useMemo(() => products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0), [products]);
  const todaysSales = 34900; // Mocked value

  const handleSaveProduct = (data: Product) => {
    if (editingProduct?.id) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
        toast({ title: "Product Updated", description: `${data.name} has been updated.`});
    } else {
        const newProduct = { ...data, id: `prod_${Date.now()}`};
        setProducts(prev => [newProduct, ...prev]);
        toast({ title: "Product Added", description: `${data.name} has been added to your inventory.`});
    }
    setIsFormDialogOpen(false);
    setEditingProduct(null);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsFormDialogOpen(true);
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ variant: "destructive", title: "Product Deleted", description: "The product has been removed from your inventory."});
  };

  const handleOpenAdjustDialog = (product: Product) => {
    setAdjustingProduct(product);
  }

  const handleStockAdjustment = (productId: string, data: StockAdjustmentData) => {
    setProducts(prev =>
        prev.map(p =>
            p.id === productId ? { ...p, stock: data.newStock } : p
        )
    );
    toast({ title: "Stock Adjusted", description: `Stock for ${products.find(p => p.id === productId)?.name} has been updated to ${data.newStock}.`});
    setAdjustingProduct(null);
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
             <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add a New Product'}</DialogTitle>
                    </DialogHeader>
                    <ProductForm 
                        product={editingProduct} 
                        onSave={handleSaveProduct} 
                        onCancel={() => setIsFormDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>

        <StockAdjustmentDialog 
            product={adjustingProduct} 
            open={!!adjustingProduct}
            onOpenChange={(open) => !open && setAdjustingProduct(null)}
            onAdjust={handleStockAdjustment}
        />

        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{products.length}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock Items</CardTitle><PackageSearch className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{lowStockCount}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₦{inventoryValue.toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today's Sales</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₦{todaysSales.toLocaleString()}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Product List</CardTitle>
                            <CardDescription>Manage all products in your inventory.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search by name or SKU..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell"><Badge variant="outline">{product.category}</Badge></TableCell>
                                            <TableCell>
                                                <div className={cn(product.stock <= product.minStockLevel && "text-destructive font-bold")}>
                                                    {product.stock} {product.unit}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right hidden sm:table-cell">₦{product.price.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(product)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenAdjustDialog(product)}>Adjust Stock</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id!)}>Delete</DropdownMenuItem>
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
        </Tabs>
    </div>
  );
}

    