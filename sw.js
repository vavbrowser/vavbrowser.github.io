const CACHE = "chat-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Firebase SDK scripts: cache after first load so the app opens offline.
  if (u.hostname === "www.gstatic.com") {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      return hit || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; });
    }));
    return;
  }
  // Realtime data and auth go straight to the network.
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
