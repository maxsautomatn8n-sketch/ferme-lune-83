"use strict";
// Service worker minimal : garde la page en mémoire pour qu'elle s'ouvre même sans réseau.
// Il ne touche jamais aux appels vers n8n (autre domaine) : le jeton et les conversations ne sont pas mis en cache.
const V = "papi-v1";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest", "icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(FICHIERS.map(f => c.add(f)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  // Réseau d'abord (pour recevoir les mises à jour), mémoire en secours
  e.respondWith(
    fetch(r).then(res => { if (res.ok) { const copie = res.clone(); caches.open(V).then(c => c.put(r, copie)); } return res; })
      .catch(() => caches.match(r).then(x => x || caches.match("index.html")))
  );
});
