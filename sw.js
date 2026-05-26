const CACHE_NAME = "dukun138-guide-pwa-v1-5-2";
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
  "./assets/preview-share.png",
  "./assets/video-poster-placeholder.svg",
  "./assets/tutorial-daftar-placeholder.svg",
  "./assets/tutorial-deposit-placeholder.svg",
  "./assets/tutorial-transfer-placeholder.svg",
  "./assets/tutorial-withdraw-placeholder.svg",
  "./assets/tutorial-promo-placeholder.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;
  event.respondWith(
    fetch(req).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(()=>{});
      return response;
    }).catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
  );
});
