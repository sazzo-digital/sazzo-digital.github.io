// ============================================
// Inicio de Sazzo Barbería: distinto para cada persona.
// Leo (barbero) → la agenda del día · Matías (cliente) → "Sacá tu turno".
// ============================================
import { vistaAgenda } from "./agenda.js?v=5df3c0c0d4";
import { vistaSacarTurno } from "./cliente.js?v=5df3c0c0d4";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "barbero" ? vistaAgenda(cont, opciones) : vistaSacarTurno(cont, opciones);
}
