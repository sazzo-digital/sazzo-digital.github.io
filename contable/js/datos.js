// ============================================
// Datos de Sazzo Contable (modo prueba, guardados en este navegador con el prefijo de la demo).
// Reglas del kit: cada función que modifica controla el permiso con exigir(); todo lo que se carga tiene tope;
// nada se borra (se anula, o se hace una nota de crédito); se devuelven copias.
// Las reglas fiscales (qué factura va, IVA, CAE simulado, vencimientos) están en reglas.js; los datos de fábrica,
// en semilla.js. Todo cuelga de "la empresa actual" (la forma ya sirve para varias empresas).
// La plata va en centavos. Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=90b39ad86f";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=90b39ad86f";
import { esFechaISO } from "../kit/js/fechas.js?v=90b39ad86f";
import { MARCA } from "./marca.js?v=90b39ad86f";
import { semilla as semillaFabrica, ID_CONSUMIDOR_FINAL } from "./semilla.js?v=90b39ad86f";
import { armarAsientos, armarMayor, armarBalance, CUENTAS_CONTABLES } from "./contabilidad.js?v=90b39ad86f";
import {
    COMPROBANTES, NC_DE, CONDICIONES, ALICUOTAS, ORDEN_ALICUOTAS, TOPE_CF_IDENTIFICAR, signo, esAlicuota, tipoFactura,
    calcularComprobante, repartirNotaCredito, caeSimulado, revisarCuit, soloNumeros, aCentavos, fechaISO, sumarDias,
    periodoDe, periodoActual, ultimosPeriodos, correrPeriodo, vencimientoIva, numeroComprobante
} from "./reglas.js?v=90b39ad86f";

export const VERSION_DATOS = 4;

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    nombre: 60, // razón social (de la empresa, un cliente o un proveedor), descripción de un renglón
    fantasia: 40,
    domicilio: 80,
    iibb: 40,
    logo: 300_000, // letras del logo guardado (la pantalla lo achica antes: queda en ~30 KB)
    motivo: 80,
    cantidad: 9_999, // unidades de un renglón (enteras)
    renglones: 30, // renglones de una factura
    precio: 999_999_999, // pesos por unidad
    total: 9_999_999_999, // pesos de un comprobante (así ninguna suma pasa el límite de los números de JavaScript)
    movimiento: 9_999_999_999, // pesos de un cobro o un pago
    puntoVenta: 99_999,
    numero: 99_999_999,
    diasAtras: 400, // una compra puede ser de hasta ~13 meses atrás
    clientes: 200,
    proveedores: 200,
    // en total (todas las demos comparten el lugar del navegador: ~400 KB con los datos de ejemplo)
    comprobantes: 2_000, // facturas y notas
    compras: 2_000,
    movimientos: 3_000 // cobros, pagos y devoluciones
};

export const CUENTAS = { caja: "Caja", banco: "Banco" };
export const ROLES_QUE_CARGAN = ["admin"];
export const ROLES_QUE_CONFIGURAN = ["admin", "dueno"]; // "Tu empresa": Silvina y Hernán (la contadora no)
export const MODULOS = { compras: "Compras", cuentas: "Cuentas", contabilidad: "Contabilidad" };
const MENSAJE_PERMISO = "Solo administración carga facturas, compras, cobros y pagos. Cambiá a Silvina para probarlo.";
const MENSAJE_LLENO = "Es una demo: llegaste al máximo. Tocá \"Empezar de cero\" arriba para volver a los datos de ejemplo.";

const hoy = () => fechaISO(new Date());
const puedeCargar = (quien) => ROLES_QUE_CARGAN.includes(quien?.rol);

