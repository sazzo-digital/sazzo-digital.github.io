// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Paula pide la lista del colegio desde el celu → a Mariela y a Joaquín les salta "¡Pedido de lista nuevo!".
//   La separan → a Paula le salta "¡Tu lista está separada!". Si la anulan, también se entera.
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
export function avisosDe(datos) {
    const avisos = [];
    for (const p of datos.guardado.db().pedidos ?? []) {
        const cuantos = `${p.items?.length ?? 0} ${p.items?.length === 1 ? "artículo" : "artículos"}`;
        const lista = [p.grado, p.colegio].filter(Boolean).join(" · ");
        if (p.origen === "web" && p.estado === "nueva") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: ["duena", "empleado"], de: p.clienteId,
                titulo: "¡Pedido de lista nuevo!", linea: `${p.para} · N° ${p.numero}`, chico: [lista, cuantos].filter(Boolean).join(" · "),
                boton: "Separarla", ruta: `/listas/${p.id}`, menu: "/listas", icono: "ti-bell-ringing"
            });
        }
        if (p.clienteId && p.estado === "separada") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: [p.clienteId], de: "libreria",
                titulo: "¡Tu lista está separada!", linea: `N° ${p.numero}${lista ? ` · ${lista}` : ""}`, chico: "La pagás al retirarla",
                boton: "Verla", ruta: "/mis-pedidos", icono: "ti-circle-check", tono: "bien"
            });
        }
        if (p.clienteId && p.estado === "anulada") {
            avisos.push({
                id: `pedido-${p.id}`, estado: p.estado, para: [p.clienteId], de: "libreria",
                titulo: "Anularon tu pedido", linea: `N° ${p.numero}`, chico: "Escribile a la librería si fue un error",
                boton: "Ver mis pedidos", ruta: "/mis-pedidos", icono: "ti-alert-circle"
            });
        }
    }
    return avisos;
}
