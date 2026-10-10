// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Julieta hace su pedido desde el celu → a la dueña le salta "¡Pedido nuevo!".
//   La dueña lo prepara y le avisa → a Julieta le salta "¡Tu pedido está listo!". Si lo cancelan, también se entera.
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { CLIENTA_DE, pesos } from "../datos.js?v=c202475ee6";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const persona = Object.fromEntries(Object.entries(CLIENTA_DE).map(([u, c]) => [c, u])); // ficha → persona de ejemplo
    const avisos = [];
    for (const o of db.pedidos ?? []) {
        const suya = persona[o.clientaId];
        if (!suya) continue;
        const nombre = db.clientas?.find((c) => c.id === o.clientaId)?.nombre ?? "Una clienta";
        const total = pesos((o.renglones ?? []).reduce((t, r) => t + r.precio * r.cantidad, 0));
        const cuantos = `${o.renglones?.length ?? 0} ${o.renglones?.length === 1 ? "perfume" : "perfumes"}`;
        if (o.estado === "nuevo") {
            avisos.push({
                id: `pedido-${o.id}`, estado: o.estado, para: ["duena"], de: suya,
                titulo: "¡Pedido nuevo!", linea: `${nombre} · N° ${o.numero}`, chico: `${cuantos} · ${total}`,
                boton: "Prepararlo", ruta: "/inicio", icono: "ti-bell-ringing"
            });
        }
        if (o.estado === "preparado" && o.avisado) {
            avisos.push({
                id: `pedido-${o.id}`, estado: "avisado", para: [suya], de: "u-duena",
                titulo: "¡Tu pedido está listo!", linea: `N° ${o.numero} · ${cuantos}`, chico: `${total} · lo pagás al retirarlo`,
                boton: "Verlo", ruta: "/mis-pedidos", icono: "ti-circle-check", tono: "bien"
            });
        }
        if (o.estado === "cancelado") {
            avisos.push(o.canceladoPor === suya
                ? { id: `pedido-${o.id}`, estado: o.estado, para: ["duena"], de: suya,
                    titulo: `${nombre} canceló su pedido`, linea: `N° ${o.numero} · ${cuantos}`, chico: "Si estaba preparado, el stock ya volvió",
                    boton: "Ver los pedidos", ruta: "/inicio", icono: "ti-alert-circle" }
                : { id: `pedido-${o.id}`, estado: o.estado, para: [suya], de: "u-duena",
                    titulo: "Cancelaron tu pedido", linea: `N° ${o.numero}`, chico: "Escribile a la perfumería si fue un error",
                    boton: "Ver mis pedidos", ruta: "/mis-pedidos", icono: "ti-alert-circle" });
        }
    }
    return avisos;
}
