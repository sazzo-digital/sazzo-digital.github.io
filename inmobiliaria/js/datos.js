// ============================================
// Datos de Sazzo Inmobiliaria (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una inmobiliaria chica inventada: 12 propiedades publicadas (7 en alquiler, en pesos por mes, y 5 en venta, en
// dólares), 10 consultas de distintos lugares, visitas de las últimas semanas y las que vienen, y 8 alquileres que
// administra (con sus aumentos y sus pagos).
// Nunca hay direcciones exactas: cada propiedad dice su ZONA y en el mapa se ve un círculo, no un punto en la puerta.
// Los aumentos usan un ÍNDICE DE EJEMPLO (2,5 % por mes): la pantalla lo dice. La versión real trae el dato oficial.
// Nada de esto es un contrato ni un recibo: son avisos y una lista para no olvidarse.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, buscar } from "../kit/js/guardado.js?v=bc8d90946e";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=bc8d90946e";
import { esFechaISO } from "../kit/js/fechas.js?v=bc8d90946e";
import { aHora, aMinutos, diaSemana, libres, revisarLibre } from "../kit/js/turnos.js?v=bc8d90946e";
import { MARCA, NEGOCIO, buscarPersona } from "./marca.js?v=bc8d90946e";

export const VERSION_DATOS = 2; // 2: las propiedades de fábrica traen fotos y dos, el recorrido 360

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    alquiler: 50_000_000, // $ por mes
    venta: 5_000_000, // US$
    expensas: 5_000_000,
    ambientes: 20,
    m2: 100_000,
    aumentoMin: -50, // % de un período
    aumentoMax: 200,
    cadaMeses: 12,
    duracion: 120, // meses de un alquiler
    titulo: 60,
    descripcion: 600,
    nombre: 50,
    mensaje: 300, // lo que escribió la persona en la consulta
    nota: 200,
    fotos: 3, // fotos sacadas con el celu en una propiedad nueva
    fotoBytes: 10 * 1024 * 1024, // antes de achicarla
    dias: 14, // las visitas se piden de hoy a 13 días adelante
    porVenir: 5, // visitas por venir de una misma persona
    propiedades: 200,
    consultas: 500,
    visitas: 1000,
    pagos: 5000,
    notas: 30 // notas por consulta
};

export const INDICE_MENSUAL = 2.5; // % por mes: índice DE EJEMPLO (la versión real usa el oficial)
export const DIA_VENCE = 10; // el alquiler se paga hasta el día 10 de cada mes
export const AVISO_AUMENTO_DIAS = 45; // los aumentos se muestran desde 45 días antes
export const AVISO_FIN_DIAS = 90; // los contratos que vencen, desde 90 días antes
export const SIN_VISITAS_DIAS = 30; // propiedad publicada sin visitas en 30 días
export const SIN_CONTACTO_DIAS = 4; // consulta abierta sin escribirle en 4 días

export const OPERACIONES = { alquiler: "Alquiler", venta: "Venta" };

export const TIPOS = {
    depto: { texto: "Depto", icono: "ti-building" },
    casa: { texto: "Casa", icono: "ti-home" },
    ph: { texto: "PH", icono: "ti-home" },
    duplex: { texto: "Dúplex", icono: "ti-home" },
    local: { texto: "Local", icono: "ti-building-store" },
    cochera: { texto: "Cochera", icono: "ti-car" },
    lote: { texto: "Lote", icono: "ti-map" }
};

// Zonas aproximadas (en Neuquén, como el mapa de Flota): el centro de la zona, nunca una dirección
export const ZONAS = {
    centro: { nombre: "Centro", lat: -38.9516, lng: -68.0591 },
    "centro-oeste": { nombre: "Centro oeste", lat: -38.9545, lng: -68.0745 },
    "centro-este": { nombre: "Centro este", lat: -38.9488, lng: -68.0440 },
    norte: { nombre: "Zona norte", lat: -38.9340, lng: -68.0690 },
    oeste: { nombre: "Zona oeste", lat: -38.9590, lng: -68.0985 },
    este: { nombre: "Zona este", lat: -38.9430, lng: -68.0310 },
    rio: { nombre: "Cerca del río", lat: -38.9735, lng: -68.0620 }
};
export const RADIO_ZONA = 350; // metros del círculo en el mapa

export const CARACTERISTICAS = [
    "Balcón", "Patio", "Parrilla", "Quincho", "Pileta", "Cochera", "Luminoso", "Amoblado",
    "Apto mascotas", "Apto crédito", "A estrenar", "Vidriera", "Depósito", "Seguridad"
];

export const ESTADOS_PROPIEDAD = { disponible: "Disponible", reservada: "Reservada", alquilada: "Alquilada", vendida: "Vendida" };

export const ORIGENES = {
    web: { texto: "Desde la página", icono: "ti-device-mobile" },
    whatsapp: { texto: "WhatsApp", icono: "ti-brand-whatsapp" },
    portal: { texto: "Portal", icono: "ti-list-details" },
    cartel: { texto: "Cartel", icono: "ti-tag" },
    instagram: { texto: "Instagram", icono: "ti-camera" },
    recomendado: { texto: "Recomendado", icono: "ti-users" }
};

export const ESTADOS_CONSULTA = {
    nueva: "Nueva",
    agendada: "Visita agendada",
    visito: "Ya visitó",
    interesada: "Le interesa",
    cerrada: "Cerró",
    descartada: "No sigue"
};
const ABIERTAS = ["nueva", "agendada", "visito", "interesada"];

export const ESTADOS_VISITA = { pedida: "Pedida", confirmada: "Confirmada", hecha: "Visitó", falto: "No vino", cancelada: "Cancelada" };

// Quiénes acompañan las visitas (cada uno no puede estar en dos visitas a la vez)
export const AGENTES = ["u-agente", "u-duena"];

// Horario de visitas: lunes a viernes de 9 a 19, sábados de 9 a 13; cada visita ocupa 1 hora (con el viaje)
export const DURACION_VISITA = 60;
const PASO_VISITA = 30;
const HORARIOS = { semana: { abre: aMinutos("09:00"), cierra: aMinutos("19:00") }, sabado: { abre: aMinutos("09:00"), cierra: aMinutos("13:00") } };

/** El horario de visitas de una fecha (null = domingo, cerrado). */
export function horarioDe(fecha) {
    const d = diaSemana(fecha);
    if (d === 0) return null;
    return { ...(d === 6 ? HORARIOS.sabado : HORARIOS.semana), duracion: DURACION_VISITA, paso: PASO_VISITA };
}

// ---------- Fechas ----------
const dos = (n) => String(n).padStart(2, "0");
export const isoDe = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const fechaDe = (iso) => {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d);
};
/** La fecha corrida `n` días. */
export const sumarDias = (iso, n) => {
    const f = fechaDe(iso);
    f.setDate(f.getDate() + n);
    return isoDe(f);
};
/** La fecha corrida `n` meses (el 31 pasa al último día del mes si hace falta). */
export function sumarMeses(iso, n) {
    const [a, m, d] = iso.split("-").map(Number);
    const ultimo = new Date(a, m - 1 + n + 1, 0).getDate();
    return isoDe(new Date(a, m - 1 + n, Math.min(d, ultimo)));
}
/** Días de una fecha a otra (negativo si la segunda es antes). */
export const diasEntre = (desde, hasta) => Math.round((fechaDe(hasta) - fechaDe(desde)) / 864e5);
/** El primer día del mes, corrido `n` meses desde una fecha. */
export const primeroDelMes = (iso, n = 0) => sumarMeses(`${iso.slice(0, 7)}-01`, n);
export const periodoDe = (iso) => iso.slice(0, 7); // "2026-10"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const nombreMes = (periodo) => MESES[Number(periodo.slice(5, 7)) - 1];
/** "1/11" */
export const diaMes = (iso) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

/** "hoy", "mañana" o "sáb 12/10". */
export function nombreFecha(fecha, hoy) {
    if (fecha === hoy) return "hoy";
    if (fecha === sumarDias(hoy, 1)) return "mañana";
    return `${DIAS[diaSemana(fecha)]} ${diaMes(fecha)}`;
}

