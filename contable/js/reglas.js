// ============================================
// Reglas fiscales de Sazzo Contable (sin datos ni pantallas: funciones puras, fáciles de probar).
// Son la base de las del proyecto completo. Lo de ARCA sigue lo que ya está probado en Restix: factura A, B o C
// según el emisor y el receptor, códigos de comprobante y de alícuota de ARCA, IVA contenido en la B (Ley 27.743)
// y tope de consumidor final para identificar al comprador.
//
// La plata va SIEMPRE en centavos (números enteros): así nunca hay errores de redondeo al sumar.
// En la demo el CAE es simulado: empieza con "00" y nada tiene validez fiscal.
// ============================================

export const CONDICIONES = {
    RI: { id: 1, texto: "Responsable Inscripto", corto: "RI" },
    MT: { id: 6, texto: "Monotributo", corto: "Monotributo" },
    EX: { id: 4, texto: "IVA Exento", corto: "Exento" },
    CF: { id: 5, texto: "Consumidor Final", corto: "Cons. final" }
};

// Alícuotas de IVA (id de ARCA). porMil: 21 % = 210 por mil (enteros, sin decimales). "ex" = exento.
export const ALICUOTAS = {
    21: { id: 5, porMil: 210, texto: "21 %" },
    10.5: { id: 4, porMil: 105, texto: "10,5 %" },
    27: { id: 6, porMil: 270, texto: "27 %" },
    5: { id: 8, porMil: 50, texto: "5 %" },
    2.5: { id: 9, porMil: 25, texto: "2,5 %" },
    0: { id: 3, porMil: 0, texto: "0 %" },
    ex: { id: null, porMil: 0, texto: "Exento" }
};
export const ORDEN_ALICUOTAS = ["21", "10.5", "27", "5", "2.5", "0"]; // las que llevan IVA (exento va aparte)
export const esAlicuota = (a) => Object.hasOwn(ALICUOTAS, String(a));

// Comprobantes (código de ARCA). clase: "factura" o "nc" (nota de crédito, resta).
export const COMPROBANTES = {
    FA: { codigo: 1, letra: "A", clase: "factura", nombre: "Factura A", corto: "FA" },
    FB: { codigo: 6, letra: "B", clase: "factura", nombre: "Factura B", corto: "FB" },
    FC: { codigo: 11, letra: "C", clase: "factura", nombre: "Factura C", corto: "FC" },
    NCA: { codigo: 3, letra: "A", clase: "nc", nombre: "Nota de crédito A", corto: "NCA" },
    NCB: { codigo: 8, letra: "B", clase: "nc", nombre: "Nota de crédito B", corto: "NCB" },
    NCC: { codigo: 13, letra: "C", clase: "nc", nombre: "Nota de crédito C", corto: "NCC" }
};
export const NC_DE = { FA: "NCA", FB: "NCB", FC: "NCC" };
export const signo = (tipo) => (COMPROBANTES[tipo]?.clase === "nc" ? -1 : 1);

// Desde este total, una factura B a consumidor final tiene que identificar al comprador (RG 5700/2025)
export const TOPE_CF_IDENTIFICAR = 10_000_000 * 100;

// ---------- CUIT ----------
const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const PREFIJOS_CUIT = ["20", "23", "24", "27", "30", "33", "34"];

/** El dígito verificador de los primeros 10 números, o null si da 10 (ese CUIT no existe). */
export function digitoCuit(diez) {
    const suma = [...diez].reduce((s, d, i) => s + Number(d) * PESOS_CUIT[i], 0);
    const r = 11 - (suma % 11);
    return r === 11 ? 0 : r === 10 ? null : r;
}

/** Solo los números de un CUIT escrito con o sin guiones ("30-12345678-9" → "30123456789"). */
export const soloNumeros = (texto) => String(texto ?? "").replace(/[\s.-]/g, "");

export function esCuitValido(texto) {
    const n = soloNumeros(texto);
    if (!/^\d{11}$/.test(n) || !PREFIJOS_CUIT.includes(n.slice(0, 2))) return false;
    return digitoCuit(n.slice(0, 10)) === Number(n[10]);
}

/** Revisa el CUIT y lo devuelve solo con números; si no sirve, el error dice por qué. */
export function revisarCuit(texto, que = "El CUIT") {
    const n = soloNumeros(texto);
    if (n.length > 20) throw new Error(`${que} tiene 11 números (llegaron demasiados).`);
    if (!/^\d{11}$/.test(n)) throw new Error(`${que} tiene que tener 11 números (ej: 30-12345678-9).`);
    if (!esCuitValido(n)) throw new Error(`${que} no es válido: revisá los números (el último no coincide).`);
    return n;
}

