// ============================================
// Botón del recorrido: lleva a otra persona de la demo y a una pantalla, sin pasar por "Probala como…".
// Sirve para que el momento wow se recorra sin que nadie lo explique ("Mirá lo que le llega a Diego →").
//   cont.innerHTML = `… ${htmlGuia({ persona, ruta: "/inicio", texto: "Mirá lo que le llega a Diego" })} …`;
//   activarGuias(cont, irA);        → irA(personaId, ruta) lo define la demo en su app.js
// persona: { id, nombre, etiqueta } (la de PERSONAS de la demo). Todo pasa por esc().
// ============================================
import { esc } from "./ui.js?v=4875a95876";

const RUTA_VALIDA = /^\/[\w\-/?=&]*$/;

export function htmlGuia({ persona, ruta = "/inicio", texto } = {}) {
    if (!persona?.id || !persona?.nombre) throw new Error("Falta a qué persona lleva el botón del recorrido.");
    if (!RUTA_VALIDA.test(ruta)) throw new Error("La pantalla del botón del recorrido tiene que empezar con / (ej: /inicio).");
    if (!texto) throw new Error("Falta el texto del botón del recorrido.");
    return `
        <button class="guia" type="button" data-guia="${esc(persona.id)}" data-ruta="${esc(ruta)}">
            <span class="guia__avatar" aria-hidden="true">${esc(persona.nombre[0])}</span>
            <span class="guia__texto">${esc(texto)}${persona.etiqueta ? `<small>${esc(persona.etiqueta)}</small>` : ""}</span>
            <i class="ti ti-arrow-right" aria-hidden="true"></i>
        </button>`;
}

/** Conecta los botones del recorrido que haya adentro de `cont`. */
export function activarGuias(cont, irA) {
    cont.querySelectorAll("[data-guia]").forEach((b) => b.addEventListener("click", () => irA(b.dataset.guia, b.dataset.ruta)));
}
