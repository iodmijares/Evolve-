

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Use the 'Session' type from Supabase v2.
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile, Meal, Workout, DailyMacros, Macros, WeightEntry, DailyLog, CycleFocusInsight, Achievement, CyclePatternInsight, JournalEntry, WorkoutPlan, WeeklyMealPlan, Challenge, MealPlanDay, MealType } from '../types';
import { analyzeJournalEntry, generateCyclePatternInsight, generateMonthlyWorkoutPlan, generateWeeklyMealPlan } from '../services/groqService';
import staticAchievements, { checkAchievement } from '../utils/achievements';
import { cachingService } from '../utils/cachingService';
import { calculateMenstrualPhase } from '../utils/dateUtils';
import { logger } from '../utils/logger';


// Helper to calculate BMR and TDEE
const calculateTargetMacros = (user: UserProfile): Macros => {
    if (!user || !user.weight || !user.height || !user.age) {
        return { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    }
    // Harris-Benedict BMR Equation
    const bmr = user.gender === 'female'
        ? 655.1 + (9.563 * user.weight) + (1.850 * user.height) - (4.676 * user.age)
        : 66.47 + (13.75 * user.weight) + (5.003 * user.height) - (6.755 * user.age);

    const activityMultipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
    };
    const tdee = bmr * activityMultipliers[user.activityLevel];

    // Adjust TDEE based on goal
    const calorieTarget = user.goal === 'weight_loss' ? tdee - 500 : user.goal === 'muscle_gain' ? tdee + 300 : tdee;

    // Simple macro split (40% C, 30% P, 30% F) - can be more sophisticated
    const protein = (calorieTarget * 0.30) / 4;
    const carbs = (calorieTarget * 0.40) / 4;
    const fat = (calorieTarget * 0.30) / 9;

    return { calories: Math.round(calorieTarget), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
};

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
    
    // AI-generated content
    cycleInsight: CycleFocusInsight | null;
    setCycleInsight: (insight: CycleFocusInsight | null) => void;
    cyclePatternInsight: CyclePatternInsight | null;
    setCyclePatternInsight: (insight: CyclePatternInsight | null) => void;

    // Actions
    logMeal: (meal: Omit<Meal, 'id' | 'userId'>) => Promise<void>;
    removeMeal: (mealId: string) => void;
    logWorkout: (workout: Omit<Workout, 'id' | 'userId'>) => void;
    logWeight: (weight: number) => void;
    logDailyEntry: (log: Omit<DailyLog, 'id' | 'userId' | 'date'>, date: string) => void;
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

// Helper to map DB snake_case to JS camelCase
const fromDBShape = <T extends Record<string, any>>(data: any): T => {
    if (!data) return data;
    const camelCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            camelCaseData[camelKey] = data[key];
        }
    }
    return camelCaseData as T;
};

// Helper to map JS camelCase to DB snake_case for writing data
const toDBShape = (data: Record<string, any>): Record<string, any> => {
    if (!data) return data;
    const snakeCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = data[key];
        }
    }
    return snakeCaseData;
};


