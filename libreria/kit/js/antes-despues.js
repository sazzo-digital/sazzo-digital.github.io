// ============================================
// Antes y después: dos fotos una encima de la otra y una manija que se desliza con el dedo (o con las flechas del
// teclado: es un <input type="range"> de verdad, así lo usa cualquiera).
//   cont.innerHTML = htmlAntesDespues({ antes: "img/corte-antes.webp", despues: "img/corte-despues.webp",
//                                       texto: "Corte degradé", ancho: 800, alto: 600 });
//   activarAntesDespues(cont);
// Sin librería (img-comparison-slider hacía lo mismo con 9 KB). Las fotos se cargan recién cuando se ven
// (loading="lazy") y tienen su ancho y alto, así no empujan la pantalla al llegar.
// ============================================
import { esc } from "./ui.js?v=114958267d";

/** Solo fotos del propio sitio (una ruta como "img/x.webp"), nunca algo que venga de afuera. */
const esFoto = (ruta) => typeof ruta === "string" && ruta.length <= 120 && /^[\w\-/.]+\.(webp|avif|jpe?g|png)$/i.test(ruta) && !ruta.includes("..");

export function htmlAntesDespues({ antes, despues, texto = "", ancho = 800, alto = 600, inicio = 50 } = {}) {
    if (!esFoto(antes) || !esFoto(despues)) throw new Error("Las fotos del antes y después tienen que ser del sitio.");
    const a = Math.min(Math.max(Math.round(Number(ancho)) || 800, 100), 4000);
    const h = Math.min(Math.max(Math.round(Number(alto)) || 600, 100), 4000);
    const pos = Math.min(Math.max(Math.round(Number(inicio)) || 50, 0), 100);
    return `
        <figure class="antes-despues" style="--corte:${pos}%; aspect-ratio:${a} / ${h}">
            <img class="antes-despues__foto" src="${esc(antes)}" alt="Antes${texto ? `: ${esc(texto)}` : ""}" width="${a}" height="${h}" loading="lazy" decoding="async">
            <img class="antes-despues__foto antes-despues__despues" src="${esc(despues)}" alt="Después${texto ? `: ${esc(texto)}` : ""}" width="${a}" height="${h}" loading="lazy" decoding="async">
            <span class="antes-despues__rotulo antes-despues__rotulo--antes" aria-hidden="true">Antes</span>
            <span class="antes-despues__rotulo antes-despues__rotulo--despues" aria-hidden="true">Después</span>
            <span class="antes-despues__manija" aria-hidden="true"><i class="ti ti-arrows-horizontal"></i></span>
            <input class="antes-despues__control" type="range" min="0" max="100" step="1" value="${pos}" aria-label="Deslizá para comparar el antes y el después${texto ? ` (${esc(texto)})` : ""}">
            ${texto ? `<figcaption>${esc(texto)}</figcaption>` : ""}
        </figure>`;
}

/** Hace andar la manija de todos los antes y después de `raiz`. */
export function activarAntesDespues(raiz = document) {
    raiz.querySelectorAll(".antes-despues").forEach((fig) => {
        const control = fig.querySelector(".antes-despues__control");
        if (!control || control.dataset.activo) return;
        control.dataset.activo = "1";
        const mover = () => fig.style.setProperty("--corte", `${Math.min(Math.max(Number(control.value) || 0, 0), 100)}%`);
        control.addEventListener("input", mover);
        mover();
    });
}
