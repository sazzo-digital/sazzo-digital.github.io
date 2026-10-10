// ============================================
// Archivos del Libro IVA Digital (los .txt de ancho fijo que se importan en ARCA): comprobantes y alícuotas de
// ventas y de compras. En la demo son DE PRUEBA (datos inventados): sirven para mostrar que el sistema los arma.
// Largos por renglón: ventas 266 y 62; compras 325 y 84 (se controlan en las pruebas).
// Números: a la derecha con ceros, en centavos. Textos: a la izquierda con espacios, en mayúsculas y sin tildes.
// ============================================
import { COMPROBANTES, ALICUOTAS, ORDEN_ALICUOTAS } from "./reglas.js?v=3ddc591303";

const num = (n, largo) => String(Math.max(0, Math.round(n))).padStart(largo, "0").slice(-largo);
const txt = (t, largo) =>
    String(t ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\x20-\x7E]/g, " ")
        .toUpperCase()
        .padEnd(largo, " ")
        .slice(0, largo);
const fecha = (iso) => iso.replaceAll("-", "");
const CODIGO_COMPRA = { A: 1, B: 6, C: 11 };

function documentoDe(r) {
    if (r?.cuit) return { codigo: 80, numero: r.cuit };
    if (r?.doc) return { codigo: r.doc.length === 11 ? 80 : 96, numero: r.doc };
    return { codigo: 99, numero: "0" };
}

/** Ventas: { cbte, alicuotas } (cada uno un texto con renglones separados por CRLF). */
export function libroDigitalVentas(comprobantes) {
    const cbte = [];
    const alic = [];
    for (const c of comprobantes) {
        const t = COMPROBANTES[c.tipo];
        const doc = documentoDe(c.receptor);
        const grupos = ORDEN_ALICUOTAS.filter((a) => c.grupos?.[a]);
        const lista = grupos.length ? grupos : t.letra === "C" ? [] : ["0"];
        cbte.push(
            fecha(c.fecha) + num(t.codigo, 3) + num(c.puntoVenta, 5) + num(c.numero, 20) + num(c.numero, 20) +
            num(doc.codigo, 2) + num(Number(doc.numero), 20) + txt(doc.codigo === 99 ? "CONSUMIDOR FINAL" : c.receptor.nombre, 30) +
            num(c.total, 15) + num(0, 15) + num(0, 15) + num(c.exento, 15) + num(0, 15) + num(0, 15) + num(0, 15) + num(0, 15) +
            "PES" + "0001000000" + num(lista.length, 1) + (grupos.length ? "0" : c.exento ? "E" : "0") + num(0, 15) + num(0, 8)
        );
        for (const a of lista) {
            const g = c.grupos?.[a] ?? { neto: 0, iva: 0 };
            alic.push(num(t.codigo, 3) + num(c.puntoVenta, 5) + num(c.numero, 20) + num(g.neto, 15) + num(ALICUOTAS[a].id, 4) + num(g.iva, 15));
        }
    }
    return { cbte: cbte.join("\r\n"), alicuotas: alic.join("\r\n") };
}

/** Compras: { cbte, alicuotas }. Las B y C no discriminan IVA (sin renglones de alícuotas). */
export function libroDigitalCompras(compras) {
    const cbte = [];
    const alic = [];
    for (const c of compras) {
        if (c.anulada) continue;
        const grupos = c.letra === "A" ? ORDEN_ALICUOTAS.filter((a) => c.grupos?.[a]) : [];
        cbte.push(
            fecha(c.fecha) + num(CODIGO_COMPRA[c.letra], 3) + num(c.puntoVenta, 5) + num(c.numero, 20) + txt("", 16) +
            num(80, 2) + num(Number(c.emisor.cuit), 20) + txt(c.emisor.nombre, 30) +
            num(c.total, 15) + num(c.letra === "A" ? c.noGravado : 0, 15) + num(0, 15) + num(c.percepIva, 15) + num(0, 15) + num(c.percepIibb, 15) + num(0, 15) + num(0, 15) +
            "PES" + "0001000000" + num(grupos.length, 1) + "0" + num(c.letra === "A" ? c.iva : 0, 15) + num(0, 15) + num(0, 11) + txt("", 30) + num(0, 15)
        );
        for (const a of grupos) {
            const g = c.grupos[a];
            alic.push(num(CODIGO_COMPRA[c.letra], 3) + num(c.puntoVenta, 5) + num(c.numero, 20) + num(80, 2) + num(Number(c.emisor.cuit), 20) + num(g.neto, 15) + num(ALICUOTAS[a].id, 4) + num(g.iva, 15));
        }
    }
    return { cbte: cbte.join("\r\n"), alicuotas: alic.join("\r\n") };
}

/** Baja un texto como archivo .txt. */
export function bajarTexto(nombre, texto) {
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=windows-1252" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
