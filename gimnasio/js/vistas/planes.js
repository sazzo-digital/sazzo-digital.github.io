// ============================================
// Rutinas (Mauro, el profe): los planes pre armados ("Fuerza 3 días", "Principiante 3 días"…), cuántos socios usa
// cada uno, y el editor: días (sumar, sacar, nombrar), ejercicios de cada día (sumar de la lista, cambiar series,
// repeticiones, descanso y peso de arranque, sacar), copiar una rutina y asignarla a un alumno.
// Cambiar una rutina cambia la de todos los que la usan; para uno solo está "Ajustar" en su ficha.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=665396befd";
import { EJERCICIOS, TOPES, kilos, cuanto } from "../datos.js?v=665396befd";
import { pastilla } from "./comunes.js?v=665396befd";

let editando = null; // "nombre", "dia|A" o "ej|A|banca": lo que está abierto para cambiar

export function vistaPlanes(cont, { datos }) {
    const planes = datos.listarPlanes();
    cont.innerHTML = `
        <h1 class="titulo">Rutinas</h1>
        <p class="nota pista"><i class="ti ti-info-circle" aria-hidden="true"></i><span>Rutinas armadas para asignar. Copiá una y cambiala a gusto. Son de ejemplo.</span></p>
        <ul class="tarjetas">${planes.map((p) => `
            <li class="tarjeta tarjeta--abre">
                <div class="tarjeta__fila">
                    <a class="tarjeta__titulo" href="#/planes/${esc(p.id)}"><i class="ti ti-list-details" aria-hidden="true"></i>${esc(p.nombre)}</a>
                    ${p.propio ? pastilla("Armada por vos", "acento") : pastilla(p.nivel ?? "Todos", "suave")}
                </div>
                <p class="tarjeta__quien">${esc(p.dias.length)} ${p.dias.length === 1 ? "día" : "días"}: ${esc(p.dias.map((d) => d.nombre).join(" · "))}</p>
                <p class="tarjeta__quien"><b>${esc(p.socios)}</b> ${p.socios === 1 ? "socio la usa" : "socios la usan"}</p>
            </li>`).join("")}
        </ul>`;
}

const GRUPOS = [...new Set(EJERCICIOS.map((e) => e.grupo))];

