// ============================================
// "Probala con tus colores": el dueño elige un color y la demo cambia en el momento.
// - Solo se aceptan colores "#rrggbb" (lo que se elige termina adentro de una regla de estilos: nada más pasa).
// - Si el color no se lee bien, se ajusta solo: en el tema claro se oscurece hasta leerse sobre las tarjetas crema,
//   en el oscuro se aclara hasta leerse sobre el fondo casi negro. La letra de los botones (blanca u oscura) se
//   elige por contraste. Así ningún color elegido deja la demo ilegible.
// - Se guarda por demo ("sazzo-kiosco-colores"); "Volver al color de la demo" lo borra.
// ============================================
import { $, $$, esc } from "./ui.js?v=a1bc4c3709";

// Fondos contra los que tiene que leerse el acento (base/_temas.scss)
const TARJETA_CLARA = "#e9dfcc";
const FONDO_OSCURO = "#111816";
const LETRA_CLARA = "#ffffff";
const LETRA_OSCURA = "#04120c";
export const CONTRASTE_MINIMO = 4.5; // lo que pide la norma para texto

export const COLORES_LISTOS = [
    ["Verde", "#045a42"],
    ["Azul", "#1d4ed8"],
    ["Celeste", "#0284c7"],
    ["Violeta", "#7c3aed"],
    ["Rosa", "#db2777"],
    ["Rojo", "#dc2626"],
    ["Naranja", "#ea580c"],
    ["Amarillo", "#eab308"]
];

