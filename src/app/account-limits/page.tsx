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
  const [otpSent, setOtpSent] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [bvnData, setBvnData] = useState<any>(null);
  const [ninData, setNinData] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: BVN, 2: Selfie, 3: OTP, 4: Submit

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
      toast({ title: 'NIN Verified', description: 'NIN verification successful. Please continue with liveness check.' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'NIN verification failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyImageMatch = async () => {
    if (!selfieImage || !bvnData?.bvn) {
      toast({ title: 'Error', description: 'Please capture selfie and verify BVN first', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const res = await fetch('/api/kyc/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tier: 2,
          bvn: bvnData.bvn,
          selfie: selfieImage,
          imageMatch: true
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.message);
      
      if (result.data?.imageMatch?.match) {
        toast({ 
          title: 'Image Match Successful', 
          description: `Similarity: ${result.data.imageMatch.confidence.toFixed(1)}%` 
        });
        setStep(3);
      } else {
        toast({ 
          title: 'Image Match Failed', 
          description: 'Your selfie does not match your BVN photo. Please retake.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Image verification failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBvn = async () => {
    if (!formData.bvn || formData.bvn.length !== 11) {
      toast({ title: 'Error', description: 'Please enter a valid 11-digit BVN', variant: 'destructive' });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({ title: 'Error', description: 'Please enter your date of birth', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const res = await fetch('/api/kyc/bvn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          bvn: formData.bvn,
          dateOfBirth: formData.dateOfBirth 
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.message);
      
      setBvnData(result.data);
      setStep(2);
      toast({ title: 'BVN Verified', description: 'BVN and date of birth verified successfully. Please capture your selfie.' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'BVN verification failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const res = await fetch('/api/kyc/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: user?.phone }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setOtpSent(true);
      toast({ title: 'OTP Sent', description: 'Check your phone for the verification code.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send OTP', variant: 'destructive' });
    }
  };

  const captureSelfie = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      // Create video element for preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // Create modal for camera preview
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); display: flex; align-items: center; 
        justify-content: center; z-index: 9999;
      `;
      
      const container = document.createElement('div');
      container.style.cssText = `
        background: white; padding: 20px; border-radius: 10px; 
        text-align: center; max-width: 90%; max-height: 90%;
      `;
      
      const title = document.createElement('h3');
      title.textContent = 'Position your face in the center';
      title.style.marginBottom = '10px';
      
      video.style.cssText = `
        width: 320px; height: 240px; border-radius: 10px; 
        border: 2px solid #007bff; margin: 10px 0;
      `;
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.style.cssText = `
        background: #007bff; color: white; border: none; 
        padding: 10px 20px; border-radius: 5px; margin: 5px;
      `;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        background: #6c757d; color: white; border: none; 
        padding: 10px 20px; border-radius: 5px; margin: 5px;
      `;
      
      container.appendChild(title);
      container.appendChild(video);
      container.appendChild(captureBtn);
      container.appendChild(cancelBtn);
      modal.appendChild(container);
      document.body.appendChild(modal);
      
      await video.play();
      
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
        setIsCapturing(false);
      };
      
      captureBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieImage(imageData);
        setFormData(prev => ({ ...prev, selfie: imageData }));
        
        cleanup();
        toast({ title: 'Selfie Captured', description: 'Your live photo has been captured successfully.' });
      };
      
      cancelBtn.onclick = cleanup;
      
    } catch (error) {
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please allow camera permissions.', variant: 'destructive' });
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/kyc/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          tier: tier,
          bvn: formData.bvn,
          dateOfBirth: formData.dateOfBirth,
          nin: formData.nin,
          documentType: formData.cacNumber ? 'CAC' : undefined,
          documentNumber: formData.cacNumber,
          selfie: selfieImage,
          otp: formData.otp,
          imageMatch: tier === 2 ? true : undefined,
          ...formData
        }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.message || 'Upgrade failed');
      
      toast({ title: 'Upgrade Successful', description: result.message });
      onOpenChange(false);
      // Refresh user data to get updated tier
      await fetchUserData();
      // Small delay to ensure state updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to submit upgrade request.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldsForTier = () => {
    switch (tier) {
      case 2:
        return [
          { name: 'bvn', label: 'Bank Verification Number (BVN)', type: 'text', placeholder: '11-digit BVN' },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', placeholder: 'YYYY-MM-DD' },
          { name: 'selfie', label: 'Live Selfie Capture', type: 'custom', component: 'selfie' },
          { name: 'phone', label: 'Phone Number Verification', type: 'custom', component: 'otp' }
        ];
      case 3:
        return [
          { name: 'nin', label: 'National Identity Number (NIN)', type: 'text', placeholder: '11-digit NIN' },
          { name: 'utilityBill', label: 'Utility Bill', type: 'file', accept: 'image/*,application/pdf' }
        ];
      case 4:
        return [
          { name: 'cacNumber', label: 'CAC Registration Number', type: 'text', placeholder: 'RC123456' },
          { name: 'businessDocs', label: 'Business Documents', type: 'file', accept: 'application/pdf' },
          { name: 'businessOwner', label: 'Business Owner Name', type: 'text', placeholder: 'Full name of business owner' },
          { name: 'directorName', label: 'Director Name', type: 'text', placeholder: 'Full name' },
          { name: 'directorId', label: 'Director ID', type: 'file', accept: 'image/*,application/pdf' },
          { name: 'businessAddress', label: 'Proof of Business Address', type: 'file', accept: 'image/*,application/pdf' }
        ];
      default:
        return [];
    }
  };

  const renderTier2Flow = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
              <Input
                id="bvn"
                name="bvn"
                type="text"
                placeholder="Test BVNs: 12345678901 or 11111111111"
                maxLength={11}
                value={formData.bvn || ''}
                onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must match your BVN records exactly
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Use test BVNs: <code>12345678901</code> (DOB: 1990-01-01) or <code>11111111111</code> (DOB: 1985-05-15)
            </p>
            <Button type="button" onClick={verifyBvn} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify BVN & DOB
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              BVN verified for: {bvnData?.firstName} {bvnData?.lastName}
            </div>
            {!selfieImage ? (
              <Button type="button" onClick={captureSelfie} disabled={isCapturing} className="w-full">
                {isCapturing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening Camera...</> : <><Camera className="mr-2 h-4 w-4" /> Capture Live Selfie</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <img src={selfieImage} alt="Selfie" className="w-32 h-32 rounded-lg object-cover mx-auto" />
                <Button type="button" variant="outline" size="sm" onClick={captureSelfie} className="w-full">Retake</Button>
                <Button type="button" onClick={verifyImageMatch} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Image Match
                </Button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={user?.phone || ''} disabled />
                <Button type="button" onClick={sendOtp} disabled={otpSent}>{otpSent ? 'OTP Sent' : 'Send OTP'}</Button>
              </div>
              {otpSent && (
                <Input
                  placeholder="Enter 6-digit OTP (Use: 123456)"
                  maxLength={6}
                  value={formData.otp || ''}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  required
                />
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !otpSent || !formData.otp || formData.otp.length !== 6} 
              className="w-full"
              onClick={handleSubmit}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Upgrade
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const fields = getFieldsForTier();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Tier {tier}</DialogTitle>
          <DialogDescription>
            {tier === 2 ? (
              step === 1 ? 'Enter your BVN to begin verification' :
              step === 2 ? 'Capture a live selfie for identity verification' :
              step === 3 ? 'Verify your phone number with OTP' :
              'Complete the following requirements to upgrade your account'
            ) : (
              'Complete the following requirements to upgrade your account'
            )}
          </DialogDescription>
        </DialogHeader>
        
        {tier === 2 ? (
          renderTier2Flow()
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.name === 'nin' ? (
                  ninData ? (
                    <div className="text-sm text-green-600">✓ NIN verified: {ninData.firstName} {ninData.lastName}</div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        maxLength={11}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required
                      />
                      <Button type="button" onClick={verifyNin} disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify NIN
                      </Button>
                    </div>
                  )
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    accept={field.accept}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required
                  />
                )}
              </div>
            ))}}
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
        )}
        
        {tier === 2 && step < 3 && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}