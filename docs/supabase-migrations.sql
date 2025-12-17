-- Supabase SQL Migrations
-- Generated: December 13, 2025
-- Database Schema: Ovomonie v1

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NOTE: moddatetime extension is not required; using custom triggers instead

-- ============================================================================
-- CORE COLLECTIONS (Tables)
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  account_number VARCHAR(10) UNIQUE NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  login_pin_hash VARCHAR(255) NOT NULL,
  transaction_pin_hash VARCHAR(255),
  kyc_tier INT DEFAULT 1,
  is_agent BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active',
  address JSONB,
  agent_details JSONB,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_logout_all TIMESTAMP WITH TIME ZONE,
  failed_login_count INT DEFAULT 0,
  bvn_hash VARCHAR(255),
  nin_hash VARCHAR(255),
  referral_code VARCHAR(255),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  preferred_language VARCHAR(10) DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  amount BIGINT,
  sender_name VARCHAR(255),
  recipient_name VARCHAR(255),
  reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL,
  reference VARCHAR(255) UNIQUE NOT NULL,
  narration TEXT NOT NULL,
  party JSONB NOT NULL,
  balance_after BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  memo_message TEXT,
  memo_image_uri TEXT,
  metadata JSONB
);

-- Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_type VARCHAR(50) NOT NULL,
  principal BIGINT NOT NULL,
  balance BIGINT NOT NULL,
  duration INT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  repayments JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL,
  expected_return BIGINT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  duration INT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Holdings Table
CREATE TABLE IF NOT EXISTS stock_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  average_buy_price BIGINT NOT NULL,
  current_price BIGINT NOT NULL,
  total_value BIGINT NOT NULL,
  gain BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOKING & ORDER COLLECTIONS
-- ============================================================================

-- Event Bookings Table
CREATE TABLE IF NOT EXISTS event_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  total_amount BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  reference VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hotel Bookings Table
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id VARCHAR(255) NOT NULL,
  check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_date TIMESTAMP WITH TIME ZONE NOT NULL,
  number_of_rooms INT NOT NULL,
  total_amount BIGINT NOT NULL,
  reference VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Flight Bookings Table
CREATE TABLE IF NOT EXISTS flight_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flight_id VARCHAR(255) NOT NULL,
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  number_of_passengers INT NOT NULL,
  total_amount BIGINT NOT NULL,
  reference VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ride Bookings Table
CREATE TABLE IF NOT EXISTS ride_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  fare BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'Completed',
  reference VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET & CONTENT COLLECTIONS
-- ============================================================================

-- Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100),
  likes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  ticket_price BIGINT NOT NULL,
  total_tickets INT NOT NULL,
  tickets_sold INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  subtotal BIGINT NOT NULL,
  tax BIGINT NOT NULL,
  total BIGINT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INVENTORY COLLECTIONS
-- ============================================================================

-- Suppliers Table (create before products to satisfy FK)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  payment_terms VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  quantity INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  manager VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  price BIGINT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUPPORT & UTILITY COLLECTIONS
-- ============================================================================

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Open',
  priority VARCHAR(50) DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Batches Table
CREATE TABLE IF NOT EXISTS payroll_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_name VARCHAR(255) NOT NULL,
  total_amount BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  employees JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- POS Requests Table
CREATE TABLE IF NOT EXISTS pos_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terminal_count INT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  reference VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUBCOLLECTIONS (Using naming convention: parent_child)
-- ============================================================================

-- Virtual Cards (users_virtual_cards)
CREATE TABLE IF NOT EXISTS users_virtual_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_number VARCHAR(255) NOT NULL,
  expiry_date VARCHAR(10) NOT NULL,
  cvv VARCHAR(10) NOT NULL,
  card_pin VARCHAR(255),
  balance BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  card_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Card Orders (users_card_orders)
CREATE TABLE IF NOT EXISTS users_card_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  card_type VARCHAR(100) NOT NULL,
  delivery_address JSONB NOT NULL,
  amount BIGINT,
  reference VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_account_number ON users(account_number);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_kyc_tier ON users(kyc_tier);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- Financial Transactions indexes
CREATE INDEX idx_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_transactions_reference ON financial_transactions(reference);
CREATE INDEX idx_transactions_user_type_timestamp ON financial_transactions(user_id, type, timestamp DESC);
CREATE INDEX idx_transactions_user_category_timestamp ON financial_transactions(user_id, category, timestamp DESC);

