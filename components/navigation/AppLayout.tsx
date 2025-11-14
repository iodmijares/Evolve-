import React, { useState } from 'react';
import { BottomBar } from './BottomBar';
import Dashboard from '../dashboard/Dashboard';
import Journal from '../journal/Journal';
import WorkoutPlan from '../workout_plan/WorkoutPlan';
import MealPlan from '../meal_plan/MealPlan';
import CommunityHub from '../community/CommunityHub';
import Profile from '../profile/Profile';

export type ScreenName = 'Dashboard' | 'Journal' | 'WorkoutPlan' | 'MealPlan' | 'Community' | 'Profile';

const screens: Record<ScreenName, React.ComponentType> = {
  Dashboard,
  Journal,
  WorkoutPlan,
  MealPlan,
  Community: CommunityHub,
  Profile,
};

export const AppLayout: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState<ScreenName>('Dashboard');

    const ActiveComponent = screens[activeScreen];

    return (
        <div className="layout">
            <main className="content">
                <ActiveComponent />
            </main>
            <BottomBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        </div>
    );
};
