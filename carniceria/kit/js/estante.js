import { esc } from "./ui.js?v=c78b41fdf7";

export const TOPE_ESTANTE = { titulo: 60, cantidad: 100_000 };

const abiertas = new Set();

function cuenta(valor, que) {
    if (!Number.isInteger(valor) || valor < 0 || valor > TOPE_ESTANTE.cantidad) throw new Error(`${que}: un número entero de 0 a ${TOPE_ESTANTE.cantidad}.`);
    return valor;
}

export function htmlEstante({ id, titulo, icono = "ti-layout-grid", cantidad, sinStock = 0, pocos = 0, abierta = false, contenido = "" }) {
    if (typeof id !== "string" || !/^[\w-]{1,60}$/.test(id)) throw new Error("El estante necesita un id corto (letras, números y guiones).");
    if (typeof titulo !== "string" || !titulo.trim() || titulo.length > TOPE_ESTANTE.titulo) throw new Error(`El nombre del estante: de 1 a ${TOPE_ESTANTE.titulo} letras.`);
    const total = cuenta(cantidad, "La cantidad del estante");
    const faltan = cuenta(sinStock, "Los sin stock del estante");
    const ojo = cuenta(pocos, "Los que se acaban del estante");
    const avisos = [
        faltan ? `<span class="estante__aviso estante__aviso--mal">${esc(faltan)} sin stock</span>` : "",
        ojo ? `<span class="estante__aviso estante__aviso--ojo">${esc(ojo)} por acabarse</span>` : ""
    ].join("");
    return `
        <details class="estante" data-estante="${esc(id)}"${abierta || abiertas.has(id) ? " open" : ""}>
            <summary class="estante__cabeza">
                <i class="ti ${esc(icono)}" aria-hidden="true"></i>
                <span class="estante__nombre">${esc(titulo.trim())} <small>${esc(total)}</small></span>
                ${avisos ? `<span class="estante__avisos">${avisos}</span>` : ""}
                <i class="ti ti-chevron-down estante__flecha" aria-hidden="true"></i>
            </summary>
            <div class="estante__contenido">${contenido}</div>
        </details>`;
}

export function activarEstantes(raiz) {
    raiz.querySelectorAll("details.estante").forEach((g) => {
        g.querySelector(":scope > summary").addEventListener("click", () => {
            if (g.open) abiertas.delete(g.dataset.estante);
            else abiertas.add(g.dataset.estante);
        });
    });
}

export function olvidarEstantes() {
    abiertas.clear();
}
