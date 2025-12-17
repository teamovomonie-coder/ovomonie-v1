'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useVirtualAccounts } from '@/hooks/use-virtual-accounts';
import { toast } from '@/hooks/use-toast';

export function VirtualAccountFunding() {
  const [amount, setAmount] = useState('');
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const { createVirtualAccount, loading, error } = useVirtualAccounts();

  const handleCreateAccount = async () => {
    const amountInKobo = Math.round(parseFloat(amount) * 100);
    
    if (!amount || amountInKobo <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    const result = await createVirtualAccount(amountInKobo);
    
    if (result.success) {
      setActiveAccount(result.data);
      toast({
        title: 'Virtual Account Created',
        description: 'Use the account details below to fund your wallet',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              🏦
            </div>
            Bank Transfer Funding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Fund (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="0.01"
            />
            <p className="text-sm text-gray-500">
              Minimum: ₦100. You'll get a temporary account number for this transfer.
            </p>
          </div>

          <Button 
            onClick={handleCreateAccount}
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Generate Account Number'}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {activeAccount && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Virtual Account Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">{activeAccount.vfdAccountNumber}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(activeAccount.vfdAccountNumber, 'Account number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Bank Name:</span>
                <span>VFD Microfinance Bank</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Account Name:</span>
                <span>Ovomonie - {activeAccount.merchantId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount:</span>
                <span className="font-semibold">₦{parseFloat(activeAccount.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Transfer exactly ₦{parseFloat(activeAccount.amount).toLocaleString()} to the account above</li>
                <li>Use any Nigerian bank or mobile app</li>
                <li>Your wallet will be credited automatically within 5 minutes</li>
                <li>This account expires in 3 days</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a one-time virtual account. 
                After funding, it will be deactivated automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}