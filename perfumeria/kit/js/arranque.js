// ============================================
// Lo que hace toda demo al abrirse, antes de dibujar nada (una sola línea en su app.js: iniciarDemo(MARCA)):
// 1. Lee del link de dónde vino la visita (?o=…, ?yo=1). Nada de eso se muestra.
// 2. Vuelve a poner el color que eligió la última vez en "Probala con tus colores".
// 3. Si se abrió adentro de Instagram, WhatsApp o Facebook, avisa que conviene abrirla en el navegador.
// 4. Avisa al registro de visitas que se abrió, y después cada pantalla que mira (medicion\LEEME.md).
// 5. Si algo se rompe (un error que nadie atajó), lo avisa al registro de visitas (sin nada personal).
// ============================================
import { leerLink, contar, contarPantalla, vigilarErrores } from "./visita.js?v=a917437b5e";
import { recuperarColor } from "./colores.js?v=a917437b5e";
import { avisarSiEsNavegadorDeOtraApp } from "./navegador.js?v=a917437b5e";

export function iniciarDemo(marca) {
    leerLink();
    vigilarErrores(marca.id);
    recuperarColor(marca.prefijo);
    avisarSiEsNavegadorDeOtraApp();
    contar("abrio-demo", marca.id);
    // Un ratito después de cada cambio de pantalla (así no cuenta los saltos intermedios)
    let espera = null;
    addEventListener("hashchange", () => {
        clearTimeout(espera);
        espera = setTimeout(() => contarPantalla(marca.id), 700);
    });
}
