"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as FirestoreUser } from "@/types/user";

type ClientUser = Pick<
  FirestoreUser,
  "phone" | "fullName" | "accountNumber" | "balance" | "kycTier" | "isAgent" | "email" | "status" | "avatarUrl"
> & { userId: string; photoUrl?: string | null };

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: ClientUser | null;
  balance: number | null;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  updateBalance: (newBalanceInKobo: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

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
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error("User not found.");
      }
      const data = snap.data() as Partial<FirestoreUser> & { photoUrl?: string | null };
      setUser({
        userId,
        phone: data.phone || "",
        fullName: data.fullName || "",
        accountNumber: data.accountNumber || "",
        isAgent: data.isAgent || false,
        kycTier: data.kycTier || 1,
        balance: data.balance ?? null,
        email: data.email,
        status: data.status,
        avatarUrl: data.avatarUrl,
        photoUrl: data.photoUrl,
      });
      setBalance(data.balance ?? null);
      setIsAuthenticated(true);
    } catch (err) {
      // If we're offline, don't clear the token—just mark unauthenticated and let a later retry succeed.
      if (err instanceof FirebaseError && (err.code === "unavailable" || err.message?.toLowerCase().includes("offline"))) {
        console.warn("Auth fetch offline, will retry when back online.");
        setIsAuthenticated(false);
        setUser(null);
        setBalance(null);
        return;
      }
      console.error("Auth fetch failed:", err);
      performLogout();
    }
  }, [performLogout]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = useCallback(async (phone: string, pin: string) => {
    // Use existing API route for login; relies on Firestore user store.
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

  const updateBalance = useCallback((newBalanceInKobo: number) => {
    setBalance(newBalanceInKobo);
    setUser((prev) => (prev ? { ...prev, balance: newBalanceInKobo } : prev));
  }, []);

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
