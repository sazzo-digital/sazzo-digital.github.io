// ============================================
// Datos de Sazzo Perfumería (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una perfumería inventada: 20 perfumes con nombres de fantasía (nada de marcas reales), cada uno en 4 presentaciones
// (decant 5 ml y 10 ml, que salen de una botella madre que se mide en ml, y frascos de 50 y 100 ml), clientas con su
// cumpleaños y los pedidos de los últimos meses. El pedido sigue: Nuevo → Preparado (descuenta el stock) → Entregado.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra (se cancela) y se
// devuelven copias. Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=b42f3ed3fa";
import { enteroHasta } from "../kit/js/topes.js?v=b42f3ed3fa";
import { fechaLocalISO, diaLocalDe } from "../kit/js/fechas.js?v=b42f3ed3fa";
import { MARCA, NEGOCIO } from "./marca.js?v=b42f3ed3fa";

export const VERSION_DATOS = 3;

export const TOPES = {
    cantidad: 10, // de una misma presentación en un pedido
    renglones: 20,
    abiertos: 3, // pedidos sin entregar de una misma clienta
    frascos: 999,
    ml: 5_000, // de una botella madre
    pedidos: 400
};

export const MADRE_POCO_ML = 30; // menos de 30 ml en la botella madre: "hay que pedir"

export const FAMILIAS = {
    floral: { texto: "Floral", color: "#e879a6" },
    dulce: { texto: "Dulce", color: "#d97706" },
    citrico: { texto: "Cítrico", color: "#eab308" },
    amaderado: { texto: "Amaderado", color: "#92400e" },
    fresco: { texto: "Fresco", color: "#0ea5e9" }
};
export const PARA = { mujer: "Para ella", hombre: "Para él", unisex: "Para todos" };
export const MOMENTOS = { dia: "De día", noche: "De noche", ambos: "De día y de noche" };

export const PRESENTACIONES = {
    d5: { texto: "Decant 5 ml", ml: 5, decant: true },
    d10: { texto: "Decant 10 ml", ml: 10, decant: true },
    f50: { texto: "Frasco 50 ml", ml: 50, decant: false },
    f100: { texto: "Frasco 100 ml", ml: 100, decant: false }
};

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

// [id, nombre, familia, para, momento, salida, corazón, fondo, precio del frasco de 50 ml, frascos 50, frascos 100, ml en la madre]
const PERFUMES = [
    ["p-azahar", "Bruma de Azahar", "floral", "mujer", "dia", "Azahar", "Jazmín", "Almizcle blanco", 78_000, 4, 2, 180],
    ["p-vainilla", "Vainilla Nocturna", "dulce", "mujer", "noche", "Pera", "Vainilla", "Haba tonka", 92_000, 3, 1, 26],
    ["p-cuero", "Cuero y Tabaco", "amaderado", "hombre", "noche", "Pimienta negra", "Tabaco", "Cuero", 110_000, 2, 1, 140],
    ["p-lima", "Lima Salvaje", "citrico", "unisex", "dia", "Lima", "Albahaca", "Vetiver", 69_000, 5, 2, 220],
    ["p-peonia", "Jardín de Peonías", "floral", "mujer", "ambos", "Frambuesa", "Peonía", "Rosa", 84_000, 3, 2, 95],
    ["p-madera", "Madera Azul", "amaderado", "hombre", "ambos", "Bergamota", "Cedro", "Sándalo", 98_000, 4, 1, 160],
    ["p-pimienta", "Pimienta Rosa", "dulce", "unisex", "noche", "Pimienta rosa", "Iris", "Ámbar", 105_000, 1, 0, 70],
    ["p-te", "Té Blanco", "fresco", "unisex", "dia", "Té blanco", "Jengibre", "Almizcle", 65_000, 6, 3, 240],
    ["p-ambar", "Ámbar Dorado", "dulce", "mujer", "noche", "Mandarina", "Ámbar", "Vainilla", 99_000, 2, 1, 110],
    ["p-higo", "Higo Verde", "fresco", "unisex", "dia", "Hoja de higo", "Coco", "Cedro", 88_000, 0, 1, 60],
    ["p-brisa", "Brisa Marina", "fresco", "hombre", "dia", "Notas marinas", "Lavanda", "Musgo", 72_000, 5, 2, 200],
    ["p-rosa", "Rosa de Noche", "floral", "mujer", "noche", "Lichi", "Rosa negra", "Pachulí", 96_000, 2, 1, 85],
    ["p-cafe", "Café y Cacao", "dulce", "hombre", "noche", "Café", "Cacao", "Vainilla", 101_000, 3, 1, 130],
    ["p-pomelo", "Pomelo Rosado", "citrico", "mujer", "dia", "Pomelo", "Grosella", "Almizcle", 67_000, 4, 2, 150],
    ["p-vetiver", "Vetiver Seco", "amaderado", "unisex", "ambos", "Limón", "Vetiver", "Ámbar gris", 94_000, 2, 1, 120],
    ["p-coco", "Coco y Sal", "fresco", "mujer", "dia", "Sal marina", "Coco", "Vainilla", 70_000, 3, 1, 100],
    ["p-bergamota", "Bergamota Clásica", "citrico", "hombre", "dia", "Bergamota", "Neroli", "Musgo de roble", 75_000, 4, 2, 175],
    ["p-orquidea", "Orquídea Negra", "floral", "unisex", "noche", "Trufa", "Orquídea", "Incienso", 115_000, 1, 1, 45],
    ["p-caramelo", "Caramelo Salado", "dulce", "unisex", "ambos", "Sal", "Caramelo", "Haba tonka", 86_000, 3, 1, 90],
    ["p-incienso", "Incienso y Mirra", "amaderado", "unisex", "noche", "Cardamomo", "Incienso", "Mirra", 108_000, 2, 0, 65]
];

