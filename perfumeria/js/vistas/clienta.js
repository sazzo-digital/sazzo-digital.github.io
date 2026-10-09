// ============================================
// Pantallas de la clienta (Julieta), pensadas para el celular: el catálogo (filtros por familia y para quién,
// "Recomendame uno"), cada perfume con sus notas y presentaciones, "Tu pedido" (el carrito) y "Mis pedidos".
// El pedido no pide ningún dato: Julieta ya entró como ella. Retiro en el local.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=68b63d810e";
import { FAMILIAS, PARA, PRESENTACIONES, TOPES, pesos } from "../datos.js?v=68b63d810e";
import { NEGOCIO } from "../marca.js?v=68b63d810e";
import { frasco, carrito, itemsDelCarrito, unidadesEnCarrito, guia, activarGuias, pastillaPedido } from "./comunes.js?v=68b63d810e";

let familia = null;
let para = null;

/** La barrita "Tu pedido (2) · $ 35.000 · Ver →" (aparece cuando hay algo en el carrito). */
function barraPedido(datos) {
    const n = unidadesEnCarrito();
    if (!n) return "";
    let total = 0;
    try {
        total = datos.armarCarrito(itemsDelCarrito()).total;
    } catch {
        // algo del carrito ya no alcanza: se ve en "Tu pedido"
    }
    return `<a class="barra-pedido" href="#/pedido"><i class="ti ti-shopping-bag" aria-hidden="true"></i> Tu pedido (${n}) · <b>${esc(pesos(total))}</b><span>Ver →</span></a>`;
}

const tarjetaPerfume = (p) => `
    <li><a class="perfume" href="#/perfume/${esc(p.id)}">
        ${frasco(p.familia)}
        <span class="perfume__nombre">${esc(p.nombre)}</span>
        <small>${esc(p.familiaInfo.texto)} · ${esc(p.paraTexto)}</small>
        <small class="perfume__notas">${esc(p.notas.salida)} · ${esc(p.notas.corazon)} · ${esc(p.notas.fondo)}</small>
        <b class="perfume__precio">desde ${esc(pesos(p.desde))}</b>
    </a></li>`;

