'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useVirtualAccounts } from '@/hooks/use-virtual-accounts';
import { toast } from '@/hooks/use-toast';

// Nigerian banks list (subset)
const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '014', name: 'Afribank Nigeria Plc' },
  { code: '023', name: 'Citibank Nigeria Limited' },
  { code: '050', name: 'Ecobank Nigeria Plc' },
  { code: '011', name: 'First Bank of Nigeria Limited' },
  { code: '214', name: 'First City Monument Bank Limited' },
  { code: '070', name: 'Fidelity Bank Plc' },
  { code: '058', name: 'Guaranty Trust Bank Plc' },
  { code: '030', name: 'Heritage Banking Company Ltd' },
  { code: '082', name: 'Keystone Bank Limited' },
  { code: '076', name: 'Polaris Bank Limited' },
  { code: '221', name: 'Stanbic IBTC Bank Plc' },
  { code: '068', name: 'Standard Chartered Bank Nigeria Limited' },
  { code: '232', name: 'Sterling Bank Plc' },
  { code: '032', name: 'Union Bank of Nigeria Plc' },
  { code: '033', name: 'United Bank For Africa Plc' },
  { code: '215', name: 'Unity Bank Plc' },
  { code: '566', name: 'VFD Microfinance Bank' },
  { code: '035', name: 'Wema Bank Plc' },
  { code: '057', name: 'Zenith Bank Plc' }
];

export function VFDTransfer() {
  const [formData, setFormData] = useState({
    amount: '',
    recipientAccount: '',
    recipientBank: '',
    narration: ''
  });
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [transferResult, setTransferResult] = useState<any>(null);
  
  const { balance, initiateTransfer, loading } = useVirtualAccounts();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { amount, recipientAccount, recipientBank, narration } = formData;
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return false;
    }

    if (!recipientAccount || recipientAccount.length !== 10) {
      toast({
        title: 'Invalid Account',
        description: 'Account number must be 10 digits',
        variant: 'destructive'
      });
      return false;
    }

    if (!recipientBank) {
      toast({
        title: 'Select Bank',
        description: 'Please select recipient bank',
        variant: 'destructive'
      });
      return false;
    }

    if (!narration.trim()) {
      toast({
        title: 'Add Description',
        description: 'Please add a transfer description',
        variant: 'destructive'
      });
      return false;
    }

    const amountInKobo = Math.round(amountNum * 100);
    if (balance && amountInKobo > balance.balance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough funds for this transfer',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleProceed = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    setStep('processing');
    
    const amountInKobo = Math.round(parseFloat(formData.amount) * 100);
    
    const result = await initiateTransfer(
      amountInKobo,
      formData.recipientAccount,
      formData.recipientBank,
      formData.narration
    );

    if (result.success) {
      setTransferResult(result);
      setStep('success');
      toast({
        title: 'Transfer Successful',
        description: 'Your transfer has been processed successfully',
      });
    } else {
      setStep('form');
      toast({
        title: 'Transfer Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      recipientAccount: '',
      recipientBank: '',
      narration: ''
    });
    setStep('form');
    setTransferResult(null);
  };

  const selectedBank = BANKS.find(bank => bank.code === formData.recipientBank);

  if (step === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-6 h-6" />
            Transfer Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">₦{parseFloat(formData.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Recipient:</span>
              <span>{formData.recipientAccount}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank:</span>
              <span>{selectedBank?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Reference:</span>
              <span className="font-mono text-sm">{transferResult?.reference}</span>
            </div>
          </div>
          
          <Button onClick={resetForm} className="w-full">
            Make Another Transfer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'processing') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Processing Transfer</h3>
          <p className="text-gray-600 text-center">
            Please wait while we process your transfer...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirm') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirm Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">₦{parseFloat(formData.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Recipient Account:</span>
              <span>{formData.recipientAccount}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank:</span>
              <span>{selectedBank?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Description:</span>
              <span>{formData.narration}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1">
              {loading ? 'Processing...' : 'Confirm Transfer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Bank Transfer
        </CardTitle>
        {balance && (
          <p className="text-sm text-gray-600">
            Available Balance: ₦{(balance.balance / 100).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            min="1"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientAccount">Recipient Account Number</Label>
          <Input
            id="recipientAccount"
            placeholder="Enter 10-digit account number"
            value={formData.recipientAccount}
            onChange={(e) => handleInputChange('recipientAccount', e.target.value)}
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientBank">Recipient Bank</Label>
          <Select value={formData.recipientBank} onValueChange={(value) => handleInputChange('recipientBank', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="narration">Description</Label>
          <Input
            id="narration"
            placeholder="Enter transfer description"
            value={formData.narration}
            onChange={(e) => handleInputChange('narration', e.target.value)}
            maxLength={50}
          />
        </div>

        <Button onClick={handleProceed} className="w-full">
          Proceed
        </Button>
      </CardContent>
    </Card>
  );
}