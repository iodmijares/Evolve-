import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Auth from './components/auth/Auth';
import Onboarding from './components/onboarding/Onboarding';
import { Spinner } from './components/shared/Spinner';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/navigation/AppLayout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { logger } from './utils/logger';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NutritionProvider } from './context/NutritionContext';
import { FitnessProvider } from './context/FitnessContext';
import { WellnessProvider } from './context/WellnessContext';
import { CommunityProvider } from './context/CommunityContext';

const AppContent: React.FC = () => {
    const { session, isOnboardingComplete, isLoading } = useAuth();

    logger.debug('AppContent state', { context: 'App', data: { session: !!session, isOnboardingComplete, isLoading } });

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!session) {
        logger.debug('No session, showing Auth', { context: 'App' });
        return <Auth />;
    }

    if (!isOnboardingComplete) {
        logger.debug('Onboarding incomplete', { context: 'App' });
        return <Onboarding />;
    }

    logger.debug('Showing main app', { context: 'App' });
    return <AppLayout />;
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <NutritionProvider>
                            <FitnessProvider>
                                <WellnessProvider>
                                    <CommunityProvider>
                                        <UserProvider>
                                            <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                                                <AppContent />
                                            </div>
                                        </UserProvider>
                                    </CommunityProvider>
                                </WellnessProvider>
                            </FitnessProvider>
                        </NutritionProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;