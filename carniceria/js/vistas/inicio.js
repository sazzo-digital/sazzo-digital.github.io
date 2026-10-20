// ============================================
// Inicio de Sazzo Carnicería: distinto para cada persona.
// Ricardo y Darío → Vender (en el mostrador lo primero es vender) · Claudia → hacer su pedido.
// ============================================
import { vistaVender } from "./vender.js?v=64682b101c";
import { vistaPedir } from "./clienta.js?v=64682b101c";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "clienta" ? vistaPedir(cont, opciones) : vistaVender(cont, opciones);
}
