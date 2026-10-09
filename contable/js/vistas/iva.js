// ============================================
// IVA: la posición del mes (débito − crédito − percepciones − saldo a favor anterior = a pagar o a favor, con el
// vencimiento según el CUIT), el gráfico de los últimos 12 meses, los libros IVA Ventas y Compras, y los archivos
// para bajar (Excel/CSV para el contador y los .txt del Libro IVA Digital, de prueba). La ven todos; bajar archivos
// es cosa de Patricia (los demás también pueden mirarlos).
// ============================================
import { esc, descargarCSV, fechaCorta } from "../../kit/js/ui.js?v=be942dc467";
import { htmlGuia, activarGuias } from "../../kit/js/guia.js?v=be942dc467";
import { ALICUOTAS, ORDEN_ALICUOTAS, pesos, pesosRedondo, nombrePeriodo, mesCorto, formatoCuit } from "../reglas.js?v=be942dc467";
import { buscarPersona } from "../marca.js?v=be942dc467";
import { libroDigitalVentas, libroDigitalCompras, bajarTexto } from "../libro-digital.js?v=be942dc467";
import { periodoPedido, htmlSelectorMes, activarSelectorMes, htmlTabla, diaMes } from "./comunes.js?v=be942dc467";

export function vistaIva(cont, { usuario, datos, consulta, irA }) {
    const e = datos.leerEmpresa();
    const periodo = periodoPedido(consulta);
    const libro = consulta?.get("libro") === "compras" ? "compras" : "ventas";

    if (e.condicionIva !== "RI") {
        cont.innerHTML = `
            <h1 class="titulo">IVA</h1>
            <div class="bloque"><p class="nota"><i class="ti ti-info-circle"></i> La empresa figura como ${esc(e.condicionIva === "MT" ? "monotributista" : "exenta")}: no liquida IVA. Si pasa a Responsable Inscripto (en "Tu empresa"), acá aparece la posición de cada mes.</p></div>`;
        return;
    }

    const pos = datos.posicionIva(periodo);
    const historial = datos.historialIva(12);
    const esPatricia = usuario.rol === "contadora";
    const hernan = buscarPersona("u-dueno");
    const resultado = pos.aPagar > 0
        ? `<span class="panel__rotulo">IVA a pagar de ${esc(nombrePeriodo(periodo))}</span><span class="panel__numero">${esc(pesos(pos.aPagar))}</span><small>Vence el ${esc(fechaCorta(pos.vence))} (aprox., según la terminación del CUIT)</small>`
        : `<span class="panel__rotulo">Saldo a favor de ${esc(nombrePeriodo(periodo))}</span><span class="panel__numero">${esc(pesos(pos.aFavor))}</span><small>Pasa al mes que viene: se descuenta del IVA a pagar</small>`;

    cont.innerHTML = `
        <h1 class="titulo">IVA</h1>
        <div class="fila-filtros">${htmlSelectorMes(periodo)}</div>
        <div class="iva-arriba">
            <div class="panel posicion-iva">${resultado}</div>
            <div class="bloque cuenta-iva">
                <h2 class="subtitulo"><i class="ti ti-math-function"></i> Cómo sale</h2>
                <p><span>IVA de las ventas (débito fiscal)</span><b>${esc(pesos(pos.debito))}</b></p>
                <p><span>− IVA de las compras (crédito fiscal)</span><b>${esc(pesos(pos.credito))}</b></p>
                <p><span>− Percepciones de IVA sufridas</span><b>${esc(pesos(pos.percepciones))}</b></p>
                <p><span>− Saldo a favor del mes anterior</span><b>${esc(pesos(pos.aFavorAnterior))}</b></p>
                <p class="cuenta-iva__total"><span>${pos.resultado >= 0 ? "A pagar" : "A favor"}</span><b>${esc(pesos(Math.abs(pos.resultado)))}</b></p>
            </div>
        </div>
        ${usuario.rol === "contadora" ? htmlGuia({ persona: hernan, ruta: "/inicio", texto: "Mirá cómo lo ve el dueño" }) : ""}

        <div class="bloque">
            <h2 class="subtitulo"><i class="ti ti-chart-bar"></i> IVA a pagar por mes</h2>
            ${graficoIva(historial, periodo)}
        </div>

        <div class="bloque">
            <div class="pestanas" role="tablist">
                <a role="tab" class="pestana${libro === "ventas" ? " activa" : ""}" aria-selected="${libro === "ventas"}" href="#/iva?p=${esc(periodo)}&libro=ventas">Libro IVA Ventas</a>
                <a role="tab" class="pestana${libro === "compras" ? " activa" : ""}" aria-selected="${libro === "compras"}" href="#/iva?p=${esc(periodo)}&libro=compras">Libro IVA Compras</a>
            </div>
            ${libro === "ventas" ? tablaVentas(datos.libroIvaVentas(periodo)) : tablaCompras(datos.libroIvaCompras(periodo))}
        </div>

        <div class="bloque archivos">
            <h2 class="subtitulo"><i class="ti ti-download"></i> Archivos del mes</h2>
            <div class="acciones">
                <button class="boton boton--secundario" type="button" data-csv><i class="ti ti-file-spreadsheet"></i> Libros en Excel (CSV)</button>
                <button class="boton boton--secundario" type="button" data-lid><i class="ti ti-file-text"></i> Libro IVA Digital (.txt)</button>
                <button class="boton boton--secundario" type="button" data-imprimir><i class="ti ti-printer"></i> Imprimir</button>
            </div>
            <p class="nota"><i class="ti ti-info-circle"></i> ${esPatricia ? "Los .txt tienen el formato que importa ARCA en el Libro IVA Digital." : "Esto lo usa la contadora."} En la demo son de prueba (datos inventados).</p>
        </div>`;

    activarSelectorMes(cont, "/iva", `&libro=${libro}`);
    activarGuias(cont, irA);
    cont.querySelector("[data-imprimir]").addEventListener("click", () => window.print());

    cont.querySelector("[data-csv]").addEventListener("click", () => {
        const v = datos.libroIvaVentas(periodo);
        const c = datos.libroIvaCompras(periodo);
        const plata = (n) => (n / 100).toFixed(2).replace(".", ",");
        const filas = [
            [`Libro IVA Ventas · ${nombrePeriodo(periodo)} · ${e.razonSocial} · DEMO (datos inventados)`],
            ["Fecha", "Comprobante", "Cliente", "CUIT/DNI", "Neto gravado", "IVA", "Exento", "Total"],
            ...v.filas.map((f) => [fechaCorta(f.fecha), f.comprobante, f.nombre, f.cuit ? formatoCuit(f.cuit) : f.doc ?? "", plata(f.neto), plata(f.iva), plata(f.exento), plata(f.total)]),
            ["", "", "Totales", "", plata(v.totales.neto), plata(v.totales.iva), plata(v.totales.exento), plata(v.totales.total)],
            [],
            [`Libro IVA Compras · ${nombrePeriodo(periodo)}`],
            ["Fecha", "Comprobante", "Proveedor", "CUIT", "Neto gravado", "IVA", "No gravado", "Percep. IVA", "Percep. IIBB", "Total"],
            ...c.filas.map((f) => [fechaCorta(f.fecha), f.comprobante, f.nombre, formatoCuit(f.cuit), plata(f.neto), plata(f.iva), plata(f.exento), plata(f.percepIva), plata(f.percepIibb), plata(f.total)]),
            ["", "", "Totales", "", plata(c.totales.neto), plata(c.totales.iva), plata(c.totales.exento), plata(c.totales.percepIva), plata(c.totales.percepIibb), plata(c.totales.total)]
        ];
        descargarCSV(`libros-iva-${periodo}.csv`, filas);
    });

    cont.querySelector("[data-lid]").addEventListener("click", () => {
        const sufijo = periodo.replace("-", "");
        const v = libroDigitalVentas(datos.listarComprobantes({ periodo }).reverse());
        const c = libroDigitalCompras(datos.listarCompras({ periodo }).reverse());
        bajarTexto(`PRUEBA_LIBRO_IVA_DIGITAL_VENTAS_CBTE_${sufijo}.txt`, v.cbte);
        bajarTexto(`PRUEBA_LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS_${sufijo}.txt`, v.alicuotas);
        bajarTexto(`PRUEBA_LIBRO_IVA_DIGITAL_COMPRAS_CBTE_${sufijo}.txt`, c.cbte);
        bajarTexto(`PRUEBA_LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS_${sufijo}.txt`, c.alicuotas);
    });
}