/** Los precios de cada presentación salen del frasco de 50 ml (redondeados a $500). */
export function preciosDe(precio50) {
    const r = (n) => Math.round(n / 500) * 500;
    return { d5: r(precio50 * 0.13), d10: r(precio50 * 0.24), f50: precio50, f100: r(precio50 * 1.65) };
}

/** Cuánto hay de una presentación: frascos (unidades) o, para un decant, cuántos salen de la botella madre. */
export function disponible(p, presentacion) {
    const pr = PRESENTACIONES[presentacion];
    if (!pr) return 0;
    if (pr.decant) return Math.floor(p.ml / pr.ml);
    return presentacion === "f50" ? p.stock50 : p.stock100;
}

/** "Recomendame uno": puntaje según para quién, de día o de noche y qué le gusta. */
export function puntaje(p, { para, momento, gusto }) {
    let n = 0;
    if (p.familia === gusto) n += 3;
    if (p.para === para) n += 2;
    else if (p.para === "unisex") n += 1;
    if (p.momento === momento) n += 1;
    else if (p.momento === "ambos") n += 0.5;
    return n;
}

const CLIENTAS = [
    ["c-julieta", "Julieta", 4], ["c-flor", "Florencia", 0], ["c-romi", "Romina", 0], ["c-sol", "Sol", 1], ["c-agos", "Agostina", 2],
    ["c-meli", "Melina", 3], ["c-pau", "Paula", 5], ["c-ceci", "Cecilia", 6], ["c-noe", "Noelia", 7], ["c-vale", "Valentina", 8],
    ["c-luli", "Luciana", 9], ["c-ines", "Inés", 10], ["c-tati", "Tatiana", 11], ["c-mica", "Micaela", 1], ["c-bel", "Belén", 2]
];

/** Clienta → persona que entra a la demo. */
export const CLIENTA_DE = { "u-clienta": "c-julieta" };

function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const momento = (dias, hora = 17) => {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(hora, 0, 0, 0);
    // Nunca en el futuro: de madrugada, "hoy a las 11" todavía no pasó (el pedido de ejemplo quedaba más nuevo que uno
    // recién mandado). Se corre a unos minutos atrás, en el mismo orden (11 antes que 13, 13 antes que 18).
    if (d.getTime() > Date.now()) return new Date(Date.now() - (24 - hora) * 60000).toISOString();
    return d.toISOString();
};

