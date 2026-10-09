// ============================================
// Marca, personas y "también puede tener" de Sazzo Contable (propuesta aprobada el 09/10/2026).
// Las personas son los roles reales de una pyme Responsable Inscripta (nombres inventados): administración, el dueño
// y la contadora.
// ============================================
import { revisarMarca } from "../kit/js/marca.js?v=be942dc467";

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
        detalle: "Mira los libros de IVA, la contabilidad y baja los archivos"
    }
];

export const buscarPersona = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const NEGOCIO = "Distribuidora Los Álamos S.R.L."; // empresa de ejemplo (se cambia en "Tu empresa")

// "Acerca de": lo que la versión real puede sumar y la demo deja afuera para que se recorra en 2 minutos
export const TAMBIEN = [
    "Conexión real con ARCA: facturas con validez fiscal, CAE y QR de verificación",
    "Traer las compras desde \"Mis Comprobantes\" de ARCA con el archivo que da ARCA",
    "Varias empresas a la vez, para un estudio contable o un grupo de empresas",
    "Sueldos, Ingresos Brutos y convenio multilateral, retenciones y Ganancias",
    "Conciliación bancaria importando el extracto del banco",
    "Usuarios con contraseña y permisos para cada persona del equipo"
];
