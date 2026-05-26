const CACHE_NAME = "slot-guide-pwa-v1-4-gas-sync";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./config.js",
  "./config.json",
  "./manifest.webmanifest",
  "./assets/logo-placeholder.svg",
  "./assets/banner-placeholder.svg",
  "./assets/video-poster-placeholder.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/preview-share.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      if(event.request.method === "GET"){
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
      }
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
