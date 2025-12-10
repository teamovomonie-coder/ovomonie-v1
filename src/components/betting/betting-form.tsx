
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Loader2, Share2, Wallet, CheckCircle, Target, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

// --- Mock Data & Logos ---

const Bet9jaLogo = ({ className }: { className?: string }) => <div className={cn("w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs", className)}>B9</div>;
const SportyBetLogo = ({ className }: { className?: string }) => <div className={cn("w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs", className)}>S</div>;
const BetKingLogo = ({ className }: { className?: string }) => <div className={cn("w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs", className)}>BK</div>;
const OneXBetLogo = ({ className }: { className?: string }) => <div className={cn("w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs", className)}>1X</div>;
const NairaBetLogo = ({ className }: { className?: string }) => <div className={cn("w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs", className)}>NB</div>;


const bettingPlatforms = [
  { id: 'bet9ja', name: 'Bet9ja', Logo: Bet9jaLogo },
  { id: 'sportybet', name: 'SportyBet', Logo: SportyBetLogo },
  { id: 'betking', name: 'BetKing', Logo: BetKingLogo },
  { id: '1xbet', name: '1xBet', Logo: OneXBetLogo },
  { id: 'nairabet', name: 'NairaBet', Logo: NairaBetLogo },
];

const mockAccounts: Record<string, Record<string, string>> = {
  bet9ja: { '1234567': 'JOHN DOE' },
  sportybet: { 'sbyuser500': 'KOLA ADEBAYO' },
  betking: { 'kingpin007': 'JANE SMITH' },
  '1xbet': { 'xproplayer': 'MUSA ALIYU' },
  nairabet: { 'naijabet1': 'CHIOMA OKOYE' },
};

// --- Form Schema ---

const formSchema = z.object({
  platform: z.string().min(1, 'Please select a betting platform.'),
  accountId: z.string().min(4, 'Please enter a valid account ID.'),
  amount: z.coerce.number().min(100, 'Minimum funding is ₦100.').max(100000, 'Maximum funding is ₦100,000.'),
});

type FormData = z.infer<typeof formSchema>;

// --- Receipt Component (DEPRECATED - Using /success page instead) ---

function BettingReceipt({ data, verifiedName, onReset }: { data: FormData; verifiedName: string; onReset: () => void }) {
  const { toast } = useToast();
  const platformInfo = bettingPlatforms.find(p => p.id === data.platform);
  const PlatformLogo = platformInfo?.Logo || Target;

  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Your transaction receipt has been shared.",
    });
  };

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20">
      <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold">Funding Successful</CardTitle>
        <Wallet className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 bg-card text-card-foreground">
        <div className="text-center space-y-2 mb-6">
          <PlatformLogo className="mx-auto w-16 h-16" />
          <p className="text-sm text-muted-foreground">{platformInfo?.name} Funding</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <div className="border-t border-b border-border py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-semibold">{platformInfo?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
           <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Name</span>
            <span className="font-semibold">{verifiedName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 p-4 pt-0 sm:flex-col sm:space-x-0">
        <p className="text-xs text-muted-foreground text-center mb-2">Powered by Ovomonie</p>
        <Button className="w-full" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share Receipt
        </Button>
        <Button variant="outline" className="w-full" onClick={onReset}>
          Fund Another Account
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Main Form Component ---

export function BettingForm() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const { toast } = useToast();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [fundingData, setFundingData] = useState<FormData | null>(null);
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { platform: '', accountId: '', amount: 0 },
  });

  const { watch, getValues, trigger } = form;
  const platform = watch('platform');
  const accountId = watch('accountId');

  const handleVerify = async () => {
    setVerifiedName(null);
    const platformValid = await trigger('platform');
    const accountIdValid = await trigger('accountId');
    if (!platformValid || !accountIdValid) return;

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const currentPlatform = getValues('platform');
    const currentAccountId = getValues('accountId');
    const name = mockAccounts[currentPlatform]?.[currentAccountId];

    if (name) {
      setVerifiedName(name);
      toast({
        title: "Account Verified",
        description: `Account holder: ${name}`,
      });
    } else {
      toast({
        title: "Verification Failed",
        description: "Could not verify account. Check details.",
        variant: "destructive",
      });
    }
    setIsVerifying(false);
  };

  const onSubmit = (values: FormData) => {
    if (!verifiedName) {
      toast({
        title: "Verification Required",
        description: "Please verify the account before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (balance === null || (values.amount * 100) > balance) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this purchase.' });
        return;
    }

    setFundingData(values);
    setIsPinModalOpen(true);
  };
  
  const handleConfirmFunding = async () => {
    if (!fundingData || balance === null || !verifiedName) return;
    setIsSubmitting(true);
    setApiError(null);
    
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error("Authentication token not found. Please log in again.");

        const clientReference = `betting-${crypto.randomUUID()}`;
        const platformName = bettingPlatforms.find(p => p.id === fundingData.platform)?.name || 'Betting Platform';
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                clientReference,
                amount: fundingData.amount,
                category: 'betting',
                narration: `Betting wallet funding for ${platformName}`,
                party: {
                    name: platformName,
                    billerId: fundingData.accountId,
                }
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Funding failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: 'Betting Account Funded',
            description: `You funded your ${platformName} account with ₦${fundingData.amount.toLocaleString()}.`,
            category: 'transaction',
        });
        
        // Save pending receipt and navigate to /success
        const pendingReceipt = {
          type: 'betting',
          data: fundingData,
          recipientName: verifiedName,
          transactionId: clientReference,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem('ovo-pending-receipt', JSON.stringify(pendingReceipt));
        form.reset();
        setIsPinModalOpen(false);
        setVerifiedName(null);
        router.push('/success');

    } catch (error: any) {
        let description = "An unknown error occurred.";
        if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setVerifiedName(null);
    setReceiptData(null);
    setFundingData(null);
    form.reset();
  }


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>For Testing</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Use one of these Platform/ID pairs for successful verification:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><b>Bet9ja:</b> 1234567</li>
                <li><b>SportyBet:</b> sbyuser500</li>
                <li><b>BetKing:</b> kingpin007</li>
              </ul>
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Betting Platform</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setVerifiedName(null);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bettingPlatforms.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <p.Logo /> {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account ID / Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your betting account ID"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setVerifiedName(null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {verifiedName && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="font-semibold">{verifiedName}</p>
            </div>
          )}

          <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleVerify}
              disabled={isVerifying || !platform || !accountId}
          >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Account
          </Button>


          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount to Fund (₦)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || !verifiedName}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fund Account
          </Button>
        </form>
      </Form>
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmFunding}
        isProcessing={isSubmitting}
        title="Confirm Betting Payment"
        description="Enter your 4-digit PIN to authorize this payment."
        error={apiError}
        onClearError={() => setApiError(null)}
      />
    </>
  );
}
