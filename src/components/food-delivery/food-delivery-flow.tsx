
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { mockRestaurants, mockFoodCategories, mockMenuItems, Restaurant, MenuItem } from '@/lib/food-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

import { Search, ArrowLeft, Star, ShoppingCart, Plus, Minus, Trash2, X, Wallet, CheckCircle, Loader2, Utensils, Clock } from 'lucide-react';

type View = 'discovery' | 'menu' | 'checkout' | 'tracking';
type CartItem = { menuItem: MenuItem; quantity: number };

const deliveryAddressSchema = z.object({
    address: z.string().min(10, "A valid address is required."),
    phone: z.string().min(10, "A valid phone number is required."),
});

// Main Component
export function FoodDeliveryFlow() {
    const [view, setView] = useState<View>('discovery');
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { toast } = useToast();

    const addToCart = (menuItem: MenuItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.menuItem.id === menuItem.id);
            if (existingItem) {
                return prevCart.map(item => item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { menuItem, quantity: 1 }];
        });
        toast({ title: "Added to Cart", description: `${menuItem.name} has been added to your cart.` });
    };

    const updateCartQuantity = (menuItemId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.menuItem.id !== menuItemId);
            }
            return prevCart.map(item => item.menuItem.id === menuItemId ? { ...item, quantity: newQuantity } : item);
        });
    };

    const handleSelectRestaurant = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setView('menu');
    };

    const resetToDiscovery = () => {
        setView('discovery');
        setSelectedRestaurant(null);
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        setView('checkout');
    };

    const handleConfirmOrder = () => {
        setView('tracking');
        setCart([]);
    };

    const renderView = () => {
        switch (view) {
            case 'menu':
                return <MenuScreen restaurant={selectedRestaurant!} onBack={resetToDiscovery} onAddToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} onCheckout={handleCheckout} />;
            case 'checkout':
                return <CheckoutScreen cart={cart} restaurant={selectedRestaurant!} onBack={() => setView('menu')} onConfirmOrder={handleConfirmOrder} />;
            case 'tracking':
                return <TrackingScreen restaurant={selectedRestaurant!} onDone={resetToDiscovery} />;
            case 'discovery':
            default:
                return <DiscoveryScreen onSelectRestaurant={handleSelectRestaurant} />;
        }
    };
    
    return (
        <Card className="w-full h-full min-h-[calc(100vh-4rem)] sm:min-h-0 flex flex-col shadow-none sm:shadow-sm border-none sm:border rounded-none sm:rounded-lg">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: view === 'discovery' ? 0 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex-grow flex flex-col"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </Card>
    );
}

