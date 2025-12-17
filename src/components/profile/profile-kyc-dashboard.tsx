"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Loader2,
  Upload,
  User,
  Shield,
  Bell,
  Mail,
  Phone,
  MessageCircle,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import CustomLink from "../layout/custom-link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const kycTiers = [
  {
    level: 1,
    name: "Tier 1 – BASIC",
    description: "Basic account features",
    dailyLimit: "₦50,000",
    requirements: ["Phone Number", "Email Address", "Basic Bio-Data"],
  },
  {
    level: 2,
    name: "Tier 2 – STANDARD",
    description: "Higher limits & more features",
    dailyLimit: "₦500,000",
    walletLimit: "₦2,000,000",
    requirements: [
      "BVN Verification",
      "Live selfie Capture",
      "Phone Number verification (OTP Confirmation)"
    ],
  },
  {
    level: 3,
    name: "Tier 3 – PREMIUM",
    description: "Full business & unlimited features",
    dailyLimit: "₦5,000,000",
    walletLimit: "Unlimited",
    requirements: [
      "NIN Verification",
      "proof of Residential Address"
    ],
  },
  {
    level: 4,
    name: "Businesses",
    description: "Enterprise-level banking solutions",
    perTransaction: "₦5,000,000+",
    dailyLimit: "Unlimited",
    walletLimit: "Unlimited",
    requirements: [
      "CAC Registration Documents",
      "Business owner/ Directors ID Details",
      "Business Information (Registered business name, Business category / Industry, Business Address, Phone Number)",
      "Proof of Business Address"
    ],
  },
];

const tier2Schema = z.object({
  bvn: z.string().length(11, "BVN must be 11 digits."),
  addressProof: z.any().optional(),
});

const tier3Schema = z.object({
  cacNumber: z.string().min(5, "A valid CAC number is required."),
  cacDocument: z.any().optional(),
});

