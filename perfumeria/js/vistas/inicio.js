// ============================================
// Inicio de Sazzo Perfumería: distinto para cada persona.
// Carolina (dueña) → los pedidos · Julieta (clienta) → el catálogo.
// ============================================
import { vistaPedidos } from "./duena.js?v=b8dd88b783";
import { vistaCatalogo } from "./clienta.js?v=b8dd88b783";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "duena" ? vistaPedidos(cont, opciones) : vistaCatalogo(cont, opciones);
}
