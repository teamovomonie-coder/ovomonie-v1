"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function DeviceFingerprintingSettings() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSetting();
  }, [user]);

  const fetchSetting = async () => {
    if (!user?.userId) return;
    
    setIsFetching(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setIsEnabled(userData.device_fingerprinting_enabled ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch device fingerprinting setting:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggle = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const newValue = !isEnabled;
      
      const response = await fetch('/api/security/device-fingerprinting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update setting');
      }

      setIsEnabled(newValue);
      toast({
        title: newValue ? 'Device Fingerprinting Enabled' : 'Device Fingerprinting Disabled',
        description: newValue
          ? 'New device logins will require liveness verification.'
          : 'New devices will be trusted automatically without verification.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update device fingerprinting setting',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-none bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Device Fingerprinting</CardTitle>
              <CardDescription className="text-sm">
                Secure your account by verifying new device logins
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEnabled && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
              </Badge>
            )}
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium">How it works</p>
              <p className="text-muted-foreground">
                {isEnabled ? (
                  <>
                    When enabled, logging in from a new device will require a liveness check to verify your identity. 
                    This helps protect your account from unauthorized access.
                  </>
                ) : (
                  <>
                    When disabled, new devices will be automatically trusted without verification. 
                    This is less secure but provides a faster login experience.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {isEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Device fingerprinting is active</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• New devices will require liveness verification</p>
              <p>• Trusted devices can log in without verification</p>
              <p>• You can manage trusted devices in the Managed Devices section</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Device fingerprinting is disabled</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• New devices will be automatically trusted</p>
              <p>• No liveness verification required</p>
              <p className="text-amber-600 font-medium">⚠️ This reduces your account security</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>• Device fingerprinting uses your device's unique characteristics to identify it</p>
          <p>• Liveness checks use VFD's biometric verification to ensure you're physically present</p>
          <p>• You can always enable this feature later for better security</p>
        </div>
      </CardContent>
    </Card>
  );
}

