// ============================================
// El aviso de novedades: para probar la demo solo, desde un mismo celular, haciendo de las dos personas.
//   Marcos pide un presupuesto → al entrar como Nahuel u Osvaldo salta "¡Pedido nuevo de presupuesto!" (llamativo:
//   baja desde arriba con la campanita que se mueve y un "ding" cortito) y el botón Presupuestos del menú muestra
//   cuántos hay. Lo mismo al revés: "Te mandaron el presupuesto" para Marcos, y "Marcos aceptó" para el mostrador.
// Cada persona lo ve una vez (datos.marcarVisto): "Verlo" lleva al presupuesto, la cruz lo descarta. Los datos se
// guardan en el navegador, así que funciona en el mismo aparato (o en dos pestañas); en dos celulares distintos, no.
// ============================================
import { esc } from "../../kit/js/ui.js?v=d783fb01c6";
import { pesos, diaMes } from "../datos.js?v=d783fb01c6";

const anunciados = new Set(); // lo que ya sonó en esta visita (no vuelve a sonar al cambiar de pantalla)

const TEXTOS = {
    nuevo: { titulo: "¡Pedido nuevo de presupuesto!", icono: "ti-bell-ringing", boton: "Verlo y armarlo" },
    aceptado: { titulo: "¡Aceptó el presupuesto!", icono: "ti-thumb-up", boton: "Pasarlo a venta" },
    enviado: { titulo: "¡Te mandaron el presupuesto!", icono: "ti-bell-ringing", boton: "Verlo" }
};

function detalle(n) {
    if (n.tipo === "nuevo") return { linea: `${n.cliente} · N° ${n.numero}${n.obra ? ` · ${n.obra}` : ""}`, chico: `${n.renglones} ${n.renglones === 1 ? "renglón" : "renglones"}${n.conFoto ? ", con foto" : ""}` };
    if (n.tipo === "aceptado") return { linea: `${n.cliente} · N° ${n.numero}`, chico: `${pesos(n.total)} · va a su cuenta corriente` };
    return { linea: `N° ${n.numero}${n.obra ? ` · ${n.obra}` : ""} · ${pesos(n.total)}`, chico: n.vence ? `Los precios valen hasta el ${diaMes(n.vence)}` : "" };
}

/** Un "ding-dong" cortito hecho por código (sin archivos). Si el navegador no deja, no pasa nada. */
function sonar() {
    if (window.__sazzoQuieto) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [[988, 0], [784, 0.16]].forEach(([frecuencia, desde]) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = frecuencia;
            g.gain.setValueAtTime(0.0001, ctx.currentTime + desde);
            g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + desde + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + desde + 0.45);
            o.connect(g).connect(ctx.destination);
            o.start(ctx.currentTime + desde);
            o.stop(ctx.currentTime + desde + 0.5);
        });
        setTimeout(() => ctx.close(), 1200);
    } catch {
        // sin sonido
    }
    navigator.vibrate?.([120, 60, 120]);
}

/** El numerito en el botón del menú (Presupuestos para el mostrador, Mis presupuestos para Marcos). */
function pintarNumerito(app, usuario, cuantos) {
    const ruta = usuario.rol === "cliente" ? "/mis-presupuestos" : "/presupuestos";
    const item = app.querySelector(`.menu__item[data-ruta="${ruta}"]`);
    if (!item) return;
    item.querySelector(".menu__novedad")?.remove();
    if (cuantos) item.insertAdjacentHTML("beforeend", `<span class="menu__novedad" aria-label="${cuantos} ${cuantos === 1 ? "novedad" : "novedades"}">${cuantos > 9 ? "9+" : cuantos}</span>`);
}

/** Pinta (o saca) el aviso arriba de todo. Se llama después de cada pantalla. */
export function pintarNovedades({ app, usuario, datos }) {
    app.querySelector(".novedad")?.remove();
    if (!usuario || !datos) return;
    const ruta = location.hash.replace(/^#/, "").split("?")[0];
    const lista = datos.novedades(usuario).filter((n) => n.ruta !== ruta); // la que ya está mirando no se anuncia
    pintarNumerito(app, usuario, lista.length);
    const n = lista[0];
    if (!n) return;
    const t = TEXTOS[n.tipo];
    const d = detalle(n);
    const nueva = !anunciados.has(`${usuario.id}:${n.id}:${n.tipo}`);
    anunciados.add(`${usuario.id}:${n.id}:${n.tipo}`);
    app.insertAdjacentHTML("beforeend", `
        <div class="novedad novedad--${esc(n.tipo)}${nueva ? " novedad--recien" : ""}" role="alert">
            <span class="novedad__campana" aria-hidden="true"><i class="ti ${esc(t.icono)}"></i></span>
            <div class="novedad__texto">
                <b>${esc(t.titulo)}</b>
                <span>${esc(d.linea)}</span>
                ${d.chico ? `<small>${esc(d.chico)}${lista.length > 1 ? ` · y ${esc(lista.length - 1)} más` : ""}</small>` : ""}
            </div>
            <div class="novedad__botones">
                <button class="boton" type="button" data-ver><i class="ti ti-arrow-right" aria-hidden="true"></i> ${esc(t.boton)}</button>
                <button class="boton-icono novedad__cerrar" type="button" data-cerrar aria-label="Cerrar el aviso"><i class="ti ti-x"></i></button>
            </div>
        </div>`);
    const caja = app.querySelector(".novedad");
    caja.querySelector("[data-ver]").addEventListener("click", () => {
        datos.marcarVisto(usuario, n.id);
        caja.remove();
        if (`#${n.ruta}` === location.hash) pintarNovedades({ app, usuario, datos });
        else location.hash = `#${n.ruta}`;
    });
    caja.querySelector("[data-cerrar]").addEventListener("click", () => {
        datos.marcarVisto(usuario, n.id);
        pintarNovedades({ app, usuario, datos });
    });
    if (nueva) sonar();
}
