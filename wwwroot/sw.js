const CACHE_NAME = "lentera-offline-v1";
const STATIC_ASSETS = [
  "/",
  "/css/site.css",
  "/css/reading-list.css",
  "/css/reading-list-extra.css",
  "/css/bookfinder.css",
  "/css/read.css",
  "/js/site.js",
  "/js/reading-list.js",
  "/js/navbar.js",
  "/js/image-utils.js",
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

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
