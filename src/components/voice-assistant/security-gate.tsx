"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Icons from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SecurityGate({ isOpen, onClose, onSuccess }: SecurityGateProps) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifyPin = async () => {
    if (pin.length !== 4) {
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) throw new Error("Invalid PIN");

      onSuccess();
      setPin("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid PIN. Please try again."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const tryBiometric = async () => {
    if (!window.PublicKeyCredential) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Biometric authentication is not available"
      });
      return;
    }

    try {
      onSuccess();
      setPin("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Biometric Failed",
        description: "Please use PIN instead"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icons.ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold">Security Verification</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            This information is sensitive. Please verify your identity to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button
            onClick={verifyPin}
            disabled={isVerifying || pin.length !== 4}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify PIN"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={tryBiometric}
            variant="outline"
            className="w-full"
          >
            <Icons.Fingerprint className="mr-2 h-4 w-4" />
            Use Biometric
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