export function vistaPlan(cont, opciones) {
    const { usuario, datos, params: [id] } = opciones;
    const p = datos.verPlan(id);
    const otraVez = () => vistaPlan(cont, opciones);
    const hacer = (fn, mensaje) => {
        try {
            fn();
            if (mensaje) aviso(mensaje);
            otraVez();
            return true;
        } catch (err) {
            aviso(err, "error");
            return false;
        }
    };
    // Guarda y cierra lo que estaba abierto; si hay un error, queda abierto con lo escrito
    const guardarCerrando = (fn, mensaje) => {
        const antes = editando;
        editando = null;
        if (!hacer(fn, mensaje)) editando = antes;
    };

    const htmlEjercicio = (d, it) => {
        const e = EJERCICIOS.find((x) => x.id === it.ejercicioId);
        const clave = `ej|${d.id}|${it.ejercicioId}`;
        return `
            <li class="renglon">
                <div class="renglon__fila">
                    <span><b>${esc(e.nombre)}</b><br><small>${esc(it.series)} × ${esc(cuanto(e.tipo, it.reps))}${e.tipo === "peso" ? ` · arranca con ${esc(kilos(it.peso))}` : ""} · descanso ${esc(it.descanso)} s</small></span>
                    <button class="boton boton--chico boton--secundario" type="button" data-editar="${esc(clave)}" aria-expanded="${editando === clave}">Cambiar</button>
                </div>
                ${editando === clave ? `
                <form class="cambio-ej" data-dia="${esc(d.id)}" data-ej="${esc(it.ejercicioId)}" novalidate>
                    <div class="campos-chicos">
                        <label>Series<input name="series" inputmode="numeric" maxlength="2" value="${esc(it.series)}"></label>
                        <label>${e.tipo === "tiempo" ? "Segundos" : "Repeticiones"}<input name="reps" inputmode="numeric" maxlength="4" value="${esc(it.reps)}"></label>
                        <label>Descanso (s)<input name="descanso" inputmode="numeric" maxlength="3" value="${esc(it.descanso)}"></label>
                        ${e.tipo === "peso" ? `<label>Peso (kg)<input name="peso" inputmode="decimal" maxlength="6" value="${esc(String(it.peso).replace(".", ","))}"></label>` : ""}
                    </div>
                    <div class="acciones">
                        <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy" aria-hidden="true"></i> Guardar</button>
                        <button class="boton boton--chico boton--peligro" type="button" data-sacar>Sacar del día</button>
                        <button class="boton-link" type="button" data-cerrar>Cancelar</button>
                    </div>
                </form>` : ""}
            </li>`;
    };

    const htmlDia = (d) => {
        const clave = `dia|${d.id}`;
        const quedan = EJERCICIOS.filter((e) => !d.ejercicios.some((x) => x.ejercicioId === e.id));
        return `
            <section class="dia-plan bloque">
                <div class="dia-plan__cabeza">
                    <h2 class="subtitulo">Día ${esc(d.id)} · ${esc(d.nombre)}</h2>
                    <span class="acciones">
                        <button class="boton boton--chico boton--secundario" type="button" data-editar="${esc(clave)}" aria-expanded="${editando === clave}">Nombre</button>
                        ${p.dias.length > 1 ? `<button class="boton boton--chico boton--peligro" type="button" data-quitar-dia="${esc(d.id)}">Sacar día</button>` : ""}
                    </span>
                </div>
                ${editando === clave ? `
                <form class="formulario nombre-dia" data-dia="${esc(d.id)}" novalidate>
                    <label>Qué se trabaja
                        <input name="nombre" maxlength="${TOPES.nombre}" value="${esc(d.nombre)}" placeholder="Ej: Piernas y core">
                    </label>
                    <div class="acciones">
                        <button class="boton boton--chico" type="submit">Guardar</button>
                        <button class="boton-link" type="button" data-cerrar>Cancelar</button>
                    </div>
                </form>` : ""}
                ${d.ejercicios.length ? `<ul class="renglones">${d.ejercicios.map((it) => htmlEjercicio(d, it)).join("")}</ul>` : vacio("Todavía no tiene ejercicios.", "ti-list")}
                ${d.ejercicios.length < TOPES.ejerciciosPorDia ? `
                <form class="sumar-ej" data-dia="${esc(d.id)}">
                    <label><span class="solo-lector">Ejercicio para sumar al día ${esc(d.id)}</span>
                        <select name="ej">
                            <option value="">Sumar un ejercicio…</option>
                            ${GRUPOS.map((g) => `<optgroup label="${esc(g)}">${quedan.filter((e) => e.grupo === g).map((e) => `<option value="${esc(e.id)}">${esc(e.nombre)}</option>`).join("")}</optgroup>`).join("")}
                        </select>
                    </label>
                    <button class="boton boton--chico" type="submit"><i class="ti ti-plus" aria-hidden="true"></i> Sumar</button>
                </form>` : ""}
            </section>`;
    };

    const alumnos = datos.listarAlumnos(usuario).filter((a) => a.planId !== p.id);
    cont.innerHTML = `
        <a class="volver" href="#/planes"><i class="ti ti-arrow-left" aria-hidden="true"></i> Rutinas</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(p.nombre)}</h1>
            <span class="acciones">
                <button class="boton boton--chico boton--secundario" type="button" data-editar="nombre" aria-expanded="${editando === "nombre"}"><i class="ti ti-pencil" aria-hidden="true"></i> Nombre</button>
                <button class="boton boton--chico" type="button" data-copiar><i class="ti ti-copy" aria-hidden="true"></i> Copiar</button>
            </span>
        </div>
        ${editando === "nombre" ? `
        <form class="formulario bloque nombre-plan" novalidate>
            <label>Nombre de la rutina
                <input name="nombre" maxlength="${TOPES.nombre}" value="${esc(p.nombre)}">
            </label>
            <div class="acciones">
                <button class="boton boton--chico" type="submit">Guardar</button>
                <button class="boton-link" type="button" data-cerrar>Cancelar</button>
            </div>
        </form>` : ""}
        <p class="nota"><i class="ti ti-users" aria-hidden="true"></i><span>${p.socios ? `La usan <b>${esc(p.socios)}</b> ${p.socios === 1 ? "socio" : "socios"}: si la cambiás, cambia para todos. Para uno solo, usá "Ajustar" en su ficha.` : "Todavía no la usa nadie."}</span></p>
        ${p.dias.map(htmlDia).join("")}
        ${p.dias.length < TOPES.diasPlan ? `<button class="boton boton--secundario boton--ancho" type="button" data-sumar-dia><i class="ti ti-plus" aria-hidden="true"></i> Sumar un día</button>` : ""}
        <form class="bloque formulario asignar" novalidate>
            <h2 class="subtitulo"><i class="ti ti-user-plus" aria-hidden="true"></i> Asignarla a un alumno</h2>
            <label><span class="solo-lector">Alumno</span>
                <select name="socio">
                    <option value="">Elegí un alumno…</option>
                    ${alumnos.map((a) => `<option value="${esc(a.id)}">${esc(a.nombreCompleto)} · hoy con ${esc(a.plan)}</option>`).join("")}
                </select>
            </label>
            <button class="boton" type="submit"><i class="ti ti-check" aria-hidden="true"></i> Asignar</button>
        </form>`;

    cont.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => {
        editando = editando === b.dataset.editar ? null : b.dataset.editar;
        otraVez();
        cont.querySelector("form:not(.sumar-ej):not(.asignar) input")?.focus();
    }));
    cont.querySelectorAll("[data-cerrar]").forEach((b) => b.addEventListener("click", () => {
        editando = null;
        otraVez();
    }));
    cont.querySelector("[data-copiar]").addEventListener("click", () => {
        try {
            const copia = datos.copiarPlan(usuario, p.id);
            aviso(`Listo: "${copia.nombre}". Cambiala a gusto.`);
            editando = "nombre";
            location.hash = `#/planes/${copia.id}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector(".nombre-plan")?.addEventListener("submit", (e) => {
        e.preventDefault();
        guardarCerrando(() => datos.renombrarPlan(usuario, p.id, e.target.nombre.value), "Nombre guardado");
    });
    cont.querySelectorAll(".nombre-dia").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        guardarCerrando(() => datos.renombrarDia(usuario, p.id, f.dataset.dia, f.nombre.value), "Día guardado");
    }));
    cont.querySelectorAll(".cambio-ej").forEach((f) => {
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const valores = { series: f.series.value, reps: f.reps.value, descanso: f.descanso.value, peso: f.peso?.value ?? 0 };
            guardarCerrando(() => datos.cambiarEjercicio(usuario, p.id, f.dataset.dia, f.dataset.ej, valores), "Ejercicio guardado");
        });
        f.querySelector("[data-sacar]").addEventListener("click", () => {
            editando = null;
            hacer(() => datos.quitarEjercicio(usuario, p.id, f.dataset.dia, f.dataset.ej), "Ejercicio sacado del día");
        });
    });
    cont.querySelectorAll(".sumar-ej").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!f.ej.value) {
            aviso("Elegí qué ejercicio sumar.", "error");
            return;
        }
        hacer(() => datos.agregarEjercicio(usuario, p.id, f.dataset.dia, f.ej.value), "Ejercicio sumado");
    }));
    cont.querySelectorAll("[data-quitar-dia]").forEach((b) => b.addEventListener("click", () => {
        if (confirm(`¿Sacar el día ${b.dataset.quitarDia} de la rutina?${p.socios ? " Cambia para todos los que la usan." : ""}`)) hacer(() => datos.quitarDia(usuario, p.id, b.dataset.quitarDia), "Día sacado");
    }));
    cont.querySelector("[data-sumar-dia]")?.addEventListener("click", () => hacer(() => datos.agregarDia(usuario, p.id), "Día sumado: ponele nombre y ejercicios"));
    cont.querySelector(".asignar").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!e.target.socio.value) {
            aviso("Elegí a qué alumno.", "error");
            return;
        }
        const nombre = e.target.socio.selectedOptions[0].textContent.split(" · ")[0];
        hacer(() => datos.asignarPlan(usuario, e.target.socio.value, p.id), `${nombre} ya tiene "${p.nombre}"`);
    });
}
