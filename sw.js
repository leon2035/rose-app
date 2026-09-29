const CACHE_NAME = 'rose-tracker-v2';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://unpkg.com/axios/dist/axios.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安装：缓存静态资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    // API 请求（价格、余额）直接走网络，不缓存，保证数据最新
    if (event.request.url.includes('api.binance.com') || 
        event.request.url.includes('nexus.oasis.io')) {
        return; 
    }

    // 静态资源：优先走缓存，没有再走网络
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});