// ============================================
// Pantallas y datos de ejemplo que se bajan aparte, para que "Probala como…" aparezca sin esperarlos.
// En un celular con 4G flojo, bajar y leer todas las pantallas antes del ingreso tardaba ~0,5 s más. Se empiezan a
// bajar recién cuando la página terminó de cargar (cuandoTermineDeCargar) o al elegir persona (ya), para no
// disputarle la conexión.
//
// Uso en el app.js de la demo (pantallas.js reexporta crearDatos y las vistas):
//   const pantallas = aparte(() => import(…"./pantallas.js"…));   // las pide al terminar de cargar (así en cada app.js)
//   const { vistaInicio, vistaCaja } = pantallas.funciones;     // cada vista espera a que bajen (son async;
//                                                               // el enrutador ya las espera con await)
//   const listos = pantallas.listo.then((m) => (datos = m.crearDatos()));
//   …y en entrar(): pantallas.ya(); await listos;
//
// El script de armar le pone versión a ese import (como a los demás) y no lo precarga (no va en modulepreload).
// ============================================

/**
 * Se resuelve cuando la página terminó de cargar lo suyo (letras, íconos: la frase del ingreso ya está con su letra), o
 * antes si la persona ya está tocando algo. Así lo que se baja aparte no le disputa la conexión al ingreso.
 */
export const cuandoTermineDeCargar = () =>
    new Promise((listo) => {
        if (document.readyState === "complete") setTimeout(listo, 0);
        else addEventListener("load", () => setTimeout(listo, 0), { once: true });
        addEventListener("pointerdown", listo, { once: true, capture: true });
        addEventListener("keydown", listo, { once: true, capture: true });
    });

/**
 * aparte(cargar) → { listo, funciones, ya }: `ya()` las pide en el momento (al elegir persona, o si ya había alguien
 * adentro): no espera a que termine de cargar la página.
 */
export function aparte(cargar, { esperar = cuandoTermineDeCargar } = {}) {
    let empezar;
    const arranque = new Promise((r) => (empezar = r));
    esperar().then(() => empezar());
    const listo = arranque.then(cargar);
    const funciones = new Proxy({}, {
        get: (_, nombre) => async (...args) => {
            empezar(); // si ya se necesita una pantalla, no se espera más
            const modulo = await listo;
            if (typeof modulo[nombre] !== "function") throw new Error(`Falta "${String(nombre)}" en las pantallas de la demo.`);
            return modulo[nombre](...args);
        }
    });
    return { listo, funciones, ya: () => empezar() };
}
