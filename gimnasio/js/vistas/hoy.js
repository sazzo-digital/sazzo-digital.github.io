// ============================================
// "Hoy te toca" (Franco, el socio, en el celu): el día de su rutina que le toca hoy, con cada ejercicio, el peso de
// la vez pasada y su mejor marca. Tilda cada serie con el peso y las repeticiones que hizo; entre series corre el
// descanso (con "ding" y vibración al terminar, si prendió el sonido). Si levanta más que nunca: "¡Nuevo récord!".
// Si hoy descansa, le dice cuándo le toca y puede entrenar igual otro día de su rutina.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=f8ba432cdc";
import { alSalirDeLaPantalla } from "../../kit/js/rutas.js?v=f8ba432cdc";
import { mantenerPantallaPrendida, vibrar, ding, htmlBotonSonido, activarBotonSonido } from "../../kit/js/celular.js?v=f8ba432cdc";
import { MARCA, NEGOCIO } from "../marca.js?v=f8ba432cdc";
import { SOCIO_DE, kilos, cuanto } from "../datos.js?v=f8ba432cdc";
import { activarConsignaPersona, guia, activarGuias, pastilla, pastillaCuota } from "./comunes.js?v=f8ba432cdc";
import { htmlTrabajosSocio, activarTrabajosSocio } from "./trabajos.js?v=f8ba432cdc";

// Lo que queda mientras se navega: lo escrito en cada ejercicio, el último récord (para festejarlo una vez) y el descanso
const borrador = {};
const abiertos = new Map();
let ultimoRecord = null;
let descanso = null; // { hasta, total, siguiente }
let tic = null;

const coma = (n) => String(n).replace(".", ",");
const tiempo = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const descansoTexto = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
const pasoDe = (peso) => (peso >= 20 ? 2.5 : 1);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const RAPIDAS = [6, 8, 10, 12];
const VUELTA = 2 * Math.PI * 25;

function anillo(hechos, tocan, texto, clase = "anillo") {
    const parte = tocan ? Math.min(1, hechos / tocan) : 0;
    return `
        <span class="${clase}" role="img" aria-label="${esc(texto)}">
            <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" class="anillo__fondo"/><circle cx="28" cy="28" r="25" class="anillo__lleno" stroke-dasharray="${VUELTA.toFixed(1)}" stroke-dashoffset="${(VUELTA * (1 - parte)).toFixed(1)}"/></svg>
            <b>${esc(hechos)}/${esc(tocan)}</b>
        </span>`;
}

function htmlReps(e, valor) {
    if (e.tipo === "tiempo") return "";
    const opciones = [...new Set([...RAPIDAS, e.reps])].sort((a, b) => a - b);
    return `<div class="chips reps-rapidas" role="group" aria-label="Repeticiones">${opciones.map((n) => `<button class="chip${String(n) === String(valor) ? " activo" : ""}${n === e.reps ? " chip--rutina" : ""}" type="button" data-reps="${esc(n)}">${esc(n)}</button>`).join("")}</div>`;
}

