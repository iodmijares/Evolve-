
import React, { useState } from 'react';
import type { Meal } from '../../types';
import { useUser } from '../../context/UserContext';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography } from '../../styles/theme';

interface LoggedMealItemProps {
    meal: Meal;
}

const LoggedMealItem: React.FC<LoggedMealItemProps> = ({ meal }) => {
    const { removeMeal } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={styles.container}>
            <button 
                style={styles.header}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={styles.info}>
                    <p style={styles.name}>{meal.name}</p>
                    <p style={styles.macros}>
                        {Math.round(meal.macros.calories)} kcal &bull; P:{Math.round(meal.macros.protein)}g C:{Math.round(meal.macros.carbs)}g F:{Math.round(meal.macros.fat)}g
                    </p>
                </div>
                <Icon name={isExpanded ? 'close' : 'pencil'} size={16} color={colors.slate[400]} />
            </button>
            {isExpanded && (
                <div style={styles.expandedContent}>
                    <button 
                        onClick={() => meal.id && removeMeal(meal.id)}
                        style={styles.removeButton}
                    >
                        <Icon name="trash" size={16} color={isDark ? colors.red[400] : colors.red[700]} />
                        <span style={styles.removeButtonText}>Remove Meal</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.slate[50],
        borderRadius: 8,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        background: 'none',
        border: 'none',
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left'
    },
    info: {
        flex: 1,
    },
    name: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 14,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    macros: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    expandedContent: {
        padding: 8,
        paddingTop: 0,
    },
    removeButton: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : colors.red[50],
        borderRadius: 8,
        gap: 8,
        border: 'none',
        cursor: 'pointer'
    },
    removeButtonText: {
        color: isDark ? colors.red[400] : colors.red[700],
        fontWeight: 500 as React.CSSProperties['fontWeight'],
    }
});

export default LoggedMealItem;
