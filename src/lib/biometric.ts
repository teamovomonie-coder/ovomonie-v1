interface BiometricCapabilities {
  fingerprint: boolean;
  faceId: boolean;
  voiceId: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  type: 'fingerprint' | 'faceId' | 'voiceId' | null;
  error?: string;
}

class BiometricService {
  private isSupported = false;
  private capabilities: BiometricCapabilities = {
    fingerprint: false,
    faceId: false,
    voiceId: false
  };

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check for WebAuthn support
    this.isSupported = !!(navigator.credentials && window.PublicKeyCredential);
    
    if (this.isSupported) {
      // Check specific biometric capabilities
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          this.capabilities.fingerprint = true;
          this.capabilities.faceId = true; // Modern devices support both
        }
      } catch (error) {
        console.warn('Biometric capability check failed:', error);
      }
    }
  }

  getCapabilities(): BiometricCapabilities {
    return { ...this.capabilities };
  }

  isAvailable(): boolean {
    return this.isSupported && (this.capabilities.fingerprint || this.capabilities.faceId);
  }

  async registerBiometric(userId: string): Promise<BiometricAuthResult> {
    if (!this.isSupported) {
      return { success: false, type: null, error: 'Biometric authentication not supported' };
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "Ovo Thrive",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: "Ovo User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        localStorage.setItem(`biometric_${userId}`, credential.id);
        return { 
          success: true, 
          type: this.capabilities.faceId ? 'faceId' : 'fingerprint' 
        };
      }

      return { success: false, type: null, error: 'Failed to register biometric' };
    } catch (error: any) {
      return { 
        success: false, 
        type: null, 
        error: error.message || 'Biometric registration failed' 
      };
    }
  }

  async authenticateWithBiometric(userId: string): Promise<BiometricAuthResult> {
    if (!this.isSupported) {
      return { success: false, type: null, error: 'Biometric authentication not supported' };
    }

    const credentialId = localStorage.getItem(`biometric_${userId}`);
    if (!credentialId) {
      return { success: false, type: null, error: 'No biometric registered for this user' };
    }

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: new TextEncoder().encode(credentialId),
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        }
      });

      if (credential) {
        return { 
          success: true, 
          type: this.capabilities.faceId ? 'faceId' : 'fingerprint' 
        };
      }

      return { success: false, type: null, error: 'Biometric authentication failed' };
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        return { success: false, type: null, error: 'Biometric authentication cancelled' };
      }
      return { 
        success: false, 
        type: null, 
        error: error.message || 'Biometric authentication failed' 
      };
    }
  }

  async removeBiometric(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`biometric_${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  hasBiometricRegistered(userId: string): boolean {
    return !!localStorage.getItem(`biometric_${userId}`);
  }
}

export const biometricService = new BiometricService();