// ============================================
// Piezas que comparten las pantallas de Sazzo Taller: el botón del recorrido y el mensaje para copiar (del kit), la
// patente dibujada como chapa y la pastilla del estado de una orden. Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=a1bc4c3709";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=a1bc4c3709";
import { fechaLocalISO } from "../../kit/js/fechas.js?v=a1bc4c3709";
import { buscarPersona } from "../marca.js?v=a1bc4c3709";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=a1bc4c3709";

/** La patente como una chapa (con la franja de arriba). */
export const chapa = (texto, grande = false) => `<span class="chapa${grande ? " chapa--grande" : ""}">${esc(texto)}</span>`;

const CLASE = { recibido: "suave", presupuestado: "info", reparacion: "info", esperando: "ojo", listo: "bien", entregado: "suave", anulado: "mal" };

export function pastillaEstado(o) {
    const clase = o.estado === "listo" && !o.avisado ? "alerta" : CLASE[o.estado];
    return `<span class="pastilla pastilla--${clase}">${esc(o.estadoTexto)}</span>`;
}

/** "para hoy", "para mañana", "para el 12/10" o "atrasado (era para el 07/10)". */
export function textoPromesa(o) {
    const hoy = fechaLocalISO(0);
    const [, m, d] = o.prometida.split("-");
    if (o.estado === "listo" || o.estado === "entregado") return "";
    if (o.prometida < hoy) return `<span class="atrasado">atrasado (era para el ${esc(d)}/${esc(m)})</span>`;
    if (o.prometida === hoy) return "para hoy";
    if (o.prometida === fechaLocalISO(1)) return "para mañana";
    return `para el ${esc(d)}/${esc(m)}`;
}
