-- Create weekly_challenges table
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'workout',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_metric TEXT NOT NULL, -- e.g., 'workout_minutes', 'logged_meals', 'water_intake'
    target_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active challenges
CREATE INDEX idx_weekly_challenges_active ON weekly_challenges(is_active) WHERE is_active = true;

-- Create index for date range queries
CREATE INDEX idx_weekly_challenges_dates ON weekly_challenges(start_date, end_date);
 
-- Add RLS policies
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active challenges
CREATE POLICY "Weekly challenges are viewable by everyone"
    ON weekly_challenges
    FOR SELECT
    USING (true);

-- Only admins can insert/update challenges (you can adjust this based on your needs)
CREATE POLICY "Only authenticated users can manage challenges"
    ON weekly_challenges
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert a sample weekly challenge
INSERT INTO weekly_challenges (
    title,
    description,
    icon,
    start_date,
    end_date,
    target_metric,
    target_value,
    is_active
) VALUES (
    'Mindful Movement',
    'Log at least 30 minutes of activity, 5 days this week. Any movement counts!',
    'workout',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '6 days',
    'workout_minutes',
    150,
    true
);
