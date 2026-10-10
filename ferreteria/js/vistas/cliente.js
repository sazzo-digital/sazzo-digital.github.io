// ============================================
// Lo de Marcos (plomero, cliente con cuenta corriente), desde el celular:
//   "Pedir presupuesto": escribe lo que necesita como habla, un artículo por renglón ("cano de 1/2 x 3", "teflon"),
//   y mientras escribe ve qué entendió la ferretería y el total aproximado; puede sumar "lo de la foto".
//   "Mis presupuestos": cómo va cada uno (pedido → te lo mandaron → aceptado → retirado), el PDF, "Aceptar" y su
//   cuenta corriente (lo que debe y los últimos movimientos).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=0f2d2843ae";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=0f2d2843ae";
import { TOPES, pesos, cantidadTexto } from "../datos.js?v=0f2d2843ae";
import { NEGOCIO } from "../marca.js?v=0f2d2843ae";
import { guia, activarGuias, pasos, pastillaEstado, cuando, validez, barraTope, haceDias, htmlFoto } from "./comunes.js?v=0f2d2843ae";
import { datosPdf } from "./presupuestos.js?v=0f2d2843ae";

// Lo que va escribiendo queda en memoria mientras se navega
const EJEMPLO = ["cano de 1/2 x 3", "4 codos de 1/2", "2 llaves de paso 1/2", "teflon"];
let borrador = null; // null = el de ejemplo
let conFoto = true;
let obra = null;

