// ============================================
// Piezas que comparten las pantallas de Sazzo Ferretería: el botón del recorrido (del kit), las pastillas de stock y
// de estado de un presupuesto, los pasos (pedido → enviado → aceptado → vendido), la tarjeta de un presupuesto, el
// formulario de cobro (Vender y "Pasar a venta") y "hace cuánto". Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=d783fb01c6";
import { diaLocalDe, fechaLocalISO } from "../../kit/js/fechas.js?v=d783fb01c6";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=d783fb01c6";
import { ESTADOS_PRESUPUESTO, MEDIOS, TOPES, UNIDADES, pesos, cantidadTexto, diaMes } from "../datos.js?v=d783fb01c6";
import { buscarPersona } from "../marca.js?v=d783fb01c6";

/** Botón del recorrido con la persona de la ferretería: guia("u-empleado", "/presupuestos", "Mirá lo que le llega a Nahuel"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

/** La foto de ejemplo que manda Marcos ("lo de la foto": una canilla que pierde). */
export const FOTO_EJEMPLO = { src: "img/lo-de-la-foto.svg", alt: "Foto de ejemplo: una canilla de 1/2 pulgada que pierde agua" };
export const htmlFoto = (clase = "foto-pedido") => `<img class="${esc(clase)}" src="${esc(FOTO_EJEMPLO.src)}" alt="${esc(FOTO_EJEMPLO.alt)}" width="320" height="240" loading="lazy" decoding="async">`;

const STOCK = {
    sin: { texto: "No hay", clase: "mal", icono: "ti-circle-x" },
    pedir: { texto: "Hay que pedir", clase: "ojo", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "bien", icono: "ti-circle-check" },
    servicio: { texto: "Servicio", clase: "neutra", icono: "ti-key" }
};

export function pastillaStock(p) {
    const e = STOCK[p.estado];
    const cuantos = p.estado === "sin" || p.estado === "servicio" ? "" : ` · ${esc(cantidadTexto(p.stock, p.unidad))}`;
    return `<span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}${cuantos}</span>`;
}

/** "por metro" / "por kilo" (nada si es por unidad). */
export const etiquetaUnidad = (unidad) => (unidad && unidad !== "u" ? `<span class="etiqueta etiqueta--unidad">por ${esc(UNIDADES[unidad].nombre)}</span>` : "");

const ESTADO = { pedido: "ojo", enviado: "neutra", aceptado: "bien", vendido: "bien", anulado: "mal" };
const ICONO_ESTADO = { pedido: "ti-clipboard-list", enviado: "ti-send", aceptado: "ti-thumb-up", vendido: "ti-circle-check", anulado: "ti-ban" };

export const pastillaEstado = (estado, vencido = false) => vencido
    ? `<span class="pastilla pastilla--mal"><i class="ti ti-clock" aria-hidden="true"></i>Venció</span>`
    : `<span class="pastilla pastilla--${ESTADO[estado]}"><i class="ti ${ICONO_ESTADO[estado]}" aria-hidden="true"></i>${esc(ESTADOS_PRESUPUESTO[estado])}</span>`;

/** Los cuatro pasos de un presupuesto, con el que va marcado. */
export function pasos(pr, { cliente = false } = {}) {
    if (pr.estado === "anulado") return `<p class="nota"><i class="ti ti-ban"></i> Este presupuesto se anuló${pr.anuladoPor ? ` (${esc(pr.anuladoPor)})` : ""}.</p>`;
    const hecho = { pedido: 1, enviado: 2, aceptado: 3, vendido: 4 }[pr.estado];
    const paso = (n, texto, cuandoFue) => `
        <li class="pasos__paso${n <= hecho ? " pasos__paso--hecho" : ""}${n === hecho + 1 ? " pasos__paso--sigue" : ""}">
            <span class="pasos__numero" aria-hidden="true">${n <= hecho ? '<i class="ti ti-check"></i>' : n}</span>
            <span>${texto}${cuandoFue ? `<small>${esc(cuandoFue)}</small>` : ""}</span>
        </li>`;
    return `<ol class="pasos pasos--cuatro" aria-label="Cómo va el presupuesto">
        ${paso(1, "Pedido", pr.creado ? cuando(pr.creado) : "")}
        ${paso(2, cliente ? "Te lo mandaron" : "Enviado", pr.enviado ? cuando(pr.enviado) : "")}
        ${paso(3, "Aceptado", pr.aceptado ? cuando(pr.aceptado) : "")}
        ${paso(4, cliente ? "Retirado" : "Vendido", pr.vendido ? cuando(pr.vendido) : "")}
    </ol>`;
}

