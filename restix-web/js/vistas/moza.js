// ============================================
// Pantallas de la moza (Lara): el plano del salón (Salón, Vereda, Barra y Pedidos Ya; en el celu, las mesas en
// grilla), la comanda de una mesa (al enviar se separa solo lo de la cocina y lo de la barra), el cobro dividiendo la
// cuenta (todo junto, en partes iguales o por lo que consumió cada uno, cada parte con su medio de pago) y la caja.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=aa4351ebaa";
import { CATEGORIAS, MEDIOS, MEDIOS_PERSONAL, MOTIVOS_PERSONAL, TOPES, carta, dividir, pesos } from "../datos.js?v=aa4351ebaa";
import { MARCA, NEGOCIO, PERSONAS } from "../marca.js?v=aa4351ebaa";
import { htmlBotonSonido, activarBotonSonido, ding } from "../../kit/js/celular.js?v=aa4351ebaa";
import { ticket, importe, guia, activarGuias, haceMin, hora, consignaPersona } from "./comunes.js?v=aa4351ebaa";
import { activarConsigna } from "../../kit/js/consigna.js?v=aa4351ebaa";
import { diaLocalDe } from "../../kit/js/fechas.js?v=aa4351ebaa";

const ESTADO_MESA = { libre: "Libre", abierta: "Abierta", cobrando: "Cobrando" };

let sectorElegido = null;

