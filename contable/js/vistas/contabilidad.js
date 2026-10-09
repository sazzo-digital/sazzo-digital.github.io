// ============================================
// Contabilidad: libro diario (los asientos salen solos de cada factura, compra, cobro y pago), mayor de cada cuenta
// y balance de sumas y saldos. Solo para mirar: en la demo no hay asientos manuales.
// ============================================
import { esc } from "../../kit/js/ui.js?v=bdb0a941ae";
import { pesos, nombrePeriodo, periodoActual, correrPeriodo } from "../reglas.js?v=bdb0a941ae";
import { nombreCuenta } from "../contabilidad.js?v=bdb0a941ae";
import { periodoPedido, htmlSelectorMes, activarSelectorMes, htmlTabla, fechaCorta, diaMes } from "./comunes.js?v=bdb0a941ae";

const VISTAS = { diario: "Libro diario", mayor: "Mayor", balance: "Balance" };
const MAX_ASIENTOS = 60; // en pantalla (el resto, cambiando de mes)

export function vistaContabilidad(cont, { datos, consulta }) {
    const ver = Object.hasOwn(VISTAS, consulta?.get("ver")) ? consulta.get("ver") : "diario";
    const periodo = periodoPedido(consulta);
    cont.innerHTML = `
        <h1 class="titulo">Contabilidad</h1>
        <div class="pestanas" role="tablist">
            ${Object.entries(VISTAS).map(([k, v]) => `<a role="tab" class="pestana${k === ver ? " activa" : ""}" aria-selected="${k === ver}" href="#/contabilidad?ver=${k}&p=${esc(periodo)}">${esc(v)}</a>`).join("")}
        </div>
        <div class="fila-filtros">${htmlSelectorMes(periodo)}${ver === "mayor" ? selectorCuenta(datos, consulta) : ""}</div>
        <div class="contabilidad-contenido"></div>
        <p class="nota"><i class="ti ti-info-circle"></i> Los asientos se arman solos con cada factura, nota de crédito, compra, cobro y pago. En la versión real también se cargan asientos a mano y se cierra el ejercicio.</p>`;
    activarSelectorMes(cont, "/contabilidad", `&ver=${ver}${ver === "mayor" ? `&cuenta=${encodeURIComponent(cuentaPedida(datos, consulta))}` : ""}`);
    cont.querySelector("#cuenta")?.addEventListener("change", (e) => {
        location.hash = `#/contabilidad?ver=mayor&p=${periodo}&cuenta=${encodeURIComponent(e.target.value)}`;
    });
    const lugar = cont.querySelector(".contabilidad-contenido");
    if (ver === "diario") pintarDiario(lugar, datos, periodo);
    if (ver === "mayor") pintarMayor(lugar, datos, periodo, cuentaPedida(datos, consulta));
    if (ver === "balance") pintarBalance(lugar, datos, periodo);
}

function cuentaPedida(datos, consulta) {
    const c = consulta?.get("cuenta");
    return datos.cuentasContables().some((x) => x.codigo === c) ? c : "1.1.02";
}

function selectorCuenta(datos, consulta) {
    const actual = cuentaPedida(datos, consulta);
    return `
        <label class="selector-mes"><span class="visualmente-oculto">Cuenta</span><i class="ti ti-book" aria-hidden="true"></i>
            <select id="cuenta">${datos.cuentasContables().map((c) => `<option value="${esc(c.codigo)}"${c.codigo === actual ? " selected" : ""}>${esc(c.codigo)} ${esc(c.nombre)}</option>`).join("")}</select>
        </label>`;
}

function pintarDiario(lugar, datos, periodo) {
    const asientos = datos.asientos({ periodo });
    const mostrados = asientos.slice(-MAX_ASIENTOS).reverse();
    lugar.innerHTML = `
        <p class="nota"><i class="ti ti-notebook"></i> ${asientos.length} asientos en ${esc(nombrePeriodo(periodo))}${asientos.length > MAX_ASIENTOS ? ` (se ven los últimos ${MAX_ASIENTOS})` : ""}.</p>
        ${mostrados.length ? `<ol class="asientos">${mostrados.map((a) => `
            <li class="asiento">
                <p class="asiento__cabeza"><b>N° ${esc(a.numero)}</b><span>${esc(fechaCorta(a.fecha))}</span>${a.origen?.comprobanteId ? `<a href="#/facturar/${esc(a.origen.comprobanteId)}">${esc(a.detalle)}</a>` : `<span>${esc(a.detalle)}</span>`}</p>
                <table class="asiento__renglones">
                    <tbody>${a.renglones.map((r) => `
                        <tr class="${r.haber ? "haber" : "debe"}"><td>${r.haber ? "a " : ""}${esc(nombreCuenta(r.cuenta))}</td><td class="num">${r.debe ? esc(pesos(r.debe)) : ""}</td><td class="num">${r.haber ? esc(pesos(r.haber)) : ""}</td></tr>`).join("")}
                    </tbody>
                </table>
            </li>`).join("")}</ol>` : `<p class="nota"><i class="ti ti-info-circle"></i> No hay asientos en este mes.</p>`}`;
}

