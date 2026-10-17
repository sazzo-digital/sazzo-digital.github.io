import { esc, aviso } from "./ui.js?v=0edfe6e2d5";
import { puedeEscanear, escanearSeguido } from "./escaner.js?v=0edfe6e2d5";
import { pip, vibrar, htmlBotonSonido, activarBotonSonido } from "./celular.js?v=0edfe6e2d5";
import { DIVIDIDO, revisarPagos } from "./pagos.js?v=0edfe6e2d5";

export const TOPE_RENGLONES = 30;
export const TOPE_CANTIDAD = 99;
export const STOCK_BAJO = 2;
export const pesosCaja = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export function sumarAlTicket(ticket, producto, cuantos = 1) {
    if (!producto) return { ok: false, mensaje: "Ese código no es de este negocio." };
    const ya = ticket.get(producto.id) ?? 0;
    const nueva = ya + cuantos;
    if (nueva <= 0) {
        ticket.delete(producto.id);
        return { ok: true, cantidad: 0 };
    }
    if (!ya && ticket.size >= TOPE_RENGLONES) return { ok: false, mensaje: `Un ticket puede tener hasta ${TOPE_RENGLONES} productos distintos.` };
    if (nueva > TOPE_CANTIDAD) return { ok: false, mensaje: `Hasta ${TOPE_CANTIDAD} de cada producto.` };
    if (producto.stock !== undefined && producto.stock !== null && nueva > producto.stock) {
        return { ok: false, mensaje: producto.stock > 0 ? `De ${producto.nombre} quedan solo ${producto.stock}.` : `No queda ${producto.nombre}.` };
    }
    ticket.set(producto.id, nueva);
    return { ok: true, cantidad: nueva };
}

export function renglonesDe(ticket, productos, precioPara = (p) => p.precio) {
    return [...ticket].map(([id, cantidad]) => {
        const p = productos.find((x) => x.id === id);
        if (!p) return null;
        const quedan = p.stock === undefined || p.stock === null ? null : p.stock - cantidad;
        const precio = precioPara(p, cantidad);
        return { id, nombre: p.nombre, precio, cantidad, subtotal: precio * cantidad, quedan, mayor: precio !== p.precio };
    }).filter(Boolean);
}

export const totalDe = (renglones) => renglones.reduce((t, r) => t + r.subtotal, 0);

export function vueltoDe(total, pagaCon) {
    const con = Number(String(pagaCon ?? "").split(",")[0].replace(/\D/g, ""));
    if (!con) return { ok: true, vuelto: null };
    if (con < total) return { ok: false, mensaje: `Con ${pesosCaja(con)} no alcanza: son ${pesosCaja(total)}.` };
    return { ok: true, vuelto: con - total, pagaCon: con };
}

