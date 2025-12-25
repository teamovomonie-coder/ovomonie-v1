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
                  <AvatarFallback className="bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a] text-white text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{user?.fullName.toUpperCase()}</h1>
                <p className="text-sm text-slate-500">@{user?.fullName.toLowerCase().replace(/\s+/g, '_')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Icons.Award className="h-4 w-4 text-[#0b1b3a]" />
                  <span className="text-xs font-semibold text-[#0b1b3a]">TIER 1</span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Icons.Settings className="h-6 w-6 text-slate-700" />
            </button>
          </div>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Icons.ShieldCheck className="h-32 w-32 text-primary" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-500">Total Balance</span>
                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Icons.Eye className="h-4 w-4 text-slate-400" /> : <Icons.EyeOff className="h-4 w-4 text-slate-400" />}
                </button>
              </div>
              <div className="text-4xl font-bold text-slate-900">
                {showBalance ? `₦ ${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₦ ••••••"}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/transactions")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                    <Icons.FileText className="h-5 w-5 text-[#0b1b3a]" />
                  </div>
                  <span className="text-slate-900 font-medium">Transaction History</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/account-limits")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                    <Icons.TrendingUp className="h-5 w-5 text-[#0b1b3a]" />
                  </div>
                  <div className="text-left">
                    <div className="text-slate-900 font-medium">Account Limits</div>
                    <div className="text-xs text-slate-500">View your transaction limits</div>
                  </div>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/bank-accounts")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                    <Icons.CreditCard className="h-5 w-5 text-[#0b1b3a]" />
                  </div>
                  <div className="text-left">
                    <div className="text-slate-900 font-medium">Bank Card/Account</div>
                    <div className="text-xs text-slate-500">{linkedCount} linked cards/accounts</div>
                  </div>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
              <button onClick={() => router.push("/invoice")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                    <Icons.Receipt className="h-5 w-5 text-[#0b1b3a]" />
                  </div>
                  <div className="text-left">
                    <div className="text-slate-900 font-medium">Invoice</div>
                    <div className="text-xs text-slate-500">Generate invoice to receive payments</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">New</span>
                  <Icons.ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </button>
            </CardContent>
          </Card>

          <div className="px-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Security</h3>
          </div>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button onClick={() => router.push("/two-factor")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                    <Icons.ShieldCheck className="h-5 w-5 text-[#0b1b3a]" />
                  </div>
                  <span className="text-slate-900 font-medium">Two-Factor Authentication</span>
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
