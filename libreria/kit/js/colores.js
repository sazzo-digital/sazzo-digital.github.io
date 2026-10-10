// ============================================
// "Probala con tus colores": el dueño elige un color y la demo cambia en el momento.
// - Solo se aceptan colores "#rrggbb" (lo que se elige termina adentro de una regla de estilos: nada más pasa).
// - Si el color no se lee bien, se ajusta solo: en el tema claro se oscurece hasta leerse sobre las tarjetas crema,
//   en el oscuro se aclara hasta leerse sobre el fondo casi negro. La letra de los botones (blanca u oscura) se
//   elige por contraste. Así ningún color elegido deja la demo ilegible.
// - Se guarda por demo ("sazzo-kiosco-colores"); "Volver al color de la demo" lo borra.
// - "Sacar los colores de tu logo": el dueño elige la imagen de su logo y la demo saca sus colores sola (hasta 3, el
//   primero se aplica). La imagen se lee EN el celular (se achica a 64 × 64 y se cuentan los colores): no se sube a
//   ningún lado ni se guarda. Logo en blanco y negro → se avisa y se elige de la lista.
// ============================================
import { $, $$, esc } from "./ui.js?v=114958267d";

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

// ---------- Los colores de un logo (en el celular, sin subir nada) ----------
const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * De los píxeles de una imagen (RGBA, como los da un canvas) saca hasta `cuantos` colores de marca, del más fuerte al
 * menos: deja afuera lo transparente, el blanco, el negro y los grises, agrupa los parecidos y pesa más lo más vivo.
 * Devuelve ["#rrggbb", …] (vacío si el logo es blanco y negro).
 */
export function coloresDominantes(pixeles, cuantos = 3) {
    const cubos = new Map();
    for (let i = 0; i + 3 < pixeles.length; i += 4) {
        const [r, g, b, a] = [pixeles[i], pixeles[i + 1], pixeles[i + 2], pixeles[i + 3]];
        if (a < 128) continue;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturacion = max ? (max - min) / max : 0;
        if (saturacion < 0.25 || max < 40) continue; // grises, blanco o negro: no son "el color" del logo
        const clave = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        const cubo = cubos.get(clave) ?? { r: 0, g: 0, b: 0, n: 0, peso: 0 };
        cubo.r += r;
        cubo.g += g;
        cubo.b += b;
        cubo.n++;
        cubo.peso += 0.5 + saturacion;
        cubos.set(clave, cubo);
    }
    const elegidos = [];
    for (const c of [...cubos.values()].sort((x, y) => y.peso - x.peso)) {
        const rgb = [c.r / c.n, c.g / c.n, c.b / c.n];
        if (elegidos.every((e) => distancia(e, rgb) > 70)) elegidos.push(rgb);
        if (elegidos.length >= cuantos) break;
    }
    return elegidos.map((rgb) => aHex(rgb));
}

const TOPE_LOGO = 15 * 1024 * 1024; // 15 MB: una foto del logo con el celular entra de sobra

