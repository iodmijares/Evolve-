

import React, { useState, useMemo } from 'react';
import type { UserProfile, DailyLog, MenstrualPhase } from '../../types';
import { calculatePhaseForDate } from '../../utils/dateUtils';
import { Icon } from '../shared/Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface CycleCalendarProps {
    user: UserProfile;
    dailyLogs: DailyLog[];
    onDateClick: (date: string) => void;
}

const phaseColors: Record<MenstrualPhase, { bg: string, text: string }> = {
    Menstrual: { bg: colors.fuchsia[50], text: colors.fuchsia[800] },
    Follicular: { bg: colors.emerald[50], text: colors.emerald[800] },
    Ovulatory: { bg: colors.red[50], text: colors.red[700] },
    Luteal: { bg: colors.sky[50], text: colors.sky[800] },
};

const darkPhaseColors: Record<MenstrualPhase, { bg: string, text: string }> = {
    Menstrual: { bg: 'rgba(217, 70, 239, 0.1)', text: colors.fuchsia[300] },
    Follicular: { bg: 'rgba(16, 185, 129, 0.1)', text: colors.emerald[300] },
    Ovulatory: { bg: 'rgba(239, 68, 68, 0.1)', text: colors.red[400] },
    Luteal: { bg: 'rgba(14, 165, 233, 0.1)', text: colors.secondary },
};


const moodIcons: Record<DailyLog['mood'], string> = {
    energetic: '⚡️', happy: '😊', neutral: '😐', irritable: '😠', sad: '😢', fatigued: '😴'
};

export const CycleCalendar: React.FC<CycleCalendarProps> = ({ user, dailyLogs, onDateClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const { lastPeriodStartDate, cycleLength } = user;

    const logsByDate = useMemo(() => {
        return dailyLogs.reduce((acc, log) => {
            acc[log.date] = log;
            return acc;
        }, {} as Record<string, DailyLog>);
    }, [dailyLogs]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const grid: (Date | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
        for (let day = 1; day <= daysInMonth; day++) grid.push(new Date(year, month, day));
        return grid;
    }, [currentDate]);

    const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    if (!lastPeriodStartDate || !cycleLength) {
        return <p style={styles.errorText}>Cycle data not available.</p>;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pColors = isDark ? darkPhaseColors : phaseColors;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={goToPreviousMonth} style={styles.arrowButton}><Icon name="arrow-left" size={20} color={isDark ? colors.gray[400] : colors.muted} /></button>
                <p style={styles.monthTitle}>
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
                <button onClick={goToNextMonth} style={styles.arrowButton}><Icon name="arrow-right" size={20} color={isDark ? colors.gray[400] : colors.muted} /></button>
            </div>
            <div style={styles.weekDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <p key={i} style={styles.weekDayText}>{day}</p>)}
            </div>
            <div style={styles.grid}>
                {calendarGrid.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} style={styles.dayCell} />;
                    
                    const dayInfo = calculatePhaseForDate(date, lastPeriodStartDate, cycleLength);
                    const isToday = today.getTime() === date.getTime();
                    const isFuture = date > today;
                    const dateString = date.toISOString().split('T')[0];
                    const log = logsByDate[dateString];
                    const phaseColor = dayInfo ? pColors[dayInfo.phase] : { bg: 'transparent', text: isDark ? colors.light : colors.dark };

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => !isFuture && onDateClick(dateString)}
                            disabled={isFuture}
                            style={{
                                ...styles.dayCell, 
                                backgroundColor: phaseColor.bg, 
                                ...(isToday ? styles.todayCell : {}), 
                                ...(isFuture ? styles.futureCell : {})
                            }}
                        >
                            <div style={styles.dayHeader}>
                                <span style={{...styles.dayNumber, color: phaseColor.text }}>{date.getDate()}</span>
                                {log && <span style={styles.moodIcon}>{moodIcons[log.mood]}</span>}
                            </div>
                            {dayInfo?.isPredictedPeriod && (
                                <div style={styles.periodIndicator}>
                                    <Icon name="cycle" size={12} color={isDark ? colors.fuchsia[300] : colors.fuchsia[500]} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
             <div style={styles.legend}>
                {Object.entries(pColors).map(([phase, { bg, text }]) => (
                    <div key={phase} style={styles.legendItem}>
                        <div style={{...styles.legendDot, backgroundColor: bg, borderColor: text }}></div>
                        <span style={{...styles.legendText, color: text }}>{phase}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: { paddingTop: spacing.md, borderTop: `1px solid ${isDark ? colors.gray[700] : colors.border}` },
    header: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    arrowButton: { padding: spacing.sm, background: 'none', border: 'none', cursor: 'pointer' },
    monthTitle: { ...typography.h3, fontSize: 16, color: isDark ? colors.light : colors.dark, margin: 0 },
    weekDays: { display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
    weekDayText: { fontSize: 12, fontWeight: 'bold', color: isDark ? colors.gray[400] : colors.muted, width: '14.28%', textAlign: 'center', margin: 0 },
    grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: '1 / 1', padding: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 8, border: 'none', cursor: 'pointer' },
    todayCell: { borderWidth: 2, borderColor: colors.primary },
    futureCell: { opacity: 0.6, cursor: 'not-allowed' },
    dayHeader: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dayNumber: { fontSize: 12, fontWeight: 'bold' },
    moodIcon: { fontSize: 12 },
    periodIndicator: { display: 'flex', alignItems: 'center' },
    errorText: { textAlign: 'center', ...typography.subtle, color: isDark ? colors.gray[400] : colors.muted, margin: 0 },
    legend: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
    legendItem: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
    legendText: { fontSize: 12 },
});
