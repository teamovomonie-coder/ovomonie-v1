"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";

export default function NotificationSettingsPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Notification Settings</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Security Alerts</CardTitle>
              <CardDescription className="text-sm">Get notified about important security events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="login-alert-switch" className="flex items-center gap-3">
                  <Icons.LogIn className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify me of new device logins</p>
                  </div>
                </Label>
                <Switch id="login-alert-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="geo-fence-switch" className="flex items-center gap-3">
                  <Icons.MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Geo-Fencing</p>
                    <p className="text-sm text-muted-foreground">Alert for unusual locations</p>
                  </div>
                </Label>
                <Switch id="geo-fence-switch" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="password-change-switch" className="flex items-center gap-3">
                  <Icons.KeyRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Password Changes</p>
                    <p className="text-sm text-muted-foreground">Alert on PIN/password updates</p>
                  </div>
                </Label>
                <Switch id="password-change-switch" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Transaction Notifications</CardTitle>
              <CardDescription className="text-sm">Stay informed about your financial activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="debit-alert-switch" className="flex items-center gap-3">
                  <Icons.ArrowDownLeft className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Debit Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify on money sent</p>
                  </div>
                </Label>
                <Switch id="debit-alert-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="credit-alert-switch" className="flex items-center gap-3">
                  <Icons.ArrowUpRight className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Credit Alerts</p>
                    <p className="text-sm text-muted-foreground">Notify on money received</p>
                  </div>
                </Label>
                <Switch id="credit-alert-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="large-txn-switch" className="flex items-center gap-3">
                  <Icons.TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Large Transactions</p>
                    <p className="text-sm text-muted-foreground">Alert for transactions over ₦50,000</p>
                  </div>
                </Label>
                <Switch id="large-txn-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="failed-txn-switch" className="flex items-center gap-3">
                  <Icons.AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Failed Transactions</p>
                    <p className="text-sm text-muted-foreground">Notify on declined payments</p>
                  </div>
                </Label>
                <Switch id="failed-txn-switch" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account Updates</CardTitle>
              <CardDescription className="text-sm">Receive updates about your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="balance-switch" className="flex items-center gap-3">
                  <Icons.Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Low Balance Alert</p>
                    <p className="text-sm text-muted-foreground">Notify when balance is low</p>
                  </div>
                </Label>
                <Switch id="balance-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="promo-switch" className="flex items-center gap-3">
                  <Icons.Gift className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Promotions & Offers</p>
                    <p className="text-sm text-muted-foreground">Receive special deals</p>
                  </div>
                </Label>
                <Switch id="promo-switch" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="statement-switch" className="flex items-center gap-3">
                  <Icons.FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Monthly Statements</p>
                    <p className="text-sm text-muted-foreground">Email monthly summaries</p>
                  </div>
                </Label>
                <Switch id="statement-switch" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notification Channels</CardTitle>
              <CardDescription className="text-sm">Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="push-switch" className="flex items-center gap-3">
                  <Icons.Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">In-app alerts</p>
                  </div>
                </Label>
                <Switch id="push-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="email-switch" className="flex items-center gap-3">
                  <Icons.Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive via email</p>
                  </div>
                </Label>
                <Switch id="email-switch" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="sms-switch" className="flex items-center gap-3">
                  <Icons.MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Text message alerts</p>
                  </div>
                </Label>
                <Switch id="sms-switch" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
