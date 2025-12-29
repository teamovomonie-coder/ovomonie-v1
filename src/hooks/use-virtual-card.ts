import { useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

interface VirtualCard {
  id: string;
  maskedPan: string;
  expiryMonth: string;
  expiryYear: string;
  cardName: string;
  status: 'pending' | 'active' | 'blocked' | 'failed';
  createdAt: string;
}

interface CreateCardResponse {
  ok: boolean;
  message?: string;
  error?: string;
  code?: string;
  data?: {
    cardId: string;
    maskedPan: string;
    expiryMonth: string;
    expiryYear: string;
    status: string;
    newBalance: number;
  };
}

export function useVirtualCard() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const { updateBalance } = useAuth();

  const fetchCards = useCallback(async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return;

      const response = await fetch('/api/cards/virtual-new', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCards(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  }, []);

  const createCard = useCallback(async (cardName?: string): Promise<CreateCardResponse> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        return { ok: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/cards/virtual-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardName })
      });

      const data = await response.json();

      if (data.ok && data.data) {
        // Update balance
        if (data.data.newBalance !== undefined) {
          updateBalance(data.data.newBalance);
        }
        // Refresh cards list
        await fetchCards();
      }

      return data;
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create card'
      };
    } finally {
      setLoading(false);
    }
  }, [fetchCards, updateBalance]);

  return {
    cards,
    loading,
    createCard,
    fetchCards
  };
}
