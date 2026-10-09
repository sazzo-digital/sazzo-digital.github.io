// ============================================
// Inicio de Sazzo Barbería: distinto para cada persona.
// Leo (barbero) → la agenda del día · Matías (cliente) → "Sacá tu turno".
// ============================================
import { vistaAgenda } from "./agenda.js?v=c9becd260b";
import { vistaSacarTurno } from "./cliente.js?v=c9becd260b";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "barbero" ? vistaAgenda(cont, opciones) : vistaSacarTurno(cont, opciones);
}
