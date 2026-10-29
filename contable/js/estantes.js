import { nombrePeriodo, pesos } from "./reglas.js?v=a9e9b17545";

const tituloMes = (periodo) => {
    const nombre = nombrePeriodo(periodo);
    return nombre[0].toUpperCase() + nombre.slice(1);
};

export function agruparPorMes(filas, filtrado = false) {
    const meses = new Map();
    for (const fila of filas) {
        const periodo = fila.fecha.slice(0, 7);
        if (!meses.has(periodo)) meses.set(periodo, []);
        meses.get(periodo).push(fila);
    }
    return [...meses].sort(([a], [b]) => b.localeCompare(a)).map(([periodo, filas], i) => ({
        periodo, titulo: tituloMes(periodo), filas, abierta: filtrado || i === 0
    }));
}

export function estantesIva(posiciones, elegido) {
    return posiciones.slice().sort((a, b) => b.periodo.localeCompare(a.periodo)).map((p) => ({
        periodo: p.periodo,
        titulo: `${tituloMes(p.periodo)} · ${p.resultado >= 0 ? "a pagar" : "a favor"} ${pesos(Math.abs(p.resultado))}`,
        abierta: p.periodo === elegido
    }));
}

export function agruparPorEstado(comprobantes, anulados) {
    const grupos = [
        { id: "emitidos", titulo: "Emitidos", filas: [] },
        { id: "anulados", titulo: "Anulados", filas: [] },
        { id: "notas", titulo: "Notas de crédito", filas: [] }
    ];
    for (const c of comprobantes) {
        const grupo = c.tipo.startsWith("NC") ? 2 : anulados.has(c.id) ? 1 : 0;
        grupos[grupo].filas.push(c);
    }
    return grupos.filter((g) => g.filas.length).map((g, i) => ({ ...g, abierta: i === 0 }));
}
