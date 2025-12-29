/**
 * Biometric Authentication Service
 * Uses WebAuthn API for device biometric authentication (Face ID, Touch ID, Fingerprint)
 */

export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
}

export class BiometricAuth {
  private static readonly RP_NAME = 'Ovo Thrive';
  private static readonly RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  /**
   * Check if biometric authentication is available
   */
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }

  /**
   * Register biometric credential for user
   */
  static async register(userId: string, userName: string): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Biometric authentication not available');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: this.RP_NAME,
          id: this.RP_ID,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create biometric credential');
    }

    // Store credential ID locally
    localStorage.setItem(`biometric_${userId}`, credential.id);
    return credential.id;
  }

  /**
   * Authenticate using biometric
   */
  static async authenticate(userId: string): Promise<boolean> {
    if (!await this.isAvailable()) {
      throw new Error('Biometric authentication not available');
    }

    const credentialId = localStorage.getItem(`biometric_${userId}`);
    if (!credentialId) {
      throw new Error('No biometric registered for this user');
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: new Uint8Array(atob(credentialId).split('').map(c => c.charCodeAt(0))),
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      return !!credential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if user has biometric registered
   */
  static hasRegistered(userId: string): boolean {
    return !!localStorage.getItem(`biometric_${userId}`);
  }

  /**
   * Remove biometric registration
   */
  static remove(userId: string): void {
    localStorage.removeItem(`biometric_${userId}`);
  }

  /**
   * Get biometric type description
   */
  static getBiometricType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'Face ID or Touch ID';
    } else if (userAgent.includes('android')) {
      return 'Fingerprint or Face Unlock';
    } else {
      return 'Device Biometric';
    }
  }
}

// Legacy export for backward compatibility
export const biometricService = {
  initialize: async () => {},
  getCapabilities: () => ({ fingerprint: true, faceId: true, voiceId: false }),
  isAvailable: () => BiometricAuth.isAvailable(),
  registerBiometric: async (userId: string) => {
    try {
      await BiometricAuth.register(userId, 'User');
      return { success: true, type: 'faceId' as const };
    } catch (error: any) {
      return { success: false, type: null, error: error.message };
    }
  },
  authenticateWithBiometric: async (userId: string) => {
    try {
      const success = await BiometricAuth.authenticate(userId);
      return { success, type: success ? 'faceId' as const : null };
    } catch (error: any) {
      return { success: false, type: null, error: error.message };
    }
  },
  removeBiometric: (userId: string) => {
    BiometricAuth.remove(userId);
    return true;
  },
  hasBiometricRegistered: (userId: string) => BiometricAuth.hasRegistered(userId),
};