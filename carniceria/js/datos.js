// ============================================
// Datos de Sazzo Carnicería (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una carnicería de barrio inventada: 47 artículos sin marcas (vaca, cerdo, pollo, achuras, elaborados y parrilla),
// 3 proveedores inventados, los despostes de las últimas 2 semanas (y uno de hoy a medio pesar), pedidos de clientes
// y las ventas de los últimos 7 días.
// Pesos: siempre en GRAMOS enteros (1,625 kg = 1625): sin restos de coma. Precios: por kilo (o por unidad).
// Desposte: entra una media res (o un cajón de pollo) con su peso y su costo por kilo; se pesa cada corte, el hueso
// y la grasa; lo que falta hasta el peso de ingreso es el oreo. Merma = hueso + grasa + oreo. El costo total se
// reparte entre los cortes según lo que vale cada uno (el lomo carga más que el osobuco) → costo real por kilo →
// precio sugerido con el margen del dueño.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Las ventas guardan el precio y el costo del momento. Si cambia la forma de los datos, subir VERSION_DATOS.
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=ece442dfab";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=ece442dfab";
import { diaLocalDe, fechaLocalISO } from "../kit/js/fechas.js?v=ece442dfab";
import { filtrarPorTexto, comoSuena } from "../kit/js/buscar.js?v=ece442dfab";
import { MARCA, NEGOCIO, buscarPersona } from "./marca.js?v=ece442dfab";

export const VERSION_DATOS = 1;

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    gramosMin: 10, // 10 g: lo mínimo que se vende por peso
    gramos: 50_000, // 50 kg en un renglón (una media res entera no se vende en el mostrador)
    plataMin: 100, // "$100 de picada"
    plata: 1_000_000,
    precio: 1_000_000, // por kilo o por unidad
    costo: 1_000_000,
    margen: 300, // %
    unidades: 99,
    renglones: 30, // por ticket o pedido
    pagaCon: 10_000_000,
    aumentoMin: -50,
    aumentoMax: 100,
    stockKg: 9_999, // kilos (o unidades) de un artículo
    aclaracion: 60,
    nombre: 40,
    para: 40,
    tropa: 12,
    ingresoKgMin: 1,
    ingresoKg: 400, // una media res pesa ~110 kg; un cuarto, ~55
    corteKg: 200,
    contado: 10_000_000,
    articulos: 200,
    ventas: 2000,
    pedidos: 300,
    despostes: 300,
    cambios: 300,
    cierres: 300
};

export const FONDO_CAJA = 20_000; // el cambio con el que arranca el cajón cada día
export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta" };
export const ALIAS = "la.tranquera.carnes"; // de ejemplo: al cobrar con transferencia se copia con un toque

export const ANIMALES = [
    { id: "vaca", nombre: "Vaca", icono: "ti-meat", margen: 35 },
    { id: "cerdo", nombre: "Cerdo", icono: "ti-pig", margen: 35 },
    { id: "pollo", nombre: "Pollo", icono: "ti-feather", margen: 30 },
    { id: "achuras", nombre: "Achuras", icono: "ti-flame", margen: 40 },
    { id: "elaborados", nombre: "Elaborados", icono: "ti-tools-kitchen-2", margen: 45 },
    { id: "parrilla", nombre: "Parrilla y granja", icono: "ti-grill-fork", margen: 35 }
];
export const nombreAnimal = (id) => ANIMALES.find((a) => a.id === id)?.nombre ?? "Otros";

export const PROVEEDORES = [
    { id: "pr-norte", nombre: "Frigorífico Norte" },
    { id: "pr-sur", nombre: "Frigorífico del Sur" },
    { id: "pr-pinos", nombre: "Granja Los Pinos" }
];

/**
 * Lo que entra para despostar. `merma`: lo esperado de hueso, grasa y oreo (en % del peso de ingreso). El rinde
 * esperado de cada corte está en el artículo (`rinde`). Hueso + grasa + oreo + los cortes = 100 %.
 */
export const TIPOS_INGRESO = {
    "media-res": { nombre: "Media res", animal: "vaca", pesoTipico: 110, costoTipico: 8_400, merma: { hueso: 16.5, grasa: 5, oreo: 1.5 }, hueso: "Hueso", proveedores: ["pr-norte", "pr-sur"] },
    "media-cerdo": { nombre: "Media res de cerdo", animal: "cerdo", pesoTipico: 45, costoTipico: 5_000, merma: { hueso: 18, grasa: 10, oreo: 2 }, hueso: "Hueso", proveedores: ["pr-norte", "pr-sur"] },
    "cajon-pollo": { nombre: "Cajón de pollo", animal: "pollo", pesoTipico: 20, costoTipico: 3_200, merma: { hueso: 18, grasa: 0, oreo: 2 }, hueso: "Carcasa", proveedores: ["pr-pinos"] }
};
export const mermaEsperada = (tipo) => {
    const m = TIPOS_INGRESO[tipo]?.merma ?? { hueso: 0, grasa: 0, oreo: 0 };
    return m.hueso + m.grasa + m.oreo;
};

/** Cuánto por debajo de lo esperado tiene que dar un corte para marcarlo ("dio de menos"). */
export const AVISO_RINDE = 0.1; // 10 %

export const ESTADOS_PEDIDO = { nuevo: "Para preparar", listo: "Listo para retirar", entregado: "Retirado", anulado: "Anulado" };
export const RETIROS = ["Lo antes posible", "11:30", "12:00", "12:30", "13:00", "18:30", "19:30", "20:30"];

/** El combo del asado: cuánto lleva por persona (g, o unidades cada tantas personas). */
export const COMBO_ASADO = {
    personas: [4, 6, 8],
    items: [
        { nombre: "Asado", gramos: 250 },
        { nombre: "Vacío", gramos: 120 },
        { nombre: "Chorizo", gramos: 100 },
        { nombre: "Morcilla", gramos: 60 },
        { nombre: "Provoleta", cadaPersonas: 4 },
        { nombre: "Carbón 4 kg", cadaPersonas: 4 }
    ]
};

// Cómo pide la gente → cómo se llama en la carnicería (el buscador entiende las dos)
export const SINONIMOS = {
    molida: "picada", carne: "picada", milanga: "milanesas", milangas: "milanesas", chori: "chorizo", choris: "chorizo",
    morci: "morcilla", costilla: "asado", costillar: "asado", tira: "asado", colita: "colita de cuadril",
    tapa: "tapa de asado", muslo: "pata muslo", pata: "pata muslo", alas: "alitas", riñon: "riñon", chinchu: "chinchulines",
    hamburguesa: "hamburguesas", carbon: "carbon", huevo: "huevos", queso: "provoleta"
};

// ---------- Etiqueta de la balanza ----------
// La balanza imprime un código EAN-13 que empieza con 2 (de uso interno): prefijo + código del corte (PLU) + el peso
// en gramos (o el importe) + dígito verificador. El largo de cada parte cambia según la balanza: se configura acá.
export const ETIQUETA = { prefijo: "20", plu: 5, valor: 5, valorEs: "peso" };

/** El dígito verificador de un EAN-13 (con los 12 primeros números). */
export function digitoEAN(doce) {
    const suma = [...String(doce)].reduce((t, d, i) => t + Number(d) * (i % 2 ? 3 : 1), 0);
    return String((10 - (suma % 10)) % 10);
}

/** Lee una etiqueta de balanza: { plu, gramos } (o { plu, importe }); null si no es una etiqueta válida. */
export function leerEtiqueta(codigo, formato = ETIQUETA) {
    const c = String(codigo ?? "").trim();
    const largo = formato.prefijo.length + formato.plu + formato.valor + 1;
    if (largo !== 13 || !/^\d{13}$/.test(c) || !c.startsWith(formato.prefijo)) return null;
    if (digitoEAN(c.slice(0, 12)) !== c[12]) return null;
    const desde = formato.prefijo.length;
    const plu = Number(c.slice(desde, desde + formato.plu));
    const valor = Number(c.slice(desde + formato.plu, desde + formato.plu + formato.valor));
    if (!plu || !valor) return null;
    return formato.valorEs === "importe" ? { plu, importe: valor } : { plu, gramos: valor };
}

