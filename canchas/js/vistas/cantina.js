import { esc } from "../../kit/js/ui.js?v=e07e055905";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=e07e055905";
import { MEDIOS_PAGO, mediosParaCaja } from "../../kit/js/pagos.js?v=e07e055905";
import { pesos, SECCIONES_CANTINA } from "../datos.js?v=e07e055905";
import { MARCA, NEGOCIO } from "../marca.js?v=e07e055905";

const MEDIOS_CAJA = mediosParaCaja(MEDIOS_PAGO);

export function vistaCantina(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Cantina</h1>
            <span class="negocio"><i class="ti ti-cup" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Para el que viene a comprar sin turno. Lo que piden los equipos va a la cuenta de su turno (tocá el turno en la grilla).</p>
        <div class="lugar-caja"></div>
        ${htmlMasDeLaCaja({ cajaDelDia: false })}
        <section class="stock-del-dia"></section>`;
    const lugarStock = cont.querySelector(".stock-del-dia");
    const pintarStock = () => {
        const productos = datos.cantina();
        lugarStock.innerHTML = `
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
    };
    abrirCaja({
        dentro: cont.querySelector(".lugar-caja"),
        titulo: `Cantina · ${NEGOCIO}`,
        prefijo: MARCA.prefijo,
        productos: () => datos.cantina(),
        secciones: SECCIONES_CANTINA,
        buscarCodigo: (codigo) => datos.cantina().find((p) => p.id === codigo) ?? null,
        medios: MEDIOS_CAJA,
        billetes: [2_000, 5_000, 10_000, 20_000],
        cobrar: ({ items, medio, pagaCon, pagos }) => datos.venderCantina(usuario, { items, medio, pagaCon, pagos }),
        despues: () => pintarStock()
    });
    pintarStock();
}
