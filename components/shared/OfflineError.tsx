

import React from 'react';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

export const OfflineError: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const handleRetry = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.iconContainerWrapper}>
                    <div style={styles.iconContainer}>
                        <Icon name="cloud-off" size={40} color={isDark ? colors.sky[400] : colors.sky[600]} />
                    </div>
                </div>
                <div>
                    <h1 style={styles.title}>You're Currently Offline</h1>
                    <p style={styles.subtitle}>
                        It looks like there's a problem with your internet connection. Please check your network settings and try again.
                    </p>
                </div>
                <div style={{ paddingTop: spacing.sm }}>
                    <button onClick={handleRetry} style={styles.button}>
                        <span style={styles.buttonText}>Retry Connection</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        height: '100%',
        backgroundColor: isDark ? colors.dark : colors.base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        alignItems: 'center',
    },
    iconContainerWrapper: {
        display: 'flex',
        justifyContent: 'center',
    },
    iconContainer: {
        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : colors.sky[100],
        padding: spacing.md,
        borderRadius: 999,
    },
    title: {
        ...typography.h1,
        color: isDark ? colors.light : colors.dark,
        textAlign: 'center',
        margin: 0,
    },
    subtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        marginTop: spacing.sm,
        textAlign: 'center',
        margin: 0,
    },
    button: {
        backgroundColor: colors.primary,
        padding: `12px ${spacing.xl}px`,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer'
    },
    buttonText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 16,
    },
});
