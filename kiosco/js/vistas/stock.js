// ============================================
// Stock y precios: productos por proveedor con "hay que pedir"; el dueño corrige precio y stock ("llegó
// mercadería") y tiene "Subió un proveedor": elegís el proveedor y el %, ves antes → después con el redondeo de
// kiosco y aplicás todo de una, con Deshacer. La empleada solo mira.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=e34da8ad04";
import { PROVEEDORES, TOPES, pesos } from "../datos.js?v=e34da8ad04";
import { pastillaStock } from "./comunes.js?v=e34da8ad04";

const RAPIDOS = [5, 10, 15, 20];

/** El último cambio de precios, con Deshacer (lo usan Stock y la pantalla del aumento). */
function htmlUltimoAumento(a) {
    if (!a) return "";
    const prov = PROVEEDORES.find((p) => p.id === a.proveedorId)?.nombre ?? "";
    return `
        <div class="alerta alerta--info ultimo-aumento">
            <i class="ti ti-trending-up"></i>
            <span><b>${esc(a.cambios.length)} precios actualizados</b> · ${a.porcentaje > 0 ? "+" : ""}${esc(a.porcentaje)} % ${esc(prov)}</span>
            <button class="boton boton--chico boton--secundario" type="button" data-deshacer="${esc(a.id)}"><i class="ti ti-arrow-back-up"></i> Deshacer</button>
        </div>`;
}

function activarDeshacer(cont, usuario, datos, alTerminar) {
    cont.querySelector("[data-deshacer]")?.addEventListener("click", (e) => {
        try {
            const a = datos.deshacerAumento(usuario, e.currentTarget.dataset.deshacer);
            aviso(`Listo: ${a.cambios.length} precios volvieron a como estaban`);
            alTerminar();
        } catch (err) {
            aviso(err.message, "error");
        }
    });
}

