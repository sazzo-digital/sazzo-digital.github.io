// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Silvina hace una factura → a Hernán (el dueño) y a Patricia (la contadora) les salta "Silvina facturó".
//   Alguien carga una compra a mano → a la contadora le salta "Cargaron una compra" (para el libro de IVA).
// Quién lo hizo sale del "hechoPor" de cada comprobante. Acá solo se dice qué pasó y a quién le importa; el kit decide
// qué es nuevo para cada uno.
// ============================================
import { PERSONAS } from "../marca.js?v=3ddc591303";
import { COMPROBANTES, numeroComprobante, pesos } from "../reglas.js?v=3ddc591303";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const empresa = db.empresas?.find((e) => e.id === db.empresaActual) ?? db.empresas?.[0];
    if (!empresa) return [];
    const nombre = (id) => PERSONAS.find((p) => p.id === id)?.nombre ?? "Alguien";
    const avisos = [];
    for (const c of empresa.comprobantes ?? []) {
        if (!c.hechoPor) continue;
        const tipo = COMPROBANTES[c.tipo]?.nombre ?? "Comprobante";
        avisos.push({
            id: `comprobante-${c.id}`, estado: "hecho", para: ["dueno", "contadora", "admin"], de: c.hechoPor,
            titulo: `${nombre(c.hechoPor)} facturó`, linea: `${tipo} ${numeroComprobante(c.puntoVenta, c.numero)}`,
            chico: `${c.receptor?.nombre ?? ""} · ${pesos(c.total)}`.replace(/^ · /, ""),
            boton: "Verla", ruta: `/facturar/${c.id}`, menu: "/facturar", icono: "ti-file-invoice", tono: "bien"
        });
    }
    for (const c of empresa.compras ?? []) {
        if (!c.hechoPor || c.origen !== "manual" || c.anulada) continue;
        avisos.push({
            id: `compra-${c.id}`, estado: "cargada", para: ["contadora"], de: c.hechoPor,
            titulo: `${nombre(c.hechoPor)} cargó una compra`, linea: c.proveedor?.nombre ?? c.emisor?.nombre ?? "Compra a mano",
            chico: `${pesos(c.total)} · va al libro de IVA compras`,
            boton: "Ver compras", ruta: "/compras", icono: "ti-receipt"
        });
    }
    return avisos;
}
