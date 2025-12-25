"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import BiometricSettings from "@/components/security/biometric-settings";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters.").regex(/^\d{6}$/, "Login PIN must be 6 digits."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const pinSchema = z.object({
  currentPin: z.string().length(4, "PIN must be 4 digits."),
  newPin: z.string().length(4, "PIN must be 4 digits."),
  confirmPin: z.string().length(4, "PIN must be 4 digits."),
}).refine(data => data.newPin === data.confirmPin, {
  message: "PINs do not match.",
  path: ["confirmPin"],
});

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to change password.");

      toast({ title: "Success! Please Log In Again.", description: "Your login PIN has been changed successfully." });
      setOpen(false);
      form.reset();
      logout();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <Icons.Lock className="h-5 w-5" />
          Change Login PIN
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Login PIN</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Current 6-Digit PIN</FormLabel>
                <FormControl><Input type="password" maxLength={6} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>New 6-Digit PIN</FormLabel>
                <FormControl><Input type="password" maxLength={6} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New PIN</FormLabel>
                <FormControl><Input type="password" maxLength={6} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.Loader2 className="animate-spin mr-2" />}
                Confirm Change
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePinDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { currentPin: "", newPin: "", confirmPin: "" }
  });

  const onSubmit = async (data: z.infer<typeof pinSchema>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to change PIN.");

      toast({ title: "Success", description: result.message });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <Icons.KeyRound className="h-5 w-5" />
          Change Transaction PIN
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Transaction PIN</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="currentPin" render={({ field }) => (
              <FormItem>
                <FormLabel>Current 4-Digit PIN</FormLabel>
                <FormControl><Input type="password" maxLength={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newPin" render={({ field }) => (
              <FormItem>
                <FormLabel>New 4-Digit PIN</FormLabel>
                <FormControl><Input type="password" maxLength={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPin" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New PIN</FormLabel>
                <FormControl><Input type="password" maxLength={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.Loader2 className="animate-spin mr-2" />}
                Confirm Change
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function LoginSettingsPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Login Settings</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChangePasswordDialog />
              <ChangePinDialog />
            </CardContent>
          </Card>

          <BiometricSettings />
        </div>
      </div>
    </AppShell>
  );
}
