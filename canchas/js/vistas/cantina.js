import { esc } from "../../kit/js/ui.js?v=d29cdf6ff2";
import { abrirCaja } from "../../kit/js/caja.js?v=d29cdf6ff2";
import { MEDIOS_PAGO, mediosParaCaja } from "../../kit/js/pagos.js?v=d29cdf6ff2";
import { pesos } from "../datos.js?v=d29cdf6ff2";
import { MARCA, NEGOCIO } from "../marca.js?v=d29cdf6ff2";

const MEDIOS_CAJA = mediosParaCaja(MEDIOS_PAGO);

export function vistaCantina(cont, { usuario, datos }) {
    const productos = datos.cantina();
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Cantina</h1>
            <span class="negocio"><i class="ti ti-cup" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <button class="boton boton--ancho boton--grande" type="button" data-abrir-caja><i class="ti ti-cash-register"></i> Abrir la caja de la cantina</button>
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Para el que viene a comprar sin turno. Lo que piden los equipos va a la cuenta de su turno (tocá el turno en la grilla).</p>
        <h2 class="subtitulo"><i class="ti ti-package"></i> Stock</h2>
        <ul class="tarjetas stock-cantina">${productos.map((p) => `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(p.icono)}" aria-hidden="true"></i>${esc(p.nombre)}</span>
                    <span class="pastilla ${p.stock === 0 ? "pastilla--mal" : p.stock <= 3 ? "pastilla--ojo" : "pastilla--bien"}">${p.stock === 0 ? "No hay" : `Hay ${esc(p.stock)}`}</span>
                </div>
                <p class="tarjeta__quien">${esc(pesos(p.precio))}</p>
            </li>`).join("")}
        </ul>
        <p class="nota"><i class="ti ti-chart-bar" aria-hidden="true"></i> Hoy en la cantina: <b>${esc(pesos(datos.cantinaDelDia()))}</b></p>`;
    cont.querySelector("[data-abrir-caja]").addEventListener("click", () => abrirCaja({
        titulo: `Cantina · ${NEGOCIO}`,
        prefijo: MARCA.prefijo,
        productos: () => datos.cantina(),
        buscarCodigo: (codigo) => datos.cantina().find((p) => p.id === codigo) ?? null,
        medios: MEDIOS_CAJA,
        billetes: [2_000, 5_000, 10_000, 20_000],
        cobrar: ({ items, medio, pagaCon, pagos }) => datos.venderCantina(usuario, { items, medio, pagaCon, pagos }),
        alCerrar: () => vistaCantina(cont, { usuario, datos })
    }));
}
