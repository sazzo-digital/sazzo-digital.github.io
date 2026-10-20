// ============================================
// La cocina (Beto; la moza también la puede mirar): los pedidos que llegan, lo más viejo primero, con cuánto hace que
// esperan (en rojo si pasan los 15 minutos). "Listo" lo saca y la mesa ve "comida lista".
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=59fd6f5326";
import { mantenerPantallaPrendida, htmlBotonVoz, activarBotonVoz, decir } from "../../kit/js/celular.js?v=59fd6f5326";
import { MARCA, NEGOCIO } from "../marca.js?v=59fd6f5326";
import { ticket, guia, activarGuias, haceMin, hora } from "./comunes.js?v=59fd6f5326";
import { htmlConsigna } from "../../kit/js/consigna.js?v=59fd6f5326";
import { htmlBotonTV, abrirModoTV } from "../../kit/js/modo-tv.js?v=59fd6f5326";

const DEMORA_MIN = 15;
const leidas = new Set(); // los pedidos que ya se leyeron en voz alta (una vez cada uno)

/** "Mesa 4: 2 Muzzarella, 1 Fernet" para leer en voz alta. */
const enVoz = (p) => `${p.mesa}: ${(p.items ?? []).map((i) => `${i.cantidad} ${i.nombre}`).join(", ")}`;

function leerNuevos(pendientes) {
    for (const p of pendientes.filter((x) => x.nueva && !leidas.has(x.id))) {
        if (!decir(MARCA.prefijo, enVoz(p))) return;
        leidas.add(p.id);
    }
}

export function vistaCocina(cont, { usuario, datos, irA }, recien = null) {
    mantenerPantallaPrendida(); // la cocina mira los pedidos de lejos: que la pantalla no se apague
    const c = datos.cocina(usuario);
    const esCocina = usuario.rol === "cocina";
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Cocina</h1>
            <span class="contador-grande">${c.pendientes.length} <small>${c.pendientes.length === 1 ? "pedido" : "pedidos"}</small></span>
            <span class="titulo-con-accion__botones">${htmlBotonVoz(MARCA.prefijo, "Leer los pedidos en voz alta")}${htmlBotonTV("Pedidos en la tele")}</span>
        </div>
        ${recien ? `
        <div class="hecho hecho--chico">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <p><b>${esc(recien.mesa)}: listo.</b> La moza lo ve en la mesa.</p>
        </div>
        ${htmlConsigna({ paso: 2, total: 3, accion: "Marcá el pedido listo.", hecho: `${recien.mesa} lista`, guia: guia("u-moza", recien.mesaId.startsWith("py") ? "/inicio" : `/mesa/${recien.mesaId}`, "Mirá cómo lo ve Lara") })}` : ""}
        ${!recien && esCocina && c.pendientes.length ? htmlConsigna({ paso: 2, total: 3, accion: "Tocá “Listo” en el pedido de la Mesa 4.", resultado: "Lara ve que la comida está lista para servir." }) : ""}
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
    cont.querySelector("[data-modo-tv]").addEventListener("click", () => abrirModoTV({ titulo: NEGOCIO, icono: "ti-chef-hat", armar: () => htmlTVCocina(datos.cocina(usuario)) }));
    activarBotonVoz(cont, MARCA.prefijo, { alPrender: () => setTimeout(() => leerNuevos(c.pendientes), 1800) });
    leerNuevos(c.pendientes);
    cont.querySelectorAll("[data-listo]").forEach((b) => b.addEventListener("click", () => {
        try {
            const hecho = datos.marcarLista(usuario, b.dataset.listo);
            aviso(`${hecho.mesa}: listo`);
            vistaCocina(cont, { usuario, datos, irA }, hecho);
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err, "error");
        }
    }));
}

export function htmlTVCocina({ pendientes, listas }) {
    return `<div class="tv-grilla">
        <section class="tv-tarjeta">
            <span class="tv-tarjeta__rotulo">En preparación · ${esc(pendientes.length)}</span>
            ${pendientes.length ? `<ul class="tv-lista">${pendientes.slice(0, 7).map((p) => `
                <li${p.minutos >= DEMORA_MIN ? ` class="tv-lista__ojo"` : ""}><i class="ti ti-flame" aria-hidden="true"></i><b>${esc(p.mesa)}</b><small>${esc(haceMin(p.minutos))}</small></li>`).join("")}
            </ul>` : `<span class="tv-tarjeta__chico">No hay nada en el fuego.</span>`}
        </section>
        <section class="tv-tarjeta tv-tarjeta--ahora">
            <span class="tv-tarjeta__rotulo">Listo para servir</span>
            ${listas.length ? `<ul class="tv-lista">${listas.slice(0, 7).map((l) => `
                <li><i class="ti ti-circle-check" aria-hidden="true"></i><b>${esc(l.mesa)}</b><small>${esc(hora(l.listaEn))}</small></li>`).join("")}
            </ul>` : `<span class="tv-tarjeta__chico">Todavía no salió nada.</span>`}
        </section>
    </div>`;
}
