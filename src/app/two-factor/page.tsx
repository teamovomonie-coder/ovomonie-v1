"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function TwoFactorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/2fa/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIs2FAEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Failed to check 2FA status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to setup 2FA");
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetupDialog(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to setup 2FA"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Invalid verification code");
      
      setIs2FAEnabled(true);
      setShowSetupDialog(false);
      setVerificationCode("");
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid code"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to disable 2FA");
      
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setVerificationCode("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disable 2FA"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">2FA Status</CardTitle>
                  <CardDescription className="text-sm">
                    {is2FAEnabled ? "Two-factor authentication is enabled" : "Add an extra layer of security to your account"}
                  </CardDescription>
                </div>
                {isLoading ? (
                  <Icons.Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${is2FAEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {is2FAEnabled ? "Enabled" : "Disabled"}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Icons.ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Authenticator App</p>
                    <p className="text-xs text-muted-foreground">Use Google Authenticator or similar apps</p>
                  </div>
                </div>
                <Switch
                  checked={is2FAEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnable2FA();
                    } else {
                      setShowDisableDialog(true);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>

              {is2FAEnabled && (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start gap-3">
                    <Icons.CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Your account is protected</p>
                      <p className="text-xs text-green-700 mt-1">
                        You'll need to enter a code from your authenticator app when signing in
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icons.Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">1. Install an authenticator app</p>
                  <p className="text-xs text-muted-foreground">Download Google Authenticator, Authy, or Microsoft Authenticator</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icons.QrCode className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">2. Scan the QR code</p>
                  <p className="text-xs text-muted-foreground">Use your app to scan the code we provide</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icons.Key className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">3. Enter the verification code</p>
                  <p className="text-xs text-muted-foreground">Confirm setup by entering the 6-digit code</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {qrCode && (
                <div className="flex justify-center p-4 bg-white border rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Or enter this code manually:</Label>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <code className="text-sm font-mono">{secret}</code>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter 6-digit code from your app</Label>
                <Input
                  id="verify-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSetupDialog(false);
                setVerificationCode("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleVerifyAndEnable} disabled={isVerifying || verificationCode.length !== 6}>
                {isVerifying ? <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify & Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable Dialog */}
        <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Enter your current 6-digit code to disable 2FA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disable-code">Verification Code</Label>
                <Input
                  id="disable-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDisableDialog(false);
                setVerificationCode("");
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisable2FA} disabled={isVerifying || verificationCode.length !== 6}>
                {isVerifying ? <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
