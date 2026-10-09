// ============================================
// Arranque de Sazzo Barbería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Leo (barbero) la agenda y los clientes; Matías (cliente) sacar turno y sus turnos.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá cómo lo ve Leo →").
// ============================================
import { $ } from "kit/ui.js";
import { iniciarDemo } from "kit/arranque.js";
import { vistaIngreso } from "kit/ingreso.js";
import { pintarMarco } from "kit/marco.js";
import { mostrarRuta } from "kit/rutas.js";
import { vistaAcerca } from "kit/acerca.js";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js";
import { crearDatos } from "./datos.js";
import { vistaInicio } from "./vistas/inicio.js";
import { vistaMisTurnos } from "./vistas/cliente.js";
import { vistaNuevoTurno } from "./vistas/agenda.js";
import { vistaClientes, vistaFicha } from "./vistas/clientes.js";

iniciarDemo(MARCA);
const datos = crearDatos();
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

// Si otra pestaña cambió los datos (ej: Matías sacando turno en el celu y Leo con la agenda abierta en la compu)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