export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>(staticAchievements);
    const [earnedAchievementIds, setEarnedAchievementIds] = useState<Set<string>>(new Set());
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
    const [weeklyMealPlan, setWeeklyMealPlan] = useState<WeeklyMealPlan | null>(null);
    const [macros, setMacros] = useState<DailyMacros>({ target: { calories: 0, protein: 0, carbs: 0, fat: 0 }, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isWorkoutPlanGenerating, setIsWorkoutPlanGenerating] = useState(false);
    const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);

    // AI Insights State
    const [cycleInsight, setCycleInsight] = useState<CycleFocusInsight | null>(null);
    const [cyclePatternInsight, setCyclePatternInsight] = useState<CyclePatternInsight | null>(null);
    const [isCyclePatternInsightLoading, setIsCyclePatternInsightLoading] = useState(false);
    
    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    const clearUserState = useCallback(async () => {
        setUser(null);
        setSession(null);
        setMeals([]);
        setWorkoutHistory([]);
        setWeightHistory([]);
        setDailyLogs([]);
        setJournalEntries([]);
        setMacros({ target: { calories: 0, protein: 0, carbs: 0, fat: 0 }, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
        setAchievements([]);
        setEarnedAchievementIds(new Set());
        setCycleInsight(null);
        setCyclePatternInsight(null);
        setWorkoutPlan(null);
        setWeeklyMealPlan(null);
        setChallenges([]);
        setIsOnboardingComplete(false);
    }, []);     const persistCycleInsight = (insight: CycleFocusInsight | null) => {
        setCycleInsight(insight);
        const key = getCacheKey('cycle_insight');
        if (key) {
            if (insight) cachingService.set(key, insight);
            else cachingService.clear(key);
        }
    };
     const persistCyclePatternInsight = (insight: CyclePatternInsight | null) => {
        setCyclePatternInsight(insight);
        const key = getCacheKey('cycle_pattern_insight');
        if (key) {
            if (insight) cachingService.set(key, insight);
            else cachingService.clear(key);
        }
    };
    
    // This authoritative hook manages the user session and all associated data loading.
    // It's the single source of truth for the user's state, preventing race conditions.
    useEffect(() => {
        let mounted = true;
        
        const initializeAuth = async () => {
            try {
                // Get initial session immediately
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (!mounted) return;
                
                setSession(initialSession);
                
                if (!initialSession) {
                    await clearUserState();
                    setIsLoading(false);
                    return;
                }
                
                // Load user data for initial session
                await loadUserData(initialSession);
                setIsLoading(false);
            } catch (error) {
                logger.error('Error initializing auth', error, { context: 'UserContext' });
                if (mounted) {
                    await clearUserState();
                    setIsLoading(false);
                }
            }
        };
        
        const loadUserData = async (currentSession: Session) => {
            if (!currentSession) return;

            const userId = currentSession.user.id;
            
            // Try to get profile from cache first
            const profileCacheKey = `evolve_${userId}_profile`;
            let userProfile: UserProfile | null = await cachingService.get<UserProfile>(profileCacheKey, 5 * 60 * 1000); // 5 min cache
            
            if (!userProfile) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles').select('*').eq('id', userId).single();

                if (profileError || !profileData) {
                    logger.error('Error loading profile', profileError, { context: 'UserContext', data: { userId } });
                    await clearUserState();
                    setUser({ id: userId, email: currentSession.user.email! } as UserProfile);
                    setIsOnboardingComplete(false);
                    return; // Don't set loading to false here - let caller handle it
                }
                
                userProfile = { ...fromDBShape(profileData), id: profileData.id, email: currentSession.user.email! } as UserProfile;
                await cachingService.set(profileCacheKey, userProfile);
            }
            
            if (!userProfile) {
                logger.warn('No user profile found', { context: 'UserContext', data: { userId } });
                return; // Don't set loading to false here - let caller handle it
            }
            
            setUser(userProfile);
            setIsOnboardingComplete(!!userProfile.onboardingDate);

            if (userProfile.onboardingDate) {
                const today = new Date().toISOString().split('T')[0];
                
                try {
                    // Load data with cache fallback
                    const [mealsRes, workoutsRes, weightRes, dailyLogsRes, journalRes, workoutPlanRes, mealPlanRes, earnedRes, challengesRes] = await Promise.all([
                    cachingService.getOrSet(
                        `evolve_${userId}_meals_${today}`,
                        10 * 60 * 1000,
                        async () => await supabase.from('meals').select('*').eq('user_id', userId).eq('date', today)
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_workout_history`,
                        30 * 60 * 1000,
                        async () => await supabase.from('workouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_weight_history`,
                        30 * 60 * 1000,
                        async () => await supabase.from('weight_logs').select('*').eq('user_id', userId).order('date', { ascending: true })
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_daily_logs`,
                        15 * 60 * 1000,
                        async () => await supabase.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90)
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_journal_entries`,
                        15 * 60 * 1000,
                        async () => await supabase.from('journal_entries').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50)
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_workout_plan`,
                        60 * 60 * 1000,
                        async () => await supabase.from('workout_plans').select('plan').eq('user_id', userId).maybeSingle()
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_meal_plan`,
                        60 * 60 * 1000,
                        async () => await supabase.from('meal_plans').select('plan').eq('user_id', userId).maybeSingle()
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_earned_achievements`,
                        30 * 60 * 1000,
                        async () => await supabase.from('earned_achievements').select('achievement_id').eq('user_id', userId)
                    ),
                    cachingService.getOrSet(
                        `evolve_${userId}_challenges`,
                        15 * 60 * 1000,
                        async () => await supabase.from('challenges').select('*').eq('user_id', userId).order('created_at', { ascending: false })
                    ),
                ]);

                    if (mealsRes?.data) {
                        const finalMeals: Meal[] = mealsRes.data.map(m => fromDBShape({ ...m, macros: { calories: m.calories || 0, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0 } }));
                        setMeals(finalMeals);
                    }
                    if (workoutsRes?.data) setWorkoutHistory(workoutsRes.data.map(fromDBShape<Workout>));
                    if (weightRes?.data) setWeightHistory(weightRes.data.map(fromDBShape<WeightEntry>));
                    if (dailyLogsRes?.data) setDailyLogs(dailyLogsRes.data.map(fromDBShape<DailyLog>));
                    if (journalRes?.data) setJournalEntries(journalRes.data.map(fromDBShape<JournalEntry>));
                    if (workoutPlanRes?.data) setWorkoutPlan(workoutPlanRes.data.plan as WorkoutPlan);
                    if (mealPlanRes?.data) setWeeklyMealPlan(mealPlanRes.data.plan as WeeklyMealPlan);
                    if (earnedRes?.data) setEarnedAchievementIds(new Set(earnedRes.data.map((a: any) => a.achievement_id)));
                    if (challengesRes?.data) setChallenges(challengesRes.data.map(fromDBShape<Challenge>));
                } catch (dataError) {
                    logger.error('Error loading user data', dataError, { context: 'UserContext' });
                    // Continue anyway - we have the user profile
                }
            }
            
            logger.info('User data loaded successfully', { context: 'UserContext', data: { userId, hasOnboarding: !!userProfile?.onboardingDate } });
        };
        
        // Initialize on mount
        initializeAuth();
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (!mounted) return;
            
            logger.debug('Auth state changed', { context: 'UserContext', data: { event: _event, hasSession: !!currentSession } });
            setSession(currentSession);

            if (!currentSession) {
                await clearUserState();
                setIsLoading(false);
            } else {
                setIsLoading(true);
                await loadUserData(currentSession);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);
    
    useEffect(() => {
        if (user) {
            const target = calculateTargetMacros(user);
            const consumed = meals.reduce((acc, meal) => ({
                calories: acc.calories + (meal.macros?.calories || 0),
                protein: acc.protein + (meal.macros?.protein || 0),
                carbs: acc.carbs + (meal.macros?.carbs || 0),
                fat: acc.fat + (meal.macros?.fat || 0),
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            setMacros({ target, consumed });
        }
    }, [user, meals]);
    
    useEffect(() => {
        const fetchPatternInsight = async () => {
            if (user && user.gender === 'female' && dailyLogs.length > 5 && !cyclePatternInsight) {
                const key = getCacheKey('cycle_pattern_insight');
                if (key) {
                    const cachedInsight = await cachingService.get<CyclePatternInsight>(key, 24 * 60 * 60 * 1000); // 24h TTL
                    if (cachedInsight) {
                        setCyclePatternInsight(cachedInsight);
                        return;
                    }
                }
                setIsCyclePatternInsightLoading(true);
                try {
                    const insight = await generateCyclePatternInsight(user, dailyLogs);
                    persistCyclePatternInsight(insight);
                } catch (error) {
                    console.error("Failed to generate cycle pattern insight:", error);
                } finally {
                    setIsCyclePatternInsightLoading(false);
                }
            }
        };
        fetchPatternInsight();
    }, [user, dailyLogs, cyclePatternInsight, getCacheKey]);

    const checkAndLogAchievements = useCallback(async () => {
        if (!user) return;
        const dataForCheck = { user, meals, workoutHistory, dailyLogs, isOnboardingComplete };
        const newlyEarned: Achievement[] = staticAchievements.filter(ach => !earnedAchievementIds.has(ach.id) && checkAchievement(ach, dataForCheck));
    
        if (newlyEarned.length > 0) {
            const achievementsToLog = newlyEarned.map(ach => ({ user_id: user.id, achievement_id: ach.id, earned_at: new Date().toISOString() }));
            const { error } = await supabase.from('earned_achievements').upsert(achievementsToLog, { onConflict: 'user_id, achievement_id', ignoreDuplicates: true });
    
            if (!error) {
                setEarnedAchievementIds(prev => {
                    const newSet = new Set(prev);
                    newlyEarned.forEach(ach => newSet.add(ach.id));
                    const key = getCacheKey('earned_achievements');
                    if (key) cachingService.set(key, Array.from(newSet));
                    return newSet;
                });
            } else {
                console.error("Error logging achievements:", error.message, error.details);
            }
        }
    }, [user, meals, workoutHistory, dailyLogs, isOnboardingComplete, earnedAchievementIds, getCacheKey]);

    useEffect(() => { checkAndLogAchievements(); }, [checkAndLogAchievements]);

    const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'userId'>) => {
        if (!user) return;
        
        const { macros, ...mealData } = meal;
        const mealToInsert = {
            ...mealData,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            userId: user.id,
            date: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await supabase.from('meals').insert(toDBShape(mealToInsert)).select().single();
        if (!error && data) {
            const shaped = fromDBShape<any>(data);
            const newMeal: Meal = {
                ...shaped,
                macros: {
                    calories: shaped.calories ?? 0,
                    protein: shaped.protein ?? 0,
                    carbs: shaped.carbs ?? 0,
                    fat: shaped.fat ?? 0,
                }
            };
            setMeals(prev => {
                const updatedMeals = [...prev, newMeal];
                const key = getCacheKey('meals_today');
                if(key) cachingService.set(key, updatedMeals);
                return updatedMeals;
            });
        } else {
            console.error("Error logging meal:", error?.message, error?.details);
        }
    }, [user, getCacheKey]);

    const removeMeal = useCallback(async (mealId: string) => {
        const { error } = await supabase.from('meals').delete().eq('id', mealId);
        if (error) console.error("Error removing meal:", error.message, error.details);
        else setMeals(prev => {
            const updatedMeals = prev.filter(m => m.id !== mealId);
            const key = getCacheKey('meals_today');
            if(key) cachingService.set(key, updatedMeals);
            return updatedMeals;
        });
    }, [getCacheKey]);

    const logWorkout = useCallback(async (workout: Omit<Workout, 'id' | 'userId'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('workouts').insert(toDBShape({ ...workout, userId: user.id })).select().single();
        if (error) console.error("Error logging workout:", error.message, error.details);
        else {
            setWorkoutHistory(prev => {
                const updatedHistory = [fromDBShape<Workout>(data), ...prev];
                const key = getCacheKey('workout_history');
                if(key) cachingService.set(key, updatedHistory);
                return updatedHistory;
            });
        }
    }, [user, getCacheKey]);

    const updateUserProfile = useCallback(async (profileData: UserProfile) => {
        if (!user) throw new Error("No user to update");
        const { id, email, ...updateData } = profileData;
        const { error } = await supabase.from('profiles').update(toDBShape(updateData)).eq('id', user.id);
        if (error) throw error;
        setUser(profileData);
        const key = getCacheKey('profile');
        if(key) cachingService.set(key, profileData);
    }, [user, getCacheKey]);

    const logWeight = useCallback(async (weight: number) => {
        if (!user) return;
        const date = new Date().toISOString().split('T')[0];
        const newEntry = { userId: user.id, date, weight };
        const { data, error } = await supabase.from('weight_logs').upsert(toDBShape(newEntry), { onConflict: 'user_id, date' }).select().single();
        if (error) { console.error("Error logging weight:", error.message, error.details); return; }
        await updateUserProfile({ ...user, weight });
        setWeightHistory(prev => {
            const existingIndex = prev.findIndex(e => e.date === date);
            const newEntryShaped = fromDBShape<WeightEntry>(data);
            const updatedHistory = existingIndex > -1 ? [...prev] : [...prev, newEntryShaped];
            if(existingIndex > -1) updatedHistory[existingIndex] = newEntryShaped;
            const sorted = updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const key = getCacheKey('weight_history');
            if(key) cachingService.set(key, sorted);
            return sorted;
        });
    }, [user, updateUserProfile, getCacheKey]);

     const logDailyEntry = useCallback(async (log: Omit<DailyLog, 'id' | 'userId' | 'date'>, date: string) => {
        if (!user) return;
        const { data, error } = await supabase.from('daily_logs').upsert(toDBShape({ ...log, userId: user.id, date }), { onConflict: 'user_id, date' }).select().single();
        if (error) { console.error("Error logging daily entry:", error.message, error.details); return; }
        
        // If user marked they have their period, update their lastPeriodStartDate
        if (log.hasPeriod && user.gender === 'female') {
            const currentLastPeriod = user.lastPeriodStartDate ? new Date(user.lastPeriodStartDate) : null;
            const logDate = new Date(date);
            
            // Only update if this is a more recent period start date
            if (!currentLastPeriod || logDate > currentLastPeriod) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ last_period_start_date: date })
                    .eq('id', user.id);
                
                if (!updateError) {
                    setUser(prev => prev ? { ...prev, lastPeriodStartDate: date } : null);
                    console.log('🩸 Menstrual cycle recalibrated with new period start date:', date);
                    // Clear cycle insights cache so they regenerate with new dates
                    const insightKey = getCacheKey('cycle_insight');
                    if (insightKey) cachingService.clear(insightKey);
                    setCycleInsight(null);
                } else {
                    console.error('Error updating period start date:', updateError);
                }
            }
        }
        
        setDailyLogs(prev => {
            const existingIndex = prev.findIndex(l => l.date === date);
            const newEntryShaped = fromDBShape<DailyLog>(data);
            const updatedLogs = existingIndex > -1 ? [...prev] : [newEntryShaped, ...prev];
            if (existingIndex > -1) updatedLogs[existingIndex] = newEntryShaped;
            const sorted = updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const key = getCacheKey('daily_logs');
            if(key) cachingService.set(key, sorted);
            return sorted;
        });
    }, [user, getCacheKey]);

    const logJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>, date: string): Promise<JournalEntry> => {
        if (!user) throw new Error("User not logged in");
        let newEntryData: Omit<JournalEntry, 'id'> = { ...entry, userId: user.id, date };
        const { data: savedData, error } = await supabase.from('journal_entries').upsert(toDBShape(newEntryData), { onConflict: 'user_id, date' }).select().single();
        if (error || !savedData) throw new Error("Could not save journal entry.");
        const savedEntry = fromDBShape<JournalEntry>(savedData);
        const displayName = user.username || user.name;
        analyzeJournalEntry(savedEntry, displayName).then(async analysis => {
            const { data: finalData, error: updateError } = await supabase.from('journal_entries').update(analysis).eq('id', savedEntry.id).select().single();
            if (updateError || !finalData) return;
            const finalEntryShaped = fromDBShape<JournalEntry>(finalData);
            setJournalEntries(prev => {
                const updated = prev.map(e => e.id === finalEntryShaped.id ? finalEntryShaped : e);
                const key = getCacheKey('journal_entries');
                if (key) cachingService.set(key, updated);
                return updated;
            });
        });
        setJournalEntries(prev => {
            const existingIndex = prev.findIndex(e => e.date === date);
            const updated = existingIndex > -1 ? [...prev] : [savedEntry, ...prev];
            if (existingIndex > -1) updated[existingIndex] = savedEntry;
            const sorted = updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const key = getCacheKey('journal_entries');
            if (key) cachingService.set(key, sorted);
            return sorted;
        });
        return savedEntry;
    }, [user, getCacheKey]);

    const addChallenge = useCallback(async (challengeData: Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>) => {
        if (!user) throw new Error("User not logged in");
        const newChallenge = { ...challengeData, userId: user.id, progress: 0, isCompleted: false, createdAt: new Date().toISOString() };
        const { data, error } = await supabase.from('challenges').insert(toDBShape(newChallenge)).select().single();
        if (error) throw error;
        if (data) {
            setChallenges(prev => [fromDBShape<Challenge>(data), ...prev]);
            const key = getCacheKey('challenges');
            if(key) cachingService.clear(key);
        }
    }, [user, getCacheKey]);

    const addAchievements = useCallback((newAchievements: Achievement[]) => {
        setAchievements(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const uniqueNew = newAchievements.filter(a => !existingIds.has(a.id));
            return [...prev, ...uniqueNew];
        });
    }, []);
    
    const generateAndSaveWorkoutPlan = useCallback(async () => {
        if (!user || isWorkoutPlanGenerating) return;
        
        // Check if current plan exists and is completed
        if (workoutPlan) {
            const completedCount = workoutPlan.filter(day => day.isCompleted).length;
            const workoutDays = workoutPlan.filter(day => day.type === 'workout').length;
            
            // Only regenerate if all workout days are completed (30-day plan finished)
            if (completedCount < workoutDays) {
                console.log(`🏋️ Workout plan in progress: ${completedCount}/${workoutDays} workouts completed`);
                return;
            }
            
            console.log("🎉 All workouts completed! Generating new 30-day plan...");
        }
        
        setIsWorkoutPlanGenerating(true);
        try {
            console.log("🏋️ Generating workout plan for user:", user.name);
            const plan = await generateMonthlyWorkoutPlan(user);
            console.log("✅ Workout plan generated successfully:", plan.length, "days");
            const { error } = await supabase.from('workout_plans').upsert({ user_id: user.id, plan: plan }, { onConflict: 'user_id' });
            if (error) {
                console.error("❌ Supabase error saving workout plan:", error);
                throw error;
            }
            setWorkoutPlan(plan);
            const key = getCacheKey('workout_plan');
            if (key) cachingService.set(key, plan);
        } catch (err) {
            console.error("❌ Error generating workout plan:", err);
            console.error("Error details:", (err as any).status, (err as Error).message);
            throw err;
        } finally { setIsWorkoutPlanGenerating(false); }
    }, [user, isWorkoutPlanGenerating, workoutPlan, getCacheKey]);

    const generateAndSetWeeklyMealPlan = useCallback(async () => {
        if (!user || isMealPlanLoading) return;
        setIsMealPlanLoading(true);
        try {
            // Enhanced personalization using menstrual cycle phase
            const phaseData = user.gender === 'female' && user.lastPeriodStartDate && user.cycleLength
                ? calculateMenstrualPhase(user.lastPeriodStartDate, user.cycleLength)
                : null;
            
            const plan = await generateWeeklyMealPlan(user, macros, phaseData?.phase);
            const { error } = await supabase.from('meal_plans').upsert({ user_id: user.id, plan: plan }, { onConflict: 'user_id' });
            if (error) throw error;
            setWeeklyMealPlan(plan);
            const key = getCacheKey('weekly_meal_plan');
            if (key) cachingService.set(key, plan);
        } catch (err) {
            console.error("Error generating meal plan:", (err as Error).message || err); throw err;
        } finally { setIsMealPlanLoading(false); }
    }, [user, macros, isMealPlanLoading, getCacheKey]);

    const markWorkoutAsComplete = useCallback(async (day: number) => {
        if (!user || !workoutPlan) return;
        const originalPlan = [...workoutPlan];
        const updatedPlan = workoutPlan.map(planDay => planDay.day === day ? { ...planDay, isCompleted: true } : planDay);
        setWorkoutPlan(updatedPlan);
        const key = getCacheKey('workout_plan');
        if (key) cachingService.set(key, updatedPlan);
        const { error } = await supabase.from('workout_plans').update({ plan: updatedPlan }).eq('user_id', user.id);
        if (error) {
            console.error("Error updating workout completion:", error);
            setWorkoutPlan(originalPlan); 
            if (key) cachingService.set(key, originalPlan);
            throw error;
        }
    }, [user, workoutPlan, getCacheKey]);

    const markMealAsLogged = useCallback(async (dayOfWeek: string, mealType: keyof Pick<MealPlanDay, 'breakfast' | 'lunch' | 'dinner' | 'snack'>) => {
        if (!user || !weeklyMealPlan) return;

        const originalPlan = [...weeklyMealPlan];
        const updatedPlan = JSON.parse(JSON.stringify(weeklyMealPlan)) as WeeklyMealPlan;
        const dayIndex = updatedPlan.findIndex(d => d.dayOfWeek === dayOfWeek);
        if (dayIndex === -1) return;
        
        const mealToUpdate = updatedPlan[dayIndex][mealType];
        if (!mealToUpdate || mealToUpdate.isLogged) return;

        // Convert MealPlanMeal to a loggable Meal for daily tracking
        const { isLogged, ...mealData } = mealToUpdate;
        const mealToLog: Omit<Meal, 'id' | 'userId'> = {
            name: mealData.name,
            macros: mealData.macros,
            mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1) as MealType,
            ingredients: mealData.ingredients,
            instructions: mealData.instructions,
        };
        await logMeal(mealToLog);
        
        // Update the plan state
        mealToUpdate.isLogged = true;
        setWeeklyMealPlan(updatedPlan);

        // Persist to cache and DB
        const key = getCacheKey('weekly_meal_plan');
        if (key) cachingService.set(key, updatedPlan);
        
        const { error } = await supabase.from('meal_plans').update({ plan: updatedPlan }).eq('user_id', user.id);
        
        if (error) {
            console.error("Error updating meal plan completion:", error);
            setWeeklyMealPlan(originalPlan);
            if (key) cachingService.set(key, originalPlan);
            throw error;
        }
    }, [user, weeklyMealPlan, logMeal, getCacheKey]);

    const completeOnboarding = useCallback(async (profileData: Omit<UserProfile, 'id' | 'email'>) => {
        if (!session?.user) throw new Error("No active session");
        const profileToUpsert = toDBShape({ id: session.user.id, ...profileData, onboardingDate: new Date().toISOString() });
        const { data, error } = await supabase.from('profiles').upsert(profileToUpsert).select().single();
        if (error || !data) throw error || new Error("Failed to save profile during onboarding.");
        const fullProfile: UserProfile = { ...fromDBShape(data), email: session.user.email! };
        setUser(fullProfile);
        setIsOnboardingComplete(true);
        cachingService.set(`evolve_${fullProfile.id}_profile`, fullProfile);

        (async () => {
            setIsWorkoutPlanGenerating(true);
            try {
                const plan = await generateMonthlyWorkoutPlan(fullProfile);
                await supabase.from('workout_plans').upsert({ user_id: fullProfile.id, plan }, { onConflict: 'user_id' });
                setWorkoutPlan(plan);
                cachingService.set(`evolve_${fullProfile.id}_workout_plan`, plan);
            } catch (err: any) { console.error("Background workout plan generation failed:", err.message || err);
            } finally { setIsWorkoutPlanGenerating(false); }
        })();
    }, [session]);
    
    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
        }
        // State clearing is handled by the onAuthStateChange listener.
    };

    const value = {
        session, user, meals, workoutHistory, weightHistory, dailyLogs, journalEntries, macros, achievements, challenges, workoutPlan,
        weeklyMealPlan, isOnboardingComplete, isLoading, isWorkoutPlanGenerating: isWorkoutPlanGenerating, isMealPlanLoading, isCyclePatternInsightLoading,
        cycleInsight, setCycleInsight: persistCycleInsight,
        cyclePatternInsight, setCyclePatternInsight: persistCyclePatternInsight,
        logMeal, removeMeal, logWorkout, logWeight, logDailyEntry, logJournalEntry, addChallenge, addAchievements, generateAndSaveWorkoutPlan, generateAndSetWeeklyMealPlan, markWorkoutAsComplete, markMealAsLogged, completeOnboarding, updateUserProfile, logout,
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