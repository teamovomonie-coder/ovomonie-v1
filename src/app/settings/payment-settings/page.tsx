"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

const tierLimits = {
  1: { daily: 50000, single: 15000, name: "Tier 1 - BASIC" },
  2: { daily: 500000, single: 200000, name: "Tier 2 - STANDARD" },
  3: { daily: 5000000, single: 1500000, name: "Tier 3 - PREMIUM" },
  4: { daily: Infinity, single: Infinity, name: "Tier 4 - BUSINESS" },
};

interface Subscription {
  id: string;
  merchantName: string;
  amount: number;
  frequency: string;
  nextBillingDate: string;
  status: string;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const currentTier = user?.kycTier || 1;
  const tierLimit = tierLimits[currentTier as keyof typeof tierLimits];
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [singleTransactionLimit, setSingleTransactionLimit] = useState('');
  const [blockInternational, setBlockInternational] = useState(false);
  const [blockGambling, setBlockGambling] = useState(false);
  const [enableOnlinePayments, setEnableOnlinePayments] = useState(true);
  const [enableContactless, setEnableContactless] = useState(true);
  const [enableAutopay, setEnableAutopay] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSubscriptions();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/settings/payment', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDailyLimit(data.dailyLimit.toString());
        setSingleTransactionLimit(data.singleTransactionLimit.toString());
        setBlockInternational(data.blockInternational);
        setBlockGambling(data.blockGambling);
        setEnableOnlinePayments(data.enableOnlinePayments);
        setEnableContactless(data.enableContactless);
        setEnableAutopay(data.enableAutopay);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleSaveLimits = async () => {
    const daily = Number(dailyLimit);
    const single = Number(singleTransactionLimit);

    if (daily > tierLimit.daily) {
      toast({ 
        variant: "destructive", 
        title: "Limit Exceeded", 
        description: `Daily limit cannot exceed ₦${tierLimit.daily.toLocaleString()} for ${tierLimit.name}` 
      });
      return;
    }

    if (single > tierLimit.single) {
      toast({ 
        variant: "destructive", 
        title: "Limit Exceeded", 
        description: `Single transaction limit cannot exceed ₦${tierLimit.single.toLocaleString()} for ${tierLimit.name}` 
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/settings/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dailyLimit: daily,
          singleTransactionLimit: single
        })
      });

