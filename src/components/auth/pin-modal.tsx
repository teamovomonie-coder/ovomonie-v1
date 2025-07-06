
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const pinSchema = z.object({
  pin: z.string().length(4, "Your PIN must be 4 digits."),
});

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function PinModal({ open, onOpenChange, onConfirm, title, description }: PinModalProps) {
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });

  const onSubmit = async (data: z.infer<typeof pinSchema>) => {
    setIsVerifyingPin(true);
    
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const response = await fetch('/api/auth/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pin: data.pin }),
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'PIN verification failed.');
        }

        // If PIN is correct, call the confirmation callback which triggers the async operation
        onConfirm();
        
    } catch (err) {
        if (err instanceof Error) {
            form.setError("pin", { type: "manual", message: err.message });
        } else {
            form.setError("pin", { type: "manual", message: "An unknown error occurred." });
        }
    } finally {
        setIsVerifyingPin(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isVerifyingPin) {
      form.reset();
      onOpenChange(isOpen);
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('pin', e.target.value);
    if (form.formState.errors.pin) {
        form.clearErrors('pin');
    }
  };

  useEffect(() => {
    if(open) {
      form.reset();
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{title || 'Enter Transaction PIN'}</DialogTitle>
          <DialogDescription>
            {description || 'For your security, please enter your 4-digit PIN to authorize this transaction.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      maxLength={4}
                      className="text-center text-2xl tracking-[0.5em]"
                      {...field}
                       onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isVerifyingPin}>
                {isVerifyingPin && <Loader2 className="animate-spin mr-2" />}
                Authorize
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
