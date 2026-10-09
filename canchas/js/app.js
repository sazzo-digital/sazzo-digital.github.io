// ============================================
// Arranque de Sazzo Canchas: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Gustavo (dueño) la grilla y los fijos; Fede (jugador) reservar y sus turnos.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá cómo lo ve Gustavo →").
// ============================================
import { $ } from "../kit/js/ui.js?v=8803abd1ef";
import { iniciarDemo } from "../kit/js/arranque.js?v=8803abd1ef";
import { vistaIngreso } from "../kit/js/ingreso.js?v=8803abd1ef";
import { pintarMarco } from "../kit/js/marco.js?v=8803abd1ef";
import { mostrarRuta } from "../kit/js/rutas.js?v=8803abd1ef";
import { vistaAcerca } from "../kit/js/acerca.js?v=8803abd1ef";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=8803abd1ef";
import { crearDatos } from "./datos.js?v=8803abd1ef";
import { vistaInicio } from "./vistas/inicio.js?v=8803abd1ef";
import { vistaMisTurnos } from "./vistas/jugador.js?v=8803abd1ef";
import { vistaTurno, vistaAnotar } from "./vistas/grilla.js?v=8803abd1ef";
import { vistaFijos } from "./vistas/fijos.js?v=8803abd1ef";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const MENU = {
    dueno: [{ ruta: "/inicio", icono: "ti-layout-grid", texto: "Grilla" }, { ruta: "/fijos", icono: "ti-repeat", texto: "Fijos" }, ACERCA],
    cliente: [{ ruta: "/inicio", icono: "ti-ball-football", texto: "Reservar" }, { ruta: "/turnos", icono: "ti-calendar", texto: "Mis turnos" }, ACERCA]
};

const esDueno = (u) => u.rol === "dueno";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // La grilla del dueño usa el ancho de la compu (se muestra en el mostrador)
    { patron: /^\/inicio$/, vista: con(vistaInicio), get ancho() { return usuario?.rol === "dueno"; } },
    { patron: /^\/turnos$/, vista: con(vistaMisTurnos), puede: (u) => u.rol === "cliente" },
    { patron: /^\/turno\/([\w:-]+)$/, vista: con(vistaTurno), puede: esDueno, menu: "/inicio" },
    { patron: /^\/anotar$/, vista: con(vistaAnotar), puede: esDueno, menu: "/inicio" },
    { patron: /^\/fijos$/, vista: con(vistaFijos), puede: esDueno },
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

/** Pasa directo a otra persona y a una pantalla (botón del recorrido del momento wow). */
function irA(personaId, ruta = "/inicio") {
    const persona = buscarPersona(personaId);
    if (!persona) return;
    datos.guardado.guardarSesion(persona.id);
    history.replaceState(null, "", `#${ruta}`);
    entrar(persona);
}

window.addEventListener("hashchange", () => {
    if (contenido) mostrar();
});

// Si otra pestaña cambió los datos (ej: Fede reservando en el celu y Gustavo mirando la grilla en la compu)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
