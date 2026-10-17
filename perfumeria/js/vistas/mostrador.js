import { esc, fechaHora } from "../../kit/js/ui.js?v=8faf6088f2";
import { abrirCaja } from "../../kit/js/caja.js?v=8faf6088f2";
import { filtrarPorTexto } from "../../kit/js/buscar.js?v=8faf6088f2";
import { MEDIOS, pesos } from "../datos.js?v=8faf6088f2";
import { mediosParaCaja, textoMedio } from "../../kit/js/pagos.js?v=8faf6088f2";
import { MARCA, NEGOCIO } from "../marca.js?v=8faf6088f2";

const MEDIOS_CAJA = mediosParaCaja(MEDIOS);

export function vistaMostrador(cont, { usuario, datos }) {
    const ventas = datos.ventasDeHoy();
    const total = ventas.reduce((n, v) => n + v.total, 0);
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Mostrador</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <button class="boton boton--ancho boton--grande" type="button" data-abrir-caja><i class="ti ti-cash-register"></i> Abrir la caja del mostrador</button>
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Para la que compra en el local: frascos y decants. Cada venta descuenta el stock (los decants, los ml de la botella madre).</p>
        <div class="tira">
            <span><b>${esc(ventas.length)}</b> ${ventas.length === 1 ? "venta" : "ventas"} hoy</span>
            <span>Vendido en el mostrador <b>${esc(pesos(total))}</b></span>
        </div>
        ${ventas.length ? `<ul class="tarjetas">${ventas.slice().reverse().map((v) => `
            <li class="tarjeta">
                <div class="tarjeta__fila"><b>${esc(fechaHora(v.fecha))}</b><b>${esc(pesos(v.total))}</b></div>
                <p class="tarjeta__quien">${v.renglones.map((r) => `${esc(r.cantidad)} × ${esc(r.nombre)}`).join(" · ")} · ${esc(textoMedio(v, MEDIOS))}${v.vuelto ? ` · vuelto ${esc(pesos(v.vuelto))}` : ""}</p>
            </li>`).join("")}</ul>` : `<p class="nota">Todavía no hay ventas en el mostrador hoy.</p>`}`;
    cont.querySelector("[data-abrir-caja]").addEventListener("click", () => abrirCaja({
        titulo: NEGOCIO,
        prefijo: MARCA.prefijo,
        escaneo: false,
        productos: () => datos.productosCaja(),
        gondola: () => datos.productosCaja().filter((p) => p.presentacion === "f50" || p.presentacion === "d10"),
        buscar: (texto) => filtrarPorTexto(datos.productosCaja(), texto, (p) => p.nombre).slice(0, 24),
        buscarCodigo: (codigo) => datos.productosCaja().find((p) => p.id === codigo) ?? null,
        medios: MEDIOS_CAJA,
        billetes: [20_000, 50_000, 100_000, 200_000],
        cobrar: ({ items, medio, pagaCon, pagos }) => datos.venderMostrador(usuario, { items, medio, pagaCon, pagos }),
        alCerrar: () => vistaMostrador(cont, { usuario, datos })
    }));
}
