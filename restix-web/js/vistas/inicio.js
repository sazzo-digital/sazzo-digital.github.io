// ============================================
// Inicio de Restix Sazzo: distinto para cada persona.
// Lara (moza) → el plano del salón · Beto (cocina) → los pedidos de la cocina.
// ============================================
import { vistaPlano } from "./moza.js?v=342460e565";
import { vistaCocina } from "./cocina.js?v=342460e565";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "cocina" ? vistaCocina(cont, opciones) : vistaPlano(cont, opciones);
}
