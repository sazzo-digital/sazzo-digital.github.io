// ============================================
// Datos de Sazzo Taller (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un taller inventado: 10 autos con patente (los dos formatos), sus dueños, una lista de repuestos y de mano de obra
// con precios inventados, 7 órdenes de trabajo abiertas en todos los estados y el historial de cada auto.
// Todo gira alrededor de la orden de trabajo: Recibido → Presupuestado → En reparación ⇄ Esperando repuesto → Listo →
// Entregado (o Anulado: nada se borra). El mecánico ve sus autos y carga lo que encontró y los repuestos, sin precios.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga y se devuelven copias.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=dbd4cbbcac";
import { filtrarPorTexto } from "../kit/js/buscar.js?v=dbd4cbbcac";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=dbd4cbbcac";
import { fechaLocalISO, esFechaISO, diaLocalDe } from "../kit/js/fechas.js?v=dbd4cbbcac";
import { MARCA, NEGOCIO } from "./marca.js?v=dbd4cbbcac";

export const VERSION_DATOS = 3;

export const TOPES = {
    km: 999_999,
    cantidad: 99,
    precio: 5_000_000,
    renglones: 40, // renglones de un presupuesto
    texto: 300, // lo que dijo el cliente, lo que encontró el mecánico, notas
    deja: 120, // qué deja en el auto
    nombre: 40, // cliente o modelo del auto
    diasPromesa: 90, // para cuándo se promete: de hoy a 3 meses
    ordenes: 300,
    autos: 300
};

export const SERVICE_MESES = 6; // "Para llamar": más de 6 meses desde el último service…
export const SERVICE_KM = 10_000; // …o más de 10.000 km
export const RELLAMAR_DIAS = 7;

export const ESTADOS = {
    recibido: { texto: "Recibido", icono: "ti-inbox" },
    presupuestado: { texto: "Presupuestado", icono: "ti-file-invoice" },
    reparacion: { texto: "En reparación", icono: "ti-tool" },
    esperando: { texto: "Esperando repuesto", icono: "ti-package" },
    listo: { texto: "Listo", icono: "ti-circle-check" },
    entregado: { texto: "Entregado", icono: "ti-car" },
    anulado: { texto: "Anulado", icono: "ti-ban" }
};
export const ABIERTOS = ["recibido", "presupuestado", "reparacion", "esperando", "listo"];
const EDITABLES = ["recibido", "presupuestado", "reparacion", "esperando"];

export const NAFTA = ["Reserva", "1/4", "1/2", "3/4", "Lleno"];

export const MECANICOS = [
    { id: "m-seba", nombre: "Seba", personaId: "u-mecanico" },
    { id: "m-nacho", nombre: "Nacho", personaId: null }
];

export const REPUESTOS = [
    ["r-aceite", "Aceite 4 L", 45_000], ["r-filtro-aceite", "Filtro de aceite", 9_000], ["r-filtro-aire", "Filtro de aire", 11_000],
    ["r-filtro-nafta", "Filtro de combustible", 12_000], ["r-bujias", "Bujías (juego de 4)", 28_000],
    ["r-pastillas", "Pastillas de freno delanteras", 38_000], ["r-discos", "Disco de freno delantero", 52_000],
    ["r-distribucion", "Kit de distribución", 120_000], ["r-bomba", "Bomba de agua", 75_000], ["r-bateria", "Batería 12 V", 130_000],
    ["r-amortiguador", "Amortiguador delantero", 85_000], ["r-embrague", "Kit de embrague", 210_000], ["r-liquido", "Líquido de frenos", 8_000],
    ["r-refrigerante", "Refrigerante", 10_000], ["r-lampara", "Lámpara", 3_500], ["r-escobillas", "Escobillas (par)", 15_000],
    ["r-rotula", "Rótula", 30_000], ["r-extremo", "Extremo de dirección", 26_000]
].map(([id, nombre, precio]) => ({ id, nombre, precio, tipo: "repuesto" }));

