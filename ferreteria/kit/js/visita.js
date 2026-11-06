// ============================================
// La visita: de dónde vino, el número al azar de este equipo y el registro de visitas (la planilla de Sazzo).
// Usa los mismos nombres que el catálogo (compartidos a propósito entre todos los sitios de Sazzo):
//   sazzo-origen  ?o=papel, ?o=ig, ?o=wa o ?o=ig-kiosco (lo guarda el catálogo o la demo, si el link trae ?o=).
//                 Vale para esa visita: 12 horas desde que llegó con el link (si vuelve otro día sin link, es "directo").
//   sazzo-equipo  número al azar de este navegador (distingue "volvió" de "otra persona"; no identifica a nadie)
//   sazzo-yo      ?yo=1 marca los equipos de Sazzo: mandan con prueba "yo" y van aparte (?yo=0 lo desmarca)
// Nada de esto cambia lo que se ve en pantalla. Nunca se manda nombre, teléfono, mail, ubicación ni lo que se carga
// en la demo. Lo que viaja sigue docs\registro\contrato-de-eventos.md (esquema 2).
// La dirección de la planilla la pone el script de armar el sitio (medicion\direccion.txt). En la PC (localhost)
// nunca se manda nada.
// ============================================
import { MEDICION } from "./config.js?v=5e8c0ea1a2";
import { PRODUCTOS } from "./productos.js?v=5e8c0ea1a2";

const ORIGEN_VALIDO = /^[a-z0-9-]{1,30}$/;
export const EVENTOS = ["abrio-demo", "entro", "pantalla", "quiero-esto", "otras-demos", "colores", "error", "velocidad", "detalle"];
export const DURA_ORIGEN = 12 * 60 * 60 * 1000;

const leer = (clave) => {
    try {
        return localStorage.getItem(clave);
    } catch {
        return null;
    }
};
const escribir = (clave, valor) => {
    try {
        if (valor === null) localStorage.removeItem(clave);
        else localStorage.setItem(clave, valor);
        return true;
    } catch {
        return false;
    }
};

export function alAzar(largo) {
    const letras = "abcdefghijklmnopqrstuvwxyz0123456789";
    const numeros = new Uint8Array(largo);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(numeros);
    else numeros.forEach((_, i) => (numeros[i] = Math.floor(Math.random() * 256)));
    return Array.from(numeros, (n) => letras[n % letras.length]).join("");
}

export function leerLink(busqueda = location.search, ahora = Date.now()) {
    const p = new URLSearchParams(busqueda);
    const origen = p.get("o");
    if (origen && ORIGEN_VALIDO.test(origen)) escribir("sazzo-origen", `${origen}|${ahora}`);
    if (p.get("yo") === "1") escribir("sazzo-yo", "1");
    if (p.get("yo") === "0") escribir("sazzo-yo", null);
}

export function origen(ahora = Date.now()) {
    const m = /^([a-z0-9-]{1,30})\|(\d{1,15})$/.exec(leer("sazzo-origen") ?? "");
    if (!m) return "directo";
    const edad = ahora - Number(m[2]);
    return edad > -60000 && edad < DURA_ORIGEN ? m[1] : "directo";
}

let equipoDeEstaPagina = "";
let sePuedeGuardar = false;

export function equipo() {
    const guardado = leer("sazzo-equipo");
    if (/^[a-z0-9]{8}$/.test(guardado ?? "")) {
        sePuedeGuardar = true;
        return guardado;
    }
    if (!equipoDeEstaPagina) equipoDeEstaPagina = alAzar(8);
    sePuedeGuardar = escribir("sazzo-equipo", equipoDeEstaPagina) && leer("sazzo-equipo") === equipoDeEstaPagina;
    return equipoDeEstaPagina;
}

const sesion = alAzar(8);

