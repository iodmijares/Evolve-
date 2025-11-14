

import React from 'react';
import type { CyclePatternInsight } from '../../types';
import { Spinner } from '../shared/Spinner';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface CyclePatternInsightCardProps {
    insight: CyclePatternInsight | null;
    isLoading: boolean;
}

export const CyclePatternInsightCard: React.FC<CyclePatternInsightCardProps> = ({ insight, isLoading }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <Spinner size="sm" />
                <p style={styles.loadingText}>AI is analyzing your long-term patterns...</p>
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div style={styles.card}>
            <div style={styles.iconContainer}>
                <Icon name="lightbulb" size={24} color={colors.primary} />
            </div>
            <div style={styles.content}>
                <h3 style={styles.title}>{insight.title}</h3>
                <p style={styles.detailText}><span style={styles.bold}>Pattern Found:</span> {insight.patternDetail}</p>
                <p style={styles.detailText}><span style={styles.bold}>Suggestion:</span> {insight.suggestion}</p>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    loadingContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
    },
    loadingText: {
        ...typography.subtle,
        color: isDark ? colors.gray[300] : colors.slate[600],
        margin: 0,
    },
    card: {
        padding: spacing.md,
        borderRadius: 8,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : colors.emerald[50],
        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : colors.border}`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    iconContainer: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
        padding: 8,
        borderRadius: 999,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    title: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    detailText: {
        ...typography.body,
        fontSize: 14,
        color: isDark ? colors.gray[300] : colors.slate[700],
        marginTop: spacing.sm,
        margin: 0,
    },
    bold: {
        fontWeight: '600',
        color: isDark ? colors.light : colors.dark,
    }
});
