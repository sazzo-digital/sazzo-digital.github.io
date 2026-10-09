// ============================================
// Turnos fijos (dueño): los grupos que juegan todas las semanas el mismo día y hora. Se reservan solos; una semana
// se puede liberar (sin borrar el fijo) y volver a reservar. Fijo nuevo: el horario tiene que estar libre.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "kit/ui.js";
import { aHora, franjas, diaSemana, proximosDias } from "kit/turnos.js";
import { CANCHAS, TIPOS, TOPES, DIAS, horarioDe } from "../datos.js";

const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

/** Las horas posibles de una cancha un día de la semana (con la fecha de ese día de los próximos 7). */
function horasDe(canchaId, dia) {
    const cancha = CANCHAS.find((c) => c.id === canchaId);
    const fecha = proximosDias(7).find((d) => diaSemana(d) === dia);
    return franjas(horarioDe(cancha, fecha));
}

export function vistaFijos(cont, { usuario, datos }) {
    const fijos = datos.listarFijos();
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Grilla</a>
        <h1 class="titulo">Turnos fijos</h1>
        <p class="nota"><i class="ti ti-repeat"></i> Se reservan solos todas las semanas. Si un grupo avisa que no viene, liberá esa semana: el fijo sigue.</p>
        ${fijos.length ? `<ul class="tarjetas">${fijos.map((f) => `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ti-repeat" aria-hidden="true"></i>${esc(f.grupo)}</span>
                    <span class="pastilla pastilla--fijo">${esc(f.diaTexto[0].toUpperCase() + f.diaTexto.slice(1))} ${esc(f.hora)}</span>
                </div>
                <p class="tarjeta__quien">${esc(f.cancha)} · ${esc(f.tipo)}${f.faltaron ? ` · <span class="falto">faltaron el ${esc(fechaCorta(f.faltaron).slice(0, 5))}</span>` : ""}</p>
                <ul class="semanas">${f.proximas.map((p) => `
                    <li class="semana${p.liberada ? " semana--liberada" : ""}">
                        <span>${esc(p.nombre[0].toUpperCase() + p.nombre.slice(1))}<small>${p.liberada ? "Liberado: el horario está libre" : "Reservado"}</small></span>
                        ${p.liberada
                            ? `<button class="boton boton--chico boton--secundario" type="button" data-volver="${esc(f.id)}" data-fecha="${esc(p.fecha)}"><i class="ti ti-arrow-back-up"></i> Volver a reservar</button>`
                            : `<button class="boton boton--chico boton--peligro" type="button" data-liberar="${esc(f.id)}" data-fecha="${esc(p.fecha)}"><i class="ti ti-lock-open"></i> Liberar esta semana</button>`}
                    </li>`).join("")}
                </ul>
            </li>`).join("")}</ul>` : vacio("Todavía no hay turnos fijos.", "ti-repeat")}
        <details class="bloque nuevo-fijo">
            <summary><i class="ti ti-plus"></i> Nuevo turno fijo</summary>
            <form class="formulario" novalidate>
                <div class="formulario__fila formulario__fila--3">
                    <label>Cancha<select name="cancha">${CANCHAS.map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)} (${esc(TIPOS[c.tipo].texto)})</option>`).join("")}</select></label>
                    <label>Día<select name="dia">${ORDEN_DIAS.map((d) => `<option value="${d}">${esc(DIAS[d][0].toUpperCase() + DIAS[d].slice(1))}</option>`).join("")}</select></label>
                    <label>Hora<select name="hora"></select></label>
                </div>
                <label>Nombre del grupo<input name="grupo" maxlength="${TOPES.grupo}" placeholder="Ej: Los del martes" autocomplete="off"></label>
                <button class="boton" type="submit"><i class="ti ti-plus"></i> Crear fijo</button>
            </form>
        </details>`;

    const otraVez = () => vistaFijos(cont, { usuario, datos });
    const hacer = (fn, mensaje) => {
        try {
            fn();
            aviso(mensaje);
            otraVez();
        } catch (err) {
            aviso(err.message, "error");
        }
    };
    cont.querySelectorAll("[data-liberar]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.liberarFijo(usuario, b.dataset.liberar, b.dataset.fecha), "Liberado esta semana: el horario quedó libre")));
    cont.querySelectorAll("[data-volver]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.volverFijo(usuario, b.dataset.volver, b.dataset.fecha), "Vuelve a estar reservado")));

    const f = cont.querySelector(".nuevo-fijo form");
    const pintarHoras = () => {
        f.hora.innerHTML = horasDe(f.cancha.value, Number(f.dia.value)).map((m) => `<option value="${m}">${esc(aHora(m))}</option>`).join("");
    };
    f.cancha.addEventListener("change", pintarHoras);
    f.dia.addEventListener("change", pintarHoras);
    pintarHoras();
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        hacer(() => datos.nuevoFijo(usuario, { canchaId: f.cancha.value, dia: Number(f.dia.value), inicio: Number(f.hora.value), grupo: f.grupo.value }), "Turno fijo creado");
    });
}
