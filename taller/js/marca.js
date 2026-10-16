// ============================================
// Marca, personas y "también puede tener" de Sazzo Taller (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño y un mecánico.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=4788997dbc";
import { negocioDe } from "../kit/js/colores.js?v=4788997dbc";

export const MARCA = revisarMarca({
    id: "taller",
    rubro: "Taller",
    lema: "Órdenes · Presupuestos · Avisos",
    descripcion: "Para talleres mecánicos: la orden de trabajo de cada auto, el presupuesto para imprimir, el aviso de que ya está listo y los que tienen el service vencido.",
    wow: "Recibí un auto como Raúl y mirá cómo le llega la orden a Seba, el mecánico."
});

export const PERSONAS = [
    {
        id: "u-dueno",
        nombre: "Raúl",
        apellido: "Ferreyra",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Raúl · Dueño",
        detalle: "Recibe los autos, arma los presupuestos y avisa al cliente",
        empezar: true // "Empezá por acá" en "Probala como…"
    },
    {
        id: "u-mecanico",
        nombre: "Seba",
        apellido: "Núñez",
        rol: "mecanico",
        rolTexto: "Mecánico",
        etiqueta: "Seba · Mecánico",
        detalle: "Ve sus autos, carga lo que encontró y los repuestos"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Taller del Centro"); // nombre de ejemplo (arriba sigue diciendo Sazzo Taller)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Al mecánico le llegan las órdenes sin precios, y dicta con la voz lo que encontró",
        "La orden pasa por aprobado, falta repuesto, terminado y entregado",
        "Historial de cada auto y de cada cliente",
        "Mensaje listo para escribirle al cliente",
        "Anular una orden sin borrarla"
    ],
    tambien: [
        "Mandar el presupuesto y el \"ya está listo\" por WhatsApp, con un toque",
        "Fotos del auto al recibirlo y del trabajo hecho",
        "Stock de repuestos que se descuenta solo",
        "Turnos para traer el auto y cuenta corriente de cada cliente",
        "Que el cliente vea en qué estado está su auto, desde su celular",
        "Varios talleres, con su usuario cada mecánico"
    ]
};
