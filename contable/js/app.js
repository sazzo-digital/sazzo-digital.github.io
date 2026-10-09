// ============================================
// Arranque de Sazzo Contable: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// El menú de abajo tiene lugar para 5: cada persona ve las 4 que más usa + "Más" (todas). Las pantallas que se
// apagan en "Tu empresa" desaparecen del menú. irA() cambia de persona sin pasar por "Probala como…" (recorrido).
// ============================================
import { $, vacio, conFundido } from "../kit/js/ui.js?v=be942dc467";
import { iniciarDemo } from "../kit/js/arranque.js?v=be942dc467";
import { vistaIngreso } from "../kit/js/ingreso.js?v=be942dc467";
import { pintarMarco } from "../kit/js/marco.js?v=be942dc467";
import { mostrarRuta } from "../kit/js/rutas.js?v=be942dc467";
import { vistaAcerca } from "../kit/js/acerca.js?v=be942dc467";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=be942dc467";
import { crearDatos } from "./datos.js?v=be942dc467";
import { vistaInicio } from "./vistas/inicio.js?v=be942dc467";
import { vistaFacturar, vistaNuevaFactura, vistaComprobante } from "./vistas/facturar.js?v=be942dc467";
import { vistaCompras, vistaNuevaCompra } from "./vistas/compras.js?v=be942dc467";
import { vistaIva } from "./vistas/iva.js?v=be942dc467";
import { vistaCuentas, vistaFicha } from "./vistas/cuentas.js?v=be942dc467";
import { vistaContabilidad } from "./vistas/contabilidad.js?v=be942dc467";
import { vistaEmpresa } from "./vistas/empresa.js?v=be942dc467";
import { vistaMas } from "./vistas/mas.js?v=be942dc467";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const SECCIONES = [
    { id: "inicio", ruta: "/inicio", icono: "ti-home", texto: "Inicio", detalle: "El tablero del mes" },
    { id: "facturar", ruta: "/facturar", icono: "ti-file-invoice", texto: "Facturar", detalle: "Facturas A, B y C y notas de crédito" },
    { id: "compras", ruta: "/compras", icono: "ti-shopping-cart", texto: "Compras", detalle: "Facturas de proveedores y \"Traer de ARCA\"", modulo: "compras" },
    { id: "iva", ruta: "/iva", icono: "ti-receipt-tax", texto: "IVA", detalle: "Posición del mes, libros y Libro IVA Digital" },
    { id: "cuentas", ruta: "/cuentas", icono: "ti-users", texto: "Cuentas", detalle: "Clientes, proveedores, caja y banco", modulo: "cuentas" },
    { id: "contabilidad", ruta: "/contabilidad", icono: "ti-book", texto: "Contabilidad", detalle: "Libro diario, mayor y balance", modulo: "contabilidad" },
    { id: "empresa", ruta: "/empresa", icono: "ti-building", texto: "Tu empresa", detalle: "Nombre, CUIT, logo, colores y pantallas" },
    { id: "acerca", ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de", detalle: "Qué es esta demo" }
];
// Las 4 del menú de cada persona, en orden de preferencia (si una está apagada, entra la siguiente)
const PREFERIDAS = {
    admin: ["inicio", "facturar", "compras", "cuentas", "iva", "empresa"],
    dueno: ["inicio", "cuentas", "iva", "empresa", "facturar"],
    contadora: ["inicio", "iva", "contabilidad", "facturar", "cuentas"]
};

const prendida = (s) => !s.modulo || datos.leerEmpresa().modulos?.[s.modulo] !== false;
const secciones = () => SECCIONES.filter(prendida);

function menuDe(persona) {
    const ids = PREFERIDAS[persona.rol].filter((id) => secciones().some((s) => s.id === id)).slice(0, 4);
    return [...ids.map((id) => SECCIONES.find((s) => s.id === id)), { ruta: "/mas", icono: "ti-dots", texto: "Más" }];
}

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });
/** Si la pantalla está apagada en "Tu empresa", lo dice (con salida) en vez de mostrarla. */
const siPrendida = (modulo, vista) => (cont, opciones) => {
    if (datos.leerEmpresa().modulos?.[modulo] === false) {
        cont.innerHTML = `${vacio("Esta pantalla está apagada. Se prende en \"Tu empresa\".", "ti-eye-off")}<p class="vacio__salida"><a class="boton boton--secundario" href="#/empresa">Ir a Tu empresa</a></p>`;
        return;
    }
    return con(vista)(cont, opciones);
};

const RUTAS = [
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/facturar$/, vista: con(vistaFacturar) },
    { patron: /^\/facturar\/nueva$/, vista: con(vistaNuevaFactura), menu: "/facturar" },
    { patron: /^\/facturar\/([\w-]+)$/, vista: con(vistaComprobante), menu: "/facturar" },
    { patron: /^\/compras$/, vista: siPrendida("compras", vistaCompras) },
    { patron: /^\/compras\/nueva$/, vista: siPrendida("compras", vistaNuevaCompra), menu: "/compras" },
    { patron: /^\/iva$/, vista: con(vistaIva), ancho: true },
    { patron: /^\/cuentas$/, vista: siPrendida("cuentas", vistaCuentas) },
    { patron: /^\/cuentas\/(cliente|proveedor)\/([\w-]+)$/, vista: siPrendida("cuentas", vistaFicha), menu: "/cuentas" },
    { patron: /^\/contabilidad$/, vista: siPrendida("contabilidad", vistaContabilidad), ancho: true },
    { patron: /^\/empresa$/, vista: (cont, o) => vistaEmpresa(cont, { ...o, datos, alCambiarModulos: () => entrar(usuario) }) },
    { patron: /^\/mas$/, vista: (cont) => vistaMas(cont, { secciones: secciones() }) },
    { patron: /^\/acerca$/, vista: (cont) => vistaAcerca(cont, { marca: MARCA, tambien: TAMBIEN }) }
];

const mostrar = () => mostrarRuta({ rutas: RUTAS, contenido, usuario });

function ingresar() {
    usuario = null;
    contenido = null;
    datos.guardado.guardarSesion(null);
    vistaIngreso(app, {
        marca: MARCA,
        personas: PERSONAS,
        alElegir: (id) => {
            datos.guardado.guardarSesion(id);
            history.replaceState(null, "", "#/inicio");
            entrar(buscarPersona(id));
        }
    });
}

function entrar(persona) {
    usuario = persona;
    contenido = pintarMarco(app, {
        marca: MARCA,
        usuario,
        menu: menuDe(persona),
        alCambiarPersona: ingresar,
        alReiniciar: () => {
            datos.guardado.reiniciar();
            entrar(usuario); // el menú vuelve a tener todas las pantallas
        }
    });
    mostrar();
}

/** Pasa directo a otra persona y a una pantalla (botones del recorrido del momento wow). */
function irA(personaId, ruta = "/inicio") {
    const persona = buscarPersona(personaId);
    if (!persona) return;
    datos.guardado.guardarSesion(persona.id);
    history.replaceState(null, "", `#${ruta}`);
    entrar(persona);
}

// Cada cambio de pantalla, con un fundido corto donde el navegador lo permite (kit/ui.js → conFundido)
window.addEventListener("hashchange", () => {
    if (contenido) conFundido(mostrar);
});

// Si otra pestaña cambió los datos (ej: Silvina factura en una pestaña y Patricia mira el IVA en otra)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

// Si ya había elegido a alguien (volvió a abrir la demo), sigue con esa persona
const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
