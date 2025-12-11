import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Workout, WorkoutPlan } from '../types';
import { cachingService } from '../utils/cachingService';
import { useAuth } from './AuthContext';
import { generateMonthlyWorkoutPlan } from '../services/groqService';
import { fromDBShape, toDBShape } from '../utils/dbHelper';

interface FitnessContextType {
    workoutHistory: Workout[];
    workoutPlan: WorkoutPlan | null;
    isWorkoutPlanGenerating: boolean;
    logWorkout: (workout: Omit<Workout, 'id' | 'userId'>) => void;
    generateAndSaveWorkoutPlan: (forceRegenerate?: boolean) => Promise<void>;
    markWorkoutAsComplete: (day: number) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const FitnessProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const { user } = useAuth();
    const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
    const [isWorkoutPlanGenerating, setIsWorkoutPlanGenerating] = useState(false);

    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    useEffect(() => {
        if (!user) {
            setWorkoutHistory([]);
            setWorkoutPlan(null);
            return;
        }

        const loadFitnessData = async () => {
            // Load Workout History
            const workoutsRes = await cachingService.getOrSet(
                `evolve_${user.id}_workout_history`,
                30 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('workouts').select('id, user_id, name, type, duration, description, date, video_url, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
                    return { data };
                }
            );
            if (workoutsRes?.data) setWorkoutHistory(workoutsRes.data.map(fromDBShape<Workout>));

            // Load Workout Plan
            const workoutPlanRes = await cachingService.getOrSet(
                `evolve_${user.id}_workout_plan`,
                60 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('workout_plans').select('plan').eq('user_id', user.id).maybeSingle();
                    return data?.plan || null;
                }
            );
            if (workoutPlanRes) setWorkoutPlan(workoutPlanRes as WorkoutPlan);
        };

        loadFitnessData();
    }, [user]);

    const logWorkout = useCallback(async (workout: Omit<Workout, 'id' | 'userId'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('workouts').insert(toDBShape({ ...workout, userId: user.id })).select().single();
        if (error) console.error("Error logging workout:", error.message);
        else {
            setWorkoutHistory(prev => {
                const updatedHistory = [fromDBShape<Workout>(data), ...prev];
                const key = getCacheKey('workout_history');
                if(key) cachingService.set(key, updatedHistory);
                return updatedHistory;
            });
        }
    }, [user, getCacheKey]);

    const generateAndSaveWorkoutPlan = useCallback(async (forceRegenerate: boolean = false) => {
        if (!user || isWorkoutPlanGenerating) return;
        
        // Only skip if there's a valid plan AND it's not a forced regenerate
        if (!forceRegenerate && workoutPlan && Array.isArray(workoutPlan) && workoutPlan.length > 0) {
            const completedCount = workoutPlan.filter(day => day.isCompleted).length;
            const workoutDays = workoutPlan.filter(day => day.type === 'workout').length;
            if (completedCount < workoutDays) return;
        }
        
        setIsWorkoutPlanGenerating(true);
        try {
            const plan = await generateMonthlyWorkoutPlan(user);
            const { error } = await supabase.from('workout_plans').upsert({ user_id: user.id, plan: plan }, { onConflict: 'user_id' });
            if (error) throw error;
            setWorkoutPlan(plan);
            const key = getCacheKey('workout_plan');
            if (key) await cachingService.set(key, plan);
        } catch (err) {
            console.error("Error generating workout plan:", err);
            throw err; // Re-throw so UI can handle it
        } finally { setIsWorkoutPlanGenerating(false); }
    }, [user, isWorkoutPlanGenerating, workoutPlan, getCacheKey]);

    const markWorkoutAsComplete = useCallback(async (day: number) => {
        if (!user || !workoutPlan || !Array.isArray(workoutPlan)) return;
        
        const originalPlan = [...workoutPlan];
        const updatedPlan = workoutPlan.map(planDay => planDay.day === day ? { ...planDay, isCompleted: true } : planDay);
        
        setWorkoutPlan(updatedPlan);
        const key = getCacheKey('workout_plan');
        if (key) await cachingService.set(key, updatedPlan);
        
        const { error } = await supabase.from('workout_plans').update({ plan: updatedPlan }).eq('user_id', user.id);
        if (error) {
            setWorkoutPlan(originalPlan); 
            if (key) await cachingService.set(key, originalPlan);
            throw error;
        }
    }, [user, workoutPlan, getCacheKey]);

    return (
        <FitnessContext.Provider value={{ 
            workoutHistory, 
            workoutPlan, 
            isWorkoutPlanGenerating, 
            logWorkout, 
            generateAndSaveWorkoutPlan, 
            markWorkoutAsComplete 
        }}>
            {children}
        </FitnessContext.Provider>
    );
};

export const useFitness = () => {
    const context = useContext(FitnessContext);
    if (context === undefined) {
        throw new Error('useFitness must be used within a FitnessProvider');
    }
    return context;
};
