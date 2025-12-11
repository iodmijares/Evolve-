

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import MacroRings from './MacroRings';
import LoggedMealList from './LoggedMealList';
import type { MenstrualPhase } from '../../types';
import { generateCycleInsight, generateSymptomSuggestions } from '../../services/groqService';
import { Icon } from '../shared/Icon';
import FoodScanner from '../nutrition/FoodScanner';
import { calculateMenstrualPhase } from '../../utils/dateUtils';
import DailyLogModal from './DailyLogModal';
import CycleFocusCard from './CycleFocusCard';
import { AddMealChoiceModal } from './AddMealChoiceModal';
import { LogMealModal } from '../nutrition/LogMealModal';
import { getHumanReadableError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const Dashboard: React.FC = () => {
    const { 
        user, macros, dailyLogs, 
        cycleInsight, setCycleInsight,
    } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [isScannerOpen, setScannerOpen] = useState(false);
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [isAddChoiceModalOpen, setAddChoiceModalOpen] = useState(false);
    const [isLogMealModalOpen, setLogMealModalOpen] = useState(false);
    
    const [currentPhase, setCurrentPhase] = useState<MenstrualPhase | undefined>(undefined);
    const [suggestedSymptoms, setSuggestedSymptoms] = useState<string[]>([]);
    const [, setError] = useState<string | null>(null);

    const isCycleInsightLoading = user?.gender === 'female' && !cycleInsight;

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const todayLog = useMemo(() => {
        return dailyLogs.find(log => log.date === today);
    }, [dailyLogs, today]);

    useEffect(() => {
        let phase: MenstrualPhase | undefined = undefined;
        if (user && user.gender === 'female' && user.lastPeriodStartDate && user.cycleLength) {
            const phaseData = calculateMenstrualPhase(user.lastPeriodStartDate, user.cycleLength);
            if(phaseData) {
                phase = phaseData.phase;
            }
        }
        setCurrentPhase(phase);
    }, [user]);
    
    useEffect(() => {
        if (user?.gender !== 'female' || !currentPhase || cycleInsight) {
            return;
        }

        // Debounce API calls to prevent rapid successive requests
        const timeoutId = setTimeout(() => {
            Promise.all([
                generateCycleInsight(currentPhase, dailyLogs, user.id),
                generateSymptomSuggestions(currentPhase)
            ]).then(([insightResult, symptomsResult]) => {
                setCycleInsight(insightResult);
                setSuggestedSymptoms(symptomsResult);
            }).catch(err => {
                console.error("Failed to fetch cycle insights:", err);
                setError(getHumanReadableError(err));
            });
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [user, dailyLogs, currentPhase, cycleInsight, setCycleInsight]);

    if (!user) {
        return <div className="container center-content"><p style={styles.greeting}>Loading user data...</p></div>;
    }

    return (
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
            <div className="container">
                <div style={styles.header}>
                    <h1 style={styles.greeting}>{getGreeting()}, {user.username || user.name}</h1>
                    <p style={styles.subtitle}>Ready to make today count?</p>
                </div>

                <div className="dashboard-grid">
                    {user.gender === 'female' && (
                        <div className="dashboard-column">
                            {cycleInsight && (
                                <CycleFocusCard insight={cycleInsight} />
                            )}
                            
                            <button style={styles.checkInCard} onClick={() => setLogModalOpen(true)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                                    <div style={{
                                        ...styles.checkInIcon,
                                        backgroundColor: todayLog ? colors.emerald[400] : colors.primary,
                                    }}>
                                        <Icon name={todayLog ? "check" : "pencil"} size={20} color="#ffffff" />
                                    </div>
                                    <div>
                                        <p style={styles.cardTitle}>Daily Check-in</p>
                                        <span style={styles.subtitle}>{todayLog ? `Logged as '${todayLog.mood}'` : "Tap to log your day"}</span>
                                    </div>
                                </div>
                                <Icon name="chevron-right" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                            </button>
                        </div>
                    )}
                    <div className="dashboard-column" style={{ width: '100%' }}>
                        <div style={styles.card}>
                            <p style={styles.cardTitle}>At a Glance</p>
                            <div style={styles.caloriesContainer}>
                                <span style={styles.caloriesValue}>{Math.round(macros.consumed.calories)}</span>
                                <span style={styles.caloriesTarget}> / {macros.target.calories} kcal</span>
                            </div>
                            <p style={styles.caloriesLabel}>Total Calories Logged</p>
                            <MacroRings />
                        </div>
                        
                        <LoggedMealList />
                    </div>
                </div>

            </div>
            
            <button
                onClick={() => setAddChoiceModalOpen(true)}
                style={styles.fab}
                aria-label="Add meal"
            >
                <Icon name="plus" size={32} color={colors.light} />
            </button>

            <AddMealChoiceModal
                isOpen={isAddChoiceModalOpen}
                onClose={() => setAddChoiceModalOpen(false)}
                onScan={() => { setAddChoiceModalOpen(false); setScannerOpen(true); }}
                onManual={() => { setAddChoiceModalOpen(false); setLogMealModalOpen(true); }}
            />
            <FoodScanner isOpen={isScannerOpen} onClose={() => setScannerOpen(false)} />
            <LogMealModal isOpen={isLogMealModalOpen} onClose={() => setLogMealModalOpen(false)} />
            {user.gender === 'female' && <DailyLogModal 
                isOpen={isLogModalOpen} 
                onClose={() => setLogModalOpen(false)}
                date={today}
                suggestedSymptoms={suggestedSymptoms}
                isLoadingSuggestions={isCycleInsightLoading}
            />}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    header: {
        marginBottom: spacing.lg,
    },
    greeting: {
        ...typography.h1,
        fontSize: 28,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    subtitle: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
    },
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    checkInCard: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 16,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
        border: `2px solid ${isDark ? colors.gray[700] : colors.border}`,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    checkInIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    cardTitle: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    caloriesContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        borderBottom: `1px solid ${isDark ? colors.gray[700] : colors.border}`,
        paddingBottom: spacing.lg,
        marginBottom: spacing.sm,
    },
    caloriesValue: {
        ...typography.h1,
        fontSize: 36,
        color: colors.primary,
    },
    caloriesTarget: {
        ...typography.body,
        color: isDark ? colors.gray[400] : colors.muted,
    },
    caloriesLabel: {
        ...typography.subtle,
        textAlign: 'center',
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: 'none',
        cursor: 'pointer',
        zIndex: 100,
    },
});

export default Dashboard;
