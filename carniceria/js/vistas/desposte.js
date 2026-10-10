// ============================================
// Desposte: lo que entra (media res, media res de cerdo o cajón de pollo) se despieza y se pesa corte por corte.
//   Lista: los despostes abiertos (lo que falta pesar), "Entró mercadería" (el dueño) y el historial con la merma de
//   cada uno y el promedio por proveedor y por quién despostó (para comparar).
//   Un desposte: la vaca dibujada (cada zona se pinta cuando sus cortes tienen el peso), lo esperado y lo real de cada
//   corte (marca lo que dio de menos), hueso, grasa y oreo. Con todo pesado, "Terminar": los kilos pasan al stock.
//   El dueño ve además el costo real por kilo de cada corte y el precio sugerido con su margen ("Aplicar", con
//   Deshacer) y lo baja en PDF. Darío carga los pesos; los costos los ve Ricardo.
// ============================================
import { esc, aviso, vacio, fechaCorta } from "../../kit/js/ui.js?v=ece442dfab";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=ece442dfab";
import { TOPES, TIPOS_INGRESO, PROVEEDORES, pesos, kilos, aGramos, mermaEsperada } from "../datos.js?v=ece442dfab";
import { NEGOCIO } from "../marca.js?v=ece442dfab";
import { htmlMediaRes, activarMediaRes, ZONAS } from "../media-res.js?v=ece442dfab";
import { guia, activarGuias, cuando, campoKg, kgEnCampo, porcentaje, unDecimal } from "./comunes.js?v=ece442dfab";

/** La merma contra la esperada: pastilla verde (igual o menos), amarilla (hasta 1,5 puntos más) o roja. */
function pastillaMerma(merma, esperada) {
    if (merma === null || merma === undefined) return "";
    const dif = Math.round((merma - esperada) * 10) / 10;
    const clase = dif <= 0 ? "bien" : dif <= 1.5 ? "ojo" : "mal";
    return `<span class="pastilla pastilla--${clase}">${esc(unDecimal(merma))}${dif ? ` · ${dif > 0 ? "+" : "−"}${esc(Math.abs(dif).toLocaleString("es-AR"))}` : ""}</span>`;
}

