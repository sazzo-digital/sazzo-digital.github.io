// ============================================
// Inicio de Sazzo Canchas: distinto para cada persona.
// Gustavo (dueño) → la grilla del día · Fede (jugador) → "Reservá tu cancha".
// ============================================
import { vistaGrilla } from "./grilla.js?v=78e1639161";
import { vistaReservar } from "./jugador.js?v=78e1639161";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "dueno" ? vistaGrilla(cont, opciones) : vistaReservar(cont, opciones);
}
