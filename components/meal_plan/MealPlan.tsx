
import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Icon } from '../shared/Icon';
import { MealCard } from './MealCard';
import { getHumanReadableError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';
import { Spinner } from '../shared/Spinner';

const MealPlan: React.FC = () => {
        const { weeklyMealPlan, isMealPlanLoading, generateAndSetWeeklyMealPlan, markMealAsLogged } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [error, setError] = useState<string | null>(null);
    const todayIndex = (new Date().getDay() + 6) % 7;
    const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

    const handleGeneratePlan = async () => {
        setError(null);
        try {
            await generateAndSetWeeklyMealPlan();
        } catch (err) {
            setError(getHumanReadableError(err));
        }
    };
    
    const goToPreviousDay = () => setSelectedDayIndex((prev) => (prev - 1 + 7) % 7);
    const goToNextDay = () => setSelectedDayIndex((prev) => (prev + 1) % 7);

    const handleLogMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
        if (!weeklyMealPlan) return;
        const dayOfWeek = weeklyMealPlan[selectedDayIndex].dayOfWeek;
        try {
            await markMealAsLogged(dayOfWeek, mealType);
        } catch(e) {
            setError("Failed to log meal. Please try again.");
            console.error("Failed to log meal from plan", e);
        }
    };

    const renderContent = () => {
        if (isMealPlanLoading) {
            return (
                <div style={styles.stateContainer}>
                    <Icon name="lightbulb" size={48} color={colors.primary} />
                    <h3 style={styles.stateTitle}>Crafting Your Meal Plan</h3>
                    <p style={styles.stateSubtitle}>Our AI is preparing a delicious and healthy week of meals just for you. This might take a moment.</p>
                    <Spinner />
                </div>
            );
        }

        if (error) {
             return (
                <div style={{...styles.stateContainer, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : colors.red[50]}}>
                    <h3 style={styles.stateTitle}>Oops! Something went wrong.</h3>
                    <p style={{...styles.stateSubtitle, marginBottom: 12}}>{error}</p>
                    <button onClick={handleGeneratePlan} style={{...styles.generateButton, backgroundColor: colors.red[700]}}>
                        <span style={styles.generateButtonText}>Try Again</span>
                    </button>
                </div>
            );
        }

        if (!weeklyMealPlan) {
            return (
                <div style={styles.stateContainer}>
                    <Icon name="food" size={48} color={colors.primary} />
                    <h3 style={styles.stateTitle}>Your Weekly Meal Plan</h3>
                    <p style={styles.stateSubtitle}>Let our AI create a personalized 7-day meal plan to help you reach your nutrition goals.</p>
                    <button onClick={handleGeneratePlan} style={styles.generateButton}>
                        <Icon name="lightbulb" size={20} color={colors.light} />
                        <span style={styles.generateButtonText}>Generate My Plan</span>
                    </button>
                </div>
            );
        }

        const selectedDayData = weeklyMealPlan[selectedDayIndex];

        return (
            <div style={styles.planContainer}>
                <div style={styles.daySelector}>
                    <button onClick={goToPreviousDay} style={styles.arrowButton}>
                        <Icon name="arrow-left" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                    </button>
                    <div style={styles.dayHeader}>
                        <h2 style={styles.dayTitle}>{selectedDayData.dayOfWeek}</h2>
                        <p style={styles.dayMacros}>
                           Total: {Math.round(selectedDayData.dailyTotals.calories)} kcal
                        </p>
                    </div>
                    <button onClick={goToNextDay} style={styles.arrowButton}>
                        <Icon name="arrow-right" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                    </button>
                </div>

                <div style={styles.mealList}>
                    <MealCard meal={selectedDayData.breakfast} mealType="Breakfast" onLog={() => handleLogMeal('breakfast')} />
                    <MealCard meal={selectedDayData.lunch} mealType="Lunch" onLog={() => handleLogMeal('lunch')} />
                    <MealCard meal={selectedDayData.dinner} mealType="Dinner" onLog={() => handleLogMeal('dinner')} />
                    {selectedDayData.snack && <MealCard meal={selectedDayData.snack} mealType="Snack" onLog={() => handleLogMeal('snack')} />}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Weekly Meal Plan</h1>
                <p style={styles.subtitle}>Your personalized AI-generated nutrition guide.</p>
            </div>
            {renderContent()}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        height: '100%',
        backgroundColor: isDark ? colors.dark : colors.base,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h1,
        fontSize: 28,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    subtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    stateContainer: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    stateTitle: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        textAlign: 'center',
        margin: 0,
    },
    stateSubtitle: {
        ...typography.subtle,
        textAlign: 'center',
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    generateButton: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        padding: '12px 24px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer'
    },
    generateButtonText: {
        color: colors.light,
        fontWeight: '600',
        fontSize: 16,
    },
    planContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    daySelector: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.sm,
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        marginBottom: spacing.md,
    },
    arrowButton: {
        padding: spacing.sm,
        background: 'none',
        border: 'none',
        cursor: 'pointer'
    },
    dayHeader: {
        textAlign: 'center',
    },
    dayTitle: {
        ...typography.h1,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    dayMacros: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    mealList: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        paddingBottom: spacing.lg,
        overflowY: 'auto',
        flex: 1,
    }
});

export default MealPlan;
