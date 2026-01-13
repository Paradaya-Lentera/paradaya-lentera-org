const CACHE_NAME = "lentera-offline-v7";
const STATIC_ASSETS = [
  // CSS
  "/css/fontawesome-fallback.css",
  "/css/pages/reading-list.css",
  "/css/pages/lentera.css",
  "/css/pages/read.css",

  // JS Core
  "/js/core/db.js",
  "/js/core/alert.js",
  "/js/core/image.js",
  "/js/core/cache-manager.js",

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
  
  // Local FontAwesome (for consistency)
  "/lib/fontawesome/css/all.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_READING_LIST_CACHE") {
    // Clear reading list related caches only when there's an update
    caches.open(CACHE_NAME).then((cache) => {
      cache.delete("/Page/GetReadingListData");
      // Also clear any requests with query parameters
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          if (request.url.includes("/Page/GetReadingListData")) {
            cache.delete(request);
          }
        });
      });
      console.log("Reading list cache cleared due to data update");
    });
  }

  if (event.data && event.data.type === "CLEAR_PAGE_CACHE") {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          const url = new URL(request.url);
          // Clear logical pages but keep static assets
          // We can check if it's a page by looking at the pathname
          const isStatic =
            url.pathname.match(
              /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webm|mp4)$/
            ) || url.pathname.includes("/lib/");

          if (!isStatic) {
            cache.delete(request);
          }
        });
      });
      console.log("Page cache cleared for auth change");
    });
  }

  if (event.data && event.data.type === "FORCE_CACHE_UPDATE") {
    // Force update cache with fresh data
    const url = event.data.url;
    if (url) {
      fetch(url)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            // Added opaque check for successful caching
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(url, response.clone());
              console.log("Cache updated with fresh data for:", url);
            });
          }
        })
        .catch((err) => {
          console.log("Failed to update cache:", err);
        });
    }
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Special handling for reading list endpoints - Network First with Cache Fallback
  if (
    url.pathname === "/" ||
    url.pathname === "/Page/GetReadingListData" ||
    url.pathname === "/Page/ReadingList"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If network succeeds, cache the fresh response
          if (
            networkResponse &&
            (networkResponse.status === 200 ||
              networkResponse.type === "opaque")
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails (offline), fallback to cache
          console.log("Network failed for reading list, using cache fallback");
          return caches
            .match(event.request, { ignoreSearch: true })
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log("Serving reading list from cache (offline mode)");
                return cachedResponse;
              }
              // If no cache available for GetReadingListData, return empty data
              if (url.pathname === "/Page/GetReadingListData") {
                return new Response(
                  JSON.stringify({
                    success: true,
                    data: [],
                    message: "Offline mode - no cached data available",
                  }),
                  {
                    headers: { "Content-Type": "application/json" },
                  }
                );
              }
              // If no cache available for ReadingList page, return a basic offline page
              if (url.pathname === "/Page/ReadingList") {
                return new Response(
                  `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Offline - Reading List</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="stylesheet" href="/css/site.css">
                    <link rel="stylesheet" href="/css/pages/reading-list.css">
                  </head>
                  <body class="offline-mode">
                    <div class="reading-list-container">
                      <div class="page-header">
                        <h1 class="page-title">Daftar Bacaan Saya</h1>
                        <p class="page-subtitle">Mode Offline - Data tidak tersedia</p>
                      </div>
                      <div class="offline-message text-center py-5">
                        <div class="offline-icon mb-3">
                          <i class="fas fa-wifi-slash fa-3x text-muted"></i>
                        </div>
                        <h3 class="text-muted">Tidak Ada Koneksi Internet</h3>
                        <p class="text-muted mb-4">
                          Reading list tidak tersedia saat offline.<br>
                          Silakan periksa koneksi internet Anda dan coba lagi.
                        </p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                          <i class="fas fa-refresh"></i> Coba Lagi
                        </button>
                      </div>
                    </div>
                    <script>
                      // Check for online status
                      window.addEventListener('online', () => {
                        window.location.reload();
                      });
                    </script>
                  </body>
                  </html>
                `,
                  {
                    headers: { "Content-Type": "text/html" },
                  }
                );
              }
              throw new Error("No cache available");
            });
        })
    );
    return;
  }

  // Strategy 1: Cache First for Static Assets & CDNs
  const isStaticAsset = STATIC_ASSETS.some(
    (asset) => url.pathname === asset || event.request.url === asset
  );

  if (isStaticAsset || url.origin !== self.location.origin) {
    event.respondWith(
      caches
        .match(event.request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(event.request).then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 ||
                networkResponse.type === "opaque")
            ) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }

  // Strategy 2: Network First for Other Pages (HTML)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try cache
        return caches
          .match(event.request, { ignoreSearch: true })
          .then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            // Fallback for navigation requests
            if (event.request.mode === "navigate") {
              // Try ReadingList first, then Home
              return caches
                .match("/Page/ReadingList")
                .then((res) => res || caches.match("/"));
            }
          });
      })
  );
});
