// ============================================
// Lo que hace toda demo al abrirse, antes de dibujar nada (una sola línea en su app.js: iniciarDemo(MARCA)):
// 1. Lee del link de dónde vino la visita (?o=…, ?yo=1). Nada de eso se muestra.
// 2. Vuelve a poner el color que eligió la última vez en "Probala con tus colores".
// 3. Si se abrió adentro de Instagram, WhatsApp o Facebook, avisa que conviene abrirla en el navegador.
// 4. Avisa al registro de visitas que se abrió, y después cada pantalla que mira (medicion\LEEME.md).
// ============================================
import { leerLink, contar, contarPantalla } from "./visita.js?v=8b20c8d426";
import { recuperarColor } from "./colores.js?v=8b20c8d426";
import { avisarSiEsNavegadorDeOtraApp } from "./navegador.js?v=8b20c8d426";

export function iniciarDemo(marca) {
    leerLink();
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
