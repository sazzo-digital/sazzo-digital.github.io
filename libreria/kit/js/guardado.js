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

import { aviso, esc } from "./ui.js?v=fd92d86921";
import { olvidarAvisos } from "./avisos.js?v=fd92d86921";

/** Nombres compartidos entre el catálogo y todas las demos (no pueden ser el prefijo de una demo). */
export const COMPARTIDAS = [
    "sazzo-origen",
    "sazzo-equipo",
    "sazzo-tema",
    "sazzo-yo",
    "sazzo-interes",
    "sazzo-aviso-navegador",
    "sazzo-dictado-avisado",
    "sazzo-chat-visitante",
    "sazzo-chat-libre",
    "sazzo-chat-plegado",
    "sazzo-chat-persona",
    "sazzo-chat-telefono",
    "sazzo-chat-tema",
    "sazzo-chat-panel",
    "sazzo-chat-invita",
    "sazzo-cuota",
    "sazzo-cuota-vuelta",
    "sazzo-panel-clave",
    "sazzo-panel-vistos",
    "sazzo-panel-sonido"
];

export const esCompartida = (prefijo) => COMPARTIDAS.some((c) => c === prefijo || c.startsWith(`${prefijo}-`));

const esObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const COMPROBAR = {
    texto: (v) => typeof v === "string",
    numero: (v) => Number.isFinite(v),
    booleano: (v) => typeof v === "boolean"
};

function campoValido(valor, regla) {
    if (typeof regla === "string" && regla.endsWith("?")) {
        if (valor == null) return true;
        regla = regla.slice(0, -1);
    }
    if (Array.isArray(regla)) return regla.includes(valor);
    const comprobar = COMPROBAR[regla];
    return comprobar ? comprobar(valor) : true;
}

export function revisarForma(datos, forma = {}) {
    if (!esObjeto(datos)) return { ok: false, arreglos: 0 };
    let arreglos = 0;
    for (const nombre of forma.objetos ?? []) {
        if (!esObjeto(datos[nombre])) return { ok: false, arreglos };
    }
    for (const [nombre, campos] of Object.entries(forma.listas ?? {})) {
        if (!Array.isArray(datos[nombre])) {
            datos[nombre] = [];
            arreglos++;
            continue;
        }
        if (campos === null) continue;
        const lista = datos[nombre];
        const buenos = lista.filter((r) => esObjeto(r) && Object.entries(campos ?? {}).every(([campo, regla]) => campoValido(r[campo], regla)));
        const descartados = lista.length - buenos.length;
        if (descartados * 2 > lista.length) return { ok: false, arreglos };
        if (descartados) {
            datos[nombre] = buenos;
            arreglos += descartados;
        }
    }
    return { ok: true, arreglos };
}

export function formaDeLaMuestra(muestra) {
    const forma = { listas: {} };
    for (const [nombre, valor] of Object.entries(muestra ?? {})) {
        if (Array.isArray(valor)) forma.listas[nombre] = esObjeto(valor[0]) ? {} : null;
    }
    return forma;
}

export const EVENTO_CONFLICTO = "sazzo-conflicto";
export const MENSAJE_DANADO = "Los datos guardados estaban dañados: se armaron de nuevo.";
export const MENSAJE_REPARADO = "Había datos dañados: se arreglaron.";
export const SUFIJO_COPIA = " Quedó una copia de lo anterior.";
export const MENSAJE_CONFLICTO = "Otra pestaña cambió los datos al mismo tiempo. Mirá que esté todo y repetí lo que falte.";
export const TOPE_COPIA = 1024 * 1024;

