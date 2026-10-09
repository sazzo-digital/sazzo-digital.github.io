// ============================================
// Stock y precios. Todos ven el stock por rubro, con "hay que pedir" y el precio (y el de por mayor).
// La dueña además ve el costo y el margen de cada artículo y los corrige ahí mismo, y tiene:
//   "Subió un proveedor": sube el costo de todo lo de ese proveedor y el precio se recalcula con SU margen.
//   "Cambiar margen": el margen de todo un rubro (el costo no cambia).
//   "Lista del proveedor en Excel": sube la lista que mandó (con el costo nuevo) y cada precio se recalcula con su margen.
//   (Los tres muestran antes → después y se pueden deshacer.)
//   "Pedidos a proveedores": lo que bajó del mínimo, por proveedor, con el mensaje para copiar y "Llegó".
//   "Cargar artículo": con costo y margen (el precio sale solo).
// ============================================
import { esc, aviso, vacio, mensajeDe } from "../../kit/js/ui.js?v=e4d4e57de1";
import { mostrarMensaje } from "../../kit/js/mensaje.js?v=e4d4e57de1";
import { bajarExcel, leerExcel } from "../../kit/js/archivos.js?v=e4d4e57de1";
import { PROVEEDORES, RUBROS, TOPES, DESCUENTO_MAYOR, nombreRubro, pesos, precioDe } from "../datos.js?v=e4d4e57de1";
import { pastillaStock } from "./comunes.js?v=e4d4e57de1";

const RAPIDOS = [5, 10, 15, 20];
let textoBuscado = ""; // el buscador de Stock recuerda lo escrito mientras se navega

/** El último cambio de precios, con Deshacer (lo usan Stock y las pantallas de precios). */
function htmlUltimoCambio(c) {
    if (!c) return "";
    const que = c.tipo === "aumento"
        ? `${c.porcentaje > 0 ? "+" : ""}${c.porcentaje} % ${PROVEEDORES.find((p) => p.id === c.proveedorId)?.nombre ?? ""}`
        : c.tipo === "excel" ? "lista del proveedor en Excel"
            : `margen ${c.margen} % en ${nombreRubro(c.rubro)}`;
    return `
        <div class="alerta alerta--info ultimo-aumento">
            <i class="ti ti-trending-up"></i>
            <span><b>${esc(c.cambios.length)} precios actualizados</b> · ${esc(que)}</span>
            <button class="boton boton--chico boton--secundario" type="button" data-deshacer="${esc(c.id)}"><i class="ti ti-arrow-back-up"></i> Deshacer</button>
        </div>`;
}

function activarDeshacer(cont, usuario, datos, alTerminar) {
    cont.querySelector("[data-deshacer]")?.addEventListener("click", (e) => {
        try {
            const c = datos.deshacerCambio(usuario, e.currentTarget.dataset.deshacer);
            aviso(`Listo: ${c.cambios.length} precios volvieron a como estaban`);
            alTerminar();
        } catch (err) {
            aviso(err, "error");
        }
    });
}

const num = (v) => (v === "" ? NaN : Number(v));

