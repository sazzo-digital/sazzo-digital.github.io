// ============================================
// Lo de Claudia (clienta), desde el celular: elegir los cortes (por animal, o tocando la vaca), cuánto (de a medio
// kilo, "en plata" o por unidad) y cómo lo quiere ("milanesas finitas"), el combo del asado, el horario de retiro y
// pedir. El total es aproximado: la carnicería lo pesa y se ajusta. Después, en "Mis pedidos", cómo va.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=5c760847bf";
import { TOPES, ANIMALES, RETIROS, COMBO_ASADO, pesos, kilos, precioPorPeso, gramosPara } from "../datos.js?v=5c760847bf";
import { NEGOCIO } from "../marca.js?v=5c760847bf";
import { htmlMediaRes, activarMediaRes } from "../media-res.js?v=5c760847bf";
import { guia, activarGuias, pasos, pastillaEstado, cuando, precioDe, loPedido } from "./comunes.js?v=5c760847bf";

// Lo elegido queda en memoria mientras se navega
const carrito = new Map(); // articuloId → { modo, cantidad, aclaracion }
let animal = "vaca";
let zona = null; // la zona de la vaca tocada (filtra los cortes)
let abierto = null; // el corte al que se le está eligiendo la cantidad
let retiro = "12:30";

const KG = [500, 1000, 1500, 2000, 3000];

/** Lo aproximado de un renglón del carrito. */
const aproximado = (a, c) => (c.modo === "plata" ? c.cantidad : c.modo === "unidad" ? a.precio * c.cantidad : precioPorPeso(c.cantidad, a.precio));
const comoSePidio = (a, c) => (c.modo === "plata" ? `${pesos(c.cantidad)} (≈ ${kilos(gramosPara(c.cantidad, a.precio))})` : c.modo === "unidad" ? `${c.cantidad} u.` : kilos(c.cantidad, c.cantidad % 1000 ? (c.cantidad % 100 ? 3 : 1) : 0));

