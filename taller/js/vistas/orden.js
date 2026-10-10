// ============================================
// La orden de trabajo de un auto: lo que dijo el cliente, lo que encontró el mecánico, el presupuesto (repuestos y
// mano de obra de una lista), los botones según el estado y la persona, y el historial con horas.
// El mecánico carga lo que encontró y los repuestos, sin ver precios. Y el presupuesto (dueño): para imprimir, con la
// firma del cliente en pantalla y en PDF para mandarlo por WhatsApp.
// ============================================
import { esc, aviso, fechaCorta, fechaHora } from "../../kit/js/ui.js?v=dbd4cbbcac";
import { fechaLocalISO } from "../../kit/js/fechas.js?v=dbd4cbbcac";
import { pedirFirma, esFirma } from "../../kit/js/firma.js?v=dbd4cbbcac";
import { htmlBotonDictar, activarDictado } from "../../kit/js/dictado.js?v=dbd4cbbcac";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=dbd4cbbcac";
import { ESTADOS, REPUESTOS, MANO_DE_OBRA, TOPES, pesos } from "../datos.js?v=dbd4cbbcac";
import { NEGOCIO } from "../marca.js?v=dbd4cbbcac";
import { guia, activarGuias, chapa, pastillaEstado, textoPromesa, mostrarMensaje } from "./comunes.js?v=dbd4cbbcac";