/** Las funciones de datos. `prefijo` cambia solo en las pruebas (así no tocan los datos de la demo). */
export function crearDatos(prefijo = MARCA.prefijo, { semilla = semillaFabrica } = {}) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla: () => semilla() });

    /** La empresa actual (la de verdad, no una copia: solo para uso interno). */
    const emp = () => {
        const db = guardado.db();
        return db.empresas.find((e) => e.id === db.empresaActual) ?? db.empresas[0];
    };
    const exigirCarga = (quien) => {
        exigir(quien?.id, "Elegí con quién probarla.");
        exigir(puedeCargar(quien), MENSAJE_PERMISO);
    };
    const exigirConfig = (quien) => {
        exigir(quien?.id, "Elegí con quién probarla.");
        exigir(ROLES_QUE_CONFIGURAN.includes(quien?.rol), "Los datos de la empresa los cambian Silvina o Hernán.");
    };
    const cliente = (id) => buscar(emp().clientes, id, "Ese cliente ya no existe.");
    const proveedor = (id) => buscar(emp().proveedores, id, "Ese proveedor ya no existe.");
    const comprasVigentes = () => emp().compras.filter((c) => !c.anulada);

    // ---------- Saldos ----------
    function saldoCliente(id) {
        const e = emp();
        let saldo = 0;
        for (const c of e.comprobantes) if (c.clienteId === id) saldo += signo(c.tipo) * c.total;
        for (const m of e.movimientos) {
            if (m.clienteId !== id) continue;
            if (m.tipo === "cobro") saldo -= m.monto;
            if (m.tipo === "devolucion") saldo += m.monto;
        }
        return saldo;
    }

    function saldoProveedor(id) {
        let saldo = 0;
        for (const c of comprasVigentes()) if (c.proveedorId === id) saldo += c.total;
        for (const m of emp().movimientos) if (m.proveedorId === id && m.tipo === "pago") saldo -= m.monto;
        return saldo;
    }

    function saldoCuenta(cuenta) {
        const e = emp();
        let saldo = e.saldosIniciales[cuenta] ?? 0;
        for (const m of e.movimientos) {
            if (m.cuenta !== cuenta) continue;
            saldo += m.tipo === "cobro" ? m.monto : -m.monto;
        }
        return saldo;
    }

    /** Desde cuándo debe un cliente: la factura más vieja que el saldo todavía no cubre. */
    function debeDesde(id, saldo) {
        if (saldo <= 0) return null;
        const facturas = emp().comprobantes.filter((c) => c.clienteId === id && signo(c.tipo) > 0).sort((a, b) => b.fecha.localeCompare(a.fecha));
        let acumulado = 0;
        for (const f of facturas) {
            acumulado += f.total;
            if (acumulado >= saldo) return f.fecha;
        }
        return facturas.at(-1)?.fecha ?? null;
    }

    const proximoNumero = (tipo, pv) =>
        emp().comprobantes.filter((c) => c.tipo === tipo && c.puntoVenta === pv).reduce((n, c) => Math.max(n, c.numero), 0) + 1;

    function nuevoMovimiento(m, quien) {
        exigir(emp().movimientos.length < TOPES.movimientos, MENSAJE_LLENO);
        const mov = { id: nuevoId("m"), fecha: hoy(), hechoPor: quien.id, hechoEn: ahora(), ...m };
        emp().movimientos.push(mov);
        return mov;
    }

    function revisarCuenta(cuenta) {
        if (!Object.hasOwn(CUENTAS, cuenta)) throw new Error("Elegí si entra o sale por caja o por banco.");
        return cuenta;
    }

    /** Lo que queda sin acreditar de una factura (descontadas sus notas de crédito). */
    function restante(factura) {
        const notas = emp().comprobantes.filter((c) => c.asociadaId === factura.id);
        const grupos = structuredClone(factura.grupos);
        let exento = factura.exento;
        let total = factura.total;
        for (const n of notas) {
            for (const [a, g] of Object.entries(n.grupos)) {
                grupos[a].neto -= g.neto;
                grupos[a].iva -= g.iva;
            }
            exento -= n.exento;
            total -= n.total;
        }
        return { grupos, exento, total };
    }

    // ---------- IVA ----------
    /** Débito, crédito y percepciones de cada período (en una sola pasada). */
    function sumasIva() {
        const e = emp();
        const porPeriodo = {};
        const del = (p) => (porPeriodo[p] ??= { debito: 0, credito: 0, percepciones: 0, ventasNeto: 0, comprasNeto: 0, ventas: 0, compras: 0 });
        for (const c of e.comprobantes) {
            const s = del(periodoDe(c.fecha));
            const sg = signo(c.tipo);
            s.debito += sg * c.iva;
            s.ventasNeto += sg * (c.neto + c.exento);
            s.ventas += sg * c.total;
        }
        for (const c of comprasVigentes()) {
            const s = del(periodoDe(c.fecha));
            if (c.letra === "A") s.credito += c.iva;
            s.percepciones += c.percepIva;
            s.comprasNeto += c.neto + c.noGravado;
            s.compras += c.total;
        }
        return porPeriodo;
    }

    /**
     * La posición de IVA de cada período desde el primero con datos: débito − crédito − percepciones − saldo a favor
     * del mes anterior. Si da negativo, queda a favor y pasa al mes siguiente.
     */
    function posiciones() {
        const sumas = sumasIva();
        const desde = Object.keys(sumas).sort()[0] ?? periodoActual();
        const lista = [];
        let aFavorAnterior = 0;
        for (let p = desde; p <= periodoActual(); p = correrPeriodo(p, 1)) {
            const s = sumas[p] ?? { debito: 0, credito: 0, percepciones: 0, ventasNeto: 0, comprasNeto: 0, ventas: 0, compras: 0 };
            const resultado = s.debito - s.credito - s.percepciones - aFavorAnterior;
            lista.push({
                periodo: p,
                ...s,
                aFavorAnterior,
                resultado,
                aPagar: Math.max(0, resultado),
                aFavor: Math.max(0, -resultado),
                vence: vencimientoIva(p, emp().cuit)
            });
            aFavorAnterior = Math.max(0, -resultado);
        }
        return lista;
    }

    const textoComprobante = (c) => `${COMPROBANTES[c.tipo].corto} ${numeroComprobante(c.puntoVenta, c.numero)}`;

    return {
        guardado,

        // ---------- Empresa ----------
        leerEmpresa() {
            const { clientes, proveedores, comprobantes, compras, movimientos, recibidasArca, ...datos } = emp();
            return copia(datos);
        },

        /** Cambia los datos de la empresa (los que se ven en las facturas y arriba). Solo lo que llegue. */
        actualizarEmpresa(campos = {}, quien) {
            exigirConfig(quien);
            const e = emp();
            const nuevos = {};
            if ("razonSocial" in campos) {
                nuevos.razonSocial = sinPasarse(campos.razonSocial, TOPES.nombre, "la razón social");
                if (!nuevos.razonSocial) throw new Error("Escribí la razón social de la empresa.");
            }
            if ("fantasia" in campos) nuevos.fantasia = sinPasarse(campos.fantasia, TOPES.fantasia, "el nombre de fantasía");
            if ("cuit" in campos) nuevos.cuit = revisarCuit(campos.cuit, "El CUIT de la empresa");
            if ("condicionIva" in campos) {
                if (!["RI", "MT", "EX"].includes(campos.condicionIva)) throw new Error("Elegí la condición frente al IVA de la empresa.");
                nuevos.condicionIva = campos.condicionIva;
            }
            if ("puntoVenta" in campos) nuevos.puntoVenta = enteroHasta(Number(campos.puntoVenta), "El punto de venta", { desde: 1, hasta: TOPES.puntoVenta });
            if ("domicilio" in campos) nuevos.domicilio = sinPasarse(campos.domicilio, TOPES.domicilio, "el domicilio");
            if ("iibb" in campos) nuevos.iibb = sinPasarse(campos.iibb, TOPES.iibb, "Ingresos Brutos");
            if ("inicioActividades" in campos) {
                const f = campos.inicioActividades;
                if (!esFechaISO(f) || f > hoy() || f < "1900-01-01") throw new Error("La fecha de inicio de actividades no es válida.");
                nuevos.inicioActividades = f;
            }
            Object.assign(e, nuevos);
            guardado.persistir();
            return this.leerEmpresa();
        },

        /** El logo de la empresa: una imagen chica (PNG, JPG o WEBP) ya achicada por la pantalla. null lo saca. */
        guardarLogo(imagen, quien) {
            exigirConfig(quien);
            if (imagen !== null) {
                if (typeof imagen !== "string" || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imagen)) {
                    throw new Error("El logo tiene que ser una imagen PNG, JPG o WEBP.");
                }
                if (imagen.length > TOPES.logo) throw new Error("La imagen es muy pesada: probá con una más chica.");
            }
            emp().logo = imagen;
            guardado.persistir();
            return imagen;
        },

        /** Qué pantallas se usan (Facturar, IVA e Inicio van siempre). */
        cambiarModulos(modulos = {}, quien) {
            exigirConfig(quien);
            const e = emp();
            for (const [k, v] of Object.entries(modulos)) {
                if (!Object.hasOwn(MODULOS, k)) throw new Error("Esa pantalla no existe.");
                if (typeof v !== "boolean") throw new Error("Cada pantalla va prendida o apagada.");
            }
            e.modulos = { ...e.modulos, ...modulos };
            guardado.persistir();
            return { ...e.modulos };
        },

        // ---------- Contabilidad (los asientos salen solos de los datos) ----------
        cuentasContables: () => copia(CUENTAS_CONTABLES),

        /** Libro diario: los asientos (de un período si se pasa), del más viejo al más nuevo. */
        asientos({ periodo } = {}) {
            const todos = armarAsientos(emp());
            return periodo ? todos.filter((a) => a.fecha.startsWith(periodo)) : todos;
        },

        mayor(cuenta) {
            if (!CUENTAS_CONTABLES.some((c) => c.codigo === cuenta)) throw new Error("Esa cuenta no existe.");
            return armarMayor(armarAsientos(emp()), cuenta);
        },

        balance(hasta) {
            return armarBalance(armarAsientos(emp()), hasta);
        },

        // ---------- Clientes y proveedores ----------
        listarClientes() {
            return emp().clientes.map((c) => {
                const saldo = saldoCliente(c.id);
                return { ...copia(c), saldo, debeDesde: debeDesde(c.id, saldo) };
            });
        },

        buscarCliente: (id) => copia(cliente(id)),

        listarProveedores() {
            return emp().proveedores.map((p) => ({ ...copia(p), saldo: saldoProveedor(p.id) }));
        },

        buscarProveedor: (id) => copia(proveedor(id)),

        agregarCliente({ nombre, condicion, cuit, doc } = {}, quien) {
            exigirCarga(quien);
            const e = emp();
            exigir(e.clientes.length < TOPES.clientes, MENSAJE_LLENO);
            const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
            if (!n) throw new Error("Escribí el nombre o la razón social.");
            if (!Object.hasOwn(CONDICIONES, condicion)) throw new Error("Elegí la condición frente al IVA.");
            let numero = null;
            if (condicion !== "CF" || soloNumeros(cuit)) numero = revisarCuit(cuit);
            if (numero && e.clientes.some((c) => c.cuit === numero)) throw new Error("Ya hay un cliente con ese CUIT.");
            const c = { id: nuevoId("c"), nombre: n, condicion, cuit: numero, doc: revisarDoc(doc, false) };
            e.clientes.push(c);
            guardado.persistir();
            return copia(c);
        },

        agregarProveedor({ nombre, condicion, cuit } = {}, quien) {
            exigirCarga(quien);
            const e = emp();
            exigir(e.proveedores.length < TOPES.proveedores, MENSAJE_LLENO);
            const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
            if (!n) throw new Error("Escribí el nombre o la razón social.");
            if (!["RI", "MT", "EX"].includes(condicion)) throw new Error("Elegí la condición frente al IVA del proveedor.");
            const numero = revisarCuit(cuit);
            if (e.proveedores.some((p) => p.cuit === numero)) throw new Error("Ya hay un proveedor con ese CUIT.");
            const p = { id: nuevoId("p"), nombre: n, condicion, cuit: numero };
            e.proveedores.push(p);
            guardado.persistir();
            return copia(p);
        },

        // ---------- Facturar ----------
        /** Qué comprobante le corresponde a un cliente ("FA", "FB" o "FC"), según la empresa y el cliente. */
        tipoParaCliente(clienteId) {
            return tipoFactura(emp().condicionIva, cliente(clienteId).condicion);
        },

        /** Lo mismo que emitirFactura pero sin guardar: para mostrar los totales mientras se carga. */
        calcularFactura({ clienteId, renglones } = {}) {
            const tipo = tipoFactura(emp().condicionIva, cliente(clienteId).condicion);
            return { tipo, ...calcularComprobante(revisarRenglones(renglones), COMPROBANTES[tipo].letra) };
        },

        emitirFactura({ clienteId, renglones, condicionVenta = "cuenta corriente", cuenta = "caja", doc } = {}, quien) {
            exigirCarga(quien);
            const e = emp();
            exigir(e.comprobantes.length < TOPES.comprobantes, MENSAJE_LLENO);
            const c = cliente(clienteId);
            if (!["contado", "cuenta corriente"].includes(condicionVenta)) throw new Error("Elegí si es al contado o a cuenta corriente.");
            const tipo = tipoFactura(e.condicionIva, c.condicion);
            const calculo = calcularComprobante(revisarRenglones(renglones), COMPROBANTES[tipo].letra);
            if (calculo.total > TOPES.total * 100) throw new Error(`El total no puede pasar de $ ${TOPES.total.toLocaleString("es-AR")} en una sola factura.`);
            if (condicionVenta === "contado") revisarCuenta(cuenta);
            const receptor = { nombre: c.nombre, condicion: c.condicion, cuit: c.cuit, doc: c.doc };
            if (c.condicion === "CF" && !c.cuit && calculo.total >= TOPE_CF_IDENTIFICAR) {
                receptor.doc = revisarDoc(doc, true);
            }
            const numero = proximoNumero(tipo, e.puntoVenta);
            const fecha = hoy();
            const comp = {
                id: nuevoId("v"),
                tipo,
                puntoVenta: e.puntoVenta,
                numero,
                fecha,
                clienteId: c.id,
                receptor,
                ...calculo,
                condicionVenta,
                cae: caeSimulado(e.cuit, COMPROBANTES[tipo].codigo, e.puntoVenta, numero),
                caeVence: sumarDias(fecha, 10),
                hechoPor: quien.id,
                hechoEn: ahora()
            };
            e.comprobantes.push(comp);
            if (condicionVenta === "contado") {
                nuevoMovimiento({ tipo: "cobro", clienteId: c.id, cuenta, monto: comp.total, comprobanteId: comp.id, detalle: "Cobro al contado" }, quien);
            }
            guardado.persistir();
            return copia(comp);
        },

        /** Cuánto queda sin acreditar de una factura (para la nota de crédito). */
        restanteDeFactura(id) {
            const f = buscar(emp().comprobantes, id, "Esa factura ya no existe.");
            return copia(restante(f));
        },

        emitirNotaCredito({ facturaId, monto, motivo = "", devolverEn = null } = {}, quien) {
            exigirCarga(quien);
            const e = emp();
            exigir(e.comprobantes.length < TOPES.comprobantes, MENSAJE_LLENO);
            const f = buscar(e.comprobantes, facturaId, "Esa factura ya no existe.");
            if (COMPROBANTES[f.tipo].clase !== "factura") throw new Error("La nota de crédito se hace sobre una factura.");
            const queda = restante(f);
            if (queda.total <= 0) throw new Error("Esa factura ya está anulada por completo con notas de crédito.");
            const importe = monto == null || monto === "" ? queda.total : aCentavos(monto, "El importe de la nota", { desde: 1, hasta: queda.total / 100 });
            const m = sinPasarse(motivo, TOPES.motivo, "el motivo");
            if (devolverEn !== null) revisarCuenta(devolverEn);
            const reparto = repartirNotaCredito(queda, importe);
            const tipo = NC_DE[f.tipo];
            const numero = proximoNumero(tipo, f.puntoVenta);
            const fecha = hoy();
            const nc = {
                id: nuevoId("v"),
                tipo,
                puntoVenta: f.puntoVenta,
                numero,
                fecha,
                clienteId: f.clienteId,
                receptor: copia(f.receptor),
                // Un solo renglón: en la A, sin IVA (el IVA va abajo, como en la factura)
                renglones: [{ descripcion: m || (importe === queda.total ? "Anulación de la factura" : "Anulación parcial de la factura"), cantidad: 1, precio: COMPROBANTES[tipo].letra === "A" ? reparto.neto + reparto.exento : importe, alicuota: null }],
                ...reparto,
                condicionVenta: f.condicionVenta,
                asociadaId: f.id,
                motivo: m,
                cae: caeSimulado(e.cuit, COMPROBANTES[tipo].codigo, f.puntoVenta, numero),
                caeVence: sumarDias(fecha, 10),
                hechoPor: quien.id,
                hechoEn: ahora()
            };
            e.comprobantes.push(nc);
            if (devolverEn) {
                nuevoMovimiento({ tipo: "devolucion", clienteId: f.clienteId, cuenta: devolverEn, monto: importe, comprobanteId: nc.id, detalle: "Devolución por nota de crédito" }, quien);
            }
            guardado.persistir();
            return copia(nc);
        },

        /** Comprobantes emitidos (de un período si se pasa), del más nuevo al más viejo. */
        listarComprobantes({ periodo } = {}) {
            return copia(emp().comprobantes.filter((c) => !periodo || c.fecha.startsWith(periodo))).sort(
                (a, b) => b.fecha.localeCompare(a.fecha) || b.hechoEn.localeCompare(a.hechoEn) || b.numero - a.numero
            );
        },

        buscarComprobante: (id) => copia(buscar(emp().comprobantes, id, "Ese comprobante ya no existe.")),

        // ---------- Compras ----------
        cargarCompra({ proveedorId, letra, puntoVenta, numero, fecha, importes = [], total, percepIva = 0, percepIibb = 0 } = {}, quien) {
            exigirCarga(quien);
            const e = emp();
            exigir(e.compras.length < TOPES.compras, MENSAJE_LLENO);
            const p = proveedor(proveedorId);
            if (!["A", "B", "C"].includes(letra)) throw new Error("Elegí la letra de la factura (A, B o C).");
            const pv = enteroHasta(puntoVenta, "El punto de venta", { desde: 1, hasta: TOPES.puntoVenta });
            const nro = enteroHasta(numero, "El número", { desde: 1, hasta: TOPES.numero });
            if (!esFechaISO(fecha)) throw new Error("La fecha no es válida.");
            if (fecha > hoy()) throw new Error("La fecha no puede ser futura.");
            if (fecha < sumarDias(hoy(), -TOPES.diasAtras)) throw new Error("La fecha es demasiado vieja (hasta 13 meses atrás).");
            if (comprasVigentes().some((c) => c.proveedorId === p.id && c.letra === letra && c.puntoVenta === pv && c.numero === nro)) {
                throw new Error("Esa factura de ese proveedor ya está cargada.");
            }
            const grupos = {};
            let neto = 0;
            let iva = 0;
            let noGravado = 0;
            if (letra === "A") {
                if (!Array.isArray(importes) || !importes.length) throw new Error("Cargá el neto de al menos una alícuota.");
                if (importes.length > ORDEN_ALICUOTAS.length) throw new Error("Hay más alícuotas de las que existen.");
                for (const { alicuota, neto: n } of importes) {
                    const a = String(alicuota);
                    if (!ORDEN_ALICUOTAS.includes(a)) throw new Error("Elegí una alícuota de IVA válida.");
                    if (grupos[a]) throw new Error(`La alícuota ${ALICUOTAS[a].texto} está repetida.`);
                    const c = aCentavos(n, `El neto al ${ALICUOTAS[a].texto}`, { hasta: TOPES.total });
                    const i = Math.round((c * ALICUOTAS[a].porMil) / 1000);
                    grupos[a] = { neto: c, iva: i };
                    neto += c;
                    iva += i;
                }
            } else {
                noGravado = aCentavos(total, "El total", { hasta: TOPES.total });
            }
            const base = letra === "A" ? neto : noGravado;
            const pIva = letra === "A" ? aCentavos(percepIva || 0, "La percepción de IVA", { desde: 0, hasta: base / 100 }) : 0;
            const pIibb = aCentavos(percepIibb || 0, "La percepción de Ingresos Brutos", { desde: 0, hasta: base / 100 });
            const totalCompra = neto + iva + noGravado + pIva + pIibb;
            if (totalCompra > TOPES.total * 100) throw new Error(`El total no puede pasar de $ ${TOPES.total.toLocaleString("es-AR")}.`);
            const compra = {
                id: nuevoId("c"),
                proveedorId: p.id,
                emisor: { nombre: p.nombre, condicion: p.condicion, cuit: p.cuit },
                letra,
                puntoVenta: pv,
                numero: nro,
                fecha,
                grupos,
                neto,
                iva,
                noGravado,
                percepIva: pIva,
                percepIibb: pIibb,
                total: totalCompra,
                origen: "manual",
                anulada: false,
                hechoPor: quien.id,
                hechoEn: ahora()
            };
            e.compras.push(compra);
            guardado.persistir();
            return copia(compra);
        },

        anularCompra(id, quien) {
            exigirCarga(quien);
            const c = buscar(emp().compras, id, "Esa compra ya no existe.");
            if (c.anulada) throw new Error("Esa compra ya estaba anulada.");
            Object.assign(c, { anulada: true, anuladaPor: quien.id, anuladaEn: ahora() });
            guardado.persistir();
            return copia(c);
        },

        /** Compras del período (o todas), de la más nueva a la más vieja. Las anuladas quedan, marcadas. */
        listarCompras({ periodo } = {}) {
            return copia(emp().compras.filter((c) => !periodo || c.fecha.startsWith(periodo))).sort(
                (a, b) => b.fecha.localeCompare(a.fecha) || b.hechoEn.localeCompare(a.hechoEn)
            );
        },

        /** Las facturas que "están en ARCA" (Mis Comprobantes) y todavía no se cargaron. */
        pendientesArca() {
            const cargada = (r) => comprasVigentes().some((c) => c.proveedorId === r.proveedorId && c.letra === r.letra && c.puntoVenta === r.puntoVenta && c.numero === r.numero);
            return copia(emp().recibidasArca.filter((r) => !cargada(r)));
        },

        /** "Traer de ARCA" (simulado): carga de una las recibidas que faltan. */
        traerDeArca(quien) {
            exigirCarga(quien);
            const e = emp();
            const faltan = this.pendientesArca();
            exigir(e.compras.length + faltan.length <= TOPES.compras, MENSAJE_LLENO);
            const traidas = faltan.map((r) => ({ ...r, id: nuevoId("c"), origen: "arca", hechoPor: quien.id, hechoEn: ahora() }));
            e.compras.push(...traidas);
            guardado.persistir();
            return copia(traidas);
        },

        // ---------- Cobros, pagos y cuentas ----------
        registrarCobro({ clienteId, monto, cuenta } = {}, quien) {
            exigirCarga(quien);
            const c = cliente(clienteId);
            const saldo = saldoCliente(c.id);
            if (saldo <= 0) throw new Error(`${c.nombre} no debe nada.`);
            const m = aCentavos(monto, "El cobro", { hasta: Math.min(saldo / 100, TOPES.movimiento) });
            const mov = nuevoMovimiento({ tipo: "cobro", clienteId: c.id, cuenta: revisarCuenta(cuenta), monto: m, detalle: cuenta === "caja" ? "Cobro en efectivo" : "Transferencia" }, quien);
            guardado.persistir();
            return copia(mov);
        },

        registrarPago({ proveedorId, monto, cuenta } = {}, quien) {
            exigirCarga(quien);
            const p = proveedor(proveedorId);
            const saldo = saldoProveedor(p.id);
            if (saldo <= 0) throw new Error(`A ${p.nombre} no se le debe nada.`);
            revisarCuenta(cuenta);
            const disponible = saldoCuenta(cuenta);
            if (disponible <= 0) throw new Error(`No hay plata en ${CUENTAS[cuenta].toLowerCase()} para pagar.`);
            const m = aCentavos(monto, "El pago", { hasta: Math.min(saldo, disponible) / 100 });
            const mov = nuevoMovimiento({ tipo: "pago", proveedorId: p.id, cuenta, monto: m, detalle: cuenta === "caja" ? "Pago en efectivo" : "Transferencia" }, quien);
            guardado.persistir();
            return copia(mov);
        },

        saldoCliente: (id) => (cliente(id), saldoCliente(id)),
        saldoProveedor: (id) => (proveedor(id), saldoProveedor(id)),

        /** La cuenta corriente de un cliente o proveedor: cada movimiento con el saldo después de él. */
        cuentaCorriente(tipo, id) {
            const e = emp();
            const filas = [];
            if (tipo === "cliente") {
                cliente(id);
                for (const c of e.comprobantes) {
                    if (c.clienteId === id) filas.push({ fecha: c.fecha, orden: c.hechoEn, texto: textoComprobante(c), debe: signo(c.tipo) > 0 ? c.total : 0, haber: signo(c.tipo) < 0 ? c.total : 0, comprobanteId: c.id });
                }
                for (const m of e.movimientos) {
                    if (m.clienteId !== id) continue;
                    filas.push({ fecha: m.fecha, orden: m.hechoEn, texto: m.detalle, debe: m.tipo === "devolucion" ? m.monto : 0, haber: m.tipo === "cobro" ? m.monto : 0 });
                }
            } else if (tipo === "proveedor") {
                proveedor(id);
                for (const c of comprasVigentes()) {
                    if (c.proveedorId === id) filas.push({ fecha: c.fecha, orden: c.hechoEn, texto: `F${c.letra} ${numeroComprobante(c.puntoVenta, c.numero)}`, debe: c.total, haber: 0, compraId: c.id });
                }
                for (const m of e.movimientos) if (m.proveedorId === id) filas.push({ fecha: m.fecha, orden: m.hechoEn, texto: m.detalle, debe: 0, haber: m.monto });
            } else throw new Error("La cuenta corriente es de un cliente o de un proveedor.");
            filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden.localeCompare(b.orden));
            let saldo = 0;
            for (const f of filas) {
                saldo += f.debe - f.haber;
                f.saldo = saldo;
                delete f.orden;
            }
            return filas;
        },

        /** Caja y banco: saldo de cada una y los últimos movimientos. */
        cajaYBancos({ ultimos = 30 } = {}) {
            const e = emp();
            const nombre = (m) =>
                m.clienteId ? e.clientes.find((c) => c.id === m.clienteId)?.nombre : e.proveedores.find((p) => p.id === m.proveedorId)?.nombre;
            const movimientos = [...e.movimientos]
                .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hechoEn.localeCompare(a.hechoEn))
                .slice(0, ultimos)
                .map((m) => ({ ...copia(m), quien: nombre(m) ?? "", entra: m.tipo === "cobro" }));
            return { caja: saldoCuenta("caja"), banco: saldoCuenta("banco"), movimientos };
        },

        // ---------- IVA ----------
        /** Los últimos 12 períodos con su posición de IVA (del más viejo al actual). */
        historialIva(cantidad = 12) {
            const todas = posiciones();
            const quiero = new Set(ultimosPeriodos(cantidad));
            return todas.filter((p) => quiero.has(p.periodo));
        },

        posicionIva(periodo = periodoActual()) {
            return posiciones().find((p) => p.periodo === periodo) ?? null;
        },

        /** Libro IVA Ventas del período: un renglón por comprobante (las notas restan) y los totales. */
        libroIvaVentas(periodo = periodoActual()) {
            const filas = emp().comprobantes
                .filter((c) => c.fecha.startsWith(periodo))
                .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero - b.numero)
                .map((c) => filaLibro(c, signo(c.tipo), { texto: textoComprobante(c), nombre: c.receptor.nombre, cuit: c.receptor.cuit, doc: c.receptor.doc }));
            return { periodo, filas, totales: totalesLibro(filas) };
        },

        /** Libro IVA Compras del período (las anuladas no van). */
        libroIvaCompras(periodo = periodoActual()) {
            const filas = comprasVigentes()
                .filter((c) => c.fecha.startsWith(periodo))
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
                .map((c) => filaLibro({ ...c, exento: c.noGravado }, 1, { texto: `F${c.letra} ${numeroComprobante(c.puntoVenta, c.numero)}`, nombre: c.emisor.nombre, cuit: c.emisor.cuit }));
            return { periodo, filas, totales: totalesLibro(filas) };
        }
    };
}

