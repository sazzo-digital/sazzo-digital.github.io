// ============================================
// Un papel en PDF (presupuesto, recibo, orden) armado en el celular, para bajarlo o mandarlo por WhatsApp:
//   const blob = await armarPdf({
//       negocio: "Taller Gómez", titulo: "Presupuesto", numero: "104", fecha: "09/10/2026", acento: "#FB923C",
//       datos: [["Cliente", "Silvia"], ["Vehículo", "Gol · AB 123 CD"]], texto: "Motivo: hace ruido al frenar",
//       columnas: ["Detalle", "Cant.", "Precio", "Subtotal"], filas: [["Pastillas", "1", "$ 45.000", "$ 45.000"]],
//       total: "$ 187.000", aviso: "Presupuesto · no válido como factura", firma: { imagen, aclaracion: "Silvia" },
//       pie: "Hecho con Sazzo Taller (demo)"
//   });
//   pdfListo(blob, "Presupuesto N° 104")   // ventanita Compartir / Descargar
// Siempre lleva "DEMO · datos inventados" cruzado. Letra Helvetica del PDF (sin bajar letras): los textos se
// pasan a los caracteres que esa letra tiene (tildes, ñ, ¿¡, °, comillas sí; emojis no).
// Librería: jsPDF (kit\libs\, MIT, ~410 KB), se baja recién al tocar el botón.
// ============================================
import { cargarLibreria, entregarArchivo, nombreDeArchivo } from "./archivos.js?v=e4d4e57de1";
import { esFirma } from "./firma.js?v=e4d4e57de1";

const TOPE_TEXTO = 600;
const TOPE_FILAS = 200;

// Lo que la letra del PDF sabe escribir (Windows-1252); lo demás se saca
const NO_ESCRIBIBLE = /[^\n\x20-\x7e -ÿŒœŠšŸŽžƒˆ˜–—‘-‚“-„†-•…‰‹›€™]/g;

