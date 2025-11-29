import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomBar } from './BottomBar';
import { Sidebar } from './Sidebar';
import Dashboard from '../dashboard/Dashboard';
import Journal from '../journal/Journal';
import WorkoutPlan from '../workout_plan/WorkoutPlan';
import MealPlan from '../meal_plan/MealPlan';
import CommunityHub from '../community/CommunityHub';
import Profile from '../profile/Profile';
import { Walkthrough } from '../shared/Walkthrough';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="layout" style={{ 
            display: 'flex', 
            height: '100vh', 
            overflow: 'hidden',
            background: isDark ? '#111827' : '#f8fafc'
        }}>
            <Sidebar />
            <main className="content" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                position: 'relative',
                paddingBottom: '80px' // Space for BottomBar on mobile
            }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/workout" element={<WorkoutPlan />} />
                    <Route path="/meals" element={<MealPlan />} />
                    <Route path="/community" element={<CommunityHub />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <BottomBar />
            <Walkthrough />
        </div>
    );
};
