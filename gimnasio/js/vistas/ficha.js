// ============================================
// La ficha de un socio: una sola pantalla que cambia según quién la mira.
// - Mauro (profe): el seguimiento. Su rutina día por día (con el peso que le toca), "Ajustar" un ejercicio solo para
//   él, cambiarle la rutina, la rutina en PDF, cómo viene (gráficos) y las notas.
// - Vane (dueña): la cuota y los pagos (registrar, confirmar el aviso de transferencia, deshacer, recordatorio armado),
//   el apto físico y el reglamento firmado en pantalla, si viene o no (invitar a volver) y la baja.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=9c146b12b6";
import { pedirFirma } from "../../kit/js/firma.js?v=9c146b12b6";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=9c146b12b6";
import { NEGOCIO } from "../marca.js?v=9c146b12b6";
import { TOPES, REINVITAR_DIAS, pesos, kilos, cuanto, fechaCorta, nombreFecha } from "../datos.js?v=9c146b12b6";
import { guia, activarGuias, pastilla, pastillaCuota, cara, haceDias, graficoPeso, barrasSemanas, mostrarMensaje } from "./comunes.js?v=9c146b12b6";

let ajustando = null; // "diaId|ejercicioId" del ejercicio que el profe está ajustando
let medio = "efectivo"; // lo último elegido al registrar un pago

