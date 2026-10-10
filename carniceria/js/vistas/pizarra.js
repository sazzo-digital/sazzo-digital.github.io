// ============================================
// Pizarra para la tele: los precios por kilo de cada animal en letra enorme y la oferta del día. Para poner en una
// tele del local (pantalla completa): cuando cambian los precios (desposte o "Subió la hacienda"), ya está al día.
// El dueño elige la oferta del día.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=ece442dfab";
import { pesos } from "../datos.js?v=ece442dfab";
import { NEGOCIO } from "../marca.js?v=ece442dfab";
import { precioDe } from "./comunes.js?v=ece442dfab";

export function vistaPizarra(cont, { usuario, datos }) {
    const dueno = usuario.rol === "dueno";
    const { oferta, grupos } = datos.pizarra();
    const puedeCompleta = typeof document.documentElement.requestFullscreen === "function";
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Precios y stock</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">Pizarra para la tele</h1>
            ${puedeCompleta ? `<button class="boton boton--chico" type="button" data-completa><i class="ti ti-maximize"></i> Pantalla completa</button>` : ""}
        </div>
        <p class="nota"><i class="ti ti-info-circle"></i> Abrila en la tele del local (o en una compu conectada): cuando cambian los precios, se actualiza sola.</p>
        <section class="pizarra" aria-label="Precios de hoy">
            <header class="pizarra__cabecera">
                <p class="pizarra__negocio">${esc(NEGOCIO)}</p>
                <p class="pizarra__fecha">Precios de hoy · ${esc(new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }))}</p>
            </header>
            ${oferta ? `
            <div class="pizarra__oferta">
                <span>Oferta del día</span>
                <b>${esc(oferta.nombre)}</b>
                <b class="pizarra__precio">${esc(pesos(oferta.precio))}<small>${oferta.venta === "kg" ? "el kilo" : "c/u"}</small></b>
            </div>` : ""}
            <div class="pizarra__grupos">${grupos.map((g) => `
                <section class="pizarra__grupo">
                    <h2><i class="ti ${esc(g.icono)}" aria-hidden="true"></i> ${esc(g.nombre)}</h2>
                    <ul>${g.articulos.map((a) => `
                        <li class="${a.stock <= 0 ? "pizarra__sin" : ""}"><span>${esc(a.nombre)}</span><b>${a.stock <= 0 ? "No hay" : esc(precioDe(a))}</b></li>`).join("")}
                    </ul>
                </section>`).join("")}
            </div>
        </section>
        ${dueno ? `
        <form class="formulario bloque oferta" novalidate>
            <label>Oferta del día
                <select name="oferta">
                    <option value="">Sin oferta</option>
                    ${grupos.flatMap((g) => g.articulos).map((a) => `<option value="${esc(a.id)}"${a.oferta ? " selected" : ""}>${esc(a.nombre)} · ${esc(precioDe(a))}</option>`).join("")}
                </select>
            </label>
        </form>` : ""}`;

    const pizarra = cont.querySelector(".pizarra");
    cont.querySelector("[data-completa]")?.addEventListener("click", () => {
        pizarra.requestFullscreen?.().catch(() => aviso("Este navegador no deja la pantalla completa.", "error"));
    });
    cont.querySelector(".oferta select")?.addEventListener("change", (e) => {
        try {
            const a = datos.elegirOferta(usuario, e.target.value || null);
            aviso(a ? `Oferta del día: ${a.nombre}` : "Sin oferta del día");
            vistaPizarra(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
