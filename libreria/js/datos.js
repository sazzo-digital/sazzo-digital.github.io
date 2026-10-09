// ============================================
// Datos de Sazzo Librería (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una librería de barrio inventada: 73 artículos sin marcas (escritura, cuadernos, papeles, cintas y adhesivos, arte,
// fotocopias y 6 libros inventados con su ISBN para probar el escáner), 4 proveedores, las listas escolares de 3
// colegios, pedidos de listas y las ventas de los últimos 7 días.
// Precios: cada artículo tiene su COSTO y su MARGEN; el precio de venta sale de ahí con el redondeo de librería. Si
// sube un proveedor, se sube el costo y el precio se recalcula con el mismo margen. Desde cierta cantidad, precio por
// mayor (10 % menos).
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra y se devuelven copias.
// Las ventas guardan el precio y el costo del momento: si después sube un proveedor, lo vendido no cambia.
// Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=d180eb8742";
import { enteroHasta, sinPasarse } from "../kit/js/topes.js?v=d180eb8742";
import { diaLocalDe, fechaLocalISO } from "../kit/js/fechas.js?v=d180eb8742";
import { columnasDe, numeroDe, textoParaComparar } from "../kit/js/tablas.js?v=d180eb8742";
import { MARCA, NEGOCIO, buscarPersona } from "./marca.js?v=d180eb8742";

export const VERSION_DATOS = 2; // 2: los libros con ISBN

// ---------- Topes (cada uno con su prueba de valor absurdo) ----------
export const TOPES = {
    cantidad: 999, // unidades de un artículo en una venta (100 fotocopias es normal)
    renglones: 40, // artículos distintos en un ticket
    costo: 5_000_000,
    precio: 10_000_000, // precio de venta que se escribe al cargar desde el mostrador
    margen: 500, // %
    stock: 9_999,
    pagaCon: 10_000_000,
    nombre: 50, // letras del nombre de un artículo
    para: 40, // "Para Lola · 1° B"
    aumentoMin: -50, // % de "Subió un proveedor"
    aumentoMax: 100,
    mayorDesde: 999, // desde cuántas unidades va el precio por mayor
    contado: 10_000_000, // plata contada al cerrar la caja
    productos: 500, // artículos en total (alguien aburrido cargando sin parar)
    ventas: 2000, // ventas guardadas en total (cada venta vuelve a guardar todo: sin tope, el celu se cuelga)
    pedidos: 300, // pedidos de listas escolares
    cambios: 300, // cambios de precios (aumentos y márgenes)
    entradas: 300, // mercadería recibida
    cierres: 300, // cierres de caja
    filasLista: 2000 // renglones de la lista de un proveedor en Excel
};

// Cómo se pueden llamar las columnas de la lista del proveedor (la primera que se parezca)
export const COLUMNAS_LISTA = {
    codigo: ["código", "codigo", "cod", "código de barras", "ean", "barras", "isbn"],
    nombre: ["artículo", "articulo", "producto", "productos", "descripción", "descripcion", "nombre", "detalle", "título", "titulo"],
    costo: ["costo", "precio de costo", "precio costo", "precio comercio", "precio mayorista", "neto", "precio lista", "precio de lista", "precio", "precios"]
};

export const FONDO_CAJA = 20_000; // el cambio con el que arranca el cajón cada día
export const DESCUENTO_MAYOR = 10; // % menos desde la cantidad "por mayor" de cada artículo
export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta" };

export const RUBROS = [
    { id: "escritura", nombre: "Escritura", icono: "ti-ballpen" },
    { id: "cuadernos", nombre: "Cuadernos y carpetas", icono: "ti-notebook" },
    { id: "papeles", nombre: "Papeles", icono: "ti-file-text" },
    { id: "cintas", nombre: "Cintas y adhesivos", icono: "ti-scissors" },
    { id: "arte", nombre: "Arte y geometría", icono: "ti-palette" },
    { id: "libros", nombre: "Libros", icono: "ti-book" },
    { id: "fotocopias", nombre: "Fotocopias", icono: "ti-printer" }
];
export const nombreRubro = (id) => RUBROS.find((r) => r.id === id)?.nombre ?? "Otros";

export const PROVEEDORES = [
    { id: "pr-papelera", nombre: "Papelera Central" },
    { id: "pr-escolar", nombre: "Distribuidora Escolar" },
    { id: "pr-adhesivos", nombre: "Adhesivos del Oeste" },
    { id: "pr-libros", nombre: "Distribuidora de Libros Sur" }
];

/** El margen con el que arranca cada rubro (la dueña lo cambia en "Cambiar margen"). Los libros dejan menos. */
export const MARGENES = { escritura: 80, cuadernos: 60, papeles: 70, cintas: 75, arte: 70, libros: 40, fotocopias: 200 };

/** ¿Es un ISBN (libro) válido? 13 números que empiezan con 978 o 979 y cierran con su dígito verificador. */
export function esISBN(codigo) {
    const c = String(codigo ?? "");
    if (!/^97[89]\d{10}$/.test(c)) return false;
    const suma = [...c.slice(0, 12)].reduce((t, d, i) => t + Number(d) * (i % 2 ? 3 : 1), 0);
    return (10 - (suma % 10)) % 10 === Number(c[12]);
}

export const ESTADOS_PEDIDO = {
    nueva: "Para armar",
    separada: "Separada",
    entregada: "Entregada",
    anulada: "Anulada"
};

// Cómo pide la gente en el mostrador → cómo se llama en la librería (el buscador entiende las dos). Son solo palabras
// para buscar: los nombres de los artículos no llevan marcas.
export const SINONIMOS = {
    birome: "lapicera", biromes: "lapicera", boligrafo: "lapicera", lapicero: "lapicera",
    plasticola: "adhesivo vinilico", voligoma: "adhesivo en barra", pegamento: "adhesivo", gotita: "adhesivo instantaneo",
    scotch: "cinta adhesiva", fibron: "marcador", liquid: "corrector",
    canson: "block de dibujo", copia: "fotocopia", copias: "fotocopia", fotocopias: "fotocopia", hojas: "repuesto"
};

