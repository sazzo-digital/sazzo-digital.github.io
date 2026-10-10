// ============================================
// Avisos entre roles (10/10/2026; la idea y el diseño salieron de Ferretería). Para probar la demo solo, desde un
// mismo celular, haciendo de todas las personas: lo que hace una le "llega" a la otra con una tarjeta llamativa que
// baja desde arriba ("¡Pedido nuevo!", con campanita, ding y vibración), y el botón del menú muestra cuántos hay.
//
// Cada demo arma la lista de hechos (todos, para todas las personas) en su vistas/avisos.js → avisosDe(datos), y se
// la pasa a pintarMarco({ …, avisos: () => avisosDe(datos) }). Cada hecho:
//   { id: "pedido-p7", estado: "pedido",          → la clave: si cambia el estado, vuelve a avisar
//     para: ["dueno", "u-dario"],                 → roles o ids de persona que lo ven
//     de: "u-claudia",                            → quién lo hizo (a esa persona no se le avisa)
//     titulo: "¡Pedido nuevo!", linea: "Claudia · 1,5 kg de asado", chico: "Para retirar hoy",
//     boton: "Verlo", ruta: "/pedidos/p7", menu: "/pedidos",   → adónde lleva y qué botón del menú lleva el numerito
//     icono: "ti-bell-ringing", tono: "bien" }    → tono "bien" (verde) para lo bueno: aceptó, pagó, está listo
// El kit muestra solo lo NUEVO: lo que ya estaba la primera vez que se miró (los datos de ejemplo) queda como "base".
// Cada persona lo ve una vez. Queda en el navegador (<prefijo>-avisos); cuando los datos se arman de nuevo ("Empezar
// de cero" o datos renovados) se borra (guardado.js → olvidarAvisos). Funciona en el mismo aparato o en dos pestañas;
// en dos celulares distintos no (los datos viven en cada navegador).
// ============================================
import { esc } from "./ui.js?v=3ddc591303";

const TOPE_VISTOS = 300; // por persona (los más viejos se van)
const TOPE_BASE = 2000;
const claveAvisos = (prefijo) => `${prefijo}-avisos`;
const enMemoria = new Map(); // sin localStorage: hasta recargar
const anunciados = new Set(); // lo que ya sonó en esta visita (no vuelve a sonar al cambiar de pantalla)

function leer(prefijo) {
    try {
        const guardado = JSON.parse(localStorage.getItem(claveAvisos(prefijo)));
        return guardado && Array.isArray(guardado.base) ? guardado : null;
    } catch {
        return enMemoria.get(prefijo) ?? null;
    }
}

function guardar(prefijo, estado) {
    enMemoria.set(prefijo, estado);
    try {
        localStorage.setItem(claveAvisos(prefijo), JSON.stringify(estado));
    } catch {
        // queda en memoria
    }
}

export function olvidarAvisos(prefijo) {
    enMemoria.delete(prefijo);
    try {
        localStorage.removeItem(claveAvisos(prefijo));
    } catch {
        // nada que borrar
    }
}

const claveDe = (a) => `${a.id}:${a.estado ?? ""}`;
const esPara = (a, usuario) => (Array.isArray(a.para) ? a.para : []).some((p) => p === usuario.rol || p === usuario.id);
const revisar = (todos) => (Array.isArray(todos) ? todos : []).filter((a) => a && typeof a.id === "string" && a.id);

/** Lo nuevo para esta persona, en el orden que vino. La primera vez, todo lo que hay queda como base. */
export function avisosNuevos(prefijo, usuario, todos) {
    const lista = revisar(todos);
    let estado = leer(prefijo);
    if (!estado) {
        estado = { base: lista.map(claveDe).slice(-TOPE_BASE), vistos: {} };
        guardar(prefijo, estado);
    }
    const base = new Set(estado.base);
    const vistos = new Set(estado.vistos?.[usuario.id] ?? []);
    return lista.filter((a) => esPara(a, usuario) && a.de !== usuario.id && !base.has(claveDe(a)) && !vistos.has(claveDe(a)));
}

export function marcarAvisoVisto(prefijo, usuario, aviso) {
    const estado = leer(prefijo) ?? { base: [], vistos: {} };
    const suyos = (estado.vistos?.[usuario.id] ?? []).filter((c) => c !== claveDe(aviso));
    suyos.push(claveDe(aviso));
    estado.vistos = { ...(estado.vistos ?? {}), [usuario.id]: suyos.slice(-TOPE_VISTOS) };
    guardar(prefijo, estado);
}

