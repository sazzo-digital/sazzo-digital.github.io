// ============================================
// Motor de turnos: lo común a cualquier demo que reserva horarios (canchas, sillones, consultorios…).
// Solo reglas, sin datos ni pantallas: los turnos y los fijos los guarda cada demo.
//   - Las horas van en minutos desde las 00:00 (18:30 → 1110); el fin del día es 1440.
//   - Un turno: { lugarId, fecha: "AAAA-MM-DD", inicio (minutos), duracion (minutos), anulado? }.
//     anulado: true = cancelado o liberado (no ocupa el lugar; nada se borra).
//   - Un fijo: { id, lugarId, dia (0 = domingo … 6 = sábado), inicio, duracion, liberadas: ["AAAA-MM-DD"], desde? }:
//     ocupa su lugar todas las semanas ese día, salvo las fechas liberadas.
// La regla de oro: dos turnos del mismo lugar nunca se pisan.
// ============================================
import { fechaLocalISO, esFechaISO } from "./fechas.js?v=54226d45fc";

export const MINUTOS_DIA = 1440;

/** "18:30" → 1110. "24:00" vale como fin del día. */
export function aMinutos(texto) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(texto ?? ""));
    if (!m) throw new Error(`La hora "${texto}" no se entiende (tiene que ser como 18:30).`);
    const total = Number(m[1]) * 60 + Number(m[2]);
    if (Number(m[2]) > 59 || total > MINUTOS_DIA) throw new Error(`La hora "${texto}" no existe.`);
    return total;
}

/** 1110 → "18:30"; 1440 → "00:00". */
export function aHora(minutos) {
    const m = ((minutos % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Día de la semana de una fecha AAAA-MM-DD (0 = domingo … 6 = sábado). */
export function diaSemana(fecha) {
    if (!esFechaISO(fecha)) throw new Error(`La fecha "${fecha}" no existe.`);
    const [a, m, d] = fecha.split("-").map(Number);
    return new Date(a, m - 1, d).getDay();
}

/** Las próximas `cuantos` fechas desde hoy (o desde `desde` días): ["2026-10-08", "2026-10-09", …]. */
export const proximosDias = (cuantos, desde = 0) => Array.from({ length: cuantos }, (_, i) => fechaLocalISO(desde + i));

/** Minuto actual del día (hora local). */
export function minutoAhora(fecha = new Date()) {
    return fecha.getHours() * 60 + fecha.getMinutes();
}

/**
 * Los horarios de inicio que entran en un horario: desde `abre`, cada `paso` minutos, mientras el turno de
 * `duracion` termine antes de `cierra`. Ej: abre 18:00, cierra 24:00, duración 90 → 18:00, 19:30, 21:00, 22:30.
 */
export function franjas({ abre, cierra, duracion, paso = duracion }) {
    if (![abre, cierra, duracion, paso].every(Number.isInteger)) throw new Error("El horario tiene que ir en minutos enteros.");
    if (duracion <= 0 || paso <= 0) throw new Error("La duración de un turno tiene que ser de más de 0 minutos.");
    if (abre < 0 || cierra > MINUTOS_DIA || abre >= cierra) throw new Error("El horario de apertura y cierre no cierra.");
    const lista = [];
    for (let inicio = abre; inicio + duracion <= cierra; inicio += paso) lista.push(inicio);
    return lista;
}

/** ¿Se pisan dos turnos? (mismo lugar, misma fecha y horarios que se cruzan; uno que termina 21:00 y otro que empieza 21:00 no). */
export function sePisan(a, b) {
    return a.lugarId === b.lugarId && a.fecha === b.fecha && a.inicio < b.inicio + b.duracion && b.inicio < a.inicio + a.duracion;
}

/** Los fijos que ocupan un lugar en una fecha (como turnos de ese día, con `fijoId`). */
export function fijosDelDia(fijos, fecha, lugarId = null) {
    const dia = diaSemana(fecha);
    return fijos
        .filter((f) => f.dia === dia && (!lugarId || f.lugarId === lugarId) && !(f.liberadas ?? []).includes(fecha) && (!f.desde || fecha >= f.desde))
        .map((f) => ({ ...f, fecha, fijoId: f.id, esFijo: true }));
}

/** Todo lo que ocupa un lugar en una fecha: turnos no anulados + fijos de ese día. */
export function ocupados({ turnos = [], fijos = [], lugarId, fecha }) {
    return turnos
        .filter((t) => !t.anulado && t.lugarId === lugarId && t.fecha === fecha)
        .concat(fijosDelDia(fijos, fecha, lugarId))
        .sort((a, b) => a.inicio - b.inicio);
}

/**
 * Los horarios libres de un lugar en una fecha. `desdeMinuto` deja afuera lo que ya empezó (para hoy).
 * horario: { abre, cierra, duracion, paso? } (en minutos).
 */
export function libres({ lugarId, fecha, horario, turnos = [], fijos = [], desdeMinuto = null }) {
    const tomados = ocupados({ turnos, fijos, lugarId, fecha });
    return franjas(horario).filter((inicio) => {
        if (desdeMinuto !== null && inicio < desdeMinuto) return false;
        const nuevo = { lugarId, fecha, inicio, duracion: horario.duracion };
        return !tomados.some((t) => sePisan(nuevo, t));
    });
}

/** Revisa que un turno nuevo entre en el horario y no pise a nadie; si no, da el error que se lee en pantalla. */
export function revisarLibre({ lugarId, fecha, inicio, horario, turnos = [], fijos = [], desdeMinuto = null }) {
    if (!esFechaISO(fecha)) throw new Error("Esa fecha no existe.");
    if (!franjas(horario).includes(inicio)) throw new Error("Ese horario no está entre los turnos de ese día.");
    if (desdeMinuto !== null && inicio < desdeMinuto) throw new Error("Ese horario ya pasó.");
    const nuevo = { lugarId, fecha, inicio, duracion: horario.duracion };
    const pisado = ocupados({ turnos, fijos, lugarId, fecha }).find((t) => sePisan(nuevo, t));
    if (pisado) throw new Error(`Ese horario ya está ocupado (${aHora(pisado.inicio)} a ${aHora(pisado.inicio + pisado.duracion)}).`);
    return true;
}
