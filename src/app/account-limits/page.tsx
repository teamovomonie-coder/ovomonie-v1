"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, Lightbulb, Info, ChevronRight, Shield, Building2, CreditCard, Wallet, Loader2, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const tiers = [
  {
    tier: 1,
    name: 'Tier 1',
    icon: Wallet,
    color: 'from-blue-500 to-blue-600',
    walletLimit: 50000,
    dailyLimit: 15000,
    requirements: ['Phone Number', 'Email Address', 'Basic Info'],
    completed: true
  },
  {
    tier: 2,
    name: 'Tier 2',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    walletLimit: 2000000,
    dailyLimit: 500000,
    requirements: ['BVN Verification', 'Live Selfie Capture', 'Phone Number Verification (OTP)'],
    completed: false
  },
  {
    tier: 3,
    name: 'Tier 3',
    icon: Shield,
    color: 'from-[#0b1b3a] to-[#0f2552]',
    walletLimit: 'Unlimited',
    dailyLimit: 5000000,
    requirements: ['NIN Verification', 'Utility Bill'],
    completed: false
  },
  {
    tier: 4,
    name: 'Business',
    icon: Building2,
    color: 'from-green-500 to-green-600',
    walletLimit: 'Unlimited',
    dailyLimit: '5,000,000+',
    requirements: ['CAC Registration', 'Business Documents', 'Business Owner', 'Director Info', 'Proof of Business Address'],
    completed: false
  }
];

