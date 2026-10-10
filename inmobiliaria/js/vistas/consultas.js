// ============================================
// Consultas de Sazzo Inmobiliaria (Tomás arranca acá; Graciela también las ve): la lista con lo que hay que
// atender primero (visitas pedidas desde la página, sin contestar, sin seguimiento), la ficha de cada consulta
// (confirmar la visita, mandar la ficha en PDF y el mensaje, ofrecer otras propiedades, notas) y "Anotar consulta".
// ============================================
import { esc, aviso, vacio, mensajeDe } from "../../kit/js/ui.js?v=bc8d90946e";
import { aHora } from "../../kit/js/turnos.js?v=bc8d90946e";
import { TOPES, TIPOS, ZONAS, OPERACIONES, ORIGENES, ESTADOS_CONSULTA } from "../datos.js?v=bc8d90946e";
import { bajarFicha } from "./propiedades.js?v=bc8d90946e";
import {
    guia, activarGuias, pastillaConsulta, pastillaVisita, mostrarMensaje, hace, mayuscula, htmlFoto, medidas, hrefPropiedad
} from "./comunes.js?v=bc8d90946e";

let filtroEstado = "abiertas";
const FILTROS = { abiertas: "Abiertas", nueva: "Nuevas", agendada: "Con visita", todas: "Todas" };

