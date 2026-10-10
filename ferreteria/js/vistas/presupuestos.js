// ============================================
// Presupuestos (Osvaldo y Nahuel): los que piden los clientes desde el celu y los que se arman en el mostrador.
// En cada uno: los renglones como los escribió el cliente, con el artículo que entendió el buscador; lo que no se
// entendió ("lo de la foto") se elige buscando; se cambia la cantidad (metros con decimales), se saca o se suma un
// renglón. "Mandar" fija los precios por 7 días y arma el mensaje; "PDF" lo deja para compartir. Cuando lo acepta,
// "Pasar a venta" descuenta el stock y lo cobra (de contado o a su cuenta corriente).
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=0f2d2843ae";
import { diaLocalDe } from "../../kit/js/fechas.js?v=0f2d2843ae";
import { mostrarMensaje } from "../../kit/js/mensaje.js?v=0f2d2843ae";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=0f2d2843ae";
import { ESTADOS_PRESUPUESTO, TOPES, UNIDADES, VALIDEZ_DIAS, pesos, precioConUnidad, cantidadTexto, entender, diaMes } from "../datos.js?v=0f2d2843ae";
import { NEGOCIO } from "../marca.js?v=0f2d2843ae";
import { guia, activarGuias, pasos, pastillaEstado, tarjetaPresupuesto, cuando, validez, pintarCobro, etiquetaUnidad, htmlFoto } from "./comunes.js?v=0f2d2843ae";

/** Lo que va en el PDF del presupuesto (lo usan el mostrador y el cliente). */
export const datosPdf = (pr) => ({
    negocio: NEGOCIO,
    pie: "Hecho con Sazzo Ferretería (demo)",
    titulo: "Presupuesto",
    numero: String(pr.numero),
    fecha: fechaCorta(diaLocalDe(pr.enviado ?? pr.creado)),
    datos: [["Cliente", pr.cliente || "—"], ...(pr.obra ? [["Obra", pr.obra]] : []), ...(pr.vence ? [["Vale hasta", diaMes(pr.vence)]] : [])],
    columnas: ["Detalle", "Cant.", "Precio", "Subtotal"],
    filas: pr.items.filter((i) => i.productoId).map((i) => [i.nombre, cantidadTexto(i.cantidad, i.unidad), precioConUnidad(i.precioUsado, i.unidad), pesos(i.subtotal)]),
    total: pesos(pr.total),
    aviso: `Presupuesto · no válido como factura · válido por ${VALIDEZ_DIAS} días`
});

