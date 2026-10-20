import { esc, aviso } from "../../kit/js/ui.js?v=952176458b";
import { MEDIOS, TOPES, pesos, dividir } from "../datos.js?v=952176458b";
import { textoMedio } from "../../kit/js/pagos.js?v=952176458b";

export function htmlCuenta(c, { soyJugador = false } = {}) {
    return `
        <div class="cuenta-turno">
            <ul class="cuenta-turno__renglones">
                <li><span>Turno</span><b>${esc(pesos(c.turno))}</b></li>
                ${c.sena ? `<li class="cuenta-turno__menos"><span>Seña pagada</span><b>− ${esc(pesos(c.sena))}</b></li>` : ""}
                ${c.consumos.map((k) => `
                <li>
                    <span>${esc(k.cantidad)} × ${esc(k.nombre)}<small>${k.delJugador ? soyJugador ? "lo pediste vos" : `pidió ${esc(k.por)}` : `sumó ${esc(k.por)}`}${k.entregado ? "" : " · por entregar"}</small></span>
                    <b>${esc(pesos(k.subtotal))}</b>
                </li>`).join("")}
            </ul>
            ${c.pago ? `
            <p class="cuenta-turno__pagado"><i class="ti ti-circle-check" aria-hidden="true"></i> Pagado ${esc(pesos(c.pago.total))} · ${esc(textoMedio(c.pago, MEDIOS))}${c.pago.partes.length > 1 ? ` · ${esc(c.pago.partes.length)} partes de ${esc(pesos(c.pago.partes[0]))}` : ""}</p>`
            : `<p class="cuenta-turno__falta"><span>Falta cobrar</span><b>${esc(pesos(c.falta))}</b></p>`}
        </div>`;
}

