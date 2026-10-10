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
// En la compu (desde 1000 px) el menú va al costado y la barrita de Sazzo sube a la cabecera; en celulares chicos la
// barrita se esconde al bajar la pantalla y vuelve al subir (así queda más lugar para la demo).
// Festejo: cuando aparece una confirmación (.hecho: turno reservado, venta cobrada, orden creada…), el ✓ entra con un
// rebote, salen chispitas del color de la demo y el celular vibra cortito (Android). Quieto con "reducir movimiento".
// ============================================
import { $, esc, iniciales, nombreCompleto } from "./ui.js?v=114958267d";
import { logoSazzo, nombreDemo } from "./marca.js?v=114958267d";
import { interruptorTema, activarInterruptorTema } from "./apariencia.js?v=114958267d";
import { linkOtrasDemos, linkQuieroEsto } from "./enlaces.js?v=114958267d";
import { abrirColores, mostrarGlobitoColores, leerNombre } from "./colores.js?v=114958267d";
import { contar } from "./visita.js?v=114958267d";
import { pintarAvisos } from "./avisos.js?v=114958267d";

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

/** Debajo del nombre de la demo: el nombre que escribió el dueño ("Probala con tu nombre") o, si no, el lema. */
function htmlNombreNegocio(marca) {
    const texto = leerNombre(marca.prefijo) || marca.lema || "";
    return `<small data-nombre-negocio data-lema="${esc(marca.lema ?? "")}"${texto ? "" : " hidden"}>${esc(texto)}</small>`;
}

