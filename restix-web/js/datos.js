// ============================================
// Datos de Restix Sazzo (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un bar inventado ya andando: mesas por sector (Salón, Vereda, Barra), la carta, las comandas que van solas a la
// cocina (la comida) y a la barra (las bebidas), el cobro dividiendo la cuenta, la caja del turno y Pedidos Ya.
// Sin comprobante: el cobro se ve en pantalla, nada que parezca una factura.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga y se devuelven copias.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=edf52e7135";
import { enteroHasta } from "../kit/js/topes.js?v=edf52e7135";
import { fechaLocalISO, diaLocalDe } from "../kit/js/fechas.js?v=edf52e7135";
import { MARCA } from "./marca.js?v=edf52e7135";

export const VERSION_DATOS = 2;

export const TOPES = {
    personas: 20,
    cantidad: 20, // de un mismo producto por vez
    porRenglon: 50, // de un mismo producto en la mesa
    renglones: 60,
    partes: 20, // en cuántas partes se divide la cuenta
    monto: 10_000_000,
    cobros: 500
};

export const FONDO_CAJA = 30_000;
export const NUEVA_MIN = 5; // una comanda de hace menos de 5 minutos se ve "Nueva" en la cocina

export const SECTORES = {
    salon: "Salón",
    vereda: "Vereda",
    barra: "Barra"
};

export const MEDIOS = { efectivo: "Efectivo", tarjeta: "Tarjeta", qr: "QR / transferencia" };

export const CATEGORIAS = {
    pizzas: { texto: "Pizzas", destino: "cocina", icono: "ti-pizza" },
    burgers: { texto: "Hamburguesas", destino: "cocina", icono: "ti-burger" },
    minutas: { texto: "Minutas", destino: "cocina", icono: "ti-tools-kitchen-2" },
    postres: { texto: "Postres", destino: "cocina", icono: "ti-ice-cream" },
    cervezas: { texto: "Cervezas", destino: "barra", icono: "ti-beer" },
    tragos: { texto: "Tragos", destino: "barra", icono: "ti-glass-cocktail" },
    sin: { texto: "Sin alcohol", destino: "barra", icono: "ti-bottle" }
};

// [id, nombre, categoría, precio, descripción (la que ve el cliente en la carta del QR)]
const CARTA = [
    ["muzza", "Muzzarella", "pizzas", 14_000, "Salsa de tomate, muzzarella y aceitunas verdes"],
    ["napo", "Napolitana", "pizzas", 16_500, "Muzzarella, rodajas de tomate, ajo y albahaca"],
    ["fugazzeta", "Fugazzeta", "pizzas", 16_000, "Rellena de muzzarella, con cebolla al horno"],
    ["especial", "Especial (jamón y morrón)", "pizzas", 18_000, "Muzzarella, jamón cocido y morrones asados"],
    ["clasica", "Hamburguesa clásica", "burgers", 13_500, "Medallón de carne, cheddar, lechuga y tomate"],
    ["doble", "Hamburguesa doble cheddar", "burgers", 17_000, "Dos medallones, doble cheddar y panceta"],
    ["milanesa", "Milanesa con papas", "minutas", 15_000, "Milanesa de carne con papas fritas"],
    ["papas", "Papas fritas", "minutas", 7_500, "Porción grande, para compartir"],
    ["rabas", "Rabas", "minutas", 16_000, "Rabas fritas con limón"],
    ["flan", "Flan con dulce de leche", "postres", 6_500, "Casero, con dulce de leche"],
    ["helado", "Helado (2 bochas)", "postres", 6_000, "Dos gustos a elección"],
    ["pinta-rubia", "Pinta rubia", "cervezas", 5_500, "Tirada, de medio litro"],
    ["pinta-roja", "Pinta roja", "cervezas", 6_000, "Tirada, de medio litro, maltosa"],
    ["pinta-ipa", "Pinta IPA", "cervezas", 6_500, "Tirada, de medio litro, lupulada"],
    ["fernet", "Fernet con cola", "tragos", 7_000, "Con mucho hielo"],
    ["gin", "Gin tonic", "tragos", 8_000, "Gin, tónica, limón y pepino"],
    ["aperol", "Aperol spritz", "tragos", 8_500, "Aperol, espumante y soda, con naranja"],
    ["coca", "Coca 500 ml", "sin", 3_500, "Común o sin azúcar"],
    ["agua", "Agua 500 ml", "sin", 2_800, "Con o sin gas"],
    ["limonada", "Limonada", "sin", 4_500, "Con menta y jengibre"]
].map(([id, nombre, cat, precio, descripcion]) => ({ id, nombre, cat, precio, descripcion, destino: CATEGORIAS[cat].destino }));

