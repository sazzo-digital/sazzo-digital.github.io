// ============================================
// Piezas que comparten las pantallas de Sazzo Canchas: el botón del recorrido (del kit), las pastillas de la seña
// y del estado, y los días en pastillas. Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=8a5fe1d629";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=8a5fe1d629";
import { SENAS } from "../datos.js?v=8a5fe1d629";
import { MARCA, buscarPersona } from "../marca.js?v=8a5fe1d629";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const CLASE_SENA = { pagada: "bien", pendiente: "ojo", devuelta: "suave", perdida: "mal" };

export const pastillaSena = (sena) => (sena ? `<span class="pastilla pastilla--${CLASE_SENA[sena]}">${esc(SENAS[sena])}</span>` : "");

const ESTADOS = {
    reservado: { texto: "Reservado", clase: "suave" },
    llegaron: { texto: "Llegaron", clase: "bien" },
    faltaron: { texto: "Faltaron", clase: "mal" },
    cancelado: { texto: "Cancelado", clase: "suave" },
    liberado: { texto: "Liberado", clase: "suave" }
};

export function pastillaEstado(estado) {
    const e = ESTADOS[estado] ?? ESTADOS.reservado;
    return `<span class="pastilla pastilla--${e.clase}">${esc(e.texto)}</span>`;
}

/** "Hoy · Mañana · sábado 10/10…" en pastillas; `actual` la fecha elegida. */
export function chipsDias(dias, actual, atributo = "data-dia") {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" ${atributo}="${esc(d.fecha)}">${esc(d.nombre[0].toUpperCase() + d.nombre.slice(1))}</button>`).join("")}
    </div>`;
}


import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=8a5fe1d629";

const CONSIGNAS = {
    dueno: [
        ["Tocá un turno con seña a cobrar (hoy o mañana) y apretá “Cobrar seña”.", "La seña queda pagada y el turno deja de figurar como pendiente."],
        ["Tocá “Llegaron” en un turno.", "El turno queda marcado en la grilla."],
        ["Abrí “Turnos fijos”, desplegá “Nuevo turno fijo”, escribí el grupo y tocá “Crear fijo”.", "El grupo juega todas las semanas en ese horario."]
    ],
    cliente: [
        ["Elegí una hora libre, completá “Nombre del grupo” y tocá “Pagar seña”.", "Tu reserva queda confirmada en esta demo."],
        ["Abrí “Mis turnos”, tocá “Pedir a la cantina”, sumá algo y tocá “Pedir”.", "El pedido le llega a la cantina y queda en la cuenta de tu turno."],
        ["Tocá “Cancelar” en tu reserva y confirmá.", "El horario queda libre de nuevo."]
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
