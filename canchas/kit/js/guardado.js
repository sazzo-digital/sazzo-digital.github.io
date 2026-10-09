// ============================================
// Guardado en MODO PRUEBA: los datos inventados de la demo, guardados solo en este navegador (localStorage).
//
// Todas las demos se publican en el mismo sitio (la misma cuenta de GitHub Pages), así que para el navegador
// comparten el mismo localStorage. Por eso cada demo guarda todo con su prefijo: "sazzo-kiosco-datos",
// "sazzo-kiosco-sesion"… y nunca toca lo de otra. Lo único compartido a propósito (no se puede usar de prefijo):
// sazzo-origen, sazzo-equipo, sazzo-tema y sazzo-yo.
//
// Uso en la demo (una sola vez, en su archivo de datos):
//   const guardado = crearGuardado({ prefijo: "sazzo-kiosco", version: 1, semilla: crearSemilla });
//   guardado.db()  → los datos (si no hay, o están rotos, o son de otra versión, o de otro día: los de fábrica)
//   …se modifica db()… y después guardado.persistir()
//
// Reglas para las funciones de datos de cada demo:
// - Cada función que modifica controla el permiso con exigir().
// - Nada se borra: se da de baja o se anula, y queda quién y cuándo.
// - Las funciones devuelven copias: modificar lo que devuelven no cambia los datos guardados.
// - Si cambia la forma de los datos de prueba, subir `version` (se regeneran solos).
// - Los datos de ejemplo se arman con las fechas y horas de ahora: si alguien vuelve otro día, o el mismo día pero
//   después de 3 horas sin usarla, se arman de nuevo (si no, vería la agenda de hoy vacía o mesas "abiertas hace 650
//   minutos"). Mientras la usa (cada cambio que guarda), no se renuevan. Se avisa con un cartelito.
// ============================================

import { aviso } from "./ui.js?v=8803abd1ef";

/** Nombres compartidos entre el catálogo y todas las demos (no pueden ser el prefijo de una demo). */
export const COMPARTIDAS = ["sazzo-origen", "sazzo-equipo", "sazzo-tema", "sazzo-yo"];