export function htmlMarco({ marca, usuario, menu = [], cambiarPersona = true }) {
    return `
        <button class="saltar" id="saltar" type="button">Saltar al contenido</button>
        <header class="cabecera">
            <div class="cabecera__lado">
                ${interruptorTema()}
            </div>
            <a class="cabecera__marca" href="#/inicio" title="Ir al inicio">${logoSazzo()}<span>${nombreDemo(marca)}${htmlNombreNegocio(marca)}</span></a>
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

const ESCRITORIO = "(min-width: 1000px)"; // igual que $escritorio en los estilos
const ubicados = new WeakSet();
const escuchasDelAncho = []; // guardadas: algún navegador podría soltar una escucha que nadie retiene

/** La barrita de Sazzo (y su globito): en la compu, en la cabecera al lado del tema; en el celular, abajo. */
export function ubicarBarraSazzo(app) {
    const barra = $(".barra-sazzo", app);
    const cabecera = $(".cabecera__lado", app);
    if (!barra || !cabecera) return;
    const globito = $(".globito-colores", app);
    if (matchMedia(ESCRITORIO).matches) {
        cabecera.append(...[globito, barra].filter(Boolean));
    } else if (barra.parentElement === cabecera) {
        const pie = $(".pie-app", app);
        pie.after(...[globito, barra].filter(Boolean));
    }
}

function seguirElAncho(app) {
    if (ubicados.has(app)) return;
    ubicados.add(app);
    const ancho = matchMedia(ESCRITORIO);
    ancho.addEventListener?.("change", () => ubicarBarraSazzo(app));
    escuchasDelAncho.push(ancho);
}

// En celulares chicos: al bajar la pantalla se esconde la barrita; al subir, arriba de todo o al llegar al final (donde
// conviene "Quiero esto") vuelve
let escuchandoScroll = false;
function esconderBarraAlBajar() {
    if (escuchandoScroll) return;
    escuchandoScroll = true;
    let antes = scrollY;
    addEventListener("scroll", () => {
        const ahora = scrollY;
        const alFinal = innerHeight + ahora >= document.documentElement.scrollHeight - 60;
        if (Math.abs(ahora - antes) < 8 && !alFinal) return;
        document.body.classList.toggle("barra-escondida", ahora > antes && ahora > 80 && !alFinal);
        antes = ahora;
    }, { passive: true });
}

// ---------- Listas: lo nuevo o lo que cambió se ilumina un instante (sin tocar las demos) ----------
// Las pantallas se redibujan enteras; para saber qué es nuevo se compara cada renglón (<li>) por su texto con el de
// la vez anterior en la MISMA pantalla. Al llegar a otra pantalla no se ilumina nada (ahí entra todo con su animación),
// y si cambió más de la mitad (un filtro, otro día) tampoco: no tendría sentido.
const conListas = new WeakSet();
let renglonesAntes = { ruta: null, textos: new Set() };
const textoDe = (li) => li.textContent.replace(/\s+/g, " ").trim().slice(0, 160);

function revisarListas(app) {
    const contenido = $("#contenido", app);
    if (!contenido || contenido.querySelector(".esqueleto")) return;
    const ruta = location.hash.split("?")[0];
    const renglones = [...contenido.querySelectorAll("li")];
    const textos = new Set(renglones.map(textoDe));
    if (ruta === renglonesAntes.ruta && renglones.length) {
        const nuevos = renglones.filter((li) => !renglonesAntes.textos.has(textoDe(li)));
        if (nuevos.length && nuevos.length <= Math.max(2, renglones.length / 2)) nuevos.slice(0, 6).forEach((li) => li.classList.add("cambio"));
    }
    renglonesAntes = { ruta, textos };
}

export function iluminarCambiosDeListas(app) {
    if (conListas.has(app) || typeof MutationObserver === "undefined") return;
    conListas.add(app);
    let pendiente = false;
    new MutationObserver(() => {
        if (pendiente) return;
        pendiente = true;
        queueMicrotask(() => {
            pendiente = false;
            revisarListas(app);
        });
    }).observe(app, { childList: true, subtree: true });
}

const conFestejo = new WeakSet(); // el marco se vuelve a dibujar en cada cambio de persona: se escucha una sola vez

/** Escucha cuándo aparece una confirmación (.hecho) adentro de `raiz` y la festeja. */
export function festejarConfirmaciones(raiz) {
    if (conFestejo.has(raiz) || typeof MutationObserver === "undefined") return;
    conFestejo.add(raiz);
    new MutationObserver((cambios) => {
        for (const cambio of cambios) {
            for (const n of cambio.addedNodes) {
                if (n.nodeType !== 1) continue;
                const hecho = n.matches(".hecho:not(.hecho--chico)") ? n : n.querySelector(".hecho:not(.hecho--chico)");
                if (hecho) festejar(hecho);
            }
        }
    }).observe(raiz, { childList: true, subtree: true });
}

/** Chispitas del acento alrededor del ✓ y una vibración cortita. Una vez por confirmación. */
export function festejar(hecho) {
    if (hecho.dataset.festejado) return false;
    hecho.dataset.festejado = "1";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    const icono = hecho.querySelector(":scope > .ti");
    if (icono) {
        const chispas = document.createElement("span");
        chispas.className = "festejo";
        chispas.setAttribute("aria-hidden", "true");
        chispas.innerHTML = Array.from({ length: 10 }, (_, i) => `<span style="--i:${i}"></span>`).join("");
        icono.append(chispas);
        setTimeout(() => chispas.remove(), 1300);
    }
    try {
        if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(35);
    } catch {
        // sin vibración: no pasa nada
    }
    return true;
}

// Avisos entre roles (kit/avisos.js): los del marco que está a la vista; se vuelven a mirar después de cada pantalla
let avisosDelMarco = null;
if (typeof document !== "undefined") {
    document.addEventListener("sazzo:pantalla", () => {
        if (avisosDelMarco?.app.isConnected) pintarAvisos(avisosDelMarco.app, avisosDelMarco);
    });
}

/**
 * Dibuja el marco adentro de `app`, conecta sus botones y devuelve el lugar donde van las pantallas.
 * `avisos` (opcional): () => los hechos de la demo para los avisos entre roles (kit/avisos.js).
 */
export function pintarMarco(app, { marca, usuario, menu = [], alCambiarPersona, alReiniciar, avisos }) {
    avisosDelMarco = typeof avisos === "function" ? { app, prefijo: marca.prefijo, usuario, avisos } : null;
    // Sin a quién cambiar (comercio de una sola persona), no hay botón de cambiar de persona
    app.innerHTML = htmlMarco({ marca, usuario, menu, cambiarPersona: !!alCambiarPersona });
    app.classList.toggle("sin-menu", !menu.length);
    activarInterruptorTema();
    activarBotonesSazzo(app, marca);
    mostrarGlobitoColores(app, marca.prefijo);
    ubicarBarraSazzo(app);
    seguirElAncho(app);
    esconderBarraAlBajar();
    document.body.classList.remove("barra-escondida");
    festejarConfirmaciones(app);
    iluminarCambiosDeListas(app);
    // Para quien usa teclado: el primer Tab ofrece saltar la cabecera e ir directo al contenido
    $("#saltar", app).addEventListener("click", () => $("#contenido", app).focus());
    $("#cambiar-persona", app)?.addEventListener("click", () => alCambiarPersona());
    $("#reiniciar", app).addEventListener("click", () => {
        if (!confirm("¿Volver a los datos de prueba del principio? Se pierde lo que cargaste.")) return;
        alReiniciar?.();
    });
    return $("#contenido", app);
}
