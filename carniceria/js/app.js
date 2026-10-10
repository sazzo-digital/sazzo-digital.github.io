// ============================================
// Arranque de Sazzo Carnicería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Ricardo (dueño) y Darío (carnicero) venden, preparan pedidos, despostan, miran precios
// y la caja (los costos, los precios y la ganancia solo Ricardo); Claudia (clienta) pide y sigue su pedido.
// El menú del local tiene 5 lugares (los que entran en el celular con la letra grande): "Acerca de" va al pie de
// Precios y de la Caja.
// irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido: "Mirá lo que le llega a Darío →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=ece442dfab";
import { iniciarDemo } from "../kit/js/arranque.js?v=ece442dfab";
import { vistaIngreso } from "../kit/js/ingreso.js?v=ece442dfab";
import { pintarMarco } from "../kit/js/marco.js?v=ece442dfab";
import { mostrarRuta } from "../kit/js/rutas.js?v=ece442dfab";
import { vistaAcerca } from "../kit/js/acerca.js?v=ece442dfab";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=ece442dfab";
import { crearDatos } from "./datos.js?v=ece442dfab";
import { vistaInicio } from "./vistas/inicio.js?v=ece442dfab";
import { vistaMisPedidos } from "./vistas/clienta.js?v=ece442dfab";
import { vistaPedidos, vistaNuevoPedido, vistaPedido } from "./vistas/pedidos.js?v=ece442dfab";
import { vistaDespostes, vistaIngreso as vistaEntro, vistaDesposte } from "./vistas/desposte.js?v=ece442dfab";
import { vistaStock, vistaAumento, vistaNuevoArticulo, vistaEtiquetas } from "./vistas/stock.js?v=ece442dfab";
import { vistaPizarra } from "./vistas/pizarra.js?v=ece442dfab";
import { vistaCaja } from "./vistas/caja.js?v=ece442dfab";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" };
const DEL_LOCAL = [
    { ruta: "/inicio", icono: "ti-shopping-cart", texto: "Vender" },
    { ruta: "/pedidos", icono: "ti-clipboard-list", texto: "Pedidos" },
    { ruta: "/desposte", icono: "ti-meat", texto: "Desposte" },
    { ruta: "/stock", icono: "ti-tag", texto: "Precios" },
    { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" }
];
const MENU = {
    dueno: DEL_LOCAL,
    empleado: DEL_LOCAL,
    clienta: [{ ruta: "/inicio", icono: "ti-shopping-bag", texto: "Pedir" }, { ruta: "/mis-pedidos", icono: "ti-list", texto: "Mis pedidos" }, ACERCA]
};

const esDueno = (u) => u.rol === "dueno";
const esDelLocal = (u) => u.rol === "dueno" || u.rol === "empleado";
const esClienta = (u) => u.rol === "clienta";

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // Vender usa el ancho de la compu (cortes | ticket): se usa en el mostrador. Lo de Claudia también.
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/mis-pedidos$/, vista: con(vistaMisPedidos), puede: esClienta },
    { patron: /^\/pedidos$/, vista: con(vistaPedidos), puede: esDelLocal },
    { patron: /^\/pedidos\/nuevo$/, vista: con(vistaNuevoPedido), puede: esDelLocal, menu: "/pedidos" },
    { patron: /^\/pedidos\/([\w-]+)$/, vista: con(vistaPedido), puede: esDelLocal, menu: "/pedidos" },
    { patron: /^\/desposte$/, vista: con(vistaDespostes), puede: esDelLocal },
    { patron: /^\/desposte\/nuevo$/, vista: con(vistaEntro), puede: esDueno, menu: "/desposte" },
    { patron: /^\/desposte\/([\w-]+)$/, vista: con(vistaDesposte), puede: esDelLocal, menu: "/desposte", ancho: true },
    { patron: /^\/stock$/, vista: con(vistaStock), puede: esDelLocal },
    { patron: /^\/stock\/aumento$/, vista: con(vistaAumento), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/nuevo$/, vista: con(vistaNuevoArticulo), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/etiquetas$/, vista: con(vistaEtiquetas), puede: esDelLocal, menu: "/stock" },
    { patron: /^\/pizarra$/, vista: con(vistaPizarra), puede: esDelLocal, menu: "/stock", ancho: true },
    { patron: /^\/caja$/, vista: con(vistaCaja), puede: esDelLocal },
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
    datos.guardado.guardarSesion(persona.id);
    history.replaceState(null, "", `#${ruta}`);
    entrar(persona);
}

// Cada cambio de pantalla, con un fundido corto donde el navegador lo permite (kit/ui.js → conFundido)
window.addEventListener("hashchange", () => {
    if (contenido) conFundido(mostrar);
});

// Si otra pestaña cambió los datos (ej: Claudia pidiendo en una pestaña y Darío mirando los pedidos en otra, o la
// pizarra en la tele mientras Ricardo cambia los precios)
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
