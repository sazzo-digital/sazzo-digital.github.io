// ============================================
// Leer tablas que vienen de afuera (un Excel del proveedor): encontrar las columnas por su título y entender los
// precios escritos a la argentina. No toca la pantalla: lo usan los datos de cada demo (y sus pruebas).
//   const col = columnasDe(filas, { codigo: ["código", "ean"], precio: ["precio", "pvp"] });
//   numeroDe("$ 1.500,50") → 1500.5
// ============================================

/** "Código de Barras" → "codigo de barras" (sin tildes, signos ni espacios de más), para comparar textos. */
export const textoParaComparar = (t) =>
    String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Busca la fila de títulos y las columnas pedidas, por palabras parecidas:
 *   columnasDe(filas, { codigo: ["código", "cod", "ean"], precio: ["precio", "p. venta"] })
 *   → { titulos: 0, codigo: 1, precio: 3 } (las que no encuentra quedan en -1)
 * Mira las primeras 10 filas: muchas listas de proveedores traen el nombre de la empresa arriba.
 */
export function columnasDe(filas, buscadas) {
    let mejor = { titulos: -1, puntos: 0 };
    for (let i = 0; i < Math.min(filas.length, 10); i++) {
        const celdas = (Array.isArray(filas[i]) ? filas[i] : []).map(textoParaComparar);
        const encontradas = { titulos: i };
        let puntos = 0;
        for (const [clave, palabras] of Object.entries(buscadas)) {
            const opciones = palabras.map(textoParaComparar);
            const j = celdas.findIndex((c) => c && opciones.some((p) => c === p || c.startsWith(`${p} `)));
            encontradas[clave] = j;
            if (j >= 0) puntos++;
        }
        if (puntos > mejor.puntos) mejor = { ...encontradas, puntos };
    }
    const { puntos, ...resultado } = mejor;
    for (const clave of Object.keys(buscadas)) resultado[clave] ??= -1;
    return resultado;
}

/** "$ 1.500,50" / "1.500" / "1500.5" / 1500 → número (NaN si no es un número). */
export function numeroDe(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : NaN;
    let t = String(valor ?? "").replace(/[$\s]/g, "");
    if (!t || t.length > 20) return NaN;
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); // 1.500,50
    else t = t.replace(/[.,](?=\d{3}(?:\D|$))/g, ""); // 1.500 o 1,500 (miles)
    return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}
