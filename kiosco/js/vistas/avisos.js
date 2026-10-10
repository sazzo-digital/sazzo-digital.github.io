// ============================================
// Avisos entre roles (kit/avisos.js): lo que hace una persona le llega a la otra, probando desde un mismo celular.
//   Sofía vende fiado o cobra un fiado → a Rubén le salta "Sofía anotó un fiado" / "Sofía cobró un fiado".
//   Rubén sube los precios de un proveedor → a Sofía le salta "Subieron los precios" (para no cobrar el viejo).
// Quién lo hizo sale del "por" de cada cosa. Acá solo se dice qué pasó y a quién le importa; el kit decide qué es
// nuevo para cada uno.
// ============================================
import { PERSONAS } from "../marca.js?v=c830d16e78";
import { PROVEEDORES, pesos } from "../datos.js?v=c830d16e78";

export function avisosDe(datos) {
    const db = datos.guardado.db();
    const idDe = (nombre) => PERSONAS.find((p) => p.nombre === nombre)?.id ?? null;
    const avisos = [];
    for (const c of db.clientes ?? []) {
        for (const m of c.movimientos ?? []) {
            const quien = idDe(m.por);
            const rol = PERSONAS.find((p) => p.id === quien)?.rol;
            if (rol !== "empleada") continue; // lo que hace la empleada le llega al dueño
            const fiado = m.tipo === "fiado";
            avisos.push({
                id: `mov-${m.id}`, estado: m.tipo, para: ["dueno"], de: quien,
                titulo: `${m.por} ${fiado ? "anotó un fiado" : "cobró un fiado"}`, linea: `${c.nombre} · ${pesos(m.monto)}`,
                chico: fiado ? "Va a su cuenta en la libreta" : "Bajó lo que debe",
                boton: "Ver la cuenta", ruta: `/fiados/${c.id}`, menu: "/fiados", icono: fiado ? "ti-notebook" : "ti-cash", tono: fiado ? undefined : "bien"
            });
        }
    }
    for (const a of db.aumentos ?? []) {
        if (a.deshecho) continue;
        const quien = idDe(a.por);
        const proveedor = PROVEEDORES.find((p) => p.id === a.proveedorId)?.nombre;
        avisos.push({
            id: `aumento-${a.id}`, estado: "hecho", para: ["empleada"], de: quien,
            titulo: "Subieron los precios", linea: proveedor ? `${proveedor}${a.porcentaje ? ` · ${a.porcentaje} %` : ""}` : "Desde la lista del proveedor",
            chico: `${a.cambios?.length ?? 0} productos con precio nuevo`,
            boton: "Ver el stock", ruta: "/stock", icono: "ti-trending-up"
        });
    }
    return avisos;
}
