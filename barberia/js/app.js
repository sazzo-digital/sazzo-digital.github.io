// ============================================
// Arranque de Sazzo Barbería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Leo (barbero) la agenda y los clientes; Matías (cliente) sacar turno y sus turnos.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá cómo lo ve Leo →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=7f17c1a4d6";
import { iniciarDemo } from "../kit/js/arranque.js?v=7f17c1a4d6";
import { vistaIngreso } from "../kit/js/ingreso.js?v=7f17c1a4d6";
import { pintarMarco } from "../kit/js/marco.js?v=7f17c1a4d6";
import { mostrarRuta } from "../kit/js/rutas.js?v=7f17c1a4d6";
import { vistaAcerca } from "../kit/js/acerca.js?v=7f17c1a4d6";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=7f17c1a4d6";
import { aparte } from "../kit/js/aparte.js?v=7f17c1a4d6";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=7f17c1a4d6";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=7f17c1a4d6"));
const { vistaInicio, vistaMisTurnos, vistaNuevoTurno, vistaClientes, vistaFicha, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const MENU = {
    barbero: [{ ruta: "/inicio", icono: "ti-calendar-event", texto: "Agenda" }, { ruta: "/clientes", icono: "ti-users", texto: "Clientes" }, ACERCA],
    cliente: [{ ruta: "/inicio", icono: "ti-scissors", texto: "Sacar turno" }, { ruta: "/turnos", icono: "ti-calendar", texto: "Mis turnos" }, ACERCA]
};

const esBarbero = (u) => u.rol === "barbero";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // La agenda del barbero usa el ancho de la compu (una columna por barbero)
    { patron: /^\/inicio$/, vista: con(vistaInicio), get ancho() { return usuario?.rol === "barbero"; } },
    { patron: /^\/turnos$/, vista: con(vistaMisTurnos), puede: (u) => u.rol === "cliente" },
    { patron: /^\/nuevo$/, vista: con(vistaNuevoTurno), puede: esBarbero, menu: "/inicio" },
    { patron: /^\/clientes$/, vista: con(vistaClientes), puede: esBarbero },
    { patron: /^\/clientes\/([\w-]+)$/, vista: con(vistaFicha), puede: esBarbero },
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

/** Pasa directo a otra persona y a una pantalla (botón del recorrido del momento wow). */
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

// Si otra pestaña cambió los datos (ej: Matías sacando turno en el celu y Leo con la agenda abierta en la compu)
window.addEventListener("storage", (e) => {
    if (datos && e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(leerSesionGuardada(MARCA.prefijo));
if (yaAdentro) entrar(yaAdentro);
else ingresar();
