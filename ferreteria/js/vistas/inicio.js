// ============================================
// Inicio de Sazzo Ferretería: distinto para cada persona.
// Osvaldo y Nahuel → Vender (en el mostrador lo primero es vender) · Marcos → pedir un presupuesto.
// ============================================
import { vistaVender } from "./vender.js?v=3124c09b0f";
import { vistaPedirPresupuesto } from "./cliente.js?v=3124c09b0f";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "cliente" ? vistaPedirPresupuesto(cont, opciones) : vistaVender(cont, opciones);
}
