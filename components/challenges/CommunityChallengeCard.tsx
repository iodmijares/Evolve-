
import React from 'react';
import { Card } from '../shared/Card';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

export const CommunityChallengeCard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    // This is static for now, could be fetched from a 'challenges' table in a real app
    const challenge = {
        title: "Global Step-Up",
        description: "As a community, let's walk a total of 10 million steps this week!",
        progress: 67, // Static percentage
        reward: "Exclusive Community Badge",
    };

    return (
        <Card title="Community Challenge" icon="users">
            <div style={styles.container}>
                <h3 style={styles.challengeTitle}>{challenge.title}</h3>
                <p style={styles.challengeDescription}>{challenge.description}</p>
                
                <div style={{ marginTop: spacing.sm }}>
                    <div style={styles.progressHeader}>
                        <p style={styles.progressLabel}>Progress</p>
                        <p style={styles.progressPercentage}>{challenge.progress}%</p>
                    </div>
                    <div style={styles.progressBarContainer}>
                        <div 
                            style={{...styles.progressBar, width: `${challenge.progress}%` }}
                        />
                    </div>
                </div>

                <div style={styles.rewardContainer}>
                    <p style={styles.rewardText}><span style={{ fontWeight: 'bold' }}>Reward:</span> {challenge.reward}</p>
                </div>
            </div>
        </Card>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    challengeTitle: {
        ...typography.h3,
        color: colors.primary,
        margin: 0,
    },
    challengeDescription: {
        ...typography.subtle,
        fontSize: 14,
        color: isDark ? colors.gray[300] : colors.muted,
        margin: 0,
    },
    progressHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        ...typography.body,
        fontSize: 14,
        fontWeight: '600',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    progressPercentage: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.primary,
        margin: 0,
    },
    progressBarContainer: {
        width: '100%',
        backgroundColor: isDark ? colors.gray[700] : colors.slate[200],
        borderRadius: 999,
        height: 12,
    },
    progressBar: {
        backgroundColor: colors.primary,
        height: 12,
        borderRadius: 999,
    },
    rewardContainer: {
        textAlign: 'center',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : colors.emerald[50],
        padding: spacing.sm,
        borderRadius: 8,
    },
    rewardText: {
        color: isDark ? colors.emerald[300] : colors.emerald[800],
        fontSize: 14,
        textAlign: 'center',
        margin: 0,
    }
});
