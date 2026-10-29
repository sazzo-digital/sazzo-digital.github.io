// ============================================
// Marca, personas y "también puede tener" de Sazzo Contable (propuesta aprobada el 09/10/2026).
// Las personas son los roles reales de una pyme Responsable Inscripta (nombres inventados): administración, el dueño
// y la contadora.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=a9e9b17545";
import { negocioDe } from "../kit/js/colores.js?v=a9e9b17545";

export const MARCA = revisarMarca({
    id: "contable",
    rubro: "Contable",
    lema: "Facturación · IVA · Contabilidad",
    descripcion: "Para pymes y comercios que facturan: facturas A, B y C, compras, libros de IVA, cuentas corrientes y contabilidad, con todo a nombre de tu empresa.",
    wow: "Hacé una factura A como Silvina, traé las compras de ARCA y mirá cómo la contadora ya tiene el IVA del mes."
});

export const PERSONAS = [
    {
        id: "u-admin",
        nombre: "Silvina",
        apellido: "Ríos",
        rol: "admin",
        rolTexto: "Administración",
        etiqueta: "Silvina · Administración",
        detalle: "Factura, carga las compras, cobra y paga",
        empezar: true // "Empezá por acá" en "Probala como…"
    },
    {
        id: "u-dueno",
        nombre: "Hernán",
        apellido: "Quiroga",
        rol: "dueno",
        rolTexto: "Dueño",
        etiqueta: "Hernán · Dueño",
        detalle: "Mira cuánto vendió, quién le debe y el IVA que viene"
    },
    {
        id: "u-contadora",
        nombre: "Patricia",
        apellido: "Villalba",
        rol: "contadora",
        rolTexto: "Contadora",
        etiqueta: "Patricia · Contadora",
        detalle: "Mira los libros de IVA, la contabilidad y los archivos del contador"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = negocioDe(MARCA.prefijo, "Distribuidora Los Álamos S.R.L."); // empresa de ejemplo (se cambia en "Tu empresa")
// (si el dueño escribió el nombre de su negocio en "Probala con tus colores", va ese: kit/colores.js)

export const DETALLE = {
    hace: [
        "Factura A o B (y C si la empresa es monotributista) y notas de crédito de ejemplo, sin validez fiscal",
        "Cuentas corrientes: quién te debe, a quién le debés, cobros y pagos",
        "Libros de IVA en CSV para Excel y Libro IVA Digital de prueba (.txt): la demo muestra el archivo, no lo baja",
        "Libro diario, mayor y balance de sumas y saldos que se arman solos con cada factura y compra",
        "Tu empresa: razón social, CUIT de ejemplo, logo, colores y qué pantallas se usan"
    ],
    extra: {
        titulo: "Para probar ya",
        renglones: [
            "Como Silvina, hacé una factura A y traé las compras de ARCA (simulado)",
            "Como Hernán, mirá el IVA del mes: el débito, el crédito y cuánto toca pagar",
            "Como Patricia, mirá los libros de IVA, el diario, el mayor y el balance",
            "En «Tu empresa» pasala a monotributista y cargá el tope: ves la factura C y cuánto te queda"
        ]
    },
    tambien: [
        "Conexión con ARCA, a evaluar con tu contador: la validez fiscal depende de su alta y de sus certificados",
        "Traer las compras desde «Mis Comprobantes» de ARCA con el archivo que da ARCA",
        "Varias empresas a la vez, para un estudio contable o un grupo de empresas",
        "Importar el extracto del banco para conciliar",
        "Usuarios con contraseña y permisos para cada persona del equipo",
        "Asientos a mano y correcciones con contraasiento, sin borrar nada, a revisar con tu contador",
        "Cierre de cada mes y de cada ejercicio, con el criterio de tu contador",
        "Plan de cuentas a medida y libros para rubricar, a evaluar con tu contador"
    ]
};
