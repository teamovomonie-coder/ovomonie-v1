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
  syncBalance: () => Promise<void>;
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

  const syncBalance = useCallback(async () => {
    const token = localStorage.getItem('ovo-auth-token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/wallet/sync-balance', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const newBalance = data.balanceInKobo || data.balance || 0;
        updateBalance(newBalance);
      }
    } catch (err) {
      console.debug('[AuthContext] Balance sync failed:', err);
    }
  }, [updateBalance]);

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
      setIsAuthenticated(false);
      return;
    }

    // Set authenticated immediately with cached data
    setIsAuthenticated(true);

    try {
      // Fetch user from Supabase via API
      const res = await fetch(`/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Only logout on 401 (unauthorized), not on network errors
        if (res.status === 401) {
          console.debug('[AuthContext] 401 Unauthorized - keeping user logged in for now');
          // Don't logout immediately - let user continue with cached data
          setIsAuthenticated(true);
        } else {
          // Keep user logged in for other errors (network issues, etc.)
          setIsAuthenticated(true);
        }
        return;
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
      // Don't logout on network errors - keep user authenticated
      setIsAuthenticated(true);
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
    
    // Refresh token every 24 hours
    const tokenRefreshInterval = setInterval(async () => {
      const token = localStorage.getItem('ovo-auth-token');
      if (token) {
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const { token: newToken } = await res.json();
            localStorage.setItem('ovo-auth-token', newToken);
            console.log('[AuthContext] Token refreshed successfully');
          } else if (res.status === 401) {
            // Token is invalid/expired - logout user
            console.log('[AuthContext] Token expired during refresh - logging out');
            performLogout();
          } else {
            console.debug('[AuthContext] Token refresh failed, continuing with existing token');
          }
        } catch (err) {
          console.debug('[AuthContext] Token refresh skipped:', err);
        }
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Poll balance every 2 minutes (reduced frequency)
    const intervalId = setInterval(async () => {
      const token = localStorage.getItem('ovo-auth-token');
      if (token) {
        try {
          const res = await fetch('/api/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          
          if (res.ok) {
            const data = await res.json();
            const newBal = data.balanceInKobo || data.data?.balance || 0;
            if (newBal !== balance) {
              console.log('[AuthContext] Balance changed:', balance, '->', newBal);
              setBalance(newBal);
              setUser((prev) => (prev ? { ...prev, balance: newBal } : prev));
            }
          } else {
            console.debug('[AuthContext] Balance refresh failed, continuing with cached balance');
          }
        } catch (err) {
          console.debug('[AuthContext] Balance refresh skipped:', err);
        }
      }
    }, 120000); // 2 minutes
    
    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      clearInterval(tokenRefreshInterval);
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
    <AuthContext.Provider value={{ isAuthenticated, user, balance, login, logout, fetchUserData, updateBalance, syncBalance }}>
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