// Los platos que se ven en 3D en la carta del cliente: uno por modelo (img\<modelo>.glb), para que lo que se ve
// coincida con el nombre. Son genéricos, armados por código (como el frasco de la perfumería).
export const MODELOS_3D = { muzza: "pizza", clasica: "hamburguesa", milanesa: "milanesa" };

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
export const item = (id) => CARTA.find((x) => x.id === id) ?? null;
export const carta = () => copia(CARTA);

/** La carta que ve el cliente con el QR de la mesa: por categoría, con descripción y el 3D donde hay. Solo mirar. */
export const cartaCliente = () =>
    Object.entries(CATEGORIAS).map(([id, c]) => ({
        id, texto: c.texto, icono: c.icono,
        productos: CARTA.filter((p) => p.cat === id).map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, descripcion: p.descripcion, modelo: MODELOS_3D[p.id] ?? null }))
    }));

/** Dividir en partes iguales: redondeado a $100; la última parte se lleva la diferencia. */
export function dividir(total, partes) {
    const n = enteroHasta(partes, "En cuántas partes", { desde: 1, hasta: TOPES.partes });
    const cada = Math.floor(total / n / 100) * 100;
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - cada * (n - 1) : cada));
}

const minutos = (desde, hasta = Date.now()) => Math.max(0, Math.floor((hasta - new Date(desde)) / 60_000));
const haceMin = (m) => new Date(Date.now() - m * 60_000).toISOString();

