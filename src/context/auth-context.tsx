
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  userId: string;
  fullName: string;
  accountNumber: string;
  isAgent?: boolean;
  kycTier?: number;
  photoUrl?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  balance: number | null;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalanceInKobo: number) => void;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const parseTokenTimestamps = useCallback((token: string | null): { issuedAtMs: number; expiresAtMs: number } => {
    if (!token) return { issuedAtMs: 0, expiresAtMs: 0 };
    if (token.startsWith('ovotoken.')) {
        const parts = token.split('.');
        if (parts.length >= 2) {
            try {
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
                const payload = JSON.parse(atob(padded));
                const issuedAtMs = payload?.iat ? Number(payload.iat) * 1000 : 0;
                const expiresAtMs = payload?.exp ? Number(payload.exp) * 1000 : 0;
                return { issuedAtMs, expiresAtMs };
            } catch (error) {
                console.error('Failed to parse auth token payload', error);
            }
        }
    }
    if (token.startsWith('fake-token-')) {
        const tokenTimestamp = parseInt(token.split('-')[3] || '0');
        return { issuedAtMs: isNaN(tokenTimestamp) ? 0 : tokenTimestamp, expiresAtMs: 0 };
    }
    return { issuedAtMs: 0, expiresAtMs: 0 };
  }, []);

  const performLogout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    localStorage.removeItem('ovo-user-id');
    localStorage.removeItem('ovo-user-accountNumber');
    localStorage.removeItem('ovo-user-fullName');
    localStorage.removeItem('ovo-user-balance');
    setIsAuthenticated(false);
    setUser(null);
    setBalance(null);
  }, []);
  
  const logout = useCallback(async () => {
    const token = localStorage.getItem('ovo-auth-token');
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Logout API call failed, proceeding with client-side logout:", error);
        }
    }
    performLogout();
  }, [performLogout]);

  const fetchUserData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ovo-auth-token') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('ovo-user-id') : null;
    const cachedFullName = typeof window !== 'undefined' ? localStorage.getItem('ovo-user-fullName') : null;
    const cachedAccountNumber = typeof window !== 'undefined' ? localStorage.getItem('ovo-user-accountNumber') : null;
    const cachedBalance = typeof window !== 'undefined' ? localStorage.getItem('ovo-user-balance') : null;

    if (!token || !userId) {
        if (isAuthenticated !== false) performLogout();
        return;
    }
    
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("User not found in database.");
        }

        const userData = userDoc.data();
        const { issuedAtMs, expiresAtMs } = parseTokenTimestamps(token);
        if (expiresAtMs && expiresAtMs < Date.now()) {
            throw new Error('Session expired.');
        }
        const lastLogoutAll = userData.lastLogoutAll?.toMillis() || 0;

        if (issuedAtMs < lastLogoutAll) {
            console.log("Stale token detected. Forcing logout.");
            throw new Error("Session expired due to security update.");
        }

        // If user has no photoUrl, set a generated placeholder and persist it
        let finalPhotoUrl = userData.photoUrl ?? null;
        if (!finalPhotoUrl) {
          try {
            const nameForAvatar = encodeURIComponent(userData.fullName || 'User');
            finalPhotoUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=0b1b3a&color=ffffff&rounded=true&size=128`;
            // Persist placeholder into Firestore so header/avatar can rely on it
            try {
              const userRef = doc(db, 'users', userId);
              await updateDoc(userRef, { photoUrl: finalPhotoUrl });
            } catch (e) {
              // Non-fatal: if we can't update, continue with the placeholder locally
              console.warn('Could not persist placeholder photoUrl', e);
            }
          } catch (e) {
            finalPhotoUrl = null;
          }
        }

        setUser({
          userId: userId,
          fullName: userData.fullName,
          accountNumber: userData.accountNumber,
          isAgent: userData.isAgent || false,
          kycTier: userData.kycTier || 1,
          photoUrl: finalPhotoUrl,
        });
        setBalance(userData.balance ?? null);
        localStorage.setItem('ovo-user-fullName', userData.fullName || '');
        localStorage.setItem('ovo-user-accountNumber', userData.accountNumber || '');
        if (typeof userData.balance !== 'undefined') {
          localStorage.setItem('ovo-user-balance', String(userData.balance));
        }
        if (userData.photoUrl) {
          localStorage.setItem('ovo-user-photoUrl', userData.photoUrl);
        }
        setIsAuthenticated(true);
    } catch (error) {
        console.error("Failed to fetch or validate user data, falling back to cached session:", error);
        setUser({
          userId,
          fullName: cachedFullName || '',
          accountNumber: cachedAccountNumber || '',
          isAgent: false,
          kycTier: 1,
          photoUrl: typeof window !== 'undefined' ? localStorage.getItem('ovo-user-photoUrl') : null,
        });
        setBalance(cachedBalance ? Number(cachedBalance) : null);
        setIsAuthenticated(true);
    }
}, [performLogout, isAuthenticated, parseTokenTimestamps]);


  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = useCallback(async (phone: string, pin: string): Promise<void> => {
      const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed.');
      }
      
      const { token, userId, fullName, accountNumber, balance: serverBalance } = await response.json();
      localStorage.setItem('ovo-auth-token', token);
      localStorage.setItem('ovo-user-id', userId);
      localStorage.setItem('ovo-user-accountNumber', accountNumber);
      localStorage.setItem('ovo-user-fullName', fullName || '');
      if (typeof serverBalance !== 'undefined') {
        localStorage.setItem('ovo-user-balance', String(serverBalance));
      }
      setUser({
        userId,
        fullName,
        accountNumber,
        isAgent: false,
        kycTier: 1,
      });
      setBalance(typeof serverBalance !== 'undefined' ? serverBalance : null);
      setIsAuthenticated(true);
      await fetchUserData();
  }, [fetchUserData]);

  const updateBalance = useCallback(async (newBalanceInKobo: number) => {
    setBalance(newBalanceInKobo);
    localStorage.setItem('ovo-user-balance', String(newBalanceInKobo));
    
    // Persist to Firebase
    const userId = localStorage.getItem('ovo-user-id');
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { balance: newBalanceInKobo });
      } catch (error) {
        console.error('Failed to update balance in Firebase:', error);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, balance, login, logout, updateBalance, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
