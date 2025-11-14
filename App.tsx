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
    const [showDebug, setShowDebug] = React.useState(false);
    
    try {
        const { session, isOnboardingComplete, isLoading } = useUser();

        logger.debug('AppContent state', { context: 'App', data: { session: !!session, isOnboardingComplete, isLoading } });

        if (isLoading) {
            // Show debug info after 5 seconds of loading
            React.useEffect(() => {
                const timer = setTimeout(() => setShowDebug(true), 5000);
                return () => clearTimeout(timer);
            }, []);

            return (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh',
                    gap: '20px'
                }}>
                    <Spinner size="lg" />
                    {showDebug && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '20px',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            maxWidth: '500px'
                        }}>
                            <h3>Loading is taking longer than expected...</h3>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                Check if environment variables are set in Vercel:
                                <br />VITE_GROQ_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
                            </p>
                            <button 
                                onClick={() => window.location.reload()} 
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    )}
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
    } catch (error) {
        logger.error('AppContent error', error, { context: 'App' });
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h1>Error in AppContent</h1>
                <pre>{String(error)}</pre>
            </div>
        );
    }
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <ThemeProvider>
                    <ErrorBoundary>
                        <UserProvider>
                            <ErrorBoundary>
                                <AppContent />
                            </ErrorBoundary>
                        </UserProvider>
                    </ErrorBoundary>
                </ThemeProvider>
            </div>
        </ErrorBoundary>
    );
}

export default App;