/** Redondeo de librería, siempre para arriba: a $10 hasta $1.000, a $50 hasta $10.000 y a $100 desde ahí. */
export function redondear(precio) {
    const p = Math.round(precio * 100) / 100; // sin restos de coma (2900 × 1,6 = 4640,000…1)
    const paso = p < 1_000 ? 10 : p < 10_000 ? 50 : 100;
    return Math.max(paso, Math.ceil(p / paso) * paso);
}

/** Precio de venta: costo + margen, redondeado. */
export const precioDe = (costo, margen) => redondear(costo * (1 + margen / 100));

/** El precio por mayor de un precio de venta (10 % menos, redondeado). */
export const precioMayor = (precio) => redondear(precio * (1 - DESCUENTO_MAYOR / 100));

/** El precio de una unidad según cuántas se llevan (desde `mayorDesde`, el de por mayor). */
export const precioPara = (p, cantidad) => (p.mayorDesde && cantidad >= p.mayorDesde ? precioMayor(p.precio) : p.precio);

/** "$ 12.500" */
export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export const estadoStock = (p) => (p.servicio ? "servicio" : p.stock <= 0 ? "sin" : p.stock <= p.minimo ? "pedir" : "hay");

/** Cuánto pedir de algo que bajó del mínimo: hasta tener el doble del mínimo (al menos 1). */
export const cantidadSugerida = (p) => Math.max(1, p.minimo * 2 - p.stock);

/** Sin mayúsculas ni tildes, para buscar ("Lápiz" = "lapiz"). */
export const normal = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/** ¿El artículo coincide con lo que se escribió? Por nombre (palabra por palabra, con sinónimos) o por código. */
export function coincide(p, texto) {
    const t = normal(texto);
    if (!t) return true;
    if (p.codigo?.includes(t)) return true;
    const n = normal(p.nombre);
    const esta = (w) => n.includes(w) || (SINONIMOS[w] !== undefined && n.includes(SINONIMOS[w]));
    return esta(t) || t.split(" ").every(esta);
}

// ---------- Datos de fábrica ----------
// Por rubro: [nombre, costo, stock, mínimo, { rapido, mayor (desde cuántas), familia (se puede cambiar por otro de la
// misma familia si no alcanza) }]. Los servicios (fotocopias) no tienen stock.
const CATALOGO = {
    escritura: ["pr-escolar", [
        ["Lapicera azul trazo fino", 420, 48, 20, { rapido: true, mayor: 12 }],
        ["Lapicera negra trazo fino", 420, 40, 20, { rapido: true, mayor: 12 }],
        ["Lapicera roja trazo fino", 420, 26, 10, { mayor: 12 }],
        ["Lapicera verde trazo fino", 420, 12, 6, { mayor: 12 }],
        ["Lapicera borrable azul", 1_150, 9, 4],
        ["Lapicera gel negra", 950, 11, 4],
        ["Lápiz negro HB", 260, 60, 20, { rapido: true, mayor: 12 }],
        ["Portaminas 0,5 mm", 1_400, 6, 3],
        ["Minas 0,5 mm (tubo)", 500, 14, 5],
        ["Goma de borrar blanca", 230, 30, 10, { mayor: 12 }],
        ["Sacapuntas con depósito", 450, 14, 5],
        ["Corrector en cinta", 1_300, 2, 3],
        ["Resaltador amarillo", 600, 18, 6, { rapido: true }],
        ["Resaltadores x4 colores", 2_100, 5, 3],
        ["Marcador permanente negro", 700, 16, 6],
        ["Marcador para pizarra", 900, 10, 4],
        ["Fibras x12 colores", 2_400, 7, 3]
    ]],
    cuadernos: ["pr-papelera", [
        ["Cuaderno tapa dura 48 h rayado rojo", 2_900, 1, 4, { familia: "cuaderno-td-rayado" }],
        ["Cuaderno tapa dura 48 h rayado azul", 2_900, 9, 4, { rapido: true, familia: "cuaderno-td-rayado" }],
        ["Cuaderno tapa dura 48 h cuadriculado", 2_900, 8, 4],
        ["Cuaderno tapa blanda 48 h", 1_300, 20, 8],
        ["Cuaderno universitario 80 h espiral", 3_600, 12, 5],
        ["Repuesto N° 3 rayado 96 h", 3_100, 14, 6, { rapido: true }],
        ["Repuesto N° 3 cuadriculado 96 h", 3_100, 11, 6],
        ["Repuesto A4 rayado 96 h", 4_200, 8, 4],
        ["Carpeta N° 3 tapa dura", 2_500, 7, 3],
        ["Carpeta A4 con anillos", 3_800, 5, 3],
        ["Separadores N° 3 x6", 800, 15, 5],
        ["Folios N° 3 x10", 900, 12, 5]
    ]],
    papeles: ["pr-papelera", [
        ["Resma A4 75 g (500 hojas)", 5_600, 3, 5, { rapido: true, mayor: 5 }],
        ["Papel afiche", 280, 40, 15, { mayor: 10 }],
        ["Cartulina", 240, 35, 15, { mayor: 10 }],
        ["Papel glasé (sobre x10)", 380, 25, 10],
        ["Papel crepé", 300, 18, 8],
        ["Goma eva lisa", 420, 22, 10, { mayor: 10 }],
        ["Goma eva con brillo", 700, 12, 6],
        ["Block de dibujo N° 5", 1_400, 9, 4],
        ["Sobre papel madera A4", 160, 50, 20, { mayor: 10 }],
        ["Etiquetas escolares x24", 800, 10, 4]
    ]],
    cintas: ["pr-adhesivos", [
        ["Cinta adhesiva 12 mm x 30 m", 450, 24, 10, { rapido: true, mayor: 12 }],
        ["Cinta adhesiva 18 mm x 50 m", 800, 14, 6],
        ["Cinta de embalar marrón 48 mm", 1_500, 8, 4, { familia: "cinta-embalar" }],
        ["Cinta de embalar transparente 48 mm", 1_500, 0, 4, { familia: "cinta-embalar" }],
        ["Cinta de papel 24 mm", 950, 9, 4],
        ["Cinta doble faz 12 mm", 1_100, 6, 3],
        ["Cinta de raso 1 cm (por metro)", 150, 120, 40, { mayor: 10 }],
        ["Cinta de regalo rizada (rollo)", 600, 15, 5],
        ["Adhesivo vinílico 90 g", 850, 5, 4, { rapido: true }],
        ["Adhesivo en barra 21 g", 700, 12, 5],
        ["Adhesivo instantáneo", 900, 10, 4],
        ["Barras de silicona finas x10", 1_200, 8, 3]
    ]],
    arte: ["pr-escolar", [
        ["Lápices de colores x12", 2_300, 6, 3],
        ["Crayones x12", 1_300, 7, 3],
        ["Témperas x6", 2_000, 2, 3],
        ["Pincel N° 6", 500, 12, 4],
        ["Regla 20 cm", 420, 15, 5],
        ["Regla 30 cm", 550, 10, 4],
        ["Escuadra 45°", 600, 8, 3],
        ["Transportador", 380, 9, 3],
        ["Compás escolar", 1_800, 4, 2],
        ["Tijera escolar punta roma", 1_400, 4, 3],
        ["Plastilina x10", 1_100, 6, 3]
    ]],
    fotocopias: [null, [
        ["Fotocopia B/N", 50, null, null, { rapido: true, mayor: 50 }],
        ["Fotocopia doble faz B/N", 85, null, null, { mayor: 50 }],
        ["Impresión color A4", 200, null, null],
        ["Anillado (hasta 100 hojas)", 900, null, null],
        ["Plastificado A4", 500, null, null]
    ]],
    // Títulos inventados (sin editoriales reales). El ISBN también es inventado, pero válido: el escáner lo lee igual
    // que el de un libro de verdad. Un libro real que no esté → "¿Lo cargás?".
    libros: ["pr-libros", [
        ["Manual de 4° grado · Ciencias y Sociales", 20_000, 6, 3, { isbn: "9789870000013" }],
        ["Libro de lectura de 1° grado", 13_000, 5, 2, { isbn: "9789870000020" }],
        ["Diccionario escolar de bolsillo", 6_400, 4, 2, { isbn: "9789870000037" }],
        ["Cuadernillo de matemática 1° año", 8_500, 8, 3, { isbn: "9789870000044" }],
        ["Atlas escolar de la Argentina", 10_700, 3, 2, { isbn: "9789870000051" }],
        ["Cuentos para leer en voz alta", 10_000, 2, 2, { isbn: "9789870000068" }]
    ]]
};

