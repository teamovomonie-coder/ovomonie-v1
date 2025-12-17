import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface VirtualAccount {
  id: string;
  userId: string;
  vfdAccountNumber: string;
  reference: string;
  amount: string;
  status: 'active' | 'expired' | 'used';
  validityTime: string;
  merchantName: string;
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  userId: string;
  balance: number;
  ledgerBalance: number;
  lastUpdated: string;
}

export function useVirtualAccounts() {
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) {
        setError('Failed to fetch balance');
        return;
      }

      setBalance({
        userId: user.id,
        balance: data.balance || 0,
        ledgerBalance: data.balance || 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to fetch balance');
    }
  };

  const createVirtualAccount = async (amount: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get auth token for API call
      const token = localStorage.getItem('ovo-auth-token');
      console.log('Token from localStorage:', token);
      
      const response = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ amount })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setVirtualAccounts(prev => [result.data, ...prev]);
        await fetchBalance(); // Refresh balance
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to create virtual account';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const initiateTransfer = async (
    amount: number,
    recipientAccount: string,
    recipientBank: string,
    narration: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
        
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          amount,
          recipientAccount,
          recipientBank,
          narration
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh balance after successful transfer
        await fetchBalance();
        return { success: true, reference: result.reference };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to initiate transfer';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return {
    virtualAccounts,
    balance,
    loading,
    error,
    createVirtualAccount,
    initiateTransfer,
    refreshBalance: fetchBalance
  };
}