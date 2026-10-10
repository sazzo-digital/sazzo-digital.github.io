// ============================================
// "Hoy te toca" (Franco, el socio, en el celu): el día de su rutina que le toca hoy, con cada ejercicio, el peso de
// la vez pasada y su mejor marca. Tilda cada serie con el peso y las repeticiones que hizo; entre series corre el
// descanso (con "ding" y vibración al terminar, si prendió el sonido). Si levanta más que nunca: "¡Nuevo récord!".
// Si hoy descansa, le dice cuándo le toca y puede entrenar igual otro día de su rutina.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=9c146b12b6";
import { alSalirDeLaPantalla } from "../../kit/js/rutas.js?v=9c146b12b6";
import { mantenerPantallaPrendida, vibrar, ding, htmlBotonSonido, activarBotonSonido } from "../../kit/js/celular.js?v=9c146b12b6";
import { MARCA, NEGOCIO } from "../marca.js?v=9c146b12b6";
import { SOCIO_DE, kilos, cuanto } from "../datos.js?v=9c146b12b6";
import { guia, activarGuias, pastilla, pastillaCuota } from "./comunes.js?v=9c146b12b6";

// Lo que queda mientras se navega: lo escrito en cada ejercicio, el último récord (para festejarlo una vez) y el descanso
const borrador = {};
let ultimoRecord = null;
let descanso = null; // { hasta, total, siguiente }
let tic = null;

const coma = (n) => String(n).replace(".", ",");
const tiempo = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const descansoTexto = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
const pasoDe = (peso) => (peso >= 20 ? 2.5 : 1);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function htmlEjercicio(e, i, h) {
    const terminado = !!h.entreno?.terminado;
    const b = borrador[e.ejercicioId] ?? {};
    const pesoHoy = e.hechas.at(-1)?.peso ?? e.sugerido;
    const conRecord = ultimoRecord?.ejercicioId === e.ejercicioId;
    const unidad = e.tipo === "tiempo" ? "seg" : "reps";
    return `
        <li class="ejercicio${e.listo ? " ejercicio--listo" : ""}" id="ej-${esc(e.ejercicioId)}">
            <div class="ejercicio__cabeza">
                <span class="ejercicio__num" aria-hidden="true">${e.listo ? `<i class="ti ti-check"></i>` : i + 1}</span>
                <div class="ejercicio__nombre">
                    <b>${esc(e.nombre)}</b>
                    <small>${esc(e.grupo)} · ${esc(e.series)} × ${esc(cuanto(e.tipo, e.reps))} · descanso ${esc(descansoTexto(e.descanso))}</small>
                </div>
            </div>
            ${e.ajustado ? `<p class="ejercicio__ajuste">${pastilla("Ajustado por tu profe", "acento", "ti-pencil")}</p>` : ""}
            ${e.tipo === "peso" && e.ultimo !== null ? `<p class="ejercicio__marcas">La vez pasada <b>${esc(kilos(e.ultimo))}</b> · Tu mejor <b>${esc(kilos(e.mejor))}</b></p>` : ""}
            ${e.hechas.length ? `<ol class="series">${e.hechas.map((s, k) => `
                <li><span>Serie ${k + 1}</span><b>${e.tipo === "peso" ? `${esc(kilos(s.peso))} × ` : ""}${esc(cuanto(e.tipo, s.reps))}${e.tipo === "tiempo" ? "" : " reps"}</b>${e.tipo === "peso" && e.mejor > 0 && s.peso > e.mejor ? pastilla("Récord", "bien", "ti-trophy") : ""}</li>`).join("")}
            </ol>` : ""}
            ${conRecord ? `
            <div class="hecho record">
                <i class="ti ti-trophy" aria-hidden="true"></i>
                <b>¡Nuevo récord!</b>
                <span>${esc(kilos(ultimoRecord.peso))} en ${esc(e.nombre)} (tu mejor era ${esc(kilos(ultimoRecord.antes))})</span>
                ${guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}
            </div>` : ""}
            ${!e.listo && !terminado ? `
            <form class="serie-nueva" data-ej="${esc(e.ejercicioId)}" novalidate>
                <span class="serie-nueva__cual">Serie ${e.hechas.length + 1} de ${esc(e.series)}</span>
                ${e.tipo === "peso" ? `
                <div class="paso">
                    <button class="boton-icono" type="button" data-menos aria-label="Menos peso"><i class="ti ti-minus" aria-hidden="true"></i></button>
                    <label><span class="solo-lector">Peso en kilos</span><input name="peso" inputmode="decimal" maxlength="6" autocomplete="off" value="${esc(coma(b.peso ?? pesoHoy))}"></label>
                    <span class="paso__unidad">kg</span>
                    <button class="boton-icono" type="button" data-mas aria-label="Más peso"><i class="ti ti-plus" aria-hidden="true"></i></button>
                </div>` : ""}
                <div class="serie-nueva__abajo">
                    <label class="reps"><span class="solo-lector">${e.tipo === "tiempo" ? "Segundos" : "Repeticiones"}</span><input name="reps" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(b.reps ?? e.reps)}"><span>${unidad}</span></label>
                    <button class="boton" type="submit"><i class="ti ti-check" aria-hidden="true"></i> Hecha</button>
                </div>
            </form>` : ""}
            ${e.hechas.length && !terminado ? `<button class="boton-link deshacer" type="button" data-deshacer="${esc(e.ejercicioId)}"><i class="ti ti-arrow-back-up" aria-hidden="true"></i> Deshacer la última serie</button>` : ""}
        </li>`;
}

