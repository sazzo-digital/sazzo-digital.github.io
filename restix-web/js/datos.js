// ============================================
// Datos de Restix Sazzo (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un bar inventado ya andando: mesas por sector (Salón, Vereda, Barra), la carta, las comandas que van solas a la
// cocina (la comida) y a la barra (las bebidas), el cobro dividiendo la cuenta, la caja del turno y Pedidos Ya.
// Sin comprobante: el cobro se ve en pantalla, nada que parezca una factura.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga y se devuelven copias.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=7d06fec91a";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=7d06fec91a";
import { fechaLocalISO } from "../kit/js/fechas.js?v=7d06fec91a";
import { MARCA, PERSONAS } from "./marca.js?v=7d06fec91a";
import { MEDIOS_PAGO } from "../kit/js/pagos.js?v=7d06fec91a";
import { crearGuardadoRestix } from "./guardado.js?v=7d06fec91a";

export const VERSION_DATOS = 9;
export const PASOS_CARTA = ["pizzas", "hamburguesa-3d", "minutas"];

export const TOPES = {
    personas: 20,
    cantidad: 20, // de un mismo producto por vez
    porRenglon: 50, // de un mismo producto en la mesa
    renglones: 60,
    partes: 20, // en cuántas partes se divide la cuenta
    monto: 10_000_000,
    cobros: 500,
    movimientos: 100,
    motivo: 60,
    anulaciones: 100
};

export const MEDIOS_PERSONAL = { efectivo: "Efectivo", transferencia: "Transferencia" };
export const MOTIVOS_PERSONAL = ["Sueldo del día", "Adelanto"];

export const FONDO_CAJA = 30_000;
export const NUEVA_MIN = 5; // una comanda de hace menos de 5 minutos se ve "Nueva" en la cocina

export const SECTORES = {
    salon: "Salón",
    vereda: "Vereda",
    barra: "Barra"
};

export const MEDIOS = MEDIOS_PAGO;

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
    ["papas", "Papas fritas", "minutas", 7_500, "Porción grande con ketchup, para compartir"],
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
// coincida con el nombre.
export const MODELOS_3D = { muzza: "pizza", clasica: "hamburguesa", papas: "papas" };
export const AUTORES_3D = { pizza: "ARtemis 3D", hamburguesa: "McClatchy New Ventures Lab", papas: "Emm (edemaistre)" };

export const notaDe3D = (modelo) => {
    const autor = AUTORES_3D[modelo];
    return autor ? `Es de ejemplo: en tu carta van tus platos. Escaneo 3D: ${autor}, CC BY 4.0.` : "Es de ejemplo: en tu carta van tus platos.";
};

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
        mesa.abierta = { id: `a-${mesaId}`, abiertaEn: haceMin(hace), personas, moza: "Lara", estado, renglones, heredada: false };
        for (const destino of ["cocina", "barra"]) {
            const items = renglones.filter((r) => item(r.itemId).destino === destino).map((r) => ({ renglonId: r.id, nombre: r.nombre, cantidad: r.cantidad }));
            if (!items.length) continue;
            const lista = destino === "barra" || cocinaLista;
            comandas.push({ id: `c-${++n}`, aperturaId: mesa.abierta.id, mesaId, mesa: mesa.nombre, destino, items, creadaEn: haceMin(hace - 2), estado: lista ? "lista" : "pendiente", listaEn: lista ? haceMin(Math.max(0, hace - 15)) : null });
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
        [180, "Mesa 3", [[24_500, "efectivo"], [24_500, "debito"]]],
        [160, "Barra 1", [[12_000, "qr"]]],
        [140, "Mesa 6", [[38_400, "credito"]]],
        [120, "Vereda 2", [[9_800, "efectivo"], [9_800, "efectivo"]]],
        [95, "Mesa 1", [[21_500, "qr"], [21_500, "transferencia"], [21_500, "efectivo"]]],
        [70, "Mesa 8", [[33_000, "efectivo"]]]
    ].map(([hace, mesa, partes], i) => ({ id: `co-${i + 1}`, mesa, partes: partes.map(([monto, medio]) => ({ monto, medio })), total: partes.reduce((t, [m]) => t + m, 0), en: haceMin(hace), por: "Lara" }));

    const pedidosYa = [
        { id: "py-1", numero: 4821, cliente: "Pedido Ya #4821", items: [{ itemId: "clasica", nombre: item("clasica").nombre, cantidad: 2 }, { itemId: "papas", nombre: item("papas").nombre, cantidad: 1 }, { itemId: "coca", nombre: item("coca").nombre, cantidad: 2 }], estado: "nuevo", creadoEn: haceMin(3), comandaId: null },
        { id: "py-2", numero: 4807, cliente: "Pedido Ya #4807", items: [{ itemId: "muzza", nombre: item("muzza").nombre, cantidad: 1 }], estado: "entregado", creadoEn: haceMin(110), comandaId: null }
    ].map((p) => ({ ...p, total: p.items.reduce((t, i) => t + item(i.itemId).precio * i.cantidad, 0) }));
    // El de Pedidos Ya que ya se entregó también suma a la caja
    cobros.push({ id: "co-py-2", mesa: "Pedido Ya #4807", partes: [{ monto: pedidosYa[1].total, medio: "pedidosya" }], total: pedidosYa[1].total, en: haceMin(90), por: "Lara" });

    return { mesas, comandas, cobros, pedidosYa, movimientos: [], anulaciones: [], cierres: [], cartaVista: [], cocinaTVVista: false };
}

