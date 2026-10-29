import { pintarConsigna } from "./comunes.js?v=3139c971e2";
import { esc, fechaHora } from "../../kit/js/ui.js?v=3139c971e2";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=3139c971e2";
import { FAMILIAS, PRESENTACIONES, MEDIOS, pesos } from "../datos.js?v=3139c971e2";
import { frasco } from "./comunes.js?v=3139c971e2";
import { mediosParaCaja, textoMedio } from "../../kit/js/pagos.js?v=3139c971e2";
import { MARCA, NEGOCIO } from "../marca.js?v=3139c971e2";

const MEDIOS_CAJA = mediosParaCaja(MEDIOS);
let familia = "mas";

export function vistaMostrador(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Mostrador</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Para la que compra en el local: frascos y decants. Cada venta descuenta el stock (los decants, los ml de la botella madre).</p>
        <div class="lugar-caja lugar-caja--sin-gondola"></div>
        <section class="catalogo-mostrador" aria-label="Perfumes para vender">
            <div class="chips" role="group" aria-label="Familia">
                <button class="chip" type="button" data-familia="mas">Lo que más sale</button>
                <button class="chip" type="button" data-familia="">Todos</button>
                ${Object.entries(FAMILIAS).map(([k, f]) => `<button class="chip" type="button" data-familia="${esc(k)}"><span class="punto" style="background:${esc(f.color)}"></span>${esc(f.texto)}</button>`).join("")}
            </div>
            <form class="buscar buscar--mostrador" role="search">
                <input type="search" name="q" placeholder="Buscá un perfume" aria-label="Buscá un perfume" maxlength="40" autocomplete="off">
            </form>
            <ul class="perfumes perfumes--mostrador"></ul>
            <p class="nota" data-sin-perfumes hidden>No hay perfumes con esa búsqueda.</p>
        </section>
        ${htmlMasDeLaCaja({ cajaDelDia: false })}
        <section class="ventas-mostrador"></section>`;
    const lugarVentas = cont.querySelector(".ventas-mostrador");
    const pintarVentas = () => {
        const ventas = datos.ventasDeHoy();
        const total = ventas.reduce((n, v) => n + v.total, 0);
        lugarVentas.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Hoy en el mostrador</h2>
            <div class="tira">
                <span><b>${esc(ventas.length)}</b> ${ventas.length === 1 ? "venta" : "ventas"} hoy</span>
                <span>Vendido en el mostrador <b>${esc(pesos(total))}</b></span>
            </div>
            ${ventas.length ? `<ul class="tarjetas">${ventas.slice().reverse().map((v) => `
                <li class="tarjeta">
                    <div class="tarjeta__fila"><b>${esc(fechaHora(v.fecha))}</b><b>${esc(pesos(v.total))}</b></div>
                    <p class="tarjeta__quien">${v.renglones.map((r) => `${esc(r.cantidad)} × ${esc(r.nombre)}`).join(" · ")} · ${esc(textoMedio(v, MEDIOS))}${v.vuelto ? ` · vuelto ${esc(pesos(v.vuelto))}` : ""}</p>
                </li>`).join("")}</ul>` : `<p class="nota">Todavía no hay ventas en el mostrador hoy.</p>`}`;
    };
    const catalogo = cont.querySelector(".catalogo-mostrador");
    const campoBuscar = catalogo.querySelector("[name=q]");
    const pintarPerfumes = () => {
        const texto = campoBuscar.value.slice(0, 40).trim();
        const lista = texto ? datos.listarPerfumes({ texto }) : familia === "mas" ? datos.masVendidos() : datos.listarPerfumes({ familia: familia || null });
        const productos = datos.productosCaja();
        catalogo.querySelectorAll("[data-familia]").forEach((b) => {
            const activo = b.dataset.familia === familia;
            b.classList.toggle("activo", activo);
        });
        catalogo.querySelector(".perfumes").innerHTML = lista.map((p) => `
            <li class="perfume perfume--mostrador">
                ${frasco(p.familia)}
                <span class="perfume__nombre">${esc(p.nombre)}</span>
                <small>${esc(p.familiaInfo.texto)} · ${esc(p.paraTexto)}</small>
                <small class="perfume__notas">${esc(p.notas.salida)} · ${esc(p.notas.corazon)} · ${esc(p.notas.fondo)}</small>
                <b class="perfume__precio">desde ${esc(pesos(p.desde))}</b>
                <div class="presentaciones">${productos.filter((x) => x.id.startsWith(`${p.id}/`)).map((x) => `
                    <button class="presentacion" type="button" data-sumar="${esc(x.id)}"${x.stock > 0 ? "" : " disabled"}>${esc(PRESENTACIONES[x.presentacion].texto)} <b>${x.stock > 0 ? esc(pesos(x.precio)) : "sin stock"}</b></button>`).join("")}
                </div>
            </li>`).join("");
        catalogo.querySelector("[data-sin-perfumes]").hidden = lista.length > 0;
    };
    const caja = abrirCaja({
        dentro: cont.querySelector(".lugar-caja"),
        titulo: NEGOCIO,
        prefijo: MARCA.prefijo,
        escaneo: false,
        productos: () => datos.productosCaja(),
        gondola: () => [],
        buscarCodigo: (codigo) => datos.productosCaja().find((p) => p.id === codigo) ?? null,
        medios: MEDIOS_CAJA,
        billetes: [20_000, 50_000, 100_000, 200_000],
        cobrar: ({ items, medio, pagaCon, pagos }) => datos.venderMostrador(usuario, { items, medio, pagaCon, pagos }),
        despues: () => {
            pintarVentas();
            pintarPerfumes();
        }
    });
    catalogo.querySelectorAll("[data-familia]").forEach((b) => b.addEventListener("click", () => {
        familia = b.dataset.familia;
        pintarPerfumes();
    }));
    catalogo.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
    campoBuscar.addEventListener("input", () => {
        campoBuscar.value = campoBuscar.value.slice(0, 40);
        pintarPerfumes();
    });
    catalogo.querySelector(".perfumes").addEventListener("click", (e) => {
        const boton = e.target.closest("[data-sumar]");
        if (!boton || boton.disabled) return;
        const producto = datos.productosCaja().find((p) => p.id === boton.dataset.sumar);
        if (producto) caja.sumar(producto);
    });
    pintarPerfumes();
    pintarVentas();
    pintarConsigna(cont, datos, usuario);
}
