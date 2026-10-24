// ============================================
// Marca, personas y "también puede tener" de Sazzo Perfumería (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): la dueña y una clienta.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=5050d1dc54";
import { negocioDe } from "../kit/js/colores.js?v=5050d1dc54";

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

export const DETALLE = {
    hace: [
        "Catálogo con buscador que perdona errores y frascos para ver en 3D",
        "Frasco de 50 o 100 ml, o decant de 5 o 10 ml",
        "La clienta sigue su pedido desde \"Mis pedidos\"",
        "La dueña ve los pedidos nuevos y los preparados para retirar, y marca cuándo se entregó",
        "Venta en el mostrador y cobro del pedido, con el stock de frascos y de la botella madre al día"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Abrí un perfume y tocá «Verlo en 3D»: frascos escaneados que girás con el dedo",
            "Cada familia tiene su frasco, y el perfume toma su color",
            "Como Carolina, cobrá un pedido y entregalo, con el vuelto calculado",
            "Vendé en el mostrador con la caja: frascos y decants, y el stock baja solo"
        ]
    },
    tambien: [
        "Que el pedido le llegue a la dueña por WhatsApp, con un toque",
        "Envíos a domicilio y cobro con QR o transferencia",
        "Cosmética y cuidado personal, con fotos de cada producto",
        "Vendedoras con su usuario y lo que vendió cada una",
        "Saludo de cumpleaños que sale solo, el mismo día"
    ]
};
