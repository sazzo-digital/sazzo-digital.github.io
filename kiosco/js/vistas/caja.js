// ============================================
// Caja del día: ventas de hoy por medio de pago, fiados anotados y cobrados, lo más vendido, las últimas ventas y
// cuánto tiene que haber en el cajón. "Cerrar caja": contás la plata y te dice si sobra o falta.
// El dueño ve además los últimos 7 días.
// ============================================
import { esc, aviso, fechaCorta } from "../../kit/js/ui.js?v=04c5d739b2";
import { FONDO_CAJA, MEDIOS, TOPES, pesos } from "../datos.js?v=04c5d739b2";
import { hora } from "./comunes.js?v=04c5d739b2";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const nombreDia = (dia) => {
    const [a, m, d] = dia.split("-").map(Number);
    return DIAS[new Date(a, m - 1, d).getDay()];
};

function htmlCierre(c) {
    if (!c) return "";
    const texto = c.diferencia === 0 ? "Justo: no sobra ni falta nada" : c.diferencia > 0 ? `Sobran ${pesos(c.diferencia)}` : `Faltan ${pesos(-c.diferencia)}`;
    const clase = c.diferencia === 0 ? "bien" : c.diferencia > 0 ? "ojo" : "mal";
    return `
        <div class="cierre cierre--${clase}">
            <i class="ti ${c.diferencia === 0 ? "ti-circle-check" : "ti-alert-triangle"}" aria-hidden="true"></i>
            <span><b>${esc(texto)}</b><small>Caja cerrada por ${esc(c.por)} a las ${esc(hora(c.fecha))}: contó ${esc(pesos(c.contado))}, tenía que haber ${esc(pesos(c.esperado))}.</small></span>
        </div>`;
}

export function vistaCaja(cont, { usuario, datos }) {
    const c = datos.caja();
    const dueno = usuario.rol === "dueno";
    const semana = dueno ? datos.semana(usuario) : [];
    const maximo = Math.max(1, ...semana.map((d) => d.vendido));

    cont.innerHTML = `
        <h1 class="titulo">Caja del día</h1>
        <div class="panel cajon">
            <span class="panel__rotulo">En el cajón tiene que haber</span>
            <span class="panel__numero">${esc(pesos(c.enCajon))}</span>
            <small>${esc(pesos(FONDO_CAJA))} de cambio + ${esc(pesos(c.porMedio.efectivo))} de ventas en efectivo${c.cobradoEfectivo ? ` + ${esc(pesos(c.cobradoEfectivo))} de fiados cobrados` : ""}</small>
        </div>
        <div class="numeros-caja">
            <div class="numero-caja"><span>Vendido hoy</span><b>${esc(pesos(c.vendido))}</b><small>${esc(c.cantidad)} ventas</small></div>
            <div class="numero-caja"><span>Efectivo</span><b>${esc(pesos(c.porMedio.efectivo))}</b></div>
            <div class="numero-caja"><span>Transferencia</span><b>${esc(pesos(c.porMedio.transferencia + c.cobradoTransferencia))}</b>${c.cobradoTransferencia ? `<small>con ${esc(pesos(c.cobradoTransferencia))} de fiados</small>` : ""}</div>
            <div class="numero-caja"><span>Fiado anotado</span><b>${esc(pesos(c.porMedio.fiado))}</b>${c.cobros.length ? `<small>cobrados: ${esc(pesos(c.cobradoEfectivo + c.cobradoTransferencia))}</small>` : ""}</div>
        </div>
        <div class="tablero-caja">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-receipt"></i> Últimas ventas</h2>
                ${c.ultimas.length ? `<ul class="movimientos">${c.ultimas.map((v) => `
                    <li class="movimiento">
                        <span><b>${esc(v.items.map((i) => i.nombre).join(", "))}</b><small>${esc(hora(v.fecha))} · ${esc(MEDIOS[v.medio])}${v.cliente ? ` (${esc(v.cliente)})` : ""} · ${esc(v.por)}</small></span>
                        <b class="monto">${esc(pesos(v.total))}</b>
                    </li>`).join("")}</ul>` : `<p class="nota">Todavía no hubo ventas hoy.</p>`}
            </section>
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-flame"></i> Lo más vendido hoy</h2>
                ${c.masVendidos.length ? `<ol class="ranking">${c.masVendidos.map((m) => `<li><span>${esc(m.nombre)}</span><b>${esc(m.cantidad)}</b></li>`).join("")}</ol>` : `<p class="nota">Todavía nada.</p>`}
            </section>
        </div>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-lock"></i> Cerrar caja</h2>
            ${htmlCierre(c.cierre)}
            <form class="formulario cerrar" novalidate>
                <label>Contá la plata del cajón
                    <span class="km__fila">
                        <input name="contado" type="number" inputmode="numeric" min="0" max="${TOPES.contado}" step="1" placeholder="Ej: ${esc(c.enCajon)}">
                        <button class="boton" type="submit"><i class="ti ti-lock"></i> ${c.cierre ? "Volver a cerrar" : "Cerrar caja"}</button>
                    </span>
                </label>
            </form>
        </section>
        ${dueno ? `
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-chart-bar"></i> Últimos 7 días</h2>
            <ul class="barras">${semana.map((d, i) => `
                <li class="barras__dia${i === 0 ? " barras__dia--hoy" : ""}">
                    <span class="barras__nombre">${i === 0 ? "Hoy" : esc(nombreDia(d.dia))}<small>${esc(fechaCorta(d.dia).slice(0, 5))}</small></span>
                    <span class="barras__barra"><span style="width:${Math.round((d.vendido / maximo) * 100)}%"></span></span>
                    <b>${esc(pesos(d.vendido))}</b>
                </li>`).join("")}</ul>
        </section>` : ""}`;

    cont.querySelector(".cerrar").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = e.target.contado.value;
        try {
            const cierre = datos.cerrarCaja(usuario, v === "" ? NaN : Number(v));
            aviso(cierre.diferencia === 0 ? "Caja cerrada: justo" : "Caja cerrada", cierre.diferencia < 0 ? "error" : "ok");
            vistaCaja(cont, { usuario, datos });
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}
