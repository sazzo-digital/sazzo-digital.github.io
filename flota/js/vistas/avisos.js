// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   El chofer avisa un problema desde la calle → a Marta y al mecánico les salta "¡Avisaron un problema!" (si tiene
//   que parar, más fuerte).
//   El mecánico lo toma y lo arregla → al chofer le salta "Ya lo están viendo" y "¡Arreglado!" (Marta también se entera).
// Acá solo se dice qué pasó y a quién le importa; el kit decide qué es nuevo para cada uno.
// ============================================
import { PERSONAS } from "../marca.js?v=3f853aa22c";
import { tipoProblema } from "../datos.js?v=3f853aa22c";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const chofer = PERSONAS.find((p) => p.rol === "chofer");
    const avisos = [];
    for (const p of db.problemas ?? []) {
        if (!chofer || p.avisoPor !== chofer.nombre) continue; // solo los que avisa el chofer de ejemplo
        const vehiculo = db.vehiculos?.find((v) => v.id === p.vehiculoId)?.nombre ?? "Un vehículo";
        const que = tipoProblema(p.tipo).texto;
        const linea = `${vehiculo} · ${que}`;
        const chico = p.comentario ? `"${String(p.comentario).slice(0, 60)}"` : `Avisó ${p.avisoPor}`;
        if (p.estado === "avisado") {
            const titulo = p.urgencia === "parar" ? "¡Tiene que parar! Avisaron un problema" : "¡Avisaron un problema!";
            avisos.push({ id: `problema-${p.id}`, estado: p.estado, para: ["admin"], de: chofer.id, titulo, linea, chico,
                boton: "Verlo", ruta: "/inicio", icono: "ti-alert-triangle" });
            avisos.push({ id: `problema-${p.id}`, estado: p.estado, para: ["mecanico"], de: chofer.id, titulo, linea, chico,
                boton: "Tomarlo", ruta: `/arreglar/${p.id}`, menu: "/inicio", icono: "ti-alert-triangle" });
        }
        if (p.estado === "taller") {
            avisos.push({ id: `problema-${p.id}`, estado: p.estado, para: [chofer.id], de: "u-mecanico",
                titulo: "Ya lo están viendo", linea, chico: `Lo tomó ${p.tomadoPor ?? "el mecánico"}`,
                boton: "Verlo", ruta: "/inicio", icono: "ti-tool" });
        }
        if (p.estado === "arreglado") {
            avisos.push({ id: `problema-${p.id}`, estado: p.estado, para: [chofer.id, "admin"], de: "u-mecanico",
                titulo: "¡Arreglado!", linea, chico: p.nota ? String(p.nota).slice(0, 80) : "Ya puede salir",
                boton: "Verlo", ruta: "/inicio", icono: "ti-circle-check", tono: "bien" });
        }
    }
    return avisos;
}
