/**
 * Rate limiter for client-side API calls
 * Prevents abuse and manages quota for AI services
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyPrefix: string;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * Check if a request is allowed and update the count
     */
    async checkLimit(identifier: string): Promise<RateLimitResult> {
        const key = `${this.config.keyPrefix}_${identifier}`;
        const now = Date.now();
        
        // Get existing data from localStorage
        const stored = localStorage.getItem(key);
        let data: { count: number; resetTime: number } | null = null;
        
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                // Invalid data, reset
                data = null;
            }
        }
        
        // Check if window has expired
        if (!data || now > data.resetTime) {
            data = {
                count: 1,
                resetTime: now + this.config.windowMs,
            };
            localStorage.setItem(key, JSON.stringify(data));
            
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime: data.resetTime,
            };
        }
        
        // Check if limit exceeded
        if (data.count >= this.config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: data.resetTime,
            };
        }
        
        // Increment count
        data.count++;
        localStorage.setItem(key, JSON.stringify(data));
        
        return {
            allowed: true,
            remaining: this.config.maxRequests - data.count,
            resetTime: data.resetTime,
        };
    }

    /**
     * Get current rate limit status without incrementing
     */
    async getStatus(identifier: string): Promise<RateLimitResult> {
        const key = `${this.config.keyPrefix}_${identifier}`;
        const now = Date.now();
        
        const stored = localStorage.getItem(key);
        if (!stored) {
            return {
                allowed: true,
                remaining: this.config.maxRequests,
                resetTime: now + this.config.windowMs,
            };
        }
        
        try {
            const data = JSON.parse(stored);
            
            if (now > data.resetTime) {
                return {
                    allowed: true,
                    remaining: this.config.maxRequests,
                    resetTime: now + this.config.windowMs,
                };
            }
            
            return {
                allowed: data.count < this.config.maxRequests,
                remaining: Math.max(0, this.config.maxRequests - data.count),
                resetTime: data.resetTime,
            };
        } catch (e) {
            return {
                allowed: true,
                remaining: this.config.maxRequests,
                resetTime: now + this.config.windowMs,
            };
        }
    }

    /**
     * Reset rate limit for an identifier
     */
    async reset(identifier: string): Promise<void> {
        const key = `${this.config.keyPrefix}_${identifier}`;
        localStorage.removeItem(key);
    }
}

// Pre-configured rate limiters for different services

// AI Text Generation: 20 requests per 5 minutes per user
export const aiTextLimiter = new RateLimiter({
    maxRequests: 20,
    windowMs: 5 * 60 * 1000,
    keyPrefix: 'ai_text_limit',
});

// AI Vision/Image: 10 requests per 5 minutes per user (more expensive)
export const aiVisionLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    keyPrefix: 'ai_vision_limit',
});

// Meal logging: 50 requests per 1 minute per user
export const mealLogLimiter = new RateLimiter({
    maxRequests: 50,
    windowMs: 1 * 60 * 1000,
    keyPrefix: 'meal_log_limit',
});

// Workout logging: 30 requests per 1 minute per user
export const workoutLogLimiter = new RateLimiter({
    maxRequests: 30,
    windowMs: 1 * 60 * 1000,
    keyPrefix: 'workout_log_limit',
});

/**
 * Helper function to format time until reset
 */
export const formatResetTime = (resetTime: number): string => {
    const seconds = Math.ceil((resetTime - Date.now()) / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};
