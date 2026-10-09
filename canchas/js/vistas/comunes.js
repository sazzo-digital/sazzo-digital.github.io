// ============================================
// Piezas que comparten las pantallas de Sazzo Canchas: el botón del recorrido (del kit), las pastillas de la seña
// y del estado, y los días en pastillas. Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=8803abd1ef";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=8803abd1ef";
import { SENAS } from "../datos.js?v=8803abd1ef";
import { buscarPersona } from "../marca.js?v=8803abd1ef";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const CLASE_SENA = { pagada: "bien", pendiente: "ojo", devuelta: "suave", perdida: "mal" };

export const pastillaSena = (sena) => (sena ? `<span class="pastilla pastilla--${CLASE_SENA[sena]}">${esc(SENAS[sena])}</span>` : "");

const ESTADOS = {
    reservado: { texto: "Reservado", clase: "suave" },
    llegaron: { texto: "Llegaron", clase: "bien" },
    faltaron: { texto: "Faltaron", clase: "mal" },
    cancelado: { texto: "Cancelado", clase: "suave" },
    liberado: { texto: "Liberado", clase: "suave" }
};

export function pastillaEstado(estado) {
    const e = ESTADOS[estado] ?? ESTADOS.reservado;
    return `<span class="pastilla pastilla--${e.clase}">${esc(e.texto)}</span>`;
}

/** "Hoy · Mañana · sábado 10/10…" en pastillas; `actual` la fecha elegida. */
export function chipsDias(dias, actual, atributo = "data-dia") {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" ${atributo}="${esc(d.fecha)}">${esc(d.nombre[0].toUpperCase() + d.nombre.slice(1))}</button>`).join("")}
    </div>`;
}
