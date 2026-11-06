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
// registro de visitas como "Error en la demo", con "navegador-viejo" o "no-arranco" en el campo error. Va con lo
// mismo que manda la demo (esquema 2 de docs\registro\contrato-de-eventos.md): nada personal. En la PC (localhost)
// nunca se manda; los equipos marcados con ?yo=1 van como prueba. La dirección la pone el script de armar.
var MEDICION_ARRANQUE = "https://script.google.com/macros/s/AKfycbxZ7E0BrDFH4V-8hs-iQ-MW3kMfHHZwCqBDWnaGyJNk4CBHbHlpOMcLYPz35n6TQsdb/exec";
var HUELLA_ARRANQUE = (/[?&]v=([0-9a-f]{10})(?:&|$)/.exec((document.currentScript && document.currentScript.src) || "") || [])[1] || "";
function leerArranque(clave) {
    try {
        return localStorage.getItem(clave);
    } catch (e) {
        return null;
    }
}
function alAzarArranque(largo) {
    var letras = "abcdefghijklmnopqrstuvwxyz0123456789";
    var numeros = [];
    var i;
    if (window.crypto && window.crypto.getRandomValues) numeros = window.crypto.getRandomValues(new Uint8Array(largo));
    else for (i = 0; i < largo; i++) numeros.push(Math.floor(Math.random() * 256));
    var texto = "";
    for (i = 0; i < largo; i++) texto += letras.charAt(numeros[i] % letras.length);
    return texto;
}
function avisarQueNoArranco(que) {
    try {
        if (MEDICION_ARRANQUE.indexOf("https://script.google.com/macros/") !== 0 || !window.fetch) return;
        if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
        var carpeta = (location.pathname.match(/([a-z0-9-]+)\/(?:index\.html)?$/) || [])[1];
        if (!carpeta) return;
        var equipo = leerArranque("sazzo-equipo");
        var almacenamiento = "si";
        if (!/^[a-z0-9]{8}$/.test(equipo || "")) {
            equipo = alAzarArranque(8);
            try {
                localStorage.setItem("sazzo-equipo", equipo);
                if (localStorage.getItem("sazzo-equipo") !== equipo) almacenamiento = "no";
            } catch (e) {
                almacenamiento = "no";
            }
        }
        var origen = /^([a-z0-9-]{1,30})\|(\d{1,15})$/.exec(leerArranque("sazzo-origen") || "");
        var ua = navigator.userAgent;
        var sistema = /Android/.test(ua) ? "Android" : /iPhone|iPod/.test(ua) ? "iPhone" : /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad"
            : /Windows/.test(ua) ? "PC Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Otro";
        var navegador = /WhatsApp/.test(ua) ? "adentro de WhatsApp" : /Instagram|FBAN|FBAV/.test(ua) ? "adentro de Instagram o Facebook"
            : /EdgA?\//.test(ua) ? "Edge" : navigator.brave ? "Brave"
            : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox|FxiOS/.test(ua) ? "Firefox"
            : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "otro navegador";
        var host = location.hostname.toLowerCase();
        var meta = document.querySelector('meta[name="version"]');
        var evento = {
            esquema: 2,
            id: alAzarArranque(12),
            evento: "error",
            demo: carpeta,
            persona: "",
            pantalla: "inicio",
            error: que,
            origen: origen && Date.now() - Number(origen[2]) < 12 * 60 * 60 * 1000 ? origen[1] : "directo",
            equipo: equipo,
            sesion: alAzarArranque(8),
            sistema: sistema,
            navegador: navegador,
            dispositivo: sistema + " · " + navegador,
            productos: [],
            webdriver: navigator.webdriver === true ? "si" : navigator.webdriver === false ? "no" : "desconocido",
            almacenamiento: almacenamiento,
            sitio: host === "sazzo.com.ar" || host === "www.sazzo.com.ar" ? "sazzo.com.ar" : host === "sazzo-demos.web.app" ? "sazzo-demos.web.app" : "otro",
            version: (/^\d{1,3}\.\d{1,3}/.exec((meta && meta.content) || "") || [""])[0],
            huella: HUELLA_ARRANQUE,
            cuando: Date.now()
        };
        if (leerArranque("sazzo-yo") === "1") evento.prueba = "yo";
        fetch(MEDICION_ARRANQUE, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify(evento) })["catch"](function () {});
    } catch (e) {
        return;
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
        // Si a los 15 segundos (contando solo con la página a la vista) sigue sin arrancar, que lo diga
        else {
            var visible = 0;
            var reloj = setInterval(function () {
                if (!document.querySelector("#app .cargando")) return clearInterval(reloj);
                if (document.visibilityState === "hidden") return;
                visible += 1;
                if (visible < 15) return;
                clearInterval(reloj);
                avisar("Está tardando más de lo normal. Probá recargar la página o abrirla en Chrome o Safari actualizados.");
                avisarQueNoArranco("no-arranco");
            }, 1000);
        }
        if (sinColores && !sinModulos) {
            var barra = document.createElement("p");
            barra.className = "aviso-navegador-viejo";
            barra.textContent = VIEJO;
            barra.setAttribute("style", "margin:0;padding:.6rem 1rem;background:#f59e0b;color:#1d1404;font:600 14px/1.4 system-ui,sans-serif;text-align:center");
            document.body.insertBefore(barra, document.body.firstChild);
        }
    });
})();
