"use client";

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

const pinSchema = z.object({
  pin: z.string().length(4, "Your PIN must be 4 digits."),
});

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  title?: string;
  description?: string;
}

// Mock PIN check function
const verifyPin = async (pin: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return pin === '1234'; // Mock PIN
};

export function PinModal({ open, onOpenChange, onConfirm, isProcessing, title, description }: PinModalProps) {
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });

  const onSubmit = async (data: z.infer<typeof pinSchema>) => {
    setIsVerifyingPin(true);
    const isPinCorrect = await verifyPin(data.pin);

    if (isPinCorrect) {
      // The onConfirm function is now responsible for the final loading state
      await onConfirm();
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid PIN',
        description: 'The PIN you entered is incorrect. Please try again.',
      });
    }
    setIsVerifyingPin(false);
    form.reset();
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isProcessing && !isVerifyingPin) {
      form.reset();
      onOpenChange(isOpen);
    }
  }

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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isVerifyingPin || isProcessing}>
                {(isVerifyingPin || isProcessing) && <Loader2 className="animate-spin mr-2" />}
                Authorize
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
