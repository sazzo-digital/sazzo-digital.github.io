// ============================================
// "Acerca de": qué es la demo y que la hizo Sazzo.
// - Sin nadie adentro (pantalla de ingreso): un link discreto al pie que se despliega ahí mismo (pieAcerca).
// - Con alguien adentro: la pantalla entera (vistaAcerca), desde el menú o la cabecera de la demo.
// Nada de datos personales: firma Sazzo. El contacto ("Quiero esto para mi negocio") llega en el paso 2.
// ============================================
import { esc } from "./ui.js?v=762e55522a";
import { logoSazzo, nombreDemo } from "./marca.js?v=762e55522a";

const AVISO_DEMO =
    "Es una demo: los datos son inventados y quedan guardados solo en este navegador. No te pedimos ningún dato. La versión real se arma a medida de cada negocio.";

/** Qué es la demo y quién la hizo (lo usan el pie del ingreso y la pantalla Acerca de). */
export const textoAcerca = (marca) => `
    ${marca.descripcion ? `<p class="acerca__texto">${esc(marca.descripcion)}</p>` : ""}
    <p class="acerca__texto">${esc(AVISO_DEMO)}</p>
    <p class="acerca__autor">Hecho por <strong>Sazzo</strong> · Tu mundo digital, en orden.</p>
    ${versionDemo() ? `<p class="acerca__version">Versión ${esc(versionDemo())}</p>` : ""}`;

export const versionDemo = () => document.querySelector('meta[name="version"]')?.content ?? "";

/** Pie de la pantalla de ingreso: "Acerca de Sazzo Kiosco", que se despliega ahí mismo. */
export const pieAcerca = (marca) => `
    <footer class="pie-app">
        <details class="acerca">
            <summary class="acerca__boton"><i class="ti ti-info-circle" aria-hidden="true"></i> Acerca de ${esc(marca.nombre)}</summary>
            <div class="acerca__globo">
                <span class="acerca__app">${nombreDemo(marca)}</span>
                ${textoAcerca(marca)}
            </div>
        </details>
    </footer>`;

/** Pantalla Acerca de (con alguien adentro). volver: [ruta, texto] del link de arriba. */
export function vistaAcerca(cont, { marca, volver = ["#/inicio", "Inicio"] }) {
    cont.innerHTML = `
        <a class="volver" href="${esc(volver[0])}"><i class="ti ti-arrow-left"></i> ${esc(volver[1])}</a>
        <section class="bloque acerca-pagina">
            <div class="acerca-pagina__marca">
                ${logoSazzo("logo logo--grande")}
                <h1>${nombreDemo(marca)}</h1>
                ${marca.lema ? `<p class="lema">${esc(marca.lema)}</p>` : ""}
            </div>
            ${textoAcerca(marca)}
        </section>`;
}

// El globito del pie se cierra tocando afuera o con Escape (se conecta una sola vez, al cargar el kit)
document.addEventListener("click", (e) => {
    for (const d of document.querySelectorAll("details.acerca[open]")) if (!d.contains(e.target)) d.open = false;
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll("details.acerca[open]").forEach((d) => (d.open = false));
});
