const CACHE_NAME = "lentera-offline-v4";
const STATIC_ASSETS = [
  "/",
  "/Page/ReadingList",

  // CSS
  "/css/site.css",
  "/css/pages/reading-list.css",
  "/css/reading-list-extra.css",
  "/css/pages/lentera.css",
  "/css/read.css",
  "/css/fontawesome-fallback.css",

  // JS Core
  "/js/core/db.js",
  "/js/core/alert.js",
  "/js/core/image.js",

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
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
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
  if (event.data && event.data.type === 'CLEAR_READING_LIST_CACHE') {
    // Clear reading list related caches
    caches.open(CACHE_NAME).then(cache => {
      cache.delete('/Page/ReadingList');
      cache.delete('/Page/GetReadingListData');
      // Also clear any requests with query parameters
      cache.keys().then(keys => {
        keys.forEach(request => {
          if (request.url.includes('/Page/ReadingList') || 
              request.url.includes('/Page/GetReadingListData')) {
            cache.delete(request);
          }
        });
      });
      console.log('Reading list cache cleared by service worker');
    });
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip caching for reading list API endpoints to ensure fresh data
  if (url.pathname === '/Page/GetReadingListData' || 
      url.pathname === '/Page/ReadingList') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only fallback to cache if network fails
          return caches.match(event.request, { ignoreSearch: true });
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
            if (networkResponse && networkResponse.status === 200) {
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

  // Strategy 2: Network First for Pages (HTML)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache successful basic responses (200 OK)
        // But skip caching for reading list page to ensure fresh data
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          url.pathname !== '/Page/ReadingList'
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
