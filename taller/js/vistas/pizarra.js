// ============================================
// La pizarra del taller (inicio): los autos que están adentro, por estado, con los contadores de arriba. En la compu,
// una columna por estado; en el celu, uno abajo del otro con pastillas para filtrar. El mecánico ve solo sus autos.
// "+ Entró un auto": se escribe la patente y, si ya vino, completa solo el auto, el cliente y la última vez.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=a3a89a6efc";
import { fechaLocalISO } from "../../kit/js/fechas.js?v=a3a89a6efc";
import { TOPES, NAFTA, MECANICOS, esPatente, formatoPatente } from "../datos.js?v=a3a89a6efc";
import { NEGOCIO } from "../marca.js?v=a3a89a6efc";
import { guia, activarGuias, chapa, pastillaEstado, textoPromesa } from "./comunes.js?v=a3a89a6efc";

let filtro = "todos";

export function vistaPizarra(cont, { usuario, datos }) {
    const p = datos.pizarra(usuario);
    const dueno = usuario.rol === "dueno";
    const grupos = p.grupos.filter((g) => filtro === "todos" || g.estado === filtro);
    const tarjeta = (o) => `
        <li><a class="orden${o.estado === "listo" && !o.avisado ? " orden--avisar" : ""}" href="#/orden/${esc(o.id)}">
            <span class="orden__fila">${chapa(o.auto.patenteTexto)}<small>N° ${esc(o.numero)}</small></span>
            <b>${esc(o.auto.modelo)}</b>
            <small>${esc(o.cliente.nombre)}${dueno ? ` · ${esc(o.mecanico)}` : ""}</small>
            <span class="orden__dijo">“${esc(o.dijo)}”</span>
            <span class="orden__pie">${pastillaEstado(o)}<small>${textoPromesa(o)}</small></span>
        </a></li>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">${dueno ? "Taller" : "Mis autos"}</h1>
            ${dueno ? `<a class="boton" href="#/entro"><i class="ti ti-car"></i> Entró un auto</a>` : `<span class="negocio"><i class="ti ti-tool"></i>${esc(NEGOCIO)}</span>`}
        </div>
        ${dueno ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> <span>Probá: tocá "Entró un auto" y escribí la patente AB&nbsp;123&nbsp;CD.</span></p>` : ""}
        <div class="tira">
            <span><b>${esc(p.contadores.adentro)}</b> adentro</span>
            <span><b>${esc(p.contadores.reparacion)}</b> en reparación</span>
            <span><b>${esc(p.contadores.esperando)}</b> esperando repuesto</span>
            ${dueno ? `<span class="${p.contadores.sinAvisar ? "tira__alerta" : ""}"><b>${esc(p.contadores.sinAvisar)}</b> ${p.contadores.sinAvisar === 1 ? "listo sin avisar" : "listos sin avisar"}</span>` : ""}
        </div>
        <div class="chips" role="tablist" aria-label="Estado">
            <button class="chip${filtro === "todos" ? " activo" : ""}" type="button" data-filtro="todos">Todos</button>
            ${p.grupos.map((g) => `<button class="chip${filtro === g.estado ? " activo" : ""}" type="button" data-filtro="${esc(g.estado)}">${esc(g.texto)} <b>${g.ordenes.length}</b></button>`).join("")}
        </div>
        <div class="pizarra${filtro === "todos" ? "" : " pizarra--una"}">${grupos.map((g) => `
            <section class="pizarra__columna">
                <h2 class="pizarra__titulo">${esc(g.texto)} <span>${g.ordenes.length}</span></h2>
                ${g.ordenes.length ? `<ul class="ordenes">${g.ordenes.map(tarjeta).join("")}</ul>` : `<p class="pizarra__vacio">—</p>`}
            </section>`).join("")}
        </div>`;

    cont.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => {
        filtro = b.dataset.filtro;
        vistaPizarra(cont, { usuario, datos });
    }));
}

/** "+ Entró un auto" (el dueño). */
export function vistaEntro(cont, { usuario, datos, irA, consulta }) {
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Taller</a>
        <h1 class="titulo">Entró un auto</h1>
        <form class="formulario bloque" novalidate>
            <label class="patente-campo">Patente
                <input name="patente" maxlength="12" placeholder="AB 123 CD" autocomplete="off" autocapitalize="characters">
            </label>
            <div class="reconocido" aria-live="polite"></div>
            <div class="primera-vez" hidden>
                <div class="formulario__fila">
                    <label>Auto (marca y modelo)<input name="modelo" maxlength="${TOPES.nombre}" placeholder="Ej: Fiat Uno"></label>
                    <label>Cliente<input name="cliente" maxlength="${TOPES.nombre}" placeholder="Nombre y apellido"></label>
                </div>
            </div>
            <label>¿Qué le pasa? (con las palabras del cliente)
                <textarea name="dijo" rows="2" maxlength="${TOPES.texto}" placeholder="Ej: hace ruido al frenar"></textarea>
            </label>
            <div class="formulario__fila formulario__fila--3">
                <label>Kilómetros<input name="km" type="number" inputmode="numeric" min="0" max="${TOPES.km}" step="1"></label>
                <label>Nafta<select name="nafta">${NAFTA.map((n) => `<option${n === "1/2" ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
                <label>Para cuándo<input name="prometida" type="date" min="${fechaLocalISO(0)}" max="${fechaLocalISO(TOPES.diasPromesa)}" value="${fechaLocalISO(2)}"></label>
            </div>
            <div class="formulario__fila">
                <label>Qué deja en el auto (si querés)<input name="deja" maxlength="${TOPES.deja}" placeholder="Ej: rueda de auxilio, cargador"></label>
                <label>Mecánico<select name="mecanico">${MECANICOS.map((m) => `<option value="${esc(m.id)}">${esc(m.nombre)}</option>`).join("")}</select></label>
            </div>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-check"></i> Guardar orden</button>
        </form>`;

    const f = cont.querySelector("form");
    const reconocido = cont.querySelector(".reconocido");
    const primeraVez = cont.querySelector(".primera-vez");
    f.patente.addEventListener("input", () => {
        const t = f.patente.value;
        if (!esPatente(t)) {
            reconocido.innerHTML = "";
            primeraVez.hidden = true;
            return;
        }
        const r = datos.buscarPatente(t);
        if (r) {
            const u = r.ultima;
            reconocido.innerHTML = `
                <div class="volvio">
                    <i class="ti ti-history" aria-hidden="true"></i>
                    <span><b>Volvió el ${esc(r.auto.modelo)} de ${esc(r.cliente.nombre)}</b>
                    ${u ? `<small>La última vez: ${esc(u.que)}, hace ${esc(u.meses)} ${u.meses === 1 ? "mes" : "meses"} (${esc(u.km.toLocaleString("es-AR"))} km).</small>` : ""}
                    ${r.abierta ? `<small class="atrasado">Ya está adentro: orden N° ${esc(r.abierta.numero)}.</small>` : ""}</span>
                </div>`;
            primeraVez.hidden = true;
            if (!f.km.value) f.km.value = r.auto.km;
            f.dijo.focus();
        } else {
            reconocido.innerHTML = `<p class="nota"><i class="ti ti-sparkles"></i> Es la primera vez que viene ${esc(formatoPatente(t))}: completá el auto y el cliente.</p>`;
            primeraVez.hidden = false;
        }
    });
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const o = datos.entroUnAuto(usuario, {
                patente: f.patente.value, modelo: f.modelo.value, clienteNombre: f.cliente.value,
                km: f.km.value === "" ? NaN : Number(f.km.value), nafta: f.nafta.value, deja: f.deja.value,
                dijo: f.dijo.value, prometida: f.prometida.value, mecanicoId: f.mecanico.value
            });
            cont.innerHTML = `
                <div class="hecho">
                    <i class="ti ti-circle-check" aria-hidden="true"></i>
                    <h1 class="titulo">Orden N° ${esc(o.numero)}</h1>
                    <p>${chapa(o.auto.patenteTexto)} ${esc(o.auto.modelo)} de ${esc(o.cliente.nombre)}</p>
                    <p class="nota">“${esc(o.dijo)}” · se la diste a ${esc(o.mecanico)}</p>
                </div>
                ${o.mecanico === "Seba" ? guia("u-mecanico", `/orden/${o.id}`, "Mirá lo que le llega a Seba") : ""}
                <a class="boton boton--secundario boton--ancho" href="#/orden/${esc(o.id)}"><i class="ti ti-file-text"></i> Ver la orden</a>`;
            activarGuias(cont, irA);
            aviso("Orden guardada");
        } catch (err) {
            aviso(err.message, "error");
        }
    });
    f.patente.focus();
    // Por si llegó con la patente escrita (#/entro?patente=…) desde el historial de un auto
    const pedida = consulta.get("patente");
    if (pedida) {
        f.patente.value = pedida;
        f.patente.dispatchEvent(new Event("input"));
    }
}

