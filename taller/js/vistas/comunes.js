// ============================================
// Piezas que comparten las pantallas de Sazzo Taller: el botón del recorrido y el mensaje para copiar (del kit), la
// patente dibujada como chapa y la pastilla del estado de una orden. Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=3118e0dd89";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=3118e0dd89";
import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=3118e0dd89";
import { fechaLocalISO } from "../../kit/js/fechas.js?v=3118e0dd89";
import { buscarPersona, MARCA } from "../marca.js?v=3118e0dd89";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=3118e0dd89";

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

const CONSIGNAS = {
    dueno: [
        ["Tocá “Entró un auto”, escribí la patente AB 123 CD, completá lo que pide y tocá “Guardar orden”.", "Se arma la orden y le llega al mecánico."],
        ["Abrí el Fiat Palio, que ya tiene el presupuesto mandado, y tocá “Aprobado”.", "Pasa a reparación y el mecánico lo ve."],
        ["Abrí la Renault Kangoo, que está lista, tocá “Avisar que está listo” y después “Sí, lo mandé”.", "Te arma el mensaje para la clienta."]
    ],
    mecanico: [
        ["Abrí el Chevrolet Corsa, anotá lo que encontraste y tocá “Guardar”.", "Raúl lo ve para mandar el presupuesto."],
        ["Abrí el Chevrolet Onix y tocá “Llegó el repuesto”.", "Vuelve a reparación."],
        ["Abrí el Ford Ka y tocá “Terminado”.", "Raúl ve que está listo para avisarle al cliente."]
    ]
};

export function consignaPersona(datos, usuario) {
    const paso = datos.pasos(usuario).findIndex((hecho) => !hecho);
    if (paso < 0) return htmlConsignaFinal(MARCA, 3);
    const [accion, resultado] = CONSIGNAS[usuario.rol][paso];
    return htmlConsigna({ paso: paso + 1, total: 3, accion, resultado });
}

export const activarPasos = (cont) => activarConsigna(cont, MARCA);
