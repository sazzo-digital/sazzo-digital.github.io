import { conConsigna } from "./comunes.js?v=e73a01d881";
// ============================================
// Más: todas las pantallas en una lista (en el celular el menú de abajo tiene lugar para 5).
// ============================================
import { esc } from "../../kit/js/ui.js?v=e73a01d881";

function pintarMas(cont, { secciones }) {
    cont.innerHTML = `
        <h1 class="titulo">Todo</h1>
        <ul class="mas-lista">
            ${secciones.map((s) => `
            <li><a class="mas-item" href="#${esc(s.ruta)}">
                <i class="ti ${esc(s.icono)}" aria-hidden="true"></i>
                <span><b>${esc(s.texto)}</b><small>${esc(s.detalle)}</small></span>
                <i class="ti ti-chevron-right" aria-hidden="true"></i>
            </a></li>`).join("")}
        </ul>`;
}

export const vistaMas = conConsigna(pintarMas);
