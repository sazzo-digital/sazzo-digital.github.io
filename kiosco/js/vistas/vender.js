// ============================================
// Vender (Sofía y Rubén): botones con lo más vendido, buscador por nombre o código (el lector USB escribe el código
// y aprieta Enter solo) y, donde el navegador lo permite, la cámara del celular. Ticket con +/−, total,
// "Paga con…" → vuelto, y cobrar en efectivo, transferencia o fiado (con aviso de tope).
// Código que no está → "¿Lo cargás?" y queda listo para vender.
// En la compu, dos columnas (productos | ticket); en el celular, el ticket abajo con una barrita arriba que lleva a él.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=d78e90c63f";
import { TOPES, MEDIOS, pesos } from "../datos.js?v=d78e90c63f";
import { NEGOCIO } from "../marca.js?v=d78e90c63f";
import { guia, activarGuias } from "./comunes.js?v=d78e90c63f";

// El ticket en curso queda en memoria mientras se navega (se vacía al cobrar)
const ticket = new Map(); // productoId → cantidad
let medio = "efectivo";

const BILLETES = [2_000, 5_000, 10_000, 20_000];
const puedeEscanear = () => "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

export function vistaVender(cont, { usuario, datos, irA }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <button class="ticket-barra" type="button" hidden></button>
        <div class="caja-venta">
            <section class="productos" aria-label="Productos">
                <form class="buscar" novalidate>
                    <label class="buscador">
                        <i class="ti ti-search" aria-hidden="true"></i>
                        <span class="solo-lector">Buscar por nombre o código</span>
                        <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Nombre o código (Enter)">
                    </label>
                    ${puedeEscanear() ? `<button class="boton boton--secundario" type="button" data-camara><i class="ti ti-camera"></i><span class="solo-lector">Escanear con la cámara</span></button>` : ""}
                </form>
                <div class="cargar" hidden></div>
                <div class="grilla-productos"></div>
            </section>
            <section class="ticket" id="ticket" aria-label="Ticket"></section>
        </div>`;

    const q = cont.querySelector("[name=q]");
    const grilla = cont.querySelector(".grilla-productos");
    const panelCargar = cont.querySelector(".cargar");
    const lugarTicket = cont.querySelector(".ticket");
    const barra = cont.querySelector(".ticket-barra");
    barra.addEventListener("click", () => lugarTicket.scrollIntoView({ block: "start", behavior: "smooth" }));

    const agregar = (id, cuantos = 1) => {
        const p = datos.listarProductos().find((x) => x.id === id);
        if (!p) return;
        const nueva = (ticket.get(id) ?? 0) + cuantos;
        if (nueva > Math.min(p.stock, TOPES.cantidad)) {
            aviso(p.stock ? `De ${p.nombre} quedan solo ${p.stock}.` : `No queda ${p.nombre}.`, "error");
            return;
        }
        if (nueva <= 0) ticket.delete(id);
        else ticket.set(id, nueva);
        pintarTicket();
    };

    function pintarProductos() {
        const texto = q.value.trim();
        const lista = texto ? datos.listarProductos({ texto }).slice(0, 12) : datos.rapidos();
        grilla.innerHTML = `
            <p class="rotulo-chico">${texto ? `${lista.length ? "Resultados" : ""}` : "Lo más vendido"}</p>
            ${lista.length ? `<div class="botones-productos">${lista.map((p) => `
                <button class="producto${p.stock ? "" : " producto--sin"}" type="button" data-agregar="${esc(p.id)}"${p.stock ? "" : " disabled"}>
                    <span class="producto__nombre">${esc(p.nombre)}</span>
                    <span class="producto__precio">${esc(pesos(p.precio))}</span>
                    ${p.stock ? "" : `<small>No hay</small>`}
                </button>`).join("")}</div>`
            : vacio(/^\d{4,14}$/.test(texto) ? "No está ese código. Apretá Enter para cargarlo." : "No hay productos con ese nombre.", "ti-search")}`;
        grilla.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => agregar(b.dataset.agregar)));
    }

    function pintarTicket() {
        const items = [...ticket].map(([productoId, cantidad]) => ({ productoId, cantidad }));
        const unidades = items.reduce((t, i) => t + i.cantidad, 0);
        let armado = { renglones: [], total: 0 };
        try {
            if (items.length) armado = datos.armarTicket(items);
        } catch (e) {
            aviso(e, "error");
        }
        barra.hidden = !items.length;
        barra.innerHTML = `<i class="ti ti-receipt" aria-hidden="true"></i> ${unidades} ${unidades === 1 ? "producto" : "productos"} · <b>${esc(pesos(armado.total))}</b> <span>Cobrar ↓</span>`;
        const clientes = datos.listarClientes();
        lugarTicket.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Ticket</h2>
            ${items.length ? `
            <ul class="renglones">${armado.renglones.map((r) => `
                <li class="renglon">
                    <span class="renglon__nombre">${esc(r.nombre)}<small>${esc(pesos(r.precio))} c/u</small></span>
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-menos="${esc(r.productoId)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>
                        <b>${esc(r.cantidad)}</b>
                        <button class="boton-icono" type="button" data-mas="${esc(r.productoId)}" aria-label="Uno más de ${esc(r.nombre)}"><i class="ti ti-plus"></i></button>
                    </span>
                    <span class="renglon__total">${esc(pesos(r.precio * r.cantidad))}</span>
                </li>`).join("")}
            </ul>
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
                ${medio === "fiado" ? `
                <label>¿A quién?
                    <select name="cliente">
                        <option value="">Elegí de la libreta…</option>
                        ${clientes.map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)}${c.detalle ? ` (${esc(c.detalle)})` : ""} · debe ${esc(pesos(c.deuda))}</option>`).join("")}
                    </select>
                </label>
                <p class="tope-aviso" aria-live="polite"></p>` : ""}
                <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-cash"></i> Cobrar ${esc(pesos(armado.total))}</button>
            </form>
            <button class="boton-link vaciar" type="button"><i class="ti ti-trash"></i> Vaciar ticket</button>`
            : `<p class="nota"><i class="ti ti-hand-finger"></i> Tocá un producto o escribí su código para empezar.</p>`}`;

        lugarTicket.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => agregar(b.dataset.mas, 1)));
        lugarTicket.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => agregar(b.dataset.menos, -1)));
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
        form.cliente?.addEventListener("change", () => {
            const p = lugarTicket.querySelector(".tope-aviso");
            if (!form.cliente.value) return (p.textContent = "");
            const t = datos.revisarTope(form.cliente.value, armado.total);
            p.className = `tope-aviso${t.pasa ? " tope-aviso--pasa" : ""}`;
            p.innerHTML = t.pasa
                ? `<i class="ti ti-alert-triangle"></i> Debería ${esc(pesos(t.despues))} y su tope es ${esc(pesos(t.tope))}.${usuario.rol === "dueno" ? " Si cobrás igual, lo autorizás vos." : " Lo tiene que autorizar Rubén."}`
                : `Debe ${esc(pesos(t.deuda))} → con esto, ${esc(pesos(t.despues))} (tope ${esc(pesos(t.tope))}).`;
        });
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const datosVenta = { items, medio, pagaCon: pagaCon?.value ? Number(pagaCon.value) : null, clienteId: form.cliente?.value || null };
            try {
                if (medio === "fiado" && datosVenta.clienteId && datos.revisarTope(datosVenta.clienteId, armado.total).pasa && usuario.rol === "dueno") {
                    if (!confirm("Se pasa del tope de fiado. ¿Lo autorizás igual?")) return;
                    datosVenta.autorizarTope = true;
                }
                const v = datos.vender(usuario, datosVenta);
                ticket.clear();
                vendido(v);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    /** Después de cobrar: lo que pasó y el paso siguiente del recorrido. */
    function vendido(v) {
        const recorrido = usuario.rol === "empleada"
            ? v.medio === "fiado"
                ? guia("u-dueno", "/stock/aumento", "Pasá a Rubén: subí los precios de un proveedor")
                : `<p class="nota pista"><i class="ti ti-hand-finger"></i> Ahora probá anotar un fiado: leche y pan lactal para Graciela.</p>`
            : "";
        lugarTicket.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h2 class="titulo">${v.medio === "fiado" ? "Anotado" : "Vendido"}</h2>
                <p>${esc(pesos(v.total))} · ${esc(MEDIOS[v.medio])}${v.cliente ? ` · ${esc(v.cliente.nombre)}` : ""}</p>
                ${v.vuelto !== null ? `<p class="vuelto vuelto--grande">Vuelto: <b>${esc(pesos(v.vuelto))}</b></p>` : ""}
                ${v.cliente ? `<p class="nota"><i class="ti ti-notebook"></i> ${esc(v.cliente.nombre)} debe ahora ${esc(pesos(v.cliente.deuda))}.</p>` : ""}
                <button class="boton boton--secundario" type="button" data-nueva><i class="ti ti-plus"></i> Nueva venta</button>
            </div>
            ${recorrido}`;
        barra.hidden = true;
        lugarTicket.querySelector("[data-nueva]").addEventListener("click", () => {
            medio = "efectivo";
            pintarTicket();
            q.focus();
        });
        activarGuias(lugarTicket, irA);
        if (matchMedia("(max-width: 999px)").matches) lugarTicket.scrollIntoView({ block: "start" });
        pintarProductos();
    }

    /** Código que no está: "¿Lo cargás?" con nombre, precio y cuántos hay. Queda en el ticket. */
    function ofrecerCargar(codigo) {
        panelCargar.hidden = false;
        panelCargar.innerHTML = `
            <form class="formulario bloque" novalidate>
                <h2 class="subtitulo"><i class="ti ti-barcode"></i> El código ${esc(codigo)} no está: ¿lo cargás?</h2>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" placeholder="Ej: Alfajor de maicena" required></label>
                <div class="formulario__fila">
                    <label>Precio<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" required></label>
                    <label>¿Cuántos hay?<input name="stock" type="number" inputmode="numeric" min="1" max="${TOPES.stock}" step="1" value="1"></label>
                </div>
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
                const p = datos.cargarProducto(usuario, { nombre: f.nombre.value, codigo, precio: Number(f.precio.value), stock: Number(f.stock.value) });
                panelCargar.hidden = true;
                q.value = "";
                aviso(`${p.nombre} cargado`);
                pintarProductos();
                agregar(p.id);
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
            agregar(p.id);
            q.value = "";
            pintarProductos();
            return;
        }
        if (/^\d{4,14}$/.test(t)) return ofrecerCargar(t);
        const lista = datos.listarProductos({ texto: t });
        if (lista.length === 1) {
            agregar(lista[0].id);
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

    pintarProductos();
    pintarTicket();
    if (usuario.rol === "empleada" && !ticket.size) {
        grilla.insertAdjacentHTML("afterbegin", `<p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: tocá “Gaseosa cola 1,5 L” y “Alfajor triple”, y cobrá con $10.000.</p>`);
    }
}

/** La cámara del celular lee el código de barras (solo donde el navegador sabe hacerlo: Chrome en Android). */
async function escanear(alLeer) {
    const capa = document.createElement("div");
    capa.className = "camara";
    capa.innerHTML = `
        <div class="camara__caja">
            <video playsinline muted></video>
            <p>Apuntá al código de barras</p>
            <button class="boton boton--secundario" type="button"><i class="ti ti-x"></i> Cerrar</button>
        </div>`;
    document.body.append(capa);
    let flujo = null;
    let seguir = true;
    const cerrar = () => {
        seguir = false;
        flujo?.getTracks().forEach((t) => t.stop());
        capa.remove();
    };
    capa.querySelector("button").addEventListener("click", cerrar);
    try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = capa.querySelector("video");
        video.srcObject = flujo;
        await video.play();
        const lector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
        while (seguir) {
            const [codigo] = await lector.detect(video);
            if (codigo?.rawValue) {
                cerrar();
                alLeer(codigo.rawValue);
                return;
            }
            await new Promise((r) => setTimeout(r, 250));
        }
    } catch {
        cerrar();
        aviso("No se pudo usar la cámara. Escribí el código o usá el lector.", "error");
    }
}
