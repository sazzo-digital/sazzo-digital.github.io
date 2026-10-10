// ============================================
// Arranque de Sazzo Inmobiliaria: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Valeria (busca alquilar) mira propiedades y pide visitas; Tomás (agente) atiende
// consultas, la agenda y las propiedades; Graciela (dueña) arranca por "Este mes" y lleva los alquileres.
// irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido: "Mirá lo que le llega a Tomás →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=bc8d90946e";
import { iniciarDemo } from "../kit/js/arranque.js?v=bc8d90946e";
import { vistaIngreso } from "../kit/js/ingreso.js?v=bc8d90946e";
import { pintarMarco } from "../kit/js/marco.js?v=bc8d90946e";
import { mostrarRuta } from "../kit/js/rutas.js?v=bc8d90946e";
import { vistaAcerca } from "../kit/js/acerca.js?v=bc8d90946e";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=bc8d90946e";
import { aparte } from "../kit/js/aparte.js?v=bc8d90946e";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=bc8d90946e";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=bc8d90946e"));
const { vistaPropiedades, vistaFicha, vistaNuevaPropiedad, vistaPedirVisita, vistaMisVisitas, vistaConsultas, vistaConsulta, vistaNuevaConsulta, vistaAgenda, vistaEsteMes, vistaAlquileres, vistaAlquiler, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" };
const MENU = {
    cliente: [
        { ruta: "/inicio", icono: "ti-search", texto: "Propiedades" },
        { ruta: "/mis-visitas", icono: "ti-calendar-event", texto: "Mis visitas" },
        ACERCA
    ],
    agente: [
        { ruta: "/inicio", icono: "ti-message-2", texto: "Consultas" },
        { ruta: "/agenda", icono: "ti-calendar", texto: "Agenda" },
        { ruta: "/propiedades", icono: "ti-building", texto: "Propiedades" },
        ACERCA
    ],
    duena: [
        { ruta: "/inicio", icono: "ti-layout-grid", texto: "Este mes" },
        { ruta: "/consultas", icono: "ti-message-2", texto: "Consultas" },
        { ruta: "/agenda", icono: "ti-calendar", texto: "Agenda" },
        { ruta: "/alquileres", icono: "ti-key", texto: "Alquileres" },
        ACERCA
    ]
};

const esDuena = (u) => u.rol === "duena";
const esStaff = (u) => u.rol === "duena" || u.rol === "agente";
const esCliente = (u) => u.rol === "cliente";

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });
const INICIOS = { cliente: vistaPropiedades, agente: vistaConsultas, duena: vistaEsteMes };

const RUTAS = [
    { patron: /^\/inicio$/, vista: (cont, o) => con(INICIOS[o.usuario.rol])(cont, o), ancho: true },
    // Lo de Valeria
    { patron: /^\/propiedad\/([\w-]+)$/, vista: con(vistaFicha), menu: "/inicio", ancho: true },
    { patron: /^\/visita\/([\w-]+)$/, vista: con(vistaPedirVisita), puede: esCliente, menu: "/inicio" },
    { patron: /^\/mis-visitas$/, vista: con(vistaMisVisitas), puede: esCliente },
    // Lo de la inmobiliaria
    { patron: /^\/propiedades$/, vista: con(vistaPropiedades), puede: esStaff, ancho: true },
    { patron: /^\/propiedades\/nueva$/, vista: con(vistaNuevaPropiedad), puede: esStaff, menu: "/propiedades" },
    { patron: /^\/propiedades\/([\w-]+)$/, vista: con(vistaFicha), puede: esStaff, menu: "/propiedades", ancho: true },
    { patron: /^\/consultas$/, vista: con(vistaConsultas), puede: esStaff },
    { patron: /^\/consultas\/nueva$/, vista: con(vistaNuevaConsulta), puede: esStaff, menu: "/consultas" },
    { patron: /^\/consultas\/([\w-]+)$/, vista: con(vistaConsulta), puede: esStaff, menu: "/consultas" },
    { patron: /^\/agenda$/, vista: con(vistaAgenda), puede: esStaff, ancho: true },
    { patron: /^\/alquileres$/, vista: con(vistaAlquileres), puede: esDuena },
    { patron: /^\/alquileres\/([\w-]+)$/, vista: con(vistaAlquiler), puede: esDuena, menu: "/alquileres" },
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

// Si otra pestaña cambió los datos (ej: Valeria pidiendo una visita en una pestaña y Tomás mirando las consultas en otra)
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
