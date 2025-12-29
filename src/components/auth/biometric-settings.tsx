"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BiometricAuth } from '@/lib/biometric';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Scan, Shield, Smartphone } from 'lucide-react';

export default function BiometricSettings() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      setIsAvailable(available);
      
      if (available && user?.userId) {
        setIsEnabled(BiometricAuth.hasRegistered(user.userId));
      }
    };

    checkBiometric();
  }, [user]);

  const handleToggleBiometric = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    
    try {
      if (isEnabled) {
        // Disable biometric
        BiometricAuth.remove(user.userId);
        setIsEnabled(false);
        toast({
          title: "Biometric Disabled",
          description: "Biometric authentication has been turned off",
        });
      } else {
        // Enable biometric
        await BiometricAuth.register(user.userId, user.fullName || 'User');
        setIsEnabled(true);
        toast({
          title: "Biometric Enabled",
          description: `${BiometricAuth.getBiometricType()} authentication is now active`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update biometric settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Your device doesn't support biometric authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Biometric authentication requires a compatible device with Face ID, Touch ID, or fingerprint sensor.
          </div>
        </CardContent>
      </Card>
    );
  }

  const biometricType = BiometricAuth.getBiometricType();
  const isFaceId = biometricType.includes('Face');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFaceId ? (
            <Scan className="h-5 w-5" />
          ) : (
            <Fingerprint className="h-5 w-5" />
          )}
          {biometricType}
        </CardTitle>
        <CardDescription>
          Use your {biometricType.toLowerCase()} to sign in quickly and securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable {biometricType}</div>
            <div className="text-sm text-muted-foreground">
              Sign in without entering your PIN
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleBiometric}
            disabled={isLoading}
          />
        </div>
        
        {isEnabled && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Biometric authentication is active</span>
            </div>
            <p className="mt-1 text-xs text-green-700">
              Your biometric data is stored securely on your device and never shared.
            </p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          You can always use your PIN to sign in if biometric authentication fails.
        </div>
      </CardContent>
    </Card>
  );
}