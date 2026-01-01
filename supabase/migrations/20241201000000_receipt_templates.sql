-- Receipt Templates Table
CREATE TABLE receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL, -- 'betting', 'utility', 'airtime', 'internal-transfer', 'external-transfer', 'memo-transfer'
  template_name VARCHAR(100) NOT NULL,
  template_config JSONB NOT NULL, -- Template styling and layout config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Receipts Table
CREATE TABLE transaction_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  transaction_reference VARCHAR(255) NOT NULL,
  template_id UUID NOT NULL REFERENCES receipt_templates(id),
  receipt_data JSONB NOT NULL, -- Transaction-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(transaction_reference)
);

-- Indexes
CREATE INDEX idx_transaction_receipts_user_id ON transaction_receipts(user_id);
CREATE INDEX idx_transaction_receipts_reference ON transaction_receipts(transaction_reference);
CREATE INDEX idx_receipt_templates_type ON receipt_templates(template_type);

-- Insert default templates
INSERT INTO receipt_templates (template_type, template_name, template_config) VALUES
('betting', 'Betting Receipt', '{
  "title": "Betting Payment Successful",
  "icon": "gamepad",
  "color": "#10b981",
  "fields": [
    {"key": "platform", "label": "Betting Platform", "type": "text"},
    {"key": "accountId", "label": "Account ID", "type": "text"},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}'),
('utility', 'Utility Bill Receipt', '{
  "title": "Bill Payment Successful",
  "icon": "zap",
  "color": "#3b82f6",
  "fields": [
    {"key": "biller", "label": "Service Provider", "type": "text"},
    {"key": "accountId", "label": "Meter/Account Number", "type": "text"},
    {"key": "verifiedName", "label": "Account Name", "type": "text", "optional": true},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "token", "label": "Energy Token", "type": "token", "optional": true},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}'),
('airtime', 'Airtime/Data Receipt', '{
  "title": "Airtime Purchase Successful",
  "icon": "smartphone",
  "color": "#8b5cf6",
  "fields": [
    {"key": "network", "label": "Service Provider", "type": "text"},
    {"key": "phoneNumber", "label": "Recipient Number", "type": "phone"},
    {"key": "planName", "label": "Plan", "type": "text", "optional": true},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}'),
('internal-transfer', 'Internal Transfer Receipt', '{
  "title": "Transfer Successful!",
  "icon": "landmark",
  "color": "#3b82f6",
  "fields": [
    {"key": "recipientName", "label": "Recipient", "type": "text"},
    {"key": "bankName", "label": "Bank", "type": "text"},
    {"key": "accountNumber", "label": "Account Number", "type": "text"},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "narration", "label": "Narration", "type": "text", "optional": true},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}'),
('external-transfer', 'External Transfer Receipt', '{
  "title": "Transfer Successful!",
  "icon": "landmark",
  "color": "#3b82f6",
  "fields": [
    {"key": "recipientName", "label": "Recipient", "type": "text"},
    {"key": "bankName", "label": "Bank", "type": "text"},
    {"key": "accountNumber", "label": "Account Number", "type": "text"},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "narration", "label": "Narration", "type": "text", "optional": true},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}'),
('memo-transfer', 'Memo Transfer Receipt', '{
  "title": "Transfer Successful!",
  "icon": "landmark",
  "color": "#3b82f6",
  "fields": [
    {"key": "recipientName", "label": "Recipient", "type": "text"},
    {"key": "bankName", "label": "Bank", "type": "text"},
    {"key": "accountNumber", "label": "Account Number", "type": "text"},
    {"key": "amount", "label": "Amount", "type": "currency"},
    {"key": "message", "label": "Message", "type": "text", "optional": true},
    {"key": "transactionId", "label": "Reference", "type": "reference"},
    {"key": "completedAt", "label": "Date", "type": "datetime"}
  ]
}');