import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { UserProfile, Gender, ActivityLevel, Goal, DietaryPreference } from '../../types';
import { OnboardingStep } from './OnboardingStep';
import { Icon } from '../shared/Icon';
import { Spinner } from '../shared/Spinner';
import { getHumanReadableError } from '../../utils/errorHandler';
import { Picker } from '../shared/Picker';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';
import { supabase } from '../../services/supabaseClient';

type OnboardingData = Partial<Omit<UserProfile, 'id' | 'email'>>;

const Onboarding: React.FC = () => {
    const { completeOnboarding, session } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    // --- Authentication State ---
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    
    // --- Onboarding State ---
    const [step, setStep] = useState(1);
    const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
    const [onboardingError, setOnboardingError] = useState<string | null>(null);
    const [data, setData] = useState<OnboardingData>({
        name: session?.user?.user_metadata?.full_name || '',
        age: undefined,
        gender: undefined,
        height: undefined,
        weight: undefined,
        activityLevel: undefined,
        goal: undefined,
        dietaryPreferences: [],
        nationality: '',
        lastPeriodStartDate: undefined,
        cycleLength: 28,
    });

    useEffect(() => {
      // Pre-fill name from session when it becomes available
      if (session && !data.name) {
        setData(prev => ({ ...prev, name: session?.user?.user_metadata?.full_name || '' }));
      }
    }, [session, data.name]);

    // --- Authentication Handlers ---
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setAuthMessage(null);
        setIsAuthLoading(true);

        if (!email || !password) {
            setAuthError("Please enter both email and password.");
            setIsAuthLoading(false);
            return;
        }
        
        if (!isLoginView && !data.name) {
            setAuthError("Please enter your name.");
            setIsAuthLoading(false);
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
                    options: { data: { full_name: data.name } }
                });
                if (error) throw error;
                if (signUpData.user?.identities?.length === 0) {
                     setAuthError("This email is already in use, but may not be confirmed. Please check your inbox or try logging in.");
                } else {
                     setAuthMessage("Success! Please check your email for a confirmation link to verify your account.");
                }
            }
        } catch (err) {
            setAuthError(getHumanReadableError(err));
        } finally {
            setIsAuthLoading(false);
        }
    };

    // --- Onboarding Handlers ---
    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    const updateData = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async () => {
        setIsOnboardingLoading(true);
        setOnboardingError(null);
        try {
            if (!data.name || !data.age || !data.gender || !data.height || !data.weight || !data.activityLevel || !data.goal) {
                throw new Error("Please fill out all required fields.");
            }
            if (data.gender === 'female' && (!data.lastPeriodStartDate || !data.cycleLength)) {
                throw new Error("Please provide your cycle information for personalized tracking.");
            }
            await completeOnboarding(data as Omit<UserProfile, 'id' | 'email'>);
        } catch (err: any) {
            setOnboardingError(getHumanReadableError(err));
            setIsOnboardingLoading(false);
        }
    };
    
    const isFemale = data.gender === 'female';
    const totalSteps = isFemale ? 5 : 4;
    const progress = (step / totalSteps) * 100;

    return (
        <div style={getStyles(isDark).container}>
            <div style={getStyles(isDark).card}>
                <div style={styles.header}>
                    <h1 style={getStyles(isDark).title}>Welcome to Evolve!</h1>
                     <p style={getStyles(isDark).subtitle}>
                        {!session 
                            ? (isLoginView ? 'Sign in to continue' : 'Create an account to get started')
                            : "Let's set up your profile."
                        }
                    </p>
                </div>
                
                {!session ? (
                    <>
                        <form onSubmit={handleEmailSubmit} style={authStyles.formContainer}>
                            {!isLoginView && (
                                <input
                                    id="fullName"
                                    name="fullName"
                                    value={data.name || ''}
                                    onChange={(e) => updateData('name', e.target.value)}
                                    placeholder="Full Name"
                                    className="input"
                                    type="text"
                                    autoComplete="name"
                                />
                            )}
                            <input
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="input"
                                type="email"
                                autoComplete="email"
                            />
                            <input
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="input"
                                type="password"
                                autoComplete={isLoginView ? "current-password" : "new-password"}
                            />
                            
                            {authError && (
                                <div style={getAuthStyles(isDark).errorContainer}>
                                    <p style={getAuthStyles(isDark).errorText}>{authError}</p>
                                </div>
                            )}

                            {authMessage && (
                                <div style={getAuthStyles(isDark).messageContainer}>
                                    <p style={getAuthStyles(isDark).messageText}>{authMessage}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isAuthLoading}
                                className="btn"
                            >
                                {isAuthLoading ? <Spinner size="sm" /> : (isLoginView ? 'Log In' : 'Sign Up')}
                            </button>
                        </form>
                
                        <div style={authStyles.toggleContainer}>
                            <p style={getAuthStyles(isDark).toggleText}>
                                {isLoginView ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => {
                                        setIsLoginView(!isLoginView);
                                        setAuthError(null);
                                        setAuthMessage(null);
                                    }}
                                    style={authStyles.toggleButton}
                                    aria-label={isLoginView ? 'Switch to Sign Up' : 'Switch to Log In'}
                                >
                                    {isLoginView ? ' Sign Up' : ' Log In'}
                                </button>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={styles.progressBarContainer}>
                            <div style={{...styles.progressBar, width: `${progress}%` }}></div>
                        </div>

                        <div style={styles.stepContainer}>
                            <OnboardingStep isVisible={step === 1} title="About You" icon="user">
                                <div style={styles.stepContent}>
                                    <input 
                                        id="name" 
                                        name="name" 
                                        placeholder="Name" 
                                        value={data.name} 
                                        onChange={(e) => updateData('name', e.target.value)} 
                                        className="input"
                                        aria-label="Name"
                                    />
                                    <input 
                                        id="age"
                                        name="age"
                                        placeholder="Age" 
                                        value={data.age?.toString() || ''} 
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow empty or only digits
                                            if (value === '' || /^\d+$/.test(value)) {
                                                updateData('age', value === '' ? undefined : parseInt(value));
                                            }
                                        }} 
                                        onBlur={(e) => {
                                            // Validate on blur
                                            const numValue = parseInt(e.target.value);
                                            if (numValue && (numValue < 13 || numValue > 120)) {
                                                alert('Age must be between 13 and 120');
                                                updateData('age', undefined);
                                            }
                                        }}
                                        className="input" 
                                        type="text"
                                        inputMode="numeric"
                                        aria-label="Age"
                                        autoComplete="off"
                                    />
                                    <Picker<Gender>
                                        selectedValue={data.gender}
                                        onValueChange={(v) => updateData('gender', v)}
                                        placeholder="Select Gender"
                                        items={[
                                            { label: "Male", value: "male" },
                                            { label: "Female", value: "female" },
                                            { label: "Prefer not to say", value: "prefer_not_to_say" }
                                        ]}
                                    />
                                    <input 
                                        id="nationality"
                                        name="nationality"
                                        placeholder="Nationality (optional)" 
                                        value={data.nationality} 
                                        onChange={(e) => updateData('nationality', e.target.value)} 
                                        className="input"
                                        autoComplete="country-name"
                                        aria-label="Nationality"
                                    />
                                </div>
                            </OnboardingStep>
                            
                            <OnboardingStep isVisible={step === 2} title="Your Body" icon="badge">
                                <div style={styles.stepContent}>
                                    <input 
                                        id="height"
                                        name="height"
                                        placeholder="Height (cm)" 
                                        value={data.height?.toString() || ''} 
                                        onChange={(e) => {
                                            updateData('height', e.target.value ? parseFloat(e.target.value) : undefined);
                                        }} 
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value && (value < 100 || value > 250)) {
                                                alert('Height must be between 100 and 250 cm');
                                                updateData('height', undefined);
                                            }
                                        }}
                                        className="input" 
                                        type="number" 
                                        step="0.1"
                                        aria-label="Height in centimeters"
                                        autoComplete="off"
                                    />
                                    <input 
                                        id="weight"
                                        name="weight"
                                        placeholder="Current Weight (kg)" 
                                        value={data.weight?.toString() || ''} 
                                        onChange={(e) => {
                                            updateData('weight', e.target.value ? parseFloat(e.target.value) : undefined);
                                        }} 
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value && (value < 30 || value > 300)) {
                                                alert('Weight must be between 30 and 300 kg');
                                                updateData('weight', undefined);
                                            }
                                        }}
                                        className="input" 
                                        type="number" 
                                        step="0.1"
                                        aria-label="Current weight in kilograms"
                                        autoComplete="off"
                                    />
                                </div>
                            </OnboardingStep>
                            
                            <OnboardingStep isVisible={step === 3} title="Your Goals" icon="target">
                                <div style={styles.stepContent}>
                                    <Picker<ActivityLevel>
                                        selectedValue={data.activityLevel}
                                        onValueChange={(v) => updateData('activityLevel', v)}
                                        placeholder="Activity Level"
                                        items={[
                                            { label: "Sedentary", value: "sedentary" },
                                            { label: "Lightly Active", value: "lightly_active" },
                                            { label: "Moderately Active", value: "moderately_active" },
                                            { label: "Very Active", value: "very_active" }
                                        ]}
                                    />
                                    <Picker<Goal>
                                        selectedValue={data.goal}
                                        onValueChange={(v) => updateData('goal', v)}
                                        placeholder="Primary Goal"
                                        items={[
                                            { label: "Weight Loss", value: "weight_loss" },
                                            { label: "Muscle Gain", value: "muscle_gain" },
                                            { label: "Maintenance", value: "maintenance" }
                                        ]}
                                    />
                                </div>
                            </OnboardingStep>

                            <OnboardingStep isVisible={step === 4} title="Dietary Preferences" icon="utensils">
                                <div style={styles.stepContent}>
                                    <p style={{...getStyles(isDark).subtitle, marginBottom: '16px', textAlign: 'center'}}>
                                        Select any dietary preferences or restrictions (optional)
                                    </p>
                                    <div style={styles.checkboxGrid}>
                                        {[
                                            { label: "None", value: "none" as DietaryPreference },
                                            { label: "Vegetarian", value: "vegetarian" as DietaryPreference },
                                            { label: "Vegan", value: "vegan" as DietaryPreference },
                                            { label: "Pescatarian", value: "pescatarian" as DietaryPreference },
                                            { label: "Keto", value: "keto" as DietaryPreference },
                                            { label: "Paleo", value: "paleo" as DietaryPreference },
                                            { label: "Gluten Free", value: "gluten_free" as DietaryPreference },
                                            { label: "Dairy Free", value: "dairy_free" as DietaryPreference },
                                            { label: "Halal", value: "halal" as DietaryPreference },
                                            { label: "Kosher", value: "kosher" as DietaryPreference },
                                        ].map((pref) => {
                                            const isSelected = data.dietaryPreferences?.includes(pref.value);
                                            return (
                                                <button
                                                    key={pref.value}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = data.dietaryPreferences || [];
                                                        if (pref.value === 'none') {
                                                            updateData('dietaryPreferences', isSelected ? [] : ['none']);
                                                        } else {
                                                            const filtered = current.filter(p => p !== 'none');
                                                            updateData(
                                                                'dietaryPreferences',
                                                                isSelected 
                                                                    ? filtered.filter(p => p !== pref.value)
                                                                    : [...filtered, pref.value]
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        ...styles.checkboxButton,
                                                        backgroundColor: isSelected 
                                                            ? (isDark ? colors.emerald[600] : colors.emerald[500])
                                                            : (isDark ? colors.gray[800] : colors.gray[100]),
                                                        color: isSelected 
                                                            ? '#fff'
                                                            : (isDark ? colors.gray[300] : colors.gray[700]),
                                                        borderColor: isSelected
                                                            ? (isDark ? colors.emerald[500] : colors.emerald[600])
                                                            : (isDark ? colors.gray[700] : colors.gray[300]),
                                                    }}
                                                >
                                                    {pref.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </OnboardingStep>
                            
                            {isFemale && (
                                <OnboardingStep isVisible={step === 5} title="Cycle Tracking" icon="cycle">
                                    <div style={styles.stepContent}>
                                        <div>
                                            <label style={getStyles(isDark).label} htmlFor="periodDate">Last Period Start Date</label>
                                            <input 
                                                id="periodDate"
                                                name="periodDate"
                                                placeholder="YYYY-MM-DD" 
                                                value={data.lastPeriodStartDate || ''} 
                                                onChange={(e) => updateData('lastPeriodStartDate', e.target.value)} 
                                                className="input" 
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                aria-label="Last period start date"
                                            />
                                        </div>
                                        <div>
                                            <label style={getStyles(isDark).label} htmlFor="cycleLength">Average Cycle Length (days)</label>
                                            <input 
                                                id="cycleLength"
                                                name="cycleLength"
                                                value={data.cycleLength?.toString() || ''} 
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    if (!e.target.value || (value >= 21 && value <= 40)) {
                                                        updateData('cycleLength', value || 28);
                                                    }
                                                }} 
                                                className="input" 
                                                type="number"
                                                min="21"
                                                max="40"
                                                aria-label="Average cycle length in days"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </OnboardingStep>
                            )}

                            <OnboardingStep isVisible={step === totalSteps} title="Ready to Go?" icon="fire">
                                <div style={styles.finishContainer}>
                                    <p style={getStyles(isDark).subtitle}>You're all set! Click finish to start your personalized wellness journey.</p>
                                    {onboardingError && <p style={styles.errorText}>{onboardingError}</p>}
                                    <button onClick={handleSubmit} disabled={isOnboardingLoading} style={styles.finishButton} className="btn">
                                        {isOnboardingLoading ? <Spinner size="sm"/> : 'Finish Setup'}
                                    </button>
                                </div>
                            </OnboardingStep>
                        </div>

                        <div style={styles.navigation}>
                            <button 
                                onClick={handleBack} 
                                disabled={step === 1 || isOnboardingLoading} 
                                style={{...styles.navArrow, opacity: step === 1 ? 0.5 : 1}}
                                aria-label="Go back to previous step"
                                title="Back"
                            >
                                <Icon name="arrow-left" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                            </button>
                            {step < totalSteps && (
                                <button onClick={handleNext} style={styles.nextButton} className="btn">
                                Next
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Styles for the onboarding steps part
const styles: {[key: string]: React.CSSProperties} = {
    header: {
        textAlign: 'center',
        marginBottom: '8px',
    },
    progressBarContainer: {
        width: '100%',
        height: '6px',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    progressBar: {
        height: '6px',
        background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
        borderRadius: '999px',
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
        position: 'relative',
    },
    stepContainer: {
        minHeight: '300px',
        maxHeight: '420px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px',
        scrollBehavior: 'smooth',
    },
    stepContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'slideIn 0.3s ease',
    },
    checkboxGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    checkboxButton: {
        padding: '14px 16px',
        borderRadius: '16px',
        border: '2px solid',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        transition: 'all 0.2s ease',
        textAlign: 'center',
    },
    finishContainer: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '32px 0',
    },
    errorText: {
        color: colors.red[400],
        fontSize: '14px',
        textAlign: 'center',
        padding: '12px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '12px',
    },
    finishButton: {
        width: '100%',
    },
    navigation: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        paddingTop: '8px',
    },
    navArrow: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '12px',
        borderRadius: '16px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        flex: 1,
        minWidth: 'auto',
    },
};

// Styles for the auth form part
const authStyles: {[key:string]: React.CSSProperties} = {
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    toggleContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: 24,
    },
    toggleButton: {
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: 14,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: colors.primary,
        cursor: 'pointer',
    }
}

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
        maxWidth: '520px',
        borderRadius: '24px',
        padding: '48px 36px',
        boxShadow: isDark 
            ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 25px 50px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(30px)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 0.5s ease',
    },
    title: {
        fontSize: '36px',
        fontWeight: 800 as React.CSSProperties['fontWeight'],
        background: isDark 
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0,
        marginBottom: '12px',
        letterSpacing: '-0.8px',
        textAlign: 'center',
    } as React.CSSProperties,
    subtitle: {
        fontSize: '16px',
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        textAlign: 'center',
        lineHeight: '1.5',
    },
    progressBarContainer: {
        ...styles.progressBarContainer,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.1)',
    },
    label: {
        fontSize: '14px',
        color: isDark ? colors.gray[300] : colors.slate[700],
        marginBottom: '6px',
        display: 'block',
        fontWeight: 600 as React.CSSProperties['fontWeight'],
    },
});

const getAuthStyles = (isDark: boolean): {[key:string]: React.CSSProperties} => ({
    errorContainer: {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.red[50],
        padding: 14,
        borderRadius: 16,
        textAlign: 'center',
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : colors.red[200]}`,
    },
    errorText: {
        color: isDark ? colors.red[400] : colors.red[700],
        fontSize: 14,
        margin: 0,
    },
    messageContainer: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : colors.emerald[50],
        padding: 14,
        borderRadius: 16,
        textAlign: 'center',
        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : colors.emerald[200]}`,
    },
    messageText: {
        color: isDark ? colors.emerald[300] : colors.emerald[700],
        fontSize: 14,
        margin: 0,
    },
    toggleText: {
        fontSize: 14,
        color: isDark ? colors.gray[400] : colors.muted,
    },
});

export default Onboarding;