/** Arma el código de una etiqueta (para las etiquetas de ejemplo). */
export function armarEtiqueta(plu, gramos, formato = ETIQUETA) {
    const doce = formato.prefijo + String(plu).padStart(formato.plu, "0") + String(gramos).padStart(formato.valor, "0");
    exigir(/^\d{12}$/.test(doce), "Ese código o ese peso no entran en la etiqueta.");
    return doce + digitoEAN(doce);
}

// ---------- Pesos y precios ----------

/** "$ 12.500" */
export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** "1,625 kg" (o con menos decimales: kilos(12400, 1) → "12,4 kg"). */
export const kilos = (gramos, decimales = 3) =>
    `${(gramos / 1000).toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} kg`;

/**
 * Kilos escritos ("1,625", "1.625", "2") → gramos enteros. Punto o coma = decimales (como la balanza), hasta 3.
 * Devuelve NaN si no se entiende (letras, negativos, "1e3", más de 3 decimales…).
 */
export function aGramos(texto) {
    if (typeof texto === "number") return Number.isFinite(texto) && texto >= 0 ? Math.round(texto * 1000) : NaN;
    const t = String(texto ?? "").trim().replace(/\s*kg$/i, "");
    if (!/^\d{1,5}([.,]\d{1,3})?$/.test(t)) return NaN;
    return Math.round(Number(t.replace(",", ".")) * 1000);
}

/** El precio de un renglón por peso: gramos × precio por kilo, redondeado a $10 (como la balanza). */
export const precioPorPeso = (gramos, precioKg) => Math.max(10, Math.round((gramos * precioKg) / 1000 / 10) * 10);

/** Cuántos gramos cortar para "$8.000 de picada". */
export const gramosPara = (plata, precioKg) => Math.max(1, Math.round((plata * 1000) / precioKg));

/** Redondeo del precio por kilo (o por unidad): para arriba, a $100. */
export function redondearPrecio(precio) {
    const p = Math.round(precio * 100) / 100;
    return Math.max(100, Math.ceil(p / 100) * 100);
}

export const precioConAumento = (precio, porcentaje) => redondearPrecio(precio * (1 + porcentaje / 100));

/** El estado del stock. Los cortes que salen del desposte dicen "hay que despostar"; lo demás, "hay que pedir". */
export const estadoStock = (a) => (a.stock <= 0 ? "sin" : a.stock <= a.minimo ? (a.rinde ? "despostar" : "pedir") : "hay");

/** Sin mayúsculas ni tildes, para buscar ("Vacío" = "vacio"). */
export const normal = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const SINONIMOS_NORMALES = Object.fromEntries(Object.entries(SINONIMOS).map(([k, v]) => [normal(k), normal(v)]));
const SINONIMOS_POR_SONIDO = Object.fromEntries(Object.entries(SINONIMOS_NORMALES).map(([k, v]) => [comoSuena(k), v]));

/** ¿El artículo coincide con lo que se escribió? Por nombre (palabra por palabra, con sinónimos) o por su código. */
export function coincide(a, texto) {
    const t = normal(texto);
    if (!t) return true;
    if (/^\d{1,5}$/.test(t) && String(a.plu) === String(Number(t))) return true;
    const n = normal(a.nombre);
    const esta = (w) => n.includes(w) || (SINONIMOS_NORMALES[w] !== undefined && n.includes(SINONIMOS_NORMALES[w]));
    return esta(t) || t.split(" ").every(esta);
}

/** Lo buscado con cada palabra pasada a como se llama en la carnicería ("chori" → "chorizo"). */
export const conSinonimos = (texto) =>
    normal(texto).split(" ").map((w) => SINONIMOS_NORMALES[w] ?? SINONIMOS_POR_SONIDO[comoSuena(w)] ?? w).join(" ");

// ---------- Datos de fábrica ----------
// Por animal: [PLU, nombre, precio por kilo (o por unidad), stock (kg o unidades), mínimo, { rinde: % esperado de su
// ingreso, rapido: botón grande en Vender, unidad: se vende por unidad }]. Precios de ejemplo (no son de Sazzo).
const CATALOGO = {
    vaca: [
        [101, "Asado", 14_500, 4.2, 3, { rinde: 9, rapido: true }],
        [102, "Vacío", 16_500, 6.5, 2, { rinde: 3.2, rapido: true }],
        [103, "Matambre", 15_500, 3.1, 1, { rinde: 1.6 }],
        [104, "Entraña", 19_000, 1.4, 0.5, { rinde: 0.6 }],
        [105, "Tapa de asado", 13_500, 3.8, 1.5, { rinde: 2.2 }],
        [106, "Falda", 9_500, 5.2, 2, { rinde: 3.4 }],
        [107, "Colita de cuadril", 19_500, 2.2, 1, { rinde: 1 }],
        [108, "Cuadril", 17_500, 4.6, 2, { rinde: 3 }],
        [109, "Nalga", 17_500, 8.4, 3, { rinde: 6, rapido: true }],
        [110, "Cuadrada", 16_500, 5.1, 2, { rinde: 3.6 }],
        [111, "Bola de lomo", 16_000, 5.6, 2, { rinde: 3.6 }],
        [112, "Peceto", 18_500, 2.7, 1, { rinde: 1.6 }],
        [113, "Tortuguita", 11_000, 2.1, 1, { rinde: 1.4 }],
        [114, "Lomo", 23_500, 2.4, 1, { rinde: 1.8 }],
        [115, "Bife ancho", 16_500, 5.4, 2, { rinde: 3.6 }],
        [116, "Bife angosto", 17_500, 6.2, 2, { rinde: 4, rapido: true }],
        [117, "Roast beef", 13_500, 4.4, 2, { rinde: 3.4 }],
        [118, "Paleta", 14_000, 5.8, 2, { rinde: 4.4 }],
        [119, "Carnaza", 13_000, 4.1, 2, { rinde: 3 }],
        [120, "Osobuco", 8_500, 6.3, 2, { rinde: 4.6 }],
        [121, "Picada común", 9_500, 7.6, 3, { rinde: 9, rapido: true }],
        [122, "Picada especial", 13_500, 4.9, 2, { rinde: 3, rapido: true }]
    ],
    cerdo: [
        [201, "Bondiola", 11_500, 3.6, 1.5, { rinde: 7 }],
        [202, "Pechito de cerdo", 9_500, 4.8, 2, { rinde: 13 }],
        [203, "Matambrito de cerdo", 13_000, 1.9, 0.8, { rinde: 2 }],
        [204, "Carré de cerdo", 9_000, 5.3, 2, { rinde: 16 }],
        [205, "Solomillo", 12_500, 1.2, 0.5, { rinde: 2 }],
        [206, "Pulpa de cerdo", 8_500, 7.9, 3, { rinde: 30 }]
    ],
    pollo: [
        [301, "Pata muslo", 4_800, 9.4, 4, { rinde: 40, rapido: true }],
        [302, "Pechuga", 6_500, 6.1, 3, { rinde: 30 }],
        [303, "Alitas", 3_500, 3.2, 1.5, { rinde: 10 }],
        [304, "Pollo entero", 3_900, 14.5, 6, {}],
        [305, "Suprema", 8_900, 3.8, 2, {}]
    ],
    achuras: [
        [401, "Chinchulines", 7_500, 2.3, 1, {}],
        [402, "Mollejas", 21_000, 1.1, 0.5, {}],
        [403, "Riñón", 4_500, 1.6, 0.5, {}],
        [404, "Hígado", 3_500, 2.8, 1, {}]
    ],
    elaborados: [
        [501, "Chorizo", 9_500, 6.4, 3, { rapido: true }],
        [502, "Morcilla", 6_500, 3.3, 1.5, {}],
        [503, "Salchicha parrillera", 8_500, 2.9, 1, {}],
        [504, "Milanesas de nalga", 18_500, 4.1, 2, { rapido: true }],
        [505, "Milanesas de pollo", 9_900, 3.6, 2, {}],
        [506, "Hamburguesas caseras", 11_000, 2.4, 1, {}]
    ],
    parrilla: [
        [601, "Carbón 4 kg", 6_500, 18, 6, { unidad: true }],
        [602, "Provoleta", 4_200, 12, 4, { unidad: true }],
        [603, "Chimichurri (frasco)", 3_500, 9, 3, { unidad: true }],
        [604, "Huevos (maple x30)", 7_500, 7, 3, { unidad: true }]
    ]
};

