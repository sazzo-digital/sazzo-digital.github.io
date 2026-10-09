// ============================================
// Tema claro / oscuro.
// - "auto" (nada elegido): oscuro, aunque el celular esté en claro (decidido el 08/10, igual que el catálogo).
//   "claro" y "oscuro": elegidos con el interruptor. Se guarda en este navegador.
// - La cabecera tiene un interruptor grande (sol / luna) que pasa de uno al otro.
// - La clave ("sazzo-tema") es compartida a propósito: el tema elegido sigue en todas las demos de Sazzo.
// kit/js/tema.js lo aplica antes de dibujar, para que no parpadee.
// ============================================
import { $, $$ } from "./ui.js?v=bd1244e281";

export const CLAVE_TEMA = "sazzo-tema";

export const TEMAS = {
    auto: { nombre: "Sin elegir (oscuro)", icono: "ti-moon" },
    claro: { nombre: "Claro", icono: "ti-sun" },
    oscuro: { nombre: "Oscuro", icono: "ti-moon" }
};

const COLOR_BARRA = { claro: "#ddd1bb", oscuro: "#0a0e0d" };

export function leerTema() {
    try {
        const t = localStorage.getItem(CLAVE_TEMA);
        return TEMAS[t] ? t : "auto";
    } catch {
        return "auto";
    }
}

/** Cómo se ve ahora de verdad ("claro" u "oscuro"): sin elegir, oscuro. */
export const temaVisible = () => (leerTema() === "claro" ? "claro" : "oscuro");

export function aplicarTema(tema) {
    if (!TEMAS[tema]) tema = "auto";
    if (tema === "auto") delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = tema;
    // La barra del navegador del celular, del mismo color que el fondo que se ve
    $$('meta[name="theme-color"]').forEach((m) => (m.content = COLOR_BARRA[tema === "claro" ? "claro" : "oscuro"]));
    try {
        if (tema === "auto") localStorage.removeItem(CLAVE_TEMA);
        else localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
        // sin almacenamiento (ventana privada): el tema dura hasta recargar
    }
    pintarInterruptor();
}

/** Interruptor de la cabecera: sol a la izquierda, luna a la derecha; la perilla marca el tema que se ve. */
export const interruptorTema = () => `
    <button class="interruptor-tema" id="tema" type="button" role="switch">
        <i class="ti ti-sun" aria-hidden="true"></i>
        <i class="ti ti-moon" aria-hidden="true"></i>
        <span class="interruptor-tema__perilla" aria-hidden="true"></span>
    </button>`;

function pintarInterruptor() {
    const boton = $("#tema");
    if (!boton) return;
    const oscuro = temaVisible() === "oscuro";
    boton.setAttribute("aria-checked", oscuro);
    boton.dataset.visible = oscuro ? "oscuro" : "claro";
    const texto = `Modo ${oscuro ? "oscuro" : "claro"}. Tocá para cambiar.`;
    boton.title = texto;
    boton.setAttribute("aria-label", texto);
}

/** Conecta el interruptor: cada toque pasa al otro tema (y queda fijo, ya no sigue al celular). */
export function activarInterruptorTema() {
    aplicarTema(leerTema());
    $("#tema")?.addEventListener("click", () => aplicarTema(temaVisible() === "oscuro" ? "claro" : "oscuro"));
}
