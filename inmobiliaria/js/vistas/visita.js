// ============================================
// Lo de Valeria (la que busca), pensado para el celular: "Pedir visita" (día y hora libre, sin cargar ningún dato:
// la inmobiliaria asigna quién la acompaña) y "Mis visitas" (pedida → confirmada, con Cancelar).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=5e0516f6ed";
import { aHora } from "../../kit/js/turnos.js?v=5e0516f6ed";
import { guia, activarGuias, chipsDias, htmlFoto, medidas, pastillaVisita, mayuscula } from "./comunes.js?v=5e0516f6ed";

let fecha = null; // el día elegido queda mientras se navega

export function vistaPedirVisita(cont, { usuario, datos, params: [id], irA }) {
    const p = datos.propiedad(id);
    const dias = datos.dias();
    if (!dias.some((d) => d.fecha === fecha && !d.cerrado)) fecha = dias.find((d) => !d.cerrado && datos.libresParaVisita(p.id, d.fecha).length)?.fecha ?? dias[0].fecha;
    let elegido = null;

    function pintar() {
        const libres = datos.libresParaVisita(p.id, fecha);
        cont.querySelectorAll("[data-dia]").forEach((b) => {
            b.classList.toggle("activo", b.dataset.dia === fecha);
            b.setAttribute("aria-selected", String(b.dataset.dia === fecha));
        });
        const dia = dias.find((d) => d.fecha === fecha);
        cont.querySelector(".horas").innerHTML = libres.length
            ? `<div class="botones-horas">${libres.map((l) => `
                <button class="hora${elegido === l.inicio ? " activo" : ""}" type="button" data-hora="${l.inicio}" aria-pressed="${elegido === l.inicio}">${esc(aHora(l.inicio))}</button>`).join("")}</div>`
            : vacio(dia?.nombre === "hoy" ? "Hoy ya no quedan horarios. Probá otro día." : "No quedan horarios ese día.", "ti-calendar-off");
        cont.querySelectorAll("[data-hora]").forEach((b) => b.addEventListener("click", () => {
            elegido = Number(b.dataset.hora);
            pintar();
        }));
        const confirmar = cont.querySelector(".confirmar");
        if (elegido === null || !libres.some((l) => l.inicio === elegido)) {
            confirmar.innerHTML = "";
            return;
        }
        confirmar.innerHTML = `
            <div class="bloque resumen-turno">
                <p><b>${esc(mayuscula(dia.nombre))} a las ${esc(aHora(elegido))}</b> · ${esc(p.titulo)}</p>
                <p class="nota"><i class="ti ti-info-circle"></i><span>La visita dura una hora más o menos. La dirección exacta te la pasan al confirmarla.</span></p>
                <button class="boton boton--ancho boton--grande" type="button" data-pedir><i class="ti ti-calendar-check"></i> Pedir visita</button>
            </div>`;
        confirmar.querySelector("[data-pedir]").addEventListener("click", () => {
            try {
                listo(datos.pedirVisita(usuario, { propiedadId: p.id, fecha, inicio: elegido }));
            } catch (err) {
                aviso(err, "error");
                pintar();
            }
        });
        confirmar.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function listo(v) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">Listo, visita pedida</h1>
                <p><b>${esc(mayuscula(v.fechaNombre))} a las ${esc(v.hora)}</b> · ${esc(v.propiedad)}</p>
                <p class="nota"><i class="ti ti-brand-whatsapp"></i><span>Te confirman por WhatsApp. Te acompaña ${esc(v.agente)}.</span></p>
            </div>
            ${guia(v.agenteId, "/inicio", `Mirá lo que le llega a ${v.agente}`)}
            <a class="boton boton--secundario boton--ancho" href="#/mis-visitas"><i class="ti ti-calendar-event"></i> Mis visitas</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }

    cont.innerHTML = `
        <a class="volver" href="#/propiedad/${esc(p.id)}"><i class="ti ti-arrow-left"></i> La propiedad</a>
        <h1 class="titulo">Pedir visita</h1>
        <div class="prop-chica">
            ${htmlFoto(p, { clase: "foto--chica", tamanos: "80px" })}
            <span><b>${esc(p.titulo)}</b><small>${esc(p.precioTexto)} · ${esc(p.zonaNombre)} · ${esc(medidas(p))}</small></span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i><span>Probá: elegí un día y una hora libre. Después mirá cómo le llega a Tomás.</span></p>
        <p class="rotulo-chico">Día</p>
        ${chipsDias(dias, fecha)}
        <p class="rotulo-chico">Hora</p>
        <div class="horas"></div>
        <div class="confirmar"></div>`;
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => {
        fecha = b.dataset.dia;
        elegido = null;
        pintar();
    }));
    pintar();
}

export function vistaMisVisitas(cont, { usuario, datos }) {
    const { vienen, anteriores } = datos.misVisitas(usuario);
    const tarjeta = (v, cancelable) => `
        <li class="tarjeta">
            <div class="tarjeta__fila">
                <a class="tarjeta__titulo" href="#/propiedad/${esc(v.propiedadId)}"><i class="ti ti-home" aria-hidden="true"></i>${esc(v.propiedad)}</a>
                ${pastillaVisita(v)}
            </div>
            <p class="tarjeta__quien"><b>${esc(mayuscula(v.fechaNombre))} a las ${esc(v.hora)}</b> · ${esc(v.zonaNombre)} · con ${esc(v.agente)}</p>
            ${v.estado === "pedida" ? `<p class="nota"><i class="ti ti-clock"></i><span>Esperando que la inmobiliaria la confirme.</span></p>` : ""}
            ${v.estado === "confirmada" ? `<p class="nota"><i class="ti ti-circle-check"></i><span>Confirmada. La dirección exacta te llega por WhatsApp.</span></p>` : ""}
            ${cancelable ? `<div class="tarjeta__pie"><span></span><button class="boton boton--chico boton--peligro" type="button" data-cancelar="${esc(v.id)}"><i class="ti ti-x"></i> Cancelar visita</button></div>` : ""}
        </li>`;
    cont.innerHTML = `
        <h1 class="titulo">Mis visitas</h1>
        ${vienen.length ? `<ul class="tarjetas">${vienen.map((v) => tarjeta(v, true)).join("")}</ul>` : vacio("Todavía no pediste ninguna visita.", "ti-calendar")}
        <a class="boton boton--ancho" href="#/inicio"><i class="ti ti-search"></i> Ver propiedades</a>
        ${anteriores.length ? `
        <details class="bloque anteriores">
            <summary>Anteriores y canceladas</summary>
            <ul class="tarjetas">${anteriores.map((v) => tarjeta(v, false)).join("")}</ul>
        </details>` : ""}`;
    cont.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm("¿Cancelar la visita? El horario queda libre.")) return;
        try {
            datos.cancelarVisita(usuario, b.dataset.cancelar);
            aviso("Visita cancelada");
            vistaMisVisitas(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}
