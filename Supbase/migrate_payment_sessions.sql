-- Migration: Create payment_sessions table for reliable webhook-based order creation
-- This table stores pending order data between Razorpay order creation and payment capture,
-- enabling both the frontend verify path AND a server-side webhook to create the order idempotently.

CREATE TABLE IF NOT EXISTS payment_sessions (
  razorpay_order_id VARCHAR(100) PRIMARY KEY,
  user_id           UUID,
  items             JSONB        NOT NULL,
  subtotal          DECIMAL(10,2) NOT NULL,
  delivery_charge   DECIMAL(10,2) NOT NULL DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  delivery_address  JSONB,
  idempotency_key   VARCHAR(255) UNIQUE,
  status            VARCHAR(50)  DEFAULT 'pending', -- pending | completed | failed
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at        TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hours')
);

-- Index for quick lookup by idempotency key during verify
CREATE INDEX IF NOT EXISTS payment_sessions_idempotency_key_idx
  ON payment_sessions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Auto-cleanup: delete expired sessions older than 24h (run periodically or via pg_cron)
-- DELETE FROM payment_sessions WHERE expires_at < NOW() - INTERVAL '24 hours';
