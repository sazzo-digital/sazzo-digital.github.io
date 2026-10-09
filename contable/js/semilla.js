// ============================================
// Datos de fábrica de Sazzo Contable: una distribuidora inventada con 12 meses de movimiento (hasta hoy).
// Números "al azar" pero siempre los mismos (así la demo y las pruebas arrancan igual) y fechas corridas a hoy.
// CUIT de ejemplo que no pueden ser de nadie (los 8 números del medio empiezan con ceros).
//
// Todo cuelga de la empresa (db.empresas[]): la demo muestra una sola, pero la forma ya sirve para varias
// (estudio contable o grupo de empresas, decidido el 09/10).
// ============================================
import { NEGOCIO } from "./marca.js?v=bd1244e281";
import {
    cuitDeEjemplo, tipoFactura, calcularComprobante, repartirNotaCredito, caeSimulado, COMPROBANTES, NC_DE,
    fechaISO, sumarDias, ultimosPeriodos, ALICUOTAS
} from "./reglas.js?v=bd1244e281";

/** Números "al azar" pero siempre los mismos. */
function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const CUIT_EMPRESA = cuitDeEjemplo("30", 17);

// [id, nombre, condición, prefijo y número del CUIT de ejemplo (null = sin CUIT)]
const CLIENTES = [
    ["c-tornillo", "Ferretería El Tornillo S.R.L.", "RI", ["30", 101]],
    ["c-estacion", "Supermercado La Estación S.A.", "RI", ["30", 115]],
    ["c-hotel", "Hotel del Lago S.A.", "RI", ["30", 129]],
    ["c-fogon", "Restaurante El Fogón", "RI", ["20", 143]],
    ["c-robles", "Catering Los Robles S.R.L.", "RI", ["30", 157]],
    ["c-rosa", "Almacén Doña Rosa", "MT", ["27", 171]],
    ["c-central", "Kiosco Central", "MT", ["20", 185]],
    ["c-vidasana", "Dietética Vida Sana", "MT", ["27", 199]],
    ["c-puerto", "Bar El Puerto", "MT", ["20", 213]],
    ["c-escuela", "Cooperadora Escuela 120", "EX", ["30", 227]],
    ["c-union", "Club Social y Deportivo Unión", "EX", ["30", 241]]
];
export const ID_CONSUMIDOR_FINAL = "c-final";

// [id, nombre, condición, CUIT de ejemplo, qué vende: [[alícuota, neto base en pesos], …], compras por mes,
//  percepción de IVA %, percepción de IIBB %, cuenta con la que se paga]
const PROVEEDORES = [
    ["p-central", "Mayorista Central S.A.", "RI", ["30", 307], [["21", 1_600_000], ["10.5", 1_150_000]], 3, 0, 0, "banco"],
    ["p-pradera", "Alimentos La Pradera S.A.", "RI", ["30", 321], [["10.5", 1_250_000]], 2, 0, 0, "banco"],
    ["p-embotelladora", "Embotelladora del Sur S.A.", "RI", ["30", 335], [["21", 900_000]], 2, 3, 1.5, "banco"],
    ["p-ruta7", "Estación de Servicio Ruta 7", "RI", ["30", 349], [["21", 120_000]], 3, 0, 2, "caja"],
    ["p-electrica", "Cooperativa Eléctrica Regional", "RI", ["30", 363], [["27", 260_000]], 1, 0, 0, "banco"],
    ["p-conecta", "Conecta Telecomunicaciones S.A.", "RI", ["30", 377], [["27", 65_000]], 1, 0, 0, "banco"],
    ["p-fletes", "Fletes Patagonia S.R.L.", "RI", ["30", 391], [["21", 380_000]], 1, 0, 0, "banco"],
    ["p-alquiler", "Rodolfo Paz (alquiler del depósito)", "MT", ["20", 405], [["C", 950_000]], 1, 0, 0, "banco"]
];

