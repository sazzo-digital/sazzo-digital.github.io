// ============================================
// Marca, personas y "también puede tener" de Sazzo Flota (diseñada el 08/10/2026).
// Las personas son los roles reales del rubro (nombres inventados): administradora, mecánico y chofer.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=b34a203314";

export const MARCA = revisarMarca({
    id: "flota",
    rubro: "Flota",
    lema: "Vehículos · Taller · Repuestos",
    descripcion: "Para empresas con vehículos: qué vehículo anda y cuál está en el taller, los problemas que avisan los choferes y los repuestos.",
    wow: "Avisá un problema como Ramón, el chofer, y mirá cómo le llega a Diego en el taller."
});

export const PERSONAS = [
    {
        id: "u-admin",
        nombre: "Marta",
        apellido: "Ruiz",
        rol: "admin",
        rolTexto: "Administradora",
        etiqueta: "Marta · Administradora",
        detalle: "Ve toda la flota, los avisos y los repuestos"
    },
    {
        id: "u-mecanico",
        nombre: "Diego",
        apellido: "Molina",
        rol: "mecanico",
        rolTexto: "Mecánico",
        etiqueta: "Diego · Mecánico",
        detalle: "Recibe los problemas y arregla los vehículos"
    },
    {
        id: "u-chofer",
        nombre: "Ramón",
        apellido: "Acosta",
        rol: "chofer",
        rolTexto: "Chofer",
        etiqueta: "Ramón · Chofer",
        detalle: "Maneja su vehículo y avisa si algo anda mal",
        empezar: true // "Empezá por acá" en "Probala como…"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const DETALLE = {
    hace: [
        "Estado de cada vehículo según sus problemas: andando, con problema o en el taller",
        "Mapa con dónde se vio por última vez cada vehículo (de ejemplo)",
        "Historia de problemas de cada vehículo",
        "La administradora ve lo que hay para mirar hoy y lo último que pasó",
        "Stock de repuestos que baja solo con cada arreglo y cada service, más ventas, salidas y entradas"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Abrí un vehículo y tocá «Hacer el service»: los repuestos bajan solos",
            "En Repuestos anotá lo que entra, lo que vendés o lo que sale",
            "Mirá los últimos movimientos: arreglos, services, ventas y entradas"
        ]
    },
    tambien: [
        "Que el aviso del chofer le llegue al mecánico en otro celular, al instante",
        "Alta y baja de vehículos y de personas, con su usuario cada uno",
        "Días y horarios de cada chofer, y quién maneja qué vehículo",
        "Combustible, recorridos y fotos de cada problema",
        "Reportes por vehículo y por mes, y pasar los datos a Excel",
        "Cargar la flota desde una planilla"
    ]
};
