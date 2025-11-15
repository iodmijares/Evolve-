
import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { useUser } from '../../context/UserContext';
import type { JournalEntry } from '../../types';
import { Spinner } from '../shared/Spinner';
import { Icon } from '../shared/Icon';
import { getHumanReadableError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface AIAnalysisCardProps {
    entry: JournalEntry;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ entry }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getAIStyles(isDark);

    if (!entry.summary) return null;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>
                <Icon name="lightbulb" size={18} color={colors.primary} />
                <span> AI Reflection</span>
            </h3>
            
            <div>
                <p style={styles.heading}>Summary</p>
                <p style={styles.italicText}>"{entry.summary}"</p>
            </div>

            {entry.themes && entry.themes.length > 0 && (
                <div>
                    <p style={styles.heading}>Key Themes</p>
                    <div style={styles.themesContainer}>
                        {entry.themes.map((theme, index) => (
                            <div key={index} style={styles.themeBadge}>
                                <span style={styles.themeText}>{theme}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <p style={styles.heading}>A Gentle Suggestion</p>
                <p style={styles.bodyText}>{entry.suggestion}</p>
            </div>
             <p style={styles.disclaimer}>This is an AI-generated reflection and not a substitute for professional advice.</p>
        </div>
    );
};

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: JournalEntry | null;
}

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, entry }) => {
    const { logJournalEntry, journalEntries } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getModalStyles(isDark);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(entry);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isViewing = currentEntry && currentEntry.id;
    const date = entry?.date || new Date().toISOString().split('T')[0];
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
    
    useEffect(() => {
        setCurrentEntry(entry);
        if (entry) {
            setTitle(entry.title || '');
            setContent(entry.content || '');
        } else {
            setTitle('');
            setContent('');
        }
        setIsLoading(false);
        setError(null);
    }, [entry, isOpen]);

    // Watch for AI analysis completion
    useEffect(() => {
        if (currentEntry && currentEntry.id && isLoading) {
            // Find the updated entry from journalEntries
            const updatedEntry = journalEntries.find(e => e.id === currentEntry.id);
            if (updatedEntry && updatedEntry.summary) {
                // AI analysis completed
                setCurrentEntry(updatedEntry);
                setIsLoading(false);
            }
        }
    }, [journalEntries, currentEntry, isLoading]);

    const handleSave = async () => {
        if (!content.trim()) {
            setError('Please write something in your journal entry.');
            return;
        }
        setError(null);
        setIsSaving(true);
        setIsLoading(true);
        try {
            console.log('Saving journal entry...', { title, content, date });
            const savedEntry = await logJournalEntry({ title: title.trim(), content: content.trim() }, date);
            console.log('Journal entry saved successfully:', savedEntry);
            setCurrentEntry(savedEntry);
            setIsSaving(false);
            // Keep isLoading true to show "AI is analyzing..." while waiting for AI analysis
            // The analysis updates will come through the journalEntries state
        } catch (err) {
            console.error('Error saving journal entry:', err);
            setError(getHumanReadableError(err));
            setIsLoading(false);
            setIsSaving(false);
        }
    };
    
    const modalTitle = isViewing ? "Your Reflection" : "Today's Entry";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <div style={styles.container}>
                <p style={styles.date}>{formattedDate}</p>

                {isViewing ? (
                    <div style={{maxHeight: 400, overflowY: 'auto'}}>
                        <h1 style={styles.viewTitle}>{currentEntry?.title}</h1>
                        <p style={styles.viewContent}>{currentEntry?.content}</p>
                        {isLoading ? (
                            <div style={styles.loadingContainer}>
                                <Spinner />
                                <p style={styles.loadingText}>AI is reflecting on your entry...</p>
                            </div>
                        ) : (
                            currentEntry && <AIAnalysisCard entry={currentEntry} />
                        )}
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your entry a title (optional)"
                            style={styles.input}
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            style={{...styles.input, ...styles.textarea}}
                            disabled={isLoading}
                            rows={6}
                        />
                         {error && <p style={styles.errorText}>{error}</p>}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{...styles.button, ...(isSaving ? styles.buttonDisabled : {})}}
                        >
                            {isSaving ? (
                                <>
                                    <Spinner size="sm" />
                                    <span style={{marginLeft: 8, color: colors.light}}>Saving...</span>
                                </>
                            ) : (
                                <span style={styles.buttonText}>Save & Reflect</span>
                            )}
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
};


const getAIStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        backgroundColor: isDark ? colors.gray[700] : colors.emerald[50],
        border: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    title: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
    },
    heading: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        marginBottom: spacing.xs,
        margin: 0,
    },
    italicText: {
        ...typography.body,
        color: isDark ? colors.light : colors.dark,
        fontStyle: 'italic',
        margin: 0,
    },
    bodyText: {
        ...typography.body,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    themesContainer: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    themeBadge: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
        padding: '5px 10px',
        borderRadius: 999,
    },
    themeText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 500 as React.CSSProperties['fontWeight'],
    },
    disclaimer: {
        ...typography.subtle,
        fontSize: 10,
        color: isDark ? colors.gray[400] : colors.muted,
        textAlign: 'center',
        paddingTop: spacing.sm,
        borderTop: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        margin: 0,
    },
});

const getModalStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        position: 'relative',
        zIndex: 1,
    },
    date: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: colors.primary,
        textAlign: 'center',
        marginTop: -spacing.sm,
        margin: 0,
    },
    viewTitle: {
        ...typography.h1,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    viewContent: {
        ...typography.body,
        color: isDark ? colors.light : colors.dark,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        margin: 0,
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.sm,
    },
    loadingText: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    input: {
        width: '100%',
        padding: 12,
        border: `2px solid ${isDark ? colors.gray[600] : colors.border}`,
        backgroundColor: isDark ? colors.gray[700] : colors.light,
        color: isDark ? colors.light : colors.dark,
        borderRadius: 8,
        fontSize: 16,
        boxSizing: 'border-box',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
    },
    textarea: {
        height: 150,
        resize: 'vertical' as const,
        minHeight: 150,
        fontFamily: 'inherit',
        lineHeight: 1.5,
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
    },
    errorText: {
        color: colors.red[400],
        textAlign: 'center',
        margin: 0,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer'
    },
    buttonDisabled: {
        backgroundColor: colors.slate[300],
    },
    buttonText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 16,
    }
});
