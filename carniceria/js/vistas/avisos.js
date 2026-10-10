// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Claudia pide desde el celu → a Ricardo y a Darío les salta "¡Pedido nuevo!".
//   Darío lo pesa y lo deja listo → a Claudia le salta "¡Tu pedido está listo!". Si lo anulan, también se entera.
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { RETIROS } from "../datos.js?v=5c760847bf";

export function avisosDe(datos) {
    const avisos = [];
    for (const p of datos.guardado.db().pedidos ?? []) {
        const renglones = `${p.items?.length ?? 0} ${p.items?.length === 1 ? "renglón" : "renglones"}`;
        const enCuanto = p.retiro === RETIROS[0]; // "Lo antes posible" no es una hora
        if (p.origen === "web" && p.estado === "nuevo") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: ["dueno", "empleado"], de: p.clienteId,
                titulo: "¡Pedido nuevo!", linea: `${p.para} · N° ${p.numero}`, chico: `${renglones} · retira ${enCuanto ? "lo antes posible" : `a las ${p.retiro}`}`,
                boton: "Pesarlo", ruta: `/pedidos/${p.id}`, menu: "/pedidos", icono: "ti-bell-ringing"
            });
        }
        if (p.clienteId && p.estado === "listo") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: [p.clienteId], de: "carniceria",
                titulo: "¡Tu pedido está listo!", linea: `N° ${p.numero} · ${renglones}`, chico: enCuanto ? "Pasá cuando quieras" : `Lo retirás a las ${p.retiro}`,
                boton: "Verlo", ruta: "/mis-pedidos", icono: "ti-circle-check", tono: "bien"
            });
        }
        if (p.clienteId && p.estado === "anulado") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: [p.clienteId], de: "carniceria",
                titulo: "Anularon tu pedido", linea: `N° ${p.numero}`, chico: "Escribile a la carnicería si fue un error",
                boton: "Ver mis pedidos", ruta: "/mis-pedidos", icono: "ti-alert-circle"
            });
        }
    }
    return avisos;
}
