export type KycTier = 1 | 2 | 3;
export type UserStatus = 'active' | 'locked' | 'pending';

export interface UserAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
}

export interface UserLimits {
  daily: number;   // in kobo
  monthly: number; // in kobo
}

export interface AgentSettlementAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface AgentDetails {
  businessName: string;
  businessAddress: string;
  posSerialNumber?: string;
  region: string;
  settlementAccount: AgentSettlementAccount;
}

export interface User {
  // Identity
  readonly phone: string;        // E.164, unique
  fullName: string;
  email?: string;

  // Wallet / account
  readonly accountNumber: string;
  balance: number;               // kobo

  // KYC & limits
  kycTier: KycTier;
  isAgent: boolean;

  // Derived tier limits (optional, from kycTier)
  tierLimits?: UserLimits;       // base limits for the tier
  // Effective limits (may include overrides)
  limits?: UserLimits;

  // Auth / security
  loginPinHash: string;          // must match salt:hash format from lib/auth.ts
  lastLogoutAll?: string;
  status: UserStatus;

  readonly createdAt: string;
  updatedAt: string;

  // Privacy-aware IDs (hashed, not raw)
  bvnHash?: string;
  ninHash?: string;

  address?: UserAddress;
  agent?: AgentDetails;

  // Security / risk signals
  lastLoginAt?: string;
  failedLoginCount?: number;

  // Device / context (optional, for security & UX)
  lastLoginIp?: string;
  lastLoginDevice?: string;      // e.g. "iPhone 14 / Chrome / Android"

  // Notifications (optional)
  notifications?: Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    category?: string;
  }>;

  // Extras
  mfaEnabled?: boolean;
  preferredLanguage?: string;    // e.g. "en", "fr", "yo"
  avatarUrl?: string;
}

export interface DbUser {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  account_number: string;
  balance: number;
  pin: string;
  kyc_tier: number;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference: string;
  party_name?: string;
  party_account?: string;
  balance_after?: number;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}