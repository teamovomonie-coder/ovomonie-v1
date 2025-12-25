"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [linkedCount, setLinkedCount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("ovo-auth-token");
        
        // Fetch payment methods
        const pmResponse = await fetch("/api/user/payment-methods", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const pmData = await pmResponse.json();
        if (pmResponse.ok) {
          const total = (pmData.accounts?.length || 0) + (pmData.cards?.length || 0);
          setLinkedCount(total);
        }

        // Fetch balance
        const balanceResponse = await fetch("/api/user/balance", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const balanceData = await balanceResponse.json();
        console.log('Balance API response:', balanceData);
        if (balanceResponse.ok) {
          const balanceInNaira = (balanceData.balance || 0) / 100;
          setBalance(balanceInNaira);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const firstName = user?.fullName.split(' ')[0] || '';
  const lastName = user?.fullName.split(' ').slice(-1)[0] || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-8 pt-6 bg-slate-50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/edit-profile")}>
                <Avatar className="h-16 w-16 border-2 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={user?.photoUrl || user?.avatarUrl} alt={user?.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{user?.fullName.toUpperCase()}</h1>
                <p className="text-sm text-slate-500">@{user?.fullName.toLowerCase().replace(/\s+/g, '_')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Icons.Award className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">TIER 1</span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Icons.Settings className="h-6 w-6 text-slate-700" />
            </button>
          </div>

          <Card className="rounded-3xl border-none bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute right-4 bottom-6 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-white/80">Total Balance</span>
                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Icons.Eye className="h-4 w-4 text-white/80" /> : <Icons.EyeOff className="h-4 w-4 text-white/80" />}
                </button>
              </div>
              <div className="text-3xl font-bold text-white">
                {showBalance ? `₦ ${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₦ ••••••"}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/statements")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Transaction History</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/account-limits")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-900">Account Limits</div>
                    <div className="text-xs text-slate-500">View your transaction limits</div>
                  </div>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/bank-accounts")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-900">Bank Card/Account</div>
                    <div className="text-xs text-slate-500">{linkedCount} linked cards/accounts</div>
                  </div>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          <div className="px-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Security</h3>
          </div>

          <Card className="rounded-3xl border-none bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/two-factor")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Two-Factor Authentication</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
