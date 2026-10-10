// ============================================
// Adónde llevan los botones fijos de Sazzo (los usan el marco y el ingreso):
// - "Ver otras demos": al catálogo, a la parte de las demos.
// - "Quiero esto para mi negocio": WhatsApp de Sazzo con el mensaje ya escrito (dice qué demo vio). Mientras no
//   haya número cargado (config.js), al contacto del catálogo.
// ============================================
import { CONTACTO, LINK_CATALOGO } from "./config.js?v=3f853aa22c";

export const linkOtrasDemos = ({ catalogo = LINK_CATALOGO } = {}) => `${catalogo}#demos`;

export const mensajeQuieroEsto = (marca) => `Hola Sazzo! Probé la demo ${marca.nombre} y quiero algo así para mi negocio.`;

/** { href, externo }: externo = se abre en otra pestaña (WhatsApp). */
export function linkQuieroEsto(marca, { contacto = CONTACTO, catalogo = LINK_CATALOGO } = {}) {
    const numero = /^\d{8,15}$/.test(contacto?.whatsapp ?? "") ? contacto.whatsapp : null;
    if (!numero) return { href: `${catalogo}#contacto`, externo: false };
    return { href: `https://wa.me/${numero}?text=${encodeURIComponent(mensajeQuieroEsto(marca))}`, externo: true };
}
