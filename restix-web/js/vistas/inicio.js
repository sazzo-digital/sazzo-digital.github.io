// ============================================
// Inicio de Restix Sazzo: distinto para cada persona.
// Lara (moza) → el plano del salón · Beto (cocina) → los pedidos de la cocina · Flor (cliente) → la carta del QR.
// ============================================
import { vistaPlano } from "./moza.js?v=854c927c5a";
import { vistaCocina } from "./cocina.js?v=854c927c5a";
import { vistaCarta } from "./cliente.js?v=854c927c5a";

const POR_ROL = { cocina: vistaCocina, cliente: vistaCarta };

export function vistaInicio(cont, opciones) {
    return (POR_ROL[opciones.usuario.rol] ?? vistaPlano)(cont, opciones);
}
