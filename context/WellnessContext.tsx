import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { WeightEntry, DailyLog, CycleFocusInsight, CyclePatternInsight } from '../types';
import { cachingService } from '../utils/cachingService';
import { useAuth } from './AuthContext';
import { generateCyclePatternInsight } from '../services/groqService';
import { fromDBShape, toDBShape } from '../utils/dbHelper';

interface WellnessContextType {
    weightHistory: WeightEntry[];
    dailyLogs: DailyLog[];
    cycleInsight: CycleFocusInsight | null;
    cyclePatternInsight: CyclePatternInsight | null;
    isCyclePatternInsightLoading: boolean;
    setCycleInsight: (insight: CycleFocusInsight | null) => void;
    setCyclePatternInsight: (insight: CyclePatternInsight | null) => void;
    logWeight: (weight: number) => void;
    logDailyEntry: (log: Omit<DailyLog, 'id' | 'userId' | 'date'>, date: string) => Promise<void>;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export const WellnessProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const { user, updateUserProfile } = useAuth();
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [cycleInsight, setCycleInsight] = useState<CycleFocusInsight | null>(null);
    const [cyclePatternInsight, setCyclePatternInsight] = useState<CyclePatternInsight | null>(null);
    const [isCyclePatternInsightLoading, setIsCyclePatternInsightLoading] = useState(false);

    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    useEffect(() => {
        if (!user) {
            setWeightHistory([]);
            setDailyLogs([]);
            setCycleInsight(null);
            setCyclePatternInsight(null);
            return;
        }

        const loadWellnessData = async () => {
            // Load Weight History
            const weightRes = await cachingService.getOrSet(
                `evolve_${user.id}_weight_history`,
                30 * 60 * 1000,
                async () => {
                    const { data } = await supabase
                        .from('weight_logs')
                        .select('id, user_id, date, weight')
                        .eq('user_id', user.id)
                        .order('date', { ascending: true });
                    return { data };
                }
            );
            if (weightRes?.data) setWeightHistory(weightRes.data.map(fromDBShape<WeightEntry>));

            // Load Daily Logs
            const dailyLogsRes = await cachingService.getOrSet(
                `evolve_${user.id}_daily_logs`,
                15 * 60 * 1000,
                async () => {
                    const { data } = await supabase
                        .from('daily_logs')
                        .select('id, user_id, date, mood, symptoms, has_period')
                        .eq('user_id', user.id)
                        .order('date', { ascending: false })
                        .limit(90);
                    return { data };
                }
            );
            if (dailyLogsRes?.data) setDailyLogs(dailyLogsRes.data.map(fromDBShape<DailyLog>));
        };

        loadWellnessData();
    }, [user]);

    // AI Insight Logic
    useEffect(() => {
        const fetchPatternInsight = async () => {
            if (user && user.gender === 'female' && dailyLogs.length > 10 && !cyclePatternInsight && !isCyclePatternInsightLoading) {
                const key = getCacheKey('cycle_pattern_insight');
                if (key) {
                    const cachedInsight = await cachingService.get<CyclePatternInsight>(key, 7 * 24 * 60 * 60 * 1000);
                    if (cachedInsight) {
                        setCyclePatternInsight(cachedInsight);
                        return;
                    }
                }
                
                const timeoutId = setTimeout(async () => {
                    setIsCyclePatternInsightLoading(true);
                    try {
                        const insight = await generateCyclePatternInsight(user, dailyLogs);
                        persistCyclePatternInsight(insight);
                    } catch (error) {
                        console.error("Failed to generate cycle pattern insight:", error);
                    } finally {
                        setIsCyclePatternInsightLoading(false);
                    }
                }, 1000);
                
                return () => clearTimeout(timeoutId);
            }
        };
        fetchPatternInsight();
    }, [user, dailyLogs.length, cyclePatternInsight, isCyclePatternInsightLoading, getCacheKey]);

    const persistCycleInsight = useCallback((insight: CycleFocusInsight | null) => {
        setCycleInsight(insight);
        const key = getCacheKey('cycle_insight');
        if (key) {
            if (insight) cachingService.set(key, insight);
            else cachingService.clear(key);
        }
    }, [getCacheKey]);

    const persistCyclePatternInsight = useCallback((insight: CyclePatternInsight | null) => {
        setCyclePatternInsight(insight);
        const key = getCacheKey('cycle_pattern_insight');
        if (key) {
            if (insight) cachingService.set(key, insight);
            else cachingService.clear(key);
        }
    }, [getCacheKey]);

    const logWeight = useCallback(async (weight: number) => {
        if (!user) return;
        const date = new Date().toISOString().split('T')[0];
        const newEntry = { userId: user.id, date, weight };
        const { data, error } = await supabase
            .from('weight_logs')
            .upsert(toDBShape(newEntry), { onConflict: 'user_id, date' })
            .select('id, user_id, date, weight')
            .single();
            
        if (error) { console.error("Error logging weight:", error.message); return; }
        
        // Update profile weight
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
        const { data, error } = await supabase
            .from('daily_logs')
            .upsert(toDBShape({ ...log, userId: user.id, date }), { onConflict: 'user_id, date' })
            .select('id, user_id, date, mood, symptoms, has_period')
            .single();
            
        if (error) { console.error("Error logging daily entry:", error.message); return; }
        
        if (log.hasPeriod && user.gender === 'female') {
            const currentLastPeriod = user.lastPeriodStartDate ? new Date(user.lastPeriodStartDate) : null;
            const logDate = new Date(date);
            
            if (!currentLastPeriod || logDate > currentLastPeriod) {
                // We need to update profile. logic is slightly different from logWeight because we want to clear cycle insights too.
                // We'll call updateUserProfile to handle DB and local state sync
                await updateUserProfile({ ...user, lastPeriodStartDate: date });
                
                // Clear cycle insights
                const insightKey = getCacheKey('cycle_insight');
                if (insightKey) cachingService.clear(insightKey);
                setCycleInsight(null);
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
    }, [user, updateUserProfile, getCacheKey]);

    return (
        <WellnessContext.Provider value={{ 
            weightHistory, 
            dailyLogs, 
            cycleInsight, 
            cyclePatternInsight, 
            isCyclePatternInsightLoading,
            setCycleInsight: persistCycleInsight,
            setCyclePatternInsight: persistCyclePatternInsight,
            logWeight, 
            logDailyEntry
        }}>
            {children}
        </WellnessContext.Provider>
    );
};

export const useWellness = () => {
    const context = useContext(WellnessContext);
    if (context === undefined) {
        throw new Error('useWellness must be used within a WellnessProvider');
    }
    return context;
};