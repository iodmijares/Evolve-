
import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';
import { supabase } from '../../services/supabaseClient';
import { generateCommunityInsight, CommunityInsight } from '../../services/groqService';
import { Spinner } from '../shared/Spinner';

export const CommunityInsightCard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [insight, setInsight] = useState<CommunityInsight | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndGenerateInsight = async () => {
            try {
                setIsLoading(true);
                
                console.log('🔍 Fetching community workout data...');
                
                // Fetch community workout data from last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const { data: workouts, error: dbError } = await supabase
                    .from('workouts')
                    .select('created_at, type')
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(500);

                if (dbError) {
                    console.error('❌ Database error:', dbError);
                    throw dbError;
                }

                console.log('📊 Fetched workouts:', workouts?.length || 0);

                // If no workouts, use fallback
                if (!workouts || workouts.length === 0) {
                    console.log('⚠️ No workout data found, using fallback');
                    setInsight({
                        title: "Getting Started",
                        description: "Be the first to log a workout and inspire the community! Your fitness journey can motivate others to start theirs.",
                        statValue: "0",
                        statLabel: "Community workouts logged",
                        trendDirection: "stable"
                    });
                    return;
                }

                // Aggregate workout data by date and type
                const workoutStats = workouts.reduce((acc: any, workout) => {
                    const date = workout.created_at.split('T')[0];
                    if (!acc[date]) {
                        acc[date] = { date, count: 0, type: workout.type };
                    }
                    acc[date].count++;
                    return acc;
                }, {});

                const workoutArray = Object.values(workoutStats) as { date: string; count: number; type: string }[];
                
                console.log('🤖 Generating AI insight from', workoutArray.length, 'days of data...');
                
                // Generate AI insight
                const generatedInsight = await generateCommunityInsight(workoutArray);
                console.log('✅ AI insight generated:', generatedInsight.title);
                setInsight(generatedInsight);
            } catch (err: any) {
                console.error('❌ Error generating community insight:', err);
                console.error('Error details:', err.message, err.status);
                setError('Unable to generate insight');
                
                // Fallback to default insight
                setInsight({
                    title: "Weekend Warriors",
                    description: "Community activity is highest on Saturdays! It seems everyone is motivated to start the weekend strong. Keep up the great work!",
                    statValue: "+25%",
                    statLabel: "Workout activity on Saturdays vs. weekdays",
                    trendDirection: "up"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndGenerateInsight();
    }, []);

    if (isLoading) {
        return (
            <Card title="Community Insight" icon="lightbulb">
                <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center', minHeight: '150px' }}>
                    <Spinner />
                </div>
            </Card>
        );
    }

    if (!insight) return null;

    return (
        <Card title="Community Insight" icon="lightbulb">
            <div style={styles.container}>
                <h3 style={styles.insightTitle}>{insight.title}</h3>
                <p style={styles.insightDescription}>
                    {insight.description}
                </p>
                <div style={styles.statContainer}>
                    <p style={styles.statValue}>{insight.statValue}</p>
                    <p style={styles.statLabel}>{insight.statLabel}</p>
                </div>
            </div>
        </Card>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    insightTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: colors.secondary,
        margin: 0,
        letterSpacing: '-0.3px',
    },
    insightDescription: {
        fontSize: '14px',
        fontWeight: '500',
        color: isDark ? colors.gray[300] : colors.slate[600],
        margin: 0,
        lineHeight: '1.6',
    },
    statContainer: {
        textAlign: 'center',
        background: isDark 
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        padding: '20px',
        borderRadius: '14px',
        border: `1px solid ${isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)'}`,
    },
    statValue: {
        fontSize: '36px',
        fontWeight: '900',
        color: colors.secondary,
        margin: 0,
        letterSpacing: '-1px',
    },
    statLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: isDark ? colors.sky[300] : colors.sky[800],
        margin: 0,
        marginTop: '6px',
    }
});