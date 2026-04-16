-- our users
CREATE TABLE users (
                       id UUID PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- bank accounts linked to users
CREATE TABLE accounts (
                          id UUID PRIMARY KEY,
                          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                          balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- all transactions
CREATE TABLE transactions (
                              id UUID PRIMARY KEY,
                              from_account_id UUID REFERENCES accounts(id),
                              to_account_id UUID REFERENCES accounts(id),
                              amount DECIMAL(15, 2) NOT NULL,
                              status VARCHAR(50) NOT NULL, -- PENDING, COMPLETED, FAILED
                              idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- Защита от двойного списания
                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);