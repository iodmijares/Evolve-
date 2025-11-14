-- Add username column to profiles table for public display names
-- This allows users to set a nickname that will be shown publicly instead of their real name

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Optional public display name/nickname used in AI reflections and public displays';