export function vistaConsultas(cont, { usuario, datos, irA }) {
    const hoy = datos.hoy();
    const pedidas = datos.pedidasSinVer();
    const todas = datos.listarConsultas();
    const lista = datos.listarConsultas({ estado: filtroEstado === "todas" ? null : filtroEstado });
    const cuantas = (k) => (k === "todas" ? todas.length : k === "abiertas" ? todas.filter((c) => c.abierta).length : todas.filter((c) => c.estado === k).length);
    const avisoDe = (c) => {
        if (c.pedida) return `<p class="consulta__aviso consulta__aviso--pedida"><i class="ti ti-calendar-plus" aria-hidden="true"></i> Pidió visita: <b>${esc(c.pedida.fechaNombre)} ${esc(c.pedida.hora)}</b> · confirmala</p>`;
        if (c.sinContestar) return `<p class="consulta__aviso"><i class="ti ti-alert-circle" aria-hidden="true"></i> Sin contestar · llegó ${esc(hace(c.creado, hoy))}</p>`;
        if (c.proxima) return `<p class="consulta__aviso consulta__aviso--bien"><i class="ti ti-calendar-event" aria-hidden="true"></i> Visita ${esc(c.proxima.fechaNombre)} ${esc(c.proxima.hora)} con ${esc(c.proxima.agente)}</p>`;
        if (c.abierta && c.diasSinContacto >= 4) return `<p class="consulta__aviso"><i class="ti ti-clock" aria-hidden="true"></i> Hace ${esc(c.diasSinContacto)} días que no le escribís</p>`;
        return "";
    };
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Consultas</h1>
            <a class="boton" href="#/consultas/nueva"><i class="ti ti-plus"></i> Anotar consulta</a>
        </div>
        ${pedidas.length ? `<ul class="nuevos" aria-label="Visitas pedidas desde la página">${pedidas.map((v) => `
            <li class="nuevo">
                <i class="ti ti-bell-ringing" aria-hidden="true"></i>
                <span><b>${esc(v.consultaNombre)} pidió una visita</b><small>${esc(v.propiedad)} · ${esc(mayuscula(v.fechaNombre))} ${esc(v.hora)} · desde la página</small></span>
                <a class="boton boton--chico" href="#/consultas/${esc(v.consultaId)}">Ver</a>
            </li>`).join("")}</ul>` : usuario.rol === "agente" && !todas.some((c) => c.pedida) ? `
            <p class="nota pista"><i class="ti ti-hand-finger"></i><span>Probá: pedí una visita como Valeria y mirá cómo te llega acá.</span></p>
            ${guia("u-cliente", "/inicio", "Pedí una visita como Valeria")}` : `
            <p class="nota pista"><i class="ti ti-hand-finger"></i><span>Probá: abrí la de arriba, confirmá la visita y mandale la ficha.</span></p>`}
        <div class="chips" role="tablist" aria-label="Qué consultas ver">${Object.entries(FILTROS).map(([k, v]) => `
            <button class="chip${k === filtroEstado ? " activo" : ""}" type="button" role="tab" aria-selected="${k === filtroEstado}" data-filtro="${esc(k)}">${esc(v)} <b>${esc(cuantas(k))}</b></button>`).join("")}
        </div>
        ${lista.length ? `<ul class="tarjetas">${lista.map((c) => `
            <li class="tarjeta tarjeta--abre consulta${c.pedida ? " consulta--pedida" : c.sinContestar ? " consulta--nueva" : ""}">
                <div class="tarjeta__fila">
                    <a class="tarjeta__titulo" href="#/consultas/${esc(c.id)}"><i class="ti ${esc(c.origenIcono)}" aria-hidden="true"></i>${esc(c.nombre)}</a>
                    ${pastillaConsulta(c)}
                </div>
                <p class="tarjeta__quien">${c.propiedad ? `<b>${esc(c.propiedad)}</b> · ` : ""}${esc(c.buscaTexto)}</p>
                ${avisoDe(c)}
                <div class="tarjeta__pie"><small>${esc(c.origenTexto)} · ${esc(hace(c.creado, hoy))} · la atiende ${esc(c.agente)}</small></div>
            </li>`).join("")}</ul>` : vacio("No hay consultas así.", "ti-mood-empty")}`;
    activarGuias(cont, irA);
    cont.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => {
        filtroEstado = b.dataset.filtro;
        vistaConsultas(cont, { usuario, datos, irA });
    }));
}

// ---------- Una consulta ----------

export function vistaConsulta(cont, { usuario, datos, params: [id], irA }) {
    datos.marcarVisto(usuario, id);
    const c = datos.consulta(id);
    const hoy = datos.hoy();
    const p = c.propiedadId ? datos.propiedad(c.propiedadId) : null;
    const otros = p ? datos.quienesBuscan(p.id).filter((x) => x.id !== c.id) : [];
    const sirven = datos.leSirvenA(c.id);
    const esValeria = c.clienteId === "u-cliente";
    const volver = usuario.rol === "agente" ? "#/inicio" : "#/consultas";
    const recargar = () => vistaConsulta(cont, { usuario, datos, params: [id], irA });
    const visitaActual = c.pedida ?? c.proxima ?? c.visitas.find((v) => v.estado === "confirmada" && v.empezo && !v.anulado) ?? null;

    function bloqueVisita() {
        const v = visitaActual;
        if (!v) return "";
        if (v.estado === "pedida") {
            return `<section class="bloque visita visita--pedida" aria-labelledby="t-visita">
                <h2 class="subtitulo" id="t-visita"><i class="ti ti-calendar-plus"></i> Pidió una visita</h2>
                <p class="visita__cuando"><b>${esc(mayuscula(v.fechaNombre))} ${esc(v.hora)}</b> · ${esc(v.propiedad)} · con ${esc(v.agente)}</p>
                <p class="nota"><i class="ti ti-shield-check"></i><span>El horario ya está tomado: nadie más puede pedirlo mientras lo confirmás.</span></p>
                <div class="acciones">
                    <button class="boton boton--grande" type="button" data-confirmar="${esc(v.id)}"><i class="ti ti-check"></i> Confirmar visita</button>
                    <button class="boton boton--secundario" type="button" data-cancelar="${esc(v.id)}"><i class="ti ti-x"></i> No se puede</button>
                </div>
            </section>`;
        }
        const yaPaso = v.empezo;
        return `<section class="bloque visita" aria-labelledby="t-visita">
            <h2 class="subtitulo" id="t-visita"><i class="ti ti-calendar-event"></i> Visita ${pastillaVisita(v)}</h2>
            <p class="visita__cuando"><b>${esc(mayuscula(v.fechaNombre))} ${esc(v.hora)}</b> · ${esc(v.propiedad)} · con ${esc(v.agente)}</p>
            <div class="acciones">
                ${yaPaso ? `
                <button class="boton" type="button" data-marcar="hecha" data-visita="${esc(v.id)}"><i class="ti ti-check"></i> Visitó</button>
                <button class="boton boton--secundario" type="button" data-marcar="falto" data-visita="${esc(v.id)}"><i class="ti ti-user-x"></i> No vino</button>` : `
                <button class="boton" type="button" data-mandar="${esc(v.id)}"><i class="ti ti-send"></i> Mandar confirmación y ficha</button>
                <button class="boton boton--secundario" type="button" data-pdf="${esc(v.propiedadId)}"><i class="ti ti-file-type-pdf"></i> Ficha en PDF</button>
                <button class="boton boton--secundario boton--chico" type="button" data-cancelar="${esc(v.id)}"><i class="ti ti-x"></i> Cancelar</button>`}
            </div>
            ${esValeria && !yaPaso ? `<div class="guias">${guia("u-cliente", "/mis-visitas", "Mirá cómo lo ve Valeria")}${guia("u-duena", "/inicio", "Pasá a Graciela: los alquileres de este mes")}</div>` : ""}
        </section>`;
    }

    cont.innerHTML = `
        <a class="volver" href="${volver}"><i class="ti ti-arrow-left"></i> Consultas</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(c.nombre)}</h1>
            ${pastillaConsulta(c)}
        </div>
        <p class="tira"><span><i class="ti ${esc(c.origenIcono)}" aria-hidden="true"></i> ${esc(c.origenTexto)}</span><span>Llegó ${esc(hace(c.creado, hoy))}</span><span>La atiende <b>${esc(c.agente)}</b></span></p>
        ${c.mensaje ? `<blockquote class="cita">${esc(c.mensaje)}</blockquote>` : ""}
        <p class="busca"><i class="ti ti-search" aria-hidden="true"></i> Busca: <b>${esc(c.buscaTexto)}</b></p>
        ${p ? `<a class="prop-chica prop-chica--link" href="${hrefPropiedad(usuario, p.id)}">${htmlFoto(p, { clase: "foto--chica", tamanos: "80px" })}
            <span><small>Preguntó por</small><b>${esc(p.titulo)}</b><small>${esc(p.precioTexto)} · ${esc(p.zonaNombre)} · ${esc(medidas(p))}</small></span></a>` : ""}
        ${bloqueVisita()}
        ${otros.length ? `<p class="alerta alerta--info"><i class="ti ti-users"></i> <span>Otras <b>${esc(otros.length)}</b> consultas buscan algo como ${esc(p.titulo.toLowerCase())}: ${otros.map((o) => esc(o.nombre.split(" ")[0])).join(", ")}. <a href="${hrefPropiedad(usuario, p.id)}">Ofrecérselo</a></span></p>` : ""}
        <section class="bloque" aria-labelledby="t-sirven">
            <h2 class="subtitulo" id="t-sirven"><i class="ti ti-home"></i> Otras que le sirven <span class="contador">${esc(sirven.length)}</span></h2>
            ${sirven.length ? `<ul class="tarjetas">${sirven.map((x) => `
                <li class="tarjeta tarjeta--chica">
                    <div class="tarjeta__fila"><a class="tarjeta__titulo" href="${hrefPropiedad(usuario, x.id)}"><i class="ti ${esc(x.icono)}" aria-hidden="true"></i>${esc(x.titulo)}</a><b class="monto">${esc(x.precioTexto)}</b></div>
                    <div class="tarjeta__pie"><small>${esc(x.zonaNombre)} · ${esc(medidas(x))}</small>
                        <button class="boton boton--chico" type="button" data-ofrecer="${esc(x.id)}"><i class="ti ti-send"></i> Ofrecérsela</button></div>
                </li>`).join("")}</ul>` : `<p class="nota"><i class="ti ti-info-circle"></i><span>Por ahora no hay otra propiedad disponible con lo que busca.</span></p>`}
        </section>
        ${c.abierta && !c.pedida ? `
        <section class="bloque" aria-labelledby="t-agendar">
            <h2 class="subtitulo" id="t-agendar"><i class="ti ti-calendar-plus"></i> Agendar una visita</h2>
            <form class="formulario agendar" novalidate>
                <label>Propiedad<select name="propiedad">${[...(p && p.estado === "disponible" ? [p] : []), ...sirven].map((x) => `<option value="${esc(x.id)}">${esc(x.titulo)}</option>`).join("")}${!p && !sirven.length ? `<option value="">No hay propiedades que le sirvan</option>` : ""}</select></label>
                <div class="formulario__fila">
                    <label>Día<select name="fecha">${datos.dias().filter((d) => !d.cerrado).map((d) => `<option value="${esc(d.fecha)}">${esc(mayuscula(d.nombre))}</option>`).join("")}</select></label>
                    <label>Hora<select name="hora"></select></label>
                </div>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton" type="submit"><i class="ti ti-calendar-check"></i> Agendar</button>
            </form>
        </section>` : ""}
        <section class="bloque" aria-labelledby="t-seguir">
            <h2 class="subtitulo" id="t-seguir"><i class="ti ti-clipboard-list"></i> Cómo sigue</h2>
            <div class="acciones">
                ${c.abierta ? `<button class="boton boton--secundario" type="button" data-seguimiento><i class="ti ti-message-circle"></i> Escribirle</button>` : ""}
                ${Object.entries(ESTADOS_CONSULTA).filter(([k]) => ["interesada", "cerrada", "descartada"].includes(k) && k !== c.estado).map(([k, v]) => `
                <button class="boton boton--secundario boton--chico" type="button" data-estado="${esc(k)}">${esc(v)}</button>`).join("")}
                ${!c.abierta ? `<button class="boton boton--secundario boton--chico" type="button" data-estado="nueva"><i class="ti ti-repeat"></i> Reabrir</button>` : ""}
            </div>
            <h3 class="rotulo-chico">Notas</h3>
            ${c.notas.length ? `<ul class="notas">${c.notas.slice().reverse().map((n) => `<li><p>${esc(n.texto)}</p><small>${esc(n.por === usuario.id ? "Vos" : n.por === "u-agente" ? "Tomás" : "Graciela")} · ${esc(hace(n.fecha, hoy))}</small></li>`).join("")}</ul>` : ""}
            <form class="formulario nota-nueva" novalidate>
                <label class="solo-lector" for="nota-texto">Nota</label>
                <div class="nota-nueva__fila">
                    <input id="nota-texto" name="texto" type="text" maxlength="${TOPES.nota}" placeholder="Ej: tiene gato, prefiere planta baja" autocomplete="off">
                    <button class="boton" type="submit"><i class="ti ti-plus"></i> Anotar</button>
                </div>
            </form>
        </section>
        ${c.visitas.length ? `
        <details class="bloque anteriores">
            <summary>Sus visitas (${esc(c.visitas.length)})</summary>
            <ul class="tarjetas">${c.visitas.map((v) => `
                <li class="tarjeta tarjeta--chica"><div class="tarjeta__fila"><span><b>${esc(mayuscula(v.fechaNombre))} ${esc(v.hora)}</b> · ${esc(v.propiedad)}</span>${pastillaVisita(v)}</div></li>`).join("")}</ul>
        </details>` : ""}`;

    activarGuias(cont, irA);
    const hacer = (fn, ok) => {
        try {
            fn();
            if (ok) aviso(ok);
            recargar();
        } catch (e) {
            aviso(e, "error");
        }
    };
    cont.querySelector("[data-confirmar]")?.addEventListener("click", (e) => hacer(() => {
        const v = datos.confirmarVisita(usuario, e.currentTarget.dataset.confirmar);
        // Confirmada: de una le ofrece mandarle la confirmación con la ficha
        setTimeout(() => mandar(v.id), 350);
    }, "Visita confirmada"));
    cont.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm("¿Cancelar la visita? El horario queda libre.")) return;
        hacer(() => datos.cancelarVisita(usuario, b.dataset.cancelar), "Visita cancelada");
    }));
    cont.querySelectorAll("[data-marcar]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.marcarVisita(usuario, b.dataset.visita, b.dataset.marcar), b.dataset.marcar === "hecha" ? "Anotado: visitó" : "Anotado: no vino")));

    function mandar(visitaId) {
        try {
            const ventana = mostrarMensaje("Confirmación y ficha", datos.mensajeVisita(usuario, visitaId), {
                alCopiar: () => datos.marcarContacto(usuario, c.id)
            });
            // En la versión real va la ficha adjunta: acá, el botón para bajarla al lado del mensaje
            const v = datos.visita(visitaId);
            const acciones = ventana.querySelector(".mensaje__acciones");
            acciones?.insertAdjacentHTML("afterbegin", `<button class="boton boton--secundario" type="button" data-pdf-ventana><i class="ti ti-file-type-pdf"></i> Ficha en PDF</button>`);
            const b = ventana.querySelector("[data-pdf-ventana]");
            b?.addEventListener("click", () => bajarFicha(b, datos.propiedad(v.propiedadId)));
        } catch (e) {
            aviso(e, "error");
        }
    }
    cont.querySelector("[data-mandar]")?.addEventListener("click", (e) => mandar(e.currentTarget.dataset.mandar));
    const pdf = cont.querySelector("[data-pdf]");
    pdf?.addEventListener("click", () => bajarFicha(pdf, datos.propiedad(pdf.dataset.pdf)));
    cont.querySelectorAll("[data-ofrecer]").forEach((b) => b.addEventListener("click", () => {
        try {
            mostrarMensaje("Ofrecerle la propiedad", datos.mensajeCoincidencia(usuario, c.id, b.dataset.ofrecer), { alCopiar: () => datos.marcarContacto(usuario, c.id) });
        } catch (e) {
            aviso(e, "error");
        }
    }));
    cont.querySelector("[data-seguimiento]")?.addEventListener("click", () => {
        mostrarMensaje(`Escribirle a ${c.nombre.split(" ")[0]}`, datos.mensajeSeguimiento(usuario, c.id), { alCopiar: () => datos.marcarContacto(usuario, c.id) });
    });
    cont.querySelectorAll("[data-estado]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.cambiarEstadoConsulta(usuario, c.id, b.dataset.estado), `Ahora: ${ESTADOS_CONSULTA[b.dataset.estado]}`)));

    // Agendar: las horas libres según la propiedad y el día
    const agendar = cont.querySelector(".agendar");
    if (agendar) {
        const horas = () => {
            const propiedadId = agendar.elements.propiedad.value;
            const libres = propiedadId ? datos.libresParaVisita(propiedadId, agendar.elements.fecha.value) : [];
            agendar.elements.hora.innerHTML = libres.length
                ? libres.map((l) => `<option value="${l.inicio}">${esc(aHora(l.inicio))} (${esc(l.agentes.map((a) => (a === "u-agente" ? "Tomás" : "Graciela")).join(" o "))})</option>`).join("")
                : `<option value="">No quedan horarios</option>`;
        };
        agendar.elements.propiedad.addEventListener("change", horas);
        agendar.elements.fecha.addEventListener("change", horas);
        horas();
        agendar.addEventListener("submit", (e) => {
            e.preventDefault();
            const error = agendar.querySelector(".formulario__error");
            try {
                const v = datos.agendarVisita(usuario, {
                    consultaId: c.id, propiedadId: agendar.elements.propiedad.value,
                    fecha: agendar.elements.fecha.value, inicio: agendar.elements.hora.value === "" ? NaN : Number(agendar.elements.hora.value)
                });
                aviso(`Visita agendada: ${mayuscula(v.fechaNombre)} ${v.hora}`);
                recargar();
            } catch (err) {
                error.textContent = mensajeDe(err);
                error.hidden = false;
            }
        });
    }

    cont.querySelector(".nota-nueva").addEventListener("submit", (e) => {
        e.preventDefault();
        hacer(() => datos.anotar(usuario, c.id, e.target.elements.texto.value), "Nota anotada");
    });
}

// ---------- Anotar una consulta ----------

export function vistaNuevaConsulta(cont, { usuario, datos }) {
    const propiedades = datos.listarPropiedades();
    cont.innerHTML = `
        <a class="volver" href="${usuario.rol === "agente" ? "#/inicio" : "#/consultas"}"><i class="ti ti-arrow-left"></i> Consultas</a>
        <h1 class="titulo">Anotar consulta</h1>
        <p class="nota"><i class="ti ti-info-circle"></i><span>Lo que entró por WhatsApp, el portal o el cartel, en un solo lugar. En la versión real, las del portal entran solas.</span></p>
        <form class="formulario bloque" novalidate>
            <div class="formulario__fila">
                <label>Nombre<input name="nombre" type="text" maxlength="${TOPES.nombre}" required placeholder="Ej: Laura" autocomplete="off"></label>
                <label>Llegó por<select name="origen">${Object.entries(ORIGENES).filter(([k]) => k !== "web").map(([k, o]) => `<option value="${esc(k)}">${esc(o.texto)}</option>`).join("")}</select></label>
            </div>
            <label>Preguntó por <small>(opcional)</small><select name="propiedad"><option value="">Ninguna en especial</option>${propiedades.map((p) => `<option value="${esc(p.id)}">${esc(p.titulo)} · ${esc(p.precioTexto)}</option>`).join("")}</select></label>
            <fieldset class="grupo busca-elegir">
                <legend>Qué busca</legend>
                <div class="formulario__fila">
                    <label>Para<select name="operacion">${Object.entries(OPERACIONES).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select></label>
                    <label>Tipo<select name="tipo"><option value="">Cualquiera</option>${Object.entries(TIPOS).map(([k, v]) => `<option value="${esc(k)}">${esc(v.texto)}</option>`).join("")}</select></label>
                </div>
                <div class="formulario__fila formulario__fila--3">
                    <label>Ambientes (o más)<input name="ambientes" type="number" inputmode="numeric" min="1" max="${TOPES.ambientes}" step="1" placeholder="—"></label>
                    <label><span data-rotulo-hasta>Hasta ($ por mes)</span><input name="hasta" type="number" inputmode="numeric" min="1" max="${TOPES.alquiler}" step="1" placeholder="—"></label>
                    <label>Zona<select name="zona"><option value="">Cualquiera</option>${Object.entries(ZONAS).map(([k, z]) => `<option value="${esc(k)}">${esc(z.nombre)}</option>`).join("")}</select></label>
                </div>
            </fieldset>
            <label>Qué preguntó<textarea name="mensaje" rows="2" maxlength="${TOPES.mensaje}" placeholder="Ej: ¿aceptan mascotas?"></textarea></label>
            <p class="formulario__error" role="alert" hidden></p>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Anotar</button>
        </form>`;
    const form = cont.querySelector("form");
    const error = form.querySelector(".formulario__error");
    // Si pregunta por una propiedad, lo que busca se completa con esa
    form.elements.propiedad.addEventListener("change", () => {
        const p = propiedades.find((x) => x.id === form.elements.propiedad.value);
        if (!p) return;
        form.elements.operacion.value = p.operacion;
        form.elements.tipo.value = p.tipo;
        form.elements.ambientes.value = p.ambientes;
        form.elements.operacion.dispatchEvent(new Event("change"));
    });
    form.elements.operacion.addEventListener("change", () => {
        const venta = form.elements.operacion.value === "venta";
        cont.querySelector("[data-rotulo-hasta]").textContent = venta ? "Hasta (US$)" : "Hasta ($ por mes)";
        form.elements.hasta.max = venta ? TOPES.venta : TOPES.alquiler;
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const numero = (k) => (f.get(k) === "" ? null : Number(f.get(k)));
        try {
            const c = datos.nuevaConsulta(usuario, {
                nombre: f.get("nombre"), origen: f.get("origen"), propiedadId: f.get("propiedad") || null,
                operacion: f.get("operacion"), tipo: f.get("tipo") || null, ambientes: numero("ambientes"), hasta: numero("hasta"),
                zona: f.get("zona") || null, mensaje: f.get("mensaje")
            });
            aviso("Consulta anotada");
            location.hash = `#/consultas/${c.id}`;
        } catch (err) {
            error.textContent = mensajeDe(err);
            error.hidden = false;
        }
    });
}