// Las listas que dejaron los colegios: [colegio, grado, [[nombre del artículo, cantidad], …]]
const LISTAS = [
    ["Escuela N° 12", "1° grado", [
        ["Cuaderno tapa dura 48 h rayado rojo", 2],
        ["Lápiz negro HB", 3],
        ["Goma de borrar blanca", 2],
        ["Sacapuntas con depósito", 1],
        ["Lápices de colores x12", 1],
        ["Crayones x12", 1],
        ["Tijera escolar punta roma", 1],
        ["Adhesivo vinílico 90 g", 1],
        ["Adhesivo en barra 21 g", 1],
        ["Regla 20 cm", 1],
        ["Papel glasé (sobre x10)", 2],
        ["Plastilina x10", 1],
        ["Etiquetas escolares x24", 1]
    ]],
    ["Colegio del Parque", "4° grado", [
        ["Carpeta N° 3 tapa dura", 1],
        ["Repuesto N° 3 rayado 96 h", 2],
        ["Repuesto N° 3 cuadriculado 96 h", 1],
        ["Separadores N° 3 x6", 1],
        ["Folios N° 3 x10", 1],
        ["Lapicera azul trazo fino", 3],
        ["Lapicera roja trazo fino", 1],
        ["Lápiz negro HB", 2],
        ["Goma de borrar blanca", 1],
        ["Corrector en cinta", 1],
        ["Fibras x12 colores", 1],
        ["Regla 30 cm", 1],
        ["Escuadra 45°", 1],
        ["Transportador", 1],
        ["Compás escolar", 1],
        ["Manual de 4° grado · Ciencias y Sociales", 1]
    ]],
    ["Escuela Técnica N° 3", "1° año", [
        ["Cuaderno universitario 80 h espiral", 3],
        ["Carpeta A4 con anillos", 1],
        ["Repuesto A4 rayado 96 h", 2],
        ["Lapicera azul trazo fino", 2],
        ["Lapicera negra trazo fino", 2],
        ["Resaltador amarillo", 2],
        ["Portaminas 0,5 mm", 1],
        ["Minas 0,5 mm (tubo)", 1],
        ["Compás escolar", 1],
        ["Escuadra 45°", 1],
        ["Regla 30 cm", 1],
        ["Block de dibujo N° 5", 1],
        ["Cuadernillo de matemática 1° año", 1],
        ["Diccionario escolar de bolsillo", 1]
    ]]
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

/** Un momento de hace `dias` días a la hora `hora` (decimal: 9.5 = 9:30). */
function momento(dias, hora) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 0, 0);
    return d.toISOString();
}

const renglonDe = (p, cantidad) => ({ productoId: p.id, nombre: p.nombre, rubro: p.rubro, precio: precioPara(p, cantidad), costo: p.costo, cantidad, mayor: precioPara(p, cantidad) !== p.precio });
const totalDe = (items) => items.reduce((t, i) => t + i.precio * i.cantidad, 0);

