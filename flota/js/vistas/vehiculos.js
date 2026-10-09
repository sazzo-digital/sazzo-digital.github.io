// ============================================
// Vehículos (administradora y mecánico): lista con filtro por estado y la ficha de cada uno
// (estado, chofer de hoy, km y service, papeles con vencimiento e historia de problemas).
// ============================================
import { esc, vacio, aviso, fechaCorta } from "../../kit/js/ui.js?v=9b46aea81a";
import { ESTADOS_VEHICULO, TOPES } from "../datos.js?v=9b46aea81a";
import { haceCuanto, pastillaVehiculo, pastillaProblema, historiaProblema, textoRepuestos } from "./comunes.js?v=9b46aea81a";

const km = (n) => `${n.toLocaleString("es-AR")} km`;

export function vistaVehiculos(cont, { datos, consulta }) {
    const filtro = ESTADOS_VEHICULO[consulta.get("estado")] ? consulta.get("estado") : null;
    const todos = datos.listarVehiculos();
    const lista = todos.filter((v) => !filtro || v.estado === filtro);
    const chip = (estado, texto) => {
        const n = estado ? todos.filter((v) => v.estado === estado).length : todos.length;
        return `<a class="chip${filtro === estado ? " activo" : ""}" href="#/vehiculos${estado ? `?estado=${estado}` : ""}">${esc(texto)} <b>${n}</b></a>`;
    };
    cont.innerHTML = `
        <h1 class="titulo">Vehículos</h1>
        <nav class="chips" aria-label="Filtrar por estado">
            ${chip(null, "Todos")}
            ${Object.entries(ESTADOS_VEHICULO).map(([id, e]) => chip(id, e.texto)).join("")}
        </nav>
        ${lista.length ? `<ul class="tarjetas">${lista.map((v) => `
            <li><a class="tarjeta tarjeta--link" href="#/vehiculos/${esc(v.id)}">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(v.tipoInfo.icono)}" aria-hidden="true"></i>${esc(v.nombre)}</span>
                    ${pastillaVehiculo(v.estado)}
                </div>
                <p class="tarjeta__quien">${v.chofer ? `Hoy: ${esc(v.chofer)}` : "Sin chofer hoy"} · ${esc(km(v.km))}${v.abierto ? ` · ${esc(v.abierto.tipoInfo.texto)}` : ""}</p>
            </a></li>`).join("")}</ul>` : vacio("No hay vehículos en ese estado.", "ti-circle-check")}`;
}

export function vistaFicha(cont, { usuario, datos, params: [id] }) {
    const v = datos.ficha(id);
    const s = v.service;
    const nivelService = { vencido: "rojo", cerca: "ambar", ok: "ok" }[s.nivel];
    const nivelPapel = { vencido: "rojo", "por-vencer": "ambar", ok: "ok" };
    const textoPapel = (p) => (p.dias < 0 ? `venció hace ${-p.dias} ${-p.dias === 1 ? "día" : "días"}` : p.dias === 0 ? "vence hoy" : `vence el ${fechaCorta(p.vence)}`);

    cont.innerHTML = `
        <a class="volver" href="#/vehiculos"><i class="ti ti-arrow-left"></i> Vehículos</a>
        <div class="titulo-con-accion">
            <h1 class="titulo"><i class="ti ${esc(v.tipoInfo.icono)}" aria-hidden="true"></i> ${esc(v.nombre)}</h1>
            ${pastillaVehiculo(v.estado)}
        </div>
        <dl class="datos">
            <div><dt>Chofer de hoy</dt><dd>${esc(v.chofer ?? "Nadie")}</dd></div>
            <div><dt>Kilómetros</dt><dd>${esc(km(v.km))}</dd></div>
            <div class="datos--${nivelService}"><dt>Próximo service</dt><dd>${esc(km(v.proximoService))}<small>${s.faltan > 0 ? `faltan ${esc(km(s.faltan))}` : `se pasó por ${esc(km(-s.faltan))}`}</small></dd></div>
            ${v.papeles.map((p) => `<div class="datos--${nivelPapel[p.nivel]}"><dt>${esc(p.tipo)}</dt><dd>${esc(fechaCorta(p.vence))}<small>${esc(textoPapel(p))}</small></dd></div>`).join("")}
        </dl>
        <form class="formulario km" novalidate>
            <label>Actualizar kilómetros
                <span class="km__fila">
                    <input name="km" type="number" inputmode="numeric" min="${v.km}" max="${TOPES.km}" step="1" value="${v.km}">
                    <button class="boton boton--secundario" type="submit"><i class="ti ti-gauge"></i> Guardar</button>
                </span>
            </label>
        </form>
        <h2 class="subtitulo"><i class="ti ti-history"></i> Historia de problemas</h2>
        ${v.historia.length ? `<ul class="tarjetas">${v.historia.map((p) => `
            <li class="tarjeta">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(p.tipoInfo.icono)}" aria-hidden="true"></i>${esc(p.tipoInfo.texto)}</span>
                    <small>${esc(haceCuanto(p.avisoEn))}</small>
                </div>
                ${p.comentario ? `<p class="tarjeta__texto">“${esc(p.comentario)}”</p>` : ""}
                ${historiaProblema(p)}
                ${p.nota || p.repuestos.length ? `<p class="tarjeta__quien">${esc([p.nota, p.repuestos.length ? `Usó: ${textoRepuestos(p.repuestos)}` : ""].filter(Boolean).join(" · "))}</p>` : ""}
                ${pastillaProblema(p.estado)}
            </li>`).join("")}</ul>` : vacio("Este vehículo no tuvo problemas.", "ti-mood-smile")}`;

    cont.querySelector(".km").addEventListener("submit", (e) => {
        e.preventDefault();
        const valor = e.target.km.value.trim();
        try {
            datos.cargarKm(usuario, v.id, valor === "" ? NaN : Number(valor));
            aviso("Kilómetros guardados");
            vistaFicha(cont, { usuario, datos, params: [id] });
        } catch (err) {
            aviso(err, "error");
        }
    });
}
