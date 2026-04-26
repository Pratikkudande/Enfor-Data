-- Add experience and deals fields to users table for broker statistics

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deals_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_years_experience ON users(years_experience);
CREATE INDEX IF NOT EXISTS idx_users_deals_completed ON users(deals_completed);

-- Add comments for documentation
COMMENT ON COLUMN users.years_experience IS 'Years of experience in real estate (set during registration, default 0)';
COMMENT ON COLUMN users.deals_completed IS 'Number of deals completed by the broker (default 0)';
COMMENT ON COLUMN users.specializations IS 'Array of property specializations (e.g., Residential, Commercial, Industrial)';
