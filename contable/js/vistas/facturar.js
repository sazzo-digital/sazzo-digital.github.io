// ============================================
// Facturar: la lista de comprobantes del mes, la factura nueva (la letra sale sola según el cliente, los totales se
// ven mientras se carga y "Pidiendo CAE a ARCA…" simulado) y el comprobante emitido, listo para imprimir con la marca
// de agua "DEMO · SIN VALIDEZ FISCAL", el CAE de prueba y el lugar del QR dibujado. Desde ahí, la nota de crédito.
// Solo administración carga; Hernán y Patricia miran.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=c335bb1efa";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=c335bb1efa";
import { TOPES, CUENTAS, ID_CONSUMIDOR_FINAL } from "../datos.js?v=c335bb1efa";
import { PRODUCTOS } from "../semilla.js?v=c335bb1efa";
import {
    COMPROBANTES, ALICUOTAS, ORDEN_ALICUOTAS, TOPE_CF_IDENTIFICAR, pesos, numeroComprobante, formatoCuit, nombrePeriodo, signo
} from "../reglas.js?v=c335bb1efa";
import { buscarPersona } from "../marca.js?v=c335bb1efa";
import {
    fechaCorta, diaMes, pastillaTipo, periodoPedido, htmlSelectorMes, activarSelectorMes, documento, condicionTexto,
    logoEmpresa, conEspera, nombreDe
} from "./comunes.js?v=c335bb1efa";

const puedeCargar = (u) => u.rol === "admin";
const OPCIONES_ALICUOTA = [...ORDEN_ALICUOTAS, "ex"];

