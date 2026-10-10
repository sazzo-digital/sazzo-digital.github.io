// ============================================
// Arranque de Sazzo Ferretería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Osvaldo (dueño) y Nahuel (mostrador) venden, arman presupuestos, miran el stock, las
// cuentas corrientes y la caja (los precios, los topes y la ganancia solo Osvaldo); Marcos (cliente) pide
// presupuestos desde el celu y ve su cuenta.
// El menú del mostrador tiene 5 lugares (con "Presupuestos" no entra un sexto en un celu de 360 px): "Acerca de" queda
// abajo de la Caja y en el menú de Marcos.
// irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido: "Mirá lo que le llega a Nahuel →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=d783fb01c6";
import { iniciarDemo } from "../kit/js/arranque.js?v=d783fb01c6";
import { vistaIngreso } from "../kit/js/ingreso.js?v=d783fb01c6";
import { pintarMarco } from "../kit/js/marco.js?v=d783fb01c6";
import { mostrarRuta } from "../kit/js/rutas.js?v=d783fb01c6";
import { vistaAcerca } from "../kit/js/acerca.js?v=d783fb01c6";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=d783fb01c6";
import { aparte } from "../kit/js/aparte.js?v=d783fb01c6";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=d783fb01c6";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=d783fb01c6"));
const { vistaInicio, vistaMisPresupuestos, vistaPresupuestos, vistaNuevoPresupuesto, vistaPresupuesto, vistaCuentas, vistaCuenta, vistaStock, vistaAumento, vistaLista, vistaMargen, vistaPedidosProveedor, vistaNuevoProducto, vistaCaja, pintarNovedades } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const DEL_LOCAL = [
    { ruta: "/inicio", icono: "ti-shopping-cart", texto: "Vender" },
    { ruta: "/presupuestos", icono: "ti-file-text", texto: "Presupuestos" },
    { ruta: "/stock", icono: "ti-package", texto: "Stock" },
    { ruta: "/cuentas", icono: "ti-user-dollar", texto: "Cuentas" },
    { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" }
];
const MENU = {
    dueno: DEL_LOCAL,
    empleado: DEL_LOCAL,
    cliente: [
        { ruta: "/inicio", icono: "ti-clipboard-list", texto: "Pedir" },
        { ruta: "/mis-presupuestos", icono: "ti-list", texto: "Mis presupuestos" },
        { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" }
    ]
};

const esDueno = (u) => u.rol === "dueno";
const esDelLocal = (u) => u.rol === "dueno" || u.rol === "empleado";
const esCliente = (u) => u.rol === "cliente";

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // Vender usa el ancho de la compu (artículos | ticket): se usa en el mostrador. El pedido de Marcos también.
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/mis-presupuestos$/, vista: con(vistaMisPresupuestos), puede: esCliente },
    { patron: /^\/presupuestos$/, vista: con(vistaPresupuestos), puede: esDelLocal },
    { patron: /^\/presupuestos\/nuevo$/, vista: con(vistaNuevoPresupuesto), puede: esDelLocal, menu: "/presupuestos" },
    { patron: /^\/presupuestos\/([\w-]+)$/, vista: con(vistaPresupuesto), puede: esDelLocal, menu: "/presupuestos", ancho: true },
    { patron: /^\/cuentas$/, vista: con(vistaCuentas), puede: esDelLocal },
    { patron: /^\/cuentas\/([\w-]+)$/, vista: con(vistaCuenta), puede: esDelLocal, menu: "/cuentas" },
    { patron: /^\/stock$/, vista: con(vistaStock), puede: esDelLocal },
    { patron: /^\/stock\/aumento$/, vista: con(vistaAumento), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/margen$/, vista: con(vistaMargen), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/pedidos$/, vista: con(vistaPedidosProveedor), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/nuevo$/, vista: con(vistaNuevoProducto), puede: esDueno, menu: "/stock" },
    { patron: /^\/stock\/lista$/, vista: con(vistaLista), puede: esDueno, menu: "/stock" },
    { patron: /^\/caja$/, vista: con(vistaCaja), puede: esDelLocal },
    { patron: /^\/acerca$/, vista: (cont) => vistaAcerca(cont, { marca: MARCA, tambien: TAMBIEN }) }
];

// Después de cada pantalla, el aviso de novedades ("¡Pedido nuevo de presupuesto!": vistas/novedades.js)
const mostrar = async () => {
    await mostrarRuta({ rutas: RUTAS, contenido, usuario });
    if (usuario) await pintarNovedades({ app, usuario, datos });
};

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

// Si otra pestaña cambió los datos (ej: Marcos pidiendo en una pestaña y Nahuel mirando los presupuestos en otra)
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
