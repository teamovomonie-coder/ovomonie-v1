
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { mockCategories, mockProducts, mockOrders, Product, Category, Order } from '@/lib/shopping-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Search, ArrowLeft, Star, ShoppingCart, Plus, Minus, Trash2, X, Wallet, Loader2, CheckCircle, Package } from 'lucide-react';

// Types
type View = 'home' | 'product' | 'checkout' | 'confirmation';
type CartItem = { product: Product; quantity: number };

const deliveryAddressSchema = z.object({
    fullName: z.string().min(3, "Full name is required."),
    address: z.string().min(10, "A valid address is required."),
    city: z.string().min(2, "City is required."),
    phone: z.string().min(10, "A valid phone number is required."),
});

// Main Component
export function ShoppingFlow() {
    const [view, setView] = useState<View>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { toast } = useToast();

    const addToCart = (product: Product, quantity: number) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prevCart, { product, quantity }];
        });
        toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
    };

    const updateCartQuantity = (productId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.product.id !== productId);
            }
            return prevCart.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item);
        });
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setView('product');
    };
    
    const resetToHome = () => {
        setView('home');
        setSelectedProduct(null);
    }
    
    const handleCheckout = () => {
        setIsCartOpen(false);
        setView('checkout');
    }
    
    const handleConfirmOrder = () => {
        // Here you would normally process payment
        setView('confirmation');
        setCart([]); // Clear cart after order
    }

    const renderView = () => {
        switch (view) {
            case 'product': return <ProductDetailView product={selectedProduct!} onBack={resetToHome} onAddToCart={addToCart} />;
            case 'checkout': return <CheckoutView cart={cart} onBack={() => setView('home')} onConfirmOrder={handleConfirmOrder} />;
            case 'confirmation': return <ConfirmationView onDone={resetToHome} />;
            case 'home':
            default: return <ShoppingHomeView onSelectProduct={handleSelectProduct} />;
        }
    };
    
    return (
        <Card className="w-full h-full min-h-[calc(100vh-4rem)] sm:min-h-0 flex flex-col shadow-none sm:shadow-sm border-none sm:border rounded-none sm:rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
                 <h2 className="text-2xl font-bold tracking-tight">Shop</h2>
                 <CartSheet cart={cart} updateCartQuantity={updateCartQuantity} onCheckout={handleCheckout} isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
            </div>
            <Tabs defaultValue="shop" className="flex-grow flex flex-col">
                <TabsList className="m-4">
                    <TabsTrigger value="shop">Shop</TabsTrigger>
                    <TabsTrigger value="orders">My Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="shop" className="flex-grow">
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>
                <TabsContent value="orders"><OrderHistory /></TabsContent>
            </Tabs>
        </Card>
    );
}

