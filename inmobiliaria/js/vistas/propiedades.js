// ============================================
// Propiedades de Sazzo Inmobiliaria: la lista (con filtros y "ver en el mapa"), la ficha (fotos, datos, la ZONA en
// el mapa, nunca la dirección; Valeria pide la visita, la inmobiliaria ve quiénes buscan algo así y baja el PDF) y
// "Cargar propiedad" (con fotos sacadas con el celu, que no se suben a ningún lado).
// ============================================
import { esc, aviso, vacio, mensajeDe, fechaCorta } from "../../kit/js/ui.js?v=54226d45fc";
import { fechaLocalISO, diaLocalDe } from "../../kit/js/fechas.js?v=54226d45fc";
import { mostrarMapa } from "../../kit/js/mapa.js?v=54226d45fc";
import { armarPdf, pdfListo } from "../../kit/js/pdf.js?v=54226d45fc";
import { TOPES, TIPOS, ZONAS, OPERACIONES, CARACTERISTICAS, RADIO_ZONA, pesos, dolares } from "../datos.js?v=54226d45fc";
import { NEGOCIO } from "../marca.js?v=54226d45fc";
import { fotosDe, achicarFoto, guardarFotosEnMemoria, revisarArchivoFoto } from "../fotos.js?v=54226d45fc";
import {
    guia, activarGuias, tarjetaPropiedad, htmlFoto, medidas, hrefPropiedad, pastillaPropiedad, pastillaVisita,
    pastillaConsulta, mostrarMensaje, mayuscula
} from "./comunes.js?v=54226d45fc";

// Lo elegido en los filtros queda mientras se navega
const filtro = { operacion: null, ambientes: null, hasta: null, mapa: false };
const TOPES_PRECIO = {
    alquiler: [400_000, 600_000, 800_000, 1_000_000],
    venta: [50_000, 100_000, 150_000, 200_000]
};

/** La zona en el mapa: el centro de la zona corrido un poquito por propiedad (para que no se encimen). Nunca la dirección. */
function puntoDe(p, i = 0) {
    const z = ZONAS[p.zona];
    const giro = (i * 2.4) % (2 * Math.PI);
    return { lat: z.lat + Math.sin(giro) * 0.0025, lng: z.lng + Math.cos(giro) * 0.0032 };
}