// ---------- Datos de fábrica: el bar ya andando ----------
export function semilla() {
    const mesas = [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `m${i + 1}`, nombre: `Mesa ${i + 1}`, sector: "salon", abierta: null })),
        ...Array.from({ length: 3 }, (_, i) => ({ id: `v${i + 1}`, nombre: `Vereda ${i + 1}`, sector: "vereda", abierta: null })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: `b${i + 1}`, nombre: `Barra ${i + 1}`, sector: "barra", abierta: null }))
    ];
    const comandas = [];
    let n = 0;
    /** Abre una mesa con lo que ya se pidió (y mandó) hace un rato. */
    function abrir(mesaId, personas, hace, pedidos, { cocinaLista = true, estado = "abierta" } = {}) {
        const mesa = mesas.find((m) => m.id === mesaId);
        const renglones = pedidos.map(([id, cantidad]) => ({ id: `rg-${mesaId}-${id}`, itemId: id, nombre: item(id).nombre, precio: item(id).precio, cantidad, enviado: true }));
        mesa.abierta = { abiertaEn: haceMin(hace), personas, moza: "Lara", estado, renglones };
        for (const destino of ["cocina", "barra"]) {
            const items = renglones.filter((r) => item(r.itemId).destino === destino).map((r) => ({ nombre: r.nombre, cantidad: r.cantidad }));
            if (!items.length) continue;
            const lista = destino === "barra" || cocinaLista;
            comandas.push({ id: `c-${++n}`, mesaId, mesa: mesa.nombre, destino, items, creadaEn: haceMin(hace - 2), estado: lista ? "lista" : "pendiente", listaEn: lista ? haceMin(Math.max(0, hace - 15)) : null });
        }
    }
    abrir("m2", 4, 50, [["napo", 1], ["muzza", 1], ["pinta-rubia", 3], ["coca", 1]]);
    abrir("m7", 2, 75, [["milanesa", 2], ["fernet", 2], ["flan", 1]], { estado: "cobrando" });
    abrir("m5", 3, 12, [["doble", 2], ["papas", 1], ["pinta-ipa", 3]], { cocinaLista: false });
    abrir("m9", 2, 10, [["rabas", 1], ["gin", 2]], { cocinaLista: false });
    abrir("b2", 2, 25, [["pinta-roja", 2], ["papas", 1]]);
    abrir("v1", 2, 35, [["aperol", 2], ["fugazzeta", 1]]);

    // Lo que ya se cobró hoy en el turno (para que la caja tenga números)
    const cobros = [
        [180, "Mesa 3", [[24_500, "efectivo"], [24_500, "tarjeta"]]],
        [160, "Barra 1", [[12_000, "qr"]]],
        [140, "Mesa 6", [[38_400, "tarjeta"]]],
        [120, "Vereda 2", [[9_800, "efectivo"], [9_800, "efectivo"]]],
        [95, "Mesa 1", [[21_500, "qr"], [21_500, "tarjeta"], [21_500, "efectivo"]]],
        [70, "Mesa 8", [[33_000, "efectivo"]]]
    ].map(([hace, mesa, partes], i) => ({ id: `co-${i + 1}`, mesa, partes: partes.map(([monto, medio]) => ({ monto, medio })), total: partes.reduce((t, [m]) => t + m, 0), en: haceMin(hace), por: "Lara" }));

    const pedidosYa = [
        { id: "py-1", numero: 4821, cliente: "Pedido Ya #4821", items: [{ itemId: "clasica", nombre: item("clasica").nombre, cantidad: 2 }, { itemId: "papas", nombre: item("papas").nombre, cantidad: 1 }, { itemId: "coca", nombre: item("coca").nombre, cantidad: 2 }], estado: "nuevo", creadoEn: haceMin(3), comandaId: null },
        { id: "py-2", numero: 4807, cliente: "Pedido Ya #4807", items: [{ itemId: "muzza", nombre: item("muzza").nombre, cantidad: 1 }], estado: "entregado", creadoEn: haceMin(110), comandaId: null }
    ].map((p) => ({ ...p, total: p.items.reduce((t, i) => t + item(i.itemId).precio * i.cantidad, 0) }));
    // El de Pedidos Ya que ya se entregó también suma a la caja
    cobros.push({ id: "co-py-2", mesa: "Pedido Ya #4807", partes: [{ monto: pedidosYa[1].total, medio: "pedidosya" }], total: pedidosYa[1].total, en: haceMin(90), por: "Lara" });

    return { mesas, comandas, cobros, pedidosYa, cierres: [] };
}

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const esMoza = (u) => u?.rol === "moza";
    const esCocina = (u) => u?.rol === "cocina";
    const totalDe = (renglones) => renglones.reduce((t, r) => t + r.precio * r.cantidad, 0);

    function armarMesa(m) {
        const a = m.abierta;
        const pendientes = db().comandas.filter((c) => c.mesaId === m.id && c.destino === "cocina" && c.estado === "pendiente" && a && c.creadaEn >= a.abiertaEn).length;
        return {
            ...copia(m), sectorTexto: SECTORES[m.sector],
            estado: a ? a.estado : "libre",
            total: a ? totalDe(a.renglones) : 0,
            minutos: a ? minutos(a.abiertaEn) : 0,
            sinMandar: a ? a.renglones.filter((r) => !r.enviado).length : 0,
            cocinaPendiente: pendientes,
            comidaLista: !!a && !pendientes && db().comandas.some((c) => c.mesaId === m.id && c.destino === "cocina" && c.estado === "lista" && c.creadaEn >= a.abiertaEn)
        };
    }

    // ----- Salón (la moza) -----

    function plano() {
        const mesas = db().mesas.map(armarMesa);
        return {
            sectores: Object.entries(SECTORES).map(([id, texto]) => ({ id, texto, mesas: mesas.filter((m) => m.sector === id) })),
            resumen: {
                ocupadas: mesas.filter((m) => m.estado !== "libre").length,
                total: mesas.length,
                personas: mesas.reduce((t, m) => t + (m.abierta?.personas ?? 0), 0),
                abierto: mesas.reduce((t, m) => t + m.total, 0)
            },
            pedidosYa: db().pedidosYa.filter((p) => p.estado !== "entregado").map(armarPY)
        };
    }

    const mesa = (id) => armarMesa(buscar(db().mesas, id, "Esa mesa no existe."));

    function abrirMesa(usuario, mesaId, { personas } = {}) {
        exigir(esMoza(usuario), "Las mesas las abre la moza.");
        const m = buscar(db().mesas, mesaId, "Esa mesa no existe.");
        exigir(!m.abierta, `${m.nombre} ya está abierta.`);
        const n = enteroHasta(personas, "Las personas", { desde: 1, hasta: TOPES.personas });
        m.abierta = { abiertaEn: ahora(), personas: n, moza: usuario.nombre, estado: "abierta", renglones: [] };
        guardado.persistir();
        return armarMesa(m);
    }

    function mesaAbierta(usuario, mesaId) {
        exigir(esMoza(usuario), "Los pedidos los toma la moza.");
        const m = buscar(db().mesas, mesaId, "Esa mesa no existe.");
        exigir(m.abierta, `${m.nombre} está libre: abrila primero.`);
        return m;
    }

    /** Sumar a la mesa (si ya hay de ese producto sin mandar, se suma la cantidad). */
    function agregar(usuario, mesaId, itemId, cantidad = 1) {
        const m = mesaAbierta(usuario, mesaId);
        const it = item(itemId);
        exigir(it, "Ese producto no está en la carta.");
        const n = enteroHasta(cantidad, "La cantidad", { desde: 1, hasta: TOPES.cantidad });
        const ya = m.abierta.renglones.find((r) => r.itemId === itemId && !r.enviado);
        if (ya) {
            ya.cantidad = enteroHasta(ya.cantidad + n, `La cantidad de ${it.nombre}`, { desde: 1, hasta: TOPES.porRenglon });
        } else {
            exigir(m.abierta.renglones.length < TOPES.renglones, `Una mesa puede tener hasta ${TOPES.renglones} renglones.`);
            m.abierta.renglones.push({ id: nuevoId("rg"), itemId, nombre: it.nombre, precio: it.precio, cantidad: n, enviado: false });
        }
        if (m.abierta.estado === "cobrando") m.abierta.estado = "abierta";
        guardado.persistir();
        return armarMesa(m);
    }

    /** Sacar uno (solo lo que todavía no se mandó). */
    function sacar(usuario, mesaId, renglonId) {
        const m = mesaAbierta(usuario, mesaId);
        const r = buscar(m.abierta.renglones, renglonId, "Eso ya no está en la mesa.");
        exigir(!r.enviado, "Eso ya se mandó a la cocina o a la barra.");
        r.cantidad -= 1;
        if (r.cantidad <= 0) m.abierta.renglones = m.abierta.renglones.filter((x) => x.id !== renglonId);
        guardado.persistir();
        return armarMesa(m);
    }

    /** Enviar: lo que no se mandó se separa solo en una comanda para la cocina y otra para la barra. */
    function enviar(usuario, mesaId) {
        const m = mesaAbierta(usuario, mesaId);
        const nuevos = m.abierta.renglones.filter((r) => !r.enviado);
        exigir(nuevos.length, "No hay nada nuevo para mandar.");
        const tickets = {};
        for (const destino of ["cocina", "barra"]) {
            const items = nuevos.filter((r) => item(r.itemId).destino === destino).map((r) => ({ nombre: r.nombre, cantidad: r.cantidad }));
            if (!items.length) continue;
            // La barra la atiende la misma moza: su comanda sale como lista
            const c = { id: nuevoId("c"), mesaId: m.id, mesa: m.nombre, destino, items, creadaEn: ahora(), estado: destino === "barra" ? "lista" : "pendiente", listaEn: destino === "barra" ? ahora() : null };
            db().comandas.push(c);
            tickets[destino] = copia(c);
        }
        nuevos.forEach((r) => (r.enviado = true));
        guardado.persistir();
        return { mesa: armarMesa(m), ...tickets };
    }

    function pedirCuenta(usuario, mesaId) {
        const m = mesaAbierta(usuario, mesaId);
        exigir(m.abierta.renglones.length, "La mesa no pidió nada todavía.");
        m.abierta.estado = "cobrando";
        guardado.persistir();
        return armarMesa(m);
    }

    /** Cobrar: las partes tienen que sumar justo el total; cada una con su medio de pago. La mesa queda libre. */
    function cobrar(usuario, mesaId, { partes } = {}) {
        const m = mesaAbierta(usuario, mesaId);
        exigir(m.abierta.renglones.length, "La mesa no pidió nada todavía.");
        exigir(m.abierta.renglones.every((r) => r.enviado), "Hay cosas sin mandar: mandalas o sacalas antes de cobrar.");
        exigir(Array.isArray(partes) && partes.length >= 1 && partes.length <= TOPES.partes, `La cuenta se divide en 1 a ${TOPES.partes} partes.`);
        const total = totalDe(m.abierta.renglones);
        const limpias = partes.map((p, i) => {
            exigir(MEDIOS[p?.medio], `Elegí cómo paga la parte ${i + 1}.`);
            return { monto: enteroHasta(p.monto, `El monto de la parte ${i + 1}`, { desde: 1, hasta: TOPES.monto }), medio: p.medio };
        });
        const suma = limpias.reduce((t, p) => t + p.monto, 0);
        exigir(suma === total, suma < total ? `Faltan ${pesos(total - suma)} para llegar al total.` : `Las partes suman ${pesos(suma - total)} de más.`);
        exigir(db().cobros.length < TOPES.cobros, `Ya hay ${TOPES.cobros} cobros. Es una demo: tocá "Empezar de cero" arriba.`);
        const cobro = { id: nuevoId("co"), mesa: m.nombre, partes: limpias, total, en: ahora(), por: usuario.nombre };
        db().cobros.push(cobro);
        m.abierta = null;
        guardado.persistir();
        return copia(cobro);
    }

    // ----- Cocina -----

    /** Lo que tiene que hacer la cocina (lo más viejo primero) y lo último que salió. */
    function cocina(usuario) {
        exigir(esCocina(usuario) || esMoza(usuario), "Solo alguien del bar ve la cocina.");
        const deCocina = db().comandas.filter((c) => c.destino === "cocina");
        return {
            pendientes: deCocina.filter((c) => c.estado === "pendiente").sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))
                .map((c) => ({ ...copia(c), minutos: minutos(c.creadaEn), nueva: minutos(c.creadaEn) < NUEVA_MIN })),
            listas: deCocina.filter((c) => c.estado === "lista").sort((a, b) => (b.listaEn ?? "").localeCompare(a.listaEn ?? "")).slice(0, 5).map(copia)
        };
    }

    function marcarLista(usuario, comandaId) {
        exigir(esCocina(usuario), "Lo marca la cocina.");
        const c = buscar(db().comandas, comandaId, "Esa comanda no existe.");
        exigir(c.estado === "pendiente", "Esa comanda ya estaba lista.");
        c.estado = "lista";
        c.listaEn = ahora();
        guardado.persistir();
        return copia(c);
    }

    // ----- Pedidos Ya -----

    function armarPY(p) {
        const c = p.comandaId ? db().comandas.find((x) => x.id === p.comandaId) : null;
        return { ...copia(p), minutos: minutos(p.creadoEn), cocinaLista: c?.estado === "lista" };
    }

    /** Aceptar un pedido de Pedidos Ya: la comida va a la cocina como cualquier comanda. */
    function aceptarPY(usuario, id) {
        exigir(esMoza(usuario), "Los pedidos de afuera los acepta la moza.");
        const p = buscar(db().pedidosYa, id, "Ese pedido no existe.");
        exigir(p.estado === "nuevo", "Ese pedido ya estaba aceptado.");
        const items = p.items.filter((i) => item(i.itemId).destino === "cocina").map((i) => ({ nombre: i.nombre, cantidad: i.cantidad }));
        const c = { id: nuevoId("c"), mesaId: p.id, mesa: p.cliente, destino: "cocina", items, creadaEn: ahora(), estado: items.length ? "pendiente" : "lista", listaEn: items.length ? null : ahora() };
        db().comandas.push(c);
        p.comandaId = c.id;
        p.estado = "aceptado";
        guardado.persistir();
        return armarPY(p);
    }

    /** Entregado al repartidor: suma a la caja como "Pedidos Ya" (lo cobra la app). */
    function entregarPY(usuario, id) {
        exigir(esMoza(usuario), "Los pedidos de afuera los entrega la moza.");
        const p = buscar(db().pedidosYa, id, "Ese pedido no existe.");
        exigir(p.estado === "aceptado", p.estado === "nuevo" ? "Primero aceptalo." : "Ese pedido ya se entregó.");
        exigir(armarPY(p).cocinaLista, "La cocina todavía no lo terminó.");
        p.estado = "entregado";
        db().cobros.push({ id: nuevoId("co"), mesa: p.cliente, partes: [{ monto: p.total, medio: "pedidosya" }], total: p.total, en: ahora(), por: usuario.nombre });
        guardado.persistir();
        return armarPY(p);
    }

    // ----- Caja del turno -----

    function caja(usuario) {
        exigir(esMoza(usuario), "La caja la ve la moza.");
        const hoy = fechaLocalISO(0);
        const cobros = db().cobros.filter((c) => diaLocalDe(c.en) === hoy).sort((a, b) => b.en.localeCompare(a.en));
        const porMedio = { efectivo: 0, tarjeta: 0, qr: 0, pedidosya: 0 };
        cobros.forEach((c) => c.partes.forEach((p) => (porMedio[p.medio] += p.monto)));
        const total = Object.values(porMedio).reduce((a, b) => a + b, 0);
        const cierre = db().cierres.filter((c) => c.dia === hoy).at(-1) ?? null;
        return {
            porMedio, total, cobros: copia(cobros), fondo: FONDO_CAJA,
            enCajon: FONDO_CAJA + porMedio.efectivo,
            abierto: db().mesas.reduce((t, m) => t + (m.abierta ? totalDe(m.abierta.renglones) : 0), 0),
            cierre: copia(cierre)
        };
    }

    function cerrarCaja(usuario, contado) {
        const c = caja(usuario);
        const n = enteroHasta(contado, "La plata contada", { hasta: TOPES.monto });
        const cierre = { id: nuevoId("cc"), dia: fechaLocalISO(0), en: ahora(), esperado: c.enCajon, contado: n, diferencia: n - c.enCajon, por: usuario.nombre };
        db().cierres.push(cierre);
        guardado.persistir();
        return copia(cierre);
    }

    return {
        guardado,
        plano, mesa, abrirMesa, agregar, sacar, enviar, pedirCuenta, cobrar,
        cocina, marcarLista, aceptarPY, entregarPY, caja, cerrarCaja
    };
}
