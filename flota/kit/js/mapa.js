// ============================================
// Un mapa con puntos (dónde está cada vehículo, cada sucursal…):
//   await mostrarMapa(lugar, [{ lat: -38.95, lng: -68.06, titulo: "Camión 1", texto: "Andando · Hugo",
//                               color: "#16a34a", link: "#/vehiculos/v-1" }]);
// Leaflet 1.9.4 (kit\libs\leaflet\, BSD) con los mapas de OpenStreetMap: se baja recién cuando se abre el mapa. Los
// cuadraditos del mapa los da OpenStreetMap (gratis, con su nombre abajo a la derecha, como pide su política; poco
// tráfico: es una demo). Los puntos son de ejemplo: nunca se usa la ubicación de quien mira.
// ============================================
import { aviso } from "./ui.js?v=3f853aa22c";
import { alSalirDeLaPantalla } from "./rutas.js?v=3f853aa22c";
import { RUTA_LIBS } from "./config.js?v=3f853aa22c";
import { cargarLibreria } from "./archivos.js?v=3f853aa22c";

const VERSION = "1.9.4";
export const TOPE_PUNTOS = 200;
const MAPAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const NOMBRE_MAPAS = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Revisa los puntos: coordenadas de verdad, textos con tope, color #rrggbb y links solo de adentro de la demo. */
export function revisarPuntos(puntos) {
    if (!Array.isArray(puntos) || !puntos.length) throw new Error("El mapa necesita al menos un punto.");
    if (puntos.length > TOPE_PUNTOS) throw new Error(`El mapa muestra como mucho ${TOPE_PUNTOS} puntos.`);
    return puntos.map((p) => {
        const lat = Number(p?.lat);
        const lng = Number(p?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) throw new Error("Hay un punto con coordenadas inválidas.");
        return {
            lat, lng,
            titulo: String(p.titulo ?? "").slice(0, 40),
            texto: String(p.texto ?? "").slice(0, 80),
            color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#2563eb",
            link: /^#\/[\w\-/?=&]{0,80}$/.test(p.link ?? "") ? p.link : null,
            // Una zona en vez de un punto ("es por acá", no "es acá"): un círculo de tantos metros (50 a 5000)
            radio: Number.isFinite(Number(p.radio)) && p.radio !== null && p.radio !== "" ? Math.min(Math.max(Math.round(Number(p.radio)), 50), 5000) : null
        };
    });
}

function cargarEstilos() {
    if (document.querySelector("link[data-leaflet]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(`leaflet/leaflet.css?v=${VERSION}`, new URL(RUTA_LIBS, location.href)).href;
    link.dataset.leaflet = "";
    document.head.append(link);
}

/** El globito de cada punto, armado con elementos (nunca con HTML que venga de los datos). */
function globito(p) {
    const caja = document.createElement("div");
    caja.className = "mapa__globito";
    const b = document.createElement("b");
    b.textContent = p.titulo;
    caja.append(b);
    if (p.texto) {
        const t = document.createElement("span");
        t.textContent = p.texto;
        caja.append(t);
    }
    if (p.link) {
        const a = document.createElement("a");
        a.href = p.link;
        a.textContent = "Ver la ficha";
        caja.append(a);
    }
    return caja;
}

export async function mostrarMapa(lugar, puntos, { zoomMaximo = 15 } = {}) {
    const lista = revisarPuntos(puntos);
    cargarEstilos();
    let L;
    try {
        await cargarLibreria(`leaflet/leaflet.js`, "leaflet");
        L = globalThis.leaflet;
    } catch {
        aviso("No se pudo cargar el mapa. Probá de nuevo con mejor señal.", "error");
        return null;
    }
    if (!lugar.isConnected) return null;
    const mapa = L.map(lugar, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer(MAPAS, { maxZoom: 19, attribution: NOMBRE_MAPAS }).addTo(mapa);
    mapa.attributionControl.setPrefix(false); // sin la banderita del prefijo: solo el nombre de OpenStreetMap
    lista.forEach((p) =>
        (p.radio
            ? L.circle([p.lat, p.lng], { radius: p.radio, color: p.color, weight: 2, fillColor: p.color, fillOpacity: 0.22 })
            : L.circleMarker([p.lat, p.lng], { radius: 10, color: "#ffffff", weight: 2, fillColor: p.color, fillOpacity: 0.95 }))
            .bindTooltip(p.titulo, { direction: "top", offset: [0, -8] })
            .bindPopup(globito(p))
            .addTo(mapa));
    // El borde se calcula con los puntos (y lo que ocupa cada zona): un círculo recién agregado no se puede medir
    // hasta que el mapa tiene vista
    const limites = new L.LatLngBounds();
    lista.forEach((p) => limites.extend(p.radio ? L.latLng(p.lat, p.lng).toBounds(p.radio * 2) : L.latLng(p.lat, p.lng)));
    mapa.fitBounds(limites.pad(0.2), { maxZoom: zoomMaximo });
    alSalirDeLaPantalla(() => mapa.remove());
    return mapa;
}
