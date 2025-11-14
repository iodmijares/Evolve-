
import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Spinner } from '../shared/Spinner';
import { useUser } from '../../context/UserContext';
import { generatePersonalChallenge } from '../../services/groqService';
import { getHumanReadableError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ isOpen, onClose }) => {
    const { user, addChallenge } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [isLoading, setIsLoading] = useState(false);
    const [challengeIdea, setChallengeIdea] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!challengeIdea) {
            setError("Please describe the challenge you'd like to create.");
            return;
        }
        if (!user) {
            setError("User profile not found.");
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            const challengeData = await generatePersonalChallenge(challengeIdea, user);
            await addChallenge(challengeData);
            onClose(); // Close modal on success
        } catch (err) {
            setError(getHumanReadableError(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setChallengeIdea('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create a Personal Challenge">
            <div style={styles.container}>
                <p style={styles.description}>
                    Let our AI help you create a new challenge tailored to you. Describe what you want to achieve.
                </p>

                <div>
                    <label style={styles.label} htmlFor="challenge-idea">
                        Your Goal
                    </label>
                    <textarea
                        id="challenge-idea"
                        value={challengeIdea}
                        onChange={(e) => setChallengeIdea(e.target.value)}
                        style={styles.textarea}
                        placeholder="e.g., 'I want to improve my stamina' or 'A challenge to eat more vegetables'"
                        disabled={isLoading}
                    />
                </div>
                
                {error && <p style={styles.errorText}>{error}</p>}
                
                <div style={{ paddingTop: spacing.sm }}>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        style={{...styles.button, ...(isLoading ? { opacity: 0.7 } : {})}}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" />
                                <span style={styles.buttonText}>AI is Thinking...</span>
                            </>
                        ) : (
                             <span style={styles.buttonText}>Generate Challenge</span>
                        )}
                    </button>
                </div>
                 <p style={styles.disclaimer}>
                    AI-generated challenges are designed to be motivating and achievable.
                </p>
            </div>
        </Modal>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    description: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    label: {
        ...typography.body,
        fontWeight: '500',
        color: isDark ? colors.light : colors.dark,
        marginBottom: spacing.xs,
        display: 'block',
    },
    textarea: {
        width: '100%',
        padding: 12,
        border: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        backgroundColor: isDark ? colors.gray[700] : colors.light,
        color: isDark ? colors.light : colors.dark,
        borderRadius: 8,
        fontSize: 16,
        minHeight: 80,
        resize: 'vertical',
        boxSizing: 'border-box'
    },
    errorText: {
        color: colors.red[400],
        textAlign: 'center',
        margin: 0,
    },
    button: {
        width: '100%',
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        border: 'none',
        cursor: 'pointer'
    },
    buttonText: {
        color: colors.light,
        fontWeight: '600',
        fontSize: 16,
    },
    disclaimer: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[500] : colors.slate[400],
        textAlign: 'center',
        margin: 0,
    }
});
