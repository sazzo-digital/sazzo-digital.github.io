// ============================================
// Dibuja un código de barras EAN-13 (el que imprime la balanza en la etiqueta) como SVG, para las etiquetas de
// ejemplo: se pueden escanear desde otra pantalla o imprimir. Siempre negro sobre blanco (si no, la cámara no lo lee).
// ============================================
import { esc } from "../kit/js/ui.js?v=5c760847bf";

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARIDAD = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

/** Los 95 módulos (1 = barra) de un EAN-13. null si no son 13 números. */
export function modulosEAN(codigo) {
    const c = String(codigo ?? "");
    if (!/^\d{13}$/.test(c)) return null;
    const d = [...c].map(Number);
    const izquierda = d.slice(1, 7).map((n, i) => (PARIDAD[d[0]][i] === "L" ? L[n] : G[n])).join("");
    const derecha = d.slice(7).map((n) => R[n]).join("");
    return `101${izquierda}01010${derecha}101`;
}

/** El SVG del código (con su margen blanco y los números abajo). */
export function svgEAN(codigo, { alto = 60 } = {}) {
    const m = modulosEAN(codigo);
    if (!m) return "";
    const margen = 11;
    const ancho = m.length + margen * 2;
    const barras = [];
    for (let i = 0; i < m.length; i++) {
        if (m[i] !== "1") continue;
        let j = i;
        while (m[j + 1] === "1") j++;
        barras.push(`<rect x="${margen + i}" y="0" width="${j - i + 1}" height="${alto}"/>`);
        i = j;
    }
    return `
        <svg class="codigo-barras" viewBox="0 0 ${ancho} ${alto + 12}" role="img" aria-label="Código de barras ${esc(codigo)}">
            <rect class="codigo-barras__fondo" width="${ancho}" height="${alto + 12}"/>
            <g class="codigo-barras__barras">${barras.join("")}</g>
            <text x="${ancho / 2}" y="${alto + 10}" text-anchor="middle">${esc(codigo)}</text>
        </svg>`;
}
