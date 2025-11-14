-- Add has_seen_walkthrough column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_seen_walkthrough BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_has_seen_walkthrough ON profiles(has_seen_walkthrough);

-- Update existing users to have seen the walkthrough (so they don't see it suddenly)
UPDATE profiles SET has_seen_walkthrough = TRUE WHERE onboarding_date IS NOT NULL;
