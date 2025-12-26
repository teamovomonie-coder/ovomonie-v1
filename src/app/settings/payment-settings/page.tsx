"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

const tierLimits = {
  1: { daily: 50000, single: 15000, name: "Tier 1 - BASIC" },
  2: { daily: 500000, single: 200000, name: "Tier 2 - STANDARD" },
  3: { daily: 5000000, single: 15000000, name: "Tier 3 - PREMIUM" },
  4: { daily: Infinity, single: Infinity, name: "Tier 4 - BUSINESS" },
};

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const currentTier = user?.kycTier || 1;
  const tierLimit = tierLimits[currentTier as keyof typeof tierLimits];
  
  const [dailyLimit, setDailyLimit] = useState(tierLimit.daily.toString());
  const [singleTransactionLimit, setSingleTransactionLimit] = useState(tierLimit.single.toString());

  const handleSaveLimits = () => {
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

    toast({ title: "Limits Updated", description: "Your transaction limits have been saved successfully." });
  };

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
              <Button onClick={handleSaveLimits} className="w-full">
                <Icons.Save className="mr-2 h-4 w-4" />
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
                <Switch id="international-switch" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="gambling-switch" className="flex items-center gap-3">
                  <Icons.Ban className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Restrict Betting Payments</p>
                    <p className="text-sm text-muted-foreground">Block gambling and betting sites</p>
                  </div>
                </Label>
                <Switch id="gambling-switch" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="online-switch" className="flex items-center gap-3">
                  <Icons.ShoppingCart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Enable Online Payments</p>
                    <p className="text-sm text-muted-foreground">Allow e-commerce transactions</p>
                  </div>
                </Label>
                <Switch id="online-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="contactless-switch" className="flex items-center gap-3">
                  <Icons.Nfc className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Contactless Payments</p>
                    <p className="text-sm text-muted-foreground">Enable NFC and tap-to-pay</p>
                  </div>
                </Label>
                <Switch id="contactless-switch" defaultChecked />
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
                <Switch id="autopay-switch" defaultChecked />
              </div>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Icons.List className="h-5 w-5" />
                Manage Active Subscriptions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
