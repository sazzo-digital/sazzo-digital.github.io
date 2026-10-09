// ============================================
// Botón del recorrido: lleva a otra persona de la demo y a una pantalla, sin pasar por "Probala como…".
// Sirve para que el momento wow se recorra sin que nadie lo explique ("Mirá lo que le llega a Diego →").
//   cont.innerHTML = `… ${htmlGuia({ persona, ruta: "/inicio", texto: "Mirá lo que le llega a Diego" })} …`;
//   activarGuias(cont, irA);        → irA(personaId, ruta) lo define la demo en su app.js
// persona: { id, nombre, etiqueta } (la de PERSONAS de la demo). Todo pasa por esc().
// Al tocarlo: fundido suave entre las dos pantallas (donde el navegador lo permite) y un cartelito de un segundo,
// "Ahora estás como Diego · Mecánico", para que se note el cambio. El botón late una vez al aparecer (estilos).
// ============================================
import { esc } from "./ui.js?v=0840e8f49d";

const RUTA_VALIDA = /^\/[\w\-/?=&]*$/;

export function htmlGuia({ persona, ruta = "/inicio", texto } = {}) {
    if (!persona?.id || !persona?.nombre) throw new Error("Falta a qué persona lleva el botón del recorrido.");
    if (!RUTA_VALIDA.test(ruta)) throw new Error("La pantalla del botón del recorrido tiene que empezar con / (ej: /inicio).");
    if (!texto) throw new Error("Falta el texto del botón del recorrido.");
    return `
        <button class="guia" type="button" data-guia="${esc(persona.id)}" data-ruta="${esc(ruta)}" data-quien="${esc(persona.etiqueta || persona.nombre)}">
            <span class="guia__avatar" aria-hidden="true">${esc(persona.nombre[0])}</span>
            <span class="guia__texto">${esc(texto)}${persona.etiqueta ? `<small>${esc(persona.etiqueta)}</small>` : ""}</span>
            <i class="ti ti-arrow-right" aria-hidden="true"></i>
        </button>`;
}

/** Conecta los botones del recorrido que haya adentro de `cont`. */
export function activarGuias(cont, irA) {
    cont.querySelectorAll("[data-guia]").forEach((b) =>
        b.addEventListener("click", () => {
            const quien = b.dataset.quien;
            conFundido(() => irA(b.dataset.guia, b.dataset.ruta));
            if (quien) cartelPersona(quien);
        })
    );
}

const sinMovimiento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hace el cambio con un fundido entre lo de antes y lo nuevo (View Transitions); si el navegador no puede, directo. */
export function conFundido(cambiar) {
    if (typeof document === "undefined" || !document.startViewTransition || sinMovimiento()) return cambiar();
    try {
        document.startViewTransition(cambiar);
    } catch {
        cambiar();
    }
}

/** "Ahora estás como Diego · Mecánico": un cartelito arriba que se va solo. */
export function cartelPersona(quien) {
    if (typeof document === "undefined" || !document.body) return null;
    document.querySelectorAll(".cartel-persona").forEach((el) => el.remove());
    const el = document.createElement("p");
    el.className = "cartel-persona";
    el.setAttribute("role", "status");
    el.innerHTML = `<span class="cartel-persona__avatar" aria-hidden="true"></span><span>Ahora estás como <b></b></span>`;
    el.querySelector(".cartel-persona__avatar").textContent = quien.trim()[0]?.toUpperCase() ?? "";
    el.querySelector("b").textContent = quien;
    document.body.append(el);
    setTimeout(() => el.classList.add("saliendo"), 1800);
    setTimeout(() => el.remove(), 2100);
    return el;
}
