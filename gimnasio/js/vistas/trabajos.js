import { esc, aviso, vacio } from "../../kit/js/ui.js?v=6819a0f377";
import { DIAS, ORDEN_SEMANA, TOPES } from "../datos.js?v=6819a0f377";

const puntos = (t) => `
    <ol class="trabajo__semana" aria-label="Últimos 7 días: ${esc(t.hechos)} de ${esc(t.meta)}">
        ${t.semana.map((d) => `<li class="${d.hecho === true ? "si" : d.hecho === false ? "no" : d.futuro ? "futuro" : ""}${d.esHoy ? " hoy" : ""}" title="${esc(d.dia)}: ${d.hecho === true ? "lo hizo" : d.hecho === false ? "no lo hizo" : "sin marcar"}"><span>${esc(d.dia)}</span></li>`).join("")}
    </ol>`;

export function htmlTrabajosSocio(t) {
    const hoy = t.lista.filter((x) => x.tocaHoy);
    if (!t.lista.length) return "";
    return `
        <section class="bloque trabajos" aria-label="Trabajos de la semana">
            <div class="trabajos__cabeza">
                <h2 class="subtitulo"><i class="ti ti-checklist" aria-hidden="true"></i> Lo que te dejó ${esc(t.lista[0].profe)}</h2>
                <span class="trabajos__cuenta">${esc(t.hechos)} de ${esc(t.meta)} en los últimos 7 días</span>
            </div>
            <ul class="trabajos__lista">
                ${t.lista.map((x) => `
                <li class="trabajo${x.tocaHoy ? "" : " trabajo--listo"}">
                    <div class="trabajo__texto"><b>${esc(x.texto)}</b><small>${esc(x.textoCuando)} · ${esc(x.hechos)} de ${esc(x.meta)}</small></div>
                    ${x.tocaHoy ? `
                    <div class="trabajo__botones" role="group" aria-label="¿Lo hiciste hoy?">
                        <button class="boton boton--chico${x.hoy === true ? "" : " boton--secundario"}" type="button" data-trabajo="${esc(x.id)}" data-hecho="si" aria-pressed="${x.hoy === true}"><i class="ti ti-circle-check" aria-hidden="true"></i> Lo hice</button>
                        <button class="boton boton--chico boton--secundario${x.hoy === false ? " activo" : ""}" type="button" data-trabajo="${esc(x.id)}" data-hecho="no" aria-pressed="${x.hoy === false}"><i class="ti ti-circle-x" aria-hidden="true"></i> No lo hice</button>
                    </div>` : `<p class="trabajo__ok"><i class="ti ti-circle-check" aria-hidden="true"></i> Ya está por esta semana</p>`}
                    ${puntos(x)}
                </li>`).join("")}
            </ul>
            ${hoy.length ? "" : `<p class="nota"><span>Hoy no te toca ninguno. ¡Bien ahí!</span></p>`}
        </section>`;
}

export function activarTrabajosSocio(cont, { usuario, datos, alCambiar }) {
    cont.querySelectorAll("[data-trabajo]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.marcarTrabajo(usuario, b.dataset.trabajo, b.dataset.hecho === "si");
            aviso(b.dataset.hecho === "si" ? "¡Bien! Tu profe lo ve." : "Anotado. Tu profe lo ve.", "ok");
            alCambiar();
        } catch (e) {
            aviso(e, "error");
        }
    }));
}

export function htmlResumenTrabajos(t) {
    if (!t?.lista.length) return "";
    return `
        <section class="bloque trabajos" aria-label="Trabajos de la semana">
            <div class="trabajos__cabeza">
                <h2 class="subtitulo"><i class="ti ti-checklist" aria-hidden="true"></i> Trabajos de la semana</h2>
                <span class="trabajos__cuenta">${esc(t.hechos)} de ${esc(t.meta)}</span>
            </div>
            <ul class="trabajos__lista">
                ${t.lista.map((x) => `<li class="trabajo"><div class="trabajo__texto"><b>${esc(x.texto)}</b><small>${esc(x.textoCuando)} · ${esc(x.hechos)} de ${esc(x.meta)}</small></div>${puntos(x)}</li>`).join("")}
            </ul>
        </section>`;
}

export function htmlTrabajosProfe(a) {
    const t = a.trabajos;
    return `
        <section class="bloque trabajos" aria-label="Trabajos de la semana">
            <div class="trabajos__cabeza">
                <h2 class="subtitulo"><i class="ti ti-checklist" aria-hidden="true"></i> Trabajos de la semana</h2>
                ${t.lista.length ? `<span class="trabajos__cuenta">Cumplió ${esc(t.hechos)} de ${esc(t.meta)}</span>` : ""}
            </div>
            ${t.lista.length ? `
            <ul class="trabajos__lista">
                ${t.lista.map((x) => `
                <li class="trabajo">
                    <div class="trabajo__texto"><b>${esc(x.texto)}</b><small>${esc(x.textoCuando)} · ${esc(x.hechos)} de ${esc(x.meta)}</small></div>
                    <button class="boton-icono" type="button" data-sacar-trabajo="${esc(x.id)}" title="Sacar este trabajo" aria-label="Sacar ${esc(x.texto)}"><i class="ti ti-trash" aria-hidden="true"></i></button>
                    ${puntos(x)}
                </li>`).join("")}
            </ul>` : vacio(`${a.nombre} no tiene trabajos para la semana.`, "ti-checklist")}
            <form class="formulario trabajo-nuevo" novalidate>
                <label>Nuevo trabajo (lo ve en su celu)
                    <input name="texto" maxlength="${TOPES.trabajo}" placeholder="Ej: Caminar 30 minutos" autocomplete="off">
                </label>
                <div class="campos-chicos">
                    <label>Cuándo
                        <select name="cuando">
                            <option value="diario">Todos los días</option>
                            <option value="semana">Veces por semana</option>
                            <option value="dia">Un día de la semana</option>
                        </select>
                    </label>
                    <label data-si="semana" hidden>Veces
                        <select name="veces">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === 3 ? " selected" : ""}>${n}</option>`).join("")}</select>
                    </label>
                    <label data-si="dia" hidden>Día
                        <select name="dia">${ORDEN_SEMANA.map((d) => `<option value="${d}">${esc(DIAS[d])}</option>`).join("")}</select>
                    </label>
                </div>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton" type="submit"><i class="ti ti-plus" aria-hidden="true"></i> Dejar el trabajo</button>
            </form>
        </section>`;
}

export function activarTrabajosProfe(cont, { usuario, datos, socioId, alCambiar }) {
    const f = cont.querySelector(".trabajo-nuevo");
    if (!f) return;
    const mostrar = () => f.querySelectorAll("[data-si]").forEach((l) => (l.hidden = l.dataset.si !== f.cuando.value));
    f.cuando.addEventListener("change", mostrar);
    f.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const error = f.querySelector(".formulario__error");
        try {
            datos.asignarTrabajo(usuario, socioId, { texto: f.texto.value, cuando: f.cuando.value, veces: Number(f.veces.value), dia: Number(f.dia.value) });
            aviso("Listo: ya lo ve en su celu.", "ok");
            alCambiar();
        } catch (e) {
            error.textContent = e.message;
            error.hidden = false;
        }
    });
    cont.querySelectorAll("[data-sacar-trabajo]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.quitarTrabajo(usuario, b.dataset.sacarTrabajo);
            aviso("Trabajo sacado.", "ok");
            alCambiar();
        } catch (e) {
            aviso(e, "error");
        }
    }));
}
