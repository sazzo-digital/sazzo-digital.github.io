// ============================================
// Arranque de Restix Sazzo: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Lara (moza) ve el salón, la cocina (solo mirar) y la caja; Beto, la cocina; Flor (cliente), la carta del QR.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá lo que le llega a la cocina →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=aa4351ebaa";
import { iniciarDemo } from "../kit/js/arranque.js?v=aa4351ebaa";
import { vistaIngreso } from "../kit/js/ingreso.js?v=aa4351ebaa";
import { pintarMarco } from "../kit/js/marco.js?v=aa4351ebaa";
import { mostrarRuta, soltarPantalla } from "../kit/js/rutas.js?v=aa4351ebaa";
import { vistaAcerca } from "../kit/js/acerca.js?v=aa4351ebaa";
import { MARCA, PERSONAS, DETALLE, buscarPersona } from "./marca.js?v=aa4351ebaa";
import { aparte } from "../kit/js/aparte.js?v=aa4351ebaa";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=aa4351ebaa";
import { esperarPantallas } from "./carga.js?v=aa4351ebaa";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=aa4351ebaa"));
const { vistaInicio, vistaMesa, vistaCobro, vistaCaja, vistaCocina, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const app = $("#app");
const listos = esperarPantallas(pantallas, app).then((m) => (datos = m?.crearDatos() ?? null));
const guardarSesion = (id) => listos.then(() => datos?.guardado.guardarSesion(id));
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const MENU = {
    moza: [{ ruta: "/inicio", icono: "ti-layout-grid", texto: "Salón" }, { ruta: "/cocina", icono: "ti-tools-kitchen-2", texto: "Cocina" }, { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" }, ACERCA],
    cocina: [{ ruta: "/inicio", icono: "ti-tools-kitchen-2", texto: "Cocina" }, ACERCA],
    cliente: [{ ruta: "/inicio", icono: "ti-book", texto: "Carta" }, ACERCA]
};

const esMoza = (u) => u.rol === "moza";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // El salón usa el ancho de la compu (más mesas por fila); la comanda también (carta | pedido)
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/mesa\/([\w-]+)$/, vista: con(vistaMesa), puede: esMoza, menu: "/inicio", ancho: true },
    { patron: /^\/mesa\/([\w-]+)\/cobrar$/, vista: con(vistaCobro), puede: esMoza, menu: "/inicio" },
    { patron: /^\/cocina$/, vista: con(vistaCocina), puede: esMoza, ancho: true },
    { patron: /^\/caja$/, vista: con(vistaCaja), puede: esMoza },
    { patron: /^\/acerca$/, vista: (cont) => vistaAcerca(cont, { marca: MARCA }) }
];

const mostrar = () => mostrarRuta({ rutas: RUTAS, contenido, usuario });

function ingresar() {
    soltarPantalla();
    usuario = null;
    contenido = null;
    guardarSesion(null);
    vistaIngreso(app, {
        marca: MARCA,
        personas: PERSONAS,
        detalle: DETALLE,
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
    if (!datos) return;
    datos.guardado.olvidarCache();
    usuario = persona;
    contenido = pintarMarco(app, {
        avisos: () => avisosDe(datos), // avisos entre roles (vistas/avisos.js, kit/avisos.js)
        marca: MARCA,
        detalle: DETALLE,
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
    datos?.guardado.olvidarCache();
    if (contenido) conFundido(mostrar);
});

// Si otra pestaña cambió los datos (ej: Lara tomando pedidos en el celu y la cocina con su pantalla en la compu)
window.addEventListener("storage", (e) => {
    if (datos && e.key === datos.guardado.claves.datos) {
        datos.guardado.olvidarCache();
        if (contenido) mostrar();
    }
});

const yaAdentro = buscarPersona(leerSesionGuardada(MARCA.prefijo));
if (yaAdentro) entrar(yaAdentro);
else ingresar();
