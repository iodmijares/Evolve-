

import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import ProgressChart from './ProgressChart';
import { Icon } from '../shared/Icon';
import { calculateMenstrualPhase, calculatePhaseForDate } from '../../utils/dateUtils';
import type { Workout } from '../../types';
import CycleWheel from './CycleWheel';
import { LogWeightModal } from './LogWeightModal';
import { Card } from '../shared/Card';
import { StatCard } from './StatCard';
import { EditProfileModal } from './EditProfileModal';
import { CycleCalendar } from './CycleCalendar';
import { CyclePatternInsightCard } from './CyclePatternInsightCard';
import DailyLogModal from '../dashboard/DailyLogModal';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';
import { generateSymptomSuggestions } from '../../services/groqService';

const WorkoutHistoryList: React.FC<{ workouts: Workout[] }> = ({ workouts }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getWorkoutStyles(isDark);
    
    if (workouts.length === 0) {
        return <p style={styles.emptyText}>No workouts logged yet. Go crush one!</p>;
    }

    return (
        <div style={styles.listContainer}>
            {workouts.slice(-5).reverse().map((workout) => (
                <div key={workout.id} style={styles.workoutItem}>
                    <div style={styles.iconContainer}>
                        <Icon name="workout" size={20} color={isDark ? colors.gray[300] : colors.slate[600]} />
                    </div>
                    <div>
                        <p style={styles.workoutName}>{workout.name}</p>
                        <p style={styles.workoutDetails}>{workout.type} &bull; {workout.duration} min</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const getBmiCategory = (bmiValue: number): { category: string, color: string } => {
    if (bmiValue < 18.5) return { category: 'Underweight', color: colors.secondary };
    if (bmiValue < 25) return { category: 'Healthy', color: colors.primary };
    if (bmiValue < 30) return { category: 'Overweight', color: colors.accent };
    return { category: 'Obese', color: colors.red[400] };
};

const Profile: React.FC = () => {
    const userData = useUser();
    const { 
        user, workoutHistory, dailyLogs,
        cycleInsight, cyclePatternInsight, isCyclePatternInsightLoading,
        logout
    } = userData;
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isCycleLogModalOpen, setCycleLogModalOpen] = useState(false);
    const [selectedDateForLog, setSelectedDateForLog] = useState<string | null>(null);
    const [modalSymptoms, setModalSymptoms] = useState<string[]>([]);
    const [isModalSymptomsLoading, setIsModalSymptomsLoading] = useState(false);
    
    const handlePictureUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file && user) {
                await uploadProfilePicture(file);
            }
        };
        input.click();
    };

    const uploadProfilePicture = async (file: File) => {
        if (!user) return;
        
        try {
            const { supabase } = await import('../../services/supabaseClient');
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `profile-pictures/${fileName}`;

            // Delete old profile picture if exists
            if (user.profilePictureUrl) {
                const oldFileName = user.profilePictureUrl.split('/').pop();
                if (oldFileName) {
                    await supabase.storage
                        .from('profile-pictures')
                        .remove([`profile-pictures/${oldFileName}`]);
                }
            }

            // Upload new picture
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            // Update user profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ profile_picture_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update local state - refresh user profile
            if (userData.user) {
                await userData.updateUserProfile({ ...userData.user, profilePictureUrl: publicUrl });
            }
            
            alert('Profile picture updated successfully!');
        } catch (error: any) {
            console.error('Error uploading profile picture:', error);
            alert(`Failed to upload profile picture: ${error.message}`);
        }
    };

    const phaseData = useMemo(() => {
        if (user && user.gender === 'female' && user.lastPeriodStartDate && user.cycleLength) {
            return calculateMenstrualPhase(user.lastPeriodStartDate, user.cycleLength);
        }
        return null;
    }, [user]);

    const bmi = useMemo(() => {
        if (!user || !user.weight || !user.height) return null;
        const heightInMeters = user.height / 100;
        return (user.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }, [user]);
    
    const handleDateClick = async (date: string) => {
        setSelectedDateForLog(date);
        setCycleLogModalOpen(true);
        if (user?.gender === 'female' && user.lastPeriodStartDate && user.cycleLength) {
            setIsModalSymptomsLoading(true);
            const dateObj = new Date(date + 'T00:00:00');
            const phaseDataForDate = calculatePhaseForDate(dateObj, user.lastPeriodStartDate, user.cycleLength);
            if (phaseDataForDate) {
                try {
                    // Symptoms are now cached in the service layer for 7 days
                    const symptoms = await generateSymptomSuggestions(phaseDataForDate.phase);
                    setModalSymptoms(symptoms);
                } catch (e) {
                    console.error("Couldn't fetch symptoms for date", e);
                    setModalSymptoms([]);
                } finally {
                    setIsModalSymptomsLoading(false);
                }
            } else {
                setModalSymptoms([]);
                setIsModalSymptomsLoading(false);
            }
        }
    };

    if (!user) return null;

    const bmiInfo = bmi ? getBmiCategory(parseFloat(bmi)) : null;

    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <div className="container">
                <div style={styles.header}>
                    <div style={styles.profileInfo}>
                        <button onClick={handlePictureUpload} style={styles.avatarContainer}>
                             <img 
                                src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.name}`} 
                                style={styles.avatar} 
                                alt={`${user.name}'s profile`}
                            />
                            <div style={styles.cameraIcon}>
                                <Icon name="camera" size={20} color={colors.light} />
                            </div>
                        </button>
                        <div>
                            <h1 style={styles.name}>{user.username || user.name}</h1>
                            {user.username && <p style={styles.realName}>{user.name}</p>}
                            <p style={styles.goal}>{user.goal.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsEditModalOpen(true)} style={styles.settingsButton}>
                        <Icon name="pencil" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                    </button>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-column">
                        <Card title="Progress & Stats" icon="badge">
                            <div style={styles.statsGrid}>
                                <StatCard icon="target" iconColor={colors.accent} title="Current Weight">
                                    <button onClick={() => setIsWeightModalOpen(true)} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
                                        <p style={{...styles.statValue, color: colors.accent}}>{user.weight} kg</p>
                                    </button>
                                </StatCard>
                                {bmiInfo && (
                                     <StatCard icon="badge" iconColor={bmiInfo.color} title="BMI">
                                        <p style={{...styles.statValue, color: bmiInfo.color}}>{bmi}</p>
                                        <p style={{...styles.statLabel, color: bmiInfo.color}}>{bmiInfo.category}</p>
                                    </StatCard>
                                )}
                            </div>
                            <div style={{height: 300, marginTop: spacing.md}}>
                                <ProgressChart />
                            </div>
                        </Card>

                        {user.gender === 'female' && (
                             <Card title="Current Cycle" icon="cycle">
                                {phaseData ? (
                                    <div style={styles.cycleGrid}>
                                        <div style={styles.cycleWheelContainer}>
                                            <CycleWheel dayOfCycle={phaseData.dayOfCycle} cycleLength={user.cycleLength!} phase={phaseData.phase} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {cycleInsight && (
                                                <>
                                                    <p style={styles.insightTitle}>{cycleInsight.energyPrediction}</p>
                                                    <p style={styles.insightBody}>{cycleInsight.nutritionTip}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p style={styles.emptyText}>Update your cycle info in settings for personalized insights.</p>
                                )}
                             </Card>
                        )}
                         {user.gender === 'female' && (
                            <Card title="Cycle Calendar & Patterns" icon="clipboard">
                                <CyclePatternInsightCard insight={cyclePatternInsight} isLoading={isCyclePatternInsightLoading} />
                                <CycleCalendar user={user} dailyLogs={dailyLogs} onDateClick={handleDateClick} />
                            </Card>
                        )}
                    </div>

                    <div className="dashboard-column">
                        <Card title="Workout History" icon="workout">
                            <WorkoutHistoryList workouts={workoutHistory} />
                        </Card>
                        
                        <Card title="Settings" icon="settings">
                            <ThemeToggle />
                            <button onClick={logout} style={styles.logoutButton}>
                                <Icon name="logout" size={20} color={isDark ? colors.light : colors.dark} />
                                <span style={styles.logoutText}>Logout</span>
                            </button>
                        </Card>
                    </div>
                </div>

            </div>
             <LogWeightModal
                isOpen={isWeightModalOpen}
                onClose={() => setIsWeightModalOpen(false)}
                currentWeight={user.weight}
            />
            <EditProfileModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />
            {selectedDateForLog && (
                <DailyLogModal
                    isOpen={isCycleLogModalOpen}
                    onClose={() => {
                        setCycleLogModalOpen(false);
                        setSelectedDateForLog(null);
                        setModalSymptoms([]);
                    }}
                    date={selectedDateForLog}
                    suggestedSymptoms={modalSymptoms}
                    isLoadingSuggestions={isModalSymptomsLoading}
                />
            )}
        </div>
    );
};

// Styles
const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        background: isDark 
            ? 'rgba(31, 41, 55, 0.6)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '24px', // Default padding, could be responsive but CSS handles container
        borderRadius: '16px',
        boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
    },
    profileInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px',
    },
    avatarContainer: {
        position: 'relative',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    avatar: {
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        border: `4px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        objectFit: 'cover',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '8px',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: '28px',
        fontWeight: 800 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.5px',
    },
    realName: {
        fontSize: '13px',
        fontWeight: 400 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[400] : colors.slate[500],
        margin: 0,
        marginTop: '2px',
    },
    goal: {
        fontSize: '14px',
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: colors.primary,
        textTransform: 'uppercase',
        margin: 0,
        marginTop: '4px',
        letterSpacing: '0.5px',
    },
    settingsButton: {
        padding: '10px',
        background: isDark 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.04)',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    statsGrid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    statValue: {
        ...typography.h1,
        fontSize: 28,
        margin: 0,
    },
    statLabel: {
        ...typography.body,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        margin: 0,
    },
    cycleGrid: {
        display: 'flex',
        flexDirection: 'row', // We keep this row for now, but could be responsive with CSS if needed
        alignItems: 'center',
        gap: spacing.md,
        flexWrap: 'wrap' // Allow wrapping on mobile
    },
    cycleWheelContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightTitle: {
        ...typography.h3,
        color: isDark ? colors.light : colors.dark,
        margin: 0,
    },
    insightBody: {
        ...typography.body,
        color: isDark ? colors.gray[300] : colors.muted,
        marginTop: spacing.xs,
        margin: 0,
    },
    emptyText: {
        textAlign: 'center',
        ...typography.subtle,
        color: isDark ? colors.gray[400] : colors.muted,
        margin: 0,
    },
    logoutButton: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        padding: '14px',
        background: isDark
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        borderRadius: '16px',
        marginTop: '16px',
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s ease',
    },
    logoutText: {
        fontSize: '15px',
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        color: isDark ? '#fca5a5' : '#b91c1c',
    }
});
const getWorkoutStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    workoutItem: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '14px',
        padding: '14px',
        background: isDark 
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(0, 0, 0, 0.02)',
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        transition: 'all 0.2s ease',
    },
    iconContainer: {
        background: isDark
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        padding: '10px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    workoutName: {
        fontSize: '15px',
        fontWeight: 700 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.2px',
    },
    workoutDetails: {
        fontSize: '13px',
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
        marginTop: '2px',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[500] : colors.slate[500],
        margin: 0,
        padding: '20px',
    }
});
export default Profile;