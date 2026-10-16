// ============================================
// Inicio de Sazzo Barbería: distinto para cada persona.
// Leo (barbero) → la agenda del día · Matías (cliente) → "Sacá tu turno".
// ============================================
import { vistaAgenda } from "./agenda.js?v=fa29a3e30b";
import { vistaSacarTurno } from "./cliente.js?v=fa29a3e30b";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "barbero" ? vistaAgenda(cont, opciones) : vistaSacarTurno(cont, opciones);
}
