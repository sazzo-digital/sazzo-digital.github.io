// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Raúl anota que entró un auto para Seba → a Seba le salta "¡Entró un auto para vos!"; aprueba el presupuesto →
//   "¡A reparar!".
//   Seba lo revisa, pide un repuesto o lo termina → a Raúl le salta "Seba lo revisó", "Falta un repuesto" o
//   "¡Auto listo!" (para avisarle al cliente).
// Quién hizo el último paso sale del historial de la orden. Acá solo se dice qué pasó y a quién le importa; el kit
// decide qué es nuevo para cada uno.
// ============================================
import { MECANICOS, formatoPatente } from "../datos.js?v=9aeacc21d1";

const DEL_DUENO = {
    recibido: { titulo: "¡Entró un auto para vos!", icono: "ti-bell-ringing", boton: "Revisarlo" },
    reparacion: { titulo: "¡Aprobaron el presupuesto: a reparar!", icono: "ti-tool", boton: "Verla", tono: "bien" }
};
const DEL_MECANICO = {
    presupuestado: { titulo: "Lo revisó: hay que presupuestar", icono: "ti-file-invoice", boton: "Verla" },
    esperando: { titulo: "Falta un repuesto", icono: "ti-package", boton: "Verla" },
    listo: { titulo: "¡Auto listo!", icono: "ti-circle-check", boton: "Avisarle al cliente", tono: "bien" }
};

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const avisos = [];
    for (const o of db.ordenes ?? []) {
        const mecanico = MECANICOS.find((m) => m.id === o.mecanicoId);
        if (!mecanico?.personaId) continue; // solo las del mecánico de ejemplo (Seba)
        const ultimo = o.historial?.at(-1);
        const auto = db.autos?.find((a) => a.id === o.autoId);
        const linea = auto ? `${auto.modelo} · ${formatoPatente(auto.patente)}` : `Orden N° ${o.numero}`;
        const deMecanico = ultimo?.por === mecanico.nombre;
        const t = deMecanico ? DEL_MECANICO[o.estado] : DEL_DUENO[o.estado];
        if (!t) continue;
        avisos.push({
            id: `orden-${o.id}`, estado: o.estado, para: deMecanico ? ["dueno"] : [mecanico.personaId], de: deMecanico ? mecanico.personaId : "u-dueno",
            titulo: deMecanico && o.estado === "presupuestado" ? `${mecanico.nombre} ${t.titulo.toLowerCase()}` : t.titulo,
            linea, chico: o.dijo ? `"${String(o.dijo).slice(0, 60)}"` : `Orden N° ${o.numero}`,
            boton: t.boton, ruta: `/orden/${o.id}`, menu: "/inicio", icono: t.icono, tono: t.tono
        });
    }
    return avisos;
}
