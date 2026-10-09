// ============================================
// Fiados: la libreta. Quién debe, cuánto y desde cuándo; anotar un cliente nuevo; en la ficha, cobrar (todo o una
// parte) y ver qué se llevó en cada fiado. El tope de cada cliente lo cambia el dueño.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=04c5d739b2";
import { diaLocalDe, fechaLocalISO } from "../../kit/js/fechas.js?v=04c5d739b2";
import { TOPES, pesos } from "../datos.js?v=04c5d739b2";
import { haceDias, hora } from "./comunes.js?v=04c5d739b2";

const barraTope = (c) => {
    const pct = c.tope ? Math.min(100, Math.round((c.deuda / c.tope) * 100)) : 100;
    const nivel = pct >= 90 ? "mal" : pct >= 70 ? "ojo" : "bien";
    return `<span class="tope tope--${nivel}" title="${pct} % del tope"><span style="width:${pct}%"></span></span>`;
};

export function vistaFiados(cont, { usuario, datos }) {
    const clientes = datos.listarClientes();
    const total = clientes.reduce((t, c) => t + c.deuda, 0);
    cont.innerHTML = `
        <h1 class="titulo">Fiados</h1>
        <div class="panel resumen-fiados">
            <span class="panel__rotulo">Te deben en total</span>
            <span class="panel__numero">${esc(pesos(total))}</span>
            <small>${clientes.filter((c) => c.deuda > 0).length} de ${clientes.length} clientes de la libreta</small>
        </div>
        <ul class="tarjetas">${clientes.map((c) => `
            <li><a class="tarjeta tarjeta--link" href="#/fiados/${esc(c.id)}">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ti-user" aria-hidden="true"></i>${esc(c.nombre)}${c.detalle ? ` <small>(${esc(c.detalle)})</small>` : ""}</span>
                    <b class="monto${c.deuda > 0 ? "" : " monto--cero"}">${esc(pesos(c.deuda))}</b>
                </div>
                ${barraTope(c)}
                <p class="tarjeta__quien">${c.deuda > 0 ? `Debe desde ${esc(haceDias(c.desde))}` : "No debe nada"} · tope ${esc(pesos(c.tope))}</p>
            </a></li>`).join("")}
        </ul>
        <details class="bloque nuevo-cliente">
            <summary><i class="ti ti-user-plus"></i> Anotar un cliente nuevo</summary>
            <form class="formulario" novalidate>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" required></label>
                <label>Para reconocerlo (si querés)<input name="detalle" maxlength="${TOPES.detalle}" placeholder="Ej: el del 2° A"></label>
                <button class="boton" type="submit"><i class="ti ti-plus"></i> Anotar</button>
                <p class="nota"><i class="ti ti-info-circle"></i> Arranca con un tope de ${esc(pesos(30_000))}${usuario.rol === "dueno" ? " (lo podés cambiar en su ficha)" : " (lo cambia Rubén)"}.</p>
            </form>
        </details>`;

    cont.querySelector(".nuevo-cliente form").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const c = datos.nuevoCliente(usuario, { nombre: e.target.nombre.value, detalle: e.target.detalle.value });
            aviso(`${c.nombre} anotado en la libreta`);
            location.hash = `#/fiados/${c.id}`;
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

export function vistaCliente(cont, { usuario, datos, params: [id] }) {
    const c = datos.cliente(id);
    const dueno = usuario.rol === "dueno";
    cont.innerHTML = `
        <a class="volver" href="#/fiados"><i class="ti ti-arrow-left"></i> Fiados</a>
        <h1 class="titulo">${esc(c.nombre)}${c.detalle ? ` <small class="titulo__extra">${esc(c.detalle)}</small>` : ""}</h1>
        <div class="panel resumen-fiados">
            <span class="panel__rotulo">Debe</span>
            <span class="panel__numero">${esc(pesos(c.deuda))}</span>
            ${barraTope(c)}
            <small>Tope ${esc(pesos(c.tope))}${c.deuda > 0 ? ` · debe desde ${esc(haceDias(c.desde))}` : ""}</small>
        </div>
        ${c.deuda > 0 ? `
        <form class="formulario bloque cobrar-fiado" novalidate>
            <h2 class="subtitulo"><i class="ti ti-cash"></i> Cobrar</h2>
            <div class="formulario__fila">
                <label>¿Cuánto paga?
                    <span class="km__fila">
                        <input name="monto" type="number" inputmode="numeric" min="1" max="${esc(c.deuda)}" step="1" placeholder="Ej: 5000">
                        <button class="boton boton--secundario" type="button" data-todo>Todo</button>
                    </span>
                </label>
                <label>¿Cómo?
                    <select name="medio"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select>
                </label>
            </div>
            <button class="boton" type="submit"><i class="ti ti-check"></i> Cobrar</button>
        </form>` : ""}
        ${dueno ? `
        <form class="formulario bloque cambiar-tope" novalidate>
            <label>Tope de fiado
                <span class="km__fila">
                    <input name="tope" type="number" inputmode="numeric" min="0" max="${TOPES.tope}" step="1" value="${esc(c.tope)}">
                    <button class="boton boton--secundario" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                </span>
            </label>
        </form>` : ""}
        <h2 class="subtitulo"><i class="ti ti-notebook"></i> La libreta</h2>
        ${c.movimientos.length ? `<ul class="movimientos">${c.movimientos.map((m) => `
            <li class="movimiento movimiento--${esc(m.tipo)}">
                <span><b>${m.tipo === "fiado" ? "Fiado" : `Pagó (${esc(m.medio)})`}</b>${m.que ? `<small>${esc(m.que)}</small>` : ""}<small>${esc(cuando(m.fecha))} · ${esc(m.por)}</small></span>
                <b class="monto">${m.tipo === "fiado" ? "+" : "−"} ${esc(pesos(m.monto))}</b>
            </li>`).join("")}</ul>` : vacio("Todavía no tiene movimientos.", "ti-notebook")}`;

    const f = cont.querySelector(".cobrar-fiado");
    f?.querySelector("[data-todo]").addEventListener("click", () => (f.monto.value = c.deuda));
    f?.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const r = datos.cobrarFiado(usuario, c.id, { monto: f.monto.value === "" ? NaN : Number(f.monto.value), medio: f.medio.value });
            aviso(r.deuda ? `Cobrado. ${r.nombre} debe ahora ${pesos(r.deuda)}` : `Cobrado. ${r.nombre} no debe nada`);
            vistaCliente(cont, { usuario, datos, params: [id] });
        } catch (err) {
            aviso(err.message, "error");
        }
    });
    cont.querySelector(".cambiar-tope")?.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.cambiarTope(usuario, c.id, e.target.tope.value === "" ? NaN : Number(e.target.tope.value));
            aviso("Tope guardado");
            vistaCliente(cont, { usuario, datos, params: [id] });
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

/** "hoy 15:20" o "06/10/2026". */
const cuando = (iso) => (diaLocalDe(iso) === fechaLocalISO(0) ? `hoy ${hora(iso)}` : fechaCorta(diaLocalDe(iso)));
