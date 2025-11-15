import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography } from '../../styles/theme';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const modalRoot = document.body;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            style={styles.centeredView} 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div style={getModalViewStyles(isDark)} onClick={(e) => e.stopPropagation()}>
                <div style={getHeaderStyles(isDark)}>
                    <h2 id="modal-title" style={styles.modalTitle}>{title}</h2>
                    <button onClick={onClose} style={styles.closeButton} aria-label="Close modal">
                        <Icon name="close" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                    </button>
                </div>
                <div style={styles.content}>
                    {children}
                </div>
            </div>
        </div>,
        modalRoot
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    centeredView: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid',
    },
    modalTitle: {
        ...typography.h2,
        margin: 0,
    },
    closeButton: {
        padding: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
    },
    content: {
        padding: '24px',
        maxHeight: 'calc(80vh - 70px)',
        overflowY: 'auto',
    }
};

const getModalViewStyles = (isDark: boolean): React.CSSProperties => ({
    backgroundColor: isDark ? colors.gray[800] : colors.light,
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90%',
    boxShadow: isDark 
        ? '0 20px 50px rgba(0, 0, 0, 0.5)'
        : '0 20px 50px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    color: isDark ? colors.light : colors.dark,
    border: isDark ? `1px solid ${colors.gray[700]}` : `1px solid ${colors.border}`,
});

const getHeaderStyles = (isDark: boolean): React.CSSProperties => ({
    ...styles.header,
    borderBottomColor: isDark ? colors.gray[700] : colors.border,
});
