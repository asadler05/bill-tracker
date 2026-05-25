// ------------------------------
// VERSION — bump this on each deploy
// ------------------------------
const SW_VERSION = "v1.0.11";

// ------------------------------
// INSTALL — activate immediately
// ------------------------------
self.addEventListener("install", event => {
  self.skipWaiting();
});

// ------------------------------
// ACTIVATE — take control of all pages
// ------------------------------
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// ------------------------------
// LISTEN FOR SKIP-WAITING MESSAGE
// ------------------------------
self.addEventListener("message", event => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// ------------------------------
// FETCH — network-first for app shell
// ------------------------------
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  const isAppShell =
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith("app.js") ||
    url.pathname.endsWith("styles.css");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.open("static-cache").then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        return cached;
      }
    })
  );
});
