// ============================================
// Ver un producto en 3D y "verlo en tu mesa" (realidad aumentada):
//   verEn3D({ titulo: "Madera Azul", src: "img/frasco.glb", colores: { liquido: "#c084fc" } });
// Abre una ventanita con el objeto, que se gira con el dedo. Donde el celular puede (Android con Scene Viewer, iPhone
// con Quick Look, que model-viewer arma solo), aparece "Verlo en tu mesa". El visor (kit\3d\model-viewer.min.js,
// Google, Apache-2.0, ~1 MB) se baja recién al tocar "Verlo en 3D". `colores` tiñe los materiales por su nombre.
// ============================================
import { esc, aviso } from "./ui.js?v=d783fb01c6";
import { alSalirDeLaPantalla } from "./rutas.js?v=d783fb01c6";
import { RUTA_3D } from "./config.js?v=d783fb01c6";

const VERSION_VISOR = "4.3.1";
let visorCargado = null;

/** Baja el visor una sola vez (define la etiqueta <model-viewer>). */
export function cargarVisor() {
    visorCargado ??= import(new URL(`model-viewer.min.js?v=${VERSION_VISOR}`, new URL(RUTA_3D, location.href)).href).catch((e) => {
        visorCargado = null;
        throw e;
    });
    return visorCargado;
}

const aRGBA = (hex, alfa) => {
    const n = Number.parseInt(String(hex).replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alfa];
};

export const NOTA_3D = "Es de ejemplo: en tu tienda va la foto o el 3D de tus productos.";
export const TOPE_NOTA_3D = 140; // letras

/** `nota`: el texto de abajo (ej. Restix: "en tu carta van tus platos"); si no viene, el de siempre. */
export async function verEn3D({ titulo, src, colores = {}, alfa = 0.9, nota = NOTA_3D }) {
    if (!/^[\w\-/.]+\.glb$/.test(String(src))) throw new Error("El modelo 3D tiene que ser un archivo .glb del sitio.");
    const textoNota = String(nota ?? "").trim().slice(0, TOPE_NOTA_3D) || NOTA_3D;
    document.querySelector("dialog.visor-3d")?.remove();
    const hoja = document.createElement("dialog");
    hoja.className = "hoja visor-3d";
    hoja.innerHTML = `
        <div class="hoja__caja">
            <div class="hoja__titulos">
                <h2><i class="ti ti-3d-cube-sphere" aria-hidden="true"></i> ${esc(titulo)}</h2>
                <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            <div class="visor-3d__lugar"><p class="nota visor-3d__cargando"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando el 3D…</p></div>
            <p class="nota"><i class="ti ti-hand-finger" aria-hidden="true"></i> Giralo con el dedo. ${esc(textoNota)}</p>
        </div>`;
    document.body.append(hoja);
    const cerrar = () => {
        if (hoja.open) hoja.close();
        hoja.remove();
    };
    hoja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
    hoja.addEventListener("close", () => hoja.remove());
    hoja.addEventListener("click", (e) => {
        if (e.target === hoja) cerrar();
    });
    alSalirDeLaPantalla(cerrar);
    hoja.showModal();
    try {
        await cargarVisor();
    } catch {
        cerrar();
        aviso("No se pudo cargar el 3D. Probá de nuevo con mejor señal.", "error");
        return null;
    }
    if (!hoja.isConnected) return null;
    const visor = document.createElement("model-viewer");
    for (const [k, v] of Object.entries({
        src,
        alt: `${titulo} en 3D`,
        "camera-controls": "",
        "touch-action": "pan-y",
        "auto-rotate": "",
        loading: "eager", // en la ventanita se ve siempre: que no espere a "aparecer en pantalla"
        reveal: "auto",
        "shadow-intensity": "1",
        exposure: "1.1",
        "environment-image": "neutral",
        ar: "",
        "ar-modes": "webxr scene-viewer quick-look",
        "ar-scale": "fixed"
    })) visor.setAttribute(k, v);
    visor.innerHTML = `<button slot="ar-button" class="boton visor-3d__ar" type="button"><i class="ti ti-augmented-reality" aria-hidden="true"></i> Verlo en tu mesa</button>`;
    // Los colores (ej: el perfume del color de su familia), cuando el modelo está listo
    let pintado = false;
    const pintar = () => {
        if (pintado || !visor.model) return;
        pintado = true;
        for (const [nombre, hex] of Object.entries(colores)) {
            if (!/^#[0-9a-f]{6}$/i.test(hex)) continue;
            visor.model.getMaterialByName?.(nombre)?.pbrMetallicRoughness.setBaseColorFactor(aRGBA(hex, alfa));
        }
    };
    visor.addEventListener("load", pintar);
    visor.addEventListener("error", () => aviso("No se pudo mostrar el 3D en este celular.", "error"));
    hoja.querySelector(".visor-3d__lugar").replaceChildren(visor);
    if (visor.loaded) pintar();
    return visor;
}
