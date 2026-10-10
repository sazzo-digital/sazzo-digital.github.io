// ============================================
// Excel y archivos para bajar o mandar. Todo se arma en el celular o la compu: nada se sube a ningún lado.
//   await bajarExcel("stock", [["Producto", "Precio"], ["Alfajor", 1500]], { hoja: "Stock", anchos: [30, 12] });
//   const filas = await leerExcel(archivo);          // [[celda, celda…], …] (texto, número o vacío), con topes
//   entregarArchivo(blob, "presupuesto-104.pdf");    // "Compartir" (WhatsApp, mail…) o "Descargar"
// Las librerías (kit\libs\, ver su LEEME) se bajan recién la primera vez que alguien toca el botón.
// ============================================
import { esc, aviso, mensajeDe } from "./ui.js?v=9c146b12b6";
import { alSalirDeLaPantalla } from "./rutas.js?v=9c146b12b6";
import { RUTA_LIBS } from "./config.js?v=9c146b12b6";

const VERSIONES = {
    "write-excel-file.min.js": "4.1.1",
    "read-excel-file.min.js": "9.3.10",
    "jspdf.umd.min.js": "4.2.1",
    "signature_pad.min.js": "5.1.4",
    "leaflet/leaflet.js": "1.9.4"
};
const cargando = new Map();

/**
 * Baja una librería de kit\libs\ una sola vez. Las que se arman como "UMD" quedan en globalThis[global]; las que
 * son módulos devuelven lo que exportan por defecto.
 */
export function cargarLibreria(archivo, global) {
    if (!VERSIONES[archivo]) return Promise.reject(new Error("Esa librería no está en el kit."));
    if (!cargando.has(archivo)) {
        const url = new URL(`${archivo}?v=${VERSIONES[archivo]}`, new URL(RUTA_LIBS, location.href)).href;
        cargando.set(archivo, import(url)
            .then((m) => (global ? globalThis[global] : m.default))
            .then((lib) => {
                if (!lib) throw new Error("La librería no arrancó.");
                return lib;
            })
            .catch((e) => {
                cargando.delete(archivo);
                throw e;
            }));
    }
    return cargando.get(archivo);
}

// ---------- Bajar o compartir ----------

