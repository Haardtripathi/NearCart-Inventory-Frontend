const CACHE_NAME = 'nearcart-shell-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/pwa-icon.svg', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/index.html')
        return cached || caches.match('/offline.html')
      }),
    )
    return
  }

  const url = new URL(request.url)
  const isSameOrigin = url.origin === self.location.origin

  if (!isSameOrigin) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkRequest = fetch(request)
        .then((response) => {
          const clonedResponse = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse))
          return response
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkRequest
    }),
  )
})
