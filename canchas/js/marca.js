// ============================================
// Marca, personas y "también puede tener" de Sazzo Canchas (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño del complejo y un jugador.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=7d4af554c7";
import { negocioDe } from "../kit/js/colores.js?v=7d4af554c7";

export const MARCA = revisarMarca({
    id: "canchas",
    rubro: "Canchas",
    lema: "Turnos · Fútbol · Pádel",
    descripcion: "Para canchas de fútbol y pádel: los turnos ordenados en una grilla, turnos fijos y señas, sin que se pisen por WhatsApp.",
    wow: "Reservá una cancha como Fede y mirá cómo le aparece a Gustavo en la grilla."
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
        detalle: "Reserva una cancha desde el celular",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Complejo El Potrero"); // nombre de ejemplo (arriba sigue diciendo Sazzo Canchas)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Fútbol 5, Fútbol 7 y pádel, cada una con su duración y su seña",
        "El dueño anota desde la grilla los turnos que llegan por teléfono",
        "Marcar si llegaron o faltaron, y cobrar la seña",
        "Cantina: el jugador pide desde su turno y el dueño cobra la cuenta, dividida entre todos",
        "El jugador ve sus turnos y puede cancelar o volver a reservar"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Como Fede, pedí aguas o una cerveza a la cantina desde tu turno",
            "Como Gustavo, mirá el pedido, marcalo entregado y cobrá la cuenta",
            "Dividí la cuenta entre todos los jugadores, en partes iguales",
            "La cantina también vende sola, con su caja y su stock"
        ]
    },
    tambien: [
        "Que el turno le llegue al dueño en su celular, al instante",
        "Seña con Mercado Pago o transferencia, de verdad",
        "Botón para avisarle al grupo por WhatsApp",
        "Torneos, \"falta uno\" y avisos por lluvia",
        "Varios complejos, con su usuario cada uno"
    ]
};
