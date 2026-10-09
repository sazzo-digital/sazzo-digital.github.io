// ============================================
// Datos de Sazzo Flota (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una distribuidora inventada con flota mezclada. El estado de cada vehículo NO se guarda: sale de sus problemas
// (uno tomado por el mecánico → "en el taller"; uno avisado → "con problema"; ninguno abierto → "andando").
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=5ebf28c8f8";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=5ebf28c8f8";
import { fechaLocalISO, diasHasta } from "../kit/js/fechas.js?v=5ebf28c8f8";
import { MARCA, PERSONAS } from "./marca.js?v=5ebf28c8f8";

export const VERSION_DATOS = 2;

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    comentario: 200, // letras del comentario del chofer
    nota: 200, // letras de la nota del mecánico al cerrar
    km: 1_500_000, // kilometraje máximo de un vehículo
    cantidad: 20, // repuestos de un mismo tipo usados en un arreglo
    abiertos: 30 // problemas sin arreglar en toda la flota (alguien aburrido apretando "Enviar")
};

export const SERVICE_CERCA_KM = 1000; // desde cuántos km antes del service se avisa
export const PAPEL_POR_VENCER_DIAS = 15; // desde cuántos días antes del vencimiento se avisa

// ---------- Catálogos fijos ----------
export const TIPOS_PROBLEMA = [
    { id: "frenos", texto: "Frenos", icono: "ti-disc" },
    { id: "cubiertas", texto: "Cubiertas", icono: "ti-wheel" },
    { id: "luces", texto: "Luces", icono: "ti-bulb" },
    { id: "motor", texto: "Motor", icono: "ti-engine" },
    { id: "ruido", texto: "Ruido raro", icono: "ti-volume" },
    { id: "otro", texto: "Otro", icono: "ti-dots" }
];

export const URGENCIAS = [
    { id: "parar", texto: "Tengo que parar", icono: "ti-hand-stop" },
    { id: "seguir", texto: "Puedo seguir", icono: "ti-road" }
];

export const TIPOS_VEHICULO = {
    camion: { texto: "Camión", icono: "ti-truck", articulo: "el" },
    utilitario: { texto: "Utilitario", icono: "ti-truck-delivery", articulo: "el" },
    camioneta: { texto: "Camioneta", icono: "ti-car-suv", articulo: "la" },
    moto: { texto: "Moto", icono: "ti-motorbike", articulo: "la" }
};

/** "el Utilitario 7", "la Moto 8" (con `de`: "del Utilitario 7", "de la Moto 8"). */
export function conArticulo(nombre, tipo, de = false) {
    const art = TIPOS_VEHICULO[tipo]?.articulo ?? "el";
    return `${de ? (art === "el" ? "del" : "de la") : art} ${nombre}`;
}

const SINGULAR = { juegos: "juego", litros: "litro", unidades: "unidad" };

/** "1 juego", "2 juegos", "1 litro"… */
export const cantidadCon = (n, unidad) => `${n.toLocaleString("es-AR")} ${n === 1 ? SINGULAR[unidad] ?? unidad : unidad}`;

export const ESTADOS_VEHICULO = {
    andando: { texto: "Andando", icono: "ti-circle-check" },
    taller: { texto: "En el taller", icono: "ti-tool" },
    problema: { texto: "Con problema", icono: "ti-alert-triangle" }
};

export const ESTADOS_PROBLEMA = {
    avisado: "Avisado · esperando al mecánico",
    taller: "El mecánico lo tomó",
    arreglado: "Arreglado"
};

export const tipoProblema = (id) => TIPOS_PROBLEMA.find((t) => t.id === id) ?? TIPOS_PROBLEMA.at(-1);

// ---------- Datos de fábrica (inventados, con fechas relativas a hoy para que siempre se vean frescos) ----------
const CHOFER = PERSONAS.find((p) => p.rol === "chofer");
const MECANICO = PERSONAS.find((p) => p.rol === "mecanico");

