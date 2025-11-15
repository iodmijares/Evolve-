
import React from 'react';
import { useUser } from '../../context/UserContext';
import LoggedMealItem from './LoggedMealItem';
import type { Meal, Macros, MealType } from '../../types';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

const MealGroup: React.FC<{ mealType: MealType, meals: Meal[] }> = ({ mealType, meals }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const groupMacros = meals.reduce((acc: Macros, meal) => ({
        calories: acc.calories + (meal.macros?.calories || 0),
        protein: acc.protein + (meal.macros?.protein || 0),
        carbs: acc.carbs + (meal.macros?.carbs || 0),
        fat: acc.fat + (meal.macros?.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const mealIcons: Record<MealType, string> = {
        Breakfast: 'sun',
        Lunch: 'food',
        Dinner: 'moon',
        Snack: 'badge',
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.iconContainer}>
                        <Icon name={mealIcons[mealType]} size={24} color={colors.primary} />
                    </div>
                    <div>
                        <p style={styles.mealTypeTitle}>{mealType}</p>
                        <p style={styles.caloriesText}>{Math.round(groupMacros.calories)} kcal</p>
                    </div>
                </div>
                <div style={styles.macrosContainer}>
                    <p style={styles.macroText}>P: {Math.round(groupMacros.protein)}g</p>
                    <p style={styles.macroText}>C: {Math.round(groupMacros.carbs)}g</p>
                    <p style={styles.macroText}>F: {Math.round(groupMacros.fat)}g</p>
                </div>
            </div>
            <div style={styles.itemsContainer}>
                {meals.map(meal => (
                    <LoggedMealItem key={meal.id} meal={meal} />
                ))}
            </div>
        </div>
    );
}

const LoggedMealList: React.FC = () => {
    const { meals, workoutHistory } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's workouts
    const todaysWorkouts = workoutHistory.filter(workout => {
        if (!workout.date) return false;
        try {
            const workoutDate = new Date(workout.date).toISOString().split('T')[0];
            return workoutDate === today;
        } catch (error) {
            console.error('Invalid workout date:', workout.date);
            return false;
        }
    });

    const groupedMeals = meals.reduce((acc, meal) => {
        const type = meal.mealType || 'Snack';
        if (!acc[type]) acc[type] = [];
        acc[type].push(meal);
        return acc;
    }, {} as Record<MealType, Meal[]>);

    const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const loggedMealTypes = mealOrder.filter(type => groupedMeals[type]?.length > 0);

    const hasActivity = loggedMealTypes.length > 0 || todaysWorkouts.length > 0;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Today's Log</h2>
            {hasActivity ? (
                <div style={styles.groupsContainer}>
                    {todaysWorkouts.length > 0 && (
                        <div style={styles.card}>
                            <div style={styles.header}>
                                <div style={styles.headerLeft}>
                                    <div style={styles.iconContainer}>
                                        <Icon name="workout" size={24} color={colors.emerald[600]} />
                                    </div>
                                    <div>
                                        <p style={styles.mealTypeTitle}>Workouts</p>
                                        <p style={styles.caloriesText}>{todaysWorkouts.length} completed</p>
                                    </div>
                                </div>
                            </div>
                            <div style={styles.itemsContainer}>
                                {todaysWorkouts.map((workout, index) => (
                                    <div key={workout.id || index} style={styles.workoutItem}>
                                        <div>
                                            <p style={styles.workoutName}>{workout.name}</p>
                                            <p style={styles.workoutDetails}>{workout.type} • {workout.duration} min</p>
                                        </div>
                                        <Icon name="badge" size={20} color={colors.emerald[600]} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {loggedMealTypes.map(mealType => (
                        <MealGroup key={mealType} mealType={mealType} meals={groupedMeals[mealType]} />
                    ))}
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>You haven't logged any meals or workouts yet.</p>
                    <p style={{...styles.emptyText, fontSize: 12 }}>Use the '+' button to scan and log your food.</p>
                </div>
            )}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    title: {
        ...typography.h2,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    groupsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    emptyState: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.md,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconContainer: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        padding: 8,
        borderRadius: 999,
    },
    mealTypeTitle: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    caloriesText: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    macrosContainer: {
        alignItems: 'flex-end',
    },
    macroText: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.slate[500],
        margin: 0,
    },
    itemsContainer: {
        borderTop: `1px solid ${isDark ? colors.gray[700] : colors.border}`,
        paddingTop: spacing.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
    },
    workoutItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: isDark ? colors.gray[700] : colors.slate[50],
        borderRadius: 8,
    },
    workoutName: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    workoutDetails: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
});

export default LoggedMealList;
