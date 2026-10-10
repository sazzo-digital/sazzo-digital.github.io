// ============================================
// Fotos de las propiedades de Sazzo Inmobiliaria.
// - Las de ejemplo viven en img/fotos/<clave>.webp (960 x 720) y <clave>-chica.webp (480 x 360): fotos libres
//   (CC0, sin obligación de nombrar al autor), nunca de un negocio real. ARCHIVOS dice cuáles están: si una propiedad
//   pide una que no está, se ve su dibujo. De dónde salió cada una: fuentes-fotos.md (no se publica).
// - Las 360 viven en img/360/<clave>.jpg (4096 x 2048, Poly Haven, CC0); se bajan recién al tocar "Recorrer 360°".
// - Las que se sacan con el celu al cargar una propiedad se achican en el equipo (hasta 1200 px, JPEG) y quedan en
//   memoria mientras la demo está abierta: no se suben a ningún lado ni se guardan (como la firma de Taller).
// ============================================
import { TOPES } from "./datos.js?v=bc8d90946e";

const CARPETA = "img/fotos/";
const CUANTAS = { p1: 3, p2: 3, p3: 3, p4: 2, p5: 3, p6: 2, p7: 2, p8: 3, p9: 3, p10: 3, p11: 2, p12: 2 };
export const ARCHIVOS = new Set(Object.entries(CUANTAS).flatMap(([p, n]) => [..."abc"].slice(0, n).map((l) => `${p}-${l}`)));
export const RECORRIDOS = new Set(["p1", "p5"]); // fotos 360 que hay en img/360/

const enMemoria = new Map(); // id de propiedad → [url de la foto achicada]
const LADO_MAXIMO = 1200;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Una foto de ejemplo: { grande, chica } (o null si no está). */
export const urlFoto = (clave) => (ARCHIVOS.has(clave) ? { grande: `${CARPETA}${clave}.webp`, chica: `${CARPETA}${clave}-chica.webp` } : null);

/** La foto 360 de una propiedad (o null). */
export const urlRecorrido = (clave) => (RECORRIDOS.has(clave) ? `img/360/${clave}.jpg` : null);

/** Todas las fotos que se pueden mostrar de una propiedad: las de ejemplo que estén y las del celu. */
export function fotosDe(p) {
    const celu = (enMemoria.get(p.id) ?? []).map((url) => ({ grande: url, chica: url }));
    return [...(p.fotos ?? []).map(urlFoto).filter(Boolean), ...celu];
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
