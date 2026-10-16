// ============================================
// Inicio de Sazzo Ferretería: distinto para cada persona.
// Osvaldo y Nahuel → Vender (en el mostrador lo primero es vender) · Marcos → pedir un presupuesto.
// ============================================
import { vistaVender } from "./vender.js?v=01b2a0dc1f";
import { vistaPedirPresupuesto } from "./cliente.js?v=01b2a0dc1f";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "cliente" ? vistaPedirPresupuesto(cont, opciones) : vistaVender(cont, opciones);
}
