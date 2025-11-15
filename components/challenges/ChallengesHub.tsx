
import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { CommunityChallengeCard } from './CommunityChallengeCard';
import { PersonalChallengesList } from './PersonalChallengesList';
import { CreateChallengeModal } from './CreateChallengeModal';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

const ChallengesHub: React.FC = () => {
    const { user } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Challenges</h1>
                    <p style={styles.subtitle}>Push your limits and earn rewards.</p>
                </div>

                <CommunityChallengeCard />

                <PersonalChallengesList />
            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                style={styles.fab}
                aria-label="Create a new challenge"
            >
                <Icon name="plus" size={24} color={colors.light} />
                <span style={styles.fabText}>New Challenge</span>
            </button>
            
            <CreateChallengeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        height: '100%',
        backgroundColor: isDark ? colors.dark : colors.base,
        padding: spacing.md,
        overflowY: 'auto'
    },
    header: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h1,
        fontSize: 24,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    subtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    fab: {
        position: 'absolute',
        bottom: 84,
        right: 16,
        backgroundColor: colors.accent,
        borderRadius: 28,
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: 'none',
        cursor: 'pointer'
    },
    fabText: {
        color: colors.light,
        fontWeight: '600',
        fontSize: 16,
    }
});

export default ChallengesHub;
