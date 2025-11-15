
import React from 'react';
import type { JournalEntry } from '../../types';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface JournalEntryCardProps {
    entry: JournalEntry;
    onClick: () => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <button 
            onClick={onClick}
            style={styles.card}
        >
            <div style={styles.header}>
                <div style={styles.headerText}>
                    <p style={styles.date}>{formattedDate}</p>
                    <h3 style={styles.title}>{entry.title || 'Journal Entry'}</h3>
                </div>
                <div style={styles.aiInsightBadge}>
                    <Icon name="lightbulb" size={12} color={isDark ? colors.light : colors.dark} />
                    <span style={styles.aiInsightText}>AI Insight</span>
                </div>
            </div>
            <p style={styles.content}>
                {entry.content}
            </p>
        </button>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer'
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerText: {
        flex: 1,
    },
    date: {
        ...typography.body,
        fontSize: 12,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: colors.primary,
        margin: 0,
    },
    title: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    aiInsightBadge: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        padding: '4px 8px',
        borderRadius: 999,
    },
    aiInsightText: {
        ...typography.body,
        fontSize: 10,
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
    },
    content: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
    },
});