// ---------- Ayudas (sin datos) ----------
function revisarRenglones(renglones) {
    if (!Array.isArray(renglones) || !renglones.length) throw new Error("Cargá al menos un renglón.");
    if (renglones.length > TOPES.renglones) throw new Error(`Una factura tiene hasta ${TOPES.renglones} renglones.`);
    return renglones.map((r, i) => {
        const que = `Renglón ${i + 1}`;
        const descripcion = sinPasarse(r?.descripcion, TOPES.nombre, `la descripción del renglón ${i + 1}`);
        if (!descripcion) throw new Error(`${que}: escribí qué se vende.`);
        const cantidad = enteroHasta(Number(r.cantidad), `${que}: la cantidad`, { desde: 1, hasta: TOPES.cantidad });
        const precio = aCentavos(r.precio, `${que}: el precio`, { hasta: TOPES.precio });
        const alicuota = String(r.alicuota ?? "21");
        if (!esAlicuota(alicuota)) throw new Error(`${que}: elegí una alícuota de IVA válida.`);
        return { descripcion, cantidad, precio, alicuota };
    });
}

/** DNI (7 u 8 números) o CUIT. `obligatorio`: desde el tope de consumidor final hay que identificar al comprador. */
function revisarDoc(doc, obligatorio) {
    const n = soloNumeros(doc);
    if (!n) {
        if (obligatorio) throw new Error(`Desde $ ${(TOPE_CF_IDENTIFICAR / 100).toLocaleString("es-AR")} hay que poner el DNI o el CUIT del comprador.`);
        return null;
    }
    if (/^\d{7,8}$/.test(n)) return n;
    if (n.length === 11) return revisarCuit(n, "El CUIT del comprador");
    throw new Error("El documento tiene que ser un DNI (7 u 8 números) o un CUIT (11).");
}

