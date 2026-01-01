"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { PinModal } from "@/components/auth/pin-modal";

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  rate: string;
  duration: string;
  color: string;
}

interface OvomonieInvestmentConfirmProps {
  plan: InvestmentPlan;
  amount: number;
  onBack: () => void;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function OvomonieInvestmentConfirm({ 
  plan, 
  amount, 
  onBack, 
  onConfirm, 
  onCancel,
  isProcessing = false 
}: OvomonieInvestmentConfirmProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const calculateReturns = (principal: number, rate: string, days: number = 365) => {
    const annualRate = parseFloat(rate.replace('%', '')) / 100;
    return (principal * annualRate * days) / 365;
  };

  const monthlyReturns = Math.round(calculateReturns(amount, plan.rate, 30));
  const yearlyReturns = Math.round(calculateReturns(amount, plan.rate));

  const handleProceed = () => {
    if (agreedToTerms) {
      setShowPinModal(true);
    }
  };

  const handlePinConfirm = (pin: string) => {
    setShowPinModal(false);
    onConfirm(pin);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#13284d] border-b p-4">
        <div className="max-w-md mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-1 text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
              <span className="text-[#13284d] font-bold text-xs">O</span>
            </div>
            <h1 className="text-lg font-semibold text-white">Confirm Investment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Investment Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white border border-blue-200 rounded-xl flex items-center justify-center mr-3">
                <span className="text-[#13284d] font-bold">
                  {plan.name.split(' ')[1][0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Investment Amount</span>
                <span className="font-semibold text-lg">₦{amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Interest Rate</span>
                <Badge variant="secondary" className="font-medium">
                  {plan.rate}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{plan.duration}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns Breakdown */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-900">Expected Returns</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">Monthly Returns</span>
                <span className="font-semibold text-green-800">
                  +₦{monthlyReturns.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Yearly Returns</span>
                <span className="font-semibold text-green-800">
                  +₦{yearlyReturns.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-200">
                <span className="text-green-700 font-medium">Total After 1 Year</span>
                <span className="font-bold text-green-800 text-lg">
                  ₦{(amount + yearlyReturns).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Key Features</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-[#13284d] mr-3" />
                <span className="text-sm">SEC regulated and insured</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-[#13284d] mr-3" />
                <span className="text-sm">Flexible withdrawal options</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-[#13284d] mr-3" />
                <span className="text-sm">Competitive interest rates</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-900 mb-2">Important Notice</h4>
                <p className="text-sm text-orange-800">
                  Investment returns are estimates based on current rates and market conditions. 
                  Actual returns may vary. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <div className="flex items-start space-x-3 mb-6">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
            I agree to the{' '}
            <span className="text-[#13284d] underline">Terms and Conditions</span>{' '}
            and understand the risks associated with this investment.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleProceed}
            disabled={!agreedToTerms || isProcessing}
            className="w-full h-12 bg-[#13284d] hover:bg-[#0f1f3a] disabled:bg-gray-300"
          >
            {isProcessing ? 'Processing...' : 'Confirm Investment'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full h-12"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* PIN Modal */}
      <PinModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing}
        title="Confirm Investment"
        description="Enter your 4-digit PIN to complete this investment"
      />
    </div>
  );
}