export function vistaStock(cont, { usuario, datos, consulta }) {
    const duena = usuario.rol === "duena";
    const filtro = consulta.get("ver");
    const rubro = RUBROS.some((r) => r.id === filtro) ? filtro : null;
    const pedir = filtro === "pedir";
    const aPedir = datos.hayQuePedir();
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/stock${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Stock y precios</h1>
        </div>
        ${duena ? `
        <div class="acciones-stock">
            <a class="boton boton--chico" href="#/stock/aumento"><i class="ti ti-trending-up"></i> Subió un proveedor</a>
            <a class="boton boton--chico boton--secundario" href="#/stock/lista"><i class="ti ti-file-spreadsheet"></i> Lista del proveedor en Excel</a>
            <a class="boton boton--chico boton--secundario" href="#/stock/margen"><i class="ti ti-percentage"></i> Cambiar margen</a>
            <a class="boton boton--chico boton--secundario" href="#/stock/pedidos"><i class="ti ti-truck-delivery"></i> Pedidos a proveedores</a>
            <a class="boton boton--chico boton--secundario" href="#/stock/nuevo"><i class="ti ti-plus"></i> Cargar artículo</a>
        </div>
        ${htmlUltimoCambio(datos.ultimoCambio())}` : `<p class="nota"><i class="ti ti-info-circle"></i> Los precios, los costos y el stock los cambia Mariela.</p>`}
        ${duena && pedir && aPedir.length ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> Esto bajó del mínimo (las listas separadas también descuentan). Armá los pedidos de un toque y, después, probá "Subió un proveedor".</p>
            <a class="boton boton--ancho" href="#/stock/pedidos"><i class="ti ti-truck-delivery"></i> Armar los pedidos a los proveedores</a>` : ""}
        <form class="buscar buscar--stock" novalidate>
            <label class="buscador">
                <i class="ti ti-search" aria-hidden="true"></i>
                <span class="solo-lector">Buscar un artículo</span>
                <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Buscar un artículo" value="${esc(textoBuscado)}">
            </label>
        </form>
        <nav class="chips" aria-label="Filtrar">
            ${chip(null, "Todos")}
            ${chip("pedir", `Hay que pedir (${aPedir.length})`)}
            ${RUBROS.map((r) => chip(r.id, r.nombre)).join("")}
        </nav>
        <div class="lista-stock"></div>`;

    const lugar = cont.querySelector(".lista-stock");
    const q = cont.querySelector("[name=q]");

    function pintarLista() {
        const texto = q.value.trim();
        const coinciden = texto ? new Set(datos.listarProductos({ texto }).map((p) => p.id)) : null;
        const lista = (pedir ? aPedir : datos.listarProductos({ rubro })).filter((p) => !coinciden || coinciden.has(p.id));
        const grupos = RUBROS.map((r) => ({ ...r, productos: lista.filter((x) => x.rubro === r.id) })).filter((g) => g.productos.length);
        lugar.innerHTML = grupos.length ? grupos.map((g) => `
            <section class="grupo-stock">
                <h2 class="subtitulo"><i class="ti ${esc(g.icono)}"></i> ${esc(g.nombre)}</h2>
                <ul class="filas-stock">${g.productos.map((p) => `
                    <li class="fila-stock">
                        <span class="fila-stock__nombre">${esc(p.nombre)}
                            <small>${duena ? `costo ${esc(pesos(p.costo))} · margen ${esc(p.margen)} %` : esc(p.proveedor)}${p.mayorDesde ? ` · x${esc(p.mayorDesde)}: ${esc(pesos(p.precioMayor))}` : ""}</small>
                        </span>
                        <b class="fila-stock__precio">${esc(pesos(p.precio))}</b>
                        ${pastillaStock(p)}
                        ${duena ? `<details class="corregir">
                            <summary aria-label="Corregir ${esc(p.nombre)}"><i class="ti ti-pencil"></i></summary>
                            <form class="formulario" novalidate data-producto="${esc(p.id)}">
                                <div class="formulario__fila">
                                    <label>Costo<input name="costo" type="number" inputmode="numeric" min="1" max="${TOPES.costo}" step="1" value="${esc(p.costo)}"></label>
                                    <label>Margen %<input name="margen" type="number" inputmode="numeric" min="0" max="${TOPES.margen}" step="1" value="${esc(p.margen)}"></label>
                                </div>
                                ${p.servicio ? "" : `<div class="formulario__fila">
                                    <label>Stock<input name="stock" type="number" inputmode="numeric" min="0" max="${TOPES.stock}" step="1" value="${esc(p.stock)}"></label>
                                    <label>Mínimo<input name="minimo" type="number" inputmode="numeric" min="0" max="${TOPES.stock}" step="1" value="${esc(p.minimo)}"></label>
                                </div>`}
                                <label>Por mayor desde (vacío: no tiene)<input name="mayorDesde" type="number" inputmode="numeric" min="2" max="${TOPES.mayorDesde}" step="1" value="${esc(p.mayorDesde ?? "")}"></label>
                                <p class="nota precio-nuevo" aria-live="polite"></p>
                                <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                            </form>
                        </details>` : ""}
                    </li>`).join("")}
                </ul>
            </section>`).join("") : vacio(pedir ? "No hay nada para pedir. Todo en orden." : "No hay artículos con ese nombre.", pedir ? "ti-circle-check" : "ti-search");

        lugar.querySelectorAll("form[data-producto]").forEach((f) => {
            const previa = () => {
                const costo = num(f.costo.value);
                const margen = num(f.margen.value);
                f.querySelector(".precio-nuevo").textContent = Number.isInteger(costo) && costo > 0 && Number.isInteger(margen) && margen >= 0 && costo <= TOPES.costo && margen <= TOPES.margen
                    ? `Precio de venta: ${pesos(precioDe(costo, margen))}` : "";
            };
            f.costo.addEventListener("input", previa);
            f.margen.addEventListener("input", previa);
            previa();
            f.addEventListener("submit", (e) => {
                e.preventDefault();
                try {
                    const p = datos.corregirProducto(usuario, f.dataset.producto, {
                        costo: num(f.costo.value), margen: num(f.margen.value),
                        ...(f.stock ? { stock: num(f.stock.value), minimo: num(f.minimo.value) } : {}),
                        mayorDesde: f.mayorDesde.value === "" ? null : num(f.mayorDesde.value)
                    });
                    aviso(`${p.nombre} guardado: ${pesos(p.precio)}`);
                    vistaStock(cont, { usuario, datos, consulta });
                } catch (err) {
                    aviso(err, "error");
                }
            });
        });
    }

    q.addEventListener("input", () => {
        textoBuscado = q.value;
        pintarLista();
    });
    cont.querySelector(".buscar--stock").addEventListener("submit", (e) => e.preventDefault());
    activarDeshacer(cont, usuario, datos, () => vistaStock(cont, { usuario, datos, consulta }));
    pintarLista();
}

/** Tabla antes → después (la usan "Subió un proveedor" y "Cambiar margen"). */
function htmlAntesDespues(filas, { conCosto }) {
    return `<ul class="filas-stock">${filas.map((f) => `
        <li class="fila-stock fila-stock--aumento">
            <span class="fila-stock__nombre">${esc(f.nombre)}<small>${conCosto ? `costo ${esc(pesos(f.costoAntes))} → ${esc(pesos(f.costoDespues))} · margen ${esc(f.margenDespues)} %` : `margen ${esc(f.margenAntes)} % → ${esc(f.margenDespues)} %`}</small></span>
            <span class="antes">${esc(pesos(f.antes))}</span>
            <i class="ti ti-arrow-right" aria-hidden="true"></i>
            <b class="despues">${esc(pesos(f.despues))}</b>
        </li>`).join("")}</ul>`;
}

/** Lo que aparece después de aplicar un cambio de precios: el aviso con Deshacer y qué sigue. */
function despuesDeAplicar(cont, { usuario, datos, cambio, alDeshacer }) {
    const lugar = cont.querySelector(".resultado-aumento");
    lugar.innerHTML = `
        ${htmlUltimoCambio(cambio)}
        <p class="nota"><i class="ti ti-shopping-cart"></i> La próxima venta ya sale con el precio nuevo. Lo vendido antes no cambia.</p>
        <a class="boton boton--secundario boton--ancho" href="#/caja"><i class="ti ti-cash-register"></i> Mirá la caja del día y la ganancia</a>`;
    activarDeshacer(lugar, usuario, datos, () => {
        lugar.innerHTML = "";
        alDeshacer();
    });
    lugar.scrollIntoView({ block: "center" });
}

/** "Subió un proveedor": proveedor + % → costo y precio antes y después → Aplicar (con Deshacer). */
export function vistaAumento(cont, { usuario, datos }) {
    let proveedorId = "pr-papelera";
    let porcentaje = 15;

    function pintar() {
        let filas = [];
        let error = "";
        try {
            filas = datos.verAumento(proveedorId, porcentaje);
        } catch (e) {
            error = mensajeDe(e);
        }
        cont.querySelector(".antes-despues").innerHTML = error
            ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(error)}</p>`
            : `<p class="rotulo-chico">${filas.length} artículos · cada uno mantiene su margen · redondeado para arriba</p>${htmlAntesDespues(filas, { conCosto: true })}`;
        const boton = cont.querySelector("[data-aplicar]");
        boton.disabled = !!error || porcentaje === 0;
        boton.innerHTML = `<i class="ti ti-check"></i> Aplicar a ${filas.length} artículos`;
        cont.querySelectorAll("[data-proveedor]").forEach((b) => b.classList.toggle("activo", b.dataset.proveedor === proveedorId));
        cont.querySelectorAll("[data-pct]").forEach((b) => b.classList.toggle("activo", Number(b.dataset.pct) === porcentaje));
    }

    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">Subió un proveedor</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Te mandó la lista nueva: elegí el proveedor y cuánto subió. Sube el costo y cada precio se recalcula con tu margen.</p>
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
            const cambio = datos.aplicarAumento(usuario, proveedorId, porcentaje);
            aviso(`${cambio.cambios.length} precios actualizados`);
            pintar();
            despuesDeAplicar(cont, { usuario, datos, cambio, alDeshacer: pintar });
        } catch (err) {
            aviso(err, "error");
        }
    });
    pintar();
}

/** "Cambiar margen": rubro + margen nuevo → precios antes y después → Aplicar (con Deshacer). */
export function vistaMargen(cont, { usuario, datos }) {
    let rubro = "escritura";
    let margen = datos.margenDeRubro(rubro);

    function pintar() {
        let filas = [];
        let error = "";
        try {
            filas = datos.verMargen(rubro, margen);
        } catch (e) {
            error = mensajeDe(e);
        }
        cont.querySelector(".antes-despues").innerHTML = error
            ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(error)}</p>`
            : `<p class="rotulo-chico">${filas.length} artículos · el costo no cambia · redondeado para arriba</p>${htmlAntesDespues(filas, { conCosto: false })}`;
        const boton = cont.querySelector("[data-aplicar]");
        boton.disabled = !!error || filas.every((f) => f.margenAntes === f.margenDespues);
        boton.innerHTML = `<i class="ti ti-check"></i> Aplicar ${Number.isInteger(margen) ? margen : "—"} % a ${esc(nombreRubro(rubro))}`;
        cont.querySelectorAll("[data-rubro]").forEach((b) => b.classList.toggle("activo", b.dataset.rubro === rubro));
    }

    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">Cambiar margen</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Cuánto le ganás a cada rubro: cambiás el margen y todos sus precios se recalculan sobre el costo.</p>
        <div class="bloque">
            <p class="rotulo-chico">Rubro</p>
            <div class="chips">${RUBROS.map((r) => `<button class="chip" type="button" data-rubro="${esc(r.id)}">${esc(r.nombre)}</button>`).join("")}</div>
            <label class="porcentaje__otro">Margen nuevo
                <input name="margen" type="number" inputmode="numeric" min="0" max="${TOPES.margen}" step="1" value="${margen}"> %
            </label>
            <p class="nota"><i class="ti ti-info-circle"></i> Ejemplo: con 80 %, lo que cuesta ${esc(pesos(1000))} se vende a ${esc(pesos(precioDe(1000, 80)))}. Por mayor (desde la cantidad de cada artículo) va ${DESCUENTO_MAYOR} % menos.</p>
        </div>
        <div class="antes-despues"></div>
        <button class="boton boton--ancho boton--grande" type="button" data-aplicar></button>
        <div class="resultado-aumento"></div>`;

    const campo = cont.querySelector("[name=margen]");
    cont.querySelectorAll("[data-rubro]").forEach((b) => b.addEventListener("click", () => {
        rubro = b.dataset.rubro;
        margen = datos.margenDeRubro(rubro);
        campo.value = margen;
        pintar();
    }));
    campo.addEventListener("input", () => {
        margen = campo.value === "" ? NaN : Number(campo.value);
        pintar();
    });
    cont.querySelector("[data-aplicar]").addEventListener("click", () => {
        try {
            const cambio = datos.aplicarMargen(usuario, rubro, margen);
            aviso(`${cambio.cambios.length} precios actualizados`);
            pintar();
            despuesDeAplicar(cont, { usuario, datos, cambio, alDeshacer: pintar });
        } catch (err) {
            aviso(err, "error");
        }
    });
    pintar();
}

/**
 * "La lista del proveedor en Excel": bajás la de ejemplo (o usás la que te mandó), la subís, mirás costo y precio antes
 * → después (cada artículo con su margen) y aplicás todo de una, con Deshacer. Todo pasa en el navegador: el archivo
 * no se sube a ningún lado.
 */
export function vistaLista(cont, { usuario, datos }) {
    let filas = null;
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">La lista del proveedor en Excel</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> ¿Te mandó la lista nueva en Excel? Subila: se actualiza el costo de cada artículo y el precio de venta sale solo, con tu margen. Probá con la de ejemplo.</p>
        <ol class="pasos-lista">
            <li>
                <span>Bajá la lista de ejemplo de Papelera Central (sube un 12 %).</span>
                <button class="boton boton--chico boton--secundario" type="button" data-ejemplo><i class="ti ti-download"></i> Lista de ejemplo</button>
            </li>
            <li>
                <span>Subila (o la que te mandó tu proveedor: con una columna "Costo" o "Precio" y otra "Código" o "Artículo").</span>
                <label class="boton boton--chico subir-excel"><i class="ti ti-upload"></i> Subir el Excel
                    <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-archivo>
                </label>
            </li>
        </ol>
        <div class="resultado-excel resultado-aumento" aria-live="polite"></div>`;

    const lugar = cont.querySelector(".resultado-excel");
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
            v.malos ? `${v.malos} sin un costo que se entienda` : ""
        ].filter(Boolean);
        lugar.innerHTML = `
            <p class="resumen-excel"><i class="ti ti-file-spreadsheet"></i> <span><b>${esc(v.cambios.length)} costos cambian</b>${extras.length ? ` · ${esc(extras.join(" · "))}` : ""}<small>${esc(nombreArchivo)}</small></span></p>
            ${v.cambios.length ? `${htmlAntesDespues(v.cambios, { conCosto: true })}
            <button class="boton boton--ancho boton--grande" type="button" data-aplicar><i class="ti ti-check"></i> Aplicar a ${esc(v.cambios.length)} artículos</button>` : `<p class="nota"><i class="ti ti-circle-check"></i> Con esta lista no cambia ningún costo.</p>`}
            ${v.noEstan.length ? `<details class="no-estan"><summary>No están en tu stock (${esc(v.noEstan.length)})</summary><p class="nota">${esc(v.noEstan.join(" · "))}</p></details>` : ""}`;
        lugar.querySelector("[data-aplicar]")?.addEventListener("click", () => {
            try {
                const cambio = datos.aplicarLista(usuario, filas);
                filas = null;
                aviso(`${cambio.cambios.length} precios actualizados`);
                // Muestra el aviso con Deshacer en el mismo lugar (es también .resultado-aumento)
                despuesDeAplicar(cont, { usuario, datos, cambio, alDeshacer: () => (lugar.innerHTML = "") });
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    cont.querySelector("[data-ejemplo]").addEventListener("click", (e) => {
        e.currentTarget.disabled = true;
        bajarExcel("Lista Papelera Central (ejemplo)", datos.listaDeEjemplo("pr-papelera"), { hoja: "Lista", anchos: [16, 40, 14] })
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

/** Pedidos a los proveedores: lo que bajó del mínimo, el mensaje para mandar y "Llegó" (suma al stock). */
export function vistaPedidosProveedor(cont, { usuario, datos }) {
    const pedidos = datos.pedidosSugeridos();
    cont.innerHTML = `
        <a class="volver" href="#/stock?ver=pedir"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">Pedidos a proveedores</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Armado solo con lo que bajó del mínimo (hasta tener el doble). Copiá el pedido y, cuando llegue, tocá "Llegó".</p>
        ${pedidos.length ? pedidos.map((pr) => `
        <section class="bloque pedido-proveedor">
            <div class="tarjeta__fila">
                <h2 class="subtitulo"><i class="ti ti-truck-delivery"></i> ${esc(pr.nombre)}</h2>
                <span class="pastilla pastilla--ojo">${esc(pr.items.length)} ${pr.items.length === 1 ? "artículo" : "artículos"}</span>
            </div>
            <ul class="movimientos">${pr.items.map((i) => `
                <li class="movimiento">
                    <span><b>${esc(i.nombre)}</b><small>hay ${esc(i.stock)} · mínimo ${esc(i.minimo)}</small></span>
                    <b class="monto">× ${esc(i.cantidad)}</b>
                </li>`).join("")}</ul>
            <div class="acciones">
                <button class="boton" type="button" data-copiar="${esc(pr.id)}"><i class="ti ti-message-circle"></i> Mandar el pedido</button>
                <button class="boton boton--secundario" type="button" data-llego="${esc(pr.id)}"><i class="ti ti-package-import"></i> Llegó: sumar al stock</button>
            </div>
        </section>`).join("")
        : vacio("No hay nada para pedir: todo está sobre el mínimo.", "ti-circle-check")}
        <a class="boton boton--secundario boton--ancho siguiente" href="#/stock/aumento"><i class="ti ti-trending-up"></i> Ahora probá: subió un proveedor</a>`;

    cont.querySelectorAll("[data-copiar]").forEach((b) => b.addEventListener("click", () => {
        try {
            const pr = PROVEEDORES.find((p) => p.id === b.dataset.copiar);
            mostrarMensaje(`Pedido a ${pr.nombre}`, datos.mensajePedido(pr.id));
        } catch (err) {
            aviso(err, "error");
        }
    }));
    cont.querySelectorAll("[data-llego]").forEach((b) => b.addEventListener("click", () => {
        try {
            const e = datos.recibirPedido(usuario, b.dataset.llego);
            aviso(`Llegó: ${e.items.reduce((t, i) => t + i.cantidad, 0)} unidades sumadas al stock`);
            vistaPedidosProveedor(cont, { usuario, datos });
        } catch (err) {
            aviso(err, "error");
        }
    }));
}

/** Cargar un artículo nuevo (la dueña): con costo y margen, el precio sale solo. */
export function vistaNuevoProducto(cont, { usuario, datos }) {
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Stock y precios</a>
        <h1 class="titulo">Cargar artículo</h1>
        <form class="formulario bloque nuevo-producto" novalidate>
            <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" placeholder="Ej: Cuaderno espiral A5 rayado" required></label>
            <div class="formulario__fila">
                <label>Rubro
                    <select name="rubro">${RUBROS.map((r) => `<option value="${esc(r.id)}">${esc(r.nombre)}</option>`).join("")}</select>
                </label>
                <label>Proveedor
                    <select name="proveedor"><option value="">Sin proveedor</option>${PROVEEDORES.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join("")}</select>
                </label>
            </div>
            <div class="formulario__fila">
                <label>Costo<input name="costo" type="number" inputmode="numeric" min="1" max="${TOPES.costo}" step="1" required></label>
                <label>Margen %<input name="margen" type="number" inputmode="numeric" min="0" max="${TOPES.margen}" step="1" value="${esc(datos.margenDeRubro("escritura"))}"></label>
            </div>
            <div class="formulario__fila">
                <label>Stock<input name="stock" type="number" inputmode="numeric" min="0" max="${TOPES.stock}" step="1" value="0"></label>
                <label>Mínimo<input name="minimo" type="number" inputmode="numeric" min="0" max="${TOPES.stock}" step="1" value="0"></label>
            </div>
            <label>Por mayor desde (si querés)<input name="mayorDesde" type="number" inputmode="numeric" min="2" max="${TOPES.mayorDesde}" step="1" placeholder="Ej: 12"></label>
            <p class="nota precio-nuevo" aria-live="polite"><i class="ti ti-info-circle"></i> Poné el costo y el margen: el precio sale solo.</p>
            <button class="boton" type="submit"><i class="ti ti-plus"></i> Cargar</button>
        </form>`;
    const f = cont.querySelector("form");
    const previa = () => {
        const costo = num(f.costo.value);
        const margen = num(f.margen.value);
        if (Number.isInteger(costo) && costo > 0 && costo <= TOPES.costo && Number.isInteger(margen) && margen >= 0 && margen <= TOPES.margen) {
            f.querySelector(".precio-nuevo").innerHTML = `<i class="ti ti-tag"></i> Precio de venta: <b>${esc(pesos(precioDe(costo, margen)))}</b>`;
        }
    };
    f.rubro.addEventListener("change", () => {
        f.margen.value = datos.margenDeRubro(f.rubro.value);
        previa();
    });
    f.costo.addEventListener("input", previa);
    f.margen.addEventListener("input", previa);
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const p = datos.cargarProducto(usuario, {
                nombre: f.nombre.value, rubro: f.rubro.value, proveedorId: f.proveedor.value || null,
                costo: num(f.costo.value), margen: num(f.margen.value), stock: num(f.stock.value), minimo: num(f.minimo.value),
                mayorDesde: f.mayorDesde.value === "" ? null : num(f.mayorDesde.value)
            });
            aviso(`${p.nombre} cargado a ${pesos(p.precio)}`);
            textoBuscado = p.nombre;
            location.hash = `#/stock?ver=${p.rubro}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}

