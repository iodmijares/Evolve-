import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Spinner } from '../shared/Spinner';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';
import { getHumanReadableError } from '../../utils/errorHandler';

const Auth: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        if (!email || !password) {
            setError("Please enter both email and password.");
            setIsLoading(false);
            return;
        }

        if (!isLoginView && !name) {
            setError("Please enter your name.");
            setIsLoading(false);
            return;
        }

        try {
            if (isLoginView) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data: signUpData, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } }
                });
                if (error) throw error;
                
                if (signUpData.user?.identities?.length === 0) {
                    setError("This email is already in use. Please try logging in.");
                } else {
                    setMessage("Success! Please check your email to confirm your account.");
                }
            }
        } catch (err) {
            setError(getHumanReadableError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const styles = getStyles(isDark);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Welcome to Evolve!</h1>
                    <p style={styles.subtitle}>
                        {isLoginView ? 'Sign in to continue' : 'Create your account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLoginView && (
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="input"
                            type="text"
                            autoComplete="name"
                        />
                    )}
                    
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="input"
                        type="email"
                        autoComplete="email"
                    />
                    
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="input"
                        type="password"
                        autoComplete={isLoginView ? "current-password" : "new-password"}
                    />

                    {error && (
                        <div style={styles.errorContainer}>
                            <p style={styles.errorText}>{error}</p>
                        </div>
                    )}

                    {message && (
                        <div style={styles.messageContainer}>
                            <p style={styles.messageText}>{message}</p>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="btn">
                        {isLoading ? <Spinner size="sm" /> : (isLoginView ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div style={styles.toggleContainer}>
                    <p style={styles.toggleText}>
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => {
                                setIsLoginView(!isLoginView);
                                setError(null);
                                setMessage(null);
                            }}
                            style={styles.toggleButton}
                        >
                            {isLoginView ? ' Sign Up' : ' Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): {[key: string]: React.CSSProperties} => ({
    container: {
        minHeight: '100vh',
        background: isDark 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
    },
    card: {
        width: '100%',
        maxWidth: '420px',
        borderRadius: '20px',
        padding: '40px 32px',
        boxShadow: isDark 
            ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 60px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1,
    },
    header: {
        textAlign: 'center',
        marginBottom: '8px',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        background: isDark 
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0,
        marginBottom: '12px',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '15px',
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
        fontWeight: '500',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    errorContainer: {
        background: isDark 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        padding: '14px 16px',
        borderRadius: '12px',
        textAlign: 'center',
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : colors.red[200]}`,
    },
    errorText: {
        color: isDark ? '#fca5a5' : colors.red[700],
        fontSize: '14px',
        margin: 0,
        fontWeight: '500',
    },
    messageContainer: {
        background: isDark 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        padding: '14px 16px',
        borderRadius: '12px',
        textAlign: 'center',
        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : colors.emerald[200]}`,
    },
    messageText: {
        color: isDark ? '#6ee7b7' : colors.emerald[700],
        fontSize: '14px',
        margin: 0,
        fontWeight: '500',
    },
    toggleContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '4px',
        paddingTop: '8px',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
    },
    toggleText: {
        fontSize: '14px',
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
        fontWeight: '500',
    },
    toggleButton: {
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: '14px',
        fontWeight: '700',
        color: colors.primary,
        cursor: 'pointer',
        marginLeft: '6px',
        transition: 'all 0.2s ease',
    }
});

export default Auth;