export function pedirCantina(lugar, { datos, usuario, turnoId, textoBoton, alListo }) {
    const carrito = new Map();
    const pintar = () => {
        const productos = datos.cantina();
        const total = [...carrito].reduce((n, [id, k]) => n + (productos.find((p) => p.id === id)?.precio ?? 0) * k, 0);
        const cuantos = [...carrito.values()].reduce((n, k) => n + k, 0);
        lugar.innerHTML = `
            <div class="cantina-chica">
                <p class="cantina-chica__titulo"><i class="ti ti-cup" aria-hidden="true"></i> La cantina</p>
                <ul class="cantina-chica__lista">${productos.map((p) => `
                    <li class="cantina-chica__producto${p.stock ? "" : " cantina-chica__producto--sin"}">
                        <i class="ti ${esc(p.icono)}" aria-hidden="true"></i>
                        <span>${esc(p.nombre)}<small>${esc(pesos(p.precio))}${p.stock ? p.stock <= 3 ? ` · quedan ${esc(p.stock)}` : "" : " · no hay"}</small></span>
                        <span class="contador-uso">
                            <button class="boton-icono" type="button" data-menos="${esc(p.id)}" aria-label="Uno menos de ${esc(p.nombre)}"${carrito.get(p.id) ? "" : " disabled"}><i class="ti ti-minus"></i></button>
                            <b>${esc(carrito.get(p.id) ?? 0)}</b>
                            <button class="boton-icono" type="button" data-mas="${esc(p.id)}" aria-label="Uno más de ${esc(p.nombre)}"${p.stock > (carrito.get(p.id) ?? 0) && (carrito.get(p.id) ?? 0) < TOPES.cantidad ? "" : " disabled"}><i class="ti ti-plus"></i></button>
                        </span>
                    </li>`).join("")}
                </ul>
                <button class="boton boton--ancho" type="button" data-pedir${cuantos ? "" : " disabled"}><i class="ti ti-shopping-cart"></i> ${esc(textoBoton)}${cuantos ? ` · ${esc(pesos(total))}` : ""}</button>
                <button class="boton-link" type="button" data-cerrar-cantina>Cerrar</button>
            </div>`;
        lugar.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => {
            carrito.set(b.dataset.mas, (carrito.get(b.dataset.mas) ?? 0) + 1);
            pintar();
        }));
        lugar.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => {
            const n = (carrito.get(b.dataset.menos) ?? 0) - 1;
            if (n > 0) carrito.set(b.dataset.menos, n);
            else carrito.delete(b.dataset.menos);
            pintar();
        }));
        lugar.querySelector("[data-cerrar-cantina]").addEventListener("click", () => (lugar.innerHTML = ""));
        lugar.querySelector("[data-pedir]").addEventListener("click", () => {
            try {
                datos.sumarACuenta(usuario, turnoId, [...carrito].map(([productoId, cantidad]) => ({ productoId, cantidad })));
                alListo();
            } catch (err) {
                aviso(err, "error");
            }
        });
    };
    pintar();
    lugar.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function cobrarCuenta(lugar, { datos, usuario, turnoId, alListo }) {
    const c = datos.cuenta(turnoId);
    let medio = "efectivo";
    let partes = 1;
    const pagosDiv = [{ medio: "efectivo", monto: Math.floor(c.falta / 2) }, { medio: "debito", monto: c.falta - Math.floor(c.falta / 2) }];
    const pintar = () => {
        const montos = dividir(c.falta, partes);
        lugar.innerHTML = `
            <div class="cobro-cuenta">
                <p class="cobro-cuenta__total">Cobrar <b>${esc(pesos(c.falta))}</b></p>
                <div class="chips" role="radiogroup" aria-label="Cómo pagan">
                    ${Object.entries({ ...MEDIOS, dividido: "Dos medios" }).map(([id, texto]) => `<button class="chip${medio === id ? " activo" : ""}" type="button" role="radio" aria-checked="${medio === id}" data-medio="${id}">${esc(texto)}</button>`).join("")}
                </div>
                ${medio === "dividido" ? `<div class="cobro-cuenta__dos">${pagosDiv.map((x, i) => `
                    <div class="cobro-cuenta__parte">
                        <select data-medio-parte="${i}" aria-label="Medio de la parte ${i + 1}">${Object.entries(MEDIOS).map(([id, texto]) => `<option value="${id}"${x.medio === id ? " selected" : ""}>${esc(texto)}</option>`).join("")}</select>
                        <input data-monto-parte="${i}" type="text" inputmode="numeric" maxlength="9" value="${esc(x.monto)}" aria-label="Monto de la parte ${i + 1}">
                    </div>`).join("")}</div>` : ""}
                <div class="cobro-cuenta__dividir">
                    <span>Dividir entre</span>
                    <span class="contador-uso">
                        <button class="boton-icono" type="button" data-partes="-1" aria-label="Uno menos"${partes > 1 ? "" : " disabled"}><i class="ti ti-minus"></i></button>
                        <b>${esc(partes)}</b>
                        <button class="boton-icono" type="button" data-partes="1" aria-label="Uno más"${partes < TOPES.partes ? "" : " disabled"}><i class="ti ti-plus"></i></button>
                    </span>
                    ${partes > 1 ? `<small>${montos[0] === montos.at(-1) ? `${esc(partes)} × ${esc(pesos(montos[0]))}` : `${esc(pesos(montos[0]))} o ${esc(pesos(montos.at(-1)))} cada uno`}</small>` : ""}
                </div>
                <button class="boton boton--ancho boton--grande" type="button" data-confirmar-cobro><i class="ti ti-cash"></i> Cobrar ${esc(pesos(c.falta))}</button>
                <button class="boton-link" type="button" data-cerrar-cobro>Volver</button>
            </div>`;
        lugar.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
            medio = b.dataset.medio;
            pintar();
        }));
        lugar.querySelectorAll("[data-medio-parte]").forEach((sel) => sel.addEventListener("change", () => (pagosDiv[Number(sel.dataset.medioParte)].medio = sel.value)));
        lugar.querySelectorAll("[data-monto-parte]").forEach((inp) => inp.addEventListener("input", () => {
            const i = Number(inp.dataset.montoParte);
            pagosDiv[i].monto = Number(inp.value.replace(/\D/g, "")) || 0;
            pagosDiv[1 - i].monto = Math.max(0, c.falta - pagosDiv[i].monto);
            lugar.querySelector(`[data-monto-parte="${1 - i}"]`).value = String(pagosDiv[1 - i].monto);
        }));
        lugar.querySelectorAll("[data-partes]").forEach((b) => b.addEventListener("click", () => {
            partes = Math.min(TOPES.partes, Math.max(1, partes + Number(b.dataset.partes)));
            pintar();
        }));
        lugar.querySelector("[data-cerrar-cobro]").addEventListener("click", () => (lugar.innerHTML = ""));
        lugar.querySelector("[data-confirmar-cobro]").addEventListener("click", () => {
            try {
                datos.cobrarCuenta(usuario, turnoId, { medio, partes, pagos: medio === "dividido" ? pagosDiv.map((x) => ({ ...x })) : null });
                alListo();
            } catch (err) {
                aviso(err, "error");
            }
        });
    };
    pintar();
    lugar.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
