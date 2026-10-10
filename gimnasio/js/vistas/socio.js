// ============================================
// Pantallas de Franco (el socio, en el celu):
// - "Mi semana": qué le toca cada día (de hoy a 6 días), las clases con cupo (reservar, lista de espera, liberar),
//   cómo viene (el peso de sus ejercicios y las veces que vino por semana) y las notas de su profe.
// - "Mi cuota": cuándo vence, el pago de ejemplo (alias para copiar y "Ya transferí") y sus pagos anteriores.
//   Nada de tarjetas ni cobro de verdad: es una demo.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=665396befd";
import { htmlCopiable, activarCopiables } from "../../kit/js/celular.js?v=665396befd";
import { SOCIO_DE, pesos, fechaCorta, nombreFecha } from "../datos.js?v=665396befd";
import { guia, activarGuias, pastilla, pastillaCuota, chipsDias, graficoPeso, barrasSemanas } from "./comunes.js?v=665396befd";

let fechaClases = null; // el día elegido en "Clases" queda mientras se navega

export function vistaSemana(cont, { usuario, datos, irA }) {
    const socioId = SOCIO_DE[usuario.id];
    const semana = datos.miSemana(usuario);
    const ficha = datos.socio(socioId);
    const dias = datos.dias();
    if (!dias.some((d) => d.fecha === fechaClases)) fechaClases = dias[0].fecha;
    const clases = datos.clasesDelDia(fechaClases, usuario);
    const hoy = datos.hoy();

    const htmlClase = (c) => {
        const llena = c.quedan === 0;
        const mia = c.mia;
        let accion;
        if (c.empezo) accion = pastilla(mia ? "Fuiste" : "Ya empezó", "suave");
        else if (mia?.estado === "reservada") accion = `<button class="boton boton--chico boton--secundario" type="button" data-liberar="${esc(mia.id)}">Liberar</button>`;
        else if (mia?.estado === "espera") accion = `<button class="boton boton--chico boton--secundario" type="button" data-liberar="${esc(mia.id)}">Salir de la espera</button>`;
        else accion = `<button class="boton boton--chico" type="button" data-reservar="${esc(c.claseId)}">${llena ? "Anotarme en espera" : "Reservar"}</button>`;
        return `
            <li class="clase${llena ? " clase--llena" : ""}${mia ? " clase--mia" : ""}${c.empezo ? " clase--paso" : ""}">
                <span class="clase__hora">${esc(c.hora)}</span>
                <div class="clase__que">
                    <b>${esc(c.nombre)} <small>con ${esc(c.profe)}</small></b>
                    <small>${mia?.estado === "reservada" ? `<b>Tenés tu lugar</b> · ` : mia?.estado === "espera" ? `<b>En espera: sos el ${esc(mia.lugarEnEspera)}°</b> · ` : ""}${llena ? `Llena (${esc(c.cupo)})${c.espera ? ` · ${esc(c.espera)} en espera` : ""}` : `Quedan ${esc(c.quedan)} de ${esc(c.cupo)}`}</small>
                    <span class="clase__cupo" aria-hidden="true"><span style="width:${Math.round((c.anotados / c.cupo) * 100)}%"></span></span>
                </div>
                ${accion}
            </li>`;
    };

    cont.innerHTML = `
        <h1 class="titulo">Mi semana</h1>
        <p class="nota"><i class="ti ti-calendar" aria-hidden="true"></i><span>${esc(ficha.plan ?? "Clases")} · ${esc(ficha.diasTexto)} a las ${esc(ficha.hora)} · con ${esc(ficha.profe)}</span></p>
        <ol class="semana">${semana.map((d) => `
            <li class="dia-semana${d.fecha === hoy ? " dia-semana--hoy" : ""}${d.dia ? "" : " dia-semana--descanso"}">
                <span class="dia-semana__cuando">${esc(d.nombre[0].toUpperCase() + d.nombre.slice(1))}${d.fecha === hoy || d.nombre === "mañana" ? `<small>${esc(fechaCorta(d.fecha))}</small>` : ""}</span>
                <div class="dia-semana__que">
                    <span>${d.dia ? `<b>Día ${esc(d.dia.id)}</b> · ${esc(d.dia.nombre)}` : "Descanso"}</span>
                    ${d.clases.length ? `<span class="acciones">${d.clases.map((c) => pastilla(`${c.clase} ${c.hora}${c.estado === "espera" ? " (espera)" : ""}`, c.estado === "espera" ? "alerta" : "acento", "ti-calendar-check")).join("")}</span>` : ""}
                </div>
            </li>`).join("")}
        </ol>

        <h2 class="subtitulo"><i class="ti ti-calendar-event" aria-hidden="true"></i> Clases con cupo</h2>
        ${chipsDias(dias, fechaClases)}
        ${clases.length ? `<ul class="clases">${clases.map(htmlClase).join("")}</ul>` : vacio("Ese día no hay clases.", "ti-calendar-off")}

        <h2 class="subtitulo"><i class="ti ti-trending-up" aria-hidden="true"></i> Cómo venís</h2>
        ${ficha.progreso.ejercicios.length ? `<div class="graficos">${ficha.progreso.ejercicios.map(graficoPeso).join("")}</div>` : ""}
        <div class="bloque">${barrasSemanas(ficha.progreso.semanas, ficha.progreso.tocan)}</div>

        <h2 class="subtitulo"><i class="ti ti-message-2" aria-hidden="true"></i> Notas de tu profe</h2>
        ${ficha.notas.length ? `<ul class="notas-profe">${ficha.notas.slice(0, 5).map((n) => `
            <li>${esc(n.texto)}<small>${esc(ficha.profe)} · ${esc(nombreFecha(n.fecha, hoy))}</small></li>`).join("")}</ul>` : vacio("Todavía no te dejó notas.", "ti-message-2")}`;

    const otraVez = () => vistaSemana(cont, { usuario, datos, irA });
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => {
        fechaClases = b.dataset.dia;
        otraVez();
    }));
    cont.querySelectorAll("[data-reservar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const r = datos.reservar(usuario, b.dataset.reservar, fechaClases);
            aviso(r.estado === "reservada" ? `Listo: ${r.clase} ${r.nombreFecha} a las ${r.hora}` : `Estás en la lista de espera (${r.lugarEnEspera}°). Si se libera un lugar, pasás solo.`);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelectorAll("[data-liberar]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm("¿Liberar tu lugar? Lo puede tomar otro.")) return;
        try {
            const r = datos.cancelarReserva(usuario, b.dataset.liberar);
            aviso(r.paso ? `Liberaste tu lugar: ${r.paso} pasó de la lista de espera` : "Liberaste tu lugar");
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
}

export function vistaCuota(cont, { usuario, datos, irA }) {
    const { socio, alias, pagos } = datos.miCuota(usuario);
    const avisado = socio.avisoPago;
    const quedan = socio.clasesQuedan;
    cont.innerHTML = `
        <h1 class="titulo">Mi cuota</h1>
        <section class="bloque cuota">
            <div class="cuota__estado">
                <span class="rotulo-chico">${esc(socio.cuota)}</span>
                ${pastillaCuota(socio)}
            </div>
            <span class="cuota__monto">${esc(pesos(socio.monto))}</span>
            <p class="nota"><i class="ti ti-calendar" aria-hidden="true"></i><span>${socio.estadoCuota === "vencida" ? "Venció" : "Vence"} el <b>${esc(nombreFecha(socio.vence, datos.hoy()))}</b>${quedan !== null && quedan !== undefined ? ` · te ${quedan === 1 ? "queda 1 clase" : `quedan ${esc(quedan)} clases`}` : ""}</span></p>
            ${avisado ? `
            <div class="hecho hecho--chico">
                <p>${pastilla("Avisaste que pagaste", "alerta", "ti-clock")}</p>
                <p class="nota"><span>${esc(pesos(avisado.monto))} por transferencia. Falta que lo confirmen en el gimnasio.</span></p>
                ${guia("u-duena", "/inicio?filtro=avisaron", "Mirá cómo le llega a Vane")}
            </div>` : `
            <details class="pagar">
                <summary class="boton boton--ancho"><i class="ti ti-cash" aria-hidden="true"></i> Pagar (de ejemplo)</summary>
                <div class="pagar__adentro">
                    <p class="alias">Transferí ${esc(pesos(socio.monto))} al alias ${htmlCopiable(alias, "Copiar el alias")}</p>
                    <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i><span>Es una demo: el alias es de ejemplo y no se cobra nada. En la versión real también puede ir con Mercado Pago o débito automático.</span></p>
                    <button class="boton boton--ancho" type="button" data-avise><i class="ti ti-send" aria-hidden="true"></i> Ya transferí: avisar al gimnasio</button>
                </div>
            </details>`}
        </section>
        <h2 class="subtitulo"><i class="ti ti-history" aria-hidden="true"></i> Tus pagos</h2>
        ${pagos.length ? `<ul class="tarjetas">${pagos.map((p) => `
            <li class="tarjeta tarjeta--chica">
                <div class="tarjeta__fila">
                    <span><b>${esc(fechaCorta(p.confirmadoEl ?? p.fecha))}</b> · ${esc(p.cuota)} · ${p.medio === "efectivo" ? "efectivo" : "transferencia"}</span>
                    ${p.estado === "avisado" ? pastilla("A confirmar", "alerta") : `<b>${esc(pesos(p.monto))}</b>`}
                </div>
            </li>`).join("")}</ul>` : vacio("Todavía no hay pagos.", "ti-receipt")}`;

    activarCopiables(cont, "Alias copiado");
    activarGuias(cont, irA);
    cont.querySelector("[data-avise]")?.addEventListener("click", () => {
        try {
            datos.avisarPago(usuario);
            aviso("Listo: le avisamos al gimnasio");
            vistaCuota(cont, { usuario, datos, irA });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
