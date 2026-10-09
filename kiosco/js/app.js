// ============================================
// Arranque de Sazzo Kiosco: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Las dos personas ven las mismas secciones; lo que cambia (precios, topes, últimos 7 días) lo controlan las
// funciones de datos y cada pantalla. irA() cambia de persona sin pasar por "Probala como…" (botones del recorrido).
// ============================================
import { $ } from "../kit/js/ui.js?v=b4e350d86d";
import { iniciarDemo } from "../kit/js/arranque.js?v=b4e350d86d";
import { vistaIngreso } from "../kit/js/ingreso.js?v=b4e350d86d";
import { pintarMarco } from "../kit/js/marco.js?v=b4e350d86d";
import { mostrarRuta } from "../kit/js/rutas.js?v=b4e350d86d";
import { vistaAcerca } from "../kit/js/acerca.js?v=b4e350d86d";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=b4e350d86d";
import { crearDatos } from "./datos.js?v=b4e350d86d";
import { vistaInicio } from "./vistas/inicio.js?v=b4e350d86d";
import { vistaFiados, vistaCliente } from "./vistas/fiados.js?v=b4e350d86d";
import { vistaStock, vistaAumento } from "./vistas/stock.js?v=b4e350d86d";
import { vistaCaja } from "./vistas/caja.js?v=b4e350d86d";

iniciarDemo(MARCA);
const datos = crearDatos();
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
    { patron: /^\/caja$/, vista: con(vistaCaja) },
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
    datos.guardado.guardarSesion(persona.id);
    history.replaceState(null, "", `#${ruta}`);
    entrar(persona);
}

window.addEventListener("hashchange", () => {
    if (contenido) mostrar();
});

// Si otra pestaña cambió los datos (ej: Sofía vendiendo en una pestaña y Rubén mirando la caja en otra)
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
