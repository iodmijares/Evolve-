
import React from 'react';
import { Icon } from '../shared/Icon';
import type { Achievement } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface AchievementFeedItemProps {
    userName: string;
    achievement: Achievement;
    timestamp: Date;
    profilePictureUrl?: string;
}

// Helper to format time since event
const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const AchievementFeedItem: React.FC<AchievementFeedItemProps> = ({ userName, achievement, timestamp, profilePictureUrl }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    return (
        <div style={styles.container}>
            <img 
                src={profilePictureUrl || `https://i.pravatar.cc/150?u=${userName}`} 
                style={styles.avatar}
                alt={`${userName}'s avatar`}
            />
            <div style={styles.content}>
                <p style={styles.mainText}>
                    <span style={styles.boldText}>{userName}</span> just earned the <span style={styles.primaryText}>{achievement.name}</span> achievement!
                </p>
                <p style={styles.timestamp}>{timeSince(timestamp)}</p>
            </div>
            <div style={styles.iconContainer}>
                <Icon name={achievement.icon} size={24} color={colors.accent} />
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '14px',
        padding: '14px',
        background: isDark 
            ? 'rgba(31, 41, 55, 0.6)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
    },
    avatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: `2px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
        flexShrink: 0,
        objectFit: 'cover',
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
    mainText: {
        fontSize: '14px',
        fontWeight: '500',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        lineHeight: '1.5',
    },
    boldText: {
        fontWeight: '700',
    },
    primaryText: {
        fontWeight: '700',
        color: colors.primary,
    },
    timestamp: {
        fontSize: '12px',
        fontWeight: '500',
        color: isDark ? colors.gray[400] : colors.slate[500],
        margin: 0,
        marginTop: '4px',
    },
    iconContainer: {
        background: isDark
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '10px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});

export default AchievementFeedItem;
