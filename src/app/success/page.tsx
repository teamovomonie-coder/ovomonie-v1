"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MemoReceipt from '@/components/memo-transfer/memo-receipt';
import GeneralReceipt from '@/components/transaction/general-receipt';
import { BettingReceipt } from '@/components/betting/betting-receipt';
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';
import { DynamicReceipt } from '@/components/bill-payment/dynamic-receipt';
import VirtualCardReceipt from '@/components/custom-card/virtual-card-receipt';
import { pendingTransactionService } from '@/lib/pending-transaction-service';
import { receiptTemplateService } from '@/lib/receipt-templates';

type ReceiptStore = {
  transactionId: string | undefined;
  type?: string;
  data: any;
  recipientName?: string;
  completedAt?: string;
  bankName?: string;
  reference?: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptStore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasLoadedRef = useRef(false);

  // Function to fetch receipt from API by reference
  const fetchReceiptFromAPI = async (reference: string): Promise<ReceiptStore | null> => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return null;

      // Try the new general receipt API first
      const generalResponse = await fetch(`/api/receipt/${encodeURIComponent(reference)}?type=external-transfer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (generalResponse.ok) {
        const result = await generalResponse.json();
        if (result.ok && result.receipt) {
          const receipt = result.receipt;
          
          // Convert to ReceiptStore format
          const receiptData: ReceiptStore = {
            transactionId: receipt.transactionId || reference,
            type: receipt.type,
            data: {
              amount: receipt.amount,
              accountNumber: receipt.accountNumber || '',
              bankCode: '', // Not available in API response
              narration: receipt.narration || '',
            },
            recipientName: receipt.recipientName || 'Unknown Recipient',
            bankName: receipt.bankName || 'Unknown Bank',
            reference: receipt.reference,
            completedAt: receipt.completedAt
          };

          return receiptData;
        }
      }

      // Fallback to transactions API
      const response = await fetch(`/api/transactions?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const result = await response.json();
      if (!result.success || !result.data) return null;

      // Find the transaction by reference
      const transaction = result.data.find((tx: any) => 
        tx.reference === reference || 
        tx.id === reference
      );

      if (!transaction) return null;

      // Convert transaction to receipt format
      const receiptData: ReceiptStore = {
        transactionId: transaction.id || reference,
        type: transaction.category === 'transfer' ? 'external-transfer' : transaction.category,
        data: {
          amount: Math.round(transaction.amount / 100), // Convert from kobo
          accountNumber: transaction.party?.account || '',
          bankCode: '', // Not available in transaction data
          narration: transaction.narration || '',
        },
        recipientName: transaction.party?.name || 'Unknown Recipient',
        bankName: transaction.party?.bank || 'Unknown Bank',
        reference: transaction.reference,
        completedAt: transaction.created_at
      };

      return receiptData;
    } catch (error) {
      console.error('Error fetching receipt from API:', error);
      return null;
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    const loadReceipt = async () => {
      try {
        console.log('Success page loading - checking for receipt data');
        
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const transactionId = urlParams.get('transactionId');
        
        // For airtime/data transactions, redirect to unified receipt page
        if ((type === 'airtime' || type === 'data') && transactionId) {
          const receiptUrl = `/receipt/${encodeURIComponent(transactionId)}?txId=${encodeURIComponent(transactionId)}&type=${type}`;
          console.log('Redirecting to airtime/data receipt:', receiptUrl);
          router.replace(receiptUrl);
          return;
        }
        
        // Check localStorage immediately
        const pendingReceipt = localStorage.getItem('ovo-pending-receipt');
        console.log('Immediate localStorage check result:', pendingReceipt);
        console.log('URL params:', { type, transactionId, reference: urlParams.get('ref') });
        
        if (pendingReceipt) {
          try {
            const receiptData = JSON.parse(pendingReceipt);
            console.log('Successfully parsed receipt data:', receiptData);
            console.log('Receipt validation check:', {
              hasType: !!receiptData.type,
              hasRecipientName: !!receiptData.recipientName,
              hasAmount: !!(receiptData.amount || receiptData.data?.amount),
              amount: receiptData.amount,
              dataAmount: receiptData.data?.amount
            });
            
            // Validate receipt data has required fields
            if (receiptData.type && receiptData.recipientName && (receiptData.amount || receiptData.data?.amount)) {
              // Ensure amount is available at root level for compatibility
              if (!receiptData.amount && receiptData.data?.amount) {
                receiptData.amount = receiptData.data.amount;
              }
              setCurrentReceipt(receiptData);
              setIsReady(true);
              setIsInitialized(true);
              console.log('Receipt loaded successfully');
              return;
            } else {
              console.error('Receipt data missing required fields:', receiptData);
              console.log('Attempting to fix receipt data...');
              
              // Try to fix missing fields
              if (!receiptData.type) receiptData.type = 'external-transfer';
              if (!receiptData.recipientName && receiptData.data?.recipientName) {
                receiptData.recipientName = receiptData.data.recipientName;
              }
              if (!receiptData.amount && receiptData.data?.amount) {
                receiptData.amount = receiptData.data.amount;
              }
              
              // Try again after fixing
              if (receiptData.type && receiptData.recipientName && receiptData.amount) {
                console.log('Receipt data fixed, loading...');
                setCurrentReceipt(receiptData);
                setIsReady(true);
                setIsInitialized(true);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing receipt data:', e);
          }
        }
        
        console.log('No valid receipt found, will try API and then redirect to dashboard');
        setIsInitialized(true);
        
        // Try to fetch from API using URL parameters
        const reference = urlParams.get('ref') || urlParams.get('reference');
        
        if (reference) {
          console.log('Attempting to fetch receipt from API with reference:', reference);
          const apiReceipt = await fetchReceiptFromAPI(reference);
          
          if (apiReceipt) {
            console.log('Receipt fetched from API:', apiReceipt);
            setCurrentReceipt(apiReceipt);
            setIsReady(true);
            return;
          }
        }
        
        // Only redirect to dashboard if we're sure there's no receipt coming
        // Check a few more times with delays to catch any delayed receipt data
        let attempts = 0;
        const maxAttempts = 3;
        
        const recheckForReceipt = async () => {
          attempts++;
          const delayedReceipt = localStorage.getItem('ovo-pending-receipt');
          
          if (delayedReceipt) {
            try {
              const receiptData = JSON.parse(delayedReceipt);
              if (receiptData.type && receiptData.recipientName && (receiptData.amount || receiptData.data?.amount)) {
                setCurrentReceipt(receiptData);
                setIsReady(true);
                console.log('Receipt found on attempt', attempts);
                return;
              }
            } catch (e) {
              console.error('Error parsing delayed receipt:', e);
            }
          }
          
          if (attempts < maxAttempts) {
            setTimeout(recheckForReceipt, 1000); // Check again after 1 second
          } else {
            // Check if there's a fallback receipt URL
            const fallbackUrl = sessionStorage.getItem('ovo-receipt-fallback');
            if (fallbackUrl) {
              console.log('Using fallback receipt URL:', fallbackUrl);
              sessionStorage.removeItem('ovo-receipt-fallback');
              router.replace(fallbackUrl);
            } else {
              console.log('Redirecting to dashboard - no receipt found after', maxAttempts, 'attempts');
              router.replace('/dashboard');
            }
          }
        };
        
        setTimeout(recheckForReceipt, 500); // Start first recheck after 500ms
        
      } catch (error) {
        console.error('Error in loadReceipt:', error);
        setIsInitialized(true);
        setTimeout(() => router.replace('/dashboard'), 1000);
      }
    };
    
    loadReceipt();
  }, [router]);

  const handleReset = useCallback(async () => {
    // Complete cleanup of all receipt data
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ovo-receipt-') || key.startsWith('ovo-current-receipt') || key === 'ovo-pending-receipt')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error cleaning up receipt data:', e);
    }
    router.push('/dashboard');
  }, [router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Transaction</h2>
            <p className="text-sm text-muted-foreground">Generating your receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Transaction</h2>
            <p className="text-sm text-muted-foreground">Generating your receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentReceipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">No Receipt Found</h2>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const receiptKey = `receipt-${currentReceipt.type}-${currentReceipt.data?.uniqueId || currentReceipt.transactionId || currentReceipt.reference || Date.now()}`;

  if (currentReceipt.type === 'memo-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <MemoReceipt 
          data={currentReceipt.data} 
          recipientName={currentReceipt.recipientName} 
          onReset={handleReset} 
          transactionId={currentReceipt.transactionId} 
          date={currentReceipt.completedAt || currentReceipt.data?.date} 
          isInternalTransfer={currentReceipt.data?.isInternalTransfer} 
        />
      </div>
    );
  }

  if (currentReceipt.type === 'external-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <GeneralReceipt
          title="External Transfer"
          amount={currentReceipt.data?.amount || 0}
          recipient={currentReceipt.recipientName}
          accountInfo={`${currentReceipt.data?.accountNumber} • ${currentReceipt.bankName}`}
          transactionId={currentReceipt.transactionId || currentReceipt.reference || `OVO-${Date.now()}`}
          paymentMethod={currentReceipt.bankName || 'Bank Transfer'}
          date={currentReceipt.completedAt || new Date().toLocaleString()}
          onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
          returnPath="/external-transfer"
        />
      </div>
    );
  }

  if (currentReceipt.type === 'internal-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <GeneralReceipt
          title="Internal Transfer"
          amount={currentReceipt.data?.amount || 0}
          recipient={currentReceipt.recipientName}
          accountInfo={`${currentReceipt.data?.accountNumber} • Ovomonie`}
          transactionId={currentReceipt.transactionId || currentReceipt.reference || `OVO-${Date.now()}`}
          paymentMethod="Ovomonie"
          date={currentReceipt.completedAt || new Date().toLocaleString()}
          onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
          returnPath="/internal-transfer"
        />
      </div>
    );
  }

  if (currentReceipt.type === 'betting') {
    const receipt = {
      template: {
        id: 'betting-default',
        category: 'betting',
        template_name: 'Betting Wallet Receipt',
        fields: ['accountId', 'walletBalance'],
        color_scheme: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5' },
        icon: 'trophy',
      },
      data: currentReceipt.data,
    };
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <DynamicReceipt receipt={{ ...receipt, data: { ...receipt.data, completedAt: receipt.data?.completedAt ?? '' } }} />
      </div>
    );
  }

  if (currentReceipt?.type === 'airtime') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <AirtimeReceipt data={{
          type: 'airtime',
          network: currentReceipt.data.network,
          phoneNumber: currentReceipt.data.phoneNumber,
          amount: currentReceipt.data.amount,
          planName: currentReceipt.data.planName,
          isDataPlan: currentReceipt.data.isDataPlan || currentReceipt.type === 'data',
          transactionId: currentReceipt.transactionId || currentReceipt.data.transactionId,
          completedAt: currentReceipt.completedAt || currentReceipt.data.completedAt
        }} />
      </div>
    );
  }

  if (currentReceipt.type === 'bill-payment') {
    const getTemplateColors = (cat: string) => {
      const colors: Record<string, any> = {
        utility: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fef3c7', icon: 'zap' },
        'cable tv': { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#ede9fe', icon: 'tv' },
        'internet subscription': { primary: '#06b6d4', secondary: '#22d3ee', accent: '#cffafe', icon: 'wifi' },
        betting: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5', icon: 'trophy' },
        water: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#dbeafe', icon: 'droplet' },
        airtime: { primary: '#ec4899', secondary: '#f472b6', accent: '#fce7f3', icon: 'phone' },
        data: { primary: '#a855f7', secondary: '#c084fc', accent: '#f3e8ff', icon: 'wifi' },
      };
      return colors[cat.toLowerCase()] || { primary: '#6366f1', secondary: '#818cf8', accent: '#e0e7ff', icon: 'receipt' };
    };
    
    const category = currentReceipt.data?.category || 'generic';
    const colors = getTemplateColors(category);
    const receipt = {
      template: {
        id: `${category}-default`,
        category,
        template_name: 'Bill Payment Receipt',
        fields: ['accountId'],
        color_scheme: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
        icon: colors.icon,
      },
      data: currentReceipt.data,
    };
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <DynamicReceipt receipt={{ ...receipt, data: { ...receipt.data, completedAt: receipt.data?.completedAt ?? currentReceipt.completedAt ?? '' } }} />
      </div>
    );
  }

  if (currentReceipt.type === 'virtual-card') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <VirtualCardReceipt
          data={currentReceipt.data}
          transactionId={currentReceipt.transactionId}
          onReset={handleReset}
        />
      </div>
    );
  }

  let returnPath = '/';
  if (currentReceipt.type === 'external-transfer') {
    returnPath = '/external-transfer';
  } else if (currentReceipt.type === 'internal-transfer') {
    returnPath = '/internal-transfer';
  } else if (currentReceipt.data?.isInternalTransfer === true) {
    returnPath = '/internal-transfer';
  } else if (currentReceipt.data?.isInternalTransfer === false) {
    returnPath = '/external-transfer';
  }

  return (
    <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
      <GeneralReceipt
        title={(currentReceipt.type === 'external-transfer' ? 'External Transfer' : currentReceipt.data && currentReceipt.data.typeName) || 'Transaction'}
        amount={currentReceipt.data?.amount || 0}
        recipient={currentReceipt.recipientName || currentReceipt.data?.recipient}
        accountInfo={currentReceipt.data?.accountNumber || ''}
        transactionId={currentReceipt.transactionId || currentReceipt.data?.transactionId || `OVO-${Date.now()}`}
        paymentMethod={currentReceipt.bankName || currentReceipt.data?.paymentMethod || currentReceipt.data?.method}
        date={currentReceipt.completedAt || currentReceipt.data?.date || new Date().toLocaleString()}
        onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
        returnPath={returnPath}
      />
    </div>
  );
}