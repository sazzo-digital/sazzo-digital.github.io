// ============================================
// Piezas que comparten las pantallas de Sazzo Kiosco: el botón del recorrido (del kit), la pastilla de stock y
// "hace cuánto". Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=d78e90c63f";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=d78e90c63f";
import { buscarPersona } from "../marca.js?v=d78e90c63f";

/** Botón del recorrido con la persona de Kiosco: guia("u-dueno", "/stock/aumento", "Pasá a Rubén…"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const STOCK = {
    sin: { texto: "No hay", clase: "mal", icono: "ti-circle-x" },
    pedir: { texto: "Hay que pedir", clase: "ojo", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "bien", icono: "ti-circle-check" }
};

export function pastillaStock(p) {
    const e = STOCK[p.estado];
    return `<span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}${p.estado === "sin" ? "" : ` · ${esc(p.stock)}`}</span>`;
}

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
