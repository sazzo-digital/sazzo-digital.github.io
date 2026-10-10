// ============================================
// Marca, personas y "también puede tener" de Sazzo Inmobiliaria (armada el 10/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): la dueña (martillera), el agente que atiende
// consultas y visitas, y una chica que busca alquilar y pide la visita desde el celular.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=bc8d90946e";
import { negocioDe } from "../kit/js/colores.js?v=bc8d90946e";

export const MARCA = revisarMarca({
    id: "inmobiliaria",
    rubro: "Inmobiliaria",
    lema: "Propiedades · Visitas · Alquileres",
    descripcion: "Para inmobiliarias y martilleros: que no se pierda ninguna consulta, coordinar visitas sin pisarse, mandar la ficha de la propiedad y tener a mano los alquileres que aumentan, vencen o no se pagaron.",
    wow: "Pedí una visita como Valeria; Tomás la confirma y manda la ficha, y Graciela ve qué alquileres aumentan."
});

export const PERSONAS = [
    {
        id: "u-duena",
        nombre: "Graciela",
        apellido: "Ferraro",
        rol: "duena",
        rolTexto: "Dueña",
        etiqueta: "Graciela · Dueña",
        detalle: "Alquileres que aumentan o vencen, pagos y todo lo demás"
    },
    {
        id: "u-agente",
        nombre: "Tomás",
        apellido: "Iturbe",
        rol: "agente",
        rolTexto: "Agente",
        etiqueta: "Tomás · Agente",
        detalle: "Consultas, visitas y fichas de las propiedades"
    },
    {
        id: "u-cliente",
        nombre: "Valeria",
        apellido: "Sosa",
        rol: "cliente",
        rolTexto: "Busca alquilar",
        etiqueta: "Valeria · Busca alquilar",
        detalle: "Mira propiedades y pide una visita desde el celular",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Inmobiliaria Puerta Abierta"); // nombre de ejemplo (arriba sigue diciendo Sazzo Inmobiliaria)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Publicar solo en los portales y traer sus consultas a una sola lista",
    "El índice oficial de cada mes, sin cargarlo a mano",
    "Liquidación al propietario y recibos de alquiler",
    "Contratos con firma digital",
    "Cobro del alquiler con Mercado Pago o transferencia, y avisos por WhatsApp",
    "Agenda de visitas en el calendario de cada agente",
    "Tasaciones y varias sucursales, con su usuario cada una"
];
