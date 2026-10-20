import { esc, aviso, fechaHora } from "../../kit/js/ui.js?v=f6723a2a8a";
import { TOPES, MEDIOS, RUBROS, UNIDADES, pesos, cantidadTexto, precioPara } from "../datos.js?v=f6723a2a8a";
import { textoMedio, mediosParaCaja } from "../../kit/js/pagos.js?v=f6723a2a8a";
import { NEGOCIO, MARCA } from "../marca.js?v=f6723a2a8a";
import { EVENTO_REINICIO } from "../../kit/js/guardado.js?v=f6723a2a8a";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=f6723a2a8a";

export const ticket = new Map();
addEventListener(EVENTO_REINICIO, () => ticket.clear());

const paraCaja = (p) => {
    const u = UNIDADES[p.unidad] ?? UNIDADES.u;
    return {
        ...p, stock: p.servicio ? null : p.stock, seccion: p.rubro, decimal: u.decimales > 0, decimales: u.decimales, medida: u.corto ? `por ${u.nombre}` : "",
        icono: RUBROS.find((r) => r.id === p.rubro)?.icono ?? "ti-package"
    };
};

export function vistaVender(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        ${ticket.size ? "" : `<p class="nota"><i class="ti ti-bulb"></i> Probá: buscá “taco del 8” y llevá 100 (sale por mayor), sumá 10 m de “cable 2,5” y cobralo a la cuenta de Gustavo: se pasa del tope.</p>`}
        <div class="cargar" hidden></div>
        <div class="lugar-caja"></div>
        ${htmlMasDeLaCaja()}`;
    const panelCargar = cont.querySelector(".cargar");

    const caja = abrirCaja({
        dentro: cont.querySelector(".lugar-caja"),
        ticket,
        titulo: NEGOCIO,
        prefijo: MARCA.prefijo,
        productos: () => datos.listarProductos().map(paraCaja),
        secciones: RUBROS.filter((r) => datos.listarProductos().some((p) => p.rubro === r.id)).map((r) => ({ id: r.id, texto: r.nombre })),
        buscar: (texto) => datos.listarProductos({ texto }).slice(0, 24).map(paraCaja),
        buscarCodigo: (codigo) => {
            const p = datos.porCodigo(codigo);
            return p ? paraCaja(p) : null;
        },
        medios: mediosParaCaja(MEDIOS),
        billetes: [2_000, 5_000, 10_000, 20_000],
        imagenQR: (p) => (p.servicio ? null : `img/qr/${encodeURIComponent(p.codigo)}.svg`),
        precioPara,
        cotizar: (items) => datos.armarTicket(items),
        topeCantidad: Math.max(TOPES.cantidad, TOPES.metros, TOPES.kilos),
        clientePara: {
            medios: ["cuenta"],
            lista: () => datos.listarCuentas(usuario).map((c) => ({ id: c.id, texto: `${c.nombre} · debe ${pesos(c.deuda)}` })),
            aviso: (id, total) => {
                const t = datos.revisarTopeCuenta(id, total);
                return t.pasa
                    ? `Debería ${pesos(t.despues)} y su tope es ${pesos(t.tope)}.${usuario.rol === "dueno" ? " Si cobrás igual, lo autorizás vos." : " Lo tiene que autorizar Osvaldo."}`
                    : `Debe ${pesos(t.deuda)} → con esto, ${pesos(t.despues)} (tope ${pesos(t.tope)}).`;
            }
        },
        cobrar: ({ items, medio, pagaCon, pagos, clienteId }) => {
            const venta = { items, medio, pagaCon, pagos, clienteId };
            if (medio === "cuenta" && clienteId && usuario.rol === "dueno" && datos.revisarTopeCuenta(clienteId, datos.armarTicket(items).total).pasa) {
                if (!confirm("Se pasa del tope de la cuenta. ¿Lo autorizás igual?")) return false;
                venta.autorizarTope = true;
            }
            const v = datos.vender(usuario, venta);
            return v.cuenta ? { ...v, cliente: v.cuenta } : v;
        },
        despues: (v, lugar) => {
            if (v.cuenta) lugar.insertAdjacentHTML("beforeend", `<p class="nota"><i class="ti ti-user-dollar"></i> ${esc(v.cuenta.nombre)} debe ahora ${esc(pesos(v.cuenta.deuda))}.</p>`);
            lugar.insertAdjacentHTML("beforeend", `<details class="ticket-previa"><summary><i class="ti ti-printer"></i> Vista previa del ticket</summary>${htmlTicketPrevia(v)}</details>`);
            const paraArmar = datos.listarPresupuestos(usuario, { estado: "pedido" }).length;
            if (paraArmar) lugar.insertAdjacentHTML("beforeend", `<a class="boton boton--secundario" href="#/presupuestos?ver=pedido"><i class="ti ti-file-text"></i> Hay ${esc(paraArmar)} ${paraArmar === 1 ? "presupuesto" : "presupuestos"} para armar</a>`);
        },
        alEnter: (texto) => {
            if (!/^\d{4,14}$/.test(texto)) return false;
            ofrecerCargar(texto);
            return true;
        }
    });

    function ofrecerCargar(codigo) {
        panelCargar.hidden = false;
        panelCargar.innerHTML = `
            <form class="formulario bloque" novalidate>
                <h2 class="subtitulo"><i class="ti ti-barcode"></i> El código ${esc(codigo)} no está: ¿lo cargás?</h2>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" placeholder="Ej: Tornillo fix 10 x 60 mm" required></label>
                <div class="formulario__fila">
                    <label>Rubro
                        <select name="rubro">${RUBROS.filter((r) => r.id !== "servicios").map((r) => `<option value="${esc(r.id)}">${esc(r.nombre)}</option>`).join("")}</select>
                    </label>
                    <label>Se vende
                        <select name="unidad">${Object.entries(UNIDADES).map(([id, u]) => `<option value="${esc(id)}">por ${esc(u.nombre)}</option>`).join("")}</select>
                    </label>
                </div>
                <div class="formulario__fila">
                    <label>Precio<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" required></label>
                    <label>¿Cuánto hay?<input name="stock" type="text" inputmode="decimal" maxlength="8" value="1"></label>
                </div>
                <p class="nota"><i class="ti ti-info-circle"></i> El costo se calcula con el margen del rubro; ${usuario.rol === "dueno" ? "lo podés corregir en Stock" : "Osvaldo lo corrige en Stock"}.</p>
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
            try {
                const p = datos.cargarProducto(usuario, { nombre: f.nombre.value, codigo, rubro: f.rubro.value, unidad: f.unidad.value, precio: f.precio.value === "" ? NaN : Number(f.precio.value), stock: f.stock.value });
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

function htmlTicketPrevia(v) {
    return `
        <div class="ticket-papel" role="img" aria-label="Vista previa del ticket">
            <b class="ticket-papel__negocio">${esc(NEGOCIO)}</b>
            <span>${esc(fechaHora(v.fecha))} · atendió ${esc(v.por)}</span>
            <hr>
            ${v.items.map((i) => `
            <span class="ticket-papel__renglon"><span>${esc(i.unidad === "u" ? `${i.cantidad} x ${i.nombre}` : `${cantidadTexto(i.cantidad, i.unidad)} ${i.nombre}`)}</span><b>${esc(pesos(i.subtotal))}</b></span>`).join("")}
            <hr>
            <span class="ticket-papel__renglon ticket-papel__total"><span>TOTAL</span><b>${esc(pesos(v.total))}</b></span>
            <span>${esc(textoMedio(v, MEDIOS))}${v.vuelto !== null ? ` · vuelto ${esc(pesos(v.vuelto))}` : ""}</span>
            <hr>
            <small>Demo de Sazzo · no válido como factura</small>
        </div>`;
}
