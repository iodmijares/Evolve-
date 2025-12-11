import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

const navItems = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/journal', label: 'Journal', icon: 'journal' },
  { path: '/workout', label: 'Workout', icon: 'workout' },
  { path: '/meals', label: 'Meals', icon: 'food' },
  { path: '/community', label: 'Community', icon: 'users' },
  { path: '/profile', label: 'Profile', icon: 'user' },
] as const;

export const BottomBar: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isDark = theme === 'dark';
    const [iconSize, setIconSize] = React.useState(window.innerWidth < 360 ? 20 : 22);
    
    React.useEffect(() => {
        const handleResize = () => {
            setIconSize(window.innerWidth < 360 ? 20 : 22);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const dynamicStyles = getStyles(isDark);

    return (
        <div style={dynamicStyles.container}>
            {navItems.map(item => {
                const isActive = location.pathname === item.path;
                const iconColor = isActive ? colors.primary : (isDark ? colors.gray[400] : colors.slate[500]);
                const buttonStyle = isActive ? {...styles.tabItem, ...dynamicStyles.tabItemActive} : styles.tabItem;
                
                return (
                    <button key={item.path} onClick={() => navigate(item.path)} style={buttonStyle}>
                        <Icon name={item.icon as any} size={iconSize} color={iconColor} />
                        <span style={{ ...styles.tabLabel, color: iconColor }}>{item.label}</span>
                    </button>
                )
            })}
        </div>
    );
};

const styles: {[key: string]: React.CSSProperties} = {
    tabItem: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        borderRadius: '12px',
        minWidth: '48px',
    },
    tabLabel: {
        fontSize: '9px',
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        marginTop: '4px',
        letterSpacing: '0.2px',
    },
};


const getStyles = (isDark: boolean): {[key: string]: React.CSSProperties} => ({
    container: {
        display: 'flex',
        height: '68px',
        background: isDark 
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        zIndex: 100,
        boxShadow: isDark
            ? '0 -8px 32px rgba(0, 0, 0, 0.6), 0 -2px 12px rgba(16, 185, 129, 0.05)'
            : '0 -8px 32px rgba(0, 0, 0, 0.08), 0 -2px 12px rgba(0, 0, 0, 0.02)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        padding: '6px 8px',
        gap: '2px',
    },
    tabItemActive: {
        background: isDark 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        transform: 'translateY(-2px)',
        boxShadow: isDark
            ? '0 4px 12px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.3)'
            : '0 4px 12px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.2)',
    },
});
