const CACHE_NAME = "lc3-cache-v2";
const API_CACHE_NAME = "lc3-api-cache-v1";
const OFFLINE_URL = "/offline.html";
const SYNC_QUEUE_KEY = "lc3-sync-queue";

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/manifest.json",
];

const CACHEABLE_API_PATHS = [
  "/api/public/donation-funds",
  "/api/public/sermons",
  "/api/public/events",
  "/api/public/team",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.method === "POST" && url.pathname.startsWith("/api/")) {
    event.respondWith(handlePostWithSync(request));
    return;
  }

  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    const isCacheableApi = CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p));
    if (isCacheableApi) {
      event.respondWith(networkFirstWithCache(request, API_CACHE_NAME));
    }
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
});

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const indexCached = await caches.match("/");
    if (indexCached) return indexCached;
    const offlineCached = await caches.match(OFFLINE_URL);
    return offlineCached || new Response("Offline", { status: 503 });
  }
}

async function handlePostWithSync(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const url = new URL(request.url);
    const syncablePaths = [
      "/api/public/forms/",
      "/api/contact",
      "/api/public/connect-card",
    ];
    const isSyncable = syncablePaths.some((p) => url.pathname.startsWith(p));

    if (isSyncable) {
      try {
        const body = await request.json();
        await queueForSync({
          url: request.url,
          method: "POST",
          headers: Object.fromEntries(request.headers.entries()),
          body,
          timestamp: Date.now(),
        });

        if ("sync" in self.registration) {
          await self.registration.sync.register("lc3-bg-sync");
        }

        return new Response(
          JSON.stringify({ message: "Saved offline. Will sync when you're back online.", offline: true }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to save for offline sync" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "You are offline. Please try again later." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function queueForSync(entry) {
  const db = await openSyncDB();
  const tx = db.transaction("queue", "readwrite");
  await tx.objectStore("queue").add(entry);
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

async function getQueuedRequests() {
  const db = await openSyncDB();
  const tx = db.transaction("queue", "readonly");
  const store = tx.objectStore("queue");
  const all = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
  db.close();
  return all;
}

async function clearQueuedRequest(key) {
  const db = await openSyncDB();
  const tx = db.transaction("queue", "readwrite");
  await tx.objectStore("queue").delete(key);
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("lc3-sync", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "timestamp" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener("sync", (event) => {
  if (event.tag === "lc3-bg-sync") {
    event.waitUntil(replayQueue());
  }
});

async function replayQueue() {
  const entries = await getQueuedRequests();
  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.body),
      });
      if (response.ok || response.status < 500) {
        await clearQueuedRequest(entry.timestamp);
      }
    } catch {
      break;
    }
  }
}

self.addEventListener("message", (event) => {
  if (event.data === "lc3-replay-sync") {
    replayQueue();
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Lake City Christian Church", body: "You have a new notification", icon: "/android-chrome-192x192.png", url: "/" };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/android-chrome-192x192.png",
    badge: data.badge || "/favicon-32x32.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    actions: [{ action: "open", title: "Open" }],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
