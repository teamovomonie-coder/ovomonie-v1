import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Scan, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { biometricService } from '@/lib/biometric';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';

export default function BiometricSettings() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState({ fingerprint: false, faceId: false, voiceId: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initBiometric = async () => {
      await biometricService.initialize();
      const available = await biometricService.isAvailable();
      setIsAvailable(available);
      const caps = await biometricService.getCapabilities();
      setCapabilities(caps);
      
      if (user?.phone) {
        setIsEnabled(biometricService.hasBiometricRegistered(user.phone));
      }
    };

    initBiometric();
  }, [user]);

  const handleToggleBiometric = async () => {
    if (!user?.phone) return;

    setIsLoading(true);
    
    try {
      if (isEnabled) {
        // Disable biometric
        const success = await biometricService.removeBiometric(user.phone);
        if (success) {
          setIsEnabled(false);
          toast({
            title: "Biometric Disabled",
            description: "Biometric authentication has been turned off",
          });
        }
      } else {
        // Enable biometric
        const result = await biometricService.registerBiometric(user.phone);
        if (result.success) {
          setIsEnabled(true);
          const typeLabel = result.type === 'fingerprint' ? 'Fingerprint' : 
                           result.type === 'faceId' ? 'Face ID' : 
                           result.type === 'biometric' ? 'Face ID or Fingerprint' : 'Biometric';
          toast({
            title: "Biometric Enabled",
            description: `${typeLabel} authentication is now active`,
          });
        } else {
          toast({
            title: "Setup Failed",
            description: result.error || "Failed to set up biometric authentication",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Biometric Authentication</CardTitle>
              <CardDescription>Not available on this device</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your device doesn't support biometric authentication. You can continue using your PIN for secure access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {capabilities.faceId && capabilities.fingerprint ? (
              <div className="flex gap-1">
                <Scan className="h-5 w-5 text-primary" />
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
            ) : capabilities.faceId ? (
              <Scan className="h-5 w-5 text-primary" />
            ) : (
              <Fingerprint className="h-5 w-5 text-primary" />
            )}
            <div>
              <CardTitle className="text-lg">
                {capabilities.faceId && capabilities.fingerprint 
                  ? 'Face ID & Fingerprint' 
                  : capabilities.faceId 
                    ? 'Face ID' 
                    : 'Fingerprint'} Authentication
              </CardTitle>
              <CardDescription>
                {capabilities.faceId && capabilities.fingerprint
                  ? 'Quick and secure access with Face ID or Fingerprint'
                  : 'Quick and secure access to your account'}
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
              onCheckedChange={handleToggleBiometric}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">How it works</p>
              <p className="text-muted-foreground mt-1">
                {capabilities.faceId && capabilities.fingerprint
                  ? 'Your face or fingerprint data is stored securely on your device and never leaves it. '
                  : `Your ${capabilities.faceId ? 'face' : 'fingerprint'} data is stored securely on your device and never leaves it. `}
                We use industry-standard WebAuthn technology for authentication.
              </p>
            </div>
          </div>
        </div>

        {isEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Biometric authentication is enabled</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {capabilities.faceId && capabilities.fingerprint
                ? 'You can now sign in quickly using your Face ID or Fingerprint instead of entering your PIN every time.'
                : `You can now sign in quickly using your ${capabilities.faceId ? 'face' : 'fingerprint'} instead of entering your PIN every time.`}
            </p>
            <Button 
              variant="outline" 
              onClick={handleToggleBiometric}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Removing...' : 'Remove Biometric'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {capabilities.faceId && capabilities.fingerprint
                ? 'Set up Face ID or Fingerprint authentication for faster and more secure access to your account.'
                : `Set up ${capabilities.faceId ? 'Face ID' : 'fingerprint'} authentication for faster and more secure access to your account.`}
            </p>
            <Button 
              onClick={handleToggleBiometric}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading 
                ? 'Setting up...' 
                : capabilities.faceId && capabilities.fingerprint
                  ? 'Set up Face ID or Fingerprint'
                  : `Set up ${capabilities.faceId ? 'Face ID' : 'Fingerprint'}`}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Biometric data never leaves your device</p>
          <p>• You can always use your PIN as an alternative</p>
          <p>• Disable anytime from security settings</p>
        </div>
      </CardContent>
    </Card>
  );
}