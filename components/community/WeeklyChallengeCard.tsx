
import React, { useState, useEffect } from 'react';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing } from '../../styles/theme';
import { supabase } from '../../services/supabaseClient';
import { WeeklyChallenge } from '../../types';
import { Spinner } from '../shared/Spinner';

const WeeklyChallengeCard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWeeklyChallenge();
    }, []);

    const fetchWeeklyChallenge = async () => {
        try {
            // Fetch active weekly challenge
            const { data: challengeData, error: challengeError } = await supabase
                .from('weekly_challenges')
                .select('*')
                .eq('is_active', true)
                .single();

            if (challengeError) {
                console.error('Error fetching weekly challenge:', challengeError);
                // Use fallback static data if no challenge exists
                setChallenge({
                    id: 'default',
                    title: 'Mindful Movement',
                    description: 'Log at least 30 minutes of activity, 5 days this week. Any movement counts!',
                    icon: 'workout',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    targetMetric: 'workout_minutes',
                    targetValue: 150,
                    isActive: true
                });
                setProgress(45);
                setIsLoading(false);
                return;
            }

            setChallenge(challengeData);

            // Calculate community progress
            await calculateCommunityProgress(challengeData);
        } catch (error) {
            console.error('Error in fetchWeeklyChallenge:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateCommunityProgress = async (challengeData: WeeklyChallenge) => {
        try {
            // Get all users count
            const { count: totalUsers, error: usersError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (usersError || !totalUsers) {
                setProgress(0);
                return;
            }

            // Calculate based on metric type
            let completedUsers = 0;

            if (challengeData.targetMetric === 'workout_minutes') {
                // Count users who logged enough workout minutes this week
                const { data: workouts, error: workoutsError } = await supabase
                    .from('logged_workouts')
                    .select('user_id, duration')
                    .gte('date', challengeData.startDate)
                    .lte('date', challengeData.endDate);

                if (!workoutsError && workouts) {
                    const userMinutes = new Map<string, number>();
                    workouts.forEach(w => {
                        const current = userMinutes.get(w.user_id) || 0;
                        userMinutes.set(w.user_id, current + w.duration);
                    });
                    completedUsers = Array.from(userMinutes.values())
                        .filter(minutes => minutes >= challengeData.targetValue).length;
                }
            } else if (challengeData.targetMetric === 'logged_meals') {
                // Count users who logged enough meals
                const { data: meals, error: mealsError } = await supabase
                    .from('logged_meals')
                    .select('user_id')
                    .gte('date', challengeData.startDate)
                    .lte('date', challengeData.endDate);

                if (!mealsError && meals) {
                    const userMeals = new Map<string, number>();
                    meals.forEach(m => {
                        const current = userMeals.get(m.user_id) || 0;
                        userMeals.set(m.user_id, current + 1);
                    });
                    completedUsers = Array.from(userMeals.values())
                        .filter(count => count >= challengeData.targetValue).length;
                }
            }

            const progressPercentage = Math.round((completedUsers / totalUsers) * 100);
            setProgress(progressPercentage);
        } catch (error) {
            console.error('Error calculating progress:', error);
            setProgress(0);
        }
    };

    if (isLoading) {
        return (
            <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Spinner />
                </div>
            </div>
        );
    }

    if (!challenge) {
        return null;
    }

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div style={styles.iconContainer}>
                    <Icon name={challenge.icon as any} size={32} color={colors.accent} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={styles.categoryText}>WEEKLY CHALLENGE</p>
                    <h3 style={styles.title}>{challenge.title}</h3>
                    <p style={styles.description}>{challenge.description}</p>
                </div>
            </div>
            <div style={{ marginTop: spacing.md }}>
                <div style={styles.progressHeader}>
                    <p style={styles.progressLabel}>Community Progress</p>
                    <p style={styles.progressPercentage}>{progress}%</p>
                </div>
                <div style={styles.progressBarContainer}>
                    <div 
                        style={{...styles.progressBar, width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        background: isDark 
            ? 'rgba(31, 41, 55, 0.6)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '16px',
    },
    iconContainer: {
        background: isDark
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '14px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    categoryText: {
        fontSize: '11px',
        fontWeight: '700',
        color: colors.accent,
        margin: 0,
        letterSpacing: '0.8px',
    },
    title: {
        fontSize: '18px',
        fontWeight: '800',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        marginTop: '4px',
        letterSpacing: '-0.3px',
    },
    description: {
        fontSize: '14px',
        fontWeight: '500',
        marginTop: '8px',
        color: isDark ? colors.gray[300] : colors.slate[600],
        margin: 0,
        lineHeight: '1.5',
    },
    progressHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    progressLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    progressPercentage: {
        fontSize: '16px',
        fontWeight: '800',
        color: colors.accent,
        margin: 0,
    },
    progressBarContainer: {
        width: '100%',
        background: isDark ? 'rgba(55, 65, 81, 0.5)' : colors.slate[200],
        borderRadius: '999px',
        height: '12px',
        overflow: 'hidden',
    },
    progressBar: {
        background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
        height: '12px',
        borderRadius: '999px',
        transition: 'width 0.3s ease',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
    }
});

export default WeeklyChallengeCard;
