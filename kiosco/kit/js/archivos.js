// ============================================
// Excel y archivos de las demos. Todo se arma en el celular o la compu: nada se sube ni se baja a ningún lado.
//   await bajarExcel("stock", [["Producto", "Precio"], ["Alfajor", 1500]], { hoja: "Stock", anchos: [30, 12] });
//   const filas = await leerExcel(archivo);          // [[celda, celda…], …] (texto, número o vacío), con topes
//   entregarArchivo(blob, "presupuesto-104.pdf");    // en la demo: una hoja, no se baja nada
// Las librerías (kit\libs\, ver su LEEME) se bajan recién la primera vez que alguien toca el botón.
// ============================================
import { esc, aviso, mensajeDe } from "./ui.js?v=d5f06e834f";
import { alSalirDeLaPantalla } from "./rutas.js?v=d5f06e834f";
import { RUTA_LIBS } from "./config.js?v=d5f06e834f";

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

// ---------- Archivos (en la demo no se baja nada) ----------

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

/** Cuánto pesa, escrito corto: "1 KB", "12 KB". */
function pesoCorto(bytes) {
    return `${Math.max(1, Math.round(Number(bytes) / 1024) || 1)} KB`;
}

/**
 * En la demo no se baja ni se comparte nada: una hoja avisa que no se descargó nada, con el nombre y el tamaño del archivo.
 * La usan entregarArchivo (Excel y PDF), descargarCSV y todo botón de "bajar" de las demos.
 */
export function mostrarArchivoDeDemo(nombre, bytes) {
    document.querySelector("dialog.archivo-listo")?.remove();
    const hoja = document.createElement("dialog");
    hoja.className = "hoja archivo-listo";
    hoja.innerHTML = `
        <div class="hoja__caja">
            <div class="hoja__titulos">
                <h2><i class="ti ti-info-circle" aria-hidden="true"></i> No se descargó nada: es una demo</h2>
                <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar"><i class="ti ti-x"></i></button>
            </div>
            <p class="archivo-listo__nombre"><i class="ti ti-file" aria-hidden="true"></i> ${esc(nombre)} <small>${esc(pesoCorto(bytes))}</small></p>
            <p>En tu versión, al tocar este botón se guarda este archivo en tu celu o en tu compu. Acá no se guardó nada.</p>
            <div class="archivo-listo__acciones">
                <button class="boton" type="button" data-entendido>Entendido</button>
            </div>
        </div>`;
    document.body.append(hoja);
    const cerrar = () => {
        if (hoja.open) hoja.close();
        hoja.remove();
    };
    hoja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
    hoja.querySelector("[data-entendido]").addEventListener("click", cerrar);
    hoja.addEventListener("close", () => hoja.remove());
    hoja.addEventListener("click", (e) => {
        if (e.target === hoja) cerrar();
    });
    alSalirDeLaPantalla(cerrar);
    hoja.showModal();
    return hoja;
}

/** El archivo ya armado: en la demo no se baja ni se comparte, se muestra la hoja (mostrarArchivoDeDemo). */
export function entregarArchivo(blob, nombre) {
    if (!/^[a-z0-9-]{1,60}\.[a-z0-9]{2,5}$/.test(nombre)) throw new Error("Nombre de archivo inválido.");
    return mostrarArchivoDeDemo(nombre, blob.size);
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

export const TOPES_ZIP = { entradas: 300, hojas: 20, descomprimido: 40 * 1024 * 1024, proporcion: 200 };

export function revisarZip(buffer) {
    const NO_ES = "No pude leer el archivo: ¿es un Excel (.xlsx)?";
    const GRANDE = "Ese Excel es demasiado grande por dentro. Dejá solo la hoja con la lista y guardalo de nuevo.";
    const v = new DataView(buffer);
    let fin = -1;
    for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 22 - 65535); i--) {
        if (v.getUint32(i, true) === 0x06054b50) {
            fin = i;
            break;
        }
    }
    if (fin < 0) return NO_ES;
    const entradas = v.getUint16(fin + 10, true);
    if (entradas > TOPES_ZIP.entradas) return GRANDE;
    let p = v.getUint32(fin + 16, true);
    let total = 0;
    let hojas = 0;
    const texto = new TextDecoder();
    for (let n = 0; n < entradas; n++) {
        if (p + 46 > buffer.byteLength || v.getUint32(p, true) !== 0x02014b50) return NO_ES;
        const comprimido = v.getUint32(p + 20, true);
        const real = v.getUint32(p + 24, true);
        const largo = v.getUint16(p + 28, true);
        if (p + 46 + largo > buffer.byteLength) return NO_ES;
        const ruta = texto.decode(new Uint8Array(buffer, p + 46, largo));
        if (comprimido === 0xffffffff || real === 0xffffffff || real > TOPES_ZIP.descomprimido) return GRANDE;
        if (real > 1024 * 1024 && real / Math.max(comprimido, 1) > TOPES_ZIP.proporcion) return GRANDE;
        if (/^xl\/worksheets\/[^/]+\.xml$/i.test(ruta)) hojas++;
        total += real;
        p += 46 + largo + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    }
    if (hojas > TOPES_ZIP.hojas) return `Ese Excel tiene demasiadas hojas (máximo ${TOPES_ZIP.hojas}). Dejá solo la de la lista.`;
    if (total > TOPES_ZIP.descomprimido) return GRANDE;
    return null;
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
    const problema = revisarZip(await archivo.arrayBuffer());
    if (problema) throw new Error(problema);
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

/** Arma el Excel y lo entrega (en la demo, la hoja de mostrarArchivoDeDemo). "nombre" sin extensión: "Stock del kiosco". */
export async function bajarExcel(nombre, filas, opciones = {}) {
    try {
        const blob = await armarExcel(filas, opciones);
        return entregarArchivo(blob, nombreDeArchivo(nombre, "xlsx"));
    } catch (e) {
        aviso(mensajeDe(e), "error");
        return null;
    }
}

// Encontrar columnas y leer precios de lo que vino en el Excel: en tablas.js (sin pantalla, para los datos)
export { columnasDe, numeroDe, textoParaComparar } from "./tablas.js?v=d5f06e834f";