export function vistaCatalogo(cont, { datos }) {
    const lista = datos.listarPerfumes({ familia, para });
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Perfumes</h1>
            <span class="negocio"><i class="ti ti-sparkles" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        ${barraPedido(datos)}
        <details class="recomendar bloque"${unidadesEnCarrito() ? "" : " open"}>
            <summary><i class="ti ti-wand"></i> Recomendame uno</summary>
            <form class="recomendar__form" novalidate>
                <p class="rotulo-chico">¿Para quién es?</p>
                <div class="chips">${Object.entries(PARA).map(([k, t]) => `<label class="chip chip--radio"><input type="radio" name="para" value="${k}"${k === "mujer" ? " checked" : ""}>${esc(t)}</label>`).join("")}</div>
                <p class="rotulo-chico">¿Para cuándo?</p>
                <div class="chips">
                    <label class="chip chip--radio"><input type="radio" name="momento" value="dia">De día</label>
                    <label class="chip chip--radio"><input type="radio" name="momento" value="noche" checked>De noche</label>
                </div>
                <p class="rotulo-chico">¿Qué te gusta?</p>
                <div class="chips">${Object.entries(FAMILIAS).map(([k, f]) => `<label class="chip chip--radio"><input type="radio" name="gusto" value="${k}"${k === "dulce" ? " checked" : ""}>${esc(f.texto)}</label>`).join("")}</div>
                <button class="boton" type="submit"><i class="ti ti-wand"></i> Ver recomendados</button>
            </form>
            <ul class="perfumes sugeridos"></ul>
        </details>
        <p class="rotulo-chico">Todos los perfumes</p>
        <div class="chips" role="tablist" aria-label="Familia">
            <button class="chip${familia ? "" : " activo"}" type="button" data-familia="">Todas</button>
            ${Object.entries(FAMILIAS).map(([k, f]) => `<button class="chip${familia === k ? " activo" : ""}" type="button" data-familia="${k}"><span class="punto" style="background:${esc(f.color)}"></span>${esc(f.texto)}</button>`).join("")}
        </div>
        <div class="chips" role="tablist" aria-label="Para quién">
            <button class="chip${para ? "" : " activo"}" type="button" data-para="">Todos</button>
            <button class="chip${para === "mujer" ? " activo" : ""}" type="button" data-para="mujer">Para ella</button>
            <button class="chip${para === "hombre" ? " activo" : ""}" type="button" data-para="hombre">Para él</button>
        </div>
        ${lista.length ? `<ul class="perfumes">${lista.map(tarjetaPerfume).join("")}</ul>` : vacio("No hay perfumes con ese filtro.", "ti-search")}`;

    const otraVez = () => vistaCatalogo(cont, { datos });
    cont.querySelectorAll("[data-familia]").forEach((b) => b.addEventListener("click", () => {
        familia = b.dataset.familia || null;
        otraVez();
    }));
    cont.querySelectorAll("[data-para]").forEach((b) => b.addEventListener("click", () => {
        para = b.dataset.para || null;
        otraVez();
    }));
    cont.querySelector(".recomendar__form").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
            const recos = datos.recomendar({ para: f.get("para"), momento: f.get("momento"), gusto: f.get("gusto") });
            const lugar = cont.querySelector(".sugeridos");
            lugar.innerHTML = recos.map(tarjetaPerfume).join("");
            lugar.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

export function vistaPerfume(cont, { datos, usuario, params: [id] }) {
    const p = datos.perfume(id);
    const esDuena = usuario.rol === "duena";
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left"></i> Perfumes</a>
        ${esDuena ? "" : barraPedido(datos)}
        <div class="ficha-perfume">
            ${frasco(p.familia, true)}
            <div>
                <h1 class="titulo">${esc(p.nombre)}</h1>
                <p class="nota">${esc(p.familiaInfo.texto)} · ${esc(p.paraTexto)} · ${esc(p.momentoTexto)}</p>
            </div>
        </div>
        <ol class="piramide">
            <li><span>Salida</span><b>${esc(p.notas.salida)}</b></li>
            <li><span>Corazón</span><b>${esc(p.notas.corazon)}</b></li>
            <li><span>Fondo</span><b>${esc(p.notas.fondo)}</b></li>
        </ol>
        <h2 class="subtitulo"><i class="ti ti-bottle"></i> Presentaciones</h2>
        <ul class="presentaciones">${Object.entries(PRESENTACIONES).map(([k, pr]) => {
            const hay = p.disponible[k];
            return `
            <li class="presentacion${hay ? "" : " presentacion--sin"}">
                <span><b>${esc(pr.texto)}</b><small>${hay ? (pr.decant ? "Fraccionado de la botella" : `Quedan ${esc(hay)}`) : "No hay ahora"}</small></span>
                <b class="presentacion__precio">${esc(pesos(p.precios[k]))}</b>
                ${esDuena ? "" : `<button class="boton boton--chico" type="button" data-agregar="${k}"${hay ? "" : " disabled"}><i class="ti ti-plus"></i> Sumar</button>`}
            </li>`;
        }).join("")}</ul>
        ${esDuena ? `<p class="nota"><i class="ti ti-info-circle"></i> Botella madre: ${esc(p.ml)} ml · frascos de 50: ${esc(p.stock50)} · de 100: ${esc(p.stock100)}</p>` : ""}`;
    cont.querySelectorAll("[data-agregar]").forEach((b) => b.addEventListener("click", () => {
        const clave = `${p.id}/${b.dataset.agregar}`;
        const antes = carrito.get(clave) ?? 0;
        carrito.set(clave, antes + 1);
        try {
            datos.armarCarrito(itemsDelCarrito());
            aviso(`${p.nombre} (${PRESENTACIONES[b.dataset.agregar].texto.toLowerCase()}) en tu pedido`);
        } catch (err) {
            if (antes) carrito.set(clave, antes);
            else carrito.delete(clave);
            aviso(err.message, "error");
        }
        vistaPerfume(cont, { datos, usuario, params: [id] });
    }));
}