/** Números "al azar" pero siempre los mismos (así las pruebas y la demo arrancan igual). */
function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const horaAhora = () => new Date().getHours() + new Date().getMinutes() / 60;

/** Un momento de hace `dias` días a la hora `hora` (decimal: 9.5 = 9:30). Hoy, nunca después de ahora. */
function momento(dias, hora) {
    const h = dias === 0 ? Math.min(hora, horaAhora() - 0.1) : hora;
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(0, 0, 0, 0);
    d.setTime(d.getTime() + Math.round(h * 60) * 60_000);
    return d.toISOString();
}

const a10 = (g) => Math.round(g / 10) * 10; // los pesos del desposte, de a 10 g
const a5 = (g) => Math.max(5, Math.round(g / 5) * 5); // los de la balanza del mostrador, de a 5 g

/** El renglón de una venta o un pedido, con el precio y el costo del momento. */
function renglon(a, { gramos = null, unidades = null }) {
    const porPeso = a.venta === "kg";
    return {
        articuloId: a.id, nombre: a.nombre, animal: a.animal, venta: a.venta,
        gramos: porPeso ? gramos : null, unidades: porPeso ? null : unidades,
        precio: a.precio, costo: a.costo,
        subtotal: porPeso ? precioPorPeso(gramos, a.precio) : a.precio * unidades
    };
}
const totalDe = (items) => items.reduce((t, i) => t + i.subtotal, 0);
const costoDe = (items) => items.reduce((t, i) => t + (i.venta === "kg" ? Math.round((i.gramos * i.costo) / 1000) : i.costo * i.unidades), 0);

/**
 * Un desposte con sus pesos inventados. `rinde`: cuánto de lo esperado dio (1 = justo); `hueso`: idem para el hueso.
 * `faltan`: los cortes que quedan sin pesar (el de hoy). `menos`: un corte que dio bastante menos.
 */
function despostar(azar, articulos, { numero, tipo, proveedorId, tropa, ingresoKg, costoKg, dias, hora, por, rinde = 1, hueso = 1, faltan = [], menos = null }) {
    const t = TIPOS_INGRESO[tipo];
    const ingresoG = Math.round(ingresoKg * 1000);
    const cortes = articulos.filter((a) => a.animal === t.animal && a.rinde).map((a) => {
        const variacion = a.nombre === menos ? 0.86 : 1 + (azar() - 0.5) * 0.08;
        return { articuloId: a.id, gramos: faltan.includes(a.nombre) ? null : a10((ingresoG * a.rinde * rinde * variacion) / 100) };
    });
    const g = (pct) => a10((ingresoG * pct) / 100);
    return {
        id: `d-${numero}`, numero, tipo, proveedorId, tropa, ingresoG, costoKg,
        fecha: momento(dias, hora), por: "Ricardo", despostadoPor: por,
        estado: "abierto", cortes,
        hueso: g(t.merma.hueso * hueso * (1 + (azar() - 0.5) * 0.04)),
        grasa: g(t.merma.grasa * (1 + (azar() - 0.5) * 0.06)),
        terminado: null, resultado: null
    };
}

export function semilla() {
    const azar = azarFijo(23);
    const articulos = [];
    let n = 1;
    for (const [animal, lista] of Object.entries(CATALOGO)) {
        const margen = ANIMALES.find((x) => x.id === animal).margen;
        for (const [plu, nombre, precio, stock, minimo, { rinde = null, rapido = false, unidad = false } = {}] of lista) {
            articulos.push({
                id: `a-${n}`, plu, nombre, animal, venta: unidad ? "unidad" : "kg",
                precio, costo: Math.round(precio / (1 + margen / 100)), margen,
                // kg → gramos; por unidad, unidades
                stock: unidad ? stock : Math.round(stock * 1000), minimo: unidad ? minimo : Math.round(minimo * 1000),
                rinde, rapido, oferta: nombre === "Falda"
            });
            n++;
        }
    }
    const porNombre = (nombre) => articulos.find((a) => a.nombre === nombre);

    // Despostes de las últimas 2 semanas (el del Sur da más hueso) y el de hoy, a medio pesar
    const despostes = [
        despostar(azar, articulos, { numero: 41, tipo: "media-res", proveedorId: "pr-norte", tropa: "T-4790", ingresoKg: 108.6, costoKg: 7_900, dias: 13, hora: 7.5, por: "Ricardo", rinde: 1.005 }),
        despostar(azar, articulos, { numero: 42, tipo: "media-res", proveedorId: "pr-sur", tropa: "S-2215", ingresoKg: 114.2, costoKg: 7_600, dias: 11, hora: 7.4, por: "Darío", rinde: 0.965, hueso: 1.12 }),
        despostar(azar, articulos, { numero: 43, tipo: "cajon-pollo", proveedorId: "pr-pinos", tropa: "L-0912", ingresoKg: 20.4, costoKg: 3_100, dias: 9, hora: 8, por: "Darío", rinde: 0.99 }),
        despostar(azar, articulos, { numero: 44, tipo: "media-res", proveedorId: "pr-norte", tropa: "T-4836", ingresoKg: 111, costoKg: 7_900, dias: 7, hora: 7.6, por: "Darío", rinde: 0.995 }),
        despostar(azar, articulos, { numero: 45, tipo: "media-cerdo", proveedorId: "pr-norte", tropa: "T-4851", ingresoKg: 44.5, costoKg: 4_800, dias: 5, hora: 8.1, por: "Ricardo", rinde: 1 }),
        despostar(azar, articulos, { numero: 46, tipo: "media-res", proveedorId: "pr-sur", tropa: "S-2240", ingresoKg: 109.8, costoKg: 7_600, dias: 3, hora: 7.5, por: "Ricardo", rinde: 0.97, hueso: 1.1 })
    ];
    for (const d of despostes) {
        const r = calcularDesposte(d, articulos);
        Object.assign(d, { estado: "terminado", terminado: momento(dias(d.fecha), horaDe(d.fecha) + 1.5), resultado: r.resultado });
    }
    // Hoy: entró una media res de Frigorífico Norte, más cara, y Darío pesó todo menos el asado y el vacío. Si se pesan
    // como se espera, la merma da 24,1 % (esperada 23 %): más hueso de lo normal.
    const hoy = despostar(azar, articulos, { numero: 47, tipo: "media-res", proveedorId: "pr-norte", tropa: "T-4877", ingresoKg: 112.4, costoKg: 8_400, dias: 0, hora: 7.3, por: "Darío", faltan: ["Asado", "Vacío"], menos: "Bife angosto" });
    ajustarHoy(hoy);
    despostes.push(hoy);

    // Ventas de los últimos 6 días y de hoy hasta hace un rato: de 8 a 13 y de 17 a 21; más el viernes y el sábado
    const ventas = [];
    const elegibles = articulos;
    const pesoElegir = elegibles.map((a) => (a.rapido ? 7 : a.venta === "unidad" ? 2 : 1));
    const elegir = () => {
        let r = azar() * pesoElegir.reduce((x, y) => x + y, 0);
        return elegibles.find((_, i) => (r -= pesoElegir[i]) < 0) ?? elegibles[0];
    };
    const POR_DIA = [0.6, 0.7, 0.8, 0.9, 1, 1.4, 1.7]; // domingo a sábado
    for (let d = 6; d >= 0; d--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - d);
        const cuantas = Math.round((22 + azar() * 8) * POR_DIA[fecha.getDay()]);
        for (let i = 0; i < cuantas; i++) {
            const hora = i % 3 === 2 ? 17 + azar() * 4 : 8 + azar() * 5;
            if (d === 0 && hora > horaAhora() - 0.2) continue;
            const items = [];
            const renglones = 1 + Math.floor(azar() * 3);
            for (let r = 0; r < renglones; r++) {
                const a = elegir();
                if (items.some((x) => x.articuloId === a.id)) continue;
                const grande = a.nombre === "Asado" || a.nombre === "Vacío" || a.animal === "pollo";
                items.push(renglon(a, a.venta === "kg" ? { gramos: a5((grande ? 800 + azar() * 1700 : 300 + azar() * 1300)) } : { unidades: 1 + Math.floor(azar() * 2) }));
            }
            const r = azar();
            ventas.push({
                id: `v-${d}-${i}`, fecha: momento(d, hora), items, total: totalDe(items),
                medio: r < 0.45 ? "efectivo" : r < 0.8 ? "transferencia" : "tarjeta", pagaCon: null, vuelto: null,
                por: azar() < 0.6 ? "Darío" : "Ricardo", pedidoId: null
            });
        }
    }

    // Dos pedidos de otros clientes: uno retirado ayer y uno listo esperando
    const item = (nombre, { modo = "kg", pedido, real = null, aclaracion = "" }) => {
        const a = porNombre(nombre);
        return {
            articuloId: a.id, nombre: a.nombre, animal: a.animal, venta: a.venta, modo,
            pedidoG: modo === "kg" ? pedido : null, pedidoPesos: modo === "plata" ? pedido : null, unidades: modo === "unidad" ? pedido : null,
            aclaracion, precio: a.precio, costo: a.costo, gramos: real
        };
    };
    const norma = {
        id: "pe-16", numero: 16, para: "Norma", clienteId: null, origen: "web", estado: "entregado", retiro: "12:00",
        items: [item("Milanesas de nalga", { pedido: 1500, real: 1540, aclaracion: "Finitas" }), item("Picada común", { modo: "plata", pedido: 8_000, real: 845 })],
        creado: momento(1, 9.2), listo: momento(1, 10.5), avisado: momento(1, 10.5), entregado: momento(1, 12.1), ventaId: "v-pedido-16", anulado: null, preparadoPor: "Darío"
    };
    const ventaNorma = { id: "v-pedido-16", fecha: norma.entregado, items: norma.items.map((i) => renglon(porNombre(i.nombre), { gramos: i.gramos })), medio: "transferencia", pagaCon: null, vuelto: null, por: "Darío", pedidoId: norma.id };
    ventaNorma.total = totalDe(ventaNorma.items);
    ventas.push(ventaNorma);
    const omar = {
        id: "pe-17", numero: 17, para: "Omar", clienteId: null, origen: "web", estado: "listo", retiro: "13:00",
        items: [item("Vacío", { pedido: 2000, real: 2085, aclaracion: "Entero, para la parrilla" }), item("Chorizo", { pedido: 1000, real: 980 }), item("Carbón 4 kg", { modo: "unidad", pedido: 1 })],
        creado: momento(1, 20.4), listo: momento(0, 8.7), avisado: momento(0, 8.7), entregado: null, ventaId: null, anulado: null, preparadoPor: "Darío"
    };
    ventas.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { articulos, despostes, pedidos: [norma, omar], ventas, cambios: [], cierres: [] };
}

