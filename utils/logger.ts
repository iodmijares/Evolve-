/**
 * Production Logger - Conditional logging based on environment
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string;
  data?: any;
}

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  private formatMessage(_level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${context} ${message}`;
  }

  log(message: string, options?: LogOptions): void {
    if (this.enabled) {
      console.log(this.formatMessage('log', message, options), options?.data || '');
    }
  }

  info(message: string, options?: LogOptions): void {
    if (this.enabled) {
      console.info(this.formatMessage('info', message, options), options?.data || '');
    }
  }

  warn(message: string, options?: LogOptions): void {
    // Warnings always shown, even in production
    console.warn(this.formatMessage('warn', message, options), options?.data || '');
  }

  error(message: string, error?: any, options?: LogOptions): void {
    // Errors always shown
    console.error(this.formatMessage('error', message, options), error || '', options?.data || '');
    
    // In production, could send to error tracking service
    if (isProduction && typeof window !== 'undefined') {
      // TODO: Send to error tracking service (e.g., Sentry)
      // this.sendToErrorTracking(message, error, options);
    }
  }

  debug(message: string, options?: LogOptions): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message, options), options?.data || '');
    }
  }

  group(label: string, callback: () => void): void {
    if (this.enabled) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  table(data: any[]): void {
    if (this.enabled) {
      console.table(data);
    }
  }

  time(label: string): void {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();
