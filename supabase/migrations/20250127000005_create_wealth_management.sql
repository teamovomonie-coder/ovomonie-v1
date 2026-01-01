-- Wealth Management Core Tables

-- Investment Products
CREATE TABLE IF NOT EXISTS investment_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fixed_deposit', 'mutual_fund', 'bonds', 'stocks', 'etf', 'real_estate', 'commodities', 'crypto')) NOT NULL,
  category TEXT CHECK (category IN ('conservative', 'moderate', 'aggressive', 'balanced')) NOT NULL,
  min_investment BIGINT NOT NULL DEFAULT 100000, -- in kobo
  max_investment BIGINT DEFAULT NULL, -- in kobo
  expected_return_rate DECIMAL(5,4) NOT NULL, -- annual rate as decimal (0.15 = 15%)
  risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 10) NOT NULL,
  liquidity_period INTEGER NOT NULL DEFAULT 0, -- days before withdrawal allowed
  management_fee DECIMAL(5,4) DEFAULT 0, -- annual fee as decimal
  performance_fee DECIMAL(5,4) DEFAULT 0, -- performance fee as decimal
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Investment Portfolios
CREATE TABLE IF NOT EXISTS investment_portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES investment_products(id),
  principal_amount BIGINT NOT NULL, -- in kobo
  current_value BIGINT NOT NULL, -- in kobo
  units DECIMAL(20,8) NOT NULL DEFAULT 1,
  purchase_price DECIMAL(15,2) NOT NULL, -- price per unit at purchase
  current_price DECIMAL(15,2) NOT NULL, -- current price per unit
  status TEXT CHECK (status IN ('active', 'matured', 'liquidated', 'suspended')) DEFAULT 'active',
  investment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  maturity_date TIMESTAMP WITH TIME ZONE,
  last_dividend_date TIMESTAMP WITH TIME ZONE,
  total_dividends BIGINT DEFAULT 0, -- in kobo
  auto_reinvest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment Transactions
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id UUID REFERENCES investment_portfolios(id),
  product_id UUID NOT NULL REFERENCES investment_products(id),
  transaction_type TEXT CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'fee', 'reinvestment')) NOT NULL,
  amount BIGINT NOT NULL, -- in kobo
  units DECIMAL(20,8) NOT NULL DEFAULT 0,
  price_per_unit DECIMAL(15,2) NOT NULL DEFAULT 0,
  fees BIGINT DEFAULT 0, -- in kobo
  reference TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Assessment Profiles
CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')) NOT NULL,
  investment_experience TEXT CHECK (investment_experience IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
  investment_horizon INTEGER NOT NULL, -- years
  income_stability TEXT CHECK (income_stability IN ('stable', 'variable', 'irregular')) NOT NULL,
  age_group TEXT CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '56-65', '65+')) NOT NULL,
  financial_goals TEXT[] DEFAULT '{}',
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 100) NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Performance Tracking
CREATE TABLE IF NOT EXISTS portfolio_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id),
  date DATE NOT NULL,
  opening_value BIGINT NOT NULL, -- in kobo
  closing_value BIGINT NOT NULL, -- in kobo
  daily_return DECIMAL(10,6) NOT NULL, -- percentage
  cumulative_return DECIMAL(10,6) NOT NULL, -- percentage
  benchmark_return DECIMAL(10,6) DEFAULT 0, -- percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, date)
);

-- Investment Alerts and Notifications
CREATE TABLE IF NOT EXISTS investment_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  portfolio_id UUID REFERENCES investment_portfolios(id),
  alert_type TEXT CHECK (alert_type IN ('price_target', 'loss_limit', 'maturity_reminder', 'rebalance_suggestion', 'market_news')) NOT NULL,
  trigger_condition JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wealth Management Goals
CREATE TABLE IF NOT EXISTS wealth_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_name TEXT NOT NULL,
  goal_type TEXT CHECK (goal_type IN ('retirement', 'education', 'house', 'emergency', 'vacation', 'business', 'other')) NOT NULL,
  target_amount BIGINT NOT NULL, -- in kobo
  current_amount BIGINT DEFAULT 0, -- in kobo
  target_date DATE NOT NULL,
  monthly_contribution BIGINT DEFAULT 0, -- in kobo
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'achieved', 'paused', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Robo-Advisor Recommendations
CREATE TABLE IF NOT EXISTS robo_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('portfolio_allocation', 'rebalancing', 'tax_optimization', 'goal_adjustment')) NOT NULL,
  current_allocation JSONB,
  recommended_allocation JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  expected_improvement DECIMAL(5,4), -- expected return improvement
  implementation_cost BIGINT DEFAULT 0, -- in kobo
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Data Cache
CREATE TABLE IF NOT EXISTS market_data (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  current_price DECIMAL(15,2) NOT NULL,
  change_24h DECIMAL(10,6) NOT NULL,
  volume_24h BIGINT DEFAULT 0,
  market_cap BIGINT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance and Regulatory
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('kyc', 'aml', 'tax_form', 'accredited_investor', 'risk_disclosure')) NOT NULL,
  document_url TEXT,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')) DEFAULT 'pending',
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Optimization Records
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  total_gains BIGINT DEFAULT 0, -- in kobo
  total_losses BIGINT DEFAULT 0, -- in kobo
  dividend_income BIGINT DEFAULT 0, -- in kobo
  tax_withheld BIGINT DEFAULT 0, -- in kobo
  tax_optimization_savings BIGINT DEFAULT 0, -- in kobo
  status TEXT CHECK (status IN ('draft', 'finalized', 'filed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tax_year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_id ON investment_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_portfolios_status ON investment_portfolios(status);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_reference ON investment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_user_id ON portfolio_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_date ON portfolio_performance(date);
CREATE INDEX IF NOT EXISTS idx_investment_alerts_user_id ON investment_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_goals_user_id ON wealth_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_robo_recommendations_user_id ON robo_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_user_id ON compliance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_records_user_id ON tax_records(user_id);

-- Update triggers
CREATE TRIGGER update_investment_products_updated_at BEFORE UPDATE ON investment_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_profiles_updated_at BEFORE UPDATE ON risk_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wealth_goals_updated_at BEFORE UPDATE ON wealth_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_records_updated_at BEFORE UPDATE ON tax_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default investment products
INSERT INTO investment_products (name, type, category, min_investment, expected_return_rate, risk_level, liquidity_period, description) VALUES
('Ovo-Fix Conservative', 'fixed_deposit', 'conservative', 100000, 0.12, 2, 30, 'Low-risk fixed deposit with guaranteed returns'),
('Ovo-Fix Moderate', 'fixed_deposit', 'moderate', 100000, 0.15, 4, 90, 'Medium-risk fixed deposit with higher returns'),
('Ovo-Bonds Government', 'bonds', 'conservative', 500000, 0.14, 3, 180, 'Government bonds with stable returns'),
('Ovo-Equity Growth', 'stocks', 'aggressive', 250000, 0.25, 8, 0, 'High-growth equity investments'),
('Ovo-Balanced Fund', 'mutual_fund', 'balanced', 150000, 0.18, 5, 30, 'Diversified balanced mutual fund'),
('Ovo-Real Estate', 'real_estate', 'moderate', 1000000, 0.20, 6, 365, 'Real estate investment trust'),
('Ovo-Crypto Basket', 'crypto', 'aggressive', 50000, 0.35, 9, 0, 'Diversified cryptocurrency portfolio');