// ---------- Plata ----------
export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
export const dolares = (n) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;
export const precioTexto = (p) => (p.operacion === "venta" ? dolares(p.precio) : `${pesos(p.precio)} por mes`);
/** "15,97 %" */
export const porcentajeTexto = (n) => `${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;
/** Los montos de alquiler se redondean a $100. */
export const redondearCien = (n) => Math.round(n / 100) * 100;
/** El aumento del índice de ejemplo para un período de `meses` meses (2,5 % por mes, compuesto): 6 → 15,97. */
export const porcentajeIndice = (meses) => Math.round((Math.pow(1 + INDICE_MENSUAL / 100, meses) - 1) * 10000) / 100;

/** Sin mayúsculas ni tildes, para buscar. */
export const normal = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// ---------- Reglas de los alquileres (puras: reciben el alquiler y el día de hoy) ----------

/** El día que termina. */
export const finDe = (c) => sumarMeses(c.inicio, c.meses);

/** Las fechas en que aumenta (cada `cadaMeses`, mientras dure). */
export function fechasDeAumento(c) {
    const fin = finDe(c);
    const lista = [];
    for (let k = 1; ; k++) {
        const f = sumarMeses(c.inicio, k * c.cadaMeses);
        if (f >= fin) break;
        lista.push(f);
    }
    return lista;
}

/** Lo que se paga en una fecha (el último aumento aplicado hasta ahí). */
export function montoEn(c, fecha) {
    let monto = c.montoInicial;
    [...c.ajustes].sort((a, b) => a.desde.localeCompare(b.desde)).forEach((a) => {
        if (a.desde <= fecha) monto = a.monto;
    });
    return monto;
}

/** El último monto aplicado (aunque empiece más adelante). */
const ultimoMonto = (c) => ([...c.ajustes].sort((a, b) => a.desde.localeCompare(b.desde)).at(-1)?.monto ?? c.montoInicial);

/** El próximo aumento que falta aplicar (aunque esté atrasado), con el monto que sugiere el índice de ejemplo. */
export function proximoAumento(c, hoy) {
    const hechas = new Set(c.ajustes.map((a) => a.desde));
    const desde = fechasDeAumento(c).find((f) => !hechas.has(f));
    if (!desde) return null;
    const antes = ultimoMonto(c);
    const porcentaje = porcentajeIndice(c.cadaMeses);
    return { desde, dias: diasEntre(hoy, desde), porcentaje, antes, despues: redondearCien(antes * (1 + porcentaje / 100)) };
}

/** El último mes que ya venció (el alquiler se paga hasta el día 10). */
export const ultimoVencido = (hoy) => (Number(hoy.slice(8, 10)) > DIA_VENCE ? periodoDe(hoy) : periodoDe(primeroDelMes(hoy, -1)));

/** Los meses que se miran (desde que se lleva la cuenta hasta este mes, sin pasar el fin). */
export function periodosDe(c, hoy) {
    const lista = [];
    const ultimo = periodoDe(finDe(c)) > periodoDe(hoy) ? periodoDe(hoy) : periodoDe(sumarMeses(finDe(c), -1));
    for (let f = `${c.pagosDesde}-01`; periodoDe(f) <= ultimo; f = sumarMeses(f, 1)) lista.push(periodoDe(f));
    return lista;
}

// ---------- Datos de fábrica ----------
// [id, título, tipo, operación, zona, ambientes, dormitorios, baños, m², precio, expensas, características, agente,
//  publicada hace (días), descripción]
const PROPIEDADES = [
    ["p-1", "Depto 2 ambientes con balcón", "depto", "alquiler", "centro", 2, 1, 1, 52, 520_000, 85_000, ["Balcón", "Luminoso", "Apto mascotas"], "u-agente", 6,
        "Cuarto piso al frente, con balcón corrido y mucha luz. Cocina separada, placard en el dormitorio. A dos cuadras de la avenida y con colectivos en la esquina."],
    ["p-2", "Monoambiente para estudiantes", "depto", "alquiler", "centro-este", 1, 0, 1, 30, 340_000, 45_000, ["Amoblado", "Luminoso"], "u-agente", 12,
        "Monoambiente amoblado, ideal para estudiantes: cama, escritorio y heladera. Cerca de las facultades y del centro."],
    ["p-3", "Depto 3 ambientes con cochera", "depto", "alquiler", "centro-oeste", 3, 2, 1, 70, 690_000, 110_000, ["Cochera", "Balcón"], "u-agente", 20,
        "Dos dormitorios con placard, living comedor con salida al balcón y cochera cubierta en el subsuelo."],
    ["p-4", "PH con patio y parrilla", "ph", "alquiler", "este", 3, 2, 1, 85, 610_000, 0, ["Patio", "Parrilla", "Apto mascotas"], "u-duena", 55,
        "PH al fondo, sin expensas. Patio con parrilla, dos dormitorios y lavadero cubierto."],
    ["p-5", "Casa con patio y quincho", "casa", "alquiler", "norte", 4, 3, 2, 140, 950_000, 0, ["Patio", "Quincho", "Cochera"], "u-duena", 9,
        "Casa en barrio tranquilo: tres dormitorios, dos baños, quincho con parrilla y cochera para dos autos."],
    ["p-6", "Local a la calle", "local", "alquiler", "centro", 1, 0, 1, 60, 800_000, 60_000, ["Vidriera"], "u-duena", 30,
        "Local con vidriera de 6 metros sobre calle comercial, baño y kitchenette."],
    ["p-7", "Cochera cubierta", "cochera", "alquiler", "centro", 1, 0, 0, 14, 75_000, 0, ["Seguridad"], "u-agente", 15,
        "Cochera fija cubierta, con portón automático y vigilancia."],
    ["p-8", "Depto 2 ambientes a estrenar", "depto", "venta", "centro-oeste", 2, 1, 1, 50, 78_000, 70_000, ["A estrenar", "Balcón", "Apto crédito"], "u-agente", 18,
        "Edificio nuevo, entrega inmediata. Apto crédito hipotecario."],
    ["p-9", "Casa 3 dormitorios con pileta", "casa", "venta", "oeste", 5, 3, 2, 180, 165_000, 0, ["Pileta", "Patio", "Parrilla", "Cochera"], "u-duena", 40,
        "Casa en lote de 12 x 30 con pileta, parrilla y galería. Tres dormitorios, el principal en suite."],
    ["p-10", "Dúplex en barrio tranquilo", "duplex", "venta", "norte", 4, 3, 2, 110, 118_000, 0, ["Patio", "Cochera"], "u-agente", 25,
        "Dúplex de dos plantas con patio propio y cochera. Tres dormitorios arriba."],
    ["p-11", "Lote de 10 x 30", "lote", "venta", "rio", 1, 0, 0, 300, 42_000, 0, [], "u-duena", 33,
        "Lote plano con todos los servicios en la cuadra, a pocas cuadras del río."],
    ["p-12", "Local con depósito", "local", "venta", "centro-este", 1, 0, 1, 95, 120_000, 0, ["Vidriera", "Depósito"], "u-duena", 48,
        "Local con depósito al fondo y entrada para mercadería por la calle de atrás."]
];

// Las fotos de cada propiedad de fábrica (img/fotos/, ver fotos.js) y las que tienen recorrido 360 (img/360/)
const CUANTAS_FOTOS = { "p-1": 3, "p-2": 3, "p-3": 3, "p-4": 2, "p-5": 3, "p-6": 2, "p-7": 2, "p-8": 3, "p-9": 3, "p-10": 3, "p-11": 2, "p-12": 2 };
const fotosDeFabrica = (id) => [..."abc"].slice(0, CUANTAS_FOTOS[id] ?? 0).map((l) => `${id.replace("-", "")}-${l}`);
const RECORRIDO_360 = { "p-1": "p1", "p-5": "p5" };

// Visitas que ya pasaron (de gente que ya no está en las consultas): [propiedad, quién, hace (días), hora, agente]
const VISITAS_PASADAS = [
    ["p-1", "Lorena Paredes", 4, 11, "u-agente"],
    ["p-3", "Ariel Montes", 8, 17, "u-agente"],
    ["p-5", "Vanesa Ibarra", 12, 10, "u-duena"],
    ["p-6", "Damián Ponce", 15, 12, "u-duena"],
    ["p-7", "Iván Cabrera", 5, 9.5, "u-agente"],
    ["p-8", "Cecilia Arias", 9, 16, "u-agente"],
    ["p-10", "Mauro Villegas", 18, 15, "u-agente"],
    ["p-11", "Germán Ríos", 20, 11, "u-duena"],
    ["p-12", "Valentín Ojeda", 25, 10, "u-duena"]
];

// Los alquileres que administra: [id, qué se alquila, zona, inquilino, propietario, cada cuántos meses aumenta,
// aumentos ya hechos, meses de contrato, primer monto, ¿debe el último mes?, ¿pagó este mes antes del 10?]
// El inicio se calcula para que siempre pase lo mismo: 3 aumentan el mes que viene, 1 vence en dos meses, 2 deben.
const ALQUILERES = [
    ["c-1", "Depto 2 amb", "centro", "Martín Quiroga", "Elsa Benítez", 6, 0, 24, 420_000, false, true],
    ["c-2", "Casa 3 amb", "norte", "Paola Giménez", "Roberto Insaurralde", 4, 2, 36, 600_000, false, false],
    ["c-3", "Local", "centro", "Fernando Ledesma", "Norma Castillo", 3, 3, 36, 900_000, false, true],
    ["c-4", "Depto 1 amb", "centro-este", "Romina Aguirre", "Alberto Rivas", 6, 3, 24, 250_000, false, true],
    ["c-5", "PH 3 amb", "este", "Cristian Suárez", "Susana Bianchi", 4, 1, 24, 480_000, true, false],
    ["c-6", "Depto 3 amb", "centro-oeste", "Mónica Peralta", "Oscar Maldonado", 6, 0, 24, 560_000, true, false],
    ["c-7", "Dúplex", "norte", "Gastón Medrano", "Teresa Godoy", 6, 1, 36, 700_000, false, true],
    ["c-8", "Cochera", "centro", "Ramiro Toledo", "Enrique Salas", 6, 0, 24, 60_000, false, true]
];
// Cuándo arrancó cada uno, en meses desde el mes que viene (así el aumento o el fin caen donde tienen que caer)
const ARRANQUE = { "c-1": -6, "c-2": -12, "c-3": -12, "c-4": -23, "c-5": -6, "c-6": -2, "c-7": -9, "c-8": -4 };

/** Un momento de hace `dias` días a la hora `hora` (decimal: 9.5 = 9:30), desde `base`. */
function momento(base, dias, hora) {
    const d = new Date(base);
    d.setDate(d.getDate() - dias);
    d.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 0, 0);
    return d.toISOString();
}
const haceHoras = (base, horas) => new Date(base.getTime() - horas * 3600000).toISOString();

/** El primer día de visitas desde `desde` días adelante (sin domingos; `soloSemana` saltea también los sábados). */
function diaDeVisitas(hoy, desde, soloSemana = false) {
    for (let i = desde; ; i++) {
        const f = sumarDias(hoy, i);
        const d = diaSemana(f);
        if (d !== 0 && !(soloSemana && d === 6)) return f;
    }
}

export function semilla(base = new Date()) {
    const hoy = isoDe(base);
    const propiedades = PROPIEDADES.map(([id, titulo, tipo, operacion, zona, ambientes, dormitorios, banos, m2, precio, expensas, caracteristicas, agenteId, hace, descripcion]) => ({
        id, titulo, tipo, operacion, zona, ambientes, dormitorios, banos, m2, precio, expensas, caracteristicas, agenteId,
        descripcion, estado: "disponible", publicada: momento(base, hace, 10), fotos: fotosDeFabrica(id), recorrido: RECORRIDO_360[id] ?? null, nueva: false
    }));

    const consulta = (id, nombre, origen, propiedadId, busca, mensaje, estado, creado, ultimoContacto, agenteId) =>
        ({ id, nombre, clienteId: null, origen, propiedadId, busca, mensaje, estado, creado, ultimoContacto, agenteId, notas: [] });
    const consultas = [
        consulta("q-1", "Bruno Herrera", "whatsapp", "p-3", { operacion: "alquiler", tipo: "depto", ambientes: 3, hasta: 750_000, zona: null },
            "Hola, ¿sigue disponible el de 3 ambientes? Tengo un perro chico.", "agendada", haceHoras(base, 50), haceHoras(base, 26), "u-agente"),
        consulta("q-2", "Micaela Ortega", "portal", null, { operacion: "alquiler", tipo: "depto", ambientes: 2, hasta: 600_000, zona: null },
            "Busco 2 ambientes. ¿Piden garantía propietaria o aceptan seguro de caución?", "nueva", haceHoras(base, 3), null, "u-agente"),
        consulta("q-3", "Rodrigo Funes", "instagram", null, { operacion: "alquiler", tipo: "depto", ambientes: 2, hasta: 550_000, zona: "centro" },
            "Busco 2 ambientes en el centro, para mudarme el mes que viene.", "nueva", haceHoras(base, 30), null, "u-agente"),
        consulta("q-4", "Agustina Lema", "cartel", "p-2", { operacion: "alquiler", tipo: "depto", ambientes: 1, hasta: 560_000, zona: null },
            "Vi el cartel del monoambiente. ¿Se puede ver esta semana?", "visito", momento(base, 9, 18), momento(base, 6, 12), "u-agente"),
        consulta("q-5", "Gabriel Correa", "recomendado", "p-5", { operacion: "alquiler", tipo: "casa", ambientes: 3, hasta: 1_000_000, zona: null },
            "Me pasó tu contacto un compañero. Somos 4 y buscamos casa con patio.", "agendada", momento(base, 3, 20), momento(base, 2, 10), "u-duena"),
        consulta("q-6", "Carla Benegas", "portal", "p-9", { operacion: "venta", tipo: "casa", ambientes: 4, hasta: 170_000, zona: null },
            "¿Aceptan permuta por un depto más chico?", "interesada", momento(base, 14, 11), momento(base, 3, 17), "u-duena"),
        consulta("q-7", "Héctor Villalba", "whatsapp", "p-11", { operacion: "venta", tipo: "lote", ambientes: null, hasta: 50_000, zona: null },
            "Buenas, ¿el lote tiene escritura? ¿Aceptan parte en cuotas?", "nueva", haceHoras(base, 46), null, "u-duena"),
        consulta("q-8", "Sabrina Molina", "portal", "p-6", { operacion: "alquiler", tipo: "local", ambientes: null, hasta: 900_000, zona: null },
            "Es para una peluquería. ¿Tiene salida de agua en el salón?", "descartada", momento(base, 22, 10), momento(base, 19, 12), "u-duena"),
        consulta("q-9", "Ezequiel Rojas", "instagram", "p-8", { operacion: "venta", tipo: "depto", ambientes: 2, hasta: 80_000, zona: null },
            "Me interesa el de pozo, ¿es apto crédito?", "agendada", momento(base, 4, 21), momento(base, 1, 11), "u-agente"),
        consulta("q-10", "Natalia Duarte", "cartel", "p-4", { operacion: "alquiler", tipo: "ph", ambientes: 2, hasta: 650_000, zona: null },
            "Quiero ver el PH, ¿aceptan mascotas?", "descartada", momento(base, 44, 19), momento(base, 41, 12), "u-duena")
    ];
    // Agustina y Micaela tienen notas para que se vea el historial
    consultas[3].notas.push({ texto: "Le gustó, pero le queda lejos del trabajo. Mandarle si entra algo en el centro.", por: "u-agente", fecha: momento(base, 6, 12.5) });
    consultas[0].notas.push({ texto: "Tiene perro chico: el propietario acepta.", por: "u-agente", fecha: haceHoras(base, 26) });

    const visita = (id, propiedadId, consultaId, quien, fecha, inicio, agenteId, estado, creada) =>
        ({ id, propiedadId, consultaId, quien, lugarId: agenteId, agenteId, fecha, inicio, duracion: DURACION_VISITA, estado, anulado: estado === "cancelada", visto: true, creada });
    const visitas = [
        ...VISITAS_PASADAS.map(([propiedadId, quien, hace, hora, agenteId], i) =>
            visita(`vp-${i + 1}`, propiedadId, null, quien, sumarDias(hoy, -hace), Math.round(hora * 60), agenteId, "hecha", momento(base, hace + 2, 12))),
        visita("v-1", "p-2", "q-4", "Agustina Lema", sumarDias(hoy, -6), aMinutos("11:00"), "u-agente", "hecha", momento(base, 8, 9)),
        visita("v-2", "p-9", "q-6", "Carla Benegas", sumarDias(hoy, -10), aMinutos("16:00"), "u-duena", "hecha", momento(base, 13, 10)),
        visita("v-3", "p-4", "q-10", "Natalia Duarte", sumarDias(hoy, -41), aMinutos("12:00"), "u-duena", "hecha", momento(base, 43, 10)),
        visita("v-4", "p-6", "q-8", "Sabrina Molina", sumarDias(hoy, -19), aMinutos("12:00"), "u-duena", "hecha", momento(base, 21, 10)),
        // Las que vienen (confirmadas)
        visita("v-5", "p-3", "q-1", "Bruno Herrera", diaDeVisitas(hoy, 1, true), aMinutos("18:00"), "u-agente", "confirmada", haceHoras(base, 26)),
        visita("v-6", "p-5", "q-5", "Gabriel Correa", diaDeVisitas(hoy, 2), aMinutos("10:00"), "u-duena", "confirmada", momento(base, 2, 10)),
        visita("v-7", "p-8", "q-9", "Ezequiel Rojas", diaDeVisitas(hoy, 2, true), aMinutos("11:00"), "u-agente", "confirmada", momento(base, 1, 11))
    ];

    const mesQueViene = primeroDelMes(hoy, 1);
    const vencido = ultimoVencido(hoy);
    const alquileres = ALQUILERES.map(([id, que, zona, inquilino, propietario, cadaMeses, hechos, meses, montoInicial, debe, pagoTemprano]) => {
        const inicio = sumarMeses(mesQueViene, ARRANQUE[id]);
        const c = { id, que, zona, inquilino, propietario, inicio, meses, cadaMeses, montoInicial, ajustes: [], pagos: [], avisos: [] };
        // Los aumentos que ya pasaron, con el índice de ejemplo y ya avisados
        let monto = montoInicial;
        fechasDeAumento(c).slice(0, hechos).forEach((desde) => {
            const porcentaje = porcentajeIndice(cadaMeses);
            monto = redondearCien(monto * (1 + porcentaje / 100));
            c.ajustes.push({ desde, porcentaje, monto, por: "u-duena", el: momento(fechaDe(desde), 12, 10), avisado: true });
        });
        // Se lleva la cuenta de los pagos de los últimos 6 meses (o desde que empezó)
        const seisAtras = periodoDe(primeroDelMes(hoy, -5));
        c.pagosDesde = periodoDe(inicio) > seisAtras ? periodoDe(inicio) : seisAtras;
        periodosDe(c, hoy).forEach((periodo, i) => {
            const pagado = periodo < vencido || (periodo === vencido && !debe) || (periodo > vencido && pagoTemprano);
            if (!pagado) return;
            const dia = 3 + ((i * 3 + Number(id.slice(2))) % 6); // entre el 3 y el 8
            c.pagos.push({ periodo, fecha: new Date(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)) - 1, dia, 11).toISOString(), monto: montoEn(c, `${periodo}-01`), por: "u-duena" });
        });
        // Si el día de hoy es antes del 3, "pagó este mes" quedaría en el futuro: no se anota
        c.pagos = c.pagos.filter((p) => p.fecha <= base.toISOString());
        return c;
    });

    return { propiedades, consultas, visitas, alquileres };
}

// ---------- Permisos ----------
const esDuena = (u) => u?.rol === "duena";
const esStaff = (u) => u?.rol === "duena" || u?.rol === "agente";
const esCliente = (u) => u?.rol === "cliente";

/** ¿La propiedad le sirve a lo que busca alguien? */
export function leSirve(busca, p) {
    if (!busca || p.estado !== "disponible" || busca.operacion !== p.operacion) return false;
    if (busca.tipo && busca.tipo !== p.tipo) return false;
    if (busca.ambientes && p.ambientes < busca.ambientes) return false;
    if (busca.hasta && p.precio > busca.hasta) return false;
    if (busca.zona && busca.zona !== p.zona) return false;
    return true;
}

/** "Depto de 2 ambientes o más, hasta $ 600.000, en Centro" */
export function buscaTexto(b) {
    if (!b) return "";
    const tipo = b.tipo ? TIPOS[b.tipo]?.texto ?? "Propiedad" : "Propiedad";
    const partes = [`${tipo} en ${OPERACIONES[b.operacion]?.toLowerCase() ?? ""}`.trim()];
    if (b.ambientes) partes.push(`${b.ambientes === 1 ? "1 ambiente" : `${b.ambientes} ambientes`} o más`);
    if (b.hasta) partes.push(`hasta ${b.operacion === "venta" ? dolares(b.hasta) : pesos(b.hasta)}`);
    if (b.zona) partes.push(ZONAS[b.zona]?.nombre ?? "");
    return partes.filter(Boolean).join(" · ");
}

// ---------- Funciones de datos ----------

/** `prefijo` y `reloj` cambian solo en las pruebas. */
export function crearDatos(prefijo = MARCA.prefijo, { reloj = () => new Date() } = {}) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla: () => semilla(reloj()) });
    const db = () => guardado.db();
    const hoy = () => isoDe(reloj());
    const ahoraISO = () => reloj().toISOString();
    const minutoActual = () => reloj().getHours() * 60 + reloj().getMinutes();
    const nombreDe = (id) => buscarPersona(id)?.nombre ?? "Alguien";
    const revisarTope = (lista, tope, que) => exigir(lista.length < tope, `Ya hay ${tope} ${que}. Es una demo: tocá "Empezar de cero" arriba.`);

    // ----- Propiedades -----

    const visitasDe = (propiedadId) => db().visitas.filter((v) => v.propiedadId === propiedadId && !v.anulado);

    function armarPropiedad(p) {
        const hechas = visitasDe(p.id).filter((v) => v.estado === "hecha").sort((a, b) => b.fecha.localeCompare(a.fecha));
        const ultima = hechas[0]?.fecha ?? null;
        const desde = ultima ?? p.publicada.slice(0, 10);
        return {
            ...copia(p),
            tipoTexto: TIPOS[p.tipo]?.texto ?? "Propiedad",
            icono: TIPOS[p.tipo]?.icono ?? "ti-home",
            zonaNombre: ZONAS[p.zona]?.nombre ?? "",
            precioTexto: precioTexto(p),
            expensasTexto: p.expensas ? `${pesos(p.expensas)} de expensas` : "Sin expensas",
            estadoTexto: ESTADOS_PROPIEDAD[p.estado],
            agente: nombreDe(p.agenteId),
            visitas30: hechas.filter((v) => diasEntre(v.fecha, hoy()) <= SIN_VISITAS_DIAS).length,
            ultimaVisita: ultima,
            diasSinVisitas: diasEntre(desde, hoy()),
            proximas: visitasDe(p.id).filter((v) => ["pedida", "confirmada"].includes(v.estado) && v.fecha >= hoy()).length
        };
    }

    /**
     * Las propiedades, las más nuevas primero. Filtros: operación, tipo, ambientes (o más), hasta un precio, zona y
     * texto. `todas` (solo la inmobiliaria) muestra también las reservadas, alquiladas y vendidas.
     */
    function listarPropiedades({ operacion = null, tipo = null, ambientes = null, hasta = null, zona = null, texto = "", todas = false } = {}) {
        const t = normal(texto);
        return db().propiedades
            .filter((p) => (todas || p.estado === "disponible")
                && (!operacion || p.operacion === operacion)
                && (!tipo || p.tipo === tipo)
                && (!ambientes || p.ambientes >= ambientes)
                && (!hasta || p.precio <= hasta)
                && (!zona || p.zona === zona)
                && (!t || normal(`${p.titulo} ${TIPOS[p.tipo]?.texto} ${ZONAS[p.zona]?.nombre} ${p.caracteristicas.join(" ")}`).includes(t)))
            .sort((a, b) => b.publicada.localeCompare(a.publicada))
            .map(armarPropiedad);
    }

    const propiedad = (id) => armarPropiedad(buscar(db().propiedades, id, "Esa propiedad no existe."));

    /** Las consultas abiertas que buscan algo como esta propiedad (sin contar a las que ya preguntaron por ella). */
    function quienesBuscan(propiedadId) {
        const p = buscar(db().propiedades, propiedadId, "Esa propiedad no existe.");
        return db().consultas
            .filter((c) => ABIERTAS.includes(c.estado) && c.propiedadId !== p.id && leSirve(c.busca, p))
            .map(armarConsulta);
    }

    /** Las propiedades disponibles que le sirven a una consulta (sin la que ya preguntó). */
    function leSirvenA(consultaId) {
        const c = buscar(db().consultas, consultaId, "Esa consulta no existe.");
        return db().propiedades.filter((p) => p.id !== c.propiedadId && leSirve(c.busca, p)).map(armarPropiedad);
    }

    function revisarPrecio(operacion, precio) {
        return enteroHasta(precio, operacion === "venta" ? "El precio (en dólares)" : "El alquiler por mes", { desde: 1, hasta: operacion === "venta" ? TOPES.venta : TOPES.alquiler });
    }

    /** Cargar una propiedad nueva (la inmobiliaria). Las fotos sacadas con el celu no se guardan acá (quedan en la pantalla). */
    function cargarPropiedad(usuario, { titulo, tipo, operacion, zona, ambientes, dormitorios = 0, banos = 1, m2, precio, expensas = 0, caracteristicas = [], descripcion = "" } = {}) {
        exigir(esStaff(usuario), "Las propiedades las carga la inmobiliaria.");
        const t = sinPasarse(titulo, TOPES.titulo, "el título");
        exigir(t, "Poné un título (ej: Depto 2 ambientes con balcón).");
        exigir(TIPOS[tipo], "Elegí el tipo de propiedad.");
        exigir(OPERACIONES[operacion], "Elegí si es para alquilar o vender.");
        exigir(ZONAS[zona], "Elegí la zona.");
        revisarTope(db().propiedades, TOPES.propiedades, "propiedades");
        const lista = Array.isArray(caracteristicas) ? caracteristicas : [];
        exigir(lista.every((x) => CARACTERISTICAS.includes(x)), "Hay una característica que no está en la lista.");
        const p = {
            id: nuevoId("p"), titulo: t, tipo, operacion, zona,
            ambientes: enteroHasta(ambientes, "Los ambientes", { desde: 1, hasta: TOPES.ambientes }),
            dormitorios: enteroHasta(dormitorios, "Los dormitorios", { hasta: TOPES.ambientes }),
            banos: enteroHasta(banos, "Los baños", { hasta: TOPES.ambientes }),
            m2: enteroHasta(m2, "Los metros cuadrados", { desde: 1, hasta: TOPES.m2 }),
            precio: revisarPrecio(operacion, precio),
            expensas: enteroHasta(expensas, "Las expensas", { hasta: TOPES.expensas }),
            caracteristicas: [...new Set(lista)],
            descripcion: sinPasarse(descripcion, TOPES.descripcion, "la descripción"),
            agenteId: usuario.id, estado: "disponible", publicada: ahoraISO(), fotos: [], recorrido: null, nueva: true
        };
        exigir(p.dormitorios < p.ambientes || p.ambientes === 1, "Los dormitorios tienen que ser menos que los ambientes.");
        db().propiedades.push(p);
        guardado.persistir();
        return armarPropiedad(p);
    }

    /** Reservada, alquilada, vendida o de nuevo disponible (la inmobiliaria). */
    function cambiarEstadoPropiedad(usuario, id, estado) {
        exigir(esStaff(usuario), "Eso lo cambia la inmobiliaria.");
        exigir(ESTADOS_PROPIEDAD[estado], "Ese estado no existe.");
        const p = buscar(db().propiedades, id, "Esa propiedad no existe.");
        exigir(estado === "disponible" || estado === "reservada" || (estado === "alquilada") === (p.operacion === "alquiler"), p.operacion === "venta" ? "Una propiedad en venta se vende, no se alquila." : "Una propiedad en alquiler se alquila, no se vende.");
        p.estado = estado;
        guardado.persistir();
        return armarPropiedad(p);
    }

    // ----- Visitas -----

    function armarVisita(v) {
        const p = db().propiedades.find((x) => x.id === v.propiedadId);
        const c = v.consultaId ? db().consultas.find((x) => x.id === v.consultaId) : null;
        const empezo = v.fecha < hoy() || (v.fecha === hoy() && v.inicio <= minutoActual());
        return {
            ...copia(v),
            hora: aHora(v.inicio),
            hasta: aHora(v.inicio + v.duracion),
            fechaNombre: nombreFecha(v.fecha, hoy()),
            propiedad: p?.titulo ?? "Propiedad",
            zonaNombre: ZONAS[p?.zona]?.nombre ?? "",
            agente: nombreDe(v.agenteId),
            estadoTexto: ESTADOS_VISITA[v.estado],
            consultaNombre: c?.nombre ?? v.quien,
            empezo
        };
    }

    /** Los próximos días con su horario (los domingos, cerrados). */
    const dias = () => Array.from({ length: TOPES.dias }, (_, i) => sumarDias(hoy(), i))
        .map((fecha) => ({ fecha, nombre: nombreFecha(fecha, hoy()), cerrado: !horarioDe(fecha) }));

    const desdeMinuto = (fecha) => (fecha === hoy() ? minutoActual() + 60 : null); // hoy, con al menos una hora para llegar

    /** Los horarios libres para visitar una propiedad un día: [{ inicio, agentes }] (primero el agente de la propiedad). */
    function libresParaVisita(propiedadId, fecha) {
        const p = buscar(db().propiedades, propiedadId, "Esa propiedad no existe.");
        const horario = esFechaISO(fecha) ? horarioDe(fecha) : null;
        if (!horario) return [];
        const orden = [p.agenteId, ...AGENTES.filter((a) => a !== p.agenteId)];
        const porHora = new Map();
        orden.forEach((agenteId) => libres({ lugarId: agenteId, fecha, horario, turnos: db().visitas, desdeMinuto: desdeMinuto(fecha) })
            .forEach((inicio) => porHora.set(inicio, [...(porHora.get(inicio) ?? []), agenteId])));
        return [...porHora].sort((a, b) => a[0] - b[0]).map(([inicio, agentes]) => ({ inicio, agentes }));
    }

    function crearVisita({ propiedadId, consultaId, quien, fecha, inicio, agenteId = null, estado, visto }) {
        const p = buscar(db().propiedades, propiedadId, "Esa propiedad no existe.");
        exigir(p.estado === "disponible", "Esa propiedad ya no está disponible.");
        exigir(esFechaISO(fecha) && fecha >= hoy() && fecha <= sumarDias(hoy(), TOPES.dias - 1), `Las visitas se agendan de hoy a ${TOPES.dias - 1} días.`);
        const horario = horarioDe(fecha);
        exigir(horario, "Los domingos no hay visitas.");
        exigir(Number.isInteger(inicio), "Elegí la hora.");
        revisarTope(db().visitas, TOPES.visitas, "visitas");
        const agentes = agenteId ? [agenteId] : (libresParaVisita(propiedadId, fecha).find((l) => l.inicio === inicio)?.agentes ?? []);
        exigir(agentes.length, "Ese horario ya no está libre. Elegí otro.");
        exigir(AGENTES.includes(agentes[0]), "Ese agente no existe.");
        revisarLibre({ lugarId: agentes[0], fecha, inicio, horario, turnos: db().visitas, desdeMinuto: desdeMinuto(fecha) });
        const v = { id: nuevoId("v"), propiedadId, consultaId, quien, lugarId: agentes[0], agenteId: agentes[0], fecha, inicio, duracion: DURACION_VISITA, estado, anulado: false, visto, creada: ahoraISO() };
        db().visitas.push(v);
        return v;
    }

    /**
     * Valeria pide una visita desde la página: queda "pedida" (el horario queda tomado) y le llega a la inmobiliaria
     * como consulta nueva, que el agente confirma.
     */
    function pedirVisita(usuario, { propiedadId, fecha, inicio }) {
        exigir(esCliente(usuario), "Desde acá piden visita los que buscan.");
        const p = buscar(db().propiedades, propiedadId, "Esa propiedad no existe.");
        const mias = db().consultas.filter((c) => c.clienteId === usuario.id).map((c) => c.id);
        const porVenir = db().visitas.filter((v) => mias.includes(v.consultaId) && !v.anulado && ["pedida", "confirmada"].includes(v.estado) && v.fecha >= hoy());
        exigir(!porVenir.some((v) => v.propiedadId === p.id), "Ya tenés una visita pedida para esta propiedad. Mirala en \"Mis visitas\".");
        exigir(porVenir.length < TOPES.porVenir, `Ya tenés ${TOPES.porVenir} visitas por venir: es el máximo.`);
        let c = db().consultas.find((x) => x.clienteId === usuario.id && x.propiedadId === p.id && ABIERTAS.includes(x.estado));
        const esNueva = !c;
        if (esNueva) {
            revisarTope(db().consultas, TOPES.consultas, "consultas");
            c = {
                id: nuevoId("q"), nombre: `${usuario.nombre} ${usuario.apellido}`, clienteId: usuario.id, origen: "web", propiedadId: p.id,
                // busca algo parecido: hasta un 15 % más caro, redondeado ($ 598.000 → $ 600.000)
                busca: { operacion: p.operacion, tipo: p.tipo, ambientes: p.ambientes, hasta: Math.ceil((p.precio * 1.15) / (p.operacion === "venta" ? 5_000 : 50_000)) * (p.operacion === "venta" ? 5_000 : 50_000), zona: null },
                mensaje: "Pidió una visita desde la página.", estado: "nueva", creado: ahoraISO(), ultimoContacto: null, agenteId: p.agenteId, notas: []
            };
        }
        // Primero la visita (si el horario ya no está libre, no queda una consulta suelta)
        const v = crearVisita({ propiedadId: p.id, consultaId: c.id, quien: c.nombre, fecha, inicio, estado: "pedida", visto: false });
        if (esNueva) db().consultas.push(c);
        c.agenteId = v.agenteId;
        guardado.persistir();
        return armarVisita(v);
    }

    /** Las visitas de quien busca (Valeria): las que vienen y las anteriores. */
    function misVisitas(usuario) {
        const mias = db().consultas.filter((c) => c.clienteId === usuario?.id).map((c) => c.id);
        const todas = db().visitas.filter((v) => mias.includes(v.consultaId)).map(armarVisita);
        const vienen = todas.filter((v) => !v.anulado && ["pedida", "confirmada"].includes(v.estado) && v.fecha >= hoy())
            .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio - b.inicio);
        const anteriores = todas.filter((v) => !vienen.includes(v)).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio);
        return { vienen, anteriores };
    }

    const visita = (id) => armarVisita(buscar(db().visitas, id, "Esa visita no existe."));

    /** La inmobiliaria confirma una visita pedida: la consulta pasa a "visita agendada". */
    function confirmarVisita(usuario, id) {
        exigir(esStaff(usuario), "Las visitas las confirma la inmobiliaria.");
        const v = buscar(db().visitas, id, "Esa visita no existe.");
        exigir(v.estado === "pedida" && !v.anulado, "Esa visita ya no está para confirmar.");
        v.estado = "confirmada";
        v.visto = true;
        const c = db().consultas.find((x) => x.id === v.consultaId);
        if (c) {
            c.estado = "agendada";
            c.ultimoContacto = ahoraISO();
        }
        guardado.persistir();
        return armarVisita(v);
    }

    /** Cancelar (la inmobiliaria o quien la pidió): el horario queda libre. Nada se borra. */
    function cancelarVisita(usuario, id) {
        const v = buscar(db().visitas, id, "Esa visita no existe.");
        const c = db().consultas.find((x) => x.id === v.consultaId);
        exigir(esStaff(usuario) || (esCliente(usuario) && c?.clienteId === usuario.id), "No podés cancelar esta visita.");
        exigir(!v.anulado && ["pedida", "confirmada"].includes(v.estado), "Esa visita ya no se puede cancelar.");
        Object.assign(v, { estado: "cancelada", anulado: true, canceladaPor: usuario.id, canceladaEl: ahoraISO(), visto: true });
        if (c && ["agendada", "nueva"].includes(c.estado) && !db().visitas.some((x) => x.consultaId === c.id && !x.anulado && ["pedida", "confirmada"].includes(x.estado))) c.estado = "nueva";
        guardado.persistir();
        return armarVisita(v);
    }

    /** Después de la hora: "Visitó" o "No vino". */
    function marcarVisita(usuario, id, estado) {
        exigir(esStaff(usuario), "Eso lo marca la inmobiliaria.");
        exigir(["hecha", "falto"].includes(estado), "Marcá si visitó o si no vino.");
        const v = buscar(db().visitas, id, "Esa visita no existe.");
        exigir(v.estado === "confirmada" && !v.anulado, "Esa visita no está confirmada.");
        exigir(armarVisita(v).empezo, "Todavía no es la hora de la visita.");
        v.estado = estado;
        const c = db().consultas.find((x) => x.id === v.consultaId);
        if (c && estado === "hecha" && c.estado === "agendada") c.estado = "visito";
        guardado.persistir();
        return armarVisita(v);
    }

    /** La inmobiliaria agenda una visita para una consulta (ya confirmada). */
    function agendarVisita(usuario, { consultaId, propiedadId, fecha, inicio, agenteId = null }) {
        exigir(esStaff(usuario), "Las visitas las agenda la inmobiliaria.");
        const c = buscar(db().consultas, consultaId, "Esa consulta no existe.");
        exigir(ABIERTAS.includes(c.estado), "Esa consulta está cerrada.");
        const v = crearVisita({ propiedadId, consultaId: c.id, quien: c.nombre, fecha, inicio, agenteId, estado: "confirmada", visto: true });
        if (["nueva", "visito", "interesada"].includes(c.estado)) c.estado = "agendada";
        c.ultimoContacto = ahoraISO();
        guardado.persistir();
        return armarVisita(v);
    }

    /** La agenda de un día: las visitas de cada agente (Tomás ve las suyas). */
    function agenda(usuario, fecha) {
        exigir(esStaff(usuario), "La agenda es de la inmobiliaria.");
        exigir(esFechaISO(fecha), "Esa fecha no existe.");
        const quienes = esDuena(usuario) ? AGENTES : [usuario.id];
        const delDia = db().visitas.filter((v) => v.fecha === fecha && !v.anulado && quienes.includes(v.agenteId)).map(armarVisita).sort((a, b) => a.inicio - b.inicio);
        return {
            fecha, nombre: nombreFecha(fecha, hoy()), cerrado: !horarioDe(fecha),
            columnas: quienes.map((id) => ({ agenteId: id, agente: nombreDe(id), visitas: delDia.filter((v) => v.agenteId === id) }))
        };
    }

    /** Cuántas visitas hay cada día de la semana que viene (para los días de la agenda). */
    function visitasPorDia(usuario) {
        const quienes = esDuena(usuario) ? AGENTES : [usuario?.id];
        return Object.fromEntries(dias().map((d) => [d.fecha, db().visitas.filter((v) => v.fecha === d.fecha && !v.anulado && quienes.includes(v.agenteId)).length]));
    }

    // ----- Consultas -----

    function armarConsulta(c) {
        const p = c.propiedadId ? db().propiedades.find((x) => x.id === c.propiedadId) : null;
        const suyas = db().visitas.filter((v) => v.consultaId === c.id).map(armarVisita).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio);
        const desde = c.ultimoContacto ?? c.creado;
        const pedida = suyas.find((v) => v.estado === "pedida" && !v.anulado) ?? null;
        return {
            ...copia(c),
            origenTexto: ORIGENES[c.origen]?.texto ?? "",
            origenIcono: ORIGENES[c.origen]?.icono ?? "ti-message-2",
            estadoTexto: ESTADOS_CONSULTA[c.estado],
            abierta: ABIERTAS.includes(c.estado),
            propiedad: p ? p.titulo : null,
            buscaTexto: buscaTexto(c.busca),
            agente: nombreDe(c.agenteId),
            visitas: suyas,
            pedida,
            proxima: suyas.filter((v) => v.estado === "confirmada" && !v.anulado && v.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio - b.inicio)[0] ?? null,
            sinContestar: !c.ultimoContacto && c.estado === "nueva",
            diasSinContacto: diasEntre(desde.slice(0, 10) === desde ? desde : isoDe(new Date(desde)), hoy())
        };
    }

    const ORDEN = { nueva: 0, agendada: 1, interesada: 2, visito: 3, cerrada: 4, descartada: 5 };

    /** Las consultas: primero las que tienen una visita pedida, después las nuevas y las abiertas; filtro por estado. */
    function listarConsultas({ estado = null, texto = "" } = {}) {
        const t = normal(texto);
        return db().consultas
            .filter((c) => (!estado || (estado === "abiertas" ? ABIERTAS.includes(c.estado) : c.estado === estado)) && (!t || normal(`${c.nombre} ${c.mensaje}`).includes(t)))
            .map(armarConsulta)
            .sort((a, b) => Number(!!b.pedida) - Number(!!a.pedida) || ORDEN[a.estado] - ORDEN[b.estado] || b.creado.localeCompare(a.creado));
    }

    const consulta = (id) => armarConsulta(buscar(db().consultas, id, "Esa consulta no existe."));

    /** Las visitas pedidas desde la página que todavía nadie miró (el aviso de arriba). */
    const pedidasSinVer = () => db().visitas.filter((v) => v.estado === "pedida" && !v.anulado && !v.visto).map(armarVisita);

    /** Al abrir la consulta, sus visitas pedidas dejan de figurar como "nuevas" arriba (siguen para confirmar). */
    function marcarVisto(usuario, consultaId) {
        exigir(esStaff(usuario), "Eso lo marca la inmobiliaria.");
        let cambio = false;
        db().visitas.filter((v) => v.consultaId === consultaId && !v.visto).forEach((v) => {
            v.visto = true;
            cambio = true;
        });
        if (cambio) guardado.persistir();
        return cambio;
    }

    /** Anotar una consulta que entró por WhatsApp, el portal, el cartel… */
    function nuevaConsulta(usuario, { nombre, origen, propiedadId = null, operacion, tipo = null, ambientes = null, hasta = null, zona = null, mensaje = "" } = {}) {
        exigir(esStaff(usuario), "Las consultas las anota la inmobiliaria.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre de quien consulta.");
        exigir(ORIGENES[origen] && origen !== "web", "Elegí por dónde llegó.");
        exigir(OPERACIONES[operacion], "Elegí si busca alquilar o comprar.");
        exigir(!tipo || TIPOS[tipo], "Ese tipo de propiedad no existe.");
        exigir(!zona || ZONAS[zona], "Esa zona no existe.");
        exigir(!propiedadId || db().propiedades.some((p) => p.id === propiedadId), "Esa propiedad no existe.");
        revisarTope(db().consultas, TOPES.consultas, "consultas");
        const c = {
            id: nuevoId("q"), nombre: n, clienteId: null, origen, propiedadId,
            busca: {
                operacion, tipo,
                ambientes: ambientes === null || ambientes === "" ? null : enteroHasta(ambientes, "Los ambientes", { desde: 1, hasta: TOPES.ambientes }),
                hasta: hasta === null || hasta === "" ? null : revisarPrecio(operacion, hasta),
                zona
            },
            mensaje: sinPasarse(mensaje, TOPES.mensaje, "lo que preguntó"),
            estado: "nueva", creado: ahoraISO(), ultimoContacto: null, agenteId: usuario.id, notas: []
        };
        db().consultas.push(c);
        guardado.persistir();
        return armarConsulta(c);
    }

    function cambiarEstadoConsulta(usuario, id, estado) {
        exigir(esStaff(usuario), "Eso lo cambia la inmobiliaria.");
        exigir(ESTADOS_CONSULTA[estado], "Ese estado no existe.");
        const c = buscar(db().consultas, id, "Esa consulta no existe.");
        c.estado = estado;
        guardado.persistir();
        return armarConsulta(c);
    }

    function anotar(usuario, id, texto) {
        exigir(esStaff(usuario), "Las notas son de la inmobiliaria.");
        const c = buscar(db().consultas, id, "Esa consulta no existe.");
        const t = sinPasarse(texto, TOPES.nota, "la nota");
        exigir(t, "Escribí la nota.");
        exigir(c.notas.length < TOPES.notas, `Ya hay ${TOPES.notas} notas en esta consulta. Es una demo: tocá "Empezar de cero" arriba.`);
        c.notas.push({ texto: t, por: usuario.id, fecha: ahoraISO() });
        guardado.persistir();
        return armarConsulta(c);
    }

    /** Se le escribió (al copiar un mensaje): deja de figurar "sin contestar". */
    function marcarContacto(usuario, id) {
        exigir(esStaff(usuario), "Eso lo marca la inmobiliaria.");
        const c = buscar(db().consultas, id, "Esa consulta no existe.");
        c.ultimoContacto = ahoraISO();
        guardado.persistir();
        return armarConsulta(c);
    }

    // ----- Mensajes armados (para copiar; en la versión real abren WhatsApp) -----
    const primerNombre = (n) => String(n).split(" ")[0];
    const firma = (usuario) => `${usuario.nombre}, ${NEGOCIO}`;

    function mensajeVisita(usuario, visitaId) {
        const v = armarVisita(buscar(db().visitas, visitaId, "Esa visita no existe."));
        return `Hola ${primerNombre(v.consultaNombre)}! Te confirmo la visita al ${v.propiedad} (${v.zonaNombre}) el ${v.fechaNombre} a las ${v.hora}. Te acompaña ${v.agente}. Te mando la ficha; la dirección exacta te la paso por acá ese día. Cualquier cosa, escribime. ${firma(usuario)}`;
    }

    function mensajeSeguimiento(usuario, consultaId) {
        const c = armarConsulta(buscar(db().consultas, consultaId, "Esa consulta no existe."));
        const opciones = leSirvenA(c.id);
        const extra = opciones.length ? ` Entró ${opciones.length === 1 ? "una propiedad" : `${opciones.length} propiedades`} que te puede${opciones.length === 1 ? "" : "n"} servir: ${opciones.slice(0, 2).map((p) => p.titulo).join(" y ")}.` : "";
        return `Hola ${primerNombre(c.nombre)}! ¿Cómo va la búsqueda?${extra} Si querés coordinamos una visita. ${firma(usuario)}`;
    }

    function mensajeCoincidencia(usuario, consultaId, propiedadId) {
        const c = buscar(db().consultas, consultaId, "Esa consulta no existe.");
        const p = armarPropiedad(buscar(db().propiedades, propiedadId, "Esa propiedad no existe."));
        return `Hola ${primerNombre(c.nombre)}! Tenemos algo que te puede servir: ${p.titulo} en ${p.zonaNombre}, ${p.precioTexto}. ¿Querés verlo? ${firma(usuario)}`;
    }

    // ----- Alquileres (solo la dueña) -----

    function armarAlquiler(c) {
        const h = hoy();
        const fin = finDe(c);
        const vencido = ultimoVencido(h);
        const periodos = periodosDe(c, h);
        const pagado = (periodo) => c.pagos.find((p) => p.periodo === periodo) ?? null;
        const deuda = periodos.filter((p) => p <= vencido && !pagado(p));
        const aumento = proximoAumento(c, h);
        return {
            ...copia(c),
            zonaNombre: ZONAS[c.zona]?.nombre ?? "",
            titulo: `${c.que} · ${ZONAS[c.zona]?.nombre ?? ""}`,
            fin,
            diasParaFin: diasEntre(h, fin),
            terminado: fin <= h,
            montoActual: montoEn(c, h),
            aumento,
            aumentaPronto: !!aumento && aumento.dias <= AVISO_AUMENTO_DIAS,
            ajusteSinAvisar: c.ajustes.find((a) => !a.avisado && a.desde >= primeroDelMes(h, -1)) ?? null,
            vencePronto: diasEntre(h, fin) <= AVISO_FIN_DIAS && fin > h,
            deuda: deuda.map((periodo) => ({ periodo, mes: nombreMes(periodo), monto: montoEn(c, `${periodo}-01`), vence: `${DIA_VENCE}/${Number(periodo.slice(5, 7))}` })),
            cuotas: periodos.slice().reverse().map((periodo) => ({
                periodo, mes: nombreMes(periodo), monto: montoEn(c, `${periodo}-01`), pago: pagado(periodo),
                estado: pagado(periodo) ? "pago" : periodo <= vencido ? "debe" : "vence"
            }))
        };
    }

    function listarAlquileres(usuario) {
        exigir(esDuena(usuario), "Los alquileres los lleva la dueña.");
        return db().alquileres.map(armarAlquiler).sort((a, b) => b.deuda.length - a.deuda.length || Number(b.aumentaPronto) - Number(a.aumentaPronto) || a.fin.localeCompare(b.fin));
    }

    function alquiler(usuario, id) {
        exigir(esDuena(usuario), "Los alquileres los lleva la dueña.");
        return armarAlquiler(buscar(db().alquileres, id, "Ese alquiler no existe."));
    }

    /** Aplica el próximo aumento con el porcentaje que se pase (el del índice de ejemplo o el que diga la dueña). */
    function aplicarAumento(usuario, id, porcentaje) {
        exigir(esDuena(usuario), "Los aumentos los aplica la dueña.");
        const c = buscar(db().alquileres, id, "Ese alquiler no existe.");
        const prox = proximoAumento(c, hoy());
        exigir(prox, "Este alquiler no tiene más aumentos.");
        exigir(prox.dias <= AVISO_AUMENTO_DIAS, `El aumento se aplica desde ${AVISO_AUMENTO_DIAS} días antes (falta para el ${diaMes(prox.desde)}).`);
        const pct = Number(porcentaje);
        exigir(Number.isFinite(pct) && pct >= TOPES.aumentoMin && pct <= TOPES.aumentoMax && Math.round(pct * 100) === pct * 100,
            `El aumento tiene que estar entre ${TOPES.aumentoMin} % y ${TOPES.aumentoMax} % (hasta 2 decimales).`);
        const monto = redondearCien(prox.antes * (1 + pct / 100));
        exigir(monto >= 100 && monto <= TOPES.alquiler, `El alquiler quedaría en ${pesos(monto)}: revisá el porcentaje.`);
        c.ajustes.push({ desde: prox.desde, porcentaje: pct, monto, por: usuario.id, el: ahoraISO(), avisado: false });
        guardado.persistir();
        return armarAlquiler(c);
    }

    /** Se avisó al inquilino del aumento (al copiar el mensaje). */
    function marcarAvisado(usuario, id) {
        exigir(esDuena(usuario), "Eso lo marca la dueña.");
        const c = buscar(db().alquileres, id, "Ese alquiler no existe.");
        const a = c.ajustes.find((x) => !x.avisado);
        exigir(a, "No hay aumentos para avisar.");
        a.avisado = true;
        guardado.persistir();
        return armarAlquiler(c);
    }

    /** Anotar que pagó un mes. */
    function registrarPago(usuario, id, periodo) {
        exigir(esDuena(usuario), "Los pagos los anota la dueña.");
        const c = buscar(db().alquileres, id, "Ese alquiler no existe.");
        exigir(periodosDe(c, hoy()).includes(periodo), "Ese mes no es de este alquiler.");
        exigir(!c.pagos.some((p) => p.periodo === periodo), `El mes de ${nombreMes(periodo)} ya está pago.`);
        exigir(db().alquileres.reduce((t, x) => t + x.pagos.length, 0) < TOPES.pagos, `Ya hay ${TOPES.pagos} pagos. Es una demo: tocá "Empezar de cero" arriba.`);
        c.pagos.push({ periodo, fecha: ahoraISO(), monto: montoEn(c, `${periodo}-01`), por: usuario.id });
        guardado.persistir();
        return armarAlquiler(c);
    }

    function mensajeAumento(usuario, id) {
        const c = alquiler(usuario, id);
        const a = [...c.ajustes].sort((x, y) => y.desde.localeCompare(x.desde))[0];
        exigir(a, "Este alquiler todavía no tuvo aumentos.");
        const antes = montoEn(buscar(db().alquileres, id), sumarDias(a.desde, -1));
        return `Hola ${primerNombre(c.inquilino)}! Te escribo por el alquiler del ${c.que.toLowerCase()} (${c.zonaNombre}). Como corresponde cada ${c.cadaMeses} meses, desde el ${diaMes(a.desde)} se actualiza de ${pesos(antes)} a ${pesos(a.monto)} (${porcentajeTexto(a.porcentaje)}). Cualquier duda, escribime. ${firma(usuario)}`;
    }

    function mensajeDeuda(usuario, id) {
        const c = alquiler(usuario, id);
        exigir(c.deuda.length, "Este alquiler está al día.");
        const d = c.deuda[0];
        const varios = c.deuda.length > 1 ? ` (y ${c.deuda.length - 1} mes${c.deuda.length > 2 ? "es" : ""} más)` : "";
        return `Hola ${primerNombre(c.inquilino)}! Te recuerdo que el alquiler de ${d.mes} (${pesos(d.monto)}) vencía el ${d.vence}${varios} y todavía no lo tenemos anotado. Si ya lo pagaste, avisame así lo registro. Gracias! ${firma(usuario)}`;
    }

    function mensajeFin(usuario, id) {
        const c = alquiler(usuario, id);
        return `Hola ${primerNombre(c.inquilino)}! El alquiler del ${c.que.toLowerCase()} (${c.zonaNombre}) termina el ${diaMes(c.fin)}. ¿Querés renovarlo? Así lo hablamos con ${primerNombre(c.propietario)}, el propietario, con tiempo. ${firma(usuario)}`;
    }

    // ----- "Este mes": lo que la dueña tiene que mirar -----

    function tablero(usuario) {
        exigir(esDuena(usuario), "\"Este mes\" es de la dueña.");
        const alquileres = db().alquileres.map(armarAlquiler).filter((c) => !c.terminado);
        const disponibles = db().propiedades.filter((p) => p.estado === "disponible").map(armarPropiedad);
        const consultas = db().consultas.filter((c) => ABIERTAS.includes(c.estado)).map(armarConsulta);
        return {
            aumentos: alquileres.filter((c) => c.aumentaPronto).sort((a, b) => a.aumento.desde.localeCompare(b.aumento.desde)),
            sinAvisar: alquileres.filter((c) => c.ajusteSinAvisar),
            vencen: alquileres.filter((c) => c.vencePronto).sort((a, b) => a.fin.localeCompare(b.fin)),
            deben: alquileres.filter((c) => c.deuda.length),
            sinVisitas: disponibles.filter((p) => p.diasSinVisitas > SIN_VISITAS_DIAS && !p.proximas).sort((a, b) => b.diasSinVisitas - a.diasSinVisitas),
            sinContestar: consultas.filter((c) => c.sinContestar || c.pedida),
            sinSeguimiento: consultas.filter((c) => !c.sinContestar && !c.pedida && !c.proxima && c.diasSinContacto >= SIN_CONTACTO_DIAS),
            cobrado: alquileres.reduce((t, c) => t + c.cuotas.filter((m) => m.periodo === periodoDe(hoy()) && m.pago).reduce((s, m) => s + m.monto, 0), 0),
            porCobrar: alquileres.reduce((t, c) => t + c.cuotas.filter((m) => m.periodo === periodoDe(hoy()) && !m.pago).reduce((s, m) => s + m.monto, 0), 0),
            mes: nombreMes(periodoDe(hoy()))
        };
    }

    return {
        guardado, hoy,
        listarPropiedades, propiedad, quienesBuscan, leSirvenA, cargarPropiedad, cambiarEstadoPropiedad,
        dias, libresParaVisita, pedirVisita, misVisitas, visita, confirmarVisita, cancelarVisita, marcarVisita, agendarVisita, agenda, visitasPorDia,
        listarConsultas, consulta, pedidasSinVer, marcarVisto, nuevaConsulta, cambiarEstadoConsulta, anotar, marcarContacto,
        mensajeVisita, mensajeSeguimiento, mensajeCoincidencia,
        listarAlquileres, alquiler, aplicarAumento, marcarAvisado, registrarPago, mensajeAumento, mensajeDeuda, mensajeFin,
        tablero
    };
}
