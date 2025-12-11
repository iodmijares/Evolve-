import Groq from "groq-sdk";
import { UserProfile, DailyMacros, FoodScanResult, GeneratedRecipe } from '../types';

// ============================================================================
// GROQ VISION SERVICE - IMAGE ANALYSIS
// ============================================================================
// This service handles vision tasks using Groq's multimodal models.
// Uses Llama 4 Scout (17B) for fast, free image analysis including:
// - Nutrition label scanning and analysis
// - Food image recognition and recipe generation
// ============================================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groqClient: Groq | null = null;

// Read vision model choices from environment so they can be changed without code edits.
// Format: comma-separated list, e.g. "meta-llama/llama-4-scout-17b-16e-instruct"
const getVisionModelList = (): string[] => {
    const envVal = (import.meta.env.VITE_GROQ_VISION_MODELS as string) || '';
    if (envVal && envVal.trim().length > 0) {
        return envVal.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Default list: Llama 4 Scout (primary) and Llama 4 Maverick (fallback)
    // These are the official Groq vision-capable models as of Dec 2025
    return [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct'
    ];
};

const getGroqClient = () => {
    if (!groqClient) {
        if (!GROQ_API_KEY) {
            console.error('❌ VITE_GROQ_API_KEY is not set');
            throw new Error("VITE_GROQ_API_KEY environment variable not set. Please add it to your .env file.");
        }
        console.log('✅ Initializing Groq Vision client');
        groqClient = new Groq({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true
        });
    }
    return groqClient;
};

const parseJsonResponse = <T>(jsonString: string, context: string): T => {
    try {
        console.log('📝 Attempting to parse response for:', context);
        
        // Remove markdown code blocks if present
        let cleanedString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
        
        // More robust JSON extraction: find the first '{' and the last '}'
        const firstOpen = cleanedString.indexOf('{');
        const lastClose = cleanedString.lastIndexOf('}');
        
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            cleanedString = cleanedString.substring(firstOpen, lastClose + 1);
        } else {
             // Fallback: if we can't find braces, maybe it's just the object? 
             // But if not, this will fail in JSON.parse
             console.warn(`⚠️ Could not find clear JSON brackets in response for ${context}. parsing might fail.`);
        }
        
        // Remove any potentially lingering non-JSON characters outside the brackets if logic above failed
        // (The logic above handles most cases, but this is a safety net if index finding failed curiously)
        
        console.log('🧹 Cleaned string:', cleanedString.substring(0, 200) + '...');
        
        const parsed = JSON.parse(cleanedString) as T;
        console.log('✅ Successfully parsed JSON');
        return parsed;
    } catch (error) {
        console.error(`❌ Error parsing JSON for ${context}:`, error);
        console.error('📄 Full raw string:', jsonString);
        throw new Error(`AI returned a response in an unexpected format for ${context}. Please try again.`);
    }
};

