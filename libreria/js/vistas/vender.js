import { esc, aviso } from "../../kit/js/ui.js?v=8028f8820b";
import { TOPES, RUBROS, pesos, esISBN, precioPara } from "../datos.js?v=8028f8820b";
import { NEGOCIO, MARCA } from "../marca.js?v=8028f8820b";
import { EVENTO_REINICIO } from "../../kit/js/guardado.js?v=8028f8820b";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=8028f8820b";
import { MEDIOS_PAGO, mediosParaCaja } from "../../kit/js/pagos.js?v=8028f8820b";

export const ticket = new Map();
addEventListener(EVENTO_REINICIO, () => ticket.clear());

const paraCaja = (p) => ({ ...p, stock: p.servicio ? null : p.stock, seccion: p.rubro, icono: RUBROS.find((r) => r.id === p.rubro)?.icono ?? "ti-package" });

export function vistaVender(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        ${ticket.size ? "" : `<p class="nota"><i class="ti ti-bulb"></i> Probá: buscá “birome”, llevá 12 lapiceras azules (sale el precio por mayor) y sumá 20 fotocopias.</p>`}
        <div class="cargar" hidden></div>
        <div class="lugar-caja"></div>
        ${htmlMasDeLaCaja()}`;
    const panelCargar = cont.querySelector(".cargar");
    const productos = () => datos.listarProductos().map(paraCaja);

    const caja = abrirCaja({
        dentro: cont.querySelector(".lugar-caja"),
        ticket,
        titulo: NEGOCIO,
        prefijo: MARCA.prefijo,
        productos,
        secciones: RUBROS.filter((r) => datos.listarProductos().some((p) => p.rubro === r.id)).map((r) => ({ id: r.id, texto: r.nombre })),
        buscar: (texto) => datos.listarProductos({ texto }).slice(0, 24).map(paraCaja),
        buscarCodigo: (codigo) => {
            const p = datos.porCodigo(codigo);
            return p ? paraCaja(p) : null;
        },
        medios: mediosParaCaja(MEDIOS_PAGO),
        billetes: [2_000, 5_000, 10_000, 20_000],
        imagenQR: (p) => (p.servicio ? null : `img/qr/${encodeURIComponent(p.codigo)}.svg`),
        precioPara,
        cotizar: (items) => datos.armarTicket(items),
        topeCantidad: TOPES.cantidad,
        cobrar: ({ items, medio, pagaCon, pagos }) => datos.vender(usuario, { items, medio, pagaCon, pagos }),
        despues: (v, lugar) => {
            const paraArmar = datos.listarPedidos(usuario, { estado: "nueva" }).length;
            if (paraArmar) lugar.insertAdjacentHTML("beforeend", `<a class="boton boton--secundario" href="#/listas?ver=nueva"><i class="ti ti-school"></i> Hay ${esc(paraArmar)} ${paraArmar === 1 ? "lista" : "listas"} para armar</a>`);
        },
        alEnter: (texto) => {
            if (!/^\d{4,14}$/.test(texto)) return false;
            ofrecerCargar(texto);
            return true;
        }
    });

    function ofrecerCargar(codigo) {
        const libro = esISBN(codigo);
        panelCargar.hidden = false;
        panelCargar.innerHTML = `
            <form class="formulario bloque" novalidate>
                <h2 class="subtitulo"><i class="ti ${libro ? "ti-book" : "ti-barcode"}"></i> ${libro ? `El libro con ISBN ${esc(codigo)}` : `El código ${esc(codigo)}`} no está: ¿lo cargás?</h2>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" placeholder="${libro ? "Ej: Manual de 5° grado" : "Ej: Cuaderno espiral A5"}" required></label>
                <label>Rubro
                    <select name="rubro">${RUBROS.filter((r) => r.id !== "fotocopias").map((r) => `<option value="${esc(r.id)}"${libro && r.id === "libros" ? " selected" : ""}>${esc(r.nombre)}</option>`).join("")}</select>
                </label>
                <div class="formulario__fila">
                    <label>Precio<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" required></label>
                    <label>¿Cuántos hay?<input name="stock" type="number" inputmode="numeric" min="1" max="${TOPES.stock}" step="1" value="1"></label>
                </div>
                <p class="nota"><i class="ti ti-info-circle"></i> El costo se calcula con el margen del rubro; ${usuario.rol === "duena" ? "lo podés corregir en Stock" : "Mariela lo corrige en Stock"}.</p>
                <div class="acciones">
                    <button class="boton" type="submit"><i class="ti ti-plus"></i> Cargar y sumar al ticket</button>
                    <button class="boton boton--secundario" type="button" data-cancelar>Cancelar</button>
                </div>
            </form>`;
        const f = panelCargar.querySelector("form");
        f.nombre.focus();
        f.querySelector("[data-cancelar]").addEventListener("click", () => (panelCargar.hidden = true));
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const num = (v) => (v === "" ? NaN : Number(v));
            try {
                const p = datos.cargarProducto(usuario, { nombre: f.nombre.value, codigo, rubro: f.rubro.value, precio: num(f.precio.value), stock: num(f.stock.value) });
                panelCargar.hidden = true;
                aviso(`${p.nombre} cargado`);
                caja.pintar();
                caja.sumar(paraCaja(p));
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
}
