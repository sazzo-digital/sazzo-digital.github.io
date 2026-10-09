// ============================================
// La visita: de dónde vino, el número al azar de este equipo y el registro de visitas (la planilla de Sazzo).
// Usa los mismos nombres que el catálogo (compartidos a propósito entre todos los sitios de Sazzo):
//   sazzo-origen  ?o=papel, ?o=ig, ?o=wa o ?o=ig-kiosco (lo guarda el catálogo o la demo, si el link trae ?o=).
//                 Vale para esa visita: 12 horas desde que llegó con el link (si vuelve otro día sin link, es "directo").
//   sazzo-equipo  número al azar de este navegador (distingue "volvió" de "otra persona"; no identifica a nadie)
//   sazzo-yo      ?yo=1 marca los equipos de Sazzo para que no cuenten (?yo=0 lo desmarca)
// Nada de esto cambia lo que se ve en pantalla. Nunca se manda nombre, teléfono, mail, ubicación ni lo que se carga
// en la demo: solo qué pasó (de una lista fija), en qué demo, la persona de ejemplo, la pantalla, el origen, el
// tipo de equipo y el navegador. Si algo se rompe en el celular de alguien, se manda "error" con la pantalla y el
// mensaje del error hecho palabras sueltas (sin comillas ni números: nunca lleva lo que cargó la persona).
// La dirección de la planilla la pone el script de armar el sitio (medicion\direccion.txt). En la PC (localhost)
// nunca se manda nada.
// ============================================
import { MEDICION } from "./config.js?v=3536e597cf";

const ORIGEN_VALIDO = /^[a-z0-9-]{1,30}$/; // igual que el catálogo
export const EVENTOS = ["abrio-demo", "entro", "pantalla", "quiero-esto", "otras-demos", "colores", "error"];
export const DURA_ORIGEN = 12 * 60 * 60 * 1000; // igual que el catálogo

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
    } catch {
        // sin localStorage: no pasa nada
    }
};

/** Lee ?o=, ?yo=1 y ?yo=0 del link (si vienen) y los guarda. Lo que no cumple la regla se ignora. */
export function leerLink(busqueda = location.search, ahora = Date.now()) {
    const p = new URLSearchParams(busqueda);
    const origen = p.get("o");
    if (origen && ORIGEN_VALIDO.test(origen)) escribir("sazzo-origen", `${origen}|${ahora}`); // "papel|1760000000000"
    if (p.get("yo") === "1") escribir("sazzo-yo", "1");
    if (p.get("yo") === "0") escribir("sazzo-yo", null);
}

/** De dónde vino esta visita: lo del último link con ?o=, si fue hace menos de 12 horas. Si no, "directo". */
export function origen(ahora = Date.now()) {
    const m = /^([a-z0-9-]{1,30})\|(\d{1,15})$/.exec(leer("sazzo-origen") ?? "");
    if (!m) return "directo";
    const edad = ahora - Number(m[2]);
    return edad > -60000 && edad < DURA_ORIGEN ? m[1] : "directo";
}

export function equipo() {
    let id = leer("sazzo-equipo");
    if (!/^[a-z0-9]{8}$/.test(id ?? "")) {
        id = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
        escribir("sazzo-equipo", id);
    }
    return id;
}

const sesion = Math.random().toString(36).slice(2, 10); // cada vez que se abre una página

/** "Android · Chrome", "iPhone · adentro de Instagram"… (sale del navegador; no identifica a nadie). */
export function dispositivo(agente = navigator.userAgent, esBrave = Boolean(navigator.brave)) {
    const sistema = /Android/.test(agente) ? "Android"
        : /iPhone|iPod/.test(agente) ? "iPhone"
        : /iPad/.test(agente) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad"
        : /Windows/.test(agente) ? "PC Windows"
        : /Mac OS/.test(agente) ? "Mac"
        : /Linux/.test(agente) ? "Linux" : "Otro";
    const navegador = /WhatsApp/.test(agente) ? "adentro de WhatsApp"
        : /Instagram|FBAN|FBAV/.test(agente) ? "adentro de Instagram o Facebook"
        : /EdgA?\//.test(agente) ? "Edge"
        : esBrave ? "Brave"
        : /SamsungBrowser/.test(agente) ? "Samsung Internet"
        : /Firefox|FxiOS/.test(agente) ? "Firefox"
        : /Chrome|CriOS/.test(agente) ? "Chrome"
        : /Safari/.test(agente) ? "Safari" : "otro navegador";
    return `${sistema} · ${navegador}`;
}

/** La pantalla de la demo según la dirección (#/caja/3 → "caja"). */
export function pantallaDe(hash = location.hash) {
    const nombre = hash.replace(/^#\/?/, "").split(/[/?]/)[0] || "inicio";
    return /^[a-z0-9-]{1,30}$/i.test(nombre) ? nombre.toLowerCase() : "otra";
}

const esLaPC = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";

/** Manda el evento a la planilla (Apps Script). text/plain y no-cors: el navegador lo manda directo, sin preguntar antes. */
function mandarAPlanilla(direccion, evento) {
    fetch(direccion, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify(evento) }).catch(() => {});
}

