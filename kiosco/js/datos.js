// ============================================
// Datos de Sazzo Kiosco (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un kiosco de barrio inventado: 40 productos sin marcas, 3 proveedores, 5 clientes de la libreta de fiados y las
// ventas de los últimos 7 días (para que la caja tenga números desde el primer momento).
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Las ventas guardan el precio del momento: si después sube un proveedor, lo vendido no cambia.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=2ffaf20289";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=2ffaf20289";
import { diaLocalDe, fechaLocalISO } from "../kit/js/fechas.js?v=2ffaf20289";
import { MARCA } from "./marca.js?v=2ffaf20289";

export const VERSION_DATOS = 2;

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    cantidad: 99, // unidades de un producto en una venta
    renglones: 30, // productos distintos en un ticket
    precio: 5_000_000,
    pagaCon: 10_000_000,
    stock: 9_999,
    tope: 1_000_000, // tope de fiado de un cliente
    nombre: 40, // letras del nombre de un producto o un cliente
    detalle: 40, // "del 3° B"
    aumentoMin: -50, // % de "Subió un proveedor"
    aumentoMax: 100,
    contado: 10_000_000, // plata contada al cerrar la caja
    clientes: 60, // clientes en la libreta
    productos: 400, // productos en total (alguien aburrido cargando sin parar)
    ventas: 2000, // ventas guardadas en total (cada venta vuelve a guardar todo: sin tope, el celu se cuelga)
    aumentos: 300, // veces que se usó "Subió un proveedor"
    cierres: 300, // cierres de caja
    movimientos: 600 // fiados y pagos de un mismo cliente (cobrar de a $1 sin parar)
};

export const FONDO_CAJA = 20_000; // el cambio con el que arranca el cajón cada día
export const TOPE_FIADO_NUEVO = 30_000;
export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", fiado: "Fiado" };

export const PROVEEDORES = [
    { id: "pr-norte", nombre: "Bebidas Norte" },
    { id: "pr-sur", nombre: "Distribuidora del Sur" },
    { id: "pr-ruta8", nombre: "Mayorista Ruta 8" }
];

/** Redondeo de kiosco, siempre para arriba: a $50 hasta $5.000 y a $100 desde ahí. */
export function redondear(precio) {
    const paso = precio < 5_000 ? 50 : 100;
    return Math.max(paso, Math.ceil(precio / paso) * paso);
}

/** "$ 12.500" */
export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export const estadoStock = (p) => (p.stock <= 0 ? "sin" : p.stock <= p.minimo ? "pedir" : "hay");

// ---------- Datos de fábrica ----------
// [nombre, precio, stock, mínimo, rápido]
const CATALOGO = {
    "pr-norte": [
        ["Gaseosa cola 500 ml", 1_800, 24, 12, true],
        ["Gaseosa cola 1,5 L", 3_200, 18, 8, true],
        ["Gaseosa lima 1,5 L", 3_000, 10, 6],
        ["Gaseosa naranja 500 ml", 1_700, 12, 6],
        ["Agua 500 ml", 1_200, 3, 6, true],
        ["Agua 1,5 L", 1_900, 14, 6],
        ["Agua saborizada 1,5 L", 2_400, 9, 4],
        ["Soda 1,5 L", 1_500, 8, 4],
        ["Jugo 1 L", 1_600, 7, 4],
        ["Cerveza lata 473 ml", 2_300, 30, 12, true],
        ["Bebida isotónica 500 ml", 2_200, 6, 4],
        ["Energizante lata", 2_800, 5, 4]
    ],
    "pr-sur": [
        ["Alfajor simple", 900, 40, 15, true],
        ["Alfajor triple", 1_500, 25, 10, true],
        ["Chicles", 600, 2, 10, true],
        ["Caramelos (bolsita)", 500, 20, 8],
        ["Chocolate 100 g", 2_600, 8, 4],
        ["Chupetín", 300, 35, 10],
        ["Turrón", 700, 18, 8],
        ["Oblea", 800, 15, 6],
        ["Barrita de cereal", 900, 12, 6],
        ["Papas fritas chicas", 1_800, 10, 6, true],
        ["Maní salado", 1_200, 9, 4],
        ["Palitos salados", 1_300, 7, 4],
        ["Galletitas dulces", 1_400, 11, 5],
        ["Galletitas de agua", 1_100, 6, 5]
    ],
    "pr-ruta8": [
        ["Leche 1 L", 1_500, 16, 8, true],
        ["Pan lactal", 2_900, 6, 4, true],
        ["Yerba 1 kg", 5_200, 1, 3],
        ["Azúcar 1 kg", 1_600, 8, 4],
        ["Fideos 500 g", 1_400, 12, 5],
        ["Arroz 1 kg", 1_900, 7, 4],
        ["Aceite 900 ml", 3_400, 5, 3],
        ["Lavandina 1 L", 1_200, 9, 4],
        ["Detergente", 1_800, 6, 3],
        ["Papel higiénico x4", 2_600, 8, 4],
        ["Pañuelitos", 700, 14, 6],
        ["Pilas AA x2", 2_500, 0, 2],
        ["Encendedor", 1_000, 20, 8],
        ["Velas x6", 1_300, 5, 2]
    ]
};

