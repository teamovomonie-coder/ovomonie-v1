-- Seed Investment Products for Ovo Wealth

-- Delete existing products first to avoid conflicts
DELETE FROM investment_products WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004'
);

-- Insert the 4 main investment products that match the frontend
INSERT INTO investment_products (
  id,
  name,
  type,
  category,
  min_investment,
  max_investment,
  expected_return_rate,
  risk_level,
  liquidity_period,
  management_fee,
  performance_fee,
  is_active,
  description,
  terms_conditions
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Ovo Save',
  'fixed_deposit',
  'conservative',
  100000, -- ₦1,000 in kobo
  NULL,
  0.10, -- 10% annual return
  3,
  0, -- Flexible withdrawal
  0.005, -- 0.5% management fee
  0,
  true,
  'Flexible savings with daily interest',
  'Terms and conditions for Ovo Save product'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Ovo Target',
  'fixed_deposit',
  'moderate',
  500000, -- ₦5,000 in kobo
  NULL,
  0.12, -- 12% annual return
  4,
  90, -- 3 months minimum
  0.005,
  0,
  true,
  'Goal-based savings plan',
  'Terms and conditions for Ovo Target product'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Ovo Lock',
  'fixed_deposit',
  'moderate',
  1000000, -- ₦10,000 in kobo
  NULL,
  0.15, -- 15% annual return
  5,
  180, -- 6 months minimum
  0.005,
  0,
  true,
  'Fixed deposit with guaranteed returns',
  'Terms and conditions for Ovo Lock product'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Ovo Boost',
  'mutual_fund',
  'aggressive',
  2500000, -- ₦25,000 in kobo
  100000000, -- ₦1,000,000 in kobo
  0.18, -- 18% annual return
  7,
  365, -- 12 months minimum
  0.01, -- 1% management fee
  0.05, -- 5% performance fee
  true,
  'High-yield investment plan',
  'Terms and conditions for Ovo Boost product'
);

-- Insert additional investment products for variety
INSERT INTO investment_products (
  name,
  type,
  category,
  min_investment,
  max_investment,
  expected_return_rate,
  risk_level,
  liquidity_period,
  management_fee,
  performance_fee,
  is_active,
  description
) VALUES 
(
  'Nigerian Government Bonds',
  'bonds',
  'conservative',
  5000000, -- ₦50,000 in kobo
  NULL,
  0.08, -- 8% annual return
  2,
  365, -- 1 year minimum
  0.002,
  0,
  true,
  'Government-backed bonds with guaranteed returns'
),
(
  'NGX Index Fund',
  'etf',
  'moderate',
  1000000, -- ₦10,000 in kobo
  NULL,
  0.14, -- 14% annual return
  6,
  30, -- 1 month minimum
  0.008,
  0,
  true,
  'Diversified Nigerian stock market exposure'
),
(
  'Real Estate Investment Trust',
  'real_estate',
  'moderate',
  10000000, -- ₦100,000 in kobo
  NULL,
  0.16, -- 16% annual return
  6,
  730, -- 2 years minimum
  0.015,
  0.1,
  true,
  'Investment in Nigerian real estate properties'
);