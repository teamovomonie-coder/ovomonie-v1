
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

interface AuthContextType {
  isAuthenticated: boolean | null;
  balance: number | null;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalanceInKobo: number) => void;
  fetchBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      // In a real app, you'd get the current user's account number after login.
      // For now, we'll use the hardcoded mock sender account.
      const account = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
      if (account) {
        setBalance(account.balance);
      } else {
        console.warn(`Could not find account ${MOCK_SENDER_ACCOUNT} in Firestore.`);
        setBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch balance from Firestore", error);
      setBalance(0);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ovo-auth-token');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    if (authenticated) {
      fetchBalance();
    }
  }, [fetchBalance]);

  const login = useCallback(async (phone: string, pin: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // This remains a mock login for demonstration purposes.
      // A real implementation would use Firebase Auth.
      setTimeout(() => {
        if (phone === '09033505038' && pin === '123456') {
          const dummyToken = `fake-token-${Date.now()}`;
          localStorage.setItem('ovo-auth-token', dummyToken);
          setIsAuthenticated(true);
          fetchBalance().then(() => resolve());
        } else {
          reject(new Error('Invalid phone number or PIN.'));
        }
      }, 1000);
    });
  }, [fetchBalance]);

  const logout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    setIsAuthenticated(false);
    setBalance(null);
  }, []);

  const updateBalance = (newBalanceInKobo: number) => {
    setBalance(newBalanceInKobo);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, balance, login, logout, updateBalance, fetchBalance }}>
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
