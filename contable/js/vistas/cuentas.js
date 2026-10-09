// ============================================
// Cuentas: quién te debe (clientes), a quién le debés (proveedores) y caja y banco. En la ficha de cada uno, su
// cuenta corriente con el saldo renglón por renglón y, para administración, cobrar o pagar. Desde acá también se
// suman clientes y proveedores.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=bd1244e281";
import { TOPES, CUENTAS } from "../datos.js?v=bd1244e281";
import { CONDICIONES, pesos, formatoCuit } from "../reglas.js?v=bd1244e281";
import { diaMes, haceDias, htmlTabla, documento, condicionTexto, fechaCorta } from "./comunes.js?v=bd1244e281";

const puedeCargar = (u) => u.rol === "admin";
const PESTANAS = { clientes: "Clientes", proveedores: "Proveedores", plata: "Caja y banco" };

export function vistaCuentas(cont, { usuario, datos, consulta }) {
    const pestana = Object.hasOwn(PESTANAS, consulta?.get("ver")) ? consulta.get("ver") : "clientes";
    cont.innerHTML = `
        <h1 class="titulo">Cuentas</h1>
        <div class="pestanas" role="tablist">
            ${Object.entries(PESTANAS).map(([k, v]) => `<a role="tab" class="pestana${k === pestana ? " activa" : ""}" aria-selected="${k === pestana}" href="#/cuentas?ver=${k}">${esc(v)}</a>`).join("")}
        </div>
        <div class="pestana-contenido"></div>`;
    const lugar = cont.querySelector(".pestana-contenido");
    if (pestana === "clientes") pintarClientes(lugar, usuario, datos);
    if (pestana === "proveedores") pintarProveedores(lugar, usuario, datos);
    if (pestana === "plata") pintarPlata(lugar, datos);
}

function pintarClientes(lugar, usuario, datos) {
    const clientes = datos.listarClientes().sort((a, b) => b.saldo - a.saldo);
    const total = clientes.reduce((s, c) => s + Math.max(0, c.saldo), 0);
    lugar.innerHTML = `
        <div class="panel"><span class="panel__rotulo">Te deben</span><span class="panel__numero">${esc(pesos(total))}</span><small>${clientes.filter((c) => c.saldo > 0).length} clientes con saldo</small></div>
        <ul class="lista-cuentas">${clientes.map((c) => `
            <li><a class="cuenta-fila" href="#/cuentas/cliente/${esc(c.id)}">
                <span class="cuenta-fila__texto"><b>${esc(c.nombre)}</b><small>${esc(condicionTexto(c.condicion))}${c.saldo > 0 && c.debeDesde ? ` · debe desde ${esc(haceDias(c.debeDesde))}` : ""}</small></span>
                <b class="monto${c.saldo <= 0 ? " monto--cero" : atrasado(c.debeDesde) ? " monto--atrasado" : ""}">${esc(pesos(c.saldo))}</b>
            </a></li>`).join("")}
        </ul>
        ${puedeCargar(usuario) ? formNuevo("cliente") : ""}`;
    conectarNuevo(lugar, usuario, datos, "cliente");
}

function pintarProveedores(lugar, usuario, datos) {
    const proveedores = datos.listarProveedores().sort((a, b) => b.saldo - a.saldo);
    const total = proveedores.reduce((s, p) => s + Math.max(0, p.saldo), 0);
    lugar.innerHTML = `
        <div class="panel"><span class="panel__rotulo">Les debés</span><span class="panel__numero">${esc(pesos(total))}</span><small>${proveedores.filter((p) => p.saldo > 0).length} proveedores con saldo</small></div>
        <ul class="lista-cuentas">${proveedores.map((p) => `
            <li><a class="cuenta-fila" href="#/cuentas/proveedor/${esc(p.id)}">
                <span class="cuenta-fila__texto"><b>${esc(p.nombre)}</b><small>${esc(condicionTexto(p.condicion))} · CUIT ${esc(formatoCuit(p.cuit))}</small></span>
                <b class="monto${p.saldo <= 0 ? " monto--cero" : ""}">${esc(pesos(p.saldo))}</b>
            </a></li>`).join("")}
        </ul>
        ${puedeCargar(usuario) ? formNuevo("proveedor") : ""}`;
    conectarNuevo(lugar, usuario, datos, "proveedor");
}

function pintarPlata(lugar, datos) {
    const { caja, banco, movimientos } = datos.cajaYBancos({ ultimos: 40 });
    lugar.innerHTML = `
        <div class="paneles">
            <div class="panel"><span class="panel__rotulo"><i class="ti ti-cash"></i> Caja</span><span class="panel__numero">${esc(pesos(caja))}</span></div>
            <div class="panel"><span class="panel__rotulo"><i class="ti ti-building-bank"></i> Banco</span><span class="panel__numero">${esc(pesos(banco))}</span></div>
        </div>
        <h2 class="subtitulo"><i class="ti ti-arrows-exchange"></i> Últimos movimientos</h2>
        ${htmlTabla(
            [{ titulo: "Fecha" }, { titulo: "Qué" }, { titulo: "Quién" }, { titulo: "Cuenta" }, { titulo: "Entra", clase: "num" }, { titulo: "Sale", clase: "num" }],
            movimientos.map((m) => [esc(diaMes(m.fecha)), esc(m.detalle), esc(m.quien), esc(CUENTAS[m.cuenta]), m.entra ? esc(pesos(m.monto)) : "", m.entra ? "" : esc(pesos(m.monto))]),
            { vacia: "Todavía no hay movimientos.", etiqueta: "Movimientos de caja y banco" }
        )}`;
}

