import React, { Component, ReactNode } from 'react';
import { colors, typography, spacing } from '../../styles/theme';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // In production, send to error tracking service (e.g., Sentry)
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to Sentry or similar
            // Sentry.captureException(error, { extra: errorInfo });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={styles.container}>
                    <div style={styles.content}>
                        <h1 style={styles.title}>😕 Oops!</h1>
                        <p style={styles.message}>
                            Something went wrong. Don't worry, your data is safe.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>Error Details</summary>
                                <pre style={styles.errorText}>
                                    {this.state.error.toString()}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <button onClick={this.handleReset} style={styles.button}>
                            Try Again
                        </button>
                        <button onClick={() => window.location.href = '/'} style={styles.linkButton}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: colors.base,
        padding: spacing.lg,
    },
    content: {
        textAlign: 'center',
        maxWidth: 500,
    },
    title: {
        ...typography.h1,
        fontSize: 48,
        marginBottom: spacing.md,
        color: colors.dark,
    },
    message: {
        ...typography.body,
        fontSize: 18,
        marginBottom: spacing.lg,
        color: colors.muted,
    },
    details: {
        textAlign: 'left',
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.light,
        borderRadius: 8,
    },
    summary: {
        cursor: 'pointer',
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        marginBottom: spacing.sm,
    },
    errorText: {
        fontSize: 12,
        color: colors.red[600],
        overflow: 'auto',
        maxHeight: 200,
    },
    button: {
        backgroundColor: colors.primary,
        color: colors.light,
        padding: '12px 24px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        marginRight: spacing.sm,
    },
    linkButton: {
        backgroundColor: 'transparent',
        color: colors.primary,
        padding: '12px 24px',
        borderRadius: 8,
        border: `2px solid ${colors.primary}`,
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 600 as React.CSSProperties['fontWeight'],
    },
};
