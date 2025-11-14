
import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { useUser } from '../../context/UserContext';
import { getMealTypeByTime } from '../../utils/dateUtils';
import { MealType } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface LogMealModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogMealModal: React.FC<LogMealModalProps> = ({ isOpen, onClose }) => {
    const { logMeal } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [name, setName] = useState('');
    const [calories, setCalories] = useState<string>('');
    const [protein, setProtein] = useState<string>('');
    const [carbs, setCarbs] = useState<string>('');
    const [fat, setFat] = useState<string>('');
    const [isSnack, setIsSnack] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setIsSnack(false);
        setError(null);
    };

    const handleSubmit = () => {
        if (!name || !calories || !protein || !carbs || !fat) {
            setError('Please fill out all fields.');
            return;
        }
        
        const determinedMealType: MealType = isSnack ? 'Snack' : getMealTypeByTime();

        const mealData = {
            name,
            macros: {
                calories: Number(calories),
                protein: Number(protein),
                carbs: Number(carbs),
                fat: Number(fat),
            },
            mealType: determinedMealType,
        };

        logMeal(mealData);
        resetForm();
        onClose();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Log Meal Manually">
            <div style={styles.container}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal Name (e.g., Apple with Peanut Butter)" style={styles.input} />
                
                <div style={styles.grid}>
                     <input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" style={styles.gridInput} type="number" />
                     <input value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" style={styles.gridInput} type="number" />
                     <input value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" style={styles.gridInput} type="number" />
                     <input value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat (g)" style={styles.gridInput} type="number" />
                </div>

                <div style={styles.snackContainer}>
                    <label style={styles.label} htmlFor="snack-switch">Log as a snack</label>
                    <button 
                        id="snack-switch"
                        role="switch"
                        aria-checked={isSnack}
                        onClick={() => setIsSnack(!isSnack)} 
                        style={{...styles.switch, ...(isSnack ? styles.switchActive : {})}}
                    >
                        <span style={{...styles.switchThumb, ...(isSnack ? styles.switchThumbActive : {})}}></span>
                    </button>
                </div>

                {error && <p style={styles.errorText}>{error}</p>}

                <button onClick={handleSubmit} style={styles.button}>
                    <span style={styles.buttonText}>Add Meal to Log</span>
                </button>
            </div>
        </Modal>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    input: {
        width: '100%',
        padding: 12,
        border: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        backgroundColor: isDark ? colors.gray[700] : colors.light,
        color: isDark ? colors.light : colors.dark,
        borderRadius: 8,
        fontSize: 16,
    },
    grid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridInput: {
        width: '48%',
        padding: 12,
        border: `1px solid ${isDark ? colors.gray[600] : colors.border}`,
        backgroundColor: isDark ? colors.gray[700] : colors.light,
        color: isDark ? colors.light : colors.dark,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: spacing.sm,
    },
    snackContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xs,
        gap: spacing.sm,
    },
    label: {
        ...typography.body,
        fontWeight: '500',
        color: isDark ? colors.light : colors.dark,
    },
    errorText: {
        color: colors.red[400],
        textAlign: 'center',
        margin: 0,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
    },
    buttonText: {
        color: colors.light,
        fontWeight: '600',
        fontSize: 16,
    },
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: 44,
        height: 24,
        backgroundColor: isDark ? colors.gray[600] : colors.border,
        borderRadius: 34,
        transition: 'background-color 0.2s',
        border: 'none',
        cursor: 'pointer',
    },
    switchActive: {
        backgroundColor: colors.primary,
    },
    switchThumb: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: 20,
        height: 20,
        backgroundColor: 'white',
        borderRadius: '50%',
        transition: 'transform 0.2s',
    },
    switchThumbActive: {
        transform: 'translateX(20px)',
    }
});
