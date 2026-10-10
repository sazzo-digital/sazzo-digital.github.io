// ============================================
// Vender (Osvaldo y Nahuel): lo más vendido y los rubros a mano, buscador que entiende cómo pide la gente ("taco del
// 8", "cano 1/2", "media pulgada", "foco") y la cámara del celular para el código de barras (kit/escaner.js).
// Ticket con cantidad por unidad, por METRO o por KILO (se escribe: 2,5 m de cable, 0,750 kg de clavos), precio por
// mayor solo (tarugos x 100), total, "Paga con…" → vuelto, y cobrar en efectivo, transferencia, tarjeta o a la cuenta
// corriente (con aviso de tope). Después de cobrar, la vista previa del ticket para el cliente.
// Código que no está → "¿Lo cargás?" y queda listo para vender.
// En la compu, dos columnas (artículos | ticket); en el celular, el ticket abajo con una barrita arriba que lleva a él.
// ============================================
import { esc, aviso, vacio, fechaHora } from "../../kit/js/ui.js?v=0f2d2843ae";
import { puedeEscanear, escanear } from "../../kit/js/escaner.js?v=0f2d2843ae";
import { TOPES, MEDIOS, RUBROS, UNIDADES, DESCUENTO_MAYOR, pesos, precioMayor, precioConUnidad, cantidadTexto, numeroCantidad, redondearCantidad } from "../datos.js?v=0f2d2843ae";
import { NEGOCIO } from "../marca.js?v=0f2d2843ae";
import { pintarCobro, etiquetaUnidad } from "./comunes.js?v=0f2d2843ae";

// El ticket en curso queda en memoria mientras se navega (se vacía al cobrar)
const ticket = new Map(); // productoId → cantidad
let medio = "efectivo";
let rubro = null; // null = lo más vendido

