// ============================================
// Datos de Sazzo Ferretería (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una ferretería de barrio inventada: 88 artículos sin marcas en 8 rubros (con servicios: copia de llave, corte de
// caño, mezcla de pintura), 4 proveedores, 4 cuentas corrientes (plomero, albañil, electricista y un consorcio),
// presupuestos y las ventas de los últimos 7 días.
// Lo propio del rubro:
//   - Se vende por unidad, por METRO (cable, caño, manguera, cadena) o por KILO (clavos, alambre), con decimales.
//   - El buscador entiende cómo pide la gente: "cano de 1/2", "tarugo del 8", "media pulgada", "teflon", "taco".
//   - Presupuestos: el cliente (o el mostrador) escribe renglón por renglón como habla; cada renglón se entiende solo
//     (cantidad, metros, qué artículo) y lo que no se entiende ("lo de la foto") lo resuelve el mostrador. Se manda
//     con validez de 7 días y pasa a venta (de contado o a cuenta corriente).
//   - Cuentas corrientes con tope (pasarlo lo autoriza el dueño), pagos y el recordatorio armado.
// Precios: cada artículo tiene su COSTO y su MARGEN (como Librería): si sube un proveedor, sube el costo y el precio se
// recalcula con el mismo margen. Desde cierta cantidad, precio por mayor (10 % menos: "tornillos x 100").
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Las ventas guardan el precio y el costo del momento. Si cambia la forma de los datos, subir VERSION_DATOS.
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=d783fb01c6";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=d783fb01c6";
import { diaLocalDe, fechaLocalISO } from "../kit/js/fechas.js?v=d783fb01c6";
import { columnasDe, numeroDe, textoParaComparar } from "../kit/js/tablas.js?v=d783fb01c6";
import { filtrarPorTexto, comoSuena } from "../kit/js/buscar.js?v=d783fb01c6";
import { MARCA, NEGOCIO, buscarPersona } from "./marca.js?v=d783fb01c6";

export const VERSION_DATOS = 1;

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    cantidad: 999, // unidades de un artículo en una venta (300 tarugos es normal)
    metros: 500, // metros de un artículo en una venta (un rollo de cable entero son 100)
    kilos: 100, // kilos de un artículo en una venta
    renglones: 40, // artículos distintos en un ticket o un presupuesto
    texto: 60, // letras de un renglón del presupuesto ("cano de 1/2 x 3")
    costo: 5_000_000,
    precio: 10_000_000, // precio de venta que se escribe al cargar desde el mostrador
    margen: 500, // %
    stock: 99_999, // también en metros o kilos
    pagaCon: 10_000_000,
    nombre: 50, // letras del nombre de un artículo o de una cuenta
    obra: 40, // "Baño planta alta"
    aumentoMin: -50, // % de "Subió un proveedor"
    aumentoMax: 100,
    mayorDesde: 999, // desde cuántas unidades va el precio por mayor
    contado: 10_000_000, // plata contada al cerrar la caja
    tope: 5_000_000, // tope de una cuenta corriente
    productos: 500, // artículos en total (alguien aburrido cargando sin parar)
    ventas: 2000, // ventas guardadas en total (cada venta vuelve a guardar todo: sin tope, el celu se cuelga)
    presupuestos: 300,
    cambios: 300, // cambios de precios (aumentos, márgenes y listas)
    entradas: 300, // mercadería recibida
    cierres: 300, // cierres de caja
    cuentas: 60, // cuentas corrientes
    movimientos: 600, // compras y pagos de una misma cuenta (pagar de a $1 sin parar)
    filasLista: 2000 // renglones de la lista de un proveedor en Excel
};

// Cómo se pueden llamar las columnas de la lista del proveedor (la primera que se parezca)
export const COLUMNAS_LISTA = {
    codigo: ["código", "codigo", "cod", "código de barras", "ean", "barras", "artículo n°"],
    nombre: ["artículo", "articulo", "producto", "productos", "descripción", "descripcion", "nombre", "detalle"],
    costo: ["costo", "precio de costo", "precio costo", "precio comercio", "precio mayorista", "neto", "precio lista", "precio de lista", "precio", "precios"]
};

export const FONDO_CAJA = 30_000; // el cambio con el que arranca el cajón cada día
export const DESCUENTO_MAYOR = 10; // % menos desde la cantidad "por mayor" de cada artículo
export const VALIDEZ_DIAS = 7; // un presupuesto vale 7 días (los precios cambian seguido)
export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta", cuenta: "A cuenta" };
export const TOPE_CUENTA_NUEVA = 100_000;

// ---------- Unidades: por unidad, por metro y por kilo ----------
export const UNIDADES = {
    u: { nombre: "unidad", corto: "", decimales: 0, minimo: 1, maximo: TOPES.cantidad, paso: 1, precioPor: "" },
    m: { nombre: "metro", corto: "m", decimales: 1, minimo: 0.1, maximo: TOPES.metros, paso: 1, precioPor: "el metro" },
    kg: { nombre: "kilo", corto: "kg", decimales: 3, minimo: 0.05, maximo: TOPES.kilos, paso: 0.5, precioPor: "el kilo" }
};

/** Una cantidad con los decimales de su unidad (2,55 m → 2,6; 0,7504 kg → 0,75). */
export const redondearCantidad = (n, unidad = "u") => {
    const f = 10 ** (UNIDADES[unidad]?.decimales ?? 0);
    return Math.round(n * f) / f;
};

