// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=a2320dc718";
import { vistaInicioAdmin } from "./admin.js?v=a2320dc718";
import { vistaInicioMecanico } from "./mecanico.js?v=a2320dc718";
import { vistaInicioChofer } from "./chofer.js?v=a2320dc718";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
