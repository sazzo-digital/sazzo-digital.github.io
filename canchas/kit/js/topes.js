// ============================================
// Topes contra valores absurdos (alguien aburrido carga un kilometraje de 25 cifras o un nombre de 10.000 letras).
// Todo número o texto que se carga en una demo pasa por acá, y cada campo nuevo suma una prueba con un valor absurdo.
// El máximo lo pasa siempre la demo (cada rubro tiene el suyo).
// ============================================

export const esEnteroPositivo = (n) => Number.isInteger(n) && n > 0;

/** Un número entero entre `desde` y `hasta`; si no, el error dice cuál es el rango. */
export function enteroHasta(n, que, { desde = 0, hasta } = {}) {
    if (!Number.isInteger(hasta)) throw new Error(`Falta el máximo de ${que} (lo define la demo).`);
    if (!Number.isInteger(n) || n < desde || n > hasta) {
        throw new Error(`${que} tiene que ser un número entero ${desde > 0 ? "mayor a 0" : "de 0 o más"} y hasta ${hasta.toLocaleString("es-AR")}.`);
    }
    return n;
}

/** Un texto que no se pasa de `largo` letras (devuelve el texto sin espacios de más). */
export function sinPasarse(texto, largo, que) {
    const t = String(texto ?? "").trim();
    if (t.length > largo) throw new Error(`Te pasaste de largo en ${que} (máximo ${largo} letras).`);
    return t;
}
