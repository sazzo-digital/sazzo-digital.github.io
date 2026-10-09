// ============================================
// Pantallas del mecánico (Diego): los problemas abiertos (los que tienen que parar y los nuevos primero),
// "Me hago cargo" y "Listo, arreglado" con los repuestos que usó (se descuentan solos).
// ============================================
import { esc, vacio, aviso } from "../../kit/js/ui.js?v=8b20c8d426";
import { TOPES, cantidadCon } from "../datos.js?v=8b20c8d426";
import { haceCuanto, pastillaVehiculo, pastillaUrgencia, pastillaProblema, guia, activarGuias, textoRepuestos } from "./comunes.js?v=8b20c8d426";

export function vistaInicioMecanico(cont, { usuario, datos, irA }) {
    const abiertos = datos.problemasAbiertos();
    const nuevos = abiertos.filter((p) => p.estado === "avisado").length;
    cont.innerHTML = `
        <h1 class="titulo">Hola, ${esc(usuario.nombre)}</h1>
        <p class="resumen-linea">${abiertos.length
            ? `${abiertos.length} ${abiertos.length === 1 ? "problema abierto" : "problemas abiertos"}${nuevos ? ` · <b>${nuevos} ${nuevos === 1 ? "nuevo" : "nuevos"}</b>` : ""}`
            : "Sin problemas abiertos"}</p>
        ${abiertos.length ? `<ul class="tarjetas">${abiertos.map((p) => `
            <li class="tarjeta${p.estado === "avisado" ? " tarjeta--nuevo" : ""}${p.urgencia === "parar" ? " tarjeta--urgente" : ""}">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(p.tipoInfo.icono)}" aria-hidden="true"></i>${esc(p.vehiculo)} · ${esc(p.tipoInfo.texto)}</span>
                    ${p.estado === "avisado" ? `<span class="etiqueta etiqueta--nuevo">Nuevo</span>` : pastillaVehiculo("taller")}
                </div>
                ${p.comentario ? `<p class="tarjeta__texto">“${esc(p.comentario)}”</p>` : ""}
                <p class="tarjeta__quien">Avisó ${esc(p.avisoPor)} · ${esc(haceCuanto(p.avisoEn))}</p>
                <div class="tarjeta__pie">
                    ${pastillaUrgencia(p.urgencia)}
                    ${p.estado === "avisado"
                        ? `<button class="boton boton--chico" type="button" data-tomar="${esc(p.id)}"><i class="ti ti-hand-grab"></i> Me hago cargo</button>`
                        : `<a class="boton boton--chico" href="#/arreglar/${esc(p.id)}"><i class="ti ti-circle-check"></i> Listo, arreglado</a>`}
                </div>
            </li>`).join("")}</ul>` : vacio("No hay problemas abiertos: toda la flota anda.", "ti-circle-check")}`;

    cont.querySelectorAll("[data-tomar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const p = datos.tomarProblema(usuario, b.dataset.tomar);
            aviso(`${p.vehiculo} pasó a "En el taller"`);
            vistaInicioMecanico(cont, { usuario, datos, irA });
        } catch (err) {
            aviso(err.message, "error");
        }
    }));
    activarGuias(cont, irA);
}

