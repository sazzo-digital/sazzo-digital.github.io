// ============================================
// Inicio de Sazzo Carnicería: distinto para cada persona.
// Ricardo y Darío → Vender (en el mostrador lo primero es vender) · Claudia → hacer su pedido.
// ============================================
import { vistaVender } from "./vender.js?v=4438010c31";
import { vistaPedir } from "./clienta.js?v=4438010c31";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "clienta" ? vistaPedir(cont, opciones) : vistaVender(cont, opciones);
}