/** El día de hoy en este equipo ("2026-10-09"): el día para el que se armaron los datos de ejemplo. */
export function hoyLocal(fecha = new Date()) {
    const dos = (n) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export const MENSAJE_RENOVADOS = "Los datos de ejemplo se renovaron para que estén al día.";
export const SIN_USO_RENUEVA = 3 * 60 * 60 * 1000; // 3 horas sin guardar nada: al volver, datos nuevos

export function crearGuardado({ prefijo, version, semilla } = {}) {
    if (!/^sazzo-[a-z0-9]+(-[a-z0-9]+)*$/.test(prefijo ?? "")) {
        throw new Error(`El prefijo de la demo tiene que ser "sazzo-" y su nombre en minúsculas (ej: "sazzo-kiosco"). Llegó: ${JSON.stringify(prefijo)}.`);
    }
    if (COMPARTIDAS.includes(prefijo)) throw new Error(`"${prefijo}" es un nombre compartido entre todas las demos: elegí otro prefijo.`);
    if (!Number.isInteger(version) || version < 1) throw new Error("La versión de los datos tiene que ser un número entero desde 1.");
    if (typeof semilla !== "function") throw new Error("Falta la función que crea los datos de prueba (semilla).");

    const claves = { datos: `${prefijo}-datos`, sesion: `${prefijo}-sesion` };
    let cache = null;
    let sesionEnMemoria = null; // por si el navegador no deja usar localStorage (ventana privada, permisos)
    let yaAviso = false; // el aviso de "no se pudo guardar" sale una sola vez (hasta "Empezar de cero")

    function persistir() {
        if (cache) cache.usadoEl = Date.now(); // la última vez que se usó (ver SIN_USO_RENUEVA)
        try {
            localStorage.setItem(claves.datos, JSON.stringify(cache));
            return true;
        } catch (e) {
            // sin localStorage (o lleno): los datos quedan solo en memoria hasta recargar
            if (!yaAviso) {
                yaAviso = true;
                avisarQueNoGuardo(e);
            }
            return false;
        }
    }

    function db() {
        if (cache) return cache;
        let deOtroDia = false;
        try {
            const guardados = JSON.parse(localStorage.getItem(claves.datos));
            if (guardados?.version === version) {
                const sinUso = Date.now() - Number(guardados.usadoEl || 0);
                if (guardados.armadoEl === hoyLocal() && sinUso >= 0 && sinUso < SIN_USO_RENUEVA) return (cache = guardados);
                deOtroDia = true;
            }
        } catch {
            // datos rotos o sin acceso: se regeneran
        }
        cache = { ...semilla(), version, armadoEl: hoyLocal(), usadoEl: Date.now() };
        persistir();
        if (deOtroDia && typeof document !== "undefined" && document.body) aviso(MENSAJE_RENOVADOS, "info");
        return cache;
    }

    /** La próxima lectura vuelve a leer el localStorage (lo cambió otra pestaña). */
    function olvidarCache() {
        cache = null;
    }

    /** "Empezar de cero": borra los datos de ESTA demo; al volver a leerlos aparecen los de fábrica. */
    function reiniciar() {
        cache = null;
        yaAviso = false;
        try {
            localStorage.removeItem(claves.datos);
        } catch {
            // nada que borrar
        }
    }

    /** Quién está adentro (el id de la persona elegida en "entrar como…"), o null. */
    function leerSesion() {
        try {
            return localStorage.getItem(claves.sesion);
        } catch {
            return sesionEnMemoria;
        }
    }

    function guardarSesion(id) {
        sesionEnMemoria = id ?? null;
        try {
            if (id) localStorage.setItem(claves.sesion, id);
            else localStorage.removeItem(claves.sesion);
        } catch {
            // queda en memoria
        }
    }

    return { prefijo, claves, db, persistir, olvidarCache, reiniciar, leerSesion, guardarSesion };
}

/** Lleno (QuotaExceededError) o sin permiso: la demo sigue andando, pero se avisa que lo nuevo no queda. */
export function esLugarLleno(e) {
    return e?.name === "QuotaExceededError" || e?.name === "NS_ERROR_DOM_QUOTA_REACHED" || e?.code === 22 || e?.code === 1014;
}

export const MENSAJE_LLENO = "No hay más lugar para guardar la demo en este equipo: lo nuevo se pierde al recargar. Tocá Empezar de cero.";
export const MENSAJE_SIN_PERMISO = "Este navegador no deja guardar: la demo anda, pero lo que hagas se borra al recargar.";

function avisarQueNoGuardo(e) {
    if (typeof document === "undefined" || !document.body) return;
    aviso(esLugarLleno(e) ? MENSAJE_LLENO : MENSAJE_SIN_PERMISO, "error");
}

// ---------- Ayudas para las funciones de datos de cada demo ----------

export function exigir(condicion, mensaje = "No tenés permiso para hacer esto.") {
    if (!condicion) throw new Error(mensaje);
}

export const copia = (x) => (x == null ? null : structuredClone(x));
let contadorIds = 0;
/** Id corto que no se repite: momento + contador (por si se crean varios en el mismo milisegundo) + azar. */
export const nuevoId = (prefijo) =>
    `${prefijo}-${Date.now().toString(36)}${(contadorIds++ % 1296).toString(36).padStart(2, "0")}${Math.random().toString(36).slice(2, 5)}`;
export const ahora = () => new Date().toISOString();

/** Busca por id en una lista; si no está, da el error que se le pase. */
export function buscar(lista, id, mensaje = "Eso ya no existe.") {
    const x = lista.find((e) => e.id === id);
    if (!x) throw new Error(mensaje);
    return x;
}
