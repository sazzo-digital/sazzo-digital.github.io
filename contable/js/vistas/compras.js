// ============================================
// Compras: las facturas de los proveedores del mes, "Traer de ARCA" (simulado: trae de un toque las que ARCA tiene
// en Mis Comprobantes y faltan cargar) y cargar una a mano, con el IVA calculado solo. Una compra mal cargada se
// anula (no se borra). Solo administración carga; Hernán y Patricia miran.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=3ddc591303";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=3ddc591303";
import { TOPES } from "../datos.js?v=3ddc591303";
import { ALICUOTAS, ORDEN_ALICUOTAS, pesos, numeroComprobante, nombrePeriodo, periodoActual, fechaISO, aCentavos } from "../reglas.js?v=3ddc591303";
import { buscarPersona } from "../marca.js?v=3ddc591303";
import { diaMes, periodoPedido, htmlSelectorMes, activarSelectorMes, conEspera, nombreDe } from "./comunes.js?v=3ddc591303";

const puedeCargar = (u) => u.rol === "admin";

export function vistaCompras(cont, { usuario, datos, consulta, irA }) {
    const periodo = periodoPedido(consulta);
    const lista = datos.listarCompras({ periodo });
    const vigentes = lista.filter((c) => !c.anulada);
    const credito = vigentes.reduce((s, c) => s + (c.letra === "A" ? c.iva : 0), 0);
    const total = vigentes.reduce((s, c) => s + c.total, 0);
    const pendientes = periodo === periodoActual() ? datos.pendientesArca() : [];
    const traidas = consulta?.get("traidas");
    const patricia = buscarPersona("u-contadora");

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Compras</h1>
            ${puedeCargar(usuario) ? `<a class="boton boton--secundario" href="#/compras/nueva"><i class="ti ti-plus"></i> Cargar una compra</a>` : ""}
        </div>
        ${traidas ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Listo: ${esc(traidas)} facturas traídas de ARCA</h2>
            <p>El crédito fiscal del mes ya las incluye.</p>
        </div>
        ${htmlGuia({ persona: patricia, ruta: "/iva", texto: "Mirá cómo la contadora ya tiene el IVA del mes" })}` : ""}
        ${pendientes.length ? `
        <div class="bloque aviso-arca">
            <h2 class="subtitulo"><i class="ti ti-cloud-download"></i> ARCA tiene ${pendientes.length} facturas tuyas sin cargar</h2>
            <p>Son de este mes, de ${esc([...new Set(pendientes.map((p) => p.emisor.nombre))].slice(0, 3).join(", "))}${new Set(pendientes.map((p) => p.emisor.nombre)).size > 3 ? " y otros" : ""}: suman ${esc(pesos(pendientes.reduce((s, p) => s + p.total, 0)))} con ${esc(pesos(pendientes.reduce((s, p) => s + p.iva, 0)))} de IVA a tu favor.</p>
            ${puedeCargar(usuario)
                ? `<button class="boton boton--grande" type="button" data-traer><i class="ti ti-cloud-download"></i> Traer de ARCA</button>`
                : `<p class="nota"><i class="ti ti-lock"></i> Las trae Silvina (administración).</p>`}
        </div>` : ""}
        <div class="fila-filtros">${htmlSelectorMes(periodo)}</div>
        <div class="paneles">
            <div class="panel"><span class="panel__rotulo">Comprado en ${esc(nombrePeriodo(periodo))}</span><span class="panel__numero">${esc(pesos(total))}</span><small>${vigentes.length} facturas</small></div>
            <div class="panel"><span class="panel__rotulo">IVA de las compras (crédito)</span><span class="panel__numero">${esc(pesos(credito))}</span><small>va al libro IVA Compras</small></div>
        </div>
        ${lista.length ? `
        <ul class="lista-comprobantes">
            ${lista.map((c) => `
            <li class="compra${c.anulada ? " compra--anulada" : ""}">
                <span class="tipo tipo--${esc(c.letra)}">F${esc(c.letra)}</span>
                <span class="comprobante-fila__texto">
                    <b>${esc(c.emisor.nombre)}</b>
                    <small>${esc(numeroComprobante(c.puntoVenta, c.numero))} · ${esc(diaMes(c.fecha))}${c.origen === "arca" ? ` · <span class="marca-arca"><i class="ti ti-cloud-check"></i> de ARCA</span>` : ""}${c.anulada ? ` · anulada por ${esc(nombreDe(c.anuladaPor))}` : ""}</small>
                </span>
                <span class="compra__montos"><b class="monto">${esc(pesos(c.total))}</b>${c.iva ? `<small>IVA ${esc(pesos(c.iva))}</small>` : ""}</span>
                ${puedeCargar(usuario) && !c.anulada ? `<button class="boton-icono" type="button" data-anular="${esc(c.id)}" title="Anular (mal cargada)" aria-label="Anular la compra de ${esc(c.emisor.nombre)}"><i class="ti ti-ban"></i></button>` : ""}
            </li>`).join("")}
        </ul>` : vacio("No hay compras cargadas en este mes.", "ti-shopping-cart")}`;

    activarSelectorMes(cont, "/compras");
    activarGuias(cont, irA);

    cont.querySelector("[data-traer]")?.addEventListener("click", async () => {
        try {
            const nuevas = await conEspera("Consultando Mis Comprobantes en ARCA…", () => datos.traerDeArca(usuario), 1400);
            location.hash = `#/compras?traidas=${nuevas.length}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelectorAll("[data-anular]").forEach((b) =>
        b.addEventListener("click", () => {
            if (!confirm("¿Anular esta compra? Queda en la lista como anulada y sale del libro de IVA.")) return;
            try {
                datos.anularCompra(b.dataset.anular, usuario);
                aviso("Compra anulada.", "info");
                vistaCompras(cont, { usuario, datos, consulta, irA });
            } catch (err) {
                aviso(err, "error");
            }
        })
    );
}

export function vistaNuevaCompra(cont, { usuario, datos }) {
    if (!puedeCargar(usuario)) {
        cont.innerHTML = `<a class="volver" href="#/compras"><i class="ti ti-arrow-left"></i> Compras</a>${vacio("Las compras las carga Silvina (administración).", "ti-lock")}`;
        return;
    }
    const proveedores = datos.listarProveedores();
    const hoy = fechaISO(new Date());
    cont.innerHTML = `
        <a class="volver" href="#/compras"><i class="ti ti-arrow-left"></i> Compras</a>
        <h1 class="titulo">Cargar una compra</h1>
        <form class="formulario" novalidate>
            <div class="bloque">
                <label>Proveedor
                    <select name="proveedor">${proveedores.map((p) => `<option value="${esc(p.id)}" data-cond="${esc(p.condicion)}">${esc(p.nombre)}</option>`).join("")}</select>
                </label>
                <div class="formulario__fila formulario__fila--3">
                    <label>Letra<select name="letra"><option>A</option><option>B</option><option>C</option></select></label>
                    <label>Punto de venta<input name="pv" type="number" inputmode="numeric" min="1" max="${TOPES.puntoVenta}" step="1" value="1"></label>
                    <label>Número<input name="numero" type="number" inputmode="numeric" min="1" max="${TOPES.numero}" step="1" placeholder="Ej: 4521"></label>
                </div>
                <label>Fecha<input name="fecha" type="date" max="${esc(hoy)}" value="${esc(hoy)}"></label>
            </div>
            <div class="bloque importes-a">
                <h2 class="subtitulo"><i class="ti ti-receipt-tax"></i> Importes sin IVA (el IVA se calcula solo)</h2>
                <div class="formulario__fila formulario__fila--3">
                    ${["21", "10.5", "27"].map((a) => `<label>Neto al ${esc(ALICUOTAS[a].texto)}<input name="neto-${esc(a)}" inputmode="decimal" maxlength="16" placeholder="0,00" autocomplete="off"></label>`).join("")}
                </div>
                <div class="formulario__fila">
                    <label>Percepción de IVA<input name="percIva" inputmode="decimal" maxlength="16" placeholder="0,00" autocomplete="off"></label>
                    <label>Percepción de Ingresos Brutos<input name="percIibb" inputmode="decimal" maxlength="16" placeholder="0,00" autocomplete="off"></label>
                </div>
            </div>
            <div class="bloque importes-c" hidden>
                <label>Total de la factura<input name="total" inputmode="decimal" maxlength="16" placeholder="0,00" autocomplete="off"></label>
                <p class="nota"><i class="ti ti-info-circle"></i> Las facturas B y C no discriminan IVA: no suman crédito fiscal.</p>
            </div>
            <div class="panel totales-compra" aria-live="polite"></div>
            <p class="formulario__error" role="alert" hidden></p>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Guardar la compra</button>
        </form>`;

    const form = cont.querySelector("form");
    const error = cont.querySelector(".formulario__error");
    const esA = () => form.letra.value === "A";
    const num = (v) => {
        try {
            return v.trim() ? aCentavos(v, "x", { desde: 0, hasta: TOPES.total }) : 0;
        } catch {
            return null;
        }
    };

    function sugerirLetra() {
        const cond = form.proveedor.selectedOptions[0]?.dataset.cond;
        form.letra.value = cond === "RI" ? "A" : "C";
        cambiarLetra();
    }
    function cambiarLetra() {
        cont.querySelector(".importes-a").hidden = !esA();
        cont.querySelector(".importes-c").hidden = esA();
        pintarTotal();
    }
    function pintarTotal() {
        let total = 0;
        let iva = 0;
        let bien = true;
        if (esA()) {
            for (const a of ["21", "10.5", "27"]) {
                const n = num(form[`neto-${a}`].value);
                if (n === null) bien = false;
                else {
                    const i = Math.round((n * ALICUOTAS[a].porMil) / 1000);
                    total += n + i;
                    iva += i;
                }
            }
            for (const k of ["percIva", "percIibb"]) {
                const n = num(form[k].value);
                if (n === null) bien = false;
                else total += n;
            }
        } else {
            const n = num(form.total.value);
            if (n === null) bien = false;
            else total = n;
        }
        cont.querySelector(".totales-compra").innerHTML = bien
            ? `${esA() ? `<p class="totales-factura__fila"><span>IVA (crédito fiscal)</span><b>${esc(pesos(iva))}</b></p>` : ""}<span class="panel__rotulo">Total</span><span class="panel__numero">${esc(pesos(total))}</span>`
            : `<span class="panel__rotulo">Total</span><span class="panel__numero">—</span><small>Revisá los importes.</small>`;
    }

    sugerirLetra();
    form.proveedor.addEventListener("change", sugerirLetra);
    form.letra.addEventListener("change", cambiarLetra);
    form.addEventListener("input", pintarTotal);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        error.hidden = true;
        try {
            const importes = esA()
                ? ORDEN_ALICUOTAS.filter((a) => form[`neto-${a}`]?.value.trim()).map((a) => ({ alicuota: a, neto: form[`neto-${a}`].value }))
                : [];
            const compra = datos.cargarCompra({
                proveedorId: form.proveedor.value,
                letra: form.letra.value,
                puntoVenta: Number(form.pv.value),
                numero: Number(form.numero.value),
                fecha: form.fecha.value,
                importes,
                total: form.total.value,
                percepIva: form.percIva.value || 0,
                percepIibb: form.percIibb.value || 0
            }, usuario);
            aviso(`Compra de ${compra.emisor.nombre} guardada: ${pesos(compra.total)}`);
            location.hash = `#/compras?p=${compra.fecha.slice(0, 7)}`;
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        }
    });
}
