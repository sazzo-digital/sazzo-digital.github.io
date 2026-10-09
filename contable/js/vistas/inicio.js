// ============================================
// Inicio de Sazzo Contable: el tablero de la empresa. Vendido y comprado en el mes, IVA estimado y cuándo vence,
// quién te debe y a quién le debés, y lo último que se facturó. Arriba, el paso del recorrido de cada persona
// (Silvina arranca facturando; Hernán y Patricia, mirando).
// ============================================
import { esc } from "../../kit/js/ui.js?v=bdb0a941ae";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=bdb0a941ae";
import { pesos, pesosRedondo, nombrePeriodo, periodoActual, correrPeriodo, signo, numeroComprobante } from "../reglas.js?v=bdb0a941ae";
import { buscarPersona } from "../marca.js?v=bdb0a941ae";
import { logoEmpresa, haceDias, pastillaTipo, diaMes, fechaCorta } from "./comunes.js?v=bdb0a941ae";

export function vistaInicio(cont, { usuario, datos, irA }) {
    const e = datos.leerEmpresa();
    const periodo = periodoActual();
    const historial = datos.historialIva(2);
    const [anterior, actual] = historial.length === 2 ? historial : [null, historial[0]];
    const pos = datos.posicionIva(periodo);
    const deben = datos.listarClientes().filter((c) => c.saldo > 0).sort((a, b) => b.saldo - a.saldo);
    const debes = e.modulos?.cuentas !== false ? datos.listarProveedores().filter((p) => p.saldo > 0).sort((a, b) => b.saldo - a.saldo) : [];
    const ultimos = datos.listarComprobantes().slice(0, 5);
    const pendientesArca = datos.pendientesArca().length;
    const ri = e.condicionIva === "RI";
    const variacion = anterior && anterior.ventas ? Math.round(((actual.ventas - anterior.ventas) / anterior.ventas) * 100) : null;

    cont.innerHTML = `
        <div class="empresa-titulo">
            ${logoEmpresa(e)}
            <div><h1 class="titulo">${esc(e.razonSocial)}</h1><p class="nota">${esc(nombrePeriodo(periodo))} · ${esc(usuario.rolTexto)}</p></div>
        </div>
        ${pasoDelRecorrido(usuario, pendientesArca)}
        <div class="paneles paneles--3">
            <a class="panel panel--link" href="#/facturar">
                <span class="panel__rotulo">Vendido este mes</span>
                <span class="panel__numero">${esc(pesosRedondo(actual?.ventas ?? 0))}</span>
                <small>${variacion === null ? "" : `${esc(nombrePeriodo(correrPeriodo(periodo, -1)))}: ${esc(pesosRedondo(anterior.ventas))} (mes completo)`}</small>
            </a>
            <a class="panel panel--link" href="#/${e.modulos?.compras !== false ? "compras" : "iva"}">
                <span class="panel__rotulo">Comprado este mes</span>
                <span class="panel__numero">${esc(pesosRedondo(actual?.compras ?? 0))}</span>
                <small>${pendientesArca ? `${pendientesArca} facturas esperando en ARCA` : "Todo cargado"}</small>
            </a>
            <a class="panel panel--link panel--iva" href="#/iva">
                ${ri && pos ? `
                <span class="panel__rotulo">${pos.aPagar > 0 ? "IVA a pagar (hasta hoy)" : "IVA: saldo a favor"}</span>
                <span class="panel__numero">${esc(pesosRedondo(pos.aPagar > 0 ? pos.aPagar : pos.aFavor))}</span>
                <small>${pos.aPagar > 0 ? `Vence el ${esc(fechaCorta(pos.vence))}` : "Se descuenta el mes que viene"}</small>` : `
                <span class="panel__rotulo">IVA</span><span class="panel__numero">—</span><small>No liquidás IVA (${esc(e.condicionIva === "MT" ? "monotributo" : "exento")})</small>`}
            </a>
        </div>

        <div class="columnas">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-user-dollar"></i> Quién te debe</h2>
                ${deben.length ? `<ul class="lista-cuentas">${deben.slice(0, 5).map((c) => `
                    <li><a class="cuenta-fila" href="#/cuentas/cliente/${esc(c.id)}">
                        <span class="cuenta-fila__texto"><b>${esc(c.nombre)}</b><small>debe desde ${esc(haceDias(c.debeDesde))}</small></span>
                        <b class="monto${haceMasDe(c.debeDesde, 45) ? " monto--atrasado" : ""}">${esc(pesos(c.saldo))}</b>
                    </a></li>`).join("")}</ul>
                <a class="boton-link" href="#/cuentas?ver=clientes">Ver todos (${deben.length})</a>` : `<p class="nota"><i class="ti ti-mood-smile"></i> Nadie te debe nada.</p>`}
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-file-invoice"></i> Lo último que se facturó</h2>
                <ul class="lista-comprobantes">${ultimos.map((c) => `
                    <li><a class="comprobante-fila" href="#/facturar/${esc(c.id)}">${pastillaTipo(c.tipo)}<span class="comprobante-fila__texto"><b>${esc(c.receptor.nombre)}</b><small>${esc(numeroComprobante(c.puntoVenta, c.numero))} · ${esc(diaMes(c.fecha))}</small></span><b class="monto${signo(c.tipo) < 0 ? " monto--resta" : ""}">${signo(c.tipo) < 0 ? "−" : ""}${esc(pesos(c.total))}</b></a></li>`).join("")}
                </ul>
            </section>
        </div>
        ${debes.length ? `
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-truck-delivery"></i> A quién le debés</h2>
            <ul class="lista-cuentas">${debes.slice(0, 3).map((p) => `
                <li><a class="cuenta-fila" href="#/cuentas/proveedor/${esc(p.id)}"><span class="cuenta-fila__texto"><b>${esc(p.nombre)}</b></span><b class="monto">${esc(pesos(p.saldo))}</b></a></li>`).join("")}
            </ul>
        </section>` : ""}`;
    activarGuias(cont, irA);
}

function pasoDelRecorrido(usuario, pendientesArca) {
    if (usuario.rol === "admin") {
        return `
            <div class="paso-recorrido">
                <a class="boton boton--grande" href="#/facturar/nueva?wow=1"><i class="ti ti-file-invoice"></i> Empezá: hacé una factura A</a>
                <p class="nota"><i class="ti ti-hand-finger"></i> A Ferretería El Tornillo, que es Responsable Inscripta: fijate cómo la letra sale sola.</p>
                ${pendientesArca ? "" : htmlGuia({ persona: buscarPersona("u-contadora"), ruta: "/iva", texto: "Mirá lo que ve la contadora" })}
            </div>`;
    }
    if (usuario.rol === "dueno") {
        return `<div class="paso-recorrido">${htmlGuia({ persona: buscarPersona("u-contadora"), ruta: "/iva", texto: "Mirá el IVA del mes como la contadora" })}<p class="nota"><i class="ti ti-building"></i> En <a href="#/empresa">Tu empresa</a> ponés el nombre y el logo de tu negocio.</p></div>`;
    }
    return `<div class="paso-recorrido"><a class="boton boton--grande" href="#/iva"><i class="ti ti-receipt-tax"></i> Ir al IVA del mes</a></div>`;
}

function haceMasDe(fecha, dias) {
    if (!fecha) return false;
    const [a, m, d] = fecha.split("-").map(Number);
    return (Date.now() - new Date(a, m - 1, d).getTime()) / 864e5 > dias;
}
