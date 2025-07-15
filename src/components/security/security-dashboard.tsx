
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lock, KeyRound, Fingerprint, Bell, Smartphone, Shield, LogOut, Loader2, CreditCard, Ban } from 'lucide-react';
import { LogoutDialog } from '@/components/auth/logout-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth-context';

// Mock data
const mockDevices = [
    { id: 'dev-1', name: 'Samsung Galaxy S24', location: 'Lagos, NG', lastLogin: 'Now', isCurrent: true },
    { id: 'dev-2', name: 'Chrome on Windows', location: 'Abuja, NG', lastLogin: '2 hours ago', isCurrent: false },
];

const mockActivity = [
    { id: 'act-1', event: 'Password Changed', ip: '102.89.43.10', date: '2024-07-31 10:00 AM' },
    { id: 'act-2', event: 'Login from new device', ip: '45.12.5.88', date: '2024-07-30 08:00 PM' },
    { id: 'act-3', event: 'Successful Login', ip: '102.89.43.10', date: '2024-07-31 09:58 AM' },
];

// Zod schemas
const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters.").regex(/^\d{6}$/, "Login PIN must be 6 digits."),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ['confirmPassword'],
});

const pinSchema = z.object({
    currentPin: z.string().length(4, "PIN must be 4 digits."),
    newPin: z.string().length(4, "PIN must be 4 digits."),
    confirmPin: z.string().length(4, "PIN must be 4 digits."),
}).refine(data => data.newPin === data.confirmPin, {
    message: "PINs do not match.",
    path: ['confirmPin'],
});

function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { logout } = useAuth();
    const form = useForm<z.infer<typeof passwordSchema>>({ 
        resolver: zodResolver(passwordSchema), 
        defaultValues: {currentPassword: "", newPassword: "", confirmPassword: ""} 
    });

    const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to change password.');
            
            toast({ title: 'Success! Please Log In Again.', description: 'Your login PIN has been changed successfully. For your security, you have been logged out.' });
            setOpen(false);
            form.reset();
            logout();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" className="w-full justify-start gap-3"><Lock />Change Login PIN</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Change Login PIN</DialogTitle></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current 6-Digit PIN</FormLabel><FormControl><Input type="password" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New 6-Digit PIN</FormLabel><FormControl><Input type="password" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New PIN</FormLabel><FormControl><Input type="password" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />}Confirm Change</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

function ChangePinDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof pinSchema>>({ 
        resolver: zodResolver(pinSchema), 
        defaultValues: {currentPin: "", newPin: "", confirmPin: ""} 
    });
    
    const onSubmit = async (data: z.infer<typeof pinSchema>) => {
        setIsLoading(true);
         try {
            const token = localStorage.getItem('ovo-auth-token');
            const response = await fetch('/api/auth/change-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to change PIN.');
            
            toast({ title: 'Success', description: result.message });
            setOpen(false);
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" className="w-full justify-start gap-3"><KeyRound />Change Transaction PIN</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Change Transaction PIN</DialogTitle></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="currentPin" render={({ field }) => (<FormItem><FormLabel>Current 4-Digit PIN</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newPin" render={({ field }) => (<FormItem><FormLabel>New 4-Digit PIN</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="confirmPin" render={({ field }) => (<FormItem><FormLabel>Confirm New PIN</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />}Confirm Change</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

function LogoutAllDevicesDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleLogoutAll = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to log out other devices.');
      
      toast({ title: 'Success! Please Log In Again.', description: 'You have been logged out of all devices for your security.' });
      logout(); // Also log out the current session
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="ml-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <LogOut className="mr-2" />}
          Log Out All Other Devices
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out of all other devices?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign you out of Ovomonie on all other web browsers and devices, including this one. You will need to sign in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogoutAll}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SecurityDashboard() {
    const [devices, setDevices] = useState(mockDevices);
    const { toast } = useToast();

    const handleRemoveDevice = (id: string) => {
        setDevices(prev => prev.filter(d => d.id !== id));
        toast({ title: 'Device Removed', description: 'The device has been unlinked from your account.' });
    };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Security & Settings</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <ChangePasswordDialog />
                        <ChangePinDialog />
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor="biometric-switch" className="flex items-center gap-3"><Fingerprint /><span>Biometric Login</span></Label>
                            <Switch id="biometric-switch" defaultChecked />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader><CardTitle>Transaction Limits</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor="international-switch" className="flex items-center gap-3"><CreditCard /><span>Block International Txns</span></Label>
                            <Switch id="international-switch" />
                        </div>
                         <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor="gambling-switch" className="flex items-center gap-3"><Ban /><span>Restrict Betting Payments</span></Label>
                            <Switch id="gambling-switch" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Alerts & Notifications</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor="login-alert-switch" className="flex items-center gap-3"><Bell /><span>Login Alerts</span></Label>
                            <Switch id="login-alert-switch" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label htmlFor="geo-fence-switch" className="flex items-center gap-3"><Shield /><span>Geo-Fencing</span></Label>
                            <Switch id="geo-fence-switch" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Managed Devices</CardTitle><CardDescription>These devices have recently accessed your account.</CardDescription></CardHeader>
                    <CardContent>
                        {devices.map(device => (
                            <div key={device.id} className="flex items-center justify-between py-3 border-b last:border-none">
                                <div className="flex items-center gap-3">
                                    <Smartphone />
                                    <div>
                                        <p className="font-semibold">{device.name}</p>
                                        <p className="text-sm text-muted-foreground">{device.location}</p>
                                    </div>
                                    {device.isCurrent && <Badge variant="secondary">Current Device</Badge>}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveDevice(device.id)} disabled={device.isCurrent}>Remove</Button>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <LogoutAllDevicesDialog />
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>Recent Security Activity</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>IP Address</TableHead><TableHead className="text-right">Date</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {mockActivity.map(act => (
                                    <TableRow key={act.id}>
                                        <TableCell>{act.event}</TableCell>
                                        <TableCell className="font-mono text-xs">{act.ip}</TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">{act.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Account Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LogoutDialog>
                           <Button variant="destructive" className="w-full sm:w-auto">
                                <LogOut className="mr-2"/>
                                Log Out of This Device
                            </Button>
                        </LogoutDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
