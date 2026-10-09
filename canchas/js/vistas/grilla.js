// ============================================
// Pantallas del dueño (Gustavo): la grilla del día (canchas en columnas, horas de media en media; se luce en la
// compu y en el celu se desliza de costado), el detalle de un turno (llegaron, faltaron, cobrar seña, liberar) y
// "Anotar turno" en un casillero libre (para cuando llaman por teléfono).
// Los turnos que reservó un jugador y Gustavo todavía no miró aparecen arriba y marcados "Nuevo".
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=bcbc78c5d8";
import { aHora } from "../../kit/js/turnos.js?v=bcbc78c5d8";
import { TOPES, CANCHAS, TIPOS, pesos, nombreFecha, horarioDe } from "../datos.js?v=bcbc78c5d8";
import { pastillaSena, pastillaEstado, chipsDias } from "./comunes.js?v=bcbc78c5d8";
import { buscarPersona } from "../marca.js?v=bcbc78c5d8";

const PASO = 30; // la grilla va de media hora en media hora (entran los turnos de 60 y los de 90 min)

/** La clase de color de un turno en la grilla. */
function claseTurno(t) {
    if (t.estado === "faltaron") return "faltaron";
    if (t.estado === "llegaron") return "llegaron";
    if (t.esFijo) return "fijo";
    if (t.sena === "pendiente") return "pendiente";
    return "reservado";
}

export function vistaGrilla(cont, { usuario, datos, consulta }) {
    const dias = datos.dias();
    const fecha = dias.some((d) => d.fecha === consulta.get("fecha")) ? consulta.get("fecha") : dias[0].fecha;
    const g = datos.grilla(fecha);
    const nuevos = datos.nuevos();
    const filas = (g.hasta - g.desde) / PASO;
    const fila = (minuto) => (minuto - g.desde) / PASO + 2; // la fila 1 son los nombres de las canchas

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Grilla</h1>
            <a class="boton boton--chico boton--secundario" href="#/fijos"><i class="ti ti-repeat"></i> Turnos fijos</a>
        </div>
        ${nuevos.length ? `<ul class="nuevos">${nuevos.map((t) => `
            <li><a class="nuevo" href="#/turno/${esc(t.id)}">
                <i class="ti ti-bell-ringing" aria-hidden="true"></i>
                <span><b>${esc(buscarPersona(t.jugadorId)?.nombre ?? "Un jugador")} reservó ${esc(t.cancha)} · ${esc(nombreFecha(t.fecha))} ${esc(t.hora)}</b><small>${esc(t.grupo)} · ${esc(t.tipo)} · seña pagada</small></span>
                <span class="etiqueta etiqueta--nuevo">Nuevo</span>
            </a></li>`).join("")}</ul>` : ""}
        ${chipsDias(dias, fecha)}
        <div class="numeros-grilla">
            <div><span>Ocupados</span><b>${esc(g.resumen.ocupados)}<small> de ${esc(g.resumen.total)}</small></b></div>
            <div><span>Señas cobradas</span><b>${esc(pesos(g.resumen.senas))}</b></div>
            <div><span>A cobrar en la cancha</span><b>${esc(pesos(g.resumen.aCobrar))}</b></div>
            <div><span>Señas pendientes</span><b>${esc(g.resumen.pendientes)}</b></div>
        </div>
        <div class="grilla-scroll" tabindex="0" aria-label="Grilla de ${esc(g.nombre)}">
            <div class="grilla" style="--filas:${filas};--canchas:${g.columnas.length}">
                <span class="grilla__esquina"></span>
                ${g.columnas.map((c, i) => `<span class="grilla__cancha" style="grid-column:${i + 2}">${esc(c.nombre)}<small>${esc(c.tipoInfo.texto)}</small></span>`).join("")}
                ${Array.from({ length: filas }, (_, i) => g.desde + i * PASO).map((m) => `<span class="grilla__hora${m % 60 ? " grilla__hora--media" : ""}" style="grid-row:${fila(m)}">${m % 60 ? "" : esc(aHora(m))}</span>`).join("")}
                ${g.columnas.map((c, i) => c.turnos.map((t) => `
                    <a class="turno turno--${claseTurno(t)}${t.nuevo ? " turno--nuevo" : ""}" href="#/turno/${esc(t.id)}" style="grid-column:${i + 2};grid-row:${fila(t.inicio)} / span ${t.duracion / PASO}">
                        <b>${esc(t.grupo)}</b>
                        <small>${esc(t.hora)}${t.esFijo ? " · fijo" : ""}${t.nuevo ? " · nuevo" : ""}</small>
                    </a>`).join("") + c.libres.map((m) => `
                    <a class="libre" href="#/anotar?cancha=${esc(c.id)}&fecha=${esc(fecha)}&inicio=${m}" style="grid-column:${i + 2};grid-row:${fila(m)} / span ${c.horario.duracion / PASO}" aria-label="Anotar turno en ${esc(c.nombre)} a las ${esc(aHora(m))}">
                        <i class="ti ti-plus" aria-hidden="true"></i>${esc(aHora(m))}
                    </a>`).join("")).join("")}
            </div>
        </div>
        <ul class="leyenda">
            <li><span class="muestra turno--reservado"></span>Reservado (seña pagada)</li>
            <li><span class="muestra turno--pendiente"></span>Seña a cobrar</li>
            <li><span class="muestra turno--fijo"></span>Fijo</li>
            <li><span class="muestra turno--llegaron"></span>Llegaron</li>
            <li><span class="muestra turno--faltaron"></span>Faltaron</li>
            <li><span class="muestra libre"></span>Libre: tocá para anotar</li>
        </ul>`;

    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => (location.hash = `#/inicio?fecha=${b.dataset.dia}`)));
    // Que el primer turno nuevo (o la hora de ahora) quede a la vista en la grilla
    cont.querySelector(".turno--nuevo")?.scrollIntoView({ block: "nearest", inline: "center" });
}

