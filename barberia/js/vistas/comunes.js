// ============================================
// Piezas que comparten las pantallas de Sazzo Barbería: el botón del recorrido (del kit), pastillas, los días en
// pastillas y la ventanita del mensaje para copiar (del kit). Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=c8544b412e";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=c8544b412e";
import { buscarPersona } from "../marca.js?v=c8544b412e";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const ESTADOS = {
    reservado: { texto: "Reservado", clase: "suave" },
    llego: { texto: "Llegó", clase: "bien" },
    falto: { texto: "Faltó", clase: "mal" },
    cancelado: { texto: "Cancelado", clase: "suave" }
};

export function pastillaEstado(estado) {
    const e = ESTADOS[estado] ?? ESTADOS.reservado;
    return `<span class="pastilla pastilla--${e.clase}">${esc(e.texto)}</span>`;
}

const mayuscula = (t) => t[0].toUpperCase() + t.slice(1);

/** Los próximos 7 días en pastillas; los cerrados, apagados. */
export function chipsDias(dias, actual) {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" data-dia="${esc(d.fecha)}"${d.cerrado ? " disabled title=\"Cerrado\"" : ""}>${esc(mayuscula(d.nombre))}${d.cerrado ? " · cerrado" : ""}</button>`).join("")}
    </div>`;
}

// La ventanita del mensaje para copiar es del kit (kit/mensaje.js)
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=c8544b412e";
