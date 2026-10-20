// ============================================
// Piezas que comparten las pantallas de Sazzo Barbería: el botón del recorrido (del kit), pastillas, los días en
// pastillas y la ventanita del mensaje para copiar (del kit). Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=80175c9283";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=80175c9283";
import { MARCA, buscarPersona } from "../marca.js?v=80175c9283";

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const ESTADOS = {
    reservado: { texto: "Reservado", clase: "suave" },
    llego: { texto: "Llegó", clase: "bien" },
    falto: { texto: "Faltó", clase: "mal" },
    cancelado: { texto: "Cancelado", clase: "suave" }
};

export function pastillaEstado(estado) {
    const e = ESTADOS[estado] ?? ESTADOS.reservado;
    return `<span class="pastilla pastilla--${e.clase}">${esc(e.texto)}</span>`;
}

const mayuscula = (t) => t[0].toUpperCase() + t.slice(1);

/** Los próximos 7 días en pastillas; los cerrados, apagados. */
export function chipsDias(dias, actual) {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" data-dia="${esc(d.fecha)}"${d.cerrado ? " disabled title=\"Cerrado\"" : ""}>${esc(mayuscula(d.nombre))}${d.cerrado ? " · cerrado" : ""}</button>`).join("")}
    </div>`;
}

// La ventanita del mensaje para copiar es del kit (kit/mensaje.js)
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=80175c9283";


import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=80175c9283";

const CONSIGNAS = {
    barbero: [
        ["En “Clientes”, tocá “No vuelven hace +45 días”.", "Ves a quiénes podés invitar a volver."],
        ["Tocá “Invitarlo” en un cliente y confirmá el mensaje.", "Queda anotado que lo invitaste."],
        ["En “Agenda”, tocá “Llegó” en un turno.", "El turno queda marcado como atendido y suma al día."]
    ],
    cliente: [
        ["Elegí una hora libre y tocá “Sacar turno”.", "Tu turno queda confirmado con el servicio elegido."],
        ["Sacá otro turno para otro día: elegí el día, una hora libre y tocá “Sacar turno”.", "Queda un segundo turno anotado en otro día."],
        ["En “Mis turnos”, tocá “Cancelar turno” y confirmá.", "El horario queda libre para otro cliente."]
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