const haceHoras = (h) => new Date(Date.now() - h * 3600_000).toISOString();

/** Papeles de un vehículo: seguro y VTV, con los días que faltan para cada vencimiento. */
const papeles = (seguro, vtv) => [
    { tipo: "Seguro", vence: fechaLocalISO(seguro) },
    { tipo: "VTV", vence: fechaLocalISO(vtv) }
];

/** Un problema de fábrica (ya pasado): avisado hace `hace` horas y, si corresponde, tomado y arreglado después. */
function problemaViejo({ id, vehiculoId, tipo, urgencia, comentario, avisoPor, hace, estado, nota = "", repuestos = [] }) {
    const p = {
        id, vehiculoId, tipo, urgencia, comentario,
        avisoPor, avisoEn: haceHoras(hace),
        estado, tomadoPor: null, tomadoEn: null, arregladoEn: null, nota, repuestos
    };
    if (estado !== "avisado") {
        p.tomadoPor = MECANICO.nombre;
        p.tomadoEn = haceHoras(hace - 0.3);
    }
    if (estado === "arreglado") p.arregladoEn = haceHoras(hace - 2);
    return p;
}

export function semilla() {
    return {
        choferes: [
            { id: CHOFER.id, nombre: CHOFER.nombre },
            { id: "c-hugo", nombre: "Hugo" },
            { id: "c-walter", nombre: "Walter" },
            { id: "c-lucas", nombre: "Lucas" }
        ],
        vehiculos: [
            { id: "v-1", tipo: "camion", nombre: "Camión 1", km: 148_700, proximoService: 149_000, choferId: "c-hugo", papeles: papeles(120, 210) },
            { id: "v-2", tipo: "camion", nombre: "Camión 2", km: 212_400, proximoService: 220_000, choferId: null, papeles: papeles(95, 160) },
            { id: "v-3", tipo: "utilitario", nombre: "Utilitario 3", km: 86_200, proximoService: 90_000, choferId: null, papeles: papeles(150, 80) },
            { id: "v-4", tipo: "utilitario", nombre: "Utilitario 4", km: 64_050, proximoService: 70_000, choferId: null, papeles: papeles(200, 6) },
            { id: "v-5", tipo: "camioneta", nombre: "Camioneta 5", km: 120_300, proximoService: 125_000, choferId: null, papeles: papeles(-2, 130) },
            { id: "v-6", tipo: "utilitario", nombre: "Utilitario 6", km: 45_800, proximoService: 50_000, choferId: "c-walter", papeles: papeles(60, 240) },
            { id: "v-7", tipo: "utilitario", nombre: "Utilitario 7", km: 98_450, proximoService: 100_000, choferId: CHOFER.id, papeles: papeles(75, 190) },
            { id: "v-8", tipo: "moto", nombre: "Moto 8", km: 23_100, proximoService: 25_000, choferId: "c-lucas", papeles: papeles(40, 300) }
        ],
        problemas: [
            problemaViejo({ id: "p-1", vehiculoId: "v-1", tipo: "frenos", urgencia: "seguir", comentario: "Tira para la derecha al frenar", avisoPor: "Hugo", hace: 24 * 45, estado: "arreglado", nota: "Cambio de pastillas delanteras", repuestos: [{ repuestoId: "r-pastillas", nombre: "Pastillas de freno", cantidad: 1 }] }),
            problemaViejo({ id: "p-2", vehiculoId: "v-7", tipo: "cubiertas", urgencia: "parar", comentario: "Pinché la trasera", avisoPor: CHOFER.nombre, hace: 24 * 20, estado: "arreglado", nota: "Cubierta trasera nueva", repuestos: [{ repuestoId: "r-cubierta", nombre: "Cubiertas", cantidad: 1 }] }),
            problemaViejo({ id: "p-3", vehiculoId: "v-3", tipo: "luces", urgencia: "seguir", comentario: "No anda el guiño izquierdo", avisoPor: "Lucas", hace: 24 * 10, estado: "arreglado", nota: "Lámpara cambiada", repuestos: [{ repuestoId: "r-lampara", nombre: "Lámparas", cantidad: 1 }] }),
            problemaViejo({ id: "p-4", vehiculoId: "v-2", tipo: "motor", urgencia: "parar", comentario: "Patina el embrague cuando va cargado", avisoPor: "Walter", hace: 26, estado: "taller" }),
            problemaViejo({ id: "p-5", vehiculoId: "v-8", tipo: "luces", urgencia: "seguir", comentario: "No anda la luz de freno", avisoPor: "Lucas", hace: 3, estado: "avisado" })
        ],
        repuestos: [
            { id: "r-pastillas", nombre: "Pastillas de freno", unidad: "juegos", cantidad: 2, minimo: 1 },
            { id: "r-aceite", nombre: "Aceite de motor", unidad: "litros", cantidad: 8, minimo: 4 },
            { id: "r-filtro", nombre: "Filtros de aceite", unidad: "unidades", cantidad: 3, minimo: 2 },
            { id: "r-lampara", nombre: "Lámparas", unidad: "unidades", cantidad: 0, minimo: 2 },
            { id: "r-cubierta", nombre: "Cubiertas", unidad: "unidades", cantidad: 1, minimo: 1 },
            { id: "r-refrigerante", nombre: "Refrigerante", unidad: "litros", cantidad: 4, minimo: 2 }
        ]
    };
}

