
import React, { ReactNode } from 'react';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface OnboardingStepProps {
    isVisible: boolean;
    title: string;
    icon: string;
    children: ReactNode;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({ isVisible, title, icon, children }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    if (!isVisible) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.iconContainer}>
                    <Icon name={icon} size={20} color={colors.primary} />
                </div>
                <h3 style={styles.title}>{title}</h3>
            </div>
            {children}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'fadeIn 0.3s ease',
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '8px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
    },
    iconContainer: {
        background: isDark 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        padding: '12px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDark 
            ? '0 0 0 1px rgba(16, 185, 129, 0.25), 0 4px 6px rgba(16, 185, 129, 0.1)'
            : '0 0 0 1px rgba(16, 185, 129, 0.15), 0 4px 6px rgba(16, 185, 129, 0.08)',
    },
    title: {
        fontSize: '22px',
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.4px',
        flex: 1,
    }
});
