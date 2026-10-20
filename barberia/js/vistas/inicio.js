// ============================================
// Inicio de Sazzo Barbería: distinto para cada persona.
// Leo (barbero) → la agenda del día · Matías (cliente) → "Sacá tu turno".
// ============================================
import { vistaAgenda } from "./agenda.js?v=dd1f695466";
import { vistaSacarTurno } from "./cliente.js?v=dd1f695466";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "barbero" ? vistaAgenda(cont, opciones) : vistaSacarTurno(cont, opciones);
}
