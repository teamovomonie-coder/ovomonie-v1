
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
      const phone = localStorage.getItem('ovo-user-phone');
      if (!phone) {
        // If there's a token but no phone, user should be logged out.
        if (localStorage.getItem('ovo-auth-token')) {
            logout();
        }
        return;
      }
      // This is now a mock function, but it could be an API call in a real app
      // to get account details by phone number.
      const account = await mockGetAccountByNumber(phone);
      if (account) {
        setBalance(account.balance);
      } else {
        // Fallback or handle case where user is authenticated but account data is missing
        setBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch balance", error);
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
      const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed.');
      }
      
      const { token } = await response.json();
      localStorage.setItem('ovo-auth-token', token);
      localStorage.setItem('ovo-user-phone', phone); // Store phone to fetch details
      setIsAuthenticated(true);
      await fetchBalance();
  }, [fetchBalance]);

  const logout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    localStorage.removeItem('ovo-user-phone');
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
