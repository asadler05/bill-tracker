const SW_VERSION = "v1.0.2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Notify clients when a new version is fetched
async function notifyClientsAboutUpdate() {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({
      type: "NEW_VERSION_AVAILABLE",
      version: SW_VERSION
    });
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const isAppShell =
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith("app.js") ||
    url.pathname.endsWith("styles.css");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          notifyClientsAboutUpdate();
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

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