/** Tarjeta corta de un presupuesto (en Presupuestos y en Mis presupuestos). */
export const tarjetaPresupuesto = (pr, href) => `
    <li><a class="tarjeta tarjeta--link presupuesto presupuesto--${esc(pr.estado)}" href="${esc(href)}">
        <div class="tarjeta__fila">
            <span class="tarjeta__titulo"><i class="ti ti-file-text" aria-hidden="true"></i>N° ${esc(pr.numero)} · ${esc(pr.cliente || "Sin nombre")}</span>
            ${pastillaEstado(pr.estado, pr.vencido)}
        </div>
        <p class="tarjeta__quien">${pr.obra ? `${esc(pr.obra)} · ` : ""}${esc(pr.items.length)} ${pr.items.length === 1 ? "renglón" : "renglones"} · <b>${pr.sinResolver ? "a completar" : esc(pesos(pr.total))}</b></p>
        <p class="tarjeta__quien">${pr.origen === "web" ? '<i class="ti ti-device-mobile" aria-hidden="true"></i> Pedido desde el celu' : '<i class="ti ti-building-store" aria-hidden="true"></i> En el mostrador'} · ${esc(cuando(pr.creado))}${pr.sinResolver && pr.estado === "pedido" ? ` · <span class="falta">${esc(pr.sinResolver)} sin elegir</span>` : ""}${pr.items.some((i) => i.foto) ? ' · <i class="ti ti-photo" aria-hidden="true"></i> con foto' : ""}</p>
    </a></li>`;

/** "Vale hasta el 17/10" / "Venció el 03/10". */
export const validez = (pr) => (pr.vence ? (pr.vencido ? `Venció el ${diaMes(pr.vence)}` : `Vale hasta el ${diaMes(pr.vence)}`) : "");