export const MANO_DE_OBRA = [
    ["mo-service", "Service completo", 60_000, true], ["mo-frenos", "Cambio de frenos delanteros", 45_000], ["mo-distribucion", "Cambio de distribución", 110_000],
    ["mo-embrague", "Cambio de embrague", 150_000], ["mo-tren", "Tren delantero", 70_000], ["mo-escaner", "Diagnóstico con escáner", 25_000],
    ["mo-alineacion", "Alineación y balanceo", 35_000], ["mo-bomba", "Cambio de bomba de agua", 65_000], ["mo-revision", "Revisión general", 30_000],
    ["mo-amortiguadores", "Cambio de amortiguadores", 60_000]
].map(([id, nombre, precio, esService = false]) => ({ id, nombre, precio, tipo: "mano", esService }));

const ITEMS = [...REPUESTOS, ...MANO_DE_OBRA];

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

// ---------- Patentes: "ABC 123" (vieja) o "AB 123 CD" (Mercosur) ----------

export const normalizarPatente = (t) => String(t ?? "").toUpperCase().replace(/[\s.-]/g, "");
export const esPatente = (t) => /^[A-Z]{3}\d{3}$/.test(normalizarPatente(t)) || /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normalizarPatente(t));
export function formatoPatente(t) {
    const p = normalizarPatente(t);
    return p.length === 6 ? `${p.slice(0, 3)} ${p.slice(3)}` : `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
}

/** Total de un presupuesto. */
export const totalDe = (renglones) => renglones.reduce((t, r) => t + r.cantidad * r.precio, 0);

/** Meses (enteros) entre una fecha y hoy. */
export function mesesDesde(fecha, hoy = fechaLocalISO(0)) {
    const [a1, m1, d1] = fecha.split("-").map(Number);
    const [a2, m2, d2] = hoy.split("-").map(Number);
    return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

// ---------- Datos de fábrica ----------
// [id, patente, modelo, año, cliente, km, meses desde el último service, km en el último service]
const AUTOS = [
    ["a-gol", "AB123CD", "VW Gol Trend", 2016, "Silvia Paredes", 82_000, 7, 82_000],
    ["a-corsa", "GHT482", "Chevrolet Corsa", 2009, "Jorge Aranda", 168_300, 4, 163_900],
    ["a-palio", "KLP913", "Fiat Palio", 2012, "Andrea Gallo", 121_400, 5, 118_000],
    ["a-ka", "AC456FG", "Ford Ka", 2018, "Héctor Ibarra", 64_800, 6, 55_100],
    ["a-208", "AE789HJ", "Peugeot 208", 2021, "Valeria Quiroga", 38_900, 3, 35_000],
    ["a-onix", "AD234KL", "Chevrolet Onix", 2020, "Oscar Rojas", 71_200, 5, 66_000],
    ["a-kangoo", "NBX377", "Renault Kangoo", 2014, "Lorena Funes", 190_500, 2, 188_000],
    ["a-hilux", "AF901MN", "Toyota Hilux", 2022, "Daniel Ledesma", 44_300, 1, 40_000],
    ["a-clio", "JRS245", "Renault Clio", 2011, "Mónica Correa", 139_700, 9, 132_000],
    ["a-cronos", "AE612PQ", "Fiat Cronos", 2021, "Fabián Villalba", 61_800, 5, 49_300]
];

const haceDias = (n, hora = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hora, 0, 0, 0);
    return d.toISOString();
};

const renglon = (itemId, cantidad = 1) => {
    const i = ITEMS.find((x) => x.id === itemId);
    return { id: `rg-${itemId}`, tipo: i.tipo, itemId, nombre: i.nombre, cantidad, precio: i.precio };
};

export function semilla() {
    const clientes = [];
    const autos = AUTOS.map(([id, patente, modelo, anio, cliente, km, meses, kmService]) => {
        const c = { id: `c-${id.slice(2)}`, nombre: cliente };
        clientes.push(c);
        return { id, patente, modelo, anio, clienteId: c.id, km, ultimoService: { fecha: fechaLocalISO(-Math.round(meses * 30.4)), km: kmService }, llamadoEn: null };
    });

    let numero = 100;
    const ordenes = [];
    /** Una orden con su historial de estados (cada paso, unas horas después del anterior). */
    function orden(autoId, { estado, dias, mecanicoId, dijo, encontro = "", renglones = [], avisado = false, km }) {
        const pasos = ["recibido", "presupuestado", "reparacion", "listo", "entregado"];
        const hasta = estado === "esperando" ? 2 : pasos.indexOf(estado);
        const historial = pasos.slice(0, hasta + 1).map((e, i) => ({ estado: e, en: haceDias(dias, 9 + i * 2), por: e === "reparacion" || e === "listo" ? MECANICOS.find((m) => m.id === mecanicoId).nombre : "Raúl" }));
        if (estado === "esperando") historial.push({ estado: "esperando", en: haceDias(dias, 16), por: MECANICOS.find((m) => m.id === mecanicoId).nombre });
        const o = {
            id: `o-${++numero}`, numero, autoId, estado, mecanicoId, dijo, encontro, renglones, notas: "",
            km: km ?? autos.find((a) => a.id === autoId).km, nafta: "1/2", deja: "", prometida: fechaLocalISO(2 - dias),
            recibidaEn: haceDias(dias, 9), avisado, historial
        };
        ordenes.push(o);
        return o;
    }

    // Lo que pasó antes (entregadas): el historial de cada auto
    orden("a-gol", { estado: "entregado", dias: 213, mecanicoId: "m-seba", dijo: "Le toca el service", encontro: "Service hecho", renglones: [renglon("r-aceite"), renglon("r-filtro-aceite"), renglon("r-filtro-aire"), renglon("mo-service")], km: 82_000 });
    orden("a-gol", { estado: "entregado", dias: 400, mecanicoId: "m-nacho", dijo: "No arranca a la mañana", encontro: "Batería agotada", renglones: [renglon("r-bateria"), renglon("mo-revision")], km: 71_500 });
    orden("a-corsa", { estado: "entregado", dias: 122, mecanicoId: "m-seba", dijo: "Service", renglones: [renglon("r-aceite"), renglon("r-filtro-aceite"), renglon("mo-service")], km: 163_900 });
    orden("a-clio", { estado: "entregado", dias: 274, mecanicoId: "m-nacho", dijo: "Service y luces", renglones: [renglon("r-aceite"), renglon("r-lampara", 2), renglon("mo-service")], km: 132_000 });
    orden("a-cronos", { estado: "entregado", dias: 152, mecanicoId: "m-seba", dijo: "Service de los 50.000", renglones: [renglon("r-aceite"), renglon("r-filtro-aceite"), renglon("r-bujias"), renglon("mo-service")], km: 49_300 });
    orden("a-kangoo", { estado: "entregado", dias: 61, mecanicoId: "m-nacho", dijo: "Service", renglones: [renglon("r-aceite"), renglon("mo-service")], km: 188_000 });

    // Las 7 que están adentro hoy, una o más en cada estado
    orden("a-corsa", { estado: "recibido", dias: 0, mecanicoId: "m-seba", dijo: "Tira para la izquierda cuando frena" });
    orden("a-palio", { estado: "presupuestado", dias: 1, mecanicoId: "m-nacho", dijo: "Golpea adelante en los pozos", encontro: "Amortiguadores delanteros vencidos", renglones: [renglon("r-amortiguador", 2), renglon("mo-amortiguadores")] });
    orden("a-ka", { estado: "reparacion", dias: 1, mecanicoId: "m-seba", dijo: "Service completo", encontro: "Service + escobillas gastadas", renglones: [renglon("r-aceite"), renglon("r-filtro-aceite"), renglon("r-filtro-aire"), renglon("r-escobillas"), renglon("mo-service")] });
    orden("a-208", { estado: "reparacion", dias: 2, mecanicoId: "m-nacho", dijo: "Patina el embrague en las subidas", encontro: "Embrague gastado", renglones: [renglon("r-embrague"), renglon("mo-embrague")] });
    orden("a-onix", { estado: "esperando", dias: 3, mecanicoId: "m-seba", dijo: "Se calienta en el tránsito", encontro: "Pierde agua la bomba", renglones: [renglon("r-bomba"), renglon("r-refrigerante", 2), renglon("mo-bomba")] });
    orden("a-kangoo", { estado: "listo", dias: 2, mecanicoId: "m-nacho", dijo: "Ruido en la dirección", encontro: "Extremos y rótula con juego", renglones: [renglon("r-extremo", 2), renglon("r-rotula"), renglon("mo-tren")], avisado: false, km: 190_500 });
    orden("a-hilux", { estado: "listo", dias: 1, mecanicoId: "m-seba", dijo: "Frena largo", encontro: "Pastillas al límite", renglones: [renglon("r-pastillas"), renglon("r-liquido"), renglon("mo-frenos")], avisado: true });
    ordenes.filter((o) => o.estado === "listo" && o.avisado).forEach((o) => o.historial.push({ estado: "avisado", en: haceDias(0, 9), por: "Raúl" }));
    return { clientes, autos, ordenes, numero };
}

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const esDueno = (u) => u?.rol === "dueno";
    const esMecanico = (u) => u?.rol === "mecanico";
    const mecanicoDe = (u) => MECANICOS.find((m) => m.personaId === u?.id) ?? null;
    const cliente = (id) => db().clientes.find((c) => c.id === id);
    const autoDe = (id) => db().autos.find((a) => a.id === id);

    /** Puede trabajar en esta orden: el dueño en todas; el mecánico, en las suyas. */
    function exigirEnLaOrden(usuario, o) {
        exigir(esDueno(usuario) || esMecanico(usuario), "Solo alguien del taller toca las órdenes.");
        if (esMecanico(usuario)) exigir(o.mecanicoId === mecanicoDe(usuario)?.id, "Esa orden es de otro mecánico.");
    }

    /** La orden con el auto, el cliente y el total. Al mecánico le llega sin precios. */
    function armar(o, usuario) {
        const a = autoDe(o.autoId);
        const sinPrecios = esMecanico(usuario);
        return {
            ...copia(o),
            renglones: o.renglones.map((r) => (sinPrecios ? { ...copia(r), precio: undefined } : copia(r))),
            total: sinPrecios ? undefined : totalDe(o.renglones),
            auto: { ...copia(a), patenteTexto: formatoPatente(a.patente) },
            cliente: copia(cliente(a.clienteId)),
            mecanico: MECANICOS.find((m) => m.id === o.mecanicoId)?.nombre ?? "",
            estadoTexto: o.estado === "listo" ? (o.avisado ? "Listo · avisado" : "Listo · sin avisar") : ESTADOS[o.estado].texto,
            editable: EDITABLES.includes(o.estado)
        };
    }

    function pasar(usuario, o, estado) {
        o.estado = estado;
        o.historial.push({ estado, en: ahora(), por: usuario.nombre });
        guardado.persistir();
    }

    // ----- Recepción -----

    /** Qué se le hizo en una visita: los trabajos (mano de obra); si no hay, los repuestos; si no, lo que dijo el cliente. */
    const queSeHizo = (o) => {
        const mano = o.renglones.filter((r) => r.tipo === "mano").map((r) => r.nombre);
        return (mano.length ? mano : o.renglones.map((r) => r.nombre)).join(", ") || o.dijo;
    };

    /** Si la patente ya vino: el auto, el cliente y la última vez. Si no, null. */
    function buscarPatente(patente) {
        const p = normalizarPatente(patente);
        const a = db().autos.find((x) => x.patente === p);
        if (!a) return null;
        const ultima = db().ordenes.filter((o) => o.autoId === a.id && o.estado === "entregado").sort((x, y) => y.recibidaEn.localeCompare(x.recibidaEn))[0];
        const abierta = db().ordenes.find((o) => o.autoId === a.id && ABIERTOS.includes(o.estado));
        return {
            auto: { ...copia(a), patenteTexto: formatoPatente(a.patente) }, cliente: copia(cliente(a.clienteId)),
            ultima: ultima ? { fecha: diaLocalDe(ultima.recibidaEn), que: queSeHizo(ultima), km: ultima.km, meses: mesesDesde(diaLocalDe(ultima.recibidaEn)) } : null,
            abierta: abierta ? { id: abierta.id, numero: abierta.numero } : null
        };
    }

    /** "+ Entró un auto": si la patente ya vino, usa ese auto y su dueño; si no, hay que poner modelo y cliente. */
    function entroUnAuto(usuario, { patente, modelo = "", clienteNombre = "", km, nafta = "1/2", deja = "", dijo, prometida, mecanicoId = "m-seba" } = {}) {
        exigir(esDueno(usuario), "Los autos los recibe el dueño.");
        exigir(esPatente(patente), "La patente tiene que ser como ABC 123 o AB 123 CD.");
        const p = normalizarPatente(patente);
        const lo = sinPasarse(dijo, TOPES.texto, "lo que dijo el cliente");
        exigir(lo, "Anotá qué le pasa (con las palabras del cliente).");
        exigir(NAFTA.includes(nafta), "Elegí cuánta nafta tiene.");
        const dejaTexto = sinPasarse(deja, TOPES.deja, "lo que deja en el auto");
        exigir(MECANICOS.some((m) => m.id === mecanicoId), "Elegí el mecánico.");
        exigir(esFechaISO(prometida) && prometida >= fechaLocalISO(0) && prometida <= fechaLocalISO(TOPES.diasPromesa),
            `La fecha prometida tiene que ser de hoy a ${TOPES.diasPromesa} días.`);
        const n = enteroHasta(km, "Los kilómetros", { hasta: TOPES.km });
        exigir(db().ordenes.length < TOPES.ordenes, `Ya hay ${TOPES.ordenes} órdenes. Es una demo: tocá "Empezar de cero" arriba.`);
        let a = db().autos.find((x) => x.patente === p);
        if (a) {
            const abierta = db().ordenes.find((o) => o.autoId === a.id && ABIERTOS.includes(o.estado));
            exigir(!abierta, `Ese auto ya está adentro (orden ${abierta?.numero}).`);
            exigir(n >= a.km, `No puede tener menos km que la última vez (${a.km.toLocaleString("es-AR")}).`);
        } else {
            const m = sinPasarse(modelo, TOPES.nombre, "el modelo");
            const cn = sinPasarse(clienteNombre, TOPES.nombre, "el nombre del cliente");
            exigir(m, "Es la primera vez que viene: poné el modelo del auto.");
            exigir(cn, "Es la primera vez que viene: poné el nombre del cliente.");
            exigir(db().autos.length < TOPES.autos, `Ya hay ${TOPES.autos} autos. Es una demo: tocá "Empezar de cero" arriba.`);
            const c = { id: nuevoId("c"), nombre: cn };
            db().clientes.push(c);
            a = { id: nuevoId("a"), patente: p, modelo: m, anio: null, clienteId: c.id, km: n, ultimoService: null, llamadoEn: null };
            db().autos.push(a);
        }
        a.km = n;
        db().numero += 1;
        const o = {
            id: nuevoId("o"), numero: db().numero, autoId: a.id, estado: "recibido", mecanicoId, dijo: lo, encontro: "", renglones: [], notas: "",
            km: n, nafta, deja: dejaTexto, prometida, recibidaEn: ahora(), avisado: false, historial: [{ estado: "recibido", en: ahora(), por: usuario.nombre }]
        };
        db().ordenes.push(o);
        guardado.persistir();
        return armar(o, usuario);
    }

    // ----- Pizarra y orden -----

    /** Los autos que están adentro, por estado (el mecánico ve solo los suyos), y los contadores de arriba. */
    function pizarra(usuario) {
        const mio = mecanicoDe(usuario);
        const abiertas = db().ordenes.filter((o) => ABIERTOS.includes(o.estado) && (!esMecanico(usuario) || o.mecanicoId === mio?.id))
            .sort((a, b) => a.recibidaEn.localeCompare(b.recibidaEn)).map((o) => armar(o, usuario));
        return {
            grupos: ABIERTOS.map((estado) => ({ estado, texto: ESTADOS[estado].texto, ordenes: abiertas.filter((o) => o.estado === estado) })),
            contadores: {
                adentro: abiertas.length,
                reparacion: abiertas.filter((o) => o.estado === "reparacion").length,
                esperando: abiertas.filter((o) => o.estado === "esperando").length,
                sinAvisar: abiertas.filter((o) => o.estado === "listo" && !o.avisado).length
            }
        };
    }

    function orden(id, usuario) {
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigirEnLaOrden(usuario, o);
        return armar(o, usuario);
    }

    function anotar(usuario, id, { encontro, notas } = {}) {
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigirEnLaOrden(usuario, o);
        if (encontro !== undefined) o.encontro = sinPasarse(encontro, TOPES.texto, "lo que encontró");
        if (notas !== undefined) o.notas = sinPasarse(notas, TOPES.texto, "las notas");
        guardado.persistir();
        return armar(o, usuario);
    }

    /** Sumar un repuesto o mano de obra al presupuesto (el mecánico, solo repuestos). Si ya estaba, suma la cantidad. */
    function agregarRenglon(usuario, id, { itemId, cantidad = 1 } = {}) {
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigirEnLaOrden(usuario, o);
        exigir(EDITABLES.includes(o.estado), "Esa orden ya no se puede cambiar.");
        const item = ITEMS.find((i) => i.id === itemId);
        exigir(item, "Elegí un repuesto o un trabajo de la lista.");
        exigir(item.tipo === "repuesto" || esDueno(usuario), "La mano de obra la pone el dueño.");
        const n = enteroHasta(cantidad, "La cantidad", { desde: 1, hasta: TOPES.cantidad });
        const ya = o.renglones.find((r) => r.itemId === itemId);
        if (ya) {
            ya.cantidad = enteroHasta(ya.cantidad + n, "La cantidad", { desde: 1, hasta: TOPES.cantidad });
        } else {
            exigir(o.renglones.length < TOPES.renglones, `Un presupuesto puede tener hasta ${TOPES.renglones} renglones.`);
            o.renglones.push({ id: nuevoId("rg"), tipo: item.tipo, itemId, nombre: item.nombre, cantidad: n, precio: item.precio });
        }
        guardado.persistir();
        return armar(o, usuario);
    }

    function quitarRenglon(usuario, id, renglonId) {
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigirEnLaOrden(usuario, o);
        exigir(EDITABLES.includes(o.estado), "Esa orden ya no se puede cambiar.");
        const r = buscar(o.renglones, renglonId, "Ese renglón ya no está.");
        exigir(r.tipo === "repuesto" || esDueno(usuario), "La mano de obra la saca el dueño.");
        o.renglones = o.renglones.filter((x) => x.id !== renglonId);
        guardado.persistir();
        return armar(o, usuario);
    }

    function cambiarPrecio(usuario, id, renglonId, precio) {
        exigir(esDueno(usuario), "Los precios los pone el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(EDITABLES.includes(o.estado), "Esa orden ya no se puede cambiar.");
        buscar(o.renglones, renglonId, "Ese renglón ya no está").precio = enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio });
        guardado.persistir();
        return armar(o, usuario);
    }

    // ----- Pasos de una orden -----

    /** El texto del presupuesto para mandar (en la demo se copia). */
    function textoPresupuesto(o) {
        const a = autoDe(o.autoId);
        const c = cliente(a.clienteId);
        const lineas = o.renglones.map((r) => `- ${r.nombre}${r.cantidad > 1 ? ` x${r.cantidad}` : ""}: ${pesos(r.cantidad * r.precio)}`);
        return `Hola ${c.nombre.split(" ")[0]}! Te paso el presupuesto del ${a.modelo} ${formatoPatente(a.patente)}:\n${lineas.join("\n")}\nTotal: ${pesos(totalDe(o.renglones))}\n¿Lo hacemos?`;
    }

    function mandarPresupuesto(usuario, id) {
        exigir(esDueno(usuario), "El presupuesto lo manda el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(o.estado === "recibido" || o.estado === "presupuestado", "Esa orden ya pasó el presupuesto.");
        exigir(o.renglones.length, "El presupuesto está vacío: sumá repuestos o mano de obra.");
        if (o.estado === "recibido") pasar(usuario, o, "presupuestado");
        return { orden: armar(o, usuario), mensaje: textoPresupuesto(o) };
    }

    function aprobar(usuario, id) {
        exigir(esDueno(usuario), "El que anota que el cliente aprobó es el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(o.estado === "presupuestado", "Primero hay que mandar el presupuesto.");
        pasar(usuario, o, "reparacion");
        return armar(o, usuario);
    }

    /** Pasos del mecánico (o del dueño): falta repuesto, llegó el repuesto, terminado. */
    function paso(usuario, id, { desde, hacia }) {
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigirEnLaOrden(usuario, o);
        exigir(o.estado === desde, `Para eso la orden tiene que estar "${ESTADOS[desde].texto}".`);
        pasar(usuario, o, hacia);
        return armar(o, usuario);
    }
    const faltaRepuesto = (u, id) => paso(u, id, { desde: "reparacion", hacia: "esperando" });
    const llegoRepuesto = (u, id) => paso(u, id, { desde: "esperando", hacia: "reparacion" });
    const terminado = (u, id) => paso(u, id, { desde: "reparacion", hacia: "listo" });

    function avisarListo(usuario, id) {
        exigir(esDueno(usuario), "Al cliente le avisa el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(o.estado === "listo", "Todavía no está listo.");
        const a = autoDe(o.autoId);
        const c = cliente(a.clienteId);
        if (!o.avisado) {
            o.avisado = true;
            o.historial.push({ estado: "avisado", en: ahora(), por: usuario.nombre });
            guardado.persistir();
        }
        return {
            orden: armar(o, usuario),
            mensaje: `Hola ${c.nombre.split(" ")[0]}! Tu ${a.modelo} ${formatoPatente(a.patente)} ya está listo para retirar. Te esperamos de 8 a 18 en ${NEGOCIO}. Total: ${pesos(totalDe(o.renglones))}.`
        };
    }

    /** Entregado: queda en el historial del auto (y si llevaba service, cuenta como el último service). */
    function entregar(usuario, id) {
        exigir(esDueno(usuario), "El auto lo entrega el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(o.estado === "listo", "Todavía no está listo.");
        const a = autoDe(o.autoId);
        if (o.renglones.some((r) => MANO_DE_OBRA.find((m) => m.id === r.itemId)?.esService)) a.ultimoService = { fecha: fechaLocalISO(0), km: o.km };
        a.llamadoEn = null;
        pasar(usuario, o, "entregado");
        return armar(o, usuario);
    }

    function anular(usuario, id) {
        exigir(esDueno(usuario), "Las órdenes las anula el dueño.");
        const o = buscar(db().ordenes, id, "Esa orden no existe.");
        exigir(ABIERTOS.includes(o.estado), "Esa orden ya está cerrada.");
        pasar(usuario, o, "anulado");
        return armar(o, usuario);
    }

    // ----- Autos, clientes y "Para llamar" -----

    function armarAuto(a) {
        const c = cliente(a.clienteId);
        const visitas = db().ordenes.filter((o) => o.autoId === a.id).sort((x, y) => y.recibidaEn.localeCompare(x.recibidaEn));
        return {
            ...copia(a), patenteTexto: formatoPatente(a.patente), cliente: copia(c),
            visitas: visitas.length, abierta: visitas.find((o) => ABIERTOS.includes(o.estado))?.id ?? null,
            ultimaVisita: visitas[0] ? diaLocalDe(visitas[0].recibidaEn) : null
        };
    }

    /** Buscar por patente (con o sin espacios) o por nombre del cliente. */
    function listarAutos({ texto = "" } = {}) {
        const p = normalizarPatente(texto);
        const lista = db().autos.map(armarAuto).sort((a, b) => (b.ultimaVisita ?? "").localeCompare(a.ultimaVisita ?? ""));
        const porPatente = p.length >= 2 ? lista.filter((a) => a.patente.includes(p)) : [];
        // El cliente y el modelo perdonan errores ("jorje", "corza"): lo más parecido va primero
        return [...porPatente, ...filtrarPorTexto(lista, texto, (a) => `${a.cliente.nombre} ${a.modelo}`).filter((a) => !porPatente.includes(a))];
    }

    function auto(id, usuario) {
        exigir(esDueno(usuario) || esMecanico(usuario), "Solo alguien del taller ve los autos.");
        const a = buscar(db().autos, id, "Ese auto no existe.");
        return {
            ...armarAuto(a),
            // puedeAbrir: el mecánico ve las órdenes de otro en el historial, pero no las abre (no tiene permiso)
            historial: db().ordenes.filter((o) => o.autoId === id).sort((x, y) => y.recibidaEn.localeCompare(x.recibidaEn))
                .map((o) => ({ ...armar(o, usuario), puedeAbrir: esDueno(usuario) || o.mecanicoId === mecanicoDe(usuario)?.id }))
        };
    }

    /** Los que tienen el service vencido (más de 6 meses o 10.000 km) y no están en el taller. */
    function paraLlamar() {
        return db().autos.map(armarAuto).filter((a) => a.ultimoService && !a.abierta).map((a) => {
            const meses = mesesDesde(a.ultimoService.fecha);
            const km = a.km - a.ultimoService.km;
            const motivo = meses >= SERVICE_MESES ? `Último service hace ${meses} meses` : km >= SERVICE_KM ? `${km.toLocaleString("es-AR")} km desde el último service` : null;
            return motivo ? { ...a, motivo, meses, kmDesde: km } : null;
        }).filter(Boolean).sort((a, b) => b.meses - a.meses);
    }

    function llamar(usuario, autoId) {
        exigir(esDueno(usuario), "A los clientes los llama el dueño.");
        const a = buscar(db().autos, autoId, "Ese auto no existe.");
        if (a.llamadoEn) exigir((Date.now() - new Date(a.llamadoEn)) / 864e5 >= RELLAMAR_DIAS, "A ese cliente ya le escribiste hace poco: esperá unos días.");
        a.llamadoEn = ahora();
        guardado.persistir();
        const c = cliente(a.clienteId);
        const meses = mesesDesde(a.ultimoService.fecha);
        return {
            auto: armarAuto(a),
            mensaje: `Hola ${c.nombre.split(" ")[0]}! Al ${a.modelo} ${formatoPatente(a.patente)} ya le toca el service (el último fue hace ${meses} ${meses === 1 ? "mes" : "meses"}). ¿Te reservo un lugar esta semana?`
        };
    }

    return {
        guardado,
        buscarPatente, entroUnAuto, pizarra, orden, anotar, agregarRenglon, quitarRenglon, cambiarPrecio,
        mandarPresupuesto, aprobar, faltaRepuesto, llegoRepuesto, terminado, avisarListo, entregar, anular,
        listarAutos, auto, paraLlamar, llamar,
        mecanicoDe
    };
}
