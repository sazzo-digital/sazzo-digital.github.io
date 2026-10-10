// ============================================
// Marca, personas y "también puede tener" de Sazzo Perfumería (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): la dueña y una clienta.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=c202475ee6";
import { negocioDe } from "../kit/js/colores.js?v=c202475ee6";

export const MARCA = revisarMarca({
    id: "perfumeria",
    rubro: "Perfumería",
    lema: "Catálogo · Pedidos · Stock",
    descripcion: "Para perfumerías: un catálogo donde la clienta arma su pedido (y le recomendamos un perfume), el stock de frascos y decants, y los cumpleaños de las clientas.",
    wow: "Armá un pedido como Julieta y mirá cómo le llega a Carolina, la dueña."
});

export const PERSONAS = [
    {
        id: "u-duena",
        nombre: "Carolina",
        apellido: "Luna",
        rol: "duena",
        rolTexto: "Dueña",
        etiqueta: "Carolina · Dueña",
        detalle: "Recibe los pedidos, prepara, ve el stock y las clientas"
    },
    {
        id: "u-clienta",
        nombre: "Julieta",
        apellido: "Sánchez",
        rol: "cliente",
        rolTexto: "Clienta",
        etiqueta: "Julieta · Clienta",
        detalle: "Mira el catálogo, pide que le recomienden y arma su pedido",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Perfumería Esencia"); // nombre de ejemplo (arriba sigue diciendo Sazzo Perfumería)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Que el pedido le llegue a la dueña por WhatsApp, con un toque",
    "Envíos a domicilio y cobro con QR o transferencia",
    "Cosmética y cuidado personal, con fotos de cada producto",
    "Venta en el mostrador con lector de códigos",
    "Vendedoras con su usuario y lo que vendió cada una",
    "Saludo de cumpleaños que sale solo, el mismo día"
];