export function vistaPlano(cont, { usuario, datos, irA }) {
    const p = datos.plano();
    const mesaPaso = usuario.rol === "moza" && datos.pasos(usuario).findIndex((hecho) => !hecho) === 0 ? "m4" : null;
    const sectorPaso = p.sectores.find((s) => s.mesas.some((m) => m.id === mesaPaso))?.id;
    const sectores = [...p.sectores.map((s) => ({ id: s.id, texto: s.texto, cantidad: s.mesas.filter((m) => m.estado !== "libre").length })), { id: "pedidos-ya", texto: "Pedidos Ya", cantidad: p.pedidosYa.length }];
    const elegido = sectorElegido ?? sectorPaso ?? "salon";
    const estadoVisual = (m) => m.estado === "cobrando" ? "cobrando" : m.comidaLista ? "lista" : m.cocinaPendiente ? "cocina" : m.estado === "abierta" ? "abierta" : "libre";
    const estados = { libre: ["libre", "libres"], abierta: ["abierta", "abiertas"], cocina: ["en cocina", "en cocina"], lista: ["con comida lista", "con comida lista"], cobrando: ["cobrando", "cobrando"] };
    const cuentas = Object.fromEntries(Object.keys(estados).map((estado) => [estado, p.sectores.flatMap((s) => s.mesas).filter((m) => estadoVisual(m) === estado).length]));
    const panel = (id) => `id="sector-${esc(id)}" role="tabpanel" aria-labelledby="pestana-${esc(id)}" data-sector="${esc(id)}"${id === elegido ? "" : " hidden"}`;
    const decirMesa = (m) => {
        if (m.estado === "libre") return `${m.nombre}: ${ESTADO_MESA[m.estado]}`;
        const marcas = [m.estado === "cobrando" ? "cobrando" : "", m.cocinaPendiente ? "la cocina está en eso" : "", m.comidaLista ? "comida lista" : "", m.sinMandar ? "hay cosas sin mandar" : ""].filter(Boolean);
        return [`${m.nombre}: ${ESTADO_MESA[m.estado]}`, `${m.abierta.personas} comensales`, `${m.minutos} minutos`, pesos(m.total), ...marcas].join(", ");
    };
    const tile = (m) => `
        <a class="mesa${m.total >= 1_000_000 ? " mesa--importe-largo" : ""} mesa--${esc(m.estado)}${m.id === mesaPaso ? " mesa--paso" : ""}" data-estado="${esc(estadoVisual(m))}" href="#/mesa/${esc(m.id)}">
            <span class="solo-lector">${esc(decirMesa(m))}</span>
            <b class="mesa__numero" aria-hidden="true">${esc(m.nombre.replace(/^\D+/, ""))}</b>
            ${m.estado === "libre" ? "" : `
            <small aria-hidden="true"><i class="ti ti-users" aria-hidden="true"></i> ${esc(m.abierta.personas)} · ${esc(m.minutos)}'</small>
            <small class="mesa__total" aria-hidden="true">${importe(m.total)}</small>
            <span class="mesa__marcas" aria-hidden="true">
                ${m.estado === "cobrando" ? `<i class="ti ti-cash"></i>` : ""}
                ${m.cocinaPendiente ? `<i class="ti ti-flame"></i>` : ""}
                ${m.comidaLista ? `<i class="ti ti-circle-check"></i>` : ""}
                ${m.sinMandar ? `<i class="ti ti-send"></i>` : ""}
            </span>`}
            ${m.abierta?.heredada ? `<small class="mesa__heredada">viene del turno anterior</small>` : ""}
            ${m.id === mesaPaso ? `<span class="mesa__paso">Tocá acá</span>` : ""}
        </a>`;
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Salón</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        ${consignaPersona(datos, usuario)}
        <details class="resumen-salon">
        <summary>${esc(p.resumen.ocupadas)} de ${esc(p.resumen.total)} ocupadas · ${esc(p.resumen.personas)} personas</summary>
        <div class="tira">
            <span><b>${esc(p.resumen.ocupadas)}</b> de ${esc(p.resumen.total)} ocupadas</span>
            <span><b>${esc(p.resumen.personas)}</b> personas</span>
            <span>Abierto <b>${importe(p.resumen.abierto)}</b></span>
        </div>
        <div class="estados-salon">${Object.entries(cuentas).filter(([, n]) => n > 0).map(([estado, n]) => `<span class="estado-chip" data-estado="${esc(estado)}"><b>${esc(n)}</b> ${esc(estados[estado][n === 1 ? 0 : 1])}</span>`).join("")}</div>
        </details>
        <div class="pestanas-salon" role="tablist" aria-label="Sectores">${sectores.map((s) => `<button class="pestana-salon" type="button" role="tab" id="pestana-${esc(s.id)}" aria-controls="sector-${esc(s.id)}" aria-selected="${esc(s.id === elegido)}" tabindex="${s.id === elegido ? "0" : "-1"}" data-sector="${esc(s.id)}">${esc(s.texto)} <small>${esc(s.cantidad)}</small></button>`).join("")}</div>
        ${p.sectores.map((s) => `
        <section class="sector" ${panel(s.id)}>
            <h2 class="subtitulo">${esc(s.texto)}</h2>
            <div class="mesas mesas--${esc(s.id)}">${s.mesas.map(tile).join("")}</div>
        </section>`).join("")}
        <section class="sector" ${panel("pedidos-ya")}>
            <h2 class="subtitulo"><i class="ti ti-motorbike"></i> Pedidos Ya</h2>
            ${p.pedidosYa.length ? `<ul class="tarjetas">${p.pedidosYa.map((o) => `
                <li class="tarjeta${o.estado === "nuevo" ? " tarjeta--nuevo" : ""}">
                    <div class="tarjeta__fila"><b>${esc(o.cliente)}</b><span class="pastilla pastilla--${o.estado === "nuevo" ? "alerta" : o.cocinaLista ? "bien" : "suave"}">${o.estado === "nuevo" ? "Nuevo" : o.cocinaLista ? "Listo para el repartidor" : "En la cocina"}</span></div>
                    ${o.heredada ? `<p class="nota">viene del turno anterior</p>` : ""}
                    <p class="tarjeta__quien">${esc(o.items.map((i) => `${i.cantidad} ${i.nombre}`).join(", "))} · <b>${importe(o.total)}</b> · ${esc(haceMin(o.minutos))}</p>
                    <div class="tarjeta__pie"><span></span>
                        ${o.estado === "nuevo" ? `<button class="boton boton--chico" type="button" data-aceptar="${esc(o.id)}"><i class="ti ti-check"></i> Aceptar</button>` : ""}
                        ${o.estado === "aceptado" ? `<button class="boton boton--chico" type="button" data-entregar="${esc(o.id)}"${o.cocinaLista ? "" : " disabled"}><i class="ti ti-motorbike"></i> Entregado al repartidor</button>` : ""}
                    </div>
                </li>`).join("")}</ul>` : `<p class="nota">No hay pedidos de Pedidos Ya.</p>`}
        </section>
        ${guia("u-cliente", "/inicio", "Mirá la carta que ve el cliente con el QR")}`;
    const pestanas = [...cont.querySelectorAll(".pestana-salon")];
    const elegir = (id) => {
        sectorElegido = id;
        pestanas.forEach((b) => {
            const activa = b.dataset.sector === id;
            b.setAttribute("aria-selected", String(activa));
            b.tabIndex = activa ? 0 : -1;
        });
        cont.querySelectorAll(".sector[role=tabpanel]").forEach((s) => { s.hidden = s.dataset.sector !== id; });
    };
    pestanas.forEach((b, i) => {
        b.addEventListener("click", () => elegir(b.dataset.sector));
        b.addEventListener("keydown", (e) => {
            if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
            e.preventDefault();
            const siguiente = pestanas[(i + (e.key === "ArrowRight" ? 1 : -1) + pestanas.length) % pestanas.length];
            elegir(siguiente.dataset.sector);
            siguiente.focus();
        });
    });
    const hacer = (fn, msj) => {
        try {
            fn();
            aviso(msj);
            vistaPlano(cont, { usuario, datos, irA });
        } catch (err) {
            aviso(err, "error");
        }
    };
    cont.querySelectorAll("[data-aceptar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.aceptarPY(usuario, b.dataset.aceptar), "Aceptado: la comida va a la cocina")));
    cont.querySelectorAll("[data-entregar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.entregarPY(usuario, b.dataset.entregar), "Entregado: suma a la caja")));
    activarGuias(cont, irA);
    activarConsigna(cont, MARCA);
}

let cobrosEnCurso = new WeakMap();
window.addEventListener("sazzo-reinicio", () => {
    cobrosEnCurso = new WeakMap();
    sectorElegido = null;
});

function elegirMesa(datos, id) {
    if (cobrosEnCurso.get(datos)?.id !== id) cobrosEnCurso.delete(datos);
}

let categoria = "pizzas";
const bloquearProductosHasta = new WeakMap();

export function vistaMesa(cont, { usuario, datos, irA, params: [id] }, enviado = null) {
    elegirMesa(datos, id);
    const m = datos.mesa(id);
    if (m.estado === "libre") return abrir(cont, { usuario, datos, irA, id, m });
    const productos = carta().filter((c) => c.cat === categoria);
    const otraVez = (env = null) => vistaMesa(cont, { usuario, datos, irA, params: [id] }, env);
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(m.nombre)}</h1>
            <span class="pastilla pastilla--${m.estado === "cobrando" ? "mal" : "bien"}">${esc(ESTADO_MESA[m.estado])}</span>
        </div>
        <p class="nota"><i class="ti ti-users"></i> ${esc(m.abierta.personas)} ${m.abierta.personas === 1 ? "persona" : "personas"} · ${esc(m.abierta.moza)} · abierta ${esc(haceMin(m.minutos))}</p>
        ${m.abierta.heredada ? `<p class="nota" data-heredada>viene del turno anterior</p>` : ""}
        ${m.cocinaPendiente ? `<p class="alerta alerta--alerta"><i class="ti ti-flame"></i> La cocina está preparando el pedido.</p>` : ""}
        ${m.comidaLista ? `<p class="alerta alerta--info estado-ok"><i class="ti ti-circle-check"></i> La comida está lista: a servir.</p>` : ""}
        ${enviado ? `
        <div class="enviado">
            <p class="enviado__titulo"><i class="ti ti-send"></i> Mandado. Se separó solo:</p>
            <div class="tickets">${enviado.cocina ? ticket(enviado.cocina) : ""}${enviado.barra ? ticket(enviado.barra) : ""}</div>
        </div>` : ""}
        ${consignaPersona(datos, usuario)}
        <div class="comanda">
            <section class="carta">
                <div class="chips" role="tablist" aria-label="Categoría">${Object.entries(CATEGORIAS).map(([k, c]) => `
                    <button class="chip${k === categoria ? " activo" : ""}" type="button" data-cat="${k}"><i class="ti ${esc(c.icono)}"></i> ${esc(c.texto)}</button>`).join("")}
                </div>
                <div class="productos">${productos.map((p) => `
                    <button class="producto" type="button" data-agregar="${esc(p.id)}">
                        <span>${esc(p.nombre)}<small class="producto__cantidad">${esc(m.abierta.renglones.filter((r) => r.itemId === p.id && !r.anulacion).reduce((n, r) => n + r.cantidad, 0))} en la mesa</small></span><b>${importe(p.precio)}</b>
                    </button>`).join("")}
                </div>
            </section>
            <section class="cuenta">
                <h2 class="subtitulo"><i class="ti ti-receipt"></i> Pedido de la mesa</h2>
                ${m.abierta.renglones.length ? `<ul class="renglones">${m.abierta.renglones.map((r) => `
                    <li class="renglon${r.anulacion ? " renglon-anulado" : r.enviado ? "" : " renglon--nuevo"}">
                        <span class="renglon__cant">${esc(r.cantidad)}</span>
                        <span class="renglon__nombre">${esc(r.nombre)}<small>${r.anulacion ? `Anulado · ${esc(r.anulacion.motivo)} · ${esc(r.anulacion.por)} · ${esc(hora(r.anulacion.en))}` : r.enviado ? "Mandado" : "Sin mandar"}</small></span>
                        <b>${importe(r.precio * r.cantidad)}</b>
                        ${r.anulacion ? "" : r.enviado ? `${usuario.rol === "moza" ? `<button class="boton-icono" type="button" data-anular-renglon="${esc(r.id)}" aria-label="Anular ${esc(r.nombre)}"><i class="ti ti-circle-x"></i></button>` : ""}` : `<button class="boton-icono" type="button" data-sacar="${esc(r.id)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>`}
                    </li>`).join("")}</ul>` : `<p class="nota">Tocá los productos para sumarlos.</p>`}
                <div class="cuenta__acciones"><div class="total"><span>Total</span><b>${importe(m.total)}</b></div>
                ${m.sinMandar ? `<button class="boton boton--ancho boton--grande" type="button" data-enviar><i class="ti ti-send"></i> Mandar a cocina y barra</button>` : ""}
                ${m.total > 0 && !m.sinMandar ? `<a class="boton boton--ancho${m.cocinaPendiente ? " boton--secundario" : ""}" href="#/mesa/${esc(m.id)}/cobrar"><i class="ti ti-cash"></i> Cobrar</a>` : ""}
                ${m.total > 0 && m.estado !== "cobrando" && usuario.rol === "moza" ? `<button class="boton boton--secundario boton--ancho" type="button" data-pedir-cuenta>Pedir la cuenta</button>` : ""}
                <div data-confirmar-cuenta hidden><p>Hay renglones sin mandar. ¿Pedís la cuenta igual?</p><button class="boton" type="button" data-cuenta-si>Confirmar</button><button class="boton boton--secundario" type="button" data-cuenta-no>Volver</button></div>
                </div>
                <div data-anulacion-renglon></div>
            </section>
        </div>
        ${m.comandas.some((c) => c.items.some((i) => i.anulacion)) ? `<details class="bloque" data-comandas-mesa open><summary>Comandas de cocina y barra</summary><div class="tickets">${m.comandas.map((c) => ticket(c)).join("")}</div></details>` : ""}
        ${usuario.rol === "moza" ? `<details class="bloque" data-anular-mesa>
            <summary>Anular esta mesa</summary>
            <form class="formulario" data-motivo-anulacion novalidate>
                <label>Motivo<input name="motivo" type="text" maxlength="${esc(TOPES.motivo)}" placeholder="Ej: Mesa abierta por error" required></label>
                <button class="boton boton--secundario" type="submit">Anular mesa</button>
            </form>
            <div data-confirmacion-anulacion hidden role="region" aria-label="Confirmar anulación" tabindex="-1"></div>
        </details>` : ""}`;
    const pedirCuenta = () => {
        try {
            datos.pedirCuenta(usuario, id);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    };
    cont.querySelector("[data-pedir-cuenta]")?.addEventListener("click", () => {
        if (datos.mesa(id).sinMandar) cont.querySelector("[data-confirmar-cuenta]").hidden = false;
        else pedirCuenta();
    });
    cont.querySelector("[data-cuenta-si]").addEventListener("click", pedirCuenta);
    cont.querySelector("[data-cuenta-no]").addEventListener("click", () => { cont.querySelector("[data-confirmar-cuenta]").hidden = true; });
    cont.querySelectorAll("[data-anular-renglon]").forEach((b) => b.addEventListener("click", () => {
        const panel = cont.querySelector("[data-anulacion-renglon]");
        const r = m.abierta.renglones.find((r) => r.id === b.dataset.anularRenglon);
        panel.innerHTML = `<form class="formulario" novalidate><p>¿Anulás ${esc(r.cantidad)} ${esc(r.nombre)}? La cocina o la barra lo ven tachado.</p><label>Motivo<input name="motivo" maxlength="${esc(TOPES.motivo)}" required></label><button class="boton" type="submit">Confirmar anulación del renglón</button><button class="boton boton--secundario" type="button" data-volver-renglon>Volver</button></form>`;
        panel.querySelector("input").focus();
        panel.querySelector("[data-volver-renglon]").addEventListener("click", () => { panel.innerHTML = ""; });
        panel.querySelector("form").addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                if (JSON.stringify(datos.mesa(id).abierta) !== firmaMesa) {
                    otraVez();
                    return aviso("La mesa cambió. Revisala antes de anular.", "error");
                }
                datos.anularRenglon(usuario, id, r.id, e.target.elements.motivo.value);
                otraVez();
                aviso("Renglón anulado: quedó registrado con su motivo");
            } catch (err) {
                aviso(err, "error");
            }
        });
    }));
    const formAnular = cont.querySelector("[data-motivo-anulacion]");
    const confirmarAnular = cont.querySelector("[data-confirmacion-anulacion]");
    let motivoAnular = null;
    const firmaMesa = JSON.stringify(m.abierta);
    formAnular?.addEventListener("submit", (e) => {
        e.preventDefault();
        if (motivoAnular !== null) return;
        const motivo = formAnular.elements.motivo.value.trim();
        if (!motivo || motivo.length > TOPES.motivo) return aviso(`Escribí un motivo de hasta ${TOPES.motivo} letras.`, "error");
        motivoAnular = motivo;
        formAnular.elements.motivo.readOnly = true;
        formAnular.querySelector("button").disabled = true;
        confirmarAnular.innerHTML = `<p>¿Anulás ${esc(m.nombre)} por ${importe(m.total)}?</p><p>Motivo: ${esc(motivo)}</p><p>La mesa queda libre y la cocina ve lo pendiente como anulado.</p><button class="boton" type="button" data-confirmar-anulacion>Confirmar anulación</button><button class="boton boton--secundario" type="button" data-cancelar-anulacion>Volver</button>`;
        confirmarAnular.hidden = false;
        confirmarAnular.focus();
    });
    confirmarAnular?.addEventListener("click", (e) => {
        if (e.target.closest("[data-cancelar-anulacion]")) {
            motivoAnular = null;
            formAnular.elements.motivo.readOnly = false;
            formAnular.querySelector("button").disabled = false;
            confirmarAnular.hidden = true;
        }
        if (!e.target.closest("[data-confirmar-anulacion]") || motivoAnular === null) return;
        try {
            if (JSON.stringify(datos.mesa(id).abierta) !== firmaMesa) {
                otraVez();
                return aviso("La mesa cambió. Revisala antes de anular.", "error");
            }
            datos.anularMesa(usuario, id, motivoAnular);
            motivoAnular = null;
            otraVez();
            aviso("Mesa anulada: quedó registrada con su motivo");
        } catch (err) {
            aviso(err, "error");
        }
    });
    activarGuias(cont, irA);
    activarConsigna(cont, MARCA);
    cont.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
        categoria = b.dataset.cat;
        otraVez(enviado);
    }));
    cont.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => {
        if (Date.now() < (bloquearProductosHasta.get(cont) ?? 0)) return;
        try {
            datos.agregar(usuario, id, b.dataset.agregar);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelectorAll("[data-sacar]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.sacar(usuario, id, b.dataset.sacar);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelector("[data-enviar]")?.addEventListener("click", () => {
        try {
            otraVez(datos.enviar(usuario, id));
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err, "error");
        }
    });
}

/** Abrir una mesa libre: cuántas personas. */
function abrir(cont, { usuario, datos, irA, id, m }) {
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>
        <h1 class="titulo">${esc(m.nombre)}</h1>
        ${consignaPersona(datos, usuario)}
        <form class="formulario bloque" novalidate>
            <p class="rotulo-chico">¿Cuántas personas?</p>
            <div class="chips mesa-opciones">${Array.from({ length: TOPES.personas }, (_, i) => i + 1).map((n) => `<label class="chip chip--radio"><input type="radio" name="personas" value="${esc(n)}"${n === 3 ? " checked" : ""}>${esc(n)}</label>`).join("")}</div>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-armchair"></i> Abrir la mesa</button>
        </form>`;
    activarConsigna(cont, MARCA);
    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.abrirMesa(usuario, id, { personas: Number(new FormData(e.target).get("personas")) });
            bloquearProductosHasta.set(cont, Date.now() + 400);
            categoria = "pizzas";
            vistaMesa(cont, { usuario, datos, irA, params: [id] });
        } catch (err) {
            aviso(err, "error");
        }
    });
}

