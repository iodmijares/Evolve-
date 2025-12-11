import { supabase } from './supabaseClient';
import Groq from 'groq-sdk';
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

// Helper to parse JSON robustly
const parseJsonResponse = (jsonString: string, context: string) => {
    try {
        let cleanedString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
        cleanedString = cleanedString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
        const jsonMatch = cleanedString.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) cleanedString = jsonMatch[0];
        
        // Basic cleanup
        cleanedString = cleanedString
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}[\]:,])\s*/g, '$1')
            .replace(/"\s*:\s*/g, '":')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

        return JSON.parse(cleanedString);
    } catch (error) {
        console.error(`Error parsing JSON for ${context}:`, error);
        throw new Error(`AI returned invalid format for ${context}`);
    }
};

// Direct Groq client for fallback
const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_GROQ_API_KEY is not set. Please add it to your .env file.');
    }
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// Build prompts for each action
const buildPrompt = (action: string, payload: any): { prompt: string; model: string; max_tokens: number; temperature: number } => {
    let prompt = '';
    let model = 'llama-3.3-70b-versatile';
    let max_tokens = 1000;
    let temperature = 0.7;

    switch (action) {
        case 'generateCycleInsight': {
            const { phase } = payload;
            prompt = `You are a women's health expert. Based on the user being in the ${phase} phase of their menstrual cycle, provide a "Daily Focus" insight in JSON format.

Return ONLY valid JSON with this exact structure:
{
    "summary": "A brief, empowering summary of the current phase",
    "energyPrediction": "A friendly prediction of their likely energy levels",
    "nutritionTip": "A specific, actionable nutrition tip for this phase",
    "mindfulnessSuggestion": "A simple mindfulness or self-care activity"
}

Keep the tone supportive and informative.`;
            max_tokens = 500;
            break;
        }

        case 'generateSymptomSuggestions': {
            const { phase } = payload;
            prompt = `List 3-4 common symptoms a person might experience during the ${phase} phase of their menstrual cycle. Return ONLY a JSON array of strings. Example: ["symptom1", "symptom2", "symptom3"]`;
            model = 'llama-3.1-8b-instant';
            max_tokens = 200;
            temperature = 0.5;
            break;
        }

        case 'generateCyclePatternInsight': {
            const { user, dailyLogs } = payload;
            prompt = `Analyze the user's daily logs to find a recurring pattern related to their menstrual cycle.
    
User profile: Goal: ${user.goal}, Activity: ${user.activityLevel}
Recent logs (mood and symptoms): ${JSON.stringify(dailyLogs.slice(0, 10))}

Return ONLY valid JSON with this exact structure:
{
    "title": "A catchy title for the insight (e.g., 'Pre-Period Energy Dip')",
    "patternDetail": "A sentence describing the pattern found in the data",
    "suggestion": "A single, actionable suggestion to help manage this pattern"
}

Be specific but gentle.`;
            max_tokens = 400;
            break;
        }

        case 'generateDynamicAchievements': {
            const { user, completedAchievementIds } = payload;
            prompt = `Generate 3 new, personalized wellness achievements for a user.
User Goal: ${user.goal}, Activity Level: ${user.activityLevel}
Already completed IDs: ${JSON.stringify(completedAchievementIds)}

Return ONLY a JSON array with this structure:
[
    { "id": "unique_id_1", "title": "Achievement Title", "description": "How to earn it", "type": "nutrition|fitness|wellness|cycle", "targetValue": 5, "unit": "days" },
    ...
]

Make them motivating, achievable in 1-4 weeks, and specific to the user's goal.`;
            max_tokens = 800;
            break;
        }

        case 'analyzeJournalEntry': {
            const { entry, userName } = payload;
            const name = userName || 'there';
            prompt = `You are a compassionate wellness companion. Read this journal entry and provide ONE gentle, practical suggestion that could genuinely help.

Journal entry: "${entry.content}"
Current mood: ${entry.mood}, Energy level: ${entry.energy}

Respond with ONLY valid JSON:
{
    "summary": "",
    "themes": [],
    "suggestion": "Your helpful message here"
}

For the suggestion:
- Address them warmly as "${name}"
- Acknowledge their feelings first
- Offer ONE specific, actionable thing they could try (e.g., a breathing exercise, journaling prompt, small self-care act, or reframe)
- Keep it 2-3 sentences, warm and conversational
- Don't be preachy or generic - make it feel personal to what they shared
- If they're struggling, validate that it's okay to feel this way

Examples of good suggestions:
- "Hey ${name}, it sounds like that comment really stung. When self-doubt creeps in, try writing down 3 things you've accomplished this week - sometimes we need a reminder of our own strength."
- "${name}, dealing with that much stress is exhausting. Would you try a 5-minute walk outside? Fresh air can help reset your mind when everything feels heavy."`;
            max_tokens = 300;
            break;
        }

        case 'generateMonthlyWorkoutPlan': {
            const { user } = payload;
            prompt = `Create a detailed 30-day workout plan for someone with these details:
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}
- Weight: ${user.weight}kg, Height: ${user.height}cm
- Gender: ${user.gender}

Return ONLY valid JSON - an array of exactly 30 day objects. Each workout must include DETAILED exercises with step-by-step instructions.

Structure:
[
    {
        "day": 1,
        "type": "workout",
        "workout": {
            "name": "Upper Body Strength",
            "type": "strength",
            "duration": 45,
            "description": "Build upper body strength focusing on chest, shoulders, and arms",
            "warmup": "5 min light cardio (jumping jacks, arm circles, shoulder rolls)",
            "cooldown": "5 min stretching (chest stretch, shoulder stretch, tricep stretch)",
            "exercises": [
                {
                    "name": "Push-ups",
                    "sets": 3,
                    "reps": "12-15",
                    "restSeconds": 60,
                    "targetMuscles": ["chest", "triceps", "shoulders"],
                    "instructions": [
                        "Start in a high plank position with hands slightly wider than shoulder-width",
                        "Keep your body in a straight line from head to heels",
                        "Lower your chest toward the floor by bending your elbows",
                        "Push back up to the starting position",
                        "Keep core engaged throughout the movement"
                    ],
                    "tips": "If too difficult, start with knee push-ups. Keep elbows at 45-degree angle."
                },
                {
                    "name": "Dumbbell Shoulder Press",
                    "sets": 3,
                    "reps": "10-12",
                    "restSeconds": 60,
                    "targetMuscles": ["shoulders", "triceps"],
                    "instructions": [
                        "Sit or stand with dumbbells at shoulder height",
                        "Press weights overhead until arms are fully extended",
                        "Lower back to starting position with control"
                    ],
                    "tips": "Don't arch your back. Use lighter weight if needed."
                }
            ]
        }
    },
    { "day": 2, "type": "rest", "workout": null },
    ... continue for all 30 days
]

RULES:
- Include exactly 30 days (day 1 to day 30)
- Mix workout and rest days (typically 4-5 workouts per week, 2-3 rest days)
- Each workout day must have type: "workout" and a detailed workout object
- Each rest day must have type: "rest" and workout: null
- workout.name should be descriptive (e.g., "Upper Body Strength", "HIIT Cardio", "Core & Flexibility")
- workout.type should be: "strength", "cardio", "hiit", "flexibility", or "mixed"
- workout.duration in minutes (30-60)
- workout.warmup and workout.cooldown should have specific instructions
- Each workout must have 5-8 detailed exercises
- Each exercise MUST include: name, sets, reps, restSeconds, targetMuscles (array), instructions (array of steps), and tips
- Instructions should be clear step-by-step guidance (3-5 steps per exercise)
- Tips should help with form or offer modifications
- Match intensity to activity level: ${user.activityLevel}
- Align with goal: ${user.goal}
- For weight_loss: more cardio/HIIT, higher reps
- For muscle_gain: more strength training, progressive overload
- For maintenance: balanced mix of all types`;
            max_tokens = 16000;
            break;
        }

        case 'generateWeeklyMealPlan': {
            const { user, macros, phase } = payload;
            prompt = `Create a 7-day meal plan for:
- Goal: ${user.goal}
- Daily targets: ${macros.target.calories} cal, ${macros.target.protein}g protein, ${macros.target.carbs}g carbs, ${macros.target.fat}g fat
- Dietary preferences: ${user.dietaryPreferences?.length ? user.dietaryPreferences.join(', ') : 'None'}
${phase ? `- Menstrual phase: ${phase} (adjust foods accordingly)` : ''}

Return ONLY valid JSON - an array of exactly 7 day objects:
[
    {
        "dayOfWeek": "Monday",
        "breakfast": {
            "name": "Protein Oatmeal Bowl",
            "time": "7:00 AM",
            "macros": { "calories": 400, "protein": 25, "carbs": 45, "fat": 12 },
            "ingredients": ["1 cup oats", "1 scoop protein powder", "1 banana", "1 tbsp almond butter"],
            "instructions": ["Cook oats with water", "Stir in protein powder", "Top with banana and almond butter"]
        },
        "lunch": {
            "name": "Grilled Chicken Salad",
            "time": "12:30 PM",
            "macros": { "calories": 500, "protein": 40, "carbs": 30, "fat": 20 },
            "ingredients": ["6oz chicken breast", "mixed greens", "cherry tomatoes", "cucumber", "olive oil dressing"],
            "instructions": ["Grill chicken", "Combine vegetables", "Top with chicken and drizzle dressing"]
        },
        "dinner": {
            "name": "Salmon with Vegetables",
            "time": "7:00 PM",
            "macros": { "calories": 550, "protein": 35, "carbs": 40, "fat": 25 },
            "ingredients": ["6oz salmon fillet", "broccoli", "sweet potato", "olive oil"],
            "instructions": ["Bake salmon at 400F for 15 min", "Roast vegetables", "Serve together"]
        },
        "snack": {
            "name": "Greek Yogurt with Berries",
            "time": "3:30 PM",
            "macros": { "calories": 200, "protein": 15, "carbs": 20, "fat": 8 },
            "ingredients": ["1 cup Greek yogurt", "1/2 cup mixed berries", "honey"],
            "instructions": ["Mix yogurt with berries", "Drizzle honey on top"]
        },
        "dailyTotals": { "calories": 1650, "protein": 115, "carbs": 135, "fat": 65 }
    },
    ... continue for Tuesday through Sunday
]

RULES:
- Include all 7 days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- Each day MUST have: dayOfWeek, breakfast, lunch, dinner, snack, dailyTotals
- Each meal MUST have: name, time, macros (calories, protein, carbs, fat), ingredients array, instructions array
- dailyTotals should sum up all meals for that day
- Target approximately ${macros.target.calories} calories per day
- Make meals practical, varied, and delicious
- Align with goal: ${user.goal}`;
            max_tokens = 8000;
            break;
        }

        case 'generatePersonalChallenge': {
            const { idea, user } = payload;
            prompt = `Create a personal wellness challenge based on this idea: "${idea}"
User context: Goal is ${user.goal}, activity level is ${user.activityLevel}

Return ONLY valid JSON:
{
    "title": "Catchy challenge title",
    "description": "What the challenge involves (1-2 sentences)",
    "category": "nutrition|fitness|wellness|mindfulness",
    "targetDays": 7,
    "dailyTarget": "Specific daily action to complete"
}`;
            max_tokens = 400;
            break;
        }

        case 'generateCommunityInsight': {
            const { workoutData } = payload;
            prompt = `Based on this community workout data, generate an insightful trend:
${JSON.stringify(workoutData.slice(0, 20))}

Return ONLY valid JSON:
{
    "title": "Catchy 2-3 word title",
    "description": "Friendly 1-2 sentence explanation",
    "statValue": "A percentage or number (e.g., '+25%', '150+')",
    "statLabel": "What the stat represents",
    "trendDirection": "up"
}

Note: trendDirection must be exactly one of: "up", "down", or "stable"`;
            max_tokens = 500;
            break;
        }

        default:
            throw new Error(`Unknown action: ${action}`);
    }

    return { prompt, model, max_tokens, temperature };
};

