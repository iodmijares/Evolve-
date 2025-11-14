

import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface LogWeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentWeight: number;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({ isOpen, onClose, currentWeight }) => {
    const { logWeight } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [weight, setWeight] = useState<string>(String(currentWeight));
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            setError('Please enter a valid weight.');
            return;
        }
        setError(null);
        logWeight(weightNum);
        onClose();
    };
    
    useEffect(() => {
        if (isOpen) {
            setWeight(String(currentWeight));
            setError(null);
        }
    }, [isOpen, currentWeight]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Your Weight">
            <div style={styles.container}>
                <p style={styles.description}>
                    Regularly logging your weight helps track your progress accurately.
                </p>
                <div>
                    <label style={styles.label}>
                        Current Weight (kg)
                    </label>
                    <input
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        style={styles.input}
                        type="number"
                        step="0.1"
                        placeholder="e.g., 65.5"
                    />
                </div>
                {error && (
                    <p style={styles.errorText}>{error}</p>
                )}
                <button onClick={handleSubmit} style={styles.button}>
                    <span style={styles.buttonText}>Save Weight</span>
                </button>
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
    input: {
        width: '100%',
        padding: 12,
        border: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        backgroundColor: isDark ? colors.gray[700] : colors.light,
        color: isDark ? colors.light : colors.dark,
        borderRadius: 8,
        fontSize: 16,
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
        border: 'none',
        cursor: 'pointer',
    },
    buttonText: {
        color: colors.light,
        fontWeight: '600',
        fontSize: 16,
    }
});
