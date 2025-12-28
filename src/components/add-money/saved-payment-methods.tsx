"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
}

export function SavedPaymentMethods() {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const { toast } = useToast();
  const { syncBalance } = useAuth();

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) return;

      const response = await fetch('/api/payment-methods', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedCards(data);
      }
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundWithCard = async (cardId: string) => {
    if (!amount || parseFloat(amount) < 100) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Minimum amount is ₦100' });
      return;
    }

    setProcessingCardId(cardId);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/funding/saved-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      await syncBalance();
      toast({
        title: 'Success',
        description: `₦${parseFloat(amount).toLocaleString()} added to your wallet`
      });
      setAmount('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Payment failed'
      });
    } finally {
      setProcessingCardId(null);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch(`/api/payment-methods/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSavedCards(cards => cards.filter(c => c.id !== cardId));
        toast({ title: 'Card Removed', description: 'Payment method deleted successfully' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete card' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (savedCards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No saved payment methods</p>
        <p className="text-sm">Add a card to fund faster next time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="100"
        />
      </div>

      <div className="space-y-3">
        {savedCards.map((card) => (
          <Card key={card.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{card.brand} •••• {card.last4}</p>
                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFundWithCard(card.id)}
                    disabled={processingCardId === card.id}
                  >
                    {processingCardId === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Use'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