export default function AccountLimitsPage() {
  const router = useRouter();
  const { user, fetchUserData } = useAuth();
  const [currentTier, setCurrentTier] = useState(user?.kycTier || 1);
  const [dailyUsage] = useState(0);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  // Update current tier when user data changes
  useEffect(() => {
    if (user?.kycTier) {
      setCurrentTier(user.kycTier);
    }
  }, [user?.kycTier]);

  const activeTier = tiers.find(t => t.tier === currentTier) || tiers[0];
  const dailyLimit = typeof activeTier.dailyLimit === 'number' ? activeTier.dailyLimit : 5000000;
  const usagePercent = (dailyUsage / dailyLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Account Limits</h1>
        </div>

        <Card className="mb-6 border-none shadow-xl overflow-hidden bg-gradient-to-br from-[#0b1b3a] to-[#0f2552]">
          <CardContent className="p-6 text-white relative">
            <div className="absolute top-4 right-4 bg-white/20 p-3 rounded-full">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90">CURRENT STATUS</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-3xl font-bold">{activeTier.name}</h2>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Daily Usage</span>
                <span className="font-semibold">₦{dailyUsage.toLocaleString()} / ₦{dailyLimit.toLocaleString()}</span>
              </div>
              <Progress value={usagePercent} className="h-2 bg-white/20" />
              <p className="text-xs opacity-75 text-right">Resets at midnight</p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">YOUR LIMITS</h3>
          <Card className="shadow-md">
            <CardContent className="p-0 divide-y">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Limit</p>
                  <p className="text-xl font-bold">{typeof activeTier.walletLimit === 'number' ? `₦${activeTier.walletLimit.toLocaleString()}` : activeTier.walletLimit}</p>
                </div>
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Transfer Limit</p>
                  <p className="text-xl font-bold">₦{typeof activeTier.dailyLimit === 'number' ? activeTier.dailyLimit.toLocaleString() : activeTier.dailyLimit}</p>
                </div>
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Maximum Balance</p>
                  <p className="text-xl font-bold text-green-600">{typeof activeTier.walletLimit === 'number' ? `₦${activeTier.walletLimit.toLocaleString()}` : activeTier.walletLimit}</p>
                </div>
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-gradient-to-r from-[#0b1b3a]/5 to-[#0f2552]/5 border-[#0b1b3a]/20 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-gradient-to-r from-[#0b1b3a] to-[#0f2552] p-3 rounded-full">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Need higher limits?</p>
              <p className="text-sm text-muted-foreground">Upgrade your account tier</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">UPGRADE OPTIONS</h3>
          <div className="space-y-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isActive = tier.tier === currentTier;
              const isCompleted = tier.tier < currentTier;
              
              return (
                <Card key={tier.tier} className={cn("shadow-md transition-all hover:shadow-lg", isActive && "ring-2 ring-primary")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-full bg-gradient-to-br", tier.color)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-lg">{tier.name}</h4>
                          {isActive && <Badge variant="default">Current</Badge>}
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Wallet Limit</p>
                            <p className="font-semibold">{typeof tier.walletLimit === 'number' ? `₦${tier.walletLimit.toLocaleString()}` : tier.walletLimit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Daily Limit</p>
                            <p className="font-semibold">{typeof tier.dailyLimit === 'number' ? `₦${tier.dailyLimit.toLocaleString()}` : tier.dailyLimit}</p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {tier.requirements.map((req, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{req}</Badge>
                            ))}
                          </div>
                        </div>
                        {!isActive && !isCompleted && (
                          <Button 
                            className="w-full" 
                            variant={tier.tier === currentTier + 1 ? "default" : "outline"}
                            onClick={() => {
                              setSelectedTier(tier.tier);
                              setUpgradeDialogOpen(true);
                            }}
                          >
                            Upgrade to {tier.name}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <UpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen}
        tier={selectedTier}
        requirements={tiers.find(t => t.tier === selectedTier)?.requirements || []}
      />
    </div>
  );
}


function UpgradeDialog({ open, onOpenChange, tier, requirements }: { open: boolean; onOpenChange: (open: boolean) => void; tier: number | null; requirements: string[] }) {
  const { toast } = useToast();
  const { user, fetchUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [ninData, setNinData] = useState<any>(null);
  const [utilityBillFile, setUtilityBillFile] = useState<File | null>(null);

  if (!tier) return null;

  const verifyNin = async () => {
    if (!formData.nin || formData.nin.length !== 11) {
      toast({ title: 'Error', description: 'Please enter a valid 11-digit NIN', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const res = await fetch('/api/kyc/nin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nin: formData.nin }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.message);
      
      setNinData(result.data);
      toast({ title: 'NIN Verified', description: 'NIN verification successful.' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'NIN verification failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 5MB', variant: 'destructive' });
        return;
      }
      setUtilityBillFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tier === 3) {
      if (!ninData) {
        toast({ title: 'Error', description: 'Please verify your NIN first', variant: 'destructive' });
        return;
      }
      if (!utilityBillFile) {
        toast({ title: 'Error', description: 'Please upload your utility bill', variant: 'destructive' });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('tier', tier.toString());
      
      if (tier === 3) {
        formDataToSend.append('nin', formData.nin);
        formDataToSend.append('ninData', JSON.stringify(ninData));
        if (utilityBillFile) {
          formDataToSend.append('utilityBill', utilityBillFile);
        }
      }
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'nin') {
          formDataToSend.append(key, value);
        }
      });

      const response = await fetch('/api/kyc/upgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.message || 'Upgrade failed');
      
      toast({ title: 'Upgrade Successful', description: result.message });
      onOpenChange(false);
      await fetchUserData();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to submit upgrade request.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTier3Form = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nin">National Identity Number (NIN)</Label>
        {ninData ? (
          <div className="text-sm text-green-600 p-2 bg-green-50 rounded">
            ✓ NIN verified: {ninData.firstName} {ninData.lastName}
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              id="nin"
              type="text"
              placeholder="11-digit NIN"
              maxLength={11}
              value={formData.nin || ''}
              onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
              required
            />
            <Button type="button" onClick={verifyNin} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify NIN
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="utilityBill">Utility Bill (PDF or Image)</Label>
        <Input
          id="utilityBill"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          required
        />
        {utilityBillFile && (
          <div className="text-sm text-green-600">
            ✓ File selected: {utilityBillFile.name}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Upload a recent utility bill (electricity, water, or gas) not older than 3 months
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Tier {tier}</DialogTitle>
          <DialogDescription>
            {tier === 3 ? 'Verify your NIN and upload a utility bill to upgrade' : 'Complete the following requirements to upgrade your account'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {tier === 3 ? renderTier3Form() : (
            <div className="space-y-2">
              <Label>Requirements:</Label>
              <div className="flex flex-wrap gap-1">
                {requirements.map((req, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{req}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}