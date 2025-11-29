import { supabase } from './supabaseClient';
import { 
    DailyMacros,
    DailyLog, 
    MenstrualPhase, 
    CycleFocusInsight, 
    CyclePatternInsight, 
    Achievement, 
    JournalEntry, 
    WorkoutPlan, 
    WeeklyMealPlan, 
    Challenge, 
    UserProfile
} from '../types';

export interface CommunityInsight {
    title: string;
    description: string;
    statValue: string;
    statLabel: string;
    trendDirection: 'up' | 'down' | 'stable';
}

// Request deduplication - prevent duplicate concurrent calls
const pendingRequests = new Map<string, Promise<any>>();

const deduplicate = async <T>(key: string, factory: () => Promise<T>): Promise<T> => {
    if (pendingRequests.has(key)) {
        console.log(`⚡ Deduplicating request: ${key}`);
        return pendingRequests.get(key) as Promise<T>;
    }
    
    const promise = factory().finally(() => {
        pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, promise);
    return promise;
};

const invokeAiService = async <T>(action: string, payload: any): Promise<T> => {
    const { data, error } = await supabase.functions.invoke('ai-service', {
        body: { action, payload }
    });

    if (error) {
        console.error(`❌ Error calling AI service for ${action}:`, error);
        throw new Error(error.message || "Failed to connect to AI service");
    }

    if (!data) {
        throw new Error(`AI service returned no data for ${action}`);
    }

    // If the function returns an error object inside the data (custom error handling)
    if (data.error) {
        throw new Error(data.error);
    }

    return data as T;
};

export const generateCycleInsight = async (phase: MenstrualPhase, _dailyLogs: DailyLog[], userId?: string): Promise<CycleFocusInsight> => {
    const dedupeKey = `cycle_insight_${phase}_${userId || 'anonymous'}`;
    
    return deduplicate(dedupeKey, async () => {
        // Check rate limit if userId provided
        if (userId) {
            const { aiTextLimiter, formatResetTime } = await import('../utils/rateLimiter');
            const rateLimit = await aiTextLimiter.checkLimit(userId);
            if (!rateLimit.allowed) {
                throw new Error(`Rate limit exceeded. Please try again in ${formatResetTime(rateLimit.resetTime)}.`);
            }
        }

        return invokeAiService<CycleFocusInsight>('generateCycleInsight', { phase });
    });
};

// Cache for symptom suggestions (static per phase)
const symptomCache = new Map<MenstrualPhase, { data: string[]; timestamp: number }>();
const SYMPTOM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const generateSymptomSuggestions = async (phase: MenstrualPhase): Promise<string[]> => {
    // Check cache first - symptoms per phase don't change often
    const cached = symptomCache.get(phase);
    if (cached && Date.now() - cached.timestamp < SYMPTOM_CACHE_TTL) {
        console.log(`⚡ Using cached symptoms for ${phase}`);
        return cached.data;
    }
    
    const dedupeKey = `symptom_suggestions_${phase}`;
    
    return deduplicate(dedupeKey, async () => {
        const symptoms = await invokeAiService<string[]>('generateSymptomSuggestions', { phase });
        // Cache the result
        symptomCache.set(phase, { data: symptoms, timestamp: Date.now() });
        return symptoms;
    });
};

export const generateCyclePatternInsight = async (user: UserProfile, dailyLogs: DailyLog[]): Promise<CyclePatternInsight> => {
    const dedupeKey = `cycle_pattern_${user.id}_${dailyLogs.length}`;
    
    return deduplicate(dedupeKey, async () => {
        try {
            return await invokeAiService<CyclePatternInsight>('generateCyclePatternInsight', { user, dailyLogs });
        } catch (error: any) {
            console.error('Error generating cycle pattern insight:', error);
            throw error;
        }
    });
};

export const generateDynamicAchievements = async (user: UserProfile, completedAchievementIds: string[]): Promise<Omit<Achievement, 'isAiGenerated'>[]> => {
    return invokeAiService<Omit<Achievement, 'isAiGenerated'>[]>('generateDynamicAchievements', { user, completedAchievementIds });
};

export const analyzeJournalEntry = async (entry: JournalEntry, userName?: string): Promise<Pick<JournalEntry, 'summary' | 'themes' | 'suggestion'>> => {
    return invokeAiService<Pick<JournalEntry, 'summary' | 'themes' | 'suggestion'>>('analyzeJournalEntry', { entry, userName });
};

export const generateMonthlyWorkoutPlan = async (user: UserProfile): Promise<WorkoutPlan> => {
    const dedupeKey = `workout_plan_${user.id}_${user.goal}_${user.activityLevel}`;
    
    return deduplicate(dedupeKey, async () => {
        try {
            console.log('🏋️ Generating workout plan for user:', user.name);
            const plan = await invokeAiService<{ plan: WorkoutPlan } | WorkoutPlan>('generateMonthlyWorkoutPlan', { user });
            // Handle case where AI returns wrapped object or direct object (function normalized it to parsed JSON, but let's be safe)
            // The server returns exactly what prompt asked for. 
            // For workout plan, the prompt asks for { "plan": [...] }
            if ('plan' in plan) {
                return plan.plan as WorkoutPlan;
            }
            return plan as WorkoutPlan;
        } catch (error: any) {
            console.error('❌ Error generating workout plan:', error);
            throw error;
        }
    });
};

export const generateWeeklyMealPlan = async (user: UserProfile, macros: DailyMacros, phase?: MenstrualPhase): Promise<WeeklyMealPlan> => {
    const dedupeKey = `meal_plan_${user.id}_${user.goal}_${phase || 'none'}_${macros.target.calories}`;
    
    return deduplicate(dedupeKey, async () => {
        try {
            console.log('🍽️ Generating meal plan for user:', user.name, 'Phase:', phase);
            const plan = await invokeAiService<{ plan: WeeklyMealPlan } | WeeklyMealPlan>('generateWeeklyMealPlan', { user, macros, phase });
             if ('plan' in plan) {
                return plan.plan as WeeklyMealPlan;
            }
            return plan as WeeklyMealPlan;
        } catch (error: any) {
            console.error('❌ Error generating meal plan:', error);
            throw error;
        }
    });
};

export const generatePersonalChallenge = async (idea: string, user: UserProfile): Promise<Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>> => {
    return invokeAiService<Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>>('generatePersonalChallenge', { idea, user });
};

export const generateCommunityInsight = async (workoutData: { date: string; count: number; type: string }[]): Promise<CommunityInsight> => {
    try {
        return await invokeAiService<CommunityInsight>('generateCommunityInsight', { workoutData });
    } catch (error) {
        console.error("Error in generateCommunityInsight:", error);
        // Return a fallback insight
        return {
            title: "Growing Together",
            description: "The community is staying active and motivated! Keep logging your workouts to inspire others.",
            statValue: `${workoutData.length}`,
            statLabel: "Days of community activity",
            trendDirection: "up"
        };
    }
};
