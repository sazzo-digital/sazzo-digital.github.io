// ============================================
// "Hoy en el gimnasio" (Mauro, el profe, en el celu o una tablet): sus alumnos de hoy por horario (quién llegó,
// quién está entrenando, quién terminó y qué día de la rutina le toca), los avisos (récords de hoy y ayer, y los que
// vienen pero hace rato que no anotan lo que hacen) y un buscador para llegar a la ficha de cualquiera de sus alumnos.
// ============================================
import { esc, vacio } from "../../kit/js/ui.js?v=9c146b12b6";
import { kilos } from "../datos.js?v=9c146b12b6";
import { NEGOCIO } from "../marca.js?v=9c146b12b6";
import { pastilla, cara } from "./comunes.js?v=9c146b12b6";

let texto = ""; // lo buscado queda mientras se navega

const ESTADO = {
    falta: ["Todavía no llegó", "suave", ""],
    falto: ["No vino", "suave", ""],
    llego: ["Llegó", "acento", "ti-hand-stop"],
    entrenando: ["Entrenando", "bien", "ti-barbell"],
    termino: ["Terminó", "bien", "ti-circle-check"]
};

function htmlAlumno(a) {
    const [txt, clase, icono] = ESTADO[a.estado];
    return `
        <li class="tarjeta tarjeta--abre${a.estado === "falta" || a.estado === "falto" ? " alumno--falta" : ""}">
            <div class="alumno">
                ${cara(a)}
                <div class="alumno__que">
                    <a class="tarjeta__titulo" href="#/socios/${esc(a.id)}">${esc(a.nombreCompleto)}</a>
                    <small>${a.dia ? `Día ${esc(a.dia.id)} · ${esc(a.dia.nombre)}` : "Viene sin día fijo"}${a.records.length ? ` · <b>récord en ${esc(a.records.map((r) => r.nombre.toLowerCase()).join(", "))}</b>` : ""}</small>
                    <span class="acciones">
                        ${pastilla(a.estado === "llego" && a.llegoA ? `Llegó ${a.llegoA}` : txt, clase, icono)}
                        ${a.estadoCuota === "vencida" ? pastilla("Cuota vencida", "mal") : ""}
                        ${a.sinApto ? pastilla("Sin apto físico", "alerta") : ""}
                    </span>
                </div>
            </div>
        </li>`;
}

export function vistaGimnasioHoy(cont, { usuario, datos }) {
    const g = datos.hoyEnElGimnasio(usuario);
    const recordFranco = g.records.find((r) => r.socioId === "s-franco" && r.fecha === datos.hoy());
    // Un aviso por socio y por día (si hizo récord en varios ejercicios, el primero y "y 2 más")
    const porSocio = new Map();
    g.records.forEach((r) => porSocio.set(`${r.socioId}|${r.fecha}`, [...(porSocio.get(`${r.socioId}|${r.fecha}`) ?? []), r]));
    const records = [...porSocio.values()];
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Hoy en el gimnasio</h1>
            <span class="negocio"><i class="ti ti-users" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota"><i class="ti ti-hand-stop" aria-hidden="true"></i><span>Llegaron <b>${esc(g.llegaron)}</b> de tus ${esc(g.total)} alumnos de hoy.</span></p>
        ${records.length || g.sinAnotar.length ? `
        <ul class="avisos-profe">
            ${records.slice(0, 4).map(([r, ...otros]) => `
            <li><a class="aviso-profe aviso-profe--record" href="#/socios/${esc(r.socioId)}">
                <i class="ti ti-trophy" aria-hidden="true"></i>
                <span><b>${esc(r.socio)}</b> hizo récord en ${esc(r.nombre)}: <b>${esc(kilos(r.peso))}</b> (antes ${esc(kilos(r.antes))})${otros.length ? ` y en ${esc(otros.length)} ${otros.length === 1 ? "ejercicio" : "ejercicios"} más` : ""} · ${esc(r.nombreFecha)}</span>
            </a></li>`).join("")}
            ${records.length > 4 ? `<li class="nota"><span>Y ${esc(records.length - 4)} ${records.length - 4 === 1 ? "alumno" : "alumnos"} más con récords de ayer y hoy.</span></li>` : ""}
            ${g.sinAnotar.map((s) => `
            <li><a class="aviso-profe aviso-profe--alerta" href="#/socios/${esc(s.socioId)}">
                <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                <span><b>${esc(s.socio)}</b> viene, pero ${s.desde ? `hace ${esc(s.desde)} días que no anota lo que hace` : "nunca anotó lo que hace"}</span>
            </a></li>`).join("")}
        </ul>` : ""}
        ${recordFranco ? `<p class="nota pista"><i class="ti ti-hand-finger" aria-hidden="true"></i><span>Probá: tocá a Franco, dejale una nota y subile la sentadilla para la próxima.</span></p>` : ""}
        ${g.horarios.length ? g.horarios.map((h) => `
        <section class="horario">
            <h2 class="horario__hora"><i class="ti ti-clock" aria-hidden="true"></i>${esc(h.hora)} <small>${esc(h.alumnos.length)} ${h.alumnos.length === 1 ? "alumno" : "alumnos"} · ${(() => {
                const n = h.alumnos.filter((a) => a.estado !== "falta" && a.estado !== "falto").length;
                return `${esc(n)} ${n === 1 ? "llegó" : "llegaron"}`;
            })()}</small></h2>
            <ul class="tarjetas">${h.alumnos.map(htmlAlumno).join("")}</ul>
        </section>`).join("") : vacio("Hoy no tenés alumnos.", "ti-users")}
        <h2 class="subtitulo"><i class="ti ti-search" aria-hidden="true"></i> Todos tus alumnos</h2>
        <label class="buscador">
            <i class="ti ti-search" aria-hidden="true"></i>
            <span class="solo-lector">Buscar alumno</span>
            <input type="search" name="q" maxlength="40" placeholder="Buscar por nombre" value="${esc(texto)}" autocomplete="off">
        </label>
        <ul class="tarjetas lista-alumnos"></ul>`;

    const lista = cont.querySelector(".lista-alumnos");
    function pintar() {
        if (!texto.trim()) {
            lista.innerHTML = "";
            return;
        }
        const alumnos = datos.listarAlumnos(usuario, texto).slice(0, 12);
        lista.innerHTML = alumnos.length ? alumnos.map((a) => `
            <li class="tarjeta tarjeta--abre tarjeta--chica">
                <div class="alumno">
                    ${cara(a)}
                    <div class="alumno__que">
                        <a class="tarjeta__titulo" href="#/socios/${esc(a.id)}">${esc(a.nombreCompleto)}</a>
                        <small>${esc(a.plan)} · ${esc(a.diasTexto)} a las ${esc(a.hora)}</small>
                    </div>
                </div>
            </li>`).join("") : `<li>${vacio("No hay alumnos con ese nombre.", "ti-users")}</li>`;
    }
    cont.querySelector("[name=q]").addEventListener("input", (e) => {
        texto = e.target.value;
        pintar();
    });
    pintar();
}
