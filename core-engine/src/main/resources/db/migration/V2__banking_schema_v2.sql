-- Update users table
ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN daily_limit DECIMAL(15, 2) NOT NULL DEFAULT 3000.00;

-- Update accounts table
ALTER TABLE accounts ADD COLUMN asset_type VARCHAR(50) NOT NULL DEFAULT 'FIAT';
ALTER TABLE accounts RENAME COLUMN currency TO currency_code;

-- Update transactions table
ALTER TABLE transactions ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'TRANSFER';
ALTER TABLE transactions ADD COLUMN stripe_event_id VARCHAR(255) UNIQUE;

-- Adjust numeric precision for crypto support
ALTER TABLE accounts ALTER COLUMN balance TYPE DECIMAL(19, 8);
ALTER TABLE transactions ALTER COLUMN amount TYPE DECIMAL(19, 8);
