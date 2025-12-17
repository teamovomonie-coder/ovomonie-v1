'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, CreditCard } from 'lucide-react';
import { useVirtualAccounts } from '@/hooks/use-virtual-accounts';
import { toast } from '@/hooks/use-toast';
import { accountNumberToDisplay, formatAccountDisplay } from '@/lib/account-utils';

export function VirtualAccountWidget() {
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const { createVirtualAccount, loading, balance } = useVirtualAccounts();

  const handleCreate = async () => {
    const amountInKobo = Math.round(parseFloat(amount) * 100);
    
    if (!amount || amountInKobo < 10000) { // Min ₦100
      toast({
        title: 'Invalid Amount',
        description: 'Minimum amount is ₦100',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Creating virtual account for amount:', amountInKobo);
      const result = await createVirtualAccount(amountInKobo);
      console.log('Virtual account result:', result);
      
      if (result.success) {
        setAmount('');
        setShowForm(false);
        setCreatedAccount(result.data);
        toast({
          title: 'Virtual Account Created',
          description: 'Your VFD virtual account is ready for funding',
        });
      } else {
        toast({
          title: 'Creation Failed',
          description: result.error || 'Failed to create virtual account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Virtual account creation error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Account number copied to clipboard',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          VFD Virtual Account
        </CardTitle>
        <Badge variant="secondary" className="text-xs">NEW</Badge>
      </CardHeader>
      <CardContent>
        {createdAccount ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">Virtual Account Created</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Account:</span>
                  <span className="font-mono">{formatAccountDisplay(createdAccount.vfd_account_number)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(accountNumberToDisplay(createdAccount.vfd_account_number))}
                    className="h-4 w-4 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Bank:</span>
                  <span>VFD Microfinance Bank</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Amount:</span>
                  <span>₦{createdAccount.amount}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setCreatedAccount(null)} 
              size="sm" 
              variant="outline"
              className="w-full"
            >
              Create Another
            </Button>
          </div>
        ) : !showForm ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate temporary bank account numbers for instant wallet funding
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              size="sm" 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Virtual Account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Input
                type="number"
                placeholder="Enter amount (₦)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: ₦100
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate}
                disabled={loading}
                size="sm"
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Generate'}
              </Button>
              <Button 
                onClick={() => setShowForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {balance && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-sm font-semibold">
              ₦{(balance.balance / 100).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}