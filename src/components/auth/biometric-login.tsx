import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, Shield, AlertCircle } from 'lucide-react';
import { BiometricAuth } from '@/lib/biometric';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface BiometricLoginProps {
  userId?: string;
  onSuccess: () => void;
  onFallback: () => void;
}

export default function BiometricLogin({ userId, onSuccess, onFallback }: BiometricLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      setIsAvailable(available);
      
      if (userId && available) {
        setHasRegistered(BiometricAuth.hasRegistered(userId));
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
      const success = await BiometricAuth.authenticate(userId);
      
      if (success) {
        // Authenticate user in the app
        await login(userId, '', 'biometric');
        
        toast({
          title: "Success",
          description: `Authenticated with ${BiometricAuth.getBiometricType()}`,
        });
        
        onSuccess();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Biometric authentication failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
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
      await BiometricAuth.register(userId, 'User');
      setHasRegistered(true);
      toast({
        title: "Success",
        description: `${BiometricAuth.getBiometricType()} registered successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register biometric",
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

  const biometricType = BiometricAuth.getBiometricType();
  const isFaceId = biometricType.includes('Face');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {isFaceId ? (
            <Scan className="h-16 w-16 text-primary" />
          ) : (
            <Fingerprint className="h-16 w-16 text-primary" />
          )}
        </div>
        <CardTitle>{biometricType}</CardTitle>
        <CardDescription>
          {hasRegistered 
            ? `Use your ${biometricType.toLowerCase()} to sign in securely`
            : `Register your ${biometricType.toLowerCase()} for quick and secure access`
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
              {isLoading ? 'Authenticating...' : `Sign in with ${biometricType}`}
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
              {isLoading ? 'Registering...' : `Set up ${biometricType}`}
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