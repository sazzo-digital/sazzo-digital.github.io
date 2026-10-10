// ============================================
// Pedidos (Ricardo y Darío): los que llegan del celu o se anotan en el mostrador, los del día por hora de retiro.
// En cada pedido: se escribe lo que pesó cada corte (pidió 1,5, pesó 1,62): el total se ajusta solo y dice la
// diferencia. "Listo: avisarle" lo separa (se descuenta del stock) y arma el mensaje para WhatsApp; "Cobrar y
// entregar" lo pasa a la caja; o se anula (lo separado vuelve al stock).
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=5c760847bf";
import { mostrarMensaje } from "../../kit/js/mensaje.js?v=5c760847bf";
import { htmlCopiable, activarCopiables, ding } from "../../kit/js/celular.js?v=5c760847bf";
import { ESTADOS_PEDIDO, MEDIOS, RETIROS, TOPES, ALIAS, pesos, kilos, aGramos, precioPorPeso } from "../datos.js?v=5c760847bf";
import { MARCA } from "../marca.js?v=5c760847bf";
import { guia, activarGuias, pasos, pastillaEstado, tarjetaPedido, cuando, campoKg, kgEnCampo, loPedido } from "./comunes.js?v=5c760847bf";

/** Billetes "redondos" para cobrar un pedido: el próximo múltiplo de $10.000, de $20.000 y $50.000. */
const billetesPara = (total) => [...new Set([10_000, 20_000, 50_000].map((b) => Math.ceil(Math.max(1, total) / b) * b))].slice(0, 3);
const cuandoRetira = (pe) => (pe.retiro === RETIROS[0] ? "lo antes posible" : `a las ${pe.retiro}`);

