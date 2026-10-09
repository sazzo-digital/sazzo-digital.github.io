// ============================================
// Piezas que comparten las pantallas de Sazzo Perfumería: el frasco dibujado (un color por familia: nada de fotos ni
// marcas reales), el carrito de Julieta (queda mientras se navega), el botón del recorrido y el mensaje para copiar
// (del kit). Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=c76a163ed1";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=c76a163ed1";
import { FAMILIAS } from "../datos.js?v=c76a163ed1";
import { buscarPersona } from "../marca.js?v=c76a163ed1";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=c76a163ed1";

/** Un frasco de perfume dibujado, del color de su familia. */
export function frasco(familia, grande = false) {
    const color = FAMILIAS[familia]?.color ?? "#999";
    return `<svg class="frasco${grande ? " frasco--grande" : ""}" viewBox="0 0 64 80" aria-hidden="true">
        <rect x="24" y="4" width="16" height="10" rx="2" fill="currentColor" opacity=".55"/>
        <rect x="28" y="14" width="8" height="8" fill="currentColor" opacity=".35"/>
        <rect x="10" y="22" width="44" height="52" rx="12" fill="${esc(color)}" opacity=".85"/>
        <rect x="16" y="30" width="8" height="34" rx="4" fill="#fff" opacity=".35"/>
        <rect x="22" y="44" width="20" height="12" rx="2" fill="#fff" opacity=".7"/>
    </svg>`;
}

// El carrito: "perfumeId/presentacion" → cantidad
export const carrito = new Map();
export const itemsDelCarrito = () => [...carrito].map(([clave, cantidad]) => {
    const [perfumeId, presentacion] = clave.split("/");
    return { perfumeId, presentacion, cantidad };
});
export const unidadesEnCarrito = () => [...carrito.values()].reduce((a, b) => a + b, 0);

const ESTADOS = {
    nuevo: { texto: "Nuevo", clase: "alerta" },
    preparado: { texto: "Preparado · para retirar", clase: "bien" },
    entregado: { texto: "Entregado", clase: "suave" },
    cancelado: { texto: "Cancelado", clase: "mal" }
};
export function pastillaPedido(o) {
    const e = ESTADOS[o.estado];
    return `<span class="pastilla pastilla--${e.clase}">${esc(e.texto)}${o.estado === "preparado" && o.avisado ? " · avisada" : ""}</span>`;
}
