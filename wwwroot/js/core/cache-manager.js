/**
 * Cache Manager
 * Handles cache clearing and management across the application
 */

class CacheManager {
    static CACHE_NAMES = [
        'lentera-offline-v4',
        'lentera-offline-v3',
        'lentera-offline-v2',
        'lentera-offline-v1',
        'reading-list-cache'
    ];

    static READING_LIST_ENDPOINTS = [
        '/Page/ReadingList',
        '/Page/GetReadingListData'
    ];

    /**
     * Clear all reading list related caches
     */
    static async clearReadingListCache() {
        if (!('caches' in window)) {
            console.warn('Cache API not supported');
            return;
        }

        try {
            // Clear specific cache entries
            const cacheNames = await caches.keys();
            
            for (const cacheName of cacheNames) {
                if (this.CACHE_NAMES.includes(cacheName) || 
                    cacheName.includes('lentera') || 
                    cacheName.includes('reading')) {
                    
                    const cache = await caches.open(cacheName);
                    
                    // Delete specific endpoints
                    for (const endpoint of this.READING_LIST_ENDPOINTS) {
                        await cache.delete(endpoint);
                        // Also try with query parameters
                        const keys = await cache.keys();
                        for (const request of keys) {
                            if (request.url.includes(endpoint)) {
                                await cache.delete(request);
                            }
                        }
                    }
                }
            }

            console.log('Reading list cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear reading list cache:', error);
        }
    }

    /**
     * Force service worker to clear reading list cache
     */
    static async notifyServiceWorker() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_READING_LIST_CACHE'
                });
                console.log('Service worker notified to clear cache');
            } catch (error) {
                console.error('Failed to notify service worker:', error);
            }
        }
    }

    /**
     * Set flag for reading list refresh
     */
    static setReadingListRefreshFlag() {
        try {
            sessionStorage.setItem('readingListNeedsRefresh', 'true');
            localStorage.setItem('readingListLastUpdate', Date.now().toString());
        } catch (error) {
            console.error('Failed to set refresh flag:', error);
        }
    }

    /**
     * Check if reading list needs refresh
     */
    static needsReadingListRefresh() {
        try {
            return sessionStorage.getItem('readingListNeedsRefresh') === 'true';
        } catch (error) {
            console.error('Failed to check refresh flag:', error);
            return false;
        }
    }

    /**
     * Clear reading list refresh flag
     */
    static clearReadingListRefreshFlag() {
        try {
            sessionStorage.removeItem('readingListNeedsRefresh');
        } catch (error) {
            console.error('Failed to clear refresh flag:', error);
        }
    }

    /**
     * Complete cache clearing process for reading list
     */
    static async handleReadingListUpdate() {
        await this.clearReadingListCache();
        await this.notifyServiceWorker();
        this.setReadingListRefreshFlag();
    }
}

// Make it globally available
window.CacheManager = CacheManager;