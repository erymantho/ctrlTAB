const CACHE_VERSION = 'ctrltab-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icons/favicon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_VERSION)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: network-only for API (user-specific data), cache-first for static assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Never cache login page or login.js
    if (url.pathname === '/login.html' || url.pathname === '/login.js') {
        event.respondWith(fetch(event.request));
        return;
    }

    if (url.pathname.startsWith('/api/')) {
        // Network-only for API calls (contains user-specific data)
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(
                    JSON.stringify({ error: 'You are offline' }),
                    { status: 503, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );
    } else {
        // Cache-first for static assets
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request))
        );
    }
});
