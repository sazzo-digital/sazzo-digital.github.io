// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=2acd6c7b7a";
import { vistaInicioAdmin } from "./admin.js?v=2acd6c7b7a";
import { vistaInicioMecanico } from "./mecanico.js?v=2acd6c7b7a";
import { vistaInicioChofer } from "./chofer.js?v=2acd6c7b7a";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
