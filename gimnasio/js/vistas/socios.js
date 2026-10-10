// ============================================
// Socios (Vane, la dueña, en la compu): los números del mes (activos, al día, vencidas, cobrado y por cobrar), los
// filtros que importan (cuota vencida, vence esta semana, avisaron que pagaron, no vienen hace +3 semanas, sin apto,
// bajas) con la acción de cada uno a mano (recordatorio, confirmar, invitar), el buscador, Excel y el alta.
// ============================================
import { esc, aviso, vacio } from "../../kit/js/ui.js?v=665396befd";
import { bajarExcel } from "../../kit/js/archivos.js?v=665396befd";
import { NEGOCIO } from "../marca.js?v=665396befd";
import { PLANES_CUOTA, HORAS, DIAS_CORTOS, ORDEN_SEMANA, TOPES, REAVISAR_DIAS, REINVITAR_DIAS, pesos, fechaCorta } from "../datos.js?v=665396befd";
import { guia, activarGuias, pastilla, pastillaCuota, cara, haceDias, mostrarMensaje } from "./comunes.js?v=665396befd";

let filtro = "pronto"; // de entrada, los que vencen esta semana: lo primero que mira la dueña
let texto = "";
let medioAlta = "efectivo";

/** ¿Se hizo hace menos de `dias` días? (para no mandar dos recordatorios o invitaciones seguidas) */
const hacePoco = (iso, dias) => !!iso && (Date.now() - new Date(iso)) / 864e5 < dias;

const FILTROS = [
    ["pronto", "Vence esta semana", "chip--alerta"],
    ["vencida", "Cuota vencida", "chip--mal"],
    ["avisaron", "Avisaron que pagaron", "chip--alerta"],
    ["no-vienen", "No vienen hace +3 semanas", "chip--alerta"],
    ["sin-apto", "Sin apto físico", "chip--alerta"],
    ["todos", "Todos", ""],
    ["bajas", "Bajas", ""]
];

const PISTA = {
    pronto: "Mandales el recordatorio armado antes de que se venza.",
    vencida: "Ya se les venció: recordatorio o, si pagan en el mostrador, \"Registrar pago\" en su ficha.",
    avisaron: "Avisaron que transfirieron: fijate en la cuenta y confirmalo.",
    "no-vienen": "Pagan, pero no vienen: son los que se dan de baja. Invitalos a volver.",
    "sin-apto": "Les falta el apto físico: anotalo cuando lo traigan."
};

