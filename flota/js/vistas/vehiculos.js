// ============================================
// Vehículos (administradora y mecánico): lista con filtro por estado y la ficha de cada uno
// (estado, chofer de hoy, km y service, papeles con vencimiento e historia de problemas).
// ============================================
import { esc, vacio, aviso, fechaCorta } from "../../kit/js/ui.js?v=881e78d90a";
import { mostrarMapa } from "../../kit/js/mapa.js?v=881e78d90a";
import { ESTADOS_VEHICULO, TOPES, UBICACIONES, COLOR_ESTADO, SERVICE_CADA_KM, cantidadCon } from "../datos.js?v=881e78d90a";
import { haceCuanto, pastillaVehiculo, pastillaProblema, historiaProblema, textoRepuestos, consignaPersona, activarPasos } from "./comunes.js?v=881e78d90a";

const km = (n) => `${n.toLocaleString("es-AR")} km`;

export function vistaVehiculos(cont, { datos, consulta }) {
    const filtro = ESTADOS_VEHICULO[consulta.get("estado")] ? consulta.get("estado") : null;
    const enMapa = consulta.get("ver") === "mapa";
    const todos = datos.listarVehiculos();
    const lista = todos.filter((v) => !filtro || v.estado === filtro);
    const chip = (estado, texto) => {
        const n = estado ? todos.filter((v) => v.estado === estado).length : todos.length;
        const consultaChip = new URLSearchParams({ ...(estado ? { estado } : {}), ...(enMapa ? { ver: "mapa" } : {}) }).toString();
        return `<a class="chip${filtro === estado ? " activo" : ""}" href="#/vehiculos${consultaChip ? `?${consultaChip}` : ""}">${esc(texto)} <b>${n}</b></a>`;
    };
    const vista = (mapa, texto, icono) => {
        const q = new URLSearchParams({ ...(filtro ? { estado: filtro } : {}), ...(mapa ? { ver: "mapa" } : {}) }).toString();
        return `<a class="chip${enMapa === mapa ? " activo" : ""}" href="#/vehiculos${q ? `?${q}` : ""}"${enMapa === mapa ? ' aria-current="page"' : ""}><i class="ti ${icono}" aria-hidden="true"></i> ${texto}</a>`;
    };
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vehículos</h1>
            <nav class="chips" aria-label="Cómo verlos">${vista(false, "Lista", "ti-list")}${vista(true, "Mapa", "ti-map")}</nav>
        </div>
        <nav class="chips" aria-label="Filtrar por estado">
            ${chip(null, "Todos")}
            ${Object.entries(ESTADOS_VEHICULO).map(([id, e]) => chip(id, e.texto)).join("")}
        </nav>
        ${enMapa && lista.length ? `
        <div class="mapa" role="region" aria-label="Mapa con dónde se vio por última vez cada vehículo"></div>
        <p class="nota"><i class="ti ti-map-pin" aria-hidden="true"></i> Dónde se vio por última vez cada uno (de ejemplo). En la versión real lo manda el GPS o el celular del chofer.</p>
        <ul class="mapa__referencias">${Object.entries(ESTADOS_VEHICULO).map(([id, e]) => `<li><span style="background:${COLOR_ESTADO[id]}"></span>${esc(e.texto)}</li>`).join("")}</ul>`
        : lista.length ? `<ul class="tarjetas">${lista.map((v) => `
            <li><a class="tarjeta tarjeta--link" href="#/vehiculos/${esc(v.id)}">
                <div class="tarjeta__fila">
                    <span class="tarjeta__titulo"><i class="ti ${esc(v.tipoInfo.icono)}" aria-hidden="true"></i>${esc(v.nombre)}</span>
                    ${pastillaVehiculo(v.estado)}
                </div>
                <p class="tarjeta__quien">${v.chofer ? `Hoy: ${esc(v.chofer)}` : "Sin chofer hoy"} · ${esc(km(v.km))}${v.abierto ? ` · ${esc(v.abierto.tipoInfo.texto)}` : ""}</p>
            </a></li>`).join("")}</ul>` : vacio("No hay vehículos en ese estado.", "ti-circle-check")}`;
    const lugar = cont.querySelector(".mapa");
    if (lugar) {
        mostrarMapa(lugar, lista.filter((v) => UBICACIONES[v.id]).map((v) => ({
            ...UBICACIONES[v.id],
            titulo: v.nombre,
            texto: `${ESTADOS_VEHICULO[v.estado]?.texto ?? ""} · ${UBICACIONES[v.id].lugar}${v.chofer ? ` · ${v.chofer}` : ""}`,
            color: COLOR_ESTADO[v.estado],
            link: `#/vehiculos/${v.id}`
        }))).then((m) => {
            if (!m && lugar.isConnected) lugar.outerHTML = vacio("No se pudo cargar el mapa. Probá de nuevo con mejor señal.", "ti-map-off");
        });
    }
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
        ${consignaPersona(datos, usuario)}
        <dl class="datos">
            <div><dt>Chofer de hoy</dt><dd>${esc(v.chofer ?? "Nadie")}</dd></div>
            <div><dt>Kilómetros</dt><dd>${esc(km(v.km))}</dd></div>
            <div class="datos--${nivelService}"><dt>Próximo service</dt><dd>${esc(km(v.proximoService))}<small>${s.faltan > 0 ? `faltan ${esc(km(s.faltan))}` : `se pasó por ${esc(km(-s.faltan))}`}</small></dd></div>
            ${v.papeles.map((p) => `<div class="datos--${nivelPapel[p.nivel]}"><dt>${esc(p.tipo)}</dt><dd>${esc(fechaCorta(p.vence))}<small>${esc(textoPapel(p))}</small></dd></div>`).join("")}
        </dl>
        <a class="boton boton--ancho boton--secundario" href="#/service/${esc(v.id)}"><i class="ti ti-tool"></i> Hacer el service</a>
        ${v.ultimoService ? `<p class="nota"><i class="ti ti-gauge" aria-hidden="true"></i> Último service a los ${esc(km(v.ultimoService.km))}, por ${esc(v.ultimoService.por)}: ${esc(textoRepuestos(v.ultimoService.repuestos))}${v.ultimoService.nota ? ` · ${esc(v.ultimoService.nota)}` : ""}.</p>` : ""}
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

    activarPasos(cont);
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

