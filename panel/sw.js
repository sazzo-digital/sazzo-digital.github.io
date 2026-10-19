const CACHE = "sazzo-charlas-1";
const BASE = ["./", "panel.css", "panel.js", "manifest.webmanifest", "iconos/icono-192.png", "iconos/icono-512.png", "iconos/insignia-96.png"];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches
            .open(CACHE)
            .then((c) => c.addAll(BASE))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
    e.respondWith(
        fetch(e.request)
            .then((r) => {
                if (r.ok) {
                    const copia = r.clone();
                    caches.open(CACHE).then((c) => c.put(e.request, copia));
                }
                return r;
            })
            .catch(() => caches.match(e.request, { ignoreSearch: true })),
    );
});

self.addEventListener("push", (e) => {
    let d = {};
    try {
        d = e.data ? e.data.json() : {};
    } catch {
        d = { texto: e.data.text() };
    }
    const charla = d.charla ?? "";
    const tareas = [
        self.registration.showNotification(d.titulo || "Sazzo Charlas", {
            body: d.texto || "Te escribieron en la web",
            icon: "iconos/icono-192.png",
            badge: "iconos/insignia-96.png",
            tag: charla || "sazzo-charlas",
            renotify: true,
            data: { charla },
        }),
    ];
    if ("setAppBadge" in navigator) tareas.push(Number.isFinite(d.sinLeer) ? navigator.setAppBadge(d.sinLeer) : navigator.setAppBadge());
    e.waitUntil(Promise.all(tareas).catch(() => {}));
});

self.addEventListener("notificationclick", (e) => {
    e.notification.close();
    const charla = e.notification.data?.charla ?? "";
    const destino = new URL(charla ? `./?charla=${encodeURIComponent(charla)}` : "./", self.registration.scope).href;
    e.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
            const ventana = ventanas.find((v) => v.url.startsWith(self.registration.scope));
            if (!ventana) return self.clients.openWindow(destino);
            if (charla) ventana.postMessage({ charla });
            return ventana.focus();
        }),
    );
});
