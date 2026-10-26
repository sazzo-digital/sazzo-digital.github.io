// ============================================
// Piezas que comparten las pantallas de Sazzo Gimnasio: el botón del recorrido (del kit), la pastilla de la cuota,
// los días en pastillas, la cara de cada socio, el gráfico de progreso (SVG, sin librerías) y la ventanita del
// mensaje para copiar (del kit). Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=6819a0f377";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=6819a0f377";
import { MARCA, buscarPersona } from "../marca.js?v=6819a0f377";
import { kilos } from "../datos.js?v=6819a0f377";
import { htmlConsigna, htmlConsignaFinal, activarConsigna } from "../../kit/js/consigna.js?v=6819a0f377";

const CONSIGNAS = {
    socio: [
        ["En “Hoy”, tocá “Llegué”.", "Tu llegada queda anotada en el gimnasio."],
        ["Tocá “Hecha” en una serie de tu rutina de “Hoy”.", "Se guarda la serie con el peso y las repeticiones que ves."],
        ["Tocá “Terminar el entreno” y confirmá si faltan ejercicios.", "El entreno queda terminado aunque hayas probado una sola serie."]
    ],
    profe: [
        ["En “Rutinas”, abrí una rutina, elegí un alumno y tocá “Asignar”.", "El alumno pasa a esa rutina y la ve en su celu."],
        ["En “Hoy”, abrí a Franco, escribí una nota y tocá “Dejar nota”.", "La nota queda guardada para que Franco la vea en su celu."],
        ["En la ficha de Franco, tocá “Rutina en PDF”.", "Se arma su rutina en PDF para imprimir o mandar."]
    ],
    duena: [
        ["En “Entrada”, tocá a Franco.", "Su llegada queda anotada y ves si tiene la cuota al día."],
        ["En “Socios”, abrí a Franco y tocá “Mandar recordatorio de la cuota”.", "Se arma el mensaje de la cuota para copiarlo y mandárselo."],
        ["En “Socios”, tocá “Socio nuevo”, escribí un nombre y tocá “Dar de alta y cobrar el primer mes”.", "Queda como socio con el primer mes cobrado."]
    ]
};

export function consignaPersona(datos, usuario) {
    const paso = datos.pasos(usuario).findIndex((hecho) => !hecho);
    if (paso < 0) return htmlConsignaFinal(MARCA, 3);
    const [accion, resultado] = CONSIGNAS[usuario.rol][paso];
    return htmlConsigna({ paso: paso + 1, total: 3, accion, resultado });
}

export function activarConsignaPersona(cont, datos, usuario) {
    cont.querySelectorAll(".consigna").forEach((cartel) => cartel.remove());
    cont.insertAdjacentHTML("afterbegin", consignaPersona(datos, usuario));
    activarConsigna(cont, MARCA);
}

export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };
export { mostrarMensaje } from "../../kit/js/mensaje.js?v=6819a0f377";

const CLASE_CUOTA = { "al-dia": "bien", pronto: "alerta", vencida: "mal" };

/** La pastilla con el estado de la cuota ("Vence en 3 días", "Vencida hace 5 días"). */
export function pastillaCuota(a, { corta = false } = {}) {
    const texto = corta && a.estadoCuota === "al-dia" ? "Al día" : a.textoCuota;
    return `<span class="pastilla pastilla--${CLASE_CUOTA[a.estadoCuota] ?? "suave"}">${esc(texto)}</span>`;
}

export const pastilla = (texto, clase = "suave", icono = "") =>
    `<span class="pastilla pastilla--${esc(clase)}">${icono ? `<i class="ti ${esc(icono)}" aria-hidden="true"></i>` : ""}${esc(texto)}</span>`;

const mayuscula = (t) => t[0].toUpperCase() + t.slice(1);

/** Los próximos días en pastillas. */
export function chipsDias(dias, actual) {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" data-dia="${esc(d.fecha)}">${esc(mayuscula(d.nombre))}</button>`).join("")}
    </div>`;
}

/** La cara de un socio (sus iniciales). */
export const cara = (a) => `<span class="cara" aria-hidden="true">${esc(((a.nombre?.[0] ?? "") + (a.apellido?.[0] ?? "")).toUpperCase() || "?")}</span>`;

/** "Hace 3 días", "Vino hoy"… */
export const haceDias = (n) => (n === null || n === undefined ? "Todavía no vino" : n === 0 ? "Vino hoy" : n === 1 ? "Vino ayer" : `Hace ${n} días que no viene`);

/**
 * Gráfico de línea de un ejercicio (el peso de cada entreno): SVG con el acento de la demo, el último punto marcado
 * y el primero y el último peso escritos. Sin librerías. `puntos`: [{ fecha, peso }].
 */
export function graficoPeso({ nombre, puntos }) {
    if (puntos.length < 2) return "";
    const ancho = 300;
    const alto = 92;
    const margen = { x: 8, arriba: 14, abajo: 18 };
    const pesos = puntos.map((p) => p.peso);
    const min = Math.min(...pesos);
    const max = Math.max(...pesos);
    const rango = max - min || 1;
    const x = (i) => margen.x + (i / (puntos.length - 1)) * (ancho - margen.x * 2);
    const y = (p) => margen.arriba + (1 - (p - min) / rango) * (alto - margen.arriba - margen.abajo);
    const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.peso).toFixed(1)}`).join(" ");
    const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${alto - margen.abajo} L${x(0).toFixed(1)},${alto - margen.abajo} Z`;
    const ultimo = puntos.at(-1);
    const subio = ultimo.peso - puntos[0].peso;
    return `
        <figure class="grafico">
            <figcaption><b>${esc(nombre)}</b><span>${subio > 0 ? `+${esc(kilos(subio))} en ${puntos.length} entrenos` : `${esc(kilos(ultimo.peso))}`}</span></figcaption>
            <svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${esc(`${nombre}: de ${kilos(puntos[0].peso)} a ${kilos(ultimo.peso)}`)}">
                <path class="grafico__area" d="${area}"/>
                <path class="grafico__linea" d="${linea}"/>
                <circle class="grafico__punto" cx="${x(puntos.length - 1).toFixed(1)}" cy="${y(ultimo.peso).toFixed(1)}" r="4"/>
                <text class="grafico__texto" x="${margen.x}" y="${alto - 4}">${esc(kilos(puntos[0].peso))}</text>
                <text class="grafico__texto" x="${ancho - margen.x}" y="${alto - 4}" text-anchor="end">${esc(kilos(ultimo.peso))}</text>
            </svg>
        </figure>`;
}

/** Barritas de las veces que vino cada semana (las últimas 8), con la línea de las que le tocan. */
export function barrasSemanas(semanas, tocan) {
    const tope = Math.max(tocan, ...semanas.map((s) => s.veces), 1);
    return `
        <figure class="barras" aria-label="${esc(`Veces que vino por semana, las últimas 8: ${semanas.map((s) => s.veces).join(", ")}`)}">
            <div class="barras__fila">${semanas.map((s) => `
                <span class="barras__col" title="${esc(`${s.veces} ${s.veces === 1 ? "vez" : "veces"}`)}">
                    <small>${esc(s.veces)}</small>
                    <span class="barras__barra${s.veces >= tocan ? " barras__barra--cumplio" : ""}" style="--alto:${Math.round((s.veces / tope) * 78)}%"></span>
                </span>`).join("")}
            </div>
            <figcaption>Veces por semana (le tocan ${esc(tocan)}) · la última es esta semana</figcaption>
        </figure>`;
}
