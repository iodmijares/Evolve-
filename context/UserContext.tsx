import React, { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile, Meal, Workout, DailyMacros, WeightEntry, DailyLog, CycleFocusInsight, Achievement, CyclePatternInsight, JournalEntry, WorkoutPlan, WeeklyMealPlan, Challenge, MealPlanDay } from '../types';

import { useAuth } from './AuthContext';
import { useNutrition } from './NutritionContext';
import { useFitness } from './FitnessContext';
import { useWellness } from './WellnessContext';
import { useJournal } from './JournalContext';
import { useCommunity } from './CommunityContext';

interface UserContextType {
    session: Session | null;
    user: UserProfile | null;
    meals: Meal[];
    workoutHistory: Workout[];
    weightHistory: WeightEntry[];
    dailyLogs: DailyLog[];
    journalEntries: JournalEntry[];
    macros: DailyMacros;
    achievements: Achievement[];
    challenges: Challenge[];
    workoutPlan: WorkoutPlan | null;
    weeklyMealPlan: WeeklyMealPlan | null;
    isOnboardingComplete: boolean;
    isLoading: boolean;
    isWorkoutPlanGenerating: boolean;
    isMealPlanLoading: boolean;
    isCyclePatternInsightLoading: boolean;
    
    cycleInsight: CycleFocusInsight | null;
    setCycleInsight: (insight: CycleFocusInsight | null) => void;
    cyclePatternInsight: CyclePatternInsight | null;
    setCyclePatternInsight: (insight: CyclePatternInsight | null) => void;

    logMeal: (meal: Omit<Meal, 'id' | 'userId'>) => Promise<void>;
    removeMeal: (mealId: string) => void;
    logWorkout: (workout: Omit<Workout, 'id' | 'userId'>) => void;
    logWeight: (weight: number) => void;
    logDailyEntry: (log: Omit<DailyLog, 'id' | 'userId' | 'date'>, date: string) => Promise<void>;
    logJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>, date: string) => Promise<JournalEntry>;
    addChallenge: (challengeData: Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>) => Promise<void>;
    addAchievements: (newAchievements: Achievement[]) => void;
    generateAndSaveWorkoutPlan: () => Promise<void>;
    generateAndSetWeeklyMealPlan: () => Promise<void>;
    markWorkoutAsComplete: (day: number) => Promise<void>;
    markMealAsLogged: (dayOfWeek: string, mealType: keyof Pick<MealPlanDay, 'breakfast' | 'lunch' | 'dinner' | 'snack'>) => Promise<void>;
    completeOnboarding: (profileData: Omit<UserProfile, 'id' | 'email'>) => Promise<void>;
    updateUserProfile: (profileData: UserProfile) => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const auth = useAuth();
    const nutrition = useNutrition();
    const fitness = useFitness();
    const wellness = useWellness();
    const journal = useJournal();
    const community = useCommunity();

    const value: UserContextType = {
        // Auth
        session: auth.session,
        user: auth.user,
        isLoading: auth.isLoading,
        isOnboardingComplete: auth.isOnboardingComplete,
        completeOnboarding: auth.completeOnboarding,
        updateUserProfile: auth.updateUserProfile,
        logout: auth.logout,

        // Nutrition
        meals: nutrition.meals,
        macros: nutrition.macros,
        weeklyMealPlan: nutrition.weeklyMealPlan,
        isMealPlanLoading: nutrition.isMealPlanLoading,
        logMeal: nutrition.logMeal,
        removeMeal: nutrition.removeMeal,
        generateAndSetWeeklyMealPlan: nutrition.generateAndSetWeeklyMealPlan,
        markMealAsLogged: nutrition.markMealAsLogged,

        // Fitness
        workoutHistory: fitness.workoutHistory,
        workoutPlan: fitness.workoutPlan,
        isWorkoutPlanGenerating: fitness.isWorkoutPlanGenerating,
        logWorkout: fitness.logWorkout,
        generateAndSaveWorkoutPlan: fitness.generateAndSaveWorkoutPlan,
        markWorkoutAsComplete: fitness.markWorkoutAsComplete,

        // Wellness
        weightHistory: wellness.weightHistory,
        dailyLogs: wellness.dailyLogs,
        journalEntries: journal.journalEntries,
        cycleInsight: wellness.cycleInsight,
        setCycleInsight: wellness.setCycleInsight,
        cyclePatternInsight: wellness.cyclePatternInsight,
        setCyclePatternInsight: wellness.setCyclePatternInsight,
        isCyclePatternInsightLoading: wellness.isCyclePatternInsightLoading,
        logWeight: wellness.logWeight,
        logDailyEntry: wellness.logDailyEntry,
        logJournalEntry: journal.logJournalEntry,

        // Community
        achievements: community.achievements,
        challenges: community.challenges,
        addChallenge: community.addChallenge,
        addAchievements: community.addAchievements,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};