const atrasado = (desde) => desde && haceDias(desde).startsWith("hace") && Number(haceDias(desde).replace(/\D/g, "")) > 45;

function formNuevo(tipo) {
    const condiciones = tipo === "cliente" ? Object.entries(CONDICIONES) : Object.entries(CONDICIONES).filter(([k]) => k !== "CF");
    return `
        <details class="bloque nuevo-${tipo}">
            <summary><i class="ti ti-user-plus"></i> Sumar un ${tipo}</summary>
            <form class="formulario" novalidate>
                <label>Nombre o razón social<input name="nombre" maxlength="${TOPES.nombre}" autocomplete="off"></label>
                <div class="formulario__fila">
                    <label>Condición frente al IVA<select name="condicion">${condiciones.map(([k, v]) => `<option value="${esc(k)}">${esc(v.texto)}</option>`).join("")}</select></label>
                    <label>CUIT${tipo === "cliente" ? " (no hace falta para consumidor final)" : ""}<input name="cuit" inputmode="numeric" maxlength="13" placeholder="30-12345678-9" autocomplete="off"></label>
                </div>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton" type="submit"><i class="ti ti-plus"></i> Sumar</button>
            </form>
        </details>`;
}

function conectarNuevo(lugar, usuario, datos, tipo) {
    const form = lugar.querySelector(`.nuevo-${tipo} form`);
    if (!form) return;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const error = form.querySelector(".formulario__error");
        error.hidden = true;
        try {
            const campos = { nombre: form.nombre.value, condicion: form.condicion.value, cuit: form.cuit.value };
            const nuevo = tipo === "cliente" ? datos.agregarCliente(campos, usuario) : datos.agregarProveedor(campos, usuario);
            aviso(`${nuevo.nombre} sumado.`);
            location.hash = `#/cuentas/${tipo}/${nuevo.id}`;
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        }
    });
}

// ---------- Ficha de un cliente o un proveedor ----------
export function vistaFicha(cont, { usuario, datos, params: [tipo, id] }) {
    const esCliente = tipo === "cliente";
    const quien = esCliente ? datos.buscarCliente(id) : datos.buscarProveedor(id);
    const saldo = esCliente ? datos.saldoCliente(id) : datos.saldoProveedor(id);
    const filas = datos.cuentaCorriente(tipo, id);
    const volver = esCliente ? "clientes" : "proveedores";
    cont.innerHTML = `
        <a class="volver" href="#/cuentas?ver=${volver}"><i class="ti ti-arrow-left"></i> ${esCliente ? "Clientes" : "Proveedores"}</a>
        <h1 class="titulo">${esc(quien.nombre)}</h1>
        <p class="nota"><i class="ti ti-id"></i> ${esc(documento(quien))} · ${esc(condicionTexto(quien.condicion))}</p>
        <div class="panel">
            <span class="panel__rotulo">${esCliente ? (saldo >= 0 ? "Te debe" : "Tiene a favor") : saldo >= 0 ? "Le debés" : "Te queda a favor"}</span>
            <span class="panel__numero">${esc(pesos(Math.abs(saldo)))}</span>
        </div>
        ${puedeCargar(usuario) && saldo > 0 ? `
        <form class="formulario bloque cobrar" novalidate>
            <h2 class="subtitulo"><i class="ti ti-cash"></i> ${esCliente ? "Cobrar" : "Pagar"}</h2>
            <div class="formulario__fila">
                <label>Importe
                    <span class="campo-con-boton">
                        <input name="monto" inputmode="decimal" maxlength="16" placeholder="0,00" autocomplete="off">
                        <button class="boton boton--secundario" type="button" data-todo>Todo</button>
                    </span>
                </label>
                <label>${esCliente ? "Entra por" : "Sale de"}<select name="cuenta">${Object.entries(CUENTAS).map(([k, v]) => `<option value="${esc(k)}"${k === "banco" ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
            </div>
            <p class="formulario__error" role="alert" hidden></p>
            <button class="boton" type="submit"><i class="ti ti-check"></i> ${esCliente ? "Registrar el cobro" : "Registrar el pago"}</button>
        </form>` : ""}
        <h2 class="subtitulo"><i class="ti ti-list"></i> Cuenta corriente</h2>
        ${htmlTabla(
            [{ titulo: "Fecha" }, { titulo: "Comprobante o movimiento" }, { titulo: "Debe", clase: "num" }, { titulo: "Haber", clase: "num" }, { titulo: "Saldo", clase: "num" }],
            filas.slice().reverse().map((f) => [
                esc(fechaCorta(f.fecha)),
                f.comprobanteId ? `<a href="#/facturar/${esc(f.comprobanteId)}">${esc(f.texto)}</a>` : esc(f.texto),
                f.debe ? esc(pesos(f.debe)) : "",
                f.haber ? esc(pesos(f.haber)) : "",
                `<b>${esc(pesos(f.saldo))}</b>`
            ]),
            { vacia: "Sin movimientos todavía.", etiqueta: "Cuenta corriente" }
        )}`;

    const form = cont.querySelector(".cobrar");
    if (!form) return;
    form.querySelector("[data-todo]").addEventListener("click", () => {
        form.monto.value = (saldo / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const error = form.querySelector(".formulario__error");
        error.hidden = true;
        try {
            const campos = { monto: form.monto.value, cuenta: form.cuenta.value };
            const m = esCliente ? datos.registrarCobro({ clienteId: id, ...campos }, usuario) : datos.registrarPago({ proveedorId: id, ...campos }, usuario);
            aviso(`${esCliente ? "Cobro" : "Pago"} de ${pesos(m.monto)} registrado.`);
            vistaFicha(cont, { usuario, datos, params: [tipo, id] });
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        }
    });
}
