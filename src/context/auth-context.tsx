
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean | null; // null when loading, boolean when determined
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for token on initial load
    const token = localStorage.getItem('ovo-auth-token');
    setIsAuthenticated(!!token);
  }, []);

  const login = useCallback(async (phone: string, pin: string): Promise<void> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock user credentials
        if (phone === '08100645569' && pin === '051003') {
          const dummyToken = `fake-token-${Date.now()}`;
          localStorage.setItem('ovo-auth-token', dummyToken);
          setIsAuthenticated(true);
          resolve();
        } else {
          reject(new Error('Invalid phone number or PIN.'));
        }
      }, 1000);
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ovo-auth-token');
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
