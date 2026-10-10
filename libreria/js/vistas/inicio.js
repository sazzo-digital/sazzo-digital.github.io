// ============================================
// Inicio de Sazzo Librería: distinto para cada persona.
// Mariela y Joaquín → Vender (en el mostrador lo primero es vender) · Paula → pedir la lista escolar.
// ============================================
import { vistaVender } from "./vender.js?v=114958267d";
import { vistaPedirLista } from "./clienta.js?v=114958267d";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "clienta" ? vistaPedirLista(cont, opciones) : vistaVender(cont, opciones);
}