const nuevaRevision = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** El día de hoy en este equipo ("2026-10-09"): el día para el que se armaron los datos de ejemplo. */
export function hoyLocal(fecha = new Date()) {
    const dos = (n) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export const EVENTO_REINICIO = "sazzo-reinicio";

export const MENSAJE_RENOVADOS ="Los datos de ejemplo se renovaron para que estén al día.";
export const SIN_USO_RENUEVA = 3 * 60 * 60 * 1000; // 3 horas sin guardar nada: al volver, datos nuevos

export const PREGUNTA_TURNO = "Quedó un turno abierto de hace {tiempo}: ¿seguís con ese turno o empezás de cero?";

const claveSesion = (prefijo) => `${prefijo}-sesion`;

function haceCuanto(milisegundos) {
    const minutos = Math.max(1, Math.floor(milisegundos / 60000));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const en = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
    if (dias >= 60) return "mucho tiempo";
    if (dias >= 1) return en(dias, "día", "días");
    if (horas >= 1) return en(horas, "hora", "horas");
    return en(minutos, "minuto", "minutos");
}

/**
 * Quién quedó adentro la última vez (el id de la persona), sin armar los datos: el arranque lo usa para mostrar
 * "Probala como…" mientras los datos y las pantallas se bajan aparte (kit/aparte.js). Sin localStorage: null.
 */
export function leerSesionGuardada(prefijo) {
    try {
        return localStorage.getItem(claveSesion(prefijo));
    } catch {
        return null;
    }
}

export function olvidarDemo(prefijo) {
    if (!/^sazzo-[a-z0-9]+(-[a-z0-9]+)*$/.test(prefijo ?? "") || esCompartida(prefijo)) return 0;
    try {
        const todas = Object.keys(localStorage);
        const hermanas = todas.filter((k) => k.endsWith("-datos") && k.startsWith(`${prefijo}-`)).map((k) => k.slice(0, -6)).filter((h) => h !== prefijo);
        const claves = todas.filter((k) => k.startsWith(`${prefijo}-`) && !hermanas.some((h) => k.startsWith(`${h}-`)));
        claves.forEach((k) => localStorage.removeItem(k));
        return claves.length;
    } catch {
        return 0;
    }
}

export function crearGuardado({ prefijo, version, semilla, turnoAbierto, preguntaAlVolver, forma, revisarDatos, formaDeLaSemilla } = {}) {
    if (!/^sazzo-[a-z0-9]+(-[a-z0-9]+)*$/.test(prefijo ?? "")) {
        throw new Error(`El prefijo de la demo tiene que ser "sazzo-" y su nombre en minúsculas (ej: "sazzo-kiosco"). Llegó: ${JSON.stringify(prefijo)}.`);
    }
    if (esCompartida(prefijo)) throw new Error(`"${prefijo}" es un nombre compartido entre todas las demos: elegí otro prefijo.`);
    if (!Number.isInteger(version) || version < 1) throw new Error("La versión de los datos tiene que ser un número entero desde 1.");
    if (typeof semilla !== "function") throw new Error("Falta la función que crea los datos de prueba (semilla).");

    const claves = { datos: `${prefijo}-datos`, sesion: claveSesion(prefijo), revision: `${prefijo}-revision`, copia: `${prefijo}-copia-danada` };
    let cache = null;
    let revisionPropia = null;

    function leerRevision() {
        try {
            return localStorage.getItem(claves.revision);
        } catch {
            return null;
        }
    }

    function guardarCopia(crudo) {
        if (typeof crudo !== "string" || crudo.length > TOPE_COPIA) return false;
        try {
            localStorage.setItem(claves.copia, crudo);
            return true;
        } catch {
            return false;
        }
    }

    function copiaDanada() {
        try {
            return localStorage.getItem(claves.copia);
        } catch {
            return null;
        }
    }

    let formaPropia = forma;

    function revisarGuardados(guardados) {
        if (!formaPropia && formaDeLaSemilla === true) {
            try {
                formaPropia = formaDeLaMuestra(semilla());
            } catch {
                formaPropia = { listas: {} };
            }
        }
        const estado = formaPropia ? revisarForma(guardados, formaPropia) : { ok: true, arreglos: 0 };
        if (estado.ok && typeof revisarDatos === "function") {
            try {
                if (revisarDatos(guardados) === false) estado.ok = false;
            } catch {
                estado.ok = false;
            }
        }
        return estado;
    }

    const avisarAlUsuario = (texto) => {
        if (typeof document !== "undefined" && document.body) aviso(texto, "info");
    };
    let sesionEnMemoria = null; // por si el navegador no deja usar localStorage (ventana privada, permisos)
    let yaAviso = false; // el aviso de "no se pudo guardar" sale una sola vez (hasta "Empezar de cero")

    let preguntando = false;
    const pregunta = typeof preguntaAlVolver === "string" && preguntaAlVolver.trim() ? preguntaAlVolver : PREGUNTA_TURNO;

    function hayTurnoAbierto(guardados) {
        if (typeof turnoAbierto !== "function") return false;
        try {
            return turnoAbierto(copia(guardados)) === true;
        } catch {
            return false;
        }
    }

    function preguntarPorElTurno(sinUso) {
        if (preguntando || typeof document === "undefined" || !document.body) return;
        preguntando = true;
        const hoja = document.createElement("dialog");
        hoja.className = "hoja turno-abierto";
        hoja.setAttribute("aria-labelledby", "turno-abierto-titulo");
        hoja.innerHTML = `
            <div class="hoja__caja">
                <div class="hoja__titulos">
                    <h2 id="turno-abierto-titulo"><i class="ti ti-info-circle" aria-hidden="true"></i> Turno abierto</h2>
                </div>
                <p>${esc(pregunta.replaceAll("{tiempo}", haceCuanto(sinUso)))}</p>
                <button class="boton boton--ancho" type="button" data-seguir>Seguir con el turno</button>
                <button class="boton boton--secundario boton--ancho" type="button" data-cero>Empezar de cero</button>
            </div>`;
        const cerrar = () => {
            preguntando = false;
            if (hoja.open) hoja.close();
            hoja.remove();
        };
        hoja.addEventListener("cancel", (e) => e.preventDefault());
        hoja.addEventListener("close", () => {
            if (preguntando && hoja.isConnected) hoja.showModal();
        });
        hoja.querySelector("[data-seguir]").addEventListener("click", () => {
            cerrar();
            if (cache) {
                cache.armadoEl = hoyLocal();
                persistir();
            }
        });
        hoja.querySelector("[data-cero]").addEventListener("click", () => {
            cerrar();
            reiniciar();
            dispatchEvent(new Event("hashchange"));
        });
        document.body.append(hoja);
        hoja.showModal();
    }

    function persistir() {
        if (cache && !preguntando) cache.usadoEl = Date.now(); // la última vez que se usó (ver SIN_USO_RENUEVA)
        const choque = leerRevision() !== revisionPropia;
        try {
            localStorage.setItem(claves.datos, JSON.stringify(cache));
            const nueva = nuevaRevision();
            try {
                localStorage.setItem(claves.revision, nueva);
                revisionPropia = nueva;
            } catch {
                revisionPropia = null;
            }
            if (choque && typeof document !== "undefined" && document.body) {
                dispatchEvent(new CustomEvent(EVENTO_CONFLICTO, { detail: { prefijo } }));
                aviso(MENSAJE_CONFLICTO, "info");
            }
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
        if (cache) {
            if (leerRevision() === revisionPropia) return cache;
            cache = null;
        }
        revisionPropia = leerRevision();
        let deOtroDia = false;
        let turno = null;
        let vigente = null;
        let danado = null;
        let crudo = null;
        let arreglos = 0;
        try {
            crudo = localStorage.getItem(claves.datos);
            if (crudo !== null) {
                let guardados = null;
                try {
                    guardados = JSON.parse(crudo);
                } catch {
                    guardados = null;
                }
                if (!esObjeto(guardados)) danado = crudo;
                else if (guardados.version === version) {
                    const estado = revisarGuardados(guardados);
                    if (!estado.ok) danado = crudo;
                    else {
                        arreglos = estado.arreglos;
                        const sinUso = Date.now() - Number(guardados.usadoEl || 0);
                        if (guardados.armadoEl === hoyLocal() && sinUso >= 0 && sinUso < SIN_USO_RENUEVA) vigente = guardados;
                        else if (hayTurnoAbierto(guardados)) turno = { guardados, sinUso };
                        else deOtroDia = true;
                    }
                }
            }
        } catch {
            danado = null;
        }
        const arreglar = () => {
            const conCopia = guardarCopia(crudo);
            persistir();
            avisarAlUsuario(`${MENSAJE_REPARADO}${conCopia ? SUFIJO_COPIA : ""}`);
        };
        if (vigente) {
            cache = vigente;
            if (arreglos) arreglar();
            return cache;
        }
        if (turno) {
            cache = turno.guardados;
            if (turno.sinUso >= SIN_USO_RENUEVA) preguntarPorElTurno(turno.sinUso);
            else cache.armadoEl = hoyLocal();
            if (arreglos) arreglar();
            return cache;
        }
        const conCopia = danado !== null && guardarCopia(danado);
        cache = { ...semilla(), version, armadoEl: hoyLocal(), usadoEl: Date.now() };
        olvidarAvisos(prefijo); // datos nuevos: los avisos entre roles arrancan de cero (kit/avisos.js)
        persistir();
        if (danado !== null) avisarAlUsuario(`${MENSAJE_DANADO}${conCopia ? SUFIJO_COPIA : ""}`);
        else if (deOtroDia && typeof document !== "undefined" && document.body) aviso(MENSAJE_RENOVADOS, "info");
        return cache;
    }

    /** La próxima lectura vuelve a leer el localStorage (lo cambió otra pestaña). */
    function olvidarCache() {
        cache = null;
        let borrados = false;
        try {
            borrados = localStorage.getItem(claves.datos) === null;
        } catch {
            borrados = false;
        }
        if (borrados) dispatchEvent(new CustomEvent(EVENTO_REINICIO, { detail: { prefijo } }));
    }

    /** "Empezar de cero": borra los datos de ESTA demo; al volver a leerlos aparecen los de fábrica. */
    function reiniciar() {
        cache = null;
        revisionPropia = null;
        olvidarAvisos(prefijo);
        yaAviso = false;
        try {
            localStorage.removeItem(claves.datos);
            localStorage.removeItem(claves.revision);
            localStorage.removeItem(claves.copia);
        } catch {
            // nada que borrar
        }
        dispatchEvent(new CustomEvent(EVENTO_REINICIO, { detail: { prefijo } }));
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

    return { prefijo, claves, db, persistir, olvidarCache, reiniciar, leerSesion, guardarSesion, copiaDanada };
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
/**
 * Id corto que no se repite: momento + contador + azar. El contador no vuelve a cero (antes daba la vuelta cada 1296 y,
 * creando miles en el mismo milisegundo, dos podían coincidir: lo marcó la prueba de 3.000 ids el 09/10).
 */
export const nuevoId = (prefijo) =>
    `${prefijo}-${Date.now().toString(36)}${(contadorIds++).toString(36).padStart(2, "0")}${Math.random().toString(36).slice(2, 5)}`;
export const ahora = () => new Date().toISOString();

/** Busca por id en una lista; si no está, da el error que se le pase. */
export function buscar(lista, id, mensaje = "Eso ya no existe.") {
    const x = lista.find((e) => e.id === id);
    if (!x) throw new Error(mensaje);
    return x;
}
