// ============================================
// Pantallas del barbero (Leo): la agenda del día (un renglón por turno y los huecos libres a la vista; Leo, Fran o
// los dos; en la compu, una columna por barbero) y "+ Turno" (cargar a mano el que pidió por mensaje o entró sin
// turno). El turno que sacó un cliente desde el celular aparece resaltado hasta que Leo hace algo con él.
// ============================================
import { esc, aviso, vacio } from "kit/ui.js";
import { aHora } from "kit/turnos.js";
import { SERVICIOS, BARBEROS, TOPES, pesos, nombreFecha } from "../datos.js";
import { pastillaEstado, chipsDias, mostrarMensaje } from "./comunes.js";

let ver = "todos"; // "todos" o el id de un barbero

export function vistaAgenda(cont, { usuario, datos, consulta }) {
    const dias = datos.dias();
    const pedida = dias.find((d) => d.fecha === consulta.get("fecha"));
    const fecha = pedida?.fecha ?? (dias.find((d) => !d.cerrado) ?? dias[0]).fecha;
    const a = datos.agenda(fecha);
    const nuevos = datos.nuevos();
    const columnas = a.columnas.filter((c) => ver === "todos" || c.id === ver);

    const renglonTurno = (t) => `
        <li class="renglon renglon--${esc(t.estado)}${t.nuevo ? " renglon--nuevo" : ""}" id="t-${esc(t.id)}">
            <span class="renglon__hora">${esc(t.hora)}<small>${esc(t.hasta)}</small></span>
            <span class="renglon__que">
                <b><a href="#/clientes/${esc(t.clienteId)}">${esc(t.cliente)}</a>${t.nuevo ? ` <span class="etiqueta etiqueta--nuevo">Nuevo</span>` : ""}</b>
                <small>${esc(t.servicio)} · ${esc(pesos(t.precio))}${t.nuevo ? " · lo sacó desde el celular" : ""}</small>
                ${t.estado === "reservado" ? `
                <span class="renglon__acciones">
                    <button class="boton boton--chico" type="button" data-marcar="llego" data-id="${esc(t.id)}"><i class="ti ti-check"></i> Llegó</button>
                    <button class="boton boton--chico boton--secundario" type="button" data-marcar="falto" data-id="${esc(t.id)}"><i class="ti ti-user-x"></i> Faltó</button>
                    <button class="boton boton--chico boton--secundario" type="button" data-recordar="${esc(t.id)}"><i class="ti ti-message-circle"></i> Recordarle</button>
                    <button class="boton-icono" type="button" data-cancelar="${esc(t.id)}" title="Cancelar turno" aria-label="Cancelar el turno de ${esc(t.cliente)}"><i class="ti ti-x"></i></button>
                </span>` : pastillaEstado(t.estado)}
            </span>
        </li>`;
    const renglonHueco = (h, barberoId) => `
        <li class="renglon renglon--libre">
            <span class="renglon__hora">${esc(aHora(h.desde))}<small>${esc(aHora(h.hasta))}</small></span>
            <a class="hueco" href="#/nuevo?barbero=${esc(barberoId)}&fecha=${esc(fecha)}&inicio=${h.desde}"><i class="ti ti-plus" aria-hidden="true"></i> Libre: anotar turno</a>
        </li>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Agenda</h1>
            <a class="boton boton--chico" href="#/nuevo?fecha=${esc(fecha)}"><i class="ti ti-plus"></i> Turno</a>
        </div>
        ${nuevos.length ? `<ul class="nuevos">${nuevos.map((t) => `
            <li class="nuevo">
                <i class="ti ti-bell-ringing" aria-hidden="true"></i>
                <span><b>${esc(t.cliente)} sacó turno · ${esc(nombreFecha(t.fecha))} ${esc(t.hora)} con ${esc(t.barbero)}</b><small>${esc(t.servicio)} · desde el celular</small></span>
                <a class="boton boton--chico boton--secundario" href="#/inicio?fecha=${esc(t.fecha)}" data-ir-nuevo="${esc(t.id)}">Ver</a>
            </li>`).join("")}</ul>` : ""}
        ${chipsDias(dias, fecha)}
        <div class="tira">
            <span><b>${esc(a.resumen.turnos)}</b> turnos</span>
            <span><b>${esc(a.resumen.atendidos)}</b> atendidos</span>
            <span><b>${esc(a.resumen.faltazos)}</b> faltazos</span>
            <span>Hecho <b>${esc(pesos(a.resumen.hecho))}</b></span>
            <span>Por hacer <b>${esc(pesos(a.resumen.porHacer))}</b></span>
        </div>
        <div class="chips" role="tablist" aria-label="Barbero">
            <button class="chip${ver === "todos" ? " activo" : ""}" type="button" data-ver="todos">Los dos</button>
            ${BARBEROS.map((b) => `<button class="chip${ver === b.id ? " activo" : ""}" type="button" data-ver="${esc(b.id)}">${esc(b.nombre)}</button>`).join("")}
        </div>
        ${a.cerrado ? vacio("Ese día la barbería está cerrada.", "ti-moon") : `
        <div class="columnas">${columnas.map((c) => {
            // Los que ya se atendieron (llegó o faltó), plegados arriba: lo primero que se ve es lo que sigue
            const hechos = c.turnos.filter((t) => t.estado !== "reservado");
            const filas = c.turnos.filter((t) => t.estado === "reservado").map((t) => ({ m: t.inicio, html: renglonTurno(t) }))
                .concat(c.huecos.map((h) => ({ m: h.desde, html: renglonHueco(h, c.id) })));
            return `
            <section class="columna">
                <h2 class="subtitulo"><i class="ti ti-user"></i> ${esc(c.nombre)}</h2>
                ${hechos.length ? `
                <details class="hechos">
                    <summary>Ya atendidos (${hechos.length})</summary>
                    <ul class="renglones">${hechos.map(renglonTurno).join("")}</ul>
                </details>` : ""}
                ${filas.length ? `<ul class="renglones">${filas.sort((x, y) => x.m - y.m).map((f) => f.html).join("")}</ul>` : `<p class="nota">No queda nada por hoy.</p>`}
            </section>`;
        }).join("")}</div>`}`;

    const otraVez = () => vistaAgenda(cont, { usuario, datos, consulta });
    const hacer = (fn, mensaje) => {
        try {
            fn();
            if (mensaje) aviso(mensaje);
            otraVez();
        } catch (err) {
            aviso(err.message, "error");
        }
    };
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => (location.hash = `#/inicio?fecha=${b.dataset.dia}`)));
    cont.querySelectorAll("[data-ver]").forEach((b) => b.addEventListener("click", () => {
        ver = b.dataset.ver;
        otraVez();
    }));
    cont.querySelectorAll("[data-marcar]").forEach((b) => b.addEventListener("click", () =>
        hacer(() => datos.marcar(usuario, b.dataset.id, b.dataset.marcar), b.dataset.marcar === "llego" ? "Llegó" : "Faltó")));
    cont.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm("¿Cancelar este turno? El horario queda libre.")) return;
        hacer(() => datos.liberarTurno(usuario, b.dataset.cancelar), "Turno cancelado");
    }));
    cont.querySelectorAll("[data-recordar]").forEach((b) => b.addEventListener("click", () => {
        datos.marcarVisto(usuario, b.dataset.recordar);
        mostrarMensaje("Recordarle el turno", datos.recordatorio(b.dataset.recordar));
        otraVez();
    }));
    // "Ver": lleva al día del turno (si ya está en ese día, baja hasta él). Deja de ser nuevo cuando Leo hace algo con él.
    cont.querySelectorAll("[data-ir-nuevo]").forEach((b) => b.addEventListener("click", (e) => {
        const renglon = document.getElementById(`t-${b.dataset.irNuevo}`);
        if (renglon) {
            e.preventDefault();
            renglon.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }));
    // El primer turno nuevo del día, a la vista
    cont.querySelector(".renglon--nuevo")?.scrollIntoView({ block: "center" });
}