export const analyzeNutritionLabel = async (
    image: { uri: string; type: string }, 
    user: UserProfile, 
    macros: DailyMacros
): Promise<FoodScanResult> => {
    console.log('🔍 Starting nutrition label analysis with Groq Vision');
    
    // Check rate limit before making API call
    const { aiVisionLimiter, formatResetTime } = await import('../utils/rateLimiter');
    const rateLimit = await aiVisionLimiter.checkLimit(user.id);
    
    if (!rateLimit.allowed) {
        throw new Error(`Rate limit exceeded. Please try again in ${formatResetTime(rateLimit.resetTime)}.`);
    }
    
    console.log(`✅ Rate limit OK: ${rateLimit.remaining} requests remaining`);
    
    const base64Image = image.uri;
    const imageUrl = `data:${image.type};base64,${base64Image}`;

    const remainingCals = macros.target.calories - macros.consumed.calories;
    const remainingProtein = macros.target.protein - macros.consumed.protein;
    const remainingCarbs = macros.target.carbs - macros.consumed.carbs;
    const remainingFat = macros.target.fat - macros.consumed.fat;

    const prompt = `You are a nutrition analyst. Look at the nutrition label in this image and follow these steps:

STEP 1: Read the nutrition label and extract these exact values PER SERVING:
- Calories (total energy)
- Protein (in grams)
- Carbohydrates/Carbs (in grams)
- Fat (in grams)

STEP 2: Analyze if this food fits the user's needs. User info:
- Name: ${user.name || 'User'}
- Goal: ${user.goal}
- Dietary preferences: ${user.dietaryPreferences?.length ? user.dietaryPreferences.join(', ') : 'None specified'}
- Remaining daily budget: ${remainingCals} calories, ${remainingProtein}g protein, ${remainingCarbs}g carbs, ${remainingFat}g fat
- Already consumed today: ${macros.consumed.calories} calories, ${macros.consumed.protein}g protein, ${macros.consumed.carbs}g carbs, ${macros.consumed.fat}g fat

CRITICAL EVALUATION - Be STRICT and HONEST:
- If calories exceed remaining budget → "Poor Fit" - EXPLAIN: "This has X calories but you only have ${remainingCals} left"
- If high sugar/sodium for weight loss goal → "Poor Fit" or "Okay in Moderation" - EXPLAIN the specific concern
- If low protein for muscle gain goal → "Poor Fit" - EXPLAIN: "Only Xg protein when you need high protein for muscle gain"
- If violates dietary restrictions → "Poor Fit" - EXPLAIN which restriction it violates
- If calories > 50% of remaining budget → "Okay in Moderation" at best
- Only "Great Fit" if it genuinely helps their specific goal AND fits budget

STEP 3: Assign a fitScore:
- "Great Fit" = Perfect for their goal AND fits easily in remaining macros
- "Good Fit" = Aligns with goal AND fits in remaining macros  
- "Okay in Moderation" = Acceptable but watch portion size
- "Poor Fit" = Does NOT align with goal OR exceeds budget OR has health concerns

STEP 4: Write a PERSONALIZED reason addressing the user by name:
- Be specific about numbers: "${user.name || 'Hey'}, this has 450 calories but you only have ${remainingCals} left today"
- Mention their goal: "For ${user.goal}, this is too high in sugar"
- Be honest but supportive: "This isn't ideal for your goals because..."

STEP 5: If "Okay in Moderation" or "Poor Fit", suggest 2 SPECIFIC healthier alternatives that WOULD fit their remaining macros and goal. Otherwise set alternatives to [].

RESPOND WITH ONLY THIS JSON (no explanation, no markdown, no extra text):
{
  "macros": {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>},
  "fitScore": "<Great Fit|Good Fit|Okay in Moderation|Poor Fit>",
  "reason": "<personalized explanation addressing user by name, mentioning specific numbers and their goal>",
  "alternatives": ["<alternative 1>", "<alternative 2>"] or []
}`;

    try {
        // Use a current vision-capable model. If that model is ever decommissioned
        // the helper below will try a compatible fallback once.
        const models = getVisionModelList();

        const callWithModels = async (modelsToTry: string[], opts: { temperature: number; max_tokens: number; top_p: number }) => {
            const errors: any[] = [];
            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting vision call with model: ${modelName}`);
                    const result = await getGroqClient().chat.completions.create({
                        model: modelName,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    { type: 'image_url', image_url: { url: imageUrl } }
                                ]
                            }
                        ],
                        temperature: opts.temperature,
                        max_tokens: opts.max_tokens,
                        top_p: opts.top_p,
                    });
                    return result;
                } catch (err: any) {
                    errors.push({ model: modelName, error: err });
                    const msg = err?.error?.message || err?.message || String(err);
                    // Try next model if model was decommissioned or not found
                    if (msg && (msg.includes('decommissioned') || msg.includes('model_not_found') || msg.includes('does not exist'))) {
                        console.warn(`Model ${modelName} not available: ${msg}. Trying next model if any.`);
                        continue;
                    }
                    // For other errors rethrow immediately
                    throw err;
                }
            }
            // If we get here, none of the models worked
            const summary = errors.map(e => `${e.model}: ${e.error?.error?.message || e.error?.message || String(e.error)}`).join(' | ');
            throw new Error(`All vision models failed. Tried: ${modelsToTry.join(', ')}. Errors: ${summary}. Please check your Groq account for model access and set VITE_GROQ_VISION_MODELS in your environment.`);
        };

        const completion = await callWithModels(models, { temperature: 0.3, max_tokens: 1024, top_p: 1 });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error("AI response was empty for nutrition label analysis.");
        }

        console.log('🔍 Raw AI response:', responseText);
        console.log('✅ Nutrition label analysis complete');
        return parseJsonResponse<FoodScanResult>(responseText, "nutrition label analysis");
    } catch (error: any) {
        console.error('❌ Nutrition label analysis failed:', error);
        if (error?.error?.message?.includes('authentication')) {
            throw new Error('API key authentication failed. Please check your VITE_GROQ_API_KEY.');
        }
        if (error?.error?.message?.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw error;
    }
};

export const generateRecipeFromImage = async (
    image: { uri: string; type: string }, 
    user: UserProfile
): Promise<GeneratedRecipe> => {
    console.log('🔍 Starting recipe generation with Groq Vision');
    
    // Check rate limit before making API call
    const { aiVisionLimiter, formatResetTime } = await import('../utils/rateLimiter');
    const rateLimit = await aiVisionLimiter.checkLimit(user.id);
    
    if (!rateLimit.allowed) {
        throw new Error(`Rate limit exceeded. Please try again in ${formatResetTime(rateLimit.resetTime)}.`);
    }
    
    console.log(`✅ Rate limit OK: ${rateLimit.remaining} requests remaining`);
    
    const base64Image = image.uri;
    const imageUrl = `data:${image.type};base64,${base64Image}`;

    const prompt = `You are a recipe creator and nutrition advisor. Look at the ingredients in this image and follow these steps:

USER PROFILE:
- Name: ${user.name || 'User'}
- Goal: ${user.goal}
- Activity Level: ${user.activityLevel}
- Dietary Preferences: ${user.dietaryPreferences?.length ? user.dietaryPreferences.join(', ') : 'None'}

STEP 1: Identify all visible food items/ingredients in the image.

STEP 2: EVALUATE SUITABILITY - Is this food appropriate for the user?
Consider:
- Does it align with their goal (${user.goal})?
- Does it violate any dietary restrictions?
- Is it generally healthy or is it junk food/highly processed?
- Would a nutrition expert recommend this for someone with their goal?

IF THE FOOD IS NOT SUITABLE (junk food, violates restrictions, doesn't align with goal):
- Set isSuitable to false
- Explain why in unsuitableReason (be specific and helpful)
- Still provide name, description, basic macros estimate
- Leave ingredients and instructions as empty arrays

Examples of unsuitable foods:
- Chips, candy, soda for weight loss goal
- High-carb foods for low-carb diet
- Meat products for vegetarian/vegan
- High-fat processed foods for heart health

IF THE FOOD IS SUITABLE:
- Set isSuitable to true
- Create a healthy recipe using the visible ingredients
- Ensure it aligns with the user's goal: ${user.goal}

STEP 3: If suitable, write the recipe:
- Recipe name (e.g., "Grilled Chicken with Roasted Vegetables")
- Brief description (1-2 sentences)
- Ingredients with measurements (5-8 items)
- Cooking instructions (4-8 steps)
- Estimated macros per serving

RESPOND WITH ONLY THIS JSON (no explanation, no markdown, no extra text):
{
  "name": "<Recipe Name or Food Name>",
  "description": "<Brief description>",
  "ingredients": ["<ingredient 1>", "<ingredient 2>"] or [],
  "instructions": ["<step 1>", "<step 2>"] or [],
  "macros": {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>},
  "isSuitable": <true or false>,
  "unsuitableReason": "<explanation if not suitable, or empty string if suitable>"
}`;

    try {
        // For recipe generation we try the same ordered model list with different params
        const models = getVisionModelList();
        const completion = await (async () => {
            return await (async () => {
                const errors: any[] = [];
                for (const modelName of models) {
                    try {
                        console.log(`Attempting recipe generation with model: ${modelName}`);
                        const res = await getGroqClient().chat.completions.create({
                            model: modelName,
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: prompt },
                                        { type: 'image_url', image_url: { url: imageUrl } }
                                    ]
                                }
                            ],
                            temperature: 0.5,
                            max_tokens: 3000,
                            top_p: 1,
                        });
                        return res;
                    } catch (err: any) {
                        errors.push({ model: modelName, error: err });
                        const msg = err?.error?.message || err?.message || String(err);
                        if (msg && (msg.includes('decommissioned') || msg.includes('model_not_found') || msg.includes('does not exist'))) {
                            console.warn(`Model ${modelName} not available for recipe generation: ${msg}. Trying next model if any.`);
                            continue;
                        }
                        throw err;
                    }
                }
                const summary = errors.map(e => `${e.model}: ${e.error?.error?.message || e.error?.message || String(e.error)}`).join(' | ');
                throw new Error(`All recipe vision models failed. Tried: ${models.join(', ')}. Errors: ${summary}. Please check your Groq account for model access and set VITE_GROQ_VISION_MODELS in your environment.`);
            })();
        })();

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error("AI response was empty for recipe generation.");
        }

        console.log('🔍 Raw AI response:', responseText);
        console.log('✅ Recipe generation complete');
        return parseJsonResponse<GeneratedRecipe>(responseText, "recipe generation");
    } catch (error: any) {
        console.error('❌ Recipe generation failed:', error);
        if (error?.error?.message?.includes('authentication')) {
            throw new Error('API key authentication failed. Please check your VITE_GROQ_API_KEY.');
        }
        if (error?.error?.message?.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw error;
    }
};
