import Groq from "groq-sdk";
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
    UserProfile,
 
} from '../types';

export interface CommunityInsight {
    title: string;
    description: string;
    statValue: string;
    statLabel: string;
    trendDirection: 'up' | 'down' | 'stable';
}

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;

let groq: Groq | null = null;

const getGroqClient = () => {
    if (!groq) {
        if (!API_KEY) {
            console.error("❌ VITE_GROQ_API_KEY not found in environment variables");
            throw new Error("VITE_GROQ_API_KEY environment variable not set. Please add it to your .env file.");
        }
        console.log("✅ Initializing Groq client with API key:", API_KEY.substring(0, 20) + "...");
        groq = new Groq({ 
            apiKey: API_KEY,
            dangerouslyAllowBrowser: true // For web apps
        });
    }
    return groq;
};

const parseJsonResponse = <T>(jsonString: string, context: string): T => {
    try {
        // Remove markdown code blocks if present
        const cleanedString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
        return JSON.parse(cleanedString) as T;
    } catch (error) {
        console.error(`Error parsing JSON for ${context}:`, error, "Raw string:", jsonString);
        throw new Error(`AI returned a response in an unexpected format for ${context}.`);
    }
};

export const generateCycleInsight = async (phase: MenstrualPhase, _dailyLogs: DailyLog[], userId?: string): Promise<CycleFocusInsight> => {
    // Check rate limit if userId provided
    if (userId) {
        const { aiTextLimiter, formatResetTime } = await import('../utils/rateLimiter');
        const rateLimit = await aiTextLimiter.checkLimit(userId);
        if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Please try again in ${formatResetTime(rateLimit.resetTime)}.`);
        }
    }
    
    const prompt = `You are a women's health expert. Based on the user being in the ${phase} phase of their menstrual cycle, provide a "Daily Focus" insight in JSON format.

Return ONLY valid JSON with this exact structure:
{
    "summary": "A brief, empowering summary of the current phase",
    "energyPrediction": "A friendly prediction of their likely energy levels",
    "nutritionTip": "A specific, actionable nutrition tip for this phase",
    "mindfulnessSuggestion": "A simple mindfulness or self-care activity"
}

Keep the tone supportive and informative.`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for cycle insight.");
    return parseJsonResponse<CycleFocusInsight>(content, "cycle insight");
};

export const generateSymptomSuggestions = async (phase: MenstrualPhase): Promise<string[]> => {
    const prompt = `List 3-4 common symptoms a person might experience during the ${phase} phase of their menstrual cycle. Return ONLY a JSON array of strings. Example: ["symptom1", "symptom2", "symptom3"]`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) return [];
    return parseJsonResponse<string[]>(content, "symptom suggestions");
};

export const generateCyclePatternInsight = async (user: UserProfile, dailyLogs: DailyLog[]): Promise<CyclePatternInsight> => {
    const prompt = `Analyze the user's daily logs to find a recurring pattern related to their menstrual cycle.
    
User profile: Goal: ${user.goal}, Activity: ${user.activityLevel}
Recent logs (mood and symptoms): ${JSON.stringify(dailyLogs.slice(0, 10))}

Return ONLY valid JSON with this exact structure:
{
    "title": "A catchy title for the insight (e.g., 'Pre-Period Energy Dip')",
    "patternDetail": "A sentence describing the pattern found in the data",
    "suggestion": "A single, actionable suggestion to help manage this pattern"
}

Be specific but gentle.`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for cycle pattern insight.");
    return parseJsonResponse<CyclePatternInsight>(content, "cycle pattern insight");
};

export const generateDynamicAchievements = async (user: UserProfile, completedAchievementIds: string[]): Promise<Omit<Achievement, 'isAiGenerated'>[]> => {
    const prompt = `Generate 3 new, personalized achievement challenges for a user.

User Info:
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}
- Completed Achievements: ${completedAchievementIds.join(', ')}

The new achievements should be slightly more challenging than basic ones. Make them specific, creative, and fun.

Return ONLY valid JSON array with this exact structure:
[
    {
        "id": "unique_id",
        "name": "Achievement name",
        "icon": "one of: badge, target, cycle, clipboard, workout, food, fire",
        "description": "Short description",
        "goal": {
            "metric": "total_meals or total_workouts or balanced_day or log_streak",
            "target": 10
        }
    }
]`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for dynamic achievements.");
    return parseJsonResponse<Omit<Achievement, 'isAiGenerated'>[]>(content, "dynamic achievements");
};

export const analyzeJournalEntry = async (entry: JournalEntry, userName?: string): Promise<Pick<JournalEntry, 'summary' | 'themes' | 'suggestion'>> => {
    const displayName = userName || 'The user';
    const prompt = `Analyze this journal entry from ${displayName} in a wellness app.

Entry: "${entry.content}"

Return ONLY valid JSON with this exact structure:
{
    "summary": "A one-sentence summary of the main feeling or topic (refer to them as '${displayName}' not 'the user')",
    "themes": ["Theme1", "Theme2", "Theme3"],
    "suggestion": "A gentle, actionable suggestion based on the themes (frame as a question or kind invitation, addressing them as '${displayName}')"
}

The tone should be supportive and non-clinical. Use '${displayName}' when referring to the person.`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for journal analysis.");
    return parseJsonResponse<Pick<JournalEntry, 'summary' | 'themes' | 'suggestion'>>(content, "journal analysis");
};

export const generateMonthlyWorkoutPlan = async (user: UserProfile): Promise<WorkoutPlan> => {
    try {
        const prompt = `Create a personalized 30-day workout plan for a user.

User Profile:
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}
- Age: ${user.age}
- Gender: ${user.gender}

