// ============================================
// Arranque de Sazzo Librería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Mariela (dueña) y Joaquín (empleado) venden, arman listas, miran el stock y la caja
// (los precios y la ganancia solo Mariela); Paula (clienta) pide la lista escolar y sigue su pedido.
// irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido: "Mirá lo que le llega a Joaquín →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=114958267d";
import { iniciarDemo } from "../kit/js/arranque.js?v=114958267d";
import { vistaIngreso } from "../kit/js/ingreso.js?v=114958267d";
import { pintarMarco } from "../kit/js/marco.js?v=114958267d";
import { mostrarRuta } from "../kit/js/rutas.js?v=114958267d";
import { vistaAcerca } from "../kit/js/acerca.js?v=114958267d";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=114958267d";
import { aparte } from "../kit/js/aparte.js?v=114958267d";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=114958267d";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=114958267d"));
const { vistaInicio, vistaMisPedidos, vistaListas, vistaNuevaLista, vistaPedido, vistaStock, vistaAumento, vistaLista, vistaMargen, vistaPedidosProveedor, vistaNuevoProducto, vistaCaja, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" };
const DEL_LOCAL = [
    { ruta: "/inicio", icono: "ti-shopping-cart", texto: "Vender" },
    { ruta: "/listas", icono: "ti-school", texto: "Listas" },
    { ruta: "/stock", icono: "ti-package", texto: "Stock" },
    { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" },
    ACERCA
];
const MENU = {
    duena: DEL_LOCAL,
    empleado: DEL_LOCAL,
    clienta: [{ ruta: "/inicio", icono: "ti-backpack", texto: "Tu lista" }, { ruta: "/mis-pedidos", icono: "ti-list", texto: "Mis pedidos" }, ACERCA]
};

const esDuena = (u) => u.rol === "duena";
const esDelLocal = (u) => u.rol === "duena" || u.rol === "empleado";
const esClienta = (u) => u.rol === "clienta";

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // Vender usa el ancho de la compu (artículos | ticket): se usa en el mostrador. La lista de Paula también.
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/mis-pedidos$/, vista: con(vistaMisPedidos), puede: esClienta },
    { patron: /^\/listas$/, vista: con(vistaListas), puede: esDelLocal },
    { patron: /^\/listas\/nueva$/, vista: con(vistaNuevaLista), puede: esDelLocal, menu: "/listas", ancho: true },
    { patron: /^\/listas\/([\w-]+)$/, vista: con(vistaPedido), puede: esDelLocal, menu: "/listas" },
    { patron: /^\/stock$/, vista: con(vistaStock), puede: esDelLocal },
    { patron: /^\/stock\/aumento$/, vista: con(vistaAumento), puede: esDuena, menu: "/stock" },
    { patron: /^\/stock\/margen$/, vista: con(vistaMargen), puede: esDuena, menu: "/stock" },
    { patron: /^\/stock\/pedidos$/, vista: con(vistaPedidosProveedor), puede: esDuena, menu: "/stock" },
    { patron: /^\/stock\/nuevo$/, vista: con(vistaNuevoProducto), puede: esDuena, menu: "/stock" },
    { patron: /^\/stock\/lista$/, vista: con(vistaLista), puede: esDuena, menu: "/stock" },
    { patron: /^\/caja$/, vista: con(vistaCaja), puede: esDelLocal },
    { patron: /^\/acerca$/, vista: (cont) => vistaAcerca(cont, { marca: MARCA, tambien: TAMBIEN }) }
];

const mostrar = () => mostrarRuta({ rutas: RUTAS, contenido, usuario });

function ingresar() {
    usuario = null;
    contenido = null;
    guardarSesion(null);
    vistaIngreso(app, {
        marca: MARCA,
        personas: PERSONAS,
        alElegir: (id) => {
            guardarSesion(id);
            history.replaceState(null, "", "#/inicio");
            entrar(buscarPersona(id));
        }
    });
}

async function entrar(persona) {
    pantallas.ya(); // al elegir persona (o si ya había alguien adentro) se piden en el momento
    await listos;
    usuario = persona;
    contenido = pintarMarco(app, {
        avisos: () => avisosDe(datos), // avisos entre roles (vistas/avisos.js, kit/avisos.js)
        marca: MARCA,
        usuario,
        menu: MENU[usuario.rol],
        alCambiarPersona: ingresar,
        alReiniciar: () => {
            datos.guardado.reiniciar();
            mostrar();
        }
    });
    mostrar();
}

/** Pasa directo a otra persona y a una pantalla (botones del recorrido del momento wow). */
function irA(personaId, ruta = "/inicio") {
    const persona = buscarPersona(personaId);
    if (!persona) return;
    guardarSesion(persona.id);
    history.replaceState(null, "", `#${ruta}`);
    entrar(persona);
}

// Cada cambio de pantalla, con un fundido corto donde el navegador lo permite (kit/ui.js → conFundido)
window.addEventListener("hashchange", () => {
    if (contenido) conFundido(mostrar);
});

// Si otra pestaña cambió los datos (ej: Paula pidiendo en una pestaña y Joaquín mirando las listas en otra)
window.addEventListener("storage", (e) => {
    if (datos && e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

// Si ya había elegido a alguien (volvió a abrir la demo), sigue con esa persona
const yaAdentro = buscarPersona(leerSesionGuardada(MARCA.prefijo));
if (yaAdentro) entrar(yaAdentro);
else ingresar();
