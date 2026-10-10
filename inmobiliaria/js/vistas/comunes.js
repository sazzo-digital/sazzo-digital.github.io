// ============================================
// Piezas que comparten las pantallas de Sazzo Inmobiliaria: el botón del recorrido (del kit), pastillas de estado,
// la foto de cada propiedad (o su dibujo mientras no tenga), la tarjeta de una propiedad, los días en pastillas y la
// ventanita del mensaje para copiar (del kit). Todo dato que entra a HTML pasa por esc().
// ============================================
import { esc } from "../../kit/js/ui.js?v=5e0516f6ed";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=5e0516f6ed";
import { mostrarMensaje as ventanaMensaje } from "../../kit/js/mensaje.js?v=5e0516f6ed";
import { buscarPersona } from "../marca.js?v=5e0516f6ed";
import { fotosDe } from "../fotos.js?v=5e0516f6ed";

/** Botón del recorrido con la persona de la inmobiliaria: guia("u-agente", "/inicio", "Mirá lo que le llega a Tomás"). */
export const guia = (personaId, ruta, texto) => htmlGuia({ persona: buscarPersona(personaId), ruta, texto });
export { activarGuias };

const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
export { mayuscula };

/** El link a la ficha de una propiedad (la que busca la ve desde su inicio; la inmobiliaria, desde Propiedades). */
export const hrefPropiedad = (usuario, id) => (usuario.rol === "cliente" ? `#/propiedad/${esc(id)}` : `#/propiedades/${esc(id)}`);

const CLASE_CONSULTA = { nueva: "ojo", agendada: "bien", visito: "suave", interesada: "bien", cerrada: "neutra", descartada: "neutra" };
export const pastillaConsulta = (c) => `<span class="pastilla pastilla--${CLASE_CONSULTA[c.estado] ?? "suave"}">${esc(c.estadoTexto)}</span>`;

const CLASE_VISITA = { pedida: "ojo", confirmada: "bien", hecha: "suave", falto: "mal", cancelada: "neutra" };
export const pastillaVisita = (v) => `<span class="pastilla pastilla--${CLASE_VISITA[v.estado] ?? "suave"}">${esc(v.estadoTexto)}</span>`;

const CLASE_PROPIEDAD = { disponible: "bien", reservada: "ojo", alquilada: "neutra", vendida: "neutra" };
export const pastillaPropiedad = (p) => `<span class="pastilla pastilla--${CLASE_PROPIEDAD[p.estado] ?? "suave"}">${esc(p.estadoTexto)}</span>`;

/**
 * La foto de una propiedad. Mientras no tenga fotos, un dibujo con el ícono de su tipo (nunca una foto prestada de
 * un negocio real). `n` = cuál de sus fotos; `clase` agrega tamaño (foto--chica…).
 */
export function htmlFoto(p, { n = 0, clase = "", carga = "lazy", tamanos = "(min-width: 1000px) 320px, 100vw" } = {}) {
    const f = fotosDe(p)[n] ?? null;
    // La chica (480 px) para las tarjetas en la compu; la grande (960 px) para el celu y la galería
    if (f) return `<img class="foto ${esc(clase)}" src="${esc(f.grande)}"${f.chica !== f.grande ? ` srcset="${esc(f.chica)} 480w, ${esc(f.grande)} 960w" sizes="${esc(tamanos)}"` : ""} alt="${esc(n ? `${p.titulo} (foto ${n + 1})` : p.titulo)}" loading="${carga === "eager" ? "eager" : "lazy"}" decoding="async" width="960" height="720">`;
    return `<div class="foto foto--dibujo foto--${esc(p.tipo)} ${esc(clase)}" role="img" aria-label="${esc(`${p.tipoTexto ?? "Propiedad"}: todavía sin fotos`)}">
        <i class="ti ${esc(p.icono ?? "ti-home")}" aria-hidden="true"></i>
    </div>`;
}

/** "2 amb · 52 m² · 1 dorm" */
export function medidas(p) {
    const partes = [];
    if (p.tipo !== "lote" && p.tipo !== "cochera") partes.push(p.ambientes === 1 ? "1 ambiente" : `${p.ambientes} amb`);
    partes.push(`${p.m2.toLocaleString("es-AR")} m²`);
    if (p.dormitorios) partes.push(`${p.dormitorios} dorm`);
    return partes.join(" · ");
}

/** Tarjeta de una propiedad (con foto) para las listas. */
export const tarjetaPropiedad = (p, usuario, extra = "") => `
    <li class="prop${p.estado !== "disponible" ? " prop--apagada" : ""}">
        <a class="prop__link" href="${hrefPropiedad(usuario, p.id)}">
            <span class="prop__foto">${htmlFoto(p)}
                <span class="prop__operacion prop__operacion--${esc(p.operacion)}">${p.operacion === "venta" ? "Venta" : "Alquiler"}</span>
                ${p.nueva ? `<span class="prop__nueva">Recién cargada</span>` : p.recorrido ? `<span class="prop__nueva"><i class="ti ti-3d-cube-sphere" aria-hidden="true"></i> 360°</span>` : ""}
            </span>
            <span class="prop__datos">
                <b class="prop__precio">${esc(p.precioTexto)}</b>
                <span class="prop__titulo">${esc(p.titulo)}</span>
                <small><i class="ti ti-map-pin" aria-hidden="true"></i> ${esc(p.zonaNombre)} · ${esc(medidas(p))}</small>
                ${extra}
            </span>
        </a>
    </li>`;

/** Los próximos días en pastillas; los domingos, apagados. `cuantas` (opcional): visitas de cada día. */
export function chipsDias(dias, actual, cuantas = null) {
    return `<div class="chips dias" role="tablist" aria-label="Día">${dias.map((d) => `
        <button class="chip${d.fecha === actual ? " activo" : ""}" type="button" role="tab" aria-selected="${d.fecha === actual}" data-dia="${esc(d.fecha)}"${d.cerrado ? " disabled title=\"Cerrado\"" : ""}>${esc(mayuscula(d.nombre))}${d.cerrado ? " · cerrado" : ""}${cuantas?.[d.fecha] ? ` <b>${esc(cuantas[d.fecha])}</b>` : ""}</button>`).join("")}
    </div>`;
}

/**
 * La ventanita del mensaje para copiar (del kit). `alCopiar` corre cuando lo copia o lo comparte (para anotar que
 * se le escribió o que se avisó).
 */
export function mostrarMensaje(titulo, mensaje, { alCopiar } = {}) {
    const ventana = ventanaMensaje(titulo, mensaje);
    if (alCopiar) {
        let hecho = false;
        const una = () => {
            if (hecho) return;
            hecho = true;
            alCopiar();
        };
        ventana.querySelector("[data-copiar]")?.addEventListener("click", una);
        ventana.querySelector("[data-compartir]")?.addEventListener("click", una);
    }
    return ventana;
}

/** "hace 3 horas", "ayer", "hace 5 días". */
export function hace(iso, hoyISO) {
    const t = new Date(iso);
    const horas = Math.round((Date.now() - t.getTime()) / 36e5);
    const dia = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    if (dia === hoyISO) return horas <= 0 ? "recién" : horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;
    const [a, m, d] = hoyISO.split("-").map(Number);
    const dias = Math.round((new Date(a, m - 1, d) - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
    return dias === 1 ? "ayer" : `hace ${dias} días`;
}