export function vistaOrden(cont, { usuario, datos, irA, params: [id] }) {
    const o = datos.orden(id, usuario);
    const dueno = usuario.rol === "dueno";
    const items = dueno ? [...REPUESTOS, ...MANO_DE_OBRA] : REPUESTOS;
    const otraVez = () => vistaOrden(cont, { usuario, datos, irA, params: [id] });
    const hacer = (fn, mensaje) => {
        try {
            const r = fn();
            if (mensaje) aviso(mensaje);
            otraVez();
            return r;
        } catch (err) {
            aviso(err, "error");
            return null;
        }
    };

    // Los botones de cada paso, según el estado y quién está
    const botones = [];
    if (dueno && (o.estado === "recibido" || o.estado === "presupuestado")) botones.push(`<button class="boton" type="button" data-accion="mandar"><i class="ti ti-send"></i> ${o.estado === "recibido" ? "Mandar presupuesto" : "Volver a mandar el presupuesto"}</button>`);
    if (dueno && o.estado === "presupuestado") botones.push(`<button class="boton" type="button" data-accion="aprobar"><i class="ti ti-thumb-up"></i> Aprobado</button>`);
    if (o.estado === "reparacion") {
        botones.push(`<button class="boton" type="button" data-accion="terminado"><i class="ti ti-circle-check"></i> Terminado</button>`);
        botones.push(`<button class="boton boton--secundario" type="button" data-accion="falta"><i class="ti ti-package"></i> Falta repuesto</button>`);
    }
    if (o.estado === "esperando") botones.push(`<button class="boton" type="button" data-accion="llego"><i class="ti ti-package-import"></i> Llegó el repuesto</button>`);
    if (dueno && o.estado === "listo") {
        botones.push(`<button class="boton" type="button" data-accion="avisar"><i class="ti ti-message-circle"></i> ${o.avisado ? "Volver a avisar" : "Avisar que está listo"}</button>`);
        botones.push(`<button class="boton boton--secundario" type="button" data-accion="entregar"><i class="ti ti-key"></i> Entregado</button>`);
    }

    // El paso siguiente del recorrido del momento wow
    let recorrido = "";
    if (!dueno && o.estado === "recibido" && o.renglones.length) recorrido = guia("u-dueno", `/orden/${o.id}`, "Mirá cómo lo ve Raúl");
    if (dueno && o.estado === "reparacion" && o.mecanico === "Seba") recorrido = guia("u-mecanico", `/orden/${o.id}`, "Pasá a Seba: que lo termine");
    if (!dueno && o.estado === "listo") recorrido = guia("u-dueno", `/orden/${o.id}`, "Mirá cómo lo ve Raúl: avisale al cliente");

    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> ${dueno ? "Taller" : "Mis autos"}</a>
        <div class="cabeza-orden">
            ${chapa(o.auto.patenteTexto, true)}
            <div>
                <h1 class="titulo">${esc(o.auto.modelo)}</h1>
                <p class="nota">${esc(o.cliente.nombre)} · orden N° ${esc(o.numero)} · ${esc(o.mecanico)}</p>
            </div>
            ${pastillaEstado(o)}
        </div>
        ${recorrido}
        <dl class="datos-orden">
            <div><dt>Entró</dt><dd>${esc(fechaHora(o.recibidaEn))}</dd></div>
            <div><dt>Prometido</dt><dd>${esc(fechaCorta(o.prometida))}<small>${textoPromesa(o)}</small></dd></div>
            <div><dt>Kilómetros</dt><dd>${esc(o.km.toLocaleString("es-AR"))}</dd></div>
            <div><dt>Nafta</dt><dd>${esc(o.nafta)}</dd></div>
        </dl>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-message-2"></i> Lo que dijo el cliente</h2>
            <p class="dijo">“${esc(o.dijo)}”</p>
            ${o.deja ? `<p class="nota"><i class="ti ti-briefcase"></i> Deja en el auto: ${esc(o.deja)}</p>` : ""}
            <form class="formulario encontro" novalidate>
                <label>Lo que encontró el mecánico
                    <textarea name="encontro" rows="2" maxlength="${TOPES.texto}" placeholder="Ej: pastillas y discos delanteros gastados"${o.editable ? "" : " disabled"}>${esc(o.encontro)}</textarea>
                </label>
                ${o.editable ? `<div class="encontro__botones">${htmlBotonDictar("encontro")}<button class="boton boton--chico boton--secundario" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button></div>` : ""}
            </form>
        </section>
        <section class="bloque presupuesto">
            <h2 class="subtitulo"><i class="ti ti-list-details"></i> ${dueno ? "Presupuesto" : "Repuestos que hacen falta"}</h2>
            ${o.renglones.length ? `<ul class="renglones">${o.renglones.map((r) => `
                <li class="renglon">
                    <span class="renglon__nombre"><i class="ti ${r.tipo === "mano" ? "ti-tool" : "ti-package"}" aria-hidden="true"></i>${esc(r.nombre)}${r.cantidad > 1 ? ` <b>x${esc(r.cantidad)}</b>` : ""}</span>
                    ${dueno ? `<span class="renglon__precio">${o.editable
                        ? `<input type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" value="${esc(r.precio)}" data-precio="${esc(r.id)}" aria-label="Precio de ${esc(r.nombre)}">`
                        : esc(pesos(r.precio))}</span><b class="renglon__total">${esc(pesos(r.precio * r.cantidad))}</b>` : ""}
                    ${o.editable && (dueno || r.tipo === "repuesto") ? `<button class="boton-icono" type="button" data-quitar="${esc(r.id)}" aria-label="Quitar ${esc(r.nombre)}"><i class="ti ti-x"></i></button>` : ""}
                </li>`).join("")}</ul>` : `<p class="nota"><i class="ti ti-info-circle"></i> Todavía no hay nada cargado.</p>`}
            ${dueno && o.renglones.length ? `<div class="total"><span>Total</span><b>${esc(pesos(o.total))}</b></div>` : ""}
            ${o.editable ? `
            <form class="agregar" novalidate>
                <select name="item" aria-label="Repuesto o trabajo">
                    <optgroup label="Repuestos">${REPUESTOS.map((i) => `<option value="${esc(i.id)}">${esc(i.nombre)}</option>`).join("")}</optgroup>
                    ${dueno ? `<optgroup label="Mano de obra">${MANO_DE_OBRA.map((i) => `<option value="${esc(i.id)}">${esc(i.nombre)}</option>`).join("")}</optgroup>` : ""}
                </select>
                <input name="cantidad" type="number" inputmode="numeric" min="1" max="${TOPES.cantidad}" step="1" value="1" aria-label="Cantidad">
                <button class="boton boton--chico" type="submit"><i class="ti ti-plus"></i> Agregar</button>
            </form>` : ""}
            ${dueno && o.renglones.length ? `<a class="boton-link imprimir-link" href="#/orden/${esc(o.id)}/imprimir"><i class="ti ti-file-text"></i> Presupuesto: imprimir, firma y PDF</a>` : ""}
        </section>
        ${botones.length ? `<div class="acciones-orden">${botones.join("")}</div>` : ""}
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-history"></i> Historial</h2>
            <ol class="historial">${o.historial.map((h) => `
                <li><b>${esc(h.estado === "avisado" ? "Avisado al cliente" : ESTADOS[h.estado]?.texto ?? h.estado)}</b><small>${esc(fechaHora(h.en))} · ${esc(h.por)}</small></li>`).join("")}
            </ol>
            ${dueno && o.editable || (dueno && o.estado === "listo") ? `<button class="boton-link anular" type="button" data-accion="anular"><i class="ti ti-ban"></i> Anular la orden</button>` : ""}
        </section>`;
    activarGuias(cont, irA);
    activarDictado(cont); // el mecánico con las manos sucias dicta lo que encontró

    cont.querySelector(".encontro")?.addEventListener("submit", (e) => {
        e.preventDefault();
        hacer(() => datos.anotar(usuario, o.id, { encontro: e.target.encontro.value }), "Guardado");
    });
    cont.querySelector(".agregar")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const c = e.target.cantidad.value;
        hacer(() => datos.agregarRenglon(usuario, o.id, { itemId: e.target.item.value, cantidad: c === "" ? NaN : Number(c) }), "Agregado");
    });
    cont.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.quitarRenglon(usuario, o.id, b.dataset.quitar), "Quitado")));
    cont.querySelectorAll("[data-precio]").forEach((i) => i.addEventListener("change", () =>
        hacer(() => datos.cambiarPrecio(usuario, o.id, i.dataset.precio, i.value === "" ? NaN : Number(i.value)), "Precio cambiado")));

    const acciones = {
        mandar: () => {
            const r = hacer(() => datos.mandarPresupuesto(usuario, o.id));
            if (r) mostrarMensaje("Mandar el presupuesto", r.mensaje);
        },
        aprobar: () => hacer(() => datos.aprobar(usuario, o.id), "Aprobado: pasa a reparación"),
        terminado: () => hacer(() => datos.terminado(usuario, o.id), "Terminado: está listo"),
        falta: () => hacer(() => datos.faltaRepuesto(usuario, o.id), "Esperando repuesto"),
        llego: () => hacer(() => datos.llegoRepuesto(usuario, o.id), "Vuelve a reparación"),
        avisar: () => {
            const r = hacer(() => datos.avisarListo(usuario, o.id));
            if (r) mostrarMensaje("Avisar que está listo", r.mensaje);
        },
        entregar: () => {
            if (!confirm("¿Lo entregaste? La orden sale de la pizarra y queda en el historial del auto.")) return;
            if (hacer(() => datos.entregar(usuario, o.id), "Entregado")) location.hash = "#/inicio";
        },
        anular: () => {
            if (!confirm("¿Anular la orden? Queda en el historial como anulada.")) return;
            if (hacer(() => datos.anular(usuario, o.id), "Orden anulada")) location.hash = "#/inicio";
        }
    };
    cont.querySelectorAll("[data-accion]").forEach((b) => b.addEventListener("click", () => acciones[b.dataset.accion]()));
}

