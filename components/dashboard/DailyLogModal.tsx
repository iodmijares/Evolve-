

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { useUser } from '../../context/UserContext';
import type { DailyLog } from '../../types';
import { Spinner } from '../shared/Spinner';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing } from '../../styles/theme';

const commonSymptoms = ["Cramps", "Bloating", "Headache", "Acne", "Cravings", "Tender Breasts"];
const moods: { value: DailyLog['mood']; label: string; }[] = [
    { value: 'energetic', label: 'Energetic' },
    { value: 'happy', label: 'Happy' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'irritable', label: 'Irritable' },
    { value: 'sad', label: 'Sad' },
    { value: 'fatigued', label: 'Fatigued' },
];

interface DailyLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    date?: string;
    suggestedSymptoms: string[];
    isLoadingSuggestions: boolean;
}

const DailyLogModal: React.FC<DailyLogModalProps> = ({ isOpen, onClose, date, suggestedSymptoms, isLoadingSuggestions }) => {
    const { logDailyEntry, dailyLogs } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const logDate = useMemo(() => date || new Date().toISOString().split('T')[0], [date]);

    const logForDate = useMemo(() => {
        return dailyLogs.find(log => log.date === logDate);
    }, [dailyLogs, logDate]);

    const [selectedMood, setSelectedMood] = useState<DailyLog['mood']>(logForDate?.mood || 'neutral');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(logForDate?.symptoms || []);
    const [customSymptom, setCustomSymptom] = useState('');
    const [hasPeriod, setHasPeriod] = useState(logForDate?.hasPeriod || false);
    
    useEffect(() => {
        if (isOpen) {
            setSelectedMood(logForDate?.mood || 'neutral');
            setSelectedSymptoms(logForDate?.symptoms || []);
            setCustomSymptom('');
            setHasPeriod(logForDate?.hasPeriod || false);
        }
    }, [isOpen, logForDate]);

    const handleSymptomToggle = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
        );
    };

    const handleAddCustomSymptom = () => {
        if (customSymptom && !selectedSymptoms.includes(customSymptom)) {
            setSelectedSymptoms(prev => [...prev, customSymptom]);
        }
        setCustomSymptom('');
    };

    const handleSubmit = () => {
        logDailyEntry({ mood: selectedMood, symptoms: selectedSymptoms, hasPeriod }, logDate);
        onClose();
    };
    
    const formattedDate = new Date(logDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
    });
    
    const title = logDate === new Date().toISOString().split('T')[0] ? "Daily Check-in" : `Log for ${formattedDate}`;

    const renderSymptomButton = (symptom: string, type: 'suggested' | 'common') => {
        const isSelected = selectedSymptoms.includes(symptom);
        let baseStyle, selectedStyle, textStyle, selectedTextStyle;
        
        if (type === 'suggested') {
            baseStyle = styles.suggestedSymptom;
            selectedStyle = styles.suggestedSymptomSelected;
            textStyle = styles.suggestedSymptomText;
            selectedTextStyle = styles.symptomTextSelected;
        } else {
            baseStyle = styles.commonSymptom;
            selectedStyle = styles.commonSymptomSelected;
            textStyle = styles.commonSymptomText;
            selectedTextStyle = styles.symptomTextSelected;
        }

        return (
             <button
                key={symptom}
                onClick={() => handleSymptomToggle(symptom)}
                style={{...styles.symptomButton, ...baseStyle, ...(isSelected ? selectedStyle : {})}}
            >
                <span style={{...textStyle, ...(isSelected ? selectedTextStyle : {})}}>{symptom}</span>
            </button>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={styles.container}>
                <div>
                    <p style={styles.sectionTitle}>How's your mood?</p>
                    <div style={styles.moodGrid}>
                        {moods.map(mood => (
                            <button
                                key={mood.value}
                                onClick={() => setSelectedMood(mood.value)}
                                style={{...styles.moodButton, ...(selectedMood === mood.value ? styles.moodButtonSelected : {})}}
                            >
                                <span style={{...styles.moodText, ...(selectedMood === mood.value ? styles.moodTextSelected : {})}}>{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.section}>
                    <p style={styles.sectionTitle}>Period Tracking</p>
                    <button
                        onClick={() => setHasPeriod(!hasPeriod)}
                        style={{...styles.periodButton, ...(hasPeriod ? styles.periodButtonSelected : {})}}
                    >
                        <div style={styles.checkboxContainer}>
                            <div style={{...styles.checkbox, ...(hasPeriod ? styles.checkboxChecked : {})}}>
                                {hasPeriod && <span style={styles.checkmark}>✓</span>}
                            </div>
                            <span style={{...styles.periodText, ...(hasPeriod ? styles.periodTextSelected : {})}}>I have my period today</span>
                        </div>
                    </button>
                </div>

                <div style={styles.section}>
                    <p style={styles.sectionTitle}>Any symptoms?</p>
                    {isLoadingSuggestions ? (
                        <div style={styles.loadingContainer}>
                           <Spinner size="sm"/>
                           <p style={styles.loadingText}>Loading suggestions...</p>
                        </div>
                    ) : suggestedSymptoms.length > 0 && (
                        <div style={styles.symptomGroup}>
                            <p style={styles.symptomSubheader}>Suggested for you:</p>
                             <div style={styles.symptomList}>
                                {suggestedSymptoms.map(s => renderSymptomButton(s, 'suggested'))}
                            </div>
                        </div>
                    )}

                    <div style={styles.symptomGroup}>
                         <p style={styles.symptomSubheader}>Common:</p>
                        <div style={styles.symptomList}>
                            {commonSymptoms.map(s => renderSymptomButton(s, 'common'))}
                        </div>
                    </div>
                    
                    <div style={styles.symptomGroup}>
                         <p style={styles.symptomSubheader}>Other:</p>
                         <div style={styles.customSymptomContainer}>
                             <input 
                                value={customSymptom}
                                onChange={(e) => setCustomSymptom(e.target.value)}
                                placeholder="Add a custom symptom"
                                style={styles.input}
                             />
                             <button onClick={handleAddCustomSymptom} style={styles.addButton}>
                                <span style={styles.addButtonText}>Add</span>
                             </button>
                         </div>
                    </div>
                </div>

                <button onClick={handleSubmit} style={styles.saveButton}>
                    <span style={styles.saveButtonText}>Save Log</span>
                </button>
            </div>
        </Modal>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: { display: 'flex', flexDirection: 'column', gap: spacing.lg },
    sectionTitle: { ...typography.h3, fontSize: 18, color: isDark ? colors.light : colors.dark, marginBottom: spacing.sm, margin: 0 },
    moodGrid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    moodButton: { width: '32%', padding: 12, borderRadius: 8, borderWidth: 2, borderColor: isDark ? colors.gray[600] : colors.border, backgroundColor: isDark ? colors.gray[700] : colors.light, display: 'flex', alignItems: 'center', marginBottom: spacing.sm, cursor: 'pointer' },
    moodButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    moodText: { ...typography.body, fontSize: 14, fontWeight: 600 as React.CSSProperties['fontWeight'], color: isDark ? colors.light : colors.dark },
    moodTextSelected: { color: colors.light },
    section: { display: 'flex', flexDirection: 'column', gap: spacing.md },
    loadingContainer: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    loadingText: { ...typography.subtle, color: isDark ? colors.gray[400] : colors.muted, margin: 0 },
    symptomGroup: { display: 'flex', flexDirection: 'column', gap: spacing.sm },
    symptomSubheader: { ...typography.body, fontWeight: 500 as React.CSSProperties['fontWeight'], color: isDark ? colors.gray[300] : colors.slate[600], margin: 0 },
    symptomList: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    symptomButton: { padding: '6px 12px', borderRadius: 999, borderWidth: 1, background: 'none', cursor: 'pointer' },
    suggestedSymptom: { backgroundColor: isDark ? 'rgba(217, 70, 239, 0.1)' : colors.fuchsia[50], borderColor: isDark ? 'rgba(217, 70, 239, 0.2)' : colors.fuchsia[50] },
    suggestedSymptomSelected: { backgroundColor: colors.fuchsia[500], borderColor: colors.fuchsia[500] },
    suggestedSymptomText: { color: isDark ? colors.fuchsia[300] : colors.fuchsia[800] },
    commonSymptom: { backgroundColor: isDark ? colors.gray[700] : colors.slate[100], borderColor: isDark ? colors.gray[700] : colors.slate[100] },
    commonSymptomSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    commonSymptomText: { color: isDark ? colors.light : colors.dark },
    symptomTextSelected: { color: colors.light },
    customSymptomContainer: { display: 'flex', flexDirection: 'row', gap: spacing.sm },
    input: { flex: 1, padding: 8, borderWidth: 1, borderColor: isDark ? colors.gray[600] : colors.border, backgroundColor: isDark ? colors.gray[700] : colors.light, borderRadius: 8, color: isDark ? colors.light : colors.dark, height: 40 },
    addButton: { backgroundColor: colors.primary, padding: '0 16px', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' },
    addButtonText: { color: colors.light, fontWeight: 600 as React.CSSProperties['fontWeight'] },
    saveButton: { width: '100%', backgroundColor: colors.accent, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer' },
    saveButtonText: { color: colors.light, fontWeight: 600 as React.CSSProperties['fontWeight'], fontSize: 16 },
    periodButton: { width: '100%', padding: 12, borderRadius: 8, backgroundColor: isDark ? colors.gray[700] : colors.light, border: `2px solid ${isDark ? colors.gray[600] : colors.border}`, cursor: 'pointer', transition: 'all 0.2s ease' },
    periodButtonSelected: { backgroundColor: isDark ? 'rgba(244, 114, 182, 0.15)' : colors.red[50], borderColor: colors.red[400] },
    checkboxContainer: { display: 'flex', alignItems: 'center', gap: spacing.sm },
    checkbox: { width: 24, height: 24, borderRadius: 6, border: `2px solid ${isDark ? colors.gray[500] : colors.slate[300]}`, backgroundColor: isDark ? colors.gray[700] : colors.light, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },
    checkboxChecked: { backgroundColor: colors.red[400], borderColor: colors.red[400] },
    checkmark: { color: colors.light, fontWeight: 700 as React.CSSProperties['fontWeight'], fontSize: 16 },
    periodText: { ...typography.body, fontSize: 15, fontWeight: 500 as React.CSSProperties['fontWeight'], color: isDark ? colors.light : colors.dark },
    periodTextSelected: { color: colors.red[700] },
});

export default DailyLogModal;
