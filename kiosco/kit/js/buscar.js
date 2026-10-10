// ============================================
// Búsqueda que perdona errores, como escribe la gente apurada en el mostrador:
//   "koka" encuentra "Coca", "alfajo" encuentra "Alfajor", "jorje" encuentra "Jorge", "perfume bainilla" encuentra
//   "Perfume vainilla". Sin tildes ni mayúsculas, "c/k/qu", "s/z", "b/v", "ll/y", la "h" muda, letras dobles y una
//   letra de más, de menos o cambiada (dos en palabras largas).
//   filtrarPorTexto(productos, "koka", (p) => p.nombre)   → los que coinciden, los más parecidos primero
// Sin librería (Fuse.js pesa 25 KB y para listas de cientos de cosas alcanza con esto). No toca la pantalla.
// ============================================
import { textoParaComparar } from "./tablas.js?v=66194d9fee";

const TOPE_BUSQUEDA = 60; // letras de lo que se busca
const TOPE_PALABRAS = 6;

/** Cómo suena (en castellano rioplatense): dos escrituras que suenan igual quedan iguales. */
export function comoSuena(palabra) {
    return palabra
        .replace(/qu(?=[ei])/g, "k")
        .replace(/c(?=[ei])/g, "s")
        .replace(/c/g, "k")
        .replace(/q/g, "k")
        .replace(/z/g, "s")
        .replace(/v/g, "b")
        .replace(/w/g, "u")
        .replace(/ll/g, "y")
        .replace(/h/g, "")
        .replace(/([a-z])\1/g, "$1"); // letras dobles ("cocca"), no tiras enteras ("aaaa" no es "a")
}

/** Cuántas letras hay que cambiar para pasar de a a b (corta apenas pasa de `tope`). */
function distancia(a, b, tope) {
    if (Math.abs(a.length - b.length) > tope) return tope + 1;
    let antes = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const fila = [i];
        let menor = i;
        for (let j = 1; j <= b.length; j++) {
            fila[j] = Math.min(antes[j] + 1, fila[j - 1] + 1, antes[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            menor = Math.min(menor, fila[j]);
        }
        if (menor > tope) return tope + 1;
        antes = fila;
    }
    return antes[b.length];
}

/**
 * Qué tan bien coincide un texto con lo buscado: 0 = nada; 3 = lo contiene tal cual; 2 = cada palabra buscada es el
 * principio de una palabra del texto; 1 = suena igual o tiene un error de tipeo.
 */
export function puntaje(texto, busqueda) {
    const b = textoParaComparar(String(busqueda ?? "").slice(0, TOPE_BUSQUEDA));
    if (!b) return 3;
    const t = textoParaComparar(texto);
    if (!t) return 0;
    if (t.includes(b)) return 3;
    const palabras = t.split(" ");
    const sonidos = palabras.map(comoSuena);
    let peor = 2;
    for (const q of b.split(" ").slice(0, TOPE_PALABRAS)) {
        if (palabras.some((p) => p.startsWith(q))) continue;
        peor = 1;
        const s = comoSuena(q);
        if (s && sonidos.some((p) => p.startsWith(s))) continue;
        // Un error de tipeo: contra el principio de cada palabra, del mismo largo (más o menos una letra)
        const tope = s.length >= 7 ? 2 : 1;
        if (s.length < 4 || !sonidos.some((p) => [0, -1, 1].some((d) => distancia(s, p.slice(0, s.length + d), tope) <= tope))) return 0;
    }
    return peor;
}

export const coincide = (texto, busqueda) => puntaje(texto, busqueda) > 0;

/**
 * Los de la lista que coinciden con lo buscado, los más parecidos primero (los que empatan quedan en el orden en que
 * venían). `textoDe(x)` dice dónde buscar en cada uno (ej: nombre y notas juntos).
 */
export function filtrarPorTexto(lista, busqueda, textoDe) {
    if (!textoParaComparar(String(busqueda ?? ""))) return lista;
    return lista
        .map((x, i) => ({ x, i, p: puntaje(textoDe(x), busqueda) }))
        .filter((r) => r.p > 0)
        .sort((a, b) => b.p - a.p || a.i - b.i)
        .map((r) => r.x);
}
