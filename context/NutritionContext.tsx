import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Meal, DailyMacros, Macros, WeeklyMealPlan, MealPlanDay, MealType } from '../types';
import { cachingService } from '../utils/cachingService';
import { useAuth } from './AuthContext';
import { generateWeeklyMealPlan } from '../services/groqService';
import { calculateMenstrualPhase } from '../utils/dateUtils';

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

// Helper to map JS camelCase to DB snake_case
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

const calculateTargetMacros = (user: any): Macros => {
    if (!user || !user.weight || !user.height || !user.age) {
        return { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    }
    const bmr = user.gender === 'female'
        ? 655.1 + (9.563 * user.weight) + (1.850 * user.height) - (4.676 * user.age)
        : 66.47 + (13.75 * user.weight) + (5.003 * user.height) - (6.755 * user.age);

    const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
    };
    const tdee = bmr * (activityMultipliers[user.activityLevel] || 1.2);
    const calorieTarget = user.goal === 'weight_loss' ? tdee - 500 : user.goal === 'muscle_gain' ? tdee + 300 : tdee;

    const protein = (calorieTarget * 0.30) / 4;
    const carbs = (calorieTarget * 0.40) / 4;
    const fat = (calorieTarget * 0.30) / 9;

    return { calories: Math.round(calorieTarget), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
};

interface NutritionContextType {
    meals: Meal[];
    macros: DailyMacros;
    weeklyMealPlan: WeeklyMealPlan | null;
    isMealPlanLoading: boolean;
    logMeal: (meal: Omit<Meal, 'id' | 'userId'>) => Promise<void>;
    removeMeal: (mealId: string) => void;
    generateAndSetWeeklyMealPlan: () => Promise<void>;
    markMealAsLogged: (dayOfWeek: string, mealType: keyof Pick<MealPlanDay, 'breakfast' | 'lunch' | 'dinner' | 'snack'>) => Promise<void>;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const { user } = useAuth();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [weeklyMealPlan, setWeeklyMealPlan] = useState<WeeklyMealPlan | null>(null);
    const [macros, setMacros] = useState<DailyMacros>({ 
        target: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } 
    });
    const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);

    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    useEffect(() => {
        if (!user) {
            setMeals([]);
            setWeeklyMealPlan(null);
            setMacros({ target: { calories: 0, protein: 0, carbs: 0, fat: 0 }, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
            return;
        }

        const loadNutritionData = async () => {
            const today = new Date().toISOString().split('T')[0];
            
            // Load Meals
            const mealsRes = await cachingService.getOrSet(
                `evolve_${user.id}_meals_${today}`,
                10 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('meals').select('id, user_id, date, meal_type, name, calories, protein, carbs, fat, ingredients, instructions, description, rationale').eq('user_id', user.id).eq('date', today);
                    return { data };
                }
            );
            
            if (mealsRes?.data) {
                const finalMeals: Meal[] = mealsRes.data.map((m: any) => fromDBShape({ ...m, macros: { calories: m.calories || 0, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0 } }));
                setMeals(finalMeals);
            }

            // Load Meal Plan
            const mealPlanRes = await cachingService.getOrSet(
                `evolve_${user.id}_meal_plan`,
                60 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('meal_plans').select('plan').eq('user_id', user.id).maybeSingle();
                    return data?.plan || null;
                }
            );
            if (mealPlanRes) setWeeklyMealPlan(mealPlanRes as WeeklyMealPlan);
        };

        loadNutritionData();
    }, [user]);

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

    const logMeal = useCallback(async (meal: Omit<Meal, 'id' | 'userId'>) => {
        if (!user) return;
        
        const { macros: m, ...mealData } = meal;
        const mealToInsert = {
            ...mealData,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
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
            console.error("Error logging meal:", error?.message);
        }
    }, [user, getCacheKey]);

    const removeMeal = useCallback(async (mealId: string) => {
        const { error } = await supabase.from('meals').delete().eq('id', mealId);
        if (!error) {
            setMeals(prev => {
                const updatedMeals = prev.filter(m => m.id !== mealId);
                const key = getCacheKey('meals_today');
                if(key) cachingService.set(key, updatedMeals);
                return updatedMeals;
            });
        }
    }, [getCacheKey]);

    const generateAndSetWeeklyMealPlan = useCallback(async () => {
        if (!user || isMealPlanLoading) return;
        
        // Logic to check if current plan is finished can be added here if needed (simplified for now)
        
        setIsMealPlanLoading(true);
        try {
            const phaseData = user.gender === 'female' && user.lastPeriodStartDate && user.cycleLength
                ? calculateMenstrualPhase(user.lastPeriodStartDate, user.cycleLength)
                : null;
            
            const plan = await generateWeeklyMealPlan(user, macros, phaseData?.phase);
            const { error } = await supabase.from('meal_plans').upsert({ user_id: user.id, plan: plan }, { onConflict: 'user_id' });
            if (error) throw error;
            
            setWeeklyMealPlan(plan);
            const key = getCacheKey('meal_plan');
            if (key) await cachingService.set(key, plan);
        } catch (err) {
            console.error("Error generating meal plan:", err);
        } finally { 
            setIsMealPlanLoading(false); 
        }
    }, [user, macros, isMealPlanLoading, getCacheKey]);

    const markMealAsLogged = useCallback(async (dayOfWeek: string, mealType: keyof Pick<MealPlanDay, 'breakfast' | 'lunch' | 'dinner' | 'snack'>) => {
        if (!user || !weeklyMealPlan || !Array.isArray(weeklyMealPlan)) return;

        const originalPlan = [...weeklyMealPlan];
        const updatedPlan = JSON.parse(JSON.stringify(weeklyMealPlan)) as WeeklyMealPlan;
        const dayIndex = updatedPlan.findIndex(d => d.dayOfWeek === dayOfWeek);
        if (dayIndex === -1) return;
        
        const mealToUpdate = updatedPlan[dayIndex][mealType];
        if (!mealToUpdate || mealToUpdate.isLogged) return;

        const { isLogged, ...mealData } = mealToUpdate;
        const mealToLog: Omit<Meal, 'id' | 'userId'> = {
            name: mealData.name,
            macros: mealData.macros,
            mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1) as MealType,
            ingredients: mealData.ingredients,
            instructions: mealData.instructions,
        };
        
        await logMeal(mealToLog);
        
        mealToUpdate.isLogged = true;
        setWeeklyMealPlan(updatedPlan);

        const key = getCacheKey('meal_plan');
        if (key) await cachingService.set(key, updatedPlan);
        
        const { error } = await supabase.from('meal_plans').update({ plan: updatedPlan }).eq('user_id', user.id);
        if (error) {
            setWeeklyMealPlan(originalPlan);
            if (key) await cachingService.set(key, originalPlan);
            throw error;
        }
    }, [user, weeklyMealPlan, logMeal, getCacheKey]);

    return (
        <NutritionContext.Provider value={{ 
            meals, 
            macros, 
            weeklyMealPlan, 
            isMealPlanLoading, 
            logMeal, 
            removeMeal, 
            generateAndSetWeeklyMealPlan, 
            markMealAsLogged 
        }}>
            {children}
        </NutritionContext.Provider>
    );
};

export const useNutrition = () => {
    const context = useContext(NutritionContext);
    if (context === undefined) {
        throw new Error('useNutrition must be used within a NutritionProvider');
    }
    return context;
};