// ---------- Lista ----------
export function vistaFacturar(cont, { usuario, datos, consulta }) {
    const periodo = periodoPedido(consulta);
    const lista = datos.listarComprobantes({ periodo });
    const total = lista.reduce((s, c) => s + signo(c.tipo) * c.total, 0);
    const iva = lista.reduce((s, c) => s + signo(c.tipo) * c.iva, 0);
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Facturar</h1>
            ${puedeCargar(usuario) ? `<a class="boton" href="#/facturar/nueva"><i class="ti ti-plus"></i> Nueva factura</a>` : ""}
        </div>
        <div class="fila-filtros">${htmlSelectorMes(periodo)}</div>
        <div class="paneles">
            <div class="panel"><span class="panel__rotulo">Facturado en ${esc(nombrePeriodo(periodo))}</span><span class="panel__numero">${esc(pesos(total))}</span><small>${lista.length} comprobantes</small></div>
            <div class="panel"><span class="panel__rotulo">IVA de las ventas (débito)</span><span class="panel__numero">${esc(pesos(iva))}</span><small>va al libro IVA Ventas</small></div>
        </div>
        ${puedeCargar(usuario) ? "" : `<p class="nota"><i class="ti ti-lock"></i> Las facturas las hace Silvina (administración). Vos las ves y las imprimís.</p>`}
        ${lista.length ? `
        <ul class="lista-comprobantes">
            ${lista.map((c) => `
            <li><a class="comprobante-fila" href="#/facturar/${esc(c.id)}">
                ${pastillaTipo(c.tipo)}
                <span class="comprobante-fila__texto"><b>${esc(c.receptor.nombre)}</b><small>${esc(numeroComprobante(c.puntoVenta, c.numero))} · ${esc(diaMes(c.fecha))}${c.condicionVenta === "contado" ? " · contado" : ""}</small></span>
                <b class="monto${signo(c.tipo) < 0 ? " monto--resta" : ""}">${signo(c.tipo) < 0 ? "−" : ""}${esc(pesos(c.total))}</b>
            </a></li>`).join("")}
        </ul>` : vacio("No hay comprobantes en este mes.", "ti-file-invoice")}`;
    activarSelectorMes(cont, "/facturar");
}

// ---------- Factura nueva ----------
export function vistaNuevaFactura(cont, { usuario, datos, consulta }) {
    if (!puedeCargar(usuario)) {
        cont.innerHTML = `<a class="volver" href="#/facturar"><i class="ti ti-arrow-left"></i> Facturar</a>${vacio("Las facturas las hace Silvina (administración).", "ti-lock")}`;
        return;
    }
    const clientes = datos.listarClientes();
    const pedido = consulta?.get("cliente");
    const wow = consulta?.get("wow") === "1";
    let clienteId = clientes.some((c) => c.id === pedido) ? pedido : wow ? "c-tornillo" : ID_CONSUMIDOR_FINAL;
    let renglones = wow
        ? [{ descripcion: "Yerba mate 1 kg x 10", cantidad: "20", precio: "50.000", alicuota: "21" }]
        : [{ descripcion: "", cantidad: "1", precio: "", alicuota: "21" }];

    cont.innerHTML = `
        <a class="volver" href="#/facturar"><i class="ti ti-arrow-left"></i> Facturar</a>
        <h1 class="titulo">Nueva factura</h1>
        <form class="formulario factura-nueva" novalidate>
            <div class="bloque">
                <h2 class="subtitulo"><i class="ti ti-user"></i> Cliente</h2>
                <label>¿A quién le facturás?
                    <select name="cliente">
                        ${clientes.map((c) => `<option value="${esc(c.id)}"${c.id === clienteId ? " selected" : ""}>${esc(c.nombre)}${c.cuit ? ` · ${esc(formatoCuit(c.cuit))}` : ""}</option>`).join("")}
                    </select>
                </label>
                <p class="letra-elegida" aria-live="polite"></p>
                <label class="campo-dni" hidden>DNI o CUIT del comprador
                    <input name="doc" inputmode="numeric" maxlength="13" autocomplete="off" placeholder="Ej: 30.123.456">
                    <small>Desde ${esc(pesos(TOPE_CF_IDENTIFICAR))} hay que identificar al consumidor final.</small>
                </label>
            </div>
            <div class="bloque">
                <h2 class="subtitulo"><i class="ti ti-list-details"></i> Qué se vende</h2>
                <p class="nota ayuda-precio"></p>
                <div class="renglones"></div>
                <datalist id="productos">${PRODUCTOS.map(([d]) => `<option value="${esc(d)}"></option>`).join("")}</datalist>
                <button class="boton boton--secundario boton--chico" type="button" data-agregar><i class="ti ti-plus"></i> Agregar renglón</button>
            </div>
            <div class="bloque">
                <h2 class="subtitulo"><i class="ti ti-cash"></i> Cobro</h2>
                <div class="formulario__fila">
                    <label>Condición de venta
                        <select name="condicion">
                            <option value="cuenta corriente">Cuenta corriente</option>
                            <option value="contado">Contado</option>
                        </select>
                    </label>
                    <label class="campo-cuenta" hidden>Entra por
                        <select name="cuenta">${Object.entries(CUENTAS).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select>
                    </label>
                </div>
            </div>
            <div class="totales-factura panel" aria-live="polite"></div>
            <p class="formulario__error" role="alert" hidden></p>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-send"></i> Emitir factura</button>
            <p class="nota"><i class="ti ti-shield-check"></i> En la demo, ARCA es simulado: el CAE es de prueba y la factura no tiene validez fiscal.</p>
        </form>`;

    const form = cont.querySelector("form");
    const lugarRenglones = cont.querySelector(".renglones");
    const error = cont.querySelector(".formulario__error");
    const letraDe = () => COMPROBANTES[datos.tipoParaCliente(clienteId)].letra;

    function pintarRenglones() {
        const letra = letraDe();
        lugarRenglones.innerHTML = renglones.map((r, i) => `
            <fieldset class="renglon" data-i="${i}">
                <legend class="visualmente-oculto">Renglón ${i + 1}</legend>
                <label class="renglon__desc">Descripción<input name="descripcion" list="productos" maxlength="${TOPES.nombre}" value="${esc(r.descripcion)}" placeholder="Ej: Aceite de girasol 900 ml x 12" autocomplete="off"></label>
                <label class="renglon__cant">Cantidad<input name="cantidad" type="number" inputmode="numeric" min="1" max="${TOPES.cantidad}" step="1" value="${esc(r.cantidad)}"></label>
                <label class="renglon__precio">${letra === "B" ? "Precio final" : "Precio sin IVA"}<input name="precio" inputmode="decimal" maxlength="16" value="${esc(r.precio)}" placeholder="0,00" autocomplete="off"></label>
                ${letra === "C" ? "" : `<label class="renglon__alic">IVA<select name="alicuota">${OPCIONES_ALICUOTA.map((a) => `<option value="${esc(a)}"${a === String(r.alicuota) ? " selected" : ""}>${esc(ALICUOTAS[a].texto)}</option>`).join("")}</select></label>`}
                ${renglones.length > 1 ? `<button class="boton-icono renglon__sacar" type="button" data-sacar="${i}" aria-label="Sacar el renglón ${i + 1}" title="Sacar"><i class="ti ti-x"></i></button>` : ""}
            </fieldset>`).join("");
        cont.querySelector("[data-agregar]").hidden = renglones.length >= TOPES.renglones;
    }

    function leerRenglones() {
        renglones = [...lugarRenglones.querySelectorAll(".renglon")].map((f) => ({
            descripcion: f.querySelector("[name=descripcion]").value,
            cantidad: f.querySelector("[name=cantidad]").value,
            precio: f.querySelector("[name=precio]").value,
            alicuota: f.querySelector("[name=alicuota]")?.value ?? "21"
        }));
    }

    const paraDatos = () => renglones.map((r) => ({ ...r, cantidad: Number(r.cantidad) }));

    function pintarTotales() {
        const tipo = datos.tipoParaCliente(clienteId);
        const letra = COMPROBANTES[tipo].letra;
        cont.querySelector(".letra-elegida").innerHTML = `<span class="letra-grande">${esc(letra)}</span> Le corresponde <b>${esc(COMPROBANTES[tipo].nombre)}</b><small>${esc(motivoLetra(datos, clienteId, tipo))}</small>`;
        cont.querySelector(".ayuda-precio").innerHTML = `<i class="ti ti-info-circle"></i> ${letra === "B" ? "En la factura B el precio es final: el IVA ya está adentro." : letra === "C" ? "Factura C: sin IVA." : "En la factura A el precio va sin IVA: se suma abajo."}`;
        const totales = cont.querySelector(".totales-factura");
        let c = null;
        try {
            c = datos.calcularFactura({ clienteId, renglones: paraDatos() });
        } catch {
            c = null;
        }
        if (!c) {
            totales.innerHTML = `<span class="panel__rotulo">Total</span><span class="panel__numero">—</span><small>Completá los renglones para ver el total.</small>`;
        } else {
            const filas = [];
            if (letra === "A") {
                filas.push(["Neto gravado", c.neto]);
                for (const a of ORDEN_ALICUOTAS) if (c.grupos[a]) filas.push([`IVA ${ALICUOTAS[a].texto}`, c.grupos[a].iva]);
                if (c.exento) filas.push(["Exento", c.exento]);
            } else if (letra === "B") {
                filas.push(["IVA contenido", c.iva]);
            }
            totales.innerHTML = `
                ${filas.map(([t, v]) => `<p class="totales-factura__fila"><span>${esc(t)}</span><b>${esc(pesos(v))}</b></p>`).join("")}
                <span class="panel__rotulo">Total</span><span class="panel__numero">${esc(pesos(c.total))}</span>`;
        }
        const cf = clienteId === ID_CONSUMIDOR_FINAL || datos.buscarCliente(clienteId).condicion === "CF";
        cont.querySelector(".campo-dni").hidden = !(cf && !datos.buscarCliente(clienteId).cuit && c && c.total >= TOPE_CF_IDENTIFICAR);
    }

    pintarRenglones();
    pintarTotales();

    form.cliente.addEventListener("change", () => {
        leerRenglones();
        const antes = letraDe();
        clienteId = form.cliente.value;
        if (letraDe() !== antes) pintarRenglones();
        pintarTotales();
    });
    form.condicion.addEventListener("change", () => {
        cont.querySelector(".campo-cuenta").hidden = form.condicion.value !== "contado";
    });
    lugarRenglones.addEventListener("input", (e) => {
        // Si eligió un producto de la lista, completa precio y alícuota (con el IVA adentro si es B)
        if (e.target.name === "descripcion") {
            const prod = PRODUCTOS.find(([d]) => d === e.target.value);
            if (prod) {
                const f = e.target.closest(".renglon");
                const [, alic, base] = prod;
                const letra = letraDe();
                const precio = letra === "B" && alic !== "ex" ? Math.round(base * (1 + ALICUOTAS[alic].porMil / 1000)) : base;
                f.querySelector("[name=precio]").value = precio.toLocaleString("es-AR");
                const sel = f.querySelector("[name=alicuota]");
                if (sel) sel.value = alic;
            }
        }
        leerRenglones();
        pintarTotales();
    });
    lugarRenglones.addEventListener("change", () => {
        leerRenglones();
        pintarTotales();
    });
    lugarRenglones.addEventListener("click", (e) => {
        const b = e.target.closest("[data-sacar]");
        if (!b) return;
        leerRenglones();
        renglones.splice(Number(b.dataset.sacar), 1);
        pintarRenglones();
        pintarTotales();
    });
    cont.querySelector("[data-agregar]").addEventListener("click", () => {
        leerRenglones();
        renglones.push({ descripcion: "", cantidad: "1", precio: "", alicuota: "21" });
        pintarRenglones();
        lugarRenglones.querySelector(".renglon:last-child [name=descripcion]")?.focus();
    });

    let enviando = false;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (enviando) return;
        leerRenglones();
        error.hidden = true;
        // Primero se revisa todo sin esperar (si algo está mal, se dice al toque)
        try {
            datos.calcularFactura({ clienteId, renglones: paraDatos() });
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
            return;
        }
        enviando = true;
        try {
            const comp = await conEspera("Pidiendo el CAE a ARCA…", () =>
                datos.emitirFactura({ clienteId, renglones: paraDatos(), condicionVenta: form.condicion.value, cuenta: form.cuenta.value, doc: form.doc.value }, usuario));
            location.hash = `#/facturar/${comp.id}?nueva=1`;
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        } finally {
            enviando = false;
        }
    });
}