export function vistaPedidos(cont, { usuario, datos, consulta }) {
    const filtro = consulta.get("ver");
    const estado = ESTADOS_PEDIDO[filtro] ? filtro : null;
    const todos = datos.listarPedidos(usuario);
    const lista = estado ? todos.filter((p) => p.estado === estado) : todos.filter((p) => p.estado !== "anulado");
    const cuenta = (e) => todos.filter((p) => p.estado === e).length;
    const nuevoWeb = todos.find((p) => p.estado === "nuevo" && p.origen === "web");
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/pedidos${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Pedidos</h1>
            <a class="boton boton--chico" href="#/pedidos/nuevo"><i class="ti ti-plus"></i> Anotar uno del teléfono</a>
        </div>
        ${nuevoWeb ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Te llegó el pedido de ${esc(nuevoWeb.para)}: tocalo para pesarlo y avisarle.</p>` : ""}
        <div class="numeros-caja">
            <div class="numero-caja"><span>Para preparar</span><b>${esc(cuenta("nuevo"))}</b></div>
            <div class="numero-caja"><span>Listos</span><b>${esc(cuenta("listo"))}</b><small>esperando que los busquen</small></div>
            <div class="numero-caja"><span>Retirados</span><b>${esc(cuenta("entregado"))}</b></div>
        </div>
        <nav class="chips filtro-listas" aria-label="Filtrar">
            ${chip(null, "Activos y retirados")}
            ${chip("nuevo", `Para preparar (${cuenta("nuevo")})`)}
            ${chip("listo", `Listos (${cuenta("listo")})`)}
            ${chip("entregado", "Retirados")}
            ${chip("anulado", "Anulados")}
        </nav>
        ${lista.length ? `<ul class="tarjetas">${lista.map((pe) => tarjetaPedido(pe, `#/pedidos/${pe.id}`)).join("")}</ul>`
            : vacio("No hay pedidos con ese filtro.", "ti-clipboard-list")}`;
}

/** Anotar un pedido que llegó por teléfono o WhatsApp: los cortes, cuánto, para quién y cuándo lo retira. */
export function vistaNuevoPedido(cont, { usuario, datos }) {
    const elegidos = new Map(); // articuloId → { modo, cantidad, aclaracion }
    let retiro = RETIROS[0];

    function pintar() {
        const articulos = datos.listarArticulos().filter((a) => a.stock > 0);
        cont.innerHTML = `
            <a class="volver" href="#/pedidos"><i class="ti ti-arrow-left"></i> Pedidos</a>
            <h1 class="titulo">Anotar un pedido</h1>
            <p class="nota"><i class="ti ti-info-circle"></i> Para los que llaman o mandan un mensaje: anotalo acá y se prepara igual que los del celu.</p>
            <form class="formulario bloque anotar" novalidate>
                <div class="formulario__fila">
                    <label>Corte
                        <select name="articulo">${articulos.map((a) => `<option value="${esc(a.id)}">${esc(a.nombre)}</option>`).join("")}</select>
                    </label>
                    <label>Cuánto (kg o unidades)
                        ${campoKg({ nombre: "cuanto", placeholder: "Ej: 1,5", requerido: true })}
                    </label>
                </div>
                <label>Aclaración (opcional)<input name="aclaracion" maxlength="${TOPES.aclaracion}" placeholder="Ej: milanesas finitas"></label>
                <button class="boton boton--secundario" type="submit"><i class="ti ti-plus"></i> Sumar</button>
            </form>
            ${elegidos.size ? `<ul class="movimientos bloque">${[...elegidos].map(([id, c]) => {
                const a = datos.articulo(id);
                return `<li class="movimiento"><span><b>${esc(a.nombre)}</b><small>${esc(a.venta === "kg" ? kilos(c.cantidad) : `${c.cantidad} u.`)}${c.aclaracion ? ` · “${esc(c.aclaracion)}”` : ""}</small></span>
                    <button class="boton-icono" type="button" data-quitar="${esc(id)}" aria-label="Sacar ${esc(a.nombre)}"><i class="ti ti-x"></i></button></li>`;
            }).join("")}</ul>` : ""}
            <form class="formulario bloque confirmar" novalidate>
                <label>¿Para quién es?<input name="para" maxlength="${TOPES.para}" required placeholder="Ej: Marta, la del 3° B"></label>
                <p class="rotulo-chico">¿Cuándo lo retira?</p>
                <div class="chips">${RETIROS.map((r) => `<button class="chip${retiro === r ? " activo" : ""}" type="button" data-retiro="${esc(r)}">${esc(r)}</button>`).join("")}</div>
                <button class="boton boton--ancho" type="submit"${elegidos.size ? "" : " disabled"}><i class="ti ti-check"></i> Anotar el pedido</button>
            </form>`;
        const f = cont.querySelector(".anotar");
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const a = datos.articulo(f.articulo.value);
            let cantidad;
            if (a.venta === "kg") {
                cantidad = aGramos(f.cuanto.value);
                if (!Number.isInteger(cantidad) || cantidad < TOPES.gramosMin || cantidad > TOPES.gramos) return aviso(`Los kilos: entre ${kilos(TOPES.gramosMin)} y ${kilos(TOPES.gramos, 0)}, con hasta 3 decimales.`, "error");
            } else {
                cantidad = Number(f.cuanto.value);
                if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > TOPES.unidades) return aviso(`${a.nombre} va por unidad: de 1 a ${TOPES.unidades}.`, "error");
            }
            if (!elegidos.has(a.id) && elegidos.size >= TOPES.renglones) return aviso(`Un pedido puede tener hasta ${TOPES.renglones} cortes.`, "error");
            elegidos.set(a.id, { modo: a.venta === "kg" ? "kg" : "unidad", cantidad, aclaracion: f.aclaracion.value.slice(0, TOPES.aclaracion) });
            const para = cont.querySelector("[name=para]").value;
            pintar();
            cont.querySelector("[name=para]").value = para;
        });
        cont.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => {
            elegidos.delete(b.dataset.quitar);
            pintar();
        }));
        cont.querySelectorAll("[data-retiro]").forEach((b) => b.addEventListener("click", () => {
            retiro = b.dataset.retiro;
            const para = cont.querySelector("[name=para]").value;
            pintar();
            cont.querySelector("[name=para]").value = para;
        }));
        cont.querySelector(".confirmar").addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const pe = datos.nuevoPedido(usuario, {
                    items: [...elegidos].map(([articuloId, c]) => ({ articuloId, ...c })),
                    retiro, para: e.target.para.value
                });
                aviso(`Pedido N° ${pe.numero} anotado`);
                location.hash = `#/pedidos/${pe.id}`;
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
    pintar();
}

