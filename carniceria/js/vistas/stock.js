// ============================================
// Precios y stock. Todos ven los kilos que quedan de cada corte (por animal), con "hay que despostar" (los que salen
// de la media res) o "hay que pedir", y el precio por kilo. El dueño además:
//   corrige precio, costo, margen, stock y mínimo de cada uno;
//   "Subió la hacienda": un % a todo un animal (precio redondeado a $100 y el costo en el mismo %), con Deshacer;
//   "Cargar un corte" y la "Pizarra para la tele".
// También acá: las etiquetas de ejemplo de la balanza (para probar el escáner sin balanza).
// ============================================
import { esc, aviso, vacio, mensajeDe } from "../../kit/js/ui.js?v=ece442dfab";
import { ANIMALES, TOPES, nombreAnimal, pesos, kilos, armarEtiqueta } from "../datos.js?v=ece442dfab";
import { NEGOCIO } from "../marca.js?v=ece442dfab";
import { svgEAN } from "../codigo-barras.js?v=ece442dfab";
import { htmlCopiable, activarCopiables } from "../../kit/js/celular.js?v=ece442dfab";
import { pastillaStock, precioDe, campoKg, kgEnCampo, cuantoHay } from "./comunes.js?v=ece442dfab";

const RAPIDOS = [5, 8, 10, 15];
let textoBuscado = ""; // el buscador recuerda lo escrito mientras se navega