      if (response.ok) {
        toast({ title: "Limits Updated", description: "Your transaction limits have been saved successfully." });
      } else {
        throw new Error('Failed to update limits');
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update limits" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSetting = async (setting: string, value: boolean) => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/settings/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [setting]: value })
      });

      if (response.ok) {
        toast({ title: "Setting Updated", description: "Your preference has been saved." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update setting" });
    }
  };

  const handleSubscriptionAction = async (id: string, action: string) => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast({ title: "Success", description: `Subscription ${action}d successfully` });
        fetchSubscriptions();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${action} subscription` });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Icons.Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Payment Settings</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Alert>
            <Icons.Info className="h-4 w-4" />
            <AlertDescription>
              You are currently on <strong>{tierLimit.name}</strong>. 
              {currentTier === 4 ? (
                <span> You have unlimited daily and per-transaction limits.</span>
              ) : (
                <span> Your maximum daily limit is ₦{tierLimit.daily.toLocaleString()} and ₦{tierLimit.single.toLocaleString()} per transaction.</span>
              )}
              {currentTier < 3 && (
                <button onClick={() => router.push("/profile")} className="ml-1 text-primary underline">
                  Upgrade your tier
                </button>
              )}
            </AlertDescription>
          </Alert>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Transaction Limits</CardTitle>
                  <CardDescription className="text-sm">Set your daily and per-transaction spending limits</CardDescription>
                </div>
                <Badge variant="secondary">{tierLimit.name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Transaction Limit (₦)</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  max={tierLimit.daily}
                  placeholder={tierLimit.daily.toString()}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: ₦{tierLimit.daily === Infinity ? "Unlimited" : tierLimit.daily.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="single-limit">Single Transaction Limit (₦)</Label>
                <Input
                  id="single-limit"
                  type="number"
                  value={singleTransactionLimit}
                  onChange={(e) => setSingleTransactionLimit(e.target.value)}
                  max={tierLimit.single}
                  placeholder={tierLimit.single.toString()}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: ₦{tierLimit.single === Infinity ? "Unlimited" : tierLimit.single.toLocaleString()}
                </p>
              </div>
              <Button onClick={handleSaveLimits} className="w-full" disabled={isSaving}>
                {isSaving ? <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icons.Save className="mr-2 h-4 w-4" />}
                Save Limits
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Restrictions</CardTitle>
              <CardDescription className="text-sm">Control where and how your money can be spent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="international-switch" className="flex items-center gap-3">
                  <Icons.Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Block International Transactions</p>
                    <p className="text-sm text-muted-foreground">Prevent payments outside Nigeria</p>
                  </div>
                </Label>
                <Switch 
                  id="international-switch" 
                  checked={blockInternational}
                  onCheckedChange={(checked) => {
                    setBlockInternational(checked);
                    handleToggleSetting('blockInternational', checked);
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="gambling-switch" className="flex items-center gap-3">
                  <Icons.Ban className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Restrict Betting Payments</p>
                    <p className="text-sm text-muted-foreground">Block gambling and betting sites</p>
                  </div>
                </Label>
                <Switch 
                  id="gambling-switch"
                  checked={blockGambling}
                  onCheckedChange={(checked) => {
                    setBlockGambling(checked);
                    handleToggleSetting('blockGambling', checked);
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="online-switch" className="flex items-center gap-3">
                  <Icons.ShoppingCart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Enable Online Payments</p>
                    <p className="text-sm text-muted-foreground">Allow e-commerce transactions</p>
                  </div>
                </Label>
                <Switch 
                  id="online-switch" 
                  checked={enableOnlinePayments}
                  onCheckedChange={(checked) => {
                    setEnableOnlinePayments(checked);
                    handleToggleSetting('enableOnlinePayments', checked);
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="contactless-switch" className="flex items-center gap-3">
                  <Icons.Nfc className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Contactless Payments</p>
                    <p className="text-sm text-muted-foreground">Enable NFC and tap-to-pay</p>
                  </div>
                </Label>
                <Switch 
                  id="contactless-switch" 
                  checked={enableContactless}
                  onCheckedChange={(checked) => {
                    setEnableContactless(checked);
                    handleToggleSetting('enableContactless', checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Auto-Pay & Subscriptions</CardTitle>
              <CardDescription className="text-sm">Manage recurring payments and subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="autopay-switch" className="flex items-center gap-3">
                  <Icons.RefreshCw className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Enable Auto-Pay</p>
                    <p className="text-sm text-muted-foreground">Allow recurring payments</p>
                  </div>
                </Label>
                <Switch 
                  id="autopay-switch" 
                  checked={enableAutopay}
                  onCheckedChange={(checked) => {
                    setEnableAutopay(checked);
                    handleToggleSetting('enableAutopay', checked);
                  }}
                />
              </div>
              <Dialog open={showSubscriptions} onOpenChange={setShowSubscriptions}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Icons.List className="h-5 w-5" />
                    Manage Active Subscriptions ({subscriptions.filter(s => s.status === 'active').length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Active Subscriptions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {subscriptions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No active subscriptions</p>
                    ) : (
                      subscriptions.map((sub) => (
                        <Card key={sub.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{sub.merchantName}</p>
                                <p className="text-sm text-muted-foreground">
                                  ₦{sub.amount.toLocaleString()} • {sub.frequency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                  {sub.status}
                                </Badge>
                                {sub.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSubscriptionAction(sub.id, 'pause')}
                                  >
                                    Pause
                                  </Button>
                                )}
                                {sub.status === 'paused' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSubscriptionAction(sub.id, 'resume')}
                                  >
                                    Resume
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSubscriptionAction(sub.id, 'cancel')}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