export function vistaPedido(cont, { usuario, datos, irA }) {
    const items = itemsDelCarrito();
    let armado = null;
    let error = "";
    try {
        if (items.length) armado = datos.armarCarrito(items);
    } catch (err) {
        error = err.message;
    }
    cont.innerHTML = `
        <h1 class="titulo">Tu pedido</h1>
        ${!items.length ? `${vacio("Todavía no sumaste nada.", "ti-shopping-bag")}<a class="boton boton--ancho" href="#/inicio"><i class="ti ti-sparkles"></i> Ver perfumes</a>` : `
        ${error ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(error)}</p>` : ""}
        <ul class="renglones">${items.map((i) => {
            const r = armado?.renglones.find((x) => x.perfumeId === i.perfumeId && x.presentacion === i.presentacion);
            const p = datos.perfume(i.perfumeId);
            return `
            <li class="renglon">
                ${frasco(p.familia)}
                <span class="renglon__nombre">${esc(p.nombre)}<small>${esc(PRESENTACIONES[i.presentacion].texto)}${r ? ` · ${esc(pesos(r.precio))}` : ""}</small></span>
                <span class="contador-uso">
                    <button class="boton-icono" type="button" data-menos="${esc(i.perfumeId)}/${esc(i.presentacion)}" aria-label="Uno menos"><i class="ti ti-minus"></i></button>
                    <b>${esc(i.cantidad)}</b>
                    <button class="boton-icono" type="button" data-mas="${esc(i.perfumeId)}/${esc(i.presentacion)}" aria-label="Uno más"${i.cantidad >= TOPES.cantidad ? " disabled" : ""}><i class="ti ti-plus"></i></button>
                </span>
            </li>`;
        }).join("")}</ul>
        ${armado ? `<div class="total"><span>Total</span><b>${esc(pesos(armado.total))}</b></div>` : ""}
        <p class="nota"><i class="ti ti-building-store"></i> Lo retirás en ${esc(NEGOCIO)}. Se paga al retirar.</p>
        <button class="boton boton--ancho boton--grande" type="button" data-mandar${armado ? "" : " disabled"}><i class="ti ti-send"></i> Mandar pedido</button>
        <a class="boton-link seguir" href="#/inicio"><i class="ti ti-arrow-left"></i> Seguir mirando</a>`}`;

    const cambiar = (clave, paso) => {
        const n = (carrito.get(clave) ?? 0) + paso;
        if (n <= 0) carrito.delete(clave);
        else carrito.set(clave, Math.min(n, TOPES.cantidad));
        vistaPedido(cont, { usuario, datos, irA });
    };
    cont.querySelectorAll("[data-mas]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.mas, 1)));
    cont.querySelectorAll("[data-menos]").forEach((b) => b.addEventListener("click", () => cambiar(b.dataset.menos, -1)));
    cont.querySelector("[data-mandar]")?.addEventListener("click", () => {
        try {
            const o = datos.mandarPedido(usuario, itemsDelCarrito());
            carrito.clear();
            cont.innerHTML = `
                <div class="hecho">
                    <i class="ti ti-circle-check" aria-hidden="true"></i>
                    <h1 class="titulo">¡Pedido enviado!</h1>
                    <p>Pedido N° ${esc(o.numero)} · ${esc(pesos(o.total))}</p>
                    <p class="nota">Carolina lo prepara y te avisa cuando esté listo para retirar.</p>
                </div>
                ${guia("u-duena", "/inicio", "Mirá lo que le llega a Carolina")}
                <a class="boton boton--secundario boton--ancho" href="#/mis-pedidos"><i class="ti ti-list"></i> Mis pedidos</a>`;
            activarGuias(cont, irA);
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

export function vistaMisPedidos(cont, { usuario, datos }) {
    const lista = datos.misPedidos(usuario);
    cont.innerHTML = `
        <h1 class="titulo">Mis pedidos</h1>
        ${lista.length ? `<ul class="tarjetas">${lista.map((o) => `
            <li class="tarjeta">
                <div class="tarjeta__fila"><b>N° ${esc(o.numero)} · ${esc(fechaCorta(o.creadoEn.slice(0, 10)))}</b>${pastillaPedido(o)}</div>
                <p class="tarjeta__quien">${esc(o.renglones.map((r) => `${r.nombre} (${r.presentacionTexto.toLowerCase()})`).join(", "))}</p>
                <p class="tarjeta__quien"><b>${esc(pesos(o.total))}</b></p>
            </li>`).join("")}</ul>` : vacio("Todavía no hiciste pedidos.", "ti-shopping-bag")}`;
}
