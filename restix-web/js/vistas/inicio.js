// ============================================
// Inicio de Restix Sazzo: distinto para cada persona.
// Lara (moza) → el plano del salón · Beto (cocina) → los pedidos de la cocina · Flor (cliente) → la carta del QR.
// ============================================
import { vistaPlano } from "./moza.js?v=2b0d6c4b6e";
import { vistaCocina } from "./cocina.js?v=2b0d6c4b6e";
import { vistaCarta } from "./cliente.js?v=2b0d6c4b6e";

const POR_ROL = { cocina: vistaCocina, cliente: vistaCarta };

export function vistaInicio(cont, opciones) {
    return (POR_ROL[opciones.usuario.rol] ?? vistaPlano)(cont, opciones);
}
