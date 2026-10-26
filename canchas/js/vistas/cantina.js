import { pintarConsigna } from "./comunes.js?v=8a5fe1d629";
import { esc } from "../../kit/js/ui.js?v=8a5fe1d629";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=8a5fe1d629";
import { htmlEstante, activarEstantes } from "../../kit/js/estante.js?v=8a5fe1d629";
import { MEDIOS_PAGO, mediosParaCaja } from "../../kit/js/pagos.js?v=8a5fe1d629";
import { pesos, SECCIONES_CANTINA } from "../datos.js?v=8a5fe1d629";
import { MARCA, NEGOCIO } from "../marca.js?v=8a5fe1d629";

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
            ${SECCIONES_CANTINA.map((s) => {
                const deEsta = productos.filter((p) => p.seccion === s.id);
                return deEsta.length ? htmlEstante({
                    id: `cantina-${s.id}`,
                    titulo: s.texto,
                    icono: deEsta[0].icono,
                    cantidad: deEsta.length,
                    sinStock: deEsta.filter((p) => p.stock === 0).length,
                    pocos: deEsta.filter((p) => p.stock > 0 && p.stock <= 3).length,
                    contenido: `<ul>${deEsta.map((p) => `
                        <li class="estante__fila">
                            <span><i class="ti ${esc(p.icono)}" aria-hidden="true"></i>${esc(p.nombre)}</span>
                            <b class="estante__precio">${esc(pesos(p.precio))}</b>
                            <span class="pastilla ${p.stock === 0 ? "pastilla--mal" : p.stock <= 3 ? "pastilla--ojo" : "pastilla--bien"}">${p.stock === 0 ? "No hay" : `Hay ${esc(p.stock)}`}</span>
                        </li>`).join("")}</ul>`
                }) : "";
            }).join("")}
            <p class="nota"><i class="ti ti-chart-bar" aria-hidden="true"></i> Hoy en la cantina: <b>${esc(pesos(datos.cantinaDelDia()))}</b></p>`;
        activarEstantes(lugarStock);
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
    pintarConsigna(cont, datos, usuario);
}
