// ============================================
// Piezas que comparten las pantallas de Sazzo Contable: logo y nombre de la empresa, selector de mes, pastilla del
// tipo de comprobante, tablas con scroll propio (la página nunca se corre de costado) y el "Pidiendo CAE a ARCA…".
// Todo lo que viene de los datos pasa por esc().
// ============================================
import { esc, fechaCorta } from "../../kit/js/ui.js?v=be942dc467";
import { ultimosPeriodos, nombrePeriodo, periodoActual, COMPROBANTES, CONDICIONES, formatoCuit } from "../reglas.js?v=be942dc467";
import { buscarPersona } from "../marca.js?v=be942dc467";

export { fechaCorta };

/** "09/10" (día y mes, para listas). */
export const diaMes = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");

/** Hace cuántos días ("hace 52 días", "hoy"). */
export function haceDias(fecha) {
    if (!fecha) return "";
    const [a, m, d] = fecha.split("-").map(Number);
    const hoy = new Date();
    const dias = Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(a, m - 1, d)) / 864e5);
    return dias <= 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`;
}

export const nombreDe = (id) => buscarPersona(id)?.nombre ?? "Alguien";
export const condicionTexto = (c) => CONDICIONES[c]?.texto ?? c;

/** CUIT con guiones, DNI o "—". */
export function documento({ cuit, doc } = {}) {
    if (cuit) return `CUIT ${formatoCuit(cuit)}`;
    if (doc) return `DNI ${doc}`;
    return "Sin identificar";
}

/** El logo de la empresa (si subió uno) o sus iniciales en un cuadradito del color de la demo. */
export function logoEmpresa(e, clase = "logo-empresa") {
    if (e.logo) return `<img class="${esc(clase)}" src="${esc(e.logo)}" alt="Logo de ${esc(e.razonSocial)}">`;
    const iniciales = (e.fantasia || e.razonSocial).split(/\s+/).filter((p) => /^[\p{L}\d]/u.test(p)).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
    return `<span class="${esc(clase)} ${esc(clase)}--iniciales" aria-hidden="true">${esc(iniciales || "?")}</span>`;
}

/** Pastilla "FA", "FB", "NCA"… con la letra marcada. */
export function pastillaTipo(tipo) {
    const t = COMPROBANTES[tipo];
    return `<span class="tipo tipo--${esc(t.letra)}${t.clase === "nc" ? " tipo--nc" : ""}" title="${esc(t.nombre)}">${esc(t.corto)}</span>`;
}

/** El período pedido en el link (?p=2026-10) si es uno de los últimos 12; si no, el actual. */
export function periodoPedido(consulta) {
    const p = consulta?.get("p");
    return p && ultimosPeriodos(12).includes(p) ? p : periodoActual();
}

/** Selector de mes: cambia el ?p= de la ruta (así "Atrás" vuelve al mes anterior que se miraba). */
export function htmlSelectorMes(periodo, id = "mes") {
    const opciones = ultimosPeriodos(12).reverse();
    return `
        <label class="selector-mes"><span class="visualmente-oculto">Mes</span>
            <i class="ti ti-calendar" aria-hidden="true"></i>
            <select id="${esc(id)}">
                ${opciones.map((p) => `<option value="${esc(p)}"${p === periodo ? " selected" : ""}>${esc(nombrePeriodo(p))}${p === periodoActual() ? " (este mes)" : ""}</option>`).join("")}
            </select>
        </label>`;
}

export function activarSelectorMes(cont, ruta, extra = "", id = "mes") {
    cont.querySelector(`#${id}`)?.addEventListener("change", (e) => {
        location.hash = `#${ruta}?p=${encodeURIComponent(e.target.value)}${extra}`;
    });
}

/**
 * Tabla con scroll propio. columnas: [{ titulo, clase? }]; filas: arrays de celdas (HTML ya escapado);
 * pie: una fila de totales (opcional).
 */
export function htmlTabla(columnas, filas, { pie = null, vacia = "No hay nada para mostrar.", etiqueta = "" } = {}) {
    if (!filas.length) return `<p class="nota"><i class="ti ti-info-circle"></i> ${esc(vacia)}</p>`;
    const celda = (c, i, tag = "td") => `<${tag}${columnas[i]?.clase ? ` class="${esc(columnas[i].clase)}"` : ""}>${c}</${tag}>`;
    return `
        <div class="tabla-scroll" tabindex="0" role="region" aria-label="${esc(etiqueta || "Tabla")}">
            <table class="tabla">
                <thead><tr>${columnas.map((c, i) => celda(esc(c.titulo), i, "th")).join("")}</tr></thead>
                <tbody>${filas.map((f) => `<tr>${f.map((c, i) => celda(c, i)).join("")}</tr>`).join("")}</tbody>
                ${pie ? `<tfoot><tr>${pie.map((c, i) => celda(c, i)).join("")}</tr></tfoot>` : ""}
            </table>
        </div>`;
}

/**
 * La ventanita "Pidiendo CAE a ARCA…" (o lo que se le pase) mientras corre `trabajo`. En la demo ARCA es simulado:
 * la espera es corta y a propósito, para que se vea el paso. Devuelve lo que devuelva `trabajo`.
 */
export async function conEspera(texto, trabajo, ms = 1100) {
    const capa = document.createElement("div");
    capa.className = "espera-arca";
    capa.setAttribute("role", "status");
    capa.innerHTML = `<div class="espera-arca__caja"><span class="espera-arca__giro" aria-hidden="true"></span><p></p><small>ARCA simulado · modo prueba</small></div>`;
    capa.querySelector("p").textContent = texto;
    document.body.append(capa);
    const rapido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
        await new Promise((ok) => setTimeout(ok, rapido ? 200 : ms));
        return await trabajo();
    } finally {
        capa.remove();
    }
}
