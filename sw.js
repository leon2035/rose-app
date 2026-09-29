const CACHE_NAME = 'rose-tracker-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './vendor/vue.global.prod.js',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];
// 价格、余额接口：始终走网络，不缓存
const API_HOSTS = ['api.binance.com', 'nexus.oasis.io'];
// 字体：首次加载后长期缓存
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// 安装：缓存静态资源，并立即接管
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (API_HOSTS.includes(url.hostname)) return;

    // 页面：网络优先，拿到新版本就更新缓存；离线时回退到缓存
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // 静态资源与字体：缓存优先，未命中时走网络并写入缓存
    if (url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request).then((response) => {
                if (response.ok || response.type === 'opaque') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            }))
        );
    }
});
