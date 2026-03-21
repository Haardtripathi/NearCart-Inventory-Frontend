import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js')
    })
  } else {
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      if (!registrations.length) {
        sessionStorage.removeItem('nearcart-sw-dev-reset')
        return
      }

      await Promise.all(registrations.map((registration) => registration.unregister()))

      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(cacheKeys.filter((key) => key.startsWith('nearcart-shell')).map((key) => caches.delete(key)))
      }

      const resetKey = 'nearcart-sw-dev-reset'

      if (navigator.serviceWorker.controller && !sessionStorage.getItem(resetKey)) {
        sessionStorage.setItem(resetKey, '1')
        window.location.reload()
        return
      }

      sessionStorage.removeItem(resetKey)
    })
  }
}
