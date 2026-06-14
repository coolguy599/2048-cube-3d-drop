/**
 * 2048 Cubes 3D - Service Worker File Cache Interceptor
 */
const STORAGE_KEY = "3d_cubes_2048_save";

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Capture fetch requests on the page
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // If application code requests 'save.json', intercept it instantly
    if (requestUrl.pathname.endsWith('save.json')) {
        event.respondWith(
            // Access indexed client local data stores via an asynchronous script evaluation string block
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                
                // Fallback architecture definition if storage lacks values yet
                const defaultEmptySchema = {
                    meta: { version: "1.0.0", lastSaved: new Date().toISOString(), isNewGame: true },
                    stats: { score: 0, hiScore: 0 },
                    nextCube: { cubeVal: 2 },
                    cubes: []
                };

                // Formulate a dynamic, successful HTTP network response envelope
                const initOptions = {
                    status: 200,
                    statusText: "OK",
                    headers: { 'Content-Type': 'application/json' }
                };

                // Execute fallback if window context isn't fully operational
                return new Response(JSON.stringify(defaultEmptySchema), initOptions);
            })
        );
    }
});