export function vistaPresupuestos(cont, { usuario, datos, consulta }) {
    const filtro = consulta.get("ver");
    const estado = ESTADOS_PRESUPUESTO[filtro] ? filtro : null;
    const todos = datos.listarPresupuestos(usuario);
    const lista = estado ? todos.filter((p) => p.estado === estado) : todos.filter((p) => p.estado !== "anulado");
    const cuenta = (e) => todos.filter((p) => p.estado === e).length;
    const nuevoWeb = todos.find((p) => p.estado === "pedido" && p.origen === "web");
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/presupuestos${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Presupuestos</h1>
            <a class="boton boton--chico" href="#/presupuestos/nuevo"><i class="ti ti-plus"></i> Armar uno en el mostrador</a>
        </div>
        ${nuevoWeb ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Te llegó el pedido de ${esc(nuevoWeb.cliente)}${nuevoWeb.items.some((i) => i.foto) ? " (con una foto)" : ""}: tocalo para armarlo y mandárselo.</p>` : ""}
        <div class="numeros-caja">
            <div class="numero-caja"><span>Para armar</span><b>${esc(cuenta("pedido"))}</b></div>
            <div class="numero-caja"><span>Enviados</span><b>${esc(cuenta("enviado"))}</b><small>esperando la respuesta</small></div>
            <div class="numero-caja"><span>Aceptados</span><b>${esc(cuenta("aceptado"))}</b><small>para preparar</small></div>
            <div class="numero-caja"><span>Vendidos</span><b>${esc(cuenta("vendido"))}</b></div>
        </div>
        <nav class="chips filtro-presupuestos" aria-label="Filtrar">
            ${chip(null, "Todos")}
            ${chip("pedido", `Para armar (${cuenta("pedido")})`)}
            ${chip("enviado", `Enviados (${cuenta("enviado")})`)}
            ${chip("aceptado", `Aceptados (${cuenta("aceptado")})`)}
            ${chip("vendido", "Vendidos")}
            ${chip("anulado", "Anulados")}
        </nav>
        ${lista.length ? `<ul class="tarjetas">${lista.map((pr) => tarjetaPresupuesto(pr, `#/presupuestos/${pr.id}`)).join("")}</ul>`
            : vacio("No hay presupuestos con ese filtro.", "ti-file-text")}`;
}

/** Armar un presupuesto en el mostrador (lo pidió por teléfono, por WhatsApp o en persona). */
export function vistaNuevoPresupuesto(cont, { usuario, datos }) {
    const cuentas = datos.listarCuentas(usuario);
    cont.innerHTML = `
        <a class="volver" href="#/presupuestos"><i class="ti ti-arrow-left"></i> Presupuestos</a>
        <h1 class="titulo">Armar un presupuesto</h1>
        <form class="formulario bloque nuevo-presupuesto" novalidate>
            <label>Lo que pidió <small>(un artículo por renglón, como lo dijo)</small>
                <textarea name="lineas" rows="6" maxlength="${TOPES.texto * TOPES.renglones}" spellcheck="false" placeholder="Ej: 50 m de cable 2,5&#10;6 cajas de luz&#10;termica de 20"></textarea>
            </label>
            <div class="formulario__fila">
                <label>¿De qué cuenta?
                    <select name="cuenta">
                        <option value="">Sin cuenta corriente</option>
                        ${cuentas.map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)}${c.oficio ? ` (${esc(c.oficio)})` : ""}</option>`).join("")}
                    </select>
                </label>
                <label data-para>¿Para quién?<input name="para" maxlength="${TOPES.nombre}" placeholder="Ej: Jorge, el vecino de la esquina"></label>
            </div>
            <label>Obra <small>(si querés)</small><input name="obra" maxlength="${TOPES.obra}" placeholder="Ej: Pintura del frente"></label>
            <button class="boton" type="submit"><i class="ti ti-check"></i> Armar</button>
            <p class="nota"><i class="ti ti-info-circle"></i> Cada renglón se entiende solo (cantidad, metros y artículo); lo que no, lo elegís después.</p>
        </form>`;
    const f = cont.querySelector("form");
    const campoPara = cont.querySelector("[data-para]");
    f.cuenta.addEventListener("change", () => (campoPara.hidden = !!f.cuenta.value));
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const pr = datos.nuevoPresupuesto(usuario, { lineas: f.lineas.value.split("\n"), clienteId: f.cuenta.value || null, para: f.para.value, obra: f.obra.value });
            aviso(`Presupuesto N° ${pr.numero} armado`);
            location.hash = `#/presupuestos/${pr.id}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}

const elegidos = new Map(); // presupuestoId → itemId con el buscador abierto (queda abierto al redibujar)

/** Un presupuesto: armarlo, mandarlo, PDF, aceptarlo por teléfono, pasarlo a venta (o anularlo). */
export function vistaPresupuesto(cont, opciones, recien = null) {
    const { usuario, datos, irA, params: [id] } = opciones;
    const pr = datos.presupuesto(id);
    const empleado = usuario.rol === "empleado";
    const editable = pr.estado === "pedido";
    const otraVez = (r = null) => vistaPresupuesto(cont, opciones, r);
    const abierto = elegidos.get(pr.id) ?? null;
    const conFoto = pr.items.some((i) => i.foto);

    const filaItem = (i) => {
        const u = UNIDADES[i.unidad] ?? UNIDADES.u;
        const stock = !i.productoId ? `<span class="pastilla pastilla--ojo"><i class="ti ti-alert-circle" aria-hidden="true"></i>Sin elegir</span>`
            : i.servicio ? `<span class="pastilla pastilla--neutra"><i class="ti ti-key" aria-hidden="true"></i>Servicio</span>`
                : pr.estado === "vendido" ? `<span class="pastilla pastilla--bien"><i class="ti ti-check" aria-hidden="true"></i>Vendido</span>`
                    : i.alcanza ? `<span class="pastilla pastilla--bien"><i class="ti ti-circle-check" aria-hidden="true"></i>Hay · ${esc(cantidadTexto(i.stock, i.unidad))}</span>`
                        : `<span class="pastilla pastilla--mal"><i class="ti ti-alert-triangle" aria-hidden="true"></i>Hay ${esc(cantidadTexto(i.stock, i.unidad))}</span>`;
        return `
            <li class="item-presupuesto${i.productoId ? "" : " item-presupuesto--suelto"}${abierto === i.id ? " item-presupuesto--abierto" : ""}">
                <div class="item-presupuesto__fila">
                    <span class="item-presupuesto__nombre">
                        ${i.productoId ? `${esc(i.nombre)} ${etiquetaUnidad(i.unidad)}` : `<b>${i.foto ? '<i class="ti ti-photo" aria-hidden="true"></i> Lo de la foto' : "Sin elegir"}</b>`}
                        ${i.texto ? `<small>Pidió: “${esc(i.texto)}”</small>` : ""}
                    </span>
                    ${stock}
                </div>
                ${i.productoId ? `
                <div class="item-presupuesto__fila item-presupuesto__plata">
                    ${editable ? `
                    <label class="cantidad-renglon"><span class="solo-lector">Cantidad de ${esc(i.nombre)}</span>
                        <input type="text" inputmode="${i.unidad === "u" ? "numeric" : "decimal"}" maxlength="8" value="${esc(String(i.cantidad).replace(".", ","))}" data-cantidad="${esc(i.id)}">
                        ${u.corto ? `<span>${esc(u.corto)}</span>` : ""}
                    </label>` : `<span class="cantidad-fija">${esc(cantidadTexto(i.cantidad, i.unidad))}</span>`}
                    <span class="item-presupuesto__precio">× ${esc(precioConUnidad(i.precioUsado, i.unidad))}${i.precioHoy !== undefined && i.precioHoy !== i.precio && pr.estado !== "pedido" ? ` <small class="falta">(era ${esc(pesos(i.precio))})</small>` : ""}</span>
                    <b class="monto">${esc(pesos(i.subtotal))}</b>
                </div>` : ""}
                ${editable ? `
                <div class="item-presupuesto__botones">
                    <button class="boton boton--chico${i.productoId ? " boton--secundario" : ""}" type="button" data-elegir="${esc(i.id)}"><i class="ti ${i.productoId ? "ti-arrows-exchange" : "ti-search"}"></i> ${i.productoId ? "Cambiar" : "Elegir qué es"}</button>
                    <button class="boton-link" type="button" data-quitar="${esc(i.id)}"><i class="ti ti-trash"></i> Sacar</button>
                </div>
                ${abierto === i.id ? htmlElegir(i) : ""}` : ""}
            </li>`;
    };

    const quien = pr.origen === "web" ? `Pedido desde el celu` : `Armado en el mostrador${pr.por ? ` por ${esc(pr.por)}` : ""}`;

    cont.innerHTML = `
        <a class="volver" href="#/presupuestos"><i class="ti ti-arrow-left"></i> Presupuestos</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">N° ${esc(pr.numero)} · ${esc(pr.cliente || "Sin nombre")}</h1>
            ${pastillaEstado(pr.estado, pr.vencido)}
        </div>
        <p class="tarjeta__quien">${pr.obra ? `${esc(pr.obra)} · ` : ""}${quien} · ${esc(cuando(pr.creado))}${pr.tieneCuenta ? ' · <i class="ti ti-user-dollar" aria-hidden="true"></i> con cuenta corriente' : ""}${pr.vence && pr.estado !== "vendido" ? ` · ${esc(validez(pr))}` : ""}</p>
        ${pasos(pr)}
        ${recien === "enviado" ? `
        <div class="hecho">
            <i class="ti ti-send" aria-hidden="true"></i>
            <h2 class="titulo">Mandado</h2>
            <p>${esc(pesos(pr.total))} · precios por ${VALIDEZ_DIAS} días</p>
        </div>` : ""}
        ${recien === "vendido" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">${opciones.medio === "cuenta" ? "Vendido a cuenta" : "Vendido"}</h2>
            <p>${esc(pesos(pr.total))}${opciones.vuelto != null ? ` · vuelto <b>${esc(pesos(opciones.vuelto))}</b>` : ""} · se descontó del stock</p>
        </div>` : ""}
        ${pr.vencido ? `<p class="alerta alerta--alerta"><i class="ti ti-clock"></i> ${esc(validez(pr))}: van los precios de hoy${pr.subio > 0 ? ` (sube ${esc(pesos(pr.subio))})` : ""}. Volvé a armarlo y mandalo de nuevo, o vendelo así.</p>` : ""}
        ${editable && empleado ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> ${pr.sinResolver
            ? conFoto ? `Mirá la foto que mandó: tocá “Elegir qué es” y buscá (es una canilla de 1/2). Después, mandáselo.` : `Hay renglones que el buscador no entendió: tocá “Elegir qué es”. Después, mandáselo.`
            : "Revisá las cantidades y mandáselo: quedan fijos los precios por 7 días."}</p>` : ""}
        <div class="presupuesto-cuerpo${conFoto ? " presupuesto-cuerpo--foto" : ""}">
            ${conFoto ? `<figure class="foto-cliente">${htmlFoto()}<figcaption><i class="ti ti-photo"></i> La foto que mandó ${esc(pr.cliente.split(" ")[0] || "el cliente")}</figcaption></figure>` : ""}
            <div>
                <ul class="items-presupuesto">${pr.items.map(filaItem).join("")}</ul>
                ${editable ? `
                <details class="bloque sumar-renglon"${abierto === "nuevo" ? " open" : ""}>
                    <summary><i class="ti ti-plus"></i> Sumar un artículo</summary>
                    ${htmlElegir(null)}
                </details>` : ""}
                <div class="total"><span>${pr.sinResolver ? "Total (sin lo que falta elegir)" : "Total"}</span><b>${esc(pesos(pr.total))}</b></div>
            </div>
        </div>
        <div class="acciones-presupuesto"></div>`;

    const acciones = cont.querySelector(".acciones-presupuesto");
    const botonPdf = `<button class="boton boton--secundario" type="button" data-pdf><i class="ti ti-file-type-pdf"></i> PDF</button>`;

    if (pr.estado === "pedido") {
        acciones.innerHTML = `
            <button class="boton boton--ancho boton--grande" type="button" data-mandar${pr.sinResolver ? " disabled" : ""}><i class="ti ti-send"></i> Mandar el presupuesto${pr.cliente ? ` a ${esc(pr.cliente.split(" ")[0])}` : ""}</button>
            ${pr.sinResolver ? `<p class="nota"><i class="ti ti-info-circle"></i> Primero elegí ${pr.sinResolver === 1 ? "el renglón que falta" : `los ${esc(pr.sinResolver)} renglones que faltan`}.</p>` : ""}
            ${htmlAnular()}`;
    } else if (pr.estado === "enviado" || pr.estado === "aceptado") {
        acciones.innerHTML = `
            <div class="acciones">
                ${botonPdf}
                ${pr.estado === "enviado" ? `<button class="boton boton--secundario" type="button" data-reenviar><i class="ti ti-message-circle"></i> Mandar de nuevo</button>
                <button class="boton boton--secundario" type="button" data-aceptar><i class="ti ti-phone"></i> Lo aceptó por teléfono</button>` : ""}
                <button class="boton-link" type="button" data-rearmar><i class="ti ti-pencil"></i> Volver a armarlo</button>
            </div>
            ${pr.estado === "enviado" && pr.esDeMarcos && recien === "enviado" ? guia("u-cliente", "/mis-presupuestos", "Mirá lo que le llega a Marcos") : ""}
            <section class="bloque pasar-a-venta">
                <h2 class="subtitulo"><i class="ti ti-cash-register"></i> ${pr.estado === "aceptado" ? "Lo aceptó: pasalo a venta" : "Vino a buscarlo: pasalo a venta"}</h2>
                ${pr.faltan ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> Falta stock de ${esc(pr.faltan)} ${pr.faltan === 1 ? "artículo" : "artículos"}: volvé a armarlo con lo que hay.</p>` : ""}
                <div class="lugar-cobro"></div>
            </section>
            ${htmlAnular()}`;
        pintarCobro(acciones.querySelector(".lugar-cobro"), {
            usuario, datos, total: pr.total, medio: pr.tieneCuenta ? "cuenta" : "efectivo",
            cuentaFija: pr.tieneCuenta ? pr.clienteId : null, conCuenta: pr.tieneCuenta, textoBoton: "Vender",
            alCobrar: (pago) => {
                try {
                    const { venta } = datos.venderPresupuesto(usuario, pr.id, { medio: pago.medio, pagaCon: pago.pagaCon, autorizarTope: pago.autorizarTope });
                    aviso(venta.medio === "cuenta" ? `Vendido: va a la cuenta de ${pr.cliente}` : "Vendido");
                    vistaPresupuesto(cont, { ...opciones, vuelto: venta.vuelto, medio: venta.medio }, "vendido");
                } catch (err) {
                    aviso(err, "error");
                }
            }
        });
    } else if (pr.estado === "vendido") {
        acciones.innerHTML = `
            <div class="acciones">${botonPdf}</div>
            <p class="nota"><i class="ti ti-receipt"></i> Vendido ${esc(cuando(pr.vendido))}${pr.tieneCuenta ? ": quedó en su cuenta corriente" : ": quedó en la caja del día"}.</p>
            ${recien === "vendido" && empleado ? guia("u-dueno", "/stock/lista", "Pasá a Osvaldo: subí la lista del proveedor") : ""}
            ${recien === "vendido" && !empleado ? `<a class="boton boton--secundario boton--ancho" href="#/stock?ver=pedir"><i class="ti ti-package"></i> Mirá qué quedó para pedir</a>` : ""}`;
    }

    // ----- Botones -----
    cont.querySelectorAll("[data-elegir]").forEach((b) => b.addEventListener("click", () => {
        elegidos.set(pr.id, abierto === b.dataset.elegir ? null : b.dataset.elegir);
        otraVez();
        const panel = cont.querySelector(".item-presupuesto--abierto .elegir");
        panel?.scrollIntoView({ block: "center" });
        panel?.querySelector("input").focus({ preventScroll: true });
    }));
    cont.querySelector(".sumar-renglon")?.addEventListener("toggle", (e) => {
        if (e.target.open) elegidos.set(pr.id, "nuevo");
    });
    cont.querySelectorAll(".elegir").forEach((panel) => activarElegir(panel));
    cont.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.quitarRenglon(usuario, pr.id, b.dataset.quitar), "Renglón sacado")));
    cont.querySelectorAll("[data-cantidad]").forEach((c) => c.addEventListener("change", () => hacer(() => datos.cambiarCantidad(usuario, pr.id, c.dataset.cantidad, c.value), null)));
    acciones.querySelector("[data-mandar]")?.addEventListener("click", () => mandar());
    acciones.querySelector("[data-reenviar]")?.addEventListener("click", () => mandar());
    acciones.querySelector("[data-aceptar]")?.addEventListener("click", () => hacer(() => datos.aceptarPresupuesto(usuario, pr.id), "Anotado: lo aceptó"));
    acciones.querySelector("[data-rearmar]")?.addEventListener("click", () => {
        if (!confirm("¿Volver a armarlo? Después hay que mandarlo de nuevo.")) return;
        hacer(() => datos.volverAArmar(usuario, pr.id), "Listo para cambiar");
    });
    acciones.querySelector("[data-anular]")?.addEventListener("click", () => {
        if (!confirm("¿Anular el presupuesto?")) return;
        hacer(() => datos.anularPresupuesto(usuario, pr.id), "Presupuesto anulado");
    });
    const pdf = acciones.querySelector("[data-pdf]");
    pdf?.addEventListener("click", async () => {
        pdf.disabled = true;
        try {
            const blob = await armarPdf(datosPdf(datos.presupuesto(pr.id)));
            if (cont.isConnected) pdfListo(blob, `Presupuesto ${pr.numero} ${NEGOCIO}`);
        } catch (e) {
            console.warn(e);
            aviso("No se pudo armar el PDF. Probá de nuevo con mejor señal.", "error");
        } finally {
            pdf.disabled = false;
        }
    });
    activarGuias(cont, irA);

    function hacer(accion, texto) {
        try {
            accion();
            if (texto) aviso(texto);
            otraVez();
        } catch (err) {
            aviso(err, "error");
            otraVez();
        }
    }

    function mandar() {
        try {
            const { mensaje } = datos.enviarPresupuesto(usuario, pr.id);
            elegidos.delete(pr.id);
            otraVez("enviado");
            mostrarMensaje(`Mandar a ${pr.cliente || "el cliente"}`, mensaje);
        } catch (err) {
            aviso(err, "error");
        }
    }

    /** El buscador para elegir el artículo de un renglón (o sumar uno nuevo): busca mientras se escribe. */
    function htmlElegir(item) {
        const inicial = item ? (item.foto ? "" : entender(item.texto).buscado) : "";
        return `
            <div class="elegir" data-item="${esc(item?.id ?? "")}">
                <label class="buscador">
                    <i class="ti ti-search" aria-hidden="true"></i>
                    <span class="solo-lector">Buscar el artículo</span>
                    <input type="search" autocomplete="off" maxlength="40" value="${esc(inicial)}" placeholder="${item?.foto ? "¿Qué es? Ej: canilla 1/2" : "Ej: codo 3/4, tarugo del 8"}">
                </label>
                <ul class="elegir__lista"></ul>
            </div>`;
    }

    function activarElegir(panel) {
        const input = panel.querySelector("input");
        const lugar = panel.querySelector(".elegir__lista");
        const itemId = panel.dataset.item || null;
        const pintar = () => {
            const lista = datos.sugerencias(input.value);
            lugar.innerHTML = lista.length ? lista.map((p) => `
                <li><button class="elegir__opcion" type="button" data-opcion="${esc(p.id)}">
                    <span>${esc(p.nombre)}<small>${esc(precioConUnidad(p.precio, p.unidad))} · ${p.servicio ? "servicio" : p.stock > 0 ? `hay ${esc(cantidadTexto(p.stock, p.unidad))}` : "no hay"}</small></span>
                    <i class="ti ti-check" aria-hidden="true"></i>
                </button></li>`).join("")
                : input.value.trim() ? `<li class="nota">No encontré nada parecido. Probá con otra palabra.</li>` : "";
            lugar.querySelectorAll("[data-opcion]").forEach((b) => b.addEventListener("click", () => {
                elegidos.delete(pr.id);
                if (itemId) hacer(() => datos.elegirArticulo(usuario, pr.id, itemId, b.dataset.opcion), "Elegido");
                else hacer(() => datos.sumarArticulo(usuario, pr.id, b.dataset.opcion), "Sumado al presupuesto");
            }));
        };
        input.addEventListener("input", pintar);
        pintar();
    }
}

const htmlAnular = () => `<button class="boton-link anular" type="button" data-anular><i class="ti ti-ban"></i> Anular el presupuesto</button>`;
