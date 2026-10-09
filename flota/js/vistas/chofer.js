// ============================================
// Pantallas del chofer (Ramón): su inicio y "Avisar un problema".
// Pensado para el celular y una sola mano: botones grandes, pocas palabras, se avisa en 15 segundos.
// ============================================
import { esc, vacio, aviso } from "../../kit/js/ui.js?v=e7f855679d";
import { TIPOS_PROBLEMA, URGENCIAS, TOPES } from "../datos.js?v=e7f855679d";
import { haceCuanto, pastillaVehiculo, pastillaProblema, guia, activarGuias } from "./comunes.js?v=e7f855679d";

export function vistaInicioChofer(cont, { usuario, datos, irA }) {
    const v = datos.vehiculoDe(usuario.id);
    if (!v) {
        cont.innerHTML = `<h1 class="titulo">Hola, ${esc(usuario.nombre)}</h1>${vacio("Hoy no tenés ningún vehículo asignado.", "ti-steering-wheel")}`;
        return;
    }
    const avisos = datos.avisosDe(v.id);
    const esperando = avisos.find((p) => p.estado !== "arreglado");
    cont.innerHTML = `
        <h1 class="titulo">Hola, ${esc(usuario.nombre)}</h1>
        <div class="panel hoy">
            <span class="panel__rotulo">Hoy manejás</span>
            <span class="hoy__vehiculo"><i class="ti ${esc(v.tipoInfo.icono)}" aria-hidden="true"></i>${esc(v.nombre)}</span>
            ${pastillaVehiculo(v.estado)}
        </div>
        <a class="boton boton--ancho boton--grande" href="#/avisar">
            <i class="ti ti-alert-triangle" aria-hidden="true"></i> Avisar un problema
        </a>
        ${esperando ? "" : `<p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: avisá un problema y mirá cómo le llega al mecánico.</p>`}
        ${esperando?.estado === "avisado" ? guia("u-mecanico", "/inicio", "Mirá lo que le llega a Diego") : ""}
        <h2 class="subtitulo"><i class="ti ti-history"></i> Tus últimos avisos</h2>
        ${avisos.length ? `<ul class="tarjetas">${avisos.map((p) => `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(p.tipoInfo.icono)}" aria-hidden="true"></i>${esc(p.tipoInfo.texto)}</span>
                    <small>${esc(haceCuanto(p.avisoEn))}</small>
                </div>
                ${p.comentario ? `<p class="tarjeta__texto">“${esc(p.comentario)}”</p>` : ""}
                ${pastillaProblema(p.estado)}
            </li>`).join("")}</ul>` : vacio("Todavía no avisaste ningún problema.", "ti-mood-smile")}`;
    activarGuias(cont, irA);
}

export function vistaAvisar(cont, { usuario, datos, irA }) {
    const v = datos.vehiculoDe(usuario.id);
    if (!v) {
        cont.innerHTML = vacio("Hoy no tenés ningún vehículo asignado.", "ti-steering-wheel");
        return;
    }
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Volver</a>
        <h1 class="titulo">Avisar un problema</h1>
        <p class="nota"><i class="ti ${esc(v.tipoInfo.icono)}"></i> ${esc(v.nombre)}</p>
        <form class="formulario avisar" novalidate>
            <fieldset class="opciones">
                <legend>¿Qué pasa?</legend>
                <div class="opciones__grilla">
                    ${TIPOS_PROBLEMA.map((t) => `
                    <label class="opcion">
                        <input type="radio" name="tipo" value="${esc(t.id)}">
                        <i class="ti ${esc(t.icono)}" aria-hidden="true"></i><span>${esc(t.texto)}</span>
                    </label>`).join("")}
                </div>
            </fieldset>
            <fieldset class="opciones">
                <legend>¿Podés seguir?</legend>
                <div class="opciones__grilla opciones__grilla--2">
                    ${URGENCIAS.map((u) => `
                    <label class="opcion opcion--${esc(u.id)}">
                        <input type="radio" name="urgencia" value="${esc(u.id)}">
                        <i class="ti ${esc(u.icono)}" aria-hidden="true"></i><span>${esc(u.texto)}</span>
                    </label>`).join("")}
                </div>
            </fieldset>
            <label>Contalo en pocas palabras (si querés)
                <textarea name="comentario" rows="2" maxlength="${TOPES.comentario}" placeholder="Ej: chillan al frenar"></textarea>
                <small class="contador-letras" aria-live="polite">0 / ${TOPES.comentario}</small>
            </label>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-send"></i> Enviar al mecánico</button>
        </form>`;

    const form = cont.querySelector("form");
    const contador = cont.querySelector(".contador-letras");
    form.comentario.addEventListener("input", () => (contador.textContent = `${form.comentario.value.length} / ${TOPES.comentario}`));
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(form);
        try {
            const p = datos.avisarProblema(usuario, { tipo: f.get("tipo"), urgencia: f.get("urgencia"), comentario: f.get("comentario") });
            enviado(cont, p, irA);
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

/** Después de enviar: confirmación y el paso siguiente del recorrido (ver cómo le llega al mecánico). */
function enviado(cont, p, irA) {
    cont.innerHTML = `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h1 class="titulo">Listo, avisado</h1>
            <p>${esc(p.vehiculo)} · ${esc(p.tipoInfo.texto)}${p.urgencia === "parar" ? " · tenés que parar" : ""}</p>
            ${pastillaProblema(p.estado)}
        </div>
        ${guia("u-mecanico", "/inicio", "Mirá lo que le llega a Diego")}
        <a class="boton boton--secundario boton--ancho" href="#/inicio"><i class="ti ti-home"></i> Volver a mi inicio</a>`;
    activarGuias(cont, irA);
    window.scrollTo(0, 0);
}
