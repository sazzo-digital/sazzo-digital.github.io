// ============================================
// Datos de Sazzo que comparten todas las demos (se cambian acá, una sola vez).
// Tienen que coincidir con catalogo\js\config.js (el catálogo es otro sitio y tiene su copia).
// ============================================

// Contacto. Mientras whatsapp esté en null, "Quiero esto para mi negocio" lleva al contacto del catálogo.
export const CONTACTO = {
    whatsapp: "5492996210484" // solo números, con código de país y sin el 15 (número de Sazzo, cargado el 08/10)
};

// Dónde está el catálogo, visto desde la página de la demo. En la PC: demos-venta\catalogo\ (dos carpetas arriba
// de demos\kiosco\). Publicado, todo va en un solo sitio: el catálogo en la raíz y cada demo adentro
// (…github.io/kiosco/), así que el script de armar el sitio cambia esta línea por "../".
export const LINK_CATALOGO = "../";

// El lector de códigos de respaldo (kit\escaner\: para los celulares sin lector propio). En la PC, desde el kit; el
// script de armar lo cambia por la copia única de la raíz del sitio ("../escaner/").
export const RUTA_ESCANER = "../escaner/";

// El visor 3D (kit\3d\: model-viewer). En la PC desde el kit; publicado, la copia única de la raíz ("../3d/").
export const RUTA_3D = "../3d/";

// Excel, PDF y firma en pantalla (kit\libs\). En la PC desde el kit; publicado, la copia única de la raíz ("../libs/").
export const RUTA_LIBS = "../libs/";

// Registro de visitas (medicion\LEEME.md): la planilla de Google de Sazzo. El script de armar el sitio cambia
// __MEDICION__ por la dirección de medicion\direccion.txt (vacía = no se manda nada). En la PC nunca se manda.
export const MEDICION = {
    direccion: "https://script.google.com/macros/s/AKfycbxZ7E0BrDFH4V-8hs-iQ-MW3kMfHHZwCqBDWnaGyJNk4CBHbHlpOMcLYPz35n6TQsdb/exec"
};
