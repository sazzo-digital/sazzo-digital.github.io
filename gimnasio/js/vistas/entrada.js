import { esc, aviso } from "../../kit/js/ui.js?v=ca300ee11c";
import { puedeEscanear, escanearSeguido } from "../../kit/js/escaner.js?v=ca300ee11c";
import { pip, vibrar } from "../../kit/js/celular.js?v=ca300ee11c";
import { MARCA, NEGOCIO } from "../marca.js?v=ca300ee11c";
import { activarConsignaPersona } from "./comunes.js?v=ca300ee11c";

let pararCamara = null;

export function vistaEntrada(cont, { usuario, datos }) {
    pararCamara?.();
    pararCamara = null;
    const socios = datos.listarSocios().sort((a, b) => Number(b.id === "s-franco") - Number(a.id === "s-franco")).slice(0, 8);
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Entrada</h1>
            <span class="negocio"><i class="ti ti-door-enter" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <p class="nota"><i class="ti ti-info-circle" aria-hidden="true"></i> Cada socio muestra su QR (en su celu, "Mi QR de entrada"): se anota la llegada y ves si tiene la cuota al día.</p>
        <div class="entrada__bienvenida" aria-live="polite" hidden></div>
        ${puedeEscanear() ? `
        <button class="boton boton--grande boton--ancho" type="button" data-escanear-entrada><i class="ti ti-scan"></i> Escanear QR de socios</button>
        <div class="visor entrada__visor" hidden>
            <video playsinline muted></video>
            <span class="visor__esquinas" aria-hidden="true"></span>
            <span class="visor__linea" aria-hidden="true"></span>
            <span class="visor__estado">Buscando QR…</span>
        </div>` : ""}
        <h2 class="subtitulo"><i class="ti ti-hand-finger"></i> ¿Sin QR a mano? Tocá un socio</h2>
        <div class="entrada__socios">${socios.map((s) => `
            <button class="entrada__socio" type="button" data-socio="${esc(s.id)}"><span class="avatar">${esc((s.nombre?.[0] ?? "?") + (s.apellido?.[0] ?? ""))}</span>${esc(s.nombre)}</button>`).join("")}
        </div>`;

    activarConsignaPersona(cont, datos, usuario);
    const bienvenida = cont.querySelector(".entrada__bienvenida");
    const recibir = (codigo) => {
        try {
            const r = datos.entradaConQR(usuario, codigo);
            activarConsignaPersona(cont, datos, usuario);
            pip(MARCA.prefijo);
            vibrar(40);
            const clase = r.estadoCuota === "vencida" ? "mal" : r.estadoCuota === "pronto" ? "ojo" : "bien";
            bienvenida.hidden = false;
            bienvenida.className = `entrada__bienvenida entrada__bienvenida--${clase}`;
            bienvenida.innerHTML = `
                <i class="ti ${clase === "mal" ? "ti-alert-triangle" : "ti-circle-check"}" aria-hidden="true"></i>
                <b class="entrada__hola">¡Hola ${esc(r.socio.nombre)}!</b>
                <span>${r.dia ? `Hoy te toca ${esc(r.dia)}` : r.descansa ? "Hoy le toca descanso: viene igual" : "Viene a las clases"}${r.nueva ? "" : " · ya había llegado hoy"}</span>
                <span class="entrada__cuota">${esc(r.textoCuota ?? "")}${clase === "mal" ? " · que pase por recepción" : ""}</span>`;
        } catch (err) {
            aviso(err, "error");
        }
    };
    cont.querySelectorAll("[data-socio]").forEach((b) => b.addEventListener("click", () => recibir(b.dataset.socio)));
    const boton = cont.querySelector("[data-escanear-entrada]");
    const visor = cont.querySelector(".entrada__visor");
    boton?.addEventListener("click", () => {
        if (pararCamara) {
            pararCamara();
            pararCamara = null;
            visor.hidden = true;
            boton.innerHTML = `<i class="ti ti-scan"></i> Escanear QR de socios`;
            return;
        }
        visor.hidden = false;
        boton.innerHTML = `<i class="ti ti-camera-off"></i> Apagar la cámara`;
        pararCamara = escanearSeguido(visor.querySelector("video"), recibir, {
            formatos: ["qr_code"],
            alFallar: () => {
                pararCamara = null;
                visor.hidden = true;
                aviso("No se pudo usar la cámara: tocá el socio en la lista.", "error");
            }
        });
    });
    addEventListener("hashchange", () => {
        pararCamara?.();
        pararCamara = null;
    }, { once: true });
}