-- Loans indexes
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_user_status ON loans(user_id, status);

-- Investments indexes
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);

-- Bookings indexes
CREATE INDEX idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX idx_flight_bookings_user_id ON flight_bookings(user_id);
CREATE INDEX idx_ride_bookings_user_id ON ride_bookings(user_id);

-- Community indexes
CREATE INDEX idx_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);

-- Events indexes
CREATE INDEX idx_events_user_id ON events(user_id);

-- Stock indexes
CREATE INDEX idx_stock_holdings_user_id ON stock_holdings(user_id);

-- Inventory indexes
CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);

-- Support indexes
CREATE INDEX idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

-- Payroll indexes
CREATE INDEX idx_payroll_user_id ON payroll_batches(user_id);

-- ============================================================================
-- TRIGGERS (Update timestamps)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Atomic internal transfer function (debit sender, credit recipient, log transactions, create notifications)
CREATE OR REPLACE FUNCTION perform_internal_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount BIGINT,
  p_reference VARCHAR,
  p_narration TEXT
) RETURNS VOID AS $$
DECLARE
  v_sender_balance BIGINT;
  v_recipient_balance BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Fetch balances
  SELECT balance INTO v_sender_balance FROM users WHERE id = p_sender_id FOR UPDATE;
  SELECT balance INTO v_recipient_balance FROM users WHERE id = p_recipient_id FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;
  IF v_recipient_balance IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Debit sender
  UPDATE users SET balance = balance - p_amount WHERE id = p_sender_id;
  -- Credit recipient
  UPDATE users SET balance = balance + p_amount WHERE id = p_recipient_id;

  -- Log transactions
  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  VALUES (p_sender_id, 'transfer', 'debit', p_amount, p_reference, p_narration, jsonb_build_object('to', p_recipient_id), (v_sender_balance - p_amount));

  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  VALUES (p_recipient_id, 'transfer', 'credit', p_amount, p_reference, p_narration, jsonb_build_object('from', p_sender_id), (v_recipient_balance + p_amount));

  -- Notifications
  INSERT INTO notifications (user_id, title, body, category, type, amount, reference)
  VALUES (p_sender_id, 'Transfer Sent', p_narration, 'transfer', 'debit', p_amount, p_reference);
  INSERT INTO notifications (user_id, title, body, category, type, amount, reference)
  VALUES (p_recipient_id, 'Transfer Received', p_narration, 'transfer', 'credit', p_amount, p_reference);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAVED CARDS TABLE (Card Tokenization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_token VARCHAR(255) NOT NULL,
  last_four VARCHAR(4) NOT NULL,
  card_brand VARCHAR(20) NOT NULL,
  expiry_display VARCHAR(10),
  nickname VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_id ON saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_default ON saved_cards(user_id, is_default);

-- Ensure only one default card per user
CREATE OR REPLACE FUNCTION ensure_single_default_card()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_cards 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_card
AFTER INSERT OR UPDATE ON saved_cards
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_card();

-- ============================================================================
-- PENDING TRANSACTIONS TABLE (Replaces localStorage receipts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card-funding', 'transfer', 'bill-payment', 'airtime', 'betting', 'virtual-card', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  reference VARCHAR(255) UNIQUE NOT NULL,
  amount BIGINT,
  data JSONB NOT NULL DEFAULT '{}', -- Flexible storage for transaction-specific data
  recipient_name VARCHAR(255),
  bank_name VARCHAR(100),
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited transactions like QR codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pending_transactions
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_id ON pending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_reference ON pending_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_status ON pending_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_latest ON pending_transactions(user_id, created_at DESC);

-- Function to get the latest pending transaction for a user
CREATE OR REPLACE FUNCTION get_latest_pending_transaction(p_user_id UUID)
RETURNS pending_transactions AS $$
  SELECT * FROM pending_transactions 
  WHERE user_id = p_user_id 
    AND status IN ('pending', 'processing', 'completed')
  ORDER BY created_at DESC 
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_saved_cards_updated_at BEFORE UPDATE ON saved_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pending_transactions_updated_at BEFORE UPDATE ON pending_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stock_holdings_updated_at BEFORE UPDATE ON stock_holdings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payroll_batches_updated_at BEFORE UPDATE ON payroll_batches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
