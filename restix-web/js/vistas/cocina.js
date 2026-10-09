// ============================================
// La cocina (Beto; la moza también la puede mirar): los pedidos que llegan, lo más viejo primero, con cuánto hace que
// esperan (en rojo si pasan los 15 minutos). "Listo" lo saca y la mesa ve "comida lista".
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=940a8526b8";
import { ticket, guia, activarGuias, haceMin, hora } from "./comunes.js?v=940a8526b8";

const DEMORA_MIN = 15;

export function vistaCocina(cont, { usuario, datos, irA }, recien = null) {
    const c = datos.cocina(usuario);
    const esCocina = usuario.rol === "cocina";
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Cocina</h1>
            <span class="contador-grande">${c.pendientes.length} <small>${c.pendientes.length === 1 ? "pedido" : "pedidos"}</small></span>
        </div>
        ${recien ? `
        <div class="hecho hecho--chico">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <p><b>${esc(recien.mesa)}: listo.</b> La moza lo ve en la mesa.</p>
        </div>
        ${guia("u-moza", recien.mesaId.startsWith("py") ? "/inicio" : `/mesa/${recien.mesaId}`, "Mirá cómo lo ve Lara")}` : ""}
        ${!esCocina ? `<p class="nota"><i class="ti ti-info-circle"></i> Esto es lo que ve la cocina. "Listo" lo marca Beto.</p>` : ""}
        ${c.pendientes.length ? `<div class="tickets">${c.pendientes.map((p) => `
            <div class="pendiente${p.nueva ? " pendiente--nueva" : ""}${p.minutos >= DEMORA_MIN ? " pendiente--demora" : ""}">
                ${ticket(p)}
                <div class="pendiente__pie">
                    <span>${p.nueva ? `<span class="etiqueta etiqueta--nueva">Nuevo</span> ` : ""}${esc(haceMin(p.minutos))}</span>
                    ${esCocina ? `<button class="boton" type="button" data-listo="${esc(p.id)}"><i class="ti ti-check"></i> Listo</button>` : ""}
                </div>
            </div>`).join("")}</div>` : `<p class="nota vacio-cocina"><i class="ti ti-mood-smile"></i> No hay nada pendiente. ¡A respirar!</p>`}
        ${c.listas.length ? `
        <h2 class="subtitulo"><i class="ti ti-history"></i> Lo último que salió</h2>
        <ul class="salieron">${c.listas.map((l) => `<li><b>${esc(l.mesa)}</b> · ${esc(l.items.map((i) => `${i.cantidad} ${i.nombre}`).join(", "))}<small>${esc(hora(l.listaEn))}</small></li>`).join("")}</ul>` : ""}`;
    activarGuias(cont, irA);
    cont.querySelectorAll("[data-listo]").forEach((b) => b.addEventListener("click", () => {
        try {
            const hecho = datos.marcarLista(usuario, b.dataset.listo);
            aviso(`${hecho.mesa}: listo`);
            vistaCocina(cont, { usuario, datos, irA }, hecho);
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err.message, "error");
        }
    }));
}
