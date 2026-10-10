// ============================================
// Ayudas para las pantallas: buscar elementos, escapar texto, avisos y formatos.
// Solo lo genérico: lo propio de cada rubro (estados, pastillas, unidades…) va en cada demo.
// Todo dato que entra a HTML pasa por esc().
// ============================================
import { esDeProgramacion, contarFalla } from "./visita.js?v=9aeacc21d1";

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

/** Escapa texto para meterlo en HTML (evita que un dato cargado por alguien rompa o inyecte código). */
export function esc(texto) {
    const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto ?? "").replace(/[&<>"']/g, (c) => reemplazos[c]);
}

export const nombreCompleto = (u) => [u?.nombre, u?.apellido].filter(Boolean).join(" ");

/** "Laura Gómez" → "LG" (para los avatares redondos) */
export const iniciales = (u) => ((u?.nombre?.[0] || "?") + (u?.apellido?.[0] || "")).toUpperCase();

/**
 * ¿Se abrió desde el navegador de adentro de otra app (WhatsApp, Instagram, Facebook)?
 * Ahí lo que se carga queda aparte del navegador de siempre (el aviso "abrila en el navegador" es del paso 2).
 */
export const esNavegadorDeOtraApp = (agente = navigator.userAgent) => /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|; wv\)/.test(agente);

// Quieto si el celular pide menos movimiento (o si una prueba automática lo pide: window.__sazzoQuieto)
export const sinMovimiento = () => (typeof window !== "undefined" && window.__sazzoQuieto) || matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hace un cambio de pantalla con un fundido corto entre lo de antes y lo nuevo (View Transitions; Chrome, Edge,
 * Safari 18.2+). Si el navegador no puede, o se pidió menos movimiento, cambia directo. `cambiar` puede ser async.
 */
export function conFundido(cambiar) {
    if (typeof document === "undefined" || !document.startViewTransition || sinMovimiento()) return cambiar();
    try {
        const transicion = document.startViewTransition(cambiar);
        // Si se corta (dos cambios seguidos, pestaña escondida), las promesas fallan: no es un error de la demo
        const nada = () => {};
        transicion.ready.catch(nada);
        transicion.finished.catch(nada);
        transicion.updateCallbackDone?.catch(nada);
    } catch {
        cambiar();
    }
}

/**
 * Los números con data-contar="N" suben desde 0 hasta N en menos de un segundo (tablero que "arranca").
 * data-sufijo agrega algo al final (ej: "%"). Si el celular pide menos movimiento, quedan quietos.
 */
