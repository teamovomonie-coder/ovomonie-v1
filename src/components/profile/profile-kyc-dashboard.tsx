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
  CardFooter,
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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import CustomLink from "../layout/custom-link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const kycTiers = [
  {
    level: 1,
    name: "Tier 1",
    description: "Basic account features",
    dailyLimit: "₦50,000",
    requirements: ["Phone Number", "Email Address", "Basic Bio-Data"],
  },
  {
    level: 2,
    name: "Tier 2",
    description: "Higher limits & more features",
    dailyLimit: "₦1,000,000",
    requirements: ["BVN or NIN Verification", "Live Selfie Capture", "Proof of Address"],
  },
  {
    level: 3,
    name: "Tier 3",
    description: "Full business & unlimited features",
    dailyLimit: "Unlimited",
    requirements: ["CAC Documents", "Proof of Income/Company Statement"],
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
  const { user, fetchUserData } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const currentTier = user?.kycTier || 1;

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
      <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-[#0b1b3a] via-[#0e2a5f] to-primary shadow-xl text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-6 bottom-6 h-28 w-28 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <CardContent className="relative flex flex-col gap-5 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-white/40 shadow-sm">
                <AvatarImage src={localPreview || user?.photoUrl || "https://placehold.co/64x64.png"} alt="Profile" />
                <AvatarFallback>{user?.fullName?.[0] ?? "U"}</AvatarFallback>
              </Avatar>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user?.userId) return;
                  if (file.size > 5 * 1024 * 1024) {
                    // 5MB limit
                    alert('Please choose an image smaller than 5MB.');
                    return;
                  }
                  setUploading(true);
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const dataUrl = reader.result as string;
                      setLocalPreview(dataUrl);
                      try {
                        const token = localStorage.getItem('ovo-auth-token');
                        if (!token) throw new Error('Not authenticated');
                        // update user document with photoUrl (data URL)
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase');
                        const userRef = doc(db, 'users', user.userId);
                        await updateDoc(userRef, { photoUrl: dataUrl });
                        await fetchUserData();
                      } catch (err) {
                        console.error('Failed to upload profile image', err);
                        alert('Failed to upload image.');
                        setLocalPreview(null);
                      }
                    };
                    reader.readAsDataURL(file);
                  } finally {
                    setUploading(false);
                  }
                }}
                className="absolute bottom-0 right-0 w-9 h-9 opacity-0 cursor-pointer"
                title="Upload profile image"
              />
              <label htmlFor="profile-image-upload" className="absolute -bottom-1 -right-1 bg-white/90 rounded-full p-1 shadow-sm cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-primary" />}
              </label>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Profile</p>
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">Profile & KYC</p>
              <h2 className="text-2xl font-semibold leading-tight">{user?.fullName || "User"}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white">
                <span className="font-semibold">Tier {currentTier}</span>
                <span>•</span>
                <span>{Math.round(profileCompleteness)}% complete</span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto space-y-2">
            <div className="h-2 w-full rounded-full bg-white/20">
              <div
                className="h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/15 text-white border border-white/20">Secure • NDIC</Badge>
              <Button asChild size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                <CustomLink href="/security">Security</CustomLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 order-1">
          <Card className="border border-slate-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User />
                  <span>Full Name</span>
                </div>
                <span className="font-semibold">{user?.fullName}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail />
                  <span>Email Address</span>
                </div>
                <span className="font-semibold">paago@example.com</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone />
                  <span>Phone Number</span>
                </div>
                <span className="font-semibold">08012345678</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto" disabled>
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="border border-slate-200 shadow-md rounded-2xl order-2 lg:order-1">
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
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {tier.level <= currentTier && <CheckCircle className="text-emerald-600 h-5 w-5" />}
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                    </div>
                    <CardDescription>Daily Limit: {tier.dailyLimit}</CardDescription>
                  </div>
                  {tier.level === currentTier + 1 && (
                    <Button size="sm" onClick={() => (tier.level === 2 ? setIsTier2DialogOpen(true) : setIsTier3DialogOpen(true))}>
                      Upgrade
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {tier.requirements.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4 order-3 lg:col-span-2">
          <Card className="border border-slate-200 shadow-md rounded-2xl">
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