/** Barras del IVA a pagar de cada mes (los meses a favor van hacia abajo, en gris). Un solo color: el de la demo. */
function graficoIva(historial, elegido) {
    const ancho = 600;
    const alto = 200;
    const margen = { arriba: 16, abajo: 26, izq: 4, der: 4 };
    const valores = historial.map((p) => p.resultado);
    const max = Math.max(1, ...valores.map((v) => Math.max(0, v)));
    const min = Math.min(0, ...valores);
    const escala = (alto - margen.arriba - margen.abajo) / (max - min);
    const cero = margen.arriba + max * escala;
    const paso = (ancho - margen.izq - margen.der) / historial.length;
    const barra = Math.min(34, paso - 8);
    return `
        <div class="grafico-iva">
            <svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="IVA a pagar en los últimos 12 meses">
                <line class="grafico-iva__cero" x1="0" x2="${ancho}" y1="${cero}" y2="${cero}"></line>
                ${historial.map((p, i) => {
                    const v = p.resultado;
                    const h = Math.max(2, Math.abs(v) * escala);
                    const x = margen.izq + i * paso + (paso - barra) / 2;
                    const y = v >= 0 ? cero - h : cero;
                    const texto = v >= 0 ? `A pagar ${pesos(v)}` : `A favor ${pesos(-v)}`;
                    return `
                    <a href="#/iva?p=${esc(p.periodo)}" class="grafico-iva__mes${p.periodo === elegido ? " elegido" : ""}${v < 0 ? " a-favor" : ""}">
                        <title>${esc(nombrePeriodo(p.periodo))}: ${esc(texto)}</title>
                        <rect class="grafico-iva__toque" x="${margen.izq + i * paso}" y="0" width="${paso}" height="${alto}"></rect>
                        <rect class="grafico-iva__barra" x="${x}" y="${y}" width="${barra}" height="${h}" rx="4"></rect>
                        <text class="grafico-iva__mesnombre" x="${x + barra / 2}" y="${alto - 8}" text-anchor="middle">${esc(mesCorto(p.periodo))}</text>
                    </a>`;
                }).join("")}
            </svg>
            <p class="nota"><i class="ti ti-hand-finger"></i> Tocá un mes para verlo. El último es ${esc(nombrePeriodo(historial.at(-1).periodo))}: ${esc(pesosRedondo(Math.max(0, historial.at(-1).resultado)))} a pagar hasta hoy.</p>
        </div>`;
}