// ---------- Reglas (funciones puras: las usan las pantallas y las pruebas) ----------

export const estaAbierto = (p) => p.estado !== "arreglado";

/** "andando", "taller" o "problema", según los problemas abiertos del vehículo. */
export function estadoVehiculo(vehiculoId, problemas) {
    const abiertos = problemas.filter((p) => p.vehiculoId === vehiculoId && estaAbierto(p));
    if (abiertos.some((p) => p.estado === "taller")) return "taller";
    if (abiertos.length) return "problema";
    return "andando";
}

/** "no-hay", "poco" o "hay". */
export const estadoRepuesto = (r) => (r.cantidad <= 0 ? "no-hay" : r.cantidad <= r.minimo ? "poco" : "hay");

/** Un papel: { tipo, vence, dias, nivel: "vencido" | "por-vencer" | "ok" }. */
export function estadoPapel(papel) {
    const dias = diasHasta(papel.vence);
    const nivel = dias < 0 ? "vencido" : dias <= PAPEL_POR_VENCER_DIAS ? "por-vencer" : "ok";
    return { ...papel, dias, nivel };
}

/** El service: { faltan (km), nivel: "vencido" | "cerca" | "ok" }. */
export function estadoService(v) {
    const faltan = v.proximoService - v.km;
    return { faltan, nivel: faltan <= 0 ? "vencido" : faltan <= SERVICE_CERCA_KM ? "cerca" : "ok" };
}

/** Orden de la lista del mecánico: los que tienen que parar, después los nuevos, y dentro de cada grupo el más reciente. */
export function ordenProblemas(a, b) {
    const peso = (p) => (p.urgencia === "parar" ? 0 : 2) + (p.estado === "avisado" ? 0 : 1);
    return peso(a) - peso(b) || b.avisoEn.localeCompare(a.avisoEn);
}

// ---------- Funciones de datos ----------

