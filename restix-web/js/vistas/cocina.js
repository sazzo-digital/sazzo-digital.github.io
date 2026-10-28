// ============================================
// La cocina (Beto; la moza también la puede mirar): los pedidos que llegan, lo más viejo primero, con cuánto hace que
// esperan (en rojo si pasan los 15 minutos). "Listo" lo saca y la mesa ve "comida lista".
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=aa4351ebaa";
import { mantenerPantallaPrendida, htmlBotonVoz, activarBotonVoz, decir } from "../../kit/js/celular.js?v=aa4351ebaa";
import { MARCA, NEGOCIO } from "../marca.js?v=aa4351ebaa";
import { ticket, guia, activarGuias, haceMin, hora, consignaPersona } from "./comunes.js?v=aa4351ebaa";
import { activarConsigna } from "../../kit/js/consigna.js?v=aa4351ebaa";
import { htmlBotonTV, abrirModoTV } from "../../kit/js/modo-tv.js?v=aa4351ebaa";
import { alSalirDeLaPantalla } from "../../kit/js/rutas.js?v=aa4351ebaa";

const DEMORA_MIN = 15;
const relojes = new WeakMap();
const leidas = new Set(); // los pedidos que ya se leyeron en voz alta (una vez cada uno)

/** "Mesa 4: 2 Muzzarella, 1 Fernet" para leer en voz alta. */
const nombrePedido = (p) => `${p.mesa}${p.yaCobrada ? " · ya cobrada" : p.cobrando ? " · cobrando" : ""}`;
const enVoz = (p) => `${nombrePedido(p)}: ${(p.items ?? []).filter((i) => !i.anulacion).map((i) => `${i.cantidad} ${i.nombre}`).join(", ")}`;

function leerNuevos(pendientes) {
    for (const p of pendientes.filter((x) => x.nueva && !leidas.has(x.id))) {
        if (!decir(MARCA.prefijo, enVoz(p))) return;
        leidas.add(p.id);
    }
}

export function vistaCocina(cont, { usuario, datos, irA }, recien = null) {
    if (!relojes.has(cont)) {
        const soltar = () => {
            clearInterval(relojes.get(cont));
            relojes.delete(cont);
        };
        relojes.set(cont, setInterval(() => {
            if (!cont.isConnected) return soltar();
            vistaCocina(cont, { usuario, datos, irA });
        }, 30_000));
        alSalirDeLaPantalla(soltar);
    }
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
        ` : ""}
        ${esCocina ? consignaPersona(datos, usuario) : ""}
        ${!esCocina ? `<p class="nota"><i class="ti ti-info-circle"></i> Esto es lo que ve la cocina. "Listo" lo marca Beto.</p>` : ""}
        ${c.pendientes.length ? `<div class="tickets">${c.pendientes.map((p) => `
            <div class="pendiente${p.nueva ? " pendiente--nueva" : ""}${p.minutos >= DEMORA_MIN ? " pendiente--demora" : ""}">
                ${ticket({ ...p, mesa: nombrePedido(p) })}
                <div class="pendiente__pie">
                    <span>${p.nueva ? `<span class="etiqueta etiqueta--nueva">Nuevo</span> ` : ""}${p.items.every((i) => i.anulacion) ? "Todo anulado" : esc(haceMin(p.minutos))}</span>
                    ${esCocina && p.items.some((i) => !i.anulacion) ? `<button class="boton" type="button" data-listo="${esc(p.id)}"><i class="ti ti-check"></i> Listo</button>` : ""}
                </div>
            </div>`).join("")}</div>` : `<p class="nota vacio-cocina"><i class="ti ti-mood-smile"></i> No hay nada pendiente. ¡A respirar!</p>`}
        ${c.anuladas.length ? `<section class="bloque" data-anuladas-cocina><h2 class="subtitulo">Pedidos anulados</h2><ul class="salieron">${c.anuladas.map((a) => `<li><b>${esc(a.mesa)} · Anulado</b>${a.items.some((i) => i.anulacion) ? ticket(a) : `<span>${esc(a.items.map((i) => `${i.cantidad} ${i.nombre}`).join(", "))}</span>`}<small>${esc(a.motivo)} · ${esc(a.anuladaPor)} · ${esc(hora(a.anuladaEn))}</small></li>`).join("")}</ul></section>` : ""}
        ${c.listas.length ? `
        <h2 class="subtitulo"><i class="ti ti-history"></i> Lo último que salió</h2>
        <ul class="salieron">${c.listas.map((l) => `<li><b>${esc(nombrePedido(l))}</b><span>${l.items.map((i) => `<span${i.anulacion ? ' class="renglon-anulado"' : ""}>${esc(i.cantidad)} ${esc(i.nombre)}${i.anulacion ? `<small>Anulado · ${esc(i.anulacion.motivo)} · ${esc(i.anulacion.por)} · ${esc(hora(i.anulacion.en))}</small>` : ""}</span>`).join("")}</span><small>${esc(hora(l.listaEn))}</small></li>`).join("")}</ul>` : ""}`;
    activarGuias(cont, irA);
    if (esCocina) activarConsigna(cont, MARCA);
    cont.querySelector("[data-modo-tv]").addEventListener("click", () => {
        abrirModoTV({ titulo: NEGOCIO, icono: "ti-chef-hat", armar: () => htmlTVCocina(datos.cocina(usuario)) });
        if (esCocina) {
            datos.mirarTVCocina(usuario);
            vistaCocina(cont, { usuario, datos, irA });
        }
    });
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

export function htmlTVCocina({ pendientes, listas, anuladas = [] }) {
    pendientes = pendientes.filter((p) => p.items?.length);
    listas = listas.filter((p) => p.items?.length);
    anuladas = anuladas.filter((p) => p.items?.length);
    return `<div class="tv-grilla">
        <section class="tv-tarjeta">
            <span class="tv-tarjeta__rotulo">En preparación · ${esc(pendientes.length)}</span>
            ${pendientes.length ? `<ul class="tv-lista">${pendientes.slice(0, 7).map((p) => `
                <li${p.minutos >= DEMORA_MIN ? ` class="tv-lista__ojo"` : ""}><i class="ti ti-flame" aria-hidden="true"></i><b>${esc(nombrePedido(p))}</b><small>${esc(haceMin(p.minutos))}</small></li>`).join("")}
            </ul>${pendientes.length > 7 ? `<span class="tv-tarjeta__chico">Y ${esc(pendientes.length - 7)} más</span>` : ""}` : `<span class="tv-tarjeta__chico">No hay nada en el fuego.</span>`}
        </section>
        <section class="tv-tarjeta tv-tarjeta--ahora">
            <span class="tv-tarjeta__rotulo">Listo para servir</span>
            ${listas.length ? `<ul class="tv-lista">${listas.slice(0, 7).map((l) => `
                <li><i class="ti ti-circle-check" aria-hidden="true"></i><b>${esc(nombrePedido(l))}</b><small>${esc(hora(l.listaEn))}</small></li>`).join("")}
            </ul>` : `<span class="tv-tarjeta__chico">Todavía no salió nada.</span>`}
        </section>
        ${anuladas.length ? `<section class="tv-tarjeta"><span class="tv-tarjeta__rotulo">Anulados · ${esc(anuladas.length)}</span><ul class="tv-lista">${anuladas.slice(0, 5).map((a) => `<li><i class="ti ti-circle-x" aria-hidden="true"></i><b>${esc(a.mesa)} · Anulado</b><small>${esc(a.motivo)} · ${esc(hora(a.anuladaEn))}</small></li>`).join("")}</ul></section>` : ""}
    </div>`;
}
