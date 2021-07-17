const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/db.js',
    '/index.js',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    // Pre cache all file from FILES_TO_CACHE
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    // Pre cache images
    event.waitUntil(
        caches
            .open(DATA_CACHE_NAME)
            .then((cache) => cache.add("/api/transaction"))
    );
    
    // This activates the caching immediately
    self.skipWaiting();
});

// Activates the caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then(keyList => {
                return Promise.all(keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key);
                    }
                }))
            })
        );
    self.clients.claim();
});

// Fetch origin
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                })
                .catch (error => {
                    return cache.match(event.request);
                });
            }).catch (error => console.log(error))
        );
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch (event.request);
            });
        })
    )
});