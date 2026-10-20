import { esc } from "./ui.js?v=80175c9283";
import { nombreDemo } from "./marca.js?v=80175c9283";
import { contar } from "./visita.js?v=80175c9283";
import { abrirColores } from "./colores.js?v=80175c9283";
import { htmlBotonInstalar } from "./instalar.js?v=80175c9283";

export const TOPE_DETALLE = { hace: 5, extra: 6, tambien: 8, letras: 120, titulo: 50 };

function revisarRenglones(lista, tope, que) {
    if (!Array.isArray(lista)) throw new Error(`"${que}" tiene que ser una lista.`);
    if (lista.length > tope) throw new Error(`"${que}" admite hasta ${tope} renglones.`);
    if (lista.some((t) => typeof t !== "string" || !t.trim() || t.length > TOPE_DETALLE.letras)) {
        throw new Error(`Cada renglón de "${que}" es un texto de hasta ${TOPE_DETALLE.letras} letras.`);
    }
}

export function revisarDetalle(detalle) {
    if (!detalle) return null;
    const { hace = [], extra = null, tambien = [] } = detalle;
    revisarRenglones(hace, TOPE_DETALLE.hace, "Lo que también podés probar");
    revisarRenglones(tambien, TOPE_DETALLE.tambien, "La versión real también puede tener");
    if (extra) {
        if (typeof extra.titulo !== "string" || !extra.titulo.trim() || extra.titulo.length > TOPE_DETALLE.titulo) {
            throw new Error(`El título del bloque propio es un texto de hasta ${TOPE_DETALLE.titulo} letras.`);
        }
        revisarRenglones(extra.renglones, TOPE_DETALLE.extra, extra.titulo);
    }
    if (!hace.length && !tambien.length && !extra) return null;
    return { hace, extra, tambien };
}

function bloque(titulo, icono, renglones) {
    if (!renglones.length) return "";
    return `
            <section class="detalle__bloque">
                <h3>${esc(titulo)}</h3>
                <ul>${renglones.map((r) => `<li><i class="ti ${icono}" aria-hidden="true"></i><span>${esc(r)}</span></li>`).join("")}</ul>
            </section>`;
}

export function htmlDetalle(detalle) {
    const d = revisarDetalle(detalle);
    if (!d) return "";
    return [
        bloque("Lo que también podés probar", "ti-check", d.hace),
        d.extra ? bloque(d.extra.titulo, "ti-star", d.extra.renglones) : "",
        bloque("La versión real también puede tener", "ti-plus", d.tambien)
    ].join("");
}

export const htmlBotonDetalle = (clase, texto = "Ver en detalle") =>
    `<button class="${esc(clase)}" type="button" data-detalle><i class="ti ti-list-details" aria-hidden="true"></i><span>${esc(texto)}</span></button>`;

export function abrirDetalle(marca, detalle) {
    document.querySelector("dialog.detalle")?.remove();
    const hoja = document.createElement("dialog");
    hoja.className = "hoja detalle";
    hoja.setAttribute("aria-labelledby", "detalle-titulo");
    hoja.innerHTML = `
        <form method="dialog" class="hoja__caja">
            <div class="hoja__titulos detalle__titulos">
                <h2 id="detalle-titulo">${nombreDemo(marca)}<span class="detalle__en">en detalle</span></h2>
                <button class="boton-icono" value="cerrar" aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            ${htmlDetalle(detalle)}
            <button class="boton boton--secundario boton--ancho" type="button" data-colores-detalle><i class="ti ti-palette" aria-hidden="true"></i> Probala con tus colores</button>
            ${htmlBotonInstalar()}
            <button class="boton boton--ancho" value="cerrar">Volver a la demo</button>
        </form>`;
    document.body.append(hoja);
    hoja.querySelector("[data-colores-detalle]").addEventListener("click", () => {
        hoja.close();
        abrirColores(marca.prefijo, { alElegir: () => contar("colores", marca.id) });
    });
    hoja.addEventListener("close", () => hoja.remove());
    hoja.addEventListener("click", (e) => {
        if (e.target === hoja) hoja.close();
    });
    hoja.showModal();
    return hoja;
}

export function activarDetalle(raiz, marca, detalle) {
    raiz.querySelectorAll("[data-detalle]").forEach((b) =>
        b.addEventListener("click", () => {
            contar("detalle", marca.id);
            abrirDetalle(marca, detalle);
        })
    );
}
