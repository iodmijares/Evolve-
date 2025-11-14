import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface PickerItem<T> {
    label: string;
    value: T;
}

interface PickerProps<T> {
    selectedValue: T | undefined;
    onValueChange: (value: T) => void;
    items: PickerItem<T>[];
    placeholder: string;
    style?: React.CSSProperties;
}

export function Picker<T>({ selectedValue, onValueChange, items, placeholder, style }: PickerProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const pickerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = items.find(item => item.value === selectedValue)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={pickerRef} style={{...styles.pickerContainer, ...style}}>
            <button style={getPickerButtonStyles(isDark)} onClick={() => setIsOpen(!isOpen)}>
                <span style={!selectedValue ? getPlaceholderTextStyles(isDark) : {}}>{selectedLabel}</span>
                <Icon name="arrow-right" size={16} color={isDark ? colors.gray[400] : colors.muted} />
            </button>

            {isOpen && (
                <div style={getOptionsContainerStyles(isDark)}>
                    {items.map(item => (
                        <div
                            key={String(item.value)}
                            style={styles.optionItem}
                            onClick={() => {
                                onValueChange(item.value);
                                setIsOpen(false);
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    pickerContainer: {
        position: 'relative',
        width: '100%',
    },
    optionItem: {
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontSize: '15px',
        fontWeight: '500',
    },
};

const getPickerButtonStyles = (isDark: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '14px 16px',
    border: `2px solid transparent`,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.light,
    borderRadius: '12px',
    height: '52px',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: '500',
    color: isDark ? colors.light : colors.dark,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
});

const getPlaceholderTextStyles = (isDark: boolean): React.CSSProperties => ({
    color: isDark ? colors.gray[500] : colors.slate[400],
    fontWeight: '400',
});

const getOptionsContainerStyles = (isDark: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    backdropFilter: 'blur(20px)',
    borderRadius: '8px',
    marginTop: '4px',
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
});
