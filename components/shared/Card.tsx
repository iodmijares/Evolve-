
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
            ? 'rgba(30, 41, 59, 0.7)'
            : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '16px',
        boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.04)',
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
        fontWeight: '800',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.4px',
    }
});