/** "Presupuesto N° 104" → "presupuesto-n-104" (sin tildes, espacios ni nada raro: así viaja bien por WhatsApp). */
export function nombreDeArchivo(texto, extension) {
    const base = String(texto ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "archivo";
    if (!/^[a-z0-9]{2,5}$/.test(extension)) throw new Error("Extensión de archivo inválida.");
    return `${base}.${extension}`;
}

/** Baja el archivo con el nombre dado (en el celular queda en Descargas). */
export function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** ¿El navegador puede mandar este archivo con el menú de compartir del celular? */
export function puedeCompartirArchivo(archivo) {
    try {
        return typeof navigator.canShare === "function" && typeof navigator.share === "function" && navigator.canShare({ files: [archivo] });
    } catch {
        return false;
    }
}

/**
 * El archivo ya armado: si el celular puede compartirlo, una ventanita con "Compartir" (WhatsApp, mail…) y
 * "Descargar" (compartir necesita un toque nuevo: armar el archivo tarda y el navegador ya no lo cuenta como toque).
 * Si no puede, lo baja directo.
 */
export function entregarArchivo(blob, nombre, { titulo = "Listo", texto = "" } = {}) {
    if (!/^[a-z0-9-]{1,60}\.[a-z0-9]{2,5}$/.test(nombre)) throw new Error("Nombre de archivo inválido.");
    const archivo = new File([blob], nombre, { type: blob.type });
    if (!puedeCompartirArchivo(archivo)) {
        descargar(blob, nombre);
        aviso(`Bajado: ${nombre}`);
        return null;
    }
    document.querySelector("dialog.archivo-listo")?.remove();
    const hoja = document.createElement("dialog");
    hoja.className = "hoja archivo-listo";
    hoja.innerHTML = `
        <div class="hoja__caja">
            <div class="hoja__titulos">
                <h2><i class="ti ti-file-check" aria-hidden="true"></i> ${esc(titulo)}</h2>
                <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            <p class="archivo-listo__nombre"><i class="ti ti-file" aria-hidden="true"></i> ${esc(nombre)} <small>${esc(Math.max(1, Math.round(blob.size / 1024)))} KB</small></p>
            <div class="archivo-listo__acciones">
                <button class="boton" type="button" data-compartir><i class="ti ti-share"></i> Compartir</button>
                <button class="boton boton--secundario" type="button" data-descargar><i class="ti ti-download"></i> Descargar</button>
            </div>
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
    hoja.querySelector("[data-descargar]").addEventListener("click", () => {
        descargar(blob, nombre);
        aviso(`Bajado: ${nombre}`);
        cerrar();
    });
    hoja.querySelector("[data-compartir]").addEventListener("click", async () => {
        try {
            await navigator.share({ files: [archivo], title: texto || titulo });
            cerrar();
        } catch (e) {
            if (e?.name !== "AbortError") aviso("No se pudo compartir: probá con Descargar.", "error");
        }
    });
    alSalirDeLaPantalla(cerrar);
    hoja.showModal();
    return hoja;
}

// ---------- Excel ----------

// Topes de lo que se lee de un Excel (viene de afuera: puede ser cualquier cosa)
export const TOPES_EXCEL = {
    bytes: 2 * 1024 * 1024, // 2 MB: una lista de precios de verdad pesa mucho menos
    filas: 2000,
    columnas: 30,
    letras: 200 // por celda
};

/** Una celda que se lee: texto (recortado), número (si es de verdad un número), sí/no o vacío. */
function celdaLeida(valor) {
    if (valor == null) return null;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
    if (typeof valor === "boolean") return valor;
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
    const t = String(valor).replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    return t ? t.slice(0, TOPES_EXCEL.letras) : null;
}

/**
 * Lee la primera hoja de un Excel (.xlsx) elegido por la persona. Devuelve las filas (sin las vacías del final),
 * con topes de tamaño, renglones, columnas y letras. Lo que devuelve hay que pasarlo por esc() antes de mostrarlo.
 */
export async function leerExcel(archivo) {
    if (!(archivo instanceof Blob)) throw new Error("Elegí un archivo de Excel.");
    if (archivo.name && !/\.xlsx$/i.test(archivo.name)) throw new Error("Tiene que ser un Excel nuevo (.xlsx). Si es .xls o .csv, abrilo en Excel y guardalo como .xlsx.");
    if (!archivo.size) throw new Error("El archivo está vacío.");
    if (archivo.size > TOPES_EXCEL.bytes) throw new Error("El archivo es muy grande (máximo 2 MB).");
    const leer = await cargarLibreria("read-excel-file.min.js", "readXlsxFile");
    let hojas;
    try {
        hojas = await leer(archivo);
    } catch {
        throw new Error("No pude leer el archivo: ¿es un Excel (.xlsx)?");
    }
    const filas = Array.isArray(hojas) ? hojas[0]?.data : null;
    if (!Array.isArray(filas) || !filas.length) throw new Error("El Excel no tiene nada en la primera hoja.");
    if (filas.length > TOPES_EXCEL.filas) throw new Error(`El Excel tiene demasiados renglones (máximo ${TOPES_EXCEL.filas}).`);
    return filas.map((f) => (Array.isArray(f) ? f.slice(0, TOPES_EXCEL.columnas).map(celdaLeida) : []));
}

/**
 * Arma un Excel con una hoja: la primera fila (títulos) en negrita. Las celdas pueden ser texto, número o vacío;
 * { valor, formato: "pesos" } para plata. Devuelve el archivo (Blob); para bajarlo o mandarlo: bajarExcel.
 */
export async function armarExcel(filas, { hoja = "Hoja 1", anchos = [] } = {}) {
    if (!Array.isArray(filas) || !filas.length) throw new Error("No hay nada para pasar a Excel.");
    if (filas.length > TOPES_EXCEL.filas) throw new Error(`Demasiados renglones para un Excel (máximo ${TOPES_EXCEL.filas}).`);
    const escribir = await cargarLibreria("write-excel-file.min.js", "writeXlsxFile");
    const celda = (c, titulo) => {
        const esPesos = c && typeof c === "object" && c.formato === "pesos";
        let valor = c && typeof c === "object" ? c.valor : c;
        if (typeof valor === "number" && !Number.isFinite(valor)) valor = null;
        if (valor != null && typeof valor !== "number" && typeof valor !== "boolean") valor = String(valor).slice(0, 500);
        if (valor == null || valor === "") return null;
        return {
            value: valor,
            ...(titulo ? { fontWeight: "bold" } : {}),
            ...(esPesos && typeof valor === "number" ? { format: '"$" #,##0' } : {})
        };
    };
    const datos = filas.map((f, i) => f.map((c) => celda(c, i === 0)));
    const columnas = anchos.map((a) => ({ width: Math.min(Math.max(Number(a) || 10, 4), 80) }));
    return escribir(datos, { columns: columnas, sheet: String(hoja).replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Hoja 1" }).toBlob();
}

/** Arma el Excel y lo entrega (Compartir / Descargar). "nombre" sin extensión: "Stock del kiosco". */
export async function bajarExcel(nombre, filas, opciones = {}) {
    try {
        const blob = await armarExcel(filas, opciones);
        return entregarArchivo(blob, nombreDeArchivo(nombre, "xlsx"), { titulo: "Tu Excel está listo", texto: nombre });
    } catch (e) {
        aviso(mensajeDe(e), "error");
        return null;
    }
}

// Encontrar columnas y leer precios de lo que vino en el Excel: en tablas.js (sin pantalla, para los datos)
export { columnasDe, numeroDe, textoParaComparar } from "./tablas.js?v=9c146b12b6";