export function vistaDespostes(cont, { usuario, datos }) {
    const dueno = usuario.rol === "dueno";
    const todos = datos.listarDespostes();
    const abiertos = todos.filter((d) => d.estado === "abierto");
    const h = datos.historial();
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Desposte</h1>
            ${dueno ? `<a class="boton boton--chico" href="#/desposte/nuevo"><i class="ti ti-truck-delivery"></i> Entró mercadería</a>` : ""}
        </div>
        <p class="nota"><i class="ti ti-info-circle"></i> Lo que entra del frigorífico se despieza y se pesa corte por corte. Lo que no se vende (hueso, grasa y lo que se seca en la cámara) es la merma.</p>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-scale"></i> Para despostar</h2>
            ${abiertos.length ? `<ul class="tarjetas">${abiertos.map((d) => `
                <li><a class="tarjeta tarjeta--link" href="#/desposte/${esc(d.id)}">
                    <div class="tarjeta__fila">
                        <span class="tarjeta__titulo"><i class="ti ti-meat" aria-hidden="true"></i>N° ${esc(d.numero)} · ${esc(d.tipoNombre)} · ${esc(kilos(d.ingresoG, 1))}</span>
                        <span class="pastilla pastilla--ojo"><i class="ti ti-scale" aria-hidden="true"></i>Falta pesar ${esc(d.faltan)}</span>
                    </div>
                    <p class="tarjeta__quien">${esc(d.proveedor)} · tropa ${esc(d.tropa)} · entró ${esc(cuando(d.fecha))}${d.despostadoPor ? ` · pesa ${esc(d.despostadoPor)}` : ""}</p>
                    <span class="barra-avance" aria-hidden="true"><span style="width:${Math.min(100, Math.round((d.pesadoG / d.ingresoG) * 100))}%"></span></span>
                </a></li>`).join("")}</ul>` : `<p class="nota">No hay nada para despostar.${dueno ? " Cuando entre una media res, anotala con “Entró mercadería”." : ""}</p>`}
        </section>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-chart-bar"></i> Merma promedio</h2>
            <p class="nota">Contra lo esperado para cada cosa (media res ${esc(unDecimal(mermaEsperada("media-res")))}, cerdo ${esc(unDecimal(mermaEsperada("media-cerdo")))}, pollo ${esc(unDecimal(mermaEsperada("cajon-pollo")))}).</p>
            <div class="comparar">
                <div>
                    <p class="rotulo-chico">Por proveedor</p>
                    <ul class="ranking">${h.porProveedor.map((p) => `<li><span>${esc(p.nombre)} <small>${esc(p.cuantos)} despostes · esperada ${esc(unDecimal(p.esperada))}</small></span>${pastillaMerma(p.merma, p.esperada)}</li>`).join("")}</ul>
                </div>
                <div>
                    <p class="rotulo-chico">Por quién despostó</p>
                    <ul class="ranking">${h.porQuien.map((p) => `<li><span>${esc(p.nombre)} <small>${esc(p.cuantos)} despostes · esperada ${esc(unDecimal(p.esperada))}</small></span>${pastillaMerma(p.merma, p.esperada)}</li>`).join("")}</ul>
                </div>
            </div>
        </section>
        <section class="bloque">
            <h2 class="subtitulo"><i class="ti ti-list"></i> Últimos despostes</h2>
            ${h.despostes.length ? `<ul class="movimientos">${h.despostes.map((d) => `
                <li class="movimiento">
                    <a class="movimiento__link" href="#/desposte/${esc(d.id)}"><b>N° ${esc(d.numero)} · ${esc(d.tipoNombre)} · ${esc(kilos(d.ingresoG, 1))}</b><small>${esc(fechaCorta(d.fecha))} · ${esc(d.proveedor)} · despostó ${esc(d.despostadoPor ?? "—")}</small></a>
                    ${pastillaMerma(d.merma, d.esperada)}
                </li>`).join("")}</ul>` : `<p class="nota">Todavía no hay despostes terminados.</p>`}
        </section>`;
}

/** "Entró mercadería": qué, de qué proveedor, tropa o lote, kilos y costo por kilo. */
export function vistaIngreso(cont, { usuario, datos }) {
    let tipo = "media-res";
    function pintar() {
        const t = TIPOS_INGRESO[tipo];
        cont.innerHTML = `
            <a class="volver" href="#/desposte"><i class="ti ti-arrow-left"></i> Desposte</a>
            <h1 class="titulo">Entró mercadería</h1>
            <form class="formulario bloque" novalidate>
                <p class="rotulo-chico">¿Qué entró?</p>
                <div class="chips" role="radiogroup" aria-label="Qué entró">
                    ${Object.entries(TIPOS_INGRESO).map(([id, x]) => `<button class="chip${tipo === id ? " activo" : ""}" type="button" role="radio" aria-checked="${tipo === id}" data-tipo="${esc(id)}">${esc(x.nombre)}</button>`).join("")}
                </div>
                <label>Proveedor
                    <select name="proveedor">${t.proveedores.map((id) => `<option value="${esc(id)}">${esc(PROVEEDORES.find((p) => p.id === id).nombre)}</option>`).join("")}</select>
                </label>
                <div class="formulario__fila">
                    <label>Peso de ingreso (kg)${campoKg({ nombre: "kg", placeholder: `Ej: ${t.pesoTipico}`, requerido: true })}</label>
                    <label>Costo por kilo ($)<input name="costo" type="number" inputmode="numeric" min="1" max="${TOPES.costo}" step="1" placeholder="Ej: ${t.costoTipico}" required></label>
                </div>
                <label>Tropa o lote (de ejemplo)<input name="tropa" maxlength="${TOPES.tropa}" placeholder="Ej: T-4901"></label>
                <p class="nota costo-total" aria-live="polite"></p>
                <button class="boton boton--ancho" type="submit"><i class="ti ti-check"></i> Anotar y empezar a despostar</button>
            </form>`;
        const f = cont.querySelector("form");
        const total = () => {
            const g = aGramos(f.kg.value);
            const c = Number(f.costo.value);
            f.querySelector(".costo-total").innerHTML = Number.isInteger(g) && g > 0 && Number.isInteger(c) && c > 0 && c <= TOPES.costo ? `Costo total: <b>${esc(pesos((g * c) / 1000))}</b>` : "";
        };
        f.kg.addEventListener("input", total);
        f.costo.addEventListener("input", total);
        cont.querySelectorAll("[data-tipo]").forEach((b) => b.addEventListener("click", () => {
            tipo = b.dataset.tipo;
            pintar();
        }));
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const d = datos.ingresar(usuario, { tipo, proveedorId: f.proveedor.value, tropa: f.tropa.value, kg: f.kg.value, costoKg: f.costo.value === "" ? NaN : Number(f.costo.value) });
                aviso(`${d.tipoNombre} anotada: a despostar`);
                location.hash = `#/desposte/${d.id}`;
            } catch (err) {
                aviso(err, "error");
            }
        });
    }
    pintar();
}