const dias = (iso) => Math.round((new Date(fechaLocalISO(0)) - new Date(diaLocalDe(iso))) / 864e5);
const horaDe = (iso) => new Date(iso).getHours() + new Date(iso).getMinutes() / 60;

/**
 * El desposte de hoy, para el momento wow: los cortes ya pesados suman lo justo para que, con el asado y el vacío
 * pesados como se espera, los cortes den el 75,9 % (merma 24,1 %). Hueso 16,8 % y grasa 5,6 % (oreo 1,7 %).
 */
function ajustarHoy(d) {
    const pesados = d.cortes.filter((c) => c.gramos !== null);
    const suma = pesados.reduce((t, c) => t + c.gramos, 0);
    const objetivo = (d.ingresoG * (75.9 - 9 - 3.2)) / 100;
    pesados.forEach((c) => (c.gramos = a10((c.gramos * objetivo) / suma)));
    d.hueso = a10(d.ingresoG * 0.168);
    d.grasa = a10(d.ingresoG * 0.056);
}

/**
 * Las cuentas de un desposte: lo esperado y lo real de cada corte, la merma (hueso + grasa + oreo) y, si está todo
 * pesado, el costo real por kilo de cada corte (el costo total repartido según lo que vale cada corte) y el precio
 * sugerido con el margen de cada uno. `articulos`: los de ahora (precio y margen de hoy).
 */
export function calcularDesposte(d, articulos) {
    const t = TIPOS_INGRESO[d.tipo];
    const filas = d.cortes.map((c) => {
        const a = articulos.find((x) => x.id === c.articuloId);
        const esperadoG = Math.round((d.ingresoG * (a?.rinde ?? 0)) / 100);
        const dif = c.gramos === null || !esperadoG ? null : (c.gramos - esperadoG) / esperadoG;
        return {
            articuloId: c.articuloId, nombre: a?.nombre ?? "—", plu: a?.plu ?? null, rinde: a?.rinde ?? 0,
            esperadoG, gramos: c.gramos, dif, menos: dif !== null && dif < -AVISO_RINDE,
            precio: a?.precio ?? 0, margen: a?.margen ?? 0
        };
    });
    const faltan = filas.filter((f) => f.gramos === null).length + (d.hueso === null ? 1 : 0) + (d.grasa === null ? 1 : 0);
    const cortesG = filas.reduce((t2, f) => t2 + (f.gramos ?? 0), 0);
    const pesadoG = cortesG + (d.hueso ?? 0) + (d.grasa ?? 0);
    const oreoG = d.ingresoG - pesadoG;
    const completo = faltan === 0;
    const costoTotal = Math.round((d.ingresoG * d.costoKg) / 1000);
    const r = {
        filas, faltan, completo, cortesG, pesadoG,
        oreoG: completo ? oreoG : null,
        mermaG: completo ? d.ingresoG - cortesG : null,
        merma: completo ? Math.round(((d.ingresoG - cortesG) / d.ingresoG) * 1000) / 10 : null, // % con un decimal
        esperada: mermaEsperada(d.tipo),
        costoTotal, resultado: null, huesoNombre: t.hueso
    };
    if (!completo) return r;
    // El costo se reparte según lo que vale cada corte: factor = costo total / lo que se vendería todo a los precios de hoy
    const valor = filas.reduce((t2, f) => t2 + (f.gramos * f.precio) / 1000, 0);
    const factor = valor > 0 ? costoTotal / valor : 0;
    filas.forEach((f) => {
        f.costoReal = Math.round(f.precio * factor);
        f.sugerido = redondearPrecio(f.costoReal * (1 + f.margen / 100));
    });
    r.valorVenta = Math.round(valor);
    r.gananciaSiVende = Math.round(valor) - costoTotal;
    r.resultado = {
        merma: r.merma, esperada: r.esperada, oreoG, mermaG: r.mermaG, costoTotal, valorVenta: r.valorVenta,
        cortes: filas.map((f) => ({ articuloId: f.articuloId, nombre: f.nombre, gramos: f.gramos, esperadoG: f.esperadoG, costoReal: f.costoReal, sugerido: f.sugerido, precio: f.precio }))
    };
    return r;
}

// ---------- Permisos ----------
const esDueno = (u) => u?.rol === "dueno";
const esDelLocal = (u) => u?.rol === "dueno" || u?.rol === "empleado";
const esClienta = (u) => u?.rol === "clienta";

