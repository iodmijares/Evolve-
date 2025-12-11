import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { JournalEntry } from '../types';
import { cachingService } from '../utils/cachingService';
import { useAuth } from './AuthContext';
import { analyzeJournalEntry } from '../services/groqService';
import { fromDBShape, toDBShape } from '../utils/dbHelper';

interface JournalContextType {
    journalEntries: JournalEntry[];
    logJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>, date: string) => Promise<JournalEntry>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const { user } = useAuth();
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

    const getCacheKey = useCallback((key: string) => user ? `evolve_${user.id}_${key}` : null, [user]);

    useEffect(() => {
        if (!user) {
            setJournalEntries([]);
            return;
        }

        const loadJournalEntries = async () => {
            const journalRes = await cachingService.getOrSet(
                `evolve_${user.id}_journal_entries`,
                15 * 60 * 1000,
                async () => {
                    const { data } = await supabase
                        .from('journal_entries')
                        .select('id, user_id, date, title, content, summary, themes, suggestion')
                        .eq('user_id', user.id)
                        .order('date', { ascending: false })
                        .limit(50);
                    return { data };
                }
            );
            if (journalRes?.data) setJournalEntries(journalRes.data.map(fromDBShape<JournalEntry>));
        };

        loadJournalEntries();
    }, [user]);

    const logJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>, date: string): Promise<JournalEntry> => {
        if (!user) throw new Error("User not logged in");
        let newEntryData: Omit<JournalEntry, 'id'> = { ...entry, userId: user.id, date };
        const { data: savedData, error } = await supabase
            .from('journal_entries')
            .upsert(toDBShape(newEntryData), { onConflict: 'user_id, date' })
            .select('id, user_id, date, title, content, summary, themes, suggestion')
            .single();
            
        if (error || !savedData) throw new Error("Could not save journal entry.");
        
        const savedEntry = fromDBShape<JournalEntry>(savedData);
        
        // Async analysis
        const displayName = user.username || user.name;
        analyzeJournalEntry(savedEntry, displayName).then(async analysis => {
            const { data: finalData, error: updateError } = await supabase
                .from('journal_entries')
                .update(analysis)
                .eq('id', savedEntry.id)
                .select('id, user_id, date, title, content, summary, themes, suggestion')
                .single();
                
            if (updateError || !finalData) return;
            const finalEntryShaped = fromDBShape<JournalEntry>(finalData);
            setJournalEntries(prev => {
                const updated = prev.map(e => e.id === finalEntryShaped.id ? finalEntryShaped : e);
                const key = getCacheKey('journal_entries');
                if (key) cachingService.set(key, updated);
                return updated;
            });
        });

        setJournalEntries(prev => {
            const existingIndex = prev.findIndex(e => e.date === date);
            const updated = existingIndex > -1 ? [...prev] : [savedEntry, ...prev];
            if (existingIndex > -1) updated[existingIndex] = savedEntry;
            const sorted = updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const key = getCacheKey('journal_entries');
            if (key) cachingService.set(key, sorted);
            return sorted;
        });
        
        return savedEntry;
    }, [user, getCacheKey]);

    return (
        <JournalContext.Provider value={{ 
            journalEntries, 
            logJournalEntry 
        }}>
            {children}
        </JournalContext.Provider>
    );
};

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (context === undefined) {
        throw new Error('useJournal must be used within a JournalProvider');
    }
    return context;
};
