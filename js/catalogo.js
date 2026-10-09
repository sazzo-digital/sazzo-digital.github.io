// ============================================
// Catálogo de Sazzo: arma las tarjetas de demos (desde demos.js), las animaciones al bajar, los botones de
// contacto (desde config.js), guarda de dónde vino la visita (?o=papel / ?o=ig) y avisa a la medición.
// ============================================
import { DEMOS } from "./demos.js?v=4d29ab6988";
import { CONTACTO, MEDICION, LINK_DEMOS } from "./config.js?v=4d29ab6988";

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

/** Escapa un texto para meterlo en HTML (nada de lo que se muestra viene del link, pero por las dudas). */
function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** localStorage puede no estar (modo privado, permisos): nunca rompe la página. */
const guardado = {
    leer(clave) { try { return localStorage.getItem(clave); } catch { return null; } },
    escribir(clave, valor) { try { localStorage.setItem(clave, valor); } catch { /* sin localStorage: no pasa nada */ } },
    borrar(clave) { try { localStorage.removeItem(clave); } catch { /* sin localStorage: no pasa nada */ } }
};

// --- De dónde vino la visita y el registro de visitas (medicion\LEEME.md; no cambia nada en pantalla) ---
// Mismos nombres y mismos datos que el kit (kit\js\visita.js): sazzo-origen, sazzo-equipo, sazzo-yo.
// Nunca se manda nombre, teléfono, mail ni ubicación. En la PC (localhost) nunca se manda nada.
const ORIGENES_VALIDOS = /^[a-z0-9-]{1,30}$/;
const parametros = new URLSearchParams(location.search);
const origenDelLink = parametros.get("o");
if (origenDelLink && ORIGENES_VALIDOS.test(origenDelLink)) guardado.escribir("sazzo-origen", origenDelLink);
if (parametros.get("yo") === "1") guardado.escribir("sazzo-yo", "1"); // los celulares del equipo no cuentan
if (parametros.get("yo") === "0") guardado.borrar("sazzo-yo");

function equipo() {
    let id = guardado.leer("sazzo-equipo");
    if (!/^[a-z0-9]{8}$/.test(id ?? "")) {
        id = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
        guardado.escribir("sazzo-equipo", id);
    }
    return id;
}
const sesion = Math.random().toString(36).slice(2, 10); // cada vez que se abre la página

/** "Android · Chrome", "iPhone · adentro de Instagram"… (igual que el kit; no identifica a nadie). */
function dispositivo(agente = navigator.userAgent) {
    const sistema = /Android/.test(agente) ? "Android"
        : /iPhone|iPod/.test(agente) ? "iPhone"
        : /iPad/.test(agente) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad"
        : /Windows/.test(agente) ? "PC Windows"
        : /Mac OS/.test(agente) ? "Mac"
        : /Linux/.test(agente) ? "Linux" : "Otro";
    const navegador = /WhatsApp/.test(agente) ? "adentro de WhatsApp"
        : /Instagram|FBAN|FBAV/.test(agente) ? "adentro de Instagram o Facebook"
        : /EdgA?\//.test(agente) ? "Edge"
        : navigator.brave ? "Brave"
        : /SamsungBrowser/.test(agente) ? "Samsung Internet"
        : /Firefox|FxiOS/.test(agente) ? "Firefox"
        : /Chrome|CriOS/.test(agente) ? "Chrome"
        : /Safari/.test(agente) ? "Safari" : "otro navegador";
    return `${sistema} · ${navegador}`;
}

const EVENTOS = ["abrio-catalogo", "probar", "escribir", "instagram"];
const esLaPC = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";

