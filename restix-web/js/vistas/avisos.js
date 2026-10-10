// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   La moza manda el pedido de una mesa → a la cocina le salta "¡Comanda nueva!".
//   La cocina la marca lista → a la moza le salta "¡Listo para llevar!" con la mesa.
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
export function avisosDe(datos) {
    const avisos = [];
    for (const c of datos.guardado.db().comandas ?? []) {
        if (c.destino !== "cocina") continue;
        const platos = (c.items ?? []).reduce((n, i) => n + (Number(i.cantidad) || 0), 0);
        const detalle = (c.items ?? []).slice(0, 3).map((i) => `${i.cantidad} ${i.nombre}`).join(", ");
        if (c.estado === "pendiente") {
            avisos.push({
                id: `comanda-${c.id}`, estado: c.estado, para: ["cocina"], de: "u-moza",
                titulo: "¡Comanda nueva!", linea: `${c.mesa} · ${platos} ${platos === 1 ? "plato" : "platos"}`, chico: detalle,
                boton: "Verla", ruta: "/inicio", icono: "ti-bell-ringing"
            });
        }
        if (c.estado === "lista") {
            avisos.push({
                id: `comanda-${c.id}`, estado: c.estado, para: ["moza"], de: "u-cocina",
                titulo: "¡Listo para llevar!", linea: c.mesa, chico: detalle,
                boton: "Ver la mesa", ruta: /^m\d+$/.test(c.mesaId) ? `/mesa/${c.mesaId}` : "/inicio", menu: "/inicio",
                icono: "ti-tools-kitchen-2", tono: "bien"
            });
        }
    }
    return avisos;
}