function motivoLetra(datos, clienteId, tipo) {
    const e = datos.leerEmpresa();
    const c = datos.buscarCliente(clienteId);
    if (tipo === "FC") return `Tu empresa es ${condicionTexto(e.condicionIva).toLowerCase()}: siempre factura C.`;
    return `Vos sos Responsable Inscripto y el cliente es ${condicionTexto(c.condicion).toLowerCase()}.`;
}

// ---------- Comprobante emitido ----------
export function vistaComprobante(cont, { usuario, datos, params: [id], consulta, irA }) {
    const c = datos.buscarComprobante(id);
    const e = datos.leerEmpresa();
    const t = COMPROBANTES[c.tipo];
    const nueva = consulta?.get("nueva") === "1";
    const esFactura = t.clase === "factura";
    const queda = esFactura ? datos.restanteDeFactura(c.id) : null;
    const asociada = c.asociadaId ? datos.buscarComprobante(c.asociadaId) : null;
    const notas = esFactura ? datos.listarComprobantes().filter((n) => n.asociadaId === c.id) : [];

    const filasTotales = [];
    if (t.letra === "A") {
        filasTotales.push(["Neto gravado", c.neto]);
        for (const a of ORDEN_ALICUOTAS) if (c.grupos?.[a]) filasTotales.push([`IVA ${ALICUOTAS[a].texto}`, c.grupos[a].iva]);
        if (c.exento) filasTotales.push(["Exento", c.exento]);
    }

    const patricia = buscarPersona("u-contadora");
    cont.innerHTML = `
        <a class="volver no-imprimir" href="#/facturar"><i class="ti ti-arrow-left"></i> Facturar</a>
        ${nueva ? `
        <div class="hecho no-imprimir">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h1 class="titulo">¡${esc(t.nombre)} autorizada!</h1>
            <p>ARCA (simulado) dio el CAE <b class="numeros">${esc(c.cae)}</b> · ${esc(pesos(c.total))}</p>
        </div>
        ${usuario.rol === "admin" && c.tipo === "FA" ? `
        <div class="siguiente-paso no-imprimir">
            <a class="boton boton--grande" href="#/compras"><i class="ti ti-cloud-download"></i> Ahora traé las compras de ARCA</a>
            ${htmlGuia({ persona: patricia, ruta: "/iva", texto: "O mirá cómo ya lo ve la contadora" })}
        </div>` : ""}` : `<h1 class="titulo no-imprimir">${esc(t.nombre)} ${esc(numeroComprobante(c.puntoVenta, c.numero))}</h1>`}

        <article class="factura" aria-label="${esc(t.nombre)}">
            <p class="factura__agua" aria-hidden="true">DEMO · SIN VALIDEZ FISCAL</p>
            <header class="factura__cabeza">
                <div class="factura__emisor">
                    ${logoEmpresa(e, "factura__logo")}
                    <div>
                        <b>${esc(e.razonSocial)}</b>
                        <small>${esc(e.domicilio || "")}</small>
                        <small>${esc(condicionTexto(e.condicionIva))}</small>
                    </div>
                </div>
                <div class="factura__letra"><b>${esc(t.letra)}</b><small>Cód. ${esc(String(t.codigo).padStart(2, "0"))}</small></div>
                <div class="factura__datos">
                    <b>${esc(t.nombre.replace(/ [ABC]$/, "").toUpperCase())}</b>
                    <small>N° ${esc(numeroComprobante(c.puntoVenta, c.numero))}</small>
                    <small>Fecha: ${esc(fechaCorta(c.fecha))}</small>
                    <small>CUIT: ${esc(formatoCuit(e.cuit))}</small>
                    <small>Ingresos Brutos: ${esc(e.iibb || "—")}</small>
                    <small>Inicio de actividades: ${esc(fechaCorta(e.inicioActividades))}</small>
                </div>
            </header>
            <section class="factura__receptor">
                <p><span>Cliente</span><b>${esc(c.receptor.nombre)}</b></p>
                <p><span>${c.receptor.cuit ? "CUIT" : "Documento"}</span><b>${esc(documento(c.receptor).replace(/^(CUIT|DNI) /, ""))}</b></p>
                <p><span>Condición frente al IVA</span><b>${esc(condicionTexto(c.receptor.condicion))}</b></p>
                <p><span>Condición de venta</span><b>${esc(c.condicionVenta === "contado" ? "Contado" : "Cuenta corriente")}</b></p>
                ${asociada ? `<p><span>Comprobante asociado</span><b><a href="#/facturar/${esc(asociada.id)}">${esc(COMPROBANTES[asociada.tipo].nombre)} ${esc(numeroComprobante(asociada.puntoVenta, asociada.numero))}</a></b></p>` : ""}
            </section>
            <div class="tabla-scroll" tabindex="0" role="region" aria-label="Detalle">
                <table class="tabla factura__detalle">
                    <thead><tr><th>Descripción</th><th class="num">Cant.</th><th class="num">${t.letra === "B" ? "Precio" : "Precio unit."}</th>${t.letra === "A" ? `<th class="num">IVA</th>` : ""}<th class="num">Subtotal</th></tr></thead>
                    <tbody>${(c.renglones ?? []).map((r) => `
                        <tr><td>${esc(r.descripcion)}</td><td class="num">${esc(r.cantidad)}</td><td class="num">${esc(pesos(r.precio))}</td>${t.letra === "A" ? `<td class="num">${r.alicuota ? esc(ALICUOTAS[r.alicuota]?.texto ?? "") : ""}</td>` : ""}<td class="num">${esc(pesos(subtotal(r, t.letra)))}</td></tr>`).join("")}
                    </tbody>
                </table>
            </div>
            <section class="factura__totales">
                ${filasTotales.map(([n, v]) => `<p><span>${esc(n)}</span><b>${esc(pesos(v))}</b></p>`).join("")}
                <p class="factura__total"><span>Total</span><b>${esc(pesos(c.total))}</b></p>
                ${t.letra === "B" ? `<p class="factura__transparencia">Régimen de Transparencia Fiscal al Consumidor (Ley 27.743) · IVA contenido: <b>${esc(pesos(c.iva))}</b></p>` : ""}
            </section>
            <footer class="factura__pie">
                <div class="factura__qr" aria-label="Lugar del QR de ARCA">
                    <i class="ti ti-qrcode" aria-hidden="true"></i>
                    <small>Acá va el QR de ARCA (en la versión real)</small>
                </div>
                <div class="factura__cae">
                    <p><span>CAE N°</span><b class="numeros">${esc(c.cae)}</b></p>
                    <p><span>Vencimiento del CAE</span><b>${esc(fechaCorta(c.caeVence))}</b></p>
                    <p class="factura__aviso">Comprobante de prueba generado por una demo. Sin validez fiscal.</p>
                </div>
            </footer>
        </article>

        <div class="acciones no-imprimir">
            <button class="boton boton--secundario" type="button" data-imprimir><i class="ti ti-printer"></i> Imprimir o guardar PDF</button>
        </div>
        ${notas.length ? `
        <div class="bloque no-imprimir">
            <h2 class="subtitulo"><i class="ti ti-receipt-refund"></i> Notas de crédito de esta factura</h2>
            <ul class="lista-comprobantes">${notas.map((n) => `
                <li><a class="comprobante-fila" href="#/facturar/${esc(n.id)}">${pastillaTipo(n.tipo)}<span class="comprobante-fila__texto"><b>${esc(n.motivo || "Nota de crédito")}</b><small>${esc(numeroComprobante(n.puntoVenta, n.numero))} · ${esc(diaMes(n.fecha))}</small></span><b class="monto monto--resta">−${esc(pesos(n.total))}</b></a></li>`).join("")}
            </ul>
        </div>` : ""}
        ${esFactura && usuario.rol === "admin" && queda.total > 0 ? htmlNotaCredito(c, queda) : ""}
        ${esFactura && queda.total <= 0 ? `<p class="nota no-imprimir"><i class="ti ti-circle-off"></i> Esta factura quedó anulada por completo con notas de crédito.</p>` : ""}
        <p class="nota no-imprimir"><i class="ti ti-user"></i> Hecha por ${esc(nombreDe(c.hechoPor))}.</p>`;

    cont.querySelector("[data-imprimir]").addEventListener("click", () => window.print());
    activarGuias(cont, irA);

    const formNc = cont.querySelector(".nota-credito form");
    if (formNc) {
        formNc.addEventListener("submit", async (ev) => {
            ev.preventDefault();
            const err = formNc.querySelector(".formulario__error");
            err.hidden = true;
            const todo = formNc.alcance.value === "todo";
            const devolverEn = formNc.devolver.value || null;
            if (!confirm(todo ? "¿Anular toda la factura con una nota de crédito?" : "¿Hacer la nota de crédito por ese importe?")) return;
            try {
                const nc = await conEspera("Pidiendo el CAE de la nota de crédito…", () =>
                    datos.emitirNotaCredito({ facturaId: c.id, monto: todo ? null : formNc.monto.value, motivo: formNc.motivo.value, devolverEn }, usuario));
                aviso(`${COMPROBANTES[nc.tipo].nombre} autorizada (CAE de prueba)`);
                location.hash = `#/facturar/${nc.id}`;
            } catch (e2) {
                err.textContent = e2.message;
                err.hidden = false;
            }
        });
        formNc.alcance.forEach?.((r) => r.addEventListener("change", () => {
            formNc.querySelector(".campo-monto").hidden = formNc.alcance.value === "todo";
        }));
    }
}

