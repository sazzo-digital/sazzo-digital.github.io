import { esc, aviso } from "./ui.js?v=8f333cfcf6";

let pedidoDeInstalar = null;
let nombreApp = "la demo";

export const yaInstalada = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

const hayManifest = () => Boolean(document.querySelector('link[rel="manifest"]')) && "serviceWorker" in navigator;

export const sePuedeInstalar = () => hayManifest() && !yaInstalada();

export const htmlBotonInstalar = (clase = "boton boton--secundario boton--ancho") =>
    `<button class="${esc(clase)}" type="button" data-instalar${sePuedeInstalar() ? "" : " hidden"}><i class="ti ti-download" aria-hidden="true"></i><span>Descargar demo</span></button>`;

export const htmlBotonInstalarCabecera = () =>
    `<button class="boton-icono cabecera__instalar" type="button" data-instalar title="Descargar demo" aria-label="Descargar demo"${sePuedeInstalar() ? "" : " hidden"}><i class="ti ti-download" aria-hidden="true"></i></button>`;

export function pasosParaInstalar({ agente = "", plataforma = "", toques = 0, chrome = false, brave = false, nombre = "la demo" } = {}) {
    const iphone = /iPad|iPhone|iPod/.test(agente) || (plataforma === "MacIntel" && toques > 1);
    if (/WhatsApp|Instagram|FBAN|FBAV|FB_IAB|; wv\)/.test(agente)) {
        return [
            "Estás viéndola adentro de otra app (WhatsApp, Instagram…), y desde ahí no se puede instalar.",
            iphone ? 'Tocá los tres puntos o el ícono de compartir y elegí "Abrir en Safari".' : 'Tocá los tres puntos (⋮) de arriba a la derecha y elegí "Abrir en Chrome".',
            'Ya en el navegador, tocá de nuevo "Descargar demo".'
        ];
    }
    if (iphone) {
        return [
            "Abrila con Safari (en otros navegadores del iPhone puede no aparecer la opción).",
            "Tocá Compartir: el cuadrado con la flecha para arriba.",
            'Bajá y tocá "Agregar a inicio" y después "Agregar".'
        ];
    }
    if (/Android/.test(agente)) {
        return [
            "Abrila con Chrome. Si es la primera vez, recargá la página y tocá de nuevo: casi siempre ahí ya instala directo.",
            "Si no, tocá los tres puntos (⋮) de arriba a la derecha.",
            'Tocá "Instalar app" o "Agregar a la pantalla principal" y confirmá.',
            `Si no aparece ninguna de las dos, puede que ya esté instalada: buscá ${nombre} entre tus apps.`
        ];
    }
    return [
        ...(chrome ? [] : ["Abrila con Chrome, Edge o Brave (Firefox y Safari de la compu no instalan apps)."]),
        "Si es la primera vez: recargá la página (Ctrl + Shift + R) y tocá de nuevo. Casi siempre ahí ya instala directo.",
        "En la barra de la dirección, a la derecha, tocá el ícono de instalar (una pantallita con una flecha).",
        `Si no está: menú ${brave ? "de Brave (las tres rayitas" : "del navegador (los tres puntos"}, arriba a la derecha) → "Transmitir, guardar y compartir" → "Instalar página como aplicación…" → "Instalar".`,
        `Si esa opción no aparece, puede que ya esté instalada: buscá ${nombre} en el menú Inicio.`
    ];
}

export function mostrarComoInstalar() {
    document.querySelector("dialog.instalar")?.remove();
    const pasos = pasosParaInstalar({
        agente: navigator.userAgent,
        plataforma: navigator.platform,
        toques: navigator.maxTouchPoints,
        chrome: Boolean(window.chrome),
        brave: Boolean(navigator.brave),
        nombre: nombreApp
    });
    const hoja = document.createElement("dialog");
    hoja.className = "hoja instalar";
    hoja.setAttribute("aria-labelledby", "instalar-titulo");
    hoja.innerHTML = `
        <form method="dialog" class="hoja__caja">
            <div class="hoja__titulos">
                <h2 id="instalar-titulo">Instalá ${esc(nombreApp)}</h2>
                <button class="boton-icono" value="cerrar" aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            <p>Queda con su ícono en tu celu, como cualquier app, y la probás cuando quieras. Sigue en modo prueba: lo que cargues queda solo en tu equipo.</p>
            <ol class="instalar__pasos">${pasos.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
            <button class="boton boton--ancho" value="cerrar">Entendido</button>
        </form>`;
    document.body.append(hoja);
    hoja.addEventListener("close", () => hoja.remove());
    hoja.addEventListener("click", (e) => {
        if (e.target === hoja) hoja.close();
    });
    hoja.showModal();
    return hoja;
}

async function instalar() {
    if (!pedidoDeInstalar) return mostrarComoInstalar();
    const pedido = pedidoDeInstalar;
    pedidoDeInstalar = null;
    pedido.prompt();
    await pedido.userChoice;
}

export function prepararInstalar(nombre) {
    nombreApp = nombre || nombreApp;
    if (!hayManifest()) return;
    if (new URLSearchParams(location.search).get("pwa") !== "0") {
        navigator.serviceWorker.register("sw.js").catch((e) => console.warn("No se pudo preparar la demo para instalar:", e));
    }
    addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        pedidoDeInstalar = e;
    });
    addEventListener("appinstalled", () => {
        pedidoDeInstalar = null;
        document.querySelectorAll("[data-instalar]").forEach((b) => (b.hidden = true));
        aviso(`Listo: ${nombreApp} quedó instalada. Ya la podés abrir desde su ícono.`);
    });
    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-instalar]")) instalar();
    });
}
