const PREFIJO = "sazzo-flota";
const COPIA = `${PREFIJO}-2acd6c7b7a`;
const BASICO = ["./", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches
            .open(COPIA)
            .then((c) => c.addAll(BASICO))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((nombres) => Promise.all(nombres.filter((n) => n.startsWith(`${PREFIJO}-`) && n !== COPIA).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

async function primeroElServidor(pedido) {
    const copia = await caches.open(COPIA);
    try {
        const respuesta = await (pedido.mode === "navigate"
            ? fetch(pedido.url, { cache: "no-cache", credentials: "same-origin" })
            : fetch(pedido, { cache: "no-cache" }));
        if (respuesta.status === 200) copia.put(pedido, respuesta.clone()).catch(() => {});
        return respuesta;
    } catch (error) {
        const guardada = (await copia.match(pedido)) ?? (await copia.match(pedido, { ignoreSearch: true })) ?? (pedido.mode === "navigate" ? await copia.match("./") : null);
        if (guardada) return guardada;
        throw error;
    }
}

self.addEventListener("fetch", (e) => {
    const pedido = e.request;
    if (pedido.method !== "GET") return;
    if (new URL(pedido.url).origin !== self.location.origin) return;
    e.respondWith(primeroElServidor(pedido));
});
