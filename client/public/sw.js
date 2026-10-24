/* Static app shell support only. API, private media, and account data never enter a cache. */
const SHELL_CACHE = "nebula-shell-v1";
const ASSET_CACHE = "nebula-assets-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open(SHELL_CACHE).then((cache) => cache.add("/")),
    self.skipWaiting()
  ]));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("nebula-") && ![SHELL_CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
          const shell = await caches.open(SHELL_CACHE);
          await shell.put("/", response.clone());
        }
        return response;
      } catch {
        const shell = await caches.open(SHELL_CACHE);
        return (await shell.match("/")) || Response.error();
      }
    })());
    return;
  }

  // Vite's production assets are content-hashed. Cache only those immutable files.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    })());
  }
});
