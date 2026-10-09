// ============================================
// Marca, personas y "también puede tener" de Sazzo Barbería (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el barbero (y dueño) y un cliente.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=c9becd260b";

export const MARCA = revisarMarca({
    id: "barberia",
    rubro: "Barbería",
    lema: "Turnos · Agenda · Clientes",
    descripcion: "Para barberías y peluquerías: la agenda de turnos, los clientes y quiénes hace rato que no vienen.",
    wow: "Sacá un turno como Matías y miralo aparecer en la agenda de Leo."
});

export const PERSONAS = [
    {
        id: "u-barbero",
        nombre: "Leo",
        apellido: "Castro",
        rol: "barbero",
        rolTexto: "Barbero",
        etiqueta: "Leo · Barbero",
        detalle: "Ve la agenda del día y la ficha de cada cliente"
    },
    {
        id: "u-cliente",
        nombre: "Matías",
        apellido: "Vera",
        rol: "cliente",
        rolTexto: "Cliente",
        etiqueta: "Matías · Cliente",
        detalle: "Saca turno desde el celular",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Barbería Don Leo"; // nombre de ejemplo (arriba sigue diciendo Sazzo Barbería)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Recordatorio del turno por WhatsApp, con un toque",
    "Invitar por WhatsApp a los que no vuelven, con un toque",
    "Seña al sacar turno y cobro con QR",
    "Venta de productos y comisión de cada barbero",
    "Fotos de cada corte en la ficha del cliente",
    "Varias sucursales, con su usuario cada barbero"
];
