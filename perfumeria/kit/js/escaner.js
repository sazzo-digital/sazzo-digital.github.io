// ============================================
// Leer un código de barras (o QR) con la cámara del celular:
//   if (puedeEscanear()) … escanear((codigo) => buscar(codigo), { formatos: ["ean_13", …] });
// Usa el lector que trae el celular (Android con Chrome). Si no lo trae (iPhone, la compu), carga uno de respaldo
// (kit\escaner\: barcode-detector + zxing-wasm, licencia MIT), recién cuando se toca "Escanear": la demo no pesa más
// por tenerlo. La cámara pide permiso, se ve en una ventanita y se apaga al leer, al cerrar, al cambiar de pantalla
// o al esconder la pestaña. Nada sale del celular: la imagen no se guarda ni se manda.
// ============================================
import { aviso } from "./ui.js?v=c135ab59e0";
import { alSalirDeLaPantalla } from "./rutas.js?v=c135ab59e0";
import { RUTA_ESCANER } from "./config.js?v=c135ab59e0";

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
export async function escanear(alLeer, { formatos = FORMATOS_PRODUCTOS, texto = "Apuntá al código de barras" } = {}) {
    const capa = document.createElement("div");
    capa.className = "camara";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-label", "Escanear con la cámara");
    capa.innerHTML = `
        <div class="camara__caja">
            <video playsinline muted></video>
            <p class="camara__texto"></p>
            <button class="boton boton--secundario" type="button"><i class="ti ti-x"></i> Cerrar</button>
        </div>`;
    capa.querySelector(".camara__texto").textContent = texto;
    document.body.append(capa);
    let flujo = null;
    let seguir = true;
    const cerrar = () => {
        if (!seguir) return;
        seguir = false;
        flujo?.getTracks().forEach((t) => t.stop());
        capa.remove();
        document.removeEventListener("visibilitychange", alEsconder);
    };
    const alEsconder = () => {
        if (document.visibilityState === "hidden") cerrar();
    };
    document.addEventListener("visibilitychange", alEsconder);
    alSalirDeLaPantalla(cerrar);
    capa.querySelector("button").addEventListener("click", cerrar);
    try {
        const [camara, lector] = await Promise.all([
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }),
            crearLector(formatos)
        ]);
        flujo = camara;
        if (!seguir) {
            camara.getTracks().forEach((t) => t.stop()); // la cerraron mientras arrancaba: que no quede prendida
            return;
        }
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
