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
        
        // Remove any text before the first {
        const jsonStart = cleanedString.indexOf('{');
        if (jsonStart > 0) {
            cleanedString = cleanedString.substring(jsonStart);
        }
        
        // Remove any text after the last }
        const jsonEnd = cleanedString.lastIndexOf('}');
        if (jsonEnd >= 0 && jsonEnd < cleanedString.length - 1) {
            cleanedString = cleanedString.substring(0, jsonEnd + 1);
        }
        
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
- Goal: ${user.goal}
- Remaining daily budget: ${remainingCals} calories, ${remainingProtein}g protein, ${remainingCarbs}g carbs, ${remainingFat}g fat
- Already consumed: ${macros.consumed.calories} calories, ${macros.consumed.protein}g protein, ${macros.consumed.carbs}g carbs, ${macros.consumed.fat}g fat

CRITICAL EVALUATION RULES:
- If the food would push the user OVER their remaining calories/macros → "Poor Fit"
- If the food has high sugar/sodium for their goal (e.g., weight loss) → "Okay in Moderation" or "Poor Fit"
- If the food has poor macro balance for their goal (e.g., low protein for muscle gain) → "Okay in Moderation" or "Poor Fit"
- If calories exceed 50% of remaining budget → "Okay in Moderation" at best
- If the food fits well within remaining budget and aligns with goal → "Good Fit" or "Great Fit"

STEP 3: Assign a fitScore based on ACTUAL USER DATA:
- "Great Fit" = Perfect for their goal AND fits easily in remaining macros
- "Good Fit" = Aligns with goal AND fits in remaining macros
- "Okay in Moderation" = Acceptable but high in calories/fat/carbs/sugar relative to remaining budget
- "Poor Fit" = Does NOT align with goal OR exceeds remaining budget OR unhealthy for their needs

STEP 4: Write a SPECIFIC reason referencing the USER'S ACTUAL DATA:
Examples:
- "This exceeds your remaining ${remainingCals} calories and is high in fat for weight loss"
- "High in protein (${remainingProtein}g remaining) but too many carbs for your goal"
- "Fits perfectly within your remaining budget and supports muscle gain"

STEP 5: If fitScore is "Okay in Moderation" or "Poor Fit", suggest 2 SPECIFIC healthier alternatives (e.g., "Grilled chicken breast with steamed broccoli", "Greek yogurt with berries"). Otherwise set alternatives to [].

RESPOND WITH ONLY THIS JSON (no explanation, no markdown, no extra text):
{
  "macros": {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>},
  "fitScore": "<Great Fit|Good Fit|Okay in Moderation|Poor Fit>",
  "reason": "<specific reason mentioning user's remaining macros or goal>",
  "alternatives": ["<alternative 1>", "<alternative 2>"] or []
}`;

    try {
        const completion = await getGroqClient().chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            temperature: 0.3,
            max_tokens: 1024,
            top_p: 1,
        });

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

    const prompt = `You are a recipe creator. Look at the ingredients in this image and follow these steps:

STEP 1: Identify all visible food items/ingredients in the image.

STEP 2: Create a healthy recipe suitable for someone with goal: "${user.goal}"
- Recipe must use the ingredients you see in the image
- Make it practical and actually cookable
- Make it healthy and aligned with the user's goal

STEP 3: Write the recipe name (e.g., "Grilled Chicken with Roasted Vegetables").

STEP 4: Write a brief description (1-2 sentences about the dish).

STEP 5: List ingredients with measurements (e.g., "2 chicken breasts, cubed", "1 cup broccoli florets", "2 tbsp olive oil"). Include 5-8 ingredients.

STEP 6: Write cooking instructions as separate steps (e.g., "Preheat oven to 400°F", "Season chicken with salt and pepper"). Include 4-8 steps.

STEP 7: Estimate macros PER SERVING:
- Calories (number like 350)
- Protein in grams (number like 35)
- Carbs in grams (number like 25)
- Fat in grams (number like 12)

RESPOND WITH ONLY THIS JSON (no explanation, no markdown, no extra text):
{
  "name": "<Recipe Name>",
  "description": "<Brief description>",
  "ingredients": ["<ingredient 1 with measurement>", "<ingredient 2 with measurement>", "<ingredient 3>", "<etc>"],
  "instructions": ["<step 1>", "<step 2>", "<step 3>", "<etc>"],
  "macros": {"calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>}
}`;

    try {
        const completion = await getGroqClient().chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            temperature: 0.5,
            max_tokens: 3000,
            top_p: 1,
        });

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
