"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TransactionStatus = 'processing' | 'completed' | 'failed' | 'not_found';

interface TransactionStatusResponse {
  ok: boolean;
  status: TransactionStatus;
  transaction?: {
    id: string;
    reference: string;
    status: string;
    category: string;
  };
  message?: string;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;
  const [status, setStatus] = useState<TransactionStatus>('processing');
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const maxPolls = 30; // 30 seconds max (1 poll per second)

  useEffect(() => {
    if (!reference) {
      setStatus('not_found');
      setError('Transaction reference is missing');
      return;
    }

    // Clear any previous receipt state
    try {
      localStorage.removeItem('ovo-pending-receipt');
    } catch (e) {
      console.debug('[ProcessingPage] Failed to clear localStorage:', e);
    }

    let pollInterval: NodeJS.Timeout | null = null;

    const checkTransactionStatus = async () => {
      if (pollCountRef.current >= maxPolls) {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        setStatus('failed');
        setError('Transaction confirmation timed out. Please check your transaction history.');
        return;
      }

      pollCountRef.current += 1;

      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          setStatus('failed');
          setError('Authentication required');
          return;
        }

        const response = await fetch(`/api/transactions/status?reference=${encodeURIComponent(reference)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Transaction not found yet, continue polling
            return;
          }
          throw new Error('Failed to check transaction status');
        }

        const data: TransactionStatusResponse = await response.json();

        // CRITICAL: Only redirect to success if transaction is confirmed as completed
        // This prevents race condition where receipt is shown before VFD confirms
        if (data.ok && data.status === 'completed' && data.transaction) {
          // Double-check: verify transaction ID exists and matches reference
          if (!data.transaction.id) {
            console.warn('[ProcessingPage] Transaction completed but no ID provided');
            // Continue polling
            return;
          }
          
          // Verify transaction reference matches what we're waiting for
          if (data.transaction.reference && data.transaction.reference !== reference) {
            console.error('[ProcessingPage] Reference mismatch on completion:', {
              expected: reference,
              got: data.transaction.reference
            });
            // Don't redirect with wrong reference
            setStatus('failed');
            setError('Transaction reference mismatch');
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            return;
          }
          
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          setStatus('completed');
          setTransactionId(data.transaction.id);
          
          // Variables for receipt building (needed in setTimeout closure)
          let receiptData: any = null;
          let templateType: string = 'airtime';
          
          // Fetch full transaction data to build receipt
          try {
            const txResponse = await fetch(`/api/transactions/${encodeURIComponent(data.transaction.id)}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            });

            if (txResponse.ok) {
              const txData = await txResponse.json();
              const transaction = txData.transaction || txData;
              
              // Determine receipt type and save to database
              // Inline helper functions (receipt-helpers was removed)
              const determineReceiptType = (tx: any): string => {
                const category = (tx.category || '').toLowerCase().trim();
                const metadata = tx.metadata || {};
                if (category === 'betting' || metadata.service_type === 'betting') return 'betting';
                if (category === 'airtime' || category === 'data') return 'airtime';
                if (category === 'bill_payment' || category === 'bill-payment' || category.includes('bill')) return 'utility';
                if (category === 'transfer') {
                  if (metadata.isInternal || !metadata.bankCode) return 'internal-transfer';
                  return 'external-transfer';
                }
                return 'airtime';
              };
              
              const formatReferenceId = (type: string, ref: string): string => {
                const prefixes: Record<string, string> = {
                  'betting': 'BET', 'airtime': 'AIR', 'data': 'AIR', 'utility': 'BIL',
                  'bill-payment': 'BIL', 'internal-transfer': 'INT', 'external-transfer': 'EXT', 'memo-transfer': 'MEM'
                };
                const prefix = prefixes[type.toLowerCase()] || 'TXN';
                const refNumber = ref.replace(/^[A-Z]{3}-?/i, '');
                return `${prefix}-${refNumber}`;
              };
              
              const getTransactionAmount = (tx: any): number => {
                return tx.amount ? tx.amount / 100 : 0;
              };
              
              templateType = determineReceiptType(transaction);
              const amount = getTransactionAmount(transaction);
              const rawReference = transaction.reference || transaction.id;
              const formattedReference = formatReferenceId(templateType, rawReference);
              const metadata = transaction.metadata || {};
              
              // Build receipt data with complete transaction information for each type
              const party = transaction.party || {};
              
              if (templateType === 'betting') {
                receiptData = {
                  platform: metadata.bettingProvider || metadata.platform || transaction.party_name || party.name || 'Betting Platform',
                  accountId: metadata.accountId || transaction.party_account || party.account || 'N/A',
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              } else if (templateType === 'airtime') {
                receiptData = {
                  network: metadata.network || transaction.party_name || party.name || 'Mobile Network',
                  phoneNumber: metadata.phoneNumber || metadata.recipient || transaction.party_account || party.account || '',
                  planName: metadata.plan_name || metadata.planName || metadata.plan,
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              } else if (templateType === 'utility') {
                const billMetadata = metadata.receipt || metadata;
                receiptData = {
                  biller: transaction.party_name || party.name || billMetadata.billerName || billMetadata.biller?.name || metadata.billerName || 'Service Provider',
                  accountId: transaction.party_account || party.account || billMetadata.accountId || billMetadata.customerId || metadata.accountId || '',
                  verifiedName: billMetadata.verifiedName || billMetadata.customerName || metadata.verifiedName || metadata.customerName,
                  token: billMetadata.token || metadata.token,
                  KCT1: billMetadata.KCT1 || metadata.KCT1,
                  KCT2: billMetadata.KCT2 || metadata.KCT2,
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                  category: billMetadata.category || metadata.category || transaction.category,
                };
              } else if (templateType === 'internal-transfer') {
                receiptData = {
                  recipientName: transaction.party_name || party.name || metadata.recipientName || 'Recipient',
                  bankName: 'Ovomonie', // Always Ovomonie for internal transfers
                  accountNumber: transaction.party_account || party.account || metadata.accountNumber || '',
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              } else if (templateType === 'external-transfer') {
                receiptData = {
                  recipientName: transaction.party_name || party.name || metadata.recipientName || 'Recipient',
                  bankName: metadata.bankName || party.bank || 'Bank',
                  accountNumber: transaction.party_account || party.account || metadata.accountNumber || '',
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              } else if (templateType === 'memo-transfer') {
                const isInternal = metadata.isInternal || !metadata.bankCode || metadata.bankName === 'Ovomonie' || party.bank === 'Ovomonie';
                receiptData = {
                  recipientName: transaction.party_name || party.name || metadata.recipientName || 'Recipient',
                  bankName: isInternal ? 'Ovomonie' : (metadata.bankName || party.bank || 'Bank'),
                  accountNumber: transaction.party_account || party.account || metadata.accountNumber || '',
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  message: metadata.memoMessage || metadata.message || transaction.message || '',
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              } else {
                // Fallback - should not happen with proper type detection
                receiptData = {
                  amount: amount,
                  transactionId: formattedReference,
                  completedAt: transaction.created_at || new Date().toISOString(),
                  narration: transaction.narration,
                  balanceAfter: transaction.balance_after ? transaction.balance_after / 100 : undefined,
                };
              }
              
              // Save receipt to database - wait for it to complete
              let receiptSaved = false;
              try {
                const saveResponse = await fetch('/api/receipts', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  // Save receipt with raw reference for DB lookup, but include formatted in data
                  body: JSON.stringify({
                    transactionId: transaction.id,
                    transactionReference: rawReference, // Use raw reference for DB storage
                    templateType, // This is the correct type determined from transaction
                    receiptData: {
                      ...receiptData,
                      // Ensure transactionId uses formatted reference for display
                      transactionId: formattedReference,
                    },
                  }),
                });
                
                if (saveResponse.ok) {
                  const saveResult = await saveResponse.json();
                  if (saveResult.ok && saveResult.receiptId) {
                    receiptSaved = true;
                  }
                }
                
                if (!receiptSaved) {
                  console.error('[ProcessingPage] Failed to save receipt to database');
                }
              } catch (saveError) {
                console.error('[ProcessingPage] Error saving receipt:', saveError);
              }
              
              // Clear any old receipt state
              try {
                localStorage.removeItem('ovo-pending-receipt');
              } catch (e) {
                // Silently fail
              }
            }
          } catch (fetchError) {
            console.error('[ProcessingPage] Failed to fetch transaction details:', fetchError);
          }
          
          // Clear any cached transaction data
          try {
            sessionStorage.removeItem(`tx-${data.transaction.id}`);
          } catch (e) {
            // Silently fail
          }

          // Wait a bit to ensure receipt is saved, then redirect to success page
          // Give database time to commit the transaction
          setTimeout(() => {
            const successUrl = new URL('/success', window.location.origin);
            successUrl.searchParams.set('ref', reference);
            if (data.transaction?.id) {
              successUrl.searchParams.set('txId', data.transaction.id);
            }
            
            // Add transaction data as URL parameters for fallback receipt creation
            if (receiptData) {
              successUrl.searchParams.set('amount', receiptData.amount.toString());
              successUrl.searchParams.set('type', templateType);
              
              if (templateType === 'betting') {
                successUrl.searchParams.set('platform', receiptData.platform);
                successUrl.searchParams.set('accountId', receiptData.accountId);
              } else if (templateType === 'airtime') {
                successUrl.searchParams.set('network', receiptData.network);
                successUrl.searchParams.set('phone', receiptData.phoneNumber);
                if (receiptData.planName) {
                  successUrl.searchParams.set('plan', receiptData.planName);
                }
              } else if (templateType === 'utility') {
                successUrl.searchParams.set('biller', receiptData.biller);
                successUrl.searchParams.set('accountId', receiptData.accountId);
                if (receiptData.verifiedName) {
                  successUrl.searchParams.set('verifiedName', receiptData.verifiedName);
                }
              }
            } else {
              // Fallback: use URL params from processing page
              const urlParams = new URLSearchParams(window.location.search);
              const amount = urlParams.get('amount');
              const network = urlParams.get('network');
              const phone = urlParams.get('phone');
              const type = urlParams.get('type');
              
              if (amount) successUrl.searchParams.set('amount', amount);
              if (network) successUrl.searchParams.set('network', network);
              if (phone) successUrl.searchParams.set('phone', phone);
              if (type) successUrl.searchParams.set('type', type);
            }
            
            router.push(successUrl.toString());
          }, 1000);
        } else if (data.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          setStatus('failed');
          setError(data.message || 'Transaction failed');
        }
        // If status is still 'processing', continue polling
      } catch (err: any) {
        console.error('[ProcessingPage] Status check error:', err);
        // Don't set error immediately - might be network issue, continue polling
        if (pollCountRef.current >= 5) {
          // Only show error after several failed attempts
          setError('Unable to verify transaction status. Please check your transaction history.');
        }
      }
    };

    // Start polling for transaction status
    pollInterval = setInterval(checkTransactionStatus, 1000); // Poll every second

    // Initial check
    checkTransactionStatus();

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [reference, router]);

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Confirmed!</h2>
            <p className="text-gray-600">Preparing your receipt...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'failed' || status === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {status === 'not_found' ? 'Transaction Not Found' : 'Transaction Failed'}
            </h2>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/statements')} 
                className="w-full"
              >
                View Transaction History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Processing Transaction</h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment with the provider...
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Reference: <span className="font-mono text-xs">{reference}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a few seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

