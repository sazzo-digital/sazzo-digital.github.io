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

// Navegador viejo (iPhone con iOS anterior a 16 o Chrome de antes de 2023): la demo no arranca o no se ven bien los
// colores. En vez de quedar en "Cargando…" para siempre, se avisa. (Este archivo no es un módulo: corre en cualquiera.)
(function () {
    var sinModulos = !("noModule" in document.createElement("script"));
    var sinColores = !(window.CSS && CSS.supports && CSS.supports("color", "color-mix(in srgb, red 50%, blue)"));
    var VIEJO = "Este navegador es muy viejo para la demo. Abrila en Chrome o Safari actualizados (o actualizá el celular).";
    function avisar(texto) {
        var cargando = document.querySelector("#app .cargando");
        if (cargando) cargando.textContent = texto;
    }
    document.addEventListener("DOMContentLoaded", function () {
        if (sinModulos || sinColores) avisar(VIEJO);
        // Si a los 15 segundos sigue sin arrancar (señal muy mala o algo falló), que lo diga
        else setTimeout(function () {
            avisar("Está tardando más de lo normal. Probá recargar la página o abrirla en Chrome o Safari actualizados.");
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
