// ------------------------------
// VERSION — bump this on each deploy
// ------------------------------
const SW_VERSION = "v1.0.7";

// ------------------------------
// Notify clients that a new SW is installed
// ------------------------------
async function notifyClientsAboutUpdate() {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({
      type: "NEW_VERSION_AVAILABLE",
      version: SW_VERSION
    });
  }
}

// ------------------------------
// INSTALL — new SW takes over immediately
// ------------------------------
self.addEventListener("install", (event) => {
  self.skipWaiting();
  notifyClientsAboutUpdate(); // <-- only fires once per new SW
});

// ------------------------------
// ACTIVATE — claim all pages
// ------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ------------------------------
// FETCH — network-first for app shell
// ------------------------------
self.addEventListener("fetch", (event) => {
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
    caches.open("static-cache").then(async (cache) => {
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
