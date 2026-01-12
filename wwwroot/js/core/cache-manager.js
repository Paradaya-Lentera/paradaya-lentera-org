/**
 * Cache Manager
 * Handles cache clearing and management across the application
 */

class CacheManager {
  static CACHE_NAMES = [
    "lentera-offline-v6",
    "lentera-offline-v5",
    "lentera-offline-v4",
    "lentera-offline-v3",
    "lentera-offline-v2",
    "lentera-offline-v1",
    "reading-list-cache",
  ];

  static READING_LIST_ENDPOINTS = ["/Page/GetReadingListData"];

  /**
   * Clear reading list cache only when online and there's an update
   */
  static async clearReadingListCache() {
    // Only clear cache if we're online - preserve offline access
    if (!navigator.onLine) {
      console.log("Offline mode: preserving reading list cache");
      return;
    }

    if (!("caches" in window)) {
      console.warn("Cache API not supported");
      return;
    }

    try {
      // Clear specific cache entries
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        if (
          this.CACHE_NAMES.includes(cacheName) ||
          cacheName.includes("lentera") ||
          cacheName.includes("reading")
        ) {
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

      console.log("Reading list cache cleared successfully (online mode)");
    } catch (error) {
      console.error("Failed to clear reading list cache:", error);
    }
  }

  /**
   * Force service worker to clear reading list cache (only when online)
   */
  static async notifyServiceWorker() {
    if (!navigator.onLine) {
      console.log("Offline mode: skipping service worker notification");
      return;
    }

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: "CLEAR_READING_LIST_CACHE",
        });
        console.log("Service worker notified to clear cache");
      } catch (error) {
        console.error("Failed to notify service worker:", error);
      }
    }
  }

  /**
   * Force update cache with fresh data (only when online)
   */
  static async forceUpdateCache(url) {
    if (!navigator.onLine) {
      console.log("Offline mode: cannot force cache update");
      return;
    }

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: "FORCE_CACHE_UPDATE",
          url: url,
        });
        console.log("Service worker requested to update cache for:", url);
      } catch (error) {
        console.error("Failed to request cache update:", error);
      }
    }
  }

  /**
   * Set flag for reading list refresh
   */
  static setReadingListRefreshFlag() {
    try {
      sessionStorage.setItem("readingListNeedsRefresh", "true");
      localStorage.setItem("readingListLastUpdate", Date.now().toString());
    } catch (error) {
      console.error("Failed to set refresh flag:", error);
    }
  }

  /**
   * Check if reading list needs refresh
   */
  static needsReadingListRefresh() {
    try {
      return sessionStorage.getItem("readingListNeedsRefresh") === "true";
    } catch (error) {
      console.error("Failed to check refresh flag:", error);
      return false;
    }
  }

  /**
   * Clear reading list refresh flag
   */
  static clearReadingListRefreshFlag() {
    try {
      sessionStorage.removeItem("readingListNeedsRefresh");
    } catch (error) {
      console.error("Failed to clear refresh flag:", error);
    }
  }

  /**
   * Complete cache management process for reading list updates
   */
  static async handleReadingListUpdate() {
    if (navigator.onLine) {
      // Online: Clear cache and force fresh data
      await this.clearReadingListCache();
      await this.notifyServiceWorker();
      this.setReadingListRefreshFlag();

      // Force update cache with fresh data after a short delay
      setTimeout(() => {
        this.forceUpdateCache("/Page/GetReadingListData");
      }, 100);
    } else {
      // Offline: Just set refresh flag for when we come back online
      this.setReadingListRefreshFlag();
      console.log("Offline mode: changes will sync when online");
    }
  }

  /**
   * Check if we're in offline mode
   */
  static isOffline() {
    return !navigator.onLine;
  }

  /**
   * Handle online/offline state changes
   */
  static setupOnlineOfflineHandlers() {
    window.addEventListener("online", () => {
      console.log("Back online: checking for pending updates");
      if (this.needsReadingListRefresh()) {
        // Refresh data when coming back online
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });

    window.addEventListener("offline", () => {
      console.log("Gone offline: preserving cache for offline access");
    });
  }
}

// Make it globally available
window.CacheManager = CacheManager;

// Setup online/offline handlers
if (typeof window !== "undefined") {
  CacheManager.setupOnlineOfflineHandlers();
}
