import { esc, aviso } from "./ui.js?v=50ee31fa6b";
import { linkQuieroEsto } from "./enlaces.js?v=50ee31fa6b";
import { abrirColores } from "./colores.js?v=50ee31fa6b";
import { contar } from "./visita.js?v=50ee31fa6b";
import { repintarRuta } from "./rutas.js?v=50ee31fa6b";

export const TOPE_CONSIGNA = { pasos: 9, letras: 160 };

const clavePasos = (marca) => `${marca.prefijo}-sin-pasos`;

export function pasosOcultos(marca) {
    try {
        return localStorage.getItem(clavePasos(marca)) === "1";
    } catch {
        return false;
    }
}

export function ocultarPasos(marca) {
    try {
        localStorage.setItem(clavePasos(marca), "1");
    } catch {}
    document.dispatchEvent(new CustomEvent("sazzo:pasos", { detail: { ocultos: true } }));
}

export function mostrarPasos(marca) {
    try {
        localStorage.removeItem(clavePasos(marca));
    } catch {}
    document.dispatchEvent(new CustomEvent("sazzo:pasos", { detail: { ocultos: false } }));
}

export function alternarPasos(marca) {
    if (pasosOcultos(marca)) mostrarPasos(marca);
    else ocultarPasos(marca);
    aviso(pasosOcultos(marca) ? "Pasos ocultos" : "Pasos visibles", "info");
    repintarRuta();
}

function pintarInterruptorPasos(boton, ocultos) {
    boton.setAttribute("aria-pressed", String(ocultos));
    const texto = boton.querySelector("span");
    if (texto) texto.textContent = ocultos ? "Mostrar pasos" : "Ocultar pasos";
}

export function htmlInterruptorPasos(marca, clase = "boton boton--secundario") {
    const ocultos = pasosOcultos(marca);
    return `<button class="${esc(clase)}" type="button" data-interruptor-pasos aria-pressed="${ocultos}"><i class="ti ti-list-check" aria-hidden="true"></i><span>${ocultos ? "Mostrar pasos" : "Ocultar pasos"}</span></button>`;
}

export function activarInterruptorPasos(raiz, marca) {
    raiz.querySelectorAll("[data-interruptor-pasos]").forEach((boton) => boton.addEventListener("click", () => alternarPasos(marca)));
}

document.addEventListener("sazzo:pasos", (e) => {
    document.querySelectorAll("[data-interruptor-pasos]").forEach((boton) => pintarInterruptorPasos(boton, !!e.detail?.ocultos));
});

const BOTON_OCULTAR = `<button class="boton-icono consigna__cerrar" type="button" data-ocultar-pasos aria-label="Ocultar los pasos" title="Ocultar los pasos"><i class="ti ti-x" aria-hidden="true"></i></button>`;

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
            ${BOTON_OCULTAR}
        </aside>`;
}

export function htmlConsignaFinal(marca, total) {
    if (!Number.isInteger(total) || total < 1 || total > TOPE_CONSIGNA.pasos) throw new Error(`El final de la consigna necesita cuántos pasos hubo (de 1 a ${TOPE_CONSIGNA.pasos}).`);
    const quiero = linkQuieroEsto(marca);
    return `
        <aside class="consigna consigna--final" aria-label="Terminaste los pasos">
            <p class="consigna__exito" role="status"><i class="ti ti-circle-check" aria-hidden="true"></i><span><b>¡Éxito!</b> Terminaste ${total === 1 ? "el paso" : `los ${esc(total)} pasos`}.</span></p>
            <div class="consigna__botones">
                <button class="boton" type="button" data-consigna-colores><i class="ti ti-palette" aria-hidden="true"></i> Ahora probala con tus colores</button>
                <a class="boton consigna__quiero" href="${esc(quiero.href)}" data-consigna-quiero${quiero.externo ? ' target="_blank" rel="noopener"' : ""}><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Quiero esto</a>
            </div>
            ${BOTON_OCULTAR}
        </aside>`;
}

export function activarConsigna(cont, marca) {
    if (pasosOcultos(marca)) {
        cont.querySelectorAll(".consigna").forEach((cartel) => cartel.remove());
        return;
    }
    cont.querySelectorAll("[data-ocultar-pasos]").forEach((boton) => boton.addEventListener("click", () => {
        ocultarPasos(marca);
        cont.querySelectorAll(".consigna").forEach((cartel) => cartel.remove());
        aviso("Pasos ocultos. Los volvés a ver con «Mostrar pasos», arriba.", "info");
    }));
    cont.querySelector("[data-consigna-colores]")?.addEventListener("click", () => abrirColores(marca.prefijo, { alElegir: () => contar("colores", marca.id) }));
    cont.querySelector("[data-consigna-quiero]")?.addEventListener("click", () => contar("quiero-esto", marca.id));
}
