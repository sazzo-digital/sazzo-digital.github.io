// ============================================
// Fechas en hora local (no UTC: a la noche en Argentina, UTC ya es "mañana").
// Las fechas sin hora se guardan como texto AAAA-MM-DD (se comparan bien como texto).
// ============================================

/** Fecha local en formato AAAA-MM-DD, corrida `dias` días (negativo = pasado). */
export function fechaLocalISO(dias = 0) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Día local (AAAA-MM-DD) de un momento guardado en ISO, o null si no hay. */
export function diaLocalDe(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ¿Es una fecha AAAA-MM-DD que existe? (rechaza "2026-02-30") */
export function esFechaISO(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto || "")) return false;
    const [a, m, d] = texto.split("-").map(Number);
    const f = new Date(a, m - 1, d);
    return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d;
}

/** Días que faltan hasta una fecha AAAA-MM-DD (negativo si ya pasó). */
export function diasHasta(fechaISO) {
    const [a, m, d] = fechaISO.split("-").map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(a, m - 1, d) - hoy) / 86400000);
}
