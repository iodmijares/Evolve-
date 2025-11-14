
import React from 'react';
import { Modal } from '../shared/Modal';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface AddMealChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: () => void;
    onManual: () => void;
}

export const AddMealChoiceModal: React.FC<AddMealChoiceModalProps> = ({ isOpen, onClose, onScan, onManual }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add a Meal">
            <div style={styles.container}>
                <p style={styles.subtitle}>How would you like to log your meal?</p>
                <button onClick={onScan} style={styles.button}>
                    <Icon name="camera" size={24} color={colors.light} />
                    <span style={styles.buttonText}>Scan Food</span>
                </button>
                 <button onClick={onManual} style={{...styles.button, backgroundColor: colors.primary}}>
                    <Icon name="pencil" size={24} color={colors.light} />
                    <span style={styles.buttonText}>Log Manually</span>
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
    subtitle: {
        textAlign: 'center',
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.secondary,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer'
    },
    buttonText: {
        color: colors.light,
        ...typography.h3,
        fontSize: 18,
    },
});
