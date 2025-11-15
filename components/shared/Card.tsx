
import React, { ReactNode } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface CardProps {
    title: string;
    icon?: string;
    children: ReactNode;
    style?: any;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, style }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    return (
        <div style={{...styles.card, ...style}}>
            <div style={styles.header}>
                {icon && <Icon name={icon} size={24} color={colors.primary} />}
                <h2 style={styles.title}>{title}</h2>
            </div>
            <div>{children}</div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        background: isDark 
            ? 'rgba(31, 41, 55, 0.95)'
            : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '16px',
        boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)'
            : '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.3px',
    }
});
