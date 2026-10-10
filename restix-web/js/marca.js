// ============================================
// Marca, personas y "también puede tener" de Restix Sazzo (diseñada el 08/10/2026, opción B: el recorrido de Restix
// rehecho con el kit). Las personas son los roles reales del rubro (nombres inventados): la moza, el de la cocina y
// (desde el 10/10) una clienta que abre la carta con el QR de la mesa.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=949a9fe1e6";
import { negocioDe } from "../kit/js/colores.js?v=949a9fe1e6";

export const MARCA = revisarMarca({
    id: "restix-web",
    rubro: "Restix",
    nombre: "Restix Sazzo",
    lema: "Salón · Cocina · Caja",
    descripcion: "Para bares y restaurantes: el plano de mesas, la comanda que llega sola a la cocina y a la barra, y el cobro dividiendo la cuenta.",
    wow: "Tomá un pedido como Lara y mirá cómo llega solo a la cocina de Beto."
});

export const PERSONAS = [
    {
        id: "u-moza",
        nombre: "Lara",
        apellido: "Giménez",
        rol: "moza",
        rolTexto: "Moza",
        etiqueta: "Lara · Moza",
        detalle: "Abre las mesas, toma los pedidos, cobra y ve la caja",
        empezar: true // "Empezá por acá" en "Probala como…"
    },
    {
        id: "u-cocina",
        nombre: "Beto",
        apellido: "Almada",
        rol: "cocina",
        rolTexto: "Cocina",
        etiqueta: "Beto · Cocina",
        detalle: "Ve los pedidos que llegan a la cocina y avisa cuando están listos"
    },
    {
        id: "u-cliente",
        nombre: "Flor",
        apellido: "Rivas",
        rol: "cliente",
        rolTexto: "Cliente (Mesa 4)",
        etiqueta: "Flor · Cliente (Mesa 4)",
        detalle: "Escanea el QR de la Mesa 4 y mira la carta, con platos en 3D"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const MESA_CLIENTE = "Mesa 4"; // donde se sentó Flor (la misma de la pista del salón)

export const NEGOCIO = negocioDe(MARCA.prefijo, "Bar El Farol"); // nombre de ejemplo (arriba sigue diciendo Restix Sazzo)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

// "Acerca de": lo que la versión real (Restix) tiene y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Imprimir la comanda en la cocina y en la barra, sola",
    "Cambiar la carta y los precios cuando quieras",
    "Stock de barriles y bebidas que se descuenta con cada pinta",
    "Resúmenes del mes: lo más vendido y cuánto entró",
    "Pedidos Ya y delivery en la misma pantalla",
    "Funciona en la compu del local, aunque se corte internet"
];
