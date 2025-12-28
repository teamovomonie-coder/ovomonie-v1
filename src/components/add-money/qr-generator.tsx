'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const qrSchema = z.object({
    amount: z.coerce.number().optional()
});

export function QRGenerator() {
    const { user } = useAuth();
    const [qrData, setQrData] = useState<{url: string; amount?: number; expiry: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    const form = useForm<z.infer<typeof qrSchema>>({
        resolver: zodResolver(qrSchema),
        defaultValues: { amount: 0 }
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!qrData || !qrData.expiry) return;

        const timerId = setInterval(() => {
            const now = Date.now();
            const remaining = Math.round((qrData.expiry - now) / 1000);
            if (remaining > 0) {
                setTimeLeft(remaining);
            } else {
                setTimeLeft(0);
                clearInterval(timerId);
                setQrData(null);
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [qrData]);

    const generateQr = async (data: z.infer<typeof qrSchema>) => {
        if (!isMounted) return;
        
        const amount = data.amount && data.amount > 0 ? data.amount : undefined;
        const payload = {
            type: 'ovomonie-funding',
            accountNumber: user?.accountNumber,
            accountName: user?.fullName,
            amount,
            timestamp: Date.now()
        };
        
        try {
            const QRCode = (await import('qrcode')).default;
            const encodedData = encodeURIComponent(JSON.stringify(payload));
            const paymentUrl = `https://ovomonie-v1.vercel.app/scan-qr?data=${encodedData}`;
            
            const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            const expiry = amount ? Date.now() + 5 * 60 * 1000 : 0;
            setQrData({ url: qrDataUrl, amount, expiry });
            if (expiry) setTimeLeft(300);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    if (!isMounted) {
        return <div className="text-center p-4">Loading...</div>;
    }

    if (qrData) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return (
            <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Share this QR code to receive funds</p>
                
                <Card className="inline-block">
                    <CardContent className="p-6 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <img src={qrData.url} alt="Funding QR Code" width={256} height={256} className="rounded" />
                        </div>
                        
                        <div className="space-y-2 text-left">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Account Name</span>
                                <span className="font-semibold">{user?.fullName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Account Number</span>
                                <span className="font-mono">{user?.accountNumber}</span>
                            </div>
                            {qrData.amount && (
                                <div className="flex justify-between text-sm pt-2 border-t">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="text-xl font-bold">₦{qrData.amount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {qrData.expiry > 0 && (
                    <div className="flex items-center justify-center gap-2 font-mono text-destructive p-2 bg-destructive/10 rounded-md">
                        <Timer className="w-5 h-5" />
                        <span>Expires in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
                    </div>
                )}
                
                <Button onClick={() => { setQrData(null); form.reset(); }} className="w-full">Generate New Code</Button>
            </div>
        );
    }
    
    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(generateQr)} className="space-y-4">
                 <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="Leave blank for any amount" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                    </FormItem>
                 )} />
                <Button type="submit" className="w-full">Generate QR Code</Button>
            </form>
        </Form>
    );
}
