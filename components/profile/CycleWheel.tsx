

import React from 'react';
import type { MenstrualPhase } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface CycleWheelProps {
    dayOfCycle: number;
    cycleLength: number;
    phase: MenstrualPhase;
}

const phaseConfig = {
    Menstrual: { color: '#ec4899', duration: 5 },  // Pink
    Follicular: { color: '#a855f7', duration: 8 }, // Purple
    Ovulatory: { color: '#ef4444', duration: 3 },  // Red
    Luteal: { color: '#0ea5e9', duration: 12 }, // Sky
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};


const CycleWheel: React.FC<CycleWheelProps> = ({ dayOfCycle, cycleLength, phase }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const size = 150;
    const center = size / 2;
    const radius = 65;
    const strokeWidth = 18;

    const totalDuration = Object.values(phaseConfig).reduce((sum, p) => sum + p.duration, 0);
    const degreesPerDay = 360 / cycleLength;

    let accumulatedAngle = 0;

    const arcs = (Object.keys(phaseConfig) as MenstrualPhase[]).map(phaseKey => {
        const p = phaseConfig[phaseKey];
        const phaseDuration = (p.duration / totalDuration) * cycleLength;
        const sweepAngle = phaseDuration * degreesPerDay;
        
        const path = describeArc(center, center, radius, accumulatedAngle, accumulatedAngle + sweepAngle - 2); // -2 for gap
        accumulatedAngle += sweepAngle;

        return {
            key: phaseKey,
            path,
            color: p.color,
        };
    });

    const indicatorAngle = (dayOfCycle - 0.5) * degreesPerDay;
    const indicatorPos = polarToCartesian(center, center, radius, indicatorAngle);

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={center} cy={center} r={radius} fill="none" stroke={isDark ? colors.gray[700] : "#e5e7eb"} strokeWidth={strokeWidth} />

                {arcs.map(arc => (
                    <path key={arc.key} d={arc.path} fill="none" stroke={arc.color} strokeWidth={strokeWidth} />
                ))}

                <circle cx={indicatorPos.x} cy={indicatorPos.y} r={strokeWidth / 2 - 2} fill="white" stroke={isDark ? colors.gray[300] : "#1e293b"} strokeWidth="2" />
            </svg>
            <div style={styles.centerContainer}>
                 <p style={styles.dayText}>{dayOfCycle}</p>
                 <div style={{...styles.phaseBadge, backgroundColor: phaseConfig[phase].color }}>
                    <span style={styles.phaseText}>{phase}</span>
                 </div>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    centerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    phaseBadge: {
        padding: '2px 8px',
        borderRadius: 999,
    },
    phaseText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.light,
    }
});

export default CycleWheel;