/** Cobrar: todo junto, en partes iguales o por lo que consumió cada uno; cada parte con su medio de pago. */
export function vistaCobro(cont, { usuario, datos, params: [id] }) {
    elegirMesa(datos, id);
    const m = datos.mesa(id);
    if (m.estado === "libre") {
        cobrosEnCurso.delete(datos);
        cont.innerHTML = `<a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>${vacio(`${m.nombre} ya está libre.`, "ti-armchair")}`;
        return;
    }
    const firma = JSON.stringify(m.abierta.renglones.map((r) => [r.id, r.cantidad, r.precio, !!r.anulacion]));
    let estado = cobrosEnCurso.get(datos);
    if (!estado || estado.apertura !== m.abierta.id) {
        estado = { id, apertura: m.abierta.id, firma, modo: "iguales", cuantos: Math.min(m.abierta.personas, TOPES.partes), asignado: {}, medios: [], cambio: false };
        cobrosEnCurso.set(datos, estado);
    }
    if (estado.firma !== firma) {
        estado.cambio = true;
        estado.firma = firma;
    }
    const unidades = m.abierta.renglones.filter((r) => !r.anulacion).flatMap((r) => Array.from({ length: r.cantidad }, (_, i) => ({ clave: `${r.id}-${i}`, nombre: r.nombre, precio: r.precio })));
    estado.asignado = Object.fromEntries(unidades.map((u, i) => [u.clave, estado.asignado[u.clave] ?? i % estado.cuantos]));

    function montos() {
        if (estado.modo === "junto") return [m.total];
        if (estado.modo === "iguales") return dividir(m.total, estado.cuantos);
        const sumas = Array(estado.cuantos).fill(0);
        unidades.forEach((u) => (sumas[estado.asignado[u.clave] ?? 0] += u.precio));
        return sumas;
    }

    function pintar() {
        const lista = montos();
        estado.montos = lista;
        lista.forEach((_, i) => { estado.medios[i] ??= i === 0 ? "efectivo" : "qr"; });
        cont.innerHTML = `
            <a class="volver" href="#/mesa/${esc(m.id)}"><i class="ti ti-arrow-left"></i> ${esc(m.nombre)}</a>
            <div class="titulo-con-accion"><h1 class="titulo">Cobrar ${esc(m.nombre)}</h1>${htmlBotonSonido(MARCA.prefijo)}</div>
            ${consignaPersona(datos, usuario)}
            ${estado.cambio ? `<p class="alerta alerta--alerta" role="status">La cuenta cambió: revisá el total</p>` : ""}
            ${m.sinMandar ? `<p class="nota">Hay cosas sin mandar: mandalas o sacalas antes de cobrar.</p>` : ""}
            <div class="panel total-cobro"><span class="panel__rotulo">Total</span><span class="panel__numero">${importe(m.total)}</span><small>${esc(m.abierta.personas)} ${m.abierta.personas === 1 ? "persona" : "personas"}</small></div>
            <div class="chips modos-cobro" role="tablist" aria-label="Cómo se divide">
                <button class="chip${estado.modo === "junto" ? " activo" : ""}" type="button" data-modo="junto">Todo junto</button>
                <button class="chip${estado.modo === "iguales" ? " activo" : ""}" type="button" data-modo="iguales">En partes iguales</button>
                <button class="chip${estado.modo === "items" ? " activo" : ""}" type="button" data-modo="items">Por lo que consumió cada uno</button>
            </div>
            ${estado.modo !== "junto" ? `
            <p class="rotulo-chico">¿Entre cuántos?</p>
            <div class="chips mesa-opciones">${Array.from({ length: TOPES.partes }, (_, i) => i + 1).map((n) => `<button class="chip${n === estado.cuantos ? " activo" : ""}" type="button" data-cuantos="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : ""}
            ${estado.modo === "items" ? `
            <ul class="unidades">${unidades.map((u) => `
                <li><span>${esc(u.nombre)}<small>${importe(u.precio)}</small></span>
                    <span class="chips chips--chicos mesa-opciones">${Array.from({ length: estado.cuantos }, (_, i) => `<button class="chip${estado.asignado[u.clave] === i ? " activo" : ""}" type="button" data-unidad="${esc(u.clave)}" data-persona="${esc(i)}" aria-pressed="${estado.asignado[u.clave] === i}">${esc(i + 1)}</button>`).join("")}</span>
                </li>`).join("")}
            </ul>` : ""}
            <ul class="partes">${lista.map((monto, i) => `
                <li class="parte${monto ? "" : " parte--vacia"}">
                    <span class="parte__quien">${lista.length > 1 ? `Persona ${i + 1}` : "Toda la mesa"}<b>${importe(monto)}</b></span>
                    <span class="chips chips--chicos">${Object.entries(MEDIOS).map(([k, t]) => `<button class="chip${estado.medios[i] === k ? " activo" : ""}" type="button" data-parte="${i}" data-medio="${k}">${esc(t)}</button>`).join("")}</span>
                </li>`).join("")}
            </ul>
            <button class="boton boton--ancho boton--grande boton-cobrar" type="button" data-cobrar><i class="ti ti-cash"></i><span>Cobrar</span>${importe(m.total)}</button>
            ${m.cocinaPendiente ? `<p class="nota"><i class="ti ti-flame"></i> Ojo: la cocina todavía está preparando algo de esta mesa.</p>` : ""}`;

        cont.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => {
            estado.modo = b.dataset.modo;
            pintar();
        }));
        cont.querySelectorAll("[data-cuantos]").forEach((b) => b.addEventListener("click", () => {
            estado.cuantos = Number(b.dataset.cuantos);
            unidades.forEach((u) => (estado.asignado[u.clave] = Math.min(estado.asignado[u.clave], estado.cuantos - 1)));
            pintar();
        }));
        cont.querySelectorAll("[data-unidad]").forEach((b) => b.addEventListener("click", () => {
            estado.asignado[b.dataset.unidad] = Number(b.dataset.persona);
            pintar();
        }));
        cont.querySelectorAll("[data-parte]").forEach((b) => b.addEventListener("click", () => {
            estado.medios[Number(b.dataset.parte)] = b.dataset.medio;
            pintar();
        }));
        activarConsigna(cont, MARCA);
        activarBotonSonido(cont, MARCA.prefijo); // "ding" al cobrar, apagado de entrada
        cont.querySelector("[data-cobrar]").addEventListener("click", () => {
            const resumen = montos().map((monto, i) => ({ monto, medio: estado.medios[i] }));
            const partes = resumen.filter((p) => p.monto > 0);
            try {
                const cobro = datos.cobrar(usuario, m.id, { partes, modo: estado.modo });
                cobrosEnCurso.delete(datos);
                ding(MARCA.prefijo);
                cont.innerHTML = `
                    <div class="hecho">
                        <i class="ti ti-circle-check" aria-hidden="true"></i>
                        <h1 class="titulo">Cobrado</h1>
                        <p>${esc(cobro.mesa)} · ${importe(cobro.total)}</p>
                        <ul class="resumen-cobro">${resumen.map((p, i) => `<li><span>${resumen.length > 1 ? `Persona ${i + 1}` : "Toda la mesa"}</span><b>${importe(p.monto)}</b><small>${p.monto ? esc(MEDIOS[p.medio] ?? (p.medio === "tarjeta" ? "Tarjeta" : p.medio)) : "Sin consumo"}</small></li>`).join("")}</ul>
                        <p class="nota"><i class="ti ti-armchair"></i> La mesa quedó libre.</p>
                    </div>
                    ${consignaPersona(datos, usuario)}
                    <a class="boton boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del turno</a>
                    <a class="boton boton--secundario boton--ancho" href="#/inicio"><i class="ti ti-layout-grid"></i> Volver al salón</a>`;
                activarConsigna(cont, MARCA);
                window.scrollTo(0, 0);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
    pintar();
}

export function vistaCaja(cont, { usuario, datos }) {
    const c = datos.caja(usuario);
    const medios = { ...MEDIOS, pedidosya: "Pedidos Ya" };
    const diferencia = (n) => n === 0 ? "Justo: no sobra ni falta nada." : n > 0 ? `Sobran ${importe(n)}.` : `Faltan ${importe(-n)}.`;
    const totalesEgresos = (caja) => `
        <p>Egresos en efectivo: ${importe(caja.egresosEfectivo)}</p>
        <p>Pagado al personal por transferencia: ${importe(caja.pagosTransferencia)} (no sale del cajón).</p>`;
    const resumenAnulaciones = (caja) => `<p>Anuladas: ${esc(caja.anulaciones.length)} ${caja.anulaciones.length === 1 ? "mesa" : "mesas"} por ${importe(caja.totalAnulado)}.</p>${caja.anulaciones.length ? `<ul class="caja-anulaciones">${caja.anulaciones.map((a) => `<li><b>${esc(a.mesa)}</b> · ${importe(a.total)} · ${esc(a.motivo)}<small>${esc(fechaCorta(diaLocalDe(a.en)))} a las ${esc(hora(a.en))} · ${esc(a.por)}</small></li>`).join("")}</ul>` : ""}`;
    const resumenPasadas = (caja) => `<p>Pasaron al turno siguiente: ${esc(caja.mesasPasadas.length)} ${caja.mesasPasadas.length === 1 ? "mesa" : "mesas"} por ${importe(caja.mesasPasadas.reduce((t, m) => t + m.total, 0))}.</p><p>Pedidos Ya que pasaron: ${esc(caja.pedidosPasados.length)} por ${importe(caja.pedidosPasados.reduce((t, p) => t + p.total, 0))}.</p>`;
    const resumenCierre = (ci) => `
        <p><b>${ci.tipo === "dia" ? "Cierre del día" : "Fin de turno"}</b></p>
        <p class="nota">${esc(fechaCorta(diaLocalDe(ci.hasta)))} a las ${esc(hora(ci.hasta))} · ${esc(ci.por)}</p>
        ${Number.isFinite(ci.entrado) && ci.porMedio ? `<p>Entró en el turno: ${importe(ci.entrado)}</p>${Object.entries(medios).map(([k, t]) => `<p class="cierre-medio">${esc(t)}: ${importe(ci.porMedio[k] ?? 0)}</p>`).join("")}` : ""}
        <p>Esperado: ${importe(ci.esperado)} · Contado: ${importe(ci.contado)}</p>
        ${totalesEgresos(ci)}
        ${resumenPasadas(ci)}
        ${resumenAnulaciones(ci)}
        <p class="cierre ${ci.diferencia === 0 ? "cierre--bien" : "cierre--ojo"}">${diferencia(ci.diferencia)}</p>`;
    const cobros = `<ul class="cobros">${c.cobros.map((co) => `
        <li><span><b>${esc(co.mesa)}</b><small>${esc(hora(co.en))} · ${esc(co.partes.map((p) => medios[p.medio]).join(" + "))}</small></span><b>${importe(co.total)}</b></li>`).join("")}</ul>`;
    cont.innerHTML = `
        <h1 class="titulo">Caja del turno</h1>
        ${consignaPersona(datos, usuario)}
        <div class="panel total-cobro"><span class="panel__rotulo">Entró en el turno</span><span class="panel__numero">${importe(c.total)}</span><small>${esc(c.cobros.length)} cobros · en las mesas todavía hay ${importe(c.abierto)}</small></div>
        <div class="medios${Object.values(c.porMedio).some((n) => n >= 1_000_000) ? " medios--importe-largo" : ""}">${Object.entries(medios).map(([k, t]) => `<div><span>${esc(t)}</span><b>${importe(c.porMedio[k])}</b></div>`).join("")}</div>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Cobros del turno</h2>
            ${c.cobros.length > 10 ? `<details><summary>Ver los ${esc(c.cobros.length)} cobros del turno</summary>${cobros}</details>` : c.cobros.length ? cobros : '<p class="nota">Todavía no hubo cobros en este turno.</p>'}
        </section>
        <section class="bloque caja-egresos">
            <h2 class="subtitulo">Pagar al personal</h2>
            <form class="formulario" data-pagar-personal novalidate>
                <label>A quién<select name="personaId" required>${PERSONAS.filter((p) => p.rol !== "cliente").map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join("")}</select></label>
                <label>Motivo<select name="motivo" required>${MOTIVOS_PERSONAL.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}</select></label>
                <label>Monto<input name="monto" type="number" inputmode="numeric" min="1" max="${esc(TOPES.monto)}" step="1" required></label>
                <label>Medio<select name="medio" required>${Object.entries(MEDIOS_PERSONAL).map(([id, texto]) => `<option value="${esc(id)}">${esc(texto)}</option>`).join("")}</select></label>
                <button class="boton" type="submit">Guardar pago</button>
            </form>
        </section>
        <section class="bloque caja-egresos">
            <h2 class="subtitulo">Gasto o retiro del cajón</h2>
            <p class="nota">Siempre sale del efectivo del cajón.</p>
            <form class="formulario" data-gasto-retiro novalidate>
                <label>Tipo<select name="tipo" required><option value="gasto">Gasto</option><option value="retiro">Retiro</option></select></label>
                <label>Motivo<input name="motivo" type="text" maxlength="${esc(TOPES.motivo)}" placeholder="Ej: Hielo" required></label>
                <label>Monto<input name="monto" type="number" inputmode="numeric" min="1" max="${esc(TOPES.monto)}" step="1" required></label>
                <button class="boton" type="submit">Guardar gasto o retiro</button>
            </form>
        </section>
        <section class="bloque" data-movimientos-turno>
            <h2 class="subtitulo">Movimientos del turno</h2>
            ${totalesEgresos(c)}
            ${c.movimientos.length ? `<ul class="caja-movimientos">${c.movimientos.map((m) => `<li><b>${esc(m.tipo === "personal" ? "Pago al personal" : m.tipo === "gasto" ? "Gasto" : "Retiro")}${m.persona ? ` · ${esc(m.persona)}` : ""} · ${esc(m.motivo)}</b><span>${esc(hora(m.en))} · ${esc(medios[m.medio])} · ${importe(m.monto)}</span><small>Cargó: ${esc(m.por)}</small></li>`).join("")}</ul>` : '<p class="nota">Todavía no hubo movimientos en este turno.</p>'}
        </section>
        <section class="bloque">
            <h2 class="subtitulo">Mesas anuladas del turno</h2>
            ${resumenAnulaciones(c)}
        </section>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-lock"></i> Terminar el turno o cerrar el día</h2>
            <p class="nota">Lo cerrás a mano al terminar tu jornada. Las mesas y Pedidos Ya pendientes pasan al turno siguiente. Para cerrar el día, no puede quedar nada abierto.</p>
            <p class="nota"><i class="ti ti-cash"></i> <span>En el cajón tiene que haber ${importe(c.enCajon)} (${importe(c.fondo)} de cambio + lo cobrado en efectivo − ${importe(c.egresosEfectivo)} de pagos al personal en efectivo, gastos y retiros del turno).</span></p>
            <form class="formulario" data-cerrar-caja novalidate>
                <label>Contá la plata del cajón
                    <span class="fila-form">
                        <input name="contado" type="number" inputmode="numeric" min="0" max="${esc(c.topeContado)}" step="1" placeholder="Ej: ${esc(c.enCajon)}">
                    </span>
                </label>
                <div class="caja-cierres-acciones">
                    <button class="boton" type="submit" name="tipo" value="turno">Terminar el turno</button>
                    <button class="boton boton--secundario" type="submit" name="tipo" value="dia">Cerrar el día</button>
                </div>
            </form>
            <div data-confirmacion hidden role="region" aria-label="Confirmar cierre" tabindex="-1"></div>
        </section>
        ${c.cierre ? `<section class="bloque" data-ultimo-cierre><h2 class="subtitulo">Último cierre · turno anterior</h2>${resumenCierre(c.cierre)}<p class="nota">Los números de arriba corresponden al turno nuevo.</p></section>` : ""}
        <section class="bloque" data-historial-cierres>
            <h2 class="subtitulo">Historial de cierres</h2>
            ${c.cierres.length ? `<ol>${c.cierres.map((ci) => `<li>${resumenCierre(ci)}</li>`).join("")}</ol>` : '<p class="nota">Todavía no hubo cierres.</p>'}
        </section>`;
    activarConsigna(cont, MARCA);
    for (const selector of ["[data-pagar-personal]", "[data-gasto-retiro]"]) {
        const formulario = cont.querySelector(selector);
        let guardando = false;
        formulario.addEventListener("submit", (e) => {
            e.preventDefault();
            if (guardando) return;
            guardando = true;
            try {
                const valores = Object.fromEntries(new FormData(formulario));
                valores.monto = Number(valores.monto);
                if (selector === "[data-pagar-personal]") datos.pagarPersonal(usuario, valores);
                else datos.gastoORetiro(usuario, valores);
                formulario.querySelector('[type="submit"]').disabled = true;
                vistaCaja(cont, { usuario, datos });
                aviso("Movimiento guardado");
            } catch (err) {
                guardando = false;
                aviso(err, "error");
            }
        });
    }
    const form = cont.querySelector("[data-cerrar-caja]");
    const campo = form.elements.contado;
    const botones = form.querySelectorAll('[type="submit"]');
    const confirmacion = cont.querySelector("[data-confirmacion]");
    let pendiente = null;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (pendiente) return;
        try {
            pendiente = datos.prepararCierre(usuario, campo.value === "" ? "" : Number(campo.value), e.submitter?.value ?? "turno");
            confirmacion.innerHTML = `
                <h3 class="subtitulo">${pendiente.tipo === "dia" ? "¿Cerrás el día?" : "¿Terminás este turno?"}</h3>
                <p>Esperado: ${importe(pendiente.enCajon)} · Contado: ${importe(pendiente.contado)}</p>
                ${totalesEgresos(pendiente)}
                ${resumenAnulaciones(pendiente)}
                <p>${diferencia(pendiente.diferencia)}</p>
                ${pendiente.mesasAbiertas ? `<p class="cierre cierre--ojo">Quedan ${esc(pendiente.mesasAbiertas)} ${pendiente.mesasAbiertas === 1 ? "mesa abierta" : "mesas abiertas"} por ${importe(pendiente.abierto)}. Esos cobros quedarán para el turno siguiente.</p>` : ""}
                ${pendiente.pedidosPasados.length ? `<p class="nota"><span>Pasan al turno siguiente ${esc(pendiente.pedidosPasados.length)} pedidos de Pedidos Ya por ${importe(pendiente.pedidosPasados.reduce((t, p) => t + p.total, 0))}.</span></p>` : ""}
                <button class="boton" type="button" data-confirmar-cierre>Confirmar cierre</button>
                <button class="boton boton--secundario" type="button" data-cancelar-cierre>Volver a contar</button>`;
            campo.readOnly = true;
            botones.forEach((b) => { b.disabled = true; });
            confirmacion.hidden = false;
            confirmacion.focus();
        } catch (err) {
            aviso(err, "error");
        }
    });
    confirmacion.addEventListener("click", (e) => {
        if (e.target.closest("[data-cancelar-cierre]")) {
            pendiente = null;
            confirmacion.hidden = true;
            campo.readOnly = false;
            botones.forEach((b) => { b.disabled = false; });
            campo.focus();
        }
        if (!e.target.closest("[data-confirmar-cierre]") || !pendiente) return;
        try {
            const actual = datos.prepararCierre(usuario, pendiente.contado, pendiente.tipo);
            const firma = (caja) => JSON.stringify([caja.desde, caja.enCajon, caja.cobros.map((co) => co.id), caja.movimientos, caja.egresosEfectivo, caja.pagosTransferencia, caja.mesasPasadas, caja.pedidosPasados, caja.anulaciones, caja.cierre?.id]);
            if (firma(actual) !== firma(pendiente)) {
                vistaCaja(cont, { usuario, datos });
                aviso("La caja cambió. Revisá los números y volvé a confirmar el cierre.", "error");
                return;
            }
            datos.cerrarCaja(usuario, pendiente.contado, pendiente.tipo);
            const mensaje = pendiente.tipo === "dia" ? "Día cerrado" : "Turno terminado";
            pendiente = null;
            aviso(mensaje);
            vistaCaja(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
