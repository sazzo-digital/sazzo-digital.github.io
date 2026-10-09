// ============================================
// Ventanita con un mensaje ya escrito, "Compartir" (el menú del celular: WhatsApp, mail…; solo si el navegador lo
// tiene) y "Copiar mensaje". En la versión real ese botón abre WhatsApp con el mensaje al cliente; en la demo la
// persona lo comparte o lo copia ella misma (nada sale solo: son datos de ejemplo).
//   mostrarMensaje("Avisar que está listo", "Hola Silvia! Tu auto ya está listo…");
// Todo pasa por esc(). Si el navegador no deja usar el portapapeles, deja el texto seleccionado para copiarlo a mano.
// ============================================
import { esc, aviso } from "./ui.js?v=913263ebcb";
import { puedeCompartir, compartir } from "./celular.js?v=913263ebcb";

export const NOTA_MENSAJE = "En la versión real, este botón abre WhatsApp con el mensaje escrito. En la demo, lo copiás.";
export const NOTA_MENSAJE_COMPARTIR = "En la versión real, el mensaje le llega al cliente por WhatsApp. En la demo, lo compartís o lo copiás vos.";
export const TOPE_MENSAJE = 2000; // letras

export function mostrarMensaje(titulo, mensaje, { nota } = {}) {
    const conCompartir = puedeCompartir();
    nota ??= conCompartir ? NOTA_MENSAJE_COMPARTIR : NOTA_MENSAJE;
    const texto = String(mensaje ?? "");
    if (!texto.trim()) throw new Error("Falta el mensaje.");
    if (texto.length > TOPE_MENSAJE) throw new Error(`El mensaje es demasiado largo (máximo ${TOPE_MENSAJE} letras).`);
    const ventana = document.createElement("dialog");
    ventana.className = "mensaje";
    ventana.innerHTML = `
        <h2 class="subtitulo"><i class="ti ti-message-circle"></i> ${esc(titulo)}</h2>
        <p class="mensaje__texto">${esc(texto)}</p>
        ${nota ? `<p class="nota"><i class="ti ti-info-circle"></i> ${esc(nota)}</p>` : ""}
        <div class="mensaje__acciones">
            ${conCompartir ? `<button class="boton" type="button" data-compartir><i class="ti ti-share"></i> Compartir</button>` : ""}
            <button class="boton${conCompartir ? " boton--secundario" : ""}" type="button" data-copiar><i class="ti ti-copy"></i> Copiar mensaje</button>
            <button class="boton boton--secundario" type="button" data-cerrar>Cerrar</button>
        </div>`;
    document.body.append(ventana);
    const cerrar = () => {
        if (ventana.open) ventana.close();
        ventana.remove();
    };
    ventana.querySelector("[data-cerrar]").addEventListener("click", cerrar);
    ventana.addEventListener("cancel", cerrar);
    ventana.querySelector("[data-compartir]")?.addEventListener("click", async () => {
        if (await compartir({ titulo, texto })) cerrar();
    });
    ventana.querySelector("[data-copiar]").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(texto);
            aviso("Mensaje copiado");
            cerrar();
        } catch {
            const rango = document.createRange();
            rango.selectNodeContents(ventana.querySelector(".mensaje__texto"));
            getSelection().removeAllRanges();
            getSelection().addRange(rango);
            aviso("Seleccioné el mensaje: copialo con Ctrl + C", "info");
        }
    });
    if (typeof ventana.showModal === "function") ventana.showModal();
    else ventana.setAttribute("open", "");
    return ventana;
}