function filaLibro(c, sg, { texto, nombre, cuit, doc = null }) {
    const porAlicuota = {};
    for (const a of ORDEN_ALICUOTAS) {
        const g = c.grupos?.[a];
        if (g) porAlicuota[a] = { neto: sg * g.neto, iva: sg * g.iva };
    }
    return {
        fecha: c.fecha,
        comprobante: texto,
        nombre,
        cuit,
        doc,
        porAlicuota,
        neto: sg * c.neto,
        iva: sg * c.iva,
        exento: sg * c.exento,
        percepIva: sg * (c.percepIva ?? 0),
        percepIibb: sg * (c.percepIibb ?? 0),
        total: sg * c.total
    };
}

function totalesLibro(filas) {
    const t = { neto: 0, iva: 0, exento: 0, percepIva: 0, percepIibb: 0, total: 0, porAlicuota: {} };
    for (const f of filas) {
        for (const k of ["neto", "iva", "exento", "percepIva", "percepIibb", "total"]) t[k] += f[k];
        for (const [a, g] of Object.entries(f.porAlicuota)) {
            const x = (t.porAlicuota[a] ??= { neto: 0, iva: 0 });
            x.neto += g.neto;
            x.iva += g.iva;
        }
    }
    return t;
}

export { ID_CONSUMIDOR_FINAL };