// Sub-components
function ShoppingHomeView({ onSelectProduct }: { onSelectProduct: (product: Product) => void }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    const filteredProducts = useMemo(() => {
        return mockProducts.filter(p => 
            (category === 'All' || p.category === category) &&
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, category]);

    return (
        <div className="px-4 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search for products..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
                <div className="flex flex-wrap gap-2">
                    {[{ name: 'All' }, ...mockCategories].map(cat => (
                        <Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} onClick={() => setCategory(cat.name)}>{cat.name}</Button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                    <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelectProduct(p)}>
                        <CardContent className="p-0">
                            <div className="relative h-32 w-full"><Image src={p.images[0]} alt={p.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={p.hint} /></div>
                            <div className="p-2">
                                <h3 className="font-semibold truncate text-sm">{p.name}</h3>
                                <p className="font-bold">₦{p.price.toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ProductDetailView({ product, onBack, onAddToCart }: { product: Product; onBack: () => void; onAddToCart: (product: Product, quantity: number) => void; }) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(product.images[0]);
    
    return (
        <div className="px-4">
            <Button variant="ghost" onClick={onBack} className="mb-2"><ArrowLeft className="mr-2" /> Back to Shop</Button>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <div className="relative h-64 w-full border rounded-lg overflow-hidden mb-2"><Image src={selectedImage} alt={product.name} layout="fill" objectFit="contain" data-ai-hint={product.hint} /></div>
                    <div className="flex gap-2">
                        {product.images.map((img, index) => (
                            <div key={index} className={cn("h-16 w-16 border rounded-md cursor-pointer relative", selectedImage === img && "ring-2 ring-primary")} onClick={() => setSelectedImage(img)}>
                                <Image src={img} alt="thumbnail" layout="fill" objectFit="cover" data-ai-hint={product.hint} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">{Array.from({length: 5}).map((_, i) => <Star key={i} className={cn("w-5 h-5", i < product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />)}</div>
                        <span className="text-muted-foreground">({product.reviews} reviews)</span>
                    </div>
                    <p className="text-3xl font-bold">₦{product.price.toLocaleString()}</p>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                    <Separator />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border rounded-md p-1">
                            <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus /></Button>
                            <span className="w-8 text-center font-bold">{quantity}</span>
                            <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q+1)}><Plus /></Button>
                        </div>
                        <Button className="flex-1" onClick={() => onAddToCart(product, quantity)}><ShoppingCart className="mr-2" /> Add to Cart</Button>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={() => { onAddToCart(product, quantity); /* TODO: navigate to checkout */ }}>Buy Now</Button>
                </div>
            </div>
        </div>
    );
}

function CartSheet({ cart, updateCartQuantity, onCheckout, isOpen, onOpenChange }: { cart: CartItem[], updateCartQuantity: (id: string, qty: number) => void, onCheckout: () => void, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
    const shipping = 1500; // Mock shipping cost
    const total = subtotal + shipping;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart />
                    {cart.length > 0 && <Badge className="absolute -top-2 -right-2 px-2">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader><SheetTitle>My Cart</SheetTitle></SheetHeader>
                {cart.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4"/>
                        <p className="font-semibold">Your cart is empty</p>
                        <p className="text-sm text-muted-foreground">Looks like you haven't added anything yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow overflow-y-auto -mx-6 px-6 divide-y">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex items-center gap-4 py-4">
                                    <div className="relative w-16 h-16 border rounded-md overflow-hidden"><Image src={item.product.images[0]} alt={item.product.name} layout="fill" objectFit="cover" data-ai-hint={item.product.hint}/></div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.product.name}</p>
                                        <p className="font-bold text-primary">₦{item.product.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 border rounded-md p-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}><Minus className="w-4 h-4" /></Button>
                                        <span>{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => updateCartQuantity(item.product.id, 0)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <SheetFooter className="mt-auto pt-4 border-t">
                            <div className="w-full space-y-4">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Shipping</span><span>₦{shipping.toLocaleString()}</span></div>
                                    <Separator/>
                                    <div className="flex justify-between font-bold text-base"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                                </div>
                                <Button className="w-full" onClick={onCheckout}>Proceed to Checkout</Button>
                            </div>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function CheckoutView({ cart, onBack, onConfirmOrder }: { cart: CartItem[], onBack: () => void, onConfirmOrder: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
    const shipping = 1500;
    const total = subtotal + shipping;
    const walletBalance = 50000; // Mock wallet balance
    const hasSufficientFunds = walletBalance >= total;

    const form = useForm<z.infer<typeof deliveryAddressSchema>>({
        resolver: zodResolver(deliveryAddressSchema),
        defaultValues: { fullName: 'Paago David', address: '123 Fintech Avenue', city: 'Lagos', phone: '08012345678' }
    });

    const handlePayment = () => {
        if (!hasSufficientFunds) {
            toast({ variant: "destructive", title: "Insufficient Funds", description: "Please top up your wallet to complete this purchase." });
            return;
        }
        setIsProcessing(true);
        setTimeout(() => {
            onConfirmOrder();
            setIsProcessing(false);
        }, 2000);
    }
    
    return (
        <div className="px-4">
            <Button variant="ghost" onClick={onBack} className="mb-2"><ArrowLeft className="mr-2" /> Back</Button>
            <div className="grid md:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader><CardTitle>Delivery Information</CardTitle></CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2 max-h-48 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center text-sm">
                                    <p className="truncate pr-2">{item.product.name} x {item.quantity}</p>
                                    <p className="font-medium">₦{(item.product.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Shipping</span><span>₦{shipping.toLocaleString()}</span></div>
                            <Separator/>
                            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                        </div>
                        <Alert variant={hasSufficientFunds ? "default" : "destructive"}>
                            <Wallet className="h-4 w-4" />
                            <AlertTitle>Pay with Ovomonie Wallet</AlertTitle>
                            <AlertDescription>Your balance is ₦{walletBalance.toLocaleString()}. {hasSufficientFunds ? "Sufficient for this transaction." : "Please top up."}</AlertDescription>
                        </Alert>
                         <Button className="w-full" onClick={handlePayment} disabled={isProcessing || !hasSufficientFunds}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                         </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ConfirmationView({ onDone }: { onDone: () => void }) {
    return (
        <div className="h-full flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500"/>
                    <CardTitle className="text-2xl mt-4">Thank you for your order!</CardTitle>
                    <CardDescription>Your order has been placed successfully. You will receive a confirmation email shortly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-mono bg-muted p-2 rounded-md">Order ID: OVO-{Date.now()}</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button className="w-full">Track Order</Button>
                    <Button variant="outline" className="w-full" onClick={onDone}>Continue Shopping</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function OrderHistory() {
    return (
        <div className="px-4">
            <Card>
                <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                    <CardDescription>View your past and current orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                        <TableCell><Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}>{order.status}</Badge></TableCell>
                                        <TableCell className="text-right">₦{order.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
