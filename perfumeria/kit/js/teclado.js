// ============================================
// El teclado del celular en los formularios de todas las demos (10/10/2026). Lo prende iniciarDemo (kit/arranque.js),
// así no hay que tocar cada campo de cada demo:
// - La tecla Enter del teclado dice "Siguiente" si quedan campos para llenar (y lleva al próximo), "Listo" en el
//   último y "Buscar" en los buscadores (enterkeyhint). Lo de llevar al próximo, solo en pantallas táctiles: en la
//   compu, Enter sigue guardando el formulario como siempre.
// - autocomplete="off" donde la demo no dijo otra cosa: en una demo de prueba el navegador no tiene que ofrecer los
//   nombres, teléfonos o direcciones guardados de la persona.
// El teclado numérico (inputmode) ya lo pone cada campo.
// ============================================

const NO_ESCRIBIBLES = ["checkbox", "radio", "range", "color", "file", "button", "submit", "reset", "hidden", "image"];
const esEscribible = (el) =>
    el?.matches?.("input, textarea") && !NO_ESCRIBIBLES.includes(el.type) && !el.disabled && !el.readOnly;

/** Los campos que quedan para llenar después de este, en su formulario. */
export function camposDespues(campo) {
    const form = campo.form;
    if (!form) return [];
    const campos = [...form.elements].filter((el) => esEscribible(el) || (el.matches("select") && !el.disabled));
    // Los escondidos (hidden, inert) no cuentan; sin mirar si se ven en pantalla (una pestaña tapada no dibuja nada)
    return campos.slice(campos.indexOf(campo) + 1).filter((el) => !el.closest("[hidden], [inert]"));
}

/** Le pone a un campo lo que le falte (no pisa lo que la demo ya decidió). */
export function ajustarCampo(campo) {
    if (!esEscribible(campo)) return;
    if (!campo.hasAttribute("autocomplete")) campo.setAttribute("autocomplete", "off");
    if (campo.hasAttribute("enterkeyhint") || campo.tagName === "TEXTAREA") return;
    if (campo.type === "search") campo.setAttribute("enterkeyhint", "search");
    else campo.setAttribute("enterkeyhint", camposDespues(campo).length ? "next" : "done");
}

export function prepararTeclado(doc = document, { tactil = () => matchMedia("(pointer: coarse)").matches } = {}) {
    doc.addEventListener("focusin", (e) => ajustarCampo(e.target));
    doc.addEventListener("keydown", (e) => {
        const campo = e.target;
        if (e.key !== "Enter" || e.isComposing || campo.getAttribute?.("enterkeyhint") !== "next" || !tactil()) return;
        const proximo = camposDespues(campo)[0];
        if (!proximo) return;
        e.preventDefault();
        proximo.focus();
    });
}
