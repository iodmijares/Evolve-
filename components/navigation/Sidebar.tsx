import React from 'react';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';
import { ScreenName } from './AppLayout';
import { useUser } from '../../context/UserContext';

interface SidebarProps {
    activeScreen: ScreenName;
    setActiveScreen: (screen: ScreenName) => void;
}

const navItems = [
  { name: 'Dashboard', label: 'Home', icon: 'home' },
  { name: 'Journal', label: 'Journal', icon: 'clipboard' },
  { name: 'WorkoutPlan', label: 'Workout', icon: 'workout' },
  { name: 'MealPlan', label: 'Meal Plan', icon: 'food' },
  { name: 'Community', label: 'Community', icon: 'users' },
  { name: 'Profile', label: 'Profile', icon: 'user' },
] as const;


export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
    const { theme } = useTheme();
    const { logout } = useUser();
    const isDark = theme === 'dark';

    return (
        <nav style={getStyles(isDark).sidebar} className="desktop-only">
            <div >
                <h1 style={styles.logo}>Evolve</h1>
                <div style={styles.navGroup}>
                    {navItems.map(item => {
                        const isActive = activeScreen === item.name;
                        return (
                            <a key={item.name} onClick={() => setActiveScreen(item.name)} style={{...styles.navItem, ...(isActive ? getStyles(isDark).navItemActive : {})}}>
                                <Icon name={item.icon} size={24} color={isActive ? colors.primary : (isDark ? colors.gray[400] : colors.muted)} />
                                <span style={{...styles.navLabel, ...(isActive ? getStyles(isDark).navLabelActive : {})}}>{item.label}</span>
                            </a>
                        )
                    })}
                </div>
            </div>
            <a onClick={logout} style={styles.navItem}>
                <Icon name={'logout'} size={24} color={isDark ? colors.gray[400] : colors.muted} />
                <span style={styles.navLabel}>Logout</span>
            </a>
        </nav>
    );
};

const styles: {[key: string]: React.CSSProperties} = {
    logo: {
        fontSize: '28px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textAlign: 'center',
        marginBottom: '32px',
        letterSpacing: '-0.5px',
    },
    navGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        border: 'none',
        background: 'none',
        width: '100%',
    },
    navLabel: {
        fontSize: '15px',
        fontWeight: '600',
    },
};

const getStyles = (isDark: boolean): {[key: string]: React.CSSProperties} => ({
    sidebar: {
        width: '260px',
        background: isDark 
            ? 'rgba(31, 41, 55, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isDark 
            ? '4px 0 24px rgba(0, 0, 0, 0.4)'
            : '4px 0 24px rgba(0, 0, 0, 0.04)',
    },
    navItemActive: {
        background: isDark 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        boxShadow: isDark
            ? '0 0 0 1px rgba(16, 185, 129, 0.3)'
            : '0 0 0 1px rgba(16, 185, 129, 0.15)',
    },
    navLabel: {
       ...styles.navLabel,
       color: isDark ? colors.gray[300] : colors.slate[700],
    },
    navLabelActive: {
        ...styles.navLabel,
        color: colors.primary,
        fontWeight: '700',
    }
});
