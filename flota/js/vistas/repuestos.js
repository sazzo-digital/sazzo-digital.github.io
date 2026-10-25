// ============================================
// Repuestos (administradora y mecánico): "hay / queda poco / no hay". Se descuentan solos cuando el mecánico
// cierra un arreglo diciendo qué usó.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=2acd6c7b7a";
import { cantidadCon, MOTIVOS_STOCK, TOPES } from "../datos.js?v=2acd6c7b7a";
import { haceCuanto, consignaPersona, activarPasos } from "./comunes.js?v=2acd6c7b7a";

const ESTADOS = {
    "no-hay": { texto: "No hay", clase: "problema", icono: "ti-circle-x" },
    poco: { texto: "Queda poco", clase: "taller", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "andando", icono: "ti-circle-check" }
};
const ORDEN = { "no-hay": 0, poco: 1, hay: 2 };

let moviendo = null;

export function vistaRepuestos(cont, { usuario, datos }) {
    const lista = datos.listarRepuestos().sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);
    const movimientos = datos.movimientosStock();
    cont.innerHTML = `
        <h1 class="titulo">Repuestos</h1>
        ${consignaPersona(datos, usuario)}
        <p class="nota"><i class="ti ti-info-circle"></i> Bajan solos con cada arreglo y cada service. Lo que entra, se vende o sale, se anota acá.</p>
        <ul class="tarjetas">${lista.map((r) => {
            const e = ESTADOS[r.estado];
            return `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ti-package" aria-hidden="true"></i>${esc(r.nombre)}</span>
                    <span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}</span>
                </div>
                <p class="tarjeta__quien"><b class="cantidad">${esc(cantidadCon(r.cantidad, r.unidad))}</b> · avisa con ${esc(r.minimo)} o menos</p>
                <div class="acciones">
                    <button class="boton boton--chico boton--secundario" type="button" data-mover="${esc(r.id)}" data-motivo="entrada"><i class="ti ti-truck-delivery"></i> Entró</button>
                    <button class="boton boton--chico boton--secundario" type="button" data-mover="${esc(r.id)}" data-motivo="venta"${r.cantidad ? "" : " disabled"}><i class="ti ti-cash"></i> Vendí o salió</button>
                </div>
                ${moviendo?.id === r.id ? `
                <form class="formulario mover-stock" novalidate>
                    <div class="chips" role="radiogroup" aria-label="Qué pasó">
                        ${["entrada", "venta", "salida"].map((m) => `<button class="chip${moviendo.motivo === m ? " activo" : ""}" type="button" role="radio" aria-checked="${moviendo.motivo === m}" data-motivo-elegido="${m}">${esc(MOTIVOS_STOCK[m].texto)}</button>`).join("")}
                    </div>
                    <label>¿Cuántos ${esc(r.unidad)}?
                        <input name="cantidad" type="number" inputmode="numeric" min="1" max="${TOPES.entrada}" step="1" value="1">
                    </label>
                    <label>Detalle <small>(si querés)</small>
                        <input name="detalle" maxlength="${TOPES.detalle}" placeholder="${moviendo.motivo === "entrada" ? "Ej: compra al proveedor" : moviendo.motivo === "venta" ? "Ej: le vendí a un taller" : "Ej: para el auto del dueño"}" autocomplete="off">
                    </label>
                    <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Anotar</button>
                    <button class="boton-link" type="button" data-cerrar-mover>Cancelar</button>
                </form>` : ""}
            </li>`;
        }).join("")}</ul>
        <h2 class="subtitulo"><i class="ti ti-arrows-exchange"></i> Últimos movimientos</h2>
        ${movimientos.length ? `<ul class="tarjetas movimientos-stock">${movimientos.map((m) => `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(MOTIVOS_STOCK[m.motivo]?.icono ?? "ti-package")}" aria-hidden="true"></i>${esc(MOTIVOS_STOCK[m.motivo]?.texto ?? "")} · ${esc(m.nombre)}</span>
                    <b class="cantidad">${m.cantidad > 0 ? "+" : "−"}${esc(Math.abs(m.cantidad))}</b>
                </div>
                <p class="tarjeta__quien">${m.detalle ? `${esc(m.detalle)} · ` : ""}${esc(m.quien)} · ${esc(haceCuanto(m.cuando))}</p>
            </li>`).join("")}</ul>` : `<p class="nota">Todavía no hubo movimientos. Probá con "Entró" o hacé un service desde un vehículo.</p>`}`;

    activarPasos(cont);
    const otraVez = () => vistaRepuestos(cont, { usuario, datos });
    cont.querySelectorAll("[data-mover]").forEach((b) => b.addEventListener("click", () => {
        moviendo = moviendo?.id === b.dataset.mover && moviendo.motivo === b.dataset.motivo ? null : { id: b.dataset.mover, motivo: b.dataset.motivo };
        otraVez();
        cont.querySelector(".mover-stock [name=cantidad]")?.focus();
    }));
    cont.querySelectorAll("[data-motivo-elegido]").forEach((b) => b.addEventListener("click", () => {
        moviendo = { ...moviendo, motivo: b.dataset.motivoElegido };
        otraVez();
    }));
    cont.querySelector("[data-cerrar-mover]")?.addEventListener("click", () => {
        moviendo = null;
        otraVez();
    });
    cont.querySelector(".mover-stock")?.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const r = datos.moverStock(usuario, moviendo.id, { motivo: moviendo.motivo, cantidad: Number(e.target.cantidad.value), detalle: e.target.detalle.value });
            aviso(`${MOTIVOS_STOCK[moviendo.motivo].texto} anotado · ${r.nombre}: ${cantidadCon(r.cantidad, r.unidad)}`);
            moviendo = null;
            otraVez();
        } catch (err) {
            aviso(err, "error");
        }
    });
}