let personaActual = ""; // la persona de ejemplo con la que entró (se suma a lo que haga después)
let ultimaPantalla = null;

/**
 * Avisa al registro de visitas qué pasó: que (uno de EVENTOS) en la demo (su id, ej: "kiosco").
 * Campos fijos y con tope. Devuelve el evento armado (o null si `que` no es de la lista).
 * Solo manda si hay dirección de planilla, no es la PC y este equipo no está marcado con ?yo=1.
 */
export function contar(que, demo, { persona, pantalla = "", medicion = MEDICION, mandar = mandarAPlanilla, enLaPC = esLaPC() } = {}) {
    if (!EVENTOS.includes(que)) return null;
    if (que === "entro") {
        personaActual = String(persona ?? "").slice(0, 40);
        ultimaPantalla = null;
    }
    const evento = {
        evento: que,
        demo: String(demo ?? "").slice(0, 30),
        persona: personaActual,
        pantalla: String(pantalla).slice(0, 40),
        origen: origen().slice(0, 30),
        equipo: equipo(),
        sesion,
        dispositivo: dispositivo().slice(0, 60),
        cuando: Date.now()
    };
    const direccion = String(medicion?.direccion ?? "");
    const activa = direccion.startsWith("https://script.google.com/macros/") && !enLaPC && leer("sazzo-yo") !== "1";
    if (activa) mandar(direccion, evento);
    else console.debug("[visitas: no se manda]", evento);
    return evento;
}

/** Cada pantalla que mira (una vez por cambio; si recargó la página ya adentro, va sin persona). */
export function contarPantalla(demo, opciones) {
    const pantalla = pantallaDe();
    if (pantalla === ultimaPantalla) return null;
    ultimaPantalla = pantalla;
    return contar("pantalla", demo, { pantalla, ...opciones });
}

// ---------- Errores en el celular de alguien (para enterarse si algo se rompe en la calle) ----------

/** "Cannot read properties of undefined (reading 'x')" → "cannot-read-properties-of-undefined-reading". */
export function resumenDeError(mensaje) {
    return String(mensaje ?? "")
        .replace(/(["'`]).*?\1|[«“].*?[»”]/g, " ") // lo que va entre comillas puede ser algo que cargó la persona
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z]+/g, "-")
        .replace(/^-+|-+$/g, "") || "sin-mensaje";
}

const TOPE_ERRORES = 3; // por página abierta (un error que se repite en cada toque no inunda la planilla)
const erroresContados = new Set();
let demoActual = ""; // la que llamó a vigilarErrores (las pantallas avisan sus errores sin saber de qué demo son)

/** Manda "error" con "pantalla--mensaje" (40 letras como mucho). Cada mensaje una vez, y hasta 3 por página. */
export function contarError(demo, mensaje, opciones) {
    const resumen = resumenDeError(mensaje);
    if (erroresContados.size >= TOPE_ERRORES || erroresContados.has(resumen)) return null;
    erroresContados.add(resumen);
    const pantalla = `${pantallaDe()}--${resumen}`.slice(0, 40).replace(/-+$/, "");
    return contar("error", demo, { ...opciones, pantalla });
}

/**
 * Escucha los errores que nadie atajó (los que rompen algo) y los cuenta. También los que pasaron antes de que la demo
 * arrancara (tema.js los guarda en window.__sazzoErrores). "Script error." no se cuenta: es de otro sitio (por ejemplo
 * lo que mete el navegador de Instagram) y no dice nada.
 */
export function vigilarErrores(demo) {
    demoActual = demo;
    const contarSiDice = (mensaje) => {
        if (mensaje && mensaje !== "Script error.") contarError(demo, mensaje);
    };
    const antes = typeof window !== "undefined" && Array.isArray(window.__sazzoErrores) ? window.__sazzoErrores : [];
    if (typeof window !== "undefined") window.__sazzoErrores = null; // desde acá avisa esta función
    antes.forEach(contarSiDice);
    addEventListener("error", (e) => contarSiDice(e.message));
    addEventListener("unhandledrejection", (e) => contarSiDice(e.reason?.message ?? String(e.reason ?? "")));
}

/** ¿Es un error de programación? Los nuestros (exigir, buscar, topes) son Error comunes con el mensaje en castellano. */
export const esDeProgramacion = (e) =>
    !(e instanceof Error) || e instanceof TypeError || e instanceof ReferenceError || e instanceof RangeError || e instanceof SyntaxError;

/** Un error de programación que se atajó para que la pantalla no se rompa: igual se avisa (si no, nunca nos enteramos). */
export function contarFalla(e) {
    if (demoActual) contarError(demoActual, e?.message ?? String(e ?? ""));
}
