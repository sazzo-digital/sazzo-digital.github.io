// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=b66346cd06";
import { vistaInicioAdmin } from "./admin.js?v=b66346cd06";
import { vistaInicioMecanico } from "./mecanico.js?v=b66346cd06";
import { vistaInicioChofer } from "./chofer.js?v=b66346cd06";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
