import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, Shield, AlertCircle } from 'lucide-react';
import { biometricService } from '@/lib/biometric';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';

interface BiometricLoginProps {
  userId?: string;
  onSuccess: () => void;
  onFallback: () => void;
}

export default function BiometricLogin({ userId, onSuccess, onFallback }: BiometricLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [capabilities, setCapabilities] = useState({ fingerprint: false, faceId: false, voiceId: false });
  const { login } = useAuth();

  useEffect(() => {
    const initBiometric = async () => {
      await biometricService.initialize();
      setIsAvailable(biometricService.isAvailable());
      setCapabilities(biometricService.getCapabilities());
      
      if (userId) {
        setHasRegistered(biometricService.hasBiometricRegistered(userId));
      }
    };

    initBiometric();
  }, [userId]);

  const handleBiometricAuth = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID required for biometric authentication",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await biometricService.authenticateWithBiometric(userId);
      
      if (result.success) {
        // Authenticate user in the app
        await login(userId, 'biometric');
        
        toast({
          title: "Success",
          description: `Authenticated with ${result.type === 'faceId' ? 'Face ID' : 'Fingerprint'}`,
        });
        
        onSuccess();
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || "Biometric authentication failed",
          variant: "destructive"
        });
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

  const handleRegisterBiometric = async () => {
    if (!userId) return;

    setIsLoading(true);
    
    try {
      const result = await biometricService.registerBiometric(userId);
      
      if (result.success) {
        setHasRegistered(true);
        toast({
          title: "Success",
          description: `${result.type === 'faceId' ? 'Face ID' : 'Fingerprint'} registered successfully`,
        });
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to register biometric",
          variant: "destructive"
        });
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
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Biometric Not Available</CardTitle>
          <CardDescription>
            Your device doesn't support biometric authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onFallback} className="w-full">
            Use PIN Instead
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {capabilities.faceId ? (
            <Scan className="h-16 w-16 text-primary" />
          ) : (
            <Fingerprint className="h-16 w-16 text-primary" />
          )}
        </div>
        <CardTitle>
          {capabilities.faceId ? 'Face ID' : 'Fingerprint'} Authentication
        </CardTitle>
        <CardDescription>
          {hasRegistered 
            ? `Use your ${capabilities.faceId ? 'face' : 'fingerprint'} to sign in securely`
            : `Register your ${capabilities.faceId ? 'face' : 'fingerprint'} for quick and secure access`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasRegistered ? (
          <>
            <Button 
              onClick={handleBiometricAuth}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Shield className="mr-2 h-4 w-4" />
              {isLoading ? 'Authenticating...' : `Sign in with ${capabilities.faceId ? 'Face ID' : 'Fingerprint'}`}
            </Button>
            
            <Button 
              onClick={onFallback}
              variant="outline"
              className="w-full"
            >
              Use PIN Instead
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={handleRegisterBiometric}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              {isLoading ? 'Registering...' : `Set up ${capabilities.faceId ? 'Face ID' : 'Fingerprint'}`}
            </Button>
            
            <Button 
              onClick={onFallback}
              variant="outline"
              className="w-full"
            >
              Skip for Now
            </Button>
          </>
        )}
        
        <div className="text-center text-sm text-muted-foreground">
          <Shield className="inline h-4 w-4 mr-1" />
          Your biometric data is stored securely on your device
        </div>
      </CardContent>
    </Card>
  );
}