/** Lee el archivo de imagen en el celular y devuelve sus colores (ver coloresDominantes). */
export async function coloresDeLogo(archivo) {
    if (!archivo || !/^image\//.test(archivo.type)) throw new Error("Elegí una imagen: el logo de tu negocio.");
    if (archivo.size > TOPE_LOGO) throw new Error("La imagen es muy pesada (máximo 15 MB).");
    try {
        const imagen = await cargarImagen(archivo);
        const ancho = imagen.width || imagen.naturalWidth || 64;
        const alto = imagen.height || imagen.naturalHeight || 64;
        const escala = Math.min(1, 64 / Math.max(ancho, alto));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.max(1, Math.round(ancho * escala));
        lienzo.height = Math.max(1, Math.round(alto * escala));
        const pintor = lienzo.getContext("2d", { willReadFrequently: true });
        pintor.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        imagen.close?.();
        return coloresDominantes(pintor.getImageData(0, 0, lienzo.width, lienzo.height).data);
    } catch {
        throw new Error("No se pudo leer esa imagen. Probá con otra (PNG o JPG).");
    }
}

/** La imagen lista para dibujar: createImageBitmap (rápido, anda con la pestaña escondida); si no puede (SVG), <img>. */
async function cargarImagen(archivo) {
    try {
        return await createImageBitmap(archivo);
    } catch {
        const url = URL.createObjectURL(archivo);
        try {
            const imagen = new Image();
            await new Promise((listo, mal) => {
                imagen.onload = listo;
                imagen.onerror = mal;
                imagen.src = url;
            });
            return imagen;
        } finally {
            URL.revokeObjectURL(url);
        }
    }
}

/** La ventanita para elegir: colores listos, uno a elección y "Volver al color de la demo". */
// ---------- "Probala con tu nombre" (10/10) ----------
// El dueño escribe el nombre de su negocio adentro de la demo y aparece arriba, debajo del nombre de la demo. Lo escribe
// él (nunca viene del link), queda solo en ese navegador ("sazzo-kiosco-nombre") y NO se manda al registro de visitas.
export const TOPE_NOMBRE = 40;
const EJEMPLO_NOMBRE = "Lo de Tano";
export const claveNombre = (prefijo) => `${prefijo}-nombre`;
const nombresEnMemoria = new Map(); // sin localStorage (ventana privada estricta): hasta recargar

/** Sin caracteres de control ni < >, espacios de a uno y con tope. */
export const limpiarNombre = (texto) => String(texto ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, TOPE_NOMBRE);

export function leerNombre(prefijo) {
    try {
        return limpiarNombre(localStorage.getItem(claveNombre(prefijo)));
    } catch {
        return nombresEnMemoria.get(prefijo) ?? "";
    }
}

export function guardarNombre(prefijo, nombre) {
    const limpio = limpiarNombre(nombre);
    nombresEnMemoria.set(prefijo, limpio);
    try {
        if (limpio) localStorage.setItem(claveNombre(prefijo), limpio);
        else localStorage.removeItem(claveNombre(prefijo));
    } catch {
        // queda en memoria
    }
    return limpio;
}

/**
 * El nombre del negocio de la demo: el que escribió el dueño o, si no, el de ejemplo. Cada demo lo usa en su marca.js
 * (NEGOCIO), así sale en las pantallas, los tickets, los PDF y los mensajes. Se lee al abrir la demo: al cambiarlo,
 * la hoja recarga la pantalla cuando se cierra.
 */
export const negocioDe = (prefijo, ejemplo) => leerNombre(prefijo) || ejemplo;

/** Lo muestra en la cabecera (o vuelve al lema de la demo si lo borró). Con textContent: nunca como HTML. */
export function mostrarNombre(nombre, raiz = document) {
    const lugar = raiz.querySelector("[data-nombre-negocio]");
    if (!lugar) return;
    lugar.textContent = nombre || lugar.dataset.lema || "";
    lugar.hidden = !lugar.textContent;
}

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
            <label class="colores__nombre">
                <span><i class="ti ti-building-store" aria-hidden="true"></i> El nombre de tu negocio</span>
                <input type="text" maxlength="${TOPE_NOMBRE}" placeholder="Ej: ${esc(EJEMPLO_NOMBRE)}" value="${esc(leerNombre(prefijo))}" autocomplete="off" enterkeyhint="done">
                <small>Sale en toda la demo en vez del de ejemplo. Queda solo en este celular.</small>
            </label>
            <label class="boton boton--ancho colores__logo">
                <i class="ti ti-photo" aria-hidden="true"></i> Sacar los colores de tu logo
                <input type="file" accept="image/*" class="solo-lector">
            </label>
            <div class="colores__del-logo" hidden></div>
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
    const nombreAntes = leerNombre(prefijo);
    $(".colores__nombre input", hoja).addEventListener("input", (e) => mostrarNombre(guardarNombre(prefijo, e.target.value)));
    // El logo: se lee acá mismo, se aplica el primer color y se muestran los otros para elegir
    const delLogo = $(".colores__del-logo", hoja);
    $('input[type="file"]', hoja).addEventListener("change", async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = "";
        if (!archivo) return;
        try {
            const colores = await coloresDeLogo(archivo);
            if (!colores.length) {
                delLogo.hidden = false;
                delLogo.innerHTML = `<p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Tu logo es blanco y negro: elegí un color de la lista.</p>`;
                return;
            }
            delLogo.hidden = false;
            delLogo.innerHTML = `
                <p class="nota"><i class="ti ti-sparkles" aria-hidden="true"></i> Los colores de tu logo (la imagen no sale de tu celular):</p>
                <div class="colores__lista">${colores.map((hex, i) => `
                    <button type="button" class="colores__muestra" data-color="${esc(hex)}" style="--muestra: ${esc(hex)}" title="Color ${i + 1} de tu logo" aria-label="Color ${i + 1} de tu logo"></button>`).join("")}
                </div>`;
            $$("[data-color]", delLogo).forEach((b) => b.addEventListener("click", () => elegir(b.dataset.color)));
            elegir(colores[0]);
        } catch (err) {
            delLogo.hidden = false;
            delLogo.innerHTML = `<p class="formulario__error" role="alert"></p>`;
            delLogo.querySelector("p").textContent = err.message;
        }
    });
    hoja.addEventListener("close", () => {
        hoja.remove();
        // Cambió el nombre: se recarga (queda en la misma pantalla y con la misma persona) para que salga en todos lados
        if (leerNombre(prefijo) !== nombreAntes) location.reload();
    });
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
