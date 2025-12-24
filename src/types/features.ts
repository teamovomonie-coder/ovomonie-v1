export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  created_at: string;
  updated_at: string;
}

export interface CryptoAsset {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  amount: number;
  purchase_price: number;
  current_price: number;
  created_at: string;
  updated_at: string;
}

export interface Insurance {
  id: string;
  user_id: string;
  type: 'life' | 'health' | 'auto' | 'home';
  provider: string;
  premium: number;
  coverage_amount: number;
  status: 'active' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  code: string;
  status: 'pending' | 'completed';
  reward_amount: number;
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  user_id: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetime_points: number;
  created_at: string;
  updated_at: string;
}

export interface CurrencyRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}