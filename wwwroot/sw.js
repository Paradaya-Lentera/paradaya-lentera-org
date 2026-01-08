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
  "/lib/jquery/dist/jquery.min.js",
  "/lib/bootstrap/dist/js/bootstrap.bundle.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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

  if (event.request.method !== "GET") return;

  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.origin !== self.location.origin
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
            });
          })
        );
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) return response;

          if (event.request.mode === "navigate") {
            return caches.match("/Page/ReadingList");
          }
        });
      })
  );
});
