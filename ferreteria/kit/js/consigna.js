import { esc } from "./ui.js?v=13fa897c3f";
import { linkQuieroEsto } from "./enlaces.js?v=13fa897c3f";
import { abrirColores } from "./colores.js?v=13fa897c3f";
import { contar } from "./visita.js?v=13fa897c3f";

export const TOPE_CONSIGNA = { pasos: 9, letras: 160 };

function texto(valor, que) {
    if (typeof valor !== "string" || valor.length > TOPE_CONSIGNA.letras) throw new Error(`${que}: un texto de hasta ${TOPE_CONSIGNA.letras} letras.`);
    return valor.trim();
}

export function htmlConsigna({ paso, total, accion, resultado = "", hecho = "", guia = "" }) {
    if (!Number.isInteger(total) || total < 1 || total > TOPE_CONSIGNA.pasos) throw new Error(`La consigna tiene de 1 a ${TOPE_CONSIGNA.pasos} pasos.`);
    if (!Number.isInteger(paso) || paso < 1 || paso > total) throw new Error("El paso de la consigna está fuera de la cuenta.");
    const quePasa = texto(accion, "La acción de la consigna");
    if (!quePasa) throw new Error("Falta la acción de la consigna.");
    const espera = texto(resultado, "El resultado de la consigna");
    const listo = texto(hecho, "El listo de la consigna");
    return `
        <aside class="consigna${listo ? " consigna--hecha" : ""}" aria-label="Qué probar">
            <p class="consigna__paso">Paso ${paso} de ${total}</p>
            ${listo
                ? `<p class="consigna__accion" role="status"><i class="ti ti-circle-check" aria-hidden="true"></i><span>Listo: ${esc(listo)}</span></p>`
                : `<p class="consigna__accion"><i class="ti ti-hand-finger" aria-hidden="true"></i><span>${esc(quePasa)}</span></p>
            ${espera ? `<p class="consigna__resultado"><i class="ti ti-corner-down-right" aria-hidden="true"></i><span>${esc(espera)}</span></p>` : ""}`}
            ${guia}
        </aside>`;
}

export function htmlConsignaFinal(marca) {
    const quiero = linkQuieroEsto(marca);
    return `
        <aside class="consigna consigna--final" aria-label="Qué probar">
            <p class="consigna__paso">Listo</p>
            <p class="consigna__accion" role="status"><i class="ti ti-circle-check" aria-hidden="true"></i><span>Ya viste el circuito completo.</span></p>
            <div class="consigna__botones">
                <button class="boton" type="button" data-consigna-colores><i class="ti ti-palette" aria-hidden="true"></i> Ahora probala con tus colores</button>
                <a class="boton consigna__quiero" href="${esc(quiero.href)}" data-consigna-quiero${quiero.externo ? ' target="_blank" rel="noopener"' : ""}><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Quiero esto</a>
            </div>
        </aside>`;
}

export function activarConsigna(cont, marca) {
    cont.querySelector("[data-consigna-colores]")?.addEventListener("click", () => abrirColores(marca.prefijo, { alElegir: () => contar("colores", marca.id) }));
    cont.querySelector("[data-consigna-quiero]")?.addEventListener("click", () => contar("quiero-esto", marca.id));
}
