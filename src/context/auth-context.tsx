
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockGetAccountByNumber } from '@/lib/user-data';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  userId: string;
  fullName: string;
  accountNumber: string;
  isAgent?: boolean;
  kycTier?: number;
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

  const performLogout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    localStorage.removeItem('ovo-user-id');
    localStorage.removeItem('ovo-user-accountNumber');
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
    const token = localStorage.getItem('ovo-auth-token');
    const userId = localStorage.getItem('ovo-user-id');
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
        const tokenTimestamp = parseInt(token.split('-')[3] || '0');
        const lastLogoutAll = userData.lastLogoutAll?.toMillis() || 0;

        if (tokenTimestamp < lastLogoutAll) {
            console.log("Stale token detected. Forcing logout.");
            throw new Error("Session expired due to security update.");
        }

        setUser({
            userId: userId,
            fullName: userData.fullName,
            accountNumber: userData.accountNumber,
            isAgent: userData.isAgent || false,
            kycTier: userData.kycTier || 1,
        });
        setBalance(userData.balance);
        setIsAuthenticated(true);
    } catch (error) {
        console.error("Failed to fetch or validate user data:", error);
        performLogout();
    }
}, [performLogout, isAuthenticated]);


  useEffect(() => {
    fetchUserData();
  }, []);

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
      
      const { token, userId, fullName, accountNumber } = await response.json();
      localStorage.setItem('ovo-auth-token', token);
      localStorage.setItem('ovo-user-id', userId);
      localStorage.setItem('ovo-user-accountNumber', accountNumber);
      setIsAuthenticated(true);
      await fetchUserData();
  }, [fetchUserData]);

  const updateBalance = (newBalanceInKobo: number) => {
    setBalance(newBalanceInKobo);
  };

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
