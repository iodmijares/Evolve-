
import React, { useState, useEffect } from 'react';
import AchievementFeedItem from './AchievementFeedItem';
import { supabase } from '../../services/supabaseClient';
import staticAchievements from '../../utils/achievements';
import { Achievement } from '../../types';
import { Spinner } from '../shared/Spinner';
import { Icon } from '../shared/Icon';
import { cachingService } from '../../utils/cachingService';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';

interface FeedItem {
    id: string;
    userName: string;
    profilePictureUrl?: string;
    gender?: string;
    achievement: Achievement;
    timestamp: Date | string; // Allow string for cache rehydration
}

const CACHE_KEY = 'community_feed';

const AchievementFeed: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);
    
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [pageSize] = useState(10);

    useEffect(() => {
        const fetchFeed = async () => {
            setError(null);

            const cachedFeed = await cachingService.get<FeedItem[]>(CACHE_KEY, 15 * 60 * 1000); // 15 min TTL
            if (cachedFeed) {
                setFeedItems(cachedFeed);
                setIsLoading(false);
                setHasMore(cachedFeed.length >= pageSize);
            } else {
                setIsLoading(true);
            }

            const { data, error } = await supabase
                .from('earned_achievements')
                .select('id, earned_at, achievement_id, profiles (name, profile_picture_url, gender)')
                .order('earned_at', { ascending: false })
                .limit(pageSize);

            if (error) {
                console.error("Error fetching achievement feed:", error.message, error.details);
                if (!cachedFeed) setError("Could not load community feed."); // Only show error if no cache
                return;
            }
            
            if (data) {
                const achievementMap = new Map(staticAchievements.map(a => [a.id, a]));
                const formattedFeed: FeedItem[] = data
                    .map((item: any): FeedItem | null => {
                        const achievement = achievementMap.get(item.achievement_id);
                        if (!achievement || !item.profiles) return null;
                        return {
                            id: item.id,
                            userName: item.profiles.name,
                            profilePictureUrl: item.profiles.profile_picture_url ?? undefined,
                            gender: item.profiles.gender ?? undefined,
                            achievement,
                            timestamp: new Date(item.earned_at),
                        };
                    })
                    .filter((item): item is FeedItem => item !== null);

                setFeedItems(formattedFeed);
                setHasMore(formattedFeed.length >= pageSize);
                cachingService.set(CACHE_KEY, formattedFeed); // Update cache
            }
            setIsLoading(false);
        };

        fetchFeed();
    }, [pageSize]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        setError(null);

        const { data, error } = await supabase
            .from('earned_achievements')
            .select('id, earned_at, achievement_id, profiles (name, profile_picture_url)')
            .order('earned_at', { ascending: false })
            .range(feedItems.length, feedItems.length + pageSize - 1);

        if (error) {
            console.error("Error loading more achievements:", error.message, error.details);
            setError("Could not load more activities.");
            setIsLoadingMore(false);
            return;
        }

        if (data) {
            const achievementMap = new Map(staticAchievements.map(a => [a.id, a]));
            const formattedFeed: FeedItem[] = data
                .map((item: any): FeedItem | null => {
                    const achievement = achievementMap.get(item.achievement_id);
                    if (!achievement || !item.profiles) return null;
                    return {
                        id: item.id,
                        userName: item.profiles.name,
                        profilePictureUrl: item.profiles.profile_picture_url ?? undefined,
                        achievement,
                        timestamp: new Date(item.earned_at),
                    };
                })
                .filter((item): item is FeedItem => item !== null);

            setFeedItems(prev => [...prev, ...formattedFeed]);
            setHasMore(formattedFeed.length >= pageSize);
        }
        setIsLoadingMore(false);
    };

    if (isLoading) {
        return <div style={styles.stateContainer}><Spinner /></div>;
    }

    if (error) {
        return <p style={styles.errorText}>{error}</p>;
    }

    if (feedItems.length === 0) {
        return (
            <div style={styles.emptyState}>
                <Icon name="users" size={24} color={isDark ? colors.gray[400] : colors.muted} />
                <p style={styles.emptyText}>No recent community activity. Be the first to earn an achievement!</p>
            </div>
        );
    }
    
    return (
        <div style={styles.container}>
            {feedItems.map((item) => (
                <AchievementFeedItem
                    key={item.id}
                    userName={item.userName}
                    profilePictureUrl={item.profilePictureUrl}
                    gender={item.gender}
                    achievement={item.achievement}
                    timestamp={new Date(item.timestamp)} // Ensure timestamp is a Date object
                />
            ))}
            {hasMore && !isLoading && (
                <button 
                    onClick={loadMore} 
                    disabled={isLoadingMore}
                    style={styles.loadMoreButton}
                >
                    {isLoadingMore ? (
                        <Spinner size="sm" />
                    ) : (
                        <>
                            <Icon name="refresh" size={18} color={colors.primary} />
                            <span style={styles.loadMoreText}>Load More</span>
                        </>
                    )}
                </button>
            )}
            {!hasMore && feedItems.length > 0 && (
                <p style={styles.endText}>You've reached the end! 🎉</p>
            )}
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    stateContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px',
    },
    errorText: {
        textAlign: 'center',
        color: colors.red[400],
        fontSize: '14px',
        fontWeight: '600',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '32px',
        background: isDark 
            ? 'rgba(55, 65, 81, 0.5)'
            : 'rgba(241, 245, 249, 0.8)',
        borderRadius: '12px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
    },
    emptyText: {
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center',
        color: isDark ? colors.gray[400] : colors.slate[600],
        margin: 0,
        lineHeight: '1.5',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    loadMoreButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        marginTop: '8px',
        backgroundColor: isDark ? colors.gray[800] : colors.light,
        border: `2px solid ${isDark ? colors.gray[700] : colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
    },
    loadMoreText: {
        fontSize: '14px',
        fontWeight: '600',
        color: colors.primary,
    },
    endText: {
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        color: isDark ? colors.gray[400] : colors.slate[500],
        margin: '12px 0 0 0',
        padding: '8px',
    }
});

export default AchievementFeed;
