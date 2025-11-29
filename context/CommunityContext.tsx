import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Achievement, Challenge } from '../types';
import { cachingService } from '../utils/cachingService';
import { useAuth } from './AuthContext';
import { useNutrition } from './NutritionContext';
import { useFitness } from './FitnessContext';
import { useWellness } from './WellnessContext';
import staticAchievements, { checkAchievement } from '../utils/achievements';
import { fromDBShape, toDBShape } from '../utils/dbHelper';

interface CommunityContextType {
    achievements: Achievement[];
    challenges: Challenge[];
    addChallenge: (challengeData: Omit<Challenge, 'id' | 'isCompleted' | 'progress' | 'userId' | 'createdAt'>) => Promise<void>;
    addAchievements: (newAchievements: Achievement[]) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const { user, isOnboardingComplete } = useAuth();
    const { meals } = useNutrition();
    const { workoutHistory } = useFitness();
    const { dailyLogs } = useWellness();

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>(staticAchievements);
    const [earnedAchievementIds, setEarnedAchievementIds] = useState<Set<string>>(new Set());

    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    useEffect(() => {
        if (!user) {
            setChallenges([]);
            setEarnedAchievementIds(new Set());
            return;
        }

        const loadCommunityData = async () => {
            // Load Earned Achievements
            const earnedRes = await cachingService.getOrSet(
                `evolve_${user.id}_earned_achievements`,
                30 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('earned_achievements').select('achievement_id').eq('user_id', user.id);
                    return { data };
                }
            );
            if (earnedRes?.data) setEarnedAchievementIds(new Set(earnedRes.data.map((a: any) => a.achievement_id)));

            // Load Challenges
            const challengesRes = await cachingService.getOrSet(
                `evolve_${user.id}_challenges`,
                15 * 60 * 1000,
                async () => {
                    const { data } = await supabase.from('challenges').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                    return { data };
                }
            );
            if (challengesRes?.data) setChallenges(challengesRes.data.map(fromDBShape<Challenge>));
        };

        loadCommunityData();
    }, [user]);

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
                console.error("Error logging achievements:", error.message);
            }
        }
    }, [user, meals, workoutHistory, dailyLogs, isOnboardingComplete, earnedAchievementIds, getCacheKey]);

    useEffect(() => { 
        checkAndLogAchievements(); 
    }, [checkAndLogAchievements]);

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

    return (
        <CommunityContext.Provider value={{ 
            achievements, 
            challenges, 
            addChallenge, 
            addAchievements 
        }}>
            {children}
        </CommunityContext.Provider>
    );
};

export const useCommunity = () => {
    const context = useContext(CommunityContext);
    if (context === undefined) {
        throw new Error('useCommunity must be used within a CommunityProvider');
    }
    return context;
};
