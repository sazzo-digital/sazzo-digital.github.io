// ============================================
// Cuentas corrientes (los del oficio que compran todo el mes y pagan después): quién debe, cuánto, hace cuánto que
// no paga y cuánto del tope usó. En la ficha: el recordatorio armado para mandarle, anotar un pago (todo o una parte),
// el tope (lo cambia el dueño) y qué se llevó en cada compra. El dueño abre cuentas nuevas.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=0f2d2843ae";
import { mostrarMensaje } from "../../kit/js/mensaje.js?v=0f2d2843ae";
import { TOPES, TOPE_CUENTA_NUEVA, pesos } from "../datos.js?v=0f2d2843ae";
import { barraTope, haceDias, diasDesde, cuando } from "./comunes.js?v=0f2d2843ae";

const DIAS_ATRASADO = 30; // desde cuántos días sin pagar se marca

export function vistaCuentas(cont, { usuario, datos }) {
    const cuentas = datos.listarCuentas(usuario);
    const total = cuentas.reduce((t, c) => t + c.deuda, 0);
    const atrasada = cuentas.find((c) => c.deuda > 0 && diasDesde(c.desde) >= DIAS_ATRASADO);
    const dueno = usuario.rol === "dueno";
    cont.innerHTML = `
        <h1 class="titulo">Cuentas corrientes</h1>
        <div class="panel resumen-cuentas">
            <span class="panel__rotulo">Te deben en total</span>
            <span class="panel__numero">${esc(pesos(total))}</span>
            <small>${cuentas.filter((c) => c.deuda > 0).length} de ${cuentas.length} cuentas</small>
        </div>
        ${atrasada ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> ${esc(atrasada.nombre.split(" ")[0])} no paga hace ${esc(diasDesde(atrasada.desde))} días y está cerca del tope: entrá y mandale el recordatorio armado.</p>` : ""}
        ${cuentas.length ? `<ul class="tarjetas">${cuentas.map((c) => {
            const dias = diasDesde(c.desde);
            return `
            <li><a class="tarjeta tarjeta--link" href="#/cuentas/${esc(c.id)}">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ti-user" aria-hidden="true"></i>${esc(c.nombre)}${c.oficio ? ` <small>(${esc(c.oficio)})</small>` : ""}</span>
                    <b class="monto${c.deuda > 0 ? "" : " monto--cero"}">${esc(pesos(c.deuda))}</b>
                </div>
                ${barraTope(c)}
                <p class="tarjeta__quien">${c.deuda > 0 ? `Debe desde ${esc(haceDias(c.desde))}${dias >= DIAS_ATRASADO ? ` · <span class="falta">no paga hace ${esc(dias)} días</span>` : ""}` : "Al día: no debe nada"} · tope ${esc(pesos(c.tope))}</p>
            </a></li>`;
        }).join("")}</ul>` : vacio("Todavía no hay cuentas corrientes.", "ti-user-dollar")}
        ${dueno ? `
        <details class="bloque nueva-cuenta">
            <summary><i class="ti ti-user-plus"></i> Abrir una cuenta</summary>
            <form class="formulario" novalidate>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" required placeholder="Ej: Hugo Medina"></label>
                <label>Oficio (si querés)<input name="oficio" maxlength="30" placeholder="Ej: Gasista"></label>
                <label>Tope<input name="tope" type="number" inputmode="numeric" min="0" max="${TOPES.tope}" step="1" value="${TOPE_CUENTA_NUEVA}"></label>
                <button class="boton" type="submit"><i class="ti ti-plus"></i> Abrir la cuenta</button>
            </form>
        </details>` : `<p class="nota"><i class="ti ti-info-circle"></i> Las cuentas nuevas y los topes los maneja Osvaldo.</p>`}`;

    cont.querySelector(".nueva-cuenta form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        try {
            const c = datos.nuevaCuenta(usuario, { nombre: f.nombre.value, oficio: f.oficio.value, tope: f.tope.value === "" ? NaN : Number(f.tope.value) });
            aviso(`Cuenta de ${c.nombre} abierta`);
            location.hash = `#/cuentas/${c.id}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}

