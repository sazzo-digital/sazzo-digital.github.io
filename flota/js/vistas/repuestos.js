// ============================================
// Repuestos (administradora y mecánico): "hay / queda poco / no hay". Se descuentan solos cuando el mecánico
// cierra un arreglo diciendo qué usó.
// ============================================
import { esc } from "../../kit/js/ui.js?v=9b46aea81a";
import { cantidadCon } from "../datos.js?v=9b46aea81a";

const ESTADOS = {
    "no-hay": { texto: "No hay", clase: "problema", icono: "ti-circle-x" },
    poco: { texto: "Queda poco", clase: "taller", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "andando", icono: "ti-circle-check" }
};
const ORDEN = { "no-hay": 0, poco: 1, hay: 2 };

export function vistaRepuestos(cont, { datos }) {
    const lista = datos.listarRepuestos().sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);
    cont.innerHTML = `
        <h1 class="titulo">Repuestos</h1>
        <p class="nota"><i class="ti ti-info-circle"></i> Se descuentan solos cuando el mecánico marca un arreglo y dice qué usó.</p>
        <ul class="tarjetas">${lista.map((r) => {
            const e = ESTADOS[r.estado];
            return `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ti-package" aria-hidden="true"></i>${esc(r.nombre)}</span>
                    <span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}</span>
                </div>
                <p class="tarjeta__quien"><b class="cantidad">${esc(cantidadCon(r.cantidad, r.unidad))}</b> · avisa con ${esc(r.minimo)} o menos</p>
            </li>`;
        }).join("")}</ul>`;
}
