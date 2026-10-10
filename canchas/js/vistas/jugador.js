// ============================================
// Pantallas del jugador (Fede), pensadas para el celular: "Reservá tu cancha" (día, tipo, hora libre, cancha,
// nombre del grupo y seña simulada) y "Mis turnos" (con Cancelar y la regla de la seña a la vista).
// Lo ocupado se ve, pero no se puede tocar: nunca se pisan.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=91ee73c19f";
import { TIPOS, TOPES, CANCELAR_HORAS, pesos, nombreFecha } from "../datos.js?v=91ee73c19f";
import { NEGOCIO } from "../marca.js?v=91ee73c19f";
import { guia, activarGuias, pastillaSena, pastillaEstado, chipsDias } from "./comunes.js?v=91ee73c19f";
import { aHora, minutoAhora } from "../../kit/js/turnos.js?v=91ee73c19f";
import { htmlCopiable, activarCopiables } from "../../kit/js/celular.js?v=91ee73c19f";

// Lo elegido queda mientras se navega
let fecha = null;
let tipo = "f5";

export function vistaReservar(cont, { usuario, datos, irA }) {
    const dias = datos.dias();
    if (!dias.some((d) => d.fecha === fecha)) fecha = dias[0].fecha;
    let elegido = null; // { inicio, canchas: [...] }

    function pintar() {
        const canchas = datos.libresDe(fecha, tipo);
        // Todas las horas del tipo (libres en alguna cancha o no), para que lo ocupado también se vea
        const horas = new Map();
        canchas.forEach((c) => {
            c.libres.forEach((inicio) => horas.set(inicio, [...(horas.get(inicio) ?? []), c]));
        });
        // (para hoy, sin lo que ya pasó)
        const columnas = datos.grilla(fecha).columnas;
        const desde = fecha === dias[0].fecha ? minutoAhora() : 0;
        const todas = [...new Set(canchas.flatMap((c) => c.libres.concat(columnas.find((x) => x.id === c.id).turnos.map((t) => t.inicio))))]
            .filter((inicio) => inicio >= desde)
            .sort((x, y) => x - y);

        cont.querySelector(".horas").innerHTML = todas.length
            ? `<div class="botones-horas">${todas.map((inicio) => {
                const libresAhi = horas.get(inicio) ?? [];
                return `<button class="hora${libresAhi.length ? "" : " hora--ocupada"}${elegido?.inicio === inicio ? " activo" : ""}" type="button" data-hora="${inicio}"${libresAhi.length ? "" : " disabled"}>
                    <b>${esc(aHora(inicio))}</b><small>${libresAhi.length ? `${libresAhi.length} ${libresAhi.length === 1 ? "libre" : "libres"}` : "Ocupado"}</small>
                </button>`;
            }).join("")}</div>`
            : vacio(fecha === dias[0].fecha ? "Hoy ya no quedan turnos. Probá mañana." : "No hay turnos ese día.", "ti-calendar-off");
        cont.querySelectorAll("[data-hora]").forEach((b) => b.addEventListener("click", () => {
            elegido = { inicio: Number(b.dataset.hora), canchas: horas.get(Number(b.dataset.hora)) };
            pintar();
            pintarConfirmar();
        }));
        cont.querySelectorAll("[data-dia]").forEach((b) => b.classList.toggle("activo", b.dataset.dia === fecha));
        cont.querySelectorAll("[data-tipo]").forEach((b) => b.classList.toggle("activo", b.dataset.tipo === tipo));
    }

    function pintarConfirmar() {
        const lugar = cont.querySelector(".confirmar");
        if (!elegido) {
            lugar.innerHTML = "";
            return;
        }
        const t = TIPOS[tipo];
        lugar.innerHTML = `
            <form class="formulario bloque" novalidate>
                <h2 class="subtitulo"><i class="ti ti-ball-football"></i> ${esc(t.texto)} · ${esc(nombreFecha(fecha))} ${esc(aHora(elegido.inicio))} a ${esc(aHora(elegido.inicio + t.duracion))}</h2>
                ${elegido.canchas.length > 1 ? `
                <div class="chips" role="radiogroup" aria-label="Cancha">${elegido.canchas.map((c, i) => `
                    <label class="chip chip--radio"><input type="radio" name="cancha" value="${esc(c.id)}"${i === 0 ? " checked" : ""}>${esc(c.nombre)}</label>`).join("")}
                </div>` : `<input type="hidden" name="cancha" value="${esc(elegido.canchas[0].id)}"><p class="nota"><i class="ti ti-map-pin"></i> ${esc(elegido.canchas[0].nombre)}</p>`}
                <label>Nombre del grupo
                    <input name="grupo" maxlength="${TOPES.grupo}" placeholder="Ej: Los del martes" autocomplete="off">
                </label>
                <p class="nota"><i class="ti ti-info-circle"></i> Turno ${esc(pesos(t.precio))}. Seña ${esc(pesos(t.sena))}: si cancelás con más de ${CANCELAR_HORAS} h, se devuelve.</p>
                <p class="alias">La seña va al alias ${htmlCopiable("el.potrero.canchas", "Copiar el alias")}</p>
                <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-credit-card"></i> Pagar seña ${esc(pesos(t.sena))} (simulado)</button>
            </form>`;
        const f = lugar.querySelector("form");
        activarCopiables(lugar, "Alias copiado");
        f.grupo.focus({ preventScroll: true });
        lugar.scrollIntoView({ block: "nearest", behavior: "smooth" });
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const turno = datos.reservar(usuario, { canchaId: f.cancha.value, fecha, inicio: elegido.inicio, grupo: f.grupo.value });
                confirmado(turno);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    function confirmado(t) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">¡Turno confirmado!</h1>
                <p><b>${esc(t.cancha)}</b> · ${esc(t.tipo)}</p>
                <p>${esc(nombreFecha(t.fecha))} de ${esc(t.hora)} a ${esc(t.hasta)} · ${esc(t.grupo)}</p>
                ${pastillaSena(t.sena)}
            </div>
            ${guia("u-dueno", `/inicio?fecha=${t.fecha}`, "Mirá cómo lo ve Gustavo")}
            <a class="boton boton--secundario boton--ancho" href="#/turnos"><i class="ti ti-calendar"></i> Mis turnos</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Reservá tu cancha</h1>
            <span class="negocio"><i class="ti ti-building-stadium" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: elegí una hora, poné el nombre del grupo y pagá la seña. Después mirá cómo le llega a Gustavo.</p>
        ${chipsDias(dias, fecha)}
        <div class="chips tipos" role="tablist" aria-label="Tipo de cancha">
            ${Object.entries(TIPOS).map(([id, t]) => `<button class="chip" type="button" role="tab" data-tipo="${id}">${esc(t.texto)}</button>`).join("")}
        </div>
        <div class="horas"></div>
        <div class="confirmar"></div>`;
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => {
        fecha = b.dataset.dia;
        elegido = null;
        pintar();
        pintarConfirmar();
    }));
    cont.querySelectorAll("[data-tipo]").forEach((b) => b.addEventListener("click", () => {
        tipo = b.dataset.tipo;
        elegido = null;
        pintar();
        pintarConfirmar();
    }));
    pintar();
}

export function vistaMisTurnos(cont, { usuario, datos }) {
    const { vienen, anteriores } = datos.misTurnos(usuario);
    const tarjeta = (t, conCancelar) => `
        <li class="tarjeta">
            <div class="tarjeta__fila">
                <span class="tarjeta__titulo"><i class="ti ti-ball-football" aria-hidden="true"></i>${esc(t.cancha)} · ${esc(t.tipo)}</span>
                ${conCancelar ? pastillaSena(t.sena) : pastillaEstado(t.estado)}
            </div>
            <p class="tarjeta__quien"><b>${esc(nombreFecha(t.fecha))}</b> de ${esc(t.hora)} a ${esc(t.hasta)} · ${esc(t.grupo)}</p>
            ${conCancelar ? `
            <div class="tarjeta__pie">
                <small>${datos.seDevuelve(t.id) ? `Si cancelás ahora, la seña se devuelve.` : `Faltan menos de ${CANCELAR_HORAS} h: si cancelás, la seña se pierde.`}</small>
                <button class="boton boton--chico boton--peligro" type="button" data-cancelar="${esc(t.id)}"><i class="ti ti-x"></i> Cancelar</button>
            </div>` : t.sena !== "pagada" ? pastillaSena(t.sena) : ""}
        </li>`;
    cont.innerHTML = `
        <h1 class="titulo">Mis turnos</h1>
        ${vienen.length ? `<ul class="tarjetas">${vienen.map((t) => tarjeta(t, true)).join("")}</ul>` : vacio("No tenés turnos por venir.", "ti-calendar")}
        <a class="boton boton--ancho" href="#/inicio"><i class="ti ti-plus"></i> Reservar otro</a>
        ${anteriores.length ? `
        <details class="bloque anteriores">
            <summary>Anteriores y cancelados (${anteriores.length})</summary>
            <ul class="tarjetas">${anteriores.map((t) => tarjeta(t, false)).join("")}</ul>
        </details>` : ""}`;
    cont.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => {
        const devuelve = datos.seDevuelve(b.dataset.cancelar);
        if (!confirm(devuelve ? "¿Cancelar el turno? La seña se devuelve." : "¿Cancelar el turno? Faltan pocas horas: la seña se pierde.")) return;
        try {
            const t = datos.cancelar(usuario, b.dataset.cancelar);
            aviso(t.sena === "devuelta" ? "Turno cancelado. La seña se devuelve." : "Turno cancelado. La seña se perdió.", t.sena === "devuelta" ? "ok" : "info");
            vistaMisTurnos(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}
