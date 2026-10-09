// ============================================
// Arranque de Sazzo Flota: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú. irA() cambia de persona sin pasar por "Probala como…" (lo usan los botones del
// recorrido: "Mirá lo que le llega a Diego →").
// ============================================
import { $ } from "../kit/js/ui.js?v=5ea9a6b532";
import { iniciarDemo } from "../kit/js/arranque.js?v=5ea9a6b532";
import { vistaIngreso } from "../kit/js/ingreso.js?v=5ea9a6b532";
import { pintarMarco } from "../kit/js/marco.js?v=5ea9a6b532";
import { mostrarRuta } from "../kit/js/rutas.js?v=5ea9a6b532";
import { vistaAcerca } from "../kit/js/acerca.js?v=5ea9a6b532";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=5ea9a6b532";
import { crearDatos } from "./datos.js?v=5ea9a6b532";
import { vistaInicio } from "./vistas/inicio.js?v=5ea9a6b532";
import { vistaAvisar } from "./vistas/chofer.js?v=5ea9a6b532";
import { vistaArreglar } from "./vistas/mecanico.js?v=5ea9a6b532";
import { vistaVehiculos, vistaFicha } from "./vistas/vehiculos.js?v=5ea9a6b532";
import { vistaRepuestos } from "./vistas/repuestos.js?v=5ea9a6b532";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const INICIO = { ruta: "/inicio", icono: "ti-home", texto: "Inicio" };
const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const OFICINA = [INICIO, { ruta: "/vehiculos", icono: "ti-truck", texto: "Vehículos" }, { ruta: "/repuestos", icono: "ti-package", texto: "Repuestos" }, ACERCA];
const MENU = { admin: OFICINA, mecanico: OFICINA, chofer: [INICIO, ACERCA] };

const esOficina = (u) => u.rol === "admin" || u.rol === "mecanico";

// Cada vista recibe además los datos y el cambio de persona
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    // El tablero de Marta usa el ancho de la compu (dos columnas); en el celular no cambia nada
    { patron: /^\/inicio$/, vista: con(vistaInicio), get ancho() { return usuario?.rol === "admin"; } },
    { patron: /^\/avisar$/, vista: con(vistaAvisar), puede: (u) => u.rol === "chofer", menu: "/inicio" },
    { patron: /^\/arreglar\/([\w-]+)$/, vista: con(vistaArreglar), puede: (u) => u.rol === "mecanico", menu: "/inicio" },
    { patron: /^\/vehiculos$/, vista: con(vistaVehiculos), puede: esOficina },
    { patron: /^\/vehiculos\/([\w-]+)$/, vista: con(vistaFicha), puede: esOficina },
    { patron: /^\/repuestos$/, vista: con(vistaRepuestos), puede: esOficina },
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

// Si otra pestaña cambió los datos (ej: Ramón en una pestaña y Diego en otra), se vuelven a leer
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
