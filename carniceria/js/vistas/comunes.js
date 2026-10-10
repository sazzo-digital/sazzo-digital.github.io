// ============================================
// Piezas que comparten las pantallas de Sazzo Carnicería: el botón del recorrido (del kit), las pastillas de stock y
// de estado de un pedido, los pasos de un pedido (pedido → listo → retirado), "hace cuánto" y el campo de kilos.
// Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=ece442dfab";
import { diaLocalDe, fechaLocalISO } from "../../kit/js/fechas.js?v=ece442dfab";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=ece442dfab";
import { ESTADOS_PEDIDO, TOPES, kilos, pesos } from "../datos.js?v=ece442dfab";
import { buscarPersona } from "../marca.js?v=ece442dfab";

/** Botón del recorrido con la persona de la carnicería: guia("u-empleado", "/pedidos", "Mirá lo que le llega a Darío"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const STOCK = {
    sin: { texto: "No hay", clase: "mal", icono: "ti-circle-x" },
    despostar: { texto: "Hay que despostar", clase: "ojo", icono: "ti-alert-triangle" },
    pedir: { texto: "Hay que pedir", clase: "ojo", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "bien", icono: "ti-circle-check" }
};

/** Cuánto hay: "4,200 kg" o "12 u.". */
export const cuantoHay = (a, cantidad = a.stock) => (a.venta === "kg" ? kilos(cantidad) : `${cantidad} u.`);

export function pastillaStock(a) {
    const e = STOCK[a.estado];
    return `<span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}${a.estado === "sin" ? "" : ` · ${esc(cuantoHay(a))}`}</span>`;
}

/** "$ 14.500/kg" o "$ 6.500 c/u". */
export const precioDe = (a) => `${pesos(a.precio)}${a.venta === "kg" ? "/kg" : " c/u"}`;

const ESTADO = { nuevo: "ojo", listo: "bien", entregado: "neutra", anulado: "mal" };
const ICONO_ESTADO = { nuevo: "ti-clipboard-list", listo: "ti-package", entregado: "ti-circle-check", anulado: "ti-ban" };

export const pastillaEstado = (estado) =>
    `<span class="pastilla pastilla--${ESTADO[estado]}"><i class="ti ${ICONO_ESTADO[estado]}" aria-hidden="true"></i>${esc(ESTADOS_PEDIDO[estado])}</span>`;

/** Los tres pasos de un pedido, con el que va marcado. */
export function pasos(pe) {
    if (pe.estado === "anulado") return `<p class="nota"><i class="ti ti-ban"></i> Este pedido se anuló${pe.anuladoPor ? ` (${esc(pe.anuladoPor)})` : ""}.</p>`;
    const hecho = { nuevo: 1, listo: 2, entregado: 3 }[pe.estado];
    const paso = (n, texto, cuando_) => `
        <li class="pasos__paso${n <= hecho ? " pasos__paso--hecho" : ""}${n === hecho + 1 ? " pasos__paso--sigue" : ""}">
            <span class="pasos__numero" aria-hidden="true">${n <= hecho ? '<i class="ti ti-check"></i>' : n}</span>
            <span>${texto}${cuando_ ? `<small>${esc(cuando_)}</small>` : ""}</span>
        </li>`;
    return `<ol class="pasos" aria-label="Cómo va el pedido">
        ${paso(1, "Pedido", pe.creado ? cuando(pe.creado) : "")}
        ${paso(2, "Listo", pe.listo ? cuando(pe.listo) : "")}
        ${paso(3, "Retirado", pe.entregado ? cuando(pe.entregado) : "")}
    </ol>`;
}

/** Lo que se pidió de un renglón: "1,500 kg", "$ 8.000 de picada" o "2 u.". */
export function loPedido(i) {
    if (i.modo === "plata") return `${pesos(i.pedidoPesos)} (≈ ${kilos(i.pedidoGCalculado)})`;
    if (i.modo === "unidad") return `${i.unidades} u.`;
    return kilos(i.pedidoG);
}

/** Tarjeta corta de un pedido (en Pedidos y en Mis pedidos). */
export const tarjetaPedido = (pe, href) => `
    <li><a class="tarjeta tarjeta--link pedido pedido--${esc(pe.estado)}" href="${esc(href)}">
        <div class="tarjeta__fila">
            <span class="tarjeta__titulo"><i class="ti ti-clipboard-list" aria-hidden="true"></i>N° ${esc(pe.numero)} · ${esc(pe.para)}</span>
            ${pastillaEstado(pe.estado)}
        </div>
        <p class="tarjeta__quien">${esc(pe.items.map((i) => i.nombre).join(", "))}</p>
        <p class="tarjeta__quien">${pe.origen === "web" ? '<i class="ti ti-device-mobile" aria-hidden="true"></i> Desde el celu' : '<i class="ti ti-building-store" aria-hidden="true"></i> En el mostrador'} · retira ${esc(pe.retiro === "Lo antes posible" ? "lo antes posible" : `a las ${pe.retiro}`)} · <b>${esc(pesos(pe.total))}</b>${pe.real === null ? " aprox." : ""}</p>
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

/** Un campo para escribir kilos (teclado con coma en el celular). */
export const campoKg = ({ nombre = "kg", valor = "", placeholder = "Ej: 1,625", etiqueta = "", requerido = false } = {}) => `
    <input name="${esc(nombre)}" type="text" inputmode="decimal" autocomplete="off" maxlength="9" pattern="[0-9]{1,5}([.,][0-9]{1,3})?"
        value="${esc(valor)}" placeholder="${esc(placeholder)}"${etiqueta ? ` aria-label="${esc(etiqueta)}"` : ""}${requerido ? " required" : ""}>`;

/** Los kilos para mostrar en un campo ("1,625"). */
export const kgEnCampo = (gramos) => (gramos === null || gramos === undefined ? "" : (gramos / 1000).toLocaleString("es-AR", { maximumFractionDigits: 3, useGrouping: false }));

/** "+3,4 %" / "−12,0 %" (diferencia contra lo esperado). */
export const porcentaje = (dif) => `${dif > 0 ? "+" : dif < 0 ? "−" : ""}${Math.abs(dif * 100).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/** "24,1 %" */
export const unDecimal = (n) => `${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

export const TOPE_KG_TEXTO = `${TOPES.gramos / 1000} kg`;
