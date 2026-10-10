// ============================================
// Alquileres que administra la inmobiliaria (solo Graciela): la lista (primero los que deben y los que aumentan) y
// cada alquiler con su próximo aumento (el porcentaje del índice de ejemplo o el que ella ponga), los aumentos que
// ya tuvo, los pagos de los últimos meses y los avisos armados. No es un contrato ni un recibo.
// ============================================
import { esc, aviso, mensajeDe, fechaCorta } from "../../kit/js/ui.js?v=bc8d90946e";
import { diaLocalDe } from "../../kit/js/fechas.js?v=bc8d90946e";
import { TOPES, INDICE_MENSUAL, AVISO_AUMENTO_DIAS, pesos, porcentajeTexto, diaMes, redondearCien } from "../datos.js?v=bc8d90946e";
import { mostrarMensaje, mayuscula } from "./comunes.js?v=bc8d90946e";

const pastillasDe = (c) => {
    const lista = [];
    if (c.deuda.length) lista.push(`<span class="pastilla pastilla--mal">Debe ${esc(c.deuda.map((d) => d.mes).join(" y "))}</span>`);
    if (c.aumentaPronto) lista.push(`<span class="pastilla pastilla--ojo">Aumenta el ${esc(diaMes(c.aumento.desde))}</span>`);
    if (c.ajusteSinAvisar) lista.push(`<span class="pastilla pastilla--ojo">Avisar aumento</span>`);
    if (c.vencePronto) lista.push(`<span class="pastilla pastilla--ojo">Termina el ${esc(diaMes(c.fin))}</span>`);
    if (!lista.length) lista.push(`<span class="pastilla pastilla--bien">Al día</span>`);
    return lista.join("");
};

export function vistaAlquileres(cont, { usuario, datos }) {
    const lista = datos.listarAlquileres(usuario);
    const total = lista.reduce((t, c) => t + c.montoActual, 0);
    cont.innerHTML = `
        <h1 class="titulo">Alquileres</h1>
        <p class="tira"><span><b>${esc(lista.length)}</b> que administrás</span><span><b>${esc(pesos(total))}</b> por mes entre todos</span></p>
        <ul class="tarjetas">${lista.map((c) => `
            <li class="tarjeta tarjeta--abre${c.deuda.length ? " tarjeta--alerta" : ""}">
                <div class="tarjeta__fila">
                    <a class="tarjeta__titulo" href="#/alquileres/${esc(c.id)}"><i class="ti ti-key" aria-hidden="true"></i>${esc(c.inquilino)}</a>
                    <b class="monto">${esc(pesos(c.montoActual))}</b>
                </div>
                <p class="tarjeta__quien">${esc(c.titulo)} · de ${esc(c.propietario)} · aumenta cada ${esc(c.cadaMeses)} meses</p>
                <div class="pastillas">${pastillasDe(c)}</div>
            </li>`).join("")}</ul>
        <p class="nota"><i class="ti ti-info-circle"></i><span>Es la lista para no olvidarse: no es un contrato ni un recibo. La liquidación al propietario y los recibos van en la versión real.</span></p>`;
}