export function vistaPropiedades(cont, { usuario, datos }) {
    const staff = usuario.rol !== "cliente";
    if (!TOPES_PRECIO[filtro.operacion]) filtro.hasta = null;

    function pintar() {
        const lista = datos.listarPropiedades({ ...filtro, todas: staff });
        cont.querySelectorAll("[data-operacion]").forEach((b) => b.classList.toggle("activo", (b.dataset.operacion || null) === filtro.operacion));
        cont.querySelectorAll("[data-ambientes]").forEach((b) => b.classList.toggle("activo", Number(b.dataset.ambientes || 0) === (filtro.ambientes ?? 0)));
        cont.querySelectorAll("[data-ver]").forEach((b) => b.classList.toggle("activo", (b.dataset.ver === "mapa") === filtro.mapa));
        const hasta = cont.querySelector("[data-hasta]");
        hasta.hidden = !filtro.operacion;
        hasta.innerHTML = filtro.operacion ? `<option value="">Cualquier precio</option>${TOPES_PRECIO[filtro.operacion].map((n) => `
            <option value="${n}"${filtro.hasta === n ? " selected" : ""}>Hasta ${esc(filtro.operacion === "venta" ? dolares(n) : pesos(n))}</option>`).join("")}` : "";
        const lugar = cont.querySelector(".resultados");
        cont.querySelector(".cuantas").textContent = lista.length === 1 ? "1 propiedad" : `${lista.length} propiedades`;
        if (!lista.length) {
            lugar.innerHTML = vacio("No hay propiedades con esos filtros. Probá sacando alguno.", "ti-mood-empty");
            return;
        }
        if (filtro.mapa) {
            lugar.innerHTML = `<div class="mapa" role="region" aria-label="Mapa con las zonas de las propiedades"></div>
                <p class="nota"><i class="ti ti-map-pin"></i><span>Cada punto es la zona de una propiedad, no su dirección: la dirección exacta se pasa al confirmar la visita.</span></p>`;
            const mapa = lugar.querySelector(".mapa");
            mostrarMapa(mapa, lista.map((p, i) => ({
                ...puntoDe(p, i), titulo: p.titulo, texto: `${p.precioTexto} · ${p.zonaNombre}`,
                color: p.operacion === "venta" ? "#d97706" : "#7c3aed", link: hrefPropiedad(usuario, p.id).replace(/&#x2F;|&#47;/g, "/")
            })), { zoomMaximo: 14 }).then((m) => {
                if (!m && mapa.isConnected) mapa.outerHTML = vacio("No se pudo cargar el mapa. Probá de nuevo con mejor señal.", "ti-map-off");
            });
            return;
        }
        lugar.innerHTML = `<ul class="props">${lista.map((p) => tarjetaPropiedad(p, usuario, staff ? extraStaff(p) : "")).join("")}</ul>`;
    }

    const extraStaff = (p) => `<span class="prop__extra">${p.estado !== "disponible" ? pastillaPropiedad(p) : ""}${p.diasSinVisitas > 30 && p.estado === "disponible" ? `<span class="pastilla pastilla--ojo">${esc(p.diasSinVisitas)} días sin visitas</span>` : `<small>${esc(p.visitas30)} visita${p.visitas30 === 1 ? "" : "s"} en 30 días</small>`}</span>`;

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">${staff ? "Propiedades" : "Encontrá tu lugar"}</h1>
            ${staff ? `<a class="boton" href="#/propiedades/nueva"><i class="ti ti-plus"></i> Cargar propiedad</a>` : `<span class="negocio"><i class="ti ti-key" aria-hidden="true"></i>${esc(NEGOCIO)}</span>`}
        </div>
        ${staff ? "" : `<p class="nota pista"><i class="ti ti-hand-finger"></i><span>Probá: tocá <b>Alquiler</b> y <b>2+ ambientes</b>, abrí el depto con balcón y pedí una visita.</span></p>`}
        <div class="filtros-props">
            <div class="chips" role="group" aria-label="Operación">
                <button class="chip" type="button" data-operacion="">Todas</button>
                <button class="chip" type="button" data-operacion="alquiler">Alquiler</button>
                <button class="chip" type="button" data-operacion="venta">Venta</button>
            </div>
            <div class="chips" role="group" aria-label="Ambientes">
                <button class="chip" type="button" data-ambientes="">Todos</button>
                ${[1, 2, 3, 4].map((n) => `<button class="chip" type="button" data-ambientes="${n}">${n}+ amb</button>`).join("")}
            </div>
            <div class="filtros-props__fila">
                <select class="selector" data-hasta aria-label="Hasta qué precio" hidden></select>
                <span class="cuantas" aria-live="polite"></span>
                <div class="chips chips--vista" role="group" aria-label="Ver">
                    <button class="chip" type="button" data-ver="lista"><i class="ti ti-list" aria-hidden="true"></i> Lista</button>
                    <button class="chip" type="button" data-ver="mapa"><i class="ti ti-map" aria-hidden="true"></i> Mapa</button>
                </div>
            </div>
        </div>
        <div class="resultados"></div>`;
    cont.querySelectorAll("[data-operacion]").forEach((b) => b.addEventListener("click", () => {
        filtro.operacion = b.dataset.operacion || null;
        filtro.hasta = null;
        pintar();
    }));
    cont.querySelectorAll("[data-ambientes]").forEach((b) => b.addEventListener("click", () => {
        filtro.ambientes = Number(b.dataset.ambientes) || null;
        pintar();
    }));
    cont.querySelectorAll("[data-ver]").forEach((b) => b.addEventListener("click", () => {
        filtro.mapa = b.dataset.ver === "mapa";
        pintar();
    }));
    cont.querySelector("[data-hasta]").addEventListener("change", (e) => {
        filtro.hasta = Number(e.target.value) || null;
        pintar();
    });
    pintar();
}

// ---------- Ficha ----------

/** La ficha de la propiedad en PDF (con "DEMO · datos inventados" cruzado, del kit). */
export async function pdfFicha(p) {
    const datosPdf = [
        ["Operación", OPERACIONES[p.operacion]],
        ["Precio", p.precioTexto],
        ["Zona (aproximada)", p.zonaNombre],
        ["Tipo", p.tipoTexto],
        ["Superficie", `${p.m2.toLocaleString("es-AR")} m²`],
        ["Ambientes", String(p.ambientes)]
    ];
    if (p.dormitorios) datosPdf.push(["Dormitorios", String(p.dormitorios)]);
    if (p.banos) datosPdf.push(["Baños", String(p.banos)]);
    datosPdf.push(["Expensas", p.expensas ? pesos(p.expensas) : "Sin expensas"]);
    const blob = await armarPdf({
        negocio: NEGOCIO,
        pie: "Hecho con Sazzo Inmobiliaria (demo)",
        titulo: "Ficha",
        fecha: fechaCorta(fechaLocalISO(0)),
        datos: datosPdf,
        texto: `${p.titulo}\n\n${p.descripcion || ""}${p.caracteristicas.length ? `\n\nTiene: ${p.caracteristicas.join(", ")}.` : ""}\n\nLa dirección exacta se pasa al confirmar la visita.`,
        aviso: "Ficha informativa: precio y condiciones sujetos a cambios"
    });
    pdfListo(blob, `Ficha ${p.titulo} ${NEGOCIO}`);
}

export async function bajarFicha(boton, p) {
    boton.disabled = true;
    try {
        await pdfFicha(p);
    } catch (e) {
        console.warn(e);
        aviso("No se pudo armar el PDF. Probá de nuevo con mejor señal.", "error");
    } finally {
        boton.disabled = false;
    }
}

/** La galería: fotos que se deslizan con el dedo (sin librerías) y los puntitos de abajo. */
function htmlGaleria(p) {
    const fotos = fotosDe(p);
    if (fotos.length < 2) return `<div class="galeria galeria--una">${htmlFoto(p, { clase: "foto--grande", carga: "eager" })}</div>`;
    return `
        <div class="galeria" aria-roledescription="carrusel" aria-label="Fotos de ${esc(p.titulo)}">
            <div class="galeria__tira" tabindex="0">
                ${fotos.map((_, n) => `<div class="galeria__foto" role="group" aria-label="Foto ${n + 1} de ${fotos.length}">${htmlFoto(p, { n, clase: "foto--grande", carga: n ? "lazy" : "eager" })}</div>`).join("")}
            </div>
            <div class="galeria__puntos" aria-hidden="true">${fotos.map((_, n) => `<span${n ? "" : ' class="activo"'}></span>`).join("")}</div>
            <span class="galeria__cuantas"><i class="ti ti-photo" aria-hidden="true"></i> ${fotos.length}</span>
        </div>`;
}

function activarGaleria(cont) {
    const tira = cont.querySelector(".galeria__tira");
    if (!tira) return;
    const puntos = [...cont.querySelectorAll(".galeria__puntos span")];
    tira.addEventListener("scroll", () => {
        const n = Math.round(tira.scrollLeft / Math.max(1, tira.clientWidth));
        puntos.forEach((s, i) => s.classList.toggle("activo", i === n));
    }, { passive: true });
}

/** El mapa de la zona se baja recién cuando está por verse (así la ficha abre rápido). */
function mapaCuandoSeVea(lugar, p) {
    const cargar = () => mostrarMapa(lugar, [{ ...puntoDe(p), titulo: `Zona: ${p.zonaNombre}`, texto: `Aproximada (unos ${RADIO_ZONA} m)`, color: "#7c3aed" }], { zoomMaximo: 14 })
        .then((m) => {
            if (!m && lugar.isConnected) lugar.outerHTML = vacio("No se pudo cargar el mapa. Probá de nuevo con mejor señal.", "ti-map-off");
        });
    if (!("IntersectionObserver" in window)) return cargar();
    const ojo = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
            ojo.disconnect();
            cargar();
        }
    }, { rootMargin: "200px" });
    ojo.observe(lugar);
}

export function vistaFicha(cont, { usuario, datos, params: [id], irA }) {
    const p = datos.propiedad(id);
    const staff = usuario.rol !== "cliente";
    const mia = staff ? null : datos.misVisitas(usuario).vienen.find((v) => v.propiedadId === p.id);
    const buscan = staff ? datos.quienesBuscan(p.id) : [];
    const visitas = staff ? datos.listarConsultas().flatMap((c) => c.visitas).filter((v) => v.propiedadId === p.id) : [];
    const proximas = visitas.filter((v) => ["pedida", "confirmada"].includes(v.estado) && !v.empezo);

    cont.innerHTML = `
        <a class="volver" href="${staff ? "#/propiedades" : "#/inicio"}"><i class="ti ti-arrow-left"></i> ${staff ? "Propiedades" : "Todas las propiedades"}</a>
        <div class="ficha">
            <div class="ficha__fotos">
                ${htmlGaleria(p)}
                ${fotosDe(p).length ? "" : `<p class="nota"><i class="ti ti-photo"></i><span>Esta propiedad todavía no tiene fotos: en la versión real van las tuyas.</span></p>`}
            </div>
            <div class="ficha__datos">
                <p class="ficha__operacion"><span class="prop__operacion prop__operacion--${esc(p.operacion)}">${esc(OPERACIONES[p.operacion])}</span>${staff ? pastillaPropiedad(p) : ""}</p>
                <h1 class="titulo ficha__titulo">${esc(p.titulo)}</h1>
                <p class="ficha__precio">${esc(p.precioTexto)}</p>
                <p class="ficha__zona"><i class="ti ti-map-pin" aria-hidden="true"></i> ${esc(p.zonaNombre)} · ${esc(medidas(p))}${p.operacion === "alquiler" || p.expensas ? ` · ${esc(p.expensasTexto)}` : ""}</p>
                ${p.caracteristicas.length ? `<ul class="caracteristicas">${p.caracteristicas.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
                ${p.descripcion ? `<p class="ficha__descripcion">${esc(p.descripcion)}</p>` : ""}
                ${staff ? accionesStaff() : accionesCliente()}
            </div>
        </div>
        <section class="bloque zona" aria-labelledby="t-zona">
            <h2 class="subtitulo" id="t-zona"><i class="ti ti-map"></i> La zona</h2>
            <div class="mapa mapa--zona" role="region" aria-label="Mapa de la zona"></div>
            <p class="nota"><i class="ti ti-lock"></i><span>Se muestra la zona, no la dirección: la dirección exacta se pasa al confirmar la visita.</span></p>
        </section>
        ${staff ? `
        <section class="bloque" aria-labelledby="t-buscan">
            <h2 class="subtitulo" id="t-buscan"><i class="ti ti-users"></i> Quiénes buscan algo así <span class="contador">${esc(buscan.length)}</span></h2>
            ${buscan.length ? `<ul class="tarjetas">${buscan.map((c) => `
                <li class="tarjeta tarjeta--chica">
                    <div class="tarjeta__fila">
                        <a class="tarjeta__titulo" href="#/consultas/${esc(c.id)}"><i class="ti ${esc(c.origenIcono)}" aria-hidden="true"></i>${esc(c.nombre)}</a>
                        ${pastillaConsulta(c)}
                    </div>
                    <p class="tarjeta__quien">${esc(c.buscaTexto)}</p>
                    <div class="tarjeta__pie"><small>${c.propiedad ? `Preguntó por: ${esc(c.propiedad)}` : esc(c.origenTexto)}</small>
                        <button class="boton boton--chico" type="button" data-escribir="${esc(c.id)}"><i class="ti ti-send"></i> Ofrecérsela</button></div>
                </li>`).join("")}</ul>` : `<p class="nota"><i class="ti ti-info-circle"></i><span>Ninguna consulta abierta busca algo así por ahora.</span></p>`}
        </section>
        <section class="bloque" aria-labelledby="t-visitas">
            <h2 class="subtitulo" id="t-visitas"><i class="ti ti-calendar-event"></i> Visitas</h2>
            <p class="tira"><span><b>${esc(p.visitas30)}</b> en los últimos 30 días</span><span>Última: <b>${p.ultimaVisita ? esc(fechaCorta(p.ultimaVisita)) : "nunca"}</b></span><span>Por venir: <b>${esc(proximas.length)}</b></span></p>
            ${p.diasSinVisitas > 30 && p.estado === "disponible" ? `<p class="alerta"><i class="ti ti-alert-triangle"></i> Hace ${esc(p.diasSinVisitas)} días que nadie la visita: ¿bajamos el precio o cambiamos las fotos?</p>` : ""}
            ${proximas.length ? `<ul class="tarjetas">${proximas.map((v) => `
                <li class="tarjeta tarjeta--chica"><div class="tarjeta__fila"><span><b>${esc(mayuscula(v.fechaNombre))} ${esc(v.hora)}</b> · ${esc(v.quien)} · con ${esc(v.agente)}</span>${pastillaVisita(v)}</div></li>`).join("")}</ul>` : ""}
        </section>` : ""}`;

    function accionesCliente() {
        if (p.estado !== "disponible") return `<p class="alerta"><i class="ti ti-info-circle"></i> Esta propiedad ya no está disponible.</p>`;
        if (mia) {
            return `<div class="bloque ya-pedida">
                <p><i class="ti ti-calendar-check" aria-hidden="true"></i> Ya pediste visita: <b>${esc(mia.fechaNombre)} ${esc(mia.hora)}</b> con ${esc(mia.agente)} ${pastillaVisita(mia)}</p>
                <a class="boton boton--secundario boton--ancho" href="#/mis-visitas"><i class="ti ti-calendar-event"></i> Mis visitas</a>
            </div>`;
        }
        return `<a class="boton boton--ancho boton--grande" href="#/visita/${esc(p.id)}"><i class="ti ti-calendar-plus"></i> Pedir visita</a>
            <p class="nota"><i class="ti ti-clock"></i><span>Elegís día y hora; te confirman por WhatsApp.</span></p>`;
    }

    function accionesStaff() {
        const cambios = p.estado === "disponible"
            ? `<button class="boton boton--secundario boton--chico" type="button" data-estado="reservada"><i class="ti ti-lock"></i> Reservada</button>
               <button class="boton boton--secundario boton--chico" type="button" data-estado="${p.operacion === "venta" ? "vendida" : "alquilada"}"><i class="ti ti-check"></i> ${p.operacion === "venta" ? "Vendida" : "Alquilada"}</button>`
            : `<button class="boton boton--secundario boton--chico" type="button" data-estado="disponible"><i class="ti ti-repeat"></i> Volver a publicarla</button>`;
        return `<div class="acciones">
            <button class="boton" type="button" data-pdf><i class="ti ti-file-type-pdf"></i> Ficha en PDF</button>
            ${cambios}
        </div>
        <p class="nota"><i class="ti ti-user"></i><span>La lleva ${esc(p.agente)} · publicada el ${esc(fechaCorta(diaLocalDe(p.publicada)))}</span></p>`;
    }

    activarGaleria(cont);
    activarGuias(cont, irA);
    mapaCuandoSeVea(cont.querySelector(".mapa--zona"), p);
    const pdf = cont.querySelector("[data-pdf]");
    pdf?.addEventListener("click", () => bajarFicha(pdf, p));
    cont.querySelectorAll("[data-estado]").forEach((b) => b.addEventListener("click", () => {
        try {
            datos.cambiarEstadoPropiedad(usuario, p.id, b.dataset.estado);
            aviso(b.dataset.estado === "disponible" ? "Publicada de nuevo" : `Marcada ${b.dataset.estado}`);
            vistaFicha(cont, { usuario, datos, params: [id], irA });
        } catch (e) {
            aviso(e, "error");
        }
    }));
    cont.querySelectorAll("[data-escribir]").forEach((b) => b.addEventListener("click", () => {
        try {
            mostrarMensaje(`Ofrecerle la propiedad`, datos.mensajeCoincidencia(usuario, b.dataset.escribir, p.id), {
                alCopiar: () => datos.marcarContacto(usuario, b.dataset.escribir)
            });
        } catch (e) {
            aviso(e, "error");
        }
    }));
}

// ---------- Cargar propiedad ----------

export function vistaNuevaPropiedad(cont, { usuario, datos }) {
    let fotos = []; // direcciones locales de las fotos achicadas (no se suben)
    cont.innerHTML = `
        <a class="volver" href="#/propiedades"><i class="ti ti-arrow-left"></i> Propiedades</a>
        <h1 class="titulo">Cargar propiedad</h1>
        <form class="formulario bloque" novalidate>
            <label>Título<input name="titulo" type="text" maxlength="${TOPES.titulo}" required placeholder="Ej: Depto 2 ambientes con balcón" autocomplete="off"></label>
            <div class="formulario__fila">
                <label>Operación<select name="operacion">${Object.entries(OPERACIONES).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select></label>
                <label>Tipo<select name="tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${esc(k)}">${esc(v.texto)}</option>`).join("")}</select></label>
            </div>
            <label>Zona<select name="zona">${Object.entries(ZONAS).map(([k, z]) => `<option value="${esc(k)}">${esc(z.nombre)}</option>`).join("")}</select></label>
            <p class="nota"><i class="ti ti-lock"></i><span>Se carga la zona, no la dirección: en la página se ve un círculo en el mapa.</span></p>
            <div class="formulario__fila formulario__fila--tres">
                <label>Ambientes<input name="ambientes" type="number" inputmode="numeric" min="1" max="${TOPES.ambientes}" step="1" value="2"></label>
                <label>Dormitorios<input name="dormitorios" type="number" inputmode="numeric" min="0" max="${TOPES.ambientes}" step="1" value="1"></label>
                <label>Baños<input name="banos" type="number" inputmode="numeric" min="0" max="${TOPES.ambientes}" step="1" value="1"></label>
            </div>
            <div class="formulario__fila formulario__fila--3">
                <label>m²<input name="m2" type="number" inputmode="numeric" min="1" max="${TOPES.m2}" step="1" placeholder="50"></label>
                <label><span data-rotulo-precio>Alquiler por mes ($)</span><input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.alquiler}" step="1" placeholder="500000"></label>
                <label>Expensas ($)<input name="expensas" type="number" inputmode="numeric" min="0" max="${TOPES.expensas}" step="1" value="0"></label>
            </div>
            <fieldset class="grupo caracteristicas-elegir">
                <legend>Tiene</legend>
                ${CARACTERISTICAS.map((c) => `<label class="casilla"><input type="checkbox" name="caracteristicas" value="${esc(c)}"> ${esc(c)}</label>`).join("")}
            </fieldset>
            <label>Descripción<textarea name="descripcion" rows="3" maxlength="${TOPES.descripcion}" placeholder="Lo que la hace especial"></textarea></label>
            <div class="fotos-nuevas">
                <p class="rotulo-chico">Fotos (hasta ${TOPES.fotos})</p>
                <div class="fotos-nuevas__lista"></div>
                <label class="boton boton--secundario fotos-nuevas__boton"><i class="ti ti-camera"></i> Sacar o elegir una foto
                    <input type="file" accept="image/*" capture="environment" hidden data-foto></label>
                <p class="nota"><i class="ti ti-lock"></i><span>Las fotos se achican en este equipo y no se suben a ningún lado: es una demo (se ven mientras la tengas abierta).</span></p>
            </div>
            <p class="formulario__error" role="alert" hidden></p>
            <button class="boton boton--ancho boton--grande" type="submit"><i class="ti ti-check"></i> Publicar</button>
        </form>`;

    const form = cont.querySelector("form");
    const error = form.querySelector(".formulario__error");
    const precio = form.elements.precio;
    form.elements.operacion.addEventListener("change", () => {
        const venta = form.elements.operacion.value === "venta";
        cont.querySelector("[data-rotulo-precio]").textContent = venta ? "Precio (US$)" : "Alquiler por mes ($)";
        precio.max = venta ? TOPES.venta : TOPES.alquiler;
        precio.placeholder = venta ? "80000" : "500000";
    });

    const pintarFotos = () => {
        cont.querySelector(".fotos-nuevas__lista").innerHTML = fotos.map((url, i) => `
            <span class="foto-nueva"><img src="${esc(url)}" alt="Foto ${i + 1}"><button class="boton-icono" type="button" data-sacar="${i}" aria-label="Sacar la foto ${i + 1}"><i class="ti ti-x"></i></button></span>`).join("");
        cont.querySelector(".fotos-nuevas__boton").hidden = fotos.length >= TOPES.fotos;
        cont.querySelectorAll("[data-sacar]").forEach((b) => b.addEventListener("click", () => {
            URL.revokeObjectURL(fotos[Number(b.dataset.sacar)]);
            fotos.splice(Number(b.dataset.sacar), 1);
            pintarFotos();
        }));
    };
    cont.querySelector("[data-foto]").addEventListener("change", async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = "";
        const problema = revisarArchivoFoto(archivo);
        if (problema) return aviso(problema, "error");
        if (fotos.length >= TOPES.fotos) return aviso(`Hasta ${TOPES.fotos} fotos en la demo.`, "error");
        try {
            fotos.push(await achicarFoto(archivo));
            pintarFotos();
        } catch (err) {
            aviso(err, "error");
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const numero = (k) => (f.get(k) === "" ? NaN : Number(f.get(k)));
        try {
            const p = datos.cargarPropiedad(usuario, {
                titulo: f.get("titulo"), tipo: f.get("tipo"), operacion: f.get("operacion"), zona: f.get("zona"),
                ambientes: numero("ambientes"), dormitorios: numero("dormitorios"), banos: numero("banos"),
                m2: numero("m2"), precio: numero("precio"), expensas: numero("expensas"),
                caracteristicas: f.getAll("caracteristicas"), descripcion: f.get("descripcion")
            });
            guardarFotosEnMemoria(p.id, fotos);
            aviso("Propiedad publicada");
            location.hash = `#/propiedades/${p.id}`;
        } catch (err) {
            error.textContent = mensajeDe(err);
            error.hidden = false;
            error.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    });
}
