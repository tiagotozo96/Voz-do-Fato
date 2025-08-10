<<<<<<< HEAD
// SERVICE WORKER - sw.js
// Para melhor performance e funcionamento offline

const CACHE_NAME = 'voz-do-fato-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://raw.githubusercontent.com/tiagotozo96/Voz-do-Fato/master/imagens/voz-do-fato.png'
];

// Instalar service worker e fazer cache dos recursos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar requisições e servir do cache quando possível
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna do cache se encontrado
                if (response) {
                    return response;
                }
                
                // Senão, faz a requisição normalmente
                return fetch(event.request).then((response) => {
                    // Verifica se a resposta é válida
                    // E adiciona a verificação para o esquema da URL
                    const url = new URL(event.request.url);
                    if (!response || response.status !== 200 || response.type !== 'basic' || url.protocol.startsWith('chrome-extension')) {
                        return response;
                    }
                    
                    // Clona a resposta
                    const responseToCache = response.clone();
                    
                    // Adiciona ao cache
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Em caso de erro, por exemplo, se o request for de uma extensão
                // ou a requisição for para um recurso que não pode ser colocado no cache,
                // apenas retorne a resposta original.
                return fetch(event.request);
            })
    );
});

// Limpar caches antigos quando o service worker é atualizado
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
=======
// SERVICE WORKER - sw.js
// Para melhor performance e funcionamento offline

const CACHE_NAME = 'voz-do-fato-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://raw.githubusercontent.com/tiagotozo96/Voz-do-Fato/master/imagens/voz-do-fato.png'
];

// Instalar service worker e fazer cache dos recursos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar requisições e servir do cache quando possível
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna do cache se encontrado
                if (response) {
                    return response;
                }
                
                // Senão, faz a requisição normalmente
                return fetch(event.request).then((response) => {
                    // Verifica se a resposta é válida
                    // E adiciona a verificação para o esquema da URL
                    const url = new URL(event.request.url);
                    if (!response || response.status !== 200 || response.type !== 'basic' || url.protocol.startsWith('chrome-extension')) {
                        return response;
                    }
                    
                    // Clona a resposta
                    const responseToCache = response.clone();
                    
                    // Adiciona ao cache
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Em caso de erro, por exemplo, se o request for de uma extensão
                // ou a requisição for para um recurso que não pode ser colocado no cache,
                // apenas retorne a resposta original.
                return fetch(event.request);
            })
    );
});

// Limpar caches antigos quando o service worker é atualizado
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
>>>>>>> aa889152a776c7b77c07f5e314c9e2fb665918a7
});