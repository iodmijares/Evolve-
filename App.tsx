import React from 'react';
import { UserProvider, useUser } from './context/UserContext';
import Auth from './components/auth/Auth';
import Onboarding from './components/onboarding/Onboarding';
import { Spinner } from './components/shared/Spinner';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/navigation/AppLayout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { logger } from './utils/logger';

const AppContent: React.FC = () => {
    const { session, isOnboardingComplete, isLoading } = useUser();

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
            <ThemeProvider>
                <UserProvider>
                    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                        <AppContent />
                    </div>
                </UserProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;