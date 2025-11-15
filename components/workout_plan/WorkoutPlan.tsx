

import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Icon } from '../shared/Icon';
import { Card } from '../shared/Card';
import { WorkoutDayModal } from './WorkoutDayModal';
import type { WorkoutPlanDay } from '../../types';
import { getHumanReadableError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing, breakpoints } from '../../styles/theme';
import { Spinner } from '../shared/Spinner';

const WorkoutPlan: React.FC = () => {
    const { workoutPlan, generateAndSaveWorkoutPlan, isWorkoutPlanGenerating } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<WorkoutPlanDay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // This state will be managed by a resize observer for better performance
    const [numColumns, setNumColumns] = useState(4);

    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth > breakpoints.lg) setNumColumns(7);
            else if (window.innerWidth > breakpoints.md) setNumColumns(5);
            else setNumColumns(4);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const styles = getStyles(isDark, numColumns);


    const handleGeneratePlan = async () => {
        setError(null);
        try {
            await generateAndSaveWorkoutPlan();
        } catch (err) {
            console.error("❌ Workout plan generation error:", err);
            setError(getHumanReadableError(err));
        }
    };

    const handleDayClick = (day: WorkoutPlanDay) => {
        if (day.type === 'workout') {
            setSelectedDay(day);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDay(null);
    };

    const renderPlanGrid = () => {
        if (!workoutPlan && isWorkoutPlanGenerating) {
            return (
                 <div style={styles.stateContainer}>
                    <Icon name="lightbulb" size={48} color={colors.primary} />
                    <h3 style={styles.stateTitle}>Building Your Perfect Plan</h3>
                    <p style={styles.stateSubtitle}>Our AI is crafting a personalized 30-day workout schedule just for you. This might take a moment.</p>
                    <Spinner />
                </div>
            );
        }

        if (!workoutPlan) {
            return (
                 <div style={styles.stateContainer}>
                    <Icon name="clipboard" size={48} color={colors.primary} />
                    <h3 style={styles.stateTitle}>Your Fitness Journey Awaits</h3>
                    <p style={styles.stateSubtitle}>Let our AI create a personalized 30-day workout plan to help you reach your goals.</p>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={isWorkoutPlanGenerating}
                        style={{...styles.generateButton, ...(isWorkoutPlanGenerating ? { opacity: 0.6 } : {})}}
                    >
                        {isWorkoutPlanGenerating ? <Spinner size="sm" /> : <Icon name="lightbulb" size={20} color={colors.light} />}
                        <span style={styles.generateButtonText}>{isWorkoutPlanGenerating ? 'Building Your Plan...' : 'Generate My Plan'}</span>
                    </button>
                    {error && <p style={styles.errorText}>{error}</p>}
                </div>
            );
        }

        return (
            <Card title="Your 30-Day Plan" icon="badge">
                <div style={styles.gridContainer}>
                    {workoutPlan.map(day => {
                        const isCompleted = day.isCompleted;
                        const isRest = day.type === 'rest';
                        const dayStyle = {
                            ...styles.dayCell,
                            ...(isCompleted ? styles.completedDay : {}),
                            ...(!isCompleted && isRest ? styles.restDay : {}),
                        };
                        
                        let textStyle = isCompleted ? styles.completedText : isRest ? styles.restText : styles.workoutText;

                        return (
                            <button
                                key={day.day}
                                onClick={() => handleDayClick(day)}
                                disabled={isRest}
                                style={dayStyle}
                            >
                                <div style={styles.dayHeader}>
                                    <span style={{...styles.dayNumber, ...textStyle}}>
                                        Day {day.day}
                                    </span>
                                    {isCompleted && <Icon name="badge" size={16} color={colors.light} />}
                                </div>
                                
                                <div style={styles.dayContent}>
                                    <Icon name={isRest ? 'moon' : 'workout'} size={24} color={isCompleted ? colors.light : isRest ? (isDark ? colors.gray[400] : colors.muted) : colors.primary} />
                                    <p style={{...styles.dayTitle, ...textStyle}}>
                                        {isRest ? 'Rest Day' : day.workout?.name}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Workout Plan</h1>
                    <p style={styles.subtitle}>Your personalized 30-day fitness schedule.</p>
                </div>
                {renderPlanGrid()}
            </div>
            {selectedDay && (
                <WorkoutDayModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    planDay={selectedDay}
                />
            )}
        </>
    );
};

const getStyles = (isDark: boolean, numColumns: number) => {
    const gap = 10;
    const cellWidth = `calc(${(100 / numColumns)}% - ${gap - (gap / numColumns)}px)`;

    return {
        container: {
            height: '100%',
            backgroundColor: isDark ? colors.dark : colors.base,
            padding: spacing.md,
            overflowY: 'auto',
        },
        header: {
            marginBottom: spacing.lg,
        },
        title: {
            ...typography.h1,
            fontSize: 28,
            color: isDark ? colors.light : colors.dark,
            margin: 0,
        },
        subtitle: {
            ...typography.subtle,
            color: isDark ? colors.gray[400] : colors.muted,
            margin: 0,
        },
        stateContainer: {
            backgroundColor: isDark ? colors.gray[800] : colors.light,
            borderRadius: 12,
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
        },
        stateTitle: {
            ...typography.h3,
            color: isDark ? colors.light : colors.dark,
            textAlign: 'center',
            margin: 0,
        },
        stateSubtitle: {
            ...typography.subtle,
            textAlign: 'center',
            color: isDark ? colors.gray[400] : colors.muted,
            margin: 0,
        },
        generateButton: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            backgroundColor: colors.primary,
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer'
        },
        generateButtonText: {
            color: colors.light,
            fontWeight: 600 as React.CSSProperties['fontWeight'],
            fontSize: 16,
        },
        errorText: {
            color: colors.red[400],
            marginTop: spacing.sm,
            margin: 0,
        },
        gridContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: gap,
        },
        dayCell: {
            width: cellWidth,
            aspectRatio: '1 / 1',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: isDark ? colors.gray[700] : colors.light,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            border: 'none',
            cursor: 'pointer'
        },
        completedDay: {
            backgroundColor: colors.primary,
        },
        restDay: {
            backgroundColor: isDark ? 'transparent' : colors.slate[100],
            borderColor: isDark ? colors.gray[700] : colors.border,
            borderWidth: 1,
            cursor: 'not-allowed',
        },
        dayHeader: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
        },
        dayNumber: {
            fontSize: 10,
            fontWeight: 700 as React.CSSProperties['fontWeight'],
        },
        dayContent: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dayTitle: {
            fontSize: 10,
            fontWeight: 600 as React.CSSProperties['fontWeight'],
            textAlign: 'center',
            marginTop: 4,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
        },
        workoutText: {
            color: isDark ? colors.light : colors.dark,
        },
        completedText: {
            color: colors.light,
        },
        restText: {
            color: isDark ? colors.gray[400] : colors.muted,
        }
    } as {[key: string]: React.CSSProperties};
}

export default WorkoutPlan;
