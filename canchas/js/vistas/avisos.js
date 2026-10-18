// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Fede reserva desde el celu → al dueño le salta "¡Reserva nueva!". Si Fede la cancela, el dueño también se entera.
//   El dueño libera el turno de Fede → a Fede le salta "Te liberaron la cancha".
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { aHora } from "../../kit/js/turnos.js?v=cd2f647129";
import { CANCHAS, nombreFecha } from "../datos.js?v=cd2f647129";

export function avisosDe(datos) {
    const avisos = [];
    for (const t of datos.guardado.db().turnos ?? []) {
        if (!t.jugadorId) continue; // solo los de una persona de ejemplo (los demás son del armado)
        const cancha = CANCHAS.find((c) => c.id === t.lugarId)?.nombre ?? "Cancha";
        const cuando = `${nombreFecha(t.fecha)} a las ${aHora(t.inicio)}`;
        if (t.estado === "reservado") {
            avisos.push({
                id: `turno-${t.id}`, estado: t.estado, para: ["dueno"], de: t.jugadorId,
                titulo: "¡Reserva nueva!", linea: `${t.grupo} · ${cancha}`, chico: `${cuando} · seña pagada`,
                boton: "Verla", ruta: `/turno/${t.id}`, menu: "/inicio", icono: "ti-bell-ringing"
            });
        }
        if (t.estado === "cancelado") {
            avisos.push({
                id: `turno-${t.id}`, estado: t.estado, para: ["dueno"], de: t.jugadorId,
                titulo: "Cancelaron una reserva", linea: `${t.grupo} · ${cancha}`, chico: `${cuando}: la cancha quedó libre`,
                boton: "Ver la grilla", ruta: "/inicio", icono: "ti-calendar-x"
            });
        }
        for (const k of t.consumos ?? []) {
            if (!k.delJugador || k.entregado) continue;
            avisos.push({
                id: `pedido-${k.id}`, estado: "pedido", para: ["dueno"], de: t.jugadorId,
                titulo: `${cancha} pidió a la cantina`, linea: `${k.cantidad} × ${k.nombre}`, chico: `${t.grupo} · se suma a su cuenta`,
                boton: "Ver la cuenta", ruta: `/turno/${t.id}`, menu: "/inicio", icono: "ti-cup"
            });
        }
        if (t.pago) {
            avisos.push({
                id: `pago-${t.id}`, estado: "pagado", para: [t.jugadorId], de: "u-dueno",
                titulo: "Cuenta pagada", linea: `${cancha} · ${cuando}`, chico: t.pago.partes.length > 1 ? `Dividida entre ${t.pago.partes.length}` : "Gracias por venir",
                boton: "Ver", ruta: "/turnos", icono: "ti-circle-check"
            });
        }
        if (t.estado === "liberado") {
            avisos.push({
                id: `turno-${t.id}`, estado: t.estado, para: [t.jugadorId], de: "u-dueno",
                titulo: "Te liberaron la cancha", linea: `${cancha} · ${cuando}`, chico: "Si pagaste la seña, se devuelve",
                boton: "Reservar otra", ruta: "/inicio", menu: "/turnos", icono: "ti-calendar-x"
            });
        }
    }
    return avisos;
}
