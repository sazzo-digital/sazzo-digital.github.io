// ============================================
// Pantallas de la moza (Lara): el plano del salón (Salón, Vereda, Barra y Pedidos Ya; en el celu, las mesas en
// grilla), la comanda de una mesa (al enviar se separa solo lo de la cocina y lo de la barra), el cobro dividiendo la
// cuenta (todo junto, en partes iguales o por lo que consumió cada uno, cada parte con su medio de pago) y la caja.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=edf52e7135";
import { CATEGORIAS, MEDIOS, TOPES, carta, dividir, pesos } from "../datos.js?v=edf52e7135";
import { MARCA, NEGOCIO } from "../marca.js?v=edf52e7135";
import { htmlBotonSonido, activarBotonSonido, ding } from "../../kit/js/celular.js?v=edf52e7135";
import { ticket, guia, activarGuias, haceMin, hora } from "./comunes.js?v=edf52e7135";

const ESTADO_MESA = { libre: "Libre", abierta: "Abierta", cobrando: "Cobrando" };

export function vistaPlano(cont, { usuario, datos, irA }) {
    const p = datos.plano();
    const tile = (m) => `
        <a class="mesa mesa--${esc(m.estado)}" href="#/mesa/${esc(m.id)}" aria-label="${esc(m.nombre)}: ${esc(ESTADO_MESA[m.estado])}">
            <b class="mesa__numero">${esc(m.nombre.replace(/^\D+/, ""))}</b>
            ${m.estado === "libre" ? `<small>Libre</small>` : `
            <small><i class="ti ti-users" aria-hidden="true"></i> ${esc(m.abierta.personas)} · ${esc(m.minutos)}'</small>
            <small class="mesa__total">${esc(pesos(m.total))}</small>
            <span class="mesa__marcas">
                ${m.estado === "cobrando" ? `<i class="ti ti-cash" title="Cobrando"></i>` : ""}
                ${m.cocinaPendiente ? `<i class="ti ti-flame" title="La cocina está en eso"></i>` : ""}
                ${m.comidaLista ? `<i class="ti ti-circle-check" title="Comida lista"></i>` : ""}
                ${m.sinMandar ? `<i class="ti ti-send" title="Hay cosas sin mandar"></i>` : ""}
            </span>`}
        </a>`;
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Salón</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> <span>Probá: tocá la <b>Mesa 4</b>, abrila y pedí dos muzzarellas, un fernet y dos Coca.</span></p>
        <div class="tira">
            <span><b>${esc(p.resumen.ocupadas)}</b> de ${esc(p.resumen.total)} ocupadas</span>
            <span><b>${esc(p.resumen.personas)}</b> personas</span>
            <span>Abierto <b>${esc(pesos(p.resumen.abierto))}</b></span>
        </div>
        <ul class="leyenda">
            <li><span class="muestra mesa--libre"></span>Libre</li>
            <li><span class="muestra mesa--abierta"></span>Abierta</li>
            <li><span class="muestra mesa--cobrando"></span>Cobrando</li>
            <li><i class="ti ti-flame"></i> En cocina</li>
            <li><i class="ti ti-circle-check"></i> Comida lista</li>
        </ul>
        ${p.sectores.map((s) => `
        <section class="sector">
            <h2 class="subtitulo">${esc(s.texto)}</h2>
            <div class="mesas mesas--${esc(s.id)}">${s.mesas.map(tile).join("")}</div>
        </section>`).join("")}
        ${guia("u-cliente", "/inicio", "Mirá la carta que ve el cliente con el QR")}
        <section class="sector">
            <h2 class="subtitulo"><i class="ti ti-motorbike"></i> Pedidos Ya</h2>
            ${p.pedidosYa.length ? `<ul class="tarjetas">${p.pedidosYa.map((o) => `
                <li class="tarjeta${o.estado === "nuevo" ? " tarjeta--nuevo" : ""}">
                    <div class="tarjeta__fila"><b>${esc(o.cliente)}</b><span class="pastilla pastilla--${o.estado === "nuevo" ? "alerta" : o.cocinaLista ? "bien" : "suave"}">${o.estado === "nuevo" ? "Nuevo" : o.cocinaLista ? "Listo para el repartidor" : "En la cocina"}</span></div>
                    <p class="tarjeta__quien">${esc(o.items.map((i) => `${i.cantidad} ${i.nombre}`).join(", "))} · <b>${esc(pesos(o.total))}</b> · ${esc(haceMin(o.minutos))}</p>
                    <div class="tarjeta__pie"><span></span>
                        ${o.estado === "nuevo" ? `<button class="boton boton--chico" type="button" data-aceptar="${esc(o.id)}"><i class="ti ti-check"></i> Aceptar</button>` : ""}
                        ${o.estado === "aceptado" ? `<button class="boton boton--chico" type="button" data-entregar="${esc(o.id)}"${o.cocinaLista ? "" : " disabled"}><i class="ti ti-motorbike"></i> Entregado al repartidor</button>` : ""}
                    </div>
                </li>`).join("")}</ul>` : `<p class="nota">No hay pedidos de Pedidos Ya.</p>`}
        </section>`;
    const hacer = (fn, msj) => {
        try {
            fn();
            aviso(msj);
            vistaPlano(cont, { usuario, datos, irA });
        } catch (err) {
            aviso(err, "error");
        }
    };
    cont.querySelectorAll("[data-aceptar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.aceptarPY(usuario, b.dataset.aceptar), "Aceptado: la comida va a la cocina")));
    cont.querySelectorAll("[data-entregar]").forEach((b) => b.addEventListener("click", () => hacer(() => datos.entregarPY(usuario, b.dataset.entregar), "Entregado: suma a la caja")));
    activarGuias(cont, irA);
}

let categoria = "pizzas";

export function vistaMesa(cont, { usuario, datos, irA, params: [id] }, enviado = null) {
    const m = datos.mesa(id);
    if (m.estado === "libre") return abrir(cont, { usuario, datos, irA, id, m });
    const productos = carta().filter((c) => c.cat === categoria);
    const otraVez = (env = null) => vistaMesa(cont, { usuario, datos, irA, params: [id] }, env);
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">${esc(m.nombre)}</h1>
            <span class="pastilla pastilla--${m.estado === "cobrando" ? "mal" : "bien"}">${esc(ESTADO_MESA[m.estado])}</span>
        </div>
        <p class="nota"><i class="ti ti-users"></i> ${esc(m.abierta.personas)} personas · ${esc(m.abierta.moza)} · abierta ${esc(haceMin(m.minutos))}</p>
        ${m.cocinaPendiente ? `<p class="alerta alerta--alerta"><i class="ti ti-flame"></i> La cocina está preparando el pedido.</p>` : ""}
        ${m.comidaLista ? `<p class="alerta alerta--info estado-ok"><i class="ti ti-circle-check"></i> La comida está lista: a servir.</p>` : ""}
        ${enviado ? `
        <div class="enviado">
            <p class="enviado__titulo"><i class="ti ti-send"></i> Mandado. Se separó solo:</p>
            <div class="tickets">${enviado.cocina ? ticket(enviado.cocina) : ""}${enviado.barra ? ticket(enviado.barra) : ""}</div>
            ${enviado.cocina ? guia("u-cocina", "/inicio", "Mirá lo que le llega a la cocina") : ""}
        </div>` : ""}
        <div class="comanda">
            <section class="carta">
                <div class="chips" role="tablist" aria-label="Categoría">${Object.entries(CATEGORIAS).map(([k, c]) => `
                    <button class="chip${k === categoria ? " activo" : ""}" type="button" data-cat="${k}"><i class="ti ${esc(c.icono)}"></i> ${esc(c.texto)}</button>`).join("")}
                </div>
                <div class="productos">${productos.map((p) => `
                    <button class="producto" type="button" data-agregar="${esc(p.id)}">
                        <span>${esc(p.nombre)}</span><b>${esc(pesos(p.precio))}</b>
                    </button>`).join("")}
                </div>
            </section>
            <section class="cuenta">
                <h2 class="subtitulo"><i class="ti ti-receipt"></i> Pedido de la mesa</h2>
                ${m.abierta.renglones.length ? `<ul class="renglones">${m.abierta.renglones.map((r) => `
                    <li class="renglon${r.enviado ? "" : " renglon--nuevo"}">
                        <span class="renglon__cant">${esc(r.cantidad)}</span>
                        <span class="renglon__nombre">${esc(r.nombre)}<small>${r.enviado ? "Mandado" : "Sin mandar"}</small></span>
                        <b>${esc(pesos(r.precio * r.cantidad))}</b>
                        ${r.enviado ? `<i class="ti ti-check renglon__ok" aria-label="Mandado"></i>` : `<button class="boton-icono" type="button" data-sacar="${esc(r.id)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>`}
                    </li>`).join("")}</ul>` : `<p class="nota">Tocá los productos para sumarlos.</p>`}
                <div class="total"><span>Total</span><b>${esc(pesos(m.total))}</b></div>
                ${m.sinMandar ? `<button class="boton boton--ancho boton--grande" type="button" data-enviar><i class="ti ti-send"></i> Mandar a cocina y barra</button>` : ""}
                ${m.abierta.renglones.length && !m.sinMandar ? `<a class="boton boton--ancho${m.cocinaPendiente ? " boton--secundario" : ""}" href="#/mesa/${esc(m.id)}/cobrar"><i class="ti ti-cash"></i> Cobrar</a>` : ""}
            </section>
        </div>`;
    activarGuias(cont, irA);
    cont.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
        categoria = b.dataset.cat;
        otraVez(enviado);
    }));
    cont.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.agregar(usuario, id, b.dataset.agregar);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelectorAll("[data-sacar]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.sacar(usuario, id, b.dataset.sacar);
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelector("[data-enviar]")?.addEventListener("click", () => {
        try {
            otraVez(datos.enviar(usuario, id));
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err, "error");
        }
    });
}

/** Abrir una mesa libre: cuántas personas. */
function abrir(cont, { usuario, datos, irA, id, m }) {
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>
        <h1 class="titulo">${esc(m.nombre)}</h1>
        <form class="formulario bloque" novalidate>
            <p class="rotulo-chico">¿Cuántas personas?</p>
            <div class="chips">${[1, 2, 3, 4, 5, 6, 8].map((n) => `<label class="chip chip--radio"><input type="radio" name="personas" value="${n}"${n === 3 ? " checked" : ""}>${n}</label>`).join("")}</div>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-armchair"></i> Abrir la mesa</button>
        </form>`;
    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            datos.abrirMesa(usuario, id, { personas: Number(new FormData(e.target).get("personas")) });
            categoria = "pizzas";
            vistaMesa(cont, { usuario, datos, irA, params: [id] });
        } catch (err) {
            aviso(err, "error");
        }
    });
}

