// ============================================
// Aviso "abrila en el navegador": si la demo se abrió desde adentro de Instagram, WhatsApp o Facebook, lo que se
// carga queda guardado ahí aparte (y se puede perder). Se avisa una vez por visita, con "Copiar link" y "Seguir acá".
// ============================================
import { $, esc, aviso, esNavegadorDeOtraApp } from "./ui.js?v=f44d3e59f3";

const CLAVE_VISTO = "sazzo-aviso-navegador"; // solo en esta pestaña (sessionStorage): vuelve a aparecer otra visita

/** De qué app viene (para el texto), o null si es un navegador común. */
export function appDeAdentro(agente = navigator.userAgent) {
    if (!esNavegadorDeOtraApp(agente)) return null;
    if (/Instagram/.test(agente)) return "Instagram";
    if (/FBAN|FBAV|FB_IAB/.test(agente)) return "Facebook";
    if (/WhatsApp/.test(agente)) return "WhatsApp";
    return "otra app";
}

export function textoAvisoNavegador(agente = navigator.userAgent) {
    const app = appDeAdentro(agente);
    if (!app) return null;
    const esIphone = /iPhone|iPad|iPod/.test(agente);
    const navegador = esIphone ? "Safari" : "Chrome";
    return `Estás viendo la demo adentro de ${app}: lo que cargues queda guardado acá aparte. Para probarla mejor, abrila en ${navegador} (tocá los tres puntitos y "Abrir en el navegador") o copiá el link.`;
}

/** Muestra el aviso arriba de todo si hace falta. Devuelve el cartel (o null si no corresponde). */
export function avisarSiEsNavegadorDeOtraApp(agente = navigator.userAgent) {
    const texto = textoAvisoNavegador(agente);
    if (!texto) return null;
    try {
        if (sessionStorage.getItem(CLAVE_VISTO)) return null;
    } catch {
        // sin almacenamiento: se muestra igual
    }
    $(".aviso-navegador")?.remove();
    const cartel = document.createElement("aside");
    cartel.className = "aviso-navegador";
    cartel.setAttribute("role", "alert");
    cartel.innerHTML = `
        <i class="ti ti-external-link" aria-hidden="true"></i>
        <p>${esc(texto)}</p>
        <div class="aviso-navegador__botones">
            <button class="boton boton--chico" type="button" data-copiar><i class="ti ti-copy"></i> Copiar link</button>
            <button class="boton-link" type="button" data-seguir>Seguir acá</button>
        </div>`;
    const cerrar = () => {
        try {
            sessionStorage.setItem(CLAVE_VISTO, "1");
        } catch {
            // no se recuerda: no pasa nada
        }
        cartel.remove();
    };
    $("[data-copiar]", cartel).addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(location.href.split("#")[0]);
            aviso("Link copiado: pegalo en Chrome o Safari.");
            cerrar();
        } catch {
            aviso("No se pudo copiar: tocá los tres puntitos y \"Abrir en el navegador\".", "info");
        }
    });
    $("[data-seguir]", cartel).addEventListener("click", cerrar);
    document.body.prepend(cartel);
    return cartel;
}
