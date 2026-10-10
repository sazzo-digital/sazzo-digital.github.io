// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Matías saca turno desde el celu → a Leo le salta "¡Turno nuevo!". Si Matías lo cancela, Leo también se entera.
//   Leo libera el turno de Matías → a Matías le salta "Te cancelaron el turno".
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { fechaCorta } from "../../kit/js/ui.js?v=7f17c1a4d6";
import { aHora } from "../../kit/js/turnos.js?v=7f17c1a4d6";
import { SERVICIOS, BARBEROS, CLIENTE_DE } from "../datos.js?v=7f17c1a4d6";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const persona = Object.fromEntries(Object.entries(CLIENTE_DE).map(([u, c]) => [c, u])); // ficha → persona de ejemplo
    const avisos = [];
    for (const t of db.turnos ?? []) {
        const cliente = db.clientes?.find((c) => c.id === t.clienteId)?.nombre ?? "Un cliente";
        const servicio = SERVICIOS.find((s) => s.id === t.servicioId)?.texto ?? "Turno";
        const barbero = BARBEROS.find((b) => b.id === t.lugarId)?.nombre ?? "";
        const cuando = `${fechaCorta(t.fecha).slice(0, 5)} a las ${aHora(t.inicio)}`;
        const suyo = persona[t.clienteId];
        if (t.origen === "app" && suyo && t.estado === "reservado") {
            avisos.push({
                id: `turno-${t.id}`, estado: "reservado", para: ["barbero"], de: suyo,
                titulo: "¡Turno nuevo!", linea: `${cliente} · ${servicio}`, chico: `${cuando}${barbero ? ` · con ${barbero}` : ""}`,
                boton: "Ver la agenda", ruta: "/inicio", icono: "ti-bell-ringing"
            });
        }
        if (suyo && t.estado === "cancelado") {
            // Si lo canceló el cliente queda sin "visto" (el barbero no lo vio); si lo liberó el barbero, queda visto
            avisos.push(t.visto
                ? { id: `turno-${t.id}`, estado: "liberado", para: [suyo], de: "u-barbero",
                    titulo: "Te cancelaron el turno", linea: `${servicio} · ${cuando}`, chico: "Sacá otro cuando quieras",
                    boton: "Sacar otro", ruta: "/inicio", menu: "/turnos", icono: "ti-calendar-x" }
                : { id: `turno-${t.id}`, estado: "cancelado", para: ["barbero"], de: suyo,
                    titulo: "Cancelaron un turno", linea: `${cliente} · ${servicio}`, chico: `${cuando}: el horario quedó libre`,
                    boton: "Ver la agenda", ruta: "/inicio", icono: "ti-calendar-x" });
        }
    }
    return avisos;
}
