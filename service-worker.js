const CACHE_NAME = 'med-hours-v1.1';
const ASSETS_TO_CACHE = [
  '/Med-Hours/',
  '/Med-Hours/index.html',
  '/Med-Hours/style.css',
  '/Med-Hours/script.js',
  '/Med-Hours/manifest.json',
  '/Med-Hours/icons/icon-72x72.png',
  '/Med-Hours/icons/icon-96x96.png',
  '/Med-Hours/icons/icon-128x128.png',
  '/Med-Hours/icons/icon-144x144.png',
  '/Med-Hours/icons/icon-152x152.png',
  '/Med-Hours/icons/icon-192x192.png',
  '/Med-Hours/icons/icon-384x384.png',
  '/Med-Hours/icons/icon-512x512.png',
  '/Med-Hours/icons/maskable-icon-192x192.png',
  '/Med-Hours/icons/maskable-icon-512x512.png',
  '/Med-Hours/sounds/notification.mp3'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Network First مع Fallback للـ Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تحديث الكاش بالنسخة الجديدة
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // الرجوع للكاش عند عدم توفر الإنترنت
        return caches.match(event.request);
      })
  );
});

// معالجة الإشعارات
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'حان موعد الجرعة',
    icon: '/Med-Hours/icons/icon-192x192.png',
    badge: '/Med-Hours/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'med-reminder',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('Med Hours', options)
  );
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/Med-Hours/')
  );
});
