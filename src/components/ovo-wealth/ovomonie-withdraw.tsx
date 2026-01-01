"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { PinModal } from "@/components/auth/pin-modal";

interface Portfolio {
  id: string;
  product_name: string;
  current_value: number;
  principal_amount: number;
  status: string;
  liquidity_period: number;
  investment_date: string;
}

interface OvomonieWithdrawProps {
  onBack: () => void;
  portfolios: Portfolio[];
  totalBalance: number;
  onWithdrawSuccess: () => void;
}

export function OvomonieWithdraw({ onBack, portfolios, totalBalance, onWithdrawSuccess }: OvomonieWithdrawProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const availablePortfolios = portfolios.filter(p => 
    p.status === 'active' && canWithdraw(p)
  );

  function canWithdraw(portfolio: Portfolio): boolean {
    if (portfolio.liquidity_period === 0) return true;
    const investmentDate = new Date(portfolio.investment_date);
    const lockEndDate = new Date(investmentDate.getTime() + portfolio.liquidity_period * 24 * 60 * 60 * 1000);
    return new Date() >= lockEndDate;
  }

  const handleWithdraw = () => {
    if (selectedPortfolio && withdrawAmount) {
      setShowPinModal(true);
    }
  };

  const handlePinConfirm = async (pin: string) => {
    setShowPinModal(false);
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/wealth/investments?action=withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portfolioId: selectedPortfolio?.id,
          amount: parseFloat(withdrawAmount),
          pin,
          clientReference: `wealth-withdraw-${crypto.randomUUID()}`
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      onWithdrawSuccess();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const maxWithdrawAmount = selectedPortfolio ? selectedPortfolio.current_value / 100 : 0;
  const isValidAmount = withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= maxWithdrawAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#13284d] text-white p-4">
        <div className="max-w-md mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-1 text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
              <span className="text-[#13284d] font-bold text-xs">O</span>
            </div>
            <h1 className="text-lg font-semibold">Withdraw Funds</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Total Available Balance */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Available to Withdraw</p>
                <p className="text-xl font-bold text-green-800">₦{(totalBalance / 100).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Select Investment to Withdraw From</h3>
          {availablePortfolios.length === 0 ? (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-800">No investments available for withdrawal</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {availablePortfolios.map((portfolio) => (
                <Card 
                  key={portfolio.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPortfolio?.id === portfolio.id 
                      ? 'ring-2 ring-[#13284d] border-[#13284d]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPortfolio(portfolio)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{portfolio.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          Current Value: ₦{(portfolio.current_value / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          +₦{((portfolio.current_value - portfolio.principal_amount) / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Returns</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        {selectedPortfolio && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Withdrawal Amount</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₦${maxWithdrawAmount.toLocaleString()}`}
                  className="pl-8 text-lg font-medium"
                />
              </div>
              
              {withdrawAmount && parseFloat(withdrawAmount) > maxWithdrawAmount && (
                <p className="text-red-500 text-sm mt-2">
                  Maximum withdrawal is ₦{maxWithdrawAmount.toLocaleString()}
                </p>
              )}

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[0.25, 0.5, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount((maxWithdrawAmount * percentage).toString())}
                    className="text-xs"
                  >
                    {percentage === 1 ? 'All' : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={!isValidAmount || isProcessing}
          className="w-full h-12 bg-[#13284d] hover:bg-[#0f1f3a] disabled:bg-gray-300"
        >
          {isProcessing ? 'Processing...' : 'Withdraw Funds'}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4 px-4">
          Funds will be transferred to your main wallet balance. Early withdrawal may incur fees.
        </p>
      </div>

      {/* PIN Modal */}
      <PinModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing}
        title="Confirm Withdrawal"
        description="Enter your 4-digit PIN to complete this withdrawal"
      />
    </div>
  );
}