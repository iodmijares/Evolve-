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
            <button 
                style={getPickerButtonStyles(isDark)} 
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.slate[100];
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : colors.slate[200];
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : colors.slate[50];
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
                }}
            >
                <span style={!selectedValue ? getPlaceholderTextStyles(isDark) : {}}>{selectedLabel}</span>
                <Icon name="arrow-right" size={16} color={isDark ? colors.gray[400] : colors.muted} />
            </button>

            {isOpen && (
                <div style={getOptionsContainerStyles(isDark)}>
                    {items.map(item => (
                        <div
                            key={String(item.value)}
                            style={{
                                ...styles.optionItem,
                                backgroundColor: item.value === selectedValue 
                                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : colors.emerald[50])
                                    : 'transparent',
                                color: isDark ? colors.light : colors.dark,
                            }}
                            onClick={() => {
                                onValueChange(item.value);
                                setIsOpen(false);
                            }}
                            onMouseEnter={(e) => {
                                if (item.value !== selectedValue) {
                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : colors.slate[100];
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (item.value !== selectedValue) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
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
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontSize: '15px',
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        letterSpacing: '-0.01em',
        borderRadius: '12px',
        margin: '4px 6px',
    },
};

const getPickerButtonStyles = (isDark: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 18px',
    border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent'}`,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.slate[50],
    borderRadius: '16px',
    height: '56px',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: 500 as React.CSSProperties['fontWeight'],
    letterSpacing: '-0.01em',
    color: isDark ? colors.light : colors.dark,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
});

const getPlaceholderTextStyles = (isDark: boolean): React.CSSProperties => ({
    color: isDark ? colors.gray[500] : colors.slate[400],
    fontWeight: 400 as React.CSSProperties['fontWeight'],
    opacity: 0.7,
});

const getOptionsContainerStyles = (isDark: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
    backdropFilter: 'blur(30px)',
    borderRadius: '16px',
    marginTop: '4px',
    zIndex: 10,
    maxHeight: '240px',
    overflowY: 'auto',
    boxShadow: isDark 
        ? '0 12px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
    animation: 'slideDown 0.2s ease',
});
