// ============================================
// Vender (Ricardo y Darío), en el mostrador: los cortes que más salen y los de cada animal a mano, y un buscador que
// entiende cómo pide la gente ("chori", "molida") y perdona errores ("bacio"). Pesaje: se toca el corte y se escribe
// el peso de la balanza (1,625) o la plata ("$8.000 de picada" → cuánto cortar); el precio del renglón sale solo.
// La etiqueta de la balanza (código que empieza con 20) se lee con la cámara o con el lector, y suma el corte con su
// peso. Ticket con vuelto, alias para la transferencia, "ding" al cobrar y la vista previa del ticket.
// En la compu, dos columnas (cortes | ticket); en el celular, el ticket abajo con una barrita arriba que lleva a él.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=5c760847bf";
import { puedeEscanear, escanear } from "../../kit/js/escaner.js?v=5c760847bf";
import { mantenerPantallaPrendida, htmlCopiable, activarCopiables, htmlBotonSonido, activarBotonSonido, ding } from "../../kit/js/celular.js?v=5c760847bf";
import { TOPES, MEDIOS, ALIAS, ANIMALES, ETIQUETA, pesos, kilos, aGramos, precioPorPeso, gramosPara, leerEtiqueta } from "../datos.js?v=5c760847bf";
import { MARCA, NEGOCIO } from "../marca.js?v=5c760847bf";
import { campoKg, kgEnCampo, precioDe, hora } from "./comunes.js?v=5c760847bf";

// El ticket en curso queda en memoria mientras se navega (se vacía al cobrar)
const ticket = new Map(); // articuloId → { gramos } o { unidades }
let medio = "efectivo";
let animal = null; // null = lo que más sale
let pesando = null; // { id, modo: "kg" | "plata" } mientras se escribe el peso de un corte

const BILLETES = [10_000, 20_000, 50_000];
const RAPIDOS_KG = [0.5, 1, 1.5, 2];