export function vistaPedir(cont, { usuario, datos, irA }) {
    const articulo = (id) => {
        try {
            return datos.articulo(id);
        } catch {
            carrito.delete(id); // ya no existe (se empezó de cero)
            return null;
        }
    };

    function pintar() {
        const lista = datos.listarArticulos({ animal }).filter((a) => !zona || zona.cortes.includes(a.nombre));
        const enVaca = animal === "vaca";
        cont.innerHTML = `
            <div class="titulo-con-accion">
                <h1 class="titulo">Hacé tu pedido</h1>
                <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
            </div>
            <p class="nota pista"><i class="ti ti-hand-finger"></i> Probá: tocá el asado en la vaca, pedí 1,5 kg, sumá picada y milanesas "finitas", y pedilo. La carnicería lo pesa y te avisa.</p>
            <button class="ticket-barra" type="button"${carrito.size ? "" : " hidden"}></button>
            <div class="pedir">
                <section>
                    <nav class="chips rubros" aria-label="Por animal">
                        ${ANIMALES.map((x) => `<button class="chip${animal === x.id ? " activo" : ""}" type="button" data-animal="${esc(x.id)}"><i class="ti ${esc(x.icono)}" aria-hidden="true"></i>${esc(x.nombre)}</button>`).join("")}
                    </nav>
                    ${enVaca ? `
                    ${htmlMediaRes({ activa: zona?.id ?? null, titulo: "La vaca: tocá un corte" })}
                    <p class="nota media-res__ayuda"><i class="ti ti-hand-finger"></i> ${zona ? `Elegiste: ${esc(zona.nombre.toLowerCase())} (abajo). <button class="boton-link" type="button" data-todos>Ver todos los cortes</button>` : "Tocá la vaca para ver ese corte, o elegí de la lista."}</p>` : ""}
                    ${animal === "parrilla" || enVaca && !zona ? htmlCombo() : ""}
                    ${lista.length ? `<ul class="cortes">${lista.map((a) => htmlCorte(a)).join("")}</ul>` : vacio("No hay cortes acá.", "ti-meat")}
                </section>
                <form class="bloque formulario resumen-lista mi-carrito" novalidate></form>
            </div>`;

        cont.querySelectorAll("[data-animal]").forEach((b) => b.addEventListener("click", () => {
            animal = b.dataset.animal;
            zona = null;
            abierto = null;
            pintar();
        }));
        activarMediaRes(cont, (z) => {
            zona = zona?.id === z.id ? null : z;
            const unico = zona && datos.listarArticulos({ animal: "vaca" }).filter((a) => zona.cortes.includes(a.nombre));
            abierto = unico?.length === 1 ? unico[0].id : null;
            pintar();
            cont.querySelector(".cortes")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
        cont.querySelector("[data-todos]")?.addEventListener("click", () => {
            zona = null;
            pintar();
        });
        cont.querySelectorAll("[data-abrir]").forEach((b) => b.addEventListener("click", () => {
            abierto = abierto === b.dataset.abrir ? null : b.dataset.abrir;
            pintar();
            cont.querySelector(`[data-corte="${CSS.escape(b.dataset.abrir)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }));
        cont.querySelectorAll("form[data-elegir]").forEach(activarElegir);
        cont.querySelectorAll("[data-combo]").forEach((b) => b.addEventListener("click", () => sumarCombo(Number(b.dataset.combo))));
        pintarCarrito();
    }

    /** La tarjeta de un corte y, si está abierta, cómo elegir cuánto. */
    function htmlCorte(a) {
        const en = carrito.get(a.id);
        const sin = a.stock <= 0;
        const porUnidad = a.venta === "unidad";
        return `
            <li class="corte${en ? " corte--en-pedido" : ""}" data-corte="${esc(a.id)}">
                <button class="corte__fila" type="button" data-abrir="${esc(a.id)}"${sin ? " disabled" : ""} aria-expanded="${abierto === a.id}">
                    <span class="corte__nombre">${esc(a.nombre)}${a.oferta ? ` <span class="etiqueta">oferta</span>` : ""}<small>${sin ? "No hay hoy" : en ? `En tu pedido: ${esc(comoSePidio(a, en))}` : porUnidad ? "por unidad" : "por kilo"}</small></span>
                    <b class="corte__precio">${esc(precioDe(a))}</b>
                    <i class="ti ${en ? "ti-circle-check" : "ti-plus"}" aria-hidden="true"></i>
                </button>
                ${abierto === a.id && !sin ? `
                <form class="formulario corte__elegir" novalidate data-elegir="${esc(a.id)}">
                    ${porUnidad ? `
                    <label>¿Cuántos?<input name="unidades" type="number" inputmode="numeric" min="1" max="${TOPES.unidades}" step="1" value="${esc(en?.cantidad ?? 1)}"></label>` : `
                    <div class="chips" role="radiogroup" aria-label="¿Cuánto?">
                        ${KG.map((g) => `<button class="chip${en?.modo === "kg" && en.cantidad === g || !en && g === 1000 ? " activo" : ""}" type="button" role="radio" data-gramos="${g}">${esc(kilos(g, g % 1000 ? 1 : 0))}</button>`).join("")}
                        <button class="chip${en?.modo === "plata" ? " activo" : ""}" type="button" role="radio" data-gramos="plata"><i class="ti ti-cash" aria-hidden="true"></i>En plata</button>
                    </div>
                    <input type="hidden" name="gramos" value="${esc(en?.modo === "kg" ? en.cantidad : en?.modo === "plata" ? "plata" : 1000)}">
                    <label class="corte__plata"${en?.modo === "plata" ? "" : " hidden"}>¿Cuánta plata? ($)<input name="plata" type="number" inputmode="numeric" min="${TOPES.plataMin}" max="${TOPES.plata}" step="1" value="${esc(en?.modo === "plata" ? en.cantidad : "")}" placeholder="Ej: 8000"></label>`}
                    <label>¿Cómo lo querés? (opcional)<input name="aclaracion" maxlength="${TOPES.aclaracion}" value="${esc(en?.aclaracion ?? "")}" placeholder="${esc(ejemploAclaracion(a))}"></label>
                    <p class="nota cuenta-peso" aria-live="polite"></p>
                    <div class="acciones">
                        <button class="boton" type="submit"><i class="ti ti-plus"></i> ${en ? "Cambiar" : "Sumar al pedido"}</button>
                        ${en ? `<button class="boton boton--secundario" type="button" data-sacar><i class="ti ti-trash"></i> Sacar</button>` : ""}
                    </div>
                </form>` : ""}
            </li>`;
    }

    function activarElegir(f) {
        const a = articulo(f.dataset.elegir);
        if (!a) return;
        const cuenta = f.querySelector(".cuenta-peso");
        const leer = () => {
            if (a.venta === "unidad") return { modo: "unidad", cantidad: Number(f.unidades.value) };
            if (f.gramos.value === "plata") return { modo: "plata", cantidad: f.plata.value === "" ? NaN : Number(f.plata.value) };
            return { modo: "kg", cantidad: Number(f.gramos.value) };
        };
        const mostrar = () => {
            const c = leer();
            const bien = c.modo === "unidad" ? Number.isInteger(c.cantidad) && c.cantidad >= 1 && c.cantidad <= TOPES.unidades
                : c.modo === "plata" ? Number.isInteger(c.cantidad) && c.cantidad >= TOPES.plataMin && c.cantidad <= TOPES.plata : true;
            cuenta.innerHTML = !bien ? (c.modo === "plata" && Number.isNaN(c.cantidad) ? "" : `<span class="falta">${c.modo === "plata" ? `Entre ${esc(pesos(TOPES.plataMin))} y ${esc(pesos(TOPES.plata))}.` : `De 1 a ${TOPES.unidades}.`}</span>`)
                : c.modo === "plata" ? `Te cortan unos ${esc(kilos(gramosPara(c.cantidad, a.precio)))}.`
                    : `Aprox. <b>${esc(pesos(aproximado(a, c)))}</b>`;
        };
        f.querySelectorAll("[data-gramos]").forEach((b) => b.addEventListener("click", () => {
            f.gramos.value = b.dataset.gramos;
            f.querySelectorAll("[data-gramos]").forEach((x) => x.classList.toggle("activo", x === b));
            f.querySelector(".corte__plata").hidden = b.dataset.gramos !== "plata";
            if (b.dataset.gramos === "plata") f.plata.focus();
            mostrar();
        }));
        f.unidades?.addEventListener("input", mostrar);
        f.plata?.addEventListener("input", mostrar);
        mostrar();
        f.querySelector("[data-sacar]")?.addEventListener("click", () => {
            carrito.delete(a.id);
            abierto = null;
            pintar();
        });
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            const c = leer();
            if (c.modo === "unidad" && !(Number.isInteger(c.cantidad) && c.cantidad >= 1 && c.cantidad <= TOPES.unidades)) return aviso(`Las unidades: de 1 a ${TOPES.unidades}.`, "error");
            if (c.modo === "plata" && !(Number.isInteger(c.cantidad) && c.cantidad >= TOPES.plataMin && c.cantidad <= TOPES.plata)) return aviso(`La plata tiene que estar entre ${pesos(TOPES.plataMin)} y ${pesos(TOPES.plata)}.`, "error");
            if (!carrito.has(a.id) && carrito.size >= TOPES.renglones) return aviso(`Un pedido puede tener hasta ${TOPES.renglones} cortes.`, "error");
            carrito.set(a.id, { ...c, aclaracion: f.aclaracion.value.slice(0, TOPES.aclaracion) });
            aviso(`${a.nombre} en tu pedido`);
            abierto = null;
            pintar();
        });
    }

    /** El combo del asado: suma lo que lleva para 4, 6 u 8 personas. */
    function htmlCombo() {
        return `
            <div class="bloque combo">
                <h2 class="subtitulo"><i class="ti ti-flame"></i> Asado del finde</h2>
                <p class="nota">Asado, vacío, chorizo, morcilla, provoleta y carbón, en la cantidad justa.</p>
                <div class="chips">${COMBO_ASADO.personas.map((n) => `<button class="chip" type="button" data-combo="${n}">Para ${n}</button>`).join("")}</div>
            </div>`;
    }

    function sumarCombo(personas) {
        let sumados = 0;
        for (const it of COMBO_ASADO.items) {
            const a = datos.listarArticulos({ texto: it.nombre }).find((x) => x.nombre === it.nombre);
            if (!a || a.stock <= 0) continue;
            if (!carrito.has(a.id) && carrito.size >= TOPES.renglones) break;
            carrito.set(a.id, it.gramos
                ? { modo: "kg", cantidad: Math.round((it.gramos * personas) / 100) * 100, aclaracion: carrito.get(a.id)?.aclaracion ?? "" }
                : { modo: "unidad", cantidad: Math.ceil(personas / it.cadaPersonas), aclaracion: "" });
            sumados++;
        }
        aviso(sumados ? `Asado para ${personas}: ${sumados} cosas en tu pedido` : "Hoy no hay lo del combo.", sumados ? "ok" : "error");
        pintar();
        cont.querySelector(".mi-carrito")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function pintarCarrito() {
        const form = cont.querySelector(".mi-carrito");
        const barra = cont.querySelector(".ticket-barra");
        const renglones = [...carrito].map(([id, c]) => ({ a: articulo(id), c })).filter((r) => r.a);
        const total = renglones.reduce((t, r) => t + aproximado(r.a, r.c), 0);
        barra.innerHTML = `<i class="ti ti-shopping-bag" aria-hidden="true"></i> ${renglones.length} ${renglones.length === 1 ? "corte" : "cortes"} · <b>${esc(pesos(total))}</b> aprox. <span>Pedir ↓</span>`;
        barra.onclick = () => form.scrollIntoView({ block: "start", behavior: "smooth" });
        form.innerHTML = `
            <h2 class="subtitulo"><i class="ti ti-shopping-bag"></i> Tu pedido</h2>
            ${renglones.length ? `
            <ul class="movimientos">${renglones.map(({ a, c }) => `
                <li class="movimiento">
                    <span><b>${esc(a.nombre)}</b><small>${esc(comoSePidio(a, c))}${c.aclaracion ? ` · “${esc(c.aclaracion)}”` : ""}</small></span>
                    <b class="monto">${esc(pesos(aproximado(a, c)))}</b>
                    <button class="boton-icono" type="button" data-quitar="${esc(a.id)}" aria-label="Sacar ${esc(a.nombre)}"><i class="ti ti-x"></i></button>
                </li>`).join("")}</ul>
            <div class="total"><span>Total aproximado</span><b>${esc(pesos(total))}</b></div>
            <p class="rotulo-chico">¿Cuándo lo retirás?</p>
            <div class="chips" role="radiogroup" aria-label="Cuándo lo retirás">
                ${RETIROS.map((r) => `<button class="chip${retiro === r ? " activo" : ""}" type="button" role="radio" aria-checked="${retiro === r}" data-retiro="${esc(r)}">${esc(r)}</button>`).join("")}
            </div>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-send"></i> Hacer el pedido</button>
            <p class="nota"><i class="ti ti-info-circle"></i> La carne se pesa al prepararla: el total puede variar un poco. Lo pagás cuando lo retirás.</p>`
            : `<p class="nota"><i class="ti ti-hand-finger"></i> Todavía no elegiste nada. Tocá un corte para sumarlo.</p>`}`;
        form.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => {
            carrito.delete(b.dataset.quitar);
            pintar();
        }));
        form.querySelectorAll("[data-retiro]").forEach((b) => b.addEventListener("click", () => {
            retiro = b.dataset.retiro;
            pintarCarrito();
        }));
        form.onsubmit = (e) => {
            e.preventDefault();
            try {
                const pe = datos.nuevoPedido(usuario, {
                    items: renglones.map(({ a, c }) => ({ articuloId: a.id, modo: c.modo, cantidad: c.cantidad, aclaracion: c.aclaracion })),
                    retiro
                });
                carrito.clear();
                pedido(pe);
            } catch (err) {
                aviso(err, "error");
            }
        };
    }

    /** Después de pedir: el número, qué sigue y el paso del recorrido. */
    function pedido(pe) {
        cont.innerHTML = `
            <div class="hecho">
                <i class="ti ti-circle-check" aria-hidden="true"></i>
                <h1 class="titulo">Pedido hecho</h1>
                <p>Pedido N° ${esc(pe.numero)} · retirás ${esc(pe.retiro === RETIROS[0] ? "lo antes posible" : `a las ${pe.retiro}`)}</p>
                <p class="vuelto vuelto--grande"><b>${esc(pesos(pe.estimado))}</b> aprox.</p>
                <p class="nota"><i class="ti ti-bell"></i> ${esc(NEGOCIO)} lo pesa, te avisa cuando está listo y te dice el total justo. Lo pagás al retirarlo.</p>
            </div>
            ${guia("u-empleado", `/pedidos/${pe.id}`, "Mirá lo que le llega a Darío")}
            <a class="boton boton--secundario boton--ancho" href="#/mis-pedidos"><i class="ti ti-list"></i> Ver mis pedidos</a>`;
        activarGuias(cont, irA);
        window.scrollTo(0, 0);
    }

    pintar();
}

/** Lo que se suele pedir de cada corte (de ejemplo en el campo de la aclaración). */
function ejemploAclaracion(a) {
    if (/milanesa/i.test(a.nombre)) return "Ej: finitas";
    if (/asado|vac[ií]o|matambre/i.test(a.nombre)) return "Ej: en tiras, para la parrilla";
    if (/picada/i.test(a.nombre)) return "Ej: pasada dos veces";
    if (/bife/i.test(a.nombre)) return "Ej: de 2 dedos";
    if (/pollo|pechuga|pata/i.test(a.nombre)) return "Ej: sin piel";
    return "Ej: en un solo pedazo";
}

const QUE_PASA = {
    nuevo: "La carnicería lo está preparando. Te avisan cuando está listo, con el total justo.",
    listo: "¡Ya está listo! Pasá a buscarlo y lo pagás ahí.",
    entregado: "Retirado. ¡Que lo disfrutes!",
    anulado: "Este pedido se anuló."
};

export function vistaMisPedidos(cont, { usuario, datos, irA }) {
    const lista = datos.misPedidos(usuario);
    cont.innerHTML = `
        <h1 class="titulo">Mis pedidos</h1>
        ${lista.length ? lista.map((pe) => `
        <section class="bloque mi-pedido">
            <div class="tarjeta__fila">
                <h2 class="subtitulo"><i class="ti ti-clipboard-list"></i> Pedido N° ${esc(pe.numero)}</h2>
                ${pastillaEstado(pe.estado)}
            </div>
            <p class="tarjeta__quien">Pedido ${esc(cuando(pe.creado))} · retirás ${esc(pe.retiro === RETIROS[0] ? "lo antes posible" : `a las ${pe.retiro}`)}</p>
            ${pasos(pe)}
            <p class="nota mi-pedido__estado"><i class="ti ti-info-circle"></i> ${esc(QUE_PASA[pe.estado])}</p>
            <ul class="movimientos">${pe.items.map((i) => `
                <li class="movimiento">
                    <span><b>${esc(i.nombre)}</b><small>Pediste ${esc(loPedido(i))}${i.gramos !== null && i.venta === "kg" ? ` · pesó ${esc(kilos(i.gramos))}` : ""}${i.aclaracion ? ` · “${esc(i.aclaracion)}”` : ""}</small></span>
                    <b class="monto">${esc(pesos(i.real ?? i.estimado))}</b>
                </li>`).join("")}</ul>
            <div class="total"><span>${pe.estado === "entregado" ? "Pagaste" : pe.real === null ? "Total aproximado" : "Total"}</span><b>${esc(pesos(pe.total))}</b></div>
            ${pe.diferencia ? `<p class="nota"><i class="ti ti-scale"></i> Con el peso justo: ${pe.diferencia > 0 ? "+" : "−"}${esc(pesos(Math.abs(pe.diferencia)))} de lo que calculaste.</p>` : ""}
            ${pe.estado === "nuevo" ? guia("u-empleado", `/pedidos/${pe.id}`, "Mirá lo que le llega a Darío") : ""}
        </section>`).join("")
        : `${vacio("Todavía no hiciste ningún pedido.", "ti-clipboard-list")}<p class="sin-pedidos"><a class="boton" href="#/inicio"><i class="ti ti-shopping-bag"></i> Hacer un pedido</a></p>`}`;
    activarGuias(cont, irA);
}

