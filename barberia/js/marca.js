// ============================================
// Marca, personas y "también puede tener" de Sazzo Barbería (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): el barbero (y dueño) y un cliente.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=d7321eabcf";
import { negocioDe } from "../kit/js/colores.js?v=d7321eabcf";

export const MARCA = revisarMarca({
    id: "barberia",
    rubro: "Barbería",
    lema: "Turnos · Agenda · Clientes",
    descripcion: "Para barberías y peluquerías: la agenda de turnos, los clientes y quiénes hace rato que no vienen.",
    wow: "Sacá un turno como Matías y miralo aparecer en la agenda de Leo."
});

export const PERSONAS = [
    {
        id: "u-barbero",
        nombre: "Leo",
        apellido: "Castro",
        rol: "barbero",
        rolTexto: "Barbero",
        etiqueta: "Leo · Barbero",
        detalle: "Ve la agenda del día y la ficha de cada cliente"
    },
    {
        id: "u-cliente",
        nombre: "Matías",
        apellido: "Vera",
        rol: "cliente",
        rolTexto: "Cliente",
        etiqueta: "Matías · Cliente",
        detalle: "Saca turno desde el celular",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Barbería Don Leo"); // nombre de ejemplo (arriba sigue diciendo Sazzo Barbería)
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Ficha de cada cliente con sus visitas y notas",
        "Recordatorio del turno con el mensaje listo para mandar",
        "Marcar si llegó o faltó al turno",
        "La agenda de cada barbero hora por hora: un toque en un hueco libre y anotás el turno",
        "Buscador de clientes que perdona errores"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Como Leo, mirá el día entero de cada barbero, hora por hora",
            "Tocá un hueco libre y anotá el turno ahí mismo",
            "Como Matías, mirá todos los horarios: los ocupados aparecen tachados",
            "Tocá «Turnero en la tele»: quién se está cortando y quién sigue, en pantalla completa"
        ]
    },
    tambien: [
        "Recordatorio del turno por WhatsApp, con un toque",
        "Invitar por WhatsApp a los que no vuelven, con un toque",
        "Seña al sacar turno y cobro con QR",
        "Venta de productos y comisión de cada barbero",
        "Fotos de cada corte en la ficha del cliente",
        "Varias sucursales, con su usuario cada barbero"
    ]
};
