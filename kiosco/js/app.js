// ============================================
// Arranque de Sazzo Kiosco: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Las dos personas ven las mismas secciones; lo que cambia (precios, topes, últimos 7 días) lo controlan las
// funciones de datos y cada pantalla. irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido).
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=c830d16e78";
import { iniciarDemo } from "../kit/js/arranque.js?v=c830d16e78";
import { vistaIngreso } from "../kit/js/ingreso.js?v=c830d16e78";
import { pintarMarco } from "../kit/js/marco.js?v=c830d16e78";
import { mostrarRuta } from "../kit/js/rutas.js?v=c830d16e78";
import { vistaAcerca } from "../kit/js/acerca.js?v=c830d16e78";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=c830d16e78";
import { aparte } from "../kit/js/aparte.js?v=c830d16e78";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=c830d16e78";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=c830d16e78"));
const { vistaInicio, vistaFiados, vistaCliente, vistaStock, vistaAumento, vistaLista, vistaCaja, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const MENU = [
    { ruta: "/inicio", icono: "ti-shopping-cart", texto: "Vender" },
    { ruta: "/fiados", icono: "ti-notebook", texto: "Fiados" },
    { ruta: "/stock", icono: "ti-package", texto: "Stock" },
    { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" },
    { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" }
];

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // Vender usa el ancho de la compu (productos | ticket): se usa en el mostrador
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/fiados$/, vista: con(vistaFiados) },
    { patron: /^\/fiados\/([\w-]+)$/, vista: con(vistaCliente) },
    { patron: /^\/stock$/, vista: con(vistaStock) },
    { patron: /^\/stock\/aumento$/, vista: con(vistaAumento), puede: (u) => u.rol === "dueno" },
    { patron: /^\/stock\/lista$/, vista: con(vistaLista), puede: (u) => u.rol === "dueno" },
    { patron: /^\/caja$/, vista: con(vistaCaja) },
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
        menu: MENU,
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

// Si otra pestaña cambió los datos (ej: Sofía vendiendo en una pestaña y Rubén mirando la caja en otra)
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