export function vistaService(cont, { usuario, datos, params: [id] }) {
    const v = datos.ficha(id);
    const repuestos = datos.listarRepuestos();
    const usados = Object.fromEntries(repuestos.map((r) => [r.id, 0]));
    const tope = (r) => Math.min(r.cantidad, TOPES.cantidad);
    cont.innerHTML = `
        <a class="volver" href="#/vehiculos/${esc(v.id)}"><i class="ti ti-arrow-left"></i> ${esc(v.nombre)}</a>
        <h1 class="titulo">Service de ${esc(v.nombre)}</h1>
        <p class="nota"><i class="ti ti-gauge" aria-hidden="true"></i> A los ${esc(km(v.km))}. El próximo queda ${esc(km(SERVICE_CADA_KM[v.tipo] ?? 10_000))} más adelante.</p>
        <form class="formulario" novalidate>
            <fieldset class="opciones">
                <legend>¿Qué usaste? (se descuenta del stock)</legend>
                <ul class="usados">${repuestos.map((r) => `
                    <li class="usados__fila${r.cantidad ? "" : " usados__fila--sin"}">
                        <span>${esc(r.nombre)}<small>${r.cantidad ? `Hay ${esc(cantidadCon(r.cantidad, r.unidad))}` : "No hay"}</small></span>
                        <span class="contador-uso">
                            <button class="boton-icono" type="button" data-menos="${esc(r.id)}" aria-label="Uno menos de ${esc(r.nombre)}" disabled><i class="ti ti-minus"></i></button>
                            <b data-cuantos="${esc(r.id)}">0</b>
                            <button class="boton-icono" type="button" data-mas="${esc(r.id)}" aria-label="Uno más de ${esc(r.nombre)}"${tope(r) ? "" : " disabled"}><i class="ti ti-plus"></i></button>
                        </span>
                    </li>`).join("")}
                </ul>
            </fieldset>
            <label>Nota (si querés)
                <textarea name="nota" rows="2" maxlength="${TOPES.nota}" placeholder="Ej: cambio de aceite y filtro"></textarea>
            </label>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-circle-check"></i> Service hecho</button>
        </form>`;
    const cambiar = (rid, paso) => {
        const r = repuestos.find((x) => x.id === rid);
        usados[rid] = Math.max(0, Math.min(tope(r), usados[rid] + paso));
        cont.querySelector(`[data-cuantos="${rid}"]`).textContent = usados[rid];
        cont.querySelector(`[data-menos="${rid}"]`).disabled = usados[rid] === 0;
        cont.querySelector(`[data-mas="${rid}"]`).disabled = usados[rid] >= tope(r);
    };
    cont.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas, 1)));
    cont.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.menos, -1)));
    cont.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const lista = Object.entries(usados).filter(([, n]) => n > 0).map(([repuestoId, cantidad]) => ({ repuestoId, cantidad }));
        try {
            datos.hacerService(usuario, v.id, { repuestos: lista, nota: e.target.nota.value });
            aviso("Service anotado: se descontó del stock");
            location.hash = `#/vehiculos/${v.id}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}
