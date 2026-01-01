"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/context/notification-context"
import { AdvancedWealthDashboard } from "./advanced-wealth-dashboard"
import { RiskAssessment } from "./risk-assessment"
import { InvestmentProductCatalog } from "./investment-product-catalog"
import { PinModal } from "@/components/auth/pin-modal"
import { CheckCircle, TrendingUp, Shield, Target } from "lucide-react"

interface RiskProfile {
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  investment_horizon: number;
  income_stability: 'stable' | 'variable' | 'irregular';
  age_group: string;
  financial_goals: string[];
  risk_score: number;
}

interface InvestmentFormData {
  productId: string;
  amount: number;
  duration?: string;
  pin: string;
  clientReference: string;
}

function InvestmentSuccessReceipt({ amount, plan, onDone }: { amount: number, plan: string, onDone: () => void }) {
    return (
        <div className="flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <CardTitle className="text-2xl mt-4">Investment Successful!</CardTitle>
                    <CardDescription>
                        You have successfully invested in {plan}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Amount Invested</p>
                        <p className="text-3xl font-bold">₦{amount.toLocaleString()}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={onDone} className="w-full">Back to Wealth Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export function WealthDashboard() {
  const [currentView, setCurrentView] = useState<'onboarding' | 'dashboard' | 'products'>('dashboard');
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [pendingInvestment, setPendingInvestment] = useState<InvestmentFormData | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ amount: number; plan: string; } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    checkRiskProfile();
  }, []);

  const checkRiskProfile = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return;

      const response = await fetch('/api/wealth/investments?type=risk-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        if (profile) {
          setRiskProfile(profile);
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to check risk profile:', error);
      setCurrentView('dashboard'); // Default to dashboard if check fails
    }
  };

  const handleRiskAssessmentComplete = (profile: RiskProfile) => {
    setRiskProfile(profile);
    setCurrentView('dashboard');
    toast({
      title: 'Welcome to Ovo-Wealth!',
      description: 'Your personalized investment recommendations are ready.'
    });
  };

  const handleInvestmentRequest = (productId: string, amount: number) => {
    if (balance === null || (amount * 100) > balance) {
      toast({ 
        variant: 'destructive', 
        title: 'Insufficient Funds', 
        description: 'Your wallet balance is not enough for this investment.' 
      });
      return;
    }

    const investmentData: InvestmentFormData = {
      productId,
      amount,
      pin: '',
      clientReference: `investment-${crypto.randomUUID()}`
    };

    setPendingInvestment(investmentData);
    setIsPinModalOpen(true);
  };

  const handleConfirmInvestment = async (pin?: string) => {
    if (!pendingInvestment || !pin) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required.');

      const response = await fetch('/api/wealth/investments?action=create-investment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...pendingInvestment, pin }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Investment failed');
      }

      updateBalance(result.newBalanceInKobo);
      addNotification({
        title: 'Investment Successful!',
        description: `You invested ₦${pendingInvestment.amount.toLocaleString()}.`,
        category: 'transaction',
      });

      setReceiptData({ 
        amount: pendingInvestment.amount, 
        plan: 'Investment Product' 
      });
      setIsPinModalOpen(false);
    } catch (error: any) {
      let description = 'An unknown error occurred.';
      if (error.message === 'Authentication required.') {
        description = 'Your session has expired. Please log in again.';
        logout();
      } else if (error.message) {
        description = error.message;
      }
      setApiError(description);
    } finally {
      setIsProcessing(false);
      setPendingInvestment(null);
    }
  };

  if (receiptData) {
    return (
      <InvestmentSuccessReceipt 
        amount={receiptData.amount} 
        plan={receiptData.plan} 
        onDone={() => setReceiptData(null)} 
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <RiskAssessment 
        onComplete={handleRiskAssessmentComplete}
        onSkip={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'products') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Investment Products</h2>
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>Back to Dashboard</Button>
        </div>
        <InvestmentProductCatalog onInvest={handleInvestmentRequest} />
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products" onClick={() => setCurrentView('products')}>Products</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdvancedWealthDashboard />
        </TabsContent>
      </Tabs>

      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmInvestment}
        isProcessing={isProcessing}
        title="Authorize Investment"
        description="Enter your 4-digit PIN to confirm this investment."
        error={apiError}
        onClearError={() => setApiError(null)}
      />
    </>
  );
}