/** Un texto listo para el PDF: sin caracteres que la letra no tiene y con tope de largo. */
export const paraPdf = (t, tope = TOPE_TEXTO) => String(t ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(NO_ESCRIBIBLE, "").slice(0, tope);

const aRGB = (hex) => {
    const n = /^#[0-9a-f]{6}$/i.test(hex) ? Number.parseInt(hex.slice(1), 16) : 0x333333;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** El color de la demo en este momento (también si la persona lo cambió con "Probala con tus colores"), en #rrggbb. */
export function colorDelTema() {
    try {
        const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "#333333";
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primario").trim() || "#333333";
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    } catch {
        return "#333333";
    }
}

export async function armarPdf({
    negocio = "", titulo = "", numero = "", fecha = "", acento = colorDelTema(),
    datos = [], texto = "", columnas = [], filas = [], total = "", aviso = "", firma = null, pie = ""
} = {}) {
    if (filas.length > TOPE_FILAS) throw new Error(`Demasiados renglones para el papel (máximo ${TOPE_FILAS}).`);
    const { jsPDF } = await cargarLibreria("jspdf.umd.min.js", "jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true }); // comprimido: viaja liviano por WhatsApp
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 16;
    const util = ancho - margen * 2;
    const color = aRGB(acento);
    doc.setProperties({ title: paraPdf(`${titulo} ${numero}`.trim(), 120), creator: "Sazzo (demo)" });

    const marcaDeAgua = () => {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.setFont("helvetica", "bold");
        doc.setFontSize(46);
        doc.setTextColor(200, 30, 30);
        doc.text("DEMO · datos inventados", ancho / 2, alto / 2, { align: "center", angle: 30 });
        doc.restoreGraphicsState();
        doc.setTextColor(17, 17, 17);
    };
    let y = margen;
    const paginaNueva = () => {
        doc.addPage();
        marcaDeAgua();
        y = margen;
    };
    const lugar = (mm) => {
        if (y + mm > alto - margen - 8) paginaNueva();
    };
    marcaDeAgua();

    // Cabeza: el negocio a la izquierda; el papel, su número y la fecha a la derecha; una raya del color de la demo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(doc.splitTextToSize(paraPdf(negocio, 80), util * 0.6)[0] ?? "", margen, y + 6);
    doc.setFontSize(13);
    doc.text(paraPdf([titulo, numero && `N° ${numero}`].filter(Boolean).join(" "), 60), ancho - margen, y + 5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    if (pie) doc.text(paraPdf(pie, 80), margen, y + 11);
    if (fecha) doc.text(paraPdf(fecha, 30), ancho - margen, y + 11, { align: "right" });
    doc.setTextColor(17, 17, 17);
    y += 15;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.8);
    doc.line(margen, y, ancho - margen, y);
    y += 7;

    // Datos (rótulo chico arriba, valor abajo), de a tres por renglón
    const porFila = 3;
    const anchoDato = util / porFila;
    for (let i = 0; i < Math.min(datos.length, 12); i += porFila) {
        lugar(12);
        datos.slice(i, i + porFila).forEach(([rotulo, valor], j) => {
            const x = margen + j * anchoDato;
            doc.setFontSize(7.5);
            doc.setTextColor(100, 100, 100);
            doc.text(paraPdf(rotulo, 40).toUpperCase(), x, y);
            doc.setFontSize(10.5);
            doc.setTextColor(17, 17, 17);
            doc.setFont("helvetica", "bold");
            doc.text(doc.splitTextToSize(paraPdf(valor, 120), anchoDato - 3)[0] ?? "", x, y + 5);
            doc.setFont("helvetica", "normal");
        });
        y += 12;
    }

    // Texto libre (motivo, diagnóstico, condiciones)
    if (texto) {
        doc.setFontSize(10);
        for (const renglon of doc.splitTextToSize(paraPdf(texto), util)) {
            lugar(5);
            doc.text(renglon, margen, y);
            y += 5;
        }
        y += 3;
    }

    // La tabla: la primera columna se lleva el lugar que sobra y corta en renglones; las otras, a la derecha
    if (columnas.length && filas.length) {
        const angostas = Math.max(columnas.length - 1, 0);
        const anchoAngosta = angostas ? Math.min(30, (util * 0.55) / angostas) : 0;
        const anchoPrimera = util - anchoAngosta * angostas;
        const xDe = (j) => (j === 0 ? margen + 1 : margen + anchoPrimera + anchoAngosta * j - 1);
        const cabeza = () => {
            doc.setFillColor(...color.map((c) => Math.round(c + (255 - c) * 0.85)));
            doc.rect(margen, y - 4.5, util, 7, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            columnas.forEach((c, j) => doc.text(paraPdf(c, 30), xDe(j), y, j ? { align: "right" } : undefined));
            doc.setFont("helvetica", "normal");
            y += 7;
        };
        lugar(14);
        cabeza();
        doc.setFontSize(10);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        for (const fila of filas) {
            const renglones = doc.splitTextToSize(paraPdf(fila[0], 200), anchoPrimera - 3);
            const altoFila = renglones.length * 4.6 + 2;
            if (y + altoFila > alto - margen - 8) {
                paginaNueva();
                cabeza();
                doc.setFontSize(10);
            }
            doc.text(renglones, xDe(0), y);
            fila.slice(1, columnas.length).forEach((c, j) => doc.text(paraPdf(c, 30), xDe(j + 1), y, { align: "right" }));
            y += altoFila - 2;
            doc.line(margen, y, ancho - margen, y);
            y += 4.5;
        }
        if (total) {
            lugar(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12.5);
            doc.text("Total", margen + 1, y + 1);
            doc.text(paraPdf(total, 30), ancho - margen - 1, y + 1, { align: "right" });
            doc.setFont("helvetica", "normal");
            y += 9;
        }
    }

    // La firma: la imagen sobre una raya, con la aclaración abajo
    if (firma && esFirma(firma.imagen)) {
        lugar(36);
        y += 4;
        const x = ancho - margen - 70;
        doc.addImage(firma.imagen, "PNG", x + 5, y, 60, 20);
        y += 22;
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.3);
        doc.line(x, y, x + 70, y);
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(paraPdf(firma.aclaracion ? `Firma: ${firma.aclaracion}` : "Firma", 60), x + 35, y + 4.5, { align: "center" });
        doc.setTextColor(17, 17, 17);
        y += 10;
    }

    if (aviso) {
        lugar(10);
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        doc.text(paraPdf(aviso, 120), ancho / 2, y, { align: "center" });
        doc.setTextColor(17, 17, 17);
        doc.setFont("helvetica", "normal");
    }
    return doc.output("blob");
}

/** El PDF ya armado: Compartir (WhatsApp, mail…) o Descargar. */
export function pdfListo(blob, nombre) {
    return entregarArchivo(blob, nombreDeArchivo(nombre, "pdf"), { titulo: "Tu PDF está listo", texto: nombre });
}
