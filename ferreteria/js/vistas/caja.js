// ============================================
// Caja del día: lo vendido hoy por medio de pago (lo que fue "a cuenta" se vendió pero no entró plata), lo que
// pagaron las cuentas corrientes, por rubro, lo más vendido (en plata: un rollo de cable vale más que 100 tarugos),
// las últimas ventas y cuánto tiene que haber en el cajón. "Cerrar caja": contás la plata y te dice si sobra o falta.
// El dueño ve además la ganancia (venta menos costo) y los últimos 7 días.
// ============================================
import { esc, aviso, fechaCorta } from "../../kit/js/ui.js?v=0f2d2843ae";
import { FONDO_CAJA, MEDIOS, TOPES, pesos, cantidadTexto } from "../datos.js?v=0f2d2843ae";
import { hora } from "./comunes.js?v=0f2d2843ae";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const nombreDia = (dia) => {
    const [a, m, d] = dia.split("-").map(Number);
    return DIAS[new Date(a, m - 1, d).getDay()];
};
const pct = (parte, todo) => (todo ? Math.round((parte / todo) * 100) : 0);
const queLlevo = (i) => (i.unidad === "u" ? `${i.cantidad > 1 ? `${i.cantidad} ` : ""}${i.nombre}` : `${cantidadTexto(i.cantidad, i.unidad)} ${i.nombre}`);

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
    const c = datos.caja(usuario);
    const dueno = usuario.rol === "dueno";
    const semana = dueno ? datos.semana(usuario) : [];
    const maximo = Math.max(1, ...semana.map((d) => d.vendido));
    const maxRubro = Math.max(1, ...c.porRubro.map((r) => r.vendido));
    const cobrado = c.cobros.efectivo + c.cobros.transferencia;

    cont.innerHTML = `
        <h1 class="titulo">Caja del día</h1>
        <div class="panel cajon">
            <span class="panel__rotulo">En el cajón tiene que haber</span>
            <span class="panel__numero">${esc(pesos(c.enCajon))}</span>
            <small>${esc(pesos(FONDO_CAJA))} de cambio + ${esc(pesos(c.porMedio.efectivo))} de ventas en efectivo${c.cobros.efectivo ? ` + ${esc(pesos(c.cobros.efectivo))} que pagaron las cuentas` : ""}</small>
        </div>
        <div class="numeros-caja">
            <div class="numero-caja"><span>Vendido hoy</span><b>${esc(pesos(c.vendido))}</b><small>${esc(c.cantidad)} ventas${c.presupuestosVendidos ? ` · ${esc(c.presupuestosVendidos)} ${c.presupuestosVendidos === 1 ? "presupuesto" : "presupuestos"}` : ""}</small></div>
            ${dueno ? `<div class="numero-caja numero-caja--ganancia"><span>Ganancia</span><b>${esc(pesos(c.ganancia))}</b><small>${esc(pct(c.ganancia, c.vendido))} % de lo vendido</small></div>` : ""}
            <div class="numero-caja"><span>Efectivo</span><b>${esc(pesos(c.porMedio.efectivo))}</b></div>
            <div class="numero-caja"><span>Transferencia</span><b>${esc(pesos(c.porMedio.transferencia))}</b></div>
            <div class="numero-caja"><span>Tarjeta</span><b>${esc(pesos(c.porMedio.tarjeta))}</b></div>
            <div class="numero-caja"><span>A cuenta</span><b>${esc(pesos(c.porMedio.cuenta))}</b><small>se vendió, todavía no entró</small></div>
            ${cobrado ? `<div class="numero-caja"><span>Pagaron las cuentas</span><b>${esc(pesos(cobrado))}</b><small>${c.cobros.transferencia ? `${esc(pesos(c.cobros.transferencia))} por transferencia` : "en efectivo"}</small></div>` : ""}
        </div>
        <div class="tablero-caja">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-receipt"></i> Últimas ventas</h2>
                ${c.ultimas.length ? `<ul class="movimientos">${c.ultimas.map((v) => `
                    <li class="movimiento">
                        <span><b>${v.presupuestoId ? '<i class="ti ti-file-text" aria-hidden="true"></i> Presupuesto · ' : ""}${esc(v.items.map(queLlevo).join(", "))}</b><small>${esc(hora(v.fecha))} · ${esc(MEDIOS[v.medio])}${v.cuenta ? ` (${esc(v.cuenta)})` : ""} · ${esc(v.por)}</small></span>
                        <b class="monto">${esc(pesos(v.total))}</b>
                    </li>`).join("")}</ul>` : `<p class="nota">Todavía no hubo ventas hoy.</p>`}
            </section>
            <div>
                <section class="bloque">
                    <h2 class="subtitulo"><i class="ti ti-chart-bar"></i> Por rubro</h2>
                    ${c.porRubro.length ? `<ul class="barras">${c.porRubro.map((r) => `
                        <li class="barras__dia barras__dia--rubro">
                            <span class="barras__nombre">${esc(r.nombre)}</span>
                            <span class="barras__barra"><span style="width:${Math.round((r.vendido / maxRubro) * 100)}%"></span></span>
                            <b>${esc(pesos(r.vendido))}</b>
                        </li>`).join("")}</ul>` : `<p class="nota">Todavía nada.</p>`}
                </section>
                <section class="bloque">
                    <h2 class="subtitulo"><i class="ti ti-flame"></i> Lo que más plata dejó hoy</h2>
                    ${c.masVendidos.length ? `<ol class="ranking">${c.masVendidos.map((m) => `<li><span>${esc(m.nombre)}<small>${esc(cantidadTexto(m.cantidad, m.unidad))}${m.unidad === "u" ? " u." : ""}</small></span><b>${esc(pesos(m.plata))}</b></li>`).join("")}</ol>` : `<p class="nota">Todavía nada.</p>`}
                </section>
            </div>
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
                    <b>${esc(pesos(d.vendido))}<small>ganancia ${esc(pesos(d.ganancia))}</small></b>
                </li>`).join("")}</ul>
        </section>` : `<p class="nota"><i class="ti ti-info-circle"></i> La ganancia y los últimos 7 días los ve Osvaldo.</p>`}
        <a class="boton-link acerca-link" href="#/acerca"><i class="ti ti-info-circle"></i> Acerca de esta demo</a>`;

    cont.querySelector(".cerrar").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = e.target.contado.value;
        try {
            const cierre = datos.cerrarCaja(usuario, v === "" ? NaN : Number(v));
            aviso(cierre.diferencia === 0 ? "Caja cerrada: justo" : "Caja cerrada", cierre.diferencia < 0 ? "error" : "ok");
            vistaCaja(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