/** "Listo, arreglado": qué repuestos usó (con − y +) y una nota opcional. */
export function vistaArreglar(cont, { usuario, datos, irA, params: [id] }) {
    const p = datos.problemasAbiertos().find((x) => x.id === id);
    if (!p) {
        cont.innerHTML = `<a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Volver</a>${vacio("Ese problema ya está arreglado o no existe.", "ti-circle-check")}`;
        return;
    }
    const repuestos = datos.listarRepuestos();
    const usados = Object.fromEntries(repuestos.map((r) => [r.id, 0]));
    const tope = (r) => Math.min(r.cantidad, TOPES.cantidad);

    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Volver</a>
        <h1 class="titulo">Listo, arreglado</h1>
        <div class="tarjeta">
            <span class="tarjeta__titulo"><i class="ti ${esc(p.tipoInfo.icono)}" aria-hidden="true"></i>${esc(p.vehiculo)} · ${esc(p.tipoInfo.texto)}</span>
            ${p.comentario ? `<p class="tarjeta__texto">“${esc(p.comentario)}”</p>` : ""}
        </div>
        <form class="formulario" novalidate>
            <fieldset class="opciones">
                <legend>¿Usaste repuestos?</legend>
                <ul class="usados">${repuestos.map((r) => `
                    <li class="usados__fila${r.cantidad ? "" : " usados__fila--sin"}">
                        <span>${esc(r.nombre)}<small>${r.cantidad ? `Hay ${esc(cantidadCon(r.cantidad, r.unidad))}` : "No hay"}</small></span>
                        <span class="contador-uso">
                            <button class="boton-icono" type="button" data-menos="${esc(r.id)}" aria-label="Uno menos de ${esc(r.nombre)}" disabled><i class="ti ti-minus"></i></button>
                            <b data-cuantos="${esc(r.id)}">0</b>
                            <button class="boton-icono" type="button" data-mas="${esc(r.id)}" aria-label="Uno más de ${esc(r.nombre)}"${tope(r) ? "" : " disabled"}><i class="ti ti-plus"></i></button>
                        </span>
                    </li>`).join("")}
                </ul>
            </fieldset>
            <label>Nota (si querés)
                <textarea name="nota" rows="2" maxlength="${TOPES.nota}" placeholder="Ej: pastillas delanteras nuevas"></textarea>
            </label>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-circle-check"></i> Listo, arreglado</button>
        </form>`;

    const cambiar = (rid, paso) => {
        const r = repuestos.find((x) => x.id === rid);
        usados[rid] = Math.max(0, Math.min(tope(r), usados[rid] + paso));
        cont.querySelector(`[data-cuantos="${rid}"]`).textContent = usados[rid];
        cont.querySelector(`[data-menos="${rid}"]`).disabled = usados[rid] === 0;
        cont.querySelector(`[data-mas="${rid}"]`).disabled = usados[rid] >= tope(r);
    };
    cont.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas, 1)));
    cont.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.menos, -1)));

    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const lista = Object.entries(usados).filter(([, n]) => n > 0).map(([repuestoId, cantidad]) => ({ repuestoId, cantidad }));
        try {
            const hecho = datos.cerrarProblema(usuario, p.id, { repuestos: lista, nota: e.target.nota.value });
            arreglado(cont, hecho, datos, irA);
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

/** Después de arreglar: qué pasó con el vehículo y los repuestos, y el paso siguiente del recorrido (Marta). */
function arreglado(cont, p, datos, irA) {
    const repuestos = datos.listarRepuestos();
    const avisosStock = p.repuestos
        .map((u) => repuestos.find((r) => r.id === u.repuestoId))
        .filter((r) => r && r.estado !== "hay")
        .map((r) => `<li><i class="ti ti-package" aria-hidden="true"></i>${esc(r.nombre)}: ${r.estado === "no-hay" ? "no queda ninguno" : `queda ${esc(cantidadCon(r.cantidad, r.unidad))} (queda poco)`}</li>`);
    cont.innerHTML = `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h1 class="titulo">Arreglado</h1>
            <p>${esc(p.vehiculo)} vuelve a andar.</p>
            ${p.repuestos.length ? `<p class="nota"><i class="ti ti-tool"></i> Usaste: ${esc(textoRepuestos(p.repuestos))}.</p>` : ""}
            ${avisosStock.length ? `<ul class="hecho__avisos">${avisosStock.join("")}</ul>` : ""}
            ${pastillaProblema(p.estado)}
        </div>
        ${guia("u-admin", "/inicio", "Mirá lo que ve Marta")}
        <a class="boton boton--secundario boton--ancho" href="#/inicio"><i class="ti ti-list"></i> Volver a mis problemas</a>`;
    activarGuias(cont, irA);
    window.scrollTo(0, 0);
}
