"use client";

import { Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

export interface VirtualCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  isActive: boolean;
  balance: number;
  createdAt: Date;
  expiresAt: Date;
}

interface VirtualCardDisplayProps {
  card: VirtualCard;
  isNumberVisible: boolean;
  onToggleNumberVisibility: (cardId: string) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  onLoadBalance?: (cardId: string) => void;
}

export function VirtualCardDisplay({
  card,
  isNumberVisible,
  onToggleNumberVisibility,
  onCopyToClipboard,
  onLoadBalance,
}: VirtualCardDisplayProps) {
  const { balance, user } = useAuth();
  const { toast } = useToast();

  // Prefer wallet balance (kobo) from auth context; fall back to card.balance
  const displayBalanceKobo = typeof balance === 'number' && balance !== null ? balance : card.balance;
  const displayBalance = (displayBalanceKobo / 100) || 0;
  const cardholderName = user?.fullName || 'OVOMONIE VIRTUAL';
  const maskCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ').split('').map((char, idx) => idx < 12 ? '*' : char).join('');
  };

  const displayNumber = isNumberVisible
    ? card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()
    : maskCardNumber(card.cardNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full px-2 sm:px-0"
    >
      {/* Virtual Card Visual */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[1.586] rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden mb-4 sm:mb-6">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 backdrop-blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-16 -mb-16" />
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

        {/* Card Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8 text-white z-10">
          {/* Header: Chip & Logo */}
          <div className="flex justify-between items-start">
            {/* Chip Design */}
            <div className="relative w-12 h-9 sm:w-16 sm:h-12 rounded-lg overflow-hidden shadow-lg" data-protected="chip">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500" />
              <div className="absolute inset-0.5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded" />
              {/* Chip Lines */}
              <div className="absolute inset-1 grid grid-cols-2 gap-0.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-yellow-700/30 rounded-sm" />
                ))}
              </div>
            </div>

            {/* Logo Section */}
            <div className="flex flex-col items-end gap-1">
              <div className="relative w-16 h-8 sm:w-20 sm:h-10">
                <Image
                  src="/images/ovomonie-watermark.png"
                  alt="Ovomonie Logo"
                  fill
                  className="object-contain object-right"
                  sizes="(max-width: 640px) 60px, 80px"
                />
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            {/* Card Number */}
            <div>
              <p className="text-xs font-medium opacity-75 mb-2 tracking-wide">CARD NUMBER</p>
              <p className="text-xl sm:text-2xl font-mono font-bold tracking-wider drop-shadow-lg">
                {displayNumber}
              </p>
            </div>

            {/* Footer: Name, Expiry, Type */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-75 mb-1">CARDHOLDER</p>
                <p className="text-sm sm:text-base font-semibold uppercase tracking-wide truncate pr-2">
                  {cardholderName.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75 " >EXPIRES</p>
                <p className="text-sm sm:text-base font-mono font-bold">{card.expiryDate}</p>
              </div>
            </div>
          </div>

          {/* Visa Logo & Card Type */}
          <div className="flex justify-between items-center ">
            <div className="text-xs font-bold opacity-90">VIRTUAL</div>
            <div className="text-xl sm:text-2xl font-black tracking-wider">VISA</div>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="space-y-3 sm:space-y-4">
        {/* Visibility Toggle & CVV Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {/* Toggle Visibility */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggleNumberVisibility(card.id)}
            className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-colors text-sm sm:text-base"
          >
            <span className="font-medium text-blue-900">
              {isNumberVisible ? 'Hide Card Number' : 'Show Card Number'}
            </span>
            {isNumberVisible ? (
              <EyeOff className="h-5 w-5 text-blue-600" />
            ) : (
              <Eye className="h-5 w-5 text-blue-600" />
            )}
          </motion.button>

          {/* CVV Display */}
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
            <p className="text-xs text-purple-600 font-semibold mb-2">SECURITY CODE (CVV)</p>
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-mono font-bold text-purple-900">
                {isNumberVisible ? card.cvv : '***'}
              </p>
              {isNumberVisible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopyToClipboard(card.cvv, 'CVV')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Card Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
          >
            <p className="text-xs text-green-600 font-semibold mb-2">BALANCE</p>
            <p className="text-base sm:text-lg font-bold text-green-900">
              ₦{displayBalance.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
          >
            <p className="text-xs text-blue-600 font-semibold mb-2">STATUS</p>
            <p className="text-base sm:text-lg font-bold text-blue-900">
              {card.isActive ? '✓ Active' : 'Inactive'}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 col-span-2 sm:col-span-1"
          >
            <p className="text-xs text-amber-600 font-semibold mb-2">EXPIRES</p>
            <p className="text-xs sm:text-sm font-bold text-amber-900">
              {new Date(card.expiresAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <Button
            onClick={() => onCopyToClipboard(card.cardNumber, 'Card Number')}
            variant="outline"
            className="flex-1 h-10 sm:h-12 font-semibold text-sm sm:text-base border-blue-200 hover:bg-blue-50"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Copy Number</span>
            <span className="sm:hidden">Copy</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