// ---------- Funciones de datos ----------

const desdeCierre = (lista, cierre, campo) => lista.filter((x) => !cierre || x.en > cierre.hasta || (x.en === cierre.hasta && !cierre[campo].includes(x.id)));

export function turnoAbierto(d) {
    const cierre = d.cierres.at(-1);
    return d.mesas.some((m) => !!m.abierta) || d.pedidosYa.some((p) => p.estado !== "entregado") ||
        desdeCierre(d.cobros, cierre, "cobrosEnHasta").length > 0 ||
        desdeCierre(d.movimientos, cierre, "movimientosEnHasta").length > 0 ||
        desdeCierre(d.anulaciones, cierre, "anulacionesEnHasta").length > 0;
}

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardadoRestix({ prefijo, version: VERSION_DATOS, semilla, turnoAbierto,
        preguntaAlVolver: "Quedó un turno abierto de hace {tiempo}. ¿Seguís con ese turno o empezás de cero?" });
    const db = () => guardado.db();
    const esMoza = (u) => u?.rol === "moza";
    const esCocina = (u) => u?.rol === "cocina";
    const totalDe = (renglones) => renglones.filter((r) => !r.anulacion).reduce((t, r) => t + r.precio * r.cantidad, 0);

    function armarMesa(m) {
        const a = m.abierta;
        const pendientes = db().comandas.filter((c) => c.mesaId === m.id && c.destino === "cocina" && c.estado === "pendiente" && c.items.some((i) => !i.anulacion) && a && c.aperturaId === a.id).length;
        return {
            ...copia(m), sectorTexto: SECTORES[m.sector],
            estado: a ? a.estado : "libre",
            total: a ? totalDe(a.renglones) : 0,
            minutos: a ? minutos(a.abiertaEn) : 0,
            sinMandar: a ? a.renglones.filter((r) => !r.enviado).length : 0,
            cocinaPendiente: pendientes,
            comandas: a ? db().comandas.filter((c) => c.aperturaId === a.id).map(copia) : [],
            comidaLista: !!a && !a.comidaServida && !pendientes && db().comandas.some((c) => c.mesaId === m.id && c.destino === "cocina" && c.estado === "lista" && c.items.some((i) => !i.anulacion) && c.aperturaId === a.id)
        };
    }

    function pasos(usuario) {
        if (usuario?.rol === "cliente") return PASOS_CARTA.map((id) => db().cartaVista.includes(id));
        if (esMoza(usuario)) {
            const cobros = db().cobros.filter((c) => c.mesa === "Mesa 4");
            const aperturas = new Map();
            for (const c of db().comandas.filter((c) => c.mesaId === "m4" && c.estado !== "anulada")) {
                const cantidades = aperturas.get(c.aperturaId) ?? {};
                for (const i of c.items.filter((i) => !i.anulacion)) cantidades[i.nombre] = (cantidades[i.nombre] ?? 0) + i.cantidad;
                aperturas.set(c.aperturaId, cantidades);
            }
            const pedido = [...aperturas.values()].some((cantidades) => [["muzza", 2], ["fernet", 1], ["coca", 2]].every(([id, n]) => (cantidades[item(id).nombre] ?? 0) >= n));
            return [!!mesa("m4").abierta || cobros.length > 0, pedido, cobros.some((c) => c.modo === "iguales" && c.partes.length >= 2)];
        }
        if (esCocina(usuario)) return ["m5", "m9"].map((id) => db().comandas.some((c) => c.mesaId === id && c.destino === "cocina" && c.estado === "lista")).concat(!!db().cocinaTVVista);
        exigir(false, "Esta serie todavía no está disponible para esa persona.");
    }

    function mirarTVCocina(usuario) {
        exigir(esCocina(usuario), "La tele de cocina la abre Beto.");
        db().cocinaTVVista = true;
        guardado.persistir();
    }

    function mirarCategoria(usuario, id) {
        exigir(usuario?.rol === "cliente", "La carta la recorre el cliente.");
        exigir(PASOS_CARTA.includes(id), "Ese no es un paso de la carta.");
        if (!db().cartaVista.includes(id)) db().cartaVista.push(id);
        guardado.persistir();
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
        m.abierta = { id: nuevoId("a"), abiertaEn: ahora(), personas: n, moza: usuario.nombre, estado: "abierta", renglones: [], heredada: false };
        guardado.persistir();
        return armarMesa(m);
    }

    function mesaAbierta(usuario, mesaId) {
        exigir(esMoza(usuario), "Los pedidos los toma la moza.");
        const m = buscar(db().mesas, mesaId, "Esa mesa no existe.");
        exigir(m.abierta, `${m.nombre} está libre: abrila primero.`);
        return m;
    }

    function anularMesa(usuario, mesaId, motivo) {
        const m = mesaAbierta(usuario, mesaId);
        exigir(typeof motivo === "string" && motivo.trim().length > 0, "Escribí un motivo para anular la mesa.");
        const texto = sinPasarse(motivo, TOPES.motivo, "el motivo");
        exigir(caja(usuario).anulaciones.length < TOPES.anulaciones, `Ya hay ${TOPES.anulaciones} mesas anuladas en este turno.`);
        const anulacion = { id: nuevoId("an"), mesaId, mesa: m.nombre, abierta: copia(m.abierta), total: totalDe(m.abierta.renglones), motivo: texto, por: usuario.nombre, en: ahora() };
        for (const c of db().comandas.filter((c) => c.aperturaId === m.abierta.id && c.estado === "pendiente")) {
            c.estado = "anulada";
            c.anuladaEn = anulacion.en;
            c.anuladaPor = usuario.nombre;
            c.motivo = texto;
        }
        db().anulaciones.push(anulacion);
        m.abierta = null;
        guardado.persistir();
        return copia(anulacion);
    }

    /** Sumar a la mesa (si ya hay de ese producto sin mandar, se suma la cantidad). */
    function agregar(usuario, mesaId, itemId, cantidad = 1) {
        const m = mesaAbierta(usuario, mesaId);
        const it = item(itemId);
        exigir(it, "Ese producto no está en la carta.");
        const n = enteroHasta(cantidad, "La cantidad", { desde: 1, hasta: TOPES.cantidad });
        const cantidadMesa = m.abierta.renglones.filter((r) => r.itemId === itemId && !r.anulacion).reduce((t, r) => t + r.cantidad, 0);
        enteroHasta(cantidadMesa + n, `La cantidad de ${it.nombre}`, { desde: 1, hasta: TOPES.porRenglon });
        const ya = m.abierta.renglones.find((r) => r.itemId === itemId && !r.enviado);
        if (ya) {
            ya.cantidad = enteroHasta(ya.cantidad + n, `La cantidad de ${it.nombre}`, { desde: 1, hasta: TOPES.porRenglon });
        } else {
            exigir(m.abierta.renglones.length < TOPES.renglones, `Llegaste a ${TOPES.renglones} renglones en esta mesa. Mandá lo pendiente y cobrá esta cuenta antes de abrir otro pedido.`);
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

    function anularRenglon(usuario, mesaId, renglonId, motivo) {
        const m = mesaAbierta(usuario, mesaId);
        const r = buscar(m.abierta.renglones, renglonId, "Eso ya no está en la mesa.");
        exigir(r.enviado && !r.anulacion, "Solo podés anular un renglón mandado que no está anulado.");
        exigir(typeof motivo === "string" && motivo.trim().length > 0, "Escribí un motivo para anular el renglón.");
        const texto = sinPasarse(motivo, TOPES.motivo, "el motivo");
        const anulacion = { motivo: texto, por: usuario.nombre, en: ahora() };
        const c = db().comandas.find((c) => c.aperturaId === m.abierta.id && c.items.some((i) => i.renglonId === r.id));
        exigir(c, "No se encontró la comanda de ese renglón.");
        r.anulacion = anulacion;
        c.items.find((i) => i.renglonId === r.id).anulacion = copia(anulacion);
        if (c.estado === "pendiente" && c.items.every((i) => i.anulacion)) {
            c.estado = "anulada";
            c.anuladaEn = anulacion.en;
            c.anuladaPor = anulacion.por;
            c.motivo = texto;
        }
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
            const items = nuevos.filter((r) => item(r.itemId).destino === destino).map((r) => ({ renglonId: r.id, nombre: r.nombre, cantidad: r.cantidad }));
            if (!items.length) continue;
            // La barra la atiende la misma moza: su comanda sale como lista
            const c = { id: nuevoId("c"), aperturaId: m.abierta.id, mesaId: m.id, mesa: m.nombre, destino, items, creadaEn: ahora(), estado: destino === "barra" ? "lista" : "pendiente", listaEn: destino === "barra" ? ahora() : null };
            db().comandas.push(c);
            tickets[destino] = copia(c);
        }
        nuevos.forEach((r) => (r.enviado = true));
        m.abierta.comidaServida = true;
        guardado.persistir();
        return { mesa: armarMesa(m), ...tickets };
    }

    function pedirCuenta(usuario, mesaId) {
        const m = mesaAbierta(usuario, mesaId);
        exigir(m.abierta.renglones.some((r) => !r.anulacion), "La mesa no pidió nada todavía.");
        m.abierta.estado = "cobrando";
        guardado.persistir();
        return armarMesa(m);
    }

    /** Cobrar: las partes tienen que sumar justo el total; cada una con su medio de pago. La mesa queda libre. */
    function cobrar(usuario, mesaId, { partes, modo = "junto" } = {}) {
        const m = mesaAbierta(usuario, mesaId);
        exigir(m.abierta.renglones.some((r) => !r.anulacion), "La mesa no pidió nada todavía.");
        exigir(m.abierta.renglones.every((r) => r.enviado), "Hay cosas sin mandar: mandalas o sacalas antes de cobrar.");
        exigir(Array.isArray(partes) && partes.length >= 1 && partes.length <= TOPES.partes, `La cuenta se divide en 1 a ${TOPES.partes} partes.`);
        exigir(["junto", "iguales", "items"].includes(modo), "Elegí una forma de dividir la cuenta.");
        const total = totalDe(m.abierta.renglones);
        const limpias = partes.map((p, i) => {
            exigir(Object.hasOwn(MEDIOS, p?.medio), partes.length === 1 ? "Elegí cómo paga la cuenta." : `Elegí cómo paga la parte ${i + 1}.`);
            return { monto: enteroHasta(p.monto, partes.length === 1 ? "El monto de la cuenta" : `El monto de la parte ${i + 1}`, { desde: 1, hasta: TOPES.monto }), medio: p.medio };
        });
        if (modo === "iguales") exigir(JSON.stringify(limpias.map((p) => p.monto)) === JSON.stringify(dividir(total, partes.length)), "Revisá las partes iguales.");
        const suma = limpias.reduce((t, p) => t + p.monto, 0);
        exigir(suma === total, suma < total ? `Faltan ${pesos(total - suma)} para llegar al total.` : `Las partes suman ${pesos(suma - total)} de más.`);
        exigir(db().cobros.length < TOPES.cobros, `Ya hay ${TOPES.cobros} cobros. Es una demo: tocá "Empezar de cero" arriba.`);
        const cobro = { id: nuevoId("co"), mesa: m.nombre, modo, partes: limpias, total, en: ahora(), por: usuario.nombre };
        db().cobros.push(cobro);
        m.abierta = null;
        guardado.persistir();
        return copia(cobro);
    }

    // ----- Cocina -----

    /** Lo que tiene que hacer la cocina (lo más viejo primero) y lo último que salió. */
    function cocina(usuario) {
        exigir(esCocina(usuario) || esMoza(usuario), "Solo alguien del bar ve la cocina.");
        const deCocina = db().comandas.filter((c) => c.destino === "cocina" && c.items?.length).map((c) => {
            const m = db().mesas.find((m) => m.id === c.mesaId);
            return { ...copia(c), cobrando: !!m?.abierta && c.aperturaId === m.abierta.id && m.abierta.estado === "cobrando", yaCobrada: c.estado !== "anulada" && !!m && (!m.abierta || c.aperturaId !== m.abierta.id) };
        });
        return {
            pendientes: deCocina.filter((c) => c.estado === "pendiente").sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))
                .map((c) => ({ ...copia(c), minutos: minutos(c.creadaEn), nueva: minutos(c.creadaEn) < NUEVA_MIN })),
            listas: deCocina.filter((c) => c.estado === "lista").sort((a, b) => (b.listaEn ?? "").localeCompare(a.listaEn ?? "")).slice(0, 5).map(copia),
            anuladas: deCocina.filter((c) => c.estado === "anulada").sort((a, b) => b.anuladaEn.localeCompare(a.anuladaEn)).map(copia)
        };
    }

    function marcarLista(usuario, comandaId) {
        exigir(esCocina(usuario), "Lo marca la cocina.");
        const c = buscar(db().comandas, comandaId, "Esa comanda no existe.");
        exigir(c.estado === "pendiente", "Esa comanda ya estaba lista.");
        c.estado = "lista";
        c.listaEn = ahora();
        const m = db().mesas.find((m) => m.id === c.mesaId);
        if (c.destino === "cocina" && m?.abierta && c.aperturaId === m.abierta.id) m.abierta.comidaServida = false;
        guardado.persistir();
        return copia(c);
    }

    // ----- Pedidos Ya -----

    function armarPY(p) {
        const c = p.comandaId ? db().comandas.find((x) => x.id === p.comandaId) : null;
        return { ...copia(p), minutos: minutos(p.creadoEn), cocinaLista: c?.estado === "lista" || (!p.comandaId && !p.items.some((i) => item(i.itemId).destino === "cocina")) };
    }

    /** Aceptar un pedido de Pedidos Ya: la comida va a la cocina como cualquier comanda. */
    function aceptarPY(usuario, id) {
        exigir(esMoza(usuario), "Los pedidos de afuera los acepta la moza.");
        const p = buscar(db().pedidosYa, id, "Ese pedido no existe.");
        exigir(p.estado === "nuevo", "Ese pedido ya estaba aceptado.");
        const items = p.items.filter((i) => item(i.itemId).destino === "cocina").map((i) => ({ nombre: i.nombre, cantidad: i.cantidad }));
        p.comandaId = null;
        if (items.length) {
            const c = { id: nuevoId("c"), mesaId: p.id, mesa: p.cliente, destino: "cocina", items, creadaEn: ahora(), estado: "pendiente", listaEn: null };
            db().comandas.push(c);
            p.comandaId = c.id;
        }
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
        exigir(db().cobros.length < TOPES.cobros, `Ya hay ${TOPES.cobros} cobros. Es una demo: tocá "Empezar de cero" arriba.`);
        p.estado = "entregado";
        db().cobros.push({ id: nuevoId("co"), mesa: p.cliente, partes: [{ monto: p.total, medio: "pedidosya" }], total: p.total, en: ahora(), por: usuario.nombre });
        guardado.persistir();
        return armarPY(p);
    }

    // ----- Caja del turno -----

    function registrarMovimiento(usuario, { tipo, personaId = null, motivo, monto, medio }) {
        exigir(esMoza(usuario), "Los movimientos de caja los carga la moza.");
        exigir(["personal", "gasto", "retiro"].includes(tipo), "Elegí Pago al personal, Gasto o Retiro.");
        exigir(typeof motivo === "string", "Escribí un motivo.");
        const texto = sinPasarse(motivo, TOPES.motivo, "el motivo");
        exigir(texto.length > 0, "Escribí un motivo.");
        const persona = PERSONAS.find((p) => p.id === personaId && p.rol !== "cliente");
        if (tipo === "personal") {
            exigir(persona, "Elegí a alguien del personal del bar.");
            exigir(MOTIVOS_PERSONAL.includes(texto), "Elegí Sueldo del día o Adelanto.");
            exigir(Object.hasOwn(MEDIOS_PERSONAL, medio), "Elegí Efectivo o Transferencia para pagar al personal.");
        } else {
            exigir(medio === "efectivo", "Los gastos y retiros salen en efectivo del cajón.");
        }
        const n = enteroHasta(monto, "El monto", { desde: 1, hasta: TOPES.monto });
        const c = caja(usuario);
        exigir(c.movimientos.length < TOPES.movimientos, `Ya hay ${TOPES.movimientos} movimientos en este turno.`);
        exigir(medio !== "efectivo" || n <= c.enCajon, `Ese egreso dejaría el cajón esperado por debajo de 0. Hay ${pesos(c.enCajon)} disponibles.`);
        const movimiento = { id: nuevoId("mc"), tipo, personaId, persona: persona?.nombre ?? null, motivo: texto, monto: n, medio, en: ahora(), por: usuario.nombre };
        db().movimientos.push(movimiento);
        guardado.persistir();
        return copia(movimiento);
    }

    function pagarPersonal(usuario, { personaId, motivo, monto, medio } = {}) {
        return registrarMovimiento(usuario, { tipo: "personal", personaId, motivo, monto, medio });
    }

    function gastoORetiro(usuario, { tipo, motivo, monto } = {}) {
        exigir(["gasto", "retiro"].includes(tipo), "Elegí Gasto o Retiro.");
        return registrarMovimiento(usuario, { tipo, motivo, monto, medio: "efectivo" });
    }

    function caja(usuario) {
        exigir(esMoza(usuario), "La caja la ve la moza.");
        const cierres = [...db().cierres].reverse();
        const cierre = cierres[0] ?? null;
        const desde = cierre?.hasta ?? null;
        const cobros = desdeCierre(db().cobros, cierre, "cobrosEnHasta").sort((a, b) => b.en.localeCompare(a.en));
        const movimientos = desdeCierre(db().movimientos, cierre, "movimientosEnHasta").sort((a, b) => b.en.localeCompare(a.en));
        const anulaciones = desdeCierre(db().anulaciones, cierre, "anulacionesEnHasta");
        const egresosEfectivo = movimientos.filter((m) => m.medio === "efectivo").reduce((t, m) => t + m.monto, 0);
        const pagosTransferencia = movimientos.filter((m) => m.tipo === "personal" && m.medio === "transferencia").reduce((t, m) => t + m.monto, 0);
        const porMedio = Object.fromEntries([...Object.keys(MEDIOS), "pedidosya"].map((k) => [k, 0]));
        cobros.forEach((c) => c.partes.forEach((p) => (porMedio[p.medio] += p.monto)));
        const total = Object.values(porMedio).reduce((a, b) => a + b, 0);
        const enCajon = FONDO_CAJA + porMedio.efectivo - egresosEfectivo;
        const abiertas = db().mesas.filter((m) => m.abierta);
        const mesasPasadas = abiertas.map((m) => ({ id: m.id, nombre: m.nombre, total: totalDe(m.abierta.renglones) }));
        const pedidosPasados = db().pedidosYa.filter((p) => p.estado !== "entregado").map((p) => ({ id: p.id, cliente: p.cliente, total: p.total }));
        return {
            desde: desde ?? [cobros.at(-1)?.en, movimientos.at(-1)?.en, anulaciones[0]?.en].filter(Boolean).sort()[0] ?? null,
            movimientos: copia(movimientos), egresosEfectivo, pagosTransferencia,
            anulaciones: copia(anulaciones), totalAnulado: anulaciones.reduce((t, a) => t + a.total, 0),
            mesasPasadas, pedidosPasados,
            porMedio, total, cobros: copia(cobros), fondo: FONDO_CAJA, enCajon,
            topeContado: Math.max(TOPES.monto, enCajon * 2),
            mesasAbiertas: abiertas.length,
            abierto: abiertas.reduce((t, m) => t + totalDe(m.abierta.renglones), 0),
            cierre: copia(cierre), cierres: copia(cierres.slice(0, 10))
        };
    }

    function prepararCierre(usuario, contado, tipo = "turno") {
        const c = caja(usuario);
        exigir(["turno", "dia"].includes(tipo), "Elegí Terminar el turno o Cerrar el día.");
        if (tipo === "dia") {
            const faltantes = [];
            if (c.mesasAbiertas) faltantes.push(`Quedan ${c.mesasAbiertas} ${c.mesasAbiertas === 1 ? "mesa abierta" : "mesas abiertas"} (${c.mesasPasadas.map((m) => m.nombre).join(" y ")}): cobralas o anulalas para cerrar el día`);
            if (c.pedidosPasados.length) faltantes.push(`Quedan ${c.pedidosPasados.length} ${c.pedidosPasados.length === 1 ? "pedido de Pedidos Ya sin entregar" : "pedidos de Pedidos Ya sin entregar"} (${c.pedidosPasados.map((p) => p.cliente).join(" y ")}): entregalos para cerrar el día`);
            exigir(!faltantes.length, faltantes.join(". "));
        }
        exigir(contado !== "" && contado != null, "Escribí cuánta plata contaste");
        const n = enteroHasta(contado, "La plata contada", { hasta: c.topeContado });
        exigir(c.cobros.length > 0 || c.movimientos.length > 0 || c.anulaciones.length > 0 || c.mesasAbiertas > 0 || c.pedidosPasados.length > 0 || (tipo === "dia" && c.cierre?.tipo !== "dia"), "No hubo cobros ni movimientos desde el último cierre. Cargá una operación antes de cerrar caja.");
        return { ...c, tipo, contado: n, diferencia: n - c.enCajon };
    }

    function cerrarCaja(usuario, contado, tipo = "turno") {
        const c = prepararCierre(usuario, contado, tipo);
        const hasta = ahora();
        const cierre = {
            id: nuevoId("cc"), tipo, dia: fechaLocalISO(0), en: hasta, desde: c.desde, hasta,
            cobrosEnHasta: db().cobros.filter((co) => co.en === hasta).map((co) => co.id),
            movimientosEnHasta: db().movimientos.filter((m) => m.en === hasta).map((m) => m.id),
            anulacionesEnHasta: db().anulaciones.filter((a) => a.en === hasta).map((a) => a.id),
            mesasPasadas: c.mesasPasadas, pedidosPasados: c.pedidosPasados,
            anulaciones: c.anulaciones, totalAnulado: c.totalAnulado,
            egresosEfectivo: c.egresosEfectivo, pagosTransferencia: c.pagosTransferencia,
            porMedio: copia(c.porMedio), entrado: c.total,
            esperado: c.enCajon, contado: c.contado, diferencia: c.diferencia, por: usuario.nombre
        };
        db().mesas.filter((m) => m.abierta).forEach((m) => { m.abierta.heredada = true; });
        db().pedidosYa.filter((p) => p.estado !== "entregado").forEach((p) => { p.heredada = true; });
        db().cierres.push(cierre);
        guardado.persistir();
        return copia(cierre);
    }

    return {
        guardado, pasos, mirarCategoria, mirarTVCocina,
        plano, mesa, abrirMesa, anularMesa, anularRenglon, agregar, sacar, enviar, pedirCuenta, cobrar,
        cocina, marcarLista, aceptarPY, entregarPY, pagarPersonal, gastoORetiro, caja, prepararCierre, cerrarCaja
    };
}