/** Avisa al registro de visitas qué pasó (uno de EVENTOS; en "probar", qué demo). */
function contar(que, demo = "") {
    if (!EVENTOS.includes(que)) return;
    const evento = {
        evento: que,
        demo: String(demo).slice(0, 30),
        persona: "",
        pantalla: "",
        origen: (guardado.leer("sazzo-origen") || "directo").slice(0, 30),
        equipo: equipo(),
        sesion,
        dispositivo: dispositivo().slice(0, 60),
        cuando: Date.now()
    };
    const direccion = String(MEDICION.direccion ?? "");
    if (!direccion.startsWith("https://script.google.com/macros/") || esLaPC || guardado.leer("sazzo-yo") === "1") {
        console.debug("[visitas: no se manda]", evento);
        return;
    }
    // text/plain y no-cors: el navegador lo manda directo, sin preguntar antes (Apps Script no contesta eso).
    // keepalive: llega aunque justo se vaya a otra página (al tocar "Probala ahora").
    fetch(direccion, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify(evento) }).catch(() => {});
}

// --- Tarjetas de demos ---
const ETIQUETA = {
    celu: '<svg class="icono" aria-hidden="true"><use href="#i-celu"/></svg> Pensada para el celu',
    compu: '<svg class="icono" aria-hidden="true"><use href="#i-compu"/></svg> En la compu se ve mejor'
};
// Todas las demos traen "Probala con tus colores" y claro/oscuro (del kit)
const ETIQUETA_COLORES = '<span class="demo__etiqueta"><svg class="icono" aria-hidden="true"><use href="#i-paleta"/></svg> Probala con tus colores</span>';

/** El link a una demo: su carpeta (o su id) en LINK_DEMOS. Solo letras, números y guiones (si no, sin link). */
function linkDe(demo) {
    const carpeta = demo.carpeta ?? demo.id;
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(carpeta) ? LINK_DEMOS.replace("{id}", carpeta) : null;
}

function tarjeta(demo) {
    const renglones = demo.pantalla.map((r, i) => `<div class="celu__renglon" style="--i:${i}">${esc(r)}</div>`).join("");
    const link = demo.estado === "activa" ? linkDe(demo) : null;
    const boton = link
        ? `<a class="boton boton--chico" href="${esc(link)}" data-demo="${esc(demo.id)}">Probala ahora <svg class="icono" aria-hidden="true"><use href="#i-flecha"/></svg></a>`
        : `<span class="boton boton--chico boton--apagado" aria-disabled="true">Muy pronto</span>`;
    return `
        <article class="demo revelar" style="--acento:${esc(demo.acento)}">
            <div class="celu" aria-hidden="true">
                <div class="celu__pantalla">
                    <div class="celu__barra"><span>${esc(demo.nombre)}</span></div>
                    ${renglones}
                </div>
            </div>
            <div>
                <h3 class="demo__nombre">${esc(demo.nombre)}</h3>
                <p class="demo__rubro">${esc(demo.rubro)}</p>
                <p class="demo__pregunta">${esc(demo.pregunta)}</p>
                <div class="demo__pie">
                    ${boton}
                    <span class="demo__etiqueta">${ETIQUETA[demo.dispositivo] ?? ""}</span>
                    ${ETIQUETA_COLORES}
                </div>
            </div>
        </article>`;
}

const visibles = DEMOS.filter((d) => d.estado !== "retirada");
$("#lista-demos").innerHTML = visibles.map(tarjeta).join("");
$$("[data-demo]").forEach((a) => a.addEventListener("click", () => contar("probar", a.dataset.demo)));

// Cantidad de rubros en la portada (sale de la lista)
$$("[data-contar]").forEach((el) => { el.dataset.contar = visibles.length; el.textContent = visibles.length; });

// --- Contacto ---
const linkWhatsapp = CONTACTO.whatsapp ? `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(CONTACTO.mensaje)}` : null;
$$("[data-whatsapp]").forEach((a) => {
    if (linkWhatsapp) {
        a.href = linkWhatsapp;
        a.target = "_blank";
        a.rel = "noopener";
        a.addEventListener("click", () => contar("escribir"));
    }
});
// Sin número, los "Escribinos" de arriba llevan a la sección de contacto y los botones de WhatsApp no se muestran
if (!linkWhatsapp) $$("[data-solo-con-numero]").forEach((el) => (el.hidden = true));
const usuarioInstagram = /^[a-z0-9._]{1,30}$/i.test(CONTACTO.instagram ?? "") ? CONTACTO.instagram : null;
$$("[data-instagram]").forEach((a) => {
    if (usuarioInstagram) {
        a.href = `https://www.instagram.com/${encodeURIComponent(usuarioInstagram)}/`;
        a.target = "_blank";
        a.rel = "noopener";
        a.addEventListener("click", () => contar("instagram"));
        // Con WhatsApp, Instagram queda como segundo botón (borde); sin WhatsApp, es el principal
        if (linkWhatsapp && a.classList.contains("boton")) a.classList.add("boton--borde");
    } else a.hidden = true;
});
$$("[data-anio]").forEach((el) => (el.textContent = new Date().getFullYear()));