// [descripción, alícuota, precio sin IVA hoy en pesos] (lo que vende la distribuidora, sin marcas)
export const PRODUCTOS = [
    ["Aceite de girasol 900 ml x 12", "10.5", 28_000],
    ["Harina 000 1 kg x 10", "10.5", 9_500],
    ["Fideos secos 500 g x 20", "10.5", 18_000],
    ["Arroz largo fino 1 kg x 10", "10.5", 14_000],
    ["Yerba mate 1 kg x 10", "21", 52_000],
    ["Gaseosa 2,25 L x 6", "21", 13_500],
    ["Agua mineral 2 L x 6", "21", 7_200],
    ["Galletitas surtidas x 24", "21", 19_000],
    ["Lavandina 1 L x 12", "21", 9_800],
    ["Detergente 750 ml x 12", "21", 16_500],
    ["Papel higiénico x 48", "21", 21_000],
    ["Leche entera 1 L x 12", "ex", 14_400],
    ["Flete y entrega", "21", 12_000]
];

const INFLACION_MENSUAL = 0.02; // los precios de hace 11 meses eran ~20 % más bajos

/** Las compras del mes que "están en ARCA" y todavía no se cargaron (las trae el botón "Traer de ARCA"). */
const RECIBIDAS_ARCA = [
    ["p-central", 1],
    ["p-pradera", 1],
    ["p-embotelladora", 1],
    ["p-ruta7", 1],
    ["p-electrica", 1],
    ["p-fletes", 1]
];