// Direct API call fallback
const callGroqDirectly = async <T>(action: string, payload: any): Promise<T> => {
    const groq = getGroqClient();
    const { prompt, model, max_tokens, temperature } = buildPrompt(action, payload);

    console.log(`🔄 Calling Groq directly for ${action}...`);
    
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature,
        max_tokens,
    });

    const content = completion.choices[0]?.message?.content || '';
    if (!content) throw new Error('AI response was empty');

    let parsedData = parseJsonResponse(content, action);
    
    // Handle wrapped responses for workout/meal plans
    if (action === 'generateMonthlyWorkoutPlan' || action === 'generateWeeklyMealPlan') {
        if (parsedData && 'plan' in parsedData) {
            parsedData = parsedData.plan;
        }
    }
    
    // Transform workout plan to add isCompleted field
    if (action === 'generateMonthlyWorkoutPlan' && Array.isArray(parsedData)) {
        parsedData = parsedData.map((day: any) => ({
            ...day,
            isCompleted: false,
            workout: day.workout || null
        }));
    }
    
    return parsedData as T;
};

const invokeAiService = async <T>(action: string, payload: any): Promise<T> => {
    // First try Edge Function
    try {
        const { data, error } = await supabase.functions.invoke('ai-service', {
            body: { action, payload }
        });

        if (error) {
            // Check for errors that should trigger fallback to direct API
            const shouldFallback = 
                error.message?.includes('CORS') || 
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('Failed to send') ||
                error.message?.includes('NetworkError') ||
                error.message?.includes('non-2xx') ||
                error.message?.includes('500') ||
                error.message?.includes('Internal Server Error') ||
                error.message?.includes('FunctionsHttpError');
            
            if (shouldFallback) {
                console.warn(`⚠️ Edge Function error, falling back to direct API for ${action}`);
                return callGroqDirectly<T>(action, payload);
            }
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
    } catch (error: any) {
        // If Edge Function failed, try direct API as fallback
        const shouldFallback = 
            error.message?.includes('CORS') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Failed to send') ||
            error.message?.includes('FunctionsFetchError') ||
            error.message?.includes('FunctionsHttpError') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('non-2xx') ||
            error.message?.includes('500') ||
            error.message?.includes('Internal Server Error');
        
        if (shouldFallback) {
            console.warn(`⚠️ Edge Function failed, falling back to direct API for ${action}`);
            return callGroqDirectly<T>(action, payload);
        }
        throw error;
    }
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
            let plan = await invokeAiService<any>('generateMonthlyWorkoutPlan', { user });
            
            // Handle case where AI returns wrapped object
            if (plan && 'plan' in plan) {
                plan = plan.plan;
            }
            
            // Ensure it's an array and transform each day
            if (Array.isArray(plan)) {
                return plan.map((day: any) => ({
                    day: day.day,
                    type: day.type || (day.workout ? 'workout' : 'rest'),
                    workout: day.workout || null,
                    isCompleted: day.isCompleted || false
                })) as WorkoutPlan;
            }
            
            throw new Error('Invalid workout plan format received');
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
            let plan = await invokeAiService<any>('generateWeeklyMealPlan', { user, macros, phase });
            
            // Handle case where AI returns wrapped object
            if (plan && 'plan' in plan) {
                plan = plan.plan;
            }
            
            // Ensure it's an array with proper structure
            if (Array.isArray(plan)) {
                return plan.map((day: any) => ({
                    dayOfWeek: day.dayOfWeek || day.day || 'Unknown',
                    breakfast: day.breakfast || { name: 'Not specified', time: '8:00 AM', macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, ingredients: [], instructions: [] },
                    lunch: day.lunch || { name: 'Not specified', time: '12:00 PM', macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, ingredients: [], instructions: [] },
                    dinner: day.dinner || { name: 'Not specified', time: '7:00 PM', macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, ingredients: [], instructions: [] },
                    snack: day.snack || undefined,
                    dailyTotals: day.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                })) as WeeklyMealPlan;
            }
            
            throw new Error('Invalid meal plan format received');
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
