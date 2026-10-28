// ============================================
// Piezas que comparten las pantallas de Restix Sazzo: el botón del recorrido (del kit), el ticket de una comanda
// (cocina o barra) y "hace cuánto". Todo dato que entra a HTML pasa por esc().
// ============================================
import { pesos } from "../datos.js?v=aa4351ebaa";
import { esc } from "../../kit/js/ui.js?v=aa4351ebaa";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=aa4351ebaa";
import { MARCA, buscarPersona } from "../marca.js?v=aa4351ebaa";

import { htmlConsigna, htmlConsignaFinal } from "../../kit/js/consigna.js?v=aa4351ebaa";

const CONSIGNAS = {
    moza: [
        ["Tocá la Mesa 4 y abrila.", "Elegí cuántas personas se sentaron."],
        ["Pedí dos muzzarellas, un fernet y dos Coca, y mandalo.", "Se separa solo lo de la cocina y lo de la barra."],
        ["Tocá “Cobrar” en la Mesa 4 y cobrá en partes iguales.", "Podés probar el cobro sin esperar a la cocina."]
    ],
    cocina: [
        ["Marcá lista la Mesa 5", "Lara ve que la comida está lista para servir."],
        ["Marcá lista la Mesa 9", "Sale el siguiente pedido de cocina."],
        ["Abrí Pedidos en la tele", "Ves los pedidos en una pantalla grande."]
    ],
    cliente: [
        ["Tocá “Pizzas” en la carta.", "La carta baja a las pizzas, con sus ingredientes y precios."],
        ["Tocá “Ver en 3D” en la Hamburguesa clásica.", "Se abre el plato en 3D y lo girás con el dedo."],
        ["Tocá “Minutas” en la carta.", "La carta baja a las minutas. Para pedir, llamás a la moza."]
    ]
};

export function consignaPersona(datos, usuario) {
    const hechos = datos.pasos(usuario);
    const paso = hechos.findIndex((hecho) => !hecho);
    if (paso < 0) return htmlConsignaFinal(MARCA, 3);
    const [accion, resultado] = CONSIGNAS[usuario.rol][paso];
    return htmlConsigna({ paso: paso + 1, total: 3, accion, resultado });
}

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const haceMin = (m) => (m < 1 ? "recién" : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h ${m % 60} min`);

/** Un ticket como los que imprime Restix en la cocina y en la barra. */
export function ticket(c, { titulo = c.destino === "cocina" ? "Cocina" : "Barra" } = {}) {
    return `
        <article class="ticket ticket--${esc(c.destino)}">
            <header><b><i class="ti ${c.destino === "cocina" ? "ti-tools-kitchen-2" : "ti-glass-full"}" aria-hidden="true"></i> ${esc(titulo)}</b><span>${esc(c.mesa)} · ${esc(hora(c.creadaEn))}</span></header>
            <ul>${(c.items ?? []).map((i) => `<li${i.anulacion ? ' class="renglon-anulado"' : ""}><b>${esc(i.cantidad)}</b> ${esc(i.nombre)}${i.anulacion ? `<small>Anulado · ${esc(i.anulacion.motivo)} · ${esc(i.anulacion.por)} · ${esc(hora(i.anulacion.en))}</small>` : ""}</li>`).join("")}</ul>
        </article>`;
}

export const importe = (n) => `<span class="importe" style="--importe-ancho: ${esc(pesos(n).length * 0.77)}">${esc(pesos(n))}</span>`;
