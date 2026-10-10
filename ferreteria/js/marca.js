// ============================================
// Marca, personas y "también puede tener" de Sazzo Ferretería (armada el 10/10/2026, sobre la base de Librería).
// Las personas son los roles reales del rubro (nombres inventados): el dueño, el empleado del mostrador y un cliente
// con cuenta corriente que pide presupuestos desde el celular.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=d783fb01c6";
import { negocioDe } from "../kit/js/colores.js?v=d783fb01c6";

export const MARCA = revisarMarca({
    id: "ferreteria",
    rubro: "Ferretería",
    lema: "Ventas · Presupuestos · Cuentas",
    descripcion: "Para ferreterías y corralones: presupuestos que entienden cómo pide la gente, venta por metro y por kilo, cuentas corrientes y precios que se actualizan sin perder tu margen.",
    wow: "Pedí un presupuesto como Marcos; Nahuel lo arma y te manda el PDF, y Osvaldo actualiza los precios."
});

export const PERSONAS = [
    {
        id: "u-dueno",
        nombre: "Osvaldo",
        apellido: "Benítez",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Osvaldo · Dueño",
        detalle: "Precios con su margen, cuentas, stock y la caja"
    },
    {
        id: "u-empleado",
        nombre: "Nahuel",
        apellido: "Sosa",
        rol: "empleado",
        rolTexto: "Empleado",
        etiqueta: "Nahuel · Mostrador",
        detalle: "Vende y arma los presupuestos"
    },
    {
        id: "u-cliente",
        nombre: "Marcos",
        apellido: "Villalba",
        rol: "cliente",
        rolTexto: "Cliente",
        etiqueta: "Marcos · Cliente",
        detalle: "Pide presupuestos desde el celular",
        cuentaId: "c-marcos", // su cuenta corriente en la ferretería
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Ferretería La Escuadra"); // nombre de ejemplo (arriba sigue diciendo Sazzo Ferretería)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Mandar el presupuesto por WhatsApp de verdad",
    "Reconocer la pieza de la foto sola",
    "Cobro con Mercado Pago o QR, balanza y lector conectados",
    "Impresora de tickets y presupuestos",
    "Listas de proveedores que llegan en PDF",
    "Tienda online con tu stock real y retiro en el local",
    "Varias cajas, sucursales o depósito, con su usuario cada una"
];
