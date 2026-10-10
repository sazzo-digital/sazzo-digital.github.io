// ============================================
// Marca, personas y "también puede tener" de Sazzo Carnicería (armada el 10/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño, el carnicero del mostrador y una clienta
// que pide desde el celular.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=ece442dfab";

export const MARCA = revisarMarca({
    id: "carniceria",
    rubro: "Carnicería",
    lema: "Desposte · Pesaje · Pedidos",
    descripcion: "Para carnicerías, pollerías y granjas: despostar la media res sabiendo la merma y el costo real de cada corte, vender por peso y preparar los pedidos del celu.",
    wow: "Pedí como Claudia; Darío lo pesa y le avisa, y Ricardo termina el desposte y ve la merma y los precios nuevos."
});

export const PERSONAS = [
    {
        id: "u-dueno",
        nombre: "Ricardo",
        apellido: "Sosa",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Ricardo · Dueño",
        detalle: "Desposte, merma, costos, precios y la caja"
    },
    {
        id: "u-empleado",
        nombre: "Darío",
        apellido: "Medina",
        rol: "empleado",
        rolTexto: "Carnicero",
        etiqueta: "Darío · Carnicero",
        detalle: "Vende por peso, prepara los pedidos y pesa el desposte"
    },
    {
        id: "u-clienta",
        nombre: "Claudia",
        apellido: "Ibarra",
        rol: "clienta",
        rolTexto: "Clienta",
        etiqueta: "Claudia · Clienta",
        detalle: "Pide la carne desde el celular y la retira",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Carnicería La Tranquera"; // nombre de ejemplo (arriba sigue diciendo Sazzo Carnicería)

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Balanza conectada: el peso entra solo, sin escribirlo",
    "Imprimir las etiquetas y el ticket en la impresora del mostrador",
    "Cobro con Mercado Pago o QR",
    "Avisos por WhatsApp cuando el pedido está listo",
    "Envíos a domicilio con el recorrido del día",
    "Tienda online con el stock real de cada corte",
    "Varias cajas o sucursales, con su usuario cada una"
];