export function sistemaDe(agente = navigator.userAgent) {
    return /Android/.test(agente) ? "Android"
        : /iPhone|iPod/.test(agente) ? "iPhone"
        : /iPad/.test(agente) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad"
        : /Windows/.test(agente) ? "PC Windows"
        : /Mac OS/.test(agente) ? "Mac"
        : /Linux/.test(agente) ? "Linux" : "Otro";
}

export function navegadorDe(agente = navigator.userAgent, esBrave = Boolean(navigator.brave)) {
    return /WhatsApp/.test(agente) ? "adentro de WhatsApp"
        : /Instagram|FBAN|FBAV/.test(agente) ? "adentro de Instagram o Facebook"
        : /EdgA?\//.test(agente) ? "Edge"
        : esBrave ? "Brave"
        : /SamsungBrowser/.test(agente) ? "Samsung Internet"
        : /Firefox|FxiOS/.test(agente) ? "Firefox"
        : /Chrome|CriOS/.test(agente) ? "Chrome"
        : /Safari/.test(agente) ? "Safari" : "otro navegador";
}

export function dispositivo(agente = navigator.userAgent, esBrave = Boolean(navigator.brave)) {
    return `${sistemaDe(agente)} · ${navegadorDe(agente, esBrave)}`;
}

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function productosDe(agente = navigator.userAgent, lista = PRODUCTOS) {
    const texto = String(agente ?? "").slice(0, 600);
    const encontrados = [];
    const ordenados = [...lista.filter(([, auto]) => auto), ...lista.filter(([, auto]) => !auto)];
    for (const [nombre] of ordenados) {
        const conVersion = new RegExp(`(?:^|[\\s;(,])${escaparRegex(nombre)}/(\\d{1,5})`).exec(texto);
        if (conVersion) encontrados.push(`${nombre}/${conVersion[1]}`);
        else if (new RegExp(`(?:^|[\\s;(,])${escaparRegex(nombre)}(?:[\\s;),]|$)`).test(texto)) encontrados.push(nombre);
        if (encontrados.length === 6) break;
    }
    return encontrados;
}

export function webdriverDe(nav = typeof navigator !== "undefined" ? navigator : {}) {
    return nav.webdriver === true ? "si" : nav.webdriver === false ? "no" : "desconocido";
}

export function sitioDe(host = location.hostname) {
    const h = String(host).toLowerCase();
    return h === "sazzo.com.ar" || h === "www.sazzo.com.ar" ? "sazzo.com.ar" : h === "sazzo-demos.web.app" ? "sazzo-demos.web.app" : "otro";
}

export function versionDe(doc = typeof document !== "undefined" ? document : null) {
    const texto = doc?.querySelector?.('meta[name="version"]')?.content ?? "";
    return /^\d{1,3}\.\d{1,3}/.exec(texto)?.[0] ?? "";
}

export function huellaDe(direccion = import.meta.url) {
    try {
        const v = new URL(direccion).searchParams.get("v") ?? "";
        return /^[0-9a-f]{10}$/.test(v) ? v : "";
    } catch {
        return "";
    }
}

export function pantallaDe(hash = location.hash) {
    const nombre = hash.replace(/^#\/?/, "").split(/[/?]/)[0] || "inicio";
    return /^[a-z0-9-]{1,30}$/i.test(nombre) ? nombre.toLowerCase() : "otra";
}

export function cuandoSeMuestre(hacer, doc = typeof document !== "undefined" ? document : null) {
    if (doc?.prerendering) doc.addEventListener("prerenderingchange", () => hacer(), { once: true });
    else hacer();
}

const esLaPC = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";

function mandarAPlanilla(direccion, evento) {
    fetch(direccion, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify(evento) }).catch(() => {});
}

let personaActual = "";
let ultimaPantalla = null;

export const pruebaDe = () => (leer("sazzo-yo") === "1" ? "yo" : "");

