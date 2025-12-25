"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MockAccount {
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  description: string;
}

const mockAccounts: MockAccount[] = [
  {
    name: "John Doe",
    accountNumber: "0123456789",
    bankCode: "058",
    bankName: "GTBank",
    description: "✅ Test account for successful transfers"
  },
  {
    name: "Jane Smith", 
    accountNumber: "9876543210",
    bankCode: "044",
    bankName: "Access Bank",
    description: "🔐 Test account for OTP validation"
  },
  {
    name: "Mike Johnson",
    accountNumber: "5555666677",
    bankCode: "057", 
    bankName: "Zenith Bank",
    description: "⚡ Test account for instant transfers"
  }
];

interface MockAccountsProps {
  onSelectAccount: (account: MockAccount) => void;
}

export function MockAccounts({ onSelectAccount }: MockAccountsProps) {
  const { toast } = useToast();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card className="mb-4 border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            DEV MODE
          </Badge>
          <CardTitle className="text-sm">Mock Test Accounts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAccounts.map((account, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-gray-500">{account.bankName}</p>
                <p className="text-xs text-gray-400">{account.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-mono text-gray-600">{account.accountNumber}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(account.accountNumber, "Account number")}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => onSelectAccount(account)}
              >
                Use
              </Button>
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-500 mt-2">
          💡 These are test accounts for development. Use them to test transfers without real bank accounts.
          <br />
          🔧 All accounts will validate successfully and simulate different transfer scenarios.
          <br />
          ⚠️ <strong>Note:</strong> Transfers will only work when VFD API is properly configured and connected.
        </p>
      </CardContent>
    </Card>
  );
}