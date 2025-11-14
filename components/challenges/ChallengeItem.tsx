
import React from 'react';
import type { Challenge } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing } from '../../styles/theme';

interface ChallengeItemProps {
    challenge: Challenge;
}

export const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const progressPercentage = Math.min((challenge.progress / challenge.goal) * 100, 100);

    const typeStyles = {
        fitness: {
            border: colors.accent,
            bg: isDark ? 'rgba(245, 158, 11, 0.1)' : colors.amber[50],
            text: isDark ? colors.amber[300] : colors.amber[800],
            progressBg: colors.accent,
        },
        nutrition: {
            border: colors.secondary,
            bg: isDark ? 'rgba(14, 165, 233, 0.1)' : colors.sky[50],
            text: isDark ? colors.sky[300] : colors.sky[800],
            progressBg: colors.secondary,
        },
        mindfulness: {
            border: colors.fuchsia[500],
            bg: isDark ? 'rgba(217, 70, 239, 0.1)' : colors.fuchsia[50],
            text: isDark ? colors.fuchsia[300] : colors.fuchsia[800],
            progressBg: colors.fuchsia[500],
        },
    };

    const currentStyle = typeStyles[challenge.type as keyof typeof typeStyles];
    const styles = getStyles(isDark, currentStyle);

    return (
        <div style={{...styles.container, ...(challenge.isCompleted ? styles.completedContainer : {})}}>
            <div style={styles.header}>
                <div style={{ flex: 1 }}>
                    <p style={styles.title}>{challenge.title}</p>
                    <p style={styles.description}>{challenge.description}</p>
                </div>
                {challenge.isCompleted && (
                    <div style={styles.doneBadge}>
                        <span style={styles.doneText}>DONE</span>
                    </div>
                )}
            </div>
            <div style={{ marginTop: spacing.md }}>
                <div style={styles.progressHeader}>
                    <p style={styles.progressLabel}>Progress</p>
                    <p style={styles.progressLabel}>{challenge.progress} / {challenge.goal} {challenge.metric}</p>
                </div>
                 <div style={styles.progressBarContainer}>
                    <div 
                        style={{...styles.progressBar, width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean, currentStyle: any): { [key: string]: React.CSSProperties } => ({
    container: {
        padding: spacing.sm,
        borderRadius: 8,
        borderLeft: `4px solid ${currentStyle.border}`,
        backgroundColor: currentStyle.bg,
    },
    completedContainer: {
        opacity: 0.6,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontWeight: 'bold',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    description: {
        fontSize: 12,
        color: currentStyle.text,
        margin: 0,
    },
    doneBadge: {
        flexShrink: 0,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : colors.emerald[100],
        padding: '4px 8px',
        borderRadius: 999,
    },
    doneText: {
        color: isDark ? colors.emerald[300] : colors.emerald[800],
        fontSize: 10,
        fontWeight: 'bold',
    },
    progressHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        fontSize: 12,
        color: isDark ? colors.gray[300] : colors.slate[700],
        margin: 0,
    },
    progressBarContainer: {
        width: '100%',
        backgroundColor: isDark ? colors.gray[700] : colors.slate[200],
        borderRadius: 999,
        height: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 999,
        backgroundColor: currentStyle.progressBg,
    },
});