/** Un desposte: pesar, ver la merma, terminar y (el dueño) los costos reales y los precios sugeridos. */
export function vistaDesposte(cont, opciones, recien = null) {
    const { usuario, datos, irA, params: [id] } = opciones;
    const d = datos.desposte(id);
    const dueno = usuario.rol === "dueno";
    const abierto = d.estado === "abierto";
    const otraVez = (r = null, foco = null) => {
        vistaDesposte(cont, opciones, r);
        if (foco) cont.querySelector(`[data-clave="${CSS.escape(foco)}"]`)?.focus();
    };
    const t = TIPOS_INGRESO[d.tipo];
    const filas = d.filas;
    const sinPesar = filas.filter((f) => f.gramos === null);

    // Las zonas de la vaca: pesadas, con algo que dio de menos, o sin pesar
    const estados = {};
    if (d.animal === "vaca") {
        for (const z of ZONAS) {
            const suyas = filas.filter((f) => z.cortes.includes(f.nombre));
            if (!suyas.length) continue;
            estados[z.id] = suyas.some((f) => f.menos) ? "menos" : suyas.every((f) => f.gramos !== null) ? "hecho" : "falta";
        }
    }

    const fila = (f) => `
        <li class="fila-desposte${f.menos ? " fila-desposte--menos" : ""}${f.gramos === null ? " fila-desposte--falta" : ""}">
            <span class="fila-desposte__nombre">${esc(f.nombre)}<small>esperado ${esc(kilos(f.esperadoG, 1))} · ${esc(unDecimal(f.rinde))}</small></span>
            ${abierto ? `<label class="pesaje"><span class="solo-lector">Peso de ${esc(f.nombre)} (kg)</span>${campoKg({ nombre: "kg", valor: kgEnCampo(f.gramos), placeholder: kgEnCampo(Math.round(f.esperadoG / 100) * 100) })}<input type="hidden" data-para="${esc(f.articuloId)}"></label>`
                : `<span class="pesaje pesaje--hecho">${esc(kilos(f.gramos))}</span>`}
            <span class="fila-desposte__dif">${f.dif === null ? "" : `<span class="pastilla pastilla--${f.menos ? "mal" : f.dif < 0 ? "ojo" : "bien"}">${esc(porcentaje(f.dif))}</span>`}</span>
        </li>`;
    const filaMerma = (clave, nombre, gramos, esperadoPct) => `
        <li class="fila-desposte fila-desposte--merma${gramos === null ? " fila-desposte--falta" : ""}">
            <span class="fila-desposte__nombre">${esc(nombre)}<small>merma · esperado ${esc(kilos((d.ingresoG * esperadoPct) / 100, 1))} · ${esc(unDecimal(esperadoPct))}</small></span>
            ${abierto ? `<label class="pesaje"><span class="solo-lector">${esc(nombre)} (kg)</span>${campoKg({ nombre: "kg", valor: kgEnCampo(gramos), placeholder: kgEnCampo(Math.round((d.ingresoG * esperadoPct) / 1000) * 10) })}<input type="hidden" data-para="${esc(clave)}"></label>`
                : `<span class="pesaje pesaje--hecho">${esc(kilos(gramos ?? 0))}</span>`}
            <span class="fila-desposte__dif"></span>
        </li>`;

    const r = d.resultado;
    const sugeridos = !abierto && dueno ? datos.verSugeridos(d.id) : [];
    const cambian = sugeridos.filter((s) => s.antes !== s.despues);
    const ultimo = datos.ultimoCambio();
    const yaAplicado = ultimo?.tipo === "desposte" && ultimo.desposteId === d.id;
    const picadas = filas.filter((f) => /^Picada/.test(f.nombre) && f.gramos);

    cont.innerHTML = `
        <a class="volver" href="#/desposte"><i class="ti ti-arrow-left"></i> Desposte</a>
        <div class="titulo-con-accion">
            <h1 class="titulo">N° ${esc(d.numero)} · ${esc(d.tipoNombre)}</h1>
            ${abierto ? `<span class="pastilla pastilla--ojo"><i class="ti ti-scale" aria-hidden="true"></i>Despostando</span>` : `<span class="pastilla pastilla--bien"><i class="ti ti-circle-check" aria-hidden="true"></i>Terminado</span>`}
        </div>
        <p class="tarjeta__quien">${esc(d.proveedor)} · tropa ${esc(d.tropa)} · entró ${esc(cuando(d.fecha))} · <b>${esc(kilos(d.ingresoG, 1))}</b>${dueno ? ` a ${esc(pesos(d.costoKg))}/kg (${esc(pesos(d.costoTotal))})` : ""}</p>
        ${recien === "terminado" ? `
        <div class="hecho">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <h2 class="titulo">Desposte terminado</h2>
            <p>Los kilos de cada corte pasaron al stock${dueno ? " y cada corte tiene su costo real" : ""}.</p>
        </div>` : ""}
        ${abierto && sinPesar.length && sinPesar.length <= 3 ? `<p class="nota pista"><i class="ti ti-hand-finger"></i> ${d.despostadoPor && d.despostadoPor !== usuario.nombre ? `${esc(d.despostadoPor)} ya pesó casi todo. ` : ""}Falta: ${esc(sinPesar.map((f) => f.nombre.toLowerCase()).join(" y "))}. Escribí lo que pesó (probá con lo esperado: ${esc(sinPesar.map((f) => kgEnCampo(Math.round(f.esperadoG / 100) * 100)).join(" y "))}) y tocá Terminar.</p>` : ""}
        <div class="desposte">
            <div>
                ${d.animal === "vaca" ? `${htmlMediaRes({ estados, titulo: "Los cortes de la media res: tocá uno para pesarlo" })}
                <p class="nota leyenda"><span class="punto punto--hecho"></span> pesado <span class="punto punto--menos"></span> dio de menos <span class="punto punto--falta"></span> sin pesar</p>` : ""}
                <div class="panel avance-desposte">
                    <span class="panel__rotulo">${abierto ? "Pesado hasta ahora" : "Merma"}</span>
                    <span class="panel__numero">${abierto ? `${esc(kilos(d.pesadoG, 1))} <small>de ${esc(kilos(d.ingresoG, 1))}</small>` : esc(unDecimal(d.merma))}</span>
                    ${abierto ? `<span class="barra-avance" aria-hidden="true"><span style="width:${Math.min(100, Math.round((d.pesadoG / d.ingresoG) * 100))}%"></span></span>
                    <small>${d.faltan ? `Falta pesar ${esc(d.faltan)} ${d.faltan === 1 ? "cosa" : "cosas"}` : "Está todo pesado: terminalo."}</small>`
                    : `<small>Esperada ${esc(unDecimal(d.esperada))} · hueso, grasa y oreo: ${esc(kilos(r.mermaG, 1))}</small>`}
                </div>
            </div>
            <div>
                <ul class="filas-desposte">
                    ${filas.map(fila).join("")}
                    ${filaMerma("hueso", t.hueso, d.hueso, t.merma.hueso)}
                    ${t.merma.grasa ? filaMerma("grasa", "Grasa", d.grasa, t.merma.grasa) : ""}
                    <li class="fila-desposte fila-desposte--merma">
                        <span class="fila-desposte__nombre">Oreo<small>lo que se secó en la cámara · esperado ${esc(unDecimal(t.merma.oreo))}</small></span>
                        <span class="pesaje pesaje--hecho">${d.completo ? esc(kilos(d.oreoG)) : "—"}</span>
                        <span class="fila-desposte__dif"></span>
                    </li>
                </ul>
                ${abierto ? `<button class="boton boton--ancho boton--grande" type="button" data-terminar${d.completo ? "" : " disabled"}><i class="ti ti-check"></i> Terminar el desposte</button>` : ""}
            </div>
        </div>
        ${!abierto ? `
        <section class="bloque resultado-desposte">
            <h2 class="subtitulo"><i class="ti ti-chart-pie-2"></i> Cómo dio</h2>
            <div class="numeros-caja">
                <div class="numero-caja"><span>Merma</span><b>${esc(unDecimal(r.merma))}</b><small>esperada ${esc(unDecimal(r.esperada))}</small></div>
                <div class="numero-caja"><span>Para vender</span><b>${esc(kilos(d.cortesG, 1))}</b><small>de ${esc(kilos(d.ingresoG, 1))}</small></div>
                <div class="numero-caja"><span>Oreo</span><b>${esc(kilos(r.oreoG, 1))}</b><small>se secó en la cámara</small></div>
                ${dueno ? `<div class="numero-caja numero-caja--ganancia"><span>Si vendés todo</span><b>${esc(pesos(r.valorVenta - r.costoTotal))}</b><small>de ganancia (${esc(pesos(r.valorVenta))} − ${esc(pesos(r.costoTotal))})</small></div>` : ""}
            </div>
            ${picadas.length ? `<p class="nota"><i class="ti ti-recycle"></i> El recorte se aprovechó: ${esc(kilos(picadas.reduce((x, f) => x + f.gramos, 0), 1))} pasaron a picada (merma que se recupera).</p>` : ""}
            ${filas.some((f) => f.menos) ? `<p class="alerta alerta--alerta"><i class="ti ti-alert-triangle"></i> Dio de menos: ${esc(filas.filter((f) => f.menos).map((f) => f.nombre).join(", "))}. Fijate el corte o pedile explicaciones al frigorífico.</p>` : ""}
            ${dueno ? `
            <h3 class="rotulo-chico">Costo real por kilo y precio sugerido (margen de cada corte)</h3>
            <p class="nota"><i class="ti ti-info-circle"></i> El costo de lo que entró (con la merma) se reparte según lo que vale cada corte: el lomo carga más que el osobuco.</p>
            <ul class="filas-stock">${sugeridos.map((s) => `
                <li class="fila-stock fila-stock--aumento">
                    <span class="fila-stock__nombre">${esc(s.nombre)}<small>costo real ${esc(pesos(s.costoReal))}/kg · margen ${esc(s.margen)} %</small></span>
                    <span class="antes">${esc(pesos(s.antes))}</span>
                    <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    <b class="despues">${esc(pesos(s.despues))}</b>
                </li>`).join("")}</ul>
            <div class="acciones-desposte"></div>` : `<p class="nota"><i class="ti ti-info-circle"></i> Los costos reales y los precios sugeridos los ve Ricardo.</p>`}
            <button class="boton boton--secundario" type="button" data-pdf><i class="ti ti-file-type-pdf"></i> Bajar el desposte en PDF</button>
        </section>` : ""}`;

    // Pesar: al salir de cada campo se guarda y se pasa al siguiente sin pesar
    cont.querySelectorAll(".pesaje input[name=kg]").forEach((campo) => {
        const clave = campo.parentElement.querySelector("[data-para]").dataset.para;
        campo.dataset.clave = clave;
        const actual = () => (clave === "hueso" ? d.hueso : clave === "grasa" ? d.grasa : filas.find((f) => f.articuloId === clave)?.gramos ?? null);
        const guardar = () => {
            const vacioCampo = campo.value.trim() === "";
            const g = vacioCampo ? null : aGramos(campo.value);
            if (g === actual()) return;
            try {
                datos.cargarPeso(usuario, d.id, clave, vacioCampo ? null : campo.value);
                const siguiente = [...cont.querySelectorAll(".pesaje input[name=kg]")].find((c) => !c.value && c !== campo);
                otraVez(null, siguiente && matchMedia("(min-width: 1000px)").matches ? siguiente.dataset.clave : null);
            } catch (err) {
                aviso(err, "error");
            }
        };
        campo.addEventListener("change", guardar);
        campo.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                guardar();
            }
        });
    });

    // Tocar la vaca lleva al corte
    activarMediaRes(cont, (z) => {
        const f = filas.find((x) => z.cortes.includes(x.nombre) && x.gramos === null) ?? filas.find((x) => z.cortes.includes(x.nombre));
        const campo = f && cont.querySelector(`[data-clave="${CSS.escape(f.articuloId)}"]`);
        const li = f && [...cont.querySelectorAll(".fila-desposte")].find((x) => x.querySelector(".fila-desposte__nombre")?.firstChild?.textContent === f.nombre);
        (campo ?? li)?.scrollIntoView({ block: "center", behavior: "smooth" });
        campo?.focus({ preventScroll: true });
        li?.classList.add("fila-desposte--marcada");
        setTimeout(() => li?.classList.remove("fila-desposte--marcada"), 1200);
    });

    cont.querySelector("[data-terminar]")?.addEventListener("click", () => {
        try {
            datos.terminarDesposte(usuario, d.id);
            aviso("Desposte terminado: los kilos pasaron al stock");
            otraVez("terminado");
            window.scrollTo(0, 0);
        } catch (err) {
            aviso(err, "error");
        }
    });

    const lugar = cont.querySelector(".acciones-desposte");
    if (lugar) {
        lugar.innerHTML = yaAplicado ? `
            <div class="alerta alerta--info ultimo-aumento">
                <i class="ti ti-trending-up"></i>
                <span><b>${esc(ultimo.cambios.length)} precios actualizados</b> con este desposte</span>
                <button class="boton boton--chico boton--secundario" type="button" data-deshacer="${esc(ultimo.id)}"><i class="ti ti-arrow-back-up"></i> Deshacer</button>
            </div>
            <a class="boton boton--ancho" href="#/pizarra"><i class="ti ti-device-tv"></i> Ver la pizarra con los precios nuevos</a>
            ${guia("u-dueno", "/caja", "Mirá la caja del día y la ganancia")}`
            : cambian.length ? `<button class="boton boton--ancho boton--grande" type="button" data-aplicar><i class="ti ti-check"></i> Aplicar los ${esc(cambian.length)} precios sugeridos</button>`
                : `<p class="nota"><i class="ti ti-circle-check"></i> Los precios ya son los sugeridos.</p>`;
        lugar.querySelector("[data-aplicar]")?.addEventListener("click", () => {
            try {
                const c = datos.aplicarSugeridos(usuario, d.id);
                aviso(`${c.cambios.length} precios actualizados: la pizarra ya está al día`);
                otraVez();
                cont.querySelector(".acciones-desposte")?.scrollIntoView({ block: "center" });
            } catch (err) {
                aviso(err, "error");
            }
        });
        lugar.querySelector("[data-deshacer]")?.addEventListener("click", (e) => {
            try {
                const c = datos.deshacerCambio(usuario, e.currentTarget.dataset.deshacer);
                aviso(`Listo: ${c.cambios.length} precios volvieron a como estaban`);
                otraVez();
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    cont.querySelector("[data-pdf]")?.addEventListener("click", async (e) => {
        const boton = e.currentTarget;
        boton.disabled = true;
        try {
            const blob = await armarPdf({
                negocio: NEGOCIO, titulo: `Desposte · ${d.tipoNombre}`, numero: String(d.numero), fecha: fechaCorta(d.fecha),
                datos: [["Proveedor", d.proveedor], ["Tropa o lote", d.tropa], ["Entró", kilos(d.ingresoG, 1)], ["Despostó", d.despostadoPor ?? "—"], ...(dueno ? [["Costo", `${pesos(d.costoKg)}/kg`]] : []), ["Merma", `${unDecimal(r.merma)} (esperada ${unDecimal(r.esperada)})`]],
                columnas: dueno ? ["Corte", "Esperado", "Pesado", "Dif.", "Costo real/kg", "Sugerido/kg"] : ["Corte", "Esperado", "Pesado", "Dif."],
                filas: [
                    ...filas.map((f) => {
                        const s = sugeridos.find((x) => x.id === f.articuloId);
                        return [f.nombre, kilos(f.esperadoG), kilos(f.gramos), f.dif === null ? "" : porcentaje(f.dif), ...(dueno ? [s ? pesos(s.costoReal) : "", s ? pesos(s.despues) : ""] : [])];
                    }),
                    [t.hueso, "", kilos(d.hueso ?? 0), "merma", ...(dueno ? ["", ""] : [])],
                    ...(t.merma.grasa ? [["Grasa", "", kilos(d.grasa ?? 0), "merma", ...(dueno ? ["", ""] : [])]] : []),
                    ["Oreo", "", kilos(r.oreoG), "merma", ...(dueno ? ["", ""] : [])]
                ],
                total: `Merma ${unDecimal(r.merma)}`,
                aviso: "Planilla interna de ejemplo · no es un documento oficial",
                pie: "Hecho con Sazzo Carnicería (demo)"
            });
            pdfListo(blob, `Desposte N° ${d.numero}`);
        } catch (err) {
            aviso(err, "error");
        } finally {
            boton.disabled = false;
        }
    });
    activarGuias(cont, irA);
}

