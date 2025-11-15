

import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Icon } from '../shared/Icon';
import { Spinner } from '../shared/Spinner';
import { useUser } from '../../context/UserContext';
import type { WorkoutPlanDay } from '../../types';
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Day ${planDay.day}: ${planDay.workout.name}`}>
            <div style={styles.container}>
                <div style={styles.detailsBadge}>
                    <p style={styles.detailsText}>
                        {planDay.workout.type} &bull; {planDay.workout.duration} minutes
                    </p>
                </div>
                
                <div>
                    <p style={styles.sectionTitle}>Workout Details</p>
                    <div style={styles.descriptionContainer}>
                        <p style={styles.descriptionText}>{planDay.workout.description}</p>
                    </div>
                </div>
                
                <div>
                    <p style={styles.sectionTitle}>Timer</p>
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

const getModalStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
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
    descriptionContainer: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        padding: spacing.md,
        borderRadius: 8,
    },
    descriptionText: {
        ...typography.body,
        color: isDark ? colors.gray[300] : colors.slate[700],
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        margin: 0,
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
