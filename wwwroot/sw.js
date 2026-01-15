const CACHE_NAME = "lentera-offline-v9"; // Increment version to force update
const STATIC_ASSETS = [
  // PWA & Core
  "/manifest.json",
  "/images/pwa-icon-512.png",

  // CSS
  "/css/fontawesome-fallback.css",
  "/css/pages/reading-list.css",
  "/css/pages/lentera.css",
  "/css/pages/read.css",
  "/css/site.css",

  // JS Core
  "/js/core/db.js",
  "/js/core/alert.js",
  "/js/core/image.js",
  "/js/core/cache-manager.js",
  "/js/core/bootstrap-notifications.js",

  // JS Components
  "/js/components/navbar.js",
  "/js/components/theme.js",
  "/js/components/dropdown.js",
  "/js/components/auth-modal.js",

  // JS Features
  "/js/features/reading-list.js",

  // JS Vendor
  "/js/vendor/fontawesome-fallback.js",

  // CDN
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css",

  // Local FontAwesome (for consistency)
  "/lib/fontawesome/css/all.min.css",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing new service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error("[SW] Failed to cache some assets:", err);
        // Continue even if some assets fail to cache
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Single fetch event handler
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests for external APIs (except CDN assets we explicitly cache)
  const isCachedCDN = STATIC_ASSETS.some((asset) => asset === request.url);
  if (url.origin !== location.origin && !isCachedCDN) return;

  // ===== STRATEGY 1: Reading List Page - Network First with Offline Fallback =====
  if (url.pathname === "/Page/ReadingList") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the successful response for offline use
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              console.log("[SW] Cached ReadingList page");
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to serve from cache
          console.log("[SW] Network failed for ReadingList, trying cache...");
          return caches
            .match(request, { ignoreSearch: true })
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log(
                  "[SW] Serving cached ReadingList page (offline mode)"
                );
                return cachedResponse;
              }

              // No cache available, return basic offline page
              console.log(
                "[SW] No cached ReadingList page, returning offline template"
              );
              return caches.match("/").then((homeResponse) => {
                // Try to serve home page as fallback if available
                if (homeResponse) return homeResponse;

                // Last resort: inline offline page
                return new Response(generateOfflineReadingListHTML(), {
                  status: 200,
                  statusText: "OK (Offline)",
                  headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-cache",
                  },
                });
              });
            });
        })
    );
    return;
  }

  // ===== STRATEGY 2: Reading List Data API - Network First with Cache Fallback =====
  if (url.pathname === "/Page/GetReadingListData") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Cache the fresh data for offline use
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              console.log("[SW] Cached reading list data");
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          console.log(
            "[SW] Network failed for reading list data, trying cache..."
          );
          return caches
            .match(request, { ignoreSearch: true })
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log("[SW] Serving cached reading list data (offline)");
                return cachedResponse;
              }

              // No cache, return empty data
              console.log("[SW] No cached data, returning empty result");
              return new Response(
                JSON.stringify({
                  success: true,
                  data: [],
                  offline: true,
                  message: "Offline mode - no cached data available",
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                  },
                }
              );
            });
        })
    );
    return;
  }

  // ===== STRATEGY 3: Static Assets - Cache First =====
  const isStaticAsset =
    url.pathname.match(
      /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webm|mp4|ico)$/
    ) ||
    url.pathname.includes("/lib/") ||
    STATIC_ASSETS.some(
      (asset) => url.pathname === new URL(asset, location.origin).pathname
    );

  if (isStaticAsset || isCachedCDN) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          // console.log("[SW] Serving static asset from cache:", url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (
              response &&
              (response.status === 200 || response.type === "opaque")
            ) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
                // console.log("[SW] Cached new static asset:", url.pathname);
              });
            }
            return response;
          })
          .catch((err) => {
            console.error(
              "[SW] Failed to fetch static asset:",
              url.pathname,
              err
            );
            // Return a placeholder or throw error
            throw err;
          });
      })
    );
    return;
  }

  // ===== STRATEGY 4: Other Pages - Network First with Cache Fallback =====
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
            console.log("[SW] Cached page:", url.pathname);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches
          .match(request, { ignoreSearch: true })
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log("[SW] Serving page from cache:", url.pathname);
              return cachedResponse;
            }

            // For navigation requests, try ReadingList or Home as fallback
            if (request.mode === "navigate") {
              return caches
                .match("/Page/ReadingList")
                .then((readingListResponse) => {
                  if (readingListResponse) return readingListResponse;
                  return caches.match("/");
                });
            }

            throw new Error("No cache available for: " + url.pathname);
          });
      })
  );
});

// Message handler for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_READING_LIST_CACHE") {
    // Clear reading list related caches when data is updated
    caches.open(CACHE_NAME).then((cache) => {
      cache.delete("/Page/GetReadingListData");
      cache.delete("/Page/ReadingList");
      // Also clear any requests with query parameters
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          if (
            request.url.includes("/Page/GetReadingListData") ||
            request.url.includes("/Page/ReadingList")
          ) {
            cache.delete(request);
          }
        });
      });
      console.log("[SW] Reading list cache cleared due to data update");
    });
  }

  if (event.data && event.data.type === "CLEAR_PAGE_CACHE") {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          const url = new URL(request.url);
          // Clear pages but keep static assets
          const isStatic =
            url.pathname.match(
              /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webm|mp4)$/
            ) || url.pathname.includes("/lib/");

          if (!isStatic) {
            cache.delete(request);
          }
        });
      });
      console.log("[SW] Page cache cleared for auth change");
    });
  }

  if (event.data && event.data.type === "FORCE_CACHE_UPDATE") {
    // Force update cache with fresh data
    const url = event.data.url;
    if (url) {
      fetch(url)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(url, response.clone());
              console.log("[SW] Cache updated with fresh data for:", url);
            });
          }
        })
        .catch((err) => {
          console.log("[SW] Failed to update cache:", err);
        });
    }
  }
});

// Helper function to generate offline reading list HTML
function generateOfflineReadingListHTML() {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daftar Bacaan Saya - Offline</title>
      <link rel="stylesheet" href="/css/pages/lentera.css">
      <link rel="stylesheet" href="/css/pages/reading-list.css">
      <link rel="stylesheet" href="/css/site.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css">
      <style>
        .offline-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .offline-content {
          text-align: center;
          max-width: 500px;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }
        .offline-title {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .offline-message {
          font-size: 1rem;
          opacity: 0.7;
          margin-bottom: 2rem;
        }
        .btn-retry {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-retry:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-content">
          <div class="offline-icon">
            <i class="bi bi-wifi-off"></i>
          </div>
          <h1 class="offline-title">Tidak Ada Koneksi Internet</h1>
          <p class="offline-message">
            Halaman daftar bacaan memerlukan koneksi internet untuk memuat data.
            Silakan periksa koneksi Anda dan coba lagi.
          </p>
          <button class="btn-retry" onclick="window.location.reload()">
            <i class="bi bi-arrow-clockwise"></i> Coba Lagi
          </button>
        </div>
      </div>
      
      <script>
        // Auto-reload when connection is restored
        window.addEventListener('online', () => {
          console.log('Connection restored, reloading...');
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
}
