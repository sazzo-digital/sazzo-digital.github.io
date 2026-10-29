// ============================================
// Piezas que comparten las pantallas de Sazzo Flota: pastillas de estado, tarjeta de un problema, "hace cuánto" y
// el botón del recorrido ("Mirá lo que le llega a Diego →", del kit).
// Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc, cuandoFue } from "../../kit/js/ui.js?v=5451e7cf62";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=5451e7cf62";
import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=5451e7cf62";
import { ESTADOS_VEHICULO, ESTADOS_PROBLEMA, URGENCIAS } from "../datos.js?v=5451e7cf62";
import { buscarPersona, MARCA } from "../marca.js?v=5451e7cf62";

/** "recién", "hace 5 minutos", "hace 3 horas" o, si fue antes de ayer, "el lunes 5/10 a las 15:20". */
export function haceCuanto(iso) {
    const minutos = Math.floor((Date.now() - new Date(iso)) / 60_000);
    if (minutos < 1) return "recién";
    if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
    return cuandoFue(iso);
}

/** Hora corta "10:05" de un momento guardado (para la historia de un problema). */
export const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export const pastillaVehiculo = (estado) =>
    `<span class="pastilla pastilla--${esc(estado)}"><i class="ti ${esc(ESTADOS_VEHICULO[estado]?.icono)}" aria-hidden="true"></i>${esc(ESTADOS_VEHICULO[estado]?.texto)}</span>`;

export function pastillaUrgencia(urgencia) {
    const u = URGENCIAS.find((x) => x.id === urgencia);
    return `<span class="pastilla pastilla--${urgencia === "parar" ? "problema" : "suave"}"><i class="ti ${esc(u?.icono)}" aria-hidden="true"></i>${esc(u?.texto)}</span>`;
}

/** Pastilla del estado de un problema, como lo ve el chofer: avisado → lo tomó → arreglado. */
export function pastillaProblema(estado) {
    const clase = { avisado: "problema", taller: "taller", arreglado: "andando" }[estado];
    const icono = { avisado: "ti-send", taller: "ti-tool", arreglado: "ti-circle-check" }[estado];
    return `<span class="pastilla pastilla--${clase}"><i class="ti ${icono}" aria-hidden="true"></i>${esc(ESTADOS_PROBLEMA[estado])}</span>`;
}

/** La historia de un problema con sus horas: avisó 10:02 → lo tomó 10:03 → arreglado 10:05. */
export function historiaProblema(p) {
    const pasos = [`<li><i class="ti ti-send" aria-hidden="true"></i>Avisó ${esc(p.avisoPor)} <b>${esc(hora(p.avisoEn))}</b></li>`];
    if (p.tomadoEn) pasos.push(`<li><i class="ti ti-tool" aria-hidden="true"></i>Lo tomó ${esc(p.tomadoPor)} <b>${esc(hora(p.tomadoEn))}</b></li>`);
    if (p.arregladoEn) pasos.push(`<li><i class="ti ti-circle-check" aria-hidden="true"></i>Arreglado <b>${esc(hora(p.arregladoEn))}</b></li>`);
    return `<ol class="historia">${pasos.join("")}</ol>`;
}

/** Lo que usó el mecánico: "pastillas de freno (1), aceite de motor (2)". */
export const textoRepuestos = (repuestos = []) => repuestos.map((u) => `${u.nombre.toLowerCase()} (${u.cantidad})`).join(", ");

/** Botón del recorrido (del kit) con la persona de Flota: guia("u-mecanico", "/inicio", "Mirá lo que le llega a Diego"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });

export { activarGuias };

const PASO_FLECHA = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function activarFlechas(cont, etiqueta, atributo) {
    const selector = `[role="radiogroup"][aria-label="${etiqueta}"]`;
    const clave = atributo.replace(/-([a-z])/g, (_, letra) => letra.toUpperCase());
    const grupo = cont.querySelector(selector);
    if (!grupo) return;
    const botones = () => [...grupo.querySelectorAll('[role="radio"]')];
    botones().forEach((b) => {
        b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
    });
    if (grupo.dataset.flechas) return;
    grupo.dataset.flechas = "1";
    grupo.addEventListener("keydown", (e) => {
        const paso = PASO_FLECHA[e.key];
        const lista = botones();
        const i = lista.indexOf(e.target);
        if (!paso || i < 0) return;
        e.preventDefault();
        const elegido = lista[(i + paso + lista.length) % lista.length];
        const valor = elegido.dataset[clave];
        elegido.click();
        cont.querySelector(`${selector} [data-${atributo}="${valor}"]`)?.focus();
    });
}

const CONSIGNAS = {
    chofer: [
        ["Tocá “Avisar un problema”, elegí qué pasa y si podés seguir, y tocá “Enviar al mecánico”.", "Diego, el mecánico, lo ve al entrar a su pantalla."],
        ["Avisá otro y contalo en pocas palabras (por ejemplo: chillan al frenar).", "Diego lee lo que escribiste."],
        ["Avisá uno con “Tengo que parar”.", "A Diego le aparece primero, como urgente."]
    ],
    mecanico: [
        ["Tocá “Me hago cargo” en la Moto 8.", "Pasa a “En el taller” y Marta lo ve en su tablero."],
        ["Tocá “Listo, arreglado” en la Moto 8 y confirmalo.", "La moto vuelve a andar y queda en su historia."],
        ["Arreglá el embrague del Camión 2: “Listo, arreglado”, una nota y confirmalo.", "Si usaste repuestos, se descuentan solos."]
    ],
    admin: [
        ["En Vehículos, abrí el Camión 1, poné 149100 en “Actualizar kilómetros” y tocá “Guardar”.", "Te avisa que ya se pasó del service."],
        ["Tocá “Hacer el service”, sumá aceite y un filtro, y tocá “Service hecho”.", "Se descuenta del stock y el próximo service se calcula solo."],
        ["En Repuestos, tocá “Entró” en Lámparas y anotá 4.", "Deja de decir “No hay”."]
    ]
};

export function consignaPersona(datos, usuario) {
    const paso = datos.pasos(usuario).findIndex((hecho) => !hecho);
    if (paso < 0) return htmlConsignaFinal(MARCA, 3);
    const [accion, resultado] = CONSIGNAS[usuario.rol][paso];
    return htmlConsigna({ paso: paso + 1, total: 3, accion, resultado });
}

export const activarPasos = (cont) => activarConsigna(cont, MARCA);
