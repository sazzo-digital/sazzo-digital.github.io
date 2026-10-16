// ============================================
// Marca, personas y "también puede tener" de Sazzo Kiosco (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño y la empleada.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=9d8300a5a6";
import { negocioDe } from "../kit/js/colores.js?v=9d8300a5a6";

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

export const NEGOCIO = negocioDe(MARCA.prefijo, "Kiosco La Esquina"); // nombre de ejemplo (arriba sigue diciendo Sazzo Kiosco)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Lector de códigos con la cámara del celu: el producto se suma solo al ticket",
        "Stock por proveedor, con el filtro \"Hay que pedir\" para lo que se está terminando",
        "La lista del proveedor desde un Excel, y el stock y las ventas para bajar a Excel",
        "Caja del día: lo más vendido, las últimas ventas, los últimos 7 días y el cierre",
        "Ruleta de premios de ejemplo, para una promo del kiosco"
    ],
    tambien: [
        "Cobro con Mercado Pago o QR, y lector de códigos o balanza",
        "Que la caja y el stock se vean en el celular del dueño, al instante",
        "Varias cajas o sucursales, con su usuario cada una",
        "Pedido al proveedor armado solo con lo que hay que pedir",
        "Recargas, servicios y lo que cobre tu kiosco"
    ]
};