/** Cobrar: todo junto, en partes iguales o por lo que consumió cada uno; cada parte con su medio de pago. */
export function vistaCobro(cont, { usuario, datos, params: [id] }) {
    const m = datos.mesa(id);
    if (m.estado === "libre") {
        cont.innerHTML = `<a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Salón</a>${vacio(`${m.nombre} ya está libre.`, "ti-armchair")}`;
        return;
    }
    let modo = "iguales";
    let cuantos = Math.min(m.abierta.personas, 6);
    // Por lo que consumió cada uno: cada unidad de cada renglón, a qué persona va
    const unidades = m.abierta.renglones.flatMap((r) => Array.from({ length: r.cantidad }, (_, i) => ({ clave: `${r.id}-${i}`, nombre: r.nombre, precio: r.precio })));
    const asignado = Object.fromEntries(unidades.map((u, i) => [u.clave, i % cuantos]));
    let medios = [];

    function montos() {
        if (modo === "junto") return [m.total];
        if (modo === "iguales") return dividir(m.total, cuantos);
        const sumas = Array(cuantos).fill(0);
        unidades.forEach((u) => (sumas[asignado[u.clave] ?? 0] += u.precio));
        return sumas;
    }

    function pintar() {
        const lista = montos();
        medios = lista.map((_, i) => medios[i] ?? (i === 0 ? "efectivo" : "qr"));
        cont.innerHTML = `
            <a class="volver" href="#/mesa/${esc(m.id)}"><i class="ti ti-arrow-left"></i> ${esc(m.nombre)}</a>
            <div class="titulo-con-accion"><h1 class="titulo">Cobrar ${esc(m.nombre)}</h1>${htmlBotonSonido(MARCA.prefijo)}</div>
            <div class="panel total-cobro"><span class="panel__rotulo">Total</span><span class="panel__numero">${esc(pesos(m.total))}</span><small>${esc(m.abierta.personas)} personas</small></div>
            <div class="chips" role="tablist" aria-label="Cómo se divide">
                <button class="chip${modo === "junto" ? " activo" : ""}" type="button" data-modo="junto">Todo junto</button>
                <button class="chip${modo === "iguales" ? " activo" : ""}" type="button" data-modo="iguales">En partes iguales</button>
                <button class="chip${modo === "items" ? " activo" : ""}" type="button" data-modo="items">Por lo que consumió cada uno</button>
            </div>
            ${modo !== "junto" ? `
            <p class="rotulo-chico">¿Entre cuántos?</p>
            <div class="chips">${[2, 3, 4, 5, 6].map((n) => `<button class="chip${n === cuantos ? " activo" : ""}" type="button" data-cuantos="${n}">${n}</button>`).join("")}</div>` : ""}
            ${modo === "items" ? `
            <ul class="unidades">${unidades.map((u) => `
                <li><span>${esc(u.nombre)}<small>${esc(pesos(u.precio))}</small></span>
                    <span class="chips chips--chicos">${Array.from({ length: cuantos }, (_, i) => `<button class="chip${asignado[u.clave] === i ? " activo" : ""}" type="button" data-unidad="${esc(u.clave)}" data-persona="${i}">${i + 1}</button>`).join("")}</span>
                </li>`).join("")}
            </ul>` : ""}
            <ul class="partes">${lista.map((monto, i) => `
                <li class="parte${monto ? "" : " parte--vacia"}">
                    <span class="parte__quien">${lista.length > 1 ? `Persona ${i + 1}` : "Toda la mesa"}<b>${esc(pesos(monto))}</b></span>
                    <span class="chips chips--chicos">${Object.entries(MEDIOS).map(([k, t]) => `<button class="chip${medios[i] === k ? " activo" : ""}" type="button" data-parte="${i}" data-medio="${k}">${esc(t)}</button>`).join("")}</span>
                </li>`).join("")}
            </ul>
            <button class="boton boton--ancho boton--grande" type="button" data-cobrar><i class="ti ti-cash"></i> Cobrar ${esc(pesos(m.total))}</button>
            ${m.cocinaPendiente ? `<p class="nota"><i class="ti ti-flame"></i> Ojo: la cocina todavía está preparando algo de esta mesa.</p>` : ""}`;

        cont.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => {
            modo = b.dataset.modo;
            pintar();
        }));
        cont.querySelectorAll("[data-cuantos]").forEach((b) => b.addEventListener("click", () => {
            cuantos = Number(b.dataset.cuantos);
            unidades.forEach((u) => (asignado[u.clave] = Math.min(asignado[u.clave], cuantos - 1)));
            pintar();
        }));
        cont.querySelectorAll("[data-unidad]").forEach((b) => b.addEventListener("click", () => {
            asignado[b.dataset.unidad] = Number(b.dataset.persona);
            pintar();
        }));
        cont.querySelectorAll("[data-parte]").forEach((b) => b.addEventListener("click", () => {
            medios[Number(b.dataset.parte)] = b.dataset.medio;
            pintar();
        }));
        activarBotonSonido(cont, MARCA.prefijo); // "ding" al cobrar, apagado de entrada
        cont.querySelector("[data-cobrar]").addEventListener("click", () => {
            const partes = montos().map((monto, i) => ({ monto, medio: medios[i] })).filter((p) => p.monto > 0);
            try {
                const cobro = datos.cobrar(usuario, m.id, { partes });
                ding(MARCA.prefijo);
                cont.innerHTML = `
                    <div class="hecho">
                        <i class="ti ti-circle-check" aria-hidden="true"></i>
                        <h1 class="titulo">Cobrado</h1>
                        <p>${esc(cobro.mesa)} · ${esc(pesos(cobro.total))}</p>
                        <ul class="resumen-cobro">${cobro.partes.map((p, i) => `<li><span>${cobro.partes.length > 1 ? `Persona ${i + 1}` : "Toda la mesa"}</span><b>${esc(pesos(p.monto))}</b><small>${esc(MEDIOS[p.medio])}</small></li>`).join("")}</ul>
                        <p class="nota"><i class="ti ti-armchair"></i> La mesa quedó libre.</p>
                    </div>
                    <a class="boton boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del turno</a>
                    <a class="boton boton--secundario boton--ancho" href="#/inicio"><i class="ti ti-layout-grid"></i> Volver al salón</a>`;
                window.scrollTo(0, 0);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
    pintar();
}

export function vistaCaja(cont, { usuario, datos }) {
    const c = datos.caja(usuario);
    const medios = { ...MEDIOS, pedidosya: "Pedidos Ya" };
    cont.innerHTML = `
        <h1 class="titulo">Caja del turno</h1>
        <div class="panel total-cobro"><span class="panel__rotulo">Entró hoy</span><span class="panel__numero">${esc(pesos(c.total))}</span><small>${esc(c.cobros.length)} cobros · en las mesas todavía hay ${esc(pesos(c.abierto))}</small></div>
        <div class="medios">${Object.entries(medios).map(([k, t]) => `<div><span>${esc(t)}</span><b>${esc(pesos(c.porMedio[k]))}</b></div>`).join("")}</div>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Cobros del turno</h2>
            <ul class="cobros">${c.cobros.map((co) => `
                <li><span><b>${esc(co.mesa)}</b><small>${esc(hora(co.en))} · ${esc(co.partes.map((p) => medios[p.medio]).join(" + "))}</small></span><b>${esc(pesos(co.total))}</b></li>`).join("")}
            </ul>
        </section>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-lock"></i> Cerrar caja</h2>
            <p class="nota"><i class="ti ti-cash"></i> En el cajón tiene que haber ${esc(pesos(c.enCajon))} (${esc(pesos(c.fondo))} de cambio + lo cobrado en efectivo).</p>
            ${c.cierre ? `<p class="cierre ${c.cierre.diferencia === 0 ? "cierre--bien" : "cierre--ojo"}">${c.cierre.diferencia === 0 ? "Justo: no sobra ni falta nada." : c.cierre.diferencia > 0 ? `Sobran ${esc(pesos(c.cierre.diferencia))}.` : `Faltan ${esc(pesos(-c.cierre.diferencia))}.`} <small>Cerrada a las ${esc(hora(c.cierre.en))}.</small></p>` : ""}
            <form class="formulario" novalidate>
                <label>Contá la plata del cajón
                    <span class="fila-form">
                        <input name="contado" type="number" inputmode="numeric" min="0" max="${TOPES.monto}" step="1" placeholder="Ej: ${esc(c.enCajon)}">
                        <button class="boton" type="submit"><i class="ti ti-lock"></i> Cerrar</button>
                    </span>
                </label>
            </form>
        </section>`;
    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = e.target.contado.value;
        try {
            datos.cerrarCaja(usuario, v === "" ? NaN : Number(v));
            aviso("Caja cerrada");
            vistaCaja(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