export function animarNumeros(raiz = document) {
    if (sinMovimiento()) return;
    $$("[data-contar]", raiz).forEach((el) => {
        const fin = Number(el.dataset.contar);
        const sufijo = el.dataset.sufijo ?? "";
        if (!Number.isFinite(fin) || fin <= 0) return;
        const inicio = performance.now();
        const dura = 650;
        const paso = (t) => {
            // El primer cuadro puede traer una hora apenas anterior a `inicio`: sin el 0, se vería "-0"
            const avance = Math.min(1, Math.max(0, (t - inicio) / dura));
            const suave = 1 - Math.pow(1 - avance, 3);
            el.textContent = `${Math.round(fin * suave).toLocaleString("es-AR")}${sufijo}`;
            if (avance < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
    });
}

/**
 * Arma el texto de un .csv que Excel abre bien en castellano (separado por ";" y con tildes).
 * filas: [[títulos…], [valores…], …]. Los textos que empiezan con = + - @ se anulan con un apóstrofo,
 * para que Excel no los tome como fórmulas (alguien podría cargar un nombre "trampa").
 */
export function textoCSV(filas) {
    const celda = (valor) => {
        let t = String(valor ?? "");
        if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
        return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    return "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
}

/** Baja una tabla como .csv (ver textoCSV). */
export function descargarCSV(nombreArchivo, filas) {
    const url = URL.createObjectURL(new Blob([textoCSV(filas)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-10-06" → "06/10/2026" */
export function fechaCorta(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
}

const dosCifras = (n) => String(n).padStart(2, "0");

/**
 * Momento guardado (ISO) → "06/10 21:30" en hora local.
 * Armado a mano: con toLocaleString cada navegador lo escribe distinto ("6/10, 21:30" en Chrome).
 */
export function fechaHora(iso) {
    if (!iso) return "—";
    const f = new Date(iso);
    return `${dosCifras(f.getDate())}/${dosCifras(f.getMonth() + 1)} ${dosCifras(f.getHours())}:${dosCifras(f.getMinutes())}`;
}

const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Momento guardado (ISO) → "hoy a las 15:20", "ayer a las 09:05", "el lunes 5/10 a las 15:20" o "el 28/09 a las 15:20". */
export function cuandoFue(iso) {
    if (!iso) return "";
    const f = new Date(iso);
    const hoy = new Date();
    const hora = f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const dias = Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(f.getFullYear(), f.getMonth(), f.getDate())) / 864e5);
    const fecha = `${f.getDate()}/${String(f.getMonth() + 1).padStart(2, "0")}${f.getFullYear() !== hoy.getFullYear() ? `/${f.getFullYear()}` : ""}`;
    if (dias === 0) return `hoy a las ${hora}`;
    if (dias === 1) return `ayer a las ${hora}`;
    if (dias > 1 && dias < 7) return `el ${NOMBRE_DIA[f.getDay()]} ${fecha} a las ${hora}`;
    return `el ${fecha} a las ${hora}`;
}

export const vacio = (mensaje, icono = "ti-alert-triangle") =>
    `<div class="vacio"><i class="ti ${esc(icono)}"></i><p>${esc(mensaje)}</p></div>`;

/**
 * Cartelito que aparece abajo unos segundos. tipo: "ok", "info" o "error".
 * Los errores duran más (hay que llegar a leerlos) y cualquiera se cierra tocándolo.
 */
export const MENSAJE_FALLA = "Algo falló. Probá de nuevo o volvé al inicio.";

/**
 * Lo que se le muestra a la persona cuando algo sale mal: el mensaje si es uno de los nuestros ("No hay stock…"), o
 * MENSAJE_FALLA si es un error de programación (en inglés, no le sirve a nadie), que además se avisa al registro.
 */
export function mensajeDe(e) {
    if (!esDeProgramacion(e)) return e.message;
    console.error(e);
    contarFalla(e);
    return MENSAJE_FALLA;
}

/** Cartelito abajo. `mensaje` puede ser un texto o el error atajado (aviso(err, "error")): ver mensajeDe. */
export function aviso(mensaje, tipo = "ok") {
    if (mensaje !== null && typeof mensaje === "object") mensaje = mensajeDe(mensaje);
    if (tipo === "ok" && navigator.userActivation?.hasBeenActive !== false) {
        try {
            navigator.vibrate?.(20); // "listo": un toquecito en Android, solo si ya tocó la pantalla (si no, el navegador se queja)
        } catch {
            // sin vibración
        }
    }
    let caja = $(".avisos");
    if (!caja) {
        caja = document.createElement("div");
        caja.className = "avisos";
        caja.setAttribute("role", "status");
        document.body.append(caja);
    }
    const dura = tipo === "error" ? 8000 : 3500;
    const icono = { ok: "ti-circle-check", info: "ti-info-circle", error: "ti-alert-circle" }[tipo] ?? "ti-info-circle";
    const el = document.createElement("p");
    el.className = `aviso aviso--${tipo === "error" || tipo === "info" ? tipo : "ok"}`;
    el.style.setProperty("--dura", `${dura}ms`); // la rayita de abajo se achica en ese tiempo
    el.innerHTML = `<i class="ti ${icono}" aria-hidden="true"></i><span></span>`;
    el.querySelector("span").textContent = mensaje;
    el.title = "Tocá para cerrar";
    const cerrar = () => {
        if (el.classList.contains("saliendo")) return;
        el.classList.add("saliendo");
        setTimeout(() => el.remove(), 180);
    };
    el.addEventListener("click", cerrar);
    caja.append(el);
    setTimeout(cerrar, dura);
    return el;
}
