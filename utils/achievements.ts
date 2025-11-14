import type { Achievement } from '../types';
import type { UserProfile, DailyMacros, Meal, Workout, DailyLog, WeightEntry } from '../types';

const staticAchievements: Achievement[] = [
    {
        id: 'first_steps',
        name: "First Steps",
        icon: "badge",
        description: "Complete your profile setup to begin your journey.",
        goal: { metric: 'onboarding_complete', target: 1 },
    },
    {
        id: 'meal_master',
        name: "Meal Master",
        icon: "food",
        description: "Log a total of 10 meals to master your nutrition.",
        goal: { metric: 'total_meals', target: 10 },
    },
    {
        id: 'workout_warrior',
        name: "Workout Warrior",
        icon: "workout",
        description: "Complete 5 workouts and feel the burn.",
        goal: { metric: 'total_workouts', target: 5 },
    },
    {
        id: 'balanced_day',
        name: "Balanced Day",
        icon: "sun",
        description: "Log a meal for Breakfast, Lunch, and Dinner in one day.",
        goal: { metric: 'balanced_day', target: 1 },
    },
    {
        id: '7_day_streak',
        name: "7-Day Streak",
        icon: "fire",
        description: "Check in and log an entry for 7 days in a row.",
        goal: { metric: 'log_streak', target: 7 },
    },
    {
        id: '30_day_milestone',
        name: "30-Day Milestone",
        icon: "cycle",
        description: "Stay consistent for 30 days to build a lasting habit.",
        goal: { metric: 'days_since_onboarding', target: 30 },
    },
];

export const checkAchievement = (
    achievement: Achievement, 
    data: {
        user: UserProfile | null;
        meals: Meal[];
        workoutHistory: Workout[];
        dailyLogs: DailyLog[];
        isOnboardingComplete: boolean;
    }
): boolean => {
    const { goal } = achievement;
    const { user, meals, workoutHistory, dailyLogs, isOnboardingComplete } = data;

    switch (goal.metric) {
        case 'onboarding_complete':
            return isOnboardingComplete;
        case 'total_meals':
            return meals.length >= goal.target;
        case 'total_workouts':
            return workoutHistory.length >= goal.target;
        case 'balanced_day': {
            const mealTypes = new Set(meals.map(m => m.mealType));
            return mealTypes.has('Breakfast') && mealTypes.has('Lunch') && mealTypes.has('Dinner');
        }
        case 'log_streak': {
            if (dailyLogs.length < goal.target) return false;
            const logDates = new Set(dailyLogs.map(log => log.date));
            if (logDates.size < goal.target) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < goal.target; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                if (!logDates.has(checkDate.toISOString().split('T')[0])) {
                    return false;
                }
            }
            return true;
        }
        case 'days_since_onboarding': {
            if (!user?.onboardingDate) return false;
            const startDate = new Date(user.onboardingDate);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= goal.target;
        }
        default:
            return false;
    }
};

export default staticAchievements;