// ============================================
// Contabilidad de Sazzo Contable: los asientos salen solos de cada factura, nota de crédito, compra, cobro, pago y
// devolución (no se cargan a mano en la demo). Se calculan cada vez desde los datos: así nunca quedan desparejos
// con lo que se facturó o se cobró. De ahí salen el libro diario, el mayor de cada cuenta y el balance de sumas y
// saldos. Todo en centavos. Funciones puras: reciben la empresa (los datos) y devuelven listas nuevas.
// ============================================
import { COMPROBANTES, numeroComprobante, signo } from "./reglas.js?v=c335bb1efa";

// Plan de cuentas (simple, el de una pyme comercial)
export const CUENTAS_CONTABLES = [
    { codigo: "1.1.01", nombre: "Caja", tipo: "Activo" },
    { codigo: "1.1.02", nombre: "Banco cuenta corriente", tipo: "Activo" },
    { codigo: "1.1.03", nombre: "Deudores por ventas", tipo: "Activo" },
    { codigo: "1.1.04", nombre: "IVA crédito fiscal", tipo: "Activo" },
    { codigo: "1.1.05", nombre: "Percepciones de IVA", tipo: "Activo" },
    { codigo: "1.1.06", nombre: "Percepciones de Ingresos Brutos", tipo: "Activo" },
    { codigo: "2.1.01", nombre: "Proveedores", tipo: "Pasivo" },
    { codigo: "2.1.02", nombre: "IVA débito fiscal", tipo: "Pasivo" },
    { codigo: "3.1.01", nombre: "Capital", tipo: "Patrimonio neto" },
    { codigo: "4.1.01", nombre: "Ventas", tipo: "Resultado positivo" },
    { codigo: "5.1.01", nombre: "Compras y gastos", tipo: "Resultado negativo" }
];
const C = {
    caja: "1.1.01",
    banco: "1.1.02",
    deudores: "1.1.03",
    ivaCredito: "1.1.04",
    percIva: "1.1.05",
    percIibb: "1.1.06",
    proveedores: "2.1.01",
    ivaDebito: "2.1.02",
    capital: "3.1.01",
    ventas: "4.1.01",
    compras: "5.1.01"
};
export const nombreCuenta = (codigo) => CUENTAS_CONTABLES.find((c) => c.codigo === codigo)?.nombre ?? codigo;

const renglon = (cuenta, debe, haber) => ({ cuenta, debe, haber });
/** Saca los renglones en cero y da vuelta los negativos (un débito negativo es un crédito). */
function limpiar(renglones) {
    return renglones
        .filter((r) => r.debe !== 0 || r.haber !== 0)
        .map((r) => {
            const neto = r.debe - r.haber;
            return renglon(r.cuenta, Math.max(0, neto), Math.max(0, -neto));
        });
}

/** Todos los asientos de la empresa, en orden de fecha y numerados. */
export function armarAsientos(e) {
    const lista = [];
    const sumar = (fecha, orden, detalle, renglones, origen) => lista.push({ fecha, orden, detalle, renglones: limpiar(renglones), origen });

    const ini = e.saldosIniciales;
    sumar(ini.desde, "0", "Asiento de apertura", [renglon(C.caja, ini.caja, 0), renglon(C.banco, ini.banco, 0), renglon(C.capital, 0, ini.caja + ini.banco)], null);

    for (const c of e.comprobantes) {
        const s = signo(c.tipo);
        const nombre = `${COMPROBANTES[c.tipo].nombre} ${numeroComprobante(c.puntoVenta, c.numero)} · ${c.receptor.nombre}`;
        sumar(c.fecha, c.hechoEn, nombre, [
            renglon(C.deudores, s * c.total, 0),
            renglon(C.ventas, 0, s * (c.neto + c.exento)),
            renglon(C.ivaDebito, 0, s * c.iva)
        ], { comprobanteId: c.id });
    }

    for (const c of e.compras) {
        if (c.anulada) continue;
        sumar(c.fecha, c.hechoEn, `Factura ${c.letra} ${numeroComprobante(c.puntoVenta, c.numero)} · ${c.emisor.nombre}`, [
            renglon(C.compras, c.neto + c.noGravado + (c.letra === "A" ? 0 : c.iva), 0),
            renglon(C.ivaCredito, c.letra === "A" ? c.iva : 0, 0),
            renglon(C.percIva, c.percepIva, 0),
            renglon(C.percIibb, c.percepIibb, 0),
            renglon(C.proveedores, 0, c.total)
        ], { compraId: c.id });
    }

    const cuentaPlata = (m) => (m.cuenta === "caja" ? C.caja : C.banco);
    for (const m of e.movimientos) {
        const quien = m.clienteId
            ? e.clientes.find((x) => x.id === m.clienteId)?.nombre
            : e.proveedores.find((x) => x.id === m.proveedorId)?.nombre;
        const detalle = `${m.detalle}${quien ? ` · ${quien}` : ""}`;
        if (m.tipo === "cobro") sumar(m.fecha, m.hechoEn, detalle, [renglon(cuentaPlata(m), m.monto, 0), renglon(C.deudores, 0, m.monto)], { movimientoId: m.id });
        if (m.tipo === "devolucion") sumar(m.fecha, m.hechoEn, detalle, [renglon(C.deudores, m.monto, 0), renglon(cuentaPlata(m), 0, m.monto)], { movimientoId: m.id });
        if (m.tipo === "pago") sumar(m.fecha, m.hechoEn, detalle, [renglon(C.proveedores, m.monto, 0), renglon(cuentaPlata(m), 0, m.monto)], { movimientoId: m.id });
    }

    lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden.localeCompare(b.orden));
    return lista.map((a, i) => {
        const { orden, ...resto } = a;
        return { numero: i + 1, ...resto };
    });
}

/** El mayor de una cuenta: cada renglón con el saldo acumulado (deudor positivo). */
export function armarMayor(asientos, cuenta) {
    const filas = [];
    let saldo = 0;
    for (const a of asientos) {
        for (const r of a.renglones) {
            if (r.cuenta !== cuenta) continue;
            saldo += r.debe - r.haber;
            filas.push({ numero: a.numero, fecha: a.fecha, detalle: a.detalle, debe: r.debe, haber: r.haber, saldo });
        }
    }
    return filas;
}

/** Balance de sumas y saldos hasta una fecha (incluida): cada cuenta con lo que sumó al debe, al haber y su saldo. */
export function armarBalance(asientos, hasta = "9999-12-31") {
    const porCuenta = Object.fromEntries(CUENTAS_CONTABLES.map((c) => [c.codigo, { ...c, debe: 0, haber: 0 }]));
    for (const a of asientos) {
        if (a.fecha > hasta) continue;
        for (const r of a.renglones) {
            porCuenta[r.cuenta].debe += r.debe;
            porCuenta[r.cuenta].haber += r.haber;
        }
    }
    const cuentas = Object.values(porCuenta).map((c) => ({ ...c, deudor: Math.max(0, c.debe - c.haber), acreedor: Math.max(0, c.haber - c.debe) }));
    const total = (k) => cuentas.reduce((s, c) => s + c[k], 0);
    return { hasta, cuentas, totales: { debe: total("debe"), haber: total("haber"), deudor: total("deudor"), acreedor: total("acreedor") } };
}
