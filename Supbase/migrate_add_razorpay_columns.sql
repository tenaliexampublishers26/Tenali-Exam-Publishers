-- Migration: Add Razorpay payment tracking columns to orders table
-- Run this on your existing database if the orders table was already created without these columns.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100),          -- Razorpay payment ID (e.g. pay_XXXX)
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),   -- Razorpay order ID (e.g. order_XXXX)
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);     -- Idempotency key to prevent duplicate orders

-- Unique index to enforce deduplication on idempotency_key (nulls are excluded from uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Unique index on payment_id to prevent double-order from webhook duplicate fire
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique
  ON orders (payment_id)
  WHERE payment_id IS NOT NULL;
