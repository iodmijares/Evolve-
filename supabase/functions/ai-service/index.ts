import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Groq from "https://esm.sh/groq-sdk@0.3.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to parse JSON robustly (copied from original service)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in Edge Function secrets.')
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY })
    const { action, payload } = await req.json()

    let prompt = '';
    let model = 'llama-3.3-70b-versatile'; // Default
    let max_tokens = 1000;
    let temperature = 0.7;
    let responseFormat = undefined;

    // CONSTRUCT PROMPTS BASED ON ACTION
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
        model = "llama-3.1-8b-instant";
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
        prompt = `Generate 3 new, personalized achievement challenges for a user.

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
        temperature = 0.8;
        max_tokens = 800;
        break;
      }

      case 'analyzeJournalEntry': {
        const { entry, userName } = payload;
        const name = userName || 'there';
        prompt = `You are a compassionate wellness companion. Read this journal entry and provide ONE gentle, practical suggestion that could genuinely help.

Journal entry: "${entry.content}"
Current mood: ${entry.mood || 'not specified'}, Energy level: ${entry.energy || 'not specified'}

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
        prompt = `Create a personalized 30-day workout plan for a user.

User Profile:
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}
- Age: ${user.age}
- Gender: ${user.gender}

Return ONLY valid JSON with this structure:
{
    "plan": [
        {
            "day": 1,
            "type": "workout",
            "isCompleted": false,
            "workout": {
                "name": "Creative workout name",
                "type": "Strength, Cardio, HIIT, Flexibility, or Active Recovery",
                "duration": 30,
                "description": "Detailed plan with exercises, sets, reps. Use newlines for clarity"
            }
        },
        {
            "day": 2,
            "type": "rest",
            "isCompleted": false
        }
    ]
}

Create exactly 30 days. For rest days, omit the workout object.
Make it progressive and balanced. A moderately active user might have 5-on, 2-off split.`;
        max_tokens = 4000;
        responseFormat = { type: "json_object" };
        break;
      }

      case 'generateWeeklyMealPlan': {
        const { user, macros, phase } = payload;
        let phaseInstruction = '';
        if (phase && user.gender === 'female') {
            phaseInstruction = `
CYCLE SYNC: The user is in their ${phase} menstrual phase. Tailor nutritional choices:
- Menstrual: Iron-rich foods (spinach, lentils), anti-inflammatory ingredients
- Follicular: Lean proteins, complex carbs for energy
- Ovulatory: Lighter meals, antioxidant-rich foods
- Luteal: Complex carbs, magnesium-rich foods (nuts, seeds), B vitamins`;
        }

        prompt = `Create a 7-day meal plan for a user.

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

Meals should be quick (under 30-40 minutes), varied, and aligned with goals.

Return as JSON object with "plan" key containing the 7-day array:
{ "plan": [ {...Monday...}, {...Tuesday...}, ... ] }`;
        max_tokens = 6000;
        responseFormat = { type: "json_object" };
        break;
      }

      case 'generatePersonalChallenge': {
        const { idea, user } = payload;
        prompt = `Based on this user goal: "${idea}", create a specific, actionable, and motivating personal challenge.

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
        model = "llama-3.1-8b-instant";
        max_tokens = 400;
        temperature = 0.8;
        break;
      }

      case 'generateCommunityInsight': {
        const { workoutData } = payload;
        prompt = `Analyze this community workout data from the past 30 days and provide ONE interesting insight.

Workout Data (date, count, type):
${JSON.stringify(workoutData.slice(0, 50))}

Look for patterns like:
- Which day of week has most activity
- Trending workout types
- Activity peaks or growth trends
- Interesting correlations

CRITICAL: Return ONLY valid JSON, nothing else. Use this exact structure:
{
    "title": "Catchy 2-3 word title (e.g., 'Weekend Warriors', 'Morning Movers')",
    "description": "Friendly 1-2 sentence explanation of the insight that motivates the community",
    "statValue": "A percentage, number, or short stat (e.g., '+25%', '150+', '3x')",
    "statLabel": "What the stat represents (e.g., 'More activity on Saturdays')",
    "trendDirection": "up"
}

Note: trendDirection must be exactly one of: "up", "down", or "stable"
Keep it positive, specific, and motivating!`;
        max_tokens = 500;
        responseFormat = { type: "json_object" };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // EXECUTE AI CALL
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
      temperature: temperature,
      max_tokens: max_tokens,
      response_format: responseFormat,
    });

    const content = completion.choices[0]?.message?.content || "";
    if (!content) throw new Error("AI response was empty");

    const parsedData = parseJsonResponse(content, action);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
