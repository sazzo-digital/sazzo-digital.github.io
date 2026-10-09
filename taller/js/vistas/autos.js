// ============================================
// Autos y clientes: buscar por patente o por nombre; cada auto con todas sus visitas. Y "Para llamar": los que tienen
// el service vencido (más de 6 meses o 10.000 km) y no están en el taller, con el mensaje para recordárselo.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "kit/ui.js";
import { pesos } from "../datos.js";
import { chapa, pastillaEstado, mostrarMensaje } from "./comunes.js";

let vista = "todos"; // "todos" o "llamar"
let texto = "";

export function vistaAutos(cont, { usuario, datos }) {
    const dueno = usuario.rol === "dueno";
    const llamar = dueno ? datos.paraLlamar() : [];
    if (!dueno) vista = "todos";
    cont.innerHTML = `
        <h1 class="titulo">Autos y clientes</h1>
        ${dueno ? `
        <div class="chips" role="tablist">
            <button class="chip${vista === "todos" ? " activo" : ""}" type="button" data-vista="todos">Todos</button>
            <button class="chip chip--alerta${vista === "llamar" ? " activo" : ""}" type="button" data-vista="llamar">Para llamar <b>${llamar.length}</b></button>
        </div>` : ""}
        ${vista === "llamar" ? `
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Les toca el service y no vinieron. Escribiles: es lo que más gente trae de vuelta.</p>
        <ul class="tarjetas">${llamar.length ? llamar.map((a) => `
            <li class="tarjeta tarjeta--alerta">
                <div class="tarjeta__fila"><a class="tarjeta__titulo" href="#/autos/${esc(a.id)}">${chapa(a.patenteTexto)} ${esc(a.modelo)}</a></div>
                <p class="tarjeta__quien">${esc(a.cliente.nombre)} · ${esc(a.motivo)}</p>
                <div class="tarjeta__pie">
                    <small>${a.llamadoEn ? `Le escribiste el ${esc(fechaCorta(a.llamadoEn.slice(0, 10)))}` : "Todavía no le escribiste"}</small>
                    <button class="boton boton--chico" type="button" data-llamar="${esc(a.id)}"${a.llamadoEn ? " disabled" : ""}><i class="ti ti-message-circle"></i> Escribirle</button>
                </div>
            </li>`).join("") : `<li>${vacio("Nadie tiene el service vencido.", "ti-circle-check")}</li>`}</ul>` : `
        <label class="buscador">
            <i class="ti ti-search" aria-hidden="true"></i>
            <span class="solo-lector">Buscar</span>
            <input type="search" name="q" maxlength="40" placeholder="Patente, cliente o modelo" value="${esc(texto)}" autocomplete="off">
        </label>
        <ul class="tarjetas lista-autos"></ul>`}`;

    const lista = cont.querySelector(".lista-autos");
    const pintar = () => {
        const autos = datos.listarAutos({ texto });
        lista.innerHTML = autos.length ? autos.map((a) => `
            <li><a class="tarjeta tarjeta--link" href="#/autos/${esc(a.id)}">
                <div class="tarjeta__fila"><span class="tarjeta__titulo">${chapa(a.patenteTexto)} ${esc(a.modelo)}</span>${a.abierta ? `<span class="pastilla pastilla--info">En el taller</span>` : ""}</div>
                <p class="tarjeta__quien">${esc(a.cliente.nombre)} · ${a.visitas} ${a.visitas === 1 ? "visita" : "visitas"}${a.ultimaVisita ? ` · la última el ${esc(fechaCorta(a.ultimaVisita))}` : ""}</p>
            </a></li>`).join("") : `<li>${vacio("No hay autos con eso.", "ti-car")}</li>`;
    };
    if (lista) {
        cont.querySelector("[name=q]").addEventListener("input", (e) => {
            texto = e.target.value;
            pintar();
        });
        pintar();
    }
    cont.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => {
        vista = b.dataset.vista;
        vistaAutos(cont, { usuario, datos });
    }));
    cont.querySelectorAll("[data-llamar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const r = datos.llamar(usuario, b.dataset.llamar);
            mostrarMensaje(`Escribirle a ${r.auto.cliente.nombre}`, r.mensaje);
            vistaAutos(cont, { usuario, datos });
        } catch (err) {
            aviso(err.message, "error");
        }
    }));
}

export function vistaAuto(cont, { usuario, datos, params: [id] }) {
    const a = datos.auto(id, usuario);
    const dueno = usuario.rol === "dueno";
    cont.innerHTML = `
        <a class="volver" href="#/autos"><i class="ti ti-arrow-left"></i> Autos</a>
        <div class="cabeza-orden">
            ${chapa(a.patenteTexto, true)}
            <div><h1 class="titulo">${esc(a.modelo)}${a.anio ? ` <small class="titulo__extra">${esc(a.anio)}</small>` : ""}</h1><p class="nota">${esc(a.cliente.nombre)}</p></div>
        </div>
        <dl class="datos-orden">
            <div><dt>Kilómetros</dt><dd>${esc(a.km.toLocaleString("es-AR"))}</dd></div>
            <div><dt>Último service</dt><dd>${a.ultimoService ? esc(fechaCorta(a.ultimoService.fecha)) : "—"}<small>${a.ultimoService ? `${esc(a.ultimoService.km.toLocaleString("es-AR"))} km` : ""}</small></dd></div>
            <div><dt>Visitas</dt><dd>${esc(a.visitas)}</dd></div>
        </dl>
        ${dueno && !a.abierta ? `<a class="boton" href="#/entro?patente=${esc(a.patente)}"><i class="ti ti-car"></i> Entró este auto</a>` : ""}
        <h2 class="subtitulo"><i class="ti ti-history"></i> Visitas</h2>
        <ul class="tarjetas">${a.historial.map((o) => {
            const adentro = `
                <div class="tarjeta__fila"><b>${esc(fechaCorta(o.recibidaEn.slice(0, 10)))} · N° ${esc(o.numero)}</b>${pastillaEstado(o)}</div>
                <p class="tarjeta__quien">“${esc(o.dijo)}”${o.renglones.length ? ` · ${esc(o.renglones.map((r) => r.nombre).join(", "))}` : ""}</p>
                ${dueno && o.renglones.length ? `<p class="tarjeta__quien"><b>${esc(pesos(o.total))}</b> · ${esc(o.km.toLocaleString("es-AR"))} km</p>` : ""}
                ${o.puedeAbrir ? "" : `<p class="nota">La hizo ${esc(o.mecanico)}.</p>`}`;
            // Las de otro mecánico se ven, pero no se abren (no tiene permiso)
            return o.puedeAbrir
                ? `<li><a class="tarjeta tarjeta--link" href="#/orden/${esc(o.id)}">${adentro}</a></li>`
                : `<li class="tarjeta">${adentro}</li>`;
        }).join("")}</ul>`;
}