export function vistaVender(cont, { usuario, datos }) {
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
            ${htmlBotonSonido(MARCA.prefijo)}
        </div>
        <button class="ticket-barra" type="button" hidden></button>
        <div class="caja-venta">
            <section class="productos" aria-label="Cortes">
                <form class="buscar" novalidate>
                    <label class="buscador">
                        <i class="ti ti-search" aria-hidden="true"></i>
                        <span class="solo-lector">Buscar un corte o leer una etiqueta</span>
                        <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Corte, código o etiqueta (Enter)">
                    </label>
                    ${puedeEscanear() ? `<button class="boton boton--secundario" type="button" data-camara><i class="ti ti-camera"></i><span class="solo-lector">Leer la etiqueta de la balanza con la cámara</span></button>` : ""}
                </form>
                <p class="nota etiquetas-link"><i class="ti ti-barcode"></i> ¿Sin balanza a mano? <a href="#/stock/etiquetas">Etiquetas de ejemplo</a> para leer con la cámara.</p>
                <nav class="chips rubros" aria-label="Por animal"></nav>
                <div class="pesar" hidden></div>
                <div class="grilla-productos"></div>
            </section>
            <section class="ticket" id="ticket" aria-label="Ticket"></section>
        </div>`;

    const q = cont.querySelector("[name=q]");
    const grilla = cont.querySelector(".grilla-productos");
    const chips = cont.querySelector(".rubros");
    const panelPesar = cont.querySelector(".pesar");
    const lugarTicket = cont.querySelector(".ticket");
    const barra = cont.querySelector(".ticket-barra");
    barra.addEventListener("click", () => lugarTicket.scrollIntoView({ block: "start", behavior: "smooth" }));

    /** Suma un artículo por unidad (o lo deja en `fija`). */
    const cambiarUnidades = (id, { cuantos = 1, fija = null } = {}) => {
        const a = datos.articulo(id);
        const nueva = fija ?? (ticket.get(id)?.unidades ?? 0) + cuantos;
        if (nueva > Math.min(a.stock, TOPES.unidades)) {
            aviso(a.stock > TOPES.unidades ? `Hasta ${TOPES.unidades} por venta.` : a.stock ? `De ${a.nombre} quedan ${a.stock}.` : `No queda ${a.nombre}.`, "error");
            return pintarTicket();
        }
        if (!Number.isInteger(nueva) || nueva <= 0) ticket.delete(id);
        else ticket.set(id, { unidades: nueva });
        pintarTicket();
    };

    /** Deja un corte en el ticket con su peso (revisa tope y stock antes). */
    function ponerPeso(id, gramos) {
        const a = datos.articulo(id);
        if (!Number.isInteger(gramos) || gramos < TOPES.gramosMin || gramos > TOPES.gramos) {
            aviso(`El peso tiene que estar entre ${kilos(TOPES.gramosMin)} y ${kilos(TOPES.gramos, 0)}.`, "error");
            return false;
        }
        if (gramos > a.stock) {
            aviso(a.stock > 0 ? `De ${a.nombre} quedan ${kilos(a.stock)}.` : `No queda ${a.nombre}.`, "error");
            return false;
        }
        ticket.set(id, { gramos });
        pintarTicket();
        return true;
    }

    function pintarChips() {
        const chip = (id, texto, icono) => `<button class="chip${animal === id ? " activo" : ""}" type="button" data-animal="${esc(id ?? "")}">${icono ? `<i class="ti ${icono}" aria-hidden="true"></i>` : ""}${esc(texto)}</button>`;
        chips.innerHTML = chip(null, "Lo que más sale", "ti-flame") + ANIMALES.map((x) => chip(x.id, x.nombre, x.icono)).join("");
        chips.querySelectorAll("[data-animal]").forEach((b) => b.addEventListener("click", () => {
            animal = b.dataset.animal || null;
            q.value = "";
            pintarChips();
            pintarCortes();
        }));
    }

    function pintarCortes() {
        const texto = q.value.trim();
        chips.hidden = !!texto;
        const lista = texto ? datos.listarArticulos({ texto }).slice(0, 16) : animal ? datos.listarArticulos({ animal }) : datos.rapidos();
        grilla.innerHTML = `
            ${texto ? `<p class="rotulo-chico">${lista.length ? "Resultados" : ""}</p>` : ""}
            ${lista.length ? `<div class="botones-productos">${lista.map((a) => {
                const sin = a.stock <= 0;
                return `
                <button class="producto${sin ? " producto--sin" : ""}${pesando?.id === a.id ? " producto--elegido" : ""}" type="button" data-agregar="${esc(a.id)}"${sin ? " disabled" : ""}>
                    <span class="producto__nombre">${esc(a.nombre)}</span>
                    <span class="producto__precio">${esc(precioDe(a))}</span>
                    ${sin ? `<small>No hay</small>` : `<small>${a.venta === "kg" ? `hay ${esc(kilos(a.stock, 1))}` : `hay ${esc(a.stock)}`}</small>`}
                </button>`;
            }).join("")}</div>`
            : vacio("No hay cortes con ese nombre.", "ti-search")}`;
        grilla.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => elegir(b.dataset.agregar)));
    }

    /** Tocar un corte: por unidad suma uno; por kilo abre el pesaje. */
    function elegir(id) {
        const a = datos.articulo(id);
        if (a.venta === "unidad") return cambiarUnidades(id);
        pesando = { id, modo: pesando?.id === id ? pesando.modo : "kg" };
        pintarPesar();
        pintarCortes();
    }

    /** El pesaje de un corte: el peso de la balanza o la plata, con la cuenta a la vista. */
    function pintarPesar() {
        if (!pesando) {
            panelPesar.hidden = true;
            return;
        }
        const a = datos.articulo(pesando.id);
        const enTicket = ticket.get(a.id)?.gramos ?? null;
        const plata = pesando.modo === "plata";
        panelPesar.hidden = false;
        panelPesar.innerHTML = `
            <form class="formulario bloque pesar__caja" novalidate>
                <div class="tarjeta__fila">
                    <h2 class="subtitulo"><i class="ti ti-scale"></i> ${esc(a.nombre)} · ${esc(precioDe(a))}</h2>
                    <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar el pesaje"><i class="ti ti-x"></i></button>
                </div>
                <div class="chips" role="radiogroup" aria-label="Cómo lo pide">
                    <button class="chip${plata ? "" : " activo"}" type="button" role="radio" aria-checked="${!plata}" data-modo="kg"><i class="ti ti-scale" aria-hidden="true"></i>Por peso</button>
                    <button class="chip${plata ? " activo" : ""}" type="button" role="radio" aria-checked="${plata}" data-modo="plata"><i class="ti ti-cash" aria-hidden="true"></i>En plata</button>
                </div>
                ${plata ? `
                <label>¿Cuánta plata? ($)
                    <input name="plata" type="number" inputmode="numeric" min="${TOPES.plataMin}" max="${TOPES.plata}" step="1" placeholder="Ej: 8000" required>
                </label>` : `
                <label>Peso de la balanza
                    ${campoKg({ nombre: "kg", valor: kgEnCampo(enTicket), requerido: true })}
                </label>
                <div class="chips rapidos-kg">${RAPIDOS_KG.map((k) => `<button class="chip" type="button" data-kg="${k}">${esc(kilos(k * 1000, k % 1 ? 1 : 0))}</button>`).join("")}</div>`}
                <p class="cuenta-peso" aria-live="polite"></p>
                <button class="boton boton--ancho" type="submit"><i class="ti ti-plus"></i> ${enTicket ? "Cambiar en el ticket" : "Sumar al ticket"}</button>
            </form>`;
        const f = panelPesar.querySelector("form");
        const campo = f.kg ?? f.plata;
        const cuenta = f.querySelector(".cuenta-peso");
        const gramosDe = () => (plata ? (f.plata.value ? gramosPara(Number(f.plata.value), a.precio) : NaN) : aGramos(f.kg.value));
        const mostrar = () => {
            const g = gramosDe();
            if (!campo.value) cuenta.textContent = "";
            else if (plata && !(Number.isInteger(Number(f.plata.value)) && Number(f.plata.value) >= TOPES.plataMin && Number(f.plata.value) <= TOPES.plata)) cuenta.innerHTML = `<span class="falta">Entre ${esc(pesos(TOPES.plataMin))} y ${esc(pesos(TOPES.plata))}.</span>`;
            else if (!Number.isInteger(g)) cuenta.innerHTML = `<span class="falta">Escribí los kilos con hasta 3 decimales (ej: 1,625).</span>`;
            else if (plata) cuenta.innerHTML = `Cortá <b>${esc(kilos(g))}</b> · ${esc(pesos(precioPorPeso(g, a.precio)))}`;
            else cuenta.innerHTML = `${esc(kilos(g))} × ${esc(pesos(a.precio))} = <b>${esc(pesos(precioPorPeso(g, a.precio)))}</b>`;
        };
        campo.addEventListener("input", mostrar);
        mostrar();
        if (matchMedia("(min-width: 1000px)").matches) campo.focus();
        f.querySelector("[data-cerrar]").addEventListener("click", () => {
            pesando = null;
            pintarPesar();
            pintarCortes();
        });
        f.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => {
            pesando.modo = b.dataset.modo;
            pintarPesar();
        }));
        f.querySelectorAll("[data-kg]").forEach((b) => b.addEventListener("click", () => {
            f.kg.value = kgEnCampo(Number(b.dataset.kg) * 1000);
            mostrar();
        }));
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const g = gramosDe();
            if (!Number.isInteger(g)) return aviso(plata ? `Escribí la plata (entre ${pesos(TOPES.plataMin)} y ${pesos(TOPES.plata)}).` : "Escribí los kilos con hasta 3 decimales (ej: 1,625).", "error");
            if (plata && !(Number(f.plata.value) >= TOPES.plataMin && Number(f.plata.value) <= TOPES.plata)) return aviso(`La plata tiene que estar entre ${pesos(TOPES.plataMin)} y ${pesos(TOPES.plata)}.`, "error");
            if (ponerPeso(a.id, g)) {
                pesando = null;
                pintarPesar();
                pintarCortes();
                q.value = "";
                if (matchMedia("(min-width: 1000px)").matches) q.focus();
            }
        });
    }

    function pintarTicket() {
        const items = [...ticket].map(([articuloId, c]) => ({ articuloId, ...c }));
        let armado = { renglones: [], total: 0, gramos: 0 };
        try {
            if (items.length) armado = datos.armarTicket(items);
        } catch (e) {
            aviso(e, "error");
        }
        barra.hidden = !items.length;
        barra.innerHTML = `<i class="ti ti-receipt" aria-hidden="true"></i> ${items.length} ${items.length === 1 ? "renglón" : "renglones"} · <b>${esc(pesos(armado.total))}</b> <span>Cobrar ↓</span>`;
        lugarTicket.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-receipt"></i> Ticket</h2>
            ${items.length ? `
            <ul class="renglones">${armado.renglones.map((r) => `
                <li class="renglon">
                    <span class="renglon__nombre">${esc(r.nombre)}
                        <small>${r.venta === "kg" ? `${esc(kilos(r.gramos))} × ${esc(pesos(r.precio))}/kg` : `${esc(pesos(r.precio))} c/u`}</small>
                    </span>
                    ${r.venta === "kg" ? `
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-repesar="${esc(r.articuloId)}" aria-label="Cambiar el peso de ${esc(r.nombre)}"><i class="ti ti-scale"></i></button>
                        <button class="boton-icono" type="button" data-quitar="${esc(r.articuloId)}" aria-label="Sacar ${esc(r.nombre)}"><i class="ti ti-x"></i></button>
                    </span>` : `
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-menos="${esc(r.articuloId)}" aria-label="Uno menos de ${esc(r.nombre)}"><i class="ti ti-minus"></i></button>
                        <input class="contador-uso__cantidad" type="number" inputmode="numeric" min="1" max="${TOPES.unidades}" step="1" value="${esc(r.unidades)}" data-cantidad="${esc(r.articuloId)}" aria-label="Unidades de ${esc(r.nombre)}">
                        <button class="boton-icono" type="button" data-mas="${esc(r.articuloId)}" aria-label="Uno más de ${esc(r.nombre)}"><i class="ti ti-plus"></i></button>
                    </span>`}
                    <span class="renglon__total">${esc(pesos(r.subtotal))}</span>
                </li>`).join("")}
            </ul>
            <div class="total"><span>Total${armado.gramos ? ` <small>${esc(kilos(armado.gramos, 2))}</small>` : ""}</span><b>${esc(pesos(armado.total))}</b></div>
            <div class="chips medios" role="radiogroup" aria-label="Cómo paga">
                ${Object.entries(MEDIOS).map(([id, texto]) => `<button class="chip${medio === id ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === id}" data-medio="${id}">${texto}</button>`).join("")}
            </div>
            <form class="formulario cobrar" novalidate>
                ${medio === "efectivo" ? `
                <label>Paga con (si querés saber el vuelto)
                    <input name="pagaCon" type="number" inputmode="numeric" min="0" max="${TOPES.pagaCon}" step="1" placeholder="Ej: 20000">
                </label>
                <div class="billetes">${BILLETES.filter((b) => b >= armado.total).map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesos(b))}</button>`).join("")}</div>
                <p class="vuelto" aria-live="polite"></p>` : ""}
                ${medio === "transferencia" ? `<p class="alias">Que te transfiera al alias ${htmlCopiable(ALIAS, "Copiar el alias")}</p>` : ""}
                <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-cash"></i> Cobrar ${esc(pesos(armado.total))}</button>
            </form>
            <button class="boton-link vaciar" type="button"><i class="ti ti-trash"></i> Vaciar ticket</button>`
            : `<p class="nota"><i class="ti ti-hand-finger"></i> Tocá un corte y escribí el peso de la balanza, o leé la etiqueta.</p>`}`;

        activarCopiables(lugarTicket, "Alias copiado: pasáselo al cliente.");
        lugarTicket.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiarUnidades(b.dataset.mas, { cuantos: 1 })));
        lugarTicket.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiarUnidades(b.dataset.menos, { cuantos: -1 })));
        lugarTicket.querySelectorAll("[data-cantidad]").forEach((c) => c.addEventListener("change", () => {
            const n = c.value === "" ? 0 : Number(c.value);
            if (!Number.isInteger(n) || n < 0) {
                aviso(`Las unidades tienen que ser un número entero y hasta ${TOPES.unidades}.`, "error");
                return pintarTicket();
            }
            cambiarUnidades(c.dataset.cantidad, { fija: n });
        }));
        lugarTicket.querySelectorAll("[data-repesar]").forEach((b) => b.addEventListener("click", () => {
            elegir(b.dataset.repesar);
            panelPesar.scrollIntoView({ block: "center", behavior: "smooth" });
        }));
        lugarTicket.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => {
            ticket.delete(b.dataset.quitar);
            pintarTicket();
        }));
        lugarTicket.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
            medio = b.dataset.medio;
            pintarTicket();
        }));
        lugarTicket.querySelector(".vaciar")?.addEventListener("click", () => {
            ticket.clear();
            pintarTicket();
        });
        const form = lugarTicket.querySelector(".cobrar");
        if (!form) return;
        const pagaCon = form.pagaCon;
        const mostrarVuelto = () => {
            const n = Number(pagaCon.value);
            const p = lugarTicket.querySelector(".vuelto");
            if (!pagaCon.value) p.textContent = "";
            else if (!Number.isInteger(n) || n < armado.total) p.innerHTML = `<span class="falta">Con ${esc(pesos(n || 0))} no alcanza.</span>`;
            else p.innerHTML = `Vuelto: <b>${esc(pesos(n - armado.total))}</b>`;
        };
        pagaCon?.addEventListener("input", mostrarVuelto);
        lugarTicket.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
            pagaCon.value = b.dataset.billete;
            mostrarVuelto();
        }));
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const v = datos.vender(usuario, { items, medio, pagaCon: pagaCon?.value ? Number(pagaCon.value) : null });
                ticket.clear();
                ding(MARCA.prefijo);
                vendido(v);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    /** Después de cobrar: lo que pasó, la vista previa del ticket y los pedidos que esperan. */
    function vendido(v) {
        const paraPreparar = datos.listarPedidos(usuario, { estado: "nuevo" }).length;
        lugarTicket.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h2 class="titulo">Vendido</h2>
                <p>${esc(pesos(v.total))} · ${esc(MEDIOS[v.medio])}</p>
                ${v.vuelto !== null ? `<p class="vuelto vuelto--grande">Vuelto: <b>${esc(pesos(v.vuelto))}</b></p>` : ""}
                <div class="acciones">
                    <button class="boton" type="button" data-nueva><i class="ti ti-plus"></i> Nueva venta</button>
                    <button class="boton boton--secundario" type="button" data-ver-ticket><i class="ti ti-receipt"></i> Ver el ticket</button>
                </div>
            </div>
            <div class="vista-ticket" hidden>${htmlTicket(v)}</div>
            ${paraPreparar ? `<a class="boton boton--secundario boton--ancho" href="#/pedidos"><i class="ti ti-clipboard-list"></i> Hay ${esc(paraPreparar)} ${paraPreparar === 1 ? "pedido" : "pedidos"} para preparar</a>` : ""}`;
        barra.hidden = true;
        lugarTicket.querySelector("[data-nueva]").addEventListener("click", () => {
            medio = "efectivo";
            pintarTicket();
            q.focus();
        });
        lugarTicket.querySelector("[data-ver-ticket]").addEventListener("click", (e) => {
            const vista = lugarTicket.querySelector(".vista-ticket");
            vista.hidden = !vista.hidden;
            e.currentTarget.innerHTML = vista.hidden ? `<i class="ti ti-receipt"></i> Ver el ticket` : `<i class="ti ti-eye-off"></i> Esconder el ticket`;
        });
        if (matchMedia("(max-width: 999px)").matches) lugarTicket.scrollIntoView({ block: "start" });
        pintarCortes();
    }

    /** Enter en el buscador (o lo que lee la cámara): etiqueta de balanza, código de corte o un solo resultado. */
    function alBuscar(texto) {
        const t = texto.trim();
        if (!t) return;
        if (/^\d{13}$/.test(t)) {
            const e = leerEtiqueta(t);
            const a = e && datos.porPlu(e.plu);
            if (!e) return aviso(t.startsWith(ETIQUETA.prefijo) ? "Esa etiqueta no se lee bien: escaneala de nuevo." : "Ese código no es de una etiqueta de la balanza.", "error");
            if (!a) return aviso(`La etiqueta es del código ${e.plu}, que no está cargado.`, "error");
            if (a.venta !== "kg") return aviso(`${a.nombre} va por unidad: tocalo para sumarlo.`, "error");
            const g = e.gramos ?? gramosPara(e.importe, a.precio);
            if (ponerPeso(a.id, g)) {
                aviso(`${a.nombre}: ${kilos(g)} desde la etiqueta`);
                q.value = "";
                pintarCortes();
            }
            return;
        }
        const porCodigo = /^\d{1,5}$/.test(t) ? datos.porPlu(t) : null;
        const lista = porCodigo ? [porCodigo] : datos.listarArticulos({ texto: t });
        if (lista.length === 1) {
            q.value = "";
            elegir(lista[0].id);
        }
    }

    cont.querySelector(".buscar").addEventListener("submit", (e) => {
        e.preventDefault();
        alBuscar(q.value);
    });
    q.addEventListener("input", pintarCortes);
    cont.querySelector("[data-camara]")?.addEventListener("click", () => escanear(alBuscar, { formatos: ["ean_13"], texto: "Apuntá a la etiqueta de la balanza" }));
    activarBotonSonido(cont, MARCA.prefijo); // "ding" al cobrar, apagado de entrada
    mantenerPantallaPrendida();

    pintarChips();
    pintarCortes();
    pintarPesar();
    pintarTicket();
    if (!ticket.size) {
        cont.querySelector(".productos").insertAdjacentHTML("afterbegin", `<p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: tocá Asado y escribí el peso de la balanza (1,625), o pedí "$8.000 de picada" y fijate cuánto cortar.</p>`);
    }
}

