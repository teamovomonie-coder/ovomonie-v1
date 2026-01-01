"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Info, Calculator } from "lucide-react";

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  rate: string;
  minAmount: number;
  maxAmount?: number;
  duration: string;
  features: string[];
  color: string;
  popular?: boolean;
}

interface OvomonieInvestmentSelectProps {
  onBack: () => void;
  onSelect: (plan: InvestmentPlan, amount: number) => void;
}

export function OvomonieInvestmentSelect({ onBack, onSelect }: OvomonieInvestmentSelectProps) {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  const plans: InvestmentPlan[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Ovo Save',
      description: 'Flexible savings with daily interest',
      rate: '10% p.a.',
      minAmount: 1000,
      duration: 'Flexible',
      features: ['Daily interest', 'Withdraw anytime', 'No lock-in period'],
      color: 'bg-white border border-blue-200'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Ovo Target',
      description: 'Goal-based savings plan',
      rate: '12% p.a.',
      minAmount: 5000,
      duration: '3-12 months',
      features: ['Higher returns', 'Goal tracking', 'Auto-save'],
      color: 'bg-blue-50 border border-blue-300',
      popular: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Ovo Lock',
      description: 'Fixed deposit with guaranteed returns',
      rate: '15% p.a.',
      minAmount: 10000,
      duration: '6-24 months',
      features: ['Guaranteed returns', 'Higher interest', 'Fixed tenure'],
      color: 'bg-white border border-blue-200'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Ovo Boost',
      description: 'High-yield investment plan',
      rate: '18% p.a.',
      minAmount: 25000,
      maxAmount: 1000000,
      duration: '12+ months',
      features: ['Maximum returns', 'Premium plan', 'Wealth building'],
      color: 'bg-blue-50 border border-blue-300'
    }
  ];

  const calculateReturns = (principal: number, rate: string, days: number = 365) => {
    const annualRate = parseFloat(rate.replace('%', '')) / 100;
    return (principal * annualRate * days) / 365;
  };

  const handleAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setAmount(numValue);
  };

  const handleInvest = () => {
    if (selectedPlan && amount && parseInt(amount) >= selectedPlan.minAmount) {
      onSelect(selectedPlan, parseInt(amount));
    }
  };

  const isValidAmount = selectedPlan && amount && 
    parseInt(amount) >= selectedPlan.minAmount && 
    (!selectedPlan.maxAmount || parseInt(amount) <= selectedPlan.maxAmount);

  return (
    <div className="min-h-screen bg-white">
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
            <h1 className="text-lg font-semibold text-white">Choose Investment Plan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Investment Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all ${
                selectedPlan?.id === plan.id 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className={`w-10 h-10 ${plan.color} rounded-xl flex items-center justify-center mr-3 flex-shrink-0`}>
                    <span className="text-[#13284d] font-bold text-sm">
                      {plan.name.split(' ')[1][0]}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{plan.name}</h3>
                      <div className="flex items-center space-x-2">
                        {plan.popular && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Popular
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs font-medium">
                          {plan.rate}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Min: ₦{plan.minAmount.toLocaleString()}</span>
                      <span>Duration: {plan.duration}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Amount Input */}
        {selectedPlan && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Investment Amount</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-[#13284d] p-1"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  type="text"
                  value={amount ? parseInt(amount).toLocaleString() : ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={`Min ₦${selectedPlan.minAmount.toLocaleString()}`}
                  className="pl-8 text-lg font-medium"
                />
              </div>
              
              {amount && parseInt(amount) < selectedPlan.minAmount && (
                <p className="text-red-500 text-sm mt-2">
                  Minimum amount is ₦{selectedPlan.minAmount.toLocaleString()}
                </p>
              )}
              
              {selectedPlan.maxAmount && amount && parseInt(amount) > selectedPlan.maxAmount && (
                <p className="text-red-500 text-sm mt-2">
                  Maximum amount is ₦{selectedPlan.maxAmount.toLocaleString()}
                </p>
              )}

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[10000, 50000, 100000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-xs"
                  >
                    ₦{quickAmount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returns Calculator */}
        {selectedPlan && amount && showCalculator && isValidAmount && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Info className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">Estimated Returns</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Investment Amount:</span>
                  <span className="font-medium">₦{parseInt(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Rate:</span>
                  <span className="font-medium">{selectedPlan.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Returns:</span>
                  <span className="font-medium text-green-600">
                    +₦{Math.round(calculateReturns(parseInt(amount), selectedPlan.rate, 30)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Yearly Returns:</span>
                  <span className="font-medium text-green-600">
                    +₦{Math.round(calculateReturns(parseInt(amount), selectedPlan.rate)).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invest Button */}
        <Button
          onClick={handleInvest}
          disabled={!isValidAmount}
          className="w-full h-12 bg-[#13284d] hover:bg-[#0f1f3a] disabled:bg-gray-300"
        >
          {selectedPlan ? 'Invest Now' : 'Select a Plan'}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4 px-4">
          Investment returns are estimates and not guaranteed. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}