function pintarMayor(lugar, datos, periodo, cuenta) {
    const todas = datos.mayor(cuenta);
    const anteriores = todas.filter((f) => f.fecha < `${periodo}-01`);
    const saldoInicial = anteriores.at(-1)?.saldo ?? 0;
    const delMes = todas.filter((f) => f.fecha.startsWith(periodo));
    const saldoFinal = delMes.at(-1)?.saldo ?? saldoInicial;
    lugar.innerHTML = `
        <div class="paneles">
            <div class="panel"><span class="panel__rotulo">Saldo al empezar el mes</span><span class="panel__numero">${esc(pesos(saldoInicial))}</span></div>
            <div class="panel"><span class="panel__rotulo">Saldo al terminar</span><span class="panel__numero">${esc(pesos(saldoFinal))}</span><small>${esc(nombreCuenta(cuenta))} (positivo = deudor)</small></div>
        </div>
        ${htmlTabla(
            [{ titulo: "Asiento" }, { titulo: "Fecha" }, { titulo: "Detalle" }, { titulo: "Debe", clase: "num" }, { titulo: "Haber", clase: "num" }, { titulo: "Saldo", clase: "num" }],
            delMes.slice().reverse().map((f) => [esc(f.numero), esc(diaMes(f.fecha)), esc(f.detalle), f.debe ? esc(pesos(f.debe)) : "", f.haber ? esc(pesos(f.haber)) : "", `<b>${esc(pesos(f.saldo))}</b>`]),
            { vacia: "Esta cuenta no se movió en el mes.", etiqueta: `Mayor de ${nombreCuenta(cuenta)}` }
        )}`;
}

function pintarBalance(lugar, datos, periodo) {
    const fin = periodo === periodoActual() ? "9999-12-31" : `${correrPeriodo(periodo, 1)}-01`;
    const b = datos.balance(fin === "9999-12-31" ? undefined : diaAnterior(fin));
    const p = (n) => (n ? esc(pesos(n)) : "");
    lugar.innerHTML = `
        <p class="nota"><i class="ti ti-scale"></i> Balance de sumas y saldos al cierre de ${esc(nombrePeriodo(periodo))}${periodo === periodoActual() ? " (hasta hoy)" : ""}. Las sumas del debe y del haber tienen que dar igual.</p>
        ${htmlTabla(
            [{ titulo: "Cuenta" }, { titulo: "Tipo" }, { titulo: "Debe", clase: "num" }, { titulo: "Haber", clase: "num" }, { titulo: "Saldo deudor", clase: "num" }, { titulo: "Saldo acreedor", clase: "num" }],
            b.cuentas.map((c) => [`${esc(c.codigo)} ${esc(c.nombre)}`, esc(c.tipo), p(c.debe), p(c.haber), p(c.deudor), p(c.acreedor)]),
            { pie: ["<b>Totales</b>", "", `<b>${p(b.totales.debe)}</b>`, `<b>${p(b.totales.haber)}</b>`, `<b>${p(b.totales.deudor)}</b>`, `<b>${p(b.totales.acreedor)}</b>`], etiqueta: "Balance de sumas y saldos" }
        )}
        <p class="balance-ok ${b.totales.debe === b.totales.haber ? "ok" : "mal"}"><i class="ti ${b.totales.debe === b.totales.haber ? "ti-circle-check" : "ti-alert-triangle"}"></i> ${b.totales.debe === b.totales.haber ? "Cierra: debe y haber dan igual." : "No cierra."}</p>`;
}

function diaAnterior(fecha) {
    const [a, m, d] = fecha.split("-").map(Number);
    const f = new Date(a, m - 1, d - 1);
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
