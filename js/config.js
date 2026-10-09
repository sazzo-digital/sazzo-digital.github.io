// ============================================
// Datos que se cambian sin tocar el resto del catálogo.
// ============================================

// Contacto de Sazzo. Mientras esté en null, los botones llevan a la sección de contacto y avisan "a definir".
export const CONTACTO = {
    whatsapp: "5492996210484", // solo números, con código de país y sin el 15 (número de Sazzo, cargado el 08/10)
    instagram: "sazzo.digital", // el usuario, sin @ (null = no se muestra)
    mensaje: "Hola Sazzo! Vi las demos y quiero consultar por mi negocio."
};

// Dónde está cada demo, visto desde el catálogo ({id} = la carpeta de la demo en demos-venta\demos\).
// En la PC: demos-venta\demos\flota\. Publicado, todo va en un solo sitio: cada demo en una carpeta al lado del
// catálogo (…github.io/flota/). El script de armar el sitio del catálogo cambia esta línea por "./{id}/".
export const LINK_DEMOS = "./{id}/";

// Librerías que se bajan solo cuando se usan (el globo de "Somos un equipo…"). En la PC, las del kit; publicado, la
// copia única de la raíz del sitio (el script de armar el catálogo cambia esta línea por "./libs/").
export const RUTA_LIBS = "./libs/";

// Registro de visitas (medicion\LEEME.md): la planilla de Google de Sazzo. El script de armar el sitio cambia
// __MEDICION__ por la dirección de medicion\direccion.txt (vacía = no se manda nada). En la PC nunca se manda.
export const MEDICION = {
    direccion: "https://script.google.com/macros/s/AKfycbxZ7E0BrDFH4V-8hs-iQ-MW3kMfHHZwCqBDWnaGyJNk4CBHbHlpOMcLYPz35n6TQsdb/exec"
};