export function vistaFicha(cont, opciones) {
    const { usuario, datos, params: [id] } = opciones;
    const a = datos.socio(id);
    const esProfe = usuario.rol === "profe";
    const hoy = datos.hoy();

    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left" aria-hidden="true"></i> ${esProfe ? "Hoy en el gimnasio" : "Socios"}</a>
        <div class="titulo-con-accion">
            <div class="socio-fila">${cara(a)}<h1 class="titulo">${esc(a.nombreCompleto)}</h1></div>
            ${pastillaCuota(a)}
        </div>
        <p class="nota"><i class="ti ti-user" aria-hidden="true"></i><span>${a.objetivo ? `${esc(a.objetivo)} · ` : ""}${esc(a.diasTexto)} a las ${esc(a.hora)} · ${a.plan ? `${esc(a.plan)} con ${esc(a.profe)}` : `Clases con ${esc(a.profe)}`}${a.baja ? ` · <b>dado de baja el ${esc(fechaCorta(a.baja))}</b>` : ""}</span></p>
        <div class="datos">
            <div><span>Última vez</span><b>${a.ultima ? esc(nombreFecha(a.ultima, hoy)) : "—"}</b><small>${esc(haceDias(a.sinVenir))}</small></div>
            <div><span>Últimos 30 días</span><b>${esc(a.asistenciasMes)} ${a.asistenciasMes === 1 ? "vez" : "veces"}</b><small>le tocan ${esc(a.dias.length)} por semana</small></div>
            <div><span>Hoy le toca</span><b>${a.hoyLeToca ? `Día ${esc(a.hoyLeToca)}` : "—"}</b><small>${a.hoyLeToca ? esc(a.rutina?.find((d) => d.id === a.hoyLeToca)?.nombre ?? "") : "no viene hoy"}</small></div>
            <div><span>Apto físico</span><b>${a.sinApto ? "Falta" : `Hasta ${esc(fechaCorta(a.aptoHasta))}`}</b><small>${a.reglamentoEl ? `reglamento firmado el ${esc(fechaCorta(a.reglamentoEl))}` : "falta firmar el reglamento"}</small></div>
        </div>
        ${esProfe ? htmlProfe(a, datos) : htmlDuena(a, datos)}`;

    if (esProfe) activarProfe(cont, opciones, a);
    else activarDuena(cont, opciones, a);
    activarGuias(cont, opciones.irA);
}

const otraVez = (cont, opciones) => vistaFicha(cont, opciones);

// ---------- Mauro: el seguimiento ----------

function htmlProfe(a, datos) {
    const planes = datos.listarPlanes();
    const rutina = a.rutina
        ? a.rutina.map((d) => `
        <section class="dia-plan">
            <div class="dia-plan__cabeza">
                <h3 class="subtitulo">Día ${esc(d.id)} · ${esc(d.nombre)}</h3>
                ${a.hoyLeToca === d.id ? pastilla("Le toca hoy", "acento", "ti-barbell") : ""}
            </div>
            <ul class="renglones">${d.ejercicios.map((e) => {
                const clave = `${d.id}|${e.ejercicioId}`;
                return `
                <li class="renglon">
                    <div class="renglon__fila">
                        <span><b>${esc(e.nombre)}</b><br><small>${esc(e.series)} × ${esc(cuanto(e.tipo, e.reps))}${e.tipo === "peso" ? ` · ${esc(kilos(e.sugerido))}` : ""}${e.mejor ? ` · mejor ${esc(kilos(e.mejor))}` : ""}${e.hechas.length ? ` · hoy ${esc(e.hechas.length)} ${e.hechas.length === 1 ? "serie" : "series"}` : ""}</small></span>
                        <span class="acciones">
                            ${e.ajustado ? pastilla("Ajustado", "acento", "ti-pencil") : ""}
                            ${e.record ? pastilla("Récord hoy", "bien", "ti-trophy") : ""}
                            <button class="boton boton--chico boton--secundario" type="button" data-ajustar="${esc(clave)}" aria-expanded="${ajustando === clave}">Ajustar</button>
                        </span>
                    </div>
                    ${ajustando === clave ? `
                    <form class="ajuste" data-dia="${esc(d.id)}" data-ej="${esc(e.ejercicioId)}" novalidate>
                        <div class="campos-chicos">
                            <label>Series<input name="series" inputmode="numeric" maxlength="2" value="${esc(e.series)}"></label>
                            <label>${e.tipo === "tiempo" ? "Segundos" : "Repeticiones"}<input name="reps" inputmode="numeric" maxlength="4" value="${esc(e.reps)}"></label>
                            ${e.tipo === "peso" ? `<label>Peso (kg)<input name="peso" inputmode="decimal" maxlength="6" value="${esc(String(e.sugerido).replace(".", ","))}"></label>` : ""}
                        </div>
                        <p class="nota"><span>Solo para ${esc(a.nombre)}: la rutina de los demás no cambia.</span></p>
                        <div class="acciones">
                            <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy" aria-hidden="true"></i> Guardar</button>
                            ${e.ajustado ? `<button class="boton boton--chico boton--secundario" type="button" data-quitar>Volver a lo de la rutina</button>` : ""}
                            <button class="boton-link" type="button" data-cerrar>Cancelar</button>
                        </div>
                    </form>` : ""}
                </li>`;
            }).join("")}</ul>
        </section>`).join("")
        : vacio(`${a.nombre} viene solo a las clases: no tiene rutina.`, "ti-list-details");
    return `
        <div class="bloque">
            <div class="titulo-con-accion">
                <h2 class="subtitulo"><i class="ti ti-list-details" aria-hidden="true"></i> Rutina${a.plan ? `: ${esc(a.plan)}` : ""}</h2>
                ${a.rutina ? `<button class="boton boton--chico boton--secundario" type="button" data-pdf><i class="ti ti-file-type-pdf" aria-hidden="true"></i> Rutina en PDF</button>` : ""}
            </div>
            <label class="cambiar-rutina">Cambiar la rutina
                <select name="plan">
                    ${a.planId ? "" : `<option value="">Elegí una rutina…</option>`}
                    ${planes.map((p) => `<option value="${esc(p.id)}"${p.id === a.planId ? " selected" : ""}>${esc(p.nombre)}</option>`).join("")}
                </select>
            </label>
            ${rutina}
        </div>
        <h2 class="subtitulo"><i class="ti ti-trending-up" aria-hidden="true"></i> Cómo viene</h2>
        ${a.progreso.ejercicios.length ? `<div class="graficos">${a.progreso.ejercicios.map(graficoPeso).join("")}</div>` : ""}
        <div class="bloque">${barrasSemanas(a.progreso.semanas, a.progreso.tocan)}</div>
        <h2 class="subtitulo"><i class="ti ti-message-2" aria-hidden="true"></i> Notas para ${esc(a.nombre)}</h2>
        <form class="formulario bloque nota-nueva" novalidate>
            <label>Nota (la ve en su celu)
                <textarea name="nota" rows="2" maxlength="${TOPES.nota}" placeholder="Ej: Bien ahí, el lunes subimos a 62,5"></textarea>
            </label>
            <button class="boton" type="submit"><i class="ti ti-send" aria-hidden="true"></i> Dejar nota</button>
        </form>
        ${a.notas.length ? `<ul class="notas-profe">${a.notas.slice(0, 6).map((n) => `<li>${esc(n.texto)}<small>${esc(nombreFecha(n.fecha, datos.hoy()))}</small></li>`).join("")}</ul>` : ""}
        ${a.id === "s-franco" ? guia("u-duena", "/inicio", "Ahora mirá lo que ve Vane") : ""}`;
}

function activarProfe(cont, opciones, a) {
    const { usuario, datos } = opciones;
    cont.querySelectorAll("[data-ajustar]").forEach((b) => b.addEventListener("click", () => {
        ajustando = ajustando === b.dataset.ajustar ? null : b.dataset.ajustar;
        otraVez(cont, opciones);
        cont.querySelector(".ajuste input")?.focus();
    }));
    cont.querySelectorAll(".ajuste").forEach((f) => {
        const dato = { diaId: f.dataset.dia, ejercicioId: f.dataset.ej };
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                datos.ajustar(usuario, a.id, { ...dato, series: f.series.value, reps: f.reps.value, peso: f.peso?.value });
                ajustando = null;
                aviso(`Listo: ${a.nombre} lo ve la próxima vez`);
                otraVez(cont, opciones);
            } catch (err) {
                aviso(err, "error");
            }
        });
        f.querySelector("[data-quitar]")?.addEventListener("click", () => {
            datos.quitarAjuste(usuario, a.id, dato);
            ajustando = null;
            aviso("Vuelve a lo de la rutina");
            otraVez(cont, opciones);
        });
        f.querySelector("[data-cerrar]").addEventListener("click", () => {
            ajustando = null;
            otraVez(cont, opciones);
        });
    });
    cont.querySelector("[name=plan]")?.addEventListener("change", (e) => {
        if (!e.target.value) return;
        const nombre = e.target.selectedOptions[0].textContent;
        if (!confirm(`¿Pasar a ${a.nombre} a "${nombre}"? Sus ajustes de la rutina anterior quedan guardados por si vuelve.`)) {
            otraVez(cont, opciones);
            return;
        }
        try {
            datos.asignarPlan(usuario, a.id, e.target.value);
            aviso(`${a.nombre} ya tiene "${nombre}"`);
            otraVez(cont, opciones);
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector(".nota-nueva").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.dejarNota(usuario, a.id, e.target.nota.value);
            aviso(`Nota guardada: ${a.nombre} la ve en su celu`);
            otraVez(cont, opciones);
        } catch (err) {
            aviso(err, "error");
        }
    });
    const botonPdf = cont.querySelector("[data-pdf]");
    botonPdf?.addEventListener("click", async () => {
        botonPdf.disabled = true;
        try {
            const r = datos.rutinaParaPapel(a.id);
            const blob = await armarPdf({
                negocio: NEGOCIO,
                pie: "Hecho con Sazzo Gimnasio (demo)",
                titulo: "Rutina",
                numero: r.plan,
                fecha: fechaCorta(datos.hoy()),
                datos: [["Socio", r.socio], ["Días", `${r.dias} a las ${r.hora}`], ["Profe", r.profe]],
                texto: r.objetivo ? `Objetivo: ${r.objetivo}` : "",
                columnas: r.columnas,
                filas: r.filas,
                aviso: "Rutina de ejemplo: ante cualquier molestia, consultá con tu profe."
            });
            if (cont.isConnected) pdfListo(blob, `Rutina ${r.socio} ${NEGOCIO}`);
        } catch (e) {
            console.warn(e);
            aviso("No se pudo armar el PDF. Probá de nuevo con mejor señal.", "error");
        } finally {
            botonPdf.disabled = false;
        }
    });
}

// ---------- Vane: cuota, pagos, apto y reglamento ----------

function htmlDuena(a, datos) {
    const avisoPago = a.avisoPago;
    return `
        <div class="columnas">
            <section class="bloque cuota">
                <h2 class="subtitulo"><i class="ti ti-cash" aria-hidden="true"></i> Cuota</h2>
                <div class="cuota__estado">
                    <span>${esc(a.cuota)}${a.clasesQuedan !== null && a.clasesQuedan !== undefined ? ` · le quedan ${esc(a.clasesQuedan)} clases` : ""}</span>
                    <b class="cuota__monto">${esc(pesos(a.monto))}</b>
                </div>
                <p class="nota"><i class="ti ti-calendar" aria-hidden="true"></i><span>${a.estadoCuota === "vencida" ? "Venció" : "Vence"} el <b>${esc(nombreFecha(a.vence, datos.hoy()))}</b>${a.recordadoEn ? ` · recordatorio mandado ${esc(nombreFecha(a.recordadoEn.slice(0, 10), datos.hoy()))}` : ""}</span></p>
                ${avisoPago ? `
                <div class="hecho hecho--chico">
                    <p>${pastilla("Avisó que pagó", "alerta", "ti-bell-ringing")}</p>
                    <p class="nota"><span>${esc(pesos(avisoPago.monto))} por transferencia, ${esc(nombreFecha(avisoPago.fecha, datos.hoy()))}. Fijate si llegó a la cuenta y confirmalo.</span></p>
                    <div class="acciones">
                        <button class="boton" type="button" data-confirmar="${esc(avisoPago.id)}"><i class="ti ti-check" aria-hidden="true"></i> Llegó: confirmar</button>
                        <button class="boton boton--secundario" type="button" data-rechazar="${esc(avisoPago.id)}">No llegó</button>
                    </div>
                </div>` : a.baja ? "" : `
                <form class="formulario pago" novalidate>
                    <div class="chips" role="radiogroup" aria-label="Cómo pagó">
                        <button class="chip${medio === "efectivo" ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === "efectivo"}" data-medio="efectivo">Efectivo</button>
                        <button class="chip${medio === "transferencia" ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === "transferencia"}" data-medio="transferencia">Transferencia</button>
                    </div>
                    <label>Monto
                        <input name="monto" inputmode="numeric" maxlength="7" value="${esc(a.monto)}">
                    </label>
                    <button class="boton" type="submit"><i class="ti ti-cash" aria-hidden="true"></i> Registrar pago</button>
                </form>`}
                ${a.baja ? "" : `<button class="boton boton--secundario boton--ancho" type="button" data-recordar><i class="ti ti-message-circle" aria-hidden="true"></i> Mandar recordatorio de la cuota</button>`}
                <h3 class="rotulo-chico">Pagos</h3>
                ${a.pagos.length ? `<ul class="tarjetas">${a.pagos.map((p) => `
                    <li class="tarjeta tarjeta--chica">
                        <div class="tarjeta__fila">
                            <span><b>${esc(fechaCorta(p.confirmadoEl ?? p.fecha))}</b> · ${p.medio === "efectivo" ? "efectivo" : "transferencia"}${p.hasta && p.estado === "confirmado" ? ` · hasta el ${esc(fechaCorta(p.hasta))}` : ""}</span>
                            <span class="acciones">
                                ${p.estado === "avisado" ? pastilla("A confirmar", "alerta") : p.estado === "anulado" ? pastilla(p.motivo ?? "Anulado", "suave") : `<b>${esc(pesos(p.monto))}</b>`}
                                ${p.id === a.ultimoPagoId && p.confirmadoEl === datos.hoy() ? `<button class="boton-link" type="button" data-deshacer="${esc(p.id)}"><i class="ti ti-arrow-back-up" aria-hidden="true"></i> Deshacer</button>` : ""}
                            </span>
                        </div>
                    </li>`).join("")}</ul>` : vacio("Todavía no hay pagos.", "ti-receipt")}
            </section>
            <div>
                <section class="bloque">
                    <h2 class="subtitulo"><i class="ti ti-file-certificate" aria-hidden="true"></i> Apto físico y reglamento</h2>
                    <p class="nota"><span>Apto físico: <b>${a.sinApto ? "falta" : `vale hasta el ${esc(fechaCorta(a.aptoHasta))}`}</b></span></p>
                    ${a.sinApto ? `<button class="boton boton--chico" type="button" data-apto><i class="ti ti-file-check" aria-hidden="true"></i> Trajo el apto hoy</button>` : ""}
                    <p class="nota"><span>Reglamento: <b>${a.reglamentoEl ? `firmado el ${esc(fechaCorta(a.reglamentoEl))}` : "sin firmar"}</b></span></p>
                    ${a.firma ? `<img class="firma-imagen" src="${esc(a.firma)}" alt="Firma de ${esc(a.nombre)}">` : ""}
                    <button class="boton boton--chico boton--secundario" type="button" data-firmar><i class="ti ti-signature" aria-hidden="true"></i> ${a.reglamentoEl ? "Firmar de nuevo" : "Firmar el reglamento"}</button>
                </section>
                <section class="bloque">
                    <h2 class="subtitulo"><i class="ti ti-calendar-check" aria-hidden="true"></i> Si viene</h2>
                    ${barrasSemanas(a.progreso.semanas, a.progreso.tocan)}
                    ${a.noViene ? `
                    <p class="nota"><i class="ti ti-alert-triangle" aria-hidden="true"></i><span>${esc(haceDias(a.sinVenir))}${a.invitadoEn ? ` · lo invitaste ${esc(nombreFecha(a.invitadoEn.slice(0, 10), datos.hoy()))}` : ""}</span></p>
                    <button class="boton boton--chico" type="button" data-invitar${a.invitadoEn && (Date.now() - new Date(a.invitadoEn)) / 864e5 < REINVITAR_DIAS ? " disabled" : ""}><i class="ti ti-message-circle" aria-hidden="true"></i> Invitarlo a volver</button>` : ""}
                </section>
                <section class="bloque">
                    ${a.baja
                        ? `<button class="boton boton--secundario" type="button" data-reactivar><i class="ti ti-user-plus" aria-hidden="true"></i> Volver a darlo de alta</button>`
                        : `<button class="boton boton--chico boton--peligro" type="button" data-baja><i class="ti ti-user-x" aria-hidden="true"></i> Dar de baja</button>
                           <p class="nota"><span>La baja no borra nada: queda en "Bajas" y se puede volver a dar de alta.</span></p>`}
                </section>
            </div>
        </div>
        ${a.id === "s-franco" ? guia("u-socio", "/cuota", "Mirá lo que ve Franco") : ""}`;
}

function activarDuena(cont, opciones, a) {
    const { usuario, datos } = opciones;
    const hacer = (fn, mensaje) => () => {
        try {
            const r = fn();
            if (mensaje) aviso(typeof mensaje === "function" ? mensaje(r) : mensaje);
            otraVez(cont, opciones);
            return r;
        } catch (err) {
            aviso(err, "error");
            return null;
        }
    };
    cont.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
        medio = b.dataset.medio;
        cont.querySelectorAll("[data-medio]").forEach((x) => {
            x.classList.toggle("activo", x === b);
            x.setAttribute("aria-checked", String(x === b));
        });
    }));
    cont.querySelector(".pago")?.addEventListener("submit", (e) => {
        e.preventDefault();
        hacer(() => datos.registrarPago(usuario, a.id, { medio, monto: e.target.monto.value.trim().replace(/\./g, "") }), (p) => `Pago registrado: vence el ${fechaCorta(p.hasta)}`)();
    });
    cont.querySelector("[data-confirmar]")?.addEventListener("click", hacer(() => datos.confirmarPago(usuario, a.avisoPago.id), (p) => `Confirmado: ${a.nombre} está al día hasta el ${fechaCorta(p.hasta)}`));
    cont.querySelector("[data-rechazar]")?.addEventListener("click", () => {
        if (confirm(`¿La transferencia de ${a.nombre} no llegó? El aviso se anula y la cuota sigue igual.`)) hacer(() => datos.rechazarPago(usuario, a.avisoPago.id), "Aviso anulado")();
    });
    cont.querySelectorAll("[data-deshacer]").forEach((b) => b.addEventListener("click", hacer(() => datos.anularPago(usuario, b.dataset.deshacer), "Pago deshecho: la cuota vuelve a como estaba")));
    cont.querySelector("[data-recordar]")?.addEventListener("click", () => {
        try {
            const r = datos.recordatorio(usuario, a.id);
            otraVez(cont, opciones);
            mostrarMensaje(`Recordatorio para ${a.nombre}`, r.mensaje);
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector("[data-invitar]")?.addEventListener("click", () => {
        try {
            const r = datos.invitarVolver(usuario, a.id);
            otraVez(cont, opciones);
            mostrarMensaje(`Invitar a ${a.nombre}`, r.mensaje);
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector("[data-apto]")?.addEventListener("click", hacer(() => datos.anotarApto(usuario, a.id), "Apto físico anotado por un año"));
    cont.querySelector("[data-firmar]").addEventListener("click", async () => {
        const firma = await pedirFirma({ titulo: "Reglamento del gimnasio", texto: `${a.nombreCompleto} leyó y acepta el reglamento de ${NEGOCIO} (de ejemplo).` });
        if (!firma || !cont.isConnected) return;
        hacer(() => datos.firmarReglamento(usuario, a.id, firma), "Reglamento firmado")();
    });
    cont.querySelector("[data-baja]")?.addEventListener("click", () => {
        if (confirm(`¿Dar de baja a ${a.nombre}? No se borra: queda en "Bajas".`)) hacer(() => datos.darDeBaja(usuario, a.id), `${a.nombre} quedó dado de baja`)();
    });
    cont.querySelector("[data-reactivar]")?.addEventListener("click", hacer(() => datos.reactivar(usuario, a.id), `${a.nombre} volvió a estar activo`));
}
