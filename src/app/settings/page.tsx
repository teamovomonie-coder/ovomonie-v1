"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [isClosingAccount, setIsClosingAccount] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleCloseAccount = async () => {
    setIsClosingAccount(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/close-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to close account");
      
      toast({ 
        title: "Account Closed", 
        description: "Your account has been deactivated. You can reactivate it within 30 days by logging in again." 
      });
      await logout();
      router.push("/login");
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to close account" 
      });
    } finally {
      setIsClosingAccount(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 bg-slate-50">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        </div>

        <div className="space-y-4 max-w-2xl">
          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Icons.Sun className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-slate-900">App Theme</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedTheme("default")}
                  className="relative flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "w-full aspect-[3/2] rounded-lg border-2 bg-slate-50 flex items-center justify-center relative overflow-hidden",
                    selectedTheme === "default" ? "border-primary" : "border-slate-200"
                  )}>
                    <div className="absolute top-2 left-2 w-8 h-1 bg-primary rounded-full"></div>
                    {selectedTheme === "default" && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                        <Icons.Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    selectedTheme === "default" ? "text-primary font-semibold" : "text-slate-600"
                  )}>Default</span>
                </button>
                <button
                  onClick={() => setSelectedTheme("dark")}
                  className="relative flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "w-full aspect-[3/2] rounded-lg border-2 bg-slate-900 flex items-center justify-center relative overflow-hidden",
                    selectedTheme === "dark" ? "border-primary" : "border-slate-200"
                  )}>
                    <div className="absolute top-2 left-2 w-8 h-1 bg-purple-500 rounded-full"></div>
                    {selectedTheme === "dark" && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                        <Icons.Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    selectedTheme === "dark" ? "text-primary font-semibold" : "text-slate-600"
                  )}>Dark Mode</span>
                </button>
               
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/settings/payment-settings")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.Lock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Payment Settings</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/settings/login-settings")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.Key className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Login Settings</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/settings/security-questions")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Security Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-sm font-semibold">Reset New</span>
                  <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </button>
              <button onClick={() => router.push("/settings/notification-settings")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.Bell className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Notification Settings</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/settings/security-center")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Security Center</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/settings/feedback")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Feedback and Suggestions</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.LogOut className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Log out</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl first:rounded-t-3xl last:rounded-b-3xl">
                    <div className="flex items-center gap-3">
                      <Icons.Trash2 className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-500">Close Account</span>
                    </div>
                    <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to close your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deactivate your account and you will be logged out. Your account data will be preserved for 30 days, 
                      during which you can reactivate it by simply logging in again. After 30 days, your account will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCloseAccount} 
                      disabled={isClosingAccount}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isClosingAccount ? (
                        <>
                          <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Closing...
                        </>
                      ) : (
                        "Yes, Close Account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