// La firma del cliente de cada presupuesto: solo mientras la demo está abierta (no se guarda en el celular)
const firmas = new Map();

/**
 * El presupuesto: con el nombre del taller, "no válido como factura" y la marca de agua de la demo. Se imprime, el
 * cliente lo firma en la pantalla y sale en PDF (con la firma) para mandarlo por WhatsApp.
 */
export function vistaImprimir(cont, { usuario, datos, params: [id] }) {
    const o = datos.orden(id, usuario);
    const firma = esFirma(firmas.get(o.id)) ? firmas.get(o.id) : null;
    const otraVez = () => vistaImprimir(cont, { usuario, datos, params: [id] });
    cont.innerHTML = `
        <div class="no-imprimir acciones-imprimir">
            <a class="volver" href="#/orden/${esc(o.id)}"><i class="ti ti-arrow-left"></i> Volver a la orden</a>
            <div class="acciones-imprimir__botones">
                <button class="boton boton--secundario" type="button" data-firmar><i class="ti ti-signature"></i> ${firma ? "Firmar de nuevo" : "Firma del cliente"}</button>
                <button class="boton boton--secundario" type="button" data-pdf><i class="ti ti-file-type-pdf"></i> PDF</button>
                <button class="boton" type="button" data-imprimir><i class="ti ti-printer"></i> Imprimir</button>
            </div>
        </div>
        <p class="nota pista no-imprimir"><i class="ti ti-hand-finger"></i> Probá: que ${esc(o.cliente.nombre.split(" ")[0])} firme con el dedo y mandale el PDF por WhatsApp.</p>
        <article class="hoja">
            <span class="hoja__agua" aria-hidden="true">DEMO · datos inventados</span>
            <header class="hoja__cabeza">
                <div><b class="hoja__taller">${esc(NEGOCIO)}</b><small>Hecho con Sazzo Taller (demo)</small></div>
                <div class="hoja__numero"><b>Presupuesto N° ${esc(o.numero)}</b><small>${esc(fechaCorta(fechaLocalISO(0)))}</small></div>
            </header>
            <dl class="hoja__datos">
                <div><dt>Cliente</dt><dd>${esc(o.cliente.nombre)}</dd></div>
                <div><dt>Vehículo</dt><dd>${esc(o.auto.modelo)} · ${esc(o.auto.patenteTexto)}</dd></div>
                <div><dt>Kilómetros</dt><dd>${esc(o.km.toLocaleString("es-AR"))}</dd></div>
            </dl>
            <p class="hoja__dijo"><b>Motivo:</b> ${esc(o.dijo)}${o.encontro ? ` · <b>Diagnóstico:</b> ${esc(o.encontro)}` : ""}</p>
            <table class="hoja__tabla">
                <thead><tr><th>Detalle</th><th>Cant.</th><th class="hoja__precio">Precio</th><th>Subtotal</th></tr></thead>
                <tbody>${o.renglones.map((r) => `<tr><td>${esc(r.nombre)}<small class="hoja__unitario">${esc(pesos(r.precio))} c/u</small></td><td>${esc(r.cantidad)}</td><td class="hoja__precio">${esc(pesos(r.precio))}</td><td>${esc(pesos(r.precio * r.cantidad))}</td></tr>`).join("")}</tbody>
                <tfoot><tr><td colspan="2">Total</td><td class="hoja__precio"></td><td>${esc(pesos(o.total))}</td></tr></tfoot>
            </table>
            ${firma ? `<figure class="hoja__firma"><img src="${esc(firma)}" alt="Firma de ${esc(o.cliente.nombre)}"><figcaption>Firma: ${esc(o.cliente.nombre)} · acepta el presupuesto</figcaption></figure>` : ""}
            <p class="hoja__aviso">Presupuesto · no válido como factura · válido por 7 días</p>
        </article>`;
    cont.querySelector("[data-imprimir]").addEventListener("click", () => window.print());
    cont.querySelector("[data-firmar]").addEventListener("click", async () => {
        const nueva = await pedirFirma({ titulo: "Firma del cliente", texto: `${o.cliente.nombre} acepta el presupuesto N° ${o.numero} por ${pesos(o.total)}.` });
        if (!nueva || !cont.isConnected) return;
        firmas.set(o.id, nueva);
        aviso("Firmado: ya está en el presupuesto y en el PDF");
        otraVez();
    });
    const botonPdf = cont.querySelector("[data-pdf]");
    botonPdf.addEventListener("click", async () => {
        botonPdf.disabled = true;
        try {
            const blob = await armarPdf({
                negocio: NEGOCIO,
                pie: "Hecho con Sazzo Taller (demo)",
                titulo: "Presupuesto",
                numero: o.numero,
                fecha: fechaCorta(fechaLocalISO(0)),
                datos: [["Cliente", o.cliente.nombre], ["Vehículo", `${o.auto.modelo} · ${o.auto.patenteTexto}`], ["Kilómetros", o.km.toLocaleString("es-AR")]],
                texto: `Motivo: ${o.dijo}${o.encontro ? `\nDiagnóstico: ${o.encontro}` : ""}`,
                columnas: ["Detalle", "Cant.", "Precio", "Subtotal"],
                filas: o.renglones.map((r) => [r.nombre, String(r.cantidad), pesos(r.precio), pesos(r.precio * r.cantidad)]),
                total: pesos(o.total),
                firma: firma ? { imagen: firma, aclaracion: o.cliente.nombre } : null,
                aviso: "Presupuesto · no válido como factura · válido por 7 días"
            });
            if (cont.isConnected) pdfListo(blob, `Presupuesto ${o.numero} ${NEGOCIO}`);
        } catch (e) {
            console.warn(e);
            aviso("No se pudo armar el PDF. Probá de nuevo con mejor señal.", "error");
        } finally {
            botonPdf.disabled = false;
        }
    });
}
