// ============================================
// Pantallas del cliente (Matías), pensadas para el celular: "Sacá tu turno" (servicio, barbero o "el que esté
// libre", día y hora libre: sin cargar ningún dato) y "Mis turnos" (con Cancelar).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=a4bc25e3bb";
import { aHora } from "../../kit/js/turnos.js?v=a4bc25e3bb";
import { SERVICIOS, BARBEROS, pesos, nombreFecha } from "../datos.js?v=a4bc25e3bb";
import { NEGOCIO } from "../marca.js?v=a4bc25e3bb";
import { guia, activarGuias, pastillaEstado, chipsDias } from "./comunes.js?v=a4bc25e3bb";

// Lo elegido queda mientras se navega
let servicioId = "corte";
let barberoId = "cualquiera";
let fecha = null;

export function vistaSacarTurno(cont, { usuario, datos, irA }) {
    const dias = datos.dias();
    if (!dias.some((d) => d.fecha === fecha && !d.cerrado)) fecha = dias.find((d) => !d.cerrado)?.fecha ?? dias[0].fecha;
    let elegido = null;

    function pintar() {
        const libres = datos.libresPara({ servicioId, barberoId, fecha });
        const s = SERVICIOS.find((x) => x.id === servicioId);
        cont.querySelectorAll("[data-servicio]").forEach((b) => b.classList.toggle("activo", b.dataset.servicio === servicioId));
        cont.querySelectorAll("[data-barbero]").forEach((b) => b.classList.toggle("activo", b.dataset.barbero === barberoId));
        cont.querySelectorAll("[data-dia]").forEach((b) => b.classList.toggle("activo", b.dataset.dia === fecha));
        cont.querySelector(".horas").innerHTML = libres.length
            ? `<div class="botones-horas">${libres.map((l) => `
                <button class="hora${elegido === l.inicio ? " activo" : ""}" type="button" data-hora="${l.inicio}">${esc(aHora(l.inicio))}</button>`).join("")}</div>`
            : vacio(fecha === dias[0].fecha ? "Hoy ya no quedan turnos. Probá otro día." : "No quedan turnos ese día.", "ti-calendar-off");
        cont.querySelectorAll("[data-hora]").forEach((b) => b.addEventListener("click", () => {
            elegido = Number(b.dataset.hora);
            pintar();
        }));
        const confirmar = cont.querySelector(".confirmar");
        if (elegido === null || !libres.some((l) => l.inicio === elegido)) {
            confirmar.innerHTML = "";
            return;
        }
        const quien = barberoId === "cualquiera" ? "el que esté libre" : BARBEROS.find((b) => b.id === barberoId).nombre;
        confirmar.innerHTML = `
            <div class="bloque resumen-turno">
                <p><b>${esc(s.texto)}</b> · ${esc(nombreFecha(fecha))} ${esc(aHora(elegido))} · con ${esc(quien)}</p>
                <p class="nota"><i class="ti ti-cash"></i> ${esc(pesos(s.precio))} · ${esc(s.duracion)} minutos. Se paga en la barbería.</p>
                <button class="boton boton--ancho boton--grande" type="button" data-sacar><i class="ti ti-calendar-check"></i> Sacar turno</button>
            </div>`;
        confirmar.querySelector("[data-sacar]").addEventListener("click", () => {
            try {
                listo(datos.sacarTurno(usuario, { servicioId, barberoId, fecha, inicio: elegido }));
            } catch (err) {
                aviso(err, "error");
            }
        });
        confirmar.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function listo(t) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">Listo</h1>
                <p>Te esperamos <b>${esc(nombreFecha(t.fecha))} ${esc(t.hora)}</b> con ${esc(t.barbero)}.</p>
                <p class="nota">${esc(t.servicio)} · ${esc(pesos(t.precio))}</p>
            </div>
            ${guia("u-barbero", `/inicio?fecha=${t.fecha}`, "Mirá cómo lo ve Leo")}
            <a class="boton boton--secundario boton--ancho" href="#/turnos"><i class="ti ti-calendar"></i> Mis turnos</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Sacá tu turno</h1>
            <span class="negocio"><i class="ti ti-scissors" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: elegí "Corte y barba", con Leo, y una hora. Después mirá cómo le llega.</p>
        <p class="rotulo-chico">Servicio</p>
        <div class="servicios">${SERVICIOS.map((s) => `
            <button class="servicio" type="button" data-servicio="${esc(s.id)}">
                <b>${esc(s.texto)}</b><small>${esc(s.duracion)} min · ${esc(pesos(s.precio))}</small>
            </button>`).join("")}
        </div>
        <p class="rotulo-chico">Con</p>
        <div class="chips">
            ${BARBEROS.map((b) => `<button class="chip" type="button" data-barbero="${esc(b.id)}">${esc(b.nombre)}</button>`).join("")}
            <button class="chip" type="button" data-barbero="cualquiera">El que esté libre</button>
        </div>
        <p class="rotulo-chico">Día</p>
        ${chipsDias(dias, fecha)}
        <div class="horas"></div>
        <div class="confirmar"></div>`;
    const cambiar = (fn) => () => {
        fn();
        elegido = null;
        pintar();
    };
    cont.querySelectorAll("[data-servicio]").forEach((b) => b.addEventListener("click", cambiar(() => (servicioId = b.dataset.servicio))));
    cont.querySelectorAll("[data-barbero]").forEach((b) => b.addEventListener("click", cambiar(() => (barberoId = b.dataset.barbero))));
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", cambiar(() => (fecha = b.dataset.dia))));
    pintar();
}

export function vistaMisTurnos(cont, { usuario, datos }) {
    const { vienen, anteriores } = datos.misTurnos(usuario);
    const tarjeta = (t, cancelable) => `
        <li class="tarjeta">
            <div class="tarjeta__fila">
                <span class="tarjeta__titulo"><i class="ti ti-scissors" aria-hidden="true"></i>${esc(t.servicio)} · con ${esc(t.barbero)}</span>
                ${cancelable ? "" : pastillaEstado(t.estado)}
            </div>
            <p class="tarjeta__quien"><b>${esc(nombreFecha(t.fecha))}</b> de ${esc(t.hora)} a ${esc(t.hasta)} · ${esc(pesos(t.precio))}</p>
            ${cancelable ? `<div class="tarjeta__pie"><span></span><button class="boton boton--chico boton--peligro" type="button" data-cancelar="${esc(t.id)}"><i class="ti ti-x"></i> Cancelar turno</button></div>` : ""}
        </li>`;
    cont.innerHTML = `
        <h1 class="titulo">Mis turnos</h1>
        ${vienen.length ? `<ul class="tarjetas">${vienen.map((t) => tarjeta(t, true)).join("")}</ul>` : vacio("No tenés turnos por venir.", "ti-calendar")}
        <a class="boton boton--ancho" href="#/inicio"><i class="ti ti-plus"></i> Sacar otro turno</a>
        ${anteriores.length ? `
        <details class="bloque anteriores">
            <summary>Tus últimas visitas</summary>
            <ul class="tarjetas">${anteriores.map((t) => tarjeta(t, false)).join("")}</ul>
        </details>` : ""}`;
    cont.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm("¿Cancelar el turno? El horario queda libre para otro.")) return;
        try {
            datos.cancelarTurno(usuario, b.dataset.cancelar);
            aviso("Turno cancelado");
            vistaMisTurnos(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}
