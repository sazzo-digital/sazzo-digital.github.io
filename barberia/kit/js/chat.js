import { CONTACTO, RUTA_CHAT, LINK_CATALOGO } from "./config.js?v=dd1f695466";
import { botDelChat, mensajeQuieroEsto } from "./enlaces.js?v=dd1f695466";

export function cargarChat(marca, { contacto = CONTACTO, ruta = RUTA_CHAT, catalogo = LINK_CATALOGO } = {}) {
    const bot = botDelChat({ contacto });
    if (!bot || document.querySelector("script[data-chat-sazzo]")) return null;
    const guion = document.createElement("script");
    guion.src = `${ruta}chat-web.js`;
    Object.assign(guion.dataset, {
        chatSazzo: "", bot, origen: marca.id, flotante: "no", privacidad: `${catalogo}privacidad.html`,
        whatsapp: contacto.whatsapp ?? "", mensaje: mensajeQuieroEsto(marca)
    });
    document.body.append(guion);
    return guion;
}
