// ============================================
// Inicio de Sazzo Perfumería: distinto para cada persona.
// Carolina (dueña) → los pedidos · Julieta (clienta) → el catálogo.
// ============================================
import { vistaPedidos } from "./duena.js?v=f04a42026d";
import { vistaCatalogo } from "./clienta.js?v=f04a42026d";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "duena" ? vistaPedidos(cont, opciones) : vistaCatalogo(cont, opciones);
}
