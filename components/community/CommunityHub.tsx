
import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import AchievementFeed from './AchievementFeed';
import { Card } from '../shared/Card';
import { useTheme } from '../../context/ThemeContext';
import { colors, breakpoints } from '../../styles/theme';
import WeeklyChallengeCard from './WeeklyChallengeCard';
import { CommunityInsightCard } from './CommunityInsightCard';

const CommunityHub: React.FC = () => {
    const { user } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoints.lg);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth > breakpoints.lg);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const styles = getStyles(isDark, isDesktop);

    if (!user) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Community Hub</h1>
                <p style={styles.subtitle}>Connect and celebrate together.</p>
            </div>

            <div style={styles.grid}>
                <div style={styles.mainContent}>
                    <Card title="Recent Activity" icon="fire">
                        <AchievementFeed />
                    </Card>
                </div>
                <div style={styles.sidebar}>
                    <WeeklyChallengeCard />
                    <CommunityInsightCard />
                </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean, isDesktop: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        height: '100%',
        background: isDark 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: isDesktop ? '32px' : '20px',
        overflowY: 'auto'
    },
    header: {
        marginBottom: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    title: {
        fontSize: isDesktop ? '32px' : '26px',
        fontWeight: '800',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '15px',
        fontWeight: '500',
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
    },
    grid: {
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        gap: '20px',
    },
    mainContent: {
        flex: isDesktop ? 2 : 1,
        minWidth: 0,
    },
    sidebar: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minWidth: 0,
    }
});

export default CommunityHub;