export function vistaStock(cont, { usuario, datos, consulta }) {
    const dueno = usuario.rol === "dueno";
    const filtro = consulta.get("ver");
    const proveedorId = PROVEEDORES.some((p) => p.id === filtro) ? filtro : null;
    const pedir = filtro === "pedir";
    const lista = pedir ? datos.hayQuePedir() : datos.listarProductos({ proveedorId });
    const grupos = PROVEEDORES.map((p) => ({ ...p, productos: lista.filter((x) => x.proveedorId === p.id) }))
        .concat([{ id: null, nombre: "Sin proveedor", productos: lista.filter((x) => !x.proveedorId) }])
        .filter((g) => g.productos.length);
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/stock${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Stock y precios</h1>
            ${dueno ? `<a class="boton boton--chico" href="#/stock/aumento"><i class="ti ti-trending-up"></i> Subió un proveedor</a>` : ""}
        </div>
        ${dueno ? htmlUltimoAumento(datos.ultimoAumento()) : `<p class="nota"><i class="ti ti-info-circle"></i> Los precios y el stock los cambia Rubén.</p>`}
        <nav class="chips" aria-label="Filtrar">
            ${chip(null, "Todos")}
            ${chip("pedir", `Hay que pedir (${datos.hayQuePedir().length})`)}
            ${PROVEEDORES.map((p) => chip(p.id, p.nombre)).join("")}
        </nav>
        ${grupos.length ? grupos.map((g) => `
        <section class="grupo-stock">
            <h2 class="subtitulo"><i class="ti ti-truck-delivery"></i> ${esc(g.nombre)}</h2>
            <ul class="filas-stock">${g.productos.map((p) => `
                <li class="fila-stock">
                    <span class="fila-stock__nombre">${esc(p.nombre)}<small>${esc(p.codigo)}</small></span>
                    <b class="fila-stock__precio">${esc(pesos(p.precio))}</b>
                    ${pastillaStock(p)}
                    ${dueno ? `<details class="corregir">
                        <summary aria-label="Corregir ${esc(p.nombre)}"><i class="ti ti-pencil"></i></summary>
                        <form class="formulario" novalidate data-producto="${esc(p.id)}">
                            <div class="formulario__fila">
                                <label>Precio<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" value="${esc(p.precio)}"></label>
                                <label>Stock<input name="stock" type="number" inputmode="numeric" min="0" max="${TOPES.stock}" step="1" value="${esc(p.stock)}"></label>
                            </div>
                            <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                        </form>
                    </details>` : ""}
                </li>`).join("")}
            </ul>
        </section>`).join("") : vacio("No hay nada para pedir. Todo en orden.", "ti-circle-check")}`;

    const otraVez = () => vistaStock(cont, { usuario, datos, consulta });
    activarDeshacer(cont, usuario, datos, otraVez);
    cont.querySelectorAll("form[data-producto]").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        const num = (v) => (v === "" ? NaN : Number(v));
        try {
            const p = datos.corregirProducto(usuario, f.dataset.producto, { precio: num(f.precio.value), stock: num(f.stock.value) });
            aviso(`${p.nombre} guardado`);
            otraVez();
        } catch (err) {
            aviso(err.message, "error");
        }
    }));
}

/** "Subió un proveedor": proveedor + % → antes y después → Aplicar (con Deshacer). */
export function vistaAumento(cont, { usuario, datos }) {
    let proveedorId = "pr-norte";
    let porcentaje = 15;

    function pintar() {
        let filas = [];
        let error = "";
        try {
            filas = datos.verAumento(proveedorId, porcentaje);
        } catch (e) {
            error = e.message;
        }
        const tabla = cont.querySelector(".antes-despues");
        tabla.innerHTML = error
            ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(error)}</p>`
            : `<p class="rotulo-chico">${filas.length} productos · redondeado para arriba a $50 (o a $100 desde $5.000)</p>
               <ul class="filas-stock">${filas.map((f) => `
                <li class="fila-stock fila-stock--aumento">
                    <span class="fila-stock__nombre">${esc(f.nombre)}</span>
                    <span class="antes">${esc(pesos(f.antes))}</span>
                    <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    <b class="despues">${esc(pesos(f.despues))}</b>
                </li>`).join("")}</ul>`;
        const boton = cont.querySelector("[data-aplicar]");
        boton.disabled = !!error || porcentaje === 0;
        boton.innerHTML = `<i class="ti ti-check"></i> Aplicar a ${filas.length} productos`;
        cont.querySelectorAll("[data-proveedor]").forEach((b) => b.classList.toggle("activo", b.dataset.proveedor === proveedorId));
        cont.querySelectorAll("[data-pct]").forEach((b) => b.classList.toggle("activo", Number(b.dataset.pct) === porcentaje));
    }

    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">Subió un proveedor</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Te mandó la lista nueva: elegí el proveedor y cuánto subió, mirá cómo quedan y aplicalo de una.</p>
        <div class="bloque">
            <p class="rotulo-chico">Proveedor</p>
            <div class="chips">${PROVEEDORES.map((p) => `<button class="chip" type="button" data-proveedor="${esc(p.id)}">${esc(p.nombre)}</button>`).join("")}</div>
            <p class="rotulo-chico">¿Cuánto subió?</p>
            <div class="porcentaje">
                <div class="chips">${RAPIDOS.map((n) => `<button class="chip" type="button" data-pct="${n}">${n} %</button>`).join("")}</div>
                <label class="porcentaje__otro">Otro
                    <input name="pct" type="number" inputmode="numeric" min="${TOPES.aumentoMin}" max="${TOPES.aumentoMax}" step="1" value="${porcentaje}"> %
                </label>
            </div>
        </div>
        <div class="antes-despues"></div>
        <button class="boton boton--ancho boton--grande" type="button" data-aplicar></button>
        <div class="resultado-aumento"></div>`;

    const otro = cont.querySelector("[name=pct]");
    cont.querySelectorAll("[data-proveedor]").forEach((b) => b.addEventListener("click", () => {
        proveedorId = b.dataset.proveedor;
        pintar();
    }));
    cont.querySelectorAll("[data-pct]").forEach((b) => b.addEventListener("click", () => {
        porcentaje = Number(b.dataset.pct);
        otro.value = porcentaje;
        pintar();
    }));
    otro.addEventListener("input", () => {
        porcentaje = otro.value === "" ? NaN : Number(otro.value);
        pintar();
    });
    cont.querySelector("[data-aplicar]").addEventListener("click", () => {
        try {
            const a = datos.aplicarAumento(usuario, proveedorId, porcentaje);
            const lugar = cont.querySelector(".resultado-aumento");
            lugar.innerHTML = `
                ${htmlUltimoAumento(a)}
                <p class="nota"><i class="ti ti-shopping-cart"></i> La próxima venta ya sale con el precio nuevo.</p>
                <a class="boton boton--secundario boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del día</a>`;
            activarDeshacer(lugar, usuario, datos, () => {
                lugar.innerHTML = "";
                pintar();
            });
            aviso(`${a.cambios.length} precios actualizados`);
            pintar();
            lugar.scrollIntoView({ block: "center" });
        } catch (err) {
            aviso(err.message, "error");
        }
    });
    pintar();
}
