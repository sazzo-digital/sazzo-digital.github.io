// ============================================
// Vender (Mariela y Joaquín): lo más vendido y los rubros a mano, buscador por nombre, código o como lo pide la gente
// ("birome", "plasticola"), y la cámara del celular (kit/escaner.js: también en iPhone; sirve para el ISBN de un libro). Ticket con cantidad (se puede
// escribir: 12 lapiceras, 40 fotocopias), precio por mayor solo, total, "Paga con…" → vuelto, y cobrar en efectivo,
// transferencia o tarjeta. Código que no está → "¿Lo cargás?" y queda listo para vender.
// En la compu, dos columnas (artículos | ticket); en el celular, el ticket abajo con una barrita arriba que lleva a él.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=d180eb8742";
import { TOPES, MEDIOS, RUBROS, DESCUENTO_MAYOR, pesos, precioMayor, esISBN } from "../datos.js?v=d180eb8742";
import { NEGOCIO } from "../marca.js?v=d180eb8742";
import { puedeEscanear, escanear } from "../../kit/js/escaner.js?v=d180eb8742";

// El ticket en curso queda en memoria mientras se navega (se vacía al cobrar)
const ticket = new Map(); // productoId → cantidad
let medio = "efectivo";
let rubro = null; // null = lo más vendido

