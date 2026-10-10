// ============================================
// Datos de Sazzo Gimnasio (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un gimnasio inventado ("Gimnasio Núcleo"): 3 profes, 40 socios con su rutina (plan pre armado por días), sus
// horarios fijos, 8 semanas de asistencias y de lo que levantaron, sus cuotas y pagos, y las clases con cupo.
// Todo se arma a partir de hoy (así la demo nunca se ve vieja): siempre hay 5 con la cuota vencida, 7 que vencen esta
// semana (Franco entre ellos), 4 que no vienen hace más de 3 semanas, 3 sin apto físico, 1 que avisó que pagó, y a
// Franco hoy le toca el Día B (piernas), con la sentadilla en 57,5 kg la vez pasada.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra (se anula o se archiva) y
// se devuelven copias. Sin teléfonos, mails ni documentos: nada de datos personales. Pagos de ejemplo, sin tarjetas.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=665396befd";
import { filtrarPorTexto } from "../kit/js/buscar.js?v=665396befd";
import { sinPasarse } from "../kit/js/topes.js?v=665396befd";
import { fechaLocalISO } from "../kit/js/fechas.js?v=665396befd";
import { aMinutos, aHora, diaSemana } from "../kit/js/turnos.js?v=665396befd";
import { esFirma } from "../kit/js/firma.js?v=665396befd";
import { MARCA, NEGOCIO } from "./marca.js?v=665396befd";

export const VERSION_DATOS = 1;

export const TOPES = {
    nombre: 40,
    objetivo: 80,
    nota: 200,
    notasPorSocio: 50,
    socios: 300,
    peso: 400, // kg
    reps: 100,
    segundos: 1800, // ejercicios por tiempo (plancha, bici)
    series: 10,
    descansoMin: 15, // segundos
    descansoMax: 600,
    diasPlan: 8,
    ejerciciosPorDia: 15,
    planes: 40,
    reservasActivas: 7,
    diasReserva: 7, // se reserva de hoy a 6 días adelante
    monto: 1_000_000,
    pagos: 3000,
    asistencias: 8000,
    entrenos: 4000,
    reservas: 3000
};

