"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface BankCard {
  id: string;
  cardNumber: string;
  cardType: string;
  expiryDate: string;
  cardholderName: string;
}

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "UBA", "Zenith Bank",
  "Fidelity Bank", "Union Bank", "Sterling Bank", "Stanbic IBTC",
  "Polaris Bank", "Wema Bank", "Ecobank", "FCMB", "Keystone Bank"
];

export default function BankAccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [accountForm, setAccountForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/payment-methods", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts || []);
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.bankName || !accountForm.accountNumber) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/payment-methods/add-account", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(accountForm)
      });
      
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: "Bank account linked successfully" });
        setIsAddAccountOpen(false);
        setAccountForm({ bankName: "", accountNumber: "", accountName: "" });
        fetchLinkedAccounts();
      } else {
        throw new Error(result.message || "Failed to add account");
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add account" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardForm.cardNumber || !cardForm.expiryDate || !cardForm.cvv || !cardForm.cardholderName) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/payment-methods/add-card", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(cardForm)
      });
      
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: "Card linked successfully" });
        setIsAddCardOpen(false);
        setCardForm({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
        fetchLinkedAccounts();
      } else {
        throw new Error(result.message || "Failed to add card");
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add card" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccount = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch(`/api/user/payment-methods/remove-account/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Account removed successfully" });
        fetchLinkedAccounts();
      } else {
        throw new Error("Failed to remove account");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove account" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCard = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch(`/api/user/payment-methods/remove-card/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Card removed successfully" });
        fetchLinkedAccounts();
      } else {
        throw new Error("Failed to remove card");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove card" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-8 pt-6 bg-slate-50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Bank Cards & Accounts</h1>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Linked Bank Accounts</h2>
              <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#0b1b3a] hover:bg-[#0f2552]">
                    <Icons.Plus className="h-4 w-4 mr-1" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Bank Account</DialogTitle>
                    <DialogDescription>Add a bank account to fund your Ovomonie balance</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Select value={accountForm.bankName} onValueChange={(value) => setAccountForm({...accountForm, bankName: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_BANKS.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input 
                        placeholder="0123456789" 
                        maxLength={10}
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm({...accountForm, accountNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input 
                        placeholder="Account holder name" 
                        value={accountForm.accountName}
                        onChange={(e) => setAccountForm({...accountForm, accountName: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddAccount} disabled={isLoading} className="bg-[#0b1b3a] hover:bg-[#0f2552]">
                      {isLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : "Link Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {accounts.length === 0 ? (
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-8 text-center">
                  <Icons.Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No bank accounts linked yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <Card key={account.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                            <Icons.Building2 className="h-5 w-5 text-[#0b1b3a]" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{account.bankName}</div>
                            <div className="text-sm text-slate-500">{account.accountNumber}</div>
                            <div className="text-xs text-slate-400">{account.accountName}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAccount(account.id)}>
                          <Icons.Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Linked Cards</h2>
              <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#0b1b3a] hover:bg-[#0f2552]">
                    <Icons.Plus className="h-4 w-4 mr-1" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Debit Card</DialogTitle>
                    <DialogDescription>Add a debit card to fund your Ovomonie balance</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input 
                        placeholder="1234 5678 9012 3456" 
                        maxLength={19}
                        value={cardForm.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardForm({...cardForm, cardNumber: value});
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input 
                          placeholder="MM/YY" 
                          maxLength={5}
                          value={cardForm.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            setCardForm({...cardForm, expiryDate: value});
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input 
                          type="password" 
                          placeholder="123" 
                          maxLength={3}
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({...cardForm, cvv: e.target.value.replace(/\D/g, '')})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cardholder Name</Label>
                      <Input 
                        placeholder="Name on card" 
                        value={cardForm.cardholderName}
                        onChange={(e) => setCardForm({...cardForm, cardholderName: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCardOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCard} disabled={isLoading} className="bg-[#0b1b3a] hover:bg-[#0f2552]">
                      {isLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : "Link Card"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {cards.length === 0 ? (
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-8 text-center">
                  <Icons.CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No cards linked yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <Card key={card.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#0b1b3a]/5 rounded-lg">
                            <Icons.CreditCard className="h-5 w-5 text-[#0b1b3a]" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{card.cardType}</div>
                            <div className="text-sm text-slate-500">•••• {card.cardNumber}</div>
                            <div className="text-xs text-slate-400">Expires {card.expiryDate}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCard(card.id)}>
                          <Icons.Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
