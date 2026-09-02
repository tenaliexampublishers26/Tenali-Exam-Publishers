-- Migration: Add Razorpay payment tracking columns to orders table
-- Run this on your existing database if the orders table was already created without these columns.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100),          -- Razorpay payment ID (e.g. pay_XXXX)
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);   -- Razorpay order ID (e.g. order_XXXX)
