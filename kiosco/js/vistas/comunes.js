// ============================================
// Piezas que comparten las pantallas de Sazzo Kiosco: el botón del recorrido (del kit), la pastilla de stock y
// "hace cuánto". Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=0d0af3824b";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=0d0af3824b";
import { MARCA, buscarPersona } from "../marca.js?v=0d0af3824b";

/** Botón del recorrido con la persona de Kiosco: guia("u-dueno", "/stock/aumento", "Pasá a Rubén…"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const STOCK = {
    sin: { texto: "No hay", clase: "mal", icono: "ti-circle-x" },
    pedir: { texto: "Hay que pedir", clase: "ojo", icono: "ti-alert-triangle" },
    hay: { texto: "Hay", clase: "bien", icono: "ti-circle-check" }
};

export function pastillaStock(p) {
    const e = STOCK[p.estado];
    return `<span class="pastilla pastilla--${e.clase}"><i class="ti ${e.icono}" aria-hidden="true"></i>${e.texto}${p.estado === "sin" ? "" : ` · ${esc(p.stock)}`}</span>`;
}

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

export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });


import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=0d0af3824b";

const CONSIGNAS = {
    dueno: [
        ["En “Stock”, tocá “Subir precios por proveedor”, elegí Bebidas Norte y 15 %, y aplicalo.", "Cambian todos sus precios de una, con Deshacer."],
        ["En “Stock”, tocá “Lista del proveedor en Excel”, tocá “Usar la lista de ejemplo” y aplicala.", "Los precios se actualizan solos con tu redondeo."],
        ["En “Fiados”, abrí a Graciela y cambiale el tope de fiado.", "Queda guardado el tope nuevo."]
    ],
    empleada: [
        ["Sumá un producto y tocá “Cobrar”.", "La venta queda anotada y baja el stock."],
        ["Hacé otra venta con “Fiado” y elegí un cliente.", "La compra queda anotada en su libreta."],
        ["En “Fiados”, abrí a un cliente que debe (Graciela, por ejemplo) y cobrale.", "Su deuda baja y el cobro queda anotado."]
    ]
};
export function consignaPersona(datos, usuario) {
    const paso = datos.pasos(usuario).findIndex((hecho) => !hecho);
    if (paso < 0) return htmlConsignaFinal(MARCA, 3);
    const [accion, resultado] = CONSIGNAS[usuario.rol][paso];
    return htmlConsigna({ paso: paso + 1, total: 3, accion, resultado });
}

export function pintarConsigna(cont, datos, usuario) {
    const html = consignaPersona(datos, usuario);
    const anterior = cont.querySelector(".consigna");
    if (anterior) anterior.outerHTML = html;
    else cont.insertAdjacentHTML("afterbegin", html);
    activarConsigna(cont, MARCA);
}