/** Lo que se muestra al final del renglón: en la A sin IVA; en la B y la C, el total. Las notas tienen un solo renglón. */
function subtotal(r, letra) {
    if (r.neto === undefined) return r.precio;
    return letra === "A" ? r.neto + (r.exento ?? 0) : r.total;
}

function htmlNotaCredito(c, queda) {
    return `
        <details class="bloque nota-credito no-imprimir">
            <summary><i class="ti ti-receipt-refund"></i> Hacer una nota de crédito</summary>
            <form class="formulario" novalidate>
                <p class="nota"><i class="ti ti-info-circle"></i> Queda sin acreditar ${esc(pesos(queda.total))}. La nota sale ${esc(COMPROBANTES[c.tipo].letra)}, con su propio CAE, y descuenta de la cuenta del cliente.</p>
                <fieldset class="opciones">
                    <legend>¿Por cuánto?</legend>
                    <label class="opcion"><input type="radio" name="alcance" value="todo" checked> Toda la factura (la anula)</label>
                    <label class="opcion"><input type="radio" name="alcance" value="parte"> Una parte</label>
                </fieldset>
                <label class="campo-monto" hidden>Importe (con IVA)<input name="monto" inputmode="decimal" maxlength="16" placeholder="Ej: 100.000"></label>
                <label>Motivo<input name="motivo" maxlength="${TOPES.motivo}" placeholder="Ej: Mercadería devuelta"></label>
                <label>¿Se devuelve plata?
                    <select name="devolver">
                        <option value="">No: queda a favor en su cuenta</option>
                        ${Object.entries(CUENTAS).map(([k, v]) => `<option value="${esc(k)}">Sí, sale de ${esc(v.toLowerCase())}</option>`).join("")}
                    </select>
                </label>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton" type="submit"><i class="ti ti-check"></i> Hacer la nota de crédito</button>
            </form>
        </details>`;
}
