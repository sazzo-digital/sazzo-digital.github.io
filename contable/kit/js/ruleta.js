// ============================================
// Ruleta de premios (promos para los clientes): una rueda dibujada en el celular que gira y cae en un premio.
//   const premio = await girarRuleta({ titulo: "¡Ganaste una tirada!", premios: [
//       { texto: "Alfajor de regalo", peso: 2 }, { texto: "Seguí participando", peso: 5 }, … ] });
//   → el premio que salió, o null si cerró sin girar
// Sin librería (PixiJS pesaba ~500 KB para esto): un <canvas> que se dibuja una vez y gira con CSS. El premio se elige
// al tocar "Girar" (al azar, según el peso de cada uno) y la rueda frena justo en él. Con "reducir movimiento", no gira:
// muestra el premio directo. Nada se guarda.
// ============================================
import { esc, aviso, sinMovimiento } from "./ui.js?v=be942dc467";
import { alSalirDeLaPantalla } from "./rutas.js?v=be942dc467";

export const TOPE_PREMIOS = 12;
const TOPE_TEXTO = 28;
const VUELTA_MS = 4200;

/** Revisa y ordena la lista de premios (texto con tope, peso entero entre 1 y 100). */
export function revisarPremios(premios) {
    if (!Array.isArray(premios) || premios.length < 2) throw new Error("La ruleta necesita al menos 2 premios.");
    if (premios.length > TOPE_PREMIOS) throw new Error(`La ruleta tiene como mucho ${TOPE_PREMIOS} premios.`);
    return premios.map((p) => {
        const texto = String(p?.texto ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, TOPE_TEXTO);
        if (!texto) throw new Error("Cada premio tiene que tener un texto.");
        const peso = Math.min(Math.max(Math.round(Number(p?.peso ?? 1)) || 1, 1), 100);
        return { texto, peso };
    });
}

/** Elige un premio según su peso. `azar` es un número entre 0 y 1 (para las pruebas). */
export function elegirPremio(premios, azar = numeroAlAzar()) {
    const total = premios.reduce((t, p) => t + p.peso, 0);
    let marca = Math.min(Math.max(azar, 0), 0.999999) * total;
    for (let i = 0; i < premios.length; i++) {
        marca -= premios[i].peso;
        if (marca < 0) return i;
    }
    return premios.length - 1;
}

function numeroAlAzar() {
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    return n[0] / 2 ** 32;
}

/** Dibuja la rueda: porciones iguales, alternando el color de la demo con uno más claro, y el texto de cada una. */
function dibujar(lienzo, premios) {
    const escala = Math.max(window.devicePixelRatio || 1, 1);
    const lado = lienzo.offsetWidth || 280;
    lienzo.width = Math.round(lado * escala);
    lienzo.height = Math.round(lado * escala);
    const ctx = lienzo.getContext("2d");
    ctx.scale(escala, escala);
    // Los colores del tema ya resueltos (un var() o un color-mix() no se pueden pasar directo al lienzo)
    const resuelto = (variable, respaldo) => {
        const muestra = document.createElement("span");
        muestra.style.color = `var(${variable}, ${respaldo})`;
        lienzo.parentElement.append(muestra);
        const color = getComputedStyle(muestra).color || respaldo;
        muestra.remove();
        return color;
    };
    const colores = [resuelto("--primario", "#f5b83d"), resuelto("--superficie-2", "#eeeeee")];
    const textos = [resuelto("--primario-texto", "#111111"), resuelto("--texto", "#111111")];
    const r = lado / 2;
    const porcion = (2 * Math.PI) / premios.length;
    premios.forEach((p, i) => {
        const desde = -Math.PI / 2 + i * porcion;
        ctx.beginPath();
        ctx.moveTo(r, r);
        ctx.arc(r, r, r - 2, desde, desde + porcion);
        ctx.closePath();
        ctx.fillStyle = colores[i % 2];
        ctx.fill();
        ctx.strokeStyle = "rgb(0 0 0 / 18%)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.save();
        ctx.translate(r, r);
        ctx.rotate(desde + porcion / 2);
        ctx.fillStyle = textos[i % 2];
        ctx.font = `600 ${Math.max(11, Math.round(lado / 24))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(p.texto.length > 18 ? `${p.texto.slice(0, 17)}…` : p.texto, r - 12, 0, r - 30);
        ctx.restore();
    });
}

export function girarRuleta({ titulo = "Ruleta de premios", texto = "", premios } = {}) {
    const lista = revisarPremios(premios);
    return new Promise((resolver) => {
        document.querySelector("dialog.ruleta")?.remove();
        const hoja = document.createElement("dialog");
        hoja.className = "hoja ruleta";
        hoja.innerHTML = `
            <div class="hoja__caja">
                <div class="hoja__titulos">
                    <h2><i class="ti ti-gift" aria-hidden="true"></i> ${esc(titulo)}</h2>
                    <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar"><i class="ti ti-x"></i></button>
                </div>
                ${texto ? `<p class="nota">${esc(texto)}</p>` : ""}
                <div class="ruleta__rueda">
                    <canvas role="img" aria-label="Ruleta con ${esc(lista.length)} premios: ${esc(lista.map((p) => p.texto).join(", "))}"></canvas>
                    <span class="ruleta__flecha" aria-hidden="true"></span>
                </div>
                <p class="ruleta__resultado" aria-live="polite"></p>
                <button class="boton boton--ancho boton--grande" type="button" data-girar><i class="ti ti-rotate-clockwise"></i> Girar</button>
            </div>`;
        document.body.append(hoja);
        const lienzo = hoja.querySelector("canvas");
        const boton = hoja.querySelector("[data-girar]");
        const resultado = hoja.querySelector(".ruleta__resultado");
        let ganado = null;
        let terminado = false;
        const cerrar = () => {
            if (terminado) return;
            terminado = true;
            if (hoja.open) hoja.close();
            hoja.remove();
            resolver(ganado);
        };
        hoja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
        hoja.addEventListener("close", cerrar);
        alSalirDeLaPantalla(cerrar);
        hoja.showModal();
        dibujar(lienzo, lista);

        boton.addEventListener("click", () => {
            if (ganado) return cerrar();
            boton.disabled = true;
            const i = elegirPremio(lista);
            const porcion = 360 / lista.length;
            // La flecha está arriba: la porción i tiene que quedar arriba (con un poco de azar adentro de la porción)
            const adentro = porcion * (0.2 + 0.6 * numeroAlAzar());
            const final = 360 * 6 - (i * porcion + adentro);
            const mostrar = () => {
                if (terminado) return;
                ganado = lista[i];
                resultado.innerHTML = `<i class="ti ti-confetti" aria-hidden="true"></i> <b>${esc(ganado.texto)}</b>`;
                boton.disabled = false;
                boton.innerHTML = `<i class="ti ti-check"></i> Listo`;
                aviso(`Salió: ${ganado.texto}`);
            };
            if (sinMovimiento()) {
                lienzo.style.transform = `rotate(${final % 360}deg)`;
                mostrar();
                return;
            }
            const giro = lienzo.animate([{ transform: "rotate(0deg)" }, { transform: `rotate(${final}deg)` }], {
                duration: VUELTA_MS,
                easing: "cubic-bezier(0.12, 0.7, 0.18, 1)",
                fill: "forwards"
            });
            giro.finished.then(mostrar, mostrar);
        });
    });
}
