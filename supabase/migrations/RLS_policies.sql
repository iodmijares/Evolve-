/*
  ROW LEVEL SECURITY (RLS) POLICIES
  
  This file enables RLS on all tables to secure user data.
  
  Deployment:
  1. Go to Supabase Dashboard -> SQL Editor
  2. Paste this content and Run.
  
  Assumptions:
  - 'profiles' table exists and has 'user_id' column.
  - All private data tables have 'user_id' column linking to auth.users.
  - 'weekly_challenges' and 'earned_achievements' are used for community features.
*/

-- ==============================================================================
-- 1. PUBLIC/SHARED TABLES (Community Features)
-- ==============================================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read profiles (needed for leaderboards/feeds)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

-- Users can only create their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = user_id);


-- WEEKLY CHALLENGES (Read-only for users, Admin managed)
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly challenges are viewable by everyone" 
ON weekly_challenges FOR SELECT USING (true);

-- EARNED ACHIEVEMENTS
ALTER TABLE earned_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Earned achievements are viewable by everyone" 
ON earned_achievements FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" 
ON earned_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 2. STRICT PRIVATE TABLES (Personal Data)
-- ==============================================================================

-- JOURNAL ENTRIES
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own journal entries" 
ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- LOGGED MEALS
ALTER TABLE logged_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own logged meals" 
ON logged_meals FOR ALL USING (auth.uid() = user_id);

-- LOGGED WORKOUTS (Note: Community stats calculation may need a secure View later)
ALTER TABLE logged_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own logged workouts" 
ON logged_workouts FOR ALL USING (auth.uid() = user_id);

-- MEAL PLANS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own meal plans" 
ON meal_plans FOR ALL USING (auth.uid() = user_id);

-- WORKOUT PLANS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own workout plans" 
ON workout_plans FOR ALL USING (auth.uid() = user_id);

-- WEIGHT LOGS
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own weight logs" 
ON weight_logs FOR ALL USING (auth.uid() = user_id);

-- CHALLENGES (Personal)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own challenges" 
ON challenges FOR ALL USING (auth.uid() = user_id);

-- CYCLE DATA
ALTER TABLE cycle_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own cycle data" 
ON cycle_data FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own notification preferences" 
ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- MEAL CHOICES
ALTER TABLE meal_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own meal choices" 
ON meal_choices FOR ALL USING (auth.uid() = user_id);

-- ACHIEVEMENTS (Definitions/Progress - assuming private if different from earned)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own achievements" 
ON achievements FOR ALL USING (auth.uid() = user_id);
