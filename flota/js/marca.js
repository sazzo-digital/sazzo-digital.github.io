// ============================================
// Marca, personas y "también puede tener" de Sazzo Flota (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): administradora, mecánico y chofer.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=8b20c8d426";

export const MARCA = revisarMarca({
    id: "flota",
    rubro: "Flota",
    lema: "Vehículos · Taller · Repuestos",
    descripcion: "Para empresas con vehículos: qué vehículo anda y cuál está en el taller, los problemas que avisan los choferes y los repuestos."
});

export const PERSONAS = [
    {
        id: "u-admin",
        nombre: "Marta",
        apellido: "Ruiz",
        rol: "admin",
        rolTexto: "Administradora",
        etiqueta: "Marta · Administradora",
        detalle: "Ve toda la flota, los avisos y los repuestos"
    },
    {
        id: "u-mecanico",
        nombre: "Diego",
        apellido: "Molina",
        rol: "mecanico",
        rolTexto: "Mecánico",
        etiqueta: "Diego · Mecánico",
        detalle: "Recibe los problemas y arregla los vehículos"
    },
    {
        id: "u-chofer",
        nombre: "Ramón",
        apellido: "Acosta",
        rol: "chofer",
        rolTexto: "Chofer",
        etiqueta: "Ramón · Chofer",
        detalle: "Maneja su vehículo y avisa si algo anda mal"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Que el aviso del chofer le llegue al mecánico en otro celular, al instante",
    "Alta y baja de vehículos y de personas, con su usuario cada uno",
    "Días y horarios de cada chofer, y quién maneja qué vehículo",
    "Combustible, recorridos y fotos de cada problema",
    "Reportes por vehículo y por mes, y pasar los datos a Excel",
    "Cargar la flota desde una planilla"
];
