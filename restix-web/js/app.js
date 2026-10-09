// ============================================
// Arranque de Restix Sazzo: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Lara (moza) ve el salón, la cocina (solo mirar) y la caja; Beto, la cocina.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá lo que le llega a la cocina →").
// ============================================
import { $ } from "../kit/js/ui.js?v=940a8526b8";
import { iniciarDemo } from "../kit/js/arranque.js?v=940a8526b8";
import { vistaIngreso } from "../kit/js/ingreso.js?v=940a8526b8";
import { pintarMarco } from "../kit/js/marco.js?v=940a8526b8";
import { mostrarRuta } from "../kit/js/rutas.js?v=940a8526b8";
import { vistaAcerca } from "../kit/js/acerca.js?v=940a8526b8";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=940a8526b8";
import { crearDatos } from "./datos.js?v=940a8526b8";
import { vistaInicio } from "./vistas/inicio.js?v=940a8526b8";
import { vistaMesa, vistaCobro, vistaCaja } from "./vistas/moza.js?v=940a8526b8";
import { vistaCocina } from "./vistas/cocina.js?v=940a8526b8";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca de" };
const MENU = {
    moza: [{ ruta: "/inicio", icono: "ti-layout-grid", texto: "Salón" }, { ruta: "/cocina", icono: "ti-tools-kitchen-2", texto: "Cocina" }, { ruta: "/caja", icono: "ti-cash-register", texto: "Caja" }, ACERCA],
    cocina: [{ ruta: "/inicio", icono: "ti-tools-kitchen-2", texto: "Cocina" }, ACERCA]
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

// Si otra pestaña cambió los datos (ej: Lara tomando pedidos en el celu y la cocina con su pantalla en la compu)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
