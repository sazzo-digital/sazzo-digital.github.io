// ============================================
// Dictar en vez de escribir (el mecánico con las manos sucias, la moza apurada):
//   `<textarea name="encontro">…</textarea> ${htmlBotonDictar("encontro")}`  y después  activarDictado(cont);
// Un toque empieza a escuchar en castellano, otro (o un silencio) termina, y lo dicho se suma al final del texto, sin
// pasarse del maxlength del campo. El botón aparece solo si el navegador sabe dictar (Chrome, Edge, Safari).
// Ojo: el reconocimiento de voz lo hace el navegador con su servicio (en Chrome, los servidores de Google): por eso
// arranca solo al tocar el botón, nunca solo, y el navegador pide permiso para el micrófono.
// ============================================
import { esc, aviso } from "./ui.js?v=66194d9fee";
import { alSalirDeLaPantalla } from "./rutas.js?v=66194d9fee";

const Reconocedor = () => (typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null);

export const puedeDictar = () => Boolean(Reconocedor());

/** El botón de dictar para el campo `name` (vacío si el navegador no sabe dictar). */
export function htmlBotonDictar(campo, etiqueta = "Dictar") {
    if (!puedeDictar() || !/^[a-z][a-z0-9-]{0,30}$/i.test(String(campo))) return "";
    return `<button class="boton boton--chico boton--secundario dictar" type="button" data-dictar="${esc(campo)}" aria-pressed="false"><i class="ti ti-microphone" aria-hidden="true"></i> <span>${esc(etiqueta)}</span></button>`;
}

/** Lo dictado, sumado al texto que ya había (con un espacio) y cortado al largo máximo del campo. */
export function sumarDictado(antes, dicho, maximo = 1000) {
    const nuevo = String(dicho ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
    if (!nuevo) return String(antes ?? "");
    const base = String(antes ?? "").trimEnd();
    const mayuscula = !base || /[.!?]$/.test(base); // al principio o después de un punto, con mayúscula
    const primera = mayuscula ? nuevo.charAt(0).toUpperCase() : nuevo.charAt(0).toLowerCase();
    const junto = `${base ? `${base} ` : ""}${primera}${nuevo.slice(1)}`;
    return junto.slice(0, Math.max(0, maximo));
}

let escuchando = null; // uno solo a la vez

/** Hace andar los botones de dictar de `raiz`: cada uno escribe en el campo [name=…] de su mismo formulario. */
export function activarDictado(raiz) {
    const R = Reconocedor();
    if (!R) return;
    raiz.querySelectorAll("[data-dictar]").forEach((boton) => {
        const campo = (boton.closest("form") ?? raiz).querySelector(`[name="${CSS.escape(boton.dataset.dictar)}"]`);
        if (!campo || campo.disabled) {
            boton.hidden = true;
            return;
        }
        const texto = boton.querySelector("span");
        const etiqueta = texto?.textContent ?? "Dictar";
        const prender = (si) => {
            boton.setAttribute("aria-pressed", String(si));
            boton.classList.toggle("dictar--escuchando", si);
            if (texto) texto.textContent = si ? "Escuchando… (tocá para terminar)" : etiqueta;
        };
        boton.addEventListener("click", () => {
            if (escuchando) {
                escuchando.stop();
                return;
            }
            const r = new R();
            r.lang = "es-AR";
            r.interimResults = false;
            r.continuous = false;
            r.maxAlternatives = 1;
            r.onresult = (e) => {
                const dicho = [...e.results].map((x) => x[0]?.transcript ?? "").join(" ");
                campo.value = sumarDictado(campo.value, dicho, campo.maxLength > 0 ? campo.maxLength : 1000);
                campo.dispatchEvent(new Event("input", { bubbles: true }));
            };
            r.onerror = (e) => {
                if (e.error === "not-allowed" || e.error === "service-not-allowed") aviso("Para dictar, dejá que el navegador use el micrófono.", "error");
                else if (e.error === "no-speech") aviso("No se escuchó nada. Probá de nuevo, más cerca.", "info");
                else if (e.error !== "aborted") aviso("No se pudo dictar ahora. Escribilo a mano.", "error");
            };
            r.onend = () => {
                escuchando = null;
                prender(false);
            };
            try {
                r.start();
                escuchando = r;
                prender(true);
                alSalirDeLaPantalla(() => escuchando?.abort());
            } catch {
                escuchando = null;
                aviso("No se pudo dictar ahora. Escribilo a mano.", "error");
            }
        });
    });
}
