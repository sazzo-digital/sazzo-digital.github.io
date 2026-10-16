// ============================================
// Inicio de Sazzo Flota: distinto para cada persona.
// Marta (administradora) → tablero · Diego (mecánico) → problemas abiertos · Ramón (chofer) → su vehículo y "Avisar".
// ============================================
import { animarNumeros } from "../../kit/js/ui.js?v=f38d8e13f7";
import { vistaInicioAdmin } from "./admin.js?v=f38d8e13f7";
import { vistaInicioMecanico } from "./mecanico.js?v=f38d8e13f7";
import { vistaInicioChofer } from "./chofer.js?v=f38d8e13f7";

const POR_ROL = { admin: vistaInicioAdmin, mecanico: vistaInicioMecanico, chofer: vistaInicioChofer };

export function vistaInicio(cont, opciones) {
    POR_ROL[opciones.usuario.rol](cont, opciones);
    animarNumeros(cont);
}
