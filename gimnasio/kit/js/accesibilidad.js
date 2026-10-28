// ============================================
// Dos arreglos para lectores de pantalla que valen para todas las demos, también para lo que se dibuja después:
//   - los íconos Tabler son adorno: aria-hidden="true" (el texto del botón ya dice qué hace);
//   - lo que se marca con la clase "activo" (filtros, días, servicios) lo dice también el lector:
//     botón → aria-pressed, enlace → aria-current, pestaña → aria-selected, opción → aria-checked.
// ============================================
const SELECTOR_ESTADO = "button.chip, a.chip, button.servicio";

export function ocultarIconos(raiz) {
    const iconos = raiz.matches?.("i.ti") ? [raiz] : [];
    iconos.push(...(raiz.querySelectorAll?.("i.ti") ?? []));
    iconos.forEach((i) => {
        if (!i.hasAttribute("aria-hidden") && !i.hasAttribute("aria-label") && !i.hasAttribute("role")) i.setAttribute("aria-hidden", "true");
    });
}

function marcarEstado(el, activo) {
    const rol = el.getAttribute("role");
    if (rol === "tab") el.setAttribute("aria-selected", String(activo));
    else if (rol === "radio") el.setAttribute("aria-checked", String(activo));
    else if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(activo));
    else if (activo) {
        if (!el.hasAttribute("aria-current")) el.setAttribute("aria-current", "true");
    } else if (el.getAttribute("aria-current") === "true") el.removeAttribute("aria-current");
}

export function marcarGrupo(padre) {
    if (!padre) return;
    const hermanos = [...padre.children].filter((el) => el.matches(SELECTOR_ESTADO));
    const hayActivo = hermanos.some((el) => el.classList.contains("activo"));
    hermanos.forEach((el) => {
        const tieneEstado = el.hasAttribute("aria-pressed") || el.hasAttribute("aria-selected") || el.hasAttribute("aria-checked") || el.hasAttribute("aria-current");
        if (hayActivo || tieneEstado) marcarEstado(el, el.classList.contains("activo"));
    });
}

export function marcarEstados(raiz) {
    const padres = new Set();
    if (raiz.matches?.(SELECTOR_ESTADO)) padres.add(raiz.parentElement);
    raiz.querySelectorAll?.(SELECTOR_ESTADO).forEach((el) => padres.add(el.parentElement));
    padres.forEach(marcarGrupo);
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const vigilar = () => {
        ocultarIconos(document.body);
        marcarEstados(document.body);
        const observador = new MutationObserver((cambios) => {
            cambios.forEach((c) => {
                if (c.type === "attributes") {
                    if (c.target.matches(SELECTOR_ESTADO)) marcarGrupo(c.target.parentElement);
                    return;
                }
                c.addedNodes.forEach((nodo) => {
                    if (nodo.nodeType !== 1) return;
                    ocultarIconos(nodo);
                    marcarEstados(nodo);
                });
            });
        });
        observador.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    };
    if (document.body) vigilar();
    else document.addEventListener("DOMContentLoaded", vigilar, { once: true });
}
