// types.ts
export interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface DailyMacros {
    target: Macros;
    consumed: Macros;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface Meal {
    id?: string;
    userId?: string;
    name: string;
    macros: Macros;
    mealType: MealType;
    ingredients?: string[];
    instructions?: string[];
    description?: string;
    rationale?: string;
}

export interface Exercise {
    name: string;
    sets: number;
    reps: string; // Can be "12" or "12-15" or "30 seconds"
    restSeconds?: number; // Rest between sets
    instructions?: string[]; // Step-by-step instructions
    tips?: string; // Form tips or notes
    targetMuscles?: string[]; // Muscles worked
}

export interface Workout {
    id?: string;
    userId?: string;
    name: string;
    type: string;
    duration: number; // in minutes
    description: string;
    exercises?: Exercise[]; // Detailed exercises
    warmup?: string; // Warmup instructions
    cooldown?: string; // Cooldown instructions
    date?: string; // YYYY-MM-DD or ISO timestamp
    videoUrl?: string;
}

export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type Goal = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'gluten_free' | 'dairy_free' | 'halal' | 'kosher';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    username?: string; // Public display name/nickname (optional)
    age: number;
    gender: Gender;
    height: number; // in cm
    weight: number; // in kg
    activityLevel: ActivityLevel;
    goal: Goal;
    dietaryPreferences?: DietaryPreference[];
    nationality?: string;
    lastPeriodStartDate?: string; // YYYY-MM-DD
    cycleLength?: number;
    onboardingDate?: string;
    profilePictureUrl?: string;
    has_seen_walkthrough?: boolean; // Track if user has completed the walkthrough
}

export type MenstrualPhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export interface CycleFocusInsight {
    summary: string;
    energyPrediction: string;
    nutritionTip: string;
    mindfulnessSuggestion: string;
}

export interface CyclePatternInsight {
    title: string;
    patternDetail: string;
    suggestion: string;
}

export interface DailyLog {
    id?: string;
    userId?: string;
    date: string; // YYYY-MM-DD
    mood: 'energetic' | 'happy' | 'neutral' | 'irritable' | 'sad' | 'fatigued';
    symptoms: string[];
    hasPeriod?: boolean; // True if user had their period on this date
}

export interface WeightEntry {
    id?: string;
    userId?: string;
    date: string; // YYYY-MM-DD
    weight: number;
}

export interface FoodScanResult {
    macros: Macros;
    fitScore: 'Great Fit' | 'Good Fit' | 'Okay in Moderation' | 'Poor Fit';
    reason: string;
    alternatives?: string[];
}

export interface GeneratedRecipe {
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    macros: Macros;
    isSuitable: boolean;
    unsuitableReason?: string;
}

export interface Achievement {
    id: string;
    name: string;
    icon: string;
    description: string;
    goal: {
        metric: 'onboarding_complete' | 'total_meals' | 'total_workouts' | 'balanced_day' | 'log_streak' | 'days_since_onboarding';
        target: number;
    };
    isAiGenerated?: boolean;
}

export interface JournalEntry {
    id?: string;
    userId?: string;
    date: string; // YYYY-MM-DD
    title: string;
    content: string;
    summary?: string;
    themes?: string[];
    suggestion?: string;
}

// FIX: Added Challenge interface to define the shape of personal challenges data.
export interface Challenge {
    id: string;
    userId: string;
    title: string;
    description: string;
    type: 'fitness' | 'nutrition' | 'mindfulness';
    metric: string;
    goal: number;
    progress: number;
    isCompleted: boolean;
    isAiGenerated?: boolean;
    createdAt: string;
}

export interface WeeklyChallenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    targetMetric: string; // e.g., 'workout_minutes', 'logged_meals', etc.
    targetValue: number;
    isActive: boolean;
}

export interface WorkoutPlanDay {
    day: number;
    type: 'workout' | 'rest';
    workout?: Omit<Workout, 'id' | 'user_id'>;
    isCompleted: boolean;
}

export type WorkoutPlan = WorkoutPlanDay[];

export interface MealPlanMeal {
  name: string;
  time: string;
  macros: Macros;
  ingredients: string[];
  instructions: string[];
  isLogged?: boolean;
}

export interface MealPlanDay {
  dayOfWeek: string;
  breakfast: MealPlanMeal;
  lunch: MealPlanMeal;
  dinner: MealPlanMeal;
  snack?: MealPlanMeal;
  dailyTotals: Macros;
}

export type WeeklyMealPlan = MealPlanDay[];