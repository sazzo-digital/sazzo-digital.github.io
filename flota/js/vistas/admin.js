// ============================================
// Inicio de la administradora (Marta): tablero con los tres números, "Para mirar hoy" (avisos, papeles, service y
// repuestos, lo urgente primero) y lo último que pasó con sus horas. En la compu, en dos columnas.
// ============================================
import { esc } from "../../kit/js/ui.js?v=8b20c8d426";
import { conArticulo } from "../datos.js?v=8b20c8d426";
import { haceCuanto, hora, guia, activarGuias, textoRepuestos } from "./comunes.js?v=8b20c8d426";

const NUMEROS = [
    { estado: "andando", texto: "Andando", icono: "ti-circle-check" },
    { estado: "taller", texto: "En el taller", icono: "ti-tool" },
    { estado: "problema", texto: "Con problema", icono: "ti-alert-triangle" }
];

/** Un renglón de "lo último que pasó": "Diego arregló el Utilitario 7 · usó pastillas de freno (1) · 10:05". */
function movimiento(m) {
    const que = {
        aviso: `<b>${esc(m.quien)}</b> avisó un problema en ${esc(conArticulo(m.vehiculo, m.tipoVehiculo))} (${esc(m.tipo.toLowerCase())})`,
        tomo: `<b>${esc(m.quien)}</b> se hizo cargo ${esc(conArticulo(m.vehiculo, m.tipoVehiculo, true))}`,
        arreglo: `<b>${esc(m.quien)}</b> arregló ${esc(conArticulo(m.vehiculo, m.tipoVehiculo))}${m.repuestos?.length ? ` · usó ${esc(textoRepuestos(m.repuestos))}` : ""}`
    }[m.que];
    const icono = { aviso: "ti-send", tomo: "ti-tool", arreglo: "ti-circle-check" }[m.que];
    const hoy = new Date(m.cuando).toDateString() === new Date().toDateString();
    return `
        <li class="linea linea--${esc(m.que)}">
            <i class="ti ${icono}" aria-hidden="true"></i>
            <span>${que}<small>${hoy ? esc(hora(m.cuando)) : esc(haceCuanto(m.cuando))}</small></span>
        </li>`;
}

export function vistaInicioAdmin(cont, { usuario, datos, irA }) {
    const r = datos.resumen();
    const mirar = datos.paraMirar();
    const ultimos = datos.movimientos();
    // Si lo último fue un arreglo, se cierra el recorrido: Ramón ya lo ve como arreglado
    const cierre = ultimos[0]?.que === "arreglo" && ultimos[0].vehiculoId === datos.vehiculoDe("u-chofer")?.id;

    cont.innerHTML = `
        <h1 class="titulo">Hola, ${esc(usuario.nombre)}</h1>
        <div class="numeros">
            ${NUMEROS.map((n) => `
            <a class="numero numero--${n.estado}" href="#/vehiculos?estado=${n.estado}">
                <i class="ti ${n.icono}" aria-hidden="true"></i>
                <b data-contar="${r[n.estado]}">${r[n.estado]}</b>
                <span>${n.texto}</span>
            </a>`).join("")}
        </div>
        <div class="tablero">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-eye"></i> Para mirar hoy</h2>
                ${mirar.length ? `<ul class="mirar">${mirar.map((x) => `
                    <li><a class="mirar__item mirar__item--${esc(x.nivel)}" href="#${esc(x.ruta)}">
                        <i class="ti ${esc(x.icono)}" aria-hidden="true"></i>
                        <span>${esc(x.texto)}<small>${esc(x.detalle)}${x.cuando ? ` · ${esc(haceCuanto(x.cuando))}` : ""}</small></span>
                    </a></li>`).join("")}</ul>` : `<p class="nota"><i class="ti ti-mood-smile"></i> Nada pendiente. Todo en orden.</p>`}
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-history"></i> Lo último que pasó</h2>
                <ul class="lineas">${ultimos.map(movimiento).join("")}</ul>
            </section>
        </div>
        ${cierre ? guia("u-chofer", "/inicio", "Mirá cómo lo ve Ramón") : ""}`;
    activarGuias(cont, irA);
}