/** "hoy", "ayer", "hace 5 días". */
export function haceDias(iso) {
    if (!iso) return "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    const dias = Math.round((hoy - d) / 864e5);
    return dias <= 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`;
}

/** Días enteros desde una fecha (para "debe hace 40 días"). */
export function diasDesde(iso) {
    if (!iso) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((hoy - d) / 864e5));
}

export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "hoy 15:20", "ayer 10:05" o "hace 3 días". */
export function cuando(iso) {
    const dia = diaLocalDe(iso);
    if (dia === fechaLocalISO(0)) return `hoy ${hora(iso)}`;
    if (dia === fechaLocalISO(-1)) return `ayer ${hora(iso)}`;
    return haceDias(iso);
}

/** La barrita de cuánto del tope de la cuenta ya usó. */
export const barraTope = (c) => {
    const pct = c.tope ? Math.min(100, Math.round((c.deuda / c.tope) * 100)) : 100;
    const nivel = pct >= 90 ? "mal" : pct >= 70 ? "ojo" : "bien";
    return `<span class="tope tope--${nivel}" role="img" aria-label="Usó el ${pct} % del tope"><span style="width:${pct}%"></span></span>`;
};

/** Billetes "redondos" para cobrar: el próximo múltiplo de $10.000, $20.000 y $50.000 (y $2.000 / $5.000 si es poco). */
const billetesPara = (total) => [...new Set([2_000, 5_000, 10_000, 20_000, 50_000].map((b) => Math.ceil(Math.max(1, total) / b) * b))].filter((b) => b >= total).slice(0, 4);

/**
 * El formulario de cobro: cómo paga (efectivo con "paga con" y vuelto, transferencia, tarjeta o a cuenta corriente con
 * aviso de tope) y el botón. `cuentaFija`: el presupuesto ya es de una cuenta (no se elige). Al cobrar llama a
 * alCobrar({ medio, pagaCon, clienteId, autorizarTope }); si tira error, lo muestra quien lo llama.
 */
export function pintarCobro(lugar, { usuario, datos, total, medio = "efectivo", cuentaFija = null, conCuenta = true, textoBoton = "Cobrar", alCambiarMedio = () => {}, alCobrar }) {
    const medios = Object.entries(MEDIOS).filter(([id]) => id !== "cuenta" || conCuenta);
    if (!medios.some(([id]) => id === medio)) medio = "efectivo";
    const cuentas = medio === "cuenta" && !cuentaFija ? datos.listarCuentas(usuario) : [];
    lugar.innerHTML = `
        <div class="chips medios" role="radiogroup" aria-label="Cómo paga">
            ${medios.map(([id, texto]) => `<button class="chip${medio === id ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === id}" data-medio="${id}">${id === "cuenta" ? '<i class="ti ti-user-dollar" aria-hidden="true"></i>' : ""}${esc(texto)}</button>`).join("")}
        </div>
        <form class="formulario cobrar" novalidate>
            ${medio === "efectivo" ? `
            <label>Paga con (si querés saber el vuelto)
                <input name="pagaCon" type="number" inputmode="numeric" min="0" max="${TOPES.pagaCon}" step="1" placeholder="Ej: ${esc(billetesPara(total)[0] ?? 10000)}">
            </label>
            <div class="billetes">${billetesPara(total).map((b) => `<button class="chip" type="button" data-billete="${b}">${esc(pesos(b))}</button>`).join("")}</div>
            <p class="vuelto" aria-live="polite"></p>` : ""}
            ${medio === "cuenta" ? (cuentaFija ? "" : `
            <label>¿A qué cuenta?
                <select name="cuenta">
                    <option value="">Elegí la cuenta</option>
                    ${cuentas.map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)} · debe ${esc(pesos(c.deuda))}</option>`).join("")}
                </select>
            </label>`) + `<p class="tope-aviso" aria-live="polite"></p>` : ""}
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ${medio === "cuenta" ? "ti-user-dollar" : "ti-cash"}"></i> ${esc(textoBoton)} ${esc(pesos(total))}${medio === "cuenta" ? " a cuenta" : ""}</button>
        </form>`;

    const form = lugar.querySelector(".cobrar");
    const otraVez = (m) => pintarCobro(lugar, { usuario, datos, total, medio: m, cuentaFija, conCuenta, textoBoton, alCambiarMedio, alCobrar });
    lugar.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
        alCambiarMedio(b.dataset.medio);
        otraVez(b.dataset.medio);
    }));

    const pagaCon = form.pagaCon;
    const mostrarVuelto = () => {
        const n = Number(pagaCon.value);
        const p = form.querySelector(".vuelto");
        if (!pagaCon.value) p.textContent = "";
        else if (!Number.isInteger(n) || n < total) p.innerHTML = `<span class="falta">Con ${esc(pesos(n || 0))} no alcanza.</span>`;
        else p.innerHTML = `Vuelto: <b>${esc(pesos(n - total))}</b>`;
    };
    pagaCon?.addEventListener("input", mostrarVuelto);
    form.querySelectorAll("[data-billete]").forEach((b) => b.addEventListener("click", () => {
        pagaCon.value = b.dataset.billete;
        mostrarVuelto();
    }));

    const cuentaElegida = () => cuentaFija ?? (form.cuenta?.value || null);
    const avisoTope = () => {
        const p = form.querySelector(".tope-aviso");
        const id = cuentaElegida();
        if (!p) return;
        if (!id) return (p.textContent = "");
        const t = datos.revisarTopeCuenta(id, total);
        p.className = `tope-aviso${t.pasa ? " tope-aviso--pasa" : ""}`;
        p.innerHTML = t.pasa
            ? `<i class="ti ti-alert-triangle"></i> Debería ${esc(pesos(t.despues))} y su tope es ${esc(pesos(t.tope))}.${usuario.rol === "dueno" ? " Si cobrás igual, lo autorizás vos." : " Lo tiene que autorizar Osvaldo."}`
            : `Debe ${esc(pesos(t.deuda))} → con esto, ${esc(pesos(t.despues))} (tope ${esc(pesos(t.tope))}).`;
    };
    form.cuenta?.addEventListener("change", avisoTope);
    avisoTope();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const clienteId = medio === "cuenta" ? cuentaElegida() : null;
        let autorizarTope = false;
        if (clienteId && usuario.rol === "dueno" && datos.revisarTopeCuenta(clienteId, total).pasa) {
            if (!confirm("Se pasa del tope de la cuenta. ¿Lo autorizás igual?")) return;
            autorizarTope = true;
        }
        alCobrar({ medio, pagaCon: pagaCon?.value ? Number(pagaCon.value) : null, clienteId, autorizarTope });
    });
}
