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

export const AppLayout: React.FC = () => {
    return (
        <div className="layout">
            <Sidebar />
            <main className="content" role="main">
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
            <div className="mobile-only">
                <BottomBar />
            </div>
            <Walkthrough />
        </div>
    );
};
