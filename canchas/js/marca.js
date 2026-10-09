// ============================================
// Marca, personas y "también puede tener" de Sazzo Canchas (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño del complejo y un jugador.
// ============================================
import { revisarMarca } from "kit/marca.js";

export const MARCA = revisarMarca({
    id: "canchas",
    rubro: "Canchas",
    lema: "Turnos · Fútbol · Pádel",
    descripcion: "Para canchas de fútbol y pádel: los turnos ordenados en una grilla, turnos fijos y señas, sin que se pisen por WhatsApp."
});

export const PERSONAS = [
    {
        id: "u-dueno",
        nombre: "Gustavo",
        apellido: "Ríos",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Gustavo · Dueño",
        detalle: "Ve la grilla de todas las canchas y los turnos fijos"
    },
    {
        id: "u-jugador",
        nombre: "Fede",
        apellido: "Paz",
        rol: "cliente",
        rolTexto: "Jugador",
        etiqueta: "Fede · Jugador",
        detalle: "Reserva una cancha desde el celular"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Complejo El Potrero"; // nombre de ejemplo (arriba sigue diciendo Sazzo Canchas)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 1 minuto
export const TAMBIEN = [
    "Que el turno le llegue al dueño en su celular, al instante",
    "Seña con Mercado Pago o transferencia, de verdad",
    "Botón para avisarle al grupo por WhatsApp",
    "Cantina: sumar bebidas al turno",
    "Torneos, \"falta uno\" y avisos por lluvia",
    "Varios complejos, con su usuario cada uno"
];