export function semilla() {
    const azar = azarFijo(11);
    const productos = [];
    let n = 1;
    for (const [rubro, [proveedorId, lista]] of Object.entries(CATALOGO)) {
        for (const [nombre, costo, stock, minimo, { rapido = false, mayor = null, familia = null, isbn = null } = {}] of lista) {
            const margen = MARGENES[rubro];
            productos.push({
                id: `p-${n}`, codigo: isbn ?? `2001${String(n).padStart(9, "0")}`, nombre, rubro, proveedorId,
                costo, margen, precio: precioDe(costo, margen),
                servicio: stock === null, stock: stock ?? 0, minimo: minimo ?? 0,
                rapido, mayorDesde: mayor, familia
            });
            n++;
        }
    }
    const porNombre = (nombre) => productos.find((p) => p.nombre === nombre);
    const listas = LISTAS.map(([colegio, grado, items], i) => ({
        id: `l-${i + 1}`, colegio, grado,
        items: items.map(([nombre, cantidad]) => ({ productoId: porNombre(nombre)?.id ?? null, cantidad }))
    }));

    // Ventas de los últimos 6 días y de hoy hasta hace un rato (de 8 a 20)
    const ventas = [];
    const elegir = () => {
        const peso = productos.map((p) => (p.rapido ? 6 : 1));
        let r = azar() * peso.reduce((a, b) => a + b, 0);
        return productos.find((_, i) => (r -= peso[i]) < 0) ?? productos[0];
    };
    const ahoraHora = new Date().getHours() + new Date().getMinutes() / 60;
    for (let dias = 6; dias >= 0; dias--) {
        const hasta = dias === 0 ? Math.min(20, ahoraHora - 0.25) : 20;
        const cuantas = dias === 0 ? Math.max(0, Math.min(20, Math.floor((hasta - 8) * 1.8))) : 22 + Math.floor(azar() * 12);
        for (let i = 0; i < cuantas; i++) {
            const hora = 8 + ((hasta - 8) * (i + azar() * 0.8)) / Math.max(1, cuantas);
            const items = [];
            const renglones = 1 + Math.floor(azar() * 3);
            for (let r = 0; r < renglones; r++) {
                const p = elegir();
                if (items.some((x) => x.productoId === p.id)) continue;
                const cantidad = p.servicio ? 1 + Math.floor(azar() * 30) : 1 + Math.floor(azar() * 2);
                items.push(renglonDe(p, cantidad));
            }
            const total = totalDe(items);
            const r = azar();
            const medio = r < 0.5 ? "efectivo" : r < 0.8 ? "transferencia" : "tarjeta";
            ventas.push({ id: `v-${dias}-${i}`, fecha: momento(dias, hora), items, total, medio, pagaCon: null, vuelto: null, por: azar() < 0.65 ? "Joaquín" : "Mariela", pedidoId: null });
        }
    }

    // Dos pedidos de listas de otras familias: uno separado esperando que lo busquen y uno entregado ayer
    const pedidoDe = (numero, lista, para, origen, estado, diasAtras) => {
        const items = listas.find((l) => l.id === lista).items.map((i) => {
            const p = productos.find((x) => x.id === i.productoId);
            return { productoId: p.id, nombre: p.nombre, cantidad: i.cantidad, precio: p.precio, costo: p.costo, falta: false, cambiadoDe: null };
        });
        const l = listas.find((x) => x.id === lista);
        return {
            id: `pe-${numero}`, numero, listaId: lista, colegio: l.colegio, grado: l.grado, para, clienteId: null, origen, estado, items,
            creado: momento(diasAtras + 1, 17.5), por: origen === "web" ? null : "Joaquín",
            separado: momento(diasAtras, 10), avisado: momento(diasAtras, 10.2), entregado: null, ventaId: null, anulado: null
        };
    };
    const ortiz = pedidoDe(101, "l-2", "Familia Ortiz · 4° B", "web", "separada", 1);
    const benja = pedidoDe(102, "l-1", "Benja · 1° A", "mostrador", "entregada", 1);
    benja.entregado = momento(1, 18);
    const ventaBenja = { id: "v-lista-102", fecha: benja.entregado, items: benja.items.map((i) => ({ productoId: i.productoId, nombre: i.nombre, rubro: productos.find((p) => p.id === i.productoId).rubro, precio: i.precio, costo: i.costo, cantidad: i.cantidad, mayor: false })), medio: "transferencia", pagaCon: null, vuelto: null, por: "Joaquín", pedidoId: benja.id };
    ventaBenja.total = totalDe(ventaBenja.items);
    benja.ventaId = ventaBenja.id;
    ventas.push(ventaBenja);
    ventas.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { productos, listas, pedidos: [ortiz, benja], ventas, cambios: [], entradas: [], cierres: [] };
}

// ---------- Permisos ----------
const esDuena = (u) => u?.rol === "duena";
const esDelLocal = (u) => u?.rol === "duena" || u?.rol === "empleado";
const esClienta = (u) => u?.rol === "clienta";