// Los clientes de la libreta: [id, nombre, detalle, tope, cuánto deben hoy]
const CLIENTES = [
    ["c-graciela", "Graciela", "del 3° B", 30_000, 18_400],
    ["c-alberto", "Don Alberto", "el de la obra", 30_000, 27_500],
    ["c-lucia", "Lucía", "la mamá de Tomi", 20_000, 6_200],
    ["c-carlos", "Carlos", "el remisero", 40_000, 11_300],
    ["c-nelly", "Nelly", "", 15_000, 3_100]
];

/** Números "al azar" pero siempre los mismos (así las pruebas y la demo arrancan igual). */
function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Un momento de hace `dias` días a la hora `hora` (decimal: 9.5 = 9:30). */
function momento(dias, hora) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 0, 0);
    return d.toISOString();
}

export function semilla() {
    const azar = azarFijo(7);
    const productos = [];
    let n = 1;
    for (const [proveedorId, lista] of Object.entries(CATALOGO)) {
        for (const [nombre, precio, stock, minimo, rapido = false] of lista) {
            productos.push({ id: `p-${n}`, codigo: `200000000${String(n).padStart(4, "0")}`, nombre, precio, stock, minimo, proveedorId, rapido });
            n++;
        }
    }
    const clientes = CLIENTES.map(([id, nombre, detalle, tope]) => ({ id, nombre, detalle, tope, movimientos: [] }));

    // Ventas de los últimos 6 días y de hoy hasta hace un rato (de 8 a 21:30)
    const ventas = [];
    const elegir = () => {
        const pesos = productos.map((p) => (p.rapido ? 5 : 1));
        let r = azar() * pesos.reduce((a, b) => a + b, 0);
        return productos.find((_, i) => (r -= pesos[i]) < 0) ?? productos[0];
    };
    const ahoraHora = new Date().getHours() + new Date().getMinutes() / 60;
    for (let dias = 6; dias >= 0; dias--) {
        const hasta = dias === 0 ? Math.min(21.5, ahoraHora - 0.25) : 21.5;
        const cuantas = dias === 0 ? Math.max(0, Math.min(18, Math.floor((hasta - 8) * 1.6))) : 20 + Math.floor(azar() * 10);
        for (let i = 0; i < cuantas; i++) {
            const hora = 8 + ((hasta - 8) * (i + azar() * 0.8)) / Math.max(1, cuantas);
            const items = [];
            const renglones = 1 + Math.floor(azar() * 3);
            for (let r = 0; r < renglones; r++) {
                const p = elegir();
                if (items.some((x) => x.productoId === p.id)) continue;
                items.push({ productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 + Math.floor(azar() * 2) });
            }
            const total = items.reduce((t, x) => t + x.precio * x.cantidad, 0);
            const r = azar();
            const medio = r < 0.62 ? "efectivo" : r < 0.92 ? "transferencia" : "fiado";
            const venta = { id: `v-${dias}-${i}`, fecha: momento(dias, hora), items, total, medio, clienteId: null, pagaCon: null, vuelto: null, por: azar() < 0.7 ? "Sofía" : "Rubén" };
            if (medio === "fiado") {
                const c = clientes[Math.floor(azar() * clientes.length)];
                venta.clienteId = c.id;
                c.movimientos.push({ id: `m-${venta.id}`, tipo: "fiado", monto: total, fecha: venta.fecha, ventaId: venta.id, medio: null, por: venta.por });
            }
            ventas.push(venta);
        }
    }

    // Lo que cada uno ya debía de antes (o un pago, si lo de esta semana pasa lo que debe hoy)
    CLIENTES.forEach(([id, , , , debeHoy], i) => {
        const c = clientes.find((x) => x.id === id);
        const deEstaSemana = c.movimientos.reduce((t, m) => t + m.monto, 0);
        if (debeHoy >= deEstaSemana) {
            c.movimientos.unshift({ id: `m-saldo-${i}`, tipo: "fiado", monto: debeHoy - deEstaSemana, fecha: momento(12 + i * 3, 18), ventaId: null, medio: null, por: "Rubén", nota: "Lo que debía en la libreta de papel" });
        } else {
            c.movimientos.push({ id: `m-pago-${i}`, tipo: "pago", monto: deEstaSemana - debeHoy, fecha: momento(1, 19), ventaId: null, medio: "efectivo", por: "Sofía" });
        }
        c.movimientos = c.movimientos.filter((m) => m.monto > 0).sort((a, b) => a.fecha.localeCompare(b.fecha));
    });

    return { productos, clientes, ventas, aumentos: [], cierres: [] };
}