/** El último cambio de precios, con Deshacer. */
function htmlUltimoCambio(c) {
    if (!c) return "";
    const que = c.tipo === "aumento" ? `${c.porcentaje > 0 ? "+" : ""}${c.porcentaje} % ${nombreAnimal(c.animal).toLowerCase()}` : `precios sugeridos del desposte N° ${c.numero}`;
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
    const dueno = usuario.rol === "dueno";
    const filtro = consulta.get("ver");
    const animal = ANIMALES.some((x) => x.id === filtro) ? filtro : null;
    const faltan = filtro === "falta";
    const aReponer = datos.faltantes();
    const chip = (ver, texto) => `<a class="chip${(filtro ?? "") === (ver ?? "") ? " activo" : ""}" href="#/stock${ver ? `?ver=${ver}` : ""}">${esc(texto)}</a>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Precios y stock</h1>
        </div>
        <div class="acciones-stock">
            ${dueno ? `<a class="boton boton--chico" href="#/stock/aumento"><i class="ti ti-trending-up"></i> Subió la hacienda</a>` : ""}
            <a class="boton boton--chico boton--secundario" href="#/pizarra"><i class="ti ti-device-tv"></i> Pizarra para la tele</a>
            <a class="boton boton--chico boton--secundario" href="#/stock/etiquetas"><i class="ti ti-barcode"></i> Etiquetas de ejemplo</a>
            ${dueno ? `<a class="boton boton--chico boton--secundario" href="#/stock/nuevo"><i class="ti ti-plus"></i> Cargar un corte</a>` : ""}
        </div>
        ${dueno ? htmlUltimoCambio(datos.ultimoCambio()) : `<p class="nota"><i class="ti ti-info-circle"></i> Los precios, los costos y el stock los cambia Ricardo.</p>`}
        <form class="buscar buscar--stock" novalidate>
            <label class="buscador">
                <i class="ti ti-search" aria-hidden="true"></i>
                <span class="solo-lector">Buscar un corte</span>
                <input name="q" type="search" autocomplete="off" maxlength="40" placeholder="Buscar un corte" value="${esc(textoBuscado)}">
            </label>
        </form>
        <nav class="chips" aria-label="Filtrar">
            ${chip(null, "Todos")}
            ${chip("falta", `Hay que reponer (${aReponer.length})`)}
            ${ANIMALES.map((x) => chip(x.id, x.nombre)).join("")}
        </nav>
        <div class="lista-stock"></div>
        <p class="nota acerca-link"><i class="ti ti-info-circle"></i> <a href="#/acerca">Acerca de esta demo</a> y lo que puede sumar la versión real.</p>`;

    const lugar = cont.querySelector(".lista-stock");
    const q = cont.querySelector("[name=q]");

    function pintarLista() {
        const texto = q.value.trim();
        const coinciden = texto ? new Set(datos.listarArticulos({ texto }).map((a) => a.id)) : null;
        const lista = (faltan ? aReponer : datos.listarArticulos({ animal })).filter((a) => !coinciden || coinciden.has(a.id));
        const grupos = ANIMALES.map((x) => ({ ...x, articulos: lista.filter((a) => a.animal === x.id) })).filter((g) => g.articulos.length);
        lugar.innerHTML = grupos.length ? grupos.map((g) => `
            <section class="grupo-stock">
                <h2 class="subtitulo"><i class="ti ${esc(g.icono)}"></i> ${esc(g.nombre)}</h2>
                <ul class="filas-stock">${g.articulos.map((a) => `
                    <li class="fila-stock">
                        <span class="fila-stock__nombre">${esc(a.nombre)}${a.oferta ? ` <span class="etiqueta">oferta</span>` : ""}
                            <small>${dueno ? `costo ${esc(pesos(a.costo))}${a.venta === "kg" ? "/kg" : ""} · margen ${esc(a.margen)} %` : `código ${esc(a.plu)}`}${a.rinde ? " · sale del desposte" : ""}</small>
                        </span>
                        <b class="fila-stock__precio">${esc(precioDe(a))}</b>
                        ${pastillaStock(a)}
                        ${dueno ? `<details class="corregir">
                            <summary aria-label="Corregir ${esc(a.nombre)}"><i class="ti ti-pencil"></i></summary>
                            <form class="formulario" novalidate data-articulo="${esc(a.id)}">
                                <div class="formulario__fila">
                                    <label>Precio ${a.venta === "kg" ? "por kilo" : "c/u"}<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" value="${esc(a.precio)}"></label>
                                    <label>Costo<input name="costo" type="number" inputmode="numeric" min="1" max="${TOPES.costo}" step="1" value="${esc(a.costo)}"></label>
                                </div>
                                <div class="formulario__fila">
                                    <label>${a.venta === "kg" ? "Stock (kg)" : "Stock"}${a.venta === "kg" ? campoKg({ nombre: "stock", valor: kgEnCampo(a.stock) }) : `<input name="stock" type="number" inputmode="numeric" min="0" max="${TOPES.stockKg}" step="1" value="${esc(a.stock)}">`}</label>
                                    <label>${a.venta === "kg" ? "Mínimo (kg)" : "Mínimo"}${a.venta === "kg" ? campoKg({ nombre: "minimo", valor: kgEnCampo(a.minimo) }) : `<input name="minimo" type="number" inputmode="numeric" min="0" max="${TOPES.stockKg}" step="1" value="${esc(a.minimo)}">`}</label>
                                </div>
                                <label>Margen % (para el precio sugerido del desposte)<input name="margen" type="number" inputmode="numeric" min="0" max="${TOPES.margen}" step="1" value="${esc(a.margen)}"></label>
                                <button class="boton boton--chico" type="submit"><i class="ti ti-device-floppy"></i> Guardar</button>
                            </form>
                        </details>` : ""}
                    </li>`).join("")}
                </ul>
            </section>`).join("") : vacio(faltan ? "No hay nada para reponer. Todo en orden." : "No hay cortes con ese nombre.", faltan ? "ti-circle-check" : "ti-search");

        lugar.querySelectorAll("form[data-articulo]").forEach((f) => f.addEventListener("submit", (e) => {
            e.preventDefault();
            const a = datos.articulo(f.dataset.articulo);
            const cantidad = (v) => (a.venta === "kg" ? v : num(v));
            try {
                const g = datos.corregirArticulo(usuario, a.id, {
                    precio: num(f.precio.value), costo: num(f.costo.value), margen: num(f.margen.value),
                    stock: cantidad(f.stock.value), minimo: cantidad(f.minimo.value)
                });
                aviso(`${g.nombre} guardado: ${precioDe(g)} · hay ${cuantoHay(g)}`);
                vistaStock(cont, { usuario, datos, consulta });
            } catch (err) {
                aviso(err, "error");
            }
        }));
    }

    q.addEventListener("input", () => {
        textoBuscado = q.value;
        pintarLista();
    });
    cont.querySelector(".buscar--stock").addEventListener("submit", (e) => e.preventDefault());
    activarDeshacer(cont, usuario, datos, () => vistaStock(cont, { usuario, datos, consulta }));
    pintarLista();
}

