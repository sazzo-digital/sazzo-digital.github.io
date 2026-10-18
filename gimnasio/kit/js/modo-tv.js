import { esc } from "./ui.js?v=c74ffc37fc";
import { mantenerPantallaPrendida } from "./celular.js?v=c74ffc37fc";

export const TOPES_TV = { minimoMs: 2000, maximoMs: 60000 };

let cerrarAnterior = null;

const horaDe = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

export function htmlBotonTV(texto = "Modo TV") {
    return `<button class="boton boton--secundario boton--chico boton-tv" type="button" data-modo-tv><i class="ti ti-device-tv"></i> ${esc(texto)}</button>`;
}

export function abrirModoTV({ titulo = "", icono = "ti-device-tv", armar, cadaMs = 5000, reloj = () => new Date(), alTocar = null } = {}) {
    if (typeof armar !== "function") throw new Error("Falta qué mostrar en la tele.");
    cerrarAnterior?.();
    const ms = Math.min(Math.max(Math.round(Number(cadaMs)) || 5000, TOPES_TV.minimoMs), TOPES_TV.maximoMs);
    const caja = document.createElement("div");
    caja.className = "modo-tv";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.setAttribute("aria-label", `Modo TV: ${titulo}`);
    caja.innerHTML = `
        <header class="modo-tv__cabeza">
            <b class="modo-tv__titulo"><i class="ti ${esc(icono)}" aria-hidden="true"></i>${esc(titulo)}</b>
            <span class="modo-tv__hora" data-tv-hora></span>
            <button class="modo-tv__salir" type="button" data-tv-salir aria-label="Salir del modo TV"><i class="ti ti-x"></i> Salir</button>
        </header>
        <div class="modo-tv__cuerpo" aria-live="polite" data-tv-cuerpo></div>
        <p class="modo-tv__pie">Para la tele del local: conectala a la compu o al celu y dejala así. Se actualiza sola.</p>`;
    document.body.append(caja);
    const cuerpo = caja.querySelector("[data-tv-cuerpo]");
    if (alTocar) cuerpo.addEventListener("click", (e) => alTocar(e));
    const hora = caja.querySelector("[data-tv-hora]");
    const pintar = () => {
        hora.textContent = horaDe(reloj());
        try {
            const html = armar();
            if (cuerpo.dataset.ultimo !== html) {
                cuerpo.dataset.ultimo = html;
                cuerpo.innerHTML = html;
            }
        } catch {
            cuerpo.innerHTML = `<p class="modo-tv__vacio">No se pudo actualizar. Probá salir y volver a entrar.</p>`;
        }
    };
    pintar();
    const intervalo = setInterval(pintar, ms);
    const alGuardar = () => pintar();
    addEventListener("storage", alGuardar);
    let entroPantallaCompleta = false;
    const cerrar = () => {
        if (!caja.isConnected) return;
        if (cerrarAnterior === cerrar) cerrarAnterior = null;
        clearInterval(intervalo);
        removeEventListener("storage", alGuardar);
        removeEventListener("keydown", alTeclear);
        removeEventListener("hashchange", cerrar);
        document.removeEventListener("fullscreenchange", alCambiarPantalla);
        if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => {});
        caja.remove();
    };
    const alTeclear = (e) => {
        if (e.key === "Escape") cerrar();
    };
    const alCambiarPantalla = () => {
        if (document.fullscreenElement) entroPantallaCompleta = true;
        else if (entroPantallaCompleta) cerrar();
    };
    cerrarAnterior = cerrar;
    addEventListener("keydown", alTeclear);
    addEventListener("hashchange", cerrar);
    document.addEventListener("fullscreenchange", alCambiarPantalla);
    caja.querySelector("[data-tv-salir]").addEventListener("click", cerrar);
    caja.querySelector("[data-tv-salir]").focus();
    try {
        caja.requestFullscreen?.()?.catch?.(() => {});
    } catch {
        entroPantallaCompleta = false;
    }
    mantenerPantallaPrendida();
    return { cerrar, pintar };
}
