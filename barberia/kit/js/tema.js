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
