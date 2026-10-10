// ============================================
// Agenda de visitas de Sazzo Inmobiliaria: los próximos días en pastillas (con cuántas visitas tiene cada uno) y las
// visitas del día por agente (Tomás ve las suyas; Graciela, las de los dos). Las pedidas desde la página se
// confirman desde su consulta; las que ya pasaron se marcan "Visitó" o "No vino".
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=bc8d90946e";
import { pastillaVisita, chipsDias, mayuscula } from "./comunes.js?v=bc8d90946e";

let fecha = null; // el día elegido queda mientras se navega

export function vistaAgenda(cont, { usuario, datos }) {
    const dias = datos.dias();
    if (!dias.some((d) => d.fecha === fecha)) fecha = dias.find((d) => !d.cerrado)?.fecha ?? dias[0].fecha;
    const a = datos.agenda(usuario, fecha);
    const total = a.columnas.reduce((t, c) => t + c.visitas.length, 0);
    const renglon = (v) => `
        <li class="renglon renglon--${esc(v.estado)}">
            <span class="renglon__hora">${esc(v.hora)}<small>a ${esc(v.hasta)}</small></span>
            <span class="renglon__que">
                ${v.consultaId ? `<a href="#/consultas/${esc(v.consultaId)}"><b>${esc(v.consultaNombre)}</b></a>` : `<b>${esc(v.consultaNombre)}</b>`}
                <small>${esc(v.propiedad)} · ${esc(v.zonaNombre)}</small>
                <span class="renglon__acciones">${pastillaVisita(v)}
                    ${v.estado === "pedida" ? `<a class="boton boton--chico" href="#/consultas/${esc(v.consultaId)}"><i class="ti ti-check"></i> Confirmar</a>` : ""}
                    ${v.estado === "confirmada" && v.empezo ? `
                    <button class="boton boton--chico" type="button" data-marcar="hecha" data-visita="${esc(v.id)}"><i class="ti ti-check"></i> Visitó</button>
                    <button class="boton boton--chico boton--secundario" type="button" data-marcar="falto" data-visita="${esc(v.id)}">No vino</button>` : ""}
                </span>
            </span>
        </li>`;
    cont.innerHTML = `
        <h1 class="titulo">Agenda de visitas</h1>
        <p class="nota pista"><i class="ti ti-info-circle"></i><span>Lunes a viernes de 9 a 19 y sábados de 9 a 13. Nadie puede estar en dos visitas a la vez.</span></p>
        ${chipsDias(dias, fecha, datos.visitasPorDia(usuario))}
        <p class="tira"><span><b>${esc(mayuscula(a.nombre))}</b></span><span>${esc(total)} visita${total === 1 ? "" : "s"}</span></p>
        ${a.cerrado ? vacio("Los domingos no hay visitas.", "ti-calendar-off") : `
        <div class="columnas">${a.columnas.map((c) => `
            <section class="columna" aria-label="Visitas de ${esc(c.agente)}">
                ${a.columnas.length > 1 ? `<h2 class="subtitulo"><i class="ti ti-user"></i> ${esc(c.agente)}</h2>` : ""}
                ${c.visitas.length ? `<ul class="renglones">${c.visitas.map(renglon).join("")}</ul>` : `<p class="nota"><i class="ti ti-calendar"></i><span>Sin visitas ese día.</span></p>`}
            </section>`).join("")}
        </div>`}`;
    cont.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => {
        fecha = b.dataset.dia;
        vistaAgenda(cont, { usuario, datos });
    }));
    cont.querySelectorAll("[data-marcar]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.marcarVisita(usuario, b.dataset.visita, b.dataset.marcar);
            aviso(b.dataset.marcar === "hecha" ? "Anotado: visitó" : "Anotado: no vino");
            vistaAgenda(cont, { usuario, datos });
        } catch (e) {
            aviso(e, "error");
        }
    }));
}
