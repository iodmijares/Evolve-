import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { cachingService } from '../utils/cachingService';
import { logger } from '../utils/logger';

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

interface AuthContextType {
    session: Session | null;
    user: UserProfile | null;
    isLoading: boolean;
    isOnboardingComplete: boolean;
    completeOnboarding: (profileData: Omit<UserProfile, 'id' | 'email'>) => Promise<void>;
    updateUserProfile: (profileData: UserProfile) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (!mounted) return;
                setSession(initialSession);
                if (initialSession) {
                    await loadUserData(initialSession);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                logger.error('Error initializing auth', error, { context: 'AuthContext' });
                if (mounted) setIsLoading(false);
            }
        };

        const loadUserData = async (currentSession: Session) => {
            if (!currentSession) return;
            const userId = currentSession.user.id;
            const profileCacheKey = `evolve_${userId}_profile`;

            let userProfile: UserProfile | null = await cachingService.get<UserProfile>(profileCacheKey, 5 * 60 * 1000);

            if (!userProfile) {
                const { data: profileData, error } = await supabase
                    .from('profiles').select('*').eq('id', userId).single();

                if (error || !profileData) {
                    // New user or error, partial profile
                    setUser({ id: userId, email: currentSession.user.email! } as UserProfile);
                    setIsOnboardingComplete(false);
                    setIsLoading(false);
                    return;
                }

                userProfile = { ...fromDBShape(profileData), id: profileData.id, email: currentSession.user.email! } as UserProfile;
                await cachingService.set(profileCacheKey, userProfile);
            }

            setUser(userProfile);
            setIsOnboardingComplete(!!userProfile?.onboardingDate);
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (!mounted) return;
            setSession(currentSession);
            if (currentSession) {
                setIsLoading(true);
                await loadUserData(currentSession);
            } else {
                setUser(null);
                setIsOnboardingComplete(false);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const updateUserProfile = useCallback(async (profileData: UserProfile) => {
        if (!user) throw new Error("No user to update");
        const { id, email, ...updateData } = profileData;
        
        const { error } = await supabase.from('profiles').update(toDBShape(updateData)).eq('id', user.id);
        
        if (error) throw error;
        
        setUser(profileData);
        cachingService.set(`evolve_${user.id}_profile`, profileData);
    }, [user]);

    const completeOnboarding = useCallback(async (profileData: Omit<UserProfile, 'id' | 'email'>) => {
        if (!session?.user) throw new Error("No active session");
        
        const profileToUpsert = toDBShape({ 
            id: session.user.id, 
            ...profileData, 
            onboardingDate: new Date().toISOString() 
        });

        const { data, error } = await supabase.from('profiles').upsert(profileToUpsert).select().single();

        if (error) throw new Error(error.message || "Failed to save profile.");
        if (!data) throw new Error("Failed to save profile data.");

        const fullProfile: UserProfile = { ...fromDBShape(data), email: session.user.email! };
        setUser(fullProfile);
        setIsOnboardingComplete(true);
        cachingService.set(`evolve_${fullProfile.id}_profile`, fullProfile);
    }, [session]);

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setIsOnboardingComplete(false);
        // Caching service clearing can be handled here or by consumers listening to auth state
    };

    return (
        <AuthContext.Provider value={{ 
            session, 
            user, 
            isLoading, 
            isOnboardingComplete, 
            completeOnboarding, 
            updateUserProfile, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
