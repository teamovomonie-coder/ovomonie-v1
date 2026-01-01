"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useWealthNotifications } from "@/context/wealth-notification-context";
import { OvomonieWealthDashboard } from "./ovomonie-wealth-dashboard";
import { OvomonieInvestmentSelect } from "./ovomonie-investment-select";
import { OvomonieInvestmentConfirm } from "./ovomonie-investment-confirm";
import { OvomonieWithdraw } from "./ovomonie-withdraw";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ViewState = 'dashboard' | 'select' | 'confirm' | 'success' | 'withdraw';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  rate: string;
  duration: string;
  color: string;
}

interface SuccessData {
  plan: string;
  amount: number;
  transactionId: string;
  portfolioId: string;
  newBalance: number;
}

export function OvomonieWealthMain() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [forceRender, setForceRender] = useState(0);

  const { toast } = useToast();
  const { balance, updateBalance } = useAuth();
  const { addNotification } = useWealthNotifications();

  const handlePlanSelect = (plan: InvestmentPlan, amount: number) => {
    setSelectedPlan(plan);
    setInvestmentAmount(amount);
    setCurrentView('confirm');
  };

  const handleInvestmentConfirm = async (pin: string) => {
    if (!selectedPlan) return;

    console.log('Starting investment process...');
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      // Check balance
      if (balance === null || (investmentAmount * 100) > balance) {
        throw new Error('Insufficient wallet balance');
      }

      const response = await fetch('/api/wealth/investments?action=create-investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedPlan.id,
          amount: investmentAmount,
          pin,
          clientReference: `ovomonie-investment-${crypto.randomUUID()}`
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Investment API error:', result);
        throw new Error(result.error || 'Investment failed');
      }

      console.log('Investment successful:', result);

      // Update balance
      updateBalance(result.newBalanceInKobo);

      // Add notification
      addNotification({
        title: 'Investment Successful!',
        description: `You invested ₦${investmentAmount.toLocaleString()} in ${selectedPlan.name}`,
        type: 'investment',
        amount: investmentAmount
      });

      // Show success toast
      toast({
        title: 'Investment Successful!',
        description: `You invested ₦${investmentAmount.toLocaleString()} in ${selectedPlan.name}`,
      });
      
      // Reset states and redirect to ovo-wealth
      setIsProcessing(false);
      setSelectedPlan(null);
      setInvestmentAmount(0);
      setCurrentView('dashboard');
      
      // Navigate away from success URL
      window.location.href = '/ovo-wealth';
    } catch (error) {
      console.error('Investment error:', error);
      toast({
        variant: 'destructive',
        title: 'Investment Failed',
        description: error instanceof Error ? error.message : 'Please try again'
      });
      setIsProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPlan(null);
    setInvestmentAmount(0);
    setSuccessData(null);
    // Force refresh to show updated data
    window.location.reload();
  };

  // Main Navigation
  switch (currentView) {
    case 'select':
      return (
        <OvomonieInvestmentSelect
          onBack={() => setCurrentView('dashboard')}
          onSelect={handlePlanSelect}
        />
      );

    case 'confirm':
      return selectedPlan ? (
        <OvomonieInvestmentConfirm
          plan={selectedPlan}
          amount={investmentAmount}
          onBack={() => setCurrentView('select')}
          onConfirm={handleInvestmentConfirm}
          onCancel={() => setCurrentView('dashboard')}
          isProcessing={isProcessing}
        />
      ) : null;

    case 'withdraw':
      return (
        <OvomonieWithdraw
          onBack={() => setCurrentView('dashboard')}
          portfolios={portfolios}
          totalBalance={portfolioSummary?.currentValue || 0}
          onWithdrawSuccess={() => {
            addNotification({
              title: 'Withdrawal Successful',
              description: 'Funds transferred to your wallet',
              type: 'withdrawal'
            });
            setCurrentView('dashboard');
            window.location.reload();
          }}
        />
      );

    default:
      return (
        <OvomonieWealthDashboard
          onInvestClick={() => setCurrentView('select')}
          onWithdrawClick={() => setCurrentView('withdraw')}
        />
      );
  }
}