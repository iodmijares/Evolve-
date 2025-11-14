

import React, { useState } from 'react';
import type { Meal, Workout, MealType, MenstrualPhase } from '../../types';
import { useUser } from '../../context/UserContext';
import { Icon } from '../shared/Icon';
import { Spinner } from '../shared/Spinner';
import { MealTypeModal } from '../shared/MealTypeModal';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface SuggestionCardProps {
    type: 'meal' | 'workout';
    title: string;
    data: Meal | Workout;
    onRefresh?: () => void;
    isLoading?: boolean;
    cyclePhase?: MenstrualPhase;
}

const STATIC_MEAL_IMAGE_URL = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1887&auto=format&fit=crop';
const STATIC_WORKOUT_IMAGE_URL = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop';

const SuggestionCard: React.FC<SuggestionCardProps> = ({ type, data, onRefresh, isLoading, cyclePhase }) => {
    const { logMeal, logWorkout } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isMealTypeModalOpen, setIsMealTypeModalOpen] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    const imageUrl = type === 'meal' ? STATIC_MEAL_IMAGE_URL : STATIC_WORKOUT_IMAGE_URL;

    const isMeal = (_d: Meal | Workout): _d is Meal => type === 'meal';

    const handleAction = () => {
        if (isMeal(data)) {
            setIsMealTypeModalOpen(true);
        } else {
            const { id, userId, ...workoutDataToLog } = data as Workout;
            logWorkout(workoutDataToLog);
        }
    };

    const handleSelectMealType = (mealType: MealType) => {
        if (isMeal(data)) {
            const { id, userId, ...mealDataToLog } = data;
            logMeal({ ...mealDataToLog, mealType });
            setIsMealTypeModalOpen(false);
        }
    };
    
    const mealData = isMeal(data) ? data : null;
    const workoutData = type === 'workout' ? (data as Workout) : null;
    
    return (
        <>
            <div style={styles.card}>
                <div style={styles.imageContainer}>
                    {isImageLoading && <div style={{position: 'absolute'}}><Spinner/></div>}
                    <img 
                        src={imageUrl} 
                        style={styles.image} 
                        onLoad={() => setIsImageLoading(false)}
                        alt={data.name}
                    />
                </div>
                <div style={styles.content}>
                    <div style={styles.header}>
                        <div style={styles.titleContainer}>
                            <p style={styles.title}>{data.name}</p>
                             {cyclePhase && (
                                <div style={styles.phaseBadge}>
                                    <Icon name="cycle" size={12} color={colors.fuchsia[800]} />
                                    <p style={styles.phaseText}>{cyclePhase} Phase</p>
                                </div>
                            )}
                        </div>
                        {type === 'workout' && onRefresh && (
                            <button 
                                onClick={onRefresh}
                                style={styles.refreshButton}
                                disabled={isLoading}
                            >
                                <Icon name="refresh" size={20} color={isDark ? colors.gray[400] : colors.muted} />
                            </button>
                        )}
                    </div>

                    {isMeal(data) ? (
                        <>
                            <div style={styles.macrosRow}>
                                <p style={styles.macroText}>Cals: {Math.round(data.macros.calories)}</p>
                                <p style={styles.macroText}>P: {Math.round(data.macros.protein)}g</p>
                                <p style={styles.macroText}>C: {Math.round(data.macros.carbs)}g</p>
                                <p style={styles.macroText}>F: {Math.round(data.macros.fat)}g</p>
                            </div>
                            {data.rationale && (
                                <div style={styles.rationaleBox}>
                                    <Icon name="lightbulb" size={16} color={colors.emerald[500]} />
                                    <p style={styles.rationaleText}>{data.rationale}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        workoutData && (
                            <div style={styles.macrosRow}>
                                <p style={styles.macroText}>Duration: {workoutData.duration} min</p>
                                <p style={styles.macroText}>Type: {workoutData.type}</p>
                            </div>
                        )
                    )}

                    {isExpanded && (
                        <div style={styles.expandedContainer}>
                            {mealData?.description && <p style={styles.description}>{mealData.description}</p>}
                            {mealData?.ingredients && (
                                <div>
                                    <p style={styles.sectionTitle}>Ingredients</p>
                                    {mealData.ingredients.map((ing, i) => <p key={i} style={styles.listItem}>&bull; {ing}</p>)}
                                </div>
                            )}
                             {mealData?.instructions && (
                                <div>
                                    <p style={styles.sectionTitle}>Instructions</p>
                                    {mealData.instructions.map((step, i) => <p key={i} style={styles.listItem}>{i + 1}. {step}</p>)}
                                </div>
                            )}
                            {workoutData && (
                                <>
                                    <div>
                                        <p style={styles.sectionTitle}>Instructions</p>
                                        <p style={styles.description}>{workoutData.description}</p>
                                    </div>
                                    <div style={styles.videoPlaceholder}>
                                        <Icon name="workout" size={32} color={colors.slate[500]} />
                                        <p style={styles.videoPlaceholderText}>Video preview not available</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    <div style={styles.buttonRow}>
                        <button onClick={() => setIsExpanded(!isExpanded)} style={{...styles.button, ...styles.detailsButton}}>
                            <span style={{...styles.buttonText, ...styles.detailsButtonText}}>{isExpanded ? 'Show Less' : 'Details'}</span>
                        </button>
                        <button onClick={handleAction} style={{...styles.button, ...(type === 'meal' ? styles.logMealButton : styles.logWorkoutButton)}}>
                            <span style={styles.buttonText}>{type === 'meal' ? 'Log Meal' : 'Log Workout'}</span>
                        </button>
                    </div>
                </div>
            </div>
            {isMeal(data) && (
                <MealTypeModal
                    isOpen={isMealTypeModalOpen}
                    onClose={() => setIsMealTypeModalOpen(false)}
                    onSelect={handleSelectMealType}
                />
            )}
        </>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    card: {
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    imageContainer: {
        height: 160,
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    content: {
        padding: spacing.md,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    phaseBadge: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.fuchsia[50],
        padding: '2px 8px',
        borderRadius: 999,
        marginTop: spacing.xs,
        alignSelf: 'flex-start',
    },
    phaseText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.fuchsia[800],
        marginLeft: spacing.xs,
        margin: 0,
    },
    refreshButton: {
        padding: spacing.xs,
        background: 'none',
        border: 'none',
        cursor: 'pointer'
    },
    macrosRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    macroText: {
        ...typography.subtle,
        fontSize: 12,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    rationaleBox: {
        marginTop: spacing.md,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : colors.emerald[50],
        padding: spacing.sm,
        borderRadius: 8,
    },
    rationaleText: {
        fontSize: 12,
        fontWeight: '500',
        color: isDark ? colors.emerald[300] : colors.emerald[800],
        marginLeft: spacing.sm,
        flex: 1,
        margin: 0,
    },
    expandedContainer: {
        marginTop: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16,
        color: isDark ? colors.light : colors.dark,
        marginBottom: spacing.xs,
        margin: 0,
    },
    description: {
        ...typography.body,
        color: isDark ? colors.gray[300] : colors.muted,
        fontStyle: 'italic',
        margin: 0,
    },
    listItem: {
        ...typography.body,
        color: isDark ? colors.gray[300] : colors.dark,
        margin: 0,
    },
    videoPlaceholder: {
        height: 160,
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    videoPlaceholderText: {
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.slate[500],
        margin: 0,
    },
    buttonRow: {
        display: 'flex',
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
        color: colors.light,
    },
    detailsButton: {
        backgroundColor: isDark ? colors.gray[700] : colors.slate[100],
    },
    detailsButtonText: {
        color: isDark ? colors.light : colors.dark,
    },
    logMealButton: {
        backgroundColor: colors.secondary,
    },
    logWorkoutButton: {
        backgroundColor: colors.accent,
    },
});

export default SuggestionCard;
