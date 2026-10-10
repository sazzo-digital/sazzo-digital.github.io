// ============================================
// "Cómo anda el gimnasio" (Vane, en la compu): la caja del mes (efectivo y transferencia), a qué hora viene la gente
// (cuadro de calor de las últimas 4 semanas: "de 19 a 21 se llena"), las clases de la semana con su ocupación, los
// socios por plan de cuota y pasar socios y pagos a Excel.
// ============================================
import { esc, vacio } from "../../kit/js/ui.js?v=665396befd";
import { bajarExcel } from "../../kit/js/archivos.js?v=665396befd";
import { NEGOCIO } from "../marca.js?v=665396befd";
import { pesos } from "../datos.js?v=665396befd";

/** Cuánto color lleva cada casillero del calor: pocos escalones, para que el número siempre se lea (contraste). */
function escalon(valor, maximo) {
    const r = maximo ? valor / maximo : 0;
    if (r < 0.12) return [0, false];
    if (r < 0.3) return [15, false];
    if (r < 0.5) return [28, false];
    if (r < 0.7) return [40, false];
    if (r < 0.88) return [85, true];
    return [100, true];
}

export function vistaGimnasio(cont, { datos }) {
    const g = datos.gimnasio();
    const maximo = Math.max(...g.calor.flatMap((f) => f.porDia), 1);
    const pico = g.calor.flatMap((f) => f.porDia.map((v, i) => ({ v, franja: f.texto, dia: g.dias[i] }))).sort((a, b) => b.v - a.v)[0];
    const porDia = new Map();
    g.clases.forEach((c) => porDia.set(c.nombreFecha, [...(porDia.get(c.nombreFecha) ?? []), c]));
    const ocupacion = g.clases.length ? Math.round((g.clases.reduce((t, c) => t + c.anotados, 0) / g.clases.reduce((t, c) => t + c.cupo, 0)) * 100) : 0;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Cómo anda el gimnasio</h1>
            <span class="negocio"><i class="ti ti-chart-bar" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <div class="numeros-grandes">
            <div><span>Cobrado este mes</span><b>${esc(pesos(g.caja.total))}</b><small>${esc(g.caja.pagos)} pagos</small></div>
            <div><span>En efectivo</span><b>${esc(pesos(g.caja.efectivo))}</b><small>en el mostrador</small></div>
            <div><span>Por transferencia</span><b>${esc(pesos(g.caja.transferencia))}</b><small>al alias</small></div>
            <div><span>Clases de la semana</span><b>${esc(ocupacion)}%</b><small>de los lugares ocupados</small></div>
        </div>
        <div class="columnas">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-flame" aria-hidden="true"></i> A qué hora viene la gente</h2>
                <p class="nota"><span>Promedio por día, las últimas 4 semanas.${pico?.v ? ` Lo más lleno: <b>${esc(pico.dia)} de ${esc(pico.franja)}</b>.` : ""}</span></p>
                <div class="calor">
                    <table>
                        <thead><tr><th scope="col"><span class="solo-lector">Horario</span></th>${g.dias.map((d) => `<th scope="col">${esc(d)}</th>`).join("")}</tr></thead>
                        <tbody>${g.calor.map((f) => `
                            <tr><th scope="row">${esc(f.texto)}</th>${f.porDia.map((v) => {
                                const [fuerza, fuerte] = escalon(v, maximo);
                                return `<td class="${fuerte ? "fuerte" : ""}" style="--fuerza:${fuerza}%">${v ? esc(v) : ""}</td>`;
                            }).join("")}</tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-calendar-event" aria-hidden="true"></i> Clases de la semana</h2>
                ${g.clases.length ? [...porDia].map(([dia, clases]) => `
                    <h3 class="rotulo-chico">${esc(dia)}</h3>
                    <ul class="clases">${clases.map((c) => `
                        <li class="clase${c.quedan === 0 ? " clase--llena" : ""}${c.empezo ? " clase--paso" : ""}">
                            <span class="clase__hora">${esc(c.hora)}</span>
                            <div class="clase__que">
                                <b>${esc(c.nombre)} <small>con ${esc(c.profe)}</small></b>
                                <span class="clase__cupo" aria-hidden="true"><span style="width:${Math.round((c.anotados / c.cupo) * 100)}%"></span></span>
                            </div>
                            <small>${esc(c.anotados)}/${esc(c.cupo)}${c.espera ? ` · ${esc(c.espera)} esperan` : ""}</small>
                        </li>`).join("")}
                    </ul>`).join("") : vacio("No hay clases esta semana.", "ti-calendar-off")}
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-users" aria-hidden="true"></i> Socios por plan de cuota</h2>
                <div class="caja">${g.porCuota.map((c) => `
                    <div class="caja__fila"><span>${esc(c.texto)}</span><b>${esc(c.socios)}</b></div>`).join("")}
                </div>
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Pasar a Excel</h2>
                <p class="nota"><span>Para el contador o para tus cuentas.</span></p>
                <div class="acciones">
                    <button class="boton boton--secundario" type="button" data-excel="socios"><i class="ti ti-users" aria-hidden="true"></i> Socios</button>
                    <button class="boton boton--secundario" type="button" data-excel="pagos"><i class="ti ti-cash" aria-hidden="true"></i> Pagos del mes</button>
                </div>
            </section>
        </div>`;

    cont.querySelectorAll("[data-excel]").forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        if (b.dataset.excel === "socios") await bajarExcel(`Socios ${NEGOCIO}`, datos.filasSocios(), { hoja: "Socios", anchos: [24, 20, 8, 24, 22, 16, 7, 10, 14] });
        else await bajarExcel(`Pagos del mes ${NEGOCIO}`, datos.filasPagos(), { hoja: "Pagos", anchos: [8, 24, 20, 14, 12] });
        b.disabled = false;
    }));
}