const BILLETES = [2_000, 5_000, 10_000, 20_000];

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
                        <span class="solo-lector">Buscar por nombre o código</span>
                        <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Nombre, código, ISBN o “birome” (Enter)">
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

    /** Cambia la cantidad de un artículo (suma `cuantos`, o la deja en `fija`). */
    const cambiar = (id, { cuantos = 1, fija = null } = {}) => {
        const p = datos.listarProductos().find((x) => x.id === id);
        if (!p) return;
        const nueva = fija ?? (ticket.get(id) ?? 0) + cuantos;
        const tope = p.servicio ? TOPES.cantidad : Math.min(p.stock, TOPES.cantidad);
        if (nueva > tope) {
            aviso(p.servicio || p.stock > TOPES.cantidad ? `Hasta ${TOPES.cantidad} por venta.` : p.stock ? `De ${p.nombre} quedan solo ${p.stock}.` : `No queda ${p.nombre}.`, "error");
            pintarTicket();
            return;
        }
        if (!Number.isInteger(nueva) || nueva <= 0) ticket.delete(id);
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
                const sin = !p.servicio && !p.stock;
                return `
                <button class="producto${sin ? " producto--sin" : ""}" type="button" data-agregar="${esc(p.id)}"${sin ? " disabled" : ""}>
                    <span class="producto__nombre">${esc(p.nombre)}</span>
                    <span class="producto__precio">${esc(pesos(p.precio))}</span>
                    ${sin ? `<small>No hay</small>` : p.mayorDesde ? `<small class="producto__mayor">x${esc(p.mayorDesde)}: ${esc(pesos(p.precioMayor))} c/u</small>` : ""}
                </button>`;
            }).join("")}</div>`
            : vacio(/^\d{4,14}$/.test(texto) ? "No está ese código. Apretá Enter para cargarlo." : "No hay artículos con ese nombre.", "ti-search")}`;
        grilla.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.agregar)));
    }

    function pintarTicket() {
        const items = [...ticket].map(([productoId, cantidad]) => ({ productoId, cantidad }));
        const unidades = items.reduce((t, i) => t + i.cantidad, 0);
        let armado = { renglones: [], total: 0, ahorro: 0 };
        try {
            if (items.length) armado = datos.armarTicket(items);
        } catch (e) {
            aviso(e, "error");
        }
        barra.hidden = !items.length;
        barra.innerHTML = `<i class="ti ti-receipt" aria-hidden="true"></i> ${unidades} ${unidades === 1 ? "artículo" : "artículos"} · <b>${esc(pesos(armado.total))}</b> <span>Cobrar ↓</span>`;
        lugarTicket.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Ticket</h2>
            ${items.length ? `
            <ul class="renglones">${armado.renglones.map((r) => `
                <li class="renglon">
                    <span class="renglon__nombre">${esc(r.nombre)}
                        <small>${esc(pesos(r.precio))} c/u${r.mayor ? ` <span class="etiqueta">por mayor</span>` : r.mayorDesde ? ` · desde ${esc(r.mayorDesde)}: ${esc(pesos(precioMayor(r.precioLista)))}` : ""}</small>
                    </span>
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-menos="${esc(r.productoId)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>
                        <input class="contador-uso__cantidad" type="number" inputmode="numeric" min="1" max="${TOPES.cantidad}" step="1" value="${esc(r.cantidad)}" data-cantidad="${esc(r.productoId)}" aria-label="Cantidad de ${esc(r.nombre)}">
                        <button class="boton-icono" type="button" data-mas="${esc(r.productoId)}" aria-label="Uno más de ${esc(r.nombre)}"><i class="ti ti-plus"></i></button>
                    </span>
                    <span class="renglon__total">${esc(pesos(r.precio * r.cantidad))}</span>
                </li>`).join("")}
            </ul>
            ${armado.ahorro ? `<p class="nota ahorro"><i class="ti ti-tag"></i> Por mayor (${DESCUENTO_MAYOR} % menos): se ahorra ${esc(pesos(armado.ahorro))}</p>` : ""}
            <div class="total"><span>Total</span><b>${esc(pesos(armado.total))}</b></div>
            <div class="chips medios" role="radiogroup" aria-label="Cómo paga">
                ${Object.entries(MEDIOS).map(([id, texto]) => `<button class="chip${medio === id ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === id}" data-medio="${id}">${texto}</button>`).join("")}
            </div>
            <form class="formulario cobrar" novalidate>
                ${medio === "efectivo" ? `
                <label>Paga con (si querés saber el vuelto)
                    <input name="pagaCon" type="number" inputmode="numeric" min="0" max="${TOPES.pagaCon}" step="1" placeholder="Ej: 10000">
                </label>
                <div class="billetes">${BILLETES.filter((b) => b >= armado.total).map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesos(b))}</button>`).join("")}</div>
                <p class="vuelto" aria-live="polite"></p>` : ""}
                <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-cash"></i> Cobrar ${esc(pesos(armado.total))}</button>
            </form>
            <button class="boton-link vaciar" type="button"><i class="ti ti-trash"></i> Vaciar ticket</button>`
            : `<p class="nota"><i class="ti ti-hand-finger"></i> Tocá un artículo o escribí su código para empezar.</p>`}`;

        lugarTicket.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas, { cuantos: 1 })));
        lugarTicket.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.menos, { cuantos: -1 })));
        lugarTicket.querySelectorAll("[data-cantidad]").forEach((c) => c.addEventListener("change", () => {
            const n = c.value === "" ? 0 : Number(c.value);
            if (!Number.isInteger(n) || n < 0) {
                aviso(`La cantidad tiene que ser un número entero y hasta ${TOPES.cantidad}.`, "error");
                pintarTicket();
                return;
            }
            cambiar(c.dataset.cantidad, { fija: n });
        }));
        lugarTicket.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
            medio = b.dataset.medio;
            pintarTicket();
        }));
        lugarTicket.querySelector(".vaciar")?.addEventListener("click", () => {
            ticket.clear();
            pintarTicket();
        });
        const form = lugarTicket.querySelector(".cobrar");
        if (!form) return;
        const pagaCon = form.pagaCon;
        const mostrarVuelto = () => {
            const n = Number(pagaCon.value);
            const p = lugarTicket.querySelector(".vuelto");
            if (!pagaCon.value) p.textContent = "";
            else if (!Number.isInteger(n) || n < armado.total) p.innerHTML = `<span class="falta">Con ${esc(pesos(n || 0))} no alcanza.</span>`;
            else p.innerHTML = `Vuelto: <b>${esc(pesos(n - armado.total))}</b>`;
        };
        pagaCon?.addEventListener("input", mostrarVuelto);
        lugarTicket.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
            pagaCon.value = b.dataset.billete;
            mostrarVuelto();
        }));
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const v = datos.vender(usuario, { items, medio, pagaCon: pagaCon?.value ? Number(pagaCon.value) : null });
                ticket.clear();
                vendido(v);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    /** Después de cobrar: lo que pasó y qué más probar. */
    function vendido(v) {
        const paraArmar = datos.listarPedidos(usuario, { estado: "nueva" }).length;
        lugarTicket.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h2 class="titulo">Vendido</h2>
                <p>${esc(pesos(v.total))} · ${esc(MEDIOS[v.medio])}</p>
                ${v.vuelto !== null ? `<p class="vuelto vuelto--grande">Vuelto: <b>${esc(pesos(v.vuelto))}</b></p>` : ""}
                <button class="boton boton--secundario" type="button" data-nueva><i class="ti ti-plus"></i> Nueva venta</button>
            </div>
            ${paraArmar ? `<a class="boton boton--secundario boton--ancho" href="#/listas?ver=nueva"><i class="ti ti-school"></i> Hay ${esc(paraArmar)} ${paraArmar === 1 ? "lista" : "listas"} para armar</a>` : ""}`;
        barra.hidden = true;
        lugarTicket.querySelector("[data-nueva]").addEventListener("click", () => {
            medio = "efectivo";
            pintarTicket();
            q.focus();
        });
        if (matchMedia("(max-width: 999px)").matches) lugarTicket.scrollIntoView({ block: "start" });
        pintarProductos();
    }

    /** Código que no está: "¿Lo cargás?" con nombre, rubro, precio y cuántos hay. Queda en el ticket. */
    function ofrecerCargar(codigo) {
        const libro = esISBN(codigo); // un ISBN: va de entrada al rubro Libros
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
        cont.querySelector(".productos").insertAdjacentHTML("afterbegin", `<p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: buscá “birome”, llevá 12 lapiceras azules (sale el precio por mayor) y sumá 20 fotocopias.</p>`);
    }
}
