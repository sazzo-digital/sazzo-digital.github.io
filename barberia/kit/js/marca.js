// ============================================
// Marca de cada demo: "Sazzo + rubro" (Sazzo Kiosco, Sazzo Canchas…), con el ícono de Sazzo ("s_").
// Cada demo pasa su marca una sola vez (en su archivo de configuración):
//   export const MARCA = revisarMarca({
//       id: "kiosco",                                     → igual a su carpeta en demos\; de acá sale el prefijo
//                                                           de todo lo que guarda ("sazzo-kiosco") y lo que mide
//       rubro: "Kiosco",                                  → se ve grande en la cabecera y el ingreso
//       lema: "Ventas · Stock · Fiados",                  → renglón chiquito debajo del nombre
//       descripcion: "Para vender, controlar el stock…",  → "Acerca de"
//       nombre: "Restix Sazzo"                            → opcional (si no, "Sazzo " + rubro)
//   });
// ============================================
import { esc } from "./ui.js?v=4875a95876";
import { sinPasarse } from "./topes.js?v=4875a95876";

/** Controla la marca de una demo (que no falte nada ni sea larguísima) y completa el nombre. */
export function revisarMarca({ id, rubro, lema = "", descripcion = "", nombre } = {}) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id ?? "") || id.length > 30) {
        throw new Error(`El id de la demo tiene que ser su carpeta, en minúsculas y sin espacios (ej: "kiosco"). Llegó: ${JSON.stringify(id)}.`);
    }
    const r = sinPasarse(rubro, 20, "el rubro de la marca");
    if (!r) throw new Error("Falta el rubro de la marca (ej: \"Kiosco\").");
    return Object.freeze({
        id,
        prefijo: `sazzo-${id}`,
        rubro: r,
        lema: sinPasarse(lema, 60, "el lema de la marca"),
        descripcion: sinPasarse(descripcion, 400, "la descripción de la marca"),
        nombre: sinPasarse(nombre ?? `Sazzo ${r}`, 30, "el nombre de la marca")
    });
}

/**
 * El ícono de Sazzo ("s_": la s del color del texto y el cursor del color de la demo, que titila).
 * Se dibuja con trazos (no depende de ninguna letra) y se adapta solo al tema claro u oscuro.
 */
export const logoSazzo = (clase = "logo") => `
    <svg class="${esc(clase)}" viewBox="12 30 76 40" aria-hidden="true" focusable="false">
        <path class="logo__s" d="M40.26 38.75 A13 7.5 0 1 0 29 50 A13 7.5 0 1 1 17.74 61.25" />
        <path class="logo__cursor" d="M58 64 H82" />
    </svg>`;

/** El nombre de la demo con estilo: el rubro grande y "sazzo" en una pastillita del color de la demo. */
export function nombreDemo(marca) {
    return `<span class="nombre-demo" role="img" aria-label="${esc(marca.nombre)}"><span class="nombre-demo__rubro" aria-hidden="true">${esc(marca.rubro)}</span><span class="nombre-demo__marca" aria-hidden="true">sazzo</span></span>`;
}
