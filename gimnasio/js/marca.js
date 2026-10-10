// ============================================
// Marca, personas y "también puede tener" de Sazzo Gimnasio (propuesta aprobada el 10/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): la dueña, el profe de musculación y un socio.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=665396befd";

export const MARCA = revisarMarca({
    id: "gimnasio",
    rubro: "Gimnasio",
    lema: "Rutinas · Seguimiento · Cuotas",
    descripcion: "Para gimnasios, boxes de funcional y estudios de pilates: la rutina de cada socio día por día, el seguimiento del profe y las cuotas.",
    wow: "Entrená como Franco, mirá cómo lo sigue Mauro y cómo Vane cobra la cuota."
});

export const PERSONAS = [
    {
        id: "u-socio",
        nombre: "Franco",
        apellido: "Acosta",
        rol: "socio",
        rolTexto: "Socio",
        etiqueta: "Franco · Socio",
        detalle: "Ve qué le toca hoy y anota lo que levanta",
        empezar: true // "Empezá por acá" en "Probala como…"
    },
    {
        id: "u-profe",
        nombre: "Mauro",
        apellido: "Ledesma",
        rol: "profe",
        rolTexto: "Profe",
        etiqueta: "Mauro · Profe",
        detalle: "Sigue a sus alumnos y arma las rutinas"
    },
    {
        id: "u-duena",
        nombre: "Vanesa",
        apellido: "Ríos",
        rol: "duena",
        rolTexto: "Dueña",
        etiqueta: "Vane · Dueña",
        detalle: "Socios, cuotas, pagos y cómo anda el gimnasio"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Gimnasio Núcleo"; // nombre de ejemplo (arriba sigue diciendo Sazzo Gimnasio)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Cobro de la cuota con Mercado Pago o débito automático",
    "Recordatorio de la cuota por WhatsApp, solo",
    "Ingreso con QR o molinete en la puerta",
    "Videos de cada ejercicio en la rutina",
    "Varias sedes, con su usuario cada profe",
    "Venta de bebidas y suplementos en el mostrador"
];
