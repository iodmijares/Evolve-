
import React from 'react';
import { useUser } from '../../context/UserContext';
import { ChallengeItem } from './ChallengeItem';
import { Card } from '../shared/Card';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing } from '../../styles/theme';

export const PersonalChallengesList: React.FC = () => {
    const { challenges } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const activeChallenges = challenges.filter(c => !c.isCompleted);
    const completedChallenges = challenges.filter(c => c.isCompleted);

    return (
        <div style={styles.container}>
            <Card title="Your Active Challenges" icon="target">
                {activeChallenges.length > 0 ? (
                    <div style={styles.list}>
                        {activeChallenges.map(challenge => (
                            <ChallengeItem key={challenge.id} challenge={challenge} />
                        ))}
                    </div>
                ) : (
                    <p style={styles.emptyText}>You have no active challenges. Create one!</p>
                )}
            </Card>

            {completedChallenges.length > 0 && (
                 <Card title="Completed" icon="badge">
                    <div style={styles.list}>
                        {completedChallenges.map(challenge => (
                            <ChallengeItem key={challenge.id} challenge={challenge} />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
    },
    emptyText: {
        textAlign: 'center',
        color: isDark ? colors.gray[400] : colors.muted,
        fontSize: 14,
        margin: 0,
    }
});
