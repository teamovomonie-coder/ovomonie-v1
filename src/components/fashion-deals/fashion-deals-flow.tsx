
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { mockCategories, mockProducts, mockOrders, Product, FashionCategory, Order } from '@/lib/fashion-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { Search, ArrowLeft, Star, ShoppingCart, Plus, Minus, Trash2, Wallet, Loader2, CheckCircle, Package, Heart } from 'lucide-react';

// Types
type View = 'home' | 'product' | 'checkout' | 'confirmation';
type CartItem = { product: Product; quantity: number; size: string; color: string; };

const deliveryAddressSchema = z.object({
    fullName: z.string().min(3, "Full name is required."),
    address: z.string().min(10, "A valid address is required."),
    city: z.string().min(2, "City is required."),
    phone: z.string().min(10, "A valid phone number is required."),
});

// Main Component
export function FashionDealsFlow() {
    const [view, setView] = useState<View>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const { toast } = useToast();

    const addToCart = (product: Product, quantity: number, size: string, color: string) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id && item.size === size && item.color === color);
            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            }
            return [...prevCart, { product, quantity, size, color }];
        });
        toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
    };

    const updateCartQuantity = (productId: string, size: string, color: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => !(item.product.id === productId && item.size === size && item.color === color));
            }
            return prevCart.map(item => (item.product.id === productId && item.size === size && item.color === color) ? { ...item, quantity: newQuantity } : item);
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
            default: return <FashionHomeView onSelectProduct={handleSelectProduct} />;
        }
    };
    
    return (
        <Card className="w-full h-full min-h-[calc(100vh-4rem)] sm:min-h-0 flex flex-col shadow-none sm:shadow-sm border-none sm:border rounded-none sm:rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
                 <h2 className="text-2xl font-bold tracking-tight">Fashion Deals</h2>
                 <CartSheet cart={cart} updateCartQuantity={updateCartQuantity} onCheckout={handleCheckout} />
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
                            className="h-full"
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
function FashionHomeView({ onSelectProduct }: { onSelectProduct: (product: Product) => void }) {
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
                <Input placeholder="Search for clothes, shoes, bags..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
                <div className="flex flex-wrap gap-2">
                    {mockCategories.map(cat => (
                        <Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} onClick={() => setCategory(cat.name)}>{cat.name}</Button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                    <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group" onClick={() => onSelectProduct(p)}>
                        <CardContent className="p-0">
                            <div className="relative h-48 w-full">
                                <Image src={p.images[0]} alt={p.name} layout="fill" objectFit="cover" className="rounded-t-lg group-hover:scale-105 transition-transform duration-300" data-ai-hint={p.hint} />
                                {p.discount && <Badge className="absolute top-2 left-2" variant="destructive">-{p.discount}%</Badge>}
                            </div>
                            <div className="p-2">
                                <h3 className="font-semibold truncate text-sm">{p.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-bold">₦{p.discountedPrice.toLocaleString()}</p>
                                    {p.discount && <p className="text-xs text-muted-foreground line-through">₦{p.originalPrice.toLocaleString()}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ProductDetailView({ product, onBack, onAddToCart }: { product: Product; onBack: () => void; onAddToCart: (product: Product, quantity: number, size: string, color: string) => void; }) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(product.images[0]);
    const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
    const [selectedColor, setSelectedColor] = useState(product.colors[0]);
    const { toast } = useToast();

    return (
        <div className="px-4 pb-4">
            <Button variant="ghost" onClick={onBack} className="mb-2"><ArrowLeft className="mr-2" /> Back to Shop</Button>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <div className="relative h-80 w-full border rounded-lg overflow-hidden mb-2">
                        <Image src={selectedImage} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={product.hint} />
                    </div>
                    <div className="flex gap-2">
                        {product.images.map(img => (
                            <div key={img} className={cn("h-16 w-16 border rounded-md cursor-pointer relative overflow-hidden", selectedImage === img && "ring-2 ring-primary")} onClick={() => setSelectedImage(img)}>
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
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">₦{product.discountedPrice.toLocaleString()}</p>
                         {product.discount && <p className="text-lg text-muted-foreground line-through">₦{product.originalPrice.toLocaleString()}</p>}
                    </div>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Color: <span className="font-semibold">{selectedColor}</span></Label>
                        <div className="flex gap-2">
                            {product.colors.map(color => (
                                <button key={color} onClick={() => setSelectedColor(color)} className={cn("w-8 h-8 rounded-full border-2", selectedColor === color ? 'border-primary' : 'border-transparent')} style={{backgroundColor: color.toLowerCase()}} title={color} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Label>Size</Label>
                         <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex gap-2">
                            {product.sizes.map(size => (
                                <div key={size}>
                                    <RadioGroupItem value={size} id={size} className="sr-only" />
                                    <Label htmlFor={size} className={cn("px-4 py-2 border rounded-md cursor-pointer", selectedSize === size && "bg-primary text-primary-foreground border-primary")}>{size}</Label>
                                </div>
                            ))}
                         </RadioGroup>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border rounded-md p-1">
                            <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus /></Button>
                            <span className="w-8 text-center font-bold">{quantity}</span>
                            <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q+1)}><Plus /></Button>
                        </div>
                        <Button className="flex-1" onClick={() => onAddToCart(product, quantity, selectedSize, selectedColor)}><ShoppingCart className="mr-2" /> Add to Cart</Button>
                        <Button variant="outline" size="icon" onClick={() => toast({title: "Added to Wishlist!"})}><Heart /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CartSheet({ cart, updateCartQuantity, onCheckout }: { cart: CartItem[], updateCartQuantity: (id: string, size: string, color: string, qty: number) => void, onCheckout: () => void }) {
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0), [cart]);
    const shipping = subtotal > 0 ? 2500 : 0; // Mock shipping cost
    const total = subtotal + shipping;

    return (
        <Sheet>
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
                                <div key={item.product.id + item.size + item.color} className="flex items-start gap-4 py-4">
                                    <div className="relative w-16 h-20 border rounded-md overflow-hidden"><Image src={item.product.images[0]} alt={item.product.name} layout="fill" objectFit="cover" data-ai-hint={item.product.hint}/></div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">Size: {item.size} | Color: {item.color}</p>
                                        <p className="font-bold text-primary mt-1">₦{item.product.discountedPrice.toLocaleString()}</p>
                                        <div className="flex items-center gap-2 border rounded-md p-1 mt-2 w-fit">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity - 1)}><Minus className="w-4 h-4" /></Button>
                                            <span>{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => updateCartQuantity(item.product.id, item.size, item.color, 0)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0), [cart]);
    const shipping = 2500;
    const total = subtotal + shipping;
    const walletBalance = 1250345;
    const hasSufficientFunds = walletBalance >= total;

    const form = useForm<z.infer<typeof deliveryAddressSchema>>({
        resolver: zodResolver(deliveryAddressSchema),
        defaultValues: { fullName: 'Paago David', address: '123 Fintech Avenue, Lekki', city: 'Lagos', phone: '08012345678' }
    });

    const handlePayment = form.handleSubmit(() => {
        if (!hasSufficientFunds) {
            toast({ variant: "destructive", title: "Insufficient Funds" });
            return;
        }
        setIsProcessing(true);
        setTimeout(() => {
            onConfirmOrder();
            setIsProcessing(false);
        }, 2000);
    });
    
    return (
        <div className="px-4 pb-4">
            <Button variant="ghost" onClick={onBack} className="mb-2"><ArrowLeft className="mr-2" /> Back</Button>
            <Form {...form}>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Delivery Information</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handlePayment} id="checkout-form" className="space-y-4">
                                    <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><Label>Full Name</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><Label>Address</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><Label>City</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><Label>Phone</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.product.id + item.size} className="flex justify-between items-center text-sm">
                                        <p className="truncate pr-2">{item.product.name} ({item.size}) x {item.quantity}</p>
                                        <p className="font-medium">₦{(item.product.discountedPrice * item.quantity).toLocaleString()}</p>
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
                                <AlertDescription>Your balance is ₦{walletBalance.toLocaleString()}.</AlertDescription>
                            </Alert>
                            <Button className="w-full" form="checkout-form" type="submit" disabled={isProcessing || !hasSufficientFunds}>
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Form>
        </div>
    );
}

function ConfirmationView({ onDone }: { onDone: () => void }) {
    return (
        <div className="h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500"/>
                    <CardTitle className="text-2xl mt-4">Thank you for your order!</CardTitle>
                    <CardDescription>Your order has been placed. You can track its progress in the "My Orders" section.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-mono bg-muted p-2 rounded-md">Order ID: OVO-FASH-{Date.now()}</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
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
