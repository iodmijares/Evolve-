

import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Icon } from '../shared/Icon';
import { Spinner } from '../shared/Spinner';
import { useUser } from '../../context/UserContext';
import type { WorkoutPlanDay, Exercise } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface WorkoutTimerProps {
    durationInMinutes: number;
    onComplete: () => void;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ durationInMinutes, onComplete }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getTimerStyles(isDark);

    const totalSeconds = durationInMinutes * 60;
    const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(s => s - 1);
            }, 1000);
        } else if (secondsLeft === 0 && isActive) {
            setIsActive(false);
            onComplete();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft, onComplete]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setSecondsLeft(totalSeconds);
    };

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div style={styles.container}>
            <p style={styles.timerText}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <div style={styles.buttonContainer}>
                <button
                    onClick={toggle}
                    style={{...styles.button, ...(isActive ? styles.pauseButton : styles.startButton)}}
                >
                    <span style={styles.buttonText}>{isActive ? 'Pause' : 'Start'}</span>
                </button>
                <button onClick={reset} style={{...styles.button, ...styles.resetButton}}>
                    <span style={{...styles.buttonText, ...styles.resetButtonText}}>Reset</span>
                </button>
            </div>
        </div>
    );
};

interface WorkoutDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    planDay: WorkoutPlanDay;
}

export const WorkoutDayModal: React.FC<WorkoutDayModalProps> = ({ isOpen, onClose, planDay }) => {
    const { logWorkout, markWorkoutAsComplete } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getModalStyles(isDark);

    const [isCompleting, setIsCompleting] = useState(false);

    const handleMarkComplete = async () => {
        if (!planDay.workout) return;
        setIsCompleting(true);
        try {
            await logWorkout(planDay.workout);
            await markWorkoutAsComplete(planDay.day);
            onClose();
        } catch (error) {
            console.error("Failed to mark workout as complete:", error);
        } finally {
            setIsCompleting(false);
        }
    };
    
    const handleTimerComplete = () => {
        alert("Time's up! Great work!");
    };

    if (!planDay.workout) return null;

    const exercises = planDay.workout.exercises || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Day ${planDay.day}: ${planDay.workout.name}`}>
            <div style={styles.container}>
                <div style={styles.detailsBadge}>
                    <p style={styles.detailsText}>
                        {planDay.workout.type} &bull; {planDay.workout.duration} minutes
                    </p>
                </div>
                
                {/* Warmup Section */}
                {planDay.workout.warmup && (
                    <div>
                        <p style={styles.sectionTitle}>🔥 Warmup</p>
                        <div style={styles.warmupContainer}>
                            <p style={styles.warmupText}>{planDay.workout.warmup}</p>
                        </div>
                    </div>
                )}
                
                {/* Description */}
                <div>
                    <p style={styles.sectionTitle}>📋 Overview</p>
                    <div style={styles.descriptionContainer}>
                        <p style={styles.descriptionText}>{planDay.workout.description}</p>
                    </div>
                </div>
                
                {/* Exercises Section */}
                {exercises.length > 0 && (
                    <div>
                        <p style={styles.sectionTitle}>💪 Exercises ({exercises.length})</p>
                        <div style={styles.exerciseList}>
                            {exercises.map((exercise, index) => (
                                <ExerciseCard key={index} exercise={exercise} index={index} isDark={isDark} />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Cooldown Section */}
                {planDay.workout.cooldown && (
                    <div>
                        <p style={styles.sectionTitle}>❄️ Cooldown</p>
                        <div style={styles.warmupContainer}>
                            <p style={styles.warmupText}>{planDay.workout.cooldown}</p>
                        </div>
                    </div>
                )}
                
                {/* Timer */}
                <div>
                    <p style={styles.sectionTitle}>⏱️ Timer</p>
                    <WorkoutTimer durationInMinutes={planDay.workout.duration} onComplete={handleTimerComplete} />
                </div>
                
                <div style={{ paddingTop: spacing.sm }}>
                    <button
                        onClick={handleMarkComplete}
                        disabled={isCompleting || planDay.isCompleted}
                        style={{...styles.completeButton, ...((isCompleting || planDay.isCompleted) ? styles.completeButtonDisabled : {})}}
                    >
                        {isCompleting ? <Spinner size="sm" /> : <Icon name="badge" size={20} color={colors.light} />}
                        <span style={styles.completeButtonText}>{planDay.isCompleted ? 'Completed!' : 'Mark as Complete'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const getTimerStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        borderRadius: 8,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timerText: {
        fontSize: 36,
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    button: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
    },
    buttonText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
    },
    startButton: { backgroundColor: colors.primary },
    pauseButton: { backgroundColor: colors.accent },
    resetButton: { backgroundColor: isDark ? colors.gray[600] : colors.slate[200] },
    resetButtonText: { color: isDark ? colors.light : colors.dark },
});

// Exercise Card Component
interface ExerciseCardProps {
    exercise: Exercise;
    index: number;
    isDark: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, index, isDark }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const styles = getExerciseStyles(isDark);
    
    return (
        <div style={styles.exerciseCard}>
            <button 
                style={styles.exerciseHeader}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={styles.exerciseHeaderLeft}>
                    <span style={styles.exerciseNumber}>{index + 1}</span>
                    <div style={styles.exerciseInfo}>
                        <h4 style={styles.exerciseName}>{exercise.name}</h4>
                        <p style={styles.exerciseMeta}>
                            {exercise.sets} sets × {exercise.reps}
                            {exercise.restSeconds && ` • ${exercise.restSeconds}s rest`}
                        </p>
                    </div>
                </div>
                <Icon 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={isDark ? colors.gray[400] : colors.muted} 
                />
            </button>
            
            {isExpanded && (
                <div style={styles.exerciseDetails}>
                    {/* Target Muscles */}
                    {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                        <div style={styles.muscleTagsContainer}>
                            {exercise.targetMuscles.map((muscle, i) => (
                                <span key={i} style={styles.muscleTag}>{muscle}</span>
                            ))}
                        </div>
                    )}
                    
                    {/* Instructions */}
                    {exercise.instructions && exercise.instructions.length > 0 && (
                        <div style={styles.instructionsContainer}>
                            <p style={styles.instructionsTitle}>How to do it:</p>
                            <ol style={styles.instructionsList}>
                                {exercise.instructions.map((step, i) => (
                                    <li key={i} style={styles.instructionStep}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                    
                    {/* Tips */}
                    {exercise.tips && (
                        <div style={styles.tipsContainer}>
                            <p style={styles.tipsText}>💡 {exercise.tips}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const getExerciseStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    exerciseCard: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[50],
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${isDark ? colors.gray[600] : colors.slate[200]}`,
    },
    exerciseHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
    },
    exerciseHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
    },
    exerciseNumber: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: colors.primary,
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
    },
    exerciseInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    exerciseName: {
        margin: 0,
        fontSize: 15,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
    },
    exerciseMeta: {
        margin: 0,
        fontSize: 13,
        color: isDark ? colors.gray[400] : colors.muted,
    },
    exerciseDetails: {
        padding: spacing.md,
        paddingTop: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
    },
    muscleTagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    muscleTag: {
        backgroundColor: isDark ? colors.gray[600] : colors.slate[200],
        color: isDark ? colors.gray[300] : colors.slate[700],
        padding: '4px 10px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 500 as React.CSSProperties['fontWeight'],
    },
    instructionsContainer: {
        backgroundColor: isDark ? colors.gray[800] : colors.slate[100],
        borderRadius: 8,
        padding: spacing.sm,
    },
    instructionsTitle: {
        margin: 0,
        marginBottom: spacing.xs,
        fontSize: 13,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[300] : colors.slate[600],
    },
    instructionsList: {
        margin: 0,
        paddingLeft: 20,
    },
    instructionStep: {
        fontSize: 13,
        color: isDark ? colors.gray[300] : colors.slate[700],
        lineHeight: 1.6,
        marginBottom: 4,
    },
    tipsContainer: {
        backgroundColor: isDark ? colors.amber[800] + '30' : colors.amber[50],
        borderRadius: 8,
        padding: spacing.sm,
        borderLeft: `3px solid ${colors.amber[500]}`,
    },
    tipsText: {
        margin: 0,
        fontSize: 13,
        color: isDark ? colors.amber[300] : colors.amber[800],
        lineHeight: 1.5,
    },
});

const getModalStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        maxHeight: '70vh',
        overflowY: 'auto',
    },
    detailsBadge: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[50],
        padding: spacing.sm,
        borderRadius: 8,
        textAlign: 'center',
    },
    detailsText: {
        ...typography.body,
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[300] : colors.muted,
        margin: 0,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16,
        color: isDark ? colors.light : colors.dark,
        marginBottom: spacing.xs,
        margin: 0,
    },
    warmupContainer: {
        backgroundColor: isDark ? colors.emerald[800] + '30' : colors.emerald[50],
        padding: spacing.md,
        borderRadius: 8,
        borderLeft: `3px solid ${colors.emerald[500]}`,
        marginTop: spacing.xs,
    },
    warmupText: {
        ...typography.body,
        color: isDark ? colors.emerald[300] : colors.emerald[800],
        lineHeight: 1.5,
        margin: 0,
    },
    descriptionContainer: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        padding: spacing.md,
        borderRadius: 8,
        marginTop: spacing.xs,
    },
    descriptionText: {
        ...typography.body,
        color: isDark ? colors.gray[300] : colors.slate[700],
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        margin: 0,
    },
    exerciseList: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    completeButton: {
        backgroundColor: colors.emerald[700],
        padding: 12,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        border: 'none',
        cursor: 'pointer',
        width: '100%'
    },
    completeButtonDisabled: {
        backgroundColor: isDark ? colors.gray[600] : colors.slate[300],
        cursor: 'not-allowed',
    },
    completeButtonText: {
        color: colors.light,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        fontSize: 16,
    },
});