export function abrirCaja({
    titulo, productos, gondola = productos, buscarCodigo, medios, billetes = [], cobrar, prefijo,
    imagenQR = null, alCerrar = () => {}, textoBoton = "Cobrar", escaneo = true, buscar = null, secciones = null,
    precioPara = (p) => p.precio
}) {
    const ticket = new Map();
    let pararCamara = null;
    let ultimoId = null;
    let medio = medios[0]?.id ?? null;
    let seccion = secciones?.[0]?.id ?? null;
    const capa = document.createElement("div");
    capa.className = "caja-super";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-modal", "true");
    capa.setAttribute("aria-label", `Caja · ${titulo}`);
    capa.innerHTML = `
        <header class="caja-super__cabeza">
            <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar la caja"><i class="ti ti-x"></i></button>
            <b class="caja-super__titulo">Caja · ${esc(titulo)}</b>
            ${htmlBotonSonido(prefijo)}
            ${escaneo && puedeEscanear() ? `<button class="boton boton--chico" type="button" data-escanear><i class="ti ti-scan"></i> Escanear</button>` : ""}
        </header>
        <div class="caja-super__cuerpo">
            <section class="caja-super__lado" aria-label="Productos">
                <div class="visor" hidden>
                    <video playsinline muted></video>
                    <span class="visor__esquinas" aria-hidden="true"></span>
                    <span class="visor__linea" aria-hidden="true"></span>
                    <span class="visor__estado">Buscando QR…</span>
                </div>
                ${buscar ? `<label class="buscador caja-super__buscar"><i class="ti ti-search" aria-hidden="true"></i><span class="solo-lector">Buscar</span><input type="search" autocomplete="off" maxlength="40" placeholder="Buscá por nombre" data-buscar></label>` : ""}
                <p class="caja-super__ayuda"><i class="ti ti-hand-finger" aria-hidden="true"></i> ${escaneo ? "¿Sin QR a mano? Tocá un producto de la góndola:" : "Tocá un producto para sumarlo:"}</p>
                ${secciones?.length ? `<div class="chips gondola__secciones" role="tablist" aria-label="Secciones">${secciones.map((x) => `<button class="chip" type="button" role="tab" data-seccion="${esc(x.id)}">${esc(x.texto)}</button>`).join("")}</div>` : ""}
                <div class="gondola"></div>
                ${imagenQR ? `<button class="boton-link caja-super__qr" type="button" data-ver-qr><i class="ti ti-qrcode"></i> Ver los QR para escanear (o imprimirlos)</button>` : ""}
            </section>
            <section class="caja-super__ticket" aria-label="Ticket">
                <div class="pantalla-caja">
                    <span class="pantalla-caja__ultimo" data-ultimo>Esperando el primer producto</span>
                    <b class="pantalla-caja__total" data-total>${esc(pesosCaja(0))}</b>
                    <span class="pantalla-caja__cuantos"><span>Total</span><span data-cuantos></span></span>
                </div>
                <ul class="caja-super__renglones"></ul>
                <div class="visor-caja">
                    <button class="boton boton--ancho visor-caja__cobrar" type="button" data-cobrar>${esc(textoBoton)}</button>
                </div>
            </section>
        </div>
        <p class="solo-lector" aria-live="polite" data-anuncio></p>`;
    document.body.append(capa);
    document.documentElement.classList.add("con-caja");
    activarBotonSonido(capa, prefijo);

    const lugarGondola = capa.querySelector(".gondola");
    const lista = capa.querySelector(".caja-super__renglones");
    const anuncio = capa.querySelector("[data-anuncio]");
    const visor = capa.querySelector(".visor");
    const botonEscanear = capa.querySelector("[data-escanear]");

    const campoBuscar = capa.querySelector("[data-buscar]");
    const pintarGondola = () => {
        const texto = campoBuscar?.value.trim() ?? "";
        const lista = texto && buscar ? buscar(texto) : gondola().filter((p) => !seccion || texto || p.seccion === seccion);
        capa.querySelectorAll("[data-seccion]").forEach((b) => {
            b.classList.toggle("activo", b.dataset.seccion === seccion);
            b.setAttribute("aria-selected", String(b.dataset.seccion === seccion));
        });
        lugarGondola.innerHTML = lista.length ? lista.map((p) => `
            <button class="gondola__producto${p.stock === 0 ? " gondola__producto--sin" : ""}" type="button" data-producto="${esc(p.id)}">
                <i class="ti ${esc(p.icono ?? "ti-package")}" aria-hidden="true"></i>
                <span>${esc(p.corto ?? p.nombre)}</span>${p.detalle ? `<small>${esc(p.detalle)}</small>` : ""}
                <b class="gondola__precio">${esc(pesosCaja(p.precio))}</b>
            </button>`).join("") : `<p class="nota">No hay nada con ese nombre.</p>`;
        lugarGondola.querySelectorAll("[data-producto]").forEach((b) => b.addEventListener("click", () => sumar(productos().find((p) => p.id === b.dataset.producto))));
    };

    const pintarTicket = () => {
        const renglones = renglonesDe(ticket, productos(), precioPara);
        const total = totalDe(renglones);
        const cuantos = renglones.reduce((n, r) => n + r.cantidad, 0);
        lista.innerHTML = renglones.length ? renglones.map((r) => `
            <li class="caja-super__renglon${r.id === ultimoId ? " caja-super__renglon--nuevo" : ""}">
                <span class="caja-super__cantidad">${esc(r.cantidad)} ×</span>
                <span class="caja-super__nombre">${esc(r.nombre)}${r.mayor ? ` <span class="pastilla pastilla--bien">por mayor ${esc(pesosCaja(r.precio))} c/u</span>` : ""}${r.quedan !== null && r.quedan <= STOCK_BAJO ? ` <span class="pastilla pastilla--ojo">${r.quedan ? `quedan ${esc(r.quedan)}` : "no quedan más"}</span>` : ""}</span>
                <b class="caja-super__importe">${esc(pesosCaja(r.subtotal))}</b>
                <span class="caja-super__botones">
                    <button class="boton-icono" type="button" data-menos="${esc(r.id)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>
                    <button class="boton-icono" type="button" data-mas="${esc(r.id)}" aria-label="Uno más de ${esc(r.nombre)}"><i class="ti ti-plus"></i></button>
                    <button class="boton-icono caja-super__sacar" type="button" data-sacar="${esc(r.id)}" aria-label="Sacar ${esc(r.nombre)} del ticket"><i class="ti ti-trash"></i></button>
                </span>
            </li>`).join("") + `<li class="caja-super__vaciar"><button class="boton-link" type="button" data-vaciar><i class="ti ti-trash"></i> Vaciar el ticket</button></li>`
            : `<li class="caja-super__vacio"><i class="ti ti-shopping-cart" aria-hidden="true"></i> Escaneá o tocá un producto para empezar.</li>`;
        capa.querySelector("[data-total]").textContent = pesosCaja(total);
        if (!renglones.length) capa.querySelector("[data-ultimo]").textContent = "Esperando el primer producto";
        const todos = productos();
        lugarGondola.querySelectorAll("[data-producto]").forEach((b) => {
            const p = todos.find((x) => x.id === b.dataset.producto);
            const agotado = !!p && p.stock !== undefined && p.stock !== null && (ticket.get(p.id) ?? 0) >= p.stock;
            b.classList.toggle("gondola__producto--sin", agotado);
            b.setAttribute("aria-disabled", String(agotado));
        });
        capa.querySelector("[data-cuantos]").textContent = `${cuantos} ${cuantos === 1 ? "producto" : "productos"}`;
        capa.querySelector("[data-cobrar]").disabled = !renglones.length;
        lista.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.menos, -1)));
        lista.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas, 1)));
        lista.querySelectorAll("[data-sacar]").forEach((b) => b.addEventListener("click", () => {
            ticket.delete(b.dataset.sacar);
            ultimoId = null;
            pintarTicket();
        }));
        lista.querySelector("[data-vaciar]")?.addEventListener("click", () => {
            if (!confirm("¿Vaciar el ticket? Se sacan todos los productos.")) return;
            ticket.clear();
            ultimoId = null;
            pintarTicket();
        });
        lista.querySelector(".caja-super__renglon--nuevo")?.scrollIntoView({ block: "nearest" });
        return total;
    };

    let ultimoError = { texto: "", cuando: 0 };
    const avisarError = (texto) => {
        if (texto === ultimoError.texto && Date.now() - ultimoError.cuando < 4000) return;
        ultimoError = { texto, cuando: Date.now() };
        aviso(texto, "error");
    };

    function sumar(producto) {
        const r = sumarAlTicket(ticket, producto);
        if (!r.ok) {
            avisarError(r.mensaje);
            anuncio.textContent = r.mensaje;
            return false;
        }
        ultimoId = producto.id;
        pip(prefijo);
        vibrar(30);
        const total = pintarTicket();
        capa.querySelector("[data-ultimo]").textContent = `${r.cantidad} × ${producto.nombre} · ${pesosCaja(precioPara(producto, r.cantidad))}`;
        const pantalla = capa.querySelector(".pantalla-caja");
        pantalla.classList.remove("pantalla-caja--sumo");
        void pantalla.offsetWidth;
        pantalla.classList.add("pantalla-caja--sumo");
        anuncio.textContent = `Agregado: ${producto.nombre}. Total ${pesosCaja(total)}`;
        return true;
    }

    function cambiar(id, cuantos) {
        const r = sumarAlTicket(ticket, productos().find((p) => p.id === id), cuantos);
        if (!r.ok) avisarError(r.mensaje);
        ultimoId = null;
        pintarTicket();
    }

    const leer = (codigo) => {
        const p = buscarCodigo(codigo);
        if (!p) {
            avisarError("Ese QR no es de este negocio.");
            return;
        }
        sumar(p);
    };

    const apagarCamara = () => {
        pararCamara?.();
        pararCamara = null;
        visor.hidden = true;
        if (botonEscanear) botonEscanear.innerHTML = `<i class="ti ti-scan"></i> Escanear`;
    };

    botonEscanear?.addEventListener("click", () => {
        if (pararCamara) return apagarCamara();
        visor.hidden = false;
        botonEscanear.innerHTML = `<i class="ti ti-camera-off"></i> Apagar`;
        pararCamara = escanearSeguido(visor.querySelector("video"), leer, {
            alFallar: (e) => {
                apagarCamara();
                aviso(e?.name === "NotAllowedError" ? "Sin permiso para la cámara: tocá los productos de la góndola." : "No se pudo usar la cámara: tocá los productos de la góndola.", "error");
            }
        });
    });

    function cerrar(forzar = false, desdeAtras = false) {
        if (!forzar && ticket.size && !confirm("¿Cerrar la caja? Se pierde el ticket que estás armando.")) return false;
        apagarCamara();
        removeEventListener("popstate", alVolver);
        if (!desdeAtras && history.state?.cajaSuper) history.back();
        document.removeEventListener("keydown", teclas);
        document.documentElement.classList.remove("con-caja");
        capa.remove();
        alCerrar();
    }

    function abrirCobro() {
        const renglones = renglonesDe(ticket, productos(), precioPara);
        if (!renglones.length) return;
        const total = totalDe(renglones);
        const paraDividir = medios.filter((m) => !["fiado", "cuenta"].includes(m.id));
        let dividido = false;
        const hoja = document.createElement("div");
        hoja.className = "hoja-cobro";
        hoja.setAttribute("role", "dialog");
        hoja.setAttribute("aria-label", `Cobrar ${pesosCaja(total)}`);
        hoja.innerHTML = `
            <div class="hoja-cobro__caja">
                <h2 class="hoja-cobro__titulo">Cobrar <b>${esc(pesosCaja(total))}</b></h2>
                <div class="hoja-cobro__medios" role="group" aria-label="Cómo paga">
                    ${medios.map((m) => `<button class="hoja-cobro__medio" type="button" data-medio="${esc(m.id)}"><i class="ti ${esc(m.icono ?? "ti-cash")}" aria-hidden="true"></i>${esc(m.texto)}</button>`).join("")}
                </div>
                <div class="hoja-cobro__efectivo">
                    <label>Paga con <small>(si querés saber el vuelto)</small>
                        <input name="pagaCon" type="text" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="Ej: 10000">
                    </label>
                    ${billetes.length ? `<div class="hoja-cobro__billetes">${billetes.map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesosCaja(b))}</button>`).join("")}</div>` : ""}
                    <p class="hoja-cobro__vuelto" data-vuelto></p>
                </div>
                ${paraDividir.length > 1 ? `
                <button class="boton-link hoja-cobro__dividir-boton" type="button" data-dividir aria-pressed="false"><i class="ti ti-arrows-split"></i> Dividir el pago (por ejemplo, mitad y mitad)</button>
                <div class="hoja-cobro__dividir" hidden>
                    ${[0, 1].map((i) => `
                    <div class="hoja-cobro__parte">
                        <select data-medio-parte="${i}" aria-label="Medio de la parte ${i + 1}">${paraDividir.map((m, n) => `<option value="${esc(m.id)}"${n === i ? " selected" : ""}>${esc(m.texto)}</option>`).join("")}</select>
                        <input data-monto-parte="${i}" type="text" inputmode="numeric" maxlength="9" autocomplete="off" aria-label="Monto de la parte ${i + 1}" value="${i === 0 ? Math.floor(total / 2) : total - Math.floor(total / 2)}">
                    </div>`).join("")}
                    <p class="hoja-cobro__vuelto" data-dividir-aviso></p>
                </div>` : ""}
                <button class="boton boton--grande boton--ancho" type="button" data-confirmar><i class="ti ti-check"></i> Confirmar</button>
                <button class="boton-link" type="button" data-volver>Volver al ticket</button>
            </div>`;
        capa.append(hoja);
        const pagaCon = hoja.querySelector("[name=pagaCon]");
        const pintarMedio = () => {
            hoja.querySelectorAll("[data-medio]").forEach((b) => b.classList.toggle("activo", !dividido && b.dataset.medio === medio));
            hoja.querySelector(".hoja-cobro__medios").hidden = dividido;
            hoja.querySelector(".hoja-cobro__efectivo").hidden = dividido || medio !== "efectivo";
            const lugar = hoja.querySelector(".hoja-cobro__dividir");
            if (lugar) lugar.hidden = !dividido;
            hoja.querySelector("[data-dividir]")?.setAttribute("aria-pressed", String(dividido));
        };
        const montoDe = (i) => Number(String(hoja.querySelector(`[data-monto-parte="${i}"]`)?.value ?? "").split(",")[0].replace(/\D/g, "")) || 0;
        const pagosDivididos = () => [0, 1].map((i) => ({ medio: hoja.querySelector(`[data-medio-parte="${i}"]`).value, monto: montoDe(i) }));
        hoja.querySelector("[data-dividir]")?.addEventListener("click", () => {
            dividido = !dividido;
            pintarMedio();
        });
        [0, 1].forEach((i) => hoja.querySelector(`[data-monto-parte="${i}"]`)?.addEventListener("input", () => {
            const otro = hoja.querySelector(`[data-monto-parte="${1 - i}"]`);
            otro.value = String(Math.max(0, total - montoDe(i)));
            hoja.querySelector("[data-dividir-aviso]").textContent = "";
        }));
        const pintarVuelto = () => {
            const v = vueltoDe(total, pagaCon.value);
            hoja.querySelector("[data-vuelto]").innerHTML = !v.ok ? esc(v.mensaje) : v.vuelto === null ? "" : `Vuelto <b>${esc(pesosCaja(v.vuelto))}</b>`;
        };
        hoja.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
            medio = b.dataset.medio;
            pintarMedio();
        }));
        hoja.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
            pagaCon.value = b.dataset.billete;
            pintarVuelto();
        }));
        pagaCon.addEventListener("input", pintarVuelto);
        hoja.querySelector("[data-volver]").addEventListener("click", () => hoja.remove());
        let cobrado = false;
        hoja.querySelector("[data-confirmar]").addEventListener("click", () => {
            if (cobrado) return;
            const v = !dividido && medio === "efectivo" ? vueltoDe(total, pagaCon.value) : { ok: true, vuelto: null };
            if (!v.ok) return aviso(v.mensaje, "error");
            let pagos = null;
            if (dividido) {
                try {
                    pagos = revisarPagos(total, pagosDivididos(), paraDividir.map((m) => m.id));
                } catch (err) {
                    hoja.querySelector("[data-dividir-aviso]").textContent = err.message;
                    return;
                }
            }
            try {
                const items = [...ticket].map(([productoId, cantidad]) => ({ productoId, cantidad }));
                const hecho = cobrar(dividido ? { items, medio: DIVIDIDO, pagos, pagaCon: null } : { items, medio, pagaCon: v.pagaCon ?? null });
                cobrado = true;
                const vuelto = hecho?.vuelto ?? v.vuelto;
                ticket.clear();
                ultimoId = null;
                pintarTicket();
                pintarGondola();
                hoja.querySelector(".hoja-cobro__caja").innerHTML = `
                    <div class="hecho hecho--chico hoja-cobro__lista">
                        <i class="ti ti-circle-check" aria-hidden="true"></i>
                        <h2 class="titulo">Venta lista</h2>
                        <p>${esc(pesosCaja(total))} · ${esc(pagos ? pagos.map((x) => `${medios.find((m) => m.id === x.medio)?.texto ?? x.medio} ${pesosCaja(x.monto)}`).join(" + ") : medios.find((m) => m.id === medio)?.texto ?? "")}</p>
                        ${vuelto !== null && vuelto !== undefined ? `<p class="hoja-cobro__vuelto-grande">Vuelto <b>${esc(pesosCaja(vuelto))}</b></p>` : ""}
                    </div>
                    <button class="boton boton--grande boton--ancho" type="button" data-siguiente><i class="ti ti-arrow-right"></i> Siguiente cliente</button>`;
                hoja.querySelector("[data-siguiente]").addEventListener("click", () => hoja.remove());
                hoja.querySelector("[data-siguiente]").focus();
            } catch (err) {
                aviso(err, "error");
            }
        });
        pintarMedio();
        hoja.querySelector("[data-confirmar]").focus();
    }

    function verQR() {
        const lista = gondola();
        let i = -1;
        const hoja = document.createElement("div");
        hoja.className = "hoja-qr";
        hoja.setAttribute("role", "dialog");
        hoja.setAttribute("aria-label", "Los QR de los productos");
        const pintar = () => {
            hoja.innerHTML = i < 0 ? `
                <div class="hoja-qr__barra">
                    <b>QR de los productos</b>
                    <button class="boton boton--chico boton--secundario" type="button" data-imprimir><i class="ti ti-printer"></i> Imprimir</button>
                    <button class="boton-icono" type="button" data-cerrar-qr aria-label="Cerrar"><i class="ti ti-x"></i></button>
                </div>
                <p class="nota">Abrí esta pantalla en otro celu o imprimila, y escaneá desde la caja. Tocá uno para verlo grande.</p>
                <ul class="hoja-qr__grilla">${lista.map((p, n) => `
                    <li><button type="button" data-uno="${n}"><img src="${esc(imagenQR(p))}" alt="" width="120" height="120" loading="lazy"><span>${esc(p.nombre)}</span></button></li>`).join("")}</ul>`
                : `
                <div class="hoja-qr__uno">
                    <img src="${esc(imagenQR(lista[i]))}" alt="QR de ${esc(lista[i].nombre)}" width="280" height="280">
                    <b>${esc(lista[i].nombre)}</b>
                    <div class="acciones">
                        <button class="boton boton--secundario" type="button" data-todos><i class="ti ti-layout-grid"></i> Todos</button>
                        <button class="boton" type="button" data-siguiente-qr>Siguiente <i class="ti ti-arrow-right"></i></button>
                    </div>
                </div>`;
            hoja.querySelector("[data-imprimir]")?.addEventListener("click", () => print());
            hoja.querySelector("[data-cerrar-qr]")?.addEventListener("click", () => hoja.remove());
            hoja.querySelectorAll("[data-uno]").forEach((b) => b.addEventListener("click", () => {
                i = Number(b.dataset.uno);
                pintar();
            }));
            hoja.querySelector("[data-todos]")?.addEventListener("click", () => {
                i = -1;
                pintar();
            });
            hoja.querySelector("[data-siguiente-qr]")?.addEventListener("click", () => {
                i = (i + 1) % lista.length;
                pintar();
            });
        };
        pintar();
        capa.append(hoja);
    }

    function teclas(e) {
        if (e.key === "Escape") {
            const arriba = capa.querySelector(".hoja-qr, .hoja-cobro");
            if (arriba) arriba.remove();
            else cerrar();
            return;
        }
        if (e.target.closest?.("input, textarea, select, button")) return;
        if (e.key === "Enter" && !capa.querySelector(".hoja-cobro, .hoja-qr")) abrirCobro();
    }

    campoBuscar?.addEventListener("input", pintarGondola);
    capa.querySelectorAll("[data-seccion]").forEach((b) => b.addEventListener("click", () => {
        seccion = b.dataset.seccion;
        pintarGondola();
        pintarTicket();
    }));
    function alVolver() {
        const arriba = capa.querySelector(".hoja-qr, .hoja-cobro");
        if (arriba || (ticket.size && !confirm("¿Cerrar la caja? Se pierde el ticket que estás armando."))) {
            arriba?.remove();
            history.pushState({ cajaSuper: true }, "");
            return;
        }
        cerrar(true, true);
    }
    history.pushState({ cajaSuper: true }, "");
    addEventListener("popstate", alVolver);
    capa.querySelector("[data-cerrar]").addEventListener("click", () => cerrar());
    capa.querySelector("[data-cobrar]").addEventListener("click", abrirCobro);
    capa.querySelector("[data-ver-qr]")?.addEventListener("click", verQR);
    document.addEventListener("keydown", teclas);
    pintarGondola();
    pintarTicket();
    capa.querySelector("[data-cerrar]").focus();
    return { capa, sumar, leer, cerrar, ticket };
}