export function contar(que, demo, { persona, pantalla = "", velocidad, error, modulo, csp, medicion = MEDICION, mandar = mandarAPlanilla, enLaPC = esLaPC() } = {}) {
    if (!EVENTOS.includes(que)) return null;
    if (que === "entro") {
        personaActual = String(persona ?? "").slice(0, 40);
        ultimaPantalla = null;
    }
    const id = equipo();
    const evento = {
        esquema: 2,
        id: alAzar(12),
        evento: que,
        demo: String(demo ?? "").slice(0, 30),
        persona: personaActual,
        pantalla: String(pantalla).slice(0, 40),
        origen: origen().slice(0, 30),
        equipo: id,
        sesion,
        sistema: sistemaDe(),
        navegador: navegadorDe(),
        dispositivo: dispositivo().slice(0, 60),
        productos: productosDe(),
        webdriver: webdriverDe(),
        almacenamiento: sePuedeGuardar ? "si" : "no",
        sitio: sitioDe(),
        version: versionDe(),
        huella: huellaDe(),
        cuando: Date.now(),
        ...(velocidad ? { velocidad } : {}),
        ...(error ? { error } : {}),
        ...(modulo ? { modulo } : {}),
        ...(csp ? { csp } : {}),
        ...(pruebaDe() ? { prueba: pruebaDe() } : {})
    };
    const direccion = String(medicion?.direccion ?? "");
    const activa = direccion.startsWith("https://script.google.com/macros/") && !enLaPC;
    if (activa) {
        cuandoSeMuestre(() => {
            evento.cuando = Date.now();
            mandar(direccion, evento);
        });
    }
    else console.debug("[visitas: no se manda]", evento);
    return evento;
}

export function contarPantalla(demo, opciones) {
    const pantalla = pantallaDe();
    if (pantalla === ultimaPantalla) return null;
    ultimaPantalla = pantalla;
    return contar("pantalla", demo, { pantalla, ...opciones });
}

export const ERRORES = ["importacion-fallida", "red", "programacion", "almacenamiento", "csp", "navegador-viejo", "no-arranco", "otro"];

export function errorDe(mensaje) {
    const m = String(mensaje ?? "");
    if (/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(m)) return "importacion-fallida";
    if (/QuotaExceeded|quota|localStorage|IndexedDB|storage/i.test(m)) return "almacenamiento";
    if (/NetworkError|Failed to fetch|Load failed|network/i.test(m)) return "red";
    if (/Unexpected token|Unexpected identifier|Invalid regular expression|not supported|Unexpected keyword/i.test(m)) return "navegador-viejo";
    if (/undefined|null|is not a function|is not defined|Cannot read|Cannot set|is not iterable|Maximum call stack|Invalid array length/i.test(m)) return "programacion";
    return "otro";
}

