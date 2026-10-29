// ============================================
// Leer un código de barras (o QR) con la cámara del celular:
//   if (puedeEscanear()) … escanear((codigo) => buscar(codigo), { formatos: ["ean_13", …] });
// Usa el lector que trae el celular (Android con Chrome). Si no lo trae (iPhone, la compu), carga uno de respaldo
// (kit\escaner\: barcode-detector + zxing-wasm, licencia MIT), recién cuando se toca "Escanear": la demo no pesa más
// por tenerlo. La cámara pide permiso, se ve en una ventanita y se apaga al leer, al cerrar, al cambiar de pantalla
// o al esconder la pestaña. Nada sale del celular: la imagen no se guarda ni se manda.
// ============================================
import { aviso, esc } from "./ui.js?v=fd92d86921";
import { alSalirDeLaPantalla } from "./rutas.js?v=fd92d86921";
import { RUTA_ESCANER } from "./config.js?v=fd92d86921";
import { LEYENDA_TV } from "./leyendas.js?v=fd92d86921";

export const FORMATOS_PRODUCTOS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];
export const TOPE_CODIGO = 40; // letras: un código de producto real tiene 8 a 14
const VERSION_RESPALDO = "3.2.2";

/** ¿Hay cámara para escanear? (con el lector del celular o con el de respaldo) */
export const puedeEscanear = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

let respaldo = null; // el módulo de respaldo, una sola vez

/** El lector: el del celular si sabe esos formatos; si no, el de respaldo (se baja la primera vez). */
export async function crearLector(formatos = FORMATOS_PRODUCTOS) {
    if ("BarcodeDetector" in window) {
        try {
            const sabe = await window.BarcodeDetector.getSupportedFormats();
            const comunes = formatos.filter((f) => sabe.includes(f));
            if (comunes.length) return new window.BarcodeDetector({ formats: comunes });
        } catch {
            // sin lector propio que sirva: va el de respaldo
        }
    }
    const base = new URL(RUTA_ESCANER, location.href);
    if (!respaldo) {
        respaldo = await import(new URL(`ponyfill.js?v=${VERSION_RESPALDO}`, base).href);
        // El lector (zxing_reader.wasm) desde el propio sitio, no de otro (por defecto lo buscaría en jsdelivr)
        respaldo.setZXingModuleOverrides({ locateFile: (archivo) => new URL(archivo, base).href });
    }
    return new respaldo.BarcodeDetector({ formats: formatos });
}

/** Lo que se lee pasa limpio: solo letras, números y guiones, con tope. */
export const limpiarCodigo = (texto) => String(texto ?? "").trim().replace(/[^\w-]/g, "").slice(0, TOPE_CODIGO);

/** Abre la cámara en una ventanita y llama a alLeer(codigo) con lo primero que lea. */
export function camaraQueSeApaga(estado) {
    return () => navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((camara) => {
        if (estado.seguir()) estado.guardar(camara);
        else camara.getTracks().forEach((t) => t.stop());
        return camara;
    });
}

export async function escanear(alLeer, { formatos = FORMATOS_PRODUCTOS, texto = "Apuntá al código de barras" } = {}) {
    const capa = document.createElement("div");
    capa.className = "camara";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-label", "Escanear con la cámara");
    capa.setAttribute("aria-modal", "true");
    capa.setAttribute("aria-describedby", "camara-texto");
    capa.innerHTML = `
        <div class="camara__caja">
            <video playsinline muted aria-label="Imagen de la cámara"></video>
            <p class="camara__texto" id="camara-texto"></p>
            <p class="camara__texto camara__leyenda">${esc(LEYENDA_TV)}</p>
            <button class="boton boton--secundario" type="button"><i class="ti ti-x" aria-hidden="true"></i> Cerrar</button>
        </div>`;
    capa.querySelector(".camara__texto").textContent = texto;
    const disparador = document.activeElement;
    document.body.append(capa);
    const cerrarBoton = capa.querySelector("button");
    cerrarBoton.focus();
    capa.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            cerrar();
        } else if (e.key === "Tab") {
            e.preventDefault();
            cerrarBoton.focus();
        }
    });
    let flujo = null;
    let seguir = true;
    const pedirCamara = camaraQueSeApaga({ seguir: () => seguir, guardar: (c) => (flujo = c) });
    const cerrar = () => {
        if (!seguir) return;
        seguir = false;
        flujo?.getTracks().forEach((t) => t.stop());
        capa.remove();
        document.removeEventListener("visibilitychange", alEsconder);
        if (disparador?.isConnected) disparador.focus?.();
    };
    const alEsconder = () => {
        if (document.visibilityState === "hidden") cerrar();
    };
    document.addEventListener("visibilitychange", alEsconder);
    alSalirDeLaPantalla(cerrar);
    capa.querySelector("button").addEventListener("click", cerrar);
    try {
        const [, lector] = await Promise.all([pedirCamara(), crearLector(formatos)]);
        if (!seguir) return;
        const video = capa.querySelector("video");
        video.srcObject = flujo;
        await video.play();
        while (seguir) {
            const [leido] = await lector.detect(video);
            const codigo = limpiarCodigo(leido?.rawValue);
            if (codigo) {
                cerrar();
                alLeer(codigo);
                return;
            }
            await new Promise((r) => setTimeout(r, 250));
        }
    } catch (e) {
        const habia = seguir;
        cerrar();
        if (!habia) return;
        aviso(e?.name === "NotAllowedError" ? "Sin permiso para la cámara: escribí el código a mano." : "No se pudo usar la cámara. Escribí el código o usá el lector.", "error");
    }
}

export const FORMATOS_CAJA = ["qr_code", ...FORMATOS_PRODUCTOS];
export const ESPERA_REPETIDO = 1200;

export function nuevaLectura(ultimo, codigo, ahora, espera = ESPERA_REPETIDO) {
    if (!codigo) return { cuenta: false, ultimo };
    const repetido = ultimo?.codigo === codigo && ahora - ultimo.cuando < espera;
    return { cuenta: !repetido, ultimo: { codigo, cuando: ahora } };
}

export function escanearSeguido(video, alLeer, { formatos = FORMATOS_CAJA, alFallar } = {}) {
    let seguir = true;
    let flujo = null;
    const pedirCamara = camaraQueSeApaga({ seguir: () => seguir, guardar: (c) => (flujo = c) });
    let ultimo = null;
    const parar = () => {
        if (!seguir) return;
        seguir = false;
        flujo?.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
        document.removeEventListener("visibilitychange", alEsconder);
    };
    const alEsconder = () => {
        if (document.visibilityState === "hidden") parar();
    };
    document.addEventListener("visibilitychange", alEsconder);
    (async () => {
        try {
            const [, lector] = await Promise.all([pedirCamara(), crearLector(formatos)]);
            if (!seguir) return;
            video.srcObject = flujo;
            await video.play();
            while (seguir) {
                const [leido] = await lector.detect(video);
                const lectura = nuevaLectura(ultimo, limpiarCodigo(leido?.rawValue), Date.now());
                ultimo = lectura.ultimo;
                if (lectura.cuenta && seguir) alLeer(ultimo.codigo);
                await new Promise((r) => setTimeout(r, 200));
            }
        } catch (e) {
            const habia = seguir;
            parar();
            if (habia) alFallar?.(e);
        }
    })();
    return parar;
}