export function vistaSocios(cont, opciones) {
    const { usuario, datos, consulta } = opciones;
    const pedido = consulta?.get("filtro");
    if (pedido && FILTROS.some(([k]) => k === pedido)) filtro = pedido;
    const t = datos.tablero();
    const cuantos = datos.contarFiltros();
    // El momento wow: Franco vence esta semana → recordatorio → "Mirá lo que le llega a Franco"
    const franco = datos.listarSocios({ filtro: "todos" }).find((a) => a.id === "s-franco");
    const francoDebe = franco && franco.estadoCuota !== "al-dia" && !franco.avisoPago;
    const pista = filtro === "pronto" && francoDebe && !hacePoco(franco.recordadoEn, REAVISAR_DIAS)
        ? "Probá: mandale el recordatorio a Franco. Le vence en unos días."
        : PISTA[filtro];

    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Socios</h1>
            <span class="acciones">
                <button class="boton boton--chico boton--secundario" type="button" data-excel><i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Excel</button>
                <a class="boton boton--chico" href="#/socios/nuevo"><i class="ti ti-user-plus" aria-hidden="true"></i> Socio nuevo</a>
            </span>
        </div>
        <div class="numeros-grandes">
            <div><span>Socios activos</span><b>${esc(t.activos)}</b><small>${esc(t.alDia)} con la cuota al día</small></div>
            <div class="mal"><span>Cuotas vencidas</span><b>${esc(t.vencidas)}</b><small>${esc(t.pronto)} vencen esta semana</small></div>
            <div><span>Cobrado este mes</span><b>${esc(pesos(t.cobradoMes))}</b><small>${esc(NEGOCIO)}</small></div>
            <div class="alerta"><span>Por cobrar</span><b>${esc(pesos(t.porCobrar))}</b><small>vencidas y esta semana</small></div>
        </div>
        <div class="chips filtros" role="tablist" aria-label="Filtro">
            ${FILTROS.map(([k, txt, clase]) => `<button class="chip ${clase}${filtro === k ? " activo" : ""}" type="button" role="tab" aria-selected="${filtro === k}" data-filtro="${esc(k)}">${esc(txt)} <b>${esc(cuantos[k])}</b></button>`).join("")}
        </div>
        ${pista ? `<p class="nota pista"><i class="ti ti-hand-finger" aria-hidden="true"></i><span>${esc(pista)}</span></p>` : ""}
        ${francoDebe && hacePoco(franco.recordadoEn, REAVISAR_DIAS) ? guia("u-socio", "/cuota", "Mirá lo que le llega a Franco") : ""}
        <label class="buscador">
            <i class="ti ti-search" aria-hidden="true"></i>
            <span class="solo-lector">Buscar socio</span>
            <input type="search" name="q" maxlength="40" placeholder="Buscar por nombre" value="${esc(texto)}" autocomplete="off">
        </label>
        <ul class="tarjetas lista-socios"></ul>`;

    const lista = cont.querySelector(".lista-socios");
    const otraVez = () => vistaSocios(cont, { ...opciones, consulta: null });

    function accion(a) {
        if (a.baja) return "";
        if (filtro === "avisaron" && a.avisoPago) return `<button class="boton boton--chico" type="button" data-confirmar="${esc(a.avisoPago.id)}" data-nombre="${esc(a.nombre)}"><i class="ti ti-check" aria-hidden="true"></i> Llegó: confirmar</button>`;
        if (filtro === "no-vienen") return `<button class="boton boton--chico" type="button" data-invitar="${esc(a.id)}"${hacePoco(a.invitadoEn, REINVITAR_DIAS) ? " disabled" : ""}><i class="ti ti-message-circle" aria-hidden="true"></i> ${hacePoco(a.invitadoEn, REINVITAR_DIAS) ? "Invitado" : "Invitar"}</button>`;
        if (filtro === "pronto" || filtro === "vencida") return `<button class="boton boton--chico" type="button" data-recordar="${esc(a.id)}"${hacePoco(a.recordadoEn, REAVISAR_DIAS) ? " disabled" : ""}><i class="ti ti-message-circle" aria-hidden="true"></i> ${hacePoco(a.recordadoEn, REAVISAR_DIAS) ? "Recordado" : "Recordatorio"}</button>`;
        return "";
    }

    function pintar() {
        const socios = datos.listarSocios({ filtro, texto });
        lista.innerHTML = socios.length ? socios.map((a) => `
            <li class="tarjeta tarjeta--abre${a.estadoCuota === "vencida" && !a.baja ? " tarjeta--mal" : a.estadoCuota === "pronto" && !a.baja ? " tarjeta--alerta" : ""}">
                <div class="tarjeta__fila">
                    <div class="socio-fila">
                        ${cara(a)}
                        <div class="socio-fila__que">
                            <a class="tarjeta__titulo" href="#/socios/${esc(a.id)}">${esc(a.nombreCompleto)}</a>
                            <small>${esc(a.cuota)} · ${esc(a.diasTexto)} ${esc(a.hora)} · ${esc(haceDias(a.sinVenir).toLowerCase())}</small>
                        </div>
                    </div>
                    <span class="acciones">
                        ${a.baja ? pastilla(`Baja ${fechaCorta(a.baja)}`, "suave") : a.avisoPago ? pastilla("Avisó que pagó", "alerta", "ti-bell-ringing") : pastillaCuota(a, { corta: true })}
                        ${filtro === "sin-apto" ? pastilla("Sin apto", "alerta") : ""}
                        ${accion(a)}
                    </span>
                </div>
            </li>`).join("") : `<li>${vacio(texto ? "No hay socios con ese nombre." : "Nadie en esta lista. ¡Bien!", "ti-users")}</li>`;

        lista.querySelectorAll("[data-recordar]").forEach((b) => b.addEventListener("click", () => {
            try {
                const r = datos.recordatorio(usuario, b.dataset.recordar);
                otraVez();
                mostrarMensaje(`Recordatorio para ${r.socio.nombre}`, r.mensaje);
            } catch (err) {
                aviso(err, "error");
            }
        }));
        lista.querySelectorAll("[data-invitar]").forEach((b) => b.addEventListener("click", () => {
            try {
                const r = datos.invitarVolver(usuario, b.dataset.invitar);
                pintar();
                mostrarMensaje(`Invitar a ${r.socio.nombre}`, r.mensaje);
            } catch (err) {
                aviso(err, "error");
            }
        }));
        lista.querySelectorAll("[data-confirmar]").forEach((b) => b.addEventListener("click", () => {
            try {
                const p = datos.confirmarPago(usuario, b.dataset.confirmar);
                aviso(`Confirmado: ${b.dataset.nombre} está al día hasta el ${fechaCorta(p.hasta)}. La caja del mes subió.`);
                otraVez();
            } catch (err) {
                aviso(err, "error");
            }
        }));
    }

    activarGuias(cont, opciones.irA);
    cont.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => {
        filtro = b.dataset.filtro;
        otraVez();
    }));
    cont.querySelector("[name=q]").addEventListener("input", (e) => {
        texto = e.target.value;
        pintar();
    });
    const botonExcel = cont.querySelector("[data-excel]");
    botonExcel.addEventListener("click", async () => {
        botonExcel.disabled = true;
        await bajarExcel(`Socios ${NEGOCIO}`, datos.filasSocios(), { hoja: "Socios", anchos: [24, 20, 8, 24, 22, 16, 7, 10, 14] });
        botonExcel.disabled = false;
    });
    pintar();
}

export function vistaAlta(cont, { usuario, datos }) {
    const planes = datos.listarPlanes();
    cont.innerHTML = `
        <a class="volver" href="#/inicio"><i class="ti ti-arrow-left" aria-hidden="true"></i> Socios</a>
        <h1 class="titulo">Socio nuevo</h1>
        <form class="formulario bloque alta" novalidate>
            <label>Nombre
                <input name="nombre" maxlength="${TOPES.nombre}" autocomplete="off" required placeholder="Ej: Rosa">
            </label>
            <label>Apellido
                <input name="apellido" maxlength="${TOPES.nombre}" autocomplete="off" placeholder="Ej: Ibarra">
            </label>
            <label>Objetivo (opcional)
                <input name="objetivo" maxlength="${TOPES.objetivo}" autocomplete="off" placeholder="Ej: Ponerse en forma">
            </label>
            <label>Plan de cuota
                <select name="cuota">${PLANES_CUOTA.map((c) => `<option value="${esc(c.id)}"${c.id === "3x" ? " selected" : ""}>${esc(c.texto)} · ${esc(pesos(c.monto))}</option>`).join("")}</select>
            </label>
            <label>Rutina
                <select name="plan">
                    <option value="">Solo clases (sin rutina)</option>
                    ${planes.map((p) => `<option value="${esc(p.id)}"${p.id === "principiante-3" ? " selected" : ""}>${esc(p.nombre)}</option>`).join("")}
                </select>
            </label>
            <fieldset class="grupo">
                <legend>Qué días viene</legend>
                <div class="dias-semana">${ORDEN_SEMANA.map((d) => `
                    <label><input type="checkbox" name="dias" value="${d}"${[1, 3, 5].includes(d) ? " checked" : ""}><span>${esc(DIAS_CORTOS[d])}</span></label>`).join("")}
                </div>
            </fieldset>
            <label>A qué hora
                <select name="hora">${HORAS.map((h) => `<option${h === "19:00" ? " selected" : ""}>${esc(h)}</option>`).join("")}</select>
            </label>
            <fieldset class="grupo">
                <legend>Primera cuota</legend>
                <div class="chips" role="radiogroup" aria-label="Cómo paga la primera cuota">
                    <button class="chip${medioAlta === "efectivo" ? " activo" : ""}" type="button" role="radio" aria-checked="${medioAlta === "efectivo"}" data-medio="efectivo">Efectivo</button>
                    <button class="chip${medioAlta === "transferencia" ? " activo" : ""}" type="button" role="radio" aria-checked="${medioAlta === "transferencia"}" data-medio="transferencia">Transferencia</button>
                </div>
            </fieldset>
            <p class="nota"><i class="ti ti-lock" aria-hidden="true"></i><span>Sin teléfono, mail ni documento: es una demo con datos inventados.</span></p>
            <button class="boton boton--ancho" type="submit"><i class="ti ti-user-plus" aria-hidden="true"></i> Dar de alta y cobrar el primer mes</button>
        </form>`;

    cont.querySelectorAll("[data-medio]").forEach((b) => b.addEventListener("click", () => {
        medioAlta = b.dataset.medio;
        cont.querySelectorAll("[data-medio]").forEach((x) => {
            x.classList.toggle("activo", x === b);
            x.setAttribute("aria-checked", String(x === b));
        });
    }));
    cont.querySelector(".alta").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        try {
            const a = datos.altaSocio(usuario, {
                nombre: f.nombre.value, apellido: f.apellido.value, objetivo: f.objetivo.value, cuotaId: f.cuota.value,
                planId: f.plan.value || null, dias: [...f.querySelectorAll("[name=dias]:checked")].map((x) => Number(x.value)),
                hora: f.hora.value, medio: medioAlta
            });
            aviso(`${a.nombre} ya es socio. Falta el apto físico y firmar el reglamento.`);
            location.hash = `#/socios/${a.id}`;
        } catch (err) {
            aviso(err, "error");
        }
    });
}