export function vistaHoy(cont, { usuario, datos, irA }) {
    const socioId = SOCIO_DE[usuario.id];
    const h = datos.hoyLeToca(socioId);
    const { socio } = datos.miCuota(usuario);
    const terminado = !!h.entreno?.terminado;
    const anoto = h.ejercicios.some((e) => e.hechas.length);
    mantenerPantallaPrendida(); // el celu queda en el banco entre serie y serie: que no se apague

    const cabeza = `
        <div class="titulo-con-accion">
            <h1 class="titulo">${h.descansa ? "Hoy descansás" : "Hoy te toca"}</h1>
            <span class="negocio"><i class="ti ti-barbell" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <section class="hoy bloque">
            <div class="hoy__arriba">
                <div>
                    <span class="hoy__plan">${esc(h.plan)}</span>
                    <b class="hoy__dia">${h.dia ? `Día ${esc(h.dia.id)} · ${esc(h.dia.nombre)}` : h.proximo ? `Te toca ${esc(h.proximo.nombre)}` : "Sin días fijos"}</b>
                    ${h.proximo && !h.dia ? `<small>Día ${esc(h.proximo.dia.id)} · ${esc(h.proximo.dia.nombre)}</small>` : ""}
                </div>
                ${htmlBotonSonido(MARCA.prefijo).replace("Sonido al cobrar", "Sonido al terminar el descanso")}
            </div>
            <div class="hoy__fila">
                <span class="hoy__semana"><i class="ti ti-flame" aria-hidden="true"></i>${esc(h.semana.hechos)} de ${esc(h.semana.tocan)} esta semana</span>
                <a class="hoy__cuota" href="#/cuota">${pastillaCuota(socio)}</a>
            </div>
            ${h.llego
                ? `<p class="hoy__llego"><i class="ti ti-circle-check" aria-hidden="true"></i> Llegaste a las ${esc(String(Math.floor(h.llego.minuto / 60)).padStart(2, "0"))}:${esc(String(h.llego.minuto % 60).padStart(2, "0"))}</p>`
                : `<button class="boton boton--grande boton--ancho" type="button" data-llegue><i class="ti ti-hand-stop" aria-hidden="true"></i> Llegué</button>`}
        </section>`;

    // Hoy descansa: cuándo le toca y "entrenar igual"
    if (h.descansa) {
        cont.innerHTML = `${cabeza}
            <div class="bloque">
                <h2 class="subtitulo"><i class="ti ti-repeat" aria-hidden="true"></i> ¿Querés entrenar igual?</h2>
                <p class="nota"><span>Elegí qué día de tu rutina hacés hoy.</span></p>
                <div class="chips">${h.dias.map((d) => `<button class="chip" type="button" data-otro="${esc(d.id)}">Día ${esc(d.id)} · ${esc(d.nombre)}</button>`).join("")}</div>
            </div>`;
        activar();
        return;
    }

    const pendientes = h.ejercicios.filter((e) => !e.listo).length;
    cont.innerHTML = `${cabeza}
        ${!anoto && !terminado ? `<p class="nota pista"><i class="ti ti-hand-finger" aria-hidden="true"></i><span>Probá: tocá "Llegué", subile la sentadilla a 60 kg y tocá "Hecha". Es récord.</span></p>` : ""}
        ${terminado ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">¡Día ${esc(h.dia.id)} hecho!</h2>
            <p>${esc(plural(h.ejercicios.filter((e) => e.hechas.length).length, "ejercicio", "ejercicios"))} · ${esc(plural(h.ejercicios.reduce((t, e) => t + e.hechas.length, 0), "serie", "series"))}${h.records ? ` · ${esc(plural(h.records, "récord", "récords"))}` : ""}</p>
            <p class="nota"><span>${esc(h.semana.hechos)} de ${esc(h.semana.tocan)} esta semana. Mauro ya lo ve.</span></p>
        </div>
        ${guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}` : ""}
        <ol class="ejercicios">${h.ejercicios.map((e, i) => htmlEjercicio(e, i, h)).join("")}</ol>
        ${anoto && !terminado ? `
        <button class="boton boton--secundario boton--ancho" type="button" data-terminar><i class="ti ti-circle-check" aria-hidden="true"></i> Terminar el entreno${pendientes ? ` (faltan ${pendientes})` : ""}</button>
        ${ultimoRecord ? "" : guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}` : ""}
        <div class="descanso" role="timer" aria-live="off" hidden></div>`;
    activar();
    pintarDescanso();

    function otraVez() {
        vistaHoy(cont, { usuario, datos, irA });
    }

    function activar() {
        activarGuias(cont, irA);
        activarBotonSonido(cont, MARCA.prefijo);
        cont.querySelector("[data-llegue]")?.addEventListener("click", () => {
            try {
                datos.llegue(usuario);
                aviso(`¡Hola ${usuario.nombre}! Que lo disfrutes`);
                otraVez();
            } catch (err) {
                aviso(err, "error");
            }
        });
        cont.querySelectorAll("[data-otro]").forEach((b) => b.addEventListener("click", () => {
            try {
                datos.entrenarOtroDia(usuario, b.dataset.otro);
                otraVez();
            } catch (err) {
                aviso(err, "error");
            }
        }));
        cont.querySelectorAll(".serie-nueva").forEach((f) => {
            const id = f.dataset.ej;
            const peso = f.querySelector("[name=peso]");
            const reps = f.querySelector("[name=reps]");
            const guardarBorrador = () => (borrador[id] = { peso: peso?.value, reps: reps.value });
            peso?.addEventListener("input", guardarBorrador);
            reps.addEventListener("input", guardarBorrador);
            const mover = (signo) => () => {
                const actual = Number(String(peso.value).replace(",", ".")) || 0;
                const nuevo = Math.max(0, Math.round((actual + signo * pasoDe(actual)) * 100) / 100);
                peso.value = coma(nuevo);
                guardarBorrador();
            };
            f.querySelector("[data-menos]")?.addEventListener("click", mover(-1));
            f.querySelector("[data-mas]")?.addEventListener("click", mover(1));
            f.addEventListener("submit", (ev) => {
                ev.preventDefault();
                try {
                    const r = datos.anotarSerie(usuario, { ejercicioId: id, peso: peso ? peso.value : 0, reps: reps.value });
                    delete borrador[id];
                    ultimoRecord = r.record ? { ejercicioId: id, peso: r.peso, antes: r.antes } : null;
                    vibrar(r.record ? 60 : 25);
                    const despues = datos.hoyLeToca(socioId);
                    const este = despues.ejercicios.find((e) => e.ejercicioId === id);
                    const siguiente = este.listo ? despues.ejercicios.find((e) => !e.listo) : este;
                    // Descanso entre series (no después del último ejercicio)
                    const despuesTexto = siguiente === este ? `serie ${este.hechas.length + 1} de ${este.series}` : siguiente?.nombre;
                    descanso = siguiente ? { hasta: Date.now() + r.descanso * 1000, total: r.descanso, siguiente: despuesTexto } : null;
                    otraVez();
                    if (este.listo && siguiente && !ultimoRecord) cont.querySelector(`#ej-${CSS.escape(siguiente.ejercicioId)}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
                    else if (ultimoRecord) cont.querySelector(".record")?.scrollIntoView({ block: "center", behavior: "smooth" });
                } catch (err) {
                    aviso(err, "error");
                }
            });
        });
        cont.querySelectorAll("[data-deshacer]").forEach((b) => b.addEventListener("click", () => {
            try {
                datos.deshacerSerie(usuario, b.dataset.deshacer);
                ultimoRecord = null;
                descanso = null;
                otraVez();
            } catch (err) {
                aviso(err, "error");
            }
        }));
        cont.querySelector("[data-terminar]")?.addEventListener("click", () => {
            const faltan = datos.hoyLeToca(socioId).ejercicios.filter((e) => !e.listo).length;
            if (faltan && !confirm(`Te ${faltan === 1 ? "falta 1 ejercicio" : `faltan ${faltan} ejercicios`}. ¿Terminar igual?`)) return;
            try {
                datos.terminarEntreno(usuario);
                ultimoRecord = null;
                descanso = null;
                otraVez();
                window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    function pintarDescanso() {
        const caja = cont.querySelector(".descanso");
        if (!caja) return;
        clearInterval(tic);
        if (!descanso) {
            caja.hidden = true;
            return;
        }
        caja.hidden = false;
        caja.innerHTML = `
            <div class="descanso__texto"><i class="ti ti-stopwatch" aria-hidden="true"></i><span>Descanso</span><b class="descanso__reloj"></b></div>
            <small class="descanso__despues">Después: ${esc(descanso.siguiente)}</small>
            <span class="descanso__barra" aria-hidden="true"><span></span></span>
            <button class="boton boton--chico boton--secundario" type="button" data-saltar>Listo</button>`;
        const reloj = caja.querySelector(".descanso__reloj");
        const barra = caja.querySelector(".descanso__barra span");
        caja.querySelector("[data-saltar]").addEventListener("click", () => {
            descanso = null;
            clearInterval(tic);
            caja.hidden = true;
        });
        const mover = () => {
            if (!descanso || !caja.isConnected) {
                clearInterval(tic);
                return;
            }
            const quedan = Math.max(0, Math.ceil((descanso.hasta - Date.now()) / 1000));
            reloj.textContent = tiempo(quedan);
            barra.style.width = `${Math.round((quedan / descanso.total) * 100)}%`;
            if (quedan === 0) {
                clearInterval(tic);
                descanso = null;
                ding(MARCA.prefijo);
                vibrar(200);
                caja.classList.add("descanso--listo");
                reloj.textContent = "¡Dale!";
                setTimeout(() => {
                    if (caja.isConnected && !descanso) caja.hidden = true;
                }, 4000);
            }
        };
        mover();
        tic = setInterval(mover, 250);
    }

    alSalirDeLaPantalla(() => {
        clearInterval(tic);
        descanso = null;
        ultimoRecord = null;
    });
}
