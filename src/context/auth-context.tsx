"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types/user";
import { accountNumberToDisplay } from "@/lib/account-utils";

type ClientUser = Pick<
  User,
  "phone" | "fullName" | "accountNumber" | "balance" | "kycTier" | "isAgent" | "email" | "status" | "avatarUrl"
> & { userId: string; photoUrl?: string | null; displayAccountNumber?: string };

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: ClientUser | null;
  balance: number | null;
  login: (phone: string, pin: string, method?: 'pin' | 'biometric') => Promise<void>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  updateBalance: (newBalanceInKobo: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const updateBalance = useCallback((newBalanceInKobo: number) => {
    if (typeof newBalanceInKobo === 'number' && !isNaN(newBalanceInKobo)) {
      setBalance(newBalanceInKobo);
      setUser((prev) => (prev ? { ...prev, balance: newBalanceInKobo } : prev));
    }
  }, []);

  const performLogout = useCallback(() => {
    localStorage.removeItem("ovo-auth-token");
    localStorage.removeItem("ovo-user-id");
    setIsAuthenticated(false);
    setUser(null);
    setBalance(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("ovo-auth-token");
    const userId = localStorage.getItem("ovo-user-id");
    if (!token || !userId) {
      performLogout();
      return;
    }

    try {
      // Fetch user from Supabase via API
      const res = await fetch(`/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await res.json();

      const accountNumber = (userData?.account_number || userData?.accountNumber || "").toString();

      setUser({
        userId: userData?.id || userData?.userId || userId,
        phone: userData?.phone || "",
        fullName: userData?.full_name || userData?.fullName || "",
        accountNumber,
        displayAccountNumber: accountNumber ? accountNumberToDisplay(accountNumber) : undefined,
        isAgent: userData?.is_agent || userData?.isAgent || false,
        kycTier: userData?.kyc_tier || userData?.kycTier || 1,
        balance: typeof userData?.balance === "number" ? userData.balance : Number(userData?.balance) || 0,
        email: userData?.email,
        status: userData?.status || "active",
        avatarUrl: userData?.avatar_url || userData?.avatarUrl,
        photoUrl: userData?.photoUrl || userData?.avatar_url || userData?.avatarUrl,
      });
      setBalance(typeof userData.balance === "number" ? userData.balance : 0);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Auth fetch failed:", err);
      performLogout();
    }
  }, [performLogout]);

  useEffect(() => {
    fetchUserData();
    
    const handleBalanceUpdate = (event: any) => {
      console.log('[AuthContext] Balance update event:', event.detail);
      if (event.detail?.balance !== undefined) {
        const newBal = Number(event.detail.balance);
        console.log('[AuthContext] Setting balance to:', newBal);
        setBalance(newBal);
        setUser((prev) => (prev ? { ...prev, balance: newBal } : prev));
      }
    };
    
    window.addEventListener('balance-updated', handleBalanceUpdate);
    
    const intervalId = setInterval(async () => {
      const token = localStorage.getItem('ovo-auth-token');
      if (token) {
        try {
          const res = await fetch('/api/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          const data = await res.json();
          const newBal = data.balanceInKobo || data.data?.balance || 0;
          if (newBal !== balance) {
            console.log('[AuthContext] Balance changed:', balance, '->', newBal);
            setBalance(newBal);
            setUser((prev) => (prev ? { ...prev, balance: newBal } : prev));
          }
        } catch (err) {
          console.error('[AuthContext] Balance refresh failed:', err);
        }
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      clearInterval(intervalId);
    };
  }, [fetchUserData, balance]);

  const login = useCallback(async (phone: string, pin: string, method: 'pin' | 'biometric' = 'pin') => {
    if (method === 'biometric') {
      // For biometric login, we assume the biometric verification was already done
      // We just need to get the user data
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, method: 'biometric' }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Biometric login failed.");
      }
      
      const { token, userId } = await res.json();
      localStorage.setItem("ovo-auth-token", token);
      localStorage.setItem("ovo-user-id", userId);
      await fetchUserData();
    } else {
      // Use existing API route for PIN login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Login failed.");
      }
      const { token, userId } = await res.json();
      localStorage.setItem("ovo-auth-token", token);
      localStorage.setItem("ovo-user-id", userId);
      await fetchUserData();
    }
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem("ovo-auth-token");
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Logout API failed; clearing local session anyway.", err);
      }
    }
    performLogout();
  }, [performLogout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, balance, login, logout, fetchUserData, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
