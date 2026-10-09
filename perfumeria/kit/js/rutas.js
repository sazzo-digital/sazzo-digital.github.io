// ============================================
// Rutas: el hash de la dirección (#/inicio, #/producto/ID…) decide qué pantalla se muestra.
// Cada demo arma su lista de rutas:
//   { patron: /^\/inicio$/, vista: vistaInicio }
//   { patron: /^\/producto\/([\w-]+)$/, vista: vistaProducto, menu: "/productos" }   (lo que va entre paréntesis
//     le llega a la vista en `params`; `menu` dice qué ítem del menú se marca)
//   { patron: /^\/caja$/, vista: vistaCaja, puede: (u) => u.rol === "duenio", ancho: true }
//     `puede` limita la pantalla a ciertos roles (las funciones de datos lo controlan igual con exigir()).
//     `ancho`: en la PC usa más ancho (en el celular no cambia nada).
// Cada vista recibe (contenedor, { usuario, params, consulta }) y dibuja adentro.
// ============================================
import { $$, esc, vacio } from "./ui.js";

/** Lo que hay después del # → { ruta: "/producto/p-1", consulta: URLSearchParams }. Sin hash: la de inicio. */
export function leerHash(inicio = "/inicio") {
    const [ruta, consulta = ""] = (location.hash.slice(1) || inicio).split("?");
    return { ruta, consulta: new URLSearchParams(consulta) };
}

export const buscarRuta = (rutas, ruta) => rutas.find((r) => r.patron.test(ruta));

/** Qué ítem del menú corresponde a una ruta: el que diga la ruta (`menu`) o su primera parte ("/productos/nuevo" → "/productos"). */
export const seccionDe = (ruta, r) => r?.menu ?? `/${ruta.split("/")[1] ?? ""}`;

// Mientras carga: renglones "fantasma" que brillan (en vez de un texto suelto)
export const ESQUELETO = `
    <div class="esqueleto" aria-hidden="true">
        <span class="esqueleto__titulo"></span>
        <span class="esqueleto__panel"></span>
        <span></span><span></span><span></span>
    </div>`;

/**
 * Muestra la pantalla de la ruta actual adentro de `contenido`.
 * Devuelve cómo terminó (sirve para las pruebas): "ok", "desconocida" (manda al inicio), "sin-permiso" o "error".
 */
export async function mostrarRuta({ rutas, contenido, usuario, inicio = "/inicio" }) {
    const { ruta, consulta } = leerHash(inicio);
    const r = buscarRuta(rutas, ruta);
    if (!r) {
        location.hash = `#${inicio}`;
        return "desconocida";
    }

    // El menú marca la sección actual (y los lectores de pantalla la anuncian)
    const seccion = seccionDe(ruta, r);
    $$(".menu__item").forEach((a) => {
        const actual = a.dataset.ruta === seccion;
        a.classList.toggle("activo", actual);
        if (actual) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
    });

    contenido.classList.toggle("contenido--ancho", !!r.ancho);
    // Sin permiso o con error: el mensaje y una salida (si no, la pantalla queda sin botones)
    const sinSalida = (mensaje, icono) =>
        `${vacio(mensaje, icono)}<p class="vacio__salida"><a class="boton boton--secundario" href="#${esc(inicio)}"><i class="ti ti-arrow-left" aria-hidden="true"></i> Volver al inicio</a></p>`;
    if (r.puede && !r.puede(usuario)) {
        contenido.innerHTML = sinSalida("No tenés acceso a esta pantalla.", "ti-lock");
        return "sin-permiso";
    }

    contenido.innerHTML = ESQUELETO;
    let estado = "ok";
    try {
        await r.vista(contenido, { usuario, params: ruta.match(r.patron).slice(1), consulta });
    } catch (e) {
        console.error(e);
        contenido.innerHTML = sinSalida(e.message);
        estado = "error";
    }
    window.scrollTo(0, 0);
    // Al llegar a otra pantalla, el contenido entra de abajo con un fundido
    contenido.classList.remove("entrando");
    void contenido.offsetWidth; // reinicia la animación
    contenido.classList.add("entrando");
    return estado;
}
