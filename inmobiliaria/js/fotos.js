// ============================================
// Fotos de las propiedades de Sazzo Inmobiliaria.
// - Las de ejemplo viven en img/fotos/<clave>.webp (fotos libres, nunca de un negocio real). ARCHIVOS dice cuáles
//   están: si una propiedad pide una que no está, se ve su dibujo.
// - Las que se sacan con el celu al cargar una propiedad se achican en el equipo (hasta 1200 px, JPEG) y quedan en
//   memoria mientras la demo está abierta: no se suben a ningún lado ni se guardan (como la firma de Taller).
// ============================================
import { TOPES } from "./datos.js?v=54226d45fc";

const CARPETA = "img/fotos/";
export const ARCHIVOS = new Set([]); // se suman cuando estén las fotos de ejemplo

const enMemoria = new Map(); // id de propiedad → [url de la foto achicada]
const LADO_MAXIMO = 1200;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** La dirección de una foto de ejemplo (o null si no está). */
export const urlFoto = (clave) => (ARCHIVOS.has(clave) ? `${CARPETA}${clave}.webp` : null);

/** Todas las fotos que se pueden mostrar de una propiedad: las de ejemplo que estén y las del celu. */
export function fotosDe(p) {
    return [...(p.fotos ?? []).map(urlFoto).filter(Boolean), ...(enMemoria.get(p.id) ?? [])];
}

/** ¿Es un archivo de foto razonable? (tipo de imagen y no más de 10 MB). Devuelve el error para mostrar, o null. */
export function revisarArchivoFoto(archivo) {
    if (!archivo) return "Elegí una foto.";
    if (archivo.type && !TIPOS_FOTO.includes(archivo.type)) return "Eso no es una foto (tiene que ser JPG, PNG o WebP).";
    if (archivo.size > TOPES.fotoBytes) return `La foto es muy pesada (máximo ${TOPES.fotoBytes / 1024 / 1024} MB).`;
    if (archivo.size === 0) return "La foto está vacía.";
    return null;
}

/** Achica la foto en el equipo (sin subirla) y devuelve su dirección local. */
export async function achicarFoto(archivo) {
    const error = revisarArchivoFoto(archivo);
    if (error) throw new Error(error);
    let imagen;
    try {
        imagen = await createImageBitmap(archivo);
    } catch {
        throw new Error("No se pudo leer la foto. Probá con otra (JPG o PNG).");
    }
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close?.();
    const blob = await new Promise((listo) => lienzo.toBlob(listo, "image/jpeg", 0.82));
    if (!blob) throw new Error("No se pudo achicar la foto.");
    return URL.createObjectURL(blob);
}

/** Deja las fotos del celu de una propiedad recién cargada (hasta el tope). */
export function guardarFotosEnMemoria(propiedadId, urls) {
    enMemoria.set(propiedadId, urls.slice(0, TOPES.fotos));
}