/** Lo que se escribió como número ("2,5", "0.750", 3) → 2.5 / 0.75 / 3 (NaN si no se entiende). */
export function numeroCantidad(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : NaN;
    const t = String(valor ?? "").trim().replace(",", ".");
    return t.length <= 12 && /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

/** "3" · "2,5 m" · "0,75 kg" */
export function cantidadTexto(n, unidad = "u") {
    const u = UNIDADES[unidad] ?? UNIDADES.u;
    const t = Number(n).toLocaleString("es-AR", { maximumFractionDigits: u.decimales });
    return u.corto ? `${t} ${u.corto}` : t;
}

/** La cantidad para vender de un artículo: entera por unidad, con 1 decimal en metros y 3 en kilos, con topes. */
export function revisarCantidad(valor, unidad = "u", que = "La cantidad") {
    const u = UNIDADES[unidad];
    exigir(u, "Esa unidad no existe.");
    const n = numeroCantidad(valor);
    const ok = Number.isFinite(n) && Math.abs(redondearCantidad(n, unidad) - n) < 1e-9 && n >= u.minimo - 1e-9 && n <= u.maximo + 1e-9;
    exigir(ok, unidad === "u"
        ? `${que} tiene que ser un número entero entre 1 y ${u.maximo}.`
        : `${que} va de ${cantidadTexto(u.minimo, unidad)} a ${cantidadTexto(u.maximo, unidad)}${u.decimales === 1 ? ", con un decimal (ej: 2,5)" : ""}.`);
    return redondearCantidad(n, unidad);
}

/** El stock o el mínimo de un artículo: de 0 al tope, con los decimales de su unidad. */
function revisarStock(valor, unidad, que) {
    const n = numeroCantidad(valor);
    const ok = Number.isFinite(n) && n >= 0 && n <= TOPES.stock && Math.abs(redondearCantidad(n, unidad) - n) < 1e-9;
    exigir(ok, `${que} tiene que ser un número de 0 a ${TOPES.stock.toLocaleString("es-AR")}${unidad === "u" ? " (entero)" : ""}.`);
    return redondearCantidad(n, unidad);
}

/** Precio × cantidad, a pesos enteros (3,5 m de cable a $590 = $2.065). */
export const subtotalDe = (precio, cantidad) => Math.round(precio * cantidad);

export const RUBROS = [
    { id: "bulones", nombre: "Bulonería y fijaciones", icono: "ti-nut" },
    { id: "plomeria", nombre: "Plomería", icono: "ti-droplet" },
    { id: "electricidad", nombre: "Electricidad", icono: "ti-bolt" },
    { id: "pintureria", nombre: "Pinturería", icono: "ti-paint" },
    { id: "herramientas", nombre: "Herramientas", icono: "ti-hammer" },
    { id: "adhesivos", nombre: "Adhesivos y selladores", icono: "ti-spray" },
    { id: "varios", nombre: "Jardín y varios", icono: "ti-plant" },
    { id: "servicios", nombre: "Servicios", icono: "ti-key" }
];
export const nombreRubro = (id) => RUBROS.find((r) => r.id === id)?.nombre ?? "Otros";

export const PROVEEDORES = [
    { id: "pr-bulonera", nombre: "Bulonera del Sur" },
    { id: "pr-sanitarios", nombre: "Sanitarios del Centro" },
    { id: "pr-electrica", nombre: "Distribuidora Eléctrica Norte" },
    { id: "pr-pinturas", nombre: "Pinturas Mayorista" }
];

/** El margen con el que arranca cada rubro (el dueño lo cambia en "Cambiar margen"). */
export const MARGENES = { bulones: 90, plomeria: 60, electricidad: 55, pintureria: 45, herramientas: 70, adhesivos: 70, varios: 70, servicios: 200 };

export const ESTADOS_PRESUPUESTO = {
    pedido: "Para armar",
    enviado: "Enviado",
    aceptado: "Aceptado",
    vendido: "Vendido",
    anulado: "Anulado"
};

/**
 * Redondeo de ferretería, siempre para arriba: al peso hasta $100 (un tarugo de $67 por mayor sale $61: con pasos de
 * $10 el descuento se perdía), a $10 hasta $1.000, a $50 hasta $10.000 y a $100 desde ahí.
 */
export function redondear(precio) {
    const p = Math.round(precio * 100) / 100; // sin restos de coma
    const paso = p < 100 ? 1 : p < 1_000 ? 10 : p < 10_000 ? 50 : 100;
    return Math.max(paso, Math.ceil(p / paso) * paso);
}

/** Precio de venta: costo + margen, redondeado. */
export const precioDe = (costo, margen) => redondear(costo * (1 + margen / 100));

/** El precio por mayor de un precio de venta (10 % menos, redondeado). */
export const precioMayor = (precio) => redondear(precio * (1 - DESCUENTO_MAYOR / 100));

/** El precio de una unidad según cuántas se llevan (desde `mayorDesde`, el de por mayor). Solo por unidad. */
export const precioPara = (p, cantidad) => (p.mayorDesde && (p.unidad ?? "u") === "u" && cantidad >= p.mayorDesde ? precioMayor(p.precio) : p.precio);

/** "17/10" (siempre con dos números, en hora local). */
export const diaMes = (iso) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** "$ 12.500" */
export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** "$ 2.400" · "$ 2.400 el metro" · "$ 4.500 el kilo" */
export const precioConUnidad = (precio, unidad = "u") => `${pesos(precio)}${UNIDADES[unidad]?.precioPor ? ` ${UNIDADES[unidad].precioPor}` : ""}`;

export const estadoStock = (p) => (p.servicio ? "servicio" : p.stock <= 0 ? "sin" : p.stock <= p.minimo ? "pedir" : "hay");

/** Cuánto pedir de algo que bajó del mínimo: hasta tener el doble del mínimo (al menos 1; metros y kilos, enteros). */
export const cantidadSugerida = (p) => Math.max(1, Math.ceil(p.minimo * 2 - p.stock));

// ---------- El buscador: cómo pide la gente en el mostrador ----------

/** Sin mayúsculas ni tildes ("Caño" = "cano", "Teflón" = "teflon"). */
export const normal = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// Palabras que no dicen qué artículo es ("cano DE 1/2", "tarugo DEL 8", "N° 8", "media PULGADA")
const PALABRAS_SUELTAS = new Set(["de", "del", "la", "el", "los", "las", "para", "con", "x", "por", "un", "una", "unos", "unas", "a", "y", "en", "n", "nro", "numero", "num", "pulgada", "pulgadas", "pulg", "que", "lo", "me", "mas"]);

/**
 * Un texto listo para comparar medidas: "½" y "media pulgada" → 1/2, "tres cuartos" → 3/4, "20 mm" → 1/2 (como el
 * caño de termofusión), "N° 8" y "n8" → 8, "2.5" → 2,5, "6x40" → 6 x 40, y sin comillas de pulgada.
 */
export function paraBuscar(texto) {
    let t = String(texto ?? "").replace(/½/g, " 1/2 ").replace(/¾/g, " 3/4 ").replace(/¼/g, " 1/4 ");
    t = normal(t).replace(/["”“']/g, " ").replace(/n\s?[°º]/g, " ").replace(/[°º()]/g, " ").replace(/(\d)\.(\d)/g, "$1,$2").replace(/(\d)x(\d)/g, "$1 x $2");
    t = t.replace(/\bmedia(?: pulgada)?\b/g, "1/2").replace(/\btres cuartos\b/g, "3/4").replace(/\bun cuarto\b/g, "1/4")
        .replace(/\b(?:12,7|13|20) ?mm\b/g, "1/2").replace(/\b(?:19|25) ?mm\b/g, "3/4")
        .replace(/\bn(\d+)\b/g, "$1");
    return t.replace(/\s+/g, " ").trim();
}

// Cómo pide la gente → cómo se llama en la ferretería (el buscador entiende las dos). Son solo palabras para buscar:
// los nombres de los artículos no llevan marcas.
export const SINONIMOS = {
    taco: "tarugo", tacos: "tarugo", fischer: "tarugo", fisher: "tarugo",
    tubo: "cano", tubos: "cano", tee: "te", t: "te",
    foco: "lampara", focos: "lampara", bombita: "lampara", bombitas: "lampara", lamparita: "lampara", lamparitas: "lampara",
    enchufe: "ficha", enchufes: "ficha", toma: "tomacorriente", tomas: "tomacorriente", aislante: "aisladora",
    gotita: "adhesivo instantaneo", poxipol: "epoxi", sellarosca: "sellador roscas",
    broca: "mecha", brocas: "mecha", brocha: "pincel", pinceleta: "pincel", desarmador: "destornillador",
    teflon: "teflon", cueritos: "cuerito",
    cano: "cano", canos: "cano" // así "kaño" (por cómo suena) es el caño y no la canilla
};

const esMedida = (w) => /\d/.test(w);
const tokensDe = (texto) => paraBuscar(texto).split(" ").filter((w) => w && !PALABRAS_SUELTAS.has(w));

/** ¿La palabra buscada está en el nombre? Las medidas, iguales; las palabras, al principio (y "codos" = "codo"). */
function palabraEsta(w, nombre) {
    if (esMedida(w) || w.length <= 2) return nombre.includes(w);
    return nombre.some((n) => n.startsWith(w) || (w.length >= 4 && n.length >= 4 && w.startsWith(n) && w.length - n.length <= 2));
}

/** ¿El artículo coincide con lo que se escribió? Por nombre (palabra por palabra, con medidas y sinónimos) o por código. */
export function coincide(p, texto) {
    const buscadas = tokensDe(texto);
    if (!buscadas.length) return true;
    const t = normal(texto);
    if (/^\d{4,14}$/.test(t)) return !!p.codigo?.includes(t);
    const nombre = tokensDe(p.nombre);
    return buscadas.every((w) => palabraEsta(w, nombre) || (SINONIMOS[w] !== undefined && SINONIMOS[w].split(" ").every((s) => palabraEsta(s, nombre))));
}

// Los sinónimos por cómo suenan: "kaño", "taruho" o "fiser" (mal escritos) también se entienden
const SINONIMOS_POR_SONIDO = Object.fromEntries(Object.entries(SINONIMOS).filter(([k]) => k.length >= 4).map(([k, v]) => [comoSuena(k), v]));

/** Lo buscado con cada palabra pasada a como se llama en la ferretería ("taco del 8" → "tarugo 8"). */
export const conSinonimos = (texto) =>
    tokensDe(texto).map((w) => SINONIMOS[w] ?? (w.length >= 4 ? SINONIMOS_POR_SONIDO[comoSuena(w)] : undefined) ?? w).join(" ");

// "cano de 1/2 x 3": la cantidad y la unidad, al final ("x 3", "x 2,5 m", "3 metros") o al principio ("4 codos")
const UNIDAD_PALABRA = { m: "m", mt: "m", mts: "m", metro: "m", metros: "m", kg: "kg", k: "kg", kilo: "kg", kilos: "kg", u: "u", unidad: "u", unidades: "u" };
const NUM = "(\\d{1,6}(?:,\\d{1,3})?)";
const UNI = "(m|mts?|metros?|kg|k|kilos?|u|unidad(?:es)?)";

/**
 * Un renglón del presupuesto como lo escribe la gente → { texto, buscado, cantidad, unidad, foto }.
 *   "cano de 1/2 x 3" → buscado "cano de 1/2", cantidad 3 · "4 codos de 1/2" → 4 · "2,5 m de cable" → 2,5 m
 *   "tornillo fix 6 x 40" → la medida del tornillo, no 40 tornillos · "1/2 kg de clavos" y "medio kilo" → 0,5 kg
 *   "lo de la foto" → foto: true
 */
export function entender(linea) {
    const texto = String(linea ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, TOPES.texto);
    let s = normal(texto).replace(/(\d)\.(\d)/g, "$1,$2")
        .replace(/^(?:1\/2|½|medio)\s?(kg|kilos?|k|m|metros?)\b/, "0,5 $1").replace(/^(?:1\/4|¼|un cuarto)\s?(kg|kilos?|k)\b/, "0,25 $1");
    let cantidad = null;
    let unidad = null;
    const n = (v) => Number(v.replace(",", "."));
    let m = s.match(new RegExp(`^(.*?)\\s*\\b(?:x|por)\\s*${NUM}\\s*${UNI}?$`));
    // "tornillo fix 6 x 40" (sin unidad y con un número entero antes): es la medida, no la cantidad
    if (m && !m[3] && /(^|\s)\d+$/.test(m[1])) m = null;
    if (!m) m = s.match(new RegExp(`^(.*?)\\s+${NUM}\\s*(m|mts?|metros?|kg|kilos?)$`));
    if (m && m[1].trim()) {
        s = m[1];
        cantidad = n(m[2]);
        unidad = UNIDAD_PALABRA[m[3]] ?? null;
    } else {
        m = s.match(new RegExp(`^${NUM}\\s*${UNI}?\\s+(?:de\\s+)?(.+)$`));
        if (m) {
            cantidad = n(m[1]);
            unidad = UNIDAD_PALABRA[m[2]] ?? null;
            s = m[3];
        }
    }
    return { texto, buscado: s.trim(), cantidad: cantidad > 0 ? cantidad : null, unidad, foto: /\bfoto\b/.test(s) };
}

/** La cantidad de un renglón entendido para un artículo: lo que dijo, ajustado a su unidad (por unidad, para arriba). */
export function cantidadPara(p, cantidad) {
    const unidad = p.unidad ?? "u";
    let c = cantidad ?? 1;
    if (unidad === "u") c = Math.ceil(c - 1e-9);
    c = redondearCantidad(c, unidad);
    const u = UNIDADES[unidad];
    return Math.min(u.maximo, Math.max(u.minimo, c));
}

// ---------- Datos de fábrica ----------
// Por rubro: [proveedor, [[nombre, costo, stock, mínimo, { unidad, rapido, mayor (desde cuántas), ean }], …]].
// Los precios de los metros y los kilos son por metro y por kilo. Los servicios no tienen stock.
const CATALOGO = {
    bulones: ["pr-bulonera", [
        ["Tarugo N° 6", 25, 800, 200, { rapido: true, mayor: 100 }],
        ["Tarugo N° 8", 35, 600, 200, { rapido: true, mayor: 100 }],
        ["Tarugo N° 10", 55, 300, 100, { mayor: 100 }],
        ["Tornillo fix 6 x 40 mm", 40, 700, 200, { mayor: 100 }],
        ["Tornillo fix 8 x 50 mm", 60, 500, 200, { mayor: 100 }],
        ["Tornillo autoperforante 14 x 1\"", 45, 400, 150, { mayor: 100 }],
        ["Bulón 1/4\" x 2\" con tuerca", 180, 120, 40, { mayor: 50 }],
        ["Bulón 5/16\" x 3\" con tuerca", 260, 80, 30, { mayor: 50 }],
        ["Arandela plana 1/4\"", 15, 500, 100, { mayor: 100 }],
        ["Tuerca 1/4\"", 20, 400, 100, { mayor: 100 }],
        ["Varilla roscada 1/4\" x 1 m", 1_400, 20, 6],
        ["Clavos punta París 2\"", 3_800, 25, 8, { unidad: "kg", rapido: true }],
        ["Clavos punta París 1 1/2\"", 4_000, 12, 5, { unidad: "kg" }]
    ]],
    plomeria: ["pr-sanitarios", [
        ["Caño termofusión 1/2\"", 1_500, 22, 20, { unidad: "m", rapido: true }],
        ["Caño termofusión 3/4\"", 2_100, 40, 16, { unidad: "m" }],
        ["Codo termofusión 1/2\" a 90°", 350, 60, 20, { rapido: true, mayor: 10 }],
        ["Codo termofusión 3/4\" a 90°", 520, 40, 15, { mayor: 10 }],
        ["Te termofusión 1/2\"", 420, 30, 10, { mayor: 10 }],
        ["Cupla termofusión 1/2\"", 280, 40, 15, { mayor: 10 }],
        ["Llave de paso termofusión 1/2\"", 6_500, 8, 3],
        ["Llave de paso termofusión 3/4\"", 8_200, 5, 2],
        ["Canilla esférica 1/2\"", 7_800, 6, 3],
        ["Cinta de teflón 3/4\"", 450, 50, 15, { rapido: true, mayor: 10 }],
        ["Cuerito para canilla 1/2\" (x10)", 900, 15, 5],
        ["Caño PVC 40 mm", 1_600, 30, 10, { unidad: "m" }],
        ["Codo PVC 40 mm", 600, 20, 8],
        ["Flexible para canilla 30 cm", 2_200, 12, 5],
        ["Sifón simple", 3_500, 6, 2]
    ]],
    electricidad: ["pr-electrica", [
        ["Cable unipolar 1,5 mm", 380, 300, 100, { unidad: "m", rapido: true }],
        ["Cable unipolar 2,5 mm", 560, 250, 100, { unidad: "m", rapido: true }],
        ["Cable unipolar 4 mm", 900, 100, 50, { unidad: "m" }],
        ["Cable taller 2 x 1,5 mm", 950, 80, 30, { unidad: "m" }],
        ["Tomacorriente doble", 3_200, 15, 5],
        ["Llave de luz simple", 2_100, 20, 6],
        ["Ficha macho 10 A", 900, 25, 8],
        ["Zapatilla 5 tomas con cable", 7_500, 6, 2],
        ["Lámpara LED 9 W", 1_300, 40, 15, { rapido: true, mayor: 10 }],
        ["Lámpara LED 15 W", 2_000, 20, 8, { mayor: 10 }],
        ["Cinta aisladora negra", 600, 30, 10, { rapido: true, mayor: 10 }],
        ["Caja de luz rectangular", 450, 30, 10],
        ["Térmica bipolar 20 A", 9_500, 4, 2],
        ["Caño corrugado 3/4\"", 250, 100, 30, { unidad: "m" }]
    ]],
    pintureria: ["pr-pinturas", [
        ["Látex interior blanco 4 L", 18_000, 8, 3, { rapido: true }],
        ["Látex interior blanco 20 L", 70_000, 3, 1],
        ["Látex exterior blanco 4 L", 24_000, 5, 2],
        ["Esmalte sintético blanco 1 L", 9_500, 6, 2],
        ["Esmalte sintético negro 1 L", 9_500, 4, 2],
        ["Enduido plástico 4 L", 8_500, 5, 2],
        ["Fijador sellador 4 L", 11_000, 3, 1],
        ["Rodillo de lana 22 cm", 4_200, 10, 3],
        ["Pincel N° 20", 1_800, 12, 4],
        ["Lija al agua N° 120", 350, 60, 20, { mayor: 10 }],
        ["Lija al agua N° 220", 350, 50, 20, { mayor: 10 }],
        ["Aguarrás 1 L", 3_000, 8, 3],
        ["Cinta de papel 24 mm", 1_100, 15, 5],
        ["Bandeja para rodillo", 2_000, 6, 2]
    ]],
    herramientas: ["pr-bulonera", [
        ["Martillo carpintero", 7_500, 4, 2],
        ["Destornillador plano 6 mm", 2_400, 8, 3],
        ["Destornillador Phillips N° 2", 2_400, 8, 3],
        ["Pinza universal 8\"", 7_000, 4, 2],
        ["Llave francesa 10\"", 9_000, 3, 1],
        ["Llave para caño 14\"", 14_000, 2, 1],
        ["Cinta métrica 5 m", 3_500, 8, 3, { rapido: true }],
        ["Nivel de aluminio 40 cm", 6_000, 3, 1],
        ["Cutter con trabas", 1_500, 12, 4],
        ["Mecha para hormigón 6 mm", 900, 20, 6],
        ["Mecha para hormigón 8 mm", 1_100, 18, 6],
        ["Mecha para metal 6 mm", 1_000, 10, 4],
        ["Sierra de arco con hoja", 5_500, 3, 1]
    ]],
    adhesivos: ["pr-pinturas", [
        ["Silicona transparente 280 ml", 3_200, 10, 4],
        ["Sellador acrílico blanco 280 ml", 2_800, 8, 3],
        ["Adhesivo instantáneo 3 g", 900, 25, 8, { rapido: true }],
        ["Adhesivo de contacto 250 ml", 3_800, 6, 2],
        ["Adhesivo epoxi dos componentes", 2_500, 8, 3],
        ["Adhesivo para PVC 125 ml", 2_100, 8, 3],
        ["Espuma de poliuretano 500 ml", 6_500, 4, 2],
        ["Sellador para roscas 50 ml", 2_400, 6, 2]
    ]],
    varios: ["pr-bulonera", [
        ["Manguera reforzada 1/2\"", 700, 100, 30, { unidad: "m" }],
        ["Cadena galvanizada 4 mm", 1_200, 30, 10, { unidad: "m" }],
        ["Soga de nylon 6 mm", 250, 150, 50, { unidad: "m" }],
        ["Alambre galvanizado N° 14", 4_500, 15, 5, { unidad: "kg" }],
        ["Candado de bronce 40 mm", 5_500, 6, 2],
        ["Pico de manguera regulable", 2_400, 8, 3],
        ["Guantes de trabajo (par)", 1_800, 20, 6, { mayor: 12 }],
        ["Bolsas de consorcio (x10)", 1_200, 15, 5]
    ]],
    servicios: [null, [
        ["Copia de llave", 600, null, null, { rapido: true }],
        ["Corte y rosca de caño", 800, null, null],
        ["Mezcla de pintura a color (por lata)", 1_500, null, null]
    ]]
};

// Las cuentas corrientes: [id, nombre, tope]
const CUENTAS = [
    ["c-marcos", "Marcos Villalba", 300_000],
    ["c-gustavo", "Gustavo Ríos", 200_000],
    ["c-lucia", "Lucía Ferreyra", 250_000],
    ["c-alamos", "Administración Los Álamos", 500_000]
];

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

/** Un momento de hace `dias` días a la hora `hora` (decimal: 9.5 = 9:30). Con días negativos, en el futuro. */
function momento(dias, hora) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 0, 0);
    return d.toISOString();
}

/** Un renglón vendido: con el precio (y el de por mayor) y el costo del momento. */
const renglonDe = (p, cantidad) => {
    const precio = precioPara(p, cantidad);
    return { productoId: p.id, nombre: p.nombre, rubro: p.rubro, unidad: p.unidad, precio, costo: p.costo, cantidad, subtotal: subtotalDe(precio, cantidad), mayor: precio !== p.precio };
};
const totalDe = (items) => items.reduce((t, i) => t + i.subtotal, 0);

export const deudaDe = (cuenta) => cuenta.movimientos.reduce((t, m) => t + (m.tipo === "compra" ? m.monto : -m.monto), 0);

/** Desde cuándo debe: la fecha de la primera compra después de la última vez que quedó en cero (o null). */
export function debeDesde(cuenta) {
    let saldo = 0;
    let desde = null;
    for (const m of [...cuenta.movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
        saldo += m.tipo === "compra" ? m.monto : -m.monto;
        if (saldo <= 0) desde = null;
        else if (!desde) desde = m.fecha;
    }
    return desde;
}

export function semilla() {
    const azar = azarFijo(23);
    const productos = [];
    let n = 1;
    for (const [rubro, [proveedorId, lista]] of Object.entries(CATALOGO)) {
        for (const [nombre, costo, stock, minimo, { unidad = "u", rapido = false, mayor = null } = {}] of lista) {
            const margen = MARGENES[rubro];
            productos.push({
                id: `p-${n}`, codigo: `2001${String(n).padStart(9, "0")}`, nombre, rubro, proveedorId, unidad,
                costo, margen, precio: precioDe(costo, margen),
                servicio: stock === null, stock: stock ?? 0, minimo: minimo ?? 0,
                rapido, mayorDesde: mayor
            });
            n++;
        }
    }
    const porNombre = (nombre) => productos.find((p) => p.nombre === nombre);

    // Ventas de los últimos 6 días y de hoy hasta hace un rato (de 8 a 19)
    const ventas = [];
    const elegir = () => {
        const peso = productos.map((p) => (p.rapido ? 6 : 1));
        let r = azar() * peso.reduce((a, b) => a + b, 0);
        return productos.find((_, i) => (r -= peso[i]) < 0) ?? productos[0];
    };
    const cantidadAlAzar = (p) => {
        if (p.unidad === "m") return redondearCantidad(1 + Math.floor(azar() * 20) / 2, "m"); // 1 a 10,5 m
        if (p.unidad === "kg") return redondearCantidad(0.25 * (1 + Math.floor(azar() * 8)), "kg"); // 0,25 a 2 kg
        if (p.mayorDesde) return azar() < 0.4 ? p.mayorDesde : 2 + Math.floor(azar() * 20);
        return 1 + Math.floor(azar() * 2);
    };
    const ahoraHora = new Date().getHours() + new Date().getMinutes() / 60;
    for (let dias = 6; dias >= 0; dias--) {
        const hasta = dias === 0 ? Math.min(19, ahoraHora - 0.25) : 19;
        const cuantas = dias === 0 ? Math.max(0, Math.min(18, Math.floor((hasta - 8) * 1.6))) : 18 + Math.floor(azar() * 10);
        for (let i = 0; i < cuantas; i++) {
            const hora = 8 + ((hasta - 8) * (i + azar() * 0.8)) / Math.max(1, cuantas);
            const items = [];
            const renglones = 1 + Math.floor(azar() * 3);
            for (let r = 0; r < renglones; r++) {
                const p = elegir();
                if (items.some((x) => x.productoId === p.id)) continue;
                items.push(renglonDe(p, cantidadAlAzar(p)));
            }
            const r = azar();
            const medio = r < 0.45 ? "efectivo" : r < 0.8 ? "transferencia" : "tarjeta";
            ventas.push({ id: `v-${dias}-${i}`, fecha: momento(dias, hora), items, total: totalDe(items), medio, clienteId: null, pagaCon: null, vuelto: null, por: azar() < 0.65 ? "Nahuel" : "Osvaldo", presupuestoId: null });
        }
    }

    // Las cuentas, con lo que debían de antes
    const cuentas = CUENTAS.map(([id, nombre, tope]) => ({ id, nombre, tope, movimientos: [] }));
    const cuenta = (id) => cuentas.find((c) => c.id === id);
    const mov = (id, tipo, monto, dias, hora, { medio = null, nota = "", ventaId = null, por = "Osvaldo" } = {}) =>
        cuenta(id).movimientos.push({ id: `m-${id}-${cuenta(id).movimientos.length + 1}`, tipo, monto, fecha: momento(dias, hora), ventaId, medio, por, nota });
    mov("c-marcos", "compra", 41_000, 20, 9.5, { nota: "Materiales para una obra" });
    mov("c-marcos", "pago", 41_000, 12, 18, { medio: "transferencia" });
    mov("c-gustavo", "compra", 128_000, 40, 8.5, { nota: "Materiales para una obra" });
    mov("c-gustavo", "compra", 58_000, 26, 10, { nota: "Materiales para una obra", por: "Nahuel" });
    mov("c-lucia", "compra", 32_000, 15, 11, { nota: "Materiales para una instalación" });
    mov("c-lucia", "pago", 32_000, 3, 17.5, { medio: "efectivo", por: "Nahuel" });
    mov("c-alamos", "compra", 64_500, 12, 9, { nota: "Mantenimiento del edificio" });

    // Presupuestos: uno de Marcos ya vendido a cuenta, uno de Lucía enviado y esperando, uno del consorcio vendido ayer
    const presupuestos = [];
    const itemDe = (nombre, cantidad, texto = nombre) => {
        const p = porNombre(nombre);
        return { id: `i-${presupuestos.length}-${p.id}`, texto, productoId: p.id, nombre: p.nombre, unidad: p.unidad, cantidad, precio: precioPara(p, cantidad), costo: p.costo, foto: false };
    };
    const presupuestoDe = (numero, clienteId, obra, origen, items, creadoDias, { enviadoDias = null, vendidoDias = null, medio = "cuenta" } = {}) => {
        const pr = {
            id: `pr-${numero}`, numero, clienteId, para: cuenta(clienteId)?.nombre ?? "", obra, origen, estado: "pedido", items,
            creado: momento(creadoDias, 10), por: origen === "web" ? null : "Nahuel",
            enviado: null, vence: null, aceptado: null, vendido: null, ventaId: null, anulado: null
        };
        if (enviadoDias !== null) Object.assign(pr, { estado: "enviado", enviado: momento(enviadoDias, 11), vence: momento(enviadoDias - VALIDEZ_DIAS, 20) });
        if (vendidoDias !== null) {
            const venta = {
                id: `v-pr-${numero}`, fecha: momento(vendidoDias, 16.5),
                items: items.map((i) => ({ productoId: i.productoId, nombre: i.nombre, rubro: porNombre(i.nombre).rubro, unidad: i.unidad, precio: i.precio, costo: i.costo, cantidad: i.cantidad, subtotal: subtotalDe(i.precio, i.cantidad), mayor: false })),
                medio, clienteId: medio === "cuenta" ? clienteId : null, pagaCon: null, vuelto: null, por: "Nahuel", presupuestoId: pr.id
            };
            venta.total = totalDe(venta.items);
            ventas.push(venta);
            if (medio === "cuenta") mov(clienteId, "compra", venta.total, vendidoDias, 16.5, { ventaId: venta.id, por: "Nahuel" });
            Object.assign(pr, { estado: "vendido", aceptado: venta.fecha, vendido: venta.fecha, ventaId: venta.id });
        }
        presupuestos.push(pr);
        return pr;
    };
    presupuestoDe(198, "c-marcos", "Cocina", "web", [
        itemDe("Caño termofusión 3/4\"", 4, "cano de 3/4 x 4"),
        itemDe("Codo termofusión 3/4\" a 90°", 6, "6 codos 3/4"),
        itemDe("Llave de paso termofusión 3/4\"", 1, "llave de paso 3/4"),
        itemDe("Cinta de teflón 3/4\"", 2, "2 teflon")
    ], 6, { enviadoDias: 6, vendidoDias: 5 });
    presupuestoDe(201, "c-lucia", "Tablero de un local", "mostrador", [
        itemDe("Cable unipolar 2,5 mm", 50, "50 m de cable 2,5"),
        itemDe("Cable unipolar 1,5 mm", 30, "30 m de cable 1,5"),
        itemDe("Térmica bipolar 20 A", 2, "2 termicas de 20"),
        itemDe("Caja de luz rectangular", 6, "6 cajas de luz"),
        itemDe("Caño corrugado 3/4\"", 25, "corrugado 3/4 x 25 m")
    ], 2, { enviadoDias: 2 });
    presupuestoDe(202, "c-alamos", "Palier y cocheras", "mostrador", [
        itemDe("Lámpara LED 15 W", 10, "10 lamparas de 15"),
        itemDe("Látex interior blanco 20 L", 1, "latex 20 litros"),
        itemDe("Rodillo de lana 22 cm", 2, "2 rodillos")
    ], 2, { enviadoDias: 2, vendidoDias: 1 });
    ventas.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { productos, cuentas, presupuestos, ventas, cambios: [], entradas: [], cierres: [] };
}

// ---------- Permisos ----------
const esDueno = (u) => u?.rol === "dueno";
const esDelLocal = (u) => u?.rol === "dueno" || u?.rol === "empleado";
const esCliente = (u) => u?.rol === "cliente";

const ORDEN_ESTADO = { pedido: 0, aceptado: 1, enviado: 2, vendido: 3, anulado: 4 };

// ---------- Funciones de datos ----------

export function crearDatos(prefijo = MARCA.prefijo) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const proveedor = (id) => PROVEEDORES.find((p) => p.id === id) ?? null;
    const armarProducto = (p) => ({
        ...copia(p),
        estado: estadoStock(p),
        precioMayor: p.mayorDesde ? precioMayor(p.precio) : null,
        rubroNombre: nombreRubro(p.rubro),
        proveedor: proveedor(p.proveedorId)?.nombre ?? (p.servicio ? "Servicio" : "Sin proveedor")
    });
    const revisarTope = (lista, tope, que) => exigir(lista.length < tope, `Ya hay ${tope} ${que}. Es una demo: tocá "Empezar de cero" arriba.`);

    // ----- Artículos -----

    /**
     * Lista de artículos (filtro por texto, rubro o proveedor). Sin texto, por nombre. Con texto, primero tal cual
     * (medidas, sinónimos y código), los que empiezan con lo buscado primero; si así no encuentra nada, con la búsqueda
     * que perdona errores del kit ("kaño", "taruho", "silikona").
     */
    function listarProductos({ texto = "", rubro = null, proveedorId = null } = {}) {
        const base = db().productos
            .filter((p) => (!rubro || p.rubro === rubro) && (!proveedorId || p.proveedorId === proveedorId))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        if (!tokensDe(texto).length) return base.map(armarProducto);
        const tal = base.filter((p) => coincide(p, texto));
        // "1/2 kg clavos" o "3 m de cable 2,5" en el buscador: sin la cantidad
        const buscado = entender(texto).buscado;
        if (!tal.length && buscado && normal(buscado) !== normal(texto)) return listarProductos({ texto: buscado, rubro, proveedorId });
        if (tal.length) {
            const primera = tokensDe(texto)[0];
            const empieza = (p) => (tokensDe(p.nombre)[0]?.startsWith(primera) || tokensDe(p.nombre)[0]?.startsWith(SINONIMOS[primera] ?? "\u0000") ? 0 : 1);
            return tal.sort((a, b) => empieza(a) - empieza(b) || a.nombre.length - b.nombre.length).map(armarProducto);
        }
        return filtrarPorTexto(base, conSinonimos(texto), (p) => paraBuscar(p.nombre)).map(armarProducto);
    }

    const producto = (id) => armarProducto(buscar(db().productos, id, "Ese artículo no existe."));
    const rapidos = () => db().productos.filter((p) => p.rapido).map(armarProducto);

    function porCodigo(codigo) {
        const c = String(codigo ?? "").trim();
        const p = c ? db().productos.find((x) => x.codigo === c) : null;
        return p ? armarProducto(p) : null;
    }

    const hayQuePedir = () => db().productos.filter((p) => ["sin", "pedir"].includes(estadoStock(p))).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map(armarProducto);

    /** El margen más usado en un rubro (con el que se cargan los artículos nuevos). */
    function margenDeRubro(rubro) {
        const cuenta = {};
        db().productos.filter((p) => p.rubro === rubro).forEach((p) => (cuenta[p.margen] = (cuenta[p.margen] ?? 0) + 1));
        const [mas] = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
        return mas ? Number(mas[0]) : MARGENES[rubro] ?? 70;
    }

    /**
     * Cargar un artículo. Dos formas:
     * - El dueño, desde Stock: con costo y margen (el precio sale solo), unidad, proveedor, mínimo y por mayor.
     * - Cualquiera del local, desde Vender ("¿Lo cargás?"): con el precio de venta; el costo se calcula con el margen
     *   del rubro y el dueño lo corrige después.
     */
    function cargarProducto(usuario, { nombre, codigo = "", rubro, unidad = "u", proveedorId = null, costo, margen, precio, stock = 0, minimo = 0, mayorDesde = null } = {}) {
        exigir(esDelLocal(usuario), "Solo alguien de la ferretería puede cargar artículos.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del artículo.");
        exigir(RUBROS.some((r) => r.id === rubro), "Elegí el rubro.");
        exigir(UNIDADES[unidad], "Elegí si se vende por unidad, por metro o por kilo.");
        const c = String(codigo ?? "").trim();
        exigir(!c || /^\d{4,14}$/.test(c), "El código tiene que tener entre 4 y 14 números.");
        exigir(!c || !db().productos.some((p) => p.codigo === c), "Ya hay un artículo con ese código.");
        exigir(!db().productos.some((p) => normal(p.nombre) === normal(n)), "Ya hay un artículo con ese nombre.");
        exigir(!proveedorId || proveedor(proveedorId), "Ese proveedor no existe.");
        revisarTope(db().productos, TOPES.productos, "artículos");
        const servicio = rubro === "servicios";
        let costoFinal, margenFinal, precioFinal;
        if (costo !== undefined && costo !== null) {
            exigir(esDueno(usuario), "El costo y el margen los carga el dueño.");
            costoFinal = enteroHasta(costo, "El costo", { desde: 1, hasta: TOPES.costo });
            margenFinal = margen === undefined || margen === null ? margenDeRubro(rubro) : enteroHasta(margen, "El margen", { hasta: TOPES.margen });
            precioFinal = precioDe(costoFinal, margenFinal);
        } else {
            precioFinal = enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio });
            margenFinal = margenDeRubro(rubro);
            costoFinal = Math.max(1, Math.round(precioFinal / (1 + margenFinal / 100)));
        }
        const u = servicio ? "u" : unidad;
        const p = {
            id: nuevoId("p"),
            codigo: c || `29${String(Date.now()).slice(-8)}${String(db().productos.length).padStart(3, "0")}`,
            nombre: n, rubro, proveedorId, unidad: u, costo: costoFinal, margen: margenFinal, precio: precioFinal, servicio,
            stock: servicio ? 0 : revisarStock(stock, u, "El stock"),
            minimo: servicio ? 0 : revisarStock(minimo, u, "El mínimo"),
            rapido: false,
            mayorDesde: u !== "u" || mayorDesde === null || mayorDesde === "" ? null : enteroHasta(mayorDesde, "La cantidad por mayor", { desde: 2, hasta: TOPES.mayorDesde })
        };
        db().productos.push(p);
        guardado.persistir();
        return armarProducto(p);
    }

    /** El dueño corrige costo, margen, stock, mínimo o desde cuántas va por mayor (lo que no se pasa, queda igual). */
    function corregirProducto(usuario, id, { costo, margen, stock, minimo, mayorDesde } = {}) {
        exigir(esDueno(usuario), "Solo el dueño cambia costos, márgenes y stock.");
        const p = buscar(db().productos, id, "Ese artículo no existe.");
        const nuevo = {
            costo: costo === undefined ? p.costo : enteroHasta(costo, "El costo", { desde: 1, hasta: TOPES.costo }),
            margen: margen === undefined ? p.margen : enteroHasta(margen, "El margen", { hasta: TOPES.margen }),
            stock: stock === undefined || p.servicio ? p.stock : revisarStock(stock, p.unidad, "El stock"),
            minimo: minimo === undefined || p.servicio ? p.minimo : revisarStock(minimo, p.unidad, "El mínimo"),
            mayorDesde: mayorDesde === undefined || p.unidad !== "u" ? p.mayorDesde : mayorDesde === null ? null : enteroHasta(mayorDesde, "La cantidad por mayor", { desde: 2, hasta: TOPES.mayorDesde })
        };
        const cambiaPrecio = nuevo.costo !== p.costo || nuevo.margen !== p.margen;
        Object.assign(p, nuevo);
        if (cambiaPrecio) p.precio = precioDe(p.costo, p.margen);
        guardado.persistir();
        return armarProducto(p);
    }

    // ----- Precios: "Subió un proveedor", "Cambiar margen" y la lista en Excel (los tres con Deshacer) -----

    function revisarPorcentaje(porcentaje) {
        exigir(Number.isInteger(porcentaje) && porcentaje >= TOPES.aumentoMin && porcentaje <= TOPES.aumentoMax,
            `El aumento tiene que ser un número entero entre ${TOPES.aumentoMin} % y ${TOPES.aumentoMax} %.`);
        return porcentaje;
    }

    const filaCambio = (p, costoDespues, margenDespues) => ({
        id: p.id, nombre: p.nombre, unidad: p.unidad,
        costoAntes: p.costo, costoDespues, margenAntes: p.margen, margenDespues,
        antes: p.precio, despues: precioDe(costoDespues, margenDespues)
    });

    /** Antes → después de cada artículo del proveedor: sube el costo y el precio se recalcula con su margen. */
    function verAumento(proveedorId, porcentaje) {
        exigir(proveedor(proveedorId), "Elegí el proveedor.");
        const pct = revisarPorcentaje(porcentaje);
        return db().productos
            .filter((p) => p.proveedorId === proveedorId)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((p) => filaCambio(p, Math.max(1, Math.round(p.costo * (1 + pct / 100))), p.margen));
    }

    /** Antes → después de cada artículo del rubro con el margen nuevo (el costo no cambia). */
    function verMargen(rubro, margen) {
        exigir(RUBROS.some((r) => r.id === rubro), "Elegí el rubro.");
        const m = enteroHasta(margen, "El margen", { hasta: TOPES.margen });
        return db().productos
            .filter((p) => p.rubro === rubro)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((p) => filaCambio(p, p.costo, m));
    }

    function guardarCambio(usuario, tipo, detalle, cambios) {
        revisarTope(db().cambios, TOPES.cambios, "cambios de precios");
        cambios.forEach((c) => {
            const p = buscar(db().productos, c.id);
            p.costo = c.costoDespues;
            p.margen = c.margenDespues;
            p.precio = c.despues;
        });
        const cambio = { id: nuevoId("cp"), tipo, ...detalle, fecha: ahora(), por: usuario.nombre, cambios, deshecho: false };
        db().cambios.push(cambio);
        guardado.persistir();
        return copia(cambio);
    }

    function aplicarAumento(usuario, proveedorId, porcentaje) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const cambios = verAumento(proveedorId, porcentaje);
        exigir(porcentaje !== 0, "Con 0 % no cambia nada.");
        return guardarCambio(usuario, "aumento", { proveedorId, porcentaje }, cambios);
    }

    function aplicarMargen(usuario, rubro, margen) {
        exigir(esDueno(usuario), "Solo el dueño cambia los márgenes.");
        const cambios = verMargen(rubro, margen);
        exigir(cambios.some((c) => c.margenAntes !== c.margenDespues), `Todo ${nombreRubro(rubro)} ya tiene ${margen} % de margen.`);
        return guardarCambio(usuario, "margen", { rubro, margen }, cambios);
    }

    /** Deshacer: solo el último cambio de precios, y vuelve cada costo, margen y precio a como estaba. */
    function deshacerCambio(usuario, cambioId) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const c = buscar(db().cambios, cambioId, "Ese cambio de precios no existe.");
        exigir(!c.deshecho, "Ese cambio ya se deshizo.");
        exigir(db().cambios.filter((x) => !x.deshecho).at(-1)?.id === c.id, "Solo se puede deshacer el último cambio de precios.");
        c.cambios.forEach((f) => {
            const p = db().productos.find((x) => x.id === f.id);
            if (!p) return;
            p.costo = f.costoAntes;
            p.margen = f.margenAntes;
            p.precio = f.antes;
        });
        c.deshecho = true;
        guardado.persistir();
        return copia(c);
    }

    const ultimoCambio = () => copia(db().cambios.filter((c) => !c.deshecho).at(-1) ?? null);

    /**
     * Lee las filas de un Excel (las de leerExcel del kit, ya con topes) y arma antes → después: cada renglón se cruza
     * con un artículo por el código (o, si no tiene, por el nombre igual). Lo que trae la lista es el COSTO: el precio de
     * venta se recalcula con el margen de cada artículo. No cambia nada.
     * Devuelve { cambios, iguales, noEstan (hasta 50 nombres), malos (sin un costo que se entienda) }.
     */
    function verLista(filas) {
        exigir(Array.isArray(filas) && filas.length, "El Excel está vacío.");
        exigir(filas.length <= TOPES.filasLista, `La lista tiene demasiados renglones (máximo ${TOPES.filasLista}).`);
        const col = columnasDe(filas, COLUMNAS_LISTA);
        exigir(col.costo >= 0 && (col.codigo >= 0 || col.nombre >= 0),
            "No encontré las columnas: la lista tiene que tener una columna \"Costo\" (o \"Precio\") y otra \"Código\" o \"Artículo\".");
        const porNombre = new Map(db().productos.map((p) => [textoParaComparar(p.nombre), p]));
        const cambios = [];
        const noEstan = [];
        const vistos = new Set();
        let iguales = 0;
        let malos = 0;
        for (const f of filas.slice(col.titulos + 1)) {
            if (!Array.isArray(f)) continue;
            const codigo = col.codigo >= 0 ? String(f[col.codigo] ?? "").trim() : "";
            const nombre = col.nombre >= 0 ? String(f[col.nombre] ?? "").trim() : "";
            if (!codigo && !nombre) continue;
            const costo = Math.round(numeroDe(f[col.costo]));
            if (!(costo >= 1 && costo <= TOPES.costo)) {
                malos++;
                continue;
            }
            const p = (codigo && db().productos.find((x) => x.codigo === codigo)) || (nombre && porNombre.get(textoParaComparar(nombre)));
            if (!p) {
                if (noEstan.length < 50) noEstan.push((nombre || codigo).slice(0, TOPES.nombre));
                continue;
            }
            if (vistos.has(p.id)) continue;
            vistos.add(p.id);
            if (costo === p.costo) iguales++;
            else cambios.push(filaCambio(p, costo, p.margen));
        }
        cambios.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        return { cambios, iguales, noEstan, malos };
    }

    /** Aplica la lista (se vuelve a leer acá, no se confía en lo que mostró la pantalla). Se deshace como un aumento. */
    function aplicarLista(usuario, filas) {
        exigir(esDueno(usuario), "Solo el dueño cambia los precios.");
        const { cambios } = verLista(filas);
        exigir(cambios.length, "Con esta lista no cambia ningún costo.");
        return guardarCambio(usuario, "excel", {}, cambios);
    }

    /**
     * Una lista de ejemplo de un proveedor, como la mandaría él (para probar sin tener una): el nombre arriba, los
     * títulos y sus artículos con el costo nuevo (sube un 12 %, con centavos y sin redondear, como vienen).
     */
    function listaDeEjemplo(proveedorId = "pr-sanitarios") {
        const prov = proveedor(proveedorId);
        exigir(prov, "Ese proveedor no existe.");
        const productos = db().productos.filter((p) => p.proveedorId === proveedorId).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        return [
            [`${prov.nombre} · Lista de precios para comercios (ejemplo)`],
            [],
            ["Código", "Artículo", "Unidad", "Costo"],
            ...productos.map((p) => [p.codigo, p.nombre, UNIDADES[p.unidad].nombre, Math.round(p.costo * 1.12 * 100) / 100])
        ];
    }

    // ----- Pedidos a los proveedores -----

    /** Lo que hay que pedir, separado por proveedor, con la cantidad sugerida (hasta el doble del mínimo). */
    function pedidosSugeridos() {
        const faltan = hayQuePedir();
        return PROVEEDORES.map((pr) => ({
            ...pr,
            items: faltan.filter((p) => p.proveedorId === pr.id).map((p) => ({ id: p.id, nombre: p.nombre, unidad: p.unidad, stock: p.stock, minimo: p.minimo, cantidad: cantidadSugerida(p) }))
        })).filter((pr) => pr.items.length);
    }

    /** El mensaje para mandarle al proveedor (en la demo se copia). */
    function mensajePedido(proveedorId) {
        const pr = proveedor(proveedorId);
        exigir(pr, "Ese proveedor no existe.");
        const items = pedidosSugeridos().find((x) => x.id === proveedorId)?.items ?? [];
        exigir(items.length, `No hay nada para pedirle a ${pr.nombre}.`);
        return `Hola ${pr.nombre}! Te hago un pedido para ${NEGOCIO}:\n${items.map((i) => `- ${i.unidad === "u" ? `${i.cantidad} ×` : cantidadTexto(i.cantidad, i.unidad)} ${i.nombre}`).join("\n")}\nGracias!`;
    }

    /** Llegó la mercadería del proveedor: suma lo sugerido al stock (el dueño). */
    function recibirPedido(usuario, proveedorId) {
        exigir(esDueno(usuario), "La mercadería que llega la carga el dueño.");
        const pr = proveedor(proveedorId);
        exigir(pr, "Ese proveedor no existe.");
        const items = pedidosSugeridos().find((x) => x.id === proveedorId)?.items ?? [];
        exigir(items.length, `No hay nada pedido a ${pr.nombre}.`);
        revisarTope(db().entradas, TOPES.entradas, "entradas de mercadería");
        items.forEach((i) => {
            const p = buscar(db().productos, i.id);
            p.stock = Math.min(TOPES.stock, redondearCantidad(p.stock + i.cantidad, p.unidad));
        });
        const entrada = { id: nuevoId("en"), proveedorId, fecha: ahora(), por: usuario.nombre, items };
        db().entradas.push(entrada);
        guardado.persistir();
        return copia(entrada);
    }

    // ----- Cuentas corrientes -----

    const armarCuenta = (c) => ({ ...copia(c), deuda: deudaDe(c), desde: debeDesde(c), persona: c.id === "c-marcos" ? buscarPersona("u-cliente") : null });

    /** Las cuentas: las que más deben primero. */
    function listarCuentas(usuario) {
        exigir(esDelLocal(usuario), "Las cuentas las ve la ferretería.");
        return db().cuentas.map(armarCuenta).sort((a, b) => b.deuda - a.deuda || a.nombre.localeCompare(b.nombre, "es"));
    }

    /** Una cuenta con sus movimientos (el más nuevo primero) y qué se llevó en cada compra. */
    function armarCuentaConMovimientos(c) {
        const r = armarCuenta(c);
        r.movimientos = r.movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((m) => {
            const v = m.ventaId ? db().ventas.find((x) => x.id === m.ventaId) : null;
            const pr = v?.presupuestoId ? db().presupuestos.find((x) => x.id === v.presupuestoId) : null;
            return { ...m, que: v ? `${pr ? `Presupuesto N° ${pr.numero} · ` : ""}${v.items.map((i) => `${i.unidad === "u" ? (i.cantidad > 1 ? `${i.cantidad} ` : "") : `${cantidadTexto(i.cantidad, i.unidad)} `}${i.nombre}`).join(", ")}` : m.nota ?? "" };
        });
        return r;
    }

    function cuenta(usuario, id) {
        exigir(esDelLocal(usuario), "Las cuentas las ve la ferretería.");
        return armarCuentaConMovimientos(buscar(db().cuentas, id, "Esa cuenta no existe."));
    }

    /** La cuenta del cliente que entró (Marcos). */
    function miCuenta(usuario) {
        exigir(esCliente(usuario) && usuario.cuentaId, "Esta pantalla es del cliente.");
        return armarCuentaConMovimientos(buscar(db().cuentas, usuario.cuentaId, "Tu cuenta ya no existe."));
    }

    function nuevaCuenta(usuario, { nombre, tope = TOPE_CUENTA_NUEVA } = {}) {
        exigir(esDueno(usuario), "Las cuentas corrientes las abre el dueño.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del cliente.");
        exigir(!db().cuentas.some((c) => normal(c.nombre) === normal(n)), "Ya hay una cuenta con ese nombre.");
        revisarTope(db().cuentas, TOPES.cuentas, "cuentas");
        const c = { id: nuevoId("c"), nombre: n, tope: enteroHasta(tope, "El tope", { hasta: TOPES.tope }), movimientos: [] };
        db().cuentas.push(c);
        guardado.persistir();
        return armarCuenta(c);
    }

    function cambiarTope(usuario, cuentaId, tope) {
        exigir(esDueno(usuario), "El tope de una cuenta lo cambia el dueño.");
        const c = buscar(db().cuentas, cuentaId, "Esa cuenta no existe.");
        c.tope = enteroHasta(tope, "El tope", { hasta: TOPES.tope });
        guardado.persistir();
        return armarCuenta(c);
    }

    /** Anotar un pago: todo o una parte (nunca más de lo que debe). */
    function cobrarCuenta(usuario, cuentaId, { monto, medio = "efectivo" } = {}) {
        exigir(esDelLocal(usuario), "Los pagos los anota la ferretería.");
        const c = buscar(db().cuentas, cuentaId, "Esa cuenta no existe.");
        exigir(medio === "efectivo" || medio === "transferencia", "Elegí cómo paga: efectivo o transferencia.");
        const debe = deudaDe(c);
        exigir(debe > 0, `${c.nombre} no debe nada.`);
        revisarTope(c.movimientos, TOPES.movimientos, `movimientos en la cuenta de ${c.nombre}`);
        const m = enteroHasta(monto, "Lo que paga", { desde: 1, hasta: debe });
        c.movimientos.push({ id: nuevoId("m"), tipo: "pago", monto: m, fecha: ahora(), ventaId: null, medio, por: usuario.nombre, nota: "" });
        guardado.persistir();
        return armarCuenta(c);
    }

    /** El recordatorio armado para mandarle al cliente (en la demo se copia). */
    function mensajeCuenta(usuario, cuentaId) {
        exigir(esDelLocal(usuario), "Los recordatorios los manda la ferretería.");
        const c = armarCuenta(buscar(db().cuentas, cuentaId, "Esa cuenta no existe."));
        exigir(c.deuda > 0, `${c.nombre} no debe nada.`);
        const desde = diaMes(c.desde);
        return `Hola ${c.nombre.split(" ")[0]}! Te escribimos de ${NEGOCIO}: tu cuenta corriente tiene un saldo de ${pesos(c.deuda)} (desde el ${desde}). Cuando puedas, pasá por el local o avisanos y te mandamos los datos para transferir. Gracias!`;
    }

    /** ¿Esta compra a cuenta pasa el tope? → { pasa, deuda, despues, tope } */
    function revisarTopeCuenta(cuentaId, total) {
        const c = buscar(db().cuentas, cuentaId, "Esa cuenta no existe.");
        const deuda = deudaDe(c);
        return { pasa: deuda + total > c.tope, deuda, despues: deuda + total, tope: c.tope };
    }

    /** Revisa el pago (efectivo con vuelto, transferencia, tarjeta o a cuenta con tope) → lo que va en la venta. */
    function revisarPago(usuario, { medio, pagaCon, total, clienteId, autorizarTope }) {
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        if (medio === "cuenta") {
            exigir(clienteId, "Elegí a qué cuenta va.");
            const c = buscar(db().cuentas, clienteId, "Esa cuenta no existe.");
            revisarTope(c.movimientos, TOPES.movimientos, `movimientos en la cuenta de ${c.nombre}`);
            const t = revisarTopeCuenta(clienteId, total);
            if (t.pasa) {
                exigir(autorizarTope, `Con esta compra ${c.nombre} debería ${pesos(t.despues)} y su tope es ${pesos(t.tope)}.`);
                exigir(esDueno(usuario), `Se pasa del tope de ${c.nombre}: lo tiene que autorizar Osvaldo.`);
            }
            return { pagaCon: null, vuelto: null, clienteId: c.id };
        }
        if (medio !== "efectivo" || pagaCon === null || pagaCon === undefined || pagaCon === "") return { pagaCon: null, vuelto: null, clienteId: null };
        const con = enteroHasta(pagaCon, "Con cuánto paga", { desde: 1, hasta: TOPES.pagaCon });
        exigir(con >= total, `Con ${pesos(con)} no alcanza: son ${pesos(total)}.`);
        return { pagaCon: con, vuelto: con - total, clienteId: null };
    }

    /** Guarda la venta, descuenta el stock y, si es a cuenta, la anota en la cuenta. */
    function guardarVenta(usuario, renglones, total, medio, pago, presupuestoId = null) {
        const venta = {
            id: nuevoId("v"), fecha: ahora(),
            items: renglones.map(({ productoId, nombre, rubro, unidad, precio, costo, cantidad, subtotal, mayor }) => ({ productoId, nombre, rubro, unidad, precio, costo, cantidad, subtotal, mayor })),
            total, medio, ...pago, por: usuario.nombre, presupuestoId
        };
        renglones.forEach((r) => {
            const p = buscar(db().productos, r.productoId);
            if (!p.servicio) p.stock = redondearCantidad(p.stock - r.cantidad, p.unidad);
        });
        db().ventas.push(venta);
        if (pago.clienteId) buscar(db().cuentas, pago.clienteId).movimientos.push({ id: nuevoId("m"), tipo: "compra", monto: total, fecha: venta.fecha, ventaId: venta.id, medio: null, por: usuario.nombre, nota: "" });
        return venta;
    }

    // ----- Presupuestos -----

    /** Lo que sugiere el buscador para un renglón (los 6 más parecidos). */
    const sugerencias = (texto) => (tokensDe(texto).length ? listarProductos({ texto }).slice(0, 6) : []);

    /** Un renglón entendido → item del presupuesto (con el artículo, si lo encontró). */
    function itemDeLinea(linea, i) {
        const e = entender(linea);
        const p = e.foto ? null : listarProductos({ texto: e.buscado })[0] ?? null;
        const base = { id: `i-${Date.now().toString(36)}-${i}`, texto: e.texto, foto: e.foto, costo: 0 };
        if (!p) return { ...base, productoId: null, nombre: null, unidad: e.unidad ?? "u", cantidad: e.cantidad ?? 1, precio: 0 };
        const cantidad = cantidadPara(p, e.cantidad);
        return { ...base, productoId: p.id, nombre: p.nombre, unidad: p.unidad, cantidad, precio: precioPara(p, cantidad), costo: p.costo };
    }

    function revisarLineas(lineas, foto) {
        exigir(Array.isArray(lineas), "Escribí lo que necesitás, un artículo por renglón.");
        const limpias = lineas.map((l) => String(l ?? "").trim()).filter(Boolean);
        exigir(limpias.every((l) => l.length <= TOPES.texto), `Cada renglón puede tener hasta ${TOPES.texto} letras.`);
        if (foto) limpias.push("Lo de la foto");
        exigir(limpias.length, "Escribí lo que necesitás, un artículo por renglón.");
        exigir(limpias.length <= TOPES.renglones, `Un presupuesto puede tener hasta ${TOPES.renglones} renglones.`);
        return limpias;
    }

    /** Lo que entiende de cada renglón, sin guardar nada (lo que ve Marcos mientras escribe). */
    function verRenglones(lineas, { foto = false } = {}) {
        const items = revisarLineas(lineas, foto).map(itemDeLinea);
        return { items: items.map((i) => ({ ...i, subtotal: subtotalDe(i.precio, i.cantidad) })), total: items.reduce((t, i) => t + subtotalDe(i.precio, i.cantidad), 0), sinResolver: items.filter((i) => !i.productoId).length };
    }

    /** ¿Ya pasó la fecha de validez? */
    const vencido = (pr) => !!pr.vence && pr.vence < ahora() && (pr.estado === "enviado" || pr.estado === "aceptado");

    /** Un presupuesto con su total, el stock de cada renglón y si los precios siguen valiendo. */
    function armarPresupuesto(pr) {
        const preciosDeHoy = pr.estado === "pedido" || vencido(pr);
        const items = pr.items.map((i) => {
            const p = i.productoId ? db().productos.find((x) => x.id === i.productoId) : null;
            const r = { ...copia(i), stock: p?.stock ?? 0, servicio: !!p?.servicio, alcanza: !p || p.servicio || p.stock >= i.cantidad };
            if (preciosDeHoy && p && pr.estado !== "vendido") r.precioHoy = precioPara(p, i.cantidad);
            r.precioUsado = r.precioHoy ?? r.precio;
            r.subtotal = subtotalDe(r.precioUsado, r.cantidad);
            return r;
        });
        const total = items.reduce((t, i) => t + i.subtotal, 0);
        const totalEnviado = items.reduce((t, i) => t + subtotalDe(i.precio, i.cantidad), 0);
        const c = pr.clienteId ? db().cuentas.find((x) => x.id === pr.clienteId) : null;
        return {
            ...copia(pr),
            items,
            total,
            vencido: vencido(pr),
            subio: vencido(pr) ? total - totalEnviado : 0,
            sinResolver: items.filter((i) => !i.productoId).length,
            faltan: items.filter((i) => i.productoId && !i.alcanza).length,
            cliente: c ? c.nombre : pr.para,
            tieneCuenta: !!c,
            esDeMarcos: pr.clienteId === "c-marcos"
        };
    }

    const presupuesto = (id) => armarPresupuesto(buscar(db().presupuestos, id, "Ese presupuesto no existe."));

    // ----- Novedades: el aviso "Pedido nuevo" (y "Lo aceptó", "Te lo mandaron") para la persona que entra -----
    // Cada persona tiene su "ya lo vi" en el presupuesto (vistos: { personaId: estado que vio }): si el presupuesto
    // cambia de estado, vuelve a avisar una vez. Así Nahuel y Osvaldo se enteran cada uno por su lado.

    const yaLoVio = (usuario, pr) => pr.vistos?.[usuario.id] === pr.estado;

    /** Lo que esta persona todavía no vio: el más nuevo primero. */
    function novedades(usuario) {
        let lista = [];
        if (esCliente(usuario)) {
            lista = db().presupuestos.filter((pr) => pr.clienteId === usuario.cuentaId && pr.estado === "enviado" && !yaLoVio(usuario, pr));
        } else if (esDelLocal(usuario)) {
            lista = db().presupuestos.filter((pr) => !yaLoVio(usuario, pr)
                && ((pr.estado === "pedido" && pr.origen === "web") || (pr.estado === "aceptado" && pr.aceptadoPorCliente)));
        }
        const cuandoFue = (pr) => (pr.estado === "pedido" ? pr.creado : pr.estado === "enviado" ? pr.enviado : pr.aceptado) ?? "";
        return lista.sort((a, b) => cuandoFue(b).localeCompare(cuandoFue(a))).map((pr) => {
            const a = armarPresupuesto(pr);
            return {
                id: a.id, numero: a.numero, cliente: a.cliente, obra: a.obra, renglones: a.items.length, conFoto: a.items.some((i) => i.foto),
                total: a.total, vence: a.vence, tipo: { pedido: "nuevo", aceptado: "aceptado", enviado: "enviado" }[a.estado],
                ruta: esCliente(usuario) ? "/mis-presupuestos" : `/presupuestos/${a.id}`
            };
        });
    }

    /** "Ya lo vi": no vuelve a avisar hasta que el presupuesto cambie de estado. */
    function marcarVisto(usuario, presupuestoId) {
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(esDelLocal(usuario) || (esCliente(usuario) && pr.clienteId === usuario.cuentaId), "Ese presupuesto no es tuyo.");
        if (yaLoVio(usuario, pr)) return false;
        pr.vistos = { ...(pr.vistos ?? {}), [usuario.id]: pr.estado };
        guardado.persistir();
        return true;
    }

    /**
     * Pedir un presupuesto: el cliente desde el celular (va a su cuenta) o el mostrador (para una cuenta o para
     * alguien sin cuenta: `para`). `lineas`: lo que escribió, un artículo por renglón. `foto`: "lo de la foto".
     */
    function nuevoPresupuesto(usuario, { lineas, foto = false, obra = "", clienteId = null, para = "" } = {}) {
        exigir(esDelLocal(usuario) || esCliente(usuario), "Para pedir un presupuesto hay que entrar como alguien de la demo.");
        const limpias = revisarLineas(lineas, foto);
        const o = sinPasarse(obra, TOPES.obra, "la obra");
        let cliente = null;
        let quien = "";
        if (esCliente(usuario)) {
            cliente = buscar(db().cuentas, usuario.cuentaId, "Tu cuenta ya no existe.");
        } else if (clienteId) {
            cliente = buscar(db().cuentas, clienteId, "Esa cuenta no existe.");
        } else {
            quien = sinPasarse(para, TOPES.nombre, "para quién es");
            exigir(quien, "Poné para quién es el presupuesto (o elegí una cuenta).");
        }
        revisarTope(db().presupuestos, TOPES.presupuestos, "presupuestos");
        const pr = {
            id: nuevoId("pr"), numero: Math.max(200, ...db().presupuestos.map((x) => x.numero)) + 1,
            clienteId: cliente?.id ?? null, para: cliente?.nombre ?? quien, obra: o,
            origen: esCliente(usuario) ? "web" : "mostrador", estado: "pedido",
            items: limpias.map(itemDeLinea),
            creado: ahora(), por: esCliente(usuario) ? null : usuario.nombre,
            enviado: null, vence: null, aceptado: null, vendido: null, ventaId: null, anulado: null
        };
        db().presupuestos.push(pr);
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    /** Los presupuestos (los de la ferretería): para armar y aceptados primero, después enviados, vendidos y anulados. */
    function listarPresupuestos(usuario, { estado = null } = {}) {
        exigir(esDelLocal(usuario), "Los presupuestos los ve la ferretería.");
        return db().presupuestos
            .filter((p) => !estado || p.estado === estado)
            .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.creado.localeCompare(a.creado))
            .map(armarPresupuesto);
    }

    /** Los presupuestos del cliente (el más nuevo primero). */
    function misPresupuestos(usuario) {
        exigir(esCliente(usuario), "Esta pantalla es del cliente.");
        return db().presupuestos.filter((p) => p.clienteId === usuario.cuentaId).sort((a, b) => b.creado.localeCompare(a.creado)).map(armarPresupuesto);
    }

    /** Para cambiar un presupuesto: de la ferretería, sin vender ni anular. Si ya estaba enviado, vuelve a "para armar". */
    function presupuestoParaCambiar(usuario, presupuestoId) {
        exigir(esDelLocal(usuario), "El presupuesto lo arma la ferretería.");
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(pr.estado === "pedido" || pr.estado === "enviado" || pr.estado === "aceptado", "Ese presupuesto ya no se puede cambiar.");
        if (pr.estado !== "pedido") Object.assign(pr, { estado: "pedido", enviado: null, vence: null, aceptado: null, aceptadoPorCliente: false });
        return pr;
    }

    /** Volver a armar uno ya enviado o aceptado (para corregir algo): vuelve a "para armar" y hay que mandarlo de nuevo. */
    function volverAArmar(usuario, presupuestoId) {
        const pr = presupuestoParaCambiar(usuario, presupuestoId);
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    /** Elegir el artículo de un renglón (el que no se entendió, "lo de la foto", o cambiarlo por otra medida). */
    function elegirArticulo(usuario, presupuestoId, itemId, productoId) {
        const pr = presupuestoParaCambiar(usuario, presupuestoId);
        const item = pr.items.find((i) => i.id === itemId);
        exigir(item, "Ese renglón no está en el presupuesto.");
        const p = buscar(db().productos, productoId, "Ese artículo no existe.");
        exigir(!pr.items.some((i) => i.productoId === p.id && i.id !== itemId), `${p.nombre} ya está en el presupuesto: cambiá la cantidad de ese renglón.`);
        const cantidad = cantidadPara(p, item.cantidad);
        Object.assign(item, { productoId: p.id, nombre: p.nombre, unidad: p.unidad, cantidad, precio: precioPara(p, cantidad), costo: p.costo });
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    function cambiarCantidad(usuario, presupuestoId, itemId, cantidad) {
        const pr = presupuestoParaCambiar(usuario, presupuestoId);
        const item = pr.items.find((i) => i.id === itemId);
        exigir(item, "Ese renglón no está en el presupuesto.");
        exigir(item.productoId, "Primero elegí qué artículo es.");
        const p = buscar(db().productos, item.productoId, "Ese artículo no existe.");
        item.cantidad = revisarCantidad(cantidad, p.unidad, `La cantidad de ${p.nombre}`);
        item.precio = precioPara(p, item.cantidad);
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    function quitarRenglon(usuario, presupuestoId, itemId) {
        const pr = presupuestoParaCambiar(usuario, presupuestoId);
        exigir(pr.items.some((i) => i.id === itemId), "Ese renglón no está en el presupuesto.");
        exigir(pr.items.length > 1, "Es el único renglón: si no va, anulá el presupuesto.");
        pr.items = pr.items.filter((i) => i.id !== itemId);
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    function sumarArticulo(usuario, presupuestoId, productoId, cantidad = 1) {
        const pr = presupuestoParaCambiar(usuario, presupuestoId);
        exigir(pr.items.length < TOPES.renglones, `Un presupuesto puede tener hasta ${TOPES.renglones} renglones.`);
        const p = buscar(db().productos, productoId, "Ese artículo no existe.");
        exigir(!pr.items.some((i) => i.productoId === p.id), `${p.nombre} ya está en el presupuesto: cambiá la cantidad de ese renglón.`);
        const c = revisarCantidad(cantidad, p.unidad, `La cantidad de ${p.nombre}`);
        pr.items.push({ id: nuevoId("i"), texto: "", foto: false, productoId: p.id, nombre: p.nombre, unidad: p.unidad, cantidad: c, precio: precioPara(p, c), costo: p.costo });
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    /** Mandarlo: fija los precios de hoy por 7 días y arma el mensaje (en la demo se copia o se comparte). */
    function enviarPresupuesto(usuario, presupuestoId) {
        exigir(esDelLocal(usuario), "El presupuesto lo manda la ferretería.");
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(pr.estado === "pedido" || pr.estado === "enviado", pr.estado === "aceptado" ? "Ya lo aceptó: pasalo a venta." : "Ese presupuesto ya no se puede mandar.");
        exigir(pr.items.every((i) => i.productoId), "Hay renglones sin elegir el artículo: elegilo o sacá el renglón.");
        pr.items.forEach((i) => {
            const p = buscar(db().productos, i.productoId);
            i.precio = precioPara(p, i.cantidad);
            i.costo = p.costo;
        });
        const vence = new Date();
        vence.setDate(vence.getDate() + VALIDEZ_DIAS);
        vence.setHours(20, 0, 0, 0);
        Object.assign(pr, { estado: "enviado", enviado: ahora(), vence: vence.toISOString() });
        guardado.persistir();
        const a = armarPresupuesto(pr);
        const nombre = a.cliente ? ` ${a.cliente.split(" ")[0]}` : "";
        const hasta = diaMes(vence.toISOString());
        const mensaje = `Hola${nombre}! Te paso el presupuesto N° ${a.numero} de ${NEGOCIO}${a.obra ? ` (${a.obra})` : ""}: `
            + `${a.items.length} ${a.items.length === 1 ? "artículo" : "artículos"}, total ${pesos(a.total)}. Los precios valen hasta el ${hasta}. `
            + (a.esDeMarcos ? "Si te sirve, aceptalo desde tu celu y te lo preparamos." : "Si te sirve, respondé este mensaje y te lo preparamos.");
        return { presupuesto: a, mensaje };
    }

    /** El cliente lo acepta (desde su celu) o la ferretería anota que lo aceptó por teléfono. */
    function aceptarPresupuesto(usuario, presupuestoId) {
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(esDelLocal(usuario) || (esCliente(usuario) && pr.clienteId === usuario.cuentaId), "Ese presupuesto no es tuyo.");
        exigir(pr.estado === "enviado", pr.estado === "aceptado" ? "Ya está aceptado." : "Se acepta cuando la ferretería lo manda.");
        exigir(!vencido(pr), "Venció: pedile a la ferretería que lo actualice.");
        // Si lo aceptó el cliente desde su celu, al mostrador le llega el aviso; si lo anotó la ferretería, no
        Object.assign(pr, { estado: "aceptado", aceptado: ahora(), aceptadoPorCliente: esCliente(usuario) });
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    /**
     * Pasar a venta: se descuenta el stock y se cobra (de contado o a la cuenta del cliente). Con los precios del
     * presupuesto si sigue valiendo; si venció, con los de hoy.
     */
    function venderPresupuesto(usuario, presupuestoId, { medio, pagaCon = null, autorizarTope = false } = {}) {
        exigir(esDelLocal(usuario), "La venta la hace la ferretería.");
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(pr.estado === "enviado" || pr.estado === "aceptado", pr.estado === "pedido" ? "Primero armalo y mandalo." : "Ese presupuesto ya no se puede vender.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        const a = armarPresupuesto(pr);
        const renglones = a.items.map((i) => {
            const p = buscar(db().productos, i.productoId, "Uno de los artículos ya no existe.");
            if (!p.servicio) exigir(p.stock >= i.cantidad - 1e-9, p.stock > 0 ? `De ${p.nombre} quedan solo ${cantidadTexto(p.stock, p.unidad)}.` : `No queda ${p.nombre}.`);
            return { productoId: p.id, nombre: p.nombre, rubro: p.rubro, unidad: p.unidad, precio: i.precioUsado, costo: p.costo, cantidad: i.cantidad, subtotal: i.subtotal, mayor: false };
        });
        const total = totalDe(renglones);
        exigir(medio !== "cuenta" || pr.clienteId, "Este presupuesto no es de una cuenta corriente: cobralo de contado.");
        const pago = revisarPago(usuario, { medio, pagaCon, total, clienteId: medio === "cuenta" ? pr.clienteId : null, autorizarTope });
        const venta = guardarVenta(usuario, renglones, total, medio, pago, pr.id);
        Object.assign(pr, { estado: "vendido", aceptado: pr.aceptado ?? venta.fecha, vendido: venta.fecha, ventaId: venta.id });
        guardado.persistir();
        return { presupuesto: armarPresupuesto(pr), venta: copia(venta) };
    }

    function anularPresupuesto(usuario, presupuestoId) {
        exigir(esDelLocal(usuario), "El presupuesto lo anula la ferretería.");
        const pr = buscar(db().presupuestos, presupuestoId, "Ese presupuesto no existe.");
        exigir(pr.estado !== "vendido" && pr.estado !== "anulado", "Ese presupuesto ya no se puede anular.");
        Object.assign(pr, { estado: "anulado", anulado: ahora(), anuladoPor: usuario.nombre });
        guardado.persistir();
        return armarPresupuesto(pr);
    }

    // ----- Vender -----

    /**
     * Arma el ticket (sin guardar nada): revisa cantidades (por unidad, metro o kilo) y stock, aplica el precio por
     * mayor y calcula el total. items: [{ productoId, cantidad }]
     */
    function armarTicket(items) {
        exigir(Array.isArray(items) && items.length, "El ticket está vacío.");
        exigir(items.length <= TOPES.renglones, `Un ticket puede tener hasta ${TOPES.renglones} artículos distintos.`);
        exigir(new Set(items.map((i) => i.productoId)).size === items.length, "Cada artículo va una sola vez (cambiá la cantidad).");
        const renglones = items.map(({ productoId, cantidad }) => {
            const p = buscar(db().productos, productoId, "Uno de los artículos ya no existe.");
            const n = revisarCantidad(cantidad, p.unidad, `La cantidad de ${p.nombre}`);
            if (!p.servicio) exigir(n <= p.stock + 1e-9, p.stock > 0 ? `De ${p.nombre} quedan solo ${cantidadTexto(p.stock, p.unidad)}.` : `No queda ${p.nombre}.`);
            return { ...renglonDe(p, n), precioLista: p.precio, mayorDesde: p.mayorDesde };
        });
        return { renglones, total: totalDe(renglones), ahorro: renglones.reduce((t, r) => t + subtotalDe(r.precioLista, r.cantidad) - r.subtotal, 0) };
    }

    /** Cobrar: efectivo (con "paga con" opcional → vuelto), transferencia, tarjeta o a cuenta corriente (con tope). */
    function vender(usuario, { items, medio, pagaCon = null, clienteId = null, autorizarTope = false } = {}) {
        exigir(esDelLocal(usuario), "Solo alguien de la ferretería puede vender.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        const { renglones, total } = armarTicket(items);
        const pago = revisarPago(usuario, { medio, pagaCon, total, clienteId, autorizarTope });
        const venta = guardarVenta(usuario, renglones, total, medio, pago);
        guardado.persistir();
        return { ...copia(venta), cuenta: pago.clienteId ? armarCuenta(buscar(db().cuentas, pago.clienteId)) : null };
    }

    // ----- Caja -----

    const delDia = (lista, dia) => lista.filter((x) => diaLocalDe(x.fecha) === dia);

    /** La caja de un día (hoy si no se dice). La ganancia (venta menos costo) la ve solo el dueño. */
    function caja(usuario, dia = fechaLocalISO(0)) {
        exigir(esDelLocal(usuario), "La caja la ve la ferretería.");
        const ventas = delDia(db().ventas, dia);
        const porMedio = { efectivo: 0, transferencia: 0, tarjeta: 0, cuenta: 0 };
        ventas.forEach((v) => (porMedio[v.medio] += v.total));
        const vendido = Object.values(porMedio).reduce((a, b) => a + b, 0);
        const pagos = db().cuentas.flatMap((c) => c.movimientos.filter((m) => m.tipo === "pago" && diaLocalDe(m.fecha) === dia));
        const cobros = { efectivo: 0, transferencia: 0 };
        pagos.forEach((m) => (cobros[m.medio] = (cobros[m.medio] ?? 0) + m.monto));
        const renglones = ventas.flatMap((v) => v.items);
        const costo = renglones.reduce((t, i) => t + Math.round((i.costo ?? 0) * i.cantidad), 0);
        const porArticulo = {};
        renglones.forEach((i) => {
            const a = (porArticulo[i.nombre] ??= { nombre: i.nombre, unidad: i.unidad ?? "u", cantidad: 0, plata: 0 });
            a.cantidad = redondearCantidad(a.cantidad + i.cantidad, a.unidad);
            a.plata += i.subtotal;
        });
        const masVendidos = Object.values(porArticulo).sort((a, b) => b.plata - a.plata || a.nombre.localeCompare(b.nombre, "es")).slice(0, 5);
        const porRubro = RUBROS.map((r) => ({ id: r.id, nombre: r.nombre, vendido: renglones.filter((i) => i.rubro === r.id).reduce((t, i) => t + i.subtotal, 0) }))
            .filter((r) => r.vendido > 0).sort((a, b) => b.vendido - a.vendido);
        const cierre = db().cierres.filter((c) => c.dia === dia).at(-1) ?? null;
        return {
            dia, cantidad: ventas.length, porMedio, vendido, cobros,
            ganancia: esDueno(usuario) ? vendido - costo : null,
            enCajon: FONDO_CAJA + porMedio.efectivo + cobros.efectivo,
            masVendidos, porRubro,
            presupuestosVendidos: ventas.filter((v) => v.presupuestoId).length,
            cierre: copia(cierre),
            ultimas: ventas.slice(-6).reverse().map((v) => ({ ...copia(v), cuenta: v.clienteId ? db().cuentas.find((c) => c.id === v.clienteId)?.nombre ?? null : null }))
        };
    }

    /** Los últimos 7 días (el dueño): lo vendido y la ganancia por día, el más nuevo primero. */
    function semana(usuario) {
        exigir(esDueno(usuario), "Los últimos 7 días los ve el dueño.");
        return Array.from({ length: 7 }, (_, i) => {
            const c = caja(usuario, fechaLocalISO(-i));
            return { dia: c.dia, vendido: c.vendido, ganancia: c.ganancia, cantidad: c.cantidad };
        });
    }

    /** Cerrar la caja de hoy: se cuenta la plata y dice si sobra o falta. */
    function cerrarCaja(usuario, contado) {
        exigir(esDelLocal(usuario), "Solo alguien de la ferretería cierra la caja.");
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
        listarProductos, producto, rapidos, porCodigo, hayQuePedir, margenDeRubro, cargarProducto, corregirProducto,
        verAumento, aplicarAumento, verMargen, aplicarMargen, deshacerCambio, ultimoCambio,
        verLista, aplicarLista, listaDeEjemplo,
        pedidosSugeridos, mensajePedido, recibirPedido,
        listarCuentas, cuenta, miCuenta, nuevaCuenta, cambiarTope, cobrarCuenta, mensajeCuenta, revisarTopeCuenta,
        sugerencias, verRenglones, nuevoPresupuesto, presupuesto, listarPresupuestos, misPresupuestos,
        novedades, marcarVisto,
        volverAArmar, elegirArticulo, cambiarCantidad, quitarRenglon, sumarArticulo, enviarPresupuesto, aceptarPresupuesto, venderPresupuesto, anularPresupuesto,
        armarTicket, vender,
        caja, semana, cerrarCaja
    };
}
