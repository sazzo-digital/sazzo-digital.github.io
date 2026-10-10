// ============================================
// Arranque de Sazzo Perfumería: "Probala como…" → marco (cabecera, banda, barrita de Sazzo, menú) → pantallas.
// Cada persona tiene su menú: Carolina (dueña) pedidos, stock y clientas; Julieta (clienta) el catálogo y su pedido.
// irA() cambia de persona sin pasar por "Probala como…" (botón del recorrido: "Mirá lo que le llega a Carolina →").
// ============================================
import { $, conFundido } from "../kit/js/ui.js?v=c28c82b591";
import { iniciarDemo } from "../kit/js/arranque.js?v=c28c82b591";
import { vistaIngreso } from "../kit/js/ingreso.js?v=c28c82b591";
import { pintarMarco } from "../kit/js/marco.js?v=c28c82b591";
import { mostrarRuta } from "../kit/js/rutas.js?v=c28c82b591";
import { vistaAcerca } from "../kit/js/acerca.js?v=c28c82b591";
import { MARCA, PERSONAS, TAMBIEN, buscarPersona } from "./marca.js?v=c28c82b591";
import { crearDatos } from "./datos.js?v=c28c82b591";
import { vistaInicio } from "./vistas/inicio.js?v=c28c82b591";
import { vistaPerfume, vistaPedido, vistaMisPedidos } from "./vistas/clienta.js?v=c28c82b591";
import { vistaStock, vistaClientas } from "./vistas/duena.js?v=c28c82b591";

iniciarDemo(MARCA);
const datos = crearDatos();
const app = $("#app");
let usuario = null;
let contenido = null;

const ACERCA = { ruta: "/acerca", icono: "ti-info-circle", texto: "Acerca" };
const MENU = {
    duena: [{ ruta: "/inicio", icono: "ti-inbox", texto: "Pedidos" }, { ruta: "/stock", icono: "ti-bottle", texto: "Stock" }, { ruta: "/clientas", icono: "ti-users", texto: "Clientas" }, ACERCA],
    cliente: [{ ruta: "/inicio", icono: "ti-sparkles", texto: "Perfumes" }, { ruta: "/pedido", icono: "ti-shopping-bag", texto: "Tu pedido" }, { ruta: "/mis-pedidos", icono: "ti-list", texto: "Mis pedidos" }, ACERCA]
};

const esDuena = (u) => u.rol === "duena";
const esClienta = (u) => u.rol === "cliente";
const con = (vista) => (cont, opciones) => vista(cont, { ...opciones, datos, irA });

const RUTAS = [
    { patron: /^\/inicio$/, vista: con(vistaInicio) },
    { patron: /^\/perfume\/([\w-]+)$/, vista: con(vistaPerfume), menu: "/inicio" },
    { patron: /^\/pedido$/, vista: con(vistaPedido), puede: esClienta },
    { patron: /^\/mis-pedidos$/, vista: con(vistaMisPedidos), puede: esClienta },
    { patron: /^\/stock$/, vista: con(vistaStock), puede: esDuena },
    { patron: /^\/clientas$/, vista: con(vistaClientas), puede: esDuena },
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

// Cada cambio de pantalla, con un fundido corto donde el navegador lo permite (kit/ui.js → conFundido)
window.addEventListener("hashchange", () => {
    if (contenido) conFundido(mostrar);
});

// Si otra pestaña cambió los datos (ej: Julieta pidiendo en el celu y Carolina con los pedidos abiertos en la compu)
window.addEventListener("storage", (e) => {
    if (e.key === datos.guardado.claves.datos && contenido) {
        datos.guardado.olvidarCache();
        mostrar();
    }
});

const yaAdentro = buscarPersona(datos.guardado.leerSesion());
if (yaAdentro) entrar(yaAdentro);
else ingresar();
