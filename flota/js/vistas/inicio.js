// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=e7f855679d";
import { vistaInicioAdmin } from "./admin.js?v=e7f855679d";
import { vistaInicioMecanico } from "./mecanico.js?v=e7f855679d";
import { vistaInicioChofer } from "./chofer.js?v=e7f855679d";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
