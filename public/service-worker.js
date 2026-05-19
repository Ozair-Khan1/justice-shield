// No-op service worker — prevents 404 errors from browsers
// that auto-request a service worker for PWA manifests.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
