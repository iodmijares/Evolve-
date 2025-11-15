import React from 'react';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography } from '../../styles/theme';

interface RingProps {
    radius: number;
    stroke: number;
    progress: number;
    color: string;
    label: string;
    value: number;
}

const Ring: React.FC<RingProps> = ({ radius, stroke, progress, color, label, value }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div style={styles.ringContainer}>
            <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    stroke={isDark ? colors.gray[700] : colors.border}
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    strokeLinecap="round"
                />
            </svg>
            <div style={styles.labelContainer}>
                <p style={styles.valueText}>{value}g</p>
                <span style={styles.labelText}>{label}</span>
            </div>
        </div>
    );
};


const MacroRings: React.FC = () => {
    const { macros } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [ringSize, setRingSize] = React.useState(window.innerWidth < 375 ? 40 : 50);
    
    React.useEffect(() => {
        const handleResize = () => {
            setRingSize(window.innerWidth < 375 ? 40 : 50);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const styles = getStyles(isDark);
    const { consumed, target } = macros;

    const proteinProgress = target.protein > 0 ? (consumed.protein / target.protein) * 100 : 0;
    const carbsProgress = target.carbs > 0 ? (consumed.carbs / target.carbs) * 100 : 0;
    const fatProgress = target.fat > 0 ? (consumed.fat / target.fat) * 100 : 0;

    return (
        <div>
            <h3 style={styles.title}>Macronutrients</h3>
            <div style={styles.ringsRow}>
                <Ring radius={ringSize} stroke={8} progress={proteinProgress} color={colors.secondary} label="Protein" value={Math.round(consumed.protein)} />
                <Ring radius={ringSize} stroke={8} progress={carbsProgress} color={colors.primary} label="Carbs" value={Math.round(consumed.carbs)} />
                <Ring radius={ringSize} stroke={8} progress={fatProgress} color={colors.accent} label="Fat" value={Math.round(consumed.fat)} />
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): {[key: string]: React.CSSProperties} => ({
    title: {
        ...typography.h3,
        fontSize: 16,
        textAlign: 'center',
        color: isDark ? colors.light : colors.dark,
        marginTop: -8,
    },
    ringsRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingTop: 8,
        gap: 4,
    },
    ringContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    labelContainer: {
        position: 'absolute',
        textAlign: 'center',
    },
    valueText: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    labelText: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
    },
});


export default MacroRings;