export function ProfileKycDashboard() {
    const [showAllCorporateReqs, setShowAllCorporateReqs] = useState(false);
  const { user, fetchUserData, logout } = useAuth();
  const { toast } = useToast();
  const currentTier = user?.kycTier || 1;

  const firstName = user?.fullName.split(' ')[0] || '';
  const lastName = user?.fullName.split(' ').slice(-1)[0] || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const [isTier2DialogOpen, setIsTier2DialogOpen] = useState(false);
  const [isTier3DialogOpen, setIsTier3DialogOpen] = useState(false);

  const profileCompleteness = (currentTier / kycTiers.length) * 100;

  const handleUpgradeSuccess = async () => {
    setIsTier2DialogOpen(false);
    setIsTier3DialogOpen(false);
    await fetchUserData();
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-[#0a1c3f] via-[#0d2e63] to-[#0a56ff] shadow-2xl text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_40%)]" />
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_35%,transparent_35%,transparent_65%)] bg-[length:220px_220px]" />
          <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-6 bottom-6 h-28 w-28 rounded-full bg-[#0a56ff]/40 blur-3xl" />
        </div>
        <CardContent className="relative flex flex-col gap-6 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-gray-400 bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a]">
              <AvatarImage src={user?.photoUrl ?? undefined} alt="Profile" />
              <AvatarFallback className="bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a] text-white font-semibold">{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                Profile & KYC
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">{user?.fullName || "User"}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                <span className="font-semibold">Tier {currentTier}</span>
                <span>•</span>
                <span>{Math.round(profileCompleteness)}% complete</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px]">NDIC Secured</span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto space-y-3">
            <div className="h-2 w-full rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.7)] transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
              <Badge variant="secondary" className="bg-white/15 text-white border border-white/20">Secure • NDIC</Badge>
              <Badge variant="secondary" className="bg-white/15 text-white border border-white/20">KYC {currentTier}/3</Badge>
              <Badge variant="secondary" className="bg-white/15 text-white border border-white/20">Acct/No • {user?.accountNumber || "Account"}</Badge>
              <Button asChild size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                <CustomLink href="/security">Security</CustomLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 order-1">
          <Card className="border border-slate-200 shadow-md rounded-2xl bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0a56ff]/15 to-[#0b1b3a]/12 text-[#0a56ff] flex items-center justify-center shadow-inner">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-600">Full Name</span>
                </div>
                <span className="font-semibold">{user?.fullName}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0a56ff]/15 to-[#0b1b3a]/12 text-[#0a56ff] flex items-center justify-center shadow-inner">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-600">Email Address</span>
                </div>
                <span className="font-semibold">{user?.email || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0a56ff]/15 to-[#0b1b3a]/12 text-[#0a56ff] flex items-center justify-center shadow-inner">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-600">Phone Number</span>
                </div>
                <span className="font-semibold">{user?.phone || "Not provided"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 shadow-md rounded-2xl order-2 lg:order-1 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle>KYC Verification</CardTitle>
            <CardDescription>Complete tiers to increase your transaction limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {kycTiers.map((tier) => (
              <Card
                key={tier.level}
                className={cn(
                  "border shadow-sm backdrop-blur",
                  tier.level <= currentTier ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"
                )}
                style={tier.level === 1 ? { paddingTop: '-2px' } : {}}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {tier.level <= currentTier && <CheckCircle className="text-emerald-600 h-5 w-5" />}
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                    </div>
                    {tier.perTransaction && (
                      <CardDescription>Per Transaction: {tier.perTransaction}</CardDescription>
                    )}
                    <CardDescription>Daily Limit: {tier.dailyLimit}</CardDescription>
                    {tier.walletLimit && (
                      <CardDescription>Wallet Limit: {tier.walletLimit}</CardDescription>
                    )}
                  </div>
                  {tier.level === currentTier + 1 && (
                    <Button size="sm" onClick={() => (tier.level === 2 ? setIsTier2DialogOpen(true) : setIsTier3DialogOpen(true))}>
                      Upgrade
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pb-4">
                  {tier.level === 4 ? (
                    <>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {tier.requirements.slice(0, 2).map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                      {!showAllCorporateReqs && (
                        <button
                          className="text-xs text-blue-600 mt-2 italic underline hover:text-blue-800 pl-1"
                          style={{ display: 'block', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          onClick={() => setShowAllCorporateReqs(true)}
                        >
                          ...and more requirements
                        </button>
                      )}
                      {showAllCorporateReqs && (
                        <ul className="text-sm space-y-1 list-disc pl-5 mt-2">
                          {tier.requirements.slice(2).map((req) => (
                            <li key={req}>{req}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      {tier.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4 order-3 lg:col-span-2">
          <Card className="border border-slate-200 shadow-md rounded-2xl bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage essentials and support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <CustomLink href="/statements">
                  <ArrowLeftRight /> Transaction History
                </CustomLink>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <CustomLink href="/security">
                  <Shield /> Security Settings
                </CustomLink>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <CustomLink href="/notifications">
                  <Bell /> Notifications
                </CustomLink>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <CustomLink href="/support">
                  <MessageCircle /> Support
                </CustomLink>
              </Button>
              <Button variant="destructive" className="w-full justify-start gap-3" onClick={logout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tier2Dialog open={isTier2DialogOpen} onOpenChange={setIsTier2DialogOpen} onUpgrade={handleUpgradeSuccess} />
      <Tier3Dialog open={isTier3DialogOpen} onOpenChange={setIsTier3DialogOpen} onUpgrade={handleUpgradeSuccess} />
    </div>
  );
}

function Tier2Dialog({ open, onOpenChange, onUpgrade }: { open: boolean; onOpenChange: (open: boolean) => void; onUpgrade: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof tier2Schema>>({
    resolver: zodResolver(tier2Schema),
    defaultValues: { bvn: "" },
  });

  const onSubmit = async (data: z.infer<typeof tier2Schema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      if (!token) throw new Error("Authentication failed.");

      const response = await fetch("/api/kyc/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, newTier: 2 }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upgrade failed.");

      toast({ title: "KYC Submitted!", description: "Your details have been submitted for verification." });
      onUpgrade();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Tier 2</DialogTitle>
          <DialogDescription>Provide your BVN to upgrade. This will increase your transaction limits.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bvn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Verification Number (BVN)</FormLabel>
                  <FormControl>
                    <Input placeholder="11-digit BVN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressProof"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Proof of Address (e.g., Utility Bill)</FormLabel>
                  <FormControl>
                    <Input type="file" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Liveness Check Required</AlertTitle>
              <AlertDescription>In a real app, you would be prompted to take a live selfie here to verify your identity against your BVN photo.</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Verification
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Tier3Dialog({ open, onOpenChange, onUpgrade }: { open: boolean; onOpenChange: (open: boolean) => void; onUpgrade: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof tier3Schema>>({
    resolver: zodResolver(tier3Schema),
    defaultValues: { cacNumber: "" },
  });

  const onSubmit = async (data: z.infer<typeof tier3Schema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      if (!token) throw new Error("Authentication failed.");

      const response = await fetch("/api/kyc/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, newTier: 3 }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upgrade failed.");

      toast({ title: "Business KYC Submitted!", description: "Your business documents are under review." });
      onUpgrade();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Tier 3 (Business)</DialogTitle>
          <DialogDescription>Submit your company's CAC documents to unlock unlimited transactions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cacNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAC Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="RC123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cacDocument"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload CAC Certificate</FormLabel>
                  <FormControl>
                    <Input type="file" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
``}