function htmlEjercicio(e, i, h, actual) {
    const terminado = !!h.entreno?.terminado;
    const b = borrador[e.ejercicioId] ?? {};
    const pesoHoy = e.hechas.at(-1)?.peso ?? e.sugerido;
    const conRecord = ultimoRecord?.ejercicioId === e.ejercicioId;
    const unidad = e.tipo === "tiempo" ? "seg" : "reps";
    const abierto = abiertos.get(e.ejercicioId) ?? (conRecord || e.ejercicioId === actual);
    const reps = b.reps ?? e.reps;
    return `
        <li class="ejercicio${e.listo ? " ejercicio--listo" : ""}${e.ejercicioId === actual ? " ejercicio--actual" : ""}" id="ej-${esc(e.ejercicioId)}">
            <details data-abrir="${esc(e.ejercicioId)}"${abierto ? " open" : ""}>
            <summary class="ejercicio__cabeza">
                <span class="ejercicio__num" aria-hidden="true">${e.listo ? `<i class="ti ti-check"></i>` : i + 1}</span>
                <span class="ejercicio__nombre">
                    <b>${esc(e.nombre)}</b>
                    <small>${esc(e.series)} × ${esc(cuanto(e.tipo, e.reps))}${e.tipo === "peso" ? ` · ${esc(kilos(pesoHoy))}` : ""}</small>
                </span>
                <i class="ti ti-chevron-down ejercicio__flecha" aria-hidden="true"></i>
            </summary>
            <div class="ejercicio__adentro">
            <p class="ejercicio__grupo">${esc(e.grupo)} · descanso ${esc(descansoTexto(e.descanso))}</p>
            ${e.ajustado ? `<p class="ejercicio__ajuste">${pastilla("Ajustado por tu profe", "acento", "ti-pencil")}</p>` : ""}
            ${e.tipo === "peso" && e.ultimo !== null ? `<p class="ejercicio__marcas">La vez pasada <b>${esc(kilos(e.ultimo))}</b> · Tu mejor <b>${esc(kilos(e.mejor))}</b></p>` : ""}
            ${e.hechas.length ? `<ol class="series">${e.hechas.map((s, k) => `
                <li><span>Serie ${k + 1}</span><b>${e.tipo === "peso" ? `${esc(kilos(s.peso))} × ` : ""}${esc(cuanto(e.tipo, s.reps))}${e.tipo === "tiempo" ? "" : " reps"}</b>${e.tipo === "peso" && e.mejor > 0 && s.peso > e.mejor ? pastilla("Récord", "bien", "ti-trophy") : ""}</li>`).join("")}
            </ol>` : ""}
            ${conRecord ? `
            <div class="hecho record">
                <i class="ti ti-trophy" aria-hidden="true"></i>
                <b>¡Nuevo récord!</b>
                <span class="record__chip"><i class="ti ti-trophy" aria-hidden="true"></i> Récord · ${esc(kilos(ultimoRecord.peso))} (antes ${esc(kilos(ultimoRecord.antes))})</span>
                ${guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}
            </div>` : ""}
            ${!e.listo && !terminado ? `
            <form class="serie-nueva" data-ej="${esc(e.ejercicioId)}" novalidate>
                <div class="rayitas" aria-hidden="true">${Array.from({ length: e.series }, (_, k) => `<span${k < e.hechas.length ? ' class="hecha"' : ""}></span>`).join("")}</div>
                <span class="serie-nueva__cual">Serie ${e.hechas.length + 1} de ${esc(e.series)}</span>
                ${e.tipo === "peso" ? `
                <div class="paso">
                    <button class="paso__boton" type="button" data-menos aria-label="Menos peso"><i class="ti ti-minus" aria-hidden="true"></i></button>
                    <label class="paso__kilos"><span class="solo-lector">Peso en kilos</span><input name="peso" inputmode="decimal" maxlength="6" autocomplete="off" value="${esc(coma(b.peso ?? pesoHoy))}"><span>kg</span></label>
                    <button class="paso__boton" type="button" data-mas aria-label="Más peso"><i class="ti ti-plus" aria-hidden="true"></i></button>
                </div>` : ""}
                ${htmlReps(e, reps)}
                <label class="reps"><span>${e.tipo === "tiempo" ? "Segundos" : "Otro"}</span><input name="reps" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(reps)}"><span>${unidad}</span></label>
                <button class="boton boton--ancho serie-nueva__hecha" type="submit"><i class="ti ti-check" aria-hidden="true"></i> Hecha</button>
            </form>` : ""}
            ${e.hechas.length && !terminado ? `<button class="boton-link deshacer" type="button" data-deshacer="${esc(e.ejercicioId)}"><i class="ti ti-arrow-back-up" aria-hidden="true"></i> Deshacer la última serie</button>` : ""}
            </div>
            </details>
        </li>`;
}

