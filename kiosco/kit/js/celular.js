// ============================================
// Funciones del celular que ya vienen en el navegador (sin instalar nada, sin service worker):
//   mantenerPantallaPrendida()      → que la pantalla no se apague mientras se usa ésta (cocina, caja, grilla)
//   compartir({ titulo, texto })    → el menú de compartir del celular (WhatsApp, mail…); false si no hay
//   copiar(texto)                   → al portapapeles; false si el navegador no deja
//   htmlCopiable(texto, etiqueta) + activarCopiables(raiz) → un dato (alias, CBU) que se copia con un toque
//   vibrar(ms)                      → vibración cortita (Android; en iPhone no hace nada)
//   ding(prefijo)                   → un "ding" hecho por código, SOLO si en esa demo se prendió el sonido
//   htmlBotonSonido(prefijo) + activarBotonSonido(raiz, prefijo) → el botón para prenderlo (apagado de entrada)
//   decir(prefijo, texto)           → lo lee en voz alta, SOLO si en esa demo se prendió la voz y con una voz en
//                                     castellano instalada en el celular (el texto no sale a ningún lado)
//   htmlBotonVoz(prefijo) + activarBotonVoz(raiz, prefijo) → el botón para prenderla (apagada de entrada)
// Lo que queda prendido (la pantalla, la cámara) se suelta solo al cambiar de pantalla (rutas.js →
// alSalirDeLaPantalla). Nada de esto manda datos a ningún lado.
// ============================================
import { esc, aviso } from "./ui.js?v=66194d9fee";
import { alSalirDeLaPantalla } from "./rutas.js?v=66194d9fee";

// ---------- Pantalla siempre prendida (Wake Lock) ----------
let candado = null;
let quierePrendida = false;
let escuchando = false;

async function pedirCandado() {
    try {
        candado = await navigator.wakeLock.request("screen");
        candado.addEventListener?.("release", () => (candado = null));
    } catch {
        candado = null; // sin batería, sin permiso o pestaña escondida: no pasa nada
    }
}

/** Mientras se usa esta pantalla, el celular no se apaga solo. Al salir de la pantalla se suelta. */
export function mantenerPantallaPrendida() {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false;
    if (quierePrendida) return true; // la misma pantalla redibujada: ya está pedido
    quierePrendida = true;
    if (!escuchando) {
        escuchando = true;
        // Al volver a la pestaña el navegador suelta el candado: se vuelve a pedir
        document.addEventListener("visibilitychange", () => {
            if (quierePrendida && document.visibilityState === "visible" && !candado) pedirCandado();
        });
    }
    pedirCandado();
    alSalirDeLaPantalla(() => {
        quierePrendida = false;
        candado?.release?.().catch?.(() => {});
        candado = null;
    });
    return true;
}

// ---------- Compartir, copiar y vibrar ----------
export const puedeCompartir = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** Abre el menú de compartir del celular. true si se compartió (o la persona lo cerró), false si no hay menú. */
export async function compartir({ titulo = "", texto }) {
    if (!puedeCompartir()) return false;
    try {
        await navigator.share({ title: String(titulo).slice(0, 100), text: String(texto ?? "").slice(0, 2000) });
        return true;
    } catch (e) {
        return e?.name === "AbortError"; // cerró el menú sin elegir: no es un error
    }
}

/** Copia al portapapeles. false si el navegador no deja (sin permiso o sin https). */
export async function copiar(texto) {
    try {
        await navigator.clipboard.writeText(String(texto ?? ""));
        return true;
    } catch {
        return false;
    }
}

/** Un dato que se copia con un toque: <button class="copiable">alias.del.negocio <ícono></button>. */
export function htmlCopiable(texto, etiqueta = "Copiar") {
    return `<button class="copiable" type="button" data-copiable="${esc(texto)}" title="${esc(etiqueta)}" aria-label="${esc(etiqueta)}: ${esc(texto)}"><span>${esc(texto)}</span><i class="ti ti-copy" aria-hidden="true"></i></button>`;
}

export function activarCopiables(raiz, mensaje = "Copiado") {
    raiz.querySelectorAll("[data-copiable]").forEach((b) =>
        b.addEventListener("click", async () => {
            if (await copiar(b.dataset.copiable)) {
                aviso(mensaje);
                vibrar();
            } else aviso("No se pudo copiar: seleccionalo y copialo a mano.", "info");
        })
    );
}

export function vibrar(ms = 30) {
    if (navigator.userActivation?.hasBeenActive === false) return; // sin un toque antes, el navegador no deja
    try {
        navigator.vibrate?.(ms);
    } catch {
        // sin vibración: no pasa nada
    }
}

// ---------- Sonido (apagado de entrada; se recuerda por demo: "<prefijo>-sonido") ----------
const claveSonido = (prefijo) => `${prefijo}-sonido`;

export function sonidoPrendido(prefijo) {
    try {
        return localStorage.getItem(claveSonido(prefijo)) === "1";
    } catch {
        return false;
    }
}

export function prenderSonido(prefijo, prendido) {
    try {
        if (prendido) localStorage.setItem(claveSonido(prefijo), "1");
        else localStorage.removeItem(claveSonido(prefijo));
    } catch {
        // sin almacenamiento: dura hasta recargar (no se recuerda)
    }
}

let audio = null;