/** Un pedido: pesarlo, "Listo: avisarle", cobrar y entregar (o anularlo). */
export function vistaPedido(cont, opciones, recien = null) {
    const { usuario, datos, irA, params: [id] } = opciones;
    const pe = datos.pedido(id);
    const empleado = usuario.rol === "empleado";
    const otraVez = (r = null) => vistaPedido(cont, opciones, r);
    let medio = "efectivo";

    const filaItem = (i) => {
        const pesado = i.venta === "kg" && i.gramos !== null;
        const dif = pesado && i.modo === "kg" ? i.gramos - i.pedidoG : null;
        return `
            <li class="fila-stock item-pedido${pe.estado === "nuevo" && i.venta === "kg" && !pesado ? " item-pedido--falta" : ""}">
                <span class="fila-stock__nombre">${esc(i.nombre)}
                    <small>Pidió ${esc(loPedido(i))} · ${esc(pesos(i.precio))}${i.venta === "kg" ? "/kg" : " c/u"}</small>
                    ${i.aclaracion ? `<small class="aclaracion"><i class="ti ti-message-circle" aria-hidden="true"></i> “${esc(i.aclaracion)}”</small>` : ""}
                </span>
                ${pe.estado === "nuevo" && i.venta === "kg" ? `
                <label class="pesaje">
                    <span>Pesó</span>
                    ${campoKg({ nombre: "kg", valor: kgEnCampo(i.gramos), etiqueta: `Lo que pesó ${i.nombre}`, placeholder: kgEnCampo(i.pedidoGCalculado) })}
                    <input type="hidden" name="articulo" value="${esc(i.articuloId)}">
                </label>` : `<span class="pesaje pesaje--hecho">${i.venta === "kg" ? `${esc(kilos(i.gramos))}${dif !== null && dif !== 0 ? `<small>${dif > 0 ? "+" : "−"}${esc(kilos(Math.abs(dif)))}</small>` : ""}` : `${esc(i.unidades)} u.`}</span>`}
                <b class="fila-stock__precio">${pesado || i.venta === "unidad" ? esc(pesos(i.real)) : `<span class="aprox">${esc(pesos(i.estimado))} aprox.</span>`}</b>
            </li>`;
    };

    const quien = pe.origen === "web" ? `Desde el celu${pe.cliente ? ` (${esc(pe.cliente)})` : ""}` : "Anotado en el mostrador";
    const abierto = datos.listarDespostes().find((d) => d.estado === "abierto");

    cont.innerHTML = `
        <a class="volver" href="#/pedidos"><i class="ti ti-arrow-left"></i> Pedidos</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">N° ${esc(pe.numero)} · ${esc(pe.para)}</h1>
            ${pastillaEstado(pe.estado)}
        </div>
        <p class="tarjeta__quien">${quien} · ${esc(cuando(pe.creado))} · retira <b>${esc(cuandoRetira(pe))}</b></p>
        ${pasos(pe)}
        ${recien === "listo" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Listo para retirar</h2>
            <p>${esc(pesos(pe.total))} · se descontó del stock y salió el aviso</p>
        </div>` : ""}
        ${recien === "entregado" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Entregado y cobrado</h2>
            <p>${esc(pesos(pe.total))}${opciones.vuelto != null ? ` · vuelto <b>${esc(pesos(opciones.vuelto))}</b>` : ""}</p>
        </div>` : ""}
        ${pe.estado === "nuevo" && empleado ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Cortá y pesá cada cosa, y escribí lo que marcó la balanza (probá: asado 1kg 620g, picada 980g, milanesas 1kg 50g; también vale 1,620). El total se ajusta solo.</p>` : ""}
        <ul class="filas-stock items-pedido">${pe.items.map(filaItem).join("")}</ul>
        <div class="total total--pedido">
            <span>${pe.real === null ? "Total aproximado" : "Total"}${pe.sinPesar ? ` <small>falta pesar ${esc(pe.sinPesar)}</small>` : ""}</span>
            <b>${esc(pesos(pe.total))}</b>
        </div>
        ${pe.diferencia ? `<p class="nota diferencia"><i class="ti ti-scale"></i> Pesó ${pe.diferencia > 0 ? "un poco más" : "un poco menos"}: ${pe.diferencia > 0 ? "+" : "−"}${esc(pesos(Math.abs(pe.diferencia)))} de lo que calculó ${esc(pe.para)} (${esc(pesos(pe.estimado))}).</p>` : ""}
        <div class="acciones-pedido"></div>`;

    // Pesar: al salir de cada campo se guarda y se pasa al siguiente sin pesar
    cont.querySelectorAll(".pesaje input[name=kg]").forEach((campo) => {
        const articuloId = campo.parentElement.querySelector("[name=articulo]").value;
        const guardar = () => {
            const antes = pe.items.find((i) => i.articuloId === articuloId)?.gramos ?? null;
            const g = campo.value.trim() === "" ? null : aGramos(campo.value);
            if (g === antes) return;
            try {
                datos.pesarItem(usuario, pe.id, articuloId, campo.value.trim() === "" ? null : campo.value);
                otraVez();
                const siguiente = [...cont.querySelectorAll(".pesaje input[name=kg]")].find((c) => !c.value);
                if (siguiente && matchMedia("(min-width: 1000px)").matches) siguiente.focus();
            } catch (err) {
                aviso(err, "error");
            }
        };
        campo.addEventListener("change", guardar);
        campo.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                guardar();
            }
        });
        campo.addEventListener("input", () => {
            const g = aGramos(campo.value);
            const i = pe.items.find((x) => x.articuloId === articuloId);
            const b = campo.closest("li").querySelector(".fila-stock__precio");
            if (Number.isInteger(g) && g >= TOPES.gramosMin && g <= TOPES.gramos) b.textContent = pesos(precioPorPeso(g, i.precio));
        });
    });

    const acciones = cont.querySelector(".acciones-pedido");

    if (pe.estado === "nuevo") {
        acciones.innerHTML = `
            <button class="boton boton--ancho boton--grande" type="button" data-listo${pe.sinPesar ? " disabled" : ""}><i class="ti ti-message-circle"></i> Listo: avisarle${pe.cliente ? ` a ${esc(pe.cliente)}` : ""}</button>
            ${pe.sinPesar ? `<p class="nota"><i class="ti ti-scale"></i> Cuando pesás todo, se habilita.</p>` : ""}
            ${htmlAnular("Anular el pedido")}`;
        acciones.querySelector("[data-listo]").addEventListener("click", () => {
            try {
                const { mensaje } = datos.marcarListo(usuario, pe.id);
                ding(MARCA.prefijo);
                otraVez("listo");
                mostrarMensaje(`Avisarle a ${pe.para}`, mensaje);
            } catch (err) {
                aviso(err, "error");
            }
        });
    } else if (pe.estado === "listo") {
        acciones.innerHTML = `
            <div class="acciones">
                <button class="boton boton--secundario" type="button" data-avisar><i class="ti ti-message-circle"></i> Avisar de nuevo</button>
                ${pe.avisado ? `<span class="nota avisado"><i class="ti ti-check"></i> Avisado ${esc(cuando(pe.avisado))}</span>` : ""}
            </div>
            ${empleado && recien === "listo" ? guia("u-dueno", abierto ? `/desposte/${abierto.id}` : "/caja", abierto ? "Pasá a Ricardo: terminá el desposte de hoy" : "Pasá a Ricardo: mirá la caja") : ""}
            <form class="formulario bloque entregar" novalidate>
                <h2 class="subtitulo"><i class="ti ti-cash"></i> Vinieron a buscarlo: cobrar y entregar</h2>
                <div class="chips medios" role="radiogroup" aria-label="Cómo paga"></div>
                <div class="pago-efectivo"></div>
                <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Cobrar ${esc(pesos(pe.total))} y entregar</button>
            </form>
            ${htmlAnular("Anular (lo separado vuelve al stock)")}`;
        acciones.querySelector("[data-avisar]").addEventListener("click", () => {
            try {
                const { mensaje } = datos.avisarPedido(usuario, pe.id);
                mostrarMensaje(`Avisarle a ${pe.para}`, mensaje);
            } catch (err) {
                aviso(err, "error");
            }
        });
        const f = acciones.querySelector(".entregar");
        const pintarPago = () => {
            f.querySelector(".medios").innerHTML = Object.entries(MEDIOS).map(([m, texto]) =>
                `<button class="chip${medio === m ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === m}" data-medio="${m}">${texto}</button>`).join("");
            f.querySelector(".pago-efectivo").innerHTML = medio === "efectivo" ? `
                <label>Paga con (si querés saber el vuelto)
                    <input name="pagaCon" type="number" inputmode="numeric" min="0" max="${TOPES.pagaCon}" step="1" placeholder="Ej: 50000">
                </label>
                <div class="billetes">${billetesPara(pe.total).map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesos(b))}</button>`).join("")}</div>
                <p class="vuelto" aria-live="polite"></p>`
                : medio === "transferencia" ? `<p class="alias">Que te transfiera al alias ${htmlCopiable(ALIAS, "Copiar el alias")}</p>` : "";
            activarCopiables(f, "Alias copiado: pasáselo al cliente.");
            f.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
                medio = b.dataset.medio;
                pintarPago();
            }));
            const pagaCon = f.querySelector("[name=pagaCon]");
            const mostrarVuelto = () => {
                const n = Number(pagaCon.value);
                const p = f.querySelector(".vuelto");
                if (!pagaCon.value) p.textContent = "";
                else if (!Number.isInteger(n) || n < pe.total) p.innerHTML = `<span class="falta">Con ${esc(pesos(n || 0))} no alcanza.</span>`;
                else p.innerHTML = `Vuelto: <b>${esc(pesos(n - pe.total))}</b>`;
            };
            pagaCon?.addEventListener("input", mostrarVuelto);
            f.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
                pagaCon.value = b.dataset.billete;
                mostrarVuelto();
            }));
        };
        pintarPago();
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const v = f.querySelector("[name=pagaCon]")?.value;
            try {
                const { venta } = datos.entregarPedido(usuario, pe.id, { medio, pagaCon: v ? Number(v) : null });
                ding(MARCA.prefijo);
                aviso("Pedido entregado y cobrado");
                vistaPedido(cont, { ...opciones, vuelto: venta.vuelto }, "entregado");
            } catch (err) {
                aviso(err, "error");
            }
        });
    } else if (pe.estado === "entregado") {
        acciones.innerHTML = `
            <p class="nota"><i class="ti ti-receipt"></i> Cobrado ${esc(cuando(pe.entregado))}: quedó en la caja del día.</p>
            ${recien === "entregado" ? `<a class="boton boton--secundario boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del día</a>` : ""}`;
    }

    acciones.querySelector("[data-anular]")?.addEventListener("click", () => {
        if (!confirm(pe.estado === "listo" ? "¿Anular el pedido? Lo separado vuelve al stock." : "¿Anular el pedido?")) return;
        try {
            datos.anularPedido(usuario, pe.id);
            aviso("Pedido anulado");
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    });
    activarGuias(cont, irA);
}

const htmlAnular = (texto) => `<button class="boton-link anular" type="button" data-anular><i class="ti ti-ban"></i> ${esc(texto)}</button>`;
