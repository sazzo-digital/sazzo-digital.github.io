// ============================================
// Marca, personas y "también puede tener" de Sazzo Carnicería (armada el 10/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el dueño, el carnicero del mostrador y una clienta
// que pide desde el celular.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=55764424c5";
import { negocioDe } from "../kit/js/colores.js?v=55764424c5";

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

export const NEGOCIO = negocioDe(MARCA.prefijo, "Carnicería La Tranquera"); // nombre de ejemplo (arriba sigue diciendo Sazzo Carnicería)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Pizarra de precios para la tele del local, en pantalla completa",
        "Subió la hacienda: precio sugerido de cada corte con tu margen",
        "La balanza: leer su etiqueta con la cámara, conectarla a la compu (Chrome o Edge) o mostrarla en la tele",
        "Desposte en PDF y merma promedio por animal",
        "Caja del día con lo vendido en kilos y en plata"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Como Darío, tocá un corte y «poné carne» en la balanza simulada: el peso y el precio aparecen solos",
            "Tocá «Mostrar en la tele»: el cliente ve el corte, el peso y cuánto sale"
        ]
    },
    tambien: [
        "La balanza conectada a la compu del mostrador, ajustada a tu modelo",
        "Imprimir las etiquetas y el ticket en la impresora del mostrador",
        "Cobro con Mercado Pago o QR",
        "Avisos por WhatsApp cuando el pedido está listo",
        "Envíos a domicilio con el recorrido del día",
        "Tienda online con el stock real de cada corte",
        "Varias cajas o sucursales, con su usuario cada una"
    ]
};