export function vistaHoy(cont, { usuario, datos, irA }) {
    const socioId = SOCIO_DE[usuario.id];
    const h = datos.hoyLeToca(socioId);
    const { socio } = datos.miCuota(usuario);
    const trabajos = datos.misTrabajos(usuario);
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
                    ${h.dia
                        ? `<b class="hoy__dia">Día ${esc(h.dia.id)}</b><span class="hoy__nombre">${esc(h.dia.nombre)}</span>`
                        : `<b class="hoy__dia hoy__dia--chico">${h.proximo ? `Te toca ${esc(h.proximo.nombre)}` : "Sin días fijos"}</b>${h.proximo ? `<span class="hoy__nombre">Día ${esc(h.proximo.dia.id)} · ${esc(h.proximo.dia.nombre)}</span>` : ""}`}
                </div>
                ${anillo(h.semana.hechos, h.semana.tocan, `${h.semana.hechos} de ${h.semana.tocan} esta semana`)}
            </div>
            <div class="hoy__fila">
                <a class="hoy__cuota" href="#/cuota">${pastillaCuota(socio)}</a>
                ${htmlBotonSonido(MARCA.prefijo).replace("Sonido al cobrar", "Sonido al terminar el descanso")}
            </div>
            ${h.llego
                ? `<p class="hoy__llego"><i class="ti ti-circle-check" aria-hidden="true"></i> Llegaste a las ${esc(String(Math.floor(h.llego.minuto / 60)).padStart(2, "0"))}:${esc(String(h.llego.minuto % 60).padStart(2, "0"))}</p>`
                : `<button class="boton boton--grande boton--ancho" type="button" data-llegue><i class="ti ti-hand-stop" aria-hidden="true"></i> Llegué</button>`}
            <button class="boton boton--secundario boton--ancho" type="button" data-mi-qr><i class="ti ti-qrcode" aria-hidden="true"></i> Mi QR de entrada</button>
        </section>`;

    // Hoy descansa: cuándo le toca y "entrenar igual"
    if (h.descansa) {
        cont.innerHTML = `${cabeza}
            ${htmlTrabajosSocio(trabajos)}
            <div class="bloque">
                <h2 class="subtitulo"><i class="ti ti-repeat" aria-hidden="true"></i> ¿Querés entrenar igual?</h2>
                <p class="nota"><span>Elegí qué día de tu rutina hacés hoy.</span></p>
                <div class="chips">${h.dias.map((d) => `<button class="chip" type="button" data-otro="${esc(d.id)}">Día ${esc(d.id)} · ${esc(d.nombre)}</button>`).join("")}</div>
            </div>`;
        activar();
        return;
    }

    const pendientes = h.ejercicios.filter((e) => !e.listo).length;
    const actual = h.ejercicios.find((e) => !e.listo)?.ejercicioId;
    cont.innerHTML = `${cabeza}

        ${terminado ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">¡Día ${esc(h.dia.id)} hecho!</h2>
            <p>${esc(plural(h.ejercicios.filter((e) => e.hechas.length).length, "ejercicio", "ejercicios"))} · ${esc(plural(h.ejercicios.reduce((t, e) => t + e.hechas.length, 0), "serie", "series"))}${h.records ? ` · ${esc(plural(h.records, "récord", "récords"))}` : ""}</p>
            <p class="nota"><span>${esc(h.semana.hechos)} de ${esc(h.semana.tocan)} esta semana. Mauro ya lo ve.</span></p>
        </div>
        ${guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}` : ""}
        <ol class="ejercicios">${h.ejercicios.map((e, i) => htmlEjercicio(e, i, h, actual)).join("")}</ol>
        ${anoto && !terminado ? `
        <button class="boton boton--secundario boton--ancho" type="button" data-terminar><i class="ti ti-circle-check" aria-hidden="true"></i> Terminar el entreno${pendientes ? ` (faltan ${pendientes})` : ""}</button>
        ${ultimoRecord ? "" : guia("u-profe", "/inicio", "Mirá cómo lo ve Mauro")}` : ""}
        ${htmlTrabajosSocio(trabajos)}
        <div class="descanso" role="timer" aria-live="off" hidden></div>`;
    activar();
    pintarDescanso();

    function otraVez() {
        vistaHoy(cont, { usuario, datos, irA });
    }

    function activar() {
        activarConsignaPersona(cont, datos, usuario);
        activarGuias(cont, irA);
        activarBotonSonido(cont, MARCA.prefijo);
        activarTrabajosSocio(cont, { usuario, datos, alCambiar: otraVez });
        cont.querySelector("[data-mi-qr]")?.addEventListener("click", () => {
            const capa = document.createElement("div");
            capa.className = "qr-entrada";
            capa.setAttribute("role", "dialog");
            capa.setAttribute("aria-label", "Mi QR de entrada");
            capa.setAttribute("aria-modal", "true");
            const disparador = document.activeElement;
            capa.innerHTML = `
                <div class="qr-entrada__caja">
                    <img src="img/qr/${encodeURIComponent(h.socioId)}.svg" alt="Tu QR de entrada" width="260" height="260">
                    <b>${esc(socio.nombre)}</b>
                    <p class="nota">Mostralo en la recepción: te anota la llegada y ve tu cuota.</p>
                    <button class="boton boton--ancho" type="button" data-cerrar-qr>Listo</button>
                </div>`;
            document.body.append(capa);
            const boton = capa.querySelector("[data-cerrar-qr]");
            boton.focus();
            const teclas = (e) => {
                if (e.key === "Escape") cerrar();
                else if (e.key === "Tab") {
                    e.preventDefault();
                    boton.focus();
                }
            };
            const cerrar = () => {
                capa.remove();
                removeEventListener("hashchange", cerrar);
                removeEventListener("keydown", teclas);
                if (disparador?.isConnected) disparador.focus?.();
            };
            addEventListener("hashchange", cerrar);
            addEventListener("keydown", teclas);
            boton.addEventListener("click", cerrar);
            capa.addEventListener("click", (e) => e.target === capa && cerrar());
        });
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
        cont.querySelectorAll("[data-abrir]").forEach((d) => d.addEventListener("toggle", () => abiertos.set(d.dataset.abrir, d.open)));
        cont.querySelectorAll(".serie-nueva").forEach((f) => {
            const id = f.dataset.ej;
            const peso = f.querySelector("[name=peso]");
            const reps = f.querySelector("[name=reps]");
            const guardarBorrador = () => (borrador[id] = { peso: peso?.value, reps: reps.value });
            const marcarReps = () => f.querySelectorAll("[data-reps]").forEach((c) => c.classList.toggle("activo", c.dataset.reps === reps.value.trim()));
            peso?.addEventListener("input", guardarBorrador);
            reps.addEventListener("input", () => {
                guardarBorrador();
                marcarReps();
            });
            f.querySelectorAll("[data-reps]").forEach((c) => c.addEventListener("click", () => {
                reps.value = c.dataset.reps;
                guardarBorrador();
                marcarReps();
            }));
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
                    if (este.listo) abiertos.delete(id);
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
            <span class="descanso__anillo" aria-hidden="true"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="25" class="anillo__fondo"/><circle cx="28" cy="28" r="25" class="anillo__lleno" stroke-dasharray="${VUELTA.toFixed(1)}"/></svg></span>
            <div class="descanso__lado">
                <span class="descanso__texto"><i class="ti ti-stopwatch" aria-hidden="true"></i> Descanso</span>
                <b class="descanso__reloj"></b>
                <small class="descanso__despues">Después: ${esc(descanso.siguiente)}</small>
            </div>
            <div class="descanso__botones">
                <button class="boton boton--chico boton--secundario" type="button" data-mas30>+30 s</button>
                <button class="boton boton--chico" type="button" data-saltar>Saltar</button>
            </div>`;
        const reloj = caja.querySelector(".descanso__reloj");
        const barra = caja.querySelector(".descanso__anillo .anillo__lleno");
        caja.querySelector("[data-saltar]").addEventListener("click", () => {
            descanso = null;
            clearInterval(tic);
            caja.hidden = true;
        });
        caja.querySelector("[data-mas30]").addEventListener("click", () => {
            if (!descanso) return;
            descanso.hasta += 30000;
            descanso.total += 30;
            mover();
        });
        const mover = () => {
            if (!descanso || !caja.isConnected) {
                clearInterval(tic);
                return;
            }
            const quedan = Math.max(0, Math.ceil((descanso.hasta - Date.now()) / 1000));
            reloj.textContent = tiempo(quedan);
            barra.style.strokeDashoffset = (VUELTA * (1 - quedan / descanso.total)).toFixed(1);
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
        abiertos.clear();
    });
}
