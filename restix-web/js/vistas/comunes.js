// ============================================
// Piezas que comparten las pantallas de Restix Sazzo: el botón del recorrido (del kit), el ticket de una comanda
// (cocina o barra) y "hace cuánto". Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=342460e565";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=342460e565";
import { buscarPersona } from "../marca.js?v=342460e565";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const haceMin = (m) => (m < 1 ? "recién" : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h ${m % 60} min`);

/** Un ticket como los que imprime Restix en la cocina y en la barra. */
export function ticket(c, { titulo = c.destino === "cocina" ? "Cocina" : "Barra" } = {}) {
    return `
        <article class="ticket ticket--${esc(c.destino)}">
            <header><b><i class="ti ${c.destino === "cocina" ? "ti-tools-kitchen-2" : "ti-glass-full"}" aria-hidden="true"></i> ${esc(titulo)}</b><span>${esc(c.mesa)} · ${esc(hora(c.creadaEn))}</span></header>
            <ul>${c.items.map((i) => `<li><b>${esc(i.cantidad)}</b> ${esc(i.nombre)}</li>`).join("")}</ul>
        </article>`;
}