// Sub-components
function DiscoveryScreen({ onSelectRestaurant }: { onSelectRestaurant: (restaurant: Restaurant) => void }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    const filteredRestaurants = useMemo(() => {
        return mockRestaurants.filter(r => 
            (category === 'All' || r.cuisine.toLowerCase() === category.toLowerCase()) &&
            (r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine.toLowerCase().includes(search.toLowerCase()))
        );
    }, [search, category]);

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Food Delivery</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search restaurants or cuisines..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
                <div className="flex flex-wrap gap-2">
                    {mockFoodCategories.map(cat => (
                        <Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} onClick={() => setCategory(cat.name)}>{cat.name}</Button>
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                {filteredRestaurants.map(r => (
                    <Card key={r.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelectRestaurant(r)}>
                        <CardContent className="p-0">
                            <div className="relative h-32 w-full"><Image src={r.image} alt={r.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={r.hint} /></div>
                            <div className="p-3">
                                <h3 className="font-semibold">{r.name}</h3>
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {r.rating}</div>
                                    <span>&bull;</span>
                                    <span>{r.cuisine}</span>
                                    <span>&bull;</span>
                                    <span>{r.deliveryTime} min</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function MenuScreen({ restaurant, onBack, onAddToCart, cart, updateCartQuantity, onCheckout }: { restaurant: Restaurant; onBack: () => void; onAddToCart: (item: MenuItem) => void; cart: CartItem[]; updateCartQuantity: (id: string, qty: number) => void; onCheckout: () => void }) {
    const menu = mockMenuItems.filter(item => item.restaurantId === restaurant.id);
    const menuCategories = [...new Set(menu.map(item => item.category))];
    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                <div className="relative h-40">
                    <Image src={restaurant.image} alt={restaurant.name} layout="fill" objectFit="cover" data-ai-hint={restaurant.hint} />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                    <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white hover:text-white"><ArrowLeft /></Button>
                    <div className="absolute bottom-4 left-4 text-white">
                        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                        <p className="text-sm">{restaurant.cuisine} &bull; {restaurant.address}</p>
                    </div>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {menuCategories.map(category => (
                    <div key={category}>
                        <h2 className="font-bold text-xl mb-2">{category}</h2>
                        <div className="space-y-3">
                            {menu.filter(item => item.category === category).map(item => (
                                <Card key={item.id} className="flex items-center p-3 gap-3">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                        <p className="font-bold mt-1">₦{item.price.toLocaleString()}</p>
                                    </div>
                                    <Button size="icon" variant="outline" onClick={() => onAddToCart(item)}><Plus /></Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {totalCartItems > 0 && (
                <div className="p-4 border-t bg-background sticky bottom-0">
                    <CartSheet cart={cart} updateCartQuantity={updateCartQuantity} onCheckout={onCheckout} restaurant={restaurant} />
                </div>
            )}
        </div>
    );
}

function CartSheet({ cart, updateCartQuantity, onCheckout, restaurant }: { cart: CartItem[], updateCartQuantity: (id: string, qty: number) => void, onCheckout: () => void, restaurant: Restaurant }) {
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0), [cart]);
    const deliveryFee = 500; // Mock fee
    const total = subtotal + deliveryFee;

    return (
        <Sheet>
            <SheetTrigger asChild>
                 <Button className="w-full">
                    <ShoppingCart className="mr-2" /> View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader><SheetTitle>My Order from {restaurant.name}</SheetTitle></SheetHeader>
                <div className="flex-grow overflow-y-auto -mx-6 px-6 divide-y">
                    {cart.map(item => (
                        <div key={item.menuItem.id} className="flex items-center gap-4 py-4">
                            <div className="flex-grow">
                                <p className="font-semibold text-sm">{item.menuItem.name}</p>
                                <p className="font-bold text-primary">₦{item.menuItem.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 border rounded-md p-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1)}><Minus className="w-4 h-4" /></Button>
                                <span>{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
                <SheetFooter className="mt-auto pt-4 border-t">
                    <div className="w-full space-y-4">
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Delivery Fee</span><span>₦{deliveryFee.toLocaleString()}</span></div>
                            <Separator/>
                            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                        </div>
                        <Button className="w-full" onClick={onCheckout}>Proceed to Checkout</Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function CheckoutScreen({ cart, restaurant, onBack, onConfirmOrder }: { cart: CartItem[]; restaurant: Restaurant; onBack: () => void; onConfirmOrder: () => void; }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0), [cart]);
    const deliveryFee = 500;
    const total = subtotal + deliveryFee;
    const walletBalance = 50000;
    const hasSufficientFunds = walletBalance >= total;

    const form = useForm<z.infer<typeof deliveryAddressSchema>>({
        resolver: zodResolver(deliveryAddressSchema),
        defaultValues: { address: '123 Fintech Avenue, Lagos', phone: '08012345678' }
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
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
                <h2 className="text-xl font-bold">Checkout</h2>
            </div>
            <Form {...form}>
                <form onSubmit={handlePayment} className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Delivery Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Order Summary from {restaurant.name}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.menuItem.id} className="flex justify-between items-center text-sm">
                                        <p className="truncate pr-2">{item.menuItem.name} x {item.quantity}</p>
                                        <p className="font-medium">₦{(item.menuItem.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Delivery Fee</span><span>₦{deliveryFee.toLocaleString()}</span></div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                            </div>
                            <Card className={cn("p-4", hasSufficientFunds ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                                <div className="flex items-center gap-3">
                                    <Wallet className={cn(hasSufficientFunds ? "text-green-600" : "text-red-600")} />
                                    <div>
                                        <p className="font-semibold">Pay with Ovomonie Wallet</p>
                                        <p className="text-sm">Balance: ₦{walletBalance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </Card>
                            <Button type="submit" className="w-full" disabled={isProcessing || !hasSufficientFunds}>
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

function TrackingScreen({ restaurant, onDone }: { restaurant: Restaurant, onDone: () => void }) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Order placed");

    useEffect(() => {
        const statuses = ["Preparing your meal...", "Rider is on the way", "Delivered!"];
        const timer = setTimeout(() => {
            if (progress < 100) {
                const newProgress = Math.min(100, progress + 33.4);
                setProgress(newProgress);
                if (newProgress > 99) setStatus(statuses[2]);
                else if (newProgress > 66) setStatus(statuses[1]);
                else if (newProgress > 33) setStatus(statuses[0]);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [progress]);

    return (
        <div className="flex flex-col h-full">
            <div className="relative flex-grow">
                 <Image src="https://placehold.co/600x400.png" layout="fill" objectFit="cover" alt="Map with delivery route" data-ai-hint="map delivery" />
            </div>
            <Card className="rounded-t-2xl -mt-4 z-10">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{status}</CardTitle>
                     <p className="text-muted-foreground">Estimated arrival in {restaurant.deliveryTime - Math.floor(restaurant.deliveryTime * (progress/100))} minutes.</p>
                     <Progress value={progress} />
                </CardHeader>
                <CardContent className="text-center">
                    {progress === 100 ? (
                        <Button className="w-full" onClick={onDone}>Done</Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">You can track your rider on the map above.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
