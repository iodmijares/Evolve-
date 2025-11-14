

import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { useUser } from '../../context/UserContext';
import type { UserProfile, Goal, ActivityLevel } from '../../types';
import { Spinner } from '../shared/Spinner';
import { Picker } from '../shared/Picker';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user }) => {
    const { updateUserProfile } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const [formData, setFormData] = useState<UserProfile>(user);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(user);
            setError(null);
        }
    }, [isOpen, user]);

    const handleChange = (field: keyof UserProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await updateUserProfile(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                await uploadProfilePicture(file);
            }
        };
        input.click();
    };

    const uploadProfilePicture = async (file: File) => {
        setUploadingImage(true);
        setError(null);
        
        try {
            const { supabase } = await import('../../services/supabaseClient');
            
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `profile-pictures/${fileName}`;

            if (user.profilePictureUrl) {
                const oldFileName = user.profilePictureUrl.split('/').pop();
                if (oldFileName) {
                    await supabase.storage
                        .from('profile-pictures')
                        .remove([`profile-pictures/${oldFileName}`]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ profile_picture_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setFormData(prev => ({ ...prev, profilePictureUrl: publicUrl }));
            
        } catch (error: any) {
            console.error('Error uploading profile picture:', error);
            setError(`Failed to upload: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <div style={styles.container}>
                <div style={styles.imageSection}>
                    <button onClick={handleImageUpload} style={styles.avatarButton} disabled={uploadingImage}>
                        <img 
                            src={formData.profilePictureUrl || `https://i.pravatar.cc/150?u=${formData.name}`} 
                            alt="Profile"
                            style={styles.avatar}
                        />
                        <div style={styles.uploadOverlay}>
                            {uploadingImage ? <Spinner size="sm" /> : <span style={styles.uploadText}>Change Photo</span>}
                        </div>
                    </button>
                </div>

                <div>
                    <label style={styles.label} htmlFor="edit-name">Full Name</label>
                    <input id="edit-name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} style={styles.input} />
                </div>

                <div>
                    <label style={styles.label} htmlFor="edit-username">Username / Nickname (Public Display)</label>
                    <input 
                        id="edit-username" 
                        value={formData.username || ''} 
                        onChange={(e) => handleChange('username', e.target.value)} 
                        placeholder="How you'd like to be called publicly" 
                        style={styles.input} 
                    />
                    <p style={styles.helpText}>
                        This will be used in AI reflections and public displays instead of your full name
                    </p>
                </div>

                <div>
                    <label style={styles.label} htmlFor="edit-nationality">Nationality</label>
                    <input id="edit-nationality" value={formData.nationality || ''} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="e.g., Italian, Japanese" style={styles.input} />
                </div>

                <div style={styles.grid}>
                    <div style={styles.gridItem}>
                        <label style={styles.label} htmlFor="edit-height">Height (cm)</label>
                        <input id="edit-height" value={String(formData.height)} onChange={(e) => handleChange('height', parseFloat(e.target.value))} style={styles.input} type="number" />
                    </div>
                    <div style={styles.gridItem}>
                        <label style={styles.label} htmlFor="edit-age">Age</label>
                        <input id="edit-age" value={String(formData.age)} onChange={(e) => handleChange('age', parseInt(e.target.value))} style={styles.input} type="number" />
                    </div>
                </div>

                <div>
                    <label style={styles.label}>Primary Goal</label>
                    <Picker<Goal>
                        selectedValue={formData.goal}
                        onValueChange={(v) => handleChange('goal', v)}
                        placeholder="Select Goal"
                        items={[
                            { label: "Weight Loss", value: "weight_loss" },
                            { label: "Muscle Gain", value: "muscle_gain" },
                            { label: "Maintenance", value: "maintenance" }
                        ]}
                    />
                </div>
                
                <div>
                    <label style={styles.label}>Activity Level</label>
                     <Picker<ActivityLevel>
                        selectedValue={formData.activityLevel}
                        onValueChange={(v) => handleChange('activityLevel', v)}
                        placeholder="Select Activity Level"
                        items={[
                            { label: "Sedentary", value: "sedentary" },
                            { label: "Lightly Active", value: "lightly_active" },
                            { label: "Moderately Active", value: "moderately_active" },
                            { label: "Very Active", value: "very_active" }
                        ]}
                    />
                </div>
                
                {user.gender === 'female' && (
                    <>
                        <p style={styles.sectionTitle}>Cycle Tracking</p>
                         <div style={styles.grid}>
                            <div style={styles.gridItem}>
                                <label style={styles.label} htmlFor="edit-period">Last Period Start</label>
                                <input id="edit-period" value={formData.lastPeriodStartDate || ''} onChange={(e) => handleChange('lastPeriodStartDate', e.target.value)} placeholder="YYYY-MM-DD" style={styles.input} type="date" />
                            </div>
                            <div style={styles.gridItem}>
                                <label style={styles.label} htmlFor="edit-cycle">Cycle Length</label>
                                <input id="edit-cycle" value={String(formData.cycleLength || '')} onChange={(e) => handleChange('cycleLength', parseInt(e.target.value))} style={styles.input} type="number" />
                            </div>
                        </div>
                    </>
                )}
                
                {error && <p style={styles.errorText}>{error}</p>}

                <div style={styles.buttonRow}>
                    <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>
                        <span style={{...styles.buttonText, ...styles.cancelButtonText}}>Cancel</span>
                    </button>
                    <button onClick={handleSubmit} disabled={isLoading} style={{...styles.button, ...styles.saveButton, ...(isLoading ? { opacity: 0.7 } : {})}}>
                        {isLoading ? <Spinner size="sm" /> : <span style={styles.buttonText}>Save Changes</span>}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: { display: 'flex', flexDirection: 'column', gap: spacing.md },
    imageSection: { display: 'flex', justifyContent: 'center', paddingBottom: spacing.md },
    avatarButton: { 
        position: 'relative', 
        border: 'none', 
        background: 'none', 
        cursor: 'pointer',
        padding: 0,
        borderRadius: '50%',
        overflow: 'hidden',
    },
    avatar: { 
        width: '120px', 
        height: '120px', 
        borderRadius: '50%',
        objectFit: 'cover',
        border: `4px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
        display: 'block',
    },
    uploadOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        padding: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.2s ease',
    },
    uploadText: { 
        color: colors.light, 
        fontSize: '12px', 
        fontWeight: '600',
    },
    label: { ...typography.body, fontWeight: '500', color: isDark ? colors.gray[300] : colors.slate[700], marginBottom: spacing.xs, display: 'block' },
    helpText: { ...typography.subtle, fontSize: 12, color: isDark ? colors.gray[400] : colors.slate[500], marginTop: spacing.xs, marginBottom: 0 },
    input: { width: '100%', boxSizing: 'border-box', padding: 12, borderWidth: 1, borderColor: isDark ? colors.gray[600] : colors.border, backgroundColor: isDark ? colors.gray[700] : colors.light, color: isDark ? colors.light : colors.dark, borderRadius: 8, fontSize: 16, height: 50 },
    grid: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
    gridItem: { width: '48%' },
    sectionTitle: { ...typography.h3, fontSize: 16, paddingTop: spacing.md, marginTop: spacing.sm, borderTop: `1px solid ${isDark ? colors.gray[700] : colors.border}`, color: isDark ? colors.light : colors.dark, margin: 0 },
    errorText: { color: colors.red[400], textAlign: 'center', margin: 0 },
    buttonRow: { display: 'flex', flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
    button: { flex: 1, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, border: 'none', cursor: 'pointer' },
    buttonText: { fontWeight: '600', fontSize: 16, color: colors.light },
    cancelButton: { backgroundColor: isDark ? colors.gray[600] : colors.slate[200] },
    cancelButtonText: { color: isDark ? colors.light : colors.dark },
    saveButton: { backgroundColor: colors.primary },
});
