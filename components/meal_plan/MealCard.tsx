
import React, { useState } from 'react';
import { MealPlanMeal, MealType } from '../../types';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';
import { Spinner } from '../shared/Spinner';

interface MealCardProps {
    meal: MealPlanMeal;
    mealType: MealType;
    onLog: () => Promise<void>;
}

const mealIcons: Record<string, string> = {
    Breakfast: 'sun',
    Lunch: 'food',
    Dinner: 'moon',
    Snack: 'badge',
};

export const MealCard: React.FC<MealCardProps> = ({ meal, mealType, onLog }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const handleLog = async () => {
        if (meal.isLogged || isLogging) return;
        setIsLogging(true);
        try {
            await onLog();
        } catch (error) {
            console.error("Failed to log meal:", error);
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div style={styles.card}>
            <button onClick={() => setIsExpanded(!isExpanded)} style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.iconContainer}>
                        <Icon name={mealIcons[mealType]} size={24} color={colors.primary} />
                    </div>
                    <div style={styles.titleContainer}>
                        <p style={styles.mealType}>{meal.time} - {mealType}</p>
                        <h3 style={styles.mealName}>{meal.name}</h3>
                    </div>
                </div>
                <Icon name={isExpanded ? 'close' : 'arrow-right'} size={20} color={isDark ? colors.gray[400] : colors.muted} />
            </button>
            
            <div style={styles.macrosContainer}>
                <p style={styles.macroText}>Cals: {Math.round(meal.macros.calories)}</p>
                <p style={styles.macroText}>P: {Math.round(meal.macros.protein)}g</p>
                <p style={styles.macroText}>C: {Math.round(meal.macros.carbs)}g</p>
                <p style={styles.macroText}>F: {Math.round(meal.macros.fat)}g</p>
            </div>

            {isExpanded && (
                <div style={styles.expandedContent}>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                        <div>
                            <p style={styles.sectionTitle}>Ingredients</p>
                            <div style={styles.listContainer}>
                                {meal.ingredients.map((ing, i) => <p key={i} style={styles.listItem}>&bull; {ing}</p>)}
                            </div>
                        </div>
                    )}
                    {meal.instructions && meal.instructions.length > 0 && (
                        <div>
                            <p style={styles.sectionTitle}>Instructions</p>
                            <div style={styles.listContainer}>
                                {meal.instructions.map((step, i) => <p key={i} style={styles.listItem}>{i + 1}. {step}</p>)}
                            </div>
                        </div>
                    )}
                     <button
                        onClick={handleLog}
                        disabled={meal.isLogged || isLogging}
                        style={{...styles.logButton, ...((meal.isLogged || isLogging) ? styles.logButtonDisabled : {})}}
                    >
                        {isLogging ? <Spinner size="sm" /> : 
                         meal.isLogged ? <><Icon name="badge" size={20} color={colors.light}/> <span style={styles.logButtonText}>Logged</span></> 
                                        : <span style={styles.logButtonText}>Log this Meal</span>}
                    </button>
                </div>
            )}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
    },
    header: {
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
    },
    headerContent: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    iconContainer: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : colors.emerald[50],
        padding: 8,
        borderRadius: 999,
    },
    titleContainer: {
        flex: 1,
    },
    mealType: {
        ...typography.body,
        fontSize: 12,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: colors.primary,
        margin: 0,
    },
    mealName: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    macrosContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: `0 ${spacing.md}px ${spacing.md}px`,
        borderBottom: `1px solid ${isDark ? colors.gray[700] : colors.border}`,
    },
    macroText: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    expandedContent: {
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16,
        color: isDark ? colors.light : colors.dark,
        marginBottom: spacing.xs,
        margin: 0,
    },
    listContainer: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[50],
        padding: spacing.sm,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
    },
    listItem: {
        ...typography.body,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    logButton: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: colors.secondary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        border: 'none',
        cursor: 'pointer'
    },
    logButtonDisabled: {
        backgroundColor: isDark ? colors.gray[600] : colors.slate[300],
        cursor: 'not-allowed',
    },
    logButtonText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 16,
    }
});
