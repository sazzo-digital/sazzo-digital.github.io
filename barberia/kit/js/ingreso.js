// ============================================
// Pantalla de ingreso: "Probala como…" con un botón por persona (los roles reales del rubro).
// Sin mail ni contraseña: las demos no tienen cuentas (modo prueba).
// La demo pasa su lista de personas:
//   [{ id: "u-laura", nombre: "Laura", apellido: "Paz", etiqueta: "Laura · Dueña", detalle: "Ve la caja…", empezar: true }, …]
// `empezar: true` marca la persona por la que conviene arrancar (va primera, con "Empezá por acá"), y si la marca
// trae `wow`, esa línea va arriba de las personas: le dice a quien llega de Instagram qué va a pasar.
// y qué hacer al elegir una (alElegir(id): guardar la sesión y arrancar la demo).
// ============================================
import { $, $$, esc, iniciales, mensajeDe } from "./ui.js?v=2b683c2ec9";
import { logoSazzo, nombreDemo } from "./marca.js?v=2b683c2ec9";
import { pieAcerca } from "./acerca.js?v=2b683c2ec9";
import { linkOtrasDemos, linkQuieroEsto } from "./enlaces.js?v=2b683c2ec9";
import { activarBotonesSazzo } from "./marco.js?v=2b683c2ec9";
import { contar, contarPantalla } from "./visita.js?v=2b683c2ec9";
import { soltarPantalla } from "./rutas.js?v=2b683c2ec9";

/** La pantalla entera va en <main>: los lectores de pantalla saltan directo ahí (axe: landmark-one-main). */
export function htmlIngreso({ marca, personas }) {
    const quiero = linkQuieroEsto(marca);
    // La de "Empezá por acá" primero (si hay varias marcadas, cuenta la primera)
    const recomendada = personas.find((p) => p.empezar);
    const enOrden = recomendada ? [recomendada, ...personas.filter((p) => p !== recomendada)] : personas;
    return `
        <main class="ingreso">
            <div class="ingreso__marca">
                ${logoSazzo("logo logo--grande")}
                <h1>${nombreDemo(marca)}</h1>
                ${marca.lema ? `<p class="lema">${esc(marca.lema)}</p>` : ""}
            </div>
            <div class="ingreso__tarjeta">
                <h2>Probala como…</h2>
                ${marca.wow ? `<p class="ingreso__wow"><i class="ti ti-sparkles" aria-hidden="true"></i><span>${esc(marca.wow)}</span></p>` : ""}
                <div class="ingreso__personas">
                    ${enOrden.map((p) => `
                    <button class="persona${p === recomendada ? " persona--empezar" : ""}" type="button" data-persona="${esc(p.id)}">
                        <span class="persona__avatar" aria-hidden="true">${esc(iniciales(p))}</span>
                        <span class="persona__nombre">${esc(p.etiqueta)}${p === recomendada ? ' <span class="persona__empezar">Empezá por acá</span>' : ""}</span>
                        ${p.detalle ? `<span class="persona__detalle">${esc(p.detalle)}</span>` : ""}
                        <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    </button>`).join("")}
                </div>
                <p class="formulario__error" role="alert" hidden></p>
            </div>
            <p class="nota ingreso__nota"><i class="ti ti-flask" aria-hidden="true"></i> Modo prueba: datos inventados, guardados solo en este navegador. No te pedimos ningún dato.</p>
            <div class="ingreso__sazzo">
                <a class="boton boton--secundario" href="${esc(linkOtrasDemos())}" data-otras-demos><i class="ti ti-layout-grid"></i> Ver otras demos</a>
                <a class="boton boton--secundario" href="${esc(quiero.href)}" data-quiero-esto${quiero.externo ? ' target="_blank" rel="noopener"' : ""}><i class="ti ti-brand-whatsapp"></i> Quiero esto para mi negocio</a>
            </div>
            ${pieAcerca(marca)}
        </main>`;
}

/** Una sola persona (comercio de una persona): entra directo, sin pantalla de elegir. Si falla, muestra la pantalla con el error. */
export async function vistaIngreso(cont, { marca, personas, alElegir }) {
    if (personas.length === 1) {
        try {
            await alElegir(personas[0].id);
            contarEntrada(marca, personas[0]);
            return;
        } catch (e) {
            mostrarIngreso(cont, { marca, personas, alElegir });
            const error = $(".formulario__error", cont);
            error.textContent = mensajeDe(e);
            error.hidden = false;
            return;
        }
    }
    mostrarIngreso(cont, { marca, personas, alElegir });
}

function mostrarIngreso(cont, { marca, personas, alElegir }) {
    soltarPantalla();
    cont.innerHTML = htmlIngreso({ marca, personas });
    cont.classList?.remove("sin-menu");
    // Si el foco quedó en ningún lado (tocó "Cambiar de persona", que ya no está), va a la primera persona
    const foco = document.activeElement;
    if (!foco || foco === document.body || !foco.isConnected) $("[data-persona]", cont)?.focus({ preventScroll: true });
    activarBotonesSazzo(cont, marca);
    const error = $(".formulario__error", cont);
    $$("[data-persona]", cont).forEach((b) =>
        b.addEventListener("click", async () => {
            error.hidden = true;
            b.disabled = true;
            try {
                await alElegir(b.dataset.persona);
                contarEntrada(marca, personas.find((p) => p.id === b.dataset.persona));
            } catch (e) {
                error.textContent = mensajeDe(e);
                error.hidden = false;
                b.disabled = false;
            }
        })
    );
}

/** Registro de visitas: con qué persona de ejemplo entró (su etiqueta, ej: "Laura · Dueña") y la primera pantalla. */
function contarEntrada(marca, persona) {
    contar("entro", marca.id, { persona: persona?.etiqueta ?? "" });
    setTimeout(() => contarPantalla(marca.id), 900);
}
