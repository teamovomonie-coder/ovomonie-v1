
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

const pinSchema = z.object({
  pin: z.string().length(4, "Your PIN must be 4 digits."),
});

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (pin?: string) => Promise<any> | void;
  /**
   * Optional URL to navigate to immediately after PIN verification.
   * Workaround: navigate to a success page while the transaction runs in background.
   * Set to `null` to disable navigation.
   */
  successUrl?: string | null;
  title?: string;
  description?: string;
  isProcessing?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export function PinModal({ open, onOpenChange, onConfirm, successUrl, title, description, isProcessing = false, error, onClearError }: PinModalProps) {
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });

  const onSubmit = async (data: z.infer<typeof pinSchema>) => {
    setIsVerifying(true);
    setVerificationError(null);
    if(onClearError) onClearError();

    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found. Please log in again.');
      console.debug('[PinModal] verify-pin request - tokenPresent:', Boolean(token));
        
        const response = await fetch('/api/auth/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ pin: data.pin }),
        });

        const result = await response.json();
      console.debug('[PinModal] verify-pin response', { status: response.status, ok: response.ok, body: result });
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'An unknown error occurred.');
        }

        // If PIN is correct, perform workaround: close modal, navigate to a success page,
        // and run the original onConfirm in the background so the UI doesn't get stuck.
        try {
          // Close the modal
          onOpenChange(false);

          // Navigate to a generic success page as an immediate UX feedback unless
          // the consumer explicitly disabled navigation by passing `successUrl={null}`.
          if (successUrl !== null) {
            const derived = (typeof successUrl === 'string') ? successUrl : ((typeof (PinModal as any).defaultSuccessUrl === 'string') ? (PinModal as any).defaultSuccessUrl : '/success');
            if (derived) {
              try { router.push(derived); } catch {}
            }
          }

          // Run the confirmation handler and await it so we only navigate to the
          // receipt page once the backend confirms the transaction.
          try {
            let res: any = null;
            if (onConfirm) {
              res = await Promise.resolve(onConfirm(data.pin));
              console.debug('[PinModal] onConfirm result', res);
            }

            // Update stored pending receipt with backend information when available
            try {
              const raw = localStorage.getItem('ovo-pending-receipt');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (res && (res.data || res.transactionId || res.transaction_id)) {
                  parsed.status = 'completed';
                  parsed.completedAt = new Date().toISOString();
                  parsed.transactionId = res.transactionId || res.transaction_id || (res.data && res.data.transactionId) || parsed.transactionId;
                  parsed.backend = res.data || res;
                  
                  // Save to localStorage for backward compatibility
                  try { localStorage.setItem('ovo-pending-receipt', JSON.stringify(parsed));
                    console.debug('[PinModal] updated ovo-pending-receipt', parsed);
                  } catch (e) { console.error('[PinModal] failed to persist updated receipt', e); }
                  
                  // Also update in database if reference exists
                  if (parsed.reference) {
                    pendingTransactionService.markCompleted(parsed.reference, parsed.transactionId).catch((err) => {
                      console.error('[PinModal] Failed to update DB receipt:', err);
                    });
                  }
                }
              }
            } catch (err) {
              console.error('[PinModal] error updating pending receipt', err);
            }

            // Close modal and navigate to the success/receipt page unless disabled
            try { onOpenChange(false); } catch {}
            if (successUrl !== null) {
              const derived = (typeof successUrl === 'string') ? successUrl : ((typeof (PinModal as any).defaultSuccessUrl === 'string') ? (PinModal as any).defaultSuccessUrl : '/success');
              if (derived) {
                try { router.replace(derived); } catch (e) { console.error(e); }
              }
            }
            try { window.dispatchEvent(new Event('ovo-pending-receipt-updated')); } catch (e) {}
          } catch (err) {
            console.error('[PinModal] onConfirm error', err);
            throw err;
          }
        } catch (err) {
          // If something unexpected happens, surface the error
          setVerificationError(err instanceof Error ? err.message : 'Confirmation failed.');
          return;
        }

    } catch (err) {
        setVerificationError(err instanceof Error ? err.message : 'PIN verification failed.');
    } finally {
        setIsVerifying(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isProcessing && !isVerifying) {
      form.reset();
      if(onClearError) onClearError();
      setVerificationError(null);
      onOpenChange(isOpen);
    }
  }

  useEffect(() => {
    if(open) {
      form.reset();
      if(onClearError) onClearError();
      setVerificationError(null);
    }
  }, [open, form, onClearError])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs relative z-50 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        {/* Loading overlay - only show during transaction processing, not PIN verification */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Processing transaction...
              </p>
            </div>
          </div>
        )}
        
        <DialogHeader>
          <DialogTitle>{title || 'Enter Transaction PIN'}</DialogTitle>
          <DialogDescription>
            {description || 'For your security, please enter your 4-digit PIN to authorize this transaction.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             {(error || verificationError) && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Authorization Failed</AlertTitle>
                    <AlertDescription>{error || verificationError}</AlertDescription>
                </Alert>
            )}
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
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying && <Loader2 className="animate-spin mr-2" />}
                {isVerifying ? 'Verifying PIN...' : 'Authorize'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
