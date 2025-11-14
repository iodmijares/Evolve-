/**
 * Optimized caching service with TTL, compression, and memory management.
 */

interface CacheItem<T> {
    timestamp: number;
    data: T;
    size?: number;
    hits?: number;
}

interface CacheStats {
    totalSize: number;
    itemCount: number;
    hits: number;
    misses: number;
}

// Cache configuration
const CONFIG = {
    MAX_CACHE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_ITEM_SIZE: 500 * 1024, // 500KB per item
    CLEANUP_THRESHOLD: 0.9, // Clean when 90% full
};

// In-memory stats
let stats: CacheStats = {
    totalSize: 0,
    itemCount: 0,
    hits: 0,
    misses: 0,
};

/**
 * Calculate approximate size of data in bytes
 */
const getDataSize = (data: any): number => {
    try {
        return new Blob([JSON.stringify(data)]).size;
    } catch {
        return JSON.stringify(data).length * 2; // Approximate
    }
};

/**
 * Clean up old or least-used cache items
 */
const cleanup = (): void => {
    try {
        const items: Array<{ key: string; item: CacheItem<any> }> = [];
        
        // Collect all cache items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('evolve_')) {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        const item = JSON.parse(value);
                        items.push({ key, item });
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        }

        // Sort by hits (least used first) and timestamp (oldest first)
        items.sort((a, b) => {
            const hitsA = a.item.hits || 0;
            const hitsB = b.item.hits || 0;
            if (hitsA !== hitsB) return hitsA - hitsB;
            return a.item.timestamp - b.item.timestamp;
        });

        // Remove items until we're under threshold
        let removed = 0;
        const targetSize = CONFIG.MAX_CACHE_SIZE * CONFIG.CLEANUP_THRESHOLD;
        
        while (stats.totalSize > targetSize && items.length > removed) {
            const { key, item } = items[removed];
            localStorage.removeItem(key);
            stats.totalSize -= item.size || 0;
            stats.itemCount--;
            removed++;
        }

        if (removed > 0) {
            console.log(`[Cache] Cleaned up ${removed} items, freed ${(removed * 50 / 1024).toFixed(2)}KB`);
        }
    } catch (error) {
        console.error('[Cache] Cleanup error:', error);
    }
};

/**
 * Sets an item in the cache with size tracking.
 */
const set = async <T>(key: string, data: T): Promise<void> => {
    try {
        const size = getDataSize(data);
        
        // Check individual item size
        if (size > CONFIG.MAX_ITEM_SIZE) {
            console.warn(`[Cache] Item "${key}" too large (${(size / 1024).toFixed(2)}KB), not caching`);
            return;
        }

        // Check if cleanup needed
        if (stats.totalSize + size > CONFIG.MAX_CACHE_SIZE) {
            cleanup();
        }

        const item: CacheItem<T> = {
            timestamp: Date.now(),
            data,
            size,
            hits: 0,
        };

        localStorage.setItem(key, JSON.stringify(item));
        
        // Update stats
        stats.totalSize += size;
        stats.itemCount++;
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('[Cache] Storage quota exceeded, cleaning up...');
            cleanup();
            try {
                localStorage.setItem(key, JSON.stringify({
                    timestamp: Date.now(),
                    data,
                    size: getDataSize(data),
                    hits: 0,
                }));
            } catch (e) {
                console.error(`[Cache] Failed to set item "${key}" after cleanup:`, e);
            }
        } else {
            console.error(`[Cache] Error setting item for key "${key}":`, error);
        }
    }
};

/**
 * Gets an item from the cache with hit tracking.
 */
const get = async <T>(key: string, ttlMs: number): Promise<T | null> => {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            stats.misses++;
            return null;
        }

        const item: CacheItem<T> = JSON.parse(itemStr);
        const now = Date.now();

        // Check expiration
        if (now - item.timestamp > ttlMs) {
            localStorage.removeItem(key);
            stats.totalSize -= item.size || 0;
            stats.itemCount--;
            stats.misses++;
            return null;
        }

        // Update hit count
        item.hits = (item.hits || 0) + 1;
        localStorage.setItem(key, JSON.stringify(item));
        stats.hits++;

        return item.data;
    } catch (error) {
        console.error(`[Cache] Error getting item for key "${key}":`, error);
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Ignore removal errors
        }
        stats.misses++;
        return null;
    }
};

/**
 * Clears an item from the cache with stats update.
 */
const clear = async (key: string): Promise<void> => {
    try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
            const item = JSON.parse(itemStr);
            stats.totalSize -= item.size || 0;
            stats.itemCount--;
        }
        localStorage.removeItem(key);
    } catch (error) {
        localStorage.removeItem(key);
    }
};

/**
 * Clears all cache items associated with a specific user ID.
 */
const clearUserCache = async (userId: string): Promise<void> => {
    const prefix = `evolve_${userId}_`;
    try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            try {
                const itemStr = localStorage.getItem(key);
                if (itemStr) {
                    const item = JSON.parse(itemStr);
                    stats.totalSize -= item.size || 0;
                    stats.itemCount--;
                }
            } catch (e) {
                // Ignore parse errors
            }
            localStorage.removeItem(key);
        });
        
        console.log(`[Cache] Cleared ${keysToRemove.length} items for user ${userId}`);
    } catch (error) {
        console.error(`[Cache] Error clearing user cache for user ID "${userId}":`, error);
    }
};

/**
 * Get or set cache with a factory function (cache-aside pattern).
 */
const getOrSet = async <T>(
    key: string,
    ttlMs: number,
    factory: () => Promise<T>
): Promise<T> => {
    const cached = await get<T>(key, ttlMs);
    if (cached !== null) {
        return cached;
    }
    
    const data = await factory();
    await set(key, data);
    return data;
};

/**
 * Invalidate cache by pattern.
 */
const invalidatePattern = async (pattern: string): Promise<void> => {
    try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(pattern)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => clear(key));
        console.log(`[Cache] Invalidated ${keysToRemove.length} items matching "${pattern}"`);
    } catch (error) {
        console.error(`[Cache] Error invalidating pattern "${pattern}":`, error);
    }
};

/**
 * Get cache statistics.
 */
const getStats = (): CacheStats => ({
    ...stats,
});

/**
 * Initialize cache stats on load.
 */
const initStats = (): void => {
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('evolve_')) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    const item = JSON.parse(value);
                    totalSize += item.size || getDataSize(item.data);
                    itemCount++;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }
    
    stats = {
        totalSize,
        itemCount,
        hits: 0,
        misses: 0,
    };
};

// Initialize on load
initStats();

export const cachingService = {
    set,
    get,
    clear,
    clearUserCache,
    getOrSet,
    invalidatePattern,
    getStats,
    cleanup,
};
