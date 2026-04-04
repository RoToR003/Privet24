const CACHE_NAME = 'prvt_cachev52_ticket_data_values_size';
const urlsToCache = [
    './',
    './transport.html',
    './index.html',
    './payment.html',
    './qr.html',
    './settings.html',
    './index.js?v=52',
    './core-sans.css?v=37',
    './fonts/core-sans-c/coresansc-400.otf?v=4',
    './fonts/core-sans-c/coresansc-500.otf?v=4',
    './fonts/core-sans-c/coresansc-700.otf?v=4',
    './fonts/core-sans-c/coresansc-900.otf?v=4',
    './manifest.json',
    './icons/icon-120.png',
    './icons/icon-152.png',
    './icons/icon-167.png',
    './icons/icon-180.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/images/logo-main.jpg',
    './assets/images/ticket-visual.jpg',
    './assets/images/ticket-visual-bus.jpg',
    './assets/images/archive-icon.jpg',
    './assets/images/visa-card.jpg',
    './assets/images/visa-logo.jpg',
    './assets/images/transport-tickets.jpg',
    './assets/images/transport-train.jpg',
    './assets/images/transport-plane.jpg',
    './assets/images/transport-bus.jpg',
    './assets/images/transport-city.jpg',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

// Встановлення Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кешування файлів...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Активувати новий SW негайно
    );
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Видалення старого кешу:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Контролювати всі клієнти негайно
    );
});

// Стратегія для fetch запитів - Network First, потім Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ігноруємо запити не по HTTP/HTTPS (наприклад chrome-extension)
    if (!request.url.startsWith('http')) return;

    // Для навігаційних запитів (HTML сторінки)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // ВИПРАВЛЕНО: Відносний шлях до головної сторінки
                        return caches.match('./transport.html');
                    });
                })
        );
        return;
    }
    
    // Для всіх інших запитів - Cache First, потім Network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response.clone());
                            });
                        }
                    }).catch(() => {}); // Ігноруємо помилки фонового оновлення
                    return cachedResponse;
                }
                
                return fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                });
            })
    );
});