/** "Ding" de dos notas, hecho por código (sin archivos). Solo suena si el sonido de esa demo está prendido. */
export function ding(prefijo, { siempre = false } = {}) {
    if (!siempre && !sonidoPrendido(prefijo)) return false;
    try {
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        const t = audio.currentTime + 0.01;
        for (const [frecuencia, desde] of [[1318.5, 0], [1760, 0.09]]) {
            const nota = audio.createOscillator();
            const volumen = audio.createGain();
            nota.type = "sine";
            nota.frequency.value = frecuencia;
            volumen.gain.setValueAtTime(0.0001, t + desde);
            volumen.gain.exponentialRampToValueAtTime(0.22, t + desde + 0.015);
            volumen.gain.exponentialRampToValueAtTime(0.0001, t + desde + 0.4);
            nota.connect(volumen).connect(audio.destination);
            nota.start(t + desde);
            nota.stop(t + desde + 0.45);
        }
        return true;
    } catch {
        return false; // sin audio: no pasa nada
    }
}

export function htmlBotonSonido(prefijo) {
    const prendido = sonidoPrendido(prefijo);
    return `<button class="boton-icono boton-sonido" type="button" data-sonido aria-pressed="${prendido}" title="${prendido ? "Sonido prendido" : "Sonido apagado"}" aria-label="Sonido al cobrar"><i class="ti ${prendido ? "ti-volume" : "ti-volume-off"}" aria-hidden="true"></i></button>`;
}

export function activarBotonSonido(raiz, prefijo) {
    raiz.querySelectorAll("[data-sonido]").forEach((b) =>
        b.addEventListener("click", () => {
            const prendido = !sonidoPrendido(prefijo);
            prenderSonido(prefijo, prendido);
            b.setAttribute("aria-pressed", String(prendido));
            b.title = prendido ? "Sonido prendido" : "Sonido apagado";
            b.querySelector(".ti").className = `ti ${prendido ? "ti-volume" : "ti-volume-off"}`;
            if (prendido) ding(prefijo, { siempre: true }); // para que se escuche cómo suena
            aviso(prendido ? "Sonido prendido: suena al cobrar." : "Sonido apagado.", "info");
        })
    );
}

// ---------- Leer en voz alta (apagada de entrada; se recuerda por demo: "<prefijo>-voz") ----------
// Solo con una voz en castellano INSTALADA en el celular (localService): las voces "de red" de algunos navegadores
// mandan el texto a un servidor, y en las demos nada sale del celular.
const claveVoz = (prefijo) => `${prefijo}-voz`;
export const puedeHablar = () => typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";

export function vozPrendida(prefijo) {
    try {
        return localStorage.getItem(claveVoz(prefijo)) === "1";
    } catch {
        return false;
    }
}

export function prenderVoz(prefijo, prendida) {
    try {
        if (prendida) localStorage.setItem(claveVoz(prefijo), "1");
        else localStorage.removeItem(claveVoz(prefijo));
    } catch {
        // sin almacenamiento: no se recuerda
    }
}

/** La voz en castellano del celular (instalada, no de red); null si no hay. */
export function vozLocal() {
    if (!puedeHablar()) return null;
    const voces = speechSynthesis.getVoices().filter((v) => v.localService && /^es\b|^es-/i.test(v.lang));
    return voces.find((v) => /AR/i.test(v.lang)) ?? voces.find((v) => /419|MX|US/i.test(v.lang)) ?? voces[0] ?? null;
}

/** Lee el texto en voz alta (máx. 300 letras). false si la voz de esa demo está apagada o no hay voz instalada. */
export function decir(prefijo, texto, { siempre = false } = {}) {
    if (!siempre && !vozPrendida(prefijo)) return false;
    const voz = vozLocal();
    if (!voz) return false;
    const frase = new SpeechSynthesisUtterance(String(texto ?? "").slice(0, 300));
    frase.voice = voz;
    frase.lang = voz.lang;
    speechSynthesis.speak(frase);
    return true;
}

export function htmlBotonVoz(prefijo, etiqueta = "Leer en voz alta") {
    if (!puedeHablar()) return "";
    const prendida = vozPrendida(prefijo);
    return `<button class="boton-icono boton-sonido" type="button" data-voz aria-pressed="${prendida}" title="${esc(etiqueta)}: ${prendida ? "prendido" : "apagado"}" aria-label="${esc(etiqueta)}"><i class="ti ti-speakerphone" aria-hidden="true"></i></button>`;
}

export function activarBotonVoz(raiz, prefijo, { alPrender } = {}) {
    raiz.querySelectorAll("[data-voz]").forEach((b) =>
        b.addEventListener("click", () => {
            const prendida = !vozPrendida(prefijo);
            if (prendida && !vozLocal()) {
                aviso("Este celular no tiene una voz en castellano instalada: se puede bajar en los ajustes de voz.", "info");
                return;
            }
            prenderVoz(prefijo, prendida);
            b.setAttribute("aria-pressed", String(prendida));
            if (prendida) {
                decir(prefijo, "Listo. Voy a leer los pedidos nuevos.", { siempre: true });
                alPrender?.();
            } else if (puedeHablar()) speechSynthesis.cancel();
            aviso(prendida ? "Voz prendida: lee los pedidos nuevos." : "Voz apagada.", "info");
        })
    );
}

// Las voces se cargan un instante después de abrir la página: se piden una vez para que estén listas
if (puedeHablar()) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener?.("voiceschanged", () => speechSynthesis.getVoices());
}