/** La vista previa del ticket (para la impresora del mostrador en la versión real). No es un comprobante. */
export function htmlTicket(v) {
    const fecha = new Date(v.fecha);
    return `
        <div class="papel-ticket" role="img" aria-label="Vista previa del ticket">
            <p class="papel-ticket__negocio">${esc(NEGOCIO)}</p>
            <p>${esc(fecha.toLocaleDateString("es-AR"))} ${esc(hora(v.fecha))} · atendió ${esc(v.por)}</p>
            <hr>
            ${v.items.map((i) => `
            <p class="papel-ticket__renglon"><span>${esc(i.nombre)}</span><span>${esc(pesos(i.subtotal))}</span></p>
            <p class="papel-ticket__detalle">${i.venta === "kg" ? `${esc(kilos(i.gramos))} x ${esc(pesos(i.precio))}/kg` : `${esc(i.unidades)} x ${esc(pesos(i.precio))}`}</p>`).join("")}
            <hr>
            <p class="papel-ticket__renglon papel-ticket__total"><span>TOTAL</span><span>${esc(pesos(v.total))}</span></p>
            <p>${esc(MEDIOS[v.medio])}${v.vuelto !== null && v.vuelto !== undefined ? ` · pagó ${esc(pesos(v.pagaCon))} · vuelto ${esc(pesos(v.vuelto))}` : ""}</p>
            <p class="papel-ticket__demo">DEMO · no es un comprobante</p>
        </div>`;
}