export function vistaVender(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <button class="ticket-barra" type="button" hidden></button>
        <div class="caja-venta">
            <section class="productos" aria-label="Artículos">
                <form class="buscar" novalidate>
                    <label class="buscador">
                        <i class="ti ti-search" aria-hidden="true"></i>
                        <span class="solo-lector">Buscar por nombre, medida o código</span>
                        <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Como lo pide la gente: “taco del 8” (Enter)">
                    </label>
                    ${puedeEscanear() ? `<button class="boton boton--secundario" type="button" data-camara><i class="ti ti-camera"></i><span class="solo-lector">Escanear con la cámara</span></button>` : ""}
                </form>
                <nav class="chips rubros" aria-label="Rubros"></nav>
                <div class="cargar" hidden></div>
                <div class="grilla-productos"></div>
            </section>
            <section class="ticket" id="ticket" aria-label="Ticket"></section>
        </div>`;

    const q = cont.querySelector("[name=q]");
    const grilla = cont.querySelector(".grilla-productos");
    const chipsRubros = cont.querySelector(".rubros");
    const panelCargar = cont.querySelector(".cargar");
    const lugarTicket = cont.querySelector(".ticket");
    const barra = cont.querySelector(".ticket-barra");
    barra.addEventListener("click", () => lugarTicket.scrollIntoView({ block: "start", behavior: "smooth" }));

    /** Cambia la cantidad de un artículo (suma `cuantos`, o la deja en `fija`). Por metro y por kilo, con decimales. */
    const cambiar = (id, { cuantos = null, fija = null } = {}) => {
        const p = datos.listarProductos().find((x) => x.id === id);
        if (!p) return;
        const u = UNIDADES[p.unidad];
        const nueva = redondearCantidad(fija ?? (ticket.get(id) ?? 0) + (cuantos ?? u.paso), p.unidad);
        const tope = p.servicio ? u.maximo : Math.min(p.stock, u.maximo);
        if (nueva > tope + 1e-9) {
            aviso(p.servicio || p.stock > u.maximo ? `Hasta ${cantidadTexto(u.maximo, p.unidad)} por venta.` : p.stock > 0 ? `De ${p.nombre} quedan solo ${cantidadTexto(p.stock, p.unidad)}.` : `No queda ${p.nombre}.`, "error");
            pintarTicket();
            return;
        }
        if (!(nueva > 0)) ticket.delete(id);
        else ticket.set(id, nueva);
        pintarTicket();
    };

    function pintarRubros() {
        const chip = (id, texto, icono) => `<button class="chip${rubro === id ? " activo" : ""}" type="button" data-rubro="${esc(id ?? "")}">${icono ? `<i class="ti ${icono}" aria-hidden="true"></i>` : ""}${esc(texto)}</button>`;
        chipsRubros.innerHTML = chip(null, "Lo más vendido", "ti-flame") + RUBROS.map((r) => chip(r.id, r.nombre, r.icono)).join("");
        chipsRubros.querySelectorAll("[data-rubro]").forEach((b) => b.addEventListener("click", () => {
            rubro = b.dataset.rubro || null;
            q.value = "";
            pintarRubros();
            pintarProductos();
        }));
    }

    function pintarProductos() {
        const texto = q.value.trim();
        chipsRubros.hidden = !!texto;
        const lista = texto ? datos.listarProductos({ texto }).slice(0, 16) : rubro ? datos.listarProductos({ rubro }) : datos.rapidos();
        grilla.innerHTML = `
            ${texto ? `<p class="rotulo-chico">${lista.length ? "Resultados" : ""}</p>` : ""}
            ${lista.length ? `<div class="botones-productos">${lista.map((p) => {
                const sin = !p.servicio && !(p.stock > 0);
                return `
                <button class="producto${sin ? " producto--sin" : ""}" type="button" data-agregar="${esc(p.id)}"${sin ? " disabled" : ""}>
                    <span class="producto__nombre">${esc(p.nombre)}</span>
                    <span class="producto__precio">${esc(precioConUnidad(p.precio, p.unidad))}</span>
                    ${sin ? `<small>No hay</small>` : p.mayorDesde ? `<small class="producto__mayor">x${esc(p.mayorDesde)}: ${esc(pesos(p.precioMayor))} c/u</small>` : ""}
                </button>`;
            }).join("")}</div>`
            : vacio(/^\d{4,14}$/.test(texto) ? "No está ese código. Apretá Enter para cargarlo." : "No hay artículos con ese nombre.", "ti-search")}`;
        grilla.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.agregar)));
    }

    function pintarTicket() {
        const items = [...ticket].map(([productoId, cantidad]) => ({ productoId, cantidad }));
        let armado = { renglones: [], total: 0, ahorro: 0 };
        try {
            if (items.length) armado = datos.armarTicket(items);
        } catch (e) {
            aviso(e, "error");
        }
        barra.hidden = !items.length;
        barra.innerHTML = `<i class="ti ti-receipt" aria-hidden="true"></i> ${items.length} ${items.length === 1 ? "artículo" : "artículos"} · <b>${esc(pesos(armado.total))}</b> <span>Cobrar ↓</span>`;
        lugarTicket.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Ticket</h2>
            ${items.length ? `
            <ul class="renglones">${armado.renglones.map((r) => {
                const u = UNIDADES[r.unidad];
                return `
                <li class="renglon">
                    <span class="renglon__nombre">${esc(r.nombre)}
                        <small>${esc(precioConUnidad(r.precio, r.unidad))}${r.unidad === "u" ? " c/u" : ""}${r.mayor ? ` <span class="etiqueta">por mayor</span>` : r.mayorDesde ? ` · desde ${esc(r.mayorDesde)}: ${esc(pesos(precioMayor(r.precioLista)))}` : ""}</small>
                    </span>
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-menos="${esc(r.productoId)}" aria-label="${esc(u.paso === 1 ? "Uno" : String(u.paso).replace(".", ","))}${u.corto ? ` ${esc(u.corto)}` : ""} menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>
                        <input class="contador-uso__cantidad${r.unidad !== "u" ? " contador-uso__cantidad--decimal" : ""}" type="text" inputmode="${r.unidad === "u" ? "numeric" : "decimal"}" maxlength="8" value="${esc(String(r.cantidad).replace(".", ","))}" data-cantidad="${esc(r.productoId)}" aria-label="Cantidad de ${esc(r.nombre)}${u.corto ? ` en ${esc(u.nombre)}s` : ""}">
                        ${u.corto ? `<span class="contador-uso__unidad">${esc(u.corto)}</span>` : ""}
                        <button class="boton-icono" type="button" data-mas="${esc(r.productoId)}" aria-label="${esc(u.paso === 1 ? "Uno" : String(u.paso).replace(".", ","))}${u.corto ? ` ${esc(u.corto)}` : ""} más de ${esc(r.nombre)}"><i class="ti ti-plus"></i></button>
                    </span>
                    <span class="renglon__total">${esc(pesos(r.subtotal))}</span>
                </li>`;
            }).join("")}
            </ul>
            ${armado.ahorro ? `<p class="nota ahorro"><i class="ti ti-tag"></i> Por mayor (${DESCUENTO_MAYOR} % menos): se ahorra ${esc(pesos(armado.ahorro))}</p>` : ""}
            <div class="total"><span>Total</span><b>${esc(pesos(armado.total))}</b></div>
            <div class="lugar-cobro"></div>
            <button class="boton-link vaciar" type="button"><i class="ti ti-trash"></i> Vaciar ticket</button>`
            : `<p class="nota"><i class="ti ti-hand-finger"></i> Tocá un artículo o escribí su código para empezar.</p>`}`;

        lugarTicket.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas)));
        lugarTicket.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => {
            const p = datos.producto(b.dataset.menos);
            cambiar(b.dataset.menos, { cuantos: -UNIDADES[p.unidad].paso });
        }));
        lugarTicket.querySelectorAll("[data-cantidad]").forEach((c) => c.addEventListener("change", () => {
            const p = datos.producto(c.dataset.cantidad);
            const n = c.value.trim() === "" ? 0 : numeroCantidad(c.value);
            const u = UNIDADES[p.unidad];
            if (!Number.isFinite(n) || n < 0 || (p.unidad === "u" && !Number.isInteger(n))) {
                aviso(p.unidad === "u" ? `La cantidad tiene que ser un número entero y hasta ${u.maximo}.` : `Escribí los ${u.nombre}s con coma: ej. 2,5.`, "error");
                pintarTicket();
                return;
            }
            if (n > 0 && n < u.minimo) {
                aviso(`Lo mínimo es ${cantidadTexto(u.minimo, p.unidad)}.`, "error");
                pintarTicket();
                return;
            }
            cambiar(c.dataset.cantidad, { fija: n });
        }));
        lugarTicket.querySelector(".vaciar")?.addEventListener("click", () => {
            ticket.clear();
            pintarTicket();
        });
        const lugarCobro = lugarTicket.querySelector(".lugar-cobro");
        if (!lugarCobro || !armado.renglones.length) return;
        pintarCobro(lugarCobro, {
            usuario, datos, total: armado.total, medio,
            alCambiarMedio: (m) => (medio = m),
            alCobrar: (pago) => {
                try {
                    const v = datos.vender(usuario, { items, ...pago });
                    ticket.clear();
                    vendido(v);
                } catch (err) {
                    aviso(err, "error");
                }
            }
        });
    }

    /** Después de cobrar: lo que pasó, la vista previa del ticket y qué más probar. */
    function vendido(v) {
        const paraArmar = datos.listarPresupuestos(usuario, { estado: "pedido" }).length;
        lugarTicket.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h2 class="titulo">${v.medio === "cuenta" ? "Anotado en la cuenta" : "Vendido"}</h2>
                <p>${esc(pesos(v.total))} · ${esc(MEDIOS[v.medio])}${v.cuenta ? ` · ${esc(v.cuenta.nombre)}` : ""}</p>
                ${v.vuelto !== null ? `<p class="vuelto vuelto--grande">Vuelto: <b>${esc(pesos(v.vuelto))}</b></p>` : ""}
                ${v.cuenta ? `<p class="nota"><i class="ti ti-user-dollar"></i> ${esc(v.cuenta.nombre)} debe ahora ${esc(pesos(v.cuenta.deuda))}.</p>` : ""}
                <button class="boton boton--secundario" type="button" data-nueva><i class="ti ti-plus"></i> Nueva venta</button>
            </div>
            <details class="ticket-previa">
                <summary><i class="ti ti-printer"></i> Vista previa del ticket</summary>
                ${htmlTicketPrevia(v)}
            </details>
            ${paraArmar ? `<a class="boton boton--secundario boton--ancho" href="#/presupuestos?ver=pedido"><i class="ti ti-file-text"></i> Hay ${esc(paraArmar)} ${paraArmar === 1 ? "presupuesto" : "presupuestos"} para armar</a>` : ""}`;
        barra.hidden = true;
        lugarTicket.querySelector("[data-nueva]").addEventListener("click", () => {
            medio = "efectivo";
            pintarTicket();
            q.focus();
        });
        if (matchMedia("(max-width: 999px)").matches) lugarTicket.scrollIntoView({ block: "start" });
        pintarProductos();
    }

    /** Código que no está: "¿Lo cargás?" con nombre, rubro, unidad, precio y cuánto hay. Queda en el ticket. */
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
                q.value = "";
                aviso(`${p.nombre} cargado`);
                pintarProductos();
                cambiar(p.id);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    /** Enter en el buscador: un código que existe se suma; uno que no, se ofrece cargar; un solo resultado, se suma. */
    function alBuscar(texto) {
        const t = texto.trim();
        if (!t) return;
        const p = datos.porCodigo(t);
        if (p) {
            cambiar(p.id);
            q.value = "";
            pintarProductos();
            return;
        }
        if (/^\d{4,14}$/.test(t)) return ofrecerCargar(t);
        const lista = datos.listarProductos({ texto: t });
        if (lista.length === 1) {
            cambiar(lista[0].id);
            q.value = "";
            pintarProductos();
        }
    }

    cont.querySelector(".buscar").addEventListener("submit", (e) => {
        e.preventDefault();
        alBuscar(q.value);
    });
    q.addEventListener("input", () => {
        panelCargar.hidden = true;
        pintarProductos();
    });
    cont.querySelector("[data-camara]")?.addEventListener("click", () => escanear(alBuscar));

    pintarRubros();
    pintarProductos();
    pintarTicket();
    if (!ticket.size) {
        cont.querySelector(".productos").insertAdjacentHTML("afterbegin", `<p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: buscá “taco del 8” y llevá 100 (sale por mayor), sumá 10 m de “cable 2,5” y cobralo a la cuenta de Gustavo: se pasa del tope.</p>`);
    }
}

/** El ticket para el cliente, como saldría en la impresora (vista previa: nada que parezca una factura). */
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
            <span>${esc(MEDIOS[v.medio])}${v.vuelto !== null ? ` · vuelto ${esc(pesos(v.vuelto))}` : ""}</span>
            <hr>
            <small>Demo de Sazzo · no válido como factura</small>
        </div>`;
}

