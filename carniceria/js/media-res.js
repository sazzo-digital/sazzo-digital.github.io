// ============================================
// El dibujo de la vaca con sus cortes (propio, hecho a mano con trazos: no es una imagen de otro lado).
// Cada zona es un botón: en Pedir, la clienta toca el corte; en Desposte, cada zona se pinta cuando sus cortes ya
// tienen el peso. Los colores salen del tema (claro u oscuro) y del color de la demo.
//   htmlMediaRes({ estados: { asado: "hecho" }, activa: "asado", titulo: "Tocá un corte" })
//   activarMediaRes(raiz, (zona) => …)   // zona = { id, nombre, cortes: ["Asado", "Entraña"] }
// ============================================
import { esc } from "../kit/js/ui.js?v=5c760847bf";

// Silueta (mirando a la izquierda): lomo, anca, pierna, panza, mano, pecho, cogote y cabeza
const SILUETA = "M96 52 C150 40 260 40 330 44 C360 46 380 54 384 70 C390 100 388 130 380 150 L372 222 L348 222 L340 172 C300 182 240 186 200 184 C180 184 168 180 162 176 L158 222 L134 222 L128 172 C110 166 96 158 88 146 C78 132 66 122 52 118 C40 116 26 112 18 102 C12 94 14 84 22 78 C32 66 44 60 56 58 C70 54 84 54 96 52 Z";

/** Las zonas: [id, nombre para leer, cortes que tiene, puntos del polígono, dónde va el nombre (x, y), nombre corto]. */
export const ZONAS = [
    ["roast", "Roast beef", ["Roast beef"], "92,36 150,36 150,82 92,90", [121, 66], "Roast beef"],
    ["bife-ancho", "Bife ancho", ["Bife ancho"], "150,36 210,36 210,80 150,82", [180, 64], "Bife ancho"],
    ["bife-angosto", "Bife angosto", ["Bife angosto"], "210,36 275,36 275,80 210,80", [242, 64], "Bife angosto"],
    ["cuadril", "Cuadril y colita de cuadril", ["Cuadril", "Colita de cuadril"], "275,36 335,36 335,90 275,85", [305, 66], "Cuadril"],
    ["nalga", "Nalga", ["Nalga"], "335,36 395,36 395,115 335,105", [362, 76], "Nalga"],
    ["paleta", "Paleta y carnaza", ["Paleta", "Carnaza"], "50,90 92,90 150,82 150,140 50,150", [114, 118], "Paleta"],
    ["tapa", "Tapa de asado", ["Tapa de asado"], "150,82 210,80 210,98 150,100", [180, 94], "Tapa"],
    ["asado", "Asado y entraña", ["Asado", "Entraña"], "150,100 210,98 210,140 150,140", [180, 124], "Asado"],
    ["lomo", "Lomo", ["Lomo"], "210,80 275,80 275,98 210,98", [242, 93], "Lomo"],
    ["vacio", "Vacío", ["Vacío"], "210,98 275,98 285,140 210,140", [246, 124], "Vacío"],
    ["bola", "Bola de lomo", ["Bola de lomo"], "275,85 335,90 335,105 330,140 285,140 275,98", [306, 120], "Bola"],
    ["cuadrada", "Cuadrada y peceto", ["Cuadrada", "Peceto"], "335,105 395,115 395,160 330,160 330,140", [362, 140], "Cuadrada"],
    ["falda", "Falda", ["Falda"], "40,150 150,140 210,140 210,195 40,195", [176, 164], "Falda"],
    ["matambre", "Matambre", ["Matambre"], "210,140 285,140 330,140 330,195 210,195", [270, 164], "Matambre"],
    ["osobuco", "Osobuco", ["Osobuco"], "112,178 170,178 170,230 112,230", [146, 206], "Osobuco"],
    ["tortuguita", "Tortuguita", ["Tortuguita"], "325,165 395,165 395,230 325,230", [360, 200], "Tortuguita"]
].map(([id, nombre, cortes, puntos, [x, y], corto]) => ({ id, nombre, cortes, puntos, x, y, corto }));

/** La zona de un corte ("Entraña" → la del asado). */
export const zonaDe = (nombreCorte) => ZONAS.find((z) => z.cortes.includes(nombreCorte)) ?? null;

let cuenta = 0; // cada dibujo con su propio recorte (puede haber dos en la página)

/**
 * El dibujo. `estados`: { zonaId: "hecho" | "menos" | "falta" } (Desposte); `activa`: la zona elegida (Pedir).
 * `apagadas`: zonas sin cortes para elegir (se ven pero no se tocan).
 */
export function htmlMediaRes({ estados = {}, activa = null, apagadas = [], titulo = "Los cortes de la vaca" } = {}) {
    const recorte = `silueta-vaca-${++cuenta}`;
    return `
        <figure class="media-res">
            <svg class="media-res__dibujo" viewBox="0 30 400 200" role="group" aria-label="${esc(titulo)}">
                <defs><clipPath id="${recorte}"><path d="${SILUETA}"/></clipPath></defs>
                <path class="media-res__silueta" d="${SILUETA}"/>
                <g clip-path="url(#${recorte})">
                    ${ZONAS.map((z) => {
                        const apagada = apagadas.includes(z.id);
                        const clase = ["media-res__zona", estados[z.id] ? `media-res__zona--${esc(estados[z.id])}` : "", z.id === activa ? "media-res__zona--activa" : "", apagada ? "media-res__zona--apagada" : ""].filter(Boolean).join(" ");
                        return `<polygon class="${clase}" points="${z.puntos}" data-zona="${esc(z.id)}"${apagada ? "" : ` role="button" tabindex="0" aria-label="${esc(z.nombre)}${estados[z.id] === "hecho" ? " (pesado)" : estados[z.id] === "menos" ? " (dio de menos)" : ""}"${z.id === activa ? ' aria-pressed="true"' : ""}`}><title>${esc(z.nombre)}</title></polygon>`;
                    }).join("")}
                </g>
                <path class="media-res__borde" d="${SILUETA}"/>
                <circle class="media-res__ojo" cx="38" cy="80" r="3"/>
                <g class="media-res__nombres" aria-hidden="true">
                    ${ZONAS.map((z) => `<text x="${z.x}" y="${z.y}" class="${z.id === activa ? "activo" : ""}">${esc(z.corto)}</text>`).join("")}
                </g>
            </svg>
        </figure>`;
}

/** Toque o Enter/Espacio en una zona → alTocar(zona). */
export function activarMediaRes(raiz, alTocar) {
    raiz.querySelectorAll(".media-res [data-zona][role=button]").forEach((p) => {
        const zona = ZONAS.find((z) => z.id === p.dataset.zona);
        p.addEventListener("click", () => alTocar(zona));
        p.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                alTocar(zona);
            }
        });
    });
}
