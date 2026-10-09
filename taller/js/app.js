// ============================================
// Arranque de Sazzo Taller: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Raúl (dueño) ve todo; Seba (mecánico), sus autos y sin precios (lo controlan las funciones de datos).
// irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido: "Mirá lo que le llega a Seba →").
// ============================================
import { $ } from "../kit/js/ui.js?v=a3a89a6efc";
import { iniciarDemo } from "../kit/js/arranque.js?v=a3a89a6efc";
import { vistaIngreso } from "../kit/js/ingreso.js?v=a3a89a6efc";
import { pintarMarco } from "../kit/js/marco.js?v=a3a89a6efc";
import { mostrarRuta } from "../kit/js/rutas.js?v=a3a89a6efc";
import { vistaAcerca } from "../kit/js/acerca.js?v=a3a89a6efc";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=a3a89a6efc";
import { crearDatos } from "./datos.js?v=a3a89a6efc";
import { vistaInicio } from "./vistas/inicio.js?v=a3a89a6efc";
import { vistaEntro } from "./vistas/pizarra.js?v=a3a89a6efc";
import { vistaOrden, vistaImprimir } from "./vistas/orden.js?v=a3a89a6efc";
import { vistaAutos, vistaAuto } from "./vistas/autos.js?v=a3a89a6efc";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const AUTOS = { ruta: "/autos", icono: "ti-car", texto: "Autos" };
const MENU = {
    dueno: [{ ruta: "/inicio", icono: "ti-layout-kanban", texto: "Taller" }, AUTOS, ACERCA],
    mecanico: [{ ruta: "/inicio", icono: "ti-tool", texto: "Mis autos" }, AUTOS, ACERCA]
};

const esDueno = (u) => u.rol === "dueno";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // La pizarra usa el ancho de la compu (una columna por estado)
    { patron: /^\/inicio$/, vista: con(vistaInicio), ancho: true },
    { patron: /^\/entro$/, vista: con(vistaEntro), puede: esDueno, menu: "/inicio" },
    { patron: /^\/orden\/([\w-]+)$/, vista: con(vistaOrden), menu: "/inicio" },
    { patron: /^\/orden\/([\w-]+)\/imprimir$/, vista: con(vistaImprimir), puede: esDueno, menu: "/inicio" },
    { patron: /^\/autos$/, vista: con(vistaAutos) },
    { patron: /^\/autos\/([\w-]+)$/, vista: con(vistaAuto), menu: "/autos" },
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

window.addEventListener("hashchange", () => {
    if (contenido) mostrar();
});

// Si otra pestaña cambió los datos (ej: Seba cargando repuestos en el celu y Raúl con la pizarra en la compu)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
