
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockGetAccountByNumber } from '@/lib/user-data';

interface User {
  fullName: string;
  accountNumber: string;
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
    localStorage.removeItem('ovo-user-phone');
    localStorage.removeItem('ovo-user-accountNumber');
    setIsAuthenticated(false);
    setUser(null);
    setBalance(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const accountNumber = localStorage.getItem('ovo-user-accountNumber');
      if (!accountNumber) {
        if (localStorage.getItem('ovo-auth-token')) {
            logout();
        }
        return;
      }
      const account = await mockGetAccountByNumber(accountNumber);
      if (account) {
        setUser({ fullName: account.fullName, accountNumber: account.accountNumber });
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
      
      const { token, fullName, accountNumber } = await response.json();
      localStorage.setItem('ovo-auth-token', token);
      localStorage.setItem('ovo-user-phone', phone);
      localStorage.setItem('ovo-user-accountNumber', accountNumber);
      setIsAuthenticated(true);
      setUser({ fullName, accountNumber }); // Set user immediately on login
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
