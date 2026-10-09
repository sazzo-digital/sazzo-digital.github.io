// Tema elegido a mano (claro u oscuro): se aplica antes de dibujar la página para que no parpadee.
// Va como <script src="…/kit/js/tema.js"> (no módulo) en el <head> de cada demo, antes de los estilos.
// Sin elegir, oscuro (08/10). La clave es la misma para todas las demos de Sazzo y el catálogo: si alguien elige claro
// en uno, los otros abren en claro.
// El interruptor de la cabecera la cambia (apariencia.js → aplicarTema).
try {
    var temaSazzo = localStorage.getItem("sazzo-tema");
    if (temaSazzo === "claro" || temaSazzo === "oscuro") document.documentElement.dataset.tema = temaSazzo;
} catch (e) {
    // sin almacenamiento (ventana privada): queda oscuro
}
// Sin elegir, oscuro (los estilos ya lo hacen): la barra del navegador del celular también, aunque el celular esté en claro
if (document.documentElement.dataset.tema !== "claro") {
    var barras = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < barras.length; i++) barras[i].content = "#0a0e0d";
}

// Los errores que pasen antes de que arranque la demo se guardan acá; cuando arranca, visita.js los avisa al registro
// de visitas (vigilarErrores) y deja esto en null.
window.__sazzoErrores = [];
window.addEventListener("error", function (e) {
    if (window.__sazzoErrores && e.message && window.__sazzoErrores.length < 5) window.__sazzoErrores.push(String(e.message));
});

// Si la demo no arranca (navegador viejo o a los 15 segundos sigue en "Cargando…"), además del cartel se avisa al
// registro de visitas como "Error en la demo", con "navegador-viejo" o "no-arranco" en Pantalla. Va con lo mismo que
// manda la demo (número de equipo al azar, tipo de equipo, navegador, por dónde llegó): nada personal. En la PC
// (localhost) y en los equipos marcados con ?yo=1 nunca se manda. La dirección la pone el script de armar.
var MEDICION_ARRANQUE = "https://script.google.com/macros/s/AKfycbxZ7E0BrDFH4V-8hs-iQ-MW3kMfHHZwCqBDWnaGyJNk4CBHbHlpOMcLYPz35n6TQsdb/exec";
function avisarQueNoArranco(que) {
    try {
        if (MEDICION_ARRANQUE.indexOf("https://script.google.com/macros/") !== 0 || !window.fetch) return;
        if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || localStorage.getItem("sazzo-yo") === "1") return;
        var carpeta = (location.pathname.match(/([a-z0-9-]+)\/(?:index\.html)?$/) || [])[1];
        if (!carpeta) return;
        var equipo = localStorage.getItem("sazzo-equipo");
        if (!/^[a-z0-9]{8}$/.test(equipo || "")) {
            equipo = (Math.random().toString(36).slice(2) + "00000000").slice(0, 8);
            localStorage.setItem("sazzo-equipo", equipo);
        }
        var origen = /^([a-z0-9-]{1,30})\|(\d{1,15})$/.exec(localStorage.getItem("sazzo-origen") || "");
        var ua = navigator.userAgent;
        var sistema = /Android/.test(ua) ? "Android" : /iPhone|iPod/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad"
            : /Windows/.test(ua) ? "PC Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Otro";
        var navegador = /WhatsApp/.test(ua) ? "adentro de WhatsApp" : /Instagram|FBAN|FBAV/.test(ua) ? "adentro de Instagram o Facebook"
            : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox|FxiOS/.test(ua) ? "Firefox"
            : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "otro navegador";
        var evento = {
            evento: "error",
            demo: carpeta,
            persona: "",
            pantalla: que,
            origen: origen && Date.now() - Number(origen[2]) < 12 * 60 * 60 * 1000 ? origen[1] : "directo",
            equipo: equipo,
            sesion: Math.random().toString(36).slice(2, 10),
            dispositivo: sistema + " · " + navegador,
            cuando: Date.now()
        };
        fetch(MEDICION_ARRANQUE, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify(evento) })["catch"](function () {});
    } catch (e) {
        // sin almacenamiento o sin red: no pasa nada
    }
}

// Navegador viejo (iPhone con iOS anterior a 16 o Chrome de antes de 2023): la demo no arranca o no se ven bien los
// colores. En vez de quedar en "Cargando…" para siempre, se avisa. (Este archivo no es un módulo: corre en cualquiera.)
(function () {
    var sinModulos = !("noModule" in document.createElement("script"));
    var sinColores = !(window.CSS && CSS.supports && CSS.supports("color", "color-mix(in srgb, red 50%, blue)"));
    var VIEJO = "Este navegador es muy viejo para la demo. Abrila en Chrome o Safari actualizados (o actualizá el celular).";
    function avisar(texto) {
        // El texto debajo del logo (o la pantalla de carga entera, si es la de antes)
        var cargando = document.querySelector("#app .cargando__texto") || document.querySelector("#app .cargando");
        if (cargando) cargando.textContent = texto;
    }
    document.addEventListener("DOMContentLoaded", function () {
        if (sinModulos || sinColores) {
            avisar(VIEJO);
            avisarQueNoArranco("navegador-viejo");
        }
        // Si a los 15 segundos sigue sin arrancar (señal muy mala o algo falló), que lo diga
        else setTimeout(function () {
            if (!document.querySelector("#app .cargando")) return; // ya arrancó
            avisar("Está tardando más de lo normal. Probá recargar la página o abrirla en Chrome o Safari actualizados.");
            avisarQueNoArranco("no-arranco");
        }, 15000);
        if (sinColores && !sinModulos) {
            var barra = document.createElement("p");
            barra.className = "aviso-navegador-viejo";
            barra.textContent = VIEJO;
            barra.setAttribute("style", "margin:0;padding:.6rem 1rem;background:#f59e0b;color:#1d1404;font:600 14px/1.4 system-ui,sans-serif;text-align:center");
            document.body.insertBefore(barra, document.body.firstChild);
        }
    });
})();
