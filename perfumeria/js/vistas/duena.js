// ============================================
// Pantallas de la dueña (Carolina): los pedidos (el día arriba; los nuevos resaltados; preparado → avisar →
// entregado), el stock (frascos y botellas madre en ml, lo que hay que pedir primero) y las clientas (lo que compra
// cada una y "Cumplen este mes" con el saludo para copiar).
// ============================================
import { esc, aviso, vacio, fechaCorta, fechaHora } from "../../kit/js/ui.js?v=c76a163ed1";
import { TOPES, MADRE_POCO_ML, pesos } from "../datos.js?v=c76a163ed1";
import { frasco, pastillaPedido, mostrarMensaje } from "./comunes.js?v=c76a163ed1";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function vistaPedidos(cont, { usuario, datos }) {
    const p = datos.pedidos(usuario);
    const tarjeta = (o) => `
        <li class="tarjeta${o.nuevo ? " tarjeta--nuevo" : ""}">
            <div class="tarjeta__fila">
                <b>${esc(o.clienta)} · N° ${esc(o.numero)}</b>
                ${pastillaPedido(o)}
            </div>
            <ul class="items">${o.renglones.map((r) => `<li><span>${r.cantidad > 1 ? `${esc(r.cantidad)} × ` : ""}${esc(r.nombre)}<small>${esc(r.presentacionTexto)}</small></span><b>${esc(pesos(r.precio * r.cantidad))}</b></li>`).join("")}</ul>
            <div class="tarjeta__pie">
                <span class="tarjeta__quien">${esc(fechaHora(o.creadoEn))} · <b>${esc(pesos(o.total))}</b></span>
                <span class="acciones">
                    ${o.estado === "nuevo" ? `<button class="boton boton--chico" type="button" data-accion="preparar" data-id="${esc(o.id)}"><i class="ti ti-package"></i> Preparado</button>` : ""}
                    ${o.estado === "preparado" ? `<button class="boton boton--chico" type="button" data-accion="avisar" data-id="${esc(o.id)}"><i class="ti ti-message-circle"></i> ${o.avisado ? "Volver a avisar" : "Avisar que está listo"}</button>
                    <button class="boton boton--chico boton--secundario" type="button" data-accion="entregar" data-id="${esc(o.id)}"><i class="ti ti-check"></i> Entregado</button>` : ""}
                    <button class="boton-icono" type="button" data-accion="cancelar" data-id="${esc(o.id)}" title="Cancelar pedido" aria-label="Cancelar el pedido de ${esc(o.clienta)}"><i class="ti ti-x"></i></button>
                </span>
            </div>
        </li>`;
    cont.innerHTML = `
        <h1 class="titulo">Pedidos</h1>
        <div class="tira">
            <span><b>${esc(p.dia.llegaron)}</b> llegaron hoy</span>
            <span>Vendido hoy <b>${esc(pesos(p.dia.vendido))}</b></span>
            <span>Para retirar <b>${esc(pesos(p.dia.porRetirar))}</b></span>
        </div>
        <h2 class="subtitulo"><i class="ti ti-inbox"></i> Nuevos <span class="contador-chico">${p.nuevos.length}</span></h2>
        ${p.nuevos.length ? `<ul class="tarjetas">${p.nuevos.map(tarjeta).join("")}</ul>` : `<p class="nota">No hay pedidos nuevos.</p>`}
        <h2 class="subtitulo"><i class="ti ti-package"></i> Preparados, para retirar <span class="contador-chico">${p.preparados.length}</span></h2>
        ${p.preparados.length ? `<ul class="tarjetas">${p.preparados.map(tarjeta).join("")}</ul>` : `<p class="nota">Nada para retirar.</p>`}
        ${p.entregadosHoy.length ? `
        <details class="bloque">
            <summary>Entregados hoy (${p.entregadosHoy.length})</summary>
            <ul class="tarjetas">${p.entregadosHoy.map((o) => `<li class="tarjeta"><div class="tarjeta__fila"><b>${esc(o.clienta)} · N° ${esc(o.numero)}</b><b>${esc(pesos(o.total))}</b></div></li>`).join("")}</ul>
        </details>` : ""}`;

    const otraVez = () => vistaPedidos(cont, { usuario, datos });
    const acciones = {
        preparar: (id) => {
            const o = datos.preparar(usuario, id);
            aviso(`Pedido de ${o.clienta} preparado: se descontó el stock`);
        },
        avisar: (id) => {
            const r = datos.avisarListo(usuario, id);
            mostrarMensaje("Avisar que está listo", r.mensaje);
        },
        entregar: (id) => {
            datos.entregar(usuario, id);
            aviso("Entregado");
        },
        cancelar: (id) => {
            if (!confirm("¿Cancelar el pedido? Si estaba preparado, el stock vuelve.")) throw null;
            datos.cancelar(usuario, id);
            aviso("Pedido cancelado");
        }
    };
    cont.querySelectorAll("[data-accion]").forEach((b) => b.addEventListener("click", () => {
        try {
            acciones[b.dataset.accion](b.dataset.id);
            otraVez();
        } catch (err) {
            if (err) aviso(err, "error");
        }
    }));
}

