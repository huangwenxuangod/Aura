-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Predictions table
CREATE TYPE prediction_status AS ENUM ('ACTIVE', 'JUDGING', 'SUCCESS', 'FAILED', 'CANCELLED');

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  stake INTEGER NOT NULL DEFAULT 0,
  referee_code TEXT NOT NULL UNIQUE,
  status prediction_status NOT NULL DEFAULT 'ACTIVE',
  is_recovery BOOLEAN NOT NULL DEFAULT FALSE,
  judging_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referees table
CREATE TYPE vote_type AS ENUM ('YES', 'NO');

CREATE TABLE referees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote vote_type,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recoveries table
CREATE TYPE recovery_status AS ENUM ('IN_PROGRESS', 'RECOVERED', 'FORFEITED');

CREATE TABLE recoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  original_stake INTEGER NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  status recovery_status NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TYPE transaction_type AS ENUM ('RECHARGE', 'STAKE', 'REFUND', 'RECOVERY', 'FORFEIT');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  stripe_payment_intent_id TEXT,
  prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_referee_code ON predictions(referee_code);
CREATE INDEX idx_referees_prediction_id ON referees(prediction_id);
CREATE INDEX idx_referees_user_id ON referees(user_id);
CREATE INDEX idx_check_ins_prediction_id ON check_ins(prediction_id);
CREATE INDEX idx_recoveries_user_id ON recoveries(user_id);
CREATE INDEX idx_recoveries_status ON recoveries(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Predictions policies
CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view predictions they referee" ON predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referees WHERE referees.prediction_id = predictions.id AND referees.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view predictions by referee code" ON predictions
  FOR SELECT USING (referee_code IS NOT NULL);

CREATE POLICY "Users can create their own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Referees policies
CREATE POLICY "Anyone can view referees" ON referees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can become referees" ON referees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Referees can update their own vote" ON referees
  FOR UPDATE USING (auth.uid() = user_id);

-- Check-ins policies
CREATE POLICY "Anyone can view check-ins" ON check_ins
  FOR SELECT USING (true);

CREATE POLICY "Users can create check-ins for their predictions" ON check_ins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM predictions WHERE predictions.id = check_ins.prediction_id AND predictions.user_id = auth.uid()
    )
  );

-- Recoveries policies
CREATE POLICY "Users can view their own recoveries" ON recoveries
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recoveries_updated_at
  BEFORE UPDATE ON recoveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