export function semilla(hoy = new Date()) {
    const azar = azarFijo(2026);
    const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
    const hoyISO = fechaISO(hoy);
    const periodos = ultimosPeriodos(12, hoyISO.slice(0, 7));
    const diaHoy = hoy.getDate();
    const diasDelMes = (p) => new Date(Number(p.slice(0, 4)), Number(p.slice(5, 7)), 0).getDate();
    const fechaDe = (p, dia) => `${p}-${String(dia).padStart(2, "0")}`;
    const ultimoDia = (p, i) => (i === periodos.length - 1 ? diaHoy : diasDelMes(p));

    const empresa = {
        id: "e-1",
        razonSocial: NEGOCIO,
        fantasia: "Los Álamos",
        cuit: CUIT_EMPRESA,
        condicionIva: "RI",
        puntoVenta: 3,
        domicilio: "Parque Industrial, Lote 14",
        iibb: "Contribuyente local",
        inicioActividades: "2015-03-01",
        logo: null, // imagen chica (data:image/…) que se sube en "Tu empresa"
        modulos: { compras: true, cuentas: true, contabilidad: true }, // pantallas que se pueden apagar
        saldosIniciales: { caja: 85_000_000, banco: 1_250_000_000, desde: fechaDe(periodos[0], 1) },
        clientes: [],
        proveedores: [],
        comprobantes: [],
        compras: [],
        movimientos: [],
        recibidasArca: []
    };

    empresa.clientes.push({ id: ID_CONSUMIDOR_FINAL, nombre: "Consumidor final", condicion: "CF", cuit: null, doc: null, fijo: true });
    for (const [id, nombre, condicion, [pre, num]] of CLIENTES) {
        empresa.clientes.push({ id, nombre, condicion, cuit: cuitDeEjemplo(pre, num), doc: null });
    }
    for (const [id, nombre, condicion, [pre, num]] of PROVEEDORES) {
        empresa.proveedores.push({ id, nombre, condicion, cuit: cuitDeEjemplo(pre, num) });
    }
    const cliente = (id) => empresa.clientes.find((c) => c.id === id);
    const proveedor = (id) => empresa.proveedores.find((p) => p.id === id);

    // ---------- Ventas (facturas y alguna nota de crédito) ----------
    const ventas = [];
    periodos.forEach((p, i) => {
        const factor = (1 + INFLACION_MENSUAL) ** -(periodos.length - 1 - i);
        const ultimo = ultimoDia(p, i);
        const cantidad = i === periodos.length - 1 ? Math.max(8, Math.round((30 * ultimo) / 30)) : entre(26, 34);
        for (let k = 0; k < cantidad; k++) {
            const r = azar();
            const idCliente = r < 0.3 ? ID_CONSUMIDOR_FINAL : CLIENTES[Math.floor(((r - 0.3) / 0.7) * CLIENTES.length)][0];
            const c = cliente(idCliente);
            const tipo = tipoFactura("RI", c.condicion);
            const letra = COMPROBANTES[tipo].letra;
            const renglones = [];
            const usados = new Set();
            const cuantos = c.condicion === "RI" ? entre(2, 4) : entre(1, 3);
            for (let j = 0; j < cuantos; j++) {
                const prod = elegir(PRODUCTOS);
                if (usados.has(prod[0])) continue;
                usados.add(prod[0]);
                const [descripcion, alicuota, base] = prod;
                const sinIva = Math.round(base * factor) * 100;
                const conIva = alicuota === "ex" ? sinIva : Math.round((sinIva * (1000 + ALICUOTAS[alicuota].porMil)) / 1000 / 100) * 100;
                const cant = c.condicion === "CF" ? entre(1, 3) : c.condicion === "RI" ? entre(12, 70) : entre(3, 14);
                renglones.push({ descripcion, cantidad: cant, precio: letra === "B" ? conIva : sinIva, alicuota });
            }
            const fecha = fechaDe(p, entre(1, ultimo));
            const contado = c.condicion === "CF" || (c.condicion === "MT" && azar() < 0.6);
            ventas.push({ fecha, tipo, cliente: c, renglones, contado, hora: azar() });
        }
    });
    ventas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora);

    const proximo = { FA: 1184, FB: 3517, FC: 1, NCA: 37, NCB: 112, NCC: 1 };
    const nuevoComprobante = (tipo, fecha, c, calculo, extra = {}) => {
        const numero = proximo[tipo]++;
        const comp = {
            id: `v-${String(empresa.comprobantes.length + 1).padStart(4, "0")}`,
            tipo,
            puntoVenta: empresa.puntoVenta,
            numero,
            fecha,
            clienteId: c.id,
            receptor: { nombre: c.nombre, condicion: c.condicion, cuit: c.cuit, doc: c.doc },
            renglones: calculo.renglones ?? [],
            grupos: calculo.grupos,
            neto: calculo.neto,
            iva: calculo.iva,
            exento: calculo.exento,
            total: calculo.total,
            condicionVenta: "cuenta corriente",
            cae: caeSimulado(empresa.cuit, COMPROBANTES[tipo].codigo, empresa.puntoVenta, numero),
            caeVence: sumarDias(fecha, 10),
            hechoPor: "u-admin",
            hechoEn: `${fecha}T12:00:00.000Z`,
            ...extra
        };
        empresa.comprobantes.push(comp);
        return comp;
    };

    let numMov = 0;
    const movimiento = (m) => empresa.movimientos.push({ id: `m-${String(++numMov).padStart(4, "0")}`, hechoPor: "u-admin", hechoEn: `${m.fecha}T15:00:00.000Z`, ...m });

    const morosos = new Set(["c-hotel"]); // el hotel no paga hace dos meses: aparece en "quién te debe"
    for (const v of ventas) {
        const letra = COMPROBANTES[v.tipo].letra;
        const comp = nuevoComprobante(v.tipo, v.fecha, v.cliente, calcularComprobante(v.renglones, letra), {
            condicionVenta: v.contado ? "contado" : "cuenta corriente"
        });
        const diasAtras = Math.round((hoy - new Date(`${v.fecha}T12:00:00`)) / 86400000);
        if (v.contado) {
            movimiento({ tipo: "cobro", clienteId: v.cliente.id, cuenta: v.cliente.condicion === "CF" && azar() < 0.7 ? "caja" : "banco", monto: comp.total, fecha: v.fecha, comprobanteId: comp.id, detalle: "Cobro al contado" });
        } else {
            const plazo = entre(12, 40);
            const debe = morosos.has(v.cliente.id) && diasAtras < 75;
            if (!debe && diasAtras > plazo) {
                movimiento({ tipo: "cobro", clienteId: v.cliente.id, cuenta: "banco", monto: comp.total, fecha: sumarDias(v.fecha, plazo), comprobanteId: comp.id, detalle: "Transferencia" });
            }
        }
    }

    // Una nota de crédito parcial por mes (mercadería devuelta), menos en el mes actual
    const facturasA = empresa.comprobantes.filter((c) => c.tipo === "FA" || c.tipo === "FB");
    for (const p of periodos.slice(0, -1)) {
        const delMes = facturasA.filter((c) => c.fecha.startsWith(p));
        if (!delMes.length) continue;
        const f = elegir(delMes);
        const monto = Math.round(f.total * (0.1 + azar() * 0.2));
        const reparto = repartirNotaCredito({ grupos: f.grupos, exento: f.exento, total: f.total }, monto);
        const despues = sumarDias(f.fecha, entre(1, 5));
        const fecha = despues > hoyISO ? hoyISO : despues;
        const nc = nuevoComprobante(NC_DE[f.tipo], fecha, cliente(f.clienteId), reparto, {
            asociadaId: f.id,
            motivo: "Mercadería devuelta",
            renglones: [{ descripcion: "Mercadería devuelta", cantidad: 1, precio: f.tipo === "FA" ? reparto.neto + reparto.exento : monto, alicuota: null }],
            condicionVenta: f.condicionVenta
        });
        // Si la factura ya estaba cobrada, se devolvió la plata
        if (empresa.movimientos.some((m) => m.comprobanteId === f.id)) {
            movimiento({ tipo: "devolucion", clienteId: f.clienteId, cuenta: "banco", monto: nc.total, fecha: nc.fecha > hoyISO ? hoyISO : nc.fecha, comprobanteId: nc.id, detalle: "Devolución por nota de crédito" });
        }
    }

    // ---------- Compras ----------
    let numCompra = 0;
    const numeroProv = {};
    const nuevaCompra = (idProv, fecha, factor, origen = "manual") => {
        const [, , condicion, , vende, , percIva, percIibb] = PROVEEDORES.find((x) => x[0] === idProv);
        const prov = proveedor(idProv);
        const letra = condicion === "RI" ? "A" : "C";
        const grupos = {};
        let neto = 0;
        let iva = 0;
        let noGravado = 0;
        for (const [alic, base] of vende) {
            const n = Math.round(base * factor * (0.75 + azar() * 0.5)) * 100;
            if (alic === "C") {
                noGravado += n;
                continue;
            }
            const i = Math.round((n * ALICUOTAS[alic].porMil) / 1000);
            grupos[alic] = { neto: n, iva: i };
            neto += n;
            iva += i;
        }
        const percepIva = Math.round((neto * percIva) / 100);
        const percepIibb = Math.round((neto * percIibb) / 100);
        numeroProv[idProv] = (numeroProv[idProv] ?? entre(2_000, 60_000)) + entre(1, 40);
        return {
            id: `c-${String(++numCompra).padStart(4, "0")}`,
            proveedorId: idProv,
            emisor: { nombre: prov.nombre, condicion: prov.condicion, cuit: prov.cuit },
            letra,
            puntoVenta: entre(1, 12),
            numero: numeroProv[idProv],
            fecha,
            grupos,
            neto,
            iva,
            noGravado,
            percepIva,
            percepIibb,
            total: neto + iva + noGravado + percepIva + percepIibb,
            origen,
            anulada: false,
            hechoPor: "u-admin",
            hechoEn: `${fecha}T10:00:00.000Z`
        };
    };

    const ultimoPeriodo = periodos.at(-1);
    periodos.forEach((p, i) => {
        const factor = (1 + INFLACION_MENSUAL) ** -(periodos.length - 1 - i);
        const ultimo = ultimoDia(p, i);
        for (const [idProv, , , , , porMes, , , cuenta] of PROVEEDORES) {
            // del mes actual, las de RECIBIDAS_ARCA no están cargadas todavía (esperan en ARCA)
            const enArca = p === ultimoPeriodo ? RECIBIDAS_ARCA.find((x) => x[0] === idProv)?.[1] ?? 0 : 0;
            for (let k = 0; k < porMes; k++) {
                // Del mes en curso solo existen las de los días que ya pasaron (las que esperan en ARCA, siempre)
                let dia = entre(1, diasDelMes(p));
                if (dia > ultimo) {
                    if (k >= enArca) continue;
                    dia = entre(1, ultimo);
                }
                const fecha = fechaDe(p, dia);
                const compra = nuevaCompra(idProv, fecha, factor, k < enArca ? "arca" : "manual");
                if (k < enArca) {
                    empresa.recibidasArca.push(compra);
                    continue;
                }
                empresa.compras.push(compra);
                const plazo = entre(7, 30);
                const diasAtras = Math.round((hoy - new Date(`${fecha}T12:00:00`)) / 86400000);
                if (diasAtras > plazo) {
                    movimiento({ tipo: "pago", proveedorId: idProv, cuenta, monto: compra.total, fecha: sumarDias(fecha, plazo), compraId: compra.id, detalle: cuenta === "caja" ? "Pago en efectivo" : "Transferencia" });
                }
            }
        }
    });
    empresa.comprobantes.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
    empresa.compras.sort((a, b) => a.fecha.localeCompare(b.fecha));
    empresa.movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));

    return { empresaActual: empresa.id, empresas: [empresa] };
}
