// ============================================
// Pantalla del cliente (Flor): la carta que se abre en el celular con el QR de la mesa. Categorías arriba, cada
// producto con su descripción y su precio (los mismos de la comanda de Lara) y, en algunos platos, "Ver en 3D"
// (verEn3D del kit: el plato se gira con el dedo y, donde el celular puede, "Verlo en tu mesa" en tamaño real).
// Solo mirar, como la carta real de Restix: el pedido lo sigue tomando la moza.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=edf52e7135";
import { verEn3D } from "../../kit/js/modelo3d.js?v=edf52e7135";
import { cartaCliente, pesos } from "../datos.js?v=edf52e7135";
import { NEGOCIO, MESA_CLIENTE } from "../marca.js?v=edf52e7135";
import { guia, activarGuias } from "./comunes.js?v=edf52e7135";

const MODELO_VALIDO = /^[a-z0-9-]+$/; // nombre del .glb de img\, sin la extensión

const plato = (p) => `
    <li class="plato">
        <div class="plato__textos">
            <b class="plato__nombre">${esc(p.nombre)}</b>
            ${p.descripcion ? `<small class="plato__descripcion">${esc(p.descripcion)}</small>` : ""}
            ${p.modelo && MODELO_VALIDO.test(p.modelo) ? `<button class="boton boton--secundario boton--chico plato__3d" type="button" data-3d="${esc(p.id)}"><i class="ti ti-3d-cube-sphere" aria-hidden="true"></i> Ver en 3D</button>` : ""}
        </div>
        <b class="plato__precio">${esc(pesos(p.precio))}</b>
    </li>`;

export function vistaCarta(cont, { irA }) {
    const categorias = cartaCliente().filter((c) => c.productos.length);
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Carta</h1>
            <span class="negocio"><i class="ti ti-qrcode" aria-hidden="true"></i>${esc(NEGOCIO)} · ${esc(MESA_CLIENTE)}</span>
        </div>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> <span>Abriste la carta con el QR de la mesa. Tocá <b>Ver en 3D</b> en la Muzzarella y giralo con el dedo.</span></p>
        <nav class="chips carta-cats" aria-label="Categorías">${categorias.map((c) => `<button class="chip" type="button" data-ir="${esc(c.id)}"><i class="ti ${esc(c.icono)}" aria-hidden="true"></i>${esc(c.texto)}</button>`).join("")}</nav>
        ${categorias.map((c) => `
        <section class="carta-cat" id="carta-${esc(c.id)}">
            <h2 class="subtitulo"><i class="ti ${esc(c.icono)}" aria-hidden="true"></i> ${esc(c.texto)}</h2>
            <ul class="platos">${c.productos.map(plato).join("")}</ul>
        </section>`).join("")}
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Para pedir, llamá a la moza. Los precios son los mismos que carga el bar: se cambian una vez y la carta se actualiza sola.</p>
        ${guia("u-moza", "/inicio", `Mirá cómo Lara toma el pedido de la ${MESA_CLIENTE}`)}`;
    // Las categorías bajan a su parte de la carta (sin tocar la dirección: el # es de las pantallas)
    cont.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => {
        cont.querySelector(`#carta-${CSS.escape(b.dataset.ir)}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }));
    const productos = categorias.flatMap((c) => c.productos);
    cont.querySelectorAll("[data-3d]").forEach((b) => b.addEventListener("click", () => {
        const p = productos.find((x) => x.id === b.dataset["3d"]);
        if (!p?.modelo) return;
        verEn3D({ titulo: p.nombre, src: `img/${p.modelo}.glb` }).catch((err) => aviso(err, "error"));
    }));
    activarGuias(cont, irA);
}