export const formatoCuit = (n) => (n && n.length === 11 ? `${n.slice(0, 2)}-${n.slice(2, 10)}-${n[10]}` : "");

/** Un CUIT de ejemplo que no puede ser de nadie: prefijo + 8 números que empiezan con ceros. */
export function cuitDeEjemplo(prefijo, numero) {
    for (let k = numero; k < numero + 50; k++) {
        const diez = prefijo + String(k).padStart(8, "0");
        const d = digitoCuit(diez);
        if (d !== null) return diez + d;
    }
    throw new Error("No se pudo armar un CUIT de ejemplo.");
}

// ---------- Qué comprobante corresponde ----------
/**
 * Emisor Responsable Inscripto: A a inscriptos y monotributistas (con CUIT), B a consumidor final y exentos.
 * Emisor monotributista o exento: siempre C.
 */
export function tipoFactura(emisor, receptor) {
    if (emisor !== "RI") return "FC";
    return receptor === "RI" || receptor === "MT" ? "FA" : "FB";
}

// ---------- Plata ----------
/** "$ 1.234,56" (los centavos se muestran siempre). */
export function pesos(centavos) {
    const n = Number(centavos) || 0;
    const texto = (Math.abs(n) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n < 0 ? "-" : ""}$ ${texto}`;
}

/** "$ 1.234" (sin centavos, para tableros y gráficos). */
export const pesosRedondo = (centavos) => {
    const n = Math.round((Number(centavos) || 0) / 100);
    return `${n < 0 ? "-" : ""}$ ${Math.abs(n).toLocaleString("es-AR")}`;
};

/**
 * Un importe escrito por alguien ("1.234,56", "1234.5" o un número) pasado a centavos, con tope.
 * desde/hasta van en pesos. Más de 2 decimales se redondea.
 */
export function aCentavos(valor, que, { desde = 0.01, hasta }) {
    let n = valor;
    if (typeof valor === "string") {
        let t = valor.trim().replace(/\$|\s/g, "");
        if (t.length > 20) throw new Error(`${que}: el número es demasiado largo.`);
        // Como se escribe acá: "1.234,56" (punto de miles, coma decimal) o "50.000" (solo puntos de miles).
        // "1234.5" (un punto que no separa miles) se toma como decimal.
        if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
        else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
        n = t === "" ? NaN : Number(t);
    }
    if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${que} tiene que ser un número.`);
    if (n < desde || n > hasta) {
        throw new Error(`${que} tiene que ser de ${pesos(Math.round(desde * 100))} a ${pesos(Math.round(hasta * 100))}.`);
    }
    return Math.round(n * 100);
}

// ---------- Cálculo de un comprobante ----------
/**
 * Un renglón: cantidad × precio, separado en neto e IVA según la letra.
 * A: el precio es sin IVA (se suma). B: el precio es final, con IVA adentro (se separa). C: sin IVA.
 */
export function calcularRenglon({ cantidad, precio, alicuota }, letra) {
    const bruto = cantidad * precio;
    if (letra === "C") return { neto: bruto, iva: 0, exento: 0, total: bruto };
    if (String(alicuota) === "ex") return { neto: 0, iva: 0, exento: bruto, total: bruto };
    const porMil = ALICUOTAS[alicuota].porMil;
    if (letra === "B") {
        const neto = Math.round((bruto * 1000) / (1000 + porMil));
        return { neto, iva: bruto - neto, exento: 0, total: bruto };
    }
    const iva = Math.round((bruto * porMil) / 1000);
    return { neto: bruto, iva, exento: 0, total: bruto + iva };
}

/** Todo el comprobante: cada renglón calculado, los grupos por alícuota (para el libro de IVA) y los totales. */
export function calcularComprobante(renglones, letra) {
    const calculados = renglones.map((r) => ({ ...r, ...calcularRenglon(r, letra) }));
    const grupos = {};
    let neto = 0;
    let iva = 0;
    let exento = 0;
    for (const r of calculados) {
        neto += r.neto;
        iva += r.iva;
        exento += r.exento;
        if (letra !== "C" && String(r.alicuota) !== "ex") {
            const g = (grupos[String(r.alicuota)] ??= { neto: 0, iva: 0 });
            g.neto += r.neto;
            g.iva += r.iva;
        }
    }
    return { renglones: calculados, grupos, neto, iva, exento, total: neto + iva + exento };
}