export function vistaTurno(cont, { usuario, datos, params: [id] }) {
    let t = datos.turno(id);
    if (t.nuevo) t = datos.marcarVisto(usuario, id);
    const volver = `#/inicio?fecha=${t.fecha}`;
    const activo = !t.anulado && (t.estado === "reservado" || t.estado === "llegaron" || t.estado === "faltaron");
    cont.innerHTML = `
        <a class="volver" href="${esc(volver)}"><i class="ti ti-arrow-left"></i> Grilla de ${esc(nombreFecha(t.fecha))}</a>
        <h1 class="titulo">${esc(t.grupo)}</h1>
        <div class="bloque detalle-turno">
            <p class="detalle-turno__cuando"><i class="ti ti-clock" aria-hidden="true"></i> ${esc(nombreFecha(t.fecha))} de ${esc(t.hora)} a ${esc(t.hasta)}</p>
            <p><i class="ti ti-map-pin" aria-hidden="true"></i> ${esc(t.cancha)} · ${esc(t.tipo)}</p>
            <p><i class="ti ti-${t.esFijo ? "repeat" : t.origen === "app" ? "device-mobile" : "phone"}" aria-hidden="true"></i> ${t.esFijo ? "Turno fijo, todas las semanas" : t.origen === "app" ? "Lo reservó un jugador desde el celular" : "Anotado en la grilla (por teléfono)"}</p>
            <p><i class="ti ti-cash" aria-hidden="true"></i> Turno ${esc(pesos(t.precio))}${t.montoSena ? ` · seña ${esc(pesos(t.montoSena))}` : ""}</p>
            <div class="detalle-turno__pastillas">${pastillaEstado(t.estado)} ${pastillaSena(t.sena)}</div>
        </div>
        ${activo ? `
        <div class="acciones-turno">
            <button class="boton" type="button" data-marcar="llegaron"><i class="ti ti-check"></i> Llegaron</button>
            <button class="boton boton--secundario" type="button" data-marcar="faltaron"><i class="ti ti-user-x"></i> Faltaron</button>
            ${t.sena === "pendiente" ? `<button class="boton boton--secundario" type="button" data-cobrar><i class="ti ti-cash"></i> Cobrar seña</button>` : ""}
            <button class="boton boton--peligro" type="button" data-liberar><i class="ti ti-lock-open"></i> ${t.esFijo ? "Liberar esta semana" : "Liberar"}</button>
        </div>` : `<p class="nota"><i class="ti ti-info-circle"></i> Este turno ya no ocupa la cancha.</p>`}`;

    const hacer = (fn, mensaje) => {
        try {
            fn();
            aviso(mensaje);
            location.hash = volver;
        } catch (err) {
            aviso(err.message, "error");
        }
    };
    cont.querySelectorAll("[data-marcar]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.marcar(usuario, id, b.dataset.marcar), b.dataset.marcar === "llegaron" ? "Marcado: llegaron" : "Marcado: faltaron")));
    cont.querySelector("[data-cobrar]")?.addEventListener("click", () => hacer(() => datos.cobrarSena(usuario, id), "Seña cobrada"));
    cont.querySelector("[data-liberar]")?.addEventListener("click", () => {
        if (!confirm(t.esFijo ? "¿Liberar el fijo solo esta semana? El horario queda libre para otros." : "¿Liberar el turno? El horario queda libre y la seña pagada se devuelve.")) return;
        hacer(() => datos.liberar(usuario, id), "Turno liberado");
    });
}

/** Anotar un turno en un casillero libre (para cuando llaman por teléfono): la seña queda a cobrar. */
export function vistaAnotar(cont, { usuario, datos, consulta }) {
    const cancha = CANCHAS.find((c) => c.id === consulta.get("cancha"));
    const fecha = consulta.get("fecha");
    const inicio = Number(consulta.get("inicio"));
    if (!cancha || !datos.dias().some((d) => d.fecha === fecha) || !Number.isInteger(inicio)) {
        cont.innerHTML = `<a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Grilla</a>${vacio("Ese casillero no existe.", "ti-calendar-off")}`;
        return;
    }
    const tipo = TIPOS[cancha.tipo];
    const fin = inicio + horarioDe(cancha, fecha).duracion;
    cont.innerHTML = `
        <a class="volver" href="#/inicio?fecha=${esc(fecha)}"><i class="ti ti-arrow-left"></i> Grilla de ${esc(nombreFecha(fecha))}</a>
        <h1 class="titulo">Anotar turno</h1>
        <form class="formulario bloque" novalidate>
            <p class="detalle-turno__cuando"><i class="ti ti-clock"></i> ${esc(cancha.nombre)} · ${esc(tipo.texto)} · ${esc(nombreFecha(fecha))} de ${esc(aHora(inicio))} a ${esc(aHora(fin))}</p>
            <label>Nombre del grupo
                <input name="grupo" maxlength="${TOPES.grupo}" placeholder="Ej: Los de la oficina" autocomplete="off">
            </label>
            <p class="nota"><i class="ti ti-phone"></i> Para cuando llaman por teléfono: la seña de ${esc(pesos(tipo.sena))} queda a cobrar.</p>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-plus"></i> Anotar</button>
        </form>`;
    const f = cont.querySelector("form");
    f.grupo.focus();
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.anotar(usuario, { canchaId: cancha.id, fecha, inicio, grupo: f.grupo.value });
            aviso("Turno anotado");
            location.hash = `#/inicio?fecha=${fecha}`;
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}
