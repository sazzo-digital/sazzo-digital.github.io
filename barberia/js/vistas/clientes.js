// ============================================
// Clientes (barbero): buscador, "no vuelven hace más de 30 / 45 / 60 días" con "Invitarlo" (mensaje para copiar y
// la fecha en que se lo invitó), y la ficha de cada uno: qué se hace siempre, notas, historial y "Sacarle turno".
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=5df3c0c0d4";
import { NO_VUELVEN, TOPES, nombreFecha } from "../datos.js?v=5df3c0c0d4";
import { mostrarMensaje } from "./comunes.js?v=5df3c0c0d4";

let noVuelven = null; // null = todos; si no, los días
let texto = "";

const haceDias = (n) => (n === null ? "Todavía no vino" : n === 0 ? "Vino hoy" : n === 1 ? "Vino ayer" : `Hace ${n} días que no viene`);

export function vistaClientes(cont, { usuario, datos }) {
    const contar = (dias) => datos.listarClientes({ noVuelven: dias }).length;
    cont.innerHTML = `
        <h1 class="titulo">Clientes</h1>
        <label class="buscador">
            <i class="ti ti-search" aria-hidden="true"></i>
            <span class="solo-lector">Buscar cliente</span>
            <input type="search" name="q" maxlength="40" placeholder="Buscar por nombre" value="${esc(texto)}" autocomplete="off">
        </label>
        <div class="chips filtros-clientes" role="tablist" aria-label="Filtro">
            <button class="chip${noVuelven ? "" : " activo"}" type="button" data-nv="">Todos</button>
            ${NO_VUELVEN.map((d) => `<button class="chip chip--alerta${noVuelven === d ? " activo" : ""}" type="button" data-nv="${d}">No vuelven hace +${d} días <b>${contar(d)}</b></button>`).join("")}
        </div>
        ${noVuelven ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Estos hace rato que no vienen y no tienen turno. Invitalos a volver.</p>` : ""}
        <ul class="tarjetas lista-clientes"></ul>`;

    const lista = cont.querySelector(".lista-clientes");
    function pintar() {
        const clientes = datos.listarClientes({ texto, noVuelven });
        lista.innerHTML = clientes.length ? clientes.map((c) => `
            <li class="tarjeta tarjeta--abre${noVuelven ? " tarjeta--alerta" : ""}">
                <div class="tarjeta__fila">
                    <a class="tarjeta__titulo" href="#/clientes/${esc(c.id)}"><i class="ti ti-user" aria-hidden="true"></i>${esc(c.nombre)}</a>
                    ${c.proximo ? `<span class="pastilla pastilla--bien">Turno ${esc(nombreFecha(c.proximo.fecha))} ${esc(c.proximo.hora)}</span>` : ""}
                </div>
                <p class="tarjeta__quien">${esc(haceDias(c.sinVenir))}${c.cada ? ` · suele venir cada ${esc(c.cada)} días` : ""}</p>
                ${noVuelven ? `
                <div class="tarjeta__pie">
                    <small>${c.invitadoEn ? `Lo invitaste el ${esc(fechaCorta(c.invitadoEn.slice(0, 10)))}` : "Todavía no lo invitaste"}</small>
                    <button class="boton boton--chico" type="button" data-invitar="${esc(c.id)}"${c.invitadoEn ? " disabled" : ""}><i class="ti ti-message-circle"></i> Invitarlo</button>
                </div>` : ""}
            </li>`).join("") : `<li>${vacio(noVuelven ? "Nadie hace tanto que no viene. ¡Bien!" : "No hay clientes con ese nombre.", "ti-users")}</li>`;
        lista.querySelectorAll("[data-invitar]").forEach((b) => b.addEventListener("click", () => {
            try {
                const r = datos.invitar(usuario, b.dataset.invitar);
                mostrarMensaje(`Invitar a ${r.cliente.nombre}`, r.mensaje);
                pintar();
            } catch (err) {
                aviso(err, "error");
            }
        }));
    }

    cont.querySelector("[name=q]").addEventListener("input", (e) => {
        texto = e.target.value;
        pintar();
    });
    cont.querySelectorAll("[data-nv]").forEach((b) => b.addEventListener("click", () => {
        noVuelven = b.dataset.nv ? Number(b.dataset.nv) : null;
        vistaClientes(cont, { usuario, datos });
    }));
    pintar();
}

export function vistaFicha(cont, { usuario, datos, params: [id] }) {
    const c = datos.cliente(id);
    cont.innerHTML = `
        <a class="volver" href="#/clientes"><i class="ti ti-arrow-left"></i> Clientes</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(c.nombre)}</h1>
            <a class="boton boton--chico" href="#/nuevo?cliente=${esc(c.id)}"><i class="ti ti-calendar-plus"></i> Sacarle turno</a>
        </div>
        <div class="datos-cliente">
            <div><span>Última visita</span><b>${c.ultima ? esc(fechaCorta(c.ultima)) : "—"}</b><small>${esc(haceDias(c.sinVenir))}</small></div>
            <div><span>Suele venir cada</span><b>${c.cada ? `${esc(c.cada)} días` : "—"}</b><small>${esc(c.visitas)} visitas</small></div>
            <div><span>Próximo turno</span><b>${c.proximo ? `${esc(nombreFecha(c.proximo.fecha))} ${esc(c.proximo.hora)}` : "—"}</b><small>${c.proximo ? `con ${esc(c.proximo.barbero)}` : c.invitadoEn ? `invitado el ${esc(fechaCorta(c.invitadoEn.slice(0, 10)))}` : ""}</small></div>
        </div>
        <form class="formulario bloque" novalidate>
            <label>Qué se hace siempre
                <input name="siempre" maxlength="${TOPES.siempre}" value="${esc(c.siempre)}" placeholder="Ej: degradé bajo, costados al 1, arriba tijera">
            </label>
            <label>Notas
                <textarea name="notas" rows="2" maxlength="${TOPES.notas}" placeholder="Ej: viene con el hijo los sábados">${esc(c.notas)}</textarea>
            </label>
            <button class="boton boton--secundario" type="submit"><i class="ti ti-device-floppy"></i> Guardar ficha</button>
        </form>
        <h2 class="subtitulo"><i class="ti ti-history"></i> Visitas</h2>
        ${c.historial.length ? `<ul class="tarjetas">${c.historial.map((t) => `
            <li class="tarjeta tarjeta--chica">
                <div class="tarjeta__fila">
                    <span><b>${esc(fechaCorta(t.fecha))}</b> · ${esc(t.servicio)} con ${esc(t.barbero)}</span>
                    ${t.estado === "falto" ? `<span class="pastilla pastilla--mal">Faltó</span>` : ""}
                </div>
            </li>`).join("")}</ul>` : vacio("Todavía no vino.", "ti-history")}`;
    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.guardarFicha(usuario, c.id, { siempre: e.target.siempre.value, notas: e.target.notas.value });
            aviso("Ficha guardada");
        } catch (err) {
            aviso(err, "error");
        }
    });
}
