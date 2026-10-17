// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=978c3e29b3";
import { vistaInicioAdmin } from "./admin.js?v=978c3e29b3";
import { vistaInicioMecanico } from "./mecanico.js?v=978c3e29b3";
import { vistaInicioChofer } from "./chofer.js?v=978c3e29b3";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