/** Un "ding-dong" cortito hecho por código (sin archivos) y una vibración. Si el navegador no deja, no pasa nada. */
export function sonarAviso() {
    if (typeof window === "undefined" || window.__sazzoQuieto) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [[988, 0], [784, 0.16]].forEach(([frecuencia, desde]) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = frecuencia;
            g.gain.setValueAtTime(0.0001, ctx.currentTime + desde);
            g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + desde + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + desde + 0.45);
            o.connect(g).connect(ctx.destination);
            o.start(ctx.currentTime + desde);
            o.stop(ctx.currentTime + desde + 0.5);
        });
        setTimeout(() => ctx.close(), 1200);
    } catch {
        // sin sonido
    }
    navigator.vibrate?.([120, 60, 120]);
}

/** Los numeritos de los botones del menú (cuántos avisos llevan a cada uno). */
function pintarNumeritos(app, lista) {
    app.querySelectorAll(".menu__aviso").forEach((n) => n.remove());
    const porMenu = new Map();
    lista.forEach((a) => {
        const menu = a.menu ?? a.ruta;
        if (menu) porMenu.set(menu, (porMenu.get(menu) ?? 0) + 1);
    });
    porMenu.forEach((cuantos, menu) => {
        const item = [...app.querySelectorAll(".menu__item")].find((el) => el.dataset.ruta === menu);
        item?.insertAdjacentHTML("beforeend", `<span class="menu__aviso" aria-label="${cuantos} ${cuantos === 1 ? "aviso" : "avisos"}">${cuantos > 9 ? "9+" : cuantos}</span>`);
    });
}

const rutaActual = () => location.hash.replace(/^#/, "").split("?")[0];
const rutaSegura = (r) => (typeof r === "string" && /^\/[\w\-/]{0,80}$/.test(r) ? r : null);

/** Pinta (o saca) el aviso de arriba y los numeritos. Lo llama el marco después de cada pantalla. */
export async function pintarAvisos(app, { prefijo, usuario, avisos }) {
    if (!app || !usuario || typeof avisos !== "function") return;
    let todos;
    try {
        todos = await avisos();
    } catch (e) {
        console.warn("[avisos]", e);
        return;
    }
    if (!app.isConnected) return;
    app.querySelector(".aviso-rol")?.remove();
    const ruta = rutaActual();
    const lista = avisosNuevos(prefijo, usuario, todos).filter((a) => rutaSegura(a.ruta) !== ruta); // lo que ya mira no se anuncia
    pintarNumeritos(app, lista);
    const a = lista[0];
    if (!a) return;
    const claveSonido = `${prefijo}:${usuario.id}:${claveDe(a)}`;
    const recien = !anunciados.has(claveSonido);
    anunciados.add(claveSonido);
    const icono = /^ti-[a-z0-9-]{1,40}$/.test(a.icono ?? "") ? a.icono : "ti-bell-ringing";
    const destino = rutaSegura(a.ruta);
    app.insertAdjacentHTML("beforeend", `
        <div class="aviso-rol${a.tono === "bien" ? " aviso-rol--bien" : ""}${recien ? " aviso-rol--recien" : ""}" role="alert">
            <span class="aviso-rol__campana" aria-hidden="true"><i class="ti ${esc(icono)}"></i></span>
            <div class="aviso-rol__texto">
                <b>${esc(String(a.titulo ?? "¡Novedad!").slice(0, 60))}</b>
                ${a.linea ? `<span>${esc(String(a.linea).slice(0, 90))}</span>` : ""}
                ${a.chico || lista.length > 1 ? `<small>${esc(String(a.chico ?? "").slice(0, 90))}${lista.length > 1 ? `${a.chico ? " · " : ""}y ${lista.length - 1} más` : ""}</small>` : ""}
            </div>
            <div class="aviso-rol__botones">
                ${destino ? `<button class="boton" type="button" data-ver><i class="ti ti-arrow-right" aria-hidden="true"></i> ${esc(String(a.boton ?? "Verlo").slice(0, 30))}</button>` : ""}
                <button class="boton-icono aviso-rol__cerrar" type="button" data-cerrar aria-label="Cerrar el aviso"><i class="ti ti-x"></i></button>
            </div>
        </div>`);
    const caja = app.querySelector(".aviso-rol");
    caja.querySelector("[data-ver]")?.addEventListener("click", () => {
        marcarAvisoVisto(prefijo, usuario, a);
        caja.remove();
        if (`#${destino}` === location.hash) pintarAvisos(app, { prefijo, usuario, avisos });
        else location.hash = `#${destino}`;
    });
    caja.querySelector("[data-cerrar]").addEventListener("click", () => {
        marcarAvisoVisto(prefijo, usuario, a);
        pintarAvisos(app, { prefijo, usuario, avisos });
    });
    if (recien) sonarAviso();
}