// --- Animaciones al bajar ---
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

function contarHasta(el) {
    const fin = Number(el.dataset.contar);
    if (quieto || !fin) return;
    const inicio = performance.now();
    const paso = (ahora) => {
        const p = Math.min((ahora - inicio) / 900, 1);
        el.textContent = Math.round(fin * p);
        if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
}

if ("IntersectionObserver" in window) {
    const alAparecer = new IntersectionObserver((entradas) => {
        for (const e of entradas) {
            if (!e.isIntersecting) continue;
            e.target.classList.add("visible");
            alAparecer.unobserve(e.target);
        }
    }, { threshold: 0.15 });
    $$(".revelar").forEach((el) => alAparecer.observe(el));

    // Los celulares dibujados se animan solo mientras se ven (ahorra batería)
    const pantallas = new IntersectionObserver((entradas) => {
        for (const e of entradas) e.target.classList.toggle("en-pantalla", e.isIntersecting);
    });
    $$(".demo").forEach((el) => pantallas.observe(el));
} else {
    $$(".revelar").forEach((el) => el.classList.add("visible"));
    $$(".demo").forEach((el) => el.classList.add("en-pantalla"));
}
setTimeout(() => $$("[data-contar]").forEach(contarHasta), 3100);

// Si llegó desde una demo a una sección ("Otras demos" → #demos, "Quiero esto" → #contacto): el navegador salta antes
// de que existan las tarjetas, y al aparecer corren todo para abajo. Ya dibujadas, se vuelve a ubicar la sección.
// (Una vez enseguida y otra cuando terminan de cargar las letras y las imágenes, que también mueven todo.)
const seccionPedida = /^#[a-z-]+$/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null;
const irALaSeccion = () => seccionPedida?.scrollIntoView({ block: "start", behavior: "instant" });
if (seccionPedida) {
    irALaSeccion();
    if (document.readyState === "complete") setTimeout(irALaSeccion, 0);
    else window.addEventListener("load", irALaSeccion, { once: true });
}

// --- Claro / oscuro ---
// Oscuro siempre por defecto (el script del <head> ya puso "claro" si la persona lo había elegido, para que no
// parpadee). La elección se guarda en "sazzo-tema", la misma clave que usan las demos: sigue al entrar a una demo.
const COLOR_BARRA = { claro: "#DDD1BB", oscuro: "#0B1210" };
const interruptorTema = $("#tema");
function pintarTema(tema) {
    const oscuro = tema !== "claro";
    if (oscuro) delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = "claro";
    $('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[oscuro ? "oscuro" : "claro"]);
    if (!interruptorTema) return;
    const texto = `Modo ${oscuro ? "oscuro" : "claro"}. Tocá para pasar a ${oscuro ? "claro" : "oscuro"}.`;
    interruptorTema.setAttribute("aria-checked", String(oscuro));
    interruptorTema.setAttribute("aria-label", texto);
    interruptorTema.title = texto;
}
pintarTema(document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro");
interruptorTema?.addEventListener("click", () => {
    const nuevo = document.documentElement.dataset.tema === "claro" ? "oscuro" : "claro";
    pintarTema(nuevo);
    try {
        localStorage.setItem("sazzo-tema", nuevo);
    } catch {
        // sin almacenamiento (ventana privada): dura hasta recargar
    }
});

contar("abrio-catalogo");