export function vistaStock(cont, { usuario, datos }) {
    const lista = datos.stock(usuario);
    const pedir = lista.filter((p) => p.pedir.length).length;
    cont.innerHTML = `
        <h1 class="titulo">Stock</h1>
        <p class="nota"><i class="ti ti-info-circle"></i> Los decants salen de la botella madre: cuando preparás un pedido, se descuentan los ml solos.${pedir ? ` <b>${pedir} para pedir.</b>` : ""}</p>
        <ul class="tarjetas">${lista.map((p) => {
            const pct = Math.min(100, Math.round((p.ml / 250) * 100));
            return `
            <li class="tarjeta tarjeta--abre${p.pedir.length ? " tarjeta--pedir" : ""}">
                <div class="tarjeta__fila">
                    <a class="tarjeta__titulo" href="#/perfume/${esc(p.id)}">${frasco(p.familia)}${esc(p.nombre)}</a>
                    ${p.pedir.length ? `<span class="pastilla pastilla--ojo">Pedir: ${esc(p.pedir.join(", "))}</span>` : ""}
                </div>
                <div class="madre">
                    <span>Botella madre <b>${esc(p.ml)} ml</b><small>${esc(Math.floor(p.ml / 10))} decants de 10 · ${esc(Math.floor(p.ml / 5))} de 5</small></span>
                    <span class="madre__barra${p.ml < MADRE_POCO_ML ? " madre__barra--poco" : ""}"><span style="width:${pct}%"></span></span>
                </div>
                <p class="tarjeta__quien">Frascos de 50 ml: <b>${esc(p.stock50)}</b> · de 100 ml: <b>${esc(p.stock100)}</b></p>
                <details class="corregir">
                    <summary>Llegó mercadería / corregir</summary>
                    <form class="formulario" novalidate data-perfume="${esc(p.id)}">
                        <div class="formulario__fila formulario__fila--3">
                            <label>Madre (ml)<input name="ml" type="number" inputmode="numeric" min="0" max="${TOPES.ml}" step="1" value="${esc(p.ml)}"></label>
                            <label>Frascos 50<input name="stock50" type="number" inputmode="numeric" min="0" max="${TOPES.frascos}" step="1" value="${esc(p.stock50)}"></label>
                            <label>Frascos 100<input name="stock100" type="number" inputmode="numeric" min="0" max="${TOPES.frascos}" step="1" value="${esc(p.stock100)}"></label>
                        </div>
                        <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                    </form>
                </details>
            </li>`;
        }).join("")}</ul>`;
    cont.querySelectorAll("form[data-perfume]").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        const num = (v) => (v === "" ? NaN : Number(v));
        try {
            const p = datos.corregirStock(usuario, f.dataset.perfume, { ml: num(f.ml.value), stock50: num(f.stock50.value), stock100: num(f.stock100.value) });
            aviso(`${p.nombre}: stock guardado`);
            vistaStock(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}

let soloCumple = false;

export function vistaClientas(cont, { usuario, datos }) {
    const mes = MESES[new Date().getMonth()];
    const cumplen = datos.clientas(usuario, { esteMes: true });
    const lista = soloCumple ? cumplen : datos.clientas(usuario);
    cont.innerHTML = `
        <h1 class="titulo">Clientas</h1>
        <div class="chips" role="tablist">
            <button class="chip${soloCumple ? "" : " activo"}" type="button" data-cumple="">Todas</button>
            <button class="chip chip--alerta${soloCumple ? " activo" : ""}" type="button" data-cumple="1"><i class="ti ti-cake"></i> Cumplen en ${esc(mes)} <b>${cumplen.length}</b></button>
        </div>
        ${soloCumple ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Mandales un saludo con un regalo: es lo que más las hace volver.</p>` : ""}
        ${lista.length ? `<ul class="tarjetas">${lista.map((c) => `
            <li class="tarjeta${soloCumple ? " tarjeta--cumple" : ""}">
                <div class="tarjeta__fila">
                    <b><i class="ti ti-user" aria-hidden="true"></i> ${esc(c.nombre)}</b>
                    <span class="pastilla pastilla--suave"><i class="ti ti-cake"></i> ${esc(c.cumpleDia)} de ${esc(MESES[c.cumpleMes - 1])}</span>
                </div>
                <p class="tarjeta__quien">${c.compras ? `${esc(c.compras)} ${c.compras === 1 ? "compra" : "compras"} · la última el ${esc(fechaCorta(c.ultima))}${c.favorito ? ` · le gusta ${esc(c.favorito)}` : ""}` : "Todavía no compró"}</p>
                ${soloCumple ? `
                <div class="tarjeta__pie">
                    <small>${c.saludadaEn ? `La saludaste el ${esc(fechaCorta(c.saludadaEn.slice(0, 10)))}` : "Todavía no la saludaste"}</small>
                    <button class="boton boton--chico" type="button" data-saludar="${esc(c.id)}"${c.saludadaEn ? " disabled" : ""}><i class="ti ti-gift"></i> Saludarla</button>
                </div>` : ""}
            </li>`).join("")}</ul>` : vacio("Nadie cumple este mes.", "ti-cake")}`;
    cont.querySelectorAll("[data-cumple]").forEach((b) => b.addEventListener("click", () => {
        soloCumple = !!b.dataset.cumple;
        vistaClientas(cont, { usuario, datos });
    }));
    cont.querySelectorAll("[data-saludar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const r = datos.saludar(usuario, b.dataset.saludar);
            mostrarMensaje(`Saludar a ${r.clienta.nombre}`, r.mensaje);
            vistaClientas(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}
