

import React from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import type { MealType } from '../../types';
import { getMealTypeByTime } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface MealTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mealType: MealType) => void;
}

const mealTypes: { name: MealType, icon: string }[] = [
    { name: 'Breakfast', icon: 'sun' },
    { name: 'Lunch', icon: 'food' },
    { name: 'Dinner', icon: 'moon' },
    { name: 'Snack', icon: 'badge' },
];

export const MealTypeModal: React.FC<MealTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const recommendedType = getMealTypeByTime();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log as...">
            <div style={styles.grid}>
                {mealTypes.map(({ name, icon }) => {
                    const isRecommended = name === recommendedType;
                    return (
                        <button
                            key={name}
                            onClick={() => onSelect(name)}
                            style={{...styles.button, ...(isRecommended ? styles.recommendedButton : {})}}
                        >
                            {isRecommended && (
                                <div style={styles.recBadge}>
                                    <span style={styles.recText}>REC.</span>
                                </div>
                            )}
                            <Icon name={icon} size={32} color={isRecommended ? colors.light : (isDark ? colors.gray[400] : colors.muted)} />
                            <p style={{...styles.buttonText, ...(isRecommended ? styles.recommendedText : {})}}>{name}</p>
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    grid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    button: {
        width: '48%',
        aspectRatio: '1 / 1',
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
        padding: spacing.md,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
    },
    recommendedButton: {
        backgroundColor: colors.primary,
    },
    recBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: colors.light,
        borderRadius: 999,
        padding: '2px 6px',
    },
    recText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
    },
    buttonText: {
        ...typography.h3,
        fontSize: 16,
        marginTop: spacing.sm,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    recommendedText: {
        color: colors.light,
    },
});