/** "+ Turno": cliente de la lista o nuevo (solo el nombre), servicio, barbero, día y hora libre. */
export function vistaNuevoTurno(cont, { usuario, datos, consulta }) {
    const dias = datos.dias().filter((d) => !d.cerrado);
    const estado = {
        fecha: dias.some((d) => d.fecha === consulta.get("fecha")) ? consulta.get("fecha") : dias[0]?.fecha,
        barberoId: BARBEROS.some((b) => b.id === consulta.get("barbero")) ? consulta.get("barbero") : BARBEROS[0].id,
        servicioId: "corte",
        inicio: Number(consulta.get("inicio")) || null,
        clienteId: consulta.get("cliente") ?? ""
    };
    const clientes = datos.listarClientes();

    cont.innerHTML = `
        <a class="volver" href="#/inicio?fecha=${esc(estado.fecha)}"><i class="ti ti-arrow-left"></i> Agenda</a>
        <h1 class="titulo">Anotar turno</h1>
        <form class="formulario bloque" novalidate>
            <label>Cliente
                <select name="cliente">
                    <option value="">Uno nuevo…</option>
                    ${clientes.map((c) => `<option value="${esc(c.id)}"${c.id === estado.clienteId ? " selected" : ""}>${esc(c.nombre)}</option>`).join("")}
                </select>
            </label>
            <label class="nombre-nuevo">Nombre (solo el nombre)<input name="nombre" maxlength="${TOPES.nombre}" placeholder="Ej: Ramiro" autocomplete="off"></label>
            <div class="formulario__fila">
                <label>Servicio<select name="servicio">${SERVICIOS.map((s) => `<option value="${esc(s.id)}">${esc(s.texto)} (${esc(s.duracion)} min)</option>`).join("")}</select></label>
                <label>Barbero<select name="barbero">${BARBEROS.map((b) => `<option value="${esc(b.id)}"${b.id === estado.barberoId ? " selected" : ""}>${esc(b.nombre)}</option>`).join("")}</select></label>
            </div>
            <div class="formulario__fila">
                <label>Día<select name="fecha">${dias.map((d) => `<option value="${esc(d.fecha)}"${d.fecha === estado.fecha ? " selected" : ""}>${esc(d.nombre[0].toUpperCase() + d.nombre.slice(1))}</option>`).join("")}</select></label>
                <label>Hora<select name="hora"></select></label>
            </div>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-plus"></i> Anotar</button>
        </form>`;
    const f = cont.querySelector("form");
    const pintarHoras = () => {
        const libres = datos.libresPara({ servicioId: f.servicio.value, barberoId: f.barbero.value, fecha: f.fecha.value });
        f.hora.innerHTML = libres.length
            ? libres.map((l) => `<option value="${l.inicio}"${l.inicio === estado.inicio ? " selected" : ""}>${esc(aHora(l.inicio))}</option>`).join("")
            : `<option value="">No quedan horarios</option>`;
    };
    const pintarNombre = () => (cont.querySelector(".nombre-nuevo").hidden = !!f.cliente.value);
    ["servicio", "barbero", "fecha"].forEach((n) => f[n].addEventListener("change", pintarHoras));
    f.cliente.addEventListener("change", pintarNombre);
    pintarHoras();
    pintarNombre();
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const t = datos.anotarTurno(usuario, {
                clienteId: f.cliente.value || null, nombreNuevo: f.nombre.value,
                servicioId: f.servicio.value, barberoId: f.barbero.value, fecha: f.fecha.value,
                inicio: f.hora.value === "" ? NaN : Number(f.hora.value)
            });
            aviso(`Turno anotado: ${t.cliente}, ${t.hora}`);
            location.hash = `#/inicio?fecha=${t.fecha}`;
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}
