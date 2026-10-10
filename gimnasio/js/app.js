// ============================================
// Arranque de Sazzo Gimnasio: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Franco (socio) lo que le toca hoy, su semana y su cuota; Mauro (profe) sus alumnos de
// hoy y las rutinas; Vane (dueña) los socios con sus cuotas y cómo anda el gimnasio.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá cómo lo ve Mauro →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=9c146b12b6";
import { iniciarDemo } from "../kit/js/arranque.js?v=9c146b12b6";
import { vistaIngreso } from "../kit/js/ingreso.js?v=9c146b12b6";
import { pintarMarco } from "../kit/js/marco.js?v=9c146b12b6";
import { mostrarRuta } from "../kit/js/rutas.js?v=9c146b12b6";
import { vistaAcerca } from "../kit/js/acerca.js?v=9c146b12b6";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=9c146b12b6";
import { aparte } from "../kit/js/aparte.js?v=9c146b12b6";
import { leerSesionGuardada } from "../kit/js/guardado.js?v=9c146b12b6";

// Los datos de ejemplo y las pantallas se bajan aparte (al terminar de cargar): "Probala como…" aparece sin esperarlos
const pantallas = aparte(() => import("./pantallas.js?v=9c146b12b6"));
const { vistaHoy, vistaSemana, vistaCuota, vistaGimnasioHoy, vistaPlanes, vistaPlan, vistaFicha, vistaSocios, vistaAlta, vistaGimnasio, avisosDe } = pantallas.funciones;

iniciarDemo(MARCA);
let datos = null; // se arma cuando bajan las pantallas
const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
const guardarSesion = (id) => listos.then(() => datos.guardado.guardarSesion(id));
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const MENU = {
    socio: [{ ruta: "/inicio", icono: "ti-barbell", texto: "Hoy" }, { ruta: "/semana", icono: "ti-calendar", texto: "Mi semana" }, { ruta: "/cuota", icono: "ti-cash", texto: "Mi cuota" }, ACERCA],
    profe: [{ ruta: "/inicio", icono: "ti-users", texto: "Hoy" }, { ruta: "/planes", icono: "ti-list-details", texto: "Rutinas" }, ACERCA],
    duena: [{ ruta: "/inicio", icono: "ti-users", texto: "Socios" }, { ruta: "/gimnasio", icono: "ti-chart-bar", texto: "Gimnasio" }, ACERCA]
};

const es = (rol) => (u) => u?.rol === rol;
const conFicha = (u) => u?.rol === "profe" || u?.rol === "duena";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });
const INICIO = { socio: vistaHoy, profe: vistaGimnasioHoy, duena: vistaSocios };

const RUTAS = [
    // Lo de la dueña usa el ancho de la compu
    { patron: /^\/inicio$/, vista: con((cont, o) => INICIO[o.usuario.rol](cont, o)), get ancho() { return usuario?.rol === "duena"; } },
    { patron: /^\/semana$/, vista: con(vistaSemana), puede: es("socio") },
    { patron: /^\/cuota$/, vista: con(vistaCuota), puede: es("socio") },
    { patron: /^\/socios\/nuevo$/, vista: con(vistaAlta), puede: es("duena"), menu: "/inicio" },
    { patron: /^\/socios\/([\w-]+)$/, vista: con(vistaFicha), puede: conFicha, menu: "/inicio", get ancho() { return usuario?.rol === "duena"; } },
    { patron: /^\/planes$/, vista: con(vistaPlanes), puede: es("profe") },
    { patron: /^\/planes\/([\w-]+)$/, vista: con(vistaPlan), puede: es("profe"), menu: "/planes" },
    { patron: /^\/gimnasio$/, vista: con(vistaGimnasio), puede: es("duena"), ancho: true },
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

// Si otra pestaña cambió los datos (ej: Franco anotando en el celu y Mauro con la lista abierta en la tablet)
window.addEventListener("storage", (e) => {
    if (datos && e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(leerSesionGuardada(MARCA.prefijo));
if (yaAdentro) entrar(yaAdentro);
else ingresar();
