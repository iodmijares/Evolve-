import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../shared/Icon';
import { colors, typography } from '../../styles/theme';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div style={styles.container}>
            <span style={getLabelStyles(isDark)}>Theme</span>
            <button onClick={toggleTheme} style={getSwitchStyles(isDark)} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
                <div style={{ ...styles.thumb, transform: `translateX(${isDark ? 26 : 2}px)` }}>
                    <Icon
                        name={isDark ? 'moon' : 'sun'}
                        size={16}
                        color={isDark ? colors.gray[700] : colors.accent}
                    />
                </div>
            </button>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    thumb: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: colors.light,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s ease',
    }
};

const getLabelStyles = (isDark: boolean): React.CSSProperties => ({
    ...typography.body,
    fontWeight: '600',
    color: isDark ? colors.light : colors.dark,
});

const getSwitchStyles = (isDark: boolean): React.CSSProperties => ({
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? colors.gray[700] : colors.slate[200],
    padding: 0,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
});
