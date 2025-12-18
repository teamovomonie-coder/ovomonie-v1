'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Phone, User, Building2, DollarSign, Calendar, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Notification } from '@/lib/notification-data';

interface NotificationDetailModalProps {
  notification: Notification & { metadata?: any };
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && notification.reference) {
      fetchTransactionDetails();
    } else if (isOpen) {
      setLoading(false);
    }
  }, [isOpen, notification.reference]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch(`/api/transactions/details?reference=${notification.reference}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Transaction details fetched:', result.data);
        setTransactionData(result.data);
      } else {
        console.error('API error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatAmount = (amount: number) => {
    // amount is in kobo (divide by 100 to get naira)
    return (amount / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract sender/recipient from text if not in notification fields
  const extractNameFromText = (text: string, type: 'from' | 'to') => {
    if (type === 'from') {
      // Match: "from Jane ella" or "from Jane ella."
      const match = text.match(/from\s+([A-Za-z][A-Za-z\s]+?)(?:\.|$)/i);
      if (match) {
        console.log('Extracted sender name:', match[1].trim());
        return match[1].trim();
      }
    } else {
      // Match: "to Jane ella" or "to Jane ella."
      const match = text.match(/to\s+([A-Za-z][A-Za-z\s]+?)(?:\.|$)/i);
      if (match) {
        console.log('Extracted recipient name:', match[1].trim());
        return match[1].trim();
      }
    }
    return null;
  };
  
  const notifText = notification.body || notification.description || '';
  const isCredit = notification.type === 'credit' || notifText.toLowerCase().includes('received');
  const isDebit = notification.type === 'debit' || notifText.toLowerCase().includes('sent');
  const extractedSender = isCredit ? extractNameFromText(notifText, 'from') : null;
  const extractedRecipient = isDebit ? extractNameFromText(notifText, 'to') : null;
  
  console.log('Extracted values:', { extractedSender, extractedRecipient, isCredit, isDebit });
  
  // Use transaction data if available, otherwise extract from notification
  const metadata = transactionData && Object.keys(transactionData).length > 0 ? transactionData : {
    senderName: notification.sender_name || extractedSender || null,
    senderPhone: notification.sender_phone || null,
    senderAccount: notification.sender_account || null,
    recipientName: notification.recipient_name || extractedRecipient || null,
    recipientPhone: notification.recipient_phone || null,
    recipientAccount: notification.recipient_account || null,
    narration: notifText,
  };
  // Extract amount from notification or transaction data
  let displayAmount = transactionData?.amount || notification.amount || 0;
  
  // Fallback: try to extract amount from notification body/description if amount is 0
  if (displayAmount === 0) {
    const text = notification.body || notification.description || '';
    // Try multiple patterns: ₦50, ₦50.00, N50, etc.
    const patterns = [
      /₦([\d,]+(?:\.\d{2})?)/,
      /N([\d,]+(?:\.\d{2})?)/,
      /NGN\s*([\d,]+(?:\.\d{2})?)/i,
      /([\d,]+(?:\.\d{2})?)\s*(?:naira|NGN)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const extractedAmount = parseFloat(match[1].replace(/,/g, ''));
        displayAmount = Math.round(extractedAmount * 100); // Convert to kobo
        console.log('Extracted amount:', extractedAmount, 'from text:', text);
        break;
      }
    }
  }
  
  console.log('Final displayAmount:', displayAmount, 'Notification:', notification);
  
  const notifTextLower = notifText.toLowerCase();
  const isReceived = notifTextLower.includes('received');
  const isSentTransfer = notifTextLower.includes('sent');
  const isTransfer = notification.category === 'transfer';
  const hasTransferDetails = metadata.senderName || metadata.recipientName;
  
  console.log('Transfer check:', { 
    isReceived, 
    isSentTransfer, 
    isTransfer,
    extractedSender,
    extractedRecipient,
    senderName: metadata.senderName, 
    senderAccount: metadata.senderAccount,
    recipientName: metadata.recipientName,
    recipientAccount: metadata.recipientAccount,
    willShowSender: isTransfer && isReceived && (extractedSender || metadata.senderName),
    willShowAccount: metadata.senderAccount && metadata.senderAccount.length >= 6
  });
  
  // Determine transaction type for title
  const getTransactionTitle = () => {
    const text = notification.body || notification.description || '';
    if (text.toLowerCase().includes('airtime')) return 'Airtime Purchase';
    if (text.toLowerCase().includes('data')) return 'Data Purchase';
    if (text.toLowerCase().includes('bill')) return 'Bill Payment';
    if (isTransfer) return 'Transfer Details';
    return 'Transaction Details';
  };

  const ariaDescId = notification?.id ? `notif-desc-${notification.id}` : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={ariaDescId} className="w-screen h-screen max-w-none m-0 rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            {getTransactionTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hidden description for accessibility (prevents DialogContent warning about missing description) */}
          {ariaDescId && (
            <p id={ariaDescId} className="sr-only">
              {notification.body || notification.description || notification.metadata?.narration || 'Notification details'}
            </p>
          )}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
          {/* Amount and Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{formatAmount(displayAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Completed</span>
              </div>
            </div>
          </div>

          {/* Sender Information - Only show for received transfers */}
          {isTransfer && isReceived && (extractedSender || metadata.senderName) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Received From
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium">
                    {extractedSender || metadata.senderName || 'Unknown'}
                  </span>
                </div>
                {metadata.senderAccount && typeof metadata.senderAccount === 'string' && metadata.senderAccount.length >= 6 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Account</span>
                    <span className="text-xs font-mono text-gray-600">
                      Ovomonie | {metadata.senderAccount.slice(0, 3)}****{metadata.senderAccount.slice(-3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Recipient Information - Only show for sent transfers */}
          {isTransfer && isSentTransfer && metadata.recipientName && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Sent To
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium">
                    {extractedRecipient || metadata.recipientName || 'Unknown'}
                  </span>
                </div>
                {metadata.recipientAccount && metadata.recipientAccount.length >= 6 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Account</span>
                    <span className="text-xs font-mono text-gray-600">
                      Ovomonie | {metadata.recipientAccount.slice(0, 3)}****{metadata.recipientAccount.slice(-3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Narration */}
          {metadata.narration && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-sm bg-gray-50 p-3 rounded text-gray-700">
                {metadata.narration}
              </p>
            </div>
          )}

          {/* Reference and Date */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-600 mb-1">Reference</p>
              <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
                <span className="font-mono truncate">{metadata.reference || notification.reference || notification.id}</span>
                <button
                  onClick={() => copyToClipboard(metadata.reference || notification.reference || notification.id || '', 'reference')}
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                >
                  {copiedField === 'reference' ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Date</p>
              <p className="bg-gray-50 p-2 rounded text-gray-700">
                {formatDate(metadata.timestamp || notification.timestamp)}
              </p>
            </div>
          </div>
            </>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-6" disabled={loading}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