/** Las funciones de datos. `prefijo` cambia solo en las pruebas (así no tocan los datos de la demo). */
export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();

    const nombreChofer = (id) => db().choferes.find((c) => c.id === id)?.nombre ?? null;
    const nombreVehiculo = (id) => db().vehiculos.find((v) => v.id === id)?.nombre ?? "Vehículo";

    /** Un problema con lo que necesita la pantalla (nombre del vehículo, tipo con su ícono). */
    const armarProblema = (p) => ({ ...copia(p), vehiculo: nombreVehiculo(p.vehiculoId), tipoInfo: tipoProblema(p.tipo) });

    /** Un vehículo con su estado, su chofer, su service, sus papeles y su problema abierto más urgente. */
    function armarVehiculo(v) {
        const abiertos = db().problemas.filter((p) => p.vehiculoId === v.id && estaAbierto(p)).sort(ordenProblemas);
        return {
            ...copia(v),
            estado: estadoVehiculo(v.id, db().problemas),
            tipoInfo: TIPOS_VEHICULO[v.tipo],
            chofer: nombreChofer(v.choferId),
            service: estadoService(v),
            papeles: v.papeles.map(estadoPapel),
            abierto: abiertos[0] ? armarProblema(abiertos[0]) : null
        };
    }

    const listarVehiculos = (estado = null) => db().vehiculos.map(armarVehiculo).filter((v) => !estado || v.estado === estado);

    /** La ficha: el vehículo y toda su historia de problemas (el más nuevo primero). */
    function ficha(id) {
        const v = buscar(db().vehiculos, id, "Ese vehículo no existe.");
        const historia = db().problemas.filter((p) => p.vehiculoId === id).sort((a, b) => b.avisoEn.localeCompare(a.avisoEn)).map(armarProblema);
        return { ...armarVehiculo(v), historia };
    }

    /** El vehículo que maneja hoy un chofer (o null). */
    function vehiculoDe(choferId) {
        const v = db().vehiculos.find((x) => x.choferId === choferId);
        return v ? armarVehiculo(v) : null;
    }

    const problemasAbiertos = () => db().problemas.filter(estaAbierto).sort(ordenProblemas).map(armarProblema);

    /** Los últimos avisos de un vehículo (para el inicio del chofer). */
    const avisosDe = (vehiculoId, cuantos = 5) =>
        db().problemas.filter((p) => p.vehiculoId === vehiculoId).sort((a, b) => b.avisoEn.localeCompare(a.avisoEn)).slice(0, cuantos).map(armarProblema);

    const listarRepuestos = () => db().repuestos.map((r) => ({ ...copia(r), estado: estadoRepuesto(r) }));

    /** Los tres números del tablero. */
    function resumen() {
        const r = { andando: 0, taller: 0, problema: 0 };
        db().vehiculos.forEach((v) => r[estadoVehiculo(v.id, db().problemas)]++);
        return r;
    }

    /**
     * "Para mirar hoy": lo que pide atención, lo urgente (rojo) primero.
     * Cada cosa: { nivel: "rojo" | "ambar", icono, texto, detalle, ruta, cuando? }.
     */
    function paraMirar() {
        const items = [];
        db().problemas.filter((p) => p.estado === "avisado").forEach((p) => {
            items.push({
                nivel: p.urgencia === "parar" ? "rojo" : "ambar",
                icono: tipoProblema(p.tipo).icono,
                texto: `${nombreVehiculo(p.vehiculoId)} · ${tipoProblema(p.tipo).texto}`,
                detalle: `Avisó ${p.avisoPor}${p.urgencia === "parar" ? " · tiene que parar" : ""}`,
                cuando: p.avisoEn,
                ruta: `/vehiculos/${p.vehiculoId}`
            });
        });
        db().vehiculos.forEach((v) => {
            v.papeles.map(estadoPapel).filter((x) => x.nivel !== "ok").forEach((x) => {
                items.push({
                    nivel: x.nivel === "vencido" ? "rojo" : "ambar",
                    icono: "ti-file-certificate",
                    texto: `${v.nombre} · ${x.tipo} ${x.nivel === "vencido" ? "vencido" : "por vencer"}`,
                    detalle: x.dias < 0 ? `Venció hace ${-x.dias} ${-x.dias === 1 ? "día" : "días"}` : x.dias === 0 ? "Vence hoy" : `Vence en ${x.dias} ${x.dias === 1 ? "día" : "días"}`,
                    ruta: `/vehiculos/${v.id}`
                });
            });
            const s = estadoService(v);
            if (s.nivel !== "ok") {
                items.push({
                    nivel: s.nivel === "vencido" ? "rojo" : "ambar",
                    icono: "ti-gauge",
                    texto: `${v.nombre} · Service ${s.nivel === "vencido" ? "pasado" : "cerca"}`,
                    detalle: s.faltan <= 0 ? `Se pasó por ${(-s.faltan).toLocaleString("es-AR")} km` : `Faltan ${s.faltan.toLocaleString("es-AR")} km`,
                    ruta: `/vehiculos/${v.id}`
                });
            }
        });
        db().repuestos.filter((r) => estadoRepuesto(r) !== "hay").forEach((r) => {
            const nada = estadoRepuesto(r) === "no-hay";
            items.push({
                nivel: nada ? "rojo" : "ambar",
                icono: "ti-package",
                texto: `${r.nombre} · ${nada ? "no hay" : "queda poco"}`,
                detalle: nada ? "Hay que comprar" : `${r.cantidad === 1 ? "Queda" : "Quedan"} ${cantidadCon(r.cantidad, r.unidad)}`,
                ruta: "/repuestos"
            });
        });
        const peso = (x) => (x.nivel === "rojo" ? 0 : 1);
        return items.sort((a, b) => peso(a) - peso(b) || (b.cuando ?? "").localeCompare(a.cuando ?? ""));
    }

    /** Lo último que pasó (avisó, lo tomó, lo arregló), el más nuevo primero. */
    function movimientos(cuantos = 6) {
        const lista = [];
        db().problemas.forEach((p) => {
            const tipoVehiculo = db().vehiculos.find((v) => v.id === p.vehiculoId)?.tipo;
            const base = { problemaId: p.id, vehiculoId: p.vehiculoId, vehiculo: nombreVehiculo(p.vehiculoId), tipoVehiculo, tipo: tipoProblema(p.tipo).texto };
            lista.push({ ...base, que: "aviso", quien: p.avisoPor, cuando: p.avisoEn });
            if (p.tomadoEn) lista.push({ ...base, que: "tomo", quien: p.tomadoPor, cuando: p.tomadoEn });
            if (p.arregladoEn) lista.push({ ...base, que: "arreglo", quien: p.tomadoPor, cuando: p.arregladoEn, repuestos: copia(p.repuestos) });
        });
        // A la misma hora (pasa en las pruebas), lo que viene después en la historia va primero
        const orden = { aviso: 0, tomo: 1, arreglo: 2 };
        return lista.sort((a, b) => b.cuando.localeCompare(a.cuando) || orden[b.que] - orden[a.que]).slice(0, cuantos);
    }

    // ---------- Lo que modifica (cada una controla el permiso) ----------

    /** El chofer avisa un problema de SU vehículo de hoy. */
    function avisarProblema(usuario, { tipo, urgencia, comentario = "" } = {}) {
        exigir(usuario?.rol === "chofer", "Solo un chofer puede avisar un problema de su vehículo.");
        const v = db().vehiculos.find((x) => x.choferId === usuario.id);
        exigir(v, "Hoy no tenés ningún vehículo asignado.");
        exigir(TIPOS_PROBLEMA.some((t) => t.id === tipo), "Elegí qué pasa.");
        exigir(URGENCIAS.some((u) => u.id === urgencia), "Elegí si podés seguir o tenés que parar.");
        const texto = sinPasarse(comentario, TOPES.comentario, "el comentario");
        exigir(db().problemas.filter(estaAbierto).length < TOPES.abiertos,
            `Ya hay ${TOPES.abiertos} problemas sin arreglar. Es una demo: tocá "Empezar de cero" arriba.`);
        const p = {
            id: nuevoId("p"), vehiculoId: v.id, tipo, urgencia, comentario: texto,
            avisoPor: usuario.nombre, avisoEn: ahora(),
            estado: "avisado", tomadoPor: null, tomadoEn: null, arregladoEn: null, nota: "", repuestos: []
        };
        db().problemas.push(p);
        guardado.persistir();
        return armarProblema(p);
    }

    /** El mecánico se hace cargo: el vehículo pasa a "en el taller". */
    function tomarProblema(usuario, id) {
        exigir(usuario?.rol === "mecanico", "Solo el mecánico puede hacerse cargo de un problema.");
        const p = buscar(db().problemas, id, "Ese problema ya no existe.");
        exigir(p.estado === "avisado", p.estado === "taller" ? "Ya lo tomaste." : "Ese problema ya está arreglado.");
        p.estado = "taller";
        p.tomadoPor = usuario.nombre;
        p.tomadoEn = ahora();
        guardado.persistir();
        return armarProblema(p);
    }

    /**
     * "Listo, arreglado": dice qué repuestos usó (se descuentan solos) y una nota opcional.
     * Si no lo había tomado, lo toma en el mismo momento.
     */
    function cerrarProblema(usuario, id, { repuestos = [], nota = "" } = {}) {
        exigir(usuario?.rol === "mecanico", "Solo el mecánico puede marcar un arreglo.");
        const p = buscar(db().problemas, id, "Ese problema ya no existe.");
        exigir(estaAbierto(p), "Ese problema ya está arreglado.");
        const texto = sinPasarse(nota, TOPES.nota, "la nota");
        exigir(Array.isArray(repuestos), "Los repuestos usados no llegaron bien.");
        exigir(new Set(repuestos.map((u) => u.repuestoId)).size === repuestos.length, "Cada repuesto va una sola vez.");
        // Primero se revisa todo; recién después se descuenta (o todo o nada)
        const usados = repuestos.map(({ repuestoId, cantidad }) => {
            const r = buscar(db().repuestos, repuestoId, "Ese repuesto no existe.");
            const n = enteroHasta(cantidad, `La cantidad de ${r.nombre.toLowerCase()}`, { desde: 1, hasta: TOPES.cantidad });
            exigir(n <= r.cantidad, r.cantidad ? `De ${r.nombre.toLowerCase()} quedan solo ${r.cantidad}.` : `No hay ${r.nombre.toLowerCase()}.`);
            return { r, n };
        });
        usados.forEach(({ r, n }) => (r.cantidad -= n));
        const momento = ahora();
        if (p.estado === "avisado") {
            p.tomadoPor = usuario.nombre;
            p.tomadoEn = momento;
        }
        p.estado = "arreglado";
        p.arregladoEn = momento;
        p.nota = texto;
        p.repuestos = usados.map(({ r, n }) => ({ repuestoId: r.id, nombre: r.nombre, cantidad: n }));
        guardado.persistir();
        return armarProblema(p);
    }

    /** Cargar los km de un vehículo (administradora o mecánico). No puede bajar. */
    function cargarKm(usuario, vehiculoId, km) {
        exigir(["admin", "mecanico"].includes(usuario?.rol), "Solo la administradora o el mecánico cargan los km.");
        const v = buscar(db().vehiculos, vehiculoId, "Ese vehículo no existe.");
        const n = enteroHasta(km, "El kilometraje", { hasta: TOPES.km });
        exigir(n >= v.km, `No puede tener menos km que antes (${v.km.toLocaleString("es-AR")}).`);
        v.km = n;
        guardado.persistir();
        return armarVehiculo(v);
    }

    return {
        guardado,
        listarVehiculos, ficha, vehiculoDe, problemasAbiertos, avisosDe, listarRepuestos,
        resumen, paraMirar, movimientos,
        avisarProblema, tomarProblema, cerrarProblema, cargarKm
    };
}
