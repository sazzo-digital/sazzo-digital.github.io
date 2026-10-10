// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Valeria pide una visita desde la página → al agente que la toma le salta "¡Pidieron una visita!".
//   El agente la confirma → a Valeria le salta "¡Te confirmaron la visita!". Si alguno la cancela, el otro se entera.
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { fechaCorta } from "../../kit/js/ui.js?v=bc8d90946e";
import { aHora } from "../../kit/js/turnos.js?v=bc8d90946e";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const avisos = [];
    for (const v of db.visitas ?? []) {
        const c = db.consultas?.find((x) => x.id === v.consultaId);
        const cliente = c?.clienteId; // solo las visitas de la persona de ejemplo (las demás son del armado)
        if (!cliente) continue;
        const propiedad = db.propiedades?.find((p) => p.id === v.propiedadId)?.titulo ?? "Una propiedad";
        const cuando = `${fechaCorta(v.fecha).slice(0, 5)} a las ${aHora(v.inicio)}`;
        if (v.estado === "pedida") {
            avisos.push({
                id: `visita-${v.id}`, estado: v.estado, para: [v.agenteId], de: cliente,
                titulo: "¡Pidieron una visita!", linea: `${v.quien} · ${propiedad}`, chico: `${cuando} · falta confirmarla`,
                boton: "Ver la agenda", ruta: "/agenda", icono: "ti-bell-ringing"
            });
        }
        if (v.estado === "confirmada") {
            avisos.push({
                id: `visita-${v.id}`, estado: v.estado, para: [cliente], de: v.agenteId,
                titulo: "¡Te confirmaron la visita!", linea: propiedad, chico: `${cuando} · la dirección exacta, en Mis visitas`,
                boton: "Verla", ruta: "/mis-visitas", icono: "ti-circle-check", tono: "bien"
            });
        }
        if (v.estado === "cancelada") {
            const laCancelo = v.canceladaPor;
            avisos.push({
                id: `visita-${v.id}`, estado: v.estado, para: [laCancelo === cliente ? v.agenteId : cliente], de: laCancelo,
                titulo: laCancelo === cliente ? `${v.quien} canceló la visita` : "Cancelaron tu visita",
                linea: propiedad, chico: `Era el ${cuando}`,
                boton: laCancelo === cliente ? "Ver la agenda" : "Ver mis visitas", ruta: laCancelo === cliente ? "/agenda" : "/mis-visitas",
                icono: "ti-calendar-x"
            });
        }
    }
    return avisos;
}