/** "Subió la hacienda": animal + % → precio antes y después → Aplicar (con Deshacer). */
export function vistaAumento(cont, { usuario, datos }) {
    let animal = "vaca";
    let porcentaje = 8;

    function pintar() {
        let filas = [];
        let error = "";
        try {
            filas = datos.verAumento(animal, porcentaje);
        } catch (e) {
            error = mensajeDe(e);
        }
        cont.querySelector(".antes-despues").innerHTML = error
            ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> ${esc(error)}</p>`
            : `<p class="rotulo-chico">${filas.length} cortes · redondeado a $100 para arriba · el costo sube igual</p>
               <ul class="filas-stock">${filas.map((f) => `
                <li class="fila-stock fila-stock--aumento">
                    <span class="fila-stock__nombre">${esc(f.nombre)}<small>${f.venta === "kg" ? "por kilo" : "por unidad"}</small></span>
                    <span class="antes">${esc(pesos(f.antes))}</span>
                    <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    <b class="despues">${esc(pesos(f.despues))}</b>
                </li>`).join("")}</ul>`;
        const boton = cont.querySelector("[data-aplicar]");
        boton.disabled = !!error || porcentaje === 0;
        boton.innerHTML = `<i class="ti ti-check"></i> Aplicar a ${filas.length} cortes`;
        cont.querySelectorAll("[data-animal]").forEach((b) => b.classList.toggle("activo", b.dataset.animal === animal));
        cont.querySelectorAll("[data-pct]").forEach((b) => b.classList.toggle("activo", Number(b.dataset.pct) === porcentaje));
    }

    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Precios y stock</a>
        <h1 class="titulo">Subió la hacienda</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Te subió el frigorífico: elegí qué subió y cuánto. Todos los precios de ese animal suben juntos, redondeados.</p>
        <div class="bloque">
            <p class="rotulo-chico">¿Qué subió?</p>
            <div class="chips">${ANIMALES.map((x) => `<button class="chip" type="button" data-animal="${esc(x.id)}"><i class="ti ${esc(x.icono)}" aria-hidden="true"></i>${esc(x.nombre)}</button>`).join("")}</div>
            <p class="rotulo-chico">¿Cuánto?</p>
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
    cont.querySelectorAll("[data-animal]").forEach((b) => b.addEventListener("click", () => {
        animal = b.dataset.animal;
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
            const c = datos.aplicarAumento(usuario, animal, porcentaje);
            aviso(`${c.cambios.length} precios actualizados`);
            const lugar = cont.querySelector(".resultado-aumento");
            lugar.innerHTML = `
                ${htmlUltimoCambio(c)}
                <p class="nota"><i class="ti ti-shopping-cart"></i> La próxima venta ya sale con el precio nuevo. Lo vendido antes no cambia.</p>
                <a class="boton boton--secundario boton--ancho" href="#/pizarra"><i class="ti ti-device-tv"></i> Ver la pizarra</a>`;
            activarDeshacer(lugar, usuario, datos, () => {
                lugar.innerHTML = "";
                pintar();
            });
            lugar.scrollIntoView({ block: "center" });
        } catch (err) {
            aviso(err, "error");
        }
    });
    pintar();
}

/** Cargar un corte o un artículo nuevo (el dueño). */
export function vistaNuevoArticulo(cont, { usuario, datos }) {
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Precios y stock</a>
        <h1 class="titulo">Cargar un corte</h1>
        <form class="formulario bloque" novalidate>
            <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" required placeholder="Ej: Arañita"></label>
            <div class="formulario__fila">
                <label>¿De qué es?
                    <select name="animal">${ANIMALES.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join("")}</select>
                </label>
                <label>¿Cómo se vende?
                    <select name="venta"><option value="kg">Por kilo</option><option value="unidad">Por unidad</option></select>
                </label>
            </div>
            <div class="formulario__fila">
                <label>Precio ($)<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" required></label>
                <label>¿Cuánto hay? (kg o unidades)${campoKg({ nombre: "stock", placeholder: "Ej: 2,5" })}</label>
            </div>
            <p class="nota"><i class="ti ti-info-circle"></i> El costo se calcula con el margen del animal; lo corregís después en la lista.</p>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-plus"></i> Cargar</button>
        </form>`;
    const f = cont.querySelector("form");
    f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const a = datos.cargarArticulo(usuario, {
                nombre: f.nombre.value, animal: f.animal.value, venta: f.venta.value, precio: num(f.precio.value),
                stock: f.venta.value === "kg" ? f.stock.value || "0" : num(f.stock.value || "0")
            });
            aviso(`${a.nombre} cargado: ${precioDe(a)}`);
            location.hash = `#/stock?ver=${a.animal}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}

// Las etiquetas de ejemplo: [nombre del corte, gramos]
const ETIQUETAS = [["Asado", 1_625], ["Vacío", 2_040], ["Picada común", 845], ["Chorizo", 1_010]];

/** Etiquetas de ejemplo de la balanza: para leerlas con la cámara en Vender (desde otra pantalla o impresas). */
export function vistaEtiquetas(cont, { datos }) {
    const etiquetas = ETIQUETAS.map(([nombre, gramos]) => {
        const a = datos.listarArticulos({ texto: nombre }).find((x) => x.nombre === nombre);
        return a ? { a, gramos, codigo: armarEtiqueta(a.plu, gramos) } : null;
    }).filter(Boolean);
    cont.innerHTML = `
        <a class="volver" href="#/stock"><i class="ti ti-arrow-left"></i> Precios y stock</a>
        <h1 class="titulo">Etiquetas de ejemplo</h1>
        <p class="nota pista"><i class="ti ti-hand-finger"></i> Como las que imprime la balanza: abrilas en otra pantalla (o imprimilas) y, en Vender, tocá la cámara y apuntá al código. El corte entra con su peso. Sin cámara: copiá el código y pegalo en el buscador de Vender.</p>
        <div class="etiquetas">${etiquetas.map(({ a, gramos, codigo }) => `
            <article class="etiqueta-balanza">
                <p class="etiqueta-balanza__negocio">${esc(NEGOCIO)}</p>
                <p class="etiqueta-balanza__corte">${esc(a.nombre)}</p>
                <p class="etiqueta-balanza__datos"><span>${esc(kilos(gramos))}</span><span>${esc(pesos(a.precio))}/kg</span></p>
                ${svgEAN(codigo)}
                <p class="etiqueta-balanza__copiar">${htmlCopiable(codigo, "Copiar el código")}</p>
            </article>`).join("")}
        </div>
        <p class="nota"><i class="ti ti-info-circle"></i> El código empieza con 20, sigue el código del corte y después el peso en gramos. En la versión real se ajusta a la balanza de cada carnicería (algunas ponen el importe en vez del peso).</p>
        <a class="boton boton--ancho" href="#/inicio"><i class="ti ti-shopping-cart"></i> Ir a Vender</a>`;
    activarCopiables(cont, "Código copiado: pegalo en el buscador de Vender.");
}
