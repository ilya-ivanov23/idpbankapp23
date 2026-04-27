-- V3 Database Migration

-- Update users table
ALTER TABLE users
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN date_of_birth DATE,
ADD COLUMN address VARCHAR(255),
ADD COLUMN city VARCHAR(100),
ADD COLUMN postal_code VARCHAR(20),
ADD COLUMN language VARCHAR(10) DEFAULT 'en',
ADD COLUMN push_enabled BOOLEAN DEFAULT true;

-- Update transactions table
ALTER TABLE transactions
ADD COLUMN currency_rate DECIMAL(20,8);