export function vistaAlquiler(cont, { usuario, datos, params: [id] }) {
    const c = datos.alquiler(usuario, id);
    const recargar = () => vistaAlquiler(cont, { usuario, datos, params: [id] });
    const a = c.aumento;
    const puedeAplicar = a && a.dias <= AVISO_AUMENTO_DIAS;
    const conMensaje = (titulo, texto, alCopiar) => {
        try {
            mostrarMensaje(titulo, texto, { alCopiar });
        } catch (e) {
            aviso(e, "error");
        }
    };

    cont.innerHTML = `
        <a class="volver" href="#/alquileres"><i class="ti ti-arrow-left"></i> Alquileres</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(c.inquilino)}</h1>
            <b class="monto monto--grande">${esc(pesos(c.montoActual))}<small> por mes</small></b>
        </div>
        <div class="pastillas">${pastillasDe(c)}</div>
        <div class="datos-alquiler">
            <div><span>Qué</span><b>${esc(c.titulo)}</b></div>
            <div><span>Propietario</span><b>${esc(c.propietario)}</b></div>
            <div><span>Desde</span><b>${esc(fechaCorta(c.inicio))}</b><small>${esc(c.meses)} meses</small></div>
            <div><span>Hasta</span><b>${esc(fechaCorta(c.fin))}</b><small>${c.diasParaFin > 0 ? `faltan ${esc(c.diasParaFin)} días` : "terminó"}</small></div>
            <div><span>Aumenta</span><b>Cada ${esc(c.cadaMeses)} meses</b><small>Paga hasta el 10</small></div>
        </div>

        <section class="bloque" aria-labelledby="t-aumento">
            <h2 class="subtitulo" id="t-aumento"><i class="ti ti-trending-up"></i> Próximo aumento</h2>
            ${a ? `
            <p class="salto"><span class="monto">${esc(pesos(a.antes))}</span><i class="ti ti-arrow-right" aria-hidden="true"></i><b class="monto" data-nuevo>${esc(pesos(a.despues))}</b><small>desde el ${esc(diaMes(a.desde))} · en ${esc(a.dias)} días</small></p>
            ${puedeAplicar ? `
            <form class="formulario aumento" novalidate>
                <div class="aumento__fila">
                    <label>Porcentaje del período<input name="porcentaje" type="number" inputmode="decimal" step="0.01" min="${TOPES.aumentoMin}" max="${TOPES.aumentoMax}" value="${esc(a.porcentaje)}"></label>
                    <button class="boton" type="submit"><i class="ti ti-send"></i> Aplicar y avisar</button>
                </div>
                <p class="nota"><i class="ti ti-info-circle"></i><span>Viene con el índice de ejemplo (${esc(porcentajeTexto(INDICE_MENSUAL))} por mes, compuesto). La versión real trae el dato oficial; si el contrato dice otra cosa, cambialo.</span></p>
                <p class="formulario__error" role="alert" hidden></p>
            </form>` : `<p class="nota"><i class="ti ti-clock"></i><span>Se aplica desde ${esc(AVISO_AUMENTO_DIAS)} días antes.</span></p>`}` : `<p class="nota"><i class="ti ti-circle-check"></i><span>No tiene más aumentos: termina el ${esc(diaMes(c.fin))}.</span></p>`}
            ${c.ajusteSinAvisar ? `<p class="alerta"><i class="ti ti-bell"></i> El aumento del ${esc(diaMes(c.ajusteSinAvisar.desde))} todavía no se avisó. <button class="boton boton--chico" type="button" data-avisar><i class="ti ti-message-circle"></i> Avisar</button></p>` : ""}
            ${c.ajustes.length ? `
            <h3 class="rotulo-chico">Aumentos que tuvo</h3>
            <ul class="renglones-simples">${c.ajustes.slice().reverse().map((x) => `
                <li><span>Desde el ${esc(fechaCorta(x.desde))}</span><span>+${esc(porcentajeTexto(x.porcentaje))}</span><b class="monto">${esc(pesos(x.monto))}</b></li>`).join("")}</ul>` : ""}
        </section>

        <section class="bloque" aria-labelledby="t-pagos">
            <h2 class="subtitulo" id="t-pagos"><i class="ti ti-cash"></i> Pagos</h2>
            <ul class="renglones-simples">${c.cuotas.map((m) => `
                <li class="pago pago--${esc(m.estado)}">
                    <span>${esc(mayuscula(m.mes))}</span>
                    <b class="monto">${esc(pesos(m.monto))}</b>
                    ${m.pago ? `<span class="pastilla pastilla--bien">Pagó el ${esc(fechaCorta(diaLocalDe(m.pago.fecha)))}</span>`
                        : `<span class="pago__acciones"><span class="pastilla pastilla--${m.estado === "debe" ? "mal" : "suave"}">${m.estado === "debe" ? "Debe" : "Vence el 10"}</span>
                            <button class="boton boton--chico" type="button" data-pago="${esc(m.periodo)}"><i class="ti ti-check"></i> Pagó</button></span>`}
                </li>`).join("")}</ul>
            ${c.deuda.length ? `<button class="boton boton--secundario" type="button" data-deuda><i class="ti ti-message-circle"></i> Recordarle el pago</button>` : ""}
        </section>

        ${c.vencePronto ? `
        <section class="bloque" aria-labelledby="t-fin">
            <h2 class="subtitulo" id="t-fin"><i class="ti ti-clock"></i> Termina en ${esc(c.diasParaFin)} días</h2>
            <button class="boton" type="button" data-fin><i class="ti ti-message-circle"></i> Preguntarle si renueva</button>
        </section>` : ""}
        <p class="nota"><i class="ti ti-info-circle"></i><span>Es la lista para no olvidarse: no es un contrato ni un recibo.</span></p>`;

    const form = cont.querySelector(".aumento");
    if (form) {
        const input = form.elements.porcentaje;
        const nuevo = cont.querySelector("[data-nuevo]");
        input.addEventListener("input", () => {
            const pct = Number(input.value);
            nuevo.textContent = Number.isFinite(pct) && input.value !== "" ? pesos(redondearCien(a.antes * (1 + pct / 100))) : "—";
        });
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const error = form.querySelector(".formulario__error");
            try {
                const hecho = datos.aplicarAumento(usuario, c.id, input.value === "" ? NaN : Number(input.value));
                aviso(`Aumento aplicado: ${pesos(hecho.ajustes.at(-1).monto)} desde el ${diaMes(hecho.ajustes.at(-1).desde)}`);
                recargar();
                conMensaje(`Avisarle a ${c.inquilino.split(" ")[0]}`, datos.mensajeAumento(usuario, c.id), () => {
                    datos.marcarAvisado(usuario, c.id);
                    recargar();
                });
            } catch (err) {
                error.textContent = mensajeDe(err);
                error.hidden = false;
            }
        });
    }
    cont.querySelector("[data-avisar]")?.addEventListener("click", () => conMensaje("Avisar el aumento", datos.mensajeAumento(usuario, c.id), () => {
        datos.marcarAvisado(usuario, c.id);
        recargar();
    }));
    cont.querySelectorAll("[data-pago]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.registrarPago(usuario, c.id, b.dataset.pago);
            aviso("Pago anotado");
            recargar();
        } catch (e) {
            aviso(e, "error");
        }
    }));
    cont.querySelector("[data-deuda]")?.addEventListener("click", () => conMensaje("Recordarle el pago", datos.mensajeDeuda(usuario, c.id)));
    cont.querySelector("[data-fin]")?.addEventListener("click", () => conMensaje("Preguntar si renueva", datos.mensajeFin(usuario, c.id)));
}
