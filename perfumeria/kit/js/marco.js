// ============================================
// El marco de la demo con alguien adentro: cabecera, banda de modo prueba, contenido, botones fijos de Sazzo y menú.
//   const contenido = pintarMarco(app, {
//       marca, usuario,                               → usuario: { nombre, apellido?, rol, rolTexto }
//       menu: [{ ruta: "/inicio", icono: "ti-home", texto: "Inicio" }, …],
//       alCambiarPersona,                             → vuelve a "Probala como…" (sin esto, no hay botón:
//                                                       demos de una sola persona)
//       alReiniciar                                   → "Empezar de cero" (ya confirmado)
//   });
// Después la demo muestra cada pantalla adentro de `contenido` con rutas.js → mostrarRuta.
// Botones fijos (barrita sobre el menú): "Probala con tus colores", "Ver otras demos" y "Quiero esto para mi negocio".
// La primera vez que se abre cada demo, un globito señala la paleta (colores.js → mostrarGlobitoColores).
// ============================================
import { $, esc, iniciales, nombreCompleto } from "./ui.js?v=b8dd88b783";
import { logoSazzo, nombreDemo } from "./marca.js?v=b8dd88b783";
import { interruptorTema, activarInterruptorTema } from "./apariencia.js?v=b8dd88b783";
import { linkOtrasDemos, linkQuieroEsto } from "./enlaces.js?v=b8dd88b783";
import { abrirColores, mostrarGlobitoColores } from "./colores.js?v=b8dd88b783";
import { contar } from "./visita.js?v=b8dd88b783";

/** La barrita de Sazzo: colores, otras demos y "Quiero esto" (los textos largos solo si hay lugar). */
export function htmlBarraSazzo(marca, opciones) {
    const quiero = linkQuieroEsto(marca, opciones);
    return `
        <div class="barra-sazzo" role="group" aria-label="Sazzo">
            <button class="barra-sazzo__colores" type="button" data-colores title="Probala con tus colores" aria-label="Probala con tus colores">
                <i class="ti ti-palette" aria-hidden="true"></i>
            </button>
            <a class="barra-sazzo__otras" href="${esc(linkOtrasDemos(opciones))}" data-otras-demos title="Ver otras demos">
                <i class="ti ti-layout-grid" aria-hidden="true"></i><span>Otras demos</span>
            </a>
            <a class="barra-sazzo__quiero" href="${esc(quiero.href)}" data-quiero-esto${quiero.externo ? ' target="_blank" rel="noopener"' : ""}>
                <i class="ti ti-brand-whatsapp" aria-hidden="true"></i><span>Quiero esto<span class="barra-sazzo__mas"> para mi negocio</span></span>
            </a>
        </div>`;
}

export function htmlMarco({ marca, usuario, menu = [], cambiarPersona = true }) {
    return `
        <button class="saltar" id="saltar" type="button">Saltar al contenido</button>
        <header class="cabecera">
            <div class="cabecera__lado">
                ${interruptorTema()}
            </div>
            <a class="cabecera__marca" href="#/inicio" title="Ir al inicio">${logoSazzo()}<span>${nombreDemo(marca)}${marca.lema ? `<small>${esc(marca.lema)}</small>` : ""}</span></a>
            <div class="cabecera__usuario">
                <span class="cabecera__cuenta">
                    <span class="cabecera__avatar" aria-hidden="true">${esc(iniciales(usuario))}</span>
                    <span class="cabecera__nombre">${esc(nombreCompleto(usuario))}<small>${esc(usuario.rolTexto ?? usuario.rol ?? "")}</small></span>
                </span>
                ${cambiarPersona ? `
                <button class="boton-icono" id="cambiar-persona" type="button" title="Cambiar de persona" aria-label="Cambiar de persona">
                    <i class="ti ti-switch-horizontal"></i>
                </button>` : ""}
            </div>
        </header>
        <p class="banda-prueba">
            <span><i class="ti ti-flask" aria-hidden="true"></i> Modo prueba: datos inventados<span class="banda-prueba__mas">, guardados solo en este navegador</span>.</span>
            <button class="boton-link" id="reiniciar" type="button">Empezar de cero</button>
        </p>
        <main id="contenido" class="contenido" tabindex="-1"></main>
        <footer class="pie-app"></footer>
        ${htmlBarraSazzo(marca)}
        ${menu.length ? `
        <nav class="menu" aria-label="Secciones">
            ${menu.map((i) => `
            <a href="#${esc(i.ruta)}" class="menu__item" data-ruta="${esc(i.ruta)}">
                <i class="ti ${esc(i.icono)}" aria-hidden="true"></i><span>${esc(i.texto)}</span>
            </a>`).join("")}
        </nav>` : ""}`;
}

/** Conecta los botones de Sazzo (barrita del marco o pie del ingreso) a la medición y a los colores. */
export function activarBotonesSazzo(raiz, marca) {
    $("[data-colores]", raiz)?.addEventListener("click", () => abrirColores(marca.prefijo, { alElegir: () => contar("colores", marca.id) }));
    $("[data-otras-demos]", raiz)?.addEventListener("click", () => contar("otras-demos", marca.id));
    $("[data-quiero-esto]", raiz)?.addEventListener("click", () => contar("quiero-esto", marca.id));
}

/** Dibuja el marco adentro de `app`, conecta sus botones y devuelve el lugar donde van las pantallas. */
export function pintarMarco(app, { marca, usuario, menu = [], alCambiarPersona, alReiniciar }) {
    // Sin a quién cambiar (comercio de una sola persona), no hay botón de cambiar de persona
    app.innerHTML = htmlMarco({ marca, usuario, menu, cambiarPersona: !!alCambiarPersona });
    app.classList.toggle("sin-menu", !menu.length);
    activarInterruptorTema();
    activarBotonesSazzo(app, marca);
    mostrarGlobitoColores(app, marca.prefijo);
    // Para quien usa teclado: el primer Tab ofrece saltar la cabecera e ir directo al contenido
    $("#saltar", app).addEventListener("click", () => $("#contenido", app).focus());
    $("#cambiar-persona", app)?.addEventListener("click", () => alCambiarPersona());
    $("#reiniciar", app).addEventListener("click", () => {
        if (!confirm("¿Volver a los datos de prueba del principio? Se pierde lo que cargaste.")) return;
        alReiniciar?.();
    });
    return $("#contenido", app);
}
