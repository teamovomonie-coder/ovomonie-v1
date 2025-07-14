
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockGetAccountByNumber } from '@/lib/user-data';

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

  const logout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    localStorage.removeItem('ovo-user-id');
    localStorage.removeItem('ovo-user-accountNumber');
    setIsAuthenticated(false);
    setUser(null);
    setBalance(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const accountNumber = localStorage.getItem('ovo-user-accountNumber');
      const userId = localStorage.getItem('ovo-user-id');
      if (!accountNumber || !userId) {
        if (localStorage.getItem('ovo-auth-token')) {
            logout();
        }
        return;
      }
      const account = await mockGetAccountByNumber(accountNumber);
      if (account) {
        setUser({ 
            userId, 
            fullName: account.fullName, 
            accountNumber: account.accountNumber, 
            isAgent: account.isAgent || false,
            kycTier: account.kycTier || 1,
        });
        setBalance(account.balance);
      } else {
        setUser(null);
        setBalance(0);
        if (localStorage.getItem('ovo-auth-token')) {
            logout();
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
      setUser(null);
      setBalance(0);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('ovo-auth-token');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    if (authenticated) {
      fetchUserData();
    }
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
      
      const { token, userId, fullName, accountNumber } = await response.json();
      localStorage.setItem('ovo-auth-token', token);
      localStorage.setItem('ovo-user-id', userId);
      localStorage.setItem('ovo-user-accountNumber', accountNumber);
      setIsAuthenticated(true);
      setUser({ userId, fullName, accountNumber, kycTier: 1 }); // Set user immediately on login
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