// ---------- Reglas (funciones puras) ----------

export const deudaDe = (cliente) => cliente.movimientos.reduce((t, m) => t + (m.tipo === "fiado" ? m.monto : -m.monto), 0);

/** Desde cuándo debe: la fecha del primer fiado después de la última vez que quedó en cero (o null). */
export function debeDesde(cliente) {
    let saldo = 0;
    let desde = null;
    for (const m of [...cliente.movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
        saldo += m.tipo === "fiado" ? m.monto : -m.monto;
        if (saldo <= 0) desde = null;
        else if (!desde) desde = m.fecha;
    }
    return desde;
}

/** El precio nuevo de "Subió un proveedor" (porcentaje entero, con redondeo de kiosco). */
export const precioConAumento = (precio, porcentaje) => redondear(precio * (1 + porcentaje / 100));

const esDueno = (u) => u?.rol === "dueno";
const esDelKiosco = (u) => u?.rol === "dueno" || u?.rol === "empleada";

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const proveedor = (id) => PROVEEDORES.find((p) => p.id === id) ?? null;
    const armarProducto = (p) => ({ ...copia(p), estado: estadoStock(p), proveedor: proveedor(p.proveedorId)?.nombre ?? "Sin proveedor" });
    const armarCliente = (c) => ({ ...copia(c), deuda: deudaDe(c), desde: debeDesde(c), ultimo: c.movimientos.at(-1)?.fecha ?? null });

    // ----- Productos -----

    /** Lista de productos (filtro por texto o por proveedor), ordenada por nombre. */
    function listarProductos({ texto = "", proveedorId = null } = {}) {
        const t = String(texto).trim().toLowerCase();
        return db().productos
            .filter((p) => (!proveedorId || p.proveedorId === proveedorId) && (!t || p.nombre.toLowerCase().includes(t) || p.codigo.includes(t)))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map(armarProducto);
    }

    const rapidos = () => db().productos.filter((p) => p.rapido).map(armarProducto);

    function porCodigo(codigo) {
        const c = String(codigo ?? "").trim();
        const p = db().productos.find((x) => x.codigo === c);
        return p ? armarProducto(p) : null;
    }

    const hayQuePedir = () => db().productos.filter((p) => estadoStock(p) !== "hay").map(armarProducto);

    /** "¿Lo cargás?": un producto que no estaba (lo puede cargar Sofía desde Vender). */
    function cargarProducto(usuario, { nombre, codigo = "", precio, stock = 0, proveedorId = null } = {}) {
        exigir(esDelKiosco(usuario), "Solo alguien del kiosco puede cargar productos.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del producto.");
        const c = String(codigo ?? "").trim();
        exigir(!c || /^\d{4,14}$/.test(c), "El código tiene que tener entre 4 y 14 números.");
        exigir(!c || !db().productos.some((p) => p.codigo === c), "Ya hay un producto con ese código.");
        exigir(!proveedorId || proveedor(proveedorId), "Ese proveedor no existe.");
        exigir(db().productos.length < TOPES.productos, `Ya hay ${TOPES.productos} productos. Es una demo: tocá "Empezar de cero" arriba.`);
        const p = {
            id: nuevoId("p"), codigo: c || `29${String(Date.now()).slice(-8)}${String(db().productos.length).padStart(3, "0")}`, nombre: n,
            precio: enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio }),
            stock: enteroHasta(stock, "El stock", { hasta: TOPES.stock }),
            minimo: 0, proveedorId, rapido: false
        };
        db().productos.push(p);
        guardado.persistir();
        return armarProducto(p);
    }

    /** Rubén corrige el precio o el stock de un producto ("llegó mercadería"). */
    function corregirProducto(usuario, id, { precio, stock } = {}) {
        exigir(esDueno(usuario), "Solo el dueño cambia precios y stock.");
        const p = buscar(db().productos, id, "Ese producto no existe.");
        const nuevoPrecio = precio === undefined ? p.precio : enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio });
        const nuevoStock = stock === undefined ? p.stock : enteroHasta(stock, "El stock", { hasta: TOPES.stock });
        p.precio = nuevoPrecio;
        p.stock = nuevoStock;
        guardado.persistir();
        return armarProducto(p);
    }

    // ----- "Subió un proveedor" -----

    function revisarAumento(proveedorId, porcentaje) {
        exigir(proveedor(proveedorId), "Elegí el proveedor.");
        exigir(Number.isInteger(porcentaje) && porcentaje >= TOPES.aumentoMin && porcentaje <= TOPES.aumentoMax,
            `El aumento tiene que ser un número entero entre ${TOPES.aumentoMin} % y ${TOPES.aumentoMax} %.`);
        return porcentaje;
    }

    /** Antes → después de cada producto del proveedor (no cambia nada). */
    function verAumento(proveedorId, porcentaje) {
        const pct = revisarAumento(proveedorId, porcentaje);
        return db().productos
            .filter((p) => p.proveedorId === proveedorId)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((p) => ({ id: p.id, nombre: p.nombre, antes: p.precio, despues: precioConAumento(p.precio, pct) }));
    }

    function aplicarAumento(usuario, proveedorId, porcentaje) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        revisarAumento(proveedorId, porcentaje);
        exigir(porcentaje !== 0, "Con 0 % no cambia nada.");
        exigir(db().aumentos.length < TOPES.aumentos, `Ya hay ${TOPES.aumentos} aumentos. Es una demo: tocá "Empezar de cero" arriba.`);
        const cambios = verAumento(proveedorId, porcentaje);
        cambios.forEach((c) => (buscar(db().productos, c.id).precio = c.despues));
        const a = { id: nuevoId("a"), proveedorId, porcentaje, fecha: ahora(), por: usuario.nombre, cambios, deshecho: false };
        db().aumentos.push(a);
        guardado.persistir();
        return copia(a);
    }

    /** Deshacer: solo el último aumento, y vuelve cada precio a como estaba. */
    function deshacerAumento(usuario, aumentoId) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const a = buscar(db().aumentos, aumentoId, "Ese cambio de precios no existe.");
        exigir(!a.deshecho, "Ese cambio ya se deshizo.");
        exigir(db().aumentos.filter((x) => !x.deshecho).at(-1)?.id === a.id, "Solo se puede deshacer el último cambio de precios.");
        a.cambios.forEach((c) => {
            const p = db().productos.find((x) => x.id === c.id);
            if (p) p.precio = c.antes;
        });
        a.deshecho = true;
        guardado.persistir();
        return copia(a);
    }

    const ultimoAumento = () => copia(db().aumentos.filter((a) => !a.deshecho).at(-1) ?? null);

    // ----- Clientes y fiados -----

    const listarClientes = () => db().clientes.map(armarCliente).sort((a, b) => b.deuda - a.deuda || a.nombre.localeCompare(b.nombre, "es"));
    /** Un cliente con sus movimientos (el más nuevo primero) y qué se llevó en cada fiado. */
    function cliente(id) {
        const c = armarCliente(buscar(db().clientes, id, "Ese cliente no existe."));
        c.movimientos = c.movimientos.reverse().map((m) => {
            const v = m.ventaId ? db().ventas.find((x) => x.id === m.ventaId) : null;
            return { ...m, que: v ? v.items.map((i) => `${i.cantidad > 1 ? `${i.cantidad} ` : ""}${i.nombre}`).join(", ") : m.nota ?? "" };
        });
        return c;
    }

    function nuevoCliente(usuario, { nombre, detalle = "", tope = TOPE_FIADO_NUEVO } = {}) {
        exigir(esDelKiosco(usuario), "Solo alguien del kiosco anota clientes.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del cliente.");
        exigir(!db().clientes.some((c) => c.nombre.toLowerCase() === n.toLowerCase()), "Ya hay un cliente con ese nombre.");
        exigir(db().clientes.length < TOPES.clientes, `Ya hay ${TOPES.clientes} clientes. Es una demo: tocá "Empezar de cero" arriba.`);
        const c = { id: nuevoId("c"), nombre: n, detalle: sinPasarse(detalle, TOPES.detalle, "el detalle"), tope: enteroHasta(tope, "El tope", { hasta: TOPES.tope }), movimientos: [] };
        db().clientes.push(c);
        guardado.persistir();
        return armarCliente(c);
    }

    function cambiarTope(usuario, clienteId, tope) {
        exigir(esDueno(usuario), "Solo el dueño cambia el tope de fiado.");
        const c = buscar(db().clientes, clienteId, "Ese cliente no existe.");
        c.tope = enteroHasta(tope, "El tope", { hasta: TOPES.tope });
        guardado.persistir();
        return armarCliente(c);
    }

    /** Cobrar un fiado: todo o una parte (nunca más de lo que debe). */
    function cobrarFiado(usuario, clienteId, { monto, medio = "efectivo" } = {}) {
        exigir(esDelKiosco(usuario), "Solo alguien del kiosco cobra fiados.");
        const c = buscar(db().clientes, clienteId, "Ese cliente no existe.");
        exigir(medio === "efectivo" || medio === "transferencia", "Elegí cómo paga: efectivo o transferencia.");
        const debe = deudaDe(c);
        exigir(debe > 0, `${c.nombre} no debe nada.`);
        exigir(c.movimientos.length < TOPES.movimientos, `${c.nombre} ya tiene ${TOPES.movimientos} movimientos. Es una demo: tocá "Empezar de cero" arriba.`);
        const m = enteroHasta(monto, "Lo que paga", { desde: 1, hasta: debe });
        c.movimientos.push({ id: nuevoId("m"), tipo: "pago", monto: m, fecha: ahora(), ventaId: null, medio, por: usuario.nombre });
        guardado.persistir();
        return armarCliente(c);
    }

    // ----- Vender -----

    /**
     * Arma el ticket (sin guardar nada): revisa cantidades y stock y calcula el total.
     * items: [{ productoId, cantidad }]
     */
    function armarTicket(items) {
        exigir(Array.isArray(items) && items.length, "El ticket está vacío.");
        exigir(items.length <= TOPES.renglones, `Un ticket puede tener hasta ${TOPES.renglones} productos distintos.`);
        exigir(new Set(items.map((i) => i.productoId)).size === items.length, "Cada producto va una sola vez (cambiá la cantidad).");
        const renglones = items.map(({ productoId, cantidad }) => {
            const p = buscar(db().productos, productoId, "Uno de los productos ya no existe.");
            const n = enteroHasta(cantidad, `La cantidad de ${p.nombre}`, { desde: 1, hasta: TOPES.cantidad });
            exigir(n <= p.stock, p.stock ? `De ${p.nombre} quedan solo ${p.stock}.` : `No queda ${p.nombre}.`);
            return { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: n };
        });
        return { renglones, total: renglones.reduce((t, r) => t + r.precio * r.cantidad, 0) };
    }

    /** ¿Esta venta fiada pasa el tope del cliente? → { pasa, deuda, despues, tope } */
    function revisarTope(clienteId, total) {
        const c = buscar(db().clientes, clienteId, "Ese cliente no existe.");
        const deuda = deudaDe(c);
        return { pasa: deuda + total > c.tope, deuda, despues: deuda + total, tope: c.tope };
    }

    /**
     * Cobrar: efectivo (con "paga con" opcional → vuelto), transferencia o fiado (con cliente).
     * Si un fiado pasa el tope, lo tiene que autorizar el dueño (autorizarTope: true).
     */
    function vender(usuario, { items, medio, pagaCon = null, clienteId = null, autorizarTope = false } = {}) {
        exigir(esDelKiosco(usuario), "Solo alguien del kiosco puede vender.");
        exigir(db().ventas.length < TOPES.ventas, `Ya hay ${TOPES.ventas} ventas. Es una demo: tocá "Empezar de cero" arriba.`);
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        const { renglones, total } = armarTicket(items);
        let vuelto = null;
        if (medio === "efectivo" && pagaCon !== null && pagaCon !== "") {
            const con = enteroHasta(pagaCon, "Con cuánto paga", { desde: 1, hasta: TOPES.pagaCon });
            exigir(con >= total, `Con ${pesos(con)} no alcanza: son ${pesos(total)}.`);
            pagaCon = con;
            vuelto = con - total;
        } else {
            pagaCon = null;
        }
        let c = null;
        if (medio === "fiado") {
            exigir(clienteId, "Elegí a quién se le fía.");
            c = buscar(db().clientes, clienteId, "Ese cliente no existe.");
            exigir(c.movimientos.length < TOPES.movimientos, `${c.nombre} ya tiene ${TOPES.movimientos} movimientos. Es una demo: tocá "Empezar de cero" arriba.`);
            const t = revisarTope(clienteId, total);
            if (t.pasa) {
                exigir(autorizarTope, `Con esta compra ${c.nombre} debería ${pesos(t.despues)} y su tope es ${pesos(t.tope)}.`);
                exigir(esDueno(usuario), `Se pasa del tope de ${c.nombre}: lo tiene que autorizar el dueño.`);
            }
        }
        const venta = { id: nuevoId("v"), fecha: ahora(), items: renglones, total, medio, clienteId: c?.id ?? null, pagaCon, vuelto, por: usuario.nombre };
        renglones.forEach((r) => (buscar(db().productos, r.productoId).stock -= r.cantidad));
        db().ventas.push(venta);
        if (c) c.movimientos.push({ id: nuevoId("m"), tipo: "fiado", monto: total, fecha: venta.fecha, ventaId: venta.id, medio: null, por: usuario.nombre });
        guardado.persistir();
        return { ...copia(venta), cliente: c ? armarCliente(c) : null };
    }

    // ----- Caja -----

    const delDia = (lista, dia) => lista.filter((x) => diaLocalDe(x.fecha) === dia);

    /** La caja de un día (hoy si no se dice): por medio de pago, fiados, lo más vendido y cuánto tiene que haber. */
    function caja(dia = fechaLocalISO(0)) {
        const ventas = delDia(db().ventas, dia);
        const porMedio = { efectivo: 0, transferencia: 0, fiado: 0 };
        ventas.forEach((v) => (porMedio[v.medio] += v.total));
        const cobros = db().clientes.flatMap((c) => delDia(c.movimientos.filter((m) => m.tipo === "pago"), dia).map((m) => ({ ...copia(m), cliente: c.nombre })));
        const cobradoEfectivo = cobros.filter((m) => m.medio === "efectivo").reduce((t, m) => t + m.monto, 0);
        const cobradoTransferencia = cobros.filter((m) => m.medio === "transferencia").reduce((t, m) => t + m.monto, 0);
        const cuantos = {};
        ventas.forEach((v) => v.items.forEach((i) => (cuantos[i.nombre] = (cuantos[i.nombre] ?? 0) + i.cantidad)));
        const masVendidos = Object.entries(cuantos).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")).slice(0, 5).map(([nombre, cantidad]) => ({ nombre, cantidad }));
        const cierre = db().cierres.filter((c) => c.dia === dia).at(-1) ?? null;
        return {
            dia, cantidad: ventas.length, porMedio,
            vendido: porMedio.efectivo + porMedio.transferencia + porMedio.fiado,
            cobros, cobradoEfectivo, cobradoTransferencia,
            enCajon: FONDO_CAJA + porMedio.efectivo + cobradoEfectivo,
            masVendidos, cierre: copia(cierre),
            ultimas: ventas.slice(-5).reverse().map((v) => ({ ...copia(v), cliente: db().clientes.find((c) => c.id === v.clienteId)?.nombre ?? null }))
        };
    }

    /** Los últimos 7 días (el dueño): lo vendido por día, el más nuevo primero. */
    function semana(usuario) {
        exigir(esDueno(usuario), "Los últimos 7 días los ve el dueño.");
        return Array.from({ length: 7 }, (_, i) => {
            const c = caja(fechaLocalISO(-i));
            return { dia: c.dia, vendido: c.vendido, cantidad: c.cantidad, porMedio: c.porMedio };
        });
    }

    /** Cerrar la caja de hoy: se cuenta la plata y dice si sobra o falta. */
    function cerrarCaja(usuario, contado) {
        exigir(esDelKiosco(usuario), "Solo alguien del kiosco cierra la caja.");
        const n = enteroHasta(contado, "La plata contada", { hasta: TOPES.contado });
        exigir(db().cierres.length < TOPES.cierres, `Ya hay ${TOPES.cierres} cierres de caja. Es una demo: tocá "Empezar de cero" arriba.`);
        const hoy = caja();
        const cierre = { id: nuevoId("cc"), dia: hoy.dia, fecha: ahora(), esperado: hoy.enCajon, contado: n, diferencia: n - hoy.enCajon, por: usuario.nombre };
        db().cierres.push(cierre);
        guardado.persistir();
        return copia(cierre);
    }

    return {
        guardado,
        listarProductos, rapidos, porCodigo, hayQuePedir, cargarProducto, corregirProducto,
        verAumento, aplicarAumento, deshacerAumento, ultimoAumento,
        listarClientes, cliente, nuevoCliente, cambiarTope, cobrarFiado,
        armarTicket, revisarTope, vender,
        caja, semana, cerrarCaja
    };
}