Return ONLY valid JSON array with exactly 30 days. Each day must have:
{
    "day": 1,
    "type": "workout" or "rest",
    "isCompleted": false,
    "workout": {
        "name": "Creative workout name",
        "type": "Strength, Cardio, HIIT, Flexibility, or Active Recovery",
        "duration": 30,
        "description": "Detailed plan with exercises, sets, reps. Use \\n for line breaks"
    }
}

For rest days, omit the workout object.

Make it progressive and balanced. A moderately active user might have 5-on, 2-off split.`;

        const response = await getGroqClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
        });

        const content = response.choices[0]?.message?.content || "";
        if (!content) throw new Error("AI response was empty for workout plan generation.");
        return parseJsonResponse<WorkoutPlan>(content, "workout plan generation");
    } catch (error: any) {
        if (error.status === 401 || error.message?.includes('authentication') || error.message?.includes('API key')) {
            throw new Error("Groq API authentication failed. Please check your VITE_GROQ_API_KEY in .env file.");
        }
        if (error.status === 429) {
            throw new Error("Groq API rate limit exceeded. Please try again in a few seconds.");
        }
        throw error;
    }
};

export const generateWeeklyMealPlan = async (user: UserProfile, macros: DailyMacros, phase?: MenstrualPhase): Promise<WeeklyMealPlan> => {
    try {
        let phaseInstruction = '';
        if (phase && user.gender === 'female') {
            phaseInstruction = `
CYCLE SYNC: The user is in their ${phase} menstrual phase. Tailor nutritional choices:
- Menstrual: Iron-rich foods (spinach, lentils), anti-inflammatory ingredients
- Follicular: Lean proteins, complex carbs for energy
- Ovulatory: Lighter meals, antioxidant-rich foods
- Luteal: Complex carbs, magnesium-rich foods (nuts, seeds), B vitamins`;
        }

        const prompt = `Create a 7-day meal plan for a user.

User Profile:
- Goal: ${user.goal}
- Age: ${user.age}, Gender: ${user.gender}
- Height: ${user.height}cm, Weight: ${user.weight}kg
- Activity: ${user.activityLevel}
- Nationality: ${user.nationality || 'Not specified'}

Daily Macro Targets:
- Calories: ${macros.target.calories}
- Protein: ${macros.target.protein}g
- Carbs: ${macros.target.carbs}g
- Fat: ${macros.target.fat}g
${phaseInstruction}

Return ONLY valid JSON array with 7 days (Monday-Sunday). Each day:
{
    "dayOfWeek": "Monday",
    "breakfast": {
        "name": "Meal name",
        "time": "8:00 AM",
        "macros": {"calories": 400, "protein": 20, "carbs": 50, "fat": 10},
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "isLogged": false
    },
    "lunch": {...same structure...},
    "dinner": {...same structure...},
    "snack": {...same structure...},
    "dailyTotals": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 60}
}

Meals should be quick (under 30-40 minutes), varied, and aligned with goals.`;

        const response = await getGroqClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 6000,
        });

        const content = response.choices[0]?.message?.content || "";
        if (!content) throw new Error("AI response was empty for weekly meal plan generation.");
        return parseJsonResponse<WeeklyMealPlan>(content, "weekly meal plan generation");
    } catch (error: any) {
        if (error.status === 401 || error.message?.includes('authentication') || error.message?.includes('API key')) {
            throw new Error("Groq API authentication failed. Please check your VITE_GROQ_API_KEY in .env file.");
        }
        if (error.status === 429) {
            throw new Error("Groq API rate limit exceeded. Please try again in a few seconds.");
        }
        throw error;
    }
};

export const generatePersonalChallenge = async (idea: string, user: UserProfile): Promise<Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>> => {
    const prompt = `Based on this user goal: "${idea}", create a specific, actionable, and motivating personal challenge.

User Profile:
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}

Return ONLY valid JSON:
{
    "title": "Short, catchy title",
    "description": "Brief description of the challenge",
    "type": "fitness, nutrition, or mindfulness",
    "metric": "workouts, minutes, servings, or days",
    "goal": 15,
    "isAiGenerated": true
}

The challenge should be completable within 1-2 weeks.`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for personal challenge generation.");
    return parseJsonResponse<Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>>(content, "personal challenge generation");
};

export const generateCommunityInsight = async (workoutData: { date: string; count: number; type: string }[]): Promise<CommunityInsight> => {
    const prompt = `Analyze this community workout data from the past 30 days and provide ONE interesting insight.

Workout Data (date, count, type):
${JSON.stringify(workoutData)}

Look for patterns like:
- Which day of week has most activity
- Trending workout types
- Activity peaks or growth trends
- Interesting correlations

Return ONLY valid JSON with this exact structure:
{
    "title": "Catchy 2-3 word title (e.g., 'Weekend Warriors', 'Morning Movers')",
    "description": "Friendly 1-2 sentence explanation of the insight that motivates the community",
    "statValue": "A percentage, number, or short stat (e.g., '+25%', '150+', '3x')",
    "statLabel": "What the stat represents (e.g., 'More activity on Saturdays')",
    "trendDirection": "up, down, or stable"
}

Keep it positive, specific, and motivating!`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty for community insight generation.");
    return parseJsonResponse<CommunityInsight>(content, "community insight generation");
};