const ORDEN_ESTADO = { nueva: 0, separada: 1, entregada: 2, anulada: 3 };

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

    /** Lista de artículos (filtro por texto, rubro o proveedor), ordenada por nombre. */
    function listarProductos({ texto = "", rubro = null, proveedorId = null } = {}) {
        return db().productos
            .filter((p) => (!rubro || p.rubro === rubro) && (!proveedorId || p.proveedorId === proveedorId) && coincide(p, texto))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map(armarProducto);
    }

    const producto = (id) => armarProducto(buscar(db().productos, id, "Ese artículo no existe."));
    const rapidos = () => db().productos.filter((p) => p.rapido).map(armarProducto);

    function porCodigo(codigo) {
        const c = String(codigo ?? "").trim();
        const p = db().productos.find((x) => x.codigo === c);
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
     * - La dueña, desde Stock: con costo y margen (el precio sale solo), proveedor, mínimo y por mayor.
     * - Cualquiera del local, desde Vender ("¿Lo cargás?"): con el precio de venta; el costo se calcula con el margen
     *   del rubro y la dueña lo corrige después.
     */
    function cargarProducto(usuario, { nombre, codigo = "", rubro, proveedorId = null, costo, margen, precio, stock = 0, minimo = 0, mayorDesde = null } = {}) {
        exigir(esDelLocal(usuario), "Solo alguien de la librería puede cargar artículos.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del artículo.");
        exigir(RUBROS.some((r) => r.id === rubro), "Elegí el rubro.");
        const c = String(codigo ?? "").trim();
        exigir(!c || /^\d{4,14}$/.test(c), "El código tiene que tener entre 4 y 14 números.");
        exigir(!c || !db().productos.some((p) => p.codigo === c), "Ya hay un artículo con ese código.");
        exigir(!db().productos.some((p) => normal(p.nombre) === normal(n)), "Ya hay un artículo con ese nombre.");
        exigir(!proveedorId || proveedor(proveedorId), "Ese proveedor no existe.");
        revisarTope(db().productos, TOPES.productos, "artículos");
        const servicio = rubro === "fotocopias";
        let costoFinal, margenFinal, precioFinal;
        if (costo !== undefined && costo !== null) {
            exigir(esDuena(usuario), "El costo y el margen los carga la dueña.");
            costoFinal = enteroHasta(costo, "El costo", { desde: 1, hasta: TOPES.costo });
            margenFinal = margen === undefined || margen === null ? margenDeRubro(rubro) : enteroHasta(margen, "El margen", { hasta: TOPES.margen });
            precioFinal = precioDe(costoFinal, margenFinal);
        } else {
            precioFinal = enteroHasta(precio, "El precio", { desde: 1, hasta: TOPES.precio });
            margenFinal = margenDeRubro(rubro);
            costoFinal = Math.max(1, Math.round(precioFinal / (1 + margenFinal / 100)));
        }
        const p = {
            id: nuevoId("p"),
            codigo: c || `29${String(Date.now()).slice(-8)}${String(db().productos.length).padStart(3, "0")}`,
            nombre: n, rubro, proveedorId, costo: costoFinal, margen: margenFinal, precio: precioFinal, servicio,
            stock: servicio ? 0 : enteroHasta(stock, "El stock", { hasta: TOPES.stock }),
            minimo: servicio ? 0 : enteroHasta(minimo, "El mínimo", { hasta: TOPES.stock }),
            rapido: false,
            mayorDesde: mayorDesde === null || mayorDesde === "" ? null : enteroHasta(mayorDesde, "La cantidad por mayor", { desde: 2, hasta: TOPES.mayorDesde }),
            familia: null
        };
        db().productos.push(p);
        guardado.persistir();
        return armarProducto(p);
    }

    /** La dueña corrige costo, margen, stock, mínimo o desde cuántas va por mayor (lo que no se pasa, queda igual). */
    function corregirProducto(usuario, id, { costo, margen, stock, minimo, mayorDesde } = {}) {
        exigir(esDuena(usuario), "Solo la dueña cambia costos, márgenes y stock.");
        const p = buscar(db().productos, id, "Ese artículo no existe.");
        const nuevo = {
            costo: costo === undefined ? p.costo : enteroHasta(costo, "El costo", { desde: 1, hasta: TOPES.costo }),
            margen: margen === undefined ? p.margen : enteroHasta(margen, "El margen", { hasta: TOPES.margen }),
            stock: stock === undefined || p.servicio ? p.stock : enteroHasta(stock, "El stock", { hasta: TOPES.stock }),
            minimo: minimo === undefined || p.servicio ? p.minimo : enteroHasta(minimo, "El mínimo", { hasta: TOPES.stock }),
            mayorDesde: mayorDesde === undefined ? p.mayorDesde : mayorDesde === null ? null : enteroHasta(mayorDesde, "La cantidad por mayor", { desde: 2, hasta: TOPES.mayorDesde })
        };
        const cambiaPrecio = nuevo.costo !== p.costo || nuevo.margen !== p.margen;
        Object.assign(p, nuevo);
        if (cambiaPrecio) p.precio = precioDe(p.costo, p.margen);
        guardado.persistir();
        return armarProducto(p);
    }

    // ----- Precios: "Subió un proveedor" y "Cambiar margen" (los dos con Deshacer) -----

    function revisarPorcentaje(porcentaje) {
        exigir(Number.isInteger(porcentaje) && porcentaje >= TOPES.aumentoMin && porcentaje <= TOPES.aumentoMax,
            `El aumento tiene que ser un número entero entre ${TOPES.aumentoMin} % y ${TOPES.aumentoMax} %.`);
        return porcentaje;
    }

    const filaCambio = (p, costoDespues, margenDespues) => ({
        id: p.id, nombre: p.nombre,
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
        exigir(esDuena(usuario), "Solo la dueña cambia los precios.");
        const cambios = verAumento(proveedorId, porcentaje);
        exigir(porcentaje !== 0, "Con 0 % no cambia nada.");
        return guardarCambio(usuario, "aumento", { proveedorId, porcentaje }, cambios);
    }

    function aplicarMargen(usuario, rubro, margen) {
        exigir(esDuena(usuario), "Solo la dueña cambia los márgenes.");
        const cambios = verMargen(rubro, margen);
        exigir(cambios.some((c) => c.margenAntes !== c.margenDespues), `Todo ${nombreRubro(rubro)} ya tiene ${margen} % de margen.`);
        return guardarCambio(usuario, "margen", { rubro, margen }, cambios);
    }

    /** Deshacer: solo el último cambio de precios, y vuelve cada costo, margen y precio a como estaba. */
    function deshacerCambio(usuario, cambioId) {
        exigir(esDuena(usuario), "Solo la dueña cambia los precios.");
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

    // ----- La lista del proveedor en Excel -----

    /**
     * Lee las filas de un Excel (las de leerExcel del kit, ya con topes) y arma antes → después: cada renglón se cruza
     * con un artículo por el código (o, si no tiene, por el nombre igual). Lo que trae la lista es el COSTO (lo que le
     * cobra el proveedor a la librería): el precio de venta se recalcula con el margen de cada artículo. No cambia nada.
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
        exigir(esDuena(usuario), "Solo la dueña cambia los precios.");
        const { cambios } = verLista(filas);
        exigir(cambios.length, "Con esta lista no cambia ningún costo.");
        return guardarCambio(usuario, "excel", {}, cambios);
    }

    /**
     * Una lista de ejemplo de un proveedor, como la mandaría él (para probar sin tener una): el nombre arriba, los
     * títulos y sus artículos con el costo nuevo (sube un 12 %, con centavos y sin redondear, como vienen).
     */
    function listaDeEjemplo(proveedorId = "pr-papelera") {
        const prov = proveedor(proveedorId);
        exigir(prov, "Ese proveedor no existe.");
        const productos = db().productos.filter((p) => p.proveedorId === proveedorId).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        return [
            [`${prov.nombre} · Lista de precios para comercios (ejemplo)`],
            [],
            ["Código", "Artículo", "Costo"],
            ...productos.map((p) => [p.codigo, p.nombre, Math.round(p.costo * 1.12 * 100) / 100])
        ];
    }

    // ----- Pedidos a los proveedores -----

    /** Lo que hay que pedir, separado por proveedor, con la cantidad sugerida (hasta el doble del mínimo). */
    function pedidosSugeridos() {
        const faltan = hayQuePedir();
        return PROVEEDORES.map((pr) => ({
            ...pr,
            items: faltan.filter((p) => p.proveedorId === pr.id).map((p) => ({ id: p.id, nombre: p.nombre, stock: p.stock, minimo: p.minimo, cantidad: cantidadSugerida(p) }))
        })).filter((pr) => pr.items.length);
    }

    /** El mensaje para mandarle al proveedor (en la demo se copia). */
    function mensajePedido(proveedorId) {
        const pr = proveedor(proveedorId);
        exigir(pr, "Ese proveedor no existe.");
        const items = pedidosSugeridos().find((x) => x.id === proveedorId)?.items ?? [];
        exigir(items.length, `No hay nada para pedirle a ${pr.nombre}.`);
        return `Hola ${pr.nombre}! Te hago un pedido para ${NEGOCIO}:\n${items.map((i) => `- ${i.cantidad} × ${i.nombre}`).join("\n")}\nGracias!`;
    }

    /** Llegó la mercadería del proveedor: suma lo sugerido al stock (la dueña). */
    function recibirPedido(usuario, proveedorId) {
        exigir(esDuena(usuario), "La mercadería que llega la carga la dueña.");
        const pr = proveedor(proveedorId);
        exigir(pr, "Ese proveedor no existe.");
        const items = pedidosSugeridos().find((x) => x.id === proveedorId)?.items ?? [];
        exigir(items.length, `No hay nada pedido a ${pr.nombre}.`);
        revisarTope(db().entradas, TOPES.entradas, "entradas de mercadería");
        items.forEach((i) => {
            const p = buscar(db().productos, i.id);
            p.stock = Math.min(TOPES.stock, p.stock + i.cantidad);
        });
        const entrada = { id: nuevoId("en"), proveedorId, fecha: ahora(), por: usuario.nombre, items };
        db().entradas.push(entrada);
        guardado.persistir();
        return copia(entrada);
    }

    // ----- Listas escolares -----

    /** Las listas de los colegios, con el precio de hoy de cada artículo y el total. */
    function listas() {
        return db().listas.map((l) => {
            const items = l.items.map((i) => {
                const p = db().productos.find((x) => x.id === i.productoId);
                return p ? { productoId: p.id, nombre: p.nombre, cantidad: i.cantidad, precio: p.precio, subtotal: p.precio * i.cantidad } : null;
            }).filter(Boolean);
            return { id: l.id, colegio: l.colegio, grado: l.grado, nombre: `${l.colegio} · ${l.grado}`, items, total: items.reduce((t, i) => t + i.subtotal, 0) };
        });
    }

    /** Un pedido con su total y, mientras está para armar, si alcanza el stock de cada artículo (y qué otro hay). */
    function armarPedido(pe) {
        const items = pe.items.map((i) => {
            const p = db().productos.find((x) => x.id === i.productoId);
            const r = { ...copia(i), stock: p?.stock ?? 0, alcanza: true, alternativa: null };
            if (pe.estado === "nueva") {
                r.precio = p?.precio ?? i.precio; // mientras no se separa, va el precio de hoy
                r.alcanza = !!p && p.stock >= i.cantidad;
                if (!r.alcanza && p?.familia) {
                    const otro = db().productos
                        .filter((x) => x.familia === p.familia && x.id !== p.id && x.stock >= i.cantidad && !pe.items.some((y) => y.productoId === x.id))
                        .sort((a, b) => b.stock - a.stock)[0];
                    if (otro) r.alternativa = { id: otro.id, nombre: otro.nombre, stock: otro.stock, precio: otro.precio };
                }
            }
            return r;
        });
        const cobrables = items.filter((i) => !i.falta);
        const sumar = (lista) => lista.reduce((t, i) => t + i.precio * i.cantidad, 0);
        return {
            ...copia(pe),
            items,
            lista: `${pe.colegio} · ${pe.grado}`,
            articulos: cobrables.reduce((t, i) => t + i.cantidad, 0),
            total: sumar(cobrables),
            totalSiSepara: sumar(cobrables.filter((i) => i.alcanza)), // lo que se cobraría si se separa así
            faltan: items.filter((i) => i.falta || !i.alcanza).length,
            cliente: pe.clienteId ? buscarPersona(pe.clienteId)?.nombre ?? null : null
        };
    }

    /** Pedir una lista: la clienta desde el celular o el empleado en el mostrador. `sin`: lo que ya tienen en casa. */
    function nuevoPedido(usuario, { listaId, sin = [], para } = {}) {
        exigir(esDelLocal(usuario) || esClienta(usuario), "Para pedir una lista hay que entrar como alguien de la demo.");
        const l = buscar(db().listas, listaId, "Esa lista no existe.");
        exigir(Array.isArray(sin) && sin.every((id) => l.items.some((i) => i.productoId === id)), "Lo que destildaste no es de esta lista.");
        const items = l.items.filter((i) => i.productoId && !sin.includes(i.productoId));
        exigir(items.length, "Destildaste todo: no queda nada para pedir.");
        const quien = sinPasarse(para, TOPES.para, "para quién es");
        exigir(quien, "Poné para quién es la lista (ej: Lola · 1° B).");
        revisarTope(db().pedidos, TOPES.pedidos, "pedidos de listas");
        const pe = {
            id: nuevoId("pe"), numero: Math.max(100, ...db().pedidos.map((x) => x.numero)) + 1,
            listaId: l.id, colegio: l.colegio, grado: l.grado, para: quien,
            clienteId: esClienta(usuario) ? usuario.id : null, origen: esClienta(usuario) ? "web" : "mostrador", estado: "nueva",
            items: items.map((i) => {
                const p = buscar(db().productos, i.productoId);
                return { productoId: p.id, nombre: p.nombre, cantidad: i.cantidad, precio: p.precio, costo: p.costo, falta: false, cambiadoDe: null };
            }),
            creado: ahora(), por: esClienta(usuario) ? null : usuario.nombre,
            separado: null, avisado: null, entregado: null, ventaId: null, anulado: null
        };
        db().pedidos.push(pe);
        guardado.persistir();
        return armarPedido(pe);
    }

    const pedido = (id) => armarPedido(buscar(db().pedidos, id, "Ese pedido no existe."));

    /** Los pedidos de listas (los de la librería): para armar primero, después separadas, entregadas y anuladas. */
    function listarPedidos(usuario, { estado = null } = {}) {
        exigir(esDelLocal(usuario), "Los pedidos de listas los ve la librería.");
        return db().pedidos
            .filter((p) => !estado || p.estado === estado)
            .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.creado.localeCompare(a.creado))
            .map(armarPedido);
    }

    /** Los pedidos de la clienta (el más nuevo primero). */
    function misPedidos(usuario) {
        exigir(esClienta(usuario), "Esta pantalla es de la clienta.");
        return db().pedidos.filter((p) => p.clienteId === usuario.id).sort((a, b) => b.creado.localeCompare(a.creado)).map(armarPedido);
    }

    /** Si no alcanza un artículo, se cambia por otro de la misma familia (ej: el cuaderno rojo por el azul). */
    function cambiarArticulo(usuario, pedidoId, productoId, otroId) {
        exigir(esDelLocal(usuario), "La lista la arma la librería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nueva", "La lista ya está separada: no se puede cambiar.");
        const item = pe.items.find((i) => i.productoId === productoId);
        exigir(item, "Ese artículo no está en la lista.");
        const viejo = buscar(db().productos, productoId, "Ese artículo no existe.");
        const otro = buscar(db().productos, otroId, "El artículo nuevo no existe.");
        exigir(viejo.familia && viejo.familia === otro.familia && otro.id !== viejo.id, `${otro.nombre} no reemplaza a ${viejo.nombre}.`);
        exigir(!pe.items.some((i) => i.productoId === otro.id), `${otro.nombre} ya está en la lista.`);
        Object.assign(item, { productoId: otro.id, nombre: otro.nombre, precio: otro.precio, costo: otro.costo, cambiadoDe: item.cambiadoDe ?? viejo.nombre });
        guardado.persistir();
        return armarPedido(pe);
    }

    /** Separar: se descuenta del stock lo que hay; lo que no alcanza queda marcado como "falta" (no se cobra). */
    function separarPedido(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "La lista la separa la librería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nueva", pe.estado === "separada" ? "Esa lista ya está separada." : "Esa lista ya no se puede separar.");
        const productos = pe.items.map((i) => db().productos.find((x) => x.id === i.productoId));
        exigir(pe.items.some((i, n) => productos[n] && productos[n].stock >= i.cantidad), "No hay nada de la lista en stock.");
        pe.items.forEach((i, n) => {
            const p = productos[n];
            if (p && p.stock >= i.cantidad) {
                p.stock -= i.cantidad;
                i.precio = p.precio; // el precio del día que se separa
                i.costo = p.costo;
                i.falta = false;
            } else {
                i.falta = true;
            }
        });
        pe.estado = "separada";
        pe.separado = ahora();
        pe.separadoPor = usuario.nombre;
        guardado.persistir();
        return armarPedido(pe);
    }

    /** El mensaje de "ya está separada" (en la demo se copia) y queda anotado que se avisó. */
    function avisarPedido(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "Avisa la librería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "separada", "Se avisa cuando la lista está separada.");
        pe.avisado = ahora();
        guardado.persistir();
        const a = armarPedido(pe);
        const faltan = a.items.filter((i) => i.falta);
        const mensaje = `Hola${a.cliente ? ` ${a.cliente}` : ""}! Ya separamos la lista de ${a.grado} (${a.colegio}) para ${a.para} en ${NEGOCIO}. `
            + `Son ${a.articulos} artículos, total ${pesos(a.total)}.`
            + (faltan.length ? ` Nos faltó: ${faltan.map((i) => i.nombre).join(", ")}; te avisamos cuando llegue.` : "")
            + " Te esperamos!";
        return { pedido: a, mensaje };
    }

    function revisarPago(medio, pagaCon, total) {
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        if (medio !== "efectivo" || pagaCon === null || pagaCon === undefined || pagaCon === "") return { pagaCon: null, vuelto: null };
        const con = enteroHasta(pagaCon, "Con cuánto paga", { desde: 1, hasta: TOPES.pagaCon });
        exigir(con >= total, `Con ${pesos(con)} no alcanza: son ${pesos(total)}.`);
        return { pagaCon: con, vuelto: con - total };
    }

    /** Vinieron a buscarla: se cobra y queda como venta (el stock ya se descontó al separar). */
    function entregarPedido(usuario, pedidoId, { medio, pagaCon = null } = {}) {
        exigir(esDelLocal(usuario), "La lista la entrega la librería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "separada", "Primero hay que separar la lista.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        const items = pe.items.filter((i) => !i.falta).map((i) => ({
            productoId: i.productoId, nombre: i.nombre, rubro: db().productos.find((p) => p.id === i.productoId)?.rubro ?? null,
            precio: i.precio, costo: i.costo, cantidad: i.cantidad, mayor: false
        }));
        const total = totalDe(items);
        const pago = revisarPago(medio, pagaCon, total);
        const venta = { id: nuevoId("v"), fecha: ahora(), items, total, medio, ...pago, por: usuario.nombre, pedidoId: pe.id };
        db().ventas.push(venta);
        Object.assign(pe, { estado: "entregada", entregado: venta.fecha, ventaId: venta.id });
        guardado.persistir();
        return { pedido: armarPedido(pe), venta: copia(venta) };
    }

    /** Anular: si estaba separada, lo separado vuelve al stock. Nada se borra. */
    function anularPedido(usuario, pedidoId) {
        exigir(esDelLocal(usuario), "La lista la anula la librería.");
        const pe = buscar(db().pedidos, pedidoId, "Ese pedido no existe.");
        exigir(pe.estado === "nueva" || pe.estado === "separada", "Esa lista ya no se puede anular.");
        if (pe.estado === "separada") {
            pe.items.filter((i) => !i.falta).forEach((i) => {
                const p = db().productos.find((x) => x.id === i.productoId);
                if (p) p.stock = Math.min(TOPES.stock, p.stock + i.cantidad);
            });
        }
        Object.assign(pe, { estado: "anulada", anulado: ahora(), anuladoPor: usuario.nombre });
        guardado.persistir();
        return armarPedido(pe);
    }

    // ----- Vender -----

    /**
     * Arma el ticket (sin guardar nada): revisa cantidades y stock, aplica el precio por mayor y calcula el total.
     * items: [{ productoId, cantidad }]
     */
    function armarTicket(items) {
        exigir(Array.isArray(items) && items.length, "El ticket está vacío.");
        exigir(items.length <= TOPES.renglones, `Un ticket puede tener hasta ${TOPES.renglones} artículos distintos.`);
        exigir(new Set(items.map((i) => i.productoId)).size === items.length, "Cada artículo va una sola vez (cambiá la cantidad).");
        const renglones = items.map(({ productoId, cantidad }) => {
            const p = buscar(db().productos, productoId, "Uno de los artículos ya no existe.");
            const n = enteroHasta(cantidad, `La cantidad de ${p.nombre}`, { desde: 1, hasta: TOPES.cantidad });
            if (!p.servicio) exigir(n <= p.stock, p.stock ? `De ${p.nombre} quedan solo ${p.stock}.` : `No queda ${p.nombre}.`);
            return { ...renglonDe(p, n), precioLista: p.precio, mayorDesde: p.mayorDesde };
        });
        const total = totalDe(renglones);
        return { renglones, total, ahorro: renglones.reduce((t, r) => t + (r.precioLista - r.precio) * r.cantidad, 0) };
    }

    /** Cobrar en efectivo (con "paga con" opcional → vuelto), transferencia o tarjeta. */
    function vender(usuario, { items, medio, pagaCon = null } = {}) {
        exigir(esDelLocal(usuario), "Solo alguien de la librería puede vender.");
        revisarTope(db().ventas, TOPES.ventas, "ventas");
        exigir(MEDIOS[medio], "Elegí cómo paga.");
        const { renglones, total } = armarTicket(items);
        const pago = revisarPago(medio, pagaCon, total);
        const venta = {
            id: nuevoId("v"), fecha: ahora(),
            items: renglones.map(({ productoId, nombre, rubro, precio, costo, cantidad, mayor }) => ({ productoId, nombre, rubro, precio, costo, cantidad, mayor })),
            total, medio, ...pago, por: usuario.nombre, pedidoId: null
        };
        renglones.forEach((r) => {
            const p = buscar(db().productos, r.productoId);
            if (!p.servicio) p.stock -= r.cantidad;
        });
        db().ventas.push(venta);
        guardado.persistir();
        return copia(venta);
    }

    // ----- Caja -----

    const delDia = (lista, dia) => lista.filter((x) => diaLocalDe(x.fecha) === dia);

    /** La caja de un día (hoy si no se dice). La ganancia (venta menos costo) la ve solo la dueña. */
    function caja(usuario, dia = fechaLocalISO(0)) {
        exigir(esDelLocal(usuario), "La caja la ve la librería.");
        const ventas = delDia(db().ventas, dia);
        const porMedio = { efectivo: 0, transferencia: 0, tarjeta: 0 };
        ventas.forEach((v) => (porMedio[v.medio] += v.total));
        const vendido = porMedio.efectivo + porMedio.transferencia + porMedio.tarjeta;
        const renglones = ventas.flatMap((v) => v.items);
        const costo = renglones.reduce((t, i) => t + (i.costo ?? 0) * i.cantidad, 0);
        const cuantos = {};
        renglones.forEach((i) => (cuantos[i.nombre] = (cuantos[i.nombre] ?? 0) + i.cantidad));
        const masVendidos = Object.entries(cuantos).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")).slice(0, 5).map(([nombre, cantidad]) => ({ nombre, cantidad }));
        const porRubro = RUBROS.map((r) => ({ id: r.id, nombre: r.nombre, vendido: renglones.filter((i) => i.rubro === r.id).reduce((t, i) => t + i.precio * i.cantidad, 0) }))
            .filter((r) => r.vendido > 0).sort((a, b) => b.vendido - a.vendido);
        const cierre = db().cierres.filter((c) => c.dia === dia).at(-1) ?? null;
        return {
            dia, cantidad: ventas.length, porMedio, vendido,
            ganancia: esDuena(usuario) ? vendido - costo : null,
            enCajon: FONDO_CAJA + porMedio.efectivo,
            masVendidos, porRubro,
            listasEntregadas: ventas.filter((v) => v.pedidoId).length,
            cierre: copia(cierre),
            ultimas: ventas.slice(-6).reverse().map(copia)
        };
    }

    /** Los últimos 7 días (la dueña): lo vendido y la ganancia por día, el más nuevo primero. */
    function semana(usuario) {
        exigir(esDuena(usuario), "Los últimos 7 días los ve la dueña.");
        return Array.from({ length: 7 }, (_, i) => {
            const c = caja(usuario, fechaLocalISO(-i));
            return { dia: c.dia, vendido: c.vendido, ganancia: c.ganancia, cantidad: c.cantidad };
        });
    }

    /** Cerrar la caja de hoy: se cuenta la plata y dice si sobra o falta. */
    function cerrarCaja(usuario, contado) {
        exigir(esDelLocal(usuario), "Solo alguien de la librería cierra la caja.");
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
        listas, nuevoPedido, pedido, listarPedidos, misPedidos, cambiarArticulo, separarPedido, avisarPedido, entregarPedido, anularPedido,
        armarTicket, vender,
        caja, semana, cerrarCaja
    };
}
