-- Add has_period column to daily_logs table to track menstrual cycle
-- This allows users to manually log when they have their period
-- and automatically recalibrates the cycle calendar

ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS has_period BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN daily_logs.has_period IS 'True if user had their menstrual period on this date';
