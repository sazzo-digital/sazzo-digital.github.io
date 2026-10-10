// ============================================
// "Este mes" de Graciela (la dueña): lo que tiene que mirar sin hacer cuentas. Los alquileres que aumentan (con el
// monto nuevo calculado y el aviso armado), los que vencen, los que no pagaron, las propiedades que nadie visita y
// las consultas que esperan respuesta. Nada de esto es un contrato ni un recibo: es la lista para no olvidarse.
// ============================================
import { esc, aviso, animarNumeros } from "../../kit/js/ui.js?v=5e0516f6ed";
import { INDICE_MENSUAL, pesos, porcentajeTexto, diaMes } from "../datos.js?v=5e0516f6ed";
import { mostrarMensaje, mayuscula } from "./comunes.js?v=5e0516f6ed";

// "$ 2.805.700" sin cortarse entre el signo y el número
const plata = (n) => pesos(n).replace(" ", String.fromCharCode(160));

export function vistaEsteMes(cont, { usuario, datos }) {
    const t = datos.tablero(usuario);
    const recargar = () => vistaEsteMes(cont, { usuario, datos });
    const seccion = (id, icono, titulo, cuantos, cuerpo) => `
        <section class="bloque mes" aria-labelledby="${id}">
            <h2 class="subtitulo" id="${id}"><i class="ti ${icono}"></i> ${esc(titulo)} <span class="contador">${esc(cuantos)}</span></h2>
            ${cuerpo}
        </section>`;
    const nada = (texto) => `<p class="nota"><i class="ti ti-circle-check"></i><span>${esc(texto)}</span></p>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Este mes <span class="titulo__extra">${esc(t.mes)}</span></h1>
            <a class="boton boton--secundario" href="#/propiedades"><i class="ti ti-building"></i> Propiedades</a>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i><span>Probá: tocá <b>Aplicar y avisar</b> en el alquiler de Martín y copiá el aviso.</span></p>
        <div class="paneles">
            <div class="panel"><span class="panel__rotulo">Cobrado de ${esc(t.mes)}</span><span class="panel__numero panel__numero--plata">${esc(plata(t.cobrado))}</span></div>
            <div class="panel"><span class="panel__rotulo">Falta cobrar</span><span class="panel__numero panel__numero--plata">${esc(plata(t.porCobrar))}</span></div>
            <div class="panel"><span class="panel__rotulo">Aumentan</span><span class="panel__numero" data-contar="${t.aumentos.length}">${esc(t.aumentos.length)}</span></div>
            <div class="panel"><span class="panel__rotulo">Sin contestar</span><span class="panel__numero" data-contar="${t.sinContestar.length}">${esc(t.sinContestar.length)}</span></div>
        </div>

        ${seccion("t-aumentos", "ti-trending-up", "Aumentan pronto", t.aumentos.length, t.aumentos.length ? `
            <ul class="tarjetas">${t.aumentos.map((c) => `
                <li class="tarjeta tarjeta--alerta">
                    <div class="tarjeta__fila">
                        <a class="tarjeta__titulo" href="#/alquileres/${esc(c.id)}"><i class="ti ti-key" aria-hidden="true"></i>${esc(c.inquilino)}</a>
                        <span class="pastilla pastilla--ojo">Desde el ${esc(diaMes(c.aumento.desde))}</span>
                    </div>
                    <p class="tarjeta__quien">${esc(c.titulo)} · cada ${esc(c.cadaMeses)} meses</p>
                    <p class="salto"><span class="monto">${esc(pesos(c.aumento.antes))}</span><i class="ti ti-arrow-right" aria-hidden="true"></i><b class="monto">${esc(pesos(c.aumento.despues))}</b><small>+${esc(porcentajeTexto(c.aumento.porcentaje))}</small></p>
                    <div class="tarjeta__pie"><small>En ${esc(c.aumento.dias)} días</small>
                        <button class="boton boton--chico" type="button" data-aplicar="${esc(c.id)}" data-porcentaje="${esc(c.aumento.porcentaje)}"><i class="ti ti-send"></i> Aplicar y avisar</button></div>
                </li>`).join("")}</ul>
            <p class="nota"><i class="ti ti-info-circle"></i><span>Calculado con un índice de ejemplo (${esc(porcentajeTexto(INDICE_MENSUAL))} por mes). La versión real usa el dato oficial de cada mes. Para otro porcentaje, abrí el alquiler.</span></p>` : nada("Ningún alquiler aumenta en los próximos 45 días."))}

        ${t.sinAvisar.length ? seccion("t-avisar", "ti-bell", "Aumentos sin avisar", t.sinAvisar.length, `
            <ul class="tarjetas">${t.sinAvisar.map((c) => `
                <li class="tarjeta tarjeta--chica">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/alquileres/${esc(c.id)}">${esc(c.inquilino)}</a><b class="monto">${esc(pesos(c.ajusteSinAvisar.monto))}</b></div>
                    <div class="tarjeta__pie"><small>Desde el ${esc(diaMes(c.ajusteSinAvisar.desde))}</small>
                        <button class="boton boton--chico" type="button" data-avisar="${esc(c.id)}"><i class="ti ti-message-circle"></i> Avisar</button></div>
                </li>`).join("")}</ul>`) : ""}

        ${seccion("t-deben", "ti-alert-triangle", "No pagaron", t.deben.length, t.deben.length ? `
            <ul class="tarjetas">${t.deben.map((c) => `
                <li class="tarjeta tarjeta--chica">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/alquileres/${esc(c.id)}"><i class="ti ti-key" aria-hidden="true"></i>${esc(c.inquilino)}</a><span class="pastilla pastilla--mal">Debe ${esc(c.deuda.map((d) => d.mes).join(" y "))}</span></div>
                    <p class="tarjeta__quien">${esc(c.titulo)} · ${esc(pesos(c.deuda.reduce((s, d) => s + d.monto, 0)))} · vencía el ${esc(c.deuda[0].vence)}</p>
                    <div class="tarjeta__pie"><span></span><span class="acciones">
                        <button class="boton boton--chico boton--secundario" type="button" data-deuda="${esc(c.id)}"><i class="ti ti-message-circle"></i> Recordarle</button>
                        <button class="boton boton--chico" type="button" data-pago="${esc(c.id)}" data-periodo="${esc(c.deuda[0].periodo)}"><i class="ti ti-check"></i> Pagó ${esc(c.deuda[0].mes)}</button>
                    </span></div>
                </li>`).join("")}</ul>` : nada("Todos al día."))}

        ${seccion("t-vencen", "ti-clock", "Contratos que terminan", t.vencen.length, t.vencen.length ? `
            <ul class="tarjetas">${t.vencen.map((c) => `
                <li class="tarjeta tarjeta--chica">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/alquileres/${esc(c.id)}"><i class="ti ti-key" aria-hidden="true"></i>${esc(c.inquilino)}</a><span class="pastilla pastilla--ojo">En ${esc(c.diasParaFin)} días</span></div>
                    <p class="tarjeta__quien">${esc(c.titulo)} · termina el ${esc(diaMes(c.fin))}</p>
                    <div class="tarjeta__pie"><small>Propietario: ${esc(c.propietario)}</small>
                        <button class="boton boton--chico" type="button" data-fin="${esc(c.id)}"><i class="ti ti-message-circle"></i> ¿Renueva?</button></div>
                </li>`).join("")}</ul>` : nada("Ninguno termina en los próximos 90 días."))}

        ${seccion("t-sin-visitas", "ti-eye-off", "Propiedades que nadie visita", t.sinVisitas.length, t.sinVisitas.length ? `
            <ul class="tarjetas">${t.sinVisitas.map((p) => `
                <li class="tarjeta tarjeta--chica tarjeta--abre">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/propiedades/${esc(p.id)}"><i class="ti ${esc(p.icono)}" aria-hidden="true"></i>${esc(p.titulo)}</a><span class="pastilla pastilla--ojo">${esc(p.diasSinVisitas)} días</span></div>
                    <p class="tarjeta__quien">${esc(p.precioTexto)} · ${esc(p.zonaNombre)} · ¿bajamos el precio o cambiamos las fotos?</p>
                </li>`).join("")}</ul>` : nada("Todas tuvieron visitas este mes."))}

        ${seccion("t-consultas", "ti-message-2", "Consultas que esperan", t.sinContestar.length + t.sinSeguimiento.length, t.sinContestar.length + t.sinSeguimiento.length ? `
            <ul class="tarjetas">${[...t.sinContestar, ...t.sinSeguimiento].map((c) => `
                <li class="tarjeta tarjeta--chica tarjeta--abre">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/consultas/${esc(c.id)}"><i class="ti ${esc(c.origenIcono)}" aria-hidden="true"></i>${esc(c.nombre)}</a>
                        <span class="pastilla pastilla--ojo">${c.pedida ? "Pidió visita" : c.sinContestar ? "Sin contestar" : `${esc(c.diasSinContacto)} días sin escribirle`}</span></div>
                    <p class="tarjeta__quien">${esc(c.propiedad ?? c.buscaTexto)} · la atiende ${esc(c.agente)}</p>
                </li>`).join("")}</ul>` : nada("Todas las consultas tienen respuesta."))}`;

    animarNumeros(cont);
    const conMensaje = (titulo, texto, alCopiar) => {
        try {
            mostrarMensaje(titulo, texto, { alCopiar });
        } catch (e) {
            aviso(e, "error");
        }
    };
    cont.querySelectorAll("[data-aplicar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const c = datos.aplicarAumento(usuario, b.dataset.aplicar, Number(b.dataset.porcentaje));
            aviso(`Aumento aplicado: ${c.inquilino.split(" ")[0]} paga ${pesos(c.ajustes.at(-1).monto)} desde el ${diaMes(c.ajustes.at(-1).desde)}`);
            recargar();
            conMensaje(`Avisarle a ${c.inquilino.split(" ")[0]}`, datos.mensajeAumento(usuario, c.id), () => {
                datos.marcarAvisado(usuario, c.id);
                recargar();
            });
        } catch (e) {
            aviso(e, "error");
        }
    }));
    cont.querySelectorAll("[data-avisar]").forEach((b) => b.addEventListener("click", () =>
        conMensaje("Avisar el aumento", datos.mensajeAumento(usuario, b.dataset.avisar), () => {
            datos.marcarAvisado(usuario, b.dataset.avisar);
            recargar();
        })));
    cont.querySelectorAll("[data-deuda]").forEach((b) => b.addEventListener("click", () => conMensaje("Recordarle el pago", datos.mensajeDeuda(usuario, b.dataset.deuda))));
    cont.querySelectorAll("[data-fin]").forEach((b) => b.addEventListener("click", () => conMensaje("Preguntar si renueva", datos.mensajeFin(usuario, b.dataset.fin))));
    cont.querySelectorAll("[data-pago]").forEach((b) => b.addEventListener("click", () => {
        try {
            const c = datos.registrarPago(usuario, b.dataset.pago, b.dataset.periodo);
            aviso(`Anotado: ${c.inquilino.split(" ")[0]} pagó ${mayuscula(b.dataset.periodo ? c.cuotas.find((m) => m.periodo === b.dataset.periodo)?.mes ?? "" : "")}`);
            recargar();
        } catch (e) {
            aviso(e, "error");
        }
    }));
}