export function moduloDe(mensaje) {
    const nombre = /([a-z0-9-]{1,30}\.js)(?:\?|$|\s|")/i.exec(String(mensaje ?? ""))?.[1] ?? "";
    return nombre ? nombre.toLowerCase() : "otro";
}

export const DIRECTIVAS_CSP = ["script-src", "style-src", "img-src", "connect-src", "font-src", "media-src", "worker-src", "frame-src", "manifest-src"];

export function cspDe({ effectiveDirective = "", violatedDirective = "", blockedURI = "" } = {}) {
    const regla = String(effectiveDirective || violatedDirective).split(" ")[0].replace(/-(elem|attr)$/, "");
    const directiva = DIRECTIVAS_CSP.includes(regla) ? regla : "otra";
    const frenado = String(blockedURI);
    const que = ["inline", "eval", "data", "blob"].includes(frenado) ? frenado : /^https?:/.test(frenado) ? "externo" : "otro";
    return `${directiva}.${que}`;
}

export function resumenDeError(mensaje) {
    return String(mensaje ?? "")
        .replace(/(["'`]).*?\1|[«“].*?[»”]/g, " ")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z]+/g, "-")
        .replace(/^-+|-+$/g, "") || "sin-mensaje";
}

const TOPE_ERRORES = 3;
const erroresContados = new Set();
let demoActual = "";

function contarUnError(demo, tipo, extra, opciones) {
    const pantalla = pantallaDe();
    const clave = `${tipo}|${pantalla}|${extra.modulo ?? ""}|${extra.csp ?? ""}|${extra.firma ?? ""}`;
    if (erroresContados.size >= TOPE_ERRORES || erroresContados.has(clave)) return null;
    erroresContados.add(clave);
    const { firma, ...campos } = extra;
    return contar("error", demo, { ...opciones, pantalla, error: tipo, ...campos });
}

export function contarError(demo, mensaje, opciones) {
    const tipo = errorDe(mensaje);
    const extra = tipo === "importacion-fallida" ? { modulo: moduloDe(mensaje) } : { firma: resumenDeError(mensaje) };
    return contarUnError(demo, tipo, extra, opciones);
}

export function contarCSP(demo, violacion, opciones) {
    return contarUnError(demo, "csp", { csp: cspDe(violacion) }, opciones);
}

export const PUENTE_DE_OTRA_APP = /error invoking|java object is gone/i;

export function vigilarErrores(demo) {
    demoActual = demo;
    const contarSiDice = (mensaje) => {
        if (mensaje && mensaje !== "Script error." && !PUENTE_DE_OTRA_APP.test(mensaje)) contarError(demo, mensaje);
    };
    const antes = typeof window !== "undefined" && Array.isArray(window.__sazzoErrores) ? window.__sazzoErrores : [];
    if (typeof window !== "undefined") window.__sazzoErrores = null;
    antes.forEach(contarSiDice);
    addEventListener("error", (e) => contarSiDice(e.message));
    addEventListener("unhandledrejection", (e) => contarSiDice(e.reason?.message ?? String(e.reason ?? "")));
    if (typeof document !== "undefined") document.addEventListener("securitypolicyviolation", (e) => contarCSP(demo, e));
}

export function velocidadDe({ lcp = 0, cls = 0, inp = 0 } = {}) {
    const entero = (n, tope) => Math.min(Math.max(Math.round(Number(n) || 0), 0), tope);
    return { lcp: entero(lcp, 60000), cls: entero(cls * 1000, 9999), inp: entero(inp, 60000) };
}

let midiendo = false;

export function medirVelocidad(demo, opciones) {
    const tipos = typeof PerformanceObserver !== "undefined" ? PerformanceObserver.supportedEntryTypes ?? [] : [];
    if (midiendo || !tipos.includes("largest-contentful-paint")) return false;
    midiendo = true;
    const v = { lcp: 0, cls: 0, inp: 0 };
    const mirar = (type, alVer, extra = {}) => {
        if (!tipos.includes(type)) return;
        try {
            new PerformanceObserver((lista) => lista.getEntries().forEach(alVer)).observe({ type, buffered: true, ...extra });
        } catch {
            return;
        }
    };
    const mostradaEn = performance.getEntriesByType?.("navigation")?.[0]?.activationStart || 0;
    mirar("largest-contentful-paint", (e) => (v.lcp = mostradaEn ? Math.max(1, e.startTime - mostradaEn) : e.startTime));
    mirar("layout-shift", (e) => {
        if (!e.hadRecentInput) v.cls += e.value;
    });
    mirar("event", (e) => {
        if (e.interactionId) v.inp = Math.max(v.inp, e.duration);
    }, { durationThreshold: 40 });
    let mandado = false;
    const mandar = () => {
        if (mandado || !v.lcp) return;
        mandado = true;
        contar("velocidad", demo, { ...opciones, pantalla: pantallaDe(), velocidad: velocidadDe(v) });
    };
    addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") mandar();
    });
    addEventListener("pagehide", mandar);
    return true;
}

export const esDeProgramacion = (e) =>
    !(e instanceof Error) || e instanceof TypeError || e instanceof ReferenceError || e instanceof RangeError || e instanceof SyntaxError;

export function contarFalla(e) {
    if (demoActual) contarError(demoActual, e?.message ?? String(e ?? ""));
}