const ORDEN_PEDIDO = { nuevo: 0, listo: 1, entregado: 2, anulado: 3 };

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const proveedor = (id) => PROVEEDORES.find((p) => p.id === id) ?? null;
    const revisarTope = (lista, tope, que) => exigir(lista.length < tope, `Ya hay ${tope} ${que}. Es una demo: tocá "Empezar de cero" arriba.`);
    const armarArticulo = (a) => ({ ...copia(a), estado: estadoStock(a), animalNombre: nombreAnimal(a.animal) });
    const ordenNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");

    // ----- Artículos -----

    /**
     * Artículos (filtro por texto o animal), en el orden del catálogo. El texto busca primero tal cual (sinónimos y
     * código); si así no encuentra nada, con la búsqueda que perdona errores del kit ("bacio" → vacío).
     */
    function listarArticulos({ texto = "", animal = null } = {}) {
        const base = db().articulos.filter((a) => !animal || a.animal === animal);
        if (!normal(texto)) return base.map(armarArticulo);
        const tal = base.filter((a) => coincide(a, texto));
        return (tal.length ? tal : filtrarPorTexto(base, conSinonimos(texto), (a) => a.nombre)).map(armarArticulo);
    }

    const articulo = (id) => armarArticulo(buscar(db().articulos, id, "Ese artículo no existe."));
    const rapidos = () => db().articulos.filter((a) => a.rapido).map(armarArticulo);
    const porPlu = (plu) => {
        const a = db().articulos.find((x) => x.plu === Number(plu));
        return a ? armarArticulo(a) : null;
    };
    const faltantes = () => db().articulos.filter((a) => ["sin", "pedir", "despostar"].includes(estadoStock(a))).map(armarArticulo);

    /** El dueño corrige precio, costo, margen, stock o mínimo (lo que no se pasa, queda igual). Stock en kg o unidades. */
    function corregirArticulo(usuario, id, { precio, costo, margen, stock, minimo } = {}) {
        exigir(esDueno(usuario), "Solo el dueño cambia precios, costos y stock.");
        const a = buscar(db().articulos, id, "Ese artículo no existe.");
        const cantidad = (v, que) => (a.venta === "kg" ? kgAGramos(v, que, { hasta: TOPES.stockKg }) : enteroHasta(v, que, { hasta: TOPES.stockKg }));
        const nuevo = {
            precio: precio === undefined ? a.precio : enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio }),
            costo: costo === undefined ? a.costo : enteroHasta(costo, "El costo", { desde: 1, hasta: TOPES.costo }),
            margen: margen === undefined ? a.margen : enteroHasta(margen, "El margen", { hasta: TOPES.margen }),
            stock: stock === undefined ? a.stock : cantidad(stock, "El stock"),
            minimo: minimo === undefined ? a.minimo : cantidad(minimo, "El mínimo")
        };
        Object.assign(a, nuevo);
        guardado.persistir();
        return armarArticulo(a);
    }

    /** Cargar un artículo nuevo (el dueño): nombre, animal, por kilo o por unidad, precio y stock. */
    function cargarArticulo(usuario, { nombre, animal, venta = "kg", precio, stock = 0 } = {}) {
        exigir(esDueno(usuario), "Los artículos nuevos los carga el dueño.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del artículo.");
        exigir(ANIMALES.some((x) => x.id === animal), "Elegí de qué es (vaca, cerdo, pollo…).");
        exigir(venta === "kg" || venta === "unidad", "Elegí si se vende por kilo o por unidad.");
        exigir(!db().articulos.some((a) => normal(a.nombre) === normal(n)), "Ya hay un artículo con ese nombre.");
        revisarTope(db().articulos, TOPES.articulos, "artículos");
        const margen = ANIMALES.find((x) => x.id === animal).margen;
        const p = enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio });
        const a = {
            id: nuevoId("a"), plu: Math.max(...db().articulos.map((x) => x.plu)) + 1, nombre: n, animal, venta,
            precio: p, costo: Math.max(1, Math.round(p / (1 + margen / 100))), margen,
            stock: venta === "kg" ? kgAGramos(stock, "El stock", { hasta: TOPES.stockKg }) : enteroHasta(stock, "El stock", { hasta: TOPES.stockKg }),
            minimo: 0, rinde: null, rapido: false, oferta: false
        };
        db().articulos.push(a);
        guardado.persistir();
        return armarArticulo(a);
    }

    /** La oferta del día (la que se ve grande en la pizarra). null = ninguna. */
    function elegirOferta(usuario, id) {
        exigir(esDueno(usuario), "La oferta del día la elige el dueño.");
        if (id) buscar(db().articulos, id, "Ese artículo no existe.");
        db().articulos.forEach((a) => (a.oferta = a.id === id));
        guardado.persistir();
        return id ? articulo(id) : null;
    }

    /** La pizarra: los precios por animal y la oferta del día. */
    function pizarra() {
        const lista = db().articulos.map(armarArticulo);
        return {
            oferta: lista.find((a) => a.oferta) ?? null,
            grupos: ANIMALES.map((x) => ({ ...x, articulos: lista.filter((a) => a.animal === x.id) })).filter((g) => g.articulos.length)
        };
    }

    // ----- Precios: "Subió la hacienda", precios del desposte y Deshacer -----

    function revisarPorcentaje(porcentaje) {
        exigir(Number.isInteger(porcentaje) && porcentaje >= TOPES.aumentoMin && porcentaje <= TOPES.aumentoMax,
            `El aumento tiene que ser un número entero entre ${TOPES.aumentoMin} % y ${TOPES.aumentoMax} %.`);
        return porcentaje;
    }

    /** Antes → después de cada artículo del animal: sube el precio (redondeado a $100) y el costo en el mismo %. */
    function verAumento(animal, porcentaje) {
        exigir(ANIMALES.some((x) => x.id === animal), "Elegí qué subió (vaca, cerdo, pollo…).");
        const pct = revisarPorcentaje(porcentaje);
        return db().articulos.filter((a) => a.animal === animal).map((a) => ({
            id: a.id, nombre: a.nombre, venta: a.venta,
            antes: a.precio, despues: precioConAumento(a.precio, pct),
            costoAntes: a.costo, costoDespues: Math.max(1, Math.round(a.costo * (1 + pct / 100)))
        }));
    }

    function guardarCambio(usuario, tipo, detalle, cambios) {
        revisarTope(db().cambios, TOPES.cambios, "cambios de precios");
        cambios.forEach((c) => {
            const a = buscar(db().articulos, c.id);
            a.precio = c.despues;
            a.costo = c.costoDespues;
        });
        const cambio = { id: nuevoId("cp"), tipo, ...detalle, fecha: ahora(), por: usuario.nombre, cambios, deshecho: false };
        db().cambios.push(cambio);
        guardado.persistir();
        return copia(cambio);
    }

    function aplicarAumento(usuario, animal, porcentaje) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const cambios = verAumento(animal, porcentaje);
        exigir(porcentaje !== 0, "Con 0 % no cambia nada.");
        return guardarCambio(usuario, "aumento", { animal, porcentaje }, cambios);
    }

    /** Deshacer: solo el último cambio de precios; vuelve cada precio y costo a como estaba. */
    function deshacerCambio(usuario, cambioId) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const c = buscar(db().cambios, cambioId, "Ese cambio de precios no existe.");
        exigir(!c.deshecho, "Ese cambio ya se deshizo.");
        exigir(db().cambios.filter((x) => !x.deshecho).at(-1)?.id === c.id, "Solo se puede deshacer el último cambio de precios.");
        c.cambios.forEach((f) => {
            const a = db().articulos.find((x) => x.id === f.id);
            if (!a) return;
            a.precio = f.antes;
            a.costo = f.costoAntes;
        });
        c.deshecho = true;
        guardado.persistir();
        return copia(c);
    }

    const ultimoCambio = () => copia(db().cambios.filter((c) => !c.deshecho).at(-1) ?? null);

    // ----- Desposte -----

    const armarDesposte = (d) => {
        const c = calcularDesposte(d, db().articulos);
        const t = TIPOS_INGRESO[d.tipo];
        return {
            ...copia(d), ...c,
            tipoNombre: t.nombre, animal: t.animal, proveedor: proveedor(d.proveedorId)?.nombre ?? "—",
            // terminado: lo que se guardó al terminar (con los precios de ese día); abierto: la cuenta de ahora
            merma: d.resultado?.merma ?? c.merma
        };
    };

    const listarDespostes = () => db().despostes.slice().sort((a, b) => (a.estado === b.estado ? b.fecha.localeCompare(a.fecha) : a.estado === "abierto" ? -1 : 1)).map(armarDesposte);
    const desposte = (id) => armarDesposte(buscar(db().despostes, id, "Ese desposte no existe."));

    /** Kilos escritos → gramos, con su tope. */
    function kgAGramos(v, que, { desde = 0, hasta }) {
        const g = aGramos(v);
        exigir(Number.isInteger(g), `${que}: escribí los kilos con hasta 3 decimales (ej: 1,625).`);
        exigir(g >= desde * 1000 && g <= hasta * 1000, `${que} tiene que estar entre ${desde.toLocaleString("es-AR")} y ${hasta.toLocaleString("es-AR")} kg.`);
        return g;
    }

    /** Entró mercadería para despostar (el dueño): tipo, proveedor, tropa o lote, kilos de ingreso y costo por kilo. */
    function ingresar(usuario, { tipo, proveedorId, tropa, kg, costoKg } = {}) {
        exigir(esDueno(usuario), "La mercadería que entra la anota el dueño.");
        const t = TIPOS_INGRESO[tipo];
        exigir(t, "Elegí qué entró (media res, cajón de pollo…).");
        exigir(t.proveedores.includes(proveedorId), `Elegí el proveedor (${t.nombre.toLowerCase()}: ${t.proveedores.map((id) => proveedor(id).nombre).join(" o ")}).`);
        const tr = sinPasarse(tropa, TOPES.tropa, "la tropa o el lote");
        exigir(/^[\w-]*$/.test(tr), "La tropa o el lote: solo letras, números y guiones.");
        revisarTope(db().despostes, TOPES.despostes, "despostes");
        const d = {
            id: nuevoId("d"), numero: Math.max(0, ...db().despostes.map((x) => x.numero)) + 1, tipo, proveedorId, tropa: tr || "—",
            ingresoG: kgAGramos(kg, "El peso de ingreso", { desde: TOPES.ingresoKgMin, hasta: TOPES.ingresoKg }),
            costoKg: enteroHasta(costoKg, "El costo por kilo", { desde: 1, hasta: TOPES.costo }),
            fecha: ahora(), por: usuario.nombre, despostadoPor: null, estado: "abierto",
            cortes: db().articulos.filter((a) => a.animal === t.animal && a.rinde).map((a) => ({ articuloId: a.id, gramos: null })),
            hueso: null, grasa: t.merma.grasa ? null : 0, terminado: null, resultado: null // el pollo no tiene grasa para pesar
        };
        db().despostes.push(d);
        guardado.persistir();
        return armarDesposte(d);
    }

    /** Cargar un peso del desposte (cualquiera del local): un corte, "hueso" o "grasa". Vacío = sin pesar. */
    function cargarPeso(usuario, despId, clave, kg) {
        exigir(esDelLocal(usuario), "Los pesos del desposte los carga la carnicería.");
        const d = buscar(db().despostes, despId, "Ese desposte no existe.");
        exigir(d.estado === "abierto", "Ese desposte ya está terminado.");
        const g = kg === null || kg === "" ? null : kgAGramos(kg, clave === "hueso" ? TIPOS_INGRESO[d.tipo].hueso : clave === "grasa" ? "La grasa" : "El peso del corte", { hasta: TOPES.corteKg });
        const corte = clave === "hueso" || clave === "grasa" ? null : d.cortes.find((x) => x.articuloId === clave);
        exigir(corte || clave === "hueso" || clave === "grasa", "Ese corte no es de este desposte.");
        const antes = corte ? corte.gramos : d[clave];
        const total = d.cortes.reduce((t, c) => t + (c.gramos ?? 0), 0) + (d.hueso ?? 0) + (d.grasa ?? 0) - (antes ?? 0) + (g ?? 0);
        exigir(total <= d.ingresoG, `Lo pesado pasa los ${kilos(d.ingresoG, 1)} que entraron: revisá el último peso.`);
        if (corte) corte.gramos = g;
        else d[clave] = g;
        d.despostadoPor ??= usuario.nombre;
        guardado.persistir();
        return armarDesposte(d);
    }

    /**
     * Terminar el desposte: con todo pesado, los kilos de cada corte pasan al stock y cada corte toma su costo real
     * (el de este desposte). Los precios no cambian solos: el dueño aplica los sugeridos si quiere.
     */
    function terminarDesposte(usuario, despId) {
        exigir(esDelLocal(usuario), "El desposte lo termina la carnicería.");
        const d = buscar(db().despostes, despId, "Ese desposte no existe.");
        exigir(d.estado === "abierto", "Ese desposte ya está terminado.");
        const c = calcularDesposte(d, db().articulos);
        exigir(c.completo, `Faltan pesar ${c.faltan} ${c.faltan === 1 ? "cosa" : "cosas"}.`);
        exigir(c.oreoG >= 0, "Lo pesado pasa lo que entró: revisá los pesos.");
        exigir(c.oreoG <= d.ingresoG * 0.1, `Faltan ${kilos(c.oreoG, 1)} para llegar a lo que entró: ¿quedó algo sin pesar?`);
        c.resultado.cortes.forEach((f) => {
            const a = db().articulos.find((x) => x.id === f.articuloId);
            if (!a) return;
            a.stock = Math.min(TOPES.stockKg * 1000, a.stock + f.gramos);
            a.costo = Math.max(1, f.costoReal);
        });
        Object.assign(d, { estado: "terminado", terminado: ahora(), resultado: c.resultado, terminadoPor: usuario.nombre });
        guardado.persistir();
        return armarDesposte(d);
    }

    /** Los precios sugeridos de un desposte terminado (con el costo real y el margen de hoy de cada corte). */
    function verSugeridos(despId) {
        const d = buscar(db().despostes, despId, "Ese desposte no existe.");
        exigir(d.estado === "terminado" && d.resultado, "Primero hay que terminar el desposte.");
        return d.resultado.cortes.map((f) => {
            const a = db().articulos.find((x) => x.id === f.articuloId);
            if (!a) return null;
            const despues = redondearPrecio(f.costoReal * (1 + a.margen / 100));
            return { id: a.id, nombre: a.nombre, venta: a.venta, antes: a.precio, despues, costoAntes: a.costo, costoDespues: a.costo, costoReal: f.costoReal, margen: a.margen };
        }).filter(Boolean);
    }

    function aplicarSugeridos(usuario, despId) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const cambios = verSugeridos(despId).filter((c) => c.antes !== c.despues);
        exigir(cambios.length, "Los precios ya son los sugeridos.");
        const d = buscar(db().despostes, despId);
        return guardarCambio(usuario, "desposte", { desposteId: d.id, numero: d.numero }, cambios);
    }

    /** La merma de cada desposte terminado y el promedio por proveedor y por quién despostó (para comparar). */
    function historial() {
        const terminados = db().despostes.filter((d) => d.estado === "terminado" && d.resultado).sort((a, b) => b.fecha.localeCompare(a.fecha));
        const promedio = (lista) => (lista.length ? Math.round((lista.reduce((t, d) => t + d.resultado.merma, 0) / lista.length) * 10) / 10 : null);
        const agrupar = (clave, nombre) => [...new Set(terminados.map((d) => d[clave]))].map((k) => {
            const suyos = terminados.filter((d) => d[clave] === k);
            return { nombre: nombre(k), cuantos: suyos.length, merma: promedio(suyos), esperada: Math.round((suyos.reduce((t, d) => t + mermaEsperada(d.tipo), 0) / suyos.length) * 10) / 10 };
        });
        return {
            despostes: terminados.map(armarDesposte),
            porProveedor: agrupar("proveedorId", (id) => proveedor(id)?.nombre ?? "—"),
            porQuien: agrupar("despostadoPor", (q) => q ?? "—")
        };
    }

    // ----- Vender -----

    /**
     * Arma el ticket (sin guardar nada): revisa pesos, unidades y stock, y calcula cada renglón y el total.
     * items: [{ articuloId, gramos }] (por kilo) o [{ articuloId, unidades }] (por unidad)
     */
    function armarTicket(items) {
        exigir(Array.isArray(items) && items.length, "El ticket está vacío.");
        exigir(items.length <= TOPES.renglones, `Un ticket puede tener hasta ${TOPES.renglones} renglones.`);
        exigir(new Set(items.map((i) => i.articuloId)).size === items.length, "Cada artículo va una sola vez.");
        const renglones = items.map((i) => {
            const a = buscar(db().articulos, i.articuloId, "Uno de los artículos ya no existe.");
            if (a.venta === "kg") {
                const g = enteroHasta(i.gramos, `El peso de ${a.nombre}`, { desde: TOPES.gramosMin, hasta: TOPES.gramos });
                exigir(g <= a.stock, a.stock > 0 ? `De ${a.nombre} quedan ${kilos(a.stock)}.` : `No queda ${a.nombre}.`);
                return renglon(a, { gramos: g });
            }
            const u = enteroHasta(i.unidades, `Las unidades de ${a.nombre}`, { desde: 1, hasta: TOPES.unidades });
            exigir(u <= a.stock, a.stock > 0 ? `De ${a.nombre} quedan ${a.stock}.` : `No queda ${a.nombre}.`);
            return renglon(a, { unidades: u });
        });
        return { renglones, total: totalDe(renglones), gramos: renglones.reduce((t, r) => t + (r.gramos ?? 0), 0) };
    }

    function revisarPago(medio, pagaCon, total) {
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        if (medio !== "efectivo" || pagaCon === null || pagaCon === undefined || pagaCon === "") return { pagaCon: null, vuelto: null };
        const con = enteroHasta(pagaCon, "Con cuánto paga", { desde: 1, hasta: TOPES.pagaCon });
        exigir(con >= total, `Con ${pesos(con)} no alcanza: son ${pesos(total)}.`);
        return { pagaCon: con, vuelto: con - total };
    }

    const descontar = (renglones) => renglones.forEach((r) => {
        const a = buscar(db().articulos, r.articuloId);
        a.stock -= r.venta === "kg" ? r.gramos : r.unidades;
    });

    /** Cobrar en efectivo (con "paga con" opcional → vuelto), transferencia o tarjeta. Descuenta el stock. */
    function vender(usuario, { items, medio, pagaCon = null } = {}) {
        exigir(esDelLocal(usuario), "Solo alguien de la carnicería puede vender.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        const { renglones, total } = armarTicket(items);
        const pago = revisarPago(medio, pagaCon, total);
        const venta = { id: nuevoId("v"), fecha: ahora(), items: renglones, total, medio, ...pago, por: usuario.nombre, pedidoId: null };
        descontar(renglones);
        db().ventas.push(venta);
        guardado.persistir();
        return copia(venta);
    }

    // ----- Pedidos -----

    /** Lo estimado de un renglón del pedido (antes de pesarlo) y lo real (después). */
    function cuentaItem(i) {
        const estimado = i.modo === "plata" ? i.pedidoPesos : i.modo === "unidad" ? i.precio * i.unidades : precioPorPeso(i.pedidoG, i.precio);
        const real = i.venta === "unidad" ? i.precio * i.unidades : i.gramos === null ? null : precioPorPeso(i.gramos, i.precio);
        const pedidoG = i.modo === "plata" ? gramosPara(i.pedidoPesos, i.precio) : i.pedidoG;
        return { ...copia(i), estimado, real, pedidoGCalculado: i.venta === "kg" ? pedidoG : null };
    }

    function armarPedido(pe) {
        const items = pe.items.map(cuentaItem);
        const estimado = items.reduce((t, i) => t + i.estimado, 0);
        const sinPesar = items.filter((i) => i.venta === "kg" && i.gramos === null).length;
        const real = sinPesar ? null : items.reduce((t, i) => t + i.real, 0);
        return {
            ...copia(pe), items, estimado, real, sinPesar,
            total: real ?? estimado, diferencia: real === null ? null : real - estimado,
            cliente: pe.clienteId ? buscarPersona(pe.clienteId)?.nombre ?? null : null
        };
    }

    /**
     * Hacer un pedido (la clienta desde el celu o alguien del local). items: [{ articuloId, modo: "kg" | "plata" |
     * "unidad", cantidad (gramos, pesos o unidades), aclaracion }].
     */
    function nuevoPedido(usuario, { items, retiro = RETIROS[0], para = "" } = {}) {
        exigir(esDelLocal(usuario) || esClienta(usuario), "Para pedir hay que entrar como alguien de la demo.");
        exigir(Array.isArray(items) && items.length, "El pedido está vacío.");
        exigir(items.length <= TOPES.renglones, `Un pedido puede tener hasta ${TOPES.renglones} renglones.`);
        exigir(new Set(items.map((i) => i.articuloId)).size === items.length, "Cada artículo va una sola vez en el pedido.");
        exigir(RETIROS.includes(retiro), "Elegí cuándo lo retirás.");
        const quien = esClienta(usuario) ? usuario.nombre : sinPasarse(para, TOPES.para, "para quién es");
        exigir(quien, "Poné para quién es el pedido.");
        revisarTope(db().pedidos, TOPES.pedidos, "pedidos");
        const renglones = items.map((i) => {
            const a = buscar(db().articulos, i.articuloId, "Uno de los artículos ya no existe.");
            const aclaracion = sinPasarse(i.aclaracion ?? "", TOPES.aclaracion, "la aclaración");
            const base = { articuloId: a.id, nombre: a.nombre, animal: a.animal, venta: a.venta, aclaracion, precio: a.precio, costo: a.costo, gramos: null, pedidoG: null, pedidoPesos: null, unidades: null };
            if (a.venta === "unidad") {
                exigir(i.modo === "unidad", `${a.nombre} va por unidad.`);
                return { ...base, modo: "unidad", unidades: enteroHasta(i.cantidad, `Las unidades de ${a.nombre}`, { desde: 1, hasta: TOPES.unidades }) };
            }
            exigir(i.modo === "kg" || i.modo === "plata", `${a.nombre} va por kilo o por plata.`);
            if (i.modo === "plata") return { ...base, modo: "plata", pedidoPesos: enteroHasta(i.cantidad, `La plata de ${a.nombre}`, { desde: TOPES.plataMin, hasta: TOPES.plata }) };
            return { ...base, modo: "kg", pedidoG: enteroHasta(i.cantidad, `El peso de ${a.nombre}`, { desde: TOPES.gramosMin, hasta: TOPES.gramos }) };
        });
        const pe = {
            id: nuevoId("pe"), numero: Math.max(17, ...db().pedidos.map((x) => x.numero)) + 1, para: quien,
            clienteId: esClienta(usuario) ? usuario.id : null, origen: esClienta(usuario) ? "web" : "mostrador", estado: "nuevo", retiro,
            items: renglones, creado: ahora(), listo: null, avisado: null, entregado: null, ventaId: null, anulado: null, preparadoPor: null
        };
        db().pedidos.push(pe);
        guardado.persistir();
        return armarPedido(pe);
    }

    const pedido = (id) => armarPedido(buscar(db().pedidos, id, "Ese pedido no existe."));

    /** Los pedidos (los de la carnicería): para preparar primero (por hora de retiro), después listos y el resto. */
    function listarPedidos(usuario, { estado = null } = {}) {
        exigir(esDelLocal(usuario), "Los pedidos los ve la carnicería.");
        const orden = (p) => RETIROS.indexOf(p.retiro);
        return db().pedidos
            .filter((p) => !estado || p.estado === estado)
            .sort((a, b) => ORDEN_PEDIDO[a.estado] - ORDEN_PEDIDO[b.estado] || (a.estado === "nuevo" ? orden(a) - orden(b) : 0) || b.creado.localeCompare(a.creado))
            .map(armarPedido);
    }

    function misPedidos(usuario) {
        exigir(esClienta(usuario), "Esta pantalla es de la clienta.");
        return db().pedidos.filter((p) => p.clienteId === usuario.id).sort((a, b) => b.creado.localeCompare(a.creado)).map(armarPedido);
    }

    /** Lo que pesó un renglón del pedido (mientras se prepara). Vacío = sin pesar. */
    function pesarItem(usuario, pedidoId, articuloId, kg) {
        exigir(esDelLocal(usuario), "El pedido lo prepara la carnicería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nuevo", "Ese pedido ya está preparado.");
        const i = pe.items.find((x) => x.articuloId === articuloId);
        exigir(i, "Eso no está en el pedido.");
        exigir(i.venta === "kg", `${i.nombre} va por unidad: no se pesa.`);
        i.gramos = kg === null || kg === "" ? null : kgAGramos(kg, `El peso de ${i.nombre}`, { desde: TOPES.gramosMin / 1000, hasta: TOPES.gramos / 1000 });
        guardado.persistir();
        return armarPedido(pe);
    }

    function mensajeListo(a) {
        const lineas = a.items.map((i) => `- ${i.nombre}: ${i.venta === "kg" ? kilos(i.gramos) : `${i.unidades} u.`} · ${pesos(i.real)}`);
        return `Hola ${a.para}! Tu pedido N° ${a.numero} de ${NEGOCIO} ya está listo:\n${lineas.join("\n")}\nTotal: ${pesos(a.total)}.`
            + (a.retiro === RETIROS[0] ? " Pasá cuando quieras." : ` Te esperamos a las ${a.retiro}.`) + " Gracias!";
    }

    /** Pesado todo: se separa (se descuenta del stock), queda "listo para retirar" y sale el mensaje para avisar. */
    function marcarListo(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "El pedido lo prepara la carnicería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nuevo", pe.estado === "listo" ? "Ese pedido ya está listo." : "Ese pedido ya no se puede preparar.");
        const sinPesar = pe.items.filter((i) => i.venta === "kg" && i.gramos === null);
        exigir(!sinPesar.length, `Falta pesar: ${sinPesar.map((i) => i.nombre).join(", ")}.`);
        pe.items.forEach((i) => {
            const a = db().articulos.find((x) => x.id === i.articuloId);
            exigir(a, `${i.nombre} ya no existe.`);
            const cuanto = i.venta === "kg" ? i.gramos : i.unidades;
            exigir(a.stock >= cuanto, a.stock > 0 ? `De ${a.nombre} quedan ${a.venta === "kg" ? kilos(a.stock) : a.stock}.` : `No queda ${a.nombre}.`);
        });
        pe.items.forEach((i) => {
            const a = db().articulos.find((x) => x.id === i.articuloId);
            a.stock -= i.venta === "kg" ? i.gramos : i.unidades;
            i.precio = a.precio; // el precio del día que se prepara
            i.costo = a.costo;
        });
        Object.assign(pe, { estado: "listo", listo: ahora(), avisado: ahora(), preparadoPor: usuario.nombre });
        guardado.persistir();
        const a = armarPedido(pe);
        return { pedido: a, mensaje: mensajeListo(a) };
    }

    /** Volver a avisar (el mensaje de "listo"). */
    function avisarPedido(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "Avisa la carnicería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "listo", "Se avisa cuando el pedido está listo.");
        pe.avisado = ahora();
        guardado.persistir();
        const a = armarPedido(pe);
        return { pedido: a, mensaje: mensajeListo(a) };
    }

    /** Vinieron a buscarlo: se cobra y queda como venta (el stock ya se descontó al prepararlo). */
    function entregarPedido(usuario, pedidoId, { medio, pagaCon = null } = {}) {
        exigir(esDelLocal(usuario), "El pedido lo entrega la carnicería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "listo", "Primero hay que prepararlo.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        const items = pe.items.map((i) => {
            const a = { id: i.articuloId, nombre: i.nombre, animal: i.animal, venta: i.venta, precio: i.precio, costo: i.costo };
            return renglon(a, i.venta === "kg" ? { gramos: i.gramos } : { unidades: i.unidades });
        });
        const total = totalDe(items);
        const pago = revisarPago(medio, pagaCon, total);
        const venta = { id: nuevoId("v"), fecha: ahora(), items, total, medio, ...pago, por: usuario.nombre, pedidoId: pe.id };
        db().ventas.push(venta);
        Object.assign(pe, { estado: "entregado", entregado: venta.fecha, ventaId: venta.id });
        guardado.persistir();
        return { pedido: armarPedido(pe), venta: copia(venta) };
    }

    /** Anular: si ya estaba listo, lo separado vuelve al stock. Nada se borra. */
    function anularPedido(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "El pedido lo anula la carnicería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nuevo" || pe.estado === "listo", "Ese pedido ya no se puede anular.");
        if (pe.estado === "listo") {
            pe.items.forEach((i) => {
                const a = db().articulos.find((x) => x.id === i.articuloId);
                if (a) a.stock = Math.min(TOPES.stockKg * (a.venta === "kg" ? 1000 : 1), a.stock + (i.venta === "kg" ? i.gramos : i.unidades));
            });
        }
        Object.assign(pe, { estado: "anulado", anulado: ahora(), anuladoPor: usuario.nombre });
        guardado.persistir();
        return armarPedido(pe);
    }

    // ----- Caja -----

    const delDia = (lista, dia) => lista.filter((x) => diaLocalDe(x.fecha) === dia);

    /** La caja de un día (hoy si no se dice), en plata y en kilos. La ganancia (venta − costo real) la ve el dueño. */
    function caja(usuario, dia = fechaLocalISO(0)) {
        exigir(esDelLocal(usuario), "La caja la ve la carnicería.");
        const ventas = delDia(db().ventas, dia);
        const porMedio = { efectivo: 0, transferencia: 0, tarjeta: 0 };
        ventas.forEach((v) => (porMedio[v.medio] += v.total));
        const vendido = porMedio.efectivo + porMedio.transferencia + porMedio.tarjeta;
        const renglones = ventas.flatMap((v) => v.items);
        const cuenta = {};
        renglones.forEach((i) => {
            const c = (cuenta[i.nombre] ??= { nombre: i.nombre, gramos: 0, unidades: 0, plata: 0 });
            c.gramos += i.gramos ?? 0;
            c.unidades += i.unidades ?? 0;
            c.plata += i.subtotal;
        });
        const masVendidos = Object.values(cuenta).filter((c) => c.gramos).sort((a, b) => b.gramos - a.gramos || ordenNombre(a, b)).slice(0, 5);
        const porAnimal = ANIMALES.map((x) => {
            const suyos = renglones.filter((i) => i.animal === x.id);
            return { id: x.id, nombre: x.nombre, plata: totalDe(suyos), gramos: suyos.reduce((t, i) => t + (i.gramos ?? 0), 0) };
        }).filter((x) => x.plata > 0).sort((a, b) => b.plata - a.plata);
        const cierre = db().cierres.filter((c) => c.dia === dia).at(-1) ?? null;
        return {
            dia, cantidad: ventas.length, porMedio, vendido,
            gramos: renglones.reduce((t, i) => t + (i.gramos ?? 0), 0),
            ganancia: esDueno(usuario) ? vendido - costoDe(renglones) : null,
            enCajon: FONDO_CAJA + porMedio.efectivo,
            masVendidos, porAnimal,
            pedidosEntregados: ventas.filter((v) => v.pedidoId).length,
            cierre: copia(cierre),
            ultimas: ventas.slice(-6).reverse().map(copia)
        };
    }

    /** Los últimos 7 días (el dueño): vendido, kilos y ganancia por día, el más nuevo primero. */
    function semana(usuario) {
        exigir(esDueno(usuario), "Los últimos 7 días los ve el dueño.");
        return Array.from({ length: 7 }, (_, i) => {
            const c = caja(usuario, fechaLocalISO(-i));
            return { dia: c.dia, vendido: c.vendido, gramos: c.gramos, ganancia: c.ganancia, cantidad: c.cantidad };
        });
    }

    function cerrarCaja(usuario, contado) {
        exigir(esDelLocal(usuario), "Solo alguien de la carnicería cierra la caja.");
        const n = enteroHasta(contado, "La plata contada", { hasta: TOPES.contado });
        revisarTope(db().cierres, TOPES.cierres, "cierres de caja");
        const hoy = caja(usuario);
        const cierre = { id: nuevoId("cc"), dia: hoy.dia, fecha: ahora(), esperado: hoy.enCajon, contado: n, diferencia: n - hoy.enCajon, por: usuario.nombre };
        db().cierres.push(cierre);
        guardado.persistir();
        return copia(cierre);
    }

    return {
        guardado,
        listarArticulos, articulo, rapidos, porPlu, faltantes, corregirArticulo, cargarArticulo, elegirOferta, pizarra,
        verAumento, aplicarAumento, deshacerCambio, ultimoCambio,
        listarDespostes, desposte, ingresar, cargarPeso, terminarDesposte, verSugeridos, aplicarSugeridos, historial,
        armarTicket, vender,
        nuevoPedido, pedido, listarPedidos, misPedidos, pesarItem, marcarListo, avisarPedido, entregarPedido, anularPedido,
        caja, semana, cerrarCaja
    };
}
