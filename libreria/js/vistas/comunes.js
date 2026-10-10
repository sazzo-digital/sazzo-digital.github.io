// ============================================
// Piezas que comparten las pantallas de Sazzo Librería: el botón del recorrido (del kit), las pastillas de stock y
// de estado de un pedido, los pasos de una lista (pedida → separada → entregada) y "hace cuánto".
// Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=114958267d";
import { diaLocalDe, fechaLocalISO } from "../../kit/js/fechas.js?v=114958267d";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=114958267d";
import { ESTADOS_PEDIDO, pesos } from "../datos.js?v=114958267d";
import { buscarPersona } from "../marca.js?v=114958267d";

/** Botón del recorrido con la persona de Librería: guia("u-empleado", "/listas", "Mirá lo que le llega a Joaquín"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const STOCK = {
    sin: { texto: "No hay", clase: "mal", icono: "ti-circle-x" },
    pedir: { texto: "Hay que pedir", clase: "ojo", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "bien", icono: "ti-circle-check" },
    servicio: { texto: "Servicio", clase: "neutra", icono: "ti-printer" }
};

export function pastillaStock(p) {
    const e = STOCK[p.estado];
    const cuantos = p.estado === "sin" || p.estado === "servicio" ? "" : ` · ${esc(p.stock)}`;
    return `<span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}${cuantos}</span>`;
}

const ESTADO = { nueva: "ojo", separada: "bien", entregada: "neutra", anulada: "mal" };
const ICONO_ESTADO = { nueva: "ti-clipboard-list", separada: "ti-package", entregada: "ti-circle-check", anulada: "ti-ban" };

export const pastillaEstado = (estado) =>
    `<span class="pastilla pastilla--${ESTADO[estado]}"><i class="ti ${ICONO_ESTADO[estado]}" aria-hidden="true"></i>${esc(ESTADOS_PEDIDO[estado])}</span>`;

/** Los tres pasos de una lista, con el que va marcado. */
export function pasos(pe) {
    if (pe.estado === "anulada") return `<p class="nota"><i class="ti ti-ban"></i> Esta lista se anuló${pe.anuladoPor ? ` (${esc(pe.anuladoPor)})` : ""}.</p>`;
    const hecho = { nueva: 1, separada: 2, entregada: 3 }[pe.estado];
    const paso = (n, texto, cuando) => `
        <li class="pasos__paso${n <= hecho ? " pasos__paso--hecho" : ""}${n === hecho + 1 ? " pasos__paso--sigue" : ""}">
            <span class="pasos__numero" aria-hidden="true">${n <= hecho ? '<i class="ti ti-check"></i>' : n}</span>
            <span>${texto}${cuando ? `<small>${esc(cuando)}</small>` : ""}</span>
        </li>`;
    return `<ol class="pasos" aria-label="Cómo va la lista">
        ${paso(1, "Pedida", pe.creado ? cuando(pe.creado) : "")}
        ${paso(2, "Separada", pe.separado ? cuando(pe.separado) : "")}
        ${paso(3, "Retirada", pe.entregado ? cuando(pe.entregado) : "")}
    </ol>`;
}

/** Tarjeta corta de un pedido de lista (en Listas y en Mis pedidos). */
export const tarjetaPedido = (pe, href) => `
    <li><a class="tarjeta tarjeta--link pedido pedido--${esc(pe.estado)}" href="${esc(href)}">
        <div class="tarjeta__fila">
            <span class="tarjeta__titulo"><i class="ti ti-school" aria-hidden="true"></i>N° ${esc(pe.numero)} · ${esc(pe.para)}</span>
            ${pastillaEstado(pe.estado)}
        </div>
        <p class="tarjeta__quien">${esc(pe.lista)} · ${esc(pe.articulos)} artículos · <b>${esc(pesos(pe.total))}</b></p>
        <p class="tarjeta__quien">${pe.origen === "web" ? '<i class="ti ti-device-mobile" aria-hidden="true"></i> Pedida desde el celu' : '<i class="ti ti-building-store" aria-hidden="true"></i> En el mostrador'} · ${esc(cuando(pe.creado))}${pe.faltan && pe.estado !== "anulada" ? ` · <span class="falta">${esc(pe.faltan)} ${pe.faltan === 1 ? "falta" : "faltan"}</span>` : ""}</p>
    </a></li>`;

/** "hoy", "ayer", "hace 5 días". */
export function haceDias(iso) {
    if (!iso) return "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    const dias = Math.round((hoy - d) / 864e5);
    return dias <= 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`;
}

export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "hoy 15:20", "ayer 10:05" o "hace 3 días". */
export function cuando(iso) {
    const dia = diaLocalDe(iso);
    if (dia === fechaLocalISO(0)) return `hoy ${hora(iso)}`;
    if (dia === fechaLocalISO(-1)) return `ayer ${hora(iso)}`;
    return haceDias(iso);
}
