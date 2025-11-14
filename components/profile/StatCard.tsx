
import React, { ReactNode } from 'react';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface StatCardProps {
    icon: string;
    iconColor: string;
    title: string;
    children: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, title, children }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <Icon name={icon} size={16} color={iconColor} />
                <p style={styles.title}>{title}</p>
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.slate[50],
        padding: spacing.md,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: 100,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.subtle,
        fontWeight: '600',
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    }
});
