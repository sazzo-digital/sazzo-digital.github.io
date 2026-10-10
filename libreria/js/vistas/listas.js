// ============================================
// Listas escolares (Mariela y Joaquín): los pedidos de listas que llegan del celu o se arman en el mostrador.
// En cada pedido: si alcanza el stock de cada artículo (y, si no, otro de la misma familia: el cuaderno rojo por el
// azul), "Separar" (se descuenta del stock), "Avisar" (mensaje para copiar) y "Cobrar y entregar" (queda como venta).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=114958267d";
import { mostrarMensaje } from "../../kit/js/mensaje.js?v=114958267d";
import { ESTADOS_PEDIDO, MEDIOS, TOPES, pesos } from "../datos.js?v=114958267d";
import { guia, activarGuias, pasos, pastillaEstado, tarjetaPedido, cuando } from "./comunes.js?v=114958267d";

/** Billetes "redondos" para cobrar una lista: el próximo múltiplo de $10.000, de $50.000 y $100.000. */
const billetesPara = (total) => [...new Set([10_000, 50_000, 100_000].map((b) => Math.ceil(Math.max(1, total) / b) * b))].slice(0, 3);

export function vistaListas(cont, { usuario, datos, consulta }) {
    const filtro = consulta.get("ver");
    const estado = ESTADOS_PEDIDO[filtro] ? filtro : null;
    const todos = datos.listarPedidos(usuario);
    const lista = estado ? todos.filter((p) => p.estado === estado) : todos.filter((p) => p.estado !== "anulada");
    const cuenta = (e) => todos.filter((p) => p.estado === e).length;
    const nuevaWeb = todos.find((p) => p.estado === "nueva" && p.origen === "web");
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/listas${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Listas escolares</h1>
            <a class="boton boton--chico" href="#/listas/nueva"><i class="ti ti-plus"></i> Armar una en el mostrador</a>
        </div>
        ${nuevaWeb ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Te llegó la lista de ${esc(nuevaWeb.para)}: tocala para armarla y separarla.</p>` : ""}
        <div class="numeros-caja">
            <div class="numero-caja"><span>Para armar</span><b>${esc(cuenta("nueva"))}</b></div>
            <div class="numero-caja"><span>Separadas</span><b>${esc(cuenta("separada"))}</b><small>esperando que las busquen</small></div>
            <div class="numero-caja"><span>Entregadas</span><b>${esc(cuenta("entregada"))}</b></div>
            <div class="numero-caja"><span>Listas cargadas</span><b>${esc(datos.listas().length)}</b><small>de los colegios</small></div>
        </div>
        <nav class="chips filtro-listas" aria-label="Filtrar">
            ${chip(null, "Activas y entregadas")}
            ${chip("nueva", `Para armar (${cuenta("nueva")})`)}
            ${chip("separada", `Separadas (${cuenta("separada")})`)}
            ${chip("entregada", "Entregadas")}
            ${chip("anulada", "Anuladas")}
        </nav>
        ${lista.length ? `<ul class="tarjetas">${lista.map((pe) => tarjetaPedido(pe, `#/listas/${pe.id}`)).join("")}</ul>`
            : vacio("No hay listas con ese filtro.", "ti-school")}`;
}

/** Armar una lista en el mostrador: elegir la del colegio, sacar lo que ya tienen y para quién es. */
export function vistaNuevaLista(cont, { usuario, datos }) {
    const listas = datos.listas();
    let listaId = listas[0]?.id;
    const sin = new Set();

    function pintar() {
        const l = listas.find((x) => x.id === listaId);
        const elegidos = l.items.filter((i) => !sin.has(i.productoId));
        cont.innerHTML = `
            <a class="volver" href="#/listas"><i class="ti ti-arrow-left"></i> Listas escolares</a>
            <h1 class="titulo">Armar una lista</h1>
            <p class="nota"><i class="ti ti-info-circle"></i> Las listas de los colegios ya están cargadas: elegí la que trajeron y destildá lo que ya tienen.</p>
            <div class="chips" role="radiogroup" aria-label="Lista del colegio">
                ${listas.map((x) => `<button class="chip${x.id === listaId ? " activo" : ""}" type="button" role="radio" aria-checked="${x.id === listaId}" data-lista="${esc(x.id)}">${esc(x.nombre)} · ${esc(pesos(x.total))}</button>`).join("")}
            </div>
            <div class="lista-escolar">
                <section class="bloque">
                    <h2 class="subtitulo"><i class="ti ti-clipboard-list"></i> ${esc(l.nombre)}</h2>
                    <ul class="items-lista">${l.items.map((i) => `
                        <li><label class="item-lista">
                            <input type="checkbox" data-producto="${esc(i.productoId)}"${sin.has(i.productoId) ? "" : " checked"}>
                            <span class="item-lista__nombre">${esc(i.nombre)}<small>${esc(i.cantidad)} × ${esc(pesos(i.precio))}</small></span>
                            <b class="item-lista__monto">${esc(pesos(i.subtotal))}</b>
                        </label></li>`).join("")}
                    </ul>
                </section>
                <form class="bloque formulario resumen-lista" novalidate>
                    <div class="total"><span>Total</span><b>${esc(pesos(elegidos.reduce((t, i) => t + i.subtotal, 0)))}</b></div>
                    <label>¿Para quién es?
                        <input name="para" maxlength="${TOPES.para}" required placeholder="Ej: Martina · ${esc(l.grado)}">
                    </label>
                    <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Anotar la lista</button>
                </form>
            </div>`;
        cont.querySelectorAll("[data-lista]").forEach((b) => b.addEventListener("click", () => {
            listaId = b.dataset.lista;
            sin.clear();
            pintar();
        }));
        cont.querySelectorAll("[data-producto]").forEach((c) => c.addEventListener("change", () => {
            if (c.checked) sin.delete(c.dataset.producto);
            else sin.add(c.dataset.producto);
            const para = cont.querySelector("[name=para]").value;
            pintar();
            cont.querySelector("[name=para]").value = para;
        }));
        cont.querySelector(".resumen-lista").addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const pe = datos.nuevoPedido(usuario, { listaId, sin: [...sin], para: e.target.para.value });
                aviso(`Lista N° ${pe.numero} anotada`);
                location.hash = `#/listas/${pe.id}`;
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
    if (!listaId) cont.innerHTML = vacio("Todavía no hay listas cargadas.", "ti-school");
    else pintar();
}

/** Un pedido de lista: armarlo, separarlo, avisar, cobrar y entregar (o anularlo). */
export function vistaPedido(cont, opciones, recien = null) {
    const { usuario, datos, irA, params: [id] } = opciones;
    const pe = datos.pedido(id);
    const empleado = usuario.rol === "empleado";
    const otraVez = (r = null) => vistaPedido(cont, opciones, r);
    let medio = "efectivo";

    const filaItem = (i) => {
        let estado;
        if (pe.estado !== "nueva") estado = i.falta ? `<span class="pastilla pastilla--mal"><i class="ti ti-circle-x" aria-hidden="true"></i>Faltó</span>` : `<span class="pastilla pastilla--bien"><i class="ti ti-check" aria-hidden="true"></i>Separado</span>`;
        else if (i.alcanza) estado = `<span class="pastilla pastilla--bien"><i class="ti ti-circle-check" aria-hidden="true"></i>Hay · ${esc(i.stock)}</span>`;
        else estado = `<span class="pastilla pastilla--mal"><i class="ti ti-alert-triangle" aria-hidden="true"></i>Hay ${esc(i.stock)} de ${esc(i.cantidad)}</span>`;
        const otro = pe.estado === "nueva" && !i.alcanza
            ? i.alternativa
                ? `<div class="item-pedido__otro"><button class="boton boton--chico boton--secundario" type="button" data-cambiar="${esc(i.productoId)}" data-otro="${esc(i.alternativa.id)}"><i class="ti ti-arrows-exchange"></i> Cambiar por ${esc(i.alternativa.nombre)} (hay ${esc(i.alternativa.stock)})</button></div>`
                : `<small class="item-pedido__otro falta">Si la separás así, queda como "faltó" y no se cobra.</small>`
            : "";
        return `
            <li class="fila-stock item-pedido">
                <span class="fila-stock__nombre">${esc(i.nombre)}<small>${esc(i.cantidad)} × ${esc(pesos(i.precio))}${i.cambiadoDe ? ` · en vez de ${esc(i.cambiadoDe)}` : ""}</small></span>
                <b class="fila-stock__precio">${i.falta ? "—" : esc(pesos(i.precio * i.cantidad))}</b>
                ${estado}
                ${otro}
            </li>`;
    };

    const quien = pe.origen === "web" ? `Pedida desde el celu${pe.cliente ? ` por ${esc(pe.cliente)}` : ""}` : `Anotada en el mostrador${pe.por ? ` por ${esc(pe.por)}` : ""}`;
    const sinAlcanzar = pe.items.filter((i) => !i.alcanza).length;

    cont.innerHTML = `
        <a class="volver" href="#/listas"><i class="ti ti-arrow-left"></i> Listas escolares</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">N° ${esc(pe.numero)} · ${esc(pe.para)}</h1>
            ${pastillaEstado(pe.estado)}
        </div>
        <p class="tarjeta__quien">${esc(pe.lista)} · ${quien} · ${esc(cuando(pe.creado))}</p>
        ${pasos(pe)}
        ${recien === "separada" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Separada</h2>
            <p>${esc(pe.articulos)} artículos · ${esc(pesos(pe.total))} · se descontaron del stock</p>
        </div>` : ""}
        ${recien === "entregada" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Entregada y cobrada</h2>
            <p>${esc(pesos(pe.total))}${opciones.vuelto != null ? ` · vuelto <b>${esc(pesos(opciones.vuelto))}</b>` : ""}</p>
        </div>` : ""}
        ${pe.estado === "nueva" && empleado ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Fijate que haya de todo${sinAlcanzar ? ": hay algo que no alcanza, cambialo por otro" : ""} y separala. Se descuenta del stock.</p>` : ""}
        <ul class="filas-stock items-pedido">${pe.items.map(filaItem).join("")}</ul>
        <div class="total"><span>${pe.estado === "nueva" && sinAlcanzar ? "Si la separás así" : "Total"}</span><b>${esc(pesos(pe.estado === "nueva" ? pe.totalSiSepara : pe.total))}</b></div>
        <div class="acciones-pedido"></div>`;

    const acciones = cont.querySelector(".acciones-pedido");

    if (pe.estado === "nueva") {
        acciones.innerHTML = `
            <button class="boton boton--ancho boton--grande" type="button" data-separar><i class="ti ti-package"></i> Separar la lista</button>
            ${htmlAnular("Anular el pedido")}`;
        acciones.querySelector("[data-separar]").addEventListener("click", () => {
            try {
                datos.separarPedido(usuario, pe.id);
                aviso("Lista separada: se descontó del stock");
                otraVez("separada");
            } catch (err) {
                aviso(err, "error");
            }
        });
    } else if (pe.estado === "separada") {
        acciones.innerHTML = `
            <div class="acciones">
                <button class="boton boton--secundario" type="button" data-avisar><i class="ti ti-message-circle"></i> Avisar${pe.cliente ? ` a ${esc(pe.cliente)}` : ""} que está lista</button>
                ${pe.avisado ? `<span class="nota avisado"><i class="ti ti-check"></i> Avisado ${esc(cuando(pe.avisado))}</span>` : ""}
            </div>
            ${empleado && recien === "separada" ? guia("u-duena", "/stock?ver=pedir", "Pasá a Mariela: mirá qué hay que reponer") : ""}
            <form class="formulario bloque entregar" novalidate>
                <h2 class="subtitulo"><i class="ti ti-cash"></i> Vinieron a buscarla: cobrar y entregar</h2>
                <div class="chips medios" role="radiogroup" aria-label="Cómo paga"></div>
                <div class="pago-efectivo"></div>
                <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Cobrar ${esc(pesos(pe.total))} y entregar</button>
            </form>
            ${htmlAnular("Anular (lo separado vuelve al stock)")}`;
        acciones.querySelector("[data-avisar]").addEventListener("click", () => {
            try {
                const { mensaje } = datos.avisarPedido(usuario, pe.id);
                mostrarMensaje(`Avisar${pe.cliente ? ` a ${pe.cliente}` : ""}`, mensaje);
                const marca = acciones.querySelector(".avisado");
                if (marca) marca.innerHTML = `<i class="ti ti-check"></i> Avisado recién`;
                else acciones.querySelector("[data-avisar]").insertAdjacentHTML("afterend", `<span class="nota avisado"><i class="ti ti-check"></i> Avisado recién</span>`);
            } catch (err) {
                aviso(err, "error");
            }
        });
        const f = acciones.querySelector(".entregar");
        const pintarPago = () => {
            f.querySelector(".medios").innerHTML = Object.entries(MEDIOS).map(([m, texto]) =>
                `<button class="chip${medio === m ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === m}" data-medio="${m}">${texto}</button>`).join("");
            f.querySelector(".pago-efectivo").innerHTML = medio === "efectivo" ? `
                <label>Paga con (si querés saber el vuelto)
                    <input name="pagaCon" type="number" inputmode="numeric" min="0" max="${TOPES.pagaCon}" step="1" placeholder="Ej: 50000">
                </label>
                <div class="billetes">${billetesPara(pe.total).map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesos(b))}</button>`).join("")}</div>
                <p class="vuelto" aria-live="polite"></p>` : "";
            f.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
                medio = b.dataset.medio;
                pintarPago();
            }));
            const pagaCon = f.querySelector("[name=pagaCon]");
            const mostrarVuelto = () => {
                const n = Number(pagaCon.value);
                const p = f.querySelector(".vuelto");
                if (!pagaCon.value) p.textContent = "";
                else if (!Number.isInteger(n) || n < pe.total) p.innerHTML = `<span class="falta">Con ${esc(pesos(n || 0))} no alcanza.</span>`;
                else p.innerHTML = `Vuelto: <b>${esc(pesos(n - pe.total))}</b>`;
            };
            pagaCon?.addEventListener("input", mostrarVuelto);
            f.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
                pagaCon.value = b.dataset.billete;
                mostrarVuelto();
            }));
        };
        pintarPago();
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const v = f.querySelector("[name=pagaCon]")?.value;
            try {
                const { venta } = datos.entregarPedido(usuario, pe.id, { medio, pagaCon: v ? Number(v) : null });
                aviso("Lista entregada y cobrada");
                vistaPedido(cont, { ...opciones, vuelto: venta.vuelto }, "entregada");
            } catch (err) {
                aviso(err, "error");
            }
        });
    } else if (pe.estado === "entregada") {
        acciones.innerHTML = `
            <p class="nota"><i class="ti ti-receipt"></i> Cobrada ${esc(cuando(pe.entregado))}: quedó en la caja del día.</p>
            ${recien === "entregada" ? `<a class="boton boton--secundario boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del día</a>` : ""}`;
    }

    cont.querySelectorAll("[data-cambiar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const r = datos.cambiarArticulo(usuario, pe.id, b.dataset.cambiar, b.dataset.otro);
            aviso(`Cambiado: ${r.items.find((i) => i.productoId === b.dataset.otro)?.nombre ?? "listo"}`);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    acciones.querySelector("[data-anular]")?.addEventListener("click", () => {
        if (!confirm(pe.estado === "separada" ? "¿Anular el pedido? Lo separado vuelve al stock." : "¿Anular el pedido?")) return;
        try {
            datos.anularPedido(usuario, pe.id);
            aviso("Pedido anulado");
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    });
    activarGuias(cont, irA);
}

const htmlAnular = (texto) => `<button class="boton-link anular" type="button" data-anular><i class="ti ti-ban"></i> ${esc(texto)}</button>`;