/** "#ABCDEF" → "#abcdef"; cualquier otra cosa → null. */
export function normalizarColor(texto) {
    const t = String(texto ?? "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(t) ? t : null;
}

const aRGB = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const aHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** Luminancia relativa (fórmula de la norma WCAG). */
function luminancia(hex) {
    const [r, g, b] = aRGB(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste entre dos colores: de 1 (iguales) a 21 (negro y blanco). */
export function contraste(a, b) {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

/** Mezcla `color` hacia `destino` de a poco hasta que se lea sobre `fondo` (o hasta llegar al destino). */
function ajustar(color, fondo, destino) {
    const [c, d] = [aRGB(color), aRGB(destino)];
    for (let paso = 0; paso <= 20; paso++) {
        const mezcla = aHex(c.map((v, i) => v + ((d[i] - v) * paso) / 20));
        if (contraste(mezcla, fondo) >= CONTRASTE_MINIMO) return mezcla;
    }
    return destino;
}

const letraPara = (fondo) => (contraste(LETRA_CLARA, fondo) >= contraste(LETRA_OSCURA, fondo) ? LETRA_CLARA : LETRA_OSCURA);

/** Los colores que se usan de verdad en cada tema, a partir del elegido. */
export function coloresPara(elegido) {
    const color = normalizarColor(elegido);
    if (!color) throw new Error("Ese color no sirve: tiene que ser como #1d4ed8.");
    const claro = ajustar(color, TARJETA_CLARA, "#000000");
    const oscuro = ajustar(color, FONDO_OSCURO, "#ffffff");
    return { claro, claroTexto: letraPara(claro), oscuro, oscuroTexto: letraPara(oscuro) };
}

/** La regla de estilos que pisa el acento de la demo (mismas condiciones que base/_temas.scss). */
export function reglaDeColores(elegido) {
    const c = coloresPara(elegido);
    return `:root{--primario:${c.claro};--primario-texto:${c.claroTexto}}
:root:not([data-tema="claro"]){--primario:${c.oscuro};--primario-texto:${c.oscuroTexto}}
:root[data-tema="oscuro"]{--primario:${c.oscuro};--primario-texto:${c.oscuroTexto}}`;
}

/** Aplica un color elegido (o lo saca, con null) y lo guarda para esta demo. */
export function aplicarColor(prefijo, elegido) {
    const clave = `${prefijo}-colores`;
    let estilo = document.getElementById("sazzo-colores");
    const color = normalizarColor(elegido);
    if (!color) {
        estilo?.remove();
        try {
            localStorage.removeItem(clave);
        } catch {
            // nada que borrar
        }
        return null;
    }
    if (!estilo) {
        estilo = document.createElement("style");
        estilo.id = "sazzo-colores";
        document.head.append(estilo);
    }
    estilo.textContent = reglaDeColores(color);
    try {
        localStorage.setItem(clave, color);
    } catch {
        // sin almacenamiento: dura hasta recargar
    }
    return color;
}

/** Al arrancar la demo: vuelve a poner el color que eligió la última vez (si eligió alguno). */
export function recuperarColor(prefijo) {
    let guardado = null;
    try {
        guardado = localStorage.getItem(`${prefijo}-colores`);
    } catch {
        // sin almacenamiento
    }
    return normalizarColor(guardado) ? aplicarColor(prefijo, guardado) : null;
}

/** La ventanita para elegir: colores listos, uno a elección y "Volver al color de la demo". */
export function abrirColores(prefijo, { alElegir } = {}) {
    document.querySelector("dialog.colores")?.remove();
    const hoja = document.createElement("dialog");
    hoja.className = "hoja colores";
    hoja.setAttribute("aria-labelledby", "colores-titulo");
    hoja.innerHTML = `
        <form method="dialog" class="hoja__caja">
            <div class="hoja__titulos">
                <h2 id="colores-titulo"><i class="ti ti-palette" aria-hidden="true"></i> Probala con tus colores</h2>
                <button class="boton-icono" value="cerrar" aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            <p class="nota">Elegí el color de tu negocio y mirá cómo queda. Si no se lee bien, lo ajustamos solos.</p>
            <div class="colores__lista">
                ${COLORES_LISTOS.map(([nombre, hex]) => `
                <button type="button" class="colores__muestra" data-color="${esc(hex)}" style="--muestra: ${esc(hex)}" title="${esc(nombre)}" aria-label="${esc(nombre)}"></button>`).join("")}
            </div>
            <label class="colores__propio">
                <span><i class="ti ti-color-picker" aria-hidden="true"></i> Otro color</span>
                <input type="color" value="#1d4ed8">
            </label>
            <button type="button" class="boton boton--secundario boton--ancho" data-color="">Volver al color de la demo</button>
        </form>`;
    document.body.append(hoja);
    const elegir = (color) => {
        const aplicado = aplicarColor(prefijo, color);
        alElegir?.(aplicado);
    };
    $$("[data-color]", hoja).forEach((b) => b.addEventListener("click", () => elegir(b.dataset.color)));
    $('input[type="color"]', hoja).addEventListener("input", (e) => elegir(e.target.value));
    hoja.addEventListener("close", () => hoja.remove());
    hoja.addEventListener("click", (e) => {
        if (e.target === hoja) hoja.close(); // tocar afuera cierra
    });
    hoja.showModal();
    return hoja;
}

// ---------- Globito "Probala con tus colores" (la primera vez que se abre cada demo) ----------
// Aparece arriba del botón de la paleta de la barrita, con una puntita que lo señala. Se cierra al tocarlo o al
// tocar la paleta y no vuelve a aparecer en esa demo ("sazzo-kiosco-globito-colores"). Sin almacenamiento
// (ventana privada estricta): no vuelve a aparecer hasta recargar.
const globitosVistos = new Set();
export const claveGlobito = (prefijo) => `${prefijo}-globito-colores`;

export function yaVioGlobito(prefijo) {
    if (globitosVistos.has(prefijo)) return true;
    try {
        return localStorage.getItem(claveGlobito(prefijo)) === "1";
    } catch {
        return false;
    }
}

function marcarGlobitoVisto(prefijo) {
    globitosVistos.add(prefijo);
    try {
        localStorage.setItem(claveGlobito(prefijo), "1");
    } catch {
        // sin almacenamiento: queda en memoria
    }
}

/** Muestra el globito al lado de la paleta de la barrita (si hay barrita y no lo vio). Devuelve el globito o null. */
export function mostrarGlobitoColores(raiz, prefijo) {
    const paleta = $(".barra-sazzo [data-colores]", raiz);
    if (!paleta || yaVioGlobito(prefijo)) return null;
    $(".globito-colores", raiz)?.remove();
    const lugar = document.createElement("div");
    lugar.className = "globito-colores";
    lugar.innerHTML = `
        <button class="globito-colores__burbuja" type="button" aria-label="Probala con tus colores: tocá la paleta de abajo. Cerrar este aviso">
            <i class="ti ti-palette" aria-hidden="true"></i><span>Probala con tus colores</span><i class="ti ti-x" aria-hidden="true"></i>
        </button>`;
    paleta.closest(".barra-sazzo").before(lugar);
    const cerrar = () => {
        marcarGlobitoVisto(prefijo);
        lugar.remove();
    };
    $("button", lugar).addEventListener("click", cerrar);
    paleta.addEventListener("click", cerrar);
    return lugar;
}
