// ============================================
// Inicio de Sazzo Perfumería: distinto para cada persona.
// Carolina (dueña) → los pedidos · Julieta (clienta) → el catálogo.
// ============================================
import { vistaPedidos } from "./duena.js?v=71afbca5b0";
import { vistaCatalogo } from "./clienta.js?v=71afbca5b0";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "duena" ? vistaPedidos(cont, opciones) : vistaCatalogo(cont, opciones);
}
