// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Franco avisa que transfirió la cuota → a Vane le salta "¡Franco avisó que pagó!". Vane lo confirma → a Franco le
//   salta "¡Te confirmaron el pago!".
//   Mauro le deja una nota o le ajusta un peso → a Franco le salta "Mauro te dejó una nota" / "…te ajustó la rutina".
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { SOCIO_DE, pesos } from "../datos.js?v=9c146b12b6";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const persona = Object.fromEntries(Object.entries(SOCIO_DE).map(([u, s]) => [s, u])); // ficha → persona de ejemplo
    const avisos = [];
    for (const p of db.pagos ?? []) {
        const suyo = persona[p.socioId];
        if (!suyo) continue;
        const socio = db.socios?.find((s) => s.id === p.socioId);
        if (p.estado === "avisado") {
            avisos.push({
                id: `pago-${p.id}`, estado: p.estado, para: ["duena"], de: suyo,
                titulo: `¡${socio?.nombre ?? "Un socio"} avisó que pagó!`, linea: `${pesos(p.monto)} por transferencia`, chico: "Fijate que haya llegado y confirmalo",
                boton: "Confirmarlo", ruta: `/socios/${p.socioId}`, menu: "/inicio", icono: "ti-cash", tono: "bien"
            });
        }
        if (p.estado === "confirmado" && p.medio === "transferencia") {
            avisos.push({
                id: `pago-${p.id}`, estado: p.estado, para: [suyo], de: "u-duena",
                titulo: "¡Te confirmaron el pago!", linea: pesos(p.monto), chico: "Tu cuota está al día",
                boton: "Ver mi cuota", ruta: "/cuota", icono: "ti-circle-check", tono: "bien"
            });
        }
    }
    for (const s of db.socios ?? []) {
        const suyo = persona[s.id];
        if (!suyo) continue;
        for (const n of s.notas ?? []) {
            avisos.push({
                id: `nota-${n.id}`, estado: "nueva", para: [suyo], de: "u-profe",
                titulo: "Mauro te dejó una nota", linea: String(n.texto ?? "").slice(0, 90), chico: "En tu pantalla de hoy",
                boton: "Verla", ruta: "/inicio", icono: "ti-message-circle"
            });
        }
        for (const [clave, aj] of Object.entries(s.ajustes ?? {})) {
            avisos.push({
                id: `ajuste-${clave}`, estado: `${aj?.series ?? ""}-${aj?.reps ?? ""}-${aj?.peso ?? ""}`, para: [suyo], de: "u-profe",
                titulo: "Mauro te ajustó la rutina", linea: aj?.peso ? `Ahora: ${aj.peso} kg` : "Cambió series o repeticiones", chico: aj?.nota ? String(aj.nota).slice(0, 80) : "Solo para vos",
                boton: "Verla", ruta: "/inicio", icono: "ti-adjustments"
            });
        }
    }
    return avisos;
}