export const VENCE_PRONTO = 7; // "vence esta semana": de hoy a 7 días
export const NO_VIENEN = 21; // días sin venir para "no vienen hace +3 semanas"
export const SIN_ANOTAR = 14; // días sin anotar nada (viniendo) para el aviso al profe
export const REAVISAR_DIAS = 3; // no mandar dos recordatorios de cuota seguidos
export const REINVITAR_DIAS = 7;
export const APTO_DURA = 365;
export const ALIAS = "nucleo.gimnasio.demo"; // alias de ejemplo (no existe)

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo
export const HORAS = ["07:00", "08:00", "09:00", "10:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const LETRAS = "ABCDEFGH";

/** Qué socio de la lista es la persona que entra como socio, y qué profe es el profe. */
export const SOCIO_DE = { "u-socio": "s-franco" };
export const PROFE_DE = { "u-profe": "p-mauro" };

export const PROFES = [
    { id: "p-mauro", nombre: "Mauro", que: "Musculación" },
    { id: "p-sol", nombre: "Sol", que: "Pilates y yoga" },
    { id: "p-tomi", nombre: "Tomi", que: "Funcional y spinning" }
];

// Montos de ejemplo del gimnasio de la demo (no tienen nada que ver con Sazzo)
export const PLANES_CUOTA = [
    { id: "libre", texto: "Pase libre", monto: 32_000 },
    { id: "3x", texto: "3 veces por semana", monto: 27_000 },
    { id: "2x", texto: "2 veces por semana", monto: 22_000 },
    { id: "pack8", texto: "Pack 8 clases", monto: 18_000, clases: 8 }
];

// tipo: "peso" (kg y repeticiones), "corporal" (solo repeticiones) o "tiempo" (segundos)
export const EJERCICIOS = [
    { id: "sentadilla", nombre: "Sentadilla con barra", grupo: "Piernas", tipo: "peso" },
    { id: "prensa", nombre: "Prensa 45°", grupo: "Piernas", tipo: "peso" },
    { id: "estocadas", nombre: "Estocadas con mancuernas", grupo: "Piernas", tipo: "peso" },
    { id: "sillon", nombre: "Sillón de cuádriceps", grupo: "Piernas", tipo: "peso" },
    { id: "camilla", nombre: "Camilla femoral", grupo: "Piernas", tipo: "peso" },
    { id: "rumano", nombre: "Peso muerto rumano", grupo: "Piernas", tipo: "peso" },
    { id: "gemelos", nombre: "Gemelos en máquina", grupo: "Piernas", tipo: "peso" },
    { id: "hip-thrust", nombre: "Hip thrust", grupo: "Piernas", tipo: "peso" },
    { id: "banca", nombre: "Press de banca", grupo: "Pecho", tipo: "peso" },
    { id: "inclinado", nombre: "Press inclinado con mancuernas", grupo: "Pecho", tipo: "peso" },
    { id: "aperturas", nombre: "Aperturas con mancuernas", grupo: "Pecho", tipo: "peso" },
    { id: "fondos", nombre: "Fondos en paralelas", grupo: "Pecho", tipo: "corporal" },
    { id: "flexiones", nombre: "Flexiones de brazos", grupo: "Pecho", tipo: "corporal" },
    { id: "dominadas", nombre: "Dominadas", grupo: "Espalda", tipo: "corporal" },
    { id: "jalon", nombre: "Jalón al pecho", grupo: "Espalda", tipo: "peso" },
    { id: "remo-barra", nombre: "Remo con barra", grupo: "Espalda", tipo: "peso" },
    { id: "remo-mancuerna", nombre: "Remo con mancuerna", grupo: "Espalda", tipo: "peso" },
    { id: "peso-muerto", nombre: "Peso muerto", grupo: "Espalda", tipo: "peso" },
    { id: "militar", nombre: "Press militar", grupo: "Hombros", tipo: "peso" },
    { id: "vuelos", nombre: "Vuelos laterales", grupo: "Hombros", tipo: "peso" },
    { id: "face-pull", nombre: "Face pull en polea", grupo: "Hombros", tipo: "peso" },
    { id: "biceps", nombre: "Curl de bíceps con barra", grupo: "Brazos", tipo: "peso" },
    { id: "martillo", nombre: "Curl martillo", grupo: "Brazos", tipo: "peso" },
    { id: "triceps", nombre: "Tríceps en polea", grupo: "Brazos", tipo: "peso" },
    { id: "frances", nombre: "Press francés", grupo: "Brazos", tipo: "peso" },
    { id: "plancha", nombre: "Plancha", grupo: "Core", tipo: "tiempo" },
    { id: "abdominales", nombre: "Abdominales en colchoneta", grupo: "Core", tipo: "corporal" },
    { id: "rueda", nombre: "Rueda abdominal", grupo: "Core", tipo: "corporal" },
    { id: "pallof", nombre: "Press Pallof en polea", grupo: "Core", tipo: "peso" },
    { id: "bici", nombre: "Bicicleta fija", grupo: "Cardio", tipo: "tiempo" },
    { id: "cinta", nombre: "Cinta caminando rápido", grupo: "Cardio", tipo: "tiempo" },
    { id: "soga", nombre: "Saltar la soga", grupo: "Cardio", tipo: "tiempo" },
    { id: "remo-ergo", nombre: "Remo ergómetro", grupo: "Cardio", tipo: "tiempo" },
    { id: "burpees", nombre: "Burpees", grupo: "Funcional", tipo: "corporal" },
    { id: "kettlebell", nombre: "Swing con pesa rusa", grupo: "Funcional", tipo: "peso" },
    { id: "cajon", nombre: "Salto al cajón", grupo: "Funcional", tipo: "corporal" },
    { id: "wall-ball", nombre: "Wall ball", grupo: "Funcional", tipo: "peso" }
];
const EJ = Object.fromEntries(EJERCICIOS.map((e) => [e.id, e]));
export const ejercicio = (id) => {
    const e = EJ[id];
    if (!e) throw new Error("Ese ejercicio no existe.");
    return e;
};

// Ejercicio de un día: [id, series, repeticiones (o segundos), descanso en segundos, peso de arranque en kg]
const dia = (id, nombre, items) => ({ id, nombre, ejercicios: items.map(([ejercicioId, series, reps, descanso, peso = 0]) => ({ ejercicioId, series, reps, descanso, peso })) });

/** Las rutinas de ejemplo (el profe las copia, las cambia y las asigna). Son de ejemplo: nada de consejos médicos. */
export const PLANES_BASE = [
    {
        id: "fuerza-3", nombre: "Fuerza 3 días", nivel: "Intermedio",
        dias: [
            dia("A", "Pecho y espalda", [["banca", 4, 8, 120, 50], ["remo-barra", 4, 8, 120, 40], ["inclinado", 3, 10, 90, 16], ["jalon", 3, 10, 90, 45], ["plancha", 3, 40, 60]]),
            dia("B", "Piernas y core", [["sentadilla", 4, 8, 120, 55], ["prensa", 3, 10, 90, 120], ["rumano", 3, 10, 90, 40], ["estocadas", 3, 12, 60, 12], ["gemelos", 3, 15, 60, 60], ["plancha", 3, 45, 60]]),
            dia("C", "Hombros y brazos", [["militar", 4, 8, 90, 30], ["vuelos", 3, 12, 60, 8], ["biceps", 3, 10, 60, 25], ["triceps", 3, 12, 60, 20], ["martillo", 3, 12, 60, 12], ["abdominales", 3, 20, 45]])
        ]
    },
    {
        id: "principiante-3", nombre: "Principiante 3 días", nivel: "Principiante",
        dias: [
            dia("A", "Cuerpo completo 1", [["bici", 1, 600, 60], ["prensa", 3, 12, 90, 80], ["jalon", 3, 12, 90, 30], ["inclinado", 3, 12, 90, 8], ["plancha", 3, 30, 60]]),
            dia("B", "Cuerpo completo 2", [["cinta", 1, 600, 60], ["sillon", 3, 12, 60, 25], ["remo-mancuerna", 3, 12, 60, 10], ["militar", 3, 12, 90, 15], ["abdominales", 3, 15, 45]]),
            dia("C", "Cuerpo completo 3", [["bici", 1, 600, 60], ["camilla", 3, 12, 60, 20], ["flexiones", 3, 10, 60], ["biceps", 3, 12, 60, 15], ["triceps", 3, 12, 60, 15]])
        ]
    },
    {
        id: "tonificacion-3", nombre: "Tonificación 3 días", nivel: "Todos",
        dias: [
            dia("A", "Piernas y glúteos", [["hip-thrust", 4, 12, 90, 40], ["estocadas", 3, 12, 60, 8], ["sillon", 3, 15, 60, 20], ["camilla", 3, 15, 60, 15], ["gemelos", 3, 20, 45, 40]]),
            dia("B", "Tren superior", [["jalon", 3, 12, 60, 30], ["inclinado", 3, 12, 60, 8], ["remo-mancuerna", 3, 12, 60, 8], ["vuelos", 3, 15, 45, 5], ["triceps", 3, 15, 45, 12]]),
            dia("C", "Circuito y core", [["kettlebell", 4, 15, 60, 12], ["cajon", 4, 10, 60], ["soga", 4, 60, 60], ["rueda", 3, 10, 60], ["plancha", 3, 40, 45]])
        ]
    },
    {
        id: "fuerza-4", nombre: "Fuerza 4 días", nivel: "Avanzado",
        dias: [
            dia("A", "Pecho y tríceps", [["banca", 5, 5, 150, 70], ["inclinado", 4, 8, 90, 22], ["fondos", 3, 10, 90], ["frances", 3, 10, 60, 25], ["triceps", 3, 12, 60, 25]]),
            dia("B", "Espalda y bíceps", [["peso-muerto", 5, 5, 180, 90], ["dominadas", 4, 8, 120], ["remo-barra", 4, 8, 90, 55], ["biceps", 3, 10, 60, 30], ["martillo", 3, 12, 60, 14]]),
            dia("C", "Piernas", [["sentadilla", 5, 5, 180, 80], ["prensa", 4, 10, 120, 160], ["rumano", 3, 8, 120, 60], ["camilla", 3, 12, 60, 35], ["gemelos", 4, 15, 60, 80]]),
            dia("D", "Hombros y core", [["militar", 5, 5, 120, 40], ["vuelos", 4, 12, 60, 10], ["face-pull", 3, 15, 60, 20], ["pallof", 3, 12, 60, 15], ["rueda", 3, 12, 60]])
        ]
    },
    {
        id: "funcional-2", nombre: "Funcional 2 días", nivel: "Todos",
        dias: [
            dia("A", "Circuito de fuerza", [["kettlebell", 4, 15, 45, 16], ["wall-ball", 4, 12, 45, 6], ["burpees", 4, 10, 45], ["remo-ergo", 4, 60, 45]]),
            dia("B", "Circuito de resistencia", [["soga", 5, 60, 30], ["cajon", 4, 12, 45], ["flexiones", 4, 12, 45], ["bici", 4, 120, 45]])
        ]
    }
];

/** Clases semanales con cupo. */
export const CLASES = [
    { id: "funcional-19", nombre: "Funcional", profeId: "p-tomi", dias: [1, 2, 3, 4, 5, 6], hora: "19:00", duracion: 60, cupo: 12 },
    { id: "funcional-dom", nombre: "Funcional", profeId: "p-tomi", dias: [0], hora: "10:00", duracion: 60, cupo: 12 },
    { id: "funcional-8", nombre: "Funcional", profeId: "p-tomi", dias: [1, 3, 5], hora: "08:00", duracion: 60, cupo: 12 },
    { id: "spinning-18", nombre: "Spinning", profeId: "p-tomi", dias: [2, 4], hora: "18:00", duracion: 45, cupo: 15 },
    { id: "spinning-20", nombre: "Spinning", profeId: "p-tomi", dias: [1, 3], hora: "20:00", duracion: 45, cupo: 15 },
    { id: "pilates-10", nombre: "Pilates", profeId: "p-sol", dias: [1, 3, 5], hora: "10:00", duracion: 60, cupo: 8 },
    { id: "pilates-18", nombre: "Pilates", profeId: "p-sol", dias: [2, 4], hora: "18:00", duracion: 60, cupo: 8 },
    { id: "yoga-sab", nombre: "Yoga", profeId: "p-sol", dias: [6], hora: "10:00", duracion: 60, cupo: 10 }
];

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
/** "57,5 kg" (con coma, sin ceros de más). */
export const kilos = (n) => `${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg`;
/** "8" repeticiones, o "45 s" / "10 min" si el ejercicio es por tiempo. */
export function cuanto(tipo, reps) {
    if (tipo !== "tiempo") return String(reps);
    return reps >= 120 && reps % 60 === 0 ? `${reps / 60} min` : `${reps} s`;
}

// ---------- Fechas (en hora local, sin depender del reloj) ----------

const aFecha = (iso) => new Date(`${iso}T12:00:00`);
const deFecha = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const sumarDias = (iso, n) => {
    const d = aFecha(iso);
    d.setDate(d.getDate() + n);
    return deFecha(d);
};
export const diasEntre = (desde, hasta) => Math.round((aFecha(hasta) - aFecha(desde)) / 864e5);
/** El mismo día del mes que viene (si no existe, el último: 31/01 → 28/02 o 29/02). */
export function sumarMes(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const ultimo = new Date(y, m + 1, 0).getDate(); // días del mes que viene (m viene de 1 a 12)
    return deFecha(new Date(y, m, Math.min(d, ultimo), 12));
}
/** "13/10"; si es de otro año, con el año: "10/10/27" (un apto físico que vale hasta el año que viene). */
export const fechaCorta = (iso, hoy = fechaLocalISO(0)) => {
    const [y, m, d] = iso.split("-");
    return `${Number(d)}/${m}${y !== hoy.slice(0, 4) ? `/${y.slice(2)}` : ""}`;
};
export function nombreFecha(fecha, hoy = fechaLocalISO(0)) {
    const n = diasEntre(hoy, fecha);
    if (n === 0) return "hoy";
    if (n === 1) return "mañana";
    if (n === -1) return "ayer";
    return `${DIAS[diaSemana(fecha)]} ${fechaCorta(fecha)}`;
}

// ---------- Reglas (funciones puras) ----------

/** Redondeo de gimnasio: de a 2,5 kg con barra o máquina (20 kg o más) y de a 1 kg con mancuernas. */
export const redondearPeso = (p) => (p >= 20 ? Math.round(p / 2.5) * 2.5 : Math.max(1, Math.round(p)));

/** Un número (acepta "57,5") entre `desde` y `hasta`, con hasta `decimales`. */
export function numero(valor, que, { desde = 0, hasta, decimales = 0 } = {}) {
    const n = typeof valor === "string" ? Number(valor.trim().replace(",", ".")) : valor;
    if (typeof n !== "number" || !Number.isFinite(n) || n < desde || n > hasta) {
        throw new Error(`${que} tiene que ser un número de ${desde.toLocaleString("es-AR")} a ${hasta.toLocaleString("es-AR")}.`);
    }
    const f = 10 ** decimales;
    if (Math.abs(Math.round(n * f) - n * f) > 1e-6) throw new Error(decimales ? `${que}: hasta ${decimales} decimales.` : `${que} tiene que ser un número entero.`);
    return Math.round(n * f) / f;
}

/** Estado de la cuota a partir del vencimiento: "al-dia", "pronto" (vence esta semana) o "vencida". */
export function estadoCuota(vence, hoy) {
    const dias = diasEntre(hoy, vence);
    if (dias < 0) return { estado: "vencida", dias, texto: `Vencida hace ${-dias} ${-dias === 1 ? "día" : "días"}` };
    if (dias <= VENCE_PRONTO) return { estado: "pronto", dias, texto: dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días` };
    return { estado: "al-dia", dias, texto: `Al día · vence el ${fechaCorta(vence)}` };
}

/** El día del plan que le toca a un socio en un día de la semana: sus días fijos van en orden (A, B, C…). */
export function indiceDelDia(socio, fecha) {
    const i = socio.dias.indexOf(diaSemana(fecha));
    return i < 0 ? null : i;
}

/** Lo mejor que levantó en un entreno (el peso más alto de sus series de ese ejercicio). */
const maxDe = (series = []) => series.reduce((m, [p]) => Math.max(m, p), 0);

/** Números "al azar" pero siempre los mismos (así la demo arranca igual). */
function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------- Datos de fábrica ----------

// [id, nombre, apellido, objetivo, rutina (null = viene solo a clases), plan de cuota]
const SOCIOS = [
    ["s-franco", "Franco", "Acosta", "Ganar fuerza", "fuerza-3", "3x"],
    ["s-ana", "Ana", "Ferreyra", "Tonificar", "tonificacion-3", "3x"],
    ["s-martina", "Martina", "Sosa", "Bajar de peso", "tonificacion-3", "libre"],
    ["s-agustin", "Agustín", "Paz", "Ganar masa muscular", "fuerza-4", "libre"],
    ["s-camila", "Camila", "Romero", "Sentirse mejor", null, "2x"],
    ["s-bruno", "Bruno", "Godoy", "Ganar fuerza", "fuerza-3", "3x"],
    ["s-valentina", "Valentina", "Ruiz", "Tonificar", "tonificacion-3", "3x"],
    ["s-gaston", "Gastón", "Herrera", "Ponerse en forma", "principiante-3", "3x"],
    ["s-rocio", "Rocío", "Molina", "Mejorar la resistencia", null, "libre"],
    ["s-ignacio", "Ignacio", "Vega", "Ganar masa muscular", "fuerza-4", "libre"],
    ["s-micaela", "Micaela", "Torres", "Bajar de peso", "funcional-2", "2x"],
    ["s-pablo", "Pablo", "Juárez", "Ponerse en forma", "principiante-3", "3x"],
    ["s-florencia", "Florencia", "Díaz", "Tonificar", "tonificacion-3", "3x"],
    ["s-emiliano", "Emiliano", "Castro", "Ganar fuerza", "fuerza-3", "3x"],
    ["s-lucia", "Lucía", "Ortiz", "Sentirse mejor", "principiante-3", "3x"],
    ["s-maxi", "Maxi", "Rojas", "Mejorar la resistencia", null, "pack8"],
    ["s-brenda", "Brenda", "Navarro", "Tonificar", "tonificacion-3", "libre"],
    ["s-santiago", "Santiago", "Quiroga", "Preparar el fútbol del finde", "funcional-2", "2x"],
    ["s-antonella", "Antonella", "Medina", "Bajar de peso", "tonificacion-3", "3x"],
    ["s-leandro", "Leandro", "Aguirre", "Sentirse mejor", null, "2x"],
    ["s-carla", "Carla", "Benítez", "Ponerse en forma", "principiante-3", "3x"],
    ["s-ivan", "Iván", "Morales", "Ganar masa muscular", "fuerza-4", "libre"],
    ["s-jimena", "Jimena", "Suárez", "Tonificar", "tonificacion-3", "3x"],
    ["s-facundo", "Facundo", "Peralta", "Ganar fuerza", "fuerza-3", "3x"],
    ["s-daniela", "Daniela", "Luna", "Bajar de peso", "funcional-2", "2x"],
    ["s-gonzalo", "Gonzalo", "Cabrera", "Mejorar la resistencia", null, "pack8"],
    ["s-milagros", "Milagros", "Ponce", "Tonificar", "tonificacion-3", "3x"],
    ["s-hugo", "Hugo", "Villalba", "Ponerse en forma", "principiante-3", "2x"],
    ["s-natalia", "Natalia", "Correa", "Sentirse mejor", "principiante-3", "3x"],
    ["s-cristian", "Cristian", "Domínguez", "Ganar fuerza", "fuerza-3", "libre"],
    ["s-belen", "Belén", "Giménez", "Tonificar", "tonificacion-3", "3x"],
    ["s-alejandro", "Alejandro", "Ramos", "Mejorar la resistencia", null, "pack8"],
    ["s-sabrina", "Sabrina", "Toledo", "Bajar de peso", "funcional-2", "2x"],
    ["s-mariano", "Mariano", "Figueroa", "Ganar masa muscular", "fuerza-4", "libre"],
    ["s-romina", "Romina", "Acuña", "Tonificar", "tonificacion-3", "3x"],
    ["s-ramiro", "Ramiro", "Ojeda", "Ganar fuerza", "fuerza-3", "3x"],
    ["s-noelia", "Noelia", "Funes", "Ponerse en forma", "principiante-3", "3x"],
    ["s-julian", "Julián", "Arias", "Sentirse mejor", null, "2x"],
    ["s-abril", "Abril", "Cáceres", "Ponerse en forma", "principiante-3", "3x"],
    ["s-walter", "Walter", "Bustos", "Mejorar la resistencia", null, "libre"]
];

// Los casos que tienen que estar siempre (por posición en la lista de arriba)
const VENCIDAS = { 5: -2, 9: -5, 14: -9, 22: -14, 30: -20 };
const PRONTO = { 0: 3, 2: 0, 7: 1, 12: 2, 18: 4, 26: 5, 33: 6 };
const NO_VIENEN_HACE = { 11: 23, 20: 26, 28: 31, 36: 38 };
const SIN_APTO = [3, 16, 24];
const SIN_ANOTAR_NADA = [1, 13]; // vienen, pero hace más de 2 semanas que no anotan lo que hacen
const AVISO_PAGO = 9; // avisó que pagó por transferencia (falta que la dueña lo confirme)
const PACK_QUEDAN = { 15: 3, 25: 6, 31: 1 };
const HORA_FIJA = { 0: "19:00", 6: "19:00", 10: "19:00", 13: "19:00", 17: "20:00", 23: "20:00" };
const RECIEN_ANOTADO = 38;

/**
 * Los días fijos de cada uno, a partir de hoy (así siempre hay alumnos hoy). Franco: hoy le toca el Día B.
 * Casi nadie va el domingo (a la tarde está cerrado): el domingo pasa al sábado o al lunes, salvo que hoy sea domingo.
 */
function diasFijos(i, cuantos, hoySemana) {
    const mod = (n) => ((n % 7) + 7) % 7;
    if (i === 0) return [mod(hoySemana - 2), hoySemana, mod(hoySemana + 2)];
    const corre = i % 2 === 0 ? 0 : 1;
    const saltos = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4] }[cuantos] ?? [0, 2, 4];
    const dias = saltos.map((s) => mod(hoySemana + corre + s));
    if (hoySemana === 0) return dias;
    return dias.map((d) => (d !== 0 ? d : !dias.includes(6) ? 6 : !dias.includes(1) ? 1 : 0));
}

// A qué hora va la gente: la mayoría después del trabajo (de 18 a 21), algunos temprano o al mediodía
const PESO_HORA = { "07:00": 4, "08:00": 6, "09:00": 3, "10:00": 3, "12:00": 4, "13:00": 3, "17:00": 5, "18:00": 10, "19:00": 12, "20:00": 9, "21:00": 4 };
function horaAlAzar(azar) {
    const total = Object.values(PESO_HORA).reduce((a, b) => a + b, 0);
    let r = azar() * total;
    for (const [hora, peso] of Object.entries(PESO_HORA)) {
        r -= peso;
        if (r < 0) return hora;
    }
    return "19:00";
}

/** `hoy` y `minuto` (la hora de ahora en minutos) los pasa crearDatos con su reloj. */
export function semilla(hoy = fechaLocalISO(0), minuto = new Date().getHours() * 60 + new Date().getMinutes()) {
    const azar = azarFijo(11);
    const planes = copia(PLANES_BASE).map((p) => ({ ...p, propio: false, creadoEn: null }));
    const planDe = (id) => planes.find((p) => p.id === id);
    const hoySemana = diaSemana(hoy);
    const socios = [];
    const asistencias = [];
    const entrenos = [];
    const pagos = [];
    const reservas = [];

    SOCIOS.forEach(([id, nombre, apellido, objetivo, planId, cuotaId], i) => {
        const plan = planId ? planDe(planId) : null;
        const cuantos = plan ? Math.min(plan.dias.length === 2 ? 2 : plan.dias.length, 4) : cuotaId === "2x" ? 2 : 3;
        const cuota = PLANES_CUOTA.find((c) => c.id === cuotaId);
        const alta = i === RECIEN_ANOTADO ? sumarDias(hoy, -5) : sumarDias(hoy, -(70 + Math.floor(azar() * 330)));
        // El recién anotado pagó el primer mes el día del alta (le vence en unas 3 semanas)
        const vence = i === RECIEN_ANOTADO ? sumarMes(alta) : sumarDias(hoy, VENCIDAS[i] ?? PRONTO[i] ?? 8 + Math.floor(azar() * 22));
        const s = {
            id, nombre, apellido, objetivo, planId, profeId: plan ? "p-mauro" : azar() < 0.5 ? "p-sol" : "p-tomi",
            dias: diasFijos(i, cuantos, hoySemana),
            hora: HORA_FIJA[i] ?? horaAlAzar(azar),
            cuotaId, vence, clasesQuedan: cuota.clases ? PACK_QUEDAN[i] ?? 4 : null,
            aptoHasta: SIN_APTO.includes(i) ? null : sumarDias(hoy, 30 + Math.floor(azar() * 300)),
            reglamentoEl: SIN_APTO.includes(i) || i === RECIEN_ANOTADO ? null : alta,
            alta, baja: null, ajustes: {}, notas: [], recordadoEn: null, invitadoEn: null,
            factor: i === 0 ? 1 : 0.65 + azar() * 0.55, // qué tan fuerte es (solo para armar los pesos de ejemplo)
            constancia: i === 0 ? 1 : 0.65 + azar() * 0.3
        };
        socios.push(s);

        // Pagos: el último (el que lo deja al día hasta `vence`) y los 2 anteriores, si ya era socio
        let hasta = vence;
        for (let k = 0; k < 3; k++) {
            let desde = hasta;
            const [y, m, d] = hasta.split("-").map(Number);
            desde = deFecha(new Date(y, m - 2, Math.min(d, new Date(y, m - 1, 0).getDate()), 12)); // un mes antes
            if (desde < alta || desde > hoy) break;
            const transferencia = azar() < 0.55;
            pagos.push({
                id: `pg-${id}-${k}`, socioId: id, fecha: desde, confirmadoEl: desde, monto: cuota.monto, cuotaId,
                medio: transferencia ? "transferencia" : "efectivo", estado: "confirmado", venciaAntes: desde, hasta,
                clasesAntes: null, creadoEn: `${desde}T${s.hora}:00`
            });
            hasta = desde;
        }
        if (i === AVISO_PAGO) {
            pagos.push({
                id: `pg-${id}-aviso`, socioId: id, fecha: sumarDias(hoy, -1), confirmadoEl: null, monto: cuota.monto, cuotaId,
                medio: "transferencia", estado: "avisado", venciaAntes: null, hasta: null, clasesAntes: null, creadoEn: `${sumarDias(hoy, -1)}T21:14:00`
            });
        }
    });

    // Asistencias y entrenos de las últimas 8 semanas (y de hoy, de los que ya vinieron)
    socios.forEach((s, i) => {
        const sinVenir = NO_VIENEN_HACE[i];
        const plan = s.planId ? planDe(s.planId) : null;
        for (let d = 56; d >= 0; d--) {
            const fecha = sumarDias(hoy, -d);
            if (fecha < s.alta) continue;
            const idx = indiceDelDia(s, fecha);
            if (idx === null) continue;
            if (sinVenir !== undefined && d < sinVenir) continue;
            if (d === 0 && (i === 0 || aMinutos(s.hora) + 10 > minuto)) continue; // hoy: solo los que ya llegaron (Franco todavía no)
            if (sinVenir !== d && azar() > s.constancia) continue;
            if (i === 0 && (d === 16 || d === 33)) continue; // Franco faltó dos veces (nunca un Día B: la sentadilla sigue)
            const llego = aMinutos(s.hora) + Math.floor(azar() * 20) - 5;
            asistencias.push({ id: `as-${s.id}-${fecha}`, socioId: s.id, fecha, minuto: llego, via: "boton" });
            if (!plan || (SIN_ANOTAR_NADA.includes(i) && d < SIN_ANOTAR + 2)) continue;
            const diaPlan = plan.dias[idx % plan.dias.length];
            const terminado = d > 0 || llego + 70 < minuto;
            const series = {};
            const cuantosEj = terminado ? diaPlan.ejercicios.length : Math.ceil(diaPlan.ejercicios.length / 2);
            diaPlan.ejercicios.slice(0, cuantosEj).forEach((it) => {
                const e = EJ[it.ejercicioId];
                // Va subiendo de a poco en 8 semanas (con semanas en que repite)
                const avance = 0.86 + 0.14 * ((56 - d) / 56) + (azar() < 0.3 ? -0.03 : 0);
                const peso = e.tipo === "peso" ? redondearPeso(it.peso * s.factor * avance) : 0;
                series[it.ejercicioId] = Array.from({ length: it.series }, () => [peso, it.reps]);
            });
            entrenos.push({
                id: `en-${s.id}-${fecha}`, socioId: s.id, fecha, diaId: diaPlan.id, series, terminado,
                inicio: `${fecha}T${aHora(Math.max(0, llego))}:00`
            });
        }
    });

    // Franco: la sentadilla del Día B fue subiendo hasta 57,5 kg la vez pasada (hoy va por el récord)
    const sentadillas = [45, 47.5, 47.5, 50, 50, 52.5, 55, 57.5];
    const delB = entrenos.filter((e) => e.socioId === "s-franco" && e.diaId === "B").sort((a, b) => a.fecha.localeCompare(b.fecha));
    delB.forEach((e, k) => {
        const p = sentadillas[Math.max(0, sentadillas.length - delB.length + k)];
        e.series.sentadilla = e.series.sentadilla.map(([, r]) => [p, r]);
    });

    // Reservas de las clases de hoy a 6 días: la de Funcional de hoy con 9 de 12, un Pilates lleno con 2 en espera
    const activos = socios.filter((s) => s.id !== "s-franco");
    let pilatesLleno = false;
    for (let n = 0; n < TOPES.diasReserva; n++) {
        const fecha = sumarDias(hoy, n);
        CLASES.filter((c) => c.dias.includes(diaSemana(fecha))).forEach((c) => {
            let anotados;
            let espera = 0;
            if (n === 0 && c.id.startsWith("funcional") && c.id !== "funcional-8") anotados = 9;
            else if (c.id === "pilates-18" && n > 0 && !pilatesLleno) {
                anotados = c.cupo;
                espera = 2;
                pilatesLleno = true;
            } else anotados = Math.round(c.cupo * (0.3 + azar() * 0.45));
            const elegidos = [...activos].sort(() => azar() - 0.5).slice(0, anotados + espera);
            elegidos.forEach((s, k) => reservas.push({
                id: `rs-${c.id}-${fecha}-${s.id}`, claseId: c.id, fecha, socioId: s.id,
                estado: k < anotados ? "reservada" : "espera", paso: false, creadoEn: `${sumarDias(hoy, -2)}T${String(8 + k).padStart(2, "0")}:00:00`
            }));
        });
    }
    // Franco tiene reservado el próximo Spinning
    for (let n = 1; n < TOPES.diasReserva; n++) {
        const fecha = sumarDias(hoy, n);
        const c = CLASES.find((x) => x.nombre === "Spinning" && x.dias.includes(diaSemana(fecha)));
        if (!c) continue;
        reservas.push({ id: `rs-${c.id}-${fecha}-s-franco`, claseId: c.id, fecha, socioId: "s-franco", estado: "reservada", paso: false, creadoEn: `${sumarDias(hoy, -1)}T22:00:00` });
        break;
    }

    // Lo que se usó para armar los ejemplos no se guarda
    socios.forEach((s) => {
        delete s.factor;
        delete s.constancia;
    });
    // Una nota del profe para Franco, de la semana pasada
    socios[0].notas.push({ id: "nt-franco-1", texto: "Buena técnica en la sentadilla. Si sale fácil, la semana que viene probamos 60.", fecha: sumarDias(hoy, -7), profeId: "p-mauro" });
    return { planes, socios, asistencias, entrenos, pagos, reservas };
}

// ---------- Funciones de datos ----------

/** `prefijo` y `reloj` cambian solo en las pruebas. */
export function crearDatos(prefijo = MARCA.prefijo, { reloj = () => new Date() } = {}) {
    const hoy = () => {
        const d = reloj();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const minutoActual = () => reloj().getHours() * 60 + reloj().getMinutes();
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla: () => semilla(hoy(), minutoActual()) });
    const db = () => guardado.db();
    const firmas = new Map(); // la imagen de cada firma queda solo mientras la demo está abierta (no ocupa lugar)

    const esDuena = (u) => u?.rol === "duena";
    const esProfe = (u) => u?.rol === "profe";
    const esSocio = (u) => u?.rol === "socio";
    const plan = (id) => buscar(db().planes, id, "Esa rutina no existe.");
    const socioCrudo = (id) => buscar(db().socios, id, "Ese socio no existe.");
    const socioDe = (u) => db().socios.find((s) => s.id === SOCIO_DE[u?.id]) ?? null;
    const profeDe = (u) => PROFE_DE[u?.id] ?? null;
    const cuotaDe = (s) => PLANES_CUOTA.find((c) => c.id === s.cuotaId);
    const profe = (id) => PROFES.find((p) => p.id === id);
    const nombreDe = (s) => `${s.nombre} ${s.apellido}`.trim();

    function guardar(lista, tope, que) {
        exigir(db()[lista].length < tope, `Ya hay ${tope.toLocaleString("es-AR")} ${que}. Es una demo: tocá "Empezar de cero" arriba.`);
    }

    // ----- Lo que se calcula de cada socio -----

    const asistenciasDe = (id) => db().asistencias.filter((a) => a.socioId === id);
    const entrenosDe = (id) => db().entrenos.filter((e) => e.socioId === id).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio.localeCompare(b.inicio));
    const entrenoDeHoy = (id) => db().entrenos.find((e) => e.socioId === id && e.fecha === hoy()) ?? null;
    const llegoHoy = (id) => db().asistencias.find((a) => a.socioId === id && a.fecha === hoy()) ?? null;

    function ultimaVez(id) {
        const f = asistenciasDe(id).reduce((m, a) => (a.fecha > m ? a.fecha : m), "");
        return f || null;
    }

    const pagoAvisado = (id) => db().pagos.find((p) => p.socioId === id && p.estado === "avisado") ?? null;
    const sinApto = (s) => !s.aptoHasta || s.aptoHasta < hoy();

    function armarSocio(s) {
        const ultima = ultimaVez(s.id);
        const p = s.planId ? db().planes.find((x) => x.id === s.planId) : null;
        const idx = indiceDelDia(s, hoy());
        return {
            id: s.id, nombre: s.nombre, apellido: s.apellido, nombreCompleto: nombreDe(s), objetivo: s.objetivo,
            planId: s.planId, plan: p ? p.nombre : null, profeId: s.profeId, profe: profe(s.profeId)?.nombre ?? "",
            dias: [...s.dias], diasTexto: ORDEN_SEMANA.filter((d) => s.dias.includes(d)).map((d) => DIAS_CORTOS[d]).join(", "),
            hora: s.hora, cuotaId: s.cuotaId, cuota: cuotaDe(s).texto, monto: cuotaDe(s).monto, vence: s.vence,
            clasesQuedan: s.clasesQuedan, ...estadoCuotaDe(s), avisoPago: copia(pagoAvisado(s.id)),
            aptoHasta: s.aptoHasta, sinApto: sinApto(s), reglamentoEl: s.reglamentoEl, firma: firmas.get(s.id) ?? null,
            alta: s.alta, baja: s.baja, ultima, sinVenir: ultima ? diasEntre(ultima, hoy()) : null,
            // "No viene": hace más de 3 semanas que no viene (o que se anotó y nunca vino)
            noViene: !s.baja && diasEntre(ultima ?? s.alta, hoy()) > NO_VIENEN,
            hoyLeToca: p && idx !== null ? p.dias[idx % p.dias.length].id : null,
            recordadoEn: s.recordadoEn, invitadoEn: s.invitadoEn, notas: copia(s.notas).reverse(), ajustes: copia(s.ajustes)
        };
    }

    function estadoCuotaDe(s) {
        const e = estadoCuota(s.vence, hoy());
        const r = { estadoCuota: e.estado, diasCuota: e.dias, textoCuota: e.texto };
        if (s.clasesQuedan !== null && s.clasesQuedan !== undefined && e.estado !== "vencida" && s.clasesQuedan <= 0) {
            return { estadoCuota: "vencida", diasCuota: e.dias, textoCuota: "Se terminaron las clases del pack" };
        }
        return r;
    }

    /** Lo mejor y lo último que levantó en un ejercicio (sin contar hoy). */
    function marcasDe(socioId, ejercicioId, antesDe = hoy()) {
        let mejor = 0;
        let ultimo = null;
        let ultimaFecha = null;
        for (const e of entrenosDe(socioId)) {
            if (e.fecha >= antesDe || !e.series[ejercicioId]?.length) continue;
            const m = maxDe(e.series[ejercicioId]);
            mejor = Math.max(mejor, m);
            ultimo = m;
            ultimaFecha = e.fecha;
        }
        return { mejor, ultimo, ultimaFecha };
    }

    /** Los ejercicios de un día del plan para un socio: con sus ajustes, el peso que le toca y lo que ya hizo hoy. */
    function ejerciciosDelDia(s, p, diaPlan, entreno) {
        return diaPlan.ejercicios.map((it) => {
            const e = EJ[it.ejercicioId];
            const aj = s.ajustes[`${p.id}|${diaPlan.id}|${it.ejercicioId}`] ?? null;
            const { mejor, ultimo, ultimaFecha } = marcasDe(s.id, it.ejercicioId);
            // El peso de hoy: el que dejó el profe (si lo cambió después del último entreno), o el de la última vez
            const sugerido = e.tipo !== "peso" ? 0 : aj?.peso !== undefined && (!ultimaFecha || aj.el >= ultimaFecha) ? aj.peso : ultimo ?? Math.round(it.peso);
            const hechas = (entreno?.series[it.ejercicioId] ?? []).map(([peso, reps]) => ({ peso, reps }));
            const records = e.tipo === "peso" && mejor > 0 ? hechas.filter((h) => h.peso > mejor).length : 0;
            return {
                ejercicioId: it.ejercicioId, nombre: e.nombre, grupo: e.grupo, tipo: e.tipo,
                series: aj?.series ?? it.series, reps: aj?.reps ?? it.reps, descanso: it.descanso,
                sugerido, mejor, ultimo, ajustado: !!aj, nota: aj?.nota ?? "", hechas, record: records > 0,
                listo: hechas.length >= (aj?.series ?? it.series)
            };
        });
    }

    /** "Hoy te toca": el día del plan de hoy (o el que eligió para entrenar igual), sus ejercicios y cómo va. */
    function hoyLeToca(socioId) {
        const s = socioCrudo(socioId);
        exigir(s.planId, `${s.nombre} todavía no tiene rutina: viene a las clases.`);
        const p = plan(s.planId);
        const entreno = entrenoDeHoy(s.id);
        let idx = indiceDelDia(s, hoy());
        const descansa = idx === null && !entreno;
        if (entreno) idx = Math.max(0, p.dias.findIndex((d) => d.id === entreno.diaId));
        // Si hoy descansa, el próximo día que le toca
        let proximo = null;
        for (let n = 1; n <= 7 && idx === null; n++) {
            const f = sumarDias(hoy(), n);
            const i = indiceDelDia(s, f);
            if (i !== null) {
                proximo = { fecha: f, nombre: nombreFecha(f, hoy()), dia: copia(p.dias[i % p.dias.length]) };
                break;
            }
        }
        const diaPlan = idx === null ? null : p.dias[idx % p.dias.length];
        const ejercicios = diaPlan ? ejerciciosDelDia(s, p, diaPlan, entreno) : [];
        const semana = semanaHecha(s);
        return {
            socioId: s.id, plan: p.nombre, planId: p.id, descansa, proximo,
            dia: diaPlan ? { id: diaPlan.id, nombre: diaPlan.nombre } : null,
            dias: p.dias.map((d) => ({ id: d.id, nombre: d.nombre })),
            ejercicios, llego: copia(llegoHoy(s.id)), entreno: entreno ? { terminado: entreno.terminado, inicio: entreno.inicio } : null,
            hechos: ejercicios.filter((e) => e.listo).length, records: ejercicios.filter((e) => e.record).length, semana
        };
    }

    /** Cuántas veces entrenó esta semana (de lunes a hoy) de las que le tocan. */
    function semanaHecha(s) {
        const h = hoy();
        const desdeLunes = (diaSemana(h) + 6) % 7;
        const lunes = sumarDias(h, -desdeLunes);
        const hechos = new Set(entrenosDe(s.id).filter((e) => e.fecha >= lunes && e.fecha <= h && e.terminado).map((e) => e.fecha)).size;
        return { hechos, tocan: s.dias.length };
    }

    // ----- Para el socio -----

    function llegue(usuario, via = "boton") {
        exigir(esSocio(usuario), "El \"Llegué\" lo marca el socio desde su celu.");
        const s = socioDe(usuario);
        exigir(s, "No te encontramos en la lista de socios.");
        return marcarLlegada(s, via);
    }

    function marcarLlegada(s, via) {
        const ya = llegoHoy(s.id);
        if (ya) return { asistencia: copia(ya), nueva: false };
        exigir(!s.baja, `${s.nombre} está dado de baja.`);
        guardar("asistencias", TOPES.asistencias, "asistencias");
        const a = { id: nuevoId("as"), socioId: s.id, fecha: hoy(), minuto: minutoActual(), via };
        db().asistencias.push(a);
        if (s.clasesQuedan !== null && s.clasesQuedan !== undefined && s.clasesQuedan > 0) s.clasesQuedan -= 1;
        guardado.persistir();
        return { asistencia: copia(a), nueva: true };
    }

    /** El entreno de hoy (lo crea al anotar la primera serie, con el día que le toca o el que eligió). */
    function entrenoParaHoy(s, diaId) {
        let e = entrenoDeHoy(s.id);
        if (e) return e;
        const p = plan(s.planId);
        const idx = indiceDelDia(s, hoy());
        const d = diaId ? p.dias.find((x) => x.id === diaId) : idx !== null ? p.dias[idx % p.dias.length] : null;
        exigir(d, "Hoy no te toca entrenar: elegí qué día de tu rutina querés hacer.");
        guardar("entrenos", TOPES.entrenos, "entrenamientos");
        e = { id: nuevoId("en"), socioId: s.id, fecha: hoy(), diaId: d.id, series: {}, terminado: false, inicio: `${hoy()}T${aHora(minutoActual())}:00` };
        db().entrenos.push(e);
        return e;
    }

    /** Hoy descansa pero quiere entrenar igual: elige un día de su rutina. */
    function entrenarOtroDia(usuario, diaId) {
        exigir(esSocio(usuario), "Solo el socio elige qué entrenar.");
        const s = socioDe(usuario);
        exigir(s?.planId, "No tenés rutina.");
        exigir(plan(s.planId).dias.some((d) => d.id === diaId), "Ese día no está en tu rutina.");
        const e = entrenoDeHoy(s.id);
        exigir(!e || !Object.keys(e.series).length, "Ya empezaste a entrenar hoy.");
        if (e) e.diaId = diaId;
        else entrenoParaHoy(s, diaId);
        guardado.persistir();
        return hoyLeToca(s.id);
    }

    /** Anota una serie hecha: devuelve si es récord (más peso que nunca en ese ejercicio). Marca la llegada si faltaba. */
    function anotarSerie(usuario, { ejercicioId, peso, reps }) {
        exigir(esSocio(usuario), "Las series las anota el socio.");
        const s = socioDe(usuario);
        exigir(s?.planId, "No tenés rutina.");
        const e = ejercicio(ejercicioId);
        const entreno = entrenoParaHoy(s, null);
        exigir(!entreno.terminado, "Ya terminaste el entreno de hoy.");
        const p = plan(s.planId);
        const diaPlan = p.dias.find((d) => d.id === entreno.diaId);
        exigir(diaPlan?.ejercicios.some((it) => it.ejercicioId === ejercicioId), "Ese ejercicio no está en lo que te toca hoy.");
        const kg = e.tipo === "peso" ? numero(peso, "El peso", { hasta: TOPES.peso, decimales: 2 }) : 0;
        const r = e.tipo === "tiempo"
            ? numero(reps, "Los segundos", { desde: 1, hasta: TOPES.segundos })
            : numero(reps, "Las repeticiones", { desde: 1, hasta: TOPES.reps });
        const lista = (entreno.series[ejercicioId] ??= []);
        exigir(lista.length < TOPES.series, `Ya anotaste ${TOPES.series} series de este ejercicio: es el máximo.`);
        const { mejor } = marcasDe(s.id, ejercicioId);
        const antesHoy = maxDe(lista);
        lista.push([kg, r]);
        marcarLlegada(s, "entreno"); // si se olvidó de tocar "Llegué", cuenta igual
        guardado.persistir();
        const record = e.tipo === "peso" && mejor > 0 && kg > mejor && kg > antesHoy;
        return { numero: lista.length, peso: kg, reps: r, record, antes: mejor, descanso: diaPlan.ejercicios.find((it) => it.ejercicioId === ejercicioId).descanso };
    }

    function deshacerSerie(usuario, ejercicioId) {
        exigir(esSocio(usuario), "Las series las anota el socio.");
        const s = socioDe(usuario);
        const entreno = s ? entrenoDeHoy(s.id) : null;
        exigir(entreno?.series[ejercicioId]?.length, "No hay series para deshacer.");
        exigir(!entreno.terminado, "Ya terminaste el entreno de hoy.");
        entreno.series[ejercicioId].pop();
        if (!entreno.series[ejercicioId].length) delete entreno.series[ejercicioId];
        guardado.persistir();
        return hoyLeToca(s.id);
    }

    function terminarEntreno(usuario) {
        exigir(esSocio(usuario), "El entreno lo termina el socio.");
        const s = socioDe(usuario);
        const entreno = s ? entrenoDeHoy(s.id) : null;
        exigir(entreno && Object.keys(entreno.series).length, "Anotá al menos una serie antes de terminar.");
        exigir(!entreno.terminado, "Ya terminaste el entreno de hoy.");
        entreno.terminado = true;
        guardado.persistir();
        return hoyLeToca(s.id);
    }

    /** Su semana: qué le toca cada día (de hoy a 6 días) y sus clases reservadas. */
    function miSemana(usuario) {
        exigir(esSocio(usuario), "Esto es del socio.");
        const s = socioDe(usuario);
        const p = s.planId ? plan(s.planId) : null;
        return Array.from({ length: 7 }, (_, n) => {
            const fecha = sumarDias(hoy(), n);
            const idx = indiceDelDia(s, fecha);
            const d = p && idx !== null ? p.dias[idx % p.dias.length] : null;
            return {
                fecha, nombre: nombreFecha(fecha, hoy()), dia: d ? { id: d.id, nombre: d.nombre } : null,
                clases: db().reservas.filter((r) => r.socioId === s.id && r.fecha === fecha && r.estado !== "cancelada").map(armarReserva)
            };
        });
    }

    /** Cómo viene: el peso de sus ejercicios más hechos (hasta 3) y las veces que vino cada semana (las últimas 8). */
    function progreso(socioId) {
        const s = socioCrudo(socioId);
        const entrenos = entrenosDe(s.id);
        const cuenta = new Map();
        entrenos.forEach((e) => Object.keys(e.series).forEach((id) => EJ[id]?.tipo === "peso" && cuenta.set(id, (cuenta.get(id) ?? 0) + 1)));
        const primero = s.planId ? plan(s.planId).dias.flatMap((d) => d.ejercicios.map((it) => it.ejercicioId)) : [];
        const orden = [...cuenta.keys()].sort((a, b) => cuenta.get(b) - cuenta.get(a) || primero.indexOf(a) - primero.indexOf(b));
        if (s.id === SOCIO_DE["u-socio"] && orden.includes("sentadilla")) orden.splice(0, 0, ...orden.splice(orden.indexOf("sentadilla"), 1));
        const ejercicios = orden.slice(0, 3).map((id) => ({
            ejercicioId: id, nombre: EJ[id].nombre,
            puntos: entrenos.filter((e) => e.series[id]?.length).map((e) => ({ fecha: e.fecha, peso: maxDe(e.series[id]) }))
        }));
        const fechas = new Set(asistenciasDe(s.id).map((a) => a.fecha));
        const semanas = Array.from({ length: 8 }, (_, k) => {
            const hasta = sumarDias(hoy(), -7 * (7 - k));
            const desde = sumarDias(hasta, -6);
            return { desde, hasta, veces: [...fechas].filter((f) => f >= desde && f <= hasta).length };
        });
        return { ejercicios, semanas, tocan: s.dias.length };
    }

    // ----- Clases con cupo -----

    const dias = () => Array.from({ length: TOPES.diasReserva }, (_, n) => {
        const fecha = sumarDias(hoy(), n);
        return { fecha, nombre: nombreFecha(fecha, hoy()) };
    });
    const empezo = (claseId, fecha) => {
        const c = CLASES.find((x) => x.id === claseId);
        return fecha < hoy() || (fecha === hoy() && aMinutos(c.hora) <= minutoActual());
    };

    function armarReserva(r) {
        const c = CLASES.find((x) => x.id === r.claseId);
        const fila = db().reservas.filter((x) => x.claseId === r.claseId && x.fecha === r.fecha && x.estado === "espera").sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
        return {
            ...copia(r), clase: c.nombre, hora: c.hora, profe: profe(c.profeId).nombre, nombreFecha: nombreFecha(r.fecha, hoy()),
            lugarEnEspera: r.estado === "espera" ? fila.findIndex((x) => x.id === r.id) + 1 : null, empezo: empezo(r.claseId, r.fecha)
        };
    }

    /** Las clases de un día con cuántos lugares quedan (y si la persona ya reservó). */
    function clasesDelDia(fecha, usuario = null) {
        const s = esSocio(usuario) ? socioDe(usuario) : null;
        return CLASES.filter((c) => c.dias.includes(diaSemana(fecha))).sort((a, b) => a.hora.localeCompare(b.hora)).map((c) => {
            const de = db().reservas.filter((r) => r.claseId === c.id && r.fecha === fecha);
            const anotados = de.filter((r) => r.estado === "reservada").length;
            const mia = s ? de.find((r) => r.socioId === s.id && r.estado !== "cancelada") : null;
            return {
                claseId: c.id, nombre: c.nombre, hora: c.hora, hasta: aHora(aMinutos(c.hora) + c.duracion), profe: profe(c.profeId).nombre,
                cupo: c.cupo, anotados, quedan: Math.max(0, c.cupo - anotados), espera: de.filter((r) => r.estado === "espera").length,
                empezo: empezo(c.id, fecha), mia: mia ? armarReserva(mia) : null
            };
        });
    }

    function reservar(usuario, claseId, fecha) {
        exigir(esSocio(usuario), "Las clases las reserva el socio.");
        const s = socioDe(usuario);
        exigir(s, "No te encontramos en la lista de socios.");
        const c = CLASES.find((x) => x.id === claseId);
        exigir(c, "Esa clase no existe.");
        exigir(dias().some((d) => d.fecha === fecha), `Se reserva de hoy a ${TOPES.diasReserva - 1} días adelante.`);
        exigir(c.dias.includes(diaSemana(fecha)), "Ese día no hay esa clase.");
        exigir(!empezo(claseId, fecha), "Esa clase ya empezó.");
        exigir(!db().reservas.some((r) => r.claseId === claseId && r.fecha === fecha && r.socioId === s.id && r.estado !== "cancelada"), "Ya estás anotado en esa clase.");
        const activas = db().reservas.filter((r) => r.socioId === s.id && r.estado !== "cancelada" && !empezo(r.claseId, r.fecha));
        exigir(activas.length < TOPES.reservasActivas, `Ya tenés ${TOPES.reservasActivas} clases reservadas: es el máximo.`);
        guardar("reservas", TOPES.reservas, "reservas");
        const anotados = db().reservas.filter((r) => r.claseId === claseId && r.fecha === fecha && r.estado === "reservada").length;
        const r = { id: nuevoId("rs"), claseId, fecha, socioId: s.id, estado: anotados < c.cupo ? "reservada" : "espera", paso: false, creadoEn: ahora() };
        db().reservas.push(r);
        guardado.persistir();
        return armarReserva(r);
    }

    /** Libera su lugar; si había lista de espera, el primero pasa solo. */
    function cancelarReserva(usuario, id) {
        exigir(esSocio(usuario), "La reserva la libera el socio.");
        const s = socioDe(usuario);
        const r = buscar(db().reservas, id, "Esa reserva ya no existe.");
        exigir(r.socioId === s?.id, "Esa reserva no es tuya.");
        exigir(r.estado !== "cancelada", "Esa reserva ya estaba cancelada.");
        exigir(!empezo(r.claseId, r.fecha), "Esa clase ya empezó.");
        const eraLugar = r.estado === "reservada";
        r.estado = "cancelada";
        let paso = null;
        if (eraLugar) {
            const primero = db().reservas.filter((x) => x.claseId === r.claseId && x.fecha === r.fecha && x.estado === "espera").sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))[0];
            if (primero) {
                primero.estado = "reservada";
                primero.paso = true;
                paso = db().socios.find((x) => x.id === primero.socioId)?.nombre ?? null;
            }
        }
        guardado.persistir();
        return { reserva: armarReserva(r), paso };
    }

    function misReservas(usuario) {
        exigir(esSocio(usuario), "Esto es del socio.");
        const s = socioDe(usuario);
        return db().reservas.filter((r) => r.socioId === s.id && r.estado !== "cancelada" && r.fecha >= hoy()).map(armarReserva)
            .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    }

    // ----- Cuota y pagos -----

    const armarPago = (p) => ({ ...copia(p), socio: nombreDe(socioCrudo(p.socioId)), cuota: PLANES_CUOTA.find((c) => c.id === p.cuotaId)?.texto ?? "" });

    function miCuota(usuario) {
        exigir(esSocio(usuario), "Esto es del socio.");
        const s = socioDe(usuario);
        return {
            socio: armarSocio(s), alias: ALIAS,
            pagos: db().pagos.filter((p) => p.socioId === s.id && p.estado !== "anulado").map(armarPago).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 6)
        };
    }

    /** El socio avisa que transfirió: queda "a confirmar" hasta que la dueña lo ve en la cuenta. */
    function avisarPago(usuario) {
        exigir(esSocio(usuario), "El aviso de pago lo manda el socio.");
        const s = socioDe(usuario);
        exigir(s, "No te encontramos en la lista de socios.");
        exigir(!pagoAvisado(s.id), "Ya avisaste que pagaste: falta que lo confirmen en el gimnasio.");
        guardar("pagos", TOPES.pagos, "pagos");
        const c = cuotaDe(s);
        const p = { id: nuevoId("pg"), socioId: s.id, fecha: hoy(), confirmadoEl: null, monto: c.monto, cuotaId: c.id, medio: "transferencia", estado: "avisado", venciaAntes: null, hasta: null, clasesAntes: null, creadoEn: ahora() };
        db().pagos.push(p);
        guardado.persistir();
        return armarPago(p);
    }

    /** Corre el vencimiento un mes (desde el vencimiento, o desde hoy si ya estaba vencida) y recarga el pack. */
    function acreditar(s, p) {
        p.venciaAntes = s.vence;
        p.clasesAntes = s.clasesQuedan;
        const base = s.vence < hoy() ? hoy() : s.vence;
        s.vence = sumarMes(base);
        p.hasta = s.vence;
        const c = cuotaDe(s);
        if (c.clases) s.clasesQuedan = c.clases;
        p.estado = "confirmado";
        p.confirmadoEl = hoy();
        p.confirmadoEn = ahora();
    }

    function registrarPago(usuario, socioId, { medio = "efectivo", monto } = {}) {
        exigir(esDuena(usuario), "Los pagos los registra la dueña.");
        const s = socioCrudo(socioId);
        exigir(!s.baja, `${s.nombre} está dado de baja: reactivalo primero.`);
        exigir(medio === "efectivo" || medio === "transferencia", "Elegí si pagó en efectivo o por transferencia.");
        const c = cuotaDe(s);
        const m = monto === undefined || monto === "" ? c.monto : numero(monto, "El monto", { desde: 1, hasta: TOPES.monto });
        exigir(!pagoAvisado(s.id), `${s.nombre} avisó que pagó por transferencia: confirmá ese aviso en vez de cargar otro pago.`);
        guardar("pagos", TOPES.pagos, "pagos");
        const p = { id: nuevoId("pg"), socioId: s.id, fecha: hoy(), confirmadoEl: null, monto: m, cuotaId: c.id, medio, estado: "", venciaAntes: null, hasta: null, clasesAntes: null, creadoEn: ahora() };
        acreditar(s, p);
        db().pagos.push(p);
        guardado.persistir();
        return armarPago(p);
    }

    function confirmarPago(usuario, pagoId) {
        exigir(esDuena(usuario), "Los pagos los confirma la dueña.");
        const p = buscar(db().pagos, pagoId, "Ese pago ya no existe.");
        exigir(p.estado === "avisado", "Ese pago no está esperando confirmación.");
        acreditar(socioCrudo(p.socioId), p);
        guardado.persistir();
        return armarPago(p);
    }

    function rechazarPago(usuario, pagoId) {
        exigir(esDuena(usuario), "Los pagos los revisa la dueña.");
        const p = buscar(db().pagos, pagoId, "Ese pago ya no existe.");
        exigir(p.estado === "avisado", "Ese pago no está esperando confirmación.");
        p.estado = "anulado";
        p.motivo = "No llegó la transferencia";
        p.anuladoEn = ahora();
        guardado.persistir();
        return armarPago(p);
    }

    /** Deshacer un pago (solo el último confirmado de ese socio): el vencimiento vuelve a como estaba. */
    function anularPago(usuario, pagoId) {
        exigir(esDuena(usuario), "Los pagos los anula la dueña.");
        const p = buscar(db().pagos, pagoId, "Ese pago ya no existe.");
        exigir(p.estado === "confirmado", "Ese pago no está confirmado.");
        const ultimo = db().pagos.filter((x) => x.socioId === p.socioId && x.estado === "confirmado")
            .sort((a, b) => (a.confirmadoEn ?? a.creadoEn).localeCompare(b.confirmadoEn ?? b.creadoEn)).at(-1);
        exigir(ultimo?.id === p.id, "Solo se puede deshacer el último pago de cada socio.");
        const s = socioCrudo(p.socioId);
        s.vence = p.venciaAntes;
        s.clasesQuedan = p.clasesAntes;
        p.estado = "anulado";
        p.anuladoEn = ahora();
        guardado.persistir();
        return armarPago(p);
    }

    /** El recordatorio de la cuota (en la demo se copia o se comparte; en la versión real va por WhatsApp). */
    function recordatorio(usuario, socioId) {
        exigir(esDuena(usuario), "Los recordatorios los manda la dueña.");
        const s = socioCrudo(socioId);
        if (s.recordadoEn) {
            const dias = (reloj() - new Date(s.recordadoEn)) / 864e5;
            exigir(dias >= REAVISAR_DIAS, `A ${s.nombre} ya le mandaste el recordatorio hace poco: esperá unos días.`);
        }
        s.recordadoEn = reloj().toISOString();
        guardado.persistir();
        const e = estadoCuota(s.vence, hoy());
        const cuando = e.estado === "vencida" ? `venció el ${nombreFecha(s.vence, hoy())}` : e.dias === 0 ? "vence hoy" : `vence el ${nombreFecha(s.vence, hoy())}`;
        return {
            socio: armarSocio(s),
            mensaje: `Hola ${s.nombre}! Te escribimos de ${NEGOCIO}. Tu cuota (${cuotaDe(s).texto}) ${cuando}. Podés pagarla en el gimnasio o por transferencia al alias ${ALIAS}. ¡Gracias y nos vemos!`
        };
    }

    function invitarVolver(usuario, socioId) {
        exigir(esDuena(usuario), "Las invitaciones las manda la dueña.");
        const s = socioCrudo(socioId);
        if (s.invitadoEn) {
            const dias = (reloj() - new Date(s.invitadoEn)) / 864e5;
            exigir(dias >= REINVITAR_DIAS, `A ${s.nombre} ya lo invitaste hace poco: esperá unos días.`);
        }
        s.invitadoEn = reloj().toISOString();
        guardado.persistir();
        const ultima = ultimaVez(s.id);
        const hace = ultima ? `Hace ${diasEntre(ultima, hoy())} días que no te vemos` : "Todavía no te vimos";
        const rutina = s.planId ? ` Tu rutina sigue lista: ${plan(s.planId).nombre}.` : "";
        return { socio: armarSocio(s), mensaje: `Hola ${s.nombre}! ${hace} por ${NEGOCIO}. ¿Te esperamos esta semana?${rutina}` };
    }

    // ----- Socios (la dueña) -----

    const FILTROS = {
        todos: (a) => !a.baja,
        vencida: (a) => !a.baja && a.estadoCuota === "vencida",
        pronto: (a) => !a.baja && a.estadoCuota === "pronto",
        avisaron: (a) => !a.baja && !!a.avisoPago,
        "no-vienen": (a) => a.noViene,
        "sin-apto": (a) => !a.baja && a.sinApto,
        bajas: (a) => !!a.baja
    };

    function listarSocios({ filtro = "todos", texto = "" } = {}) {
        const f = FILTROS[filtro];
        exigir(f, "Ese filtro no existe.");
        let lista = db().socios.map(armarSocio).filter(f);
        if (filtro === "vencida") lista.sort((a, b) => a.diasCuota - b.diasCuota);
        else if (filtro === "pronto") lista.sort((a, b) => a.diasCuota - b.diasCuota);
        else if (filtro === "no-vienen") lista.sort((a, b) => (b.sinVenir ?? 999) - (a.sinVenir ?? 999));
        else lista.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
        return filtrarPorTexto(lista, texto, (a) => a.nombreCompleto);
    }

    const contarFiltros = () => Object.fromEntries(Object.keys(FILTROS).map((k) => [k, listarSocios({ filtro: k }).length]));

    /** Los números de arriba: socios, cuotas y la plata del mes. */
    function tablero() {
        const activos = db().socios.map(armarSocio).filter((a) => !a.baja);
        const mes = hoy().slice(0, 7);
        const delMes = db().pagos.filter((p) => p.estado === "confirmado" && p.confirmadoEl?.slice(0, 7) === mes);
        return {
            activos: activos.length,
            alDia: activos.filter((a) => a.estadoCuota !== "vencida").length,
            vencidas: activos.filter((a) => a.estadoCuota === "vencida").length,
            pronto: activos.filter((a) => a.estadoCuota === "pronto").length,
            cobradoMes: delMes.reduce((t, p) => t + p.monto, 0),
            porCobrar: activos.filter((a) => a.estadoCuota !== "al-dia").reduce((t, a) => t + a.monto, 0),
            avisados: db().pagos.filter((p) => p.estado === "avisado").length
        };
    }

    /** La ficha de un socio: lo de la lista más sus pagos, asistencias y (si tiene rutina) cómo viene. */
    function socio(id) {
        const s = socioCrudo(id);
        const a = armarSocio(s);
        a.pagos = db().pagos.filter((p) => p.socioId === id).map(armarPago).sort((x, y) => (y.confirmadoEn ?? y.creadoEn).localeCompare(x.confirmadoEn ?? x.creadoEn)).slice(0, 8);
        const ultimo = db().pagos.filter((p) => p.socioId === id && p.estado === "confirmado").sort((x, y) => (x.confirmadoEn ?? x.creadoEn).localeCompare(y.confirmadoEn ?? y.creadoEn)).at(-1);
        a.ultimoPagoId = ultimo?.id ?? null;
        a.asistenciasMes = asistenciasDe(id).filter((x) => x.fecha >= sumarDias(hoy(), -29)).length;
        a.progreso = progreso(id);
        if (s.planId) {
            const p = plan(s.planId);
            a.rutina = p.dias.map((d) => ({ id: d.id, nombre: d.nombre, ejercicios: ejerciciosDelDia(s, p, d, d.id === entrenoDeHoy(id)?.diaId ? entrenoDeHoy(id) : null) }));
        } else a.rutina = null;
        return a;
    }

    function anotarApto(usuario, socioId) {
        exigir(esDuena(usuario), "El apto físico lo anota la dueña.");
        const s = socioCrudo(socioId);
        s.aptoHasta = sumarDias(hoy(), APTO_DURA);
        guardado.persistir();
        return armarSocio(s);
    }

    function firmarReglamento(usuario, socioId, firma) {
        exigir(esDuena(usuario), "El reglamento se firma con la dueña.");
        exigir(esFirma(firma), "La firma no se pudo leer. Probá de nuevo.");
        const s = socioCrudo(socioId);
        firmas.set(s.id, firma);
        s.reglamentoEl = hoy();
        guardado.persistir();
        return armarSocio(s);
    }

    function revisarDias(dias) {
        exigir(Array.isArray(dias) && dias.length >= 1 && dias.length <= 7, "Elegí qué días viene (de 1 a 7).");
        exigir(dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) && new Set(dias).size === dias.length, "Los días que viene no se entienden.");
        return ORDEN_SEMANA.filter((d) => dias.includes(d));
    }

    function altaSocio(usuario, { nombre, apellido = "", objetivo = "", cuotaId, planId = null, dias = [], hora, medio = "efectivo" } = {}) {
        exigir(esDuena(usuario), "Los socios nuevos los anota la dueña.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del socio.");
        const ap = sinPasarse(apellido, TOPES.nombre, "el apellido");
        const ob = sinPasarse(objetivo, TOPES.objetivo, "el objetivo");
        const c = PLANES_CUOTA.find((x) => x.id === cuotaId);
        exigir(c, "Elegí el plan de cuota.");
        if (planId) plan(planId);
        exigir(HORAS.includes(hora), "Elegí a qué hora viene.");
        exigir(medio === "efectivo" || medio === "transferencia", "Elegí cómo pagó la primera cuota.");
        const d = revisarDias(dias);
        exigir(!db().socios.some((s) => nombreDe(s).toLowerCase() === `${n} ${ap}`.trim().toLowerCase()), "Ya hay un socio con ese nombre.");
        guardar("socios", TOPES.socios, "socios");
        guardar("pagos", TOPES.pagos, "pagos");
        const s = {
            id: nuevoId("s"), nombre: n, apellido: ap, objetivo: ob, planId, profeId: planId ? "p-mauro" : "p-tomi", dias: d, hora,
            cuotaId: c.id, vence: hoy(), clasesQuedan: c.clases ? 0 : null, aptoHasta: null, reglamentoEl: null,
            alta: hoy(), baja: null, ajustes: {}, notas: [], recordadoEn: null, invitadoEn: null
        };
        db().socios.push(s);
        const p = { id: nuevoId("pg"), socioId: s.id, fecha: hoy(), confirmadoEl: null, monto: c.monto, cuotaId: c.id, medio, estado: "", venciaAntes: null, hasta: null, clasesAntes: null, creadoEn: ahora() };
        acreditar(s, p);
        db().pagos.push(p);
        guardado.persistir();
        return armarSocio(s);
    }

    function darDeBaja(usuario, socioId) {
        exigir(esDuena(usuario), "Las bajas las hace la dueña.");
        const s = socioCrudo(socioId);
        exigir(!s.baja, `${s.nombre} ya estaba dado de baja.`);
        exigir(s.id !== SOCIO_DE["u-socio"], "A Franco no: es el socio de la demo.");
        s.baja = hoy();
        guardado.persistir();
        return armarSocio(s);
    }

    function reactivar(usuario, socioId) {
        exigir(esDuena(usuario), "Las altas las hace la dueña.");
        const s = socioCrudo(socioId);
        exigir(s.baja, `${s.nombre} no está dado de baja.`);
        s.baja = null;
        guardado.persistir();
        return armarSocio(s);
    }

    /** Cómo anda el gimnasio: a qué hora viene la gente (últimas 4 semanas), las clases de la semana y la caja del mes. */
    function gimnasio() {
        const FRANJAS = [["7 a 10", 420, 600], ["10 a 13", 600, 780], ["13 a 17", 780, 1020], ["17 a 19", 1020, 1140], ["19 a 21", 1140, 1260], ["21 a 23", 1260, 1380]];
        const desde = sumarDias(hoy(), -27);
        const cuatro = db().asistencias.filter((a) => a.fecha >= desde && a.fecha <= hoy());
        const calor = FRANJAS.map(([texto, de, a]) => ({
            texto, porDia: ORDEN_SEMANA.map((d) => Math.round(cuatro.filter((x) => diaSemana(x.fecha) === d && x.minuto >= de && x.minuto < a).length / 4))
        }));
        const clases = dias().flatMap((d) => clasesDelDia(d.fecha).map((c) => ({ ...c, fecha: d.fecha, nombreFecha: d.nombre })));
        const mes = hoy().slice(0, 7);
        const delMes = db().pagos.filter((p) => p.estado === "confirmado" && p.confirmadoEl?.slice(0, 7) === mes);
        const suma = (medio) => delMes.filter((p) => p.medio === medio).reduce((t, p) => t + p.monto, 0);
        const activos = db().socios.filter((s) => !s.baja);
        return {
            calor, dias: ORDEN_SEMANA.map((d) => DIAS_CORTOS[d]), clases,
            caja: { efectivo: suma("efectivo"), transferencia: suma("transferencia"), total: suma("efectivo") + suma("transferencia"), pagos: delMes.length },
            porCuota: PLANES_CUOTA.map((c) => ({ texto: c.texto, socios: activos.filter((s) => s.cuotaId === c.id).length }))
        };
    }

    /** Para pasar a Excel: los socios y los pagos del mes. */
    function filasSocios() {
        return [
            ["Socio", "Plan de cuota", "Vence", "Estado", "Rutina", "Días", "Hora", "Última vez", "Apto físico hasta"],
            ...listarSocios().map((a) => [a.nombreCompleto, a.cuota, fechaCorta(a.vence), a.textoCuota, a.plan ?? "Clases", a.diasTexto, a.hora, a.ultima ? fechaCorta(a.ultima) : "—", a.aptoHasta ? fechaCorta(a.aptoHasta) : "Falta"])
        ];
    }
    function filasPagos() {
        const mes = hoy().slice(0, 7);
        return [
            ["Fecha", "Socio", "Plan de cuota", "Medio", "Monto"],
            ...db().pagos.filter((p) => p.estado === "confirmado" && p.confirmadoEl?.slice(0, 7) === mes).sort((a, b) => a.confirmadoEl.localeCompare(b.confirmadoEl))
                .map((p) => [fechaCorta(p.confirmadoEl), nombreDe(socioCrudo(p.socioId)), PLANES_CUOTA.find((c) => c.id === p.cuotaId)?.texto ?? "", p.medio === "efectivo" ? "Efectivo" : "Transferencia", { valor: p.monto, formato: "pesos" }])
        ];
    }

    // ----- El profe -----

    /** Récords de un entreno: los ejercicios en que levantó más que nunca antes. */
    function recordsDe(e) {
        return Object.entries(e.series).filter(([id]) => EJ[id]?.tipo === "peso").map(([id, series]) => {
            const { mejor } = marcasDe(e.socioId, id, e.fecha);
            const hoyMax = maxDe(series);
            return mejor > 0 && hoyMax > mejor ? { ejercicioId: id, nombre: EJ[id].nombre, peso: hoyMax, antes: mejor } : null;
        }).filter(Boolean);
    }

    const alumnosDe = (profeId) => db().socios.filter((s) => s.profeId === profeId && s.planId && !s.baja);

    /** El gimnasio hoy para el profe: sus alumnos por horario (llegó, entrenando, terminó) y los avisos. */
    function hoyEnElGimnasio(usuario) {
        exigir(esProfe(usuario), "Esto es del profe.");
        const pid = profeDe(usuario);
        const alumnos = alumnosDe(pid);
        const h = hoy();
        const lista = alumnos.filter((s) => indiceDelDia(s, h) !== null || llegoHoy(s.id) || entrenoDeHoy(s.id)).map((s) => {
            const p = plan(s.planId);
            const e = entrenoDeHoy(s.id);
            const idx = indiceDelDia(s, h);
            const d = e ? p.dias.find((x) => x.id === e.diaId) : idx !== null ? p.dias[idx % p.dias.length] : null;
            const llego = llegoHoy(s.id);
            return {
                ...armarSocio(s), dia: d ? { id: d.id, nombre: d.nombre } : null,
                // "falto": ya pasó su hora y media y no vino
                estado: !llego ? (aMinutos(s.hora) + 90 < minutoActual() ? "falto" : "falta") : !e || !Object.keys(e.series).length ? "llego" : e.terminado ? "termino" : "entrenando",
                llegoA: llego ? aHora(llego.minuto) : null, records: e ? recordsDe(e) : []
            };
        });
        const horarios = [...new Set(lista.map((a) => a.hora))].sort().map((hora) => ({ hora, alumnos: lista.filter((a) => a.hora === hora).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) }));
        // Avisos: récords de hoy y ayer, y los que vienen pero hace rato que no anotan nada
        const ayer = sumarDias(h, -1);
        const records = alumnos.flatMap((s) => db().entrenos.filter((e) => e.socioId === s.id && (e.fecha === h || e.fecha === ayer))
            .flatMap((e) => recordsDe(e).map((r) => ({ ...r, socioId: s.id, socio: s.nombre, fecha: e.fecha, nombreFecha: nombreFecha(e.fecha, h) }))))
            .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.socioId === SOCIO_DE["u-socio"]) - (a.socioId === SOCIO_DE["u-socio"]));
        const desde = sumarDias(h, -SIN_ANOTAR);
        const sinAnotar = alumnos.filter((s) => asistenciasDe(s.id).filter((a) => a.fecha >= desde).length >= 2 && !db().entrenos.some((e) => e.socioId === s.id && e.fecha >= desde && Object.keys(e.series).length))
            .map((s) => {
                const ultimo = entrenosDe(s.id).filter((e) => Object.keys(e.series).length).at(-1);
                return { socioId: s.id, socio: s.nombre, desde: ultimo ? diasEntre(ultimo.fecha, h) : null };
            });
        return {
            horarios, records, sinAnotar,
            llegaron: lista.filter((a) => a.estado !== "falta" && a.estado !== "falto").length, total: lista.length
        };
    }

    function listarAlumnos(usuario, texto = "") {
        exigir(esProfe(usuario), "Esto es del profe.");
        const lista = alumnosDe(profeDe(usuario)).map(armarSocio).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
        return filtrarPorTexto(lista, texto, (a) => a.nombreCompleto);
    }

    /** El profe ajusta un ejercicio solo para ese socio (series, repeticiones o peso), sin tocar la rutina de los demás. */
    function ajustar(usuario, socioId, { diaId, ejercicioId, series, reps, peso } = {}) {
        exigir(esProfe(usuario), "Los ajustes los hace el profe.");
        const s = socioCrudo(socioId);
        exigir(s.planId, `${s.nombre} no tiene rutina.`);
        const p = plan(s.planId);
        const d = p.dias.find((x) => x.id === diaId);
        exigir(d, "Ese día no está en su rutina.");
        const it = d.ejercicios.find((x) => x.ejercicioId === ejercicioId);
        exigir(it, "Ese ejercicio no está en ese día.");
        const e = ejercicio(ejercicioId);
        const aj = {
            series: numero(series, "Las series", { desde: 1, hasta: TOPES.series }),
            reps: e.tipo === "tiempo" ? numero(reps, "Los segundos", { desde: 1, hasta: TOPES.segundos }) : numero(reps, "Las repeticiones", { desde: 1, hasta: TOPES.reps }),
            el: hoy()
        };
        if (e.tipo === "peso") aj.peso = numero(peso, "El peso", { hasta: TOPES.peso, decimales: 2 });
        s.ajustes[`${p.id}|${d.id}|${ejercicioId}`] = aj;
        guardado.persistir();
        return socio(s.id);
    }

    function quitarAjuste(usuario, socioId, { diaId, ejercicioId } = {}) {
        exigir(esProfe(usuario), "Los ajustes los hace el profe.");
        const s = socioCrudo(socioId);
        delete s.ajustes[`${s.planId}|${diaId}|${ejercicioId}`];
        guardado.persistir();
        return socio(s.id);
    }

    function dejarNota(usuario, socioId, texto) {
        exigir(esProfe(usuario), "Las notas las deja el profe.");
        const s = socioCrudo(socioId);
        const t = sinPasarse(texto, TOPES.nota, "la nota");
        exigir(t, "Escribí la nota.");
        exigir(s.notas.length < TOPES.notasPorSocio, `Ya hay ${TOPES.notasPorSocio} notas para ${s.nombre}. Es una demo: tocá "Empezar de cero" arriba.`);
        s.notas.push({ id: nuevoId("nt"), texto: t, fecha: hoy(), profeId: profeDe(usuario) });
        guardado.persistir();
        return socio(s.id);
    }

    function asignarPlan(usuario, socioId, planId) {
        exigir(esProfe(usuario), "Las rutinas las asigna el profe.");
        const s = socioCrudo(socioId);
        const p = plan(planId);
        s.planId = p.id;
        s.profeId = profeDe(usuario);
        guardado.persistir();
        return socio(s.id);
    }

    // ----- Rutinas (planes pre armados) -----

    const armarPlan = (p) => ({ ...copia(p), socios: db().socios.filter((s) => s.planId === p.id && !s.baja).length });
    const listarPlanes = () => db().planes.map(armarPlan);
    const verPlan = (id) => armarPlan(plan(id));
    const planPropio = (usuario, id) => {
        exigir(esProfe(usuario), "Las rutinas las arma el profe.");
        return plan(id);
    };

    function copiarPlan(usuario, id, nombre = "") {
        const orig = planPropio(usuario, id);
        guardar("planes", TOPES.planes, "rutinas");
        const n = sinPasarse(nombre || `${orig.nombre} (copia)`.slice(0, TOPES.nombre), TOPES.nombre, "el nombre de la rutina");
        exigir(!db().planes.some((p) => p.nombre.toLowerCase() === n.toLowerCase()), "Ya hay una rutina con ese nombre.");
        const p = { ...copia(orig), id: nuevoId("pl"), nombre: n, propio: true, creadoEn: ahora() };
        db().planes.push(p);
        guardado.persistir();
        return armarPlan(p);
    }

    function renombrarPlan(usuario, id, nombre) {
        const p = planPropio(usuario, id);
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre de la rutina");
        exigir(n, "Poné el nombre de la rutina.");
        exigir(!db().planes.some((x) => x.id !== id && x.nombre.toLowerCase() === n.toLowerCase()), "Ya hay una rutina con ese nombre.");
        p.nombre = n;
        guardado.persistir();
        return armarPlan(p);
    }

    function agregarDia(usuario, id) {
        const p = planPropio(usuario, id);
        exigir(p.dias.length < TOPES.diasPlan, `Una rutina tiene hasta ${TOPES.diasPlan} días.`);
        const letra = [...LETRAS].find((l) => !p.dias.some((d) => d.id === l));
        p.dias.push({ id: letra, nombre: `Día ${letra}`, ejercicios: [] });
        guardado.persistir();
        return armarPlan(p);
    }

    function quitarDia(usuario, id, diaId) {
        const p = planPropio(usuario, id);
        exigir(p.dias.length > 1, "La rutina tiene que tener al menos un día.");
        const i = p.dias.findIndex((d) => d.id === diaId);
        exigir(i >= 0, "Ese día no está en la rutina.");
        p.dias.splice(i, 1);
        guardado.persistir();
        return armarPlan(p);
    }

    function renombrarDia(usuario, id, diaId, nombre) {
        const p = planPropio(usuario, id);
        const d = p.dias.find((x) => x.id === diaId);
        exigir(d, "Ese día no está en la rutina.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre del día");
        exigir(n, "Poné qué se trabaja ese día (ej: Piernas y core).");
        d.nombre = n;
        guardado.persistir();
        return armarPlan(p);
    }

    function agregarEjercicio(usuario, id, diaId, ejercicioId) {
        const p = planPropio(usuario, id);
        const d = p.dias.find((x) => x.id === diaId);
        exigir(d, "Ese día no está en la rutina.");
        const e = ejercicio(ejercicioId);
        exigir(!d.ejercicios.some((x) => x.ejercicioId === ejercicioId), "Ese ejercicio ya está en ese día.");
        exigir(d.ejercicios.length < TOPES.ejerciciosPorDia, `Un día tiene hasta ${TOPES.ejerciciosPorDia} ejercicios.`);
        d.ejercicios.push({ ejercicioId, series: 3, reps: e.tipo === "tiempo" ? 30 : 10, descanso: 60, peso: e.tipo === "peso" ? 10 : 0 });
        guardado.persistir();
        return armarPlan(p);
    }

    function quitarEjercicio(usuario, id, diaId, ejercicioId) {
        const p = planPropio(usuario, id);
        const d = p.dias.find((x) => x.id === diaId);
        exigir(d, "Ese día no está en la rutina.");
        const i = d.ejercicios.findIndex((x) => x.ejercicioId === ejercicioId);
        exigir(i >= 0, "Ese ejercicio no está en ese día.");
        d.ejercicios.splice(i, 1);
        guardado.persistir();
        return armarPlan(p);
    }

    function cambiarEjercicio(usuario, id, diaId, ejercicioId, { series, reps, descanso, peso } = {}) {
        const p = planPropio(usuario, id);
        const d = p.dias.find((x) => x.id === diaId);
        exigir(d, "Ese día no está en la rutina.");
        const it = d.ejercicios.find((x) => x.ejercicioId === ejercicioId);
        exigir(it, "Ese ejercicio no está en ese día.");
        const e = ejercicio(ejercicioId);
        const nuevo = {
            series: numero(series, "Las series", { desde: 1, hasta: TOPES.series }),
            reps: e.tipo === "tiempo" ? numero(reps, "Los segundos", { desde: 1, hasta: TOPES.segundos }) : numero(reps, "Las repeticiones", { desde: 1, hasta: TOPES.reps }),
            descanso: numero(descanso, "El descanso", { desde: TOPES.descansoMin, hasta: TOPES.descansoMax }),
            peso: e.tipo === "peso" ? numero(peso, "El peso", { hasta: TOPES.peso, decimales: 2 }) : 0
        };
        Object.assign(it, nuevo);
        guardado.persistir();
        return armarPlan(p);
    }

    /**
     * La rutina de un socio para el PDF: un renglón de título por día y uno por ejercicio (con sus ajustes y el peso
     * que le toca). Columnas: Ejercicio · Series · Peso · Descanso.
     */
    function rutinaParaPapel(socioId) {
        const a = socio(socioId);
        exigir(a.rutina, `${a.nombre} no tiene rutina.`);
        return {
            socio: a.nombreCompleto, plan: a.plan, profe: a.profe, dias: a.diasTexto, hora: a.hora, objetivo: a.objetivo,
            columnas: ["Ejercicio", "Series", "Peso", "Descanso"],
            filas: a.rutina.flatMap((d) => [
                [`DÍA ${d.id} · ${d.nombre.toUpperCase()}`, "", "", ""],
                ...d.ejercicios.map((e) => [`   ${e.nombre}`, `${e.series} × ${cuanto(e.tipo, e.reps)}`, e.tipo === "peso" ? kilos(e.sugerido) : "-", `${e.descanso} s`])
            ])
        };
    }

    return {
        guardado, hoy,
        // socio
        hoyLeToca, llegue, entrenarOtroDia, anotarSerie, deshacerSerie, terminarEntreno, miSemana, progreso,
        dias, clasesDelDia, reservar, cancelarReserva, misReservas, miCuota, avisarPago,
        // dueña
        listarSocios, contarFiltros, tablero, socio, registrarPago, confirmarPago, rechazarPago, anularPago, recordatorio,
        invitarVolver, anotarApto, firmarReglamento, altaSocio, darDeBaja, reactivar, gimnasio, filasSocios, filasPagos,
        // profe
        hoyEnElGimnasio, listarAlumnos, ajustar, quitarAjuste, dejarNota, asignarPlan,
        listarPlanes, verPlan, copiarPlan, renombrarPlan, agregarDia, quitarDia, renombrarDia, agregarEjercicio,
        quitarEjercicio, cambiarEjercicio, rutinaParaPapel
    };
}
