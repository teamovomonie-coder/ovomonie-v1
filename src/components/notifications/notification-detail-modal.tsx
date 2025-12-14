'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Phone, User, Building2, DollarSign, Calendar, Copy, CheckCircle } from 'lucide-react';
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
  const metadata = notification.metadata || {};
  const isSent = notification.type === 'debit';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Transfer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount and Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{formatAmount(notification.amount || 0)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Completed</span>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              {isSent ? 'Sent From' : 'Received From'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Name</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metadata.senderName || 'N/A'}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.senderName || '', 'senderName')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'senderName' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metadata.senderPhone || 'N/A'}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.senderPhone || '', 'senderPhone')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'senderPhone' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Account</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">
                    {metadata.senderAccount || 'N/A'}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.senderAccount || '', 'senderAccount')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'senderAccount' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              {isSent ? 'Sent To' : 'Sent To'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Name</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metadata.recipientName || 'N/A'}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.recipientName || '', 'recipientName')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'recipientName' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metadata.recipientPhone || 'N/A'}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.recipientPhone || '', 'recipientPhone')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'recipientPhone' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Account</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">
                    {metadata.recipientAccount || 'N/A'}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(metadata.recipientAccount || '', 'recipientAccount')
                    }
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'recipientAccount' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                <span className="font-mono truncate">{notification.id}</span>
                <button
                  onClick={() => copyToClipboard(notification.id || '', 'reference')}
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
                {formatDate(notification.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-6">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