function tablaVentas(libro) {
    const usadas = ORDEN_ALICUOTAS.filter((a) => libro.totales.porAlicuota[a]);
    const columnas = [
        { titulo: "Fecha" }, { titulo: "Comprobante" }, { titulo: "Cliente" }, { titulo: "CUIT / DNI" },
        ...usadas.flatMap((a) => [{ titulo: `Neto ${ALICUOTAS[a].texto}`, clase: "num" }, { titulo: `IVA ${ALICUOTAS[a].texto}`, clase: "num" }]),
        { titulo: "Exento", clase: "num" }, { titulo: "Total", clase: "num" }
    ];
    const p = (n) => esc(pesos(n));
    const filas = libro.filas.map((f) => [
        esc(diaMes(f.fecha)), esc(f.comprobante), esc(f.nombre), esc(f.cuit ? formatoCuit(f.cuit) : f.doc ?? "—"),
        ...usadas.flatMap((a) => [p(f.porAlicuota[a]?.neto ?? 0), p(f.porAlicuota[a]?.iva ?? 0)]),
        p(f.exento), `<b>${p(f.total)}</b>`
    ]);
    const t = libro.totales;
    const pie = ["", "", "<b>Totales</b>", "", ...usadas.flatMap((a) => [p(t.porAlicuota[a].neto), p(t.porAlicuota[a].iva)]), p(t.exento), `<b>${p(t.total)}</b>`];
    return htmlTabla(columnas, filas, { pie, vacia: "No hay ventas en este mes.", etiqueta: "Libro IVA Ventas" });
}

function tablaCompras(libro) {
    const columnas = [
        { titulo: "Fecha" }, { titulo: "Comprobante" }, { titulo: "Proveedor" }, { titulo: "CUIT" },
        { titulo: "Neto gravado", clase: "num" }, { titulo: "IVA", clase: "num" }, { titulo: "No gravado", clase: "num" },
        { titulo: "Percep. IVA", clase: "num" }, { titulo: "Percep. IIBB", clase: "num" }, { titulo: "Total", clase: "num" }
    ];
    const p = (n) => esc(pesos(n));
    const filas = libro.filas.map((f) => [esc(diaMes(f.fecha)), esc(f.comprobante), esc(f.nombre), esc(formatoCuit(f.cuit)), p(f.neto), p(f.iva), p(f.exento), p(f.percepIva), p(f.percepIibb), `<b>${p(f.total)}</b>`]);
    const t = libro.totales;
    const pie = ["", "", "<b>Totales</b>", "", p(t.neto), p(t.iva), p(t.exento), p(t.percepIva), p(t.percepIibb), `<b>${p(t.total)}</b>`];
    return htmlTabla(columnas, filas, { pie, vacia: "No hay compras cargadas en este mes.", etiqueta: "Libro IVA Compras" });
}
