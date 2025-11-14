/**
 * Performance monitoring utilities for production
 */
import React from 'react';

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private enabled: boolean = import.meta.env.PROD;

  /**
   * Start timing an operation
   */
  start(metricName: string): void {
    if (!this.enabled) return;
    this.metrics.set(metricName, performance.now());
  }

  /**
   * End timing and log the duration
   */
  end(metricName: string): number | null {
    if (!this.enabled) return null;
    
    const startTime = this.metrics.get(metricName);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.metrics.delete(metricName);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${metricName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure React component render time
   */
  measureRender(componentName: string, callback: () => void): void {
    if (!this.enabled) {
      callback();
      return;
    }

    this.start(`render_${componentName}`);
    callback();
    this.end(`render_${componentName}`);
  }

  /**
   * Report Web Vitals for production monitoring
   */
  reportWebVitals(metric: any): void {
    if (!this.enabled) return;

    const { name, value } = metric;
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`📊 ${name}:`, value.toFixed(2), 'ms');
    }

    // In production, send to analytics
    // TODO: Send to analytics service (Google Analytics, Plausible, etc.)
    // gtag('event', name, { value, metric_id: id });
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): string {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const total = (memory.totalJSHeapSize / 1048576).toFixed(2);
      return `${used} MB / ${total} MB`;
    }
    return 'N/A';
  }

  /**
   * Monitor bundle loading time
   */
  logResourceTiming(): void {
    if (!this.enabled) return;

    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter((r) => r.name.includes('.js'));
    
    const totalLoadTime = scripts.reduce((sum, r: any) => sum + r.duration, 0);
    
    if (totalLoadTime > 3000) {
      console.warn(`⚠️ Slow bundle loading: ${(totalLoadTime / 1000).toFixed(2)}s`);
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * HOC to measure component render time
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  return (props: P) => {
    React.useEffect(() => {
      perfMonitor.logResourceTiming();
    }, []);

    perfMonitor.measureRender(name, () => {});
    return React.createElement(Component, props);
  };
}
