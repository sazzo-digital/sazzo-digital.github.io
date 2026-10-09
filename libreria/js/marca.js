// ============================================
// Marca, personas y "también puede tener" de Sazzo Librería (armada el 09/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): la dueña, el empleado del mostrador y una mamá
// que pide la lista escolar desde el celular.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=d180eb8742";

export const MARCA = revisarMarca({
    id: "libreria",
    rubro: "Librería",
    lema: "Ventas · Stock · Listas escolares",
    descripcion: "Para librerías y papelerías: vender rápido, armar las listas escolares en un toque, saber qué reponer y actualizar los precios sin perder tu margen.",
    wow: "Pedí una lista escolar como Paula; Joaquín la separa en un toque y Mariela ve qué reponer."
});

export const PERSONAS = [
    {
        id: "u-duena",
        nombre: "Mariela",
        apellido: "Ruiz",
        rol: "duena",
        rolTexto: "Dueña",
        etiqueta: "Mariela · Dueña",
        detalle: "Precios con su margen, stock, pedidos y la caja"
    },
    {
        id: "u-empleado",
        nombre: "Joaquín",
        apellido: "Paz",
        rol: "empleado",
        rolTexto: "Empleado",
        etiqueta: "Joaquín · Empleado",
        detalle: "Vende en el mostrador y arma las listas"
    },
    {
        id: "u-clienta",
        nombre: "Paula",
        apellido: "Rinaldi",
        rol: "clienta",
        rolTexto: "Clienta",
        etiqueta: "Paula · Clienta",
        detalle: "Pide la lista escolar desde el celular",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Librería Punto y Coma"; // nombre de ejemplo (arriba sigue diciendo Sazzo Librería)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Cargar la lista de un colegio desde una foto o un PDF",
    "Pasar el stock, las ventas y la ganancia a Excel",
    "Cobro con Mercado Pago o QR e impresora de tickets",
    "Avisos por WhatsApp cuando la lista está separada",
    "Tienda online con tu stock real y retiro en el local",
    "Cuenta corriente para colegios, oficinas y clientes de siempre",
    "Varias cajas o sucursales, con su usuario cada una"
];
