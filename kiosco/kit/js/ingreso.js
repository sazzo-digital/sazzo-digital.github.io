// ============================================
// Pantalla de ingreso: "Probala como…" con un botón por persona (los roles reales del rubro).
// Sin mail ni contraseña: las demos no tienen cuentas (modo prueba).
// La demo pasa su lista de personas:
//   [{ id: "u-laura", etiqueta: "Laura · Dueña", detalle: "Ve la caja, el stock y los fiados" }, …]
// y qué hacer al elegir una (alElegir(id): guardar la sesión y arrancar la demo).
// ============================================
import { $, $$, esc } from "./ui.js?v=e34da8ad04";
import { logoSazzo, nombreDemo } from "./marca.js?v=e34da8ad04";
import { pieAcerca } from "./acerca.js?v=e34da8ad04";
import { linkOtrasDemos, linkQuieroEsto } from "./enlaces.js?v=e34da8ad04";
import { activarBotonesSazzo } from "./marco.js?v=e34da8ad04";
import { contar, contarPantalla } from "./visita.js?v=e34da8ad04";

export function htmlIngreso({ marca, personas }) {
    const quiero = linkQuieroEsto(marca);
    return `
        <section class="ingreso">
            <div class="ingreso__marca">
                ${logoSazzo("logo logo--grande")}
                <h1>${nombreDemo(marca)}</h1>
                ${marca.lema ? `<p class="lema">${esc(marca.lema)}</p>` : ""}
            </div>
            <div class="ingreso__tarjeta">
                <h2>Probala como…</h2>
                <div class="ingreso__personas">
                    ${personas.map((p) => `
                    <button class="persona" type="button" data-persona="${esc(p.id)}">
                        <span class="persona__nombre">${esc(p.etiqueta)}</span>
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
        </section>`;
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
            error.textContent = e.message;
            error.hidden = false;
            return;
        }
    }
    mostrarIngreso(cont, { marca, personas, alElegir });
}

function mostrarIngreso(cont, { marca, personas, alElegir }) {
    cont.innerHTML = htmlIngreso({ marca, personas });
    cont.classList?.remove("sin-menu");
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
                error.textContent = e.message;
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