/**
 * Lo que le corresponde a una nota de crédito por `monto` (con IVA) de lo que queda de una factura.
 * `restante` = { grupos, exento, total } que todavía no se acreditó. Reparte en proporción; si es todo lo que
 * queda, toma exacto lo restante (así la suma de las notas da justo la factura, sin centavos sueltos).
 */
export function repartirNotaCredito(restante, monto) {
    if (monto === restante.total) {
        const grupos = structuredClone(restante.grupos);
        const neto = Object.values(grupos).reduce((s, g) => s + g.neto, 0);
        const iva = Object.values(grupos).reduce((s, g) => s + g.iva, 0);
        return { grupos, neto, iva, exento: restante.exento, total: restante.total };
    }
    const grupos = {};
    for (const [a, g] of Object.entries(restante.grupos)) {
        const totalGrupo = Math.round(((g.neto + g.iva) * monto) / restante.total);
        const n = Math.round((totalGrupo * 1000) / (1000 + ALICUOTAS[a].porMil));
        grupos[a] = { neto: n, iva: totalGrupo - n };
    }
    let exento = Math.round((restante.exento * monto) / restante.total);
    // Los centavos que sobran o faltan por redondear van al último grupo (o al exento si no hay grupos)
    const suma = () => Object.values(grupos).reduce((s, g) => s + g.neto + g.iva, 0) + exento;
    const claves = Object.keys(grupos);
    if (claves.length) grupos[claves.at(-1)].neto += monto - suma();
    else exento += monto - suma();
    const neto = Object.values(grupos).reduce((s, g) => s + g.neto, 0);
    const iva = Object.values(grupos).reduce((s, g) => s + g.iva, 0);
    return { grupos, neto, iva, exento, total: monto };
}

// ---------- ARCA simulado ----------
/** CAE de prueba: 14 números que empiezan con "00" (uno real nunca), siempre el mismo para el mismo comprobante. */
export function caeSimulado(cuit, codigo, puntoVenta, numero) {
    let h = 2166136261;
    for (const c of `${cuit}|${codigo}|${puntoVenta}|${numero}`) {
        h ^= c.charCodeAt(0);
        h = Math.imul(h, 16777619) >>> 0;
    }
    const doce = String(h).padStart(10, "0") + String((h % 97) + 2).padStart(2, "0");
    return `00${doce.slice(-12)}`;
}

/** "00003-00001234" */
export const numeroComprobante = (puntoVenta, numero) =>
    `${String(puntoVenta).padStart(5, "0")}-${String(numero).padStart(8, "0")}`;

// ---------- Fechas y períodos ----------
const dos = (n) => String(n).padStart(2, "0");
export const fechaISO = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
export const periodoDe = (fecha) => fecha.slice(0, 7);

/** El período (AAAA-MM) corrido `meses` meses desde `periodo`. */
export function correrPeriodo(periodo, meses) {
    const [a, m] = periodo.split("-").map(Number);
    const d = new Date(a, m - 1 + meses, 1);
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}`;
}

export const periodoActual = () => periodoDe(fechaISO(new Date()));

/** Los últimos `cantidad` períodos, del más viejo al actual. */
export function ultimosPeriodos(cantidad, hasta = periodoActual()) {
    return Array.from({ length: cantidad }, (_, i) => correrPeriodo(hasta, i - cantidad + 1));
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombrePeriodo = (periodo) => {
    const [a, m] = periodo.split("-").map(Number);
    return `${MESES[m - 1]} ${a}`;
};
export const mesCorto = (periodo) => MESES[Number(periodo.slice(5, 7)) - 1].slice(0, 3);

export function sumarDias(fecha, dias) {
    const [a, m, d] = fecha.split("-").map(Number);
    return fechaISO(new Date(a, m - 1, d + dias));
}

/**
 * Vencimiento aproximado del IVA mensual (F. 2002) de un período: el mes siguiente, del 18 al 22 según la terminación
 * del CUIT; si cae sábado o domingo, pasa al lunes. (Aproximado: no cuenta feriados; el real sale del calendario de ARCA.)
 */
export function vencimientoIva(periodo, cuit) {
    const dia = { 0: 18, 1: 18, 2: 19, 3: 19, 4: 20, 5: 20, 6: 21, 7: 21, 8: 22, 9: 22 }[Number(String(cuit).slice(-1)) || 0];
    const [a, m] = correrPeriodo(periodo, 1).split("-").map(Number);
    const f = new Date(a, m - 1, dia);
    if (f.getDay() === 6) f.setDate(f.getDate() + 2);
    if (f.getDay() === 0) f.setDate(f.getDate() + 1);
    return fechaISO(f);
}
