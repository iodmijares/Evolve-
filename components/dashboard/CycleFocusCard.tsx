
import React from 'react';
import { Icon } from '../shared/Icon';
import type { CycleFocusInsight } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface InfoPillProps {
    icon: string;
    title: string;
    content: string;
    pillColors: { bg: string; text: string; icon: string };
}

const InfoPill: React.FC<InfoPillProps> = ({ icon, title, content, pillColors }) => {
    return (
        <div style={{...styles.pillContainer, backgroundColor: pillColors.bg }}>
            <Icon name={icon} size={24} color={pillColors.icon} style={styles.pillIcon} />
            <div style={styles.pillTextContainer}>
                <p style={{...styles.pillTitle, color: pillColors.text }}>{title}</p>
                <p style={{...styles.pillContent, color: pillColors.text }}>{content}</p>
            </div>
        </div>
    );
};

interface CycleFocusCardProps {
    insight: CycleFocusInsight;
}

const CycleFocusCard: React.FC<CycleFocusCardProps> = ({ insight }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const pillColors = {
        energy: isDark ? { bg: 'rgba(14, 165, 233, 0.1)', text: colors.secondary, icon: colors.secondary } : { bg: colors.sky[50], text: colors.sky[800], icon: colors.secondary },
        nutrition: isDark ? { bg: 'rgba(16, 185, 129, 0.1)', text: colors.emerald[300], icon: colors.emerald[400] } : { bg: colors.emerald[50], text: colors.emerald[700], icon: colors.primary },
        mindfulness: isDark ? { bg: 'rgba(192, 132, 252, 0.1)', text: colors.fuchsia[300], icon: colors.fuchsia[400] } : { bg: colors.fuchsia[50], text: colors.fuchsia[800], icon: colors.fuchsia[500] },
    };

    return (
        <div style={styles.card}>
            <h2 style={styles.title}>Daily Focus</h2>
            <p style={styles.summary}>{insight.summary}</p>
            <div style={styles.pillsWrapper}>
                <InfoPill icon="workout" title="Energy" content={insight.energyPrediction} pillColors={pillColors.energy} />
                <InfoPill icon="food" title="Nutrition Tip" content={insight.nutritionTip} pillColors={pillColors.nutrition} />
                <InfoPill icon="lightbulb" title="Mindfulness" content={insight.mindfulnessSuggestion} pillColors={pillColors.mindfulness} />
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    pillContainer: {
        padding: spacing.sm,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    pillIcon: {
        marginTop: 2,
    },
    pillTextContainer: {
        flex: 1,
    },
    pillTitle: {
        ...typography.h3,
        fontSize: 14,
        margin: 0,
    },
    pillContent: {
        ...typography.body,
        fontSize: 14,
        margin: 0,
    }
};


const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
    },
    title: {
        ...typography.h2,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    summary: {
        ...typography.subtle,
        paddingBottom: spacing.sm,
        borderBottom: `1px solid ${isDark ? colors.gray[700] : colors.border}`,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    pillsWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
    },
});

export default CycleFocusCard;
