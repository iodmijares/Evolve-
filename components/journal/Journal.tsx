
import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { Icon } from '../shared/Icon';
import { JournalEntryCard } from './JournalEntryCard';
import { JournalModal } from './JournalModal';
import type { JournalEntry } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

const Journal: React.FC = () => {
    const { journalEntries } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isHovered, setIsHovered] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const styles = getStyles(isDark, isDesktop);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const hasLoggedToday = useMemo(() => {
        const logged = journalEntries.some(entry => entry.date === today);
        console.log('Journal - Has logged today:', logged, 'Today:', today, 'Entries:', journalEntries.length);
        return logged;
    }, [journalEntries, today]);

    const handleOpenModal = (entry: JournalEntry | null = null) => {
        setSelectedEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
    };

    return (
        <>
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>Your Journal</h1>
                        <p style={styles.subtitle}>A private space for your thoughts and reflections.</p>
                    </div>

                    <div style={styles.listContainer}>
                        {journalEntries.length > 0 ? (
                            journalEntries.map(entry => (
                                <JournalEntryCard key={entry.id} entry={entry} onClick={() => handleOpenModal(entry)} />
                            ))
                        ) : (
                            <div style={styles.emptyState}>
                                <Icon name="pencil" size={48} color={colors.primary} />
                                <h3 style={styles.emptyTitle}>Start Your Journey</h3>
                                <p style={styles.emptySubtitle}>Your first journal entry is just a tap away.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            
            <button
                onClick={() => handleOpenModal(null)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    ...styles.fab,
                    ...(isHovered ? styles.fabHover : {}),
                    display: hasLoggedToday ? 'none' : 'flex'
                }}
                aria-label="Write today's journal entry"
            >
                <Icon name="plus" size={24} color={colors.light} />
                <span style={styles.fabText}>Write Today's Entry</span>
            </button>

            <JournalModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                entry={selectedEntry}
            />
        </>
    );
};

const getStyles = (isDark: boolean, isDesktop: boolean = false): { [key: string]: React.CSSProperties } => ({
    container: {
        height: '100%',
        backgroundColor: isDark ? colors.dark : colors.base,
        padding: spacing.md,
        overflowY: 'auto',
        paddingBottom: isDesktop ? spacing.md : 100,
    },
    header: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h1,
        fontSize: isDesktop ? 28 : 24,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    subtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.xl,
        gap: spacing.sm,
    },
    emptyTitle: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    emptySubtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    fab: {
        position: 'fixed',
        bottom: isDesktop ? 100 : 84,
        right: isDesktop ? 24 : 16,
        backgroundColor: colors.primary,
        borderRadius: 28,
        padding: '14px 24px',
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
        border: 'none',
        cursor: 'pointer',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap' as const,
    },
    fabHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.5)',
    },
    fabText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 16,
    }
});

export default Journal;
