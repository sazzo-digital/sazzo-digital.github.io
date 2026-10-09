// ============================================
// Lo de Paula (clienta), desde el celular: elegir la lista del colegio, destildar lo que ya tiene en casa, ver el total
// y pedirla; después, en "Mis pedidos", ver cómo va (pedida → separada → retirada).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=e4d4e57de1";
import { TOPES, pesos } from "../datos.js?v=e4d4e57de1";
import { NEGOCIO } from "../marca.js?v=e4d4e57de1";
import { guia, activarGuias, pasos, pastillaEstado, cuando } from "./comunes.js?v=e4d4e57de1";

// La lista elegida y lo destildado quedan en memoria mientras se navega
let listaId = "l-1";
const sin = new Set();
let para = null; // null = el de ejemplo

const PARA_DE_EJEMPLO = "Lola";

export function vistaPedirLista(cont, { usuario, datos, irA }) {
    const listas = datos.listas();
    if (!listas.some((l) => l.id === listaId)) listaId = listas[0]?.id;
    const l = listas.find((x) => x.id === listaId);
    if (!l) {
        cont.innerHTML = vacio("Todavía no hay listas cargadas.", "ti-school");
        return;
    }

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Tu lista escolar</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: elegí la lista, destildá lo que ya tenés en casa y pedila. La librería te la separa.</p>
        <button class="ticket-barra" type="button"></button>
        <p class="rotulo-chico">¿De qué colegio y grado?</p>
        <div class="chips" role="radiogroup" aria-label="Lista del colegio">
            ${listas.map((x) => `<button class="chip${x.id === listaId ? " activo" : ""}" type="button" role="radio" aria-checked="${x.id === listaId}" data-lista="${esc(x.id)}">${esc(x.nombre)}</button>`).join("")}
        </div>
        <div class="lista-escolar">
            <section class="bloque">
                <h2 class="subtitulo"><i class="ti ti-clipboard-list"></i> Lo que pide el colegio</h2>
                <p class="nota"><i class="ti ti-info-circle"></i> Destildá lo que ya tenés en casa.</p>
                <ul class="items-lista">${l.items.map((i) => `
                    <li><label class="item-lista">
                        <input type="checkbox" data-producto="${esc(i.productoId)}"${sin.has(i.productoId) ? "" : " checked"}>
                        <span class="item-lista__nombre">${esc(i.nombre)}<small>${esc(i.cantidad)} × ${esc(pesos(i.precio))}</small></span>
                        <b class="item-lista__monto">${esc(pesos(i.subtotal))}</b>
                    </label></li>`).join("")}
                </ul>
            </section>
            <form class="bloque formulario resumen-lista" novalidate>
                <div class="total"><span>Total</span><b data-total></b></div>
                <p class="nota" data-cuantos></p>
                <label>¿Para quién es?
                    <input name="para" maxlength="${TOPES.para}" required value="${esc(para ?? PARA_DE_EJEMPLO)}">
                </label>
                <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-send"></i> Pedir la lista</button>
                <p class="nota"><i class="ti ti-info-circle"></i> La pagás cuando la retirás. Si algo no hay, la librería te ofrece otra opción.</p>
            </form>
        </div>`;

    const form = cont.querySelector(".resumen-lista");
    const barra = cont.querySelector(".ticket-barra");
    barra.addEventListener("click", () => form.scrollIntoView({ block: "start", behavior: "smooth" }));
    const actualizar = () => {
        const elegidos = l.items.filter((i) => !sin.has(i.productoId));
        const total = elegidos.reduce((t, i) => t + i.subtotal, 0);
        const cuantos = elegidos.reduce((t, i) => t + i.cantidad, 0);
        form.querySelector("[data-total]").textContent = pesos(total);
        barra.innerHTML = `<i class="ti ti-backpack" aria-hidden="true"></i> ${cuantos} artículos · <b>${esc(pesos(total))}</b> <span>Pedir ↓</span>`;
        form.querySelector("[data-cuantos]").textContent = sin.size
            ? `${cuantos} artículos (sacaste ${sin.size} que ya tenés)`
            : `${cuantos} artículos, todo lo de la lista`;
    };
    actualizar();

    cont.querySelectorAll("[data-lista]").forEach((b) => b.addEventListener("click", () => {
        listaId = b.dataset.lista;
        sin.clear();
        para = null;
        vistaPedirLista(cont, { usuario, datos, irA });
    }));
    cont.querySelectorAll("[data-producto]").forEach((c) => c.addEventListener("change", () => {
        if (c.checked) sin.delete(c.dataset.producto);
        else sin.add(c.dataset.producto);
        actualizar();
    }));
    form.para.addEventListener("input", () => (para = form.para.value));
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const pe = datos.nuevoPedido(usuario, { listaId, sin: [...sin], para: form.para.value });
            sin.clear();
            para = null;
            pedida(pe);
        } catch (err) {
            aviso(err, "error");
        }
    });

    /** Después de pedirla: el número, qué sigue y el paso del recorrido. */
    function pedida(pe) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">Lista pedida</h1>
                <p>Pedido N° ${esc(pe.numero)} · ${esc(pe.lista)}</p>
                <p class="vuelto vuelto--grande"><b>${esc(pesos(pe.total))}</b></p>
                <p class="nota"><i class="ti ti-bell"></i> ${esc(NEGOCIO)} la arma y te avisa cuando esté separada. La pagás al retirarla.</p>
            </div>
            ${guia("u-empleado", `/listas/${pe.id}`, "Mirá lo que le llega a Joaquín")}
            <a class="boton boton--secundario boton--ancho" href="#/mis-pedidos"><i class="ti ti-list"></i> Ver mis pedidos</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }
}

const QUE_PASA = {
    nueva: "La librería la está armando. Te avisan cuando esté separada.",
    separada: "¡Ya está separada! Pasá a buscarla y la pagás ahí.",
    entregada: "Retirada. ¡Buen comienzo de clases!",
    anulada: "Este pedido se anuló."
};

export function vistaMisPedidos(cont, { usuario, datos, irA }) {
    const lista = datos.misPedidos(usuario);
    cont.innerHTML = `
        <h1 class="titulo">Mis pedidos</h1>
        ${lista.length ? lista.map((pe) => `
        <section class="bloque mi-pedido">
            <div class="tarjeta__fila">
                <h2 class="subtitulo"><i class="ti ti-school"></i> N° ${esc(pe.numero)} · ${esc(pe.para)}</h2>
                ${pastillaEstado(pe.estado)}
            </div>
            <p class="tarjeta__quien">${esc(pe.lista)} · pedida ${esc(cuando(pe.creado))}</p>
            ${pasos(pe)}
            <p class="nota mi-pedido__estado"><i class="ti ti-info-circle"></i> ${esc(QUE_PASA[pe.estado])}</p>
            ${pe.estado === "separada" && pe.faltan ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> Faltó: ${esc(pe.items.filter((i) => i.falta).map((i) => i.nombre).join(", "))}. Te avisan cuando llegue.</p>` : ""}
            <div class="total"><span>${pe.estado === "entregada" ? "Pagaste" : "Total"}</span><b>${esc(pesos(pe.total))}</b></div>
            <details class="desplegable">
                <summary>Ver los ${esc(pe.articulos)} artículos</summary>
                <ul class="movimientos">${pe.items.map((i) => `
                    <li class="movimiento${i.falta ? " movimiento--falta" : ""}">
                        <span><b>${esc(i.nombre)}</b><small>${esc(i.cantidad)} × ${esc(pesos(i.precio))}${i.cambiadoDe ? ` · en vez de ${esc(i.cambiadoDe)}` : ""}${i.falta ? " · falta" : ""}</small></span>
                        <b class="monto">${i.falta ? "—" : esc(pesos(i.precio * i.cantidad))}</b>
                    </li>`).join("")}</ul>
            </details>
            ${pe.estado === "nueva" ? guia("u-empleado", `/listas/${pe.id}`, "Mirá lo que le llega a Joaquín") : ""}
        </section>`).join("")
        : `${vacio("Todavía no pediste ninguna lista.", "ti-school")}<p class="sin-pedidos"><a class="boton" href="#/inicio"><i class="ti ti-backpack"></i> Pedir mi lista</a></p>`}`;
    activarGuias(cont, irA);
}
