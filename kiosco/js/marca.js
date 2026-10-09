// ============================================
// Marca, personas y "también puede tener" de Sazzo Kiosco (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño y la empleada.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=04c5d739b2";

export const MARCA = revisarMarca({
    id: "kiosco",
    rubro: "Kiosco",
    lema: "Ventas · Stock · Fiados",
    descripcion: "Para kioscos y almacenes: vender rápido, saber qué queda, anotar los fiados y subir los precios de un proveedor en un toque.",
    wow: "Vendé y anotá un fiado como Sofía; después Rubén sube los precios de un proveedor de un toque."
});

export const PERSONAS = [
    {
        id: "u-dueno",
        nombre: "Rubén",
        apellido: "Sosa",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Rubén · Dueño",
        detalle: "Ve la caja del día, el stock y los fiados"
    },
    {
        id: "u-empleada",
        nombre: "Sofía",
        apellido: "Medina",
        rol: "empleada",
        rolTexto: "Empleada",
        etiqueta: "Sofía · Empleada",
        detalle: "Vende y anota los fiados",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Kiosco La Esquina"; // nombre de ejemplo (arriba sigue diciendo Sazzo Kiosco)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Cargar la lista de precios del proveedor desde Excel",
    "Cobro con Mercado Pago o QR, y lector de códigos o balanza",
    "Que la caja y el stock se vean en el celular del dueño, al instante",
    "Varias cajas o sucursales, con su usuario cada una",
    "Pedido al proveedor armado solo con lo que hay que pedir",
    "Recargas, servicios y lo que cobre tu kiosco"
];
