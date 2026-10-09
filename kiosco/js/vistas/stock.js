// ============================================
// Stock y precios: productos por proveedor con "hay que pedir"; el dueño corrige precio y stock ("llegó
// mercadería") y tiene "Subió un proveedor": elegís el proveedor y el %, ves antes → después con el redondeo de
// kiosco y aplicás todo de una, con Deshacer. Y "La lista del proveedor en Excel": subís la lista que te mandó y los
// precios se actualizan solos (también con Deshacer). El stock se baja a Excel. La empleada solo mira (y baja).
// ============================================
import { esc, aviso, vacio, mensajeDe } from "../../kit/js/ui.js?v=55789f8311";
import { bajarExcel, leerExcel } from "../../kit/js/archivos.js?v=55789f8311";
import { PROVEEDORES, TOPES, pesos, estadoStock } from "../datos.js?v=55789f8311";
import { pastillaStock } from "./comunes.js?v=55789f8311";

const RAPIDOS = [5, 10, 15, 20];

/** El último cambio de precios, con Deshacer (lo usan Stock y la pantalla del aumento). */
function htmlUltimoAumento(a) {
    if (!a) return "";
    const prov = PROVEEDORES.find((p) => p.id === a.proveedorId)?.nombre ?? "";
    const como = a.origen === "excel" ? "con la lista en Excel" : `${a.porcentaje > 0 ? "+" : ""}${a.porcentaje} % ${prov}`;
    return `
        <div class="alerta alerta--info ultimo-aumento">
            <i class="ti ${a.origen === "excel" ? "ti-file-spreadsheet" : "ti-trending-up"}"></i>
            <span><b>${esc(a.cambios.length)} precios actualizados</b> · ${esc(como)}</span>
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
            aviso(err, "error");
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
        <div class="acciones-excel">
            ${dueno ? `<a class="boton boton--chico boton--secundario" href="#/stock/lista"><i class="ti ti-file-spreadsheet"></i> Lista del proveedor en Excel</a>` : ""}
            <button class="boton boton--chico boton--secundario" type="button" data-bajar-stock><i class="ti ti-download"></i> Bajar el stock a Excel</button>
        </div>
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
    const ESTADOS = { sin: "Sin stock", pedir: "Hay que pedir", hay: "Hay" };
    cont.querySelector("[data-bajar-stock]").addEventListener("click", (e) => {
        const nombreProv = (id) => PROVEEDORES.find((p) => p.id === id)?.nombre ?? "Sin proveedor";
        const filas = datos.listarProductos().map((p) => [p.codigo, p.nombre, nombreProv(p.proveedorId), { valor: p.precio, formato: "pesos" }, p.stock, p.minimo, ESTADOS[estadoStock(p)]]);
        e.currentTarget.disabled = true;
        bajarExcel("Stock y precios del kiosco", [["Código", "Producto", "Proveedor", "Precio", "Stock", "Mínimo", "Estado"], ...filas], { hoja: "Stock", anchos: [16, 30, 20, 12, 8, 8, 14] })
            .finally(() => cont.querySelector("[data-bajar-stock]")?.removeAttribute("disabled"));
    });
    cont.querySelectorAll("form[data-producto]").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        const num = (v) => (v === "" ? NaN : Number(v));
        try {
            const p = datos.corregirProducto(usuario, f.dataset.producto, { precio: num(f.precio.value), stock: num(f.stock.value) });
            aviso(`${p.nombre} guardado`);
            otraVez();
        } catch (err) {
            aviso(err, "error");
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
            error = mensajeDe(e);
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
            aviso(err, "error");
        }
    });
    pintar();
}

/**
 * "La lista del proveedor en Excel": bajás la de ejemplo (o usás la que te mandó), la subís, mirás antes → después
 * con el redondeo de kiosco y aplicás todo de una (con Deshacer). Todo pasa en el navegador: el archivo no se sube.
 */
export function vistaLista(cont, { usuario, datos }) {
    let filas = null;
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">La lista del proveedor en Excel</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> ¿Te mandó la lista nueva en Excel? Subila y los precios se actualizan solos, con tu redondeo. Probá con la de ejemplo.</p>
        <ol class="pasos-lista">
            <li>
                <span>Bajá la lista de ejemplo de Bebidas Norte (sube un 12 %).</span>
                <button class="boton boton--chico boton--secundario" type="button" data-ejemplo><i class="ti ti-download"></i> Lista de ejemplo</button>
            </li>
            <li>
                <span>Subila (o la que te mandó tu proveedor: con una columna "Precio" y otra "Código" o "Producto").</span>
                <label class="boton boton--chico subir-excel"><i class="ti ti-upload"></i> Subir el Excel
                    <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-archivo>
                </label>
            </li>
        </ol>
        <div class="resultado-lista" aria-live="polite"></div>`;

    const lugar = cont.querySelector(".resultado-lista");
    function pintar(nombreArchivo) {
        let v;
        try {
            v = datos.verLista(filas);
        } catch (e) {
            lugar.innerHTML = `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(mensajeDe(e))}</p>`;
            return;
        }
        const extras = [
            v.iguales ? `${v.iguales} quedan igual` : "",
            v.noEstan.length ? `${v.noEstan.length}${v.noEstan.length === 50 ? " o más" : ""} no están en tu stock` : "",
            v.malos ? `${v.malos} sin un precio que se entienda` : ""
        ].filter(Boolean);
        lugar.innerHTML = `
            <p class="resumen-lista"><i class="ti ti-file-spreadsheet"></i> <span><b>${esc(v.cambios.length)} precios cambian</b>${extras.length ? ` · ${esc(extras.join(" · "))}` : ""}<small>${esc(nombreArchivo)}</small></span></p>
            ${v.cambios.length ? `<ul class="filas-stock">${v.cambios.map((f) => `
                <li class="fila-stock fila-stock--aumento">
                    <span class="fila-stock__nombre">${esc(f.nombre)}</span>
                    <span class="antes">${esc(pesos(f.antes))}</span>
                    <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    <b class="despues">${esc(pesos(f.despues))}</b>
                </li>`).join("")}</ul>
            <button class="boton boton--ancho boton--grande" type="button" data-aplicar><i class="ti ti-check"></i> Aplicar a ${esc(v.cambios.length)} productos</button>` : `<p class="nota"><i class="ti ti-circle-check"></i> Con esta lista no cambia ningún precio.</p>`}
            ${v.noEstan.length ? `<details class="no-estan"><summary>No están en tu stock (${esc(v.noEstan.length)})</summary><p class="nota">${esc(v.noEstan.join(" · "))}</p></details>` : ""}`;
        lugar.querySelector("[data-aplicar]")?.addEventListener("click", () => {
            try {
                const a = datos.aplicarLista(usuario, filas);
                filas = null;
                lugar.innerHTML = `
                    ${htmlUltimoAumento(a)}
                    <p class="nota"><i class="ti ti-shopping-cart"></i> La próxima venta ya sale con el precio nuevo.</p>
                    <a class="boton boton--secundario boton--ancho" href="#/stock"><i class="ti ti-package"></i> Mirá el stock con los precios nuevos</a>`;
                activarDeshacer(lugar, usuario, datos, () => (lugar.innerHTML = ""));
                aviso(`${a.cambios.length} precios actualizados`);
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    cont.querySelector("[data-ejemplo]").addEventListener("click", (e) => {
        e.currentTarget.disabled = true;
        bajarExcel("Lista Bebidas Norte (ejemplo)", datos.listaDeEjemplo("pr-norte"), { hoja: "Lista", anchos: [16, 32, 16] })
            .finally(() => cont.querySelector("[data-ejemplo]")?.removeAttribute("disabled"));
    });
    cont.querySelector("[data-archivo]").addEventListener("change", async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = ""; // para poder subir el mismo archivo otra vez
        if (!archivo) return;
        lugar.innerHTML = `<p class="nota"><i class="ti ti-loader-2"></i> Leyendo ${esc(archivo.name.slice(0, 80))}…</p>`;
        try {
            filas = await leerExcel(archivo);
            if (cont.isConnected) pintar(archivo.name.slice(0, 80));
        } catch (err) {
            filas = null;
            lugar.innerHTML = `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(mensajeDe(err))}</p>`;
        }
    });
}
