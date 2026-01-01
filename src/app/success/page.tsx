"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, Home } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OvoLogo } from '@/components/layout/logo';
import { Loader2 } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceipt();
    }, 100);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const fetchReceipt = async () => {
      // Get URL parameters first
      const ref = searchParams?.get('ref');
      const amount = parseFloat(searchParams?.get('amount') || '0');
      const type = searchParams?.get('type') || 'airtime';
      
      // Get type-specific parameters
      const network = searchParams?.get('network') || 'Mobile Network';
      const phone = searchParams?.get('phone') || '';
      const platform = searchParams?.get('platform') || '';
      const accountId = searchParams?.get('accountId') || '';
      const provider = searchParams?.get('provider') || '';
      const customerId = searchParams?.get('customerId') || '';
      const plan = searchParams?.get('plan') || ''; // For data purchases
      
      // Transfer-specific parameters
      const recipientName = searchParams?.get('recipientName') || '';
      const bankName = searchParams?.get('bankName') || '';
      const accountNumber = searchParams?.get('accountNumber') || '';
      const narration = searchParams?.get('narration') || '';
      
      console.log('[SuccessPage] All URL params:', {
        ref, amount, network, phone, type, platform, accountId, provider, customerId,
        recipientName, bankName, accountNumber, narration, plan,
        allParams: Object.fromEntries(searchParams?.entries() || [])
      });
      
      // If we have URL parameters with sufficient data, use them directly
      const hasAirtimeData = amount > 0 && network !== 'Mobile Network' && phone;
      const hasBettingData = amount > 0 && platform && accountId;
      const hasUtilityData = amount > 0 && provider && customerId;
      const hasTransferData = amount > 0 && recipientName && (type === 'internal-transfer' || type === 'external-transfer');
      const hasDataPurchase = amount > 0 && network !== 'Mobile Network' && phone && type === 'data';
      
      if (hasAirtimeData || hasBettingData || hasUtilityData || hasTransferData || hasDataPurchase) {
        console.log('[SuccessPage] Using URL parameters directly');
        
        let receiptData;
        if (type === 'betting' && hasBettingData) {
          receiptData = {
            amount,
            platform,
            accountId,
            transactionId: ref || `success_${Date.now()}`,
            completedAt: new Date().toISOString(),
            type: 'betting'
          };
        } else if (type === 'utility' && hasUtilityData) {
          receiptData = {
            amount,
            provider,
            customerId,
            transactionId: ref || `success_${Date.now()}`,
            completedAt: new Date().toISOString(),
            type: 'utility'
          };
        } else if ((type === 'internal-transfer' || type === 'external-transfer') && hasTransferData) {
          receiptData = {
            amount,
            recipientName,
            bankName: bankName || (type === 'internal-transfer' ? 'Ovomonie' : 'External Bank'),
            accountNumber,
            narration,
            transactionId: ref || `success_${Date.now()}`,
            completedAt: new Date().toISOString(),
            type
          };
        } else {
          receiptData = {
            amount,
            network,
            phoneNumber: phone,
            plan: plan, // Add plan for data purchases
            transactionId: ref || `success_${Date.now()}`,
            completedAt: new Date().toISOString(),
            type: type === 'data' ? 'data' : 'airtime'
          };
        }
        
        setReceiptData(receiptData);
        setIsLoading(false);
        return;
      }
      
      // Try database if URL params are incomplete
      if (ref) {
        try {
          const token = localStorage.getItem('ovo-auth-token');
          const response = await fetch(`/api/receipts?reference=${encodeURIComponent(ref)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('[SuccessPage] Database response:', result);
            if (result.receipt) {
              console.log('[SuccessPage] Using database data');
              setReceiptData(result.receipt.receipt_data);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('[SuccessPage] Database fetch error:', error);
        }
      }
      
      // Skip fallback entirely if we don't have valid URL params - just show loading
      if (!hasAirtimeData && !hasBettingData && !hasUtilityData && !hasTransferData && !hasDataPurchase && !ref) {
        // No valid data at all, keep loading
        return;
      }
      
      // Final fallback only if we have a reference but incomplete data
      console.log('[SuccessPage] Using fallback data');
      let fallbackData;
      if (type === 'betting') {
        fallbackData = {
          amount,
          platform: platform || 'Betting Platform',
          accountId: accountId || 'Unknown Account',
          transactionId: ref || `success_${Date.now()}`,
          completedAt: new Date().toISOString(),
          type: 'betting'
        };
      } else if (type === 'utility') {
        fallbackData = {
          amount,
          provider: provider || 'Utility Provider',
          customerId: customerId || 'Unknown Customer',
          transactionId: ref || `success_${Date.now()}`,
          completedAt: new Date().toISOString(),
          type: 'utility'
        };
      } else if (type === 'internal-transfer' || type === 'external-transfer') {
        fallbackData = {
          amount,
          recipientName: recipientName || 'Unknown Recipient',
          bankName: bankName || (type === 'internal-transfer' ? 'Ovomonie' : 'External Bank'),
          accountNumber: accountNumber || 'Unknown Account',
          narration,
          transactionId: ref || `success_${Date.now()}`,
          completedAt: new Date().toISOString(),
          type
        };
      } else {
        fallbackData = {
          amount,
          network,
          phoneNumber: phone,
          plan: plan, // Add plan for data purchases
          transactionId: ref || `success_${Date.now()}`,
          completedAt: new Date().toISOString(),
          type: type === 'data' ? 'data' : 'airtime'
        };
      }
      setReceiptData(fallbackData);
      setIsLoading(false);
    };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Receipt not found</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card ref={receiptRef} className="w-full max-w-sm shadow-lg border-0 overflow-hidden bg-white rounded-2xl" style={{borderRadius: '16px'}}>
        {/* Header */}
        <div className="bg-[#13284d] text-white p-6 text-center relative">
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1">Purchase Successful</h2>
          <p className="text-blue-100 text-sm">
            {receiptData.type === 'betting' ? 'Betting Account Funding' : 
             receiptData.type === 'utility' ? 'Utility Bill Payment' : 
             receiptData.type === 'internal-transfer' ? 'Ovomonie Transfer' :
             receiptData.type === 'external-transfer' ? 'Bank Transfer' :
             'Airtime/Data Purchase'}
          </p>
          <div className="flex justify-center my-3">
            <OvoLogo width={40} height={40} />
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold">₦{receiptData.amount.toLocaleString()}</p>
            <div className="flex items-center justify-center mt-2 text-green-300">
              <Check className="w-4 h-4 mr-1" />
              <span className="text-sm">Completed</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-0">
          <div className="bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Purchase Details</h3>
            <div className="space-y-2 text-sm">
              {receiptData.type === 'betting' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform</span>
                    <span className="font-semibold text-right">{receiptData.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account ID</span>
                    <span className="font-semibold text-right">{receiptData.accountId}</span>
                  </div>
                </>
              ) : receiptData.type === 'utility' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider</span>
                    <span className="font-semibold text-right">{receiptData.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer ID</span>
                    <span className="font-semibold text-right">{receiptData.customerId}</span>
                  </div>
                </>
              ) : receiptData.type === 'internal-transfer' || receiptData.type === 'external-transfer' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-semibold text-right">{receiptData.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank</span>
                    <span className="font-semibold text-right">{receiptData.bankName}</span>
                  </div>
                  {receiptData.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number</span>
                      <span className="font-semibold text-right">{receiptData.accountNumber}</span>
                    </div>
                  )}
                  {receiptData.narration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Narration</span>
                      <span className="font-semibold text-right">{receiptData.narration}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold text-right">{receiptData.network}</span>
                  </div>
                  {receiptData.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone Number</span>
                      <span className="font-semibold text-right">{receiptData.phoneNumber}</span>
                    </div>
                  )}
                  {receiptData.plan && receiptData.type === 'data' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Bundle</span>
                      <span className="font-semibold text-right">{receiptData.plan}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono text-xs font-semibold text-right max-w-[60%] break-all">{receiptData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-semibold text-right text-xs">{new Date(receiptData.completedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-2">
          <div className="w-full">
            <p className="text-xs text-gray-500 text-center mb-4">Powered by Ovomonie</p>
            <div className="space-y-2">
              <Button className="w-full bg-[#13284d] hover:bg-[#13284d]/90 text-white no-capture" onClick={() => setIsShareOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Receipt
              </Button>
              <div className="grid grid-cols-2 gap-2 no-capture">
                <Button variant="destructive" className="w-full" onClick={() => router.push('/support')}>
                  Report Issue
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  if (receiptData.type === 'internal-transfer') {
                    router.push('/internal-transfer');
                  } else if (receiptData.type === 'external-transfer') {
                    router.push('/external-transfer');
                  } else if (receiptData.type === 'betting') {
                    router.push('/betting');
                  } else if (receiptData.type === 'utility') {
                    router.push('/bill-payment');
                  } else {
                    router.push('/airtime');
                  }
                }}>
                  {receiptData.type === 'internal-transfer' || receiptData.type === 'external-transfer' ? 'Transfer Again' :
                   receiptData.type === 'betting' ? 'Fund Again' :
                   receiptData.type === 'utility' ? 'Purchase Again' :
                   'Buy Again'}
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={`${receiptData.type === 'betting' ? 'Betting' : 
                 receiptData.type === 'utility' ? 'Utility' : 
                 receiptData.type === 'internal-transfer' ? 'Ovomonie Transfer' :
                 receiptData.type === 'external-transfer' ? 'Bank Transfer' :
                 'Airtime'} Receipt`} 
      />
    </div>
  );
}