export function vistaPedirPresupuesto(cont, { usuario, datos, irA }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Pedir presupuesto</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: escribí como le hablás al de la ferretería, un artículo por renglón. Ya te dejamos un ejemplo; cambialo si querés y pedilo.</p>
        <button class="ticket-barra" type="button"></button>
        <div class="pedir-presupuesto">
            <form class="bloque formulario escribir" novalidate>
                <label>¿Qué necesitás? <small>(un artículo por renglón)</small>
                    <textarea name="lineas" rows="6" maxlength="${TOPES.texto * TOPES.renglones}" spellcheck="false" placeholder="Ej: cano de 1/2 x 3&#10;4 codos de 1/2&#10;teflon">${esc((borrador ?? EJEMPLO.join("\n")))}</textarea>
                </label>
                <label class="con-foto">
                    <input type="checkbox" name="foto"${conFoto ? " checked" : ""}>
                    <span><b>Sumar la foto de lo que se rompió</b><small>Si no sabés cómo se llama, mandá la foto: la ferretería te dice qué es.</small></span>
                </label>
                <div class="foto-lugar"${conFoto ? "" : " hidden"}>${htmlFoto()}</div>
                <label>¿Para qué obra? <small>(si querés)</small>
                    <input name="obra" maxlength="${TOPES.obra}" value="${esc(obra ?? "Baño planta alta")}">
                </label>
            </form>
            <section class="bloque formulario entendido" aria-live="polite">
                <h2 class="subtitulo"><i class="ti ti-list-details"></i> Lo que entendimos</h2>
                <ul class="renglones-entendidos"></ul>
                <div class="total"><span>Total aproximado</span><b data-total></b></div>
                <p class="nota" data-falta></p>
                <button class="boton boton--ancho boton--grande" type="button" data-pedir><i class="ti ti-send"></i> Pedir el presupuesto</button>
                <p class="nota"><i class="ti ti-info-circle"></i> La ferretería lo revisa, te lo manda con el precio final y lo aceptás desde acá. Va a tu cuenta corriente.</p>
            </section>
        </div>`;

    const form = cont.querySelector(".escribir");
    const lista = cont.querySelector(".renglones-entendidos");
    const barra = cont.querySelector(".ticket-barra");
    const lugarEntendido = cont.querySelector(".entendido");
    barra.addEventListener("click", () => lugarEntendido.scrollIntoView({ block: "start", behavior: "smooth" }));
    const lineas = () => form.lineas.value.split("\n");

    const actualizar = () => {
        let v;
        try {
            v = datos.verRenglones(lineas(), { foto: form.foto.checked });
        } catch (e) {
            lista.innerHTML = `<li class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(e.message)}</li>`;
            cont.querySelector("[data-total]").textContent = "—";
            cont.querySelector("[data-falta]").textContent = "";
            barra.innerHTML = `<i class="ti ti-list-details" aria-hidden="true"></i> Escribí lo que necesitás`;
            return;
        }
        lista.innerHTML = v.items.map((i) => `
            <li class="entendido__renglon${i.productoId ? "" : " entendido__renglon--suelto"}">
                <i class="ti ${i.productoId ? "ti-circle-check" : i.foto ? "ti-photo" : "ti-alert-circle"}" aria-hidden="true"></i>
                <span>${i.productoId
                    ? `<b>${esc(i.nombre)}</b><small>${esc(i.unidad === "u" ? `${i.cantidad} ×` : cantidadTexto(i.cantidad, i.unidad))} · escribiste “${esc(i.texto)}”</small>`
                    : `<b>${i.foto ? "Lo de la foto" : `“${esc(i.texto)}”`}</b><small>${i.foto ? "La ferretería mira la foto y te dice qué es" : "No lo encontramos: lo resuelve la ferretería"}</small>`}</span>
                <b class="monto">${i.productoId ? esc(pesos(i.subtotal)) : "a ver"}</b>
            </li>`).join("");
        cont.querySelector("[data-total]").textContent = pesos(v.total);
        cont.querySelector("[data-falta]").innerHTML = v.sinResolver ? `<i class="ti ti-info-circle"></i> Más ${v.sinResolver === 1 ? "lo que falta ver" : `los ${v.sinResolver} que faltan ver`}.` : "";
        barra.innerHTML = `<i class="ti ti-list-details" aria-hidden="true"></i> ${v.items.length} ${v.items.length === 1 ? "renglón" : "renglones"} · <b>${esc(pesos(v.total))}</b> <span>Pedir ↓</span>`;
    };
    let espera = null;
    form.lineas.addEventListener("input", () => {
        borrador = form.lineas.value;
        clearTimeout(espera);
        espera = setTimeout(actualizar, 200);
    });
    form.foto.addEventListener("change", () => {
        conFoto = form.foto.checked;
        cont.querySelector(".foto-lugar").hidden = !conFoto;
        actualizar();
    });
    form.obra.addEventListener("input", () => (obra = form.obra.value));
    form.addEventListener("submit", (e) => e.preventDefault());
    actualizar();

    cont.querySelector("[data-pedir]").addEventListener("click", () => {
        try {
            const pr = datos.nuevoPresupuesto(usuario, { lineas: lineas(), foto: form.foto.checked, obra: form.obra.value });
            borrador = null;
            obra = null;
            conFoto = true;
            pedido(pr);
        } catch (err) {
            aviso(err, "error");
        }
    });

    /** Después de pedirlo: el número, qué sigue y el paso del recorrido. */
    function pedido(pr) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">Presupuesto pedido</h1>
                <p>N° ${esc(pr.numero)}${pr.obra ? ` · ${esc(pr.obra)}` : ""} · ${esc(pr.items.length)} renglones</p>
                <p class="nota"><i class="ti ti-bell"></i> ${esc(NEGOCIO)} lo revisa${pr.sinResolver ? ", mira la foto" : ""} y te lo manda con el precio final.</p>
            </div>
            ${guia("u-empleado", `/presupuestos/${pr.id}`, "Mirá lo que le llega a Nahuel")}
            <a class="boton boton--secundario boton--ancho" href="#/mis-presupuestos"><i class="ti ti-list"></i> Ver mis presupuestos</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }
}

const QUE_PASA = {
    pedido: "La ferretería lo está armando. Te avisan cuando te lo manden.",
    enviado: "Te lo mandaron. Si te sirve, aceptalo y te lo preparan.",
    aceptado: "Lo aceptaste: te lo preparan para retirar. Va a tu cuenta corriente.",
    vendido: "Retirado. Quedó en tu cuenta corriente.",
    anulado: "Este presupuesto se anuló."
};

export function vistaMisPresupuestos(cont, { usuario, datos, irA }, recien = null) {
    const lista = datos.misPresupuestos(usuario);
    const c = datos.miCuenta(usuario);
    const otraVez = (r = null) => vistaMisPresupuestos(cont, { usuario, datos, irA }, r);
    cont.innerHTML = `
        <h1 class="titulo">Mis presupuestos</h1>
        <details class="bloque mi-cuenta">
            <summary>
                <span><i class="ti ti-user-dollar" aria-hidden="true"></i> Mi cuenta en ${esc(NEGOCIO)}</span>
                <b class="monto">${esc(pesos(c.deuda))}</b>
            </summary>
            ${barraTope(c)}
            <p class="tarjeta__quien">${c.deuda > 0 ? `Debés desde ${esc(haceDias(c.desde))}` : "No debés nada"} · límite ${esc(pesos(c.tope))}</p>
            <ul class="movimientos">${c.movimientos.slice(0, 6).map((m) => `
                <li class="movimiento movimiento--${esc(m.tipo)}">
                    <span><b>${m.tipo === "compra" ? "Compra" : `Pagaste (${esc(m.medio)})`}</b>${m.que ? `<small>${esc(m.que)}</small>` : ""}<small>${esc(cuando(m.fecha))}</small></span>
                    <b class="monto">${m.tipo === "compra" ? "+" : "−"} ${esc(pesos(m.monto))}</b>
                </li>`).join("")}</ul>
        </details>
        ${lista.length ? lista.map((pr) => `
        <section class="bloque mi-presupuesto">
            <div class="tarjeta__fila">
                <h2 class="subtitulo"><i class="ti ti-file-text"></i> N° ${esc(pr.numero)}${pr.obra ? ` · ${esc(pr.obra)}` : ""}</h2>
                ${pastillaEstado(pr.estado, pr.vencido)}
            </div>
            <p class="tarjeta__quien">Pedido ${esc(cuando(pr.creado))}${pr.vence && pr.estado !== "vendido" ? ` · ${esc(validez(pr))}` : ""}</p>
            ${pasos(pr, { cliente: true })}
            ${recien === pr.id ? `<p class="alerta alerta--info"><i class="ti ti-thumb-up"></i> ¡Aceptado! Nahuel te lo prepara y va a tu cuenta.</p>` : ""}
            ${recien === pr.id ? "" : `<p class="nota mi-presupuesto__estado"><i class="ti ti-info-circle"></i> ${esc(pr.vencido ? "Venció: pedile a la ferretería que lo actualice." : QUE_PASA[pr.estado])}</p>`}
            <div class="total"><span>${pr.estado === "pedido" ? "Aproximado" : "Total"}</span><b>${esc(pesos(pr.total))}</b></div>
            <details class="desplegable">
                <summary>Ver los ${esc(pr.items.length)} renglones</summary>
                <ul class="movimientos">${pr.items.map((i) => `
                    <li class="movimiento">
                        <span><b>${i.productoId ? esc(i.nombre) : i.foto ? "Lo de la foto" : `“${esc(i.texto)}”`}</b><small>${i.productoId ? `${esc(i.unidad === "u" ? `${i.cantidad} × ${pesos(i.precioUsado)}` : `${cantidadTexto(i.cantidad, i.unidad)} × ${pesos(i.precioUsado)}`)}` : "Lo ve la ferretería"}</small></span>
                        <b class="monto">${i.productoId ? esc(pesos(i.subtotal)) : "—"}</b>
                    </li>`).join("")}</ul>
            </details>
            <div class="acciones">
                ${pr.estado === "enviado" && !pr.vencido ? `<button class="boton" type="button" data-aceptar="${esc(pr.id)}"><i class="ti ti-thumb-up"></i> Aceptar el presupuesto</button>` : ""}
                ${["enviado", "aceptado", "vendido"].includes(pr.estado) ? `<button class="boton boton--secundario" type="button" data-pdf="${esc(pr.id)}"><i class="ti ti-file-type-pdf"></i> PDF</button>` : ""}
            </div>
            ${pr.estado === "pedido" ? guia("u-empleado", `/presupuestos/${pr.id}`, "Mirá lo que le llega a Nahuel") : ""}
            ${recien === pr.id ? guia("u-empleado", `/presupuestos/${pr.id}`, "Pasá a Nahuel: que lo pase a venta") : ""}
        </section>`).join("")
        : `${vacio("Todavía no pediste ningún presupuesto.", "ti-file-text")}<p class="sin-pedidos"><a class="boton" href="#/inicio"><i class="ti ti-clipboard-list"></i> Pedir un presupuesto</a></p>`}`;

    cont.querySelectorAll("[data-aceptar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const pr = datos.aceptarPresupuesto(usuario, b.dataset.aceptar);
            aviso(`Presupuesto N° ${pr.numero} aceptado`);
            otraVez(pr.id);
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelectorAll("[data-pdf]").forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        try {
            const pr = datos.misPresupuestos(usuario).find((x) => x.id === b.dataset.pdf);
            const blob = await armarPdf(datosPdf(pr));
            if (cont.isConnected) pdfListo(blob, `Presupuesto ${pr.numero} ${NEGOCIO}`);
        } catch (e) {
            console.warn(e);
            aviso("No se pudo armar el PDF. Probá de nuevo con mejor señal.", "error");
        } finally {
            b.disabled = false;
        }
    }));
    activarGuias(cont, irA);
}
