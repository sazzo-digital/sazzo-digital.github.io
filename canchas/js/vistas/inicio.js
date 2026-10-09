// ============================================
// Inicio de Sazzo Canchas: distinto para cada persona.
// Gustavo (dueño) → la grilla del día · Fede (jugador) → "Reservá tu cancha".
// ============================================
import { vistaGrilla } from "./grilla.js";
import { vistaReservar } from "./jugador.js";

export function vistaInicio(cont, opciones) {
    return opciones.usuario.rol === "dueno" ? vistaGrilla(cont, opciones) : vistaReservar(cont, opciones);
}
