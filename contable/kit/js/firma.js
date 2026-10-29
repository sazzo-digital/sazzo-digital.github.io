// ============================================
// Firma en pantalla: el cliente firma con el dedo (o el mouse) y queda una imagen para el PDF o la hoja impresa.
//   const firma = await pedirFirma({ titulo: "Firma del cliente", texto: "Acepto el presupuesto N° 104" });
//   → "data:image/png;base64,…" o null si cerró sin firmar
// La firma es tinta oscura sobre blanco (como un papel), en el modo claro y en el oscuro. Queda solo en la memoria
// de la pantalla: no se guarda. Librería: signature_pad (kit\libs\, MIT), se baja al abrir la ventanita.
// ============================================
import { esc, aviso } from "./ui.js?v=a9e9b17545";
import { alSalirDeLaPantalla } from "./rutas.js?v=a9e9b17545";
import { cargarLibreria } from "./archivos.js?v=a9e9b17545";

export const TOPE_FIRMA = 400 * 1024; // letras de la imagen (una firma normal ocupa entre 10 y 60 KB)

/** ¿Es una firma que armó pedirFirma? (para no meter cualquier cosa en un PDF o un <img>) */
export const esFirma = (dato) => typeof dato === "string" && dato.length <= TOPE_FIRMA && /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(dato);

export function firmaDeEjemplo() {
    const lienzo = document.createElement("canvas");
    lienzo.width = 480;
    lienzo.height = 160;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 480, 160);
    ctx.fillStyle = "#14213d";
    ctx.font = "italic 44px cursive";
    ctx.textBaseline = "middle";
    ctx.fillText("Firma de ejemplo", 24, 80);
    return lienzo.toDataURL("image/png");
}

export function pedirFirma({ titulo = "Firma", texto = "" } = {}) {
    return new Promise((resolver) => {
        document.querySelector("dialog.firma")?.remove();
        const hoja = document.createElement("dialog");
        hoja.className = "hoja firma";
        hoja.setAttribute("aria-labelledby", "firma-titulo");
        hoja.innerHTML = `
            <div class="hoja__caja">
                <div class="hoja__titulos">
                    <h2 id="firma-titulo"><i class="ti ti-signature" aria-hidden="true"></i> ${esc(titulo)}</h2>
                    <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>
                ${texto ? `<p class="nota">${esc(texto)}</p>` : ""}
                <div class="firma__papel">
                    <canvas role="img" aria-label="Lugar para firmar con el dedo o el mouse" aria-describedby="firma-ayuda"></canvas>
                    <span class="firma__linea" aria-hidden="true">Firmá acá</span>
                </div>
                <div class="firma__acciones">
                    <button class="boton boton--secundario" type="button" data-borrar><i class="ti ti-eraser" aria-hidden="true"></i> Borrar</button>
                    <button class="boton" type="button" data-listo disabled><i class="ti ti-check" aria-hidden="true"></i> Listo</button>
                </div>
                <button class="boton-link" type="button" data-sin-dibujar id="firma-ayuda">Sin dibujar: aceptar con una firma de ejemplo</button>
            </div>`;
        document.body.append(hoja);
        const lienzo = hoja.querySelector("canvas");
        const listo = hoja.querySelector("[data-listo]");
        let pad = null;
        let resultado = null;
        let terminado = false;
        const cerrar = () => {
            if (terminado) return;
            terminado = true;
            pad?.off();
            removeEventListener("resize", ajustar);
            if (hoja.open) hoja.close();
            hoja.remove();
            resolver(resultado);
        };
        // El lienzo, del tamaño en pantalla por la densidad del celular (si no, la firma sale borrosa o corrida)
        function ajustar() {
            if (!pad) return;
            const datos = pad.isEmpty() ? null : pad.toData();
            const escala = Math.max(window.devicePixelRatio || 1, 1);
            lienzo.width = Math.round(lienzo.offsetWidth * escala);
            lienzo.height = Math.round(lienzo.offsetHeight * escala);
            lienzo.getContext("2d").scale(escala, escala);
            pad.clear();
            if (datos) pad.fromData(datos);
            listo.disabled = pad.isEmpty();
        }
        hoja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
        hoja.addEventListener("close", cerrar);
        hoja.querySelector("[data-borrar]").addEventListener("click", () => {
            pad?.clear();
            listo.disabled = true;
        });
        hoja.querySelector("[data-sin-dibujar]").addEventListener("click", () => {
            const imagen = firmaDeEjemplo();
            if (!esFirma(imagen)) {
                aviso("No se pudo armar la firma de ejemplo. Probá dibujándola.", "error");
                return;
            }
            resultado = imagen;
            cerrar();
        });
        listo.addEventListener("click", () => {
            if (!pad || pad.isEmpty()) return;
            const imagen = pad.toDataURL("image/png");
            if (!esFirma(imagen)) {
                aviso("La firma quedó demasiado grande: borrala y firmá de nuevo.", "error");
                return;
            }
            resultado = imagen;
            cerrar();
        });
        alSalirDeLaPantalla(cerrar);
        hoja.showModal();
        cargarLibreria("signature_pad.min.js")
            .then((SignaturePad) => {
                if (terminado) return;
                pad = new SignaturePad(lienzo, { penColor: "#14213d", backgroundColor: "#ffffff", minWidth: 0.8, maxWidth: 2.6 });
                pad.addEventListener("endStroke", () => {
                    listo.disabled = pad.isEmpty();
                });
                addEventListener("resize", ajustar);
                ajustar();
            })
            .catch(() => {
                aviso("No se pudo abrir la firma. Probá de nuevo con mejor señal.", "error");
                cerrar();
            });
    });
}