export function semilla() {
    const azar = azarFijo(3);
    const perfumes = PERFUMES.map(([id, nombre, familia, para, momentoUso, salida, corazon, fondo, precio50, stock50, stock100, ml]) => ({
        id, nombre, familia, para, momento: momentoUso, notas: { salida, corazon, fondo }, precios: preciosDe(precio50), stock50, stock100, ml
    }));
    // Cumpleaños: el número es cuántos meses después del actual (0 = este mes)
    const hoy = new Date();
    const clientas = CLIENTAS.map(([id, nombre, enMeses], i) => {
        const mes = ((hoy.getMonth() + enMeses) % 12) + 1;
        const dia = 3 + ((i * 7) % 24);
        return { id, nombre, cumple: `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`, saludadaEn: null };
    });

    // Pedidos de los últimos 4 meses (entregados), uno preparado y uno nuevo de otra clienta
    const pedidos = [];
    let numero = 200;
    const renglon = (p, presentacion, cantidad = 1) => ({ perfumeId: p.id, nombre: p.nombre, presentacion, cantidad, precio: p.precios[presentacion] });
    const pedido = (clientaId, renglones, estado, dias) => {
        const historial = [{ estado: "nuevo", en: momento(dias, 11) }];
        if (estado !== "nuevo") historial.push({ estado: "preparado", en: momento(dias, 13) });
        if (estado === "entregado") historial.push({ estado: "entregado", en: momento(dias, 18) });
        pedidos.push({ id: `pd-${++numero}`, numero, clientaId, renglones, estado, avisado: estado === "entregado", visto: estado !== "nuevo", creadoEn: momento(dias, 11), historial });
    };
    clientas.forEach((c, i) => {
        const veces = 1 + Math.floor(azar() * 3);
        for (let v = 0; v < veces; v++) {
            const p = perfumes[Math.floor(azar() * perfumes.length)];
            const pres = azar() < 0.6 ? (azar() < 0.5 ? "d5" : "d10") : "f50";
            pedido(c.id, [renglon(p, pres)], "entregado", 3 + i * 4 + v * 30);
        }
    });
    pedido("c-flor", [renglon(perfumes[4], "d10"), renglon(perfumes[7], "d5")], "preparado", 0);
    pedido("c-romi", [renglon(perfumes[5], "f50")], "nuevo", 0);
    return { perfumes, clientas, pedidos, numero };
}

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const esDuena = (u) => u?.rol === "duena";
    const esClienta = (u) => u?.rol === "cliente";
    const clientaDe = (u) => db().clientas.find((c) => c.id === CLIENTA_DE[u?.id]);
    const nombreDe = (id) => db().clientas.find((c) => c.id === id)?.nombre ?? "Clienta";

    const armarPerfume = (p) => ({
        ...copia(p), familiaInfo: FAMILIAS[p.familia], paraTexto: PARA[p.para], momentoTexto: MOMENTOS[p.momento],
        disponible: Object.fromEntries(Object.keys(PRESENTACIONES).map((k) => [k, disponible(p, k)])),
        desde: p.precios.d5
    });
    const totalDe = (renglones) => renglones.reduce((t, r) => t + r.precio * r.cantidad, 0);
    const armarPedido = (o) => ({
        ...copia(o), clienta: nombreDe(o.clientaId), total: totalDe(o.renglones), nuevo: !o.visto && o.estado === "nuevo",
        renglones: o.renglones.map((r) => ({ ...r, presentacionTexto: PRESENTACIONES[r.presentacion].texto }))
    });

    // ----- Catálogo -----

    function listarPerfumes({ familia = null, para = null, texto = "" } = {}) {
        const t = String(texto).trim().toLowerCase();
        return db().perfumes
            .filter((p) => (!familia || p.familia === familia) && (!para || p.para === para || p.para === "unisex")
                && (!t || `${p.nombre} ${p.notas.salida} ${p.notas.corazon} ${p.notas.fondo}`.toLowerCase().includes(t)))
            .map(armarPerfume);
    }

    const perfume = (id) => armarPerfume(buscar(db().perfumes, id, "Ese perfume no existe."));

    /** Los 3 que mejor van (con algo para vender). */
    function recomendar({ para, momento: m, gusto }) {
        exigir(PARA[para], "Elegí para quién es.");
        exigir(MOMENTOS[m] && m !== "ambos", "Elegí si es para el día o para la noche.");
        exigir(FAMILIAS[gusto], "Elegí qué te gusta.");
        return db().perfumes
            .filter((p) => Object.keys(PRESENTACIONES).some((k) => disponible(p, k) > 0))
            .map((p) => ({ p, n: puntaje(p, { para, momento: m, gusto }) }))
            .sort((a, b) => b.n - a.n || a.p.nombre.localeCompare(b.p.nombre, "es"))
            .slice(0, 3).map(({ p }) => armarPerfume(p));
    }

    /** Revisa los renglones (presentación, cantidad, que haya) y arma los del pedido con su precio. */
    function revisarRenglones(items) {
        exigir(Array.isArray(items) && items.length, "Tu pedido está vacío.");
        exigir(items.length <= TOPES.renglones, `Un pedido puede tener hasta ${TOPES.renglones} cosas distintas.`);
        const claves = items.map((i) => `${i.perfumeId}/${i.presentacion}`);
        exigir(new Set(claves).size === claves.length, "Cada perfume y presentación va una sola vez (cambiá la cantidad).");
        // Los decants de un mismo perfume salen de la misma botella madre: se suman los ml
        const mlPedidos = {};
        return items.map(({ perfumeId, presentacion, cantidad }) => {
            const p = buscar(db().perfumes, perfumeId, "Uno de los perfumes ya no existe.");
            const pr = PRESENTACIONES[presentacion];
            exigir(pr, "Elegí la presentación.");
            const n = enteroHasta(cantidad, `La cantidad de ${p.nombre}`, { desde: 1, hasta: TOPES.cantidad });
            if (pr.decant) {
                mlPedidos[p.id] = (mlPedidos[p.id] ?? 0) + pr.ml * n;
                exigir(mlPedidos[p.id] <= p.ml, `De ${p.nombre} quedan ${p.ml} ml para decants.`);
            } else {
                exigir(n <= disponible(p, presentacion), disponible(p, presentacion) ? `De ${p.nombre} (${pr.texto}) quedan ${disponible(p, presentacion)}.` : `No hay ${p.nombre} en ${pr.texto.toLowerCase()}.`);
            }
            return { perfumeId: p.id, nombre: p.nombre, presentacion, cantidad: n, precio: p.precios[presentacion] };
        });
    }

    const armarCarrito = (items) => {
        const renglones = revisarRenglones(items);
        return { renglones: renglones.map((r) => ({ ...r, presentacionTexto: PRESENTACIONES[r.presentacion].texto })), total: totalDe(renglones) };
    };

    /** La clienta manda su pedido (en la versión real, por WhatsApp; en la demo le llega a la dueña). */
    function mandarPedido(usuario, items) {
        exigir(esClienta(usuario), "Los pedidos los mandan las clientas.");
        const c = clientaDe(usuario);
        exigir(c, "No te encontramos en la lista de clientas.");
        const abiertos = db().pedidos.filter((o) => o.clientaId === c.id && (o.estado === "nuevo" || o.estado === "preparado"));
        exigir(abiertos.length < TOPES.abiertos, `Ya tenés ${TOPES.abiertos} pedidos sin retirar: es el máximo.`);
        exigir(db().pedidos.length < TOPES.pedidos, `Ya hay ${TOPES.pedidos} pedidos. Es una demo: tocá "Empezar de cero" arriba.`);
        const renglones = revisarRenglones(items);
        db().numero += 1;
        const o = { id: nuevoId("pd"), numero: db().numero, clientaId: c.id, renglones, estado: "nuevo", avisado: false, visto: false, creadoEn: ahora(), historial: [{ estado: "nuevo", en: ahora() }] };
        db().pedidos.push(o);
        guardado.persistir();
        return armarPedido(o);
    }

    function misPedidos(usuario) {
        const c = esClienta(usuario) ? clientaDe(usuario) : null;
        return db().pedidos.filter((o) => o.clientaId === c?.id).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 10).map(armarPedido);
    }

    // ----- Para la dueña -----

    /** Los pedidos por estado (los nuevos primero) y el día: cuántos llegaron y lo vendido (entregados). */
    function pedidos(usuario) {
        exigir(esDuena(usuario), "Los pedidos los ve la dueña.");
        const hoy = fechaLocalISO(0);
        const todos = db().pedidos.map(armarPedido);
        const deHoy = (o, estado) => o.historial.some((h) => h.estado === estado && diaLocalDe(h.en) === hoy);
        return {
            nuevos: todos.filter((o) => o.estado === "nuevo").sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
            preparados: todos.filter((o) => o.estado === "preparado"),
            entregadosHoy: todos.filter((o) => o.estado === "entregado" && deHoy(o, "entregado")),
            dia: {
                llegaron: todos.filter((o) => deHoy(o, "nuevo")).length,
                vendido: todos.filter((o) => o.estado === "entregado" && deHoy(o, "entregado")).reduce((t, o) => t + o.total, 0),
                porRetirar: todos.filter((o) => o.estado === "preparado").reduce((t, o) => t + o.total, 0)
            }
        };
    }

    function pedidoDe(usuario, id) {
        exigir(esDuena(usuario), "Los pedidos los toca la dueña.");
        return buscar(db().pedidos, id, "Ese pedido no existe.");
    }

    function pasar(o, estado) {
        o.estado = estado;
        o.visto = true;
        o.historial.push({ estado, en: ahora() });
        guardado.persistir();
        return armarPedido(o);
    }

    /** Preparado: descuenta el stock (los frascos, o los ml de la botella madre si son decants). O todo o nada. */
    function preparar(usuario, id) {
        const o = pedidoDe(usuario, id);
        exigir(o.estado === "nuevo", "Ese pedido ya está preparado.");
        const mlPedidos = {};
        o.renglones.forEach((r) => {
            const p = buscar(db().perfumes, r.perfumeId, "Uno de los perfumes ya no existe.");
            const pr = PRESENTACIONES[r.presentacion];
            if (pr.decant) {
                mlPedidos[p.id] = (mlPedidos[p.id] ?? 0) + pr.ml * r.cantidad;
                exigir(mlPedidos[p.id] <= p.ml, `De ${p.nombre} quedan solo ${p.ml} ml: no alcanza para este pedido.`);
            } else {
                exigir(r.cantidad <= disponible(p, r.presentacion), `De ${p.nombre} (${pr.texto}) no alcanza para este pedido.`);
            }
        });
        o.renglones.forEach((r) => {
            const p = db().perfumes.find((x) => x.id === r.perfumeId);
            const pr = PRESENTACIONES[r.presentacion];
            if (pr.decant) p.ml -= pr.ml * r.cantidad;
            else if (r.presentacion === "f50") p.stock50 -= r.cantidad;
            else p.stock100 -= r.cantidad;
        });
        return pasar(o, "preparado");
    }

    function avisarListo(usuario, id) {
        const o = pedidoDe(usuario, id);
        exigir(o.estado === "preparado", "Primero hay que prepararlo.");
        if (!o.avisado) {
            o.avisado = true;
            o.historial.push({ estado: "avisado", en: ahora() });
            guardado.persistir();
        }
        return {
            pedido: armarPedido(o),
            mensaje: `Hola ${nombreDe(o.clientaId)}! Tu pedido ya está listo para retirar en ${NEGOCIO}: ${o.renglones.map((r) => `${r.nombre} (${PRESENTACIONES[r.presentacion].texto.toLowerCase()})`).join(", ")}. Total: ${pesos(totalDe(o.renglones))}. ¡Te esperamos!`
        };
    }

    function entregar(usuario, id) {
        const o = pedidoDe(usuario, id);
        exigir(o.estado === "preparado", "Primero hay que prepararlo.");
        return pasar(o, "entregado");
    }

    /** Cancelar: si ya estaba preparado, el stock vuelve. */
    function cancelar(usuario, id) {
        const o = pedidoDe(usuario, id);
        exigir(o.estado === "nuevo" || o.estado === "preparado", "Ese pedido ya está cerrado.");
        if (o.estado === "preparado") {
            o.renglones.forEach((r) => {
                const p = db().perfumes.find((x) => x.id === r.perfumeId);
                const pr = PRESENTACIONES[r.presentacion];
                if (!p) return;
                if (pr.decant) p.ml += pr.ml * r.cantidad;
                else if (r.presentacion === "f50") p.stock50 += r.cantidad;
                else p.stock100 += r.cantidad;
            });
        }
        return pasar(o, "cancelado");
    }

    // ----- Stock -----

    /** Cada perfume con sus frascos y su botella madre, y si hay que pedir. */
    function stock(usuario) {
        exigir(esDuena(usuario), "El stock lo ve la dueña.");
        return db().perfumes.map((p) => {
            const pedir = [];
            if (p.ml < MADRE_POCO_ML) pedir.push("botella madre");
            if (p.stock50 === 0) pedir.push("frasco de 50 ml");
            if (p.stock100 === 0) pedir.push("frasco de 100 ml");
            return { ...armarPerfume(p), pedir };
        }).sort((a, b) => b.pedir.length - a.pedir.length || a.nombre.localeCompare(b.nombre, "es"));
    }

    function corregirStock(usuario, perfumeId, { stock50, stock100, ml } = {}) {
        exigir(esDuena(usuario), "El stock lo cambia la dueña.");
        const p = buscar(db().perfumes, perfumeId, "Ese perfume no existe.");
        const a = stock50 === undefined ? p.stock50 : enteroHasta(stock50, "Los frascos de 50 ml", { hasta: TOPES.frascos });
        const b = stock100 === undefined ? p.stock100 : enteroHasta(stock100, "Los frascos de 100 ml", { hasta: TOPES.frascos });
        const c = ml === undefined ? p.ml : enteroHasta(ml, "Los ml de la botella madre", { hasta: TOPES.ml });
        p.stock50 = a;
        p.stock100 = b;
        p.ml = c;
        guardado.persistir();
        return armarPerfume(p);
    }

    // ----- Clientas -----

    function armarClienta(c) {
        const suyos = db().pedidos.filter((o) => o.clientaId === c.id && o.estado === "entregado");
        const cuantos = {};
        suyos.forEach((o) => o.renglones.forEach((r) => (cuantos[r.nombre] = (cuantos[r.nombre] ?? 0) + r.cantidad)));
        const favorito = Object.entries(cuantos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const ultima = suyos.map((o) => o.creadoEn).sort().at(-1) ?? null;
        const [mes, dia] = c.cumple.split("-").map(Number);
        return { ...copia(c), compras: suyos.length, favorito, ultima: ultima ? diaLocalDe(ultima) : null, cumpleMes: mes, cumpleDia: dia };
    }

    function clientas(usuario, { esteMes = false } = {}) {
        exigir(esDuena(usuario), "Las clientas las ve la dueña.");
        const mes = new Date().getMonth() + 1;
        const lista = db().clientas.map(armarClienta);
        return esteMes
            ? lista.filter((c) => c.cumpleMes === mes).sort((a, b) => a.cumpleDia - b.cumpleDia)
            : lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }

    /** El saludo de cumpleaños (para copiar), una vez por año. */
    function saludar(usuario, id) {
        exigir(esDuena(usuario), "El saludo lo manda la dueña.");
        const c = buscar(db().clientas, id, "Esa clienta no existe.");
        const anio = new Date().getFullYear();
        exigir(!c.saludadaEn || new Date(c.saludadaEn).getFullYear() < anio, `A ${c.nombre} ya la saludaste este año.`);
        c.saludadaEn = ahora();
        guardado.persistir();
        return { clienta: armarClienta(c), mensaje: `¡Feliz cumple, ${c.nombre}! Para festejar, en ${NEGOCIO} te espera un regalo en tu próxima compra. ¡Que lo disfrutes!` };
    }

    return {
        guardado,
        listarPerfumes, perfume, recomendar, armarCarrito, mandarPedido, misPedidos,
        pedidos, preparar, avisarListo, entregar, cancelar,
        stock, corregirStock, clientas, saludar
    };
}