export function vistaCuenta(cont, { usuario, datos, params: [id] }) {
    const c = datos.cuenta(usuario, id);
    const dueno = usuario.rol === "dueno";
    const otraVez = () => vistaCuenta(cont, { usuario, datos, params: [id] });
    const dias = diasDesde(c.desde);
    cont.innerHTML = `
        <a class="volver" href="#/cuentas"><i class="ti ti-arrow-left"></i> Cuentas corrientes</a>
        <h1 class="titulo">${esc(c.nombre)}${c.oficio ? ` <small class="titulo__extra">${esc(c.oficio)}</small>` : ""}</h1>
        <div class="panel resumen-cuentas">
            <span class="panel__rotulo">Debe</span>
            <span class="panel__numero">${esc(pesos(c.deuda))}</span>
            ${barraTope(c)}
            <small>Tope ${esc(pesos(c.tope))}${c.deuda > 0 ? ` · debe desde ${esc(haceDias(c.desde))}` : ""}</small>
        </div>
        ${c.deuda > 0 ? `
        <div class="acciones acciones-cuenta">
            <button class="boton${dias >= DIAS_ATRASADO ? "" : " boton--secundario"}" type="button" data-recordar><i class="ti ti-message-circle"></i> Mandarle el recordatorio</button>
        </div>
        <form class="formulario bloque cobrar-cuenta" novalidate>
            <h2 class="subtitulo"><i class="ti ti-cash"></i> Anotar un pago</h2>
            <div class="formulario__fila">
                <label>¿Cuánto paga?
                    <span class="km__fila">
                        <input name="monto" type="number" inputmode="numeric" min="1" max="${esc(c.deuda)}" step="1" placeholder="Ej: 50000">
                        <button class="boton boton--secundario" type="button" data-todo>Todo</button>
                    </span>
                </label>
                <label>¿Cómo?
                    <select name="medio"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select>
                </label>
            </div>
            <button class="boton" type="submit"><i class="ti ti-check"></i> Anotar el pago</button>
        </form>` : `<p class="nota"><i class="ti ti-circle-check"></i> Está al día.</p>`}
        ${dueno ? `
        <form class="formulario bloque cambiar-tope" novalidate>
            <label>Tope de la cuenta
                <span class="km__fila">
                    <input name="tope" type="number" inputmode="numeric" min="0" max="${TOPES.tope}" step="1" value="${esc(c.tope)}">
                    <button class="boton boton--secundario" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                </span>
            </label>
        </form>` : ""}
        <h2 class="subtitulo"><i class="ti ti-notebook"></i> Movimientos</h2>
        ${c.movimientos.length ? `<ul class="movimientos">${c.movimientos.map((m) => `
            <li class="movimiento movimiento--${esc(m.tipo)}">
                <span><b>${m.tipo === "compra" ? "Compra" : `Pagó (${esc(m.medio)})`}</b>${m.que ? `<small>${esc(m.que)}</small>` : ""}<small>${esc(cuando(m.fecha))} · ${esc(m.por)}</small></span>
                <b class="monto">${m.tipo === "compra" ? "+" : "−"} ${esc(pesos(m.monto))}</b>
            </li>`).join("")}</ul>` : vacio("Todavía no tiene movimientos.", "ti-notebook")}`;

    cont.querySelector("[data-recordar]")?.addEventListener("click", () => {
        try {
            mostrarMensaje(`Recordatorio a ${c.nombre.split(" ")[0]}`, datos.mensajeCuenta(usuario, c.id));
        } catch (err) {
            aviso(err, "error");
        }
    });
    const f = cont.querySelector(".cobrar-cuenta");
    f?.querySelector("[data-todo]").addEventListener("click", () => (f.monto.value = c.deuda));
    f?.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const r = datos.cobrarCuenta(usuario, c.id, { monto: f.monto.value === "" ? NaN : Number(f.monto.value), medio: f.medio.value });
            aviso(r.deuda ? `Anotado. ${r.nombre} debe ahora ${pesos(r.deuda)}` : `Anotado. ${r.nombre} quedó al día`);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector(".cambiar-tope")?.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.cambiarTope(usuario, c.id, e.target.tope.value === "" ? NaN : Number(e.target.tope.value));
            aviso("Tope guardado");
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    });
}
