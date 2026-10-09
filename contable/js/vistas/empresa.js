// ============================================
// Tu empresa: todo se modifica. Razón social, CUIT, condición frente al IVA, domicilio, punto de venta, logo
// (se achica en el navegador antes de guardarlo), colores (la ventanita del kit) y qué pantallas se usan.
// Lo cambian Silvina y Hernán; Patricia lo ve. Nada de esto viene del link: se escribe acá.
// ============================================
import { esc, aviso } from "../../kit/js/ui.js?v=bdb0a941ae";
import { abrirColores } from "../../kit/js/colores.js?v=bdb0a941ae";
import { TOPES, MODULOS } from "../datos.js?v=bdb0a941ae";
import { MARCA } from "../marca.js?v=bdb0a941ae";
import { formatoCuit, CONDICIONES, fechaISO } from "../reglas.js?v=bdb0a941ae";
import { logoEmpresa, condicionTexto } from "./comunes.js?v=bdb0a941ae";

const puedeCambiar = (u) => u.rol === "admin" || u.rol === "dueno";
const LADO_LOGO = 240; // px: el logo se guarda chico (pesa poco y se ve bien en la factura)

export function vistaEmpresa(cont, { usuario, datos, alCambiarModulos }) {
    const e = datos.leerEmpresa();
    const puede = puedeCambiar(usuario);
    const des = puede ? "" : " disabled";
    cont.innerHTML = `
        <h1 class="titulo">Tu empresa</h1>
        <p class="nota"><i class="ti ti-sparkles"></i> Todo se adapta: escribí el nombre de tu negocio, subí tu logo y elegí tus colores. Así salen las facturas.</p>
        ${puede ? "" : `<p class="nota"><i class="ti ti-lock"></i> Estos datos los cambian Silvina o Hernán. Vos los ves.</p>`}

        <div class="bloque vista-previa-empresa" aria-live="polite">
            <h2 class="subtitulo"><i class="ti ti-eye"></i> Así se ve en tus facturas</h2>
            <div class="cabeza-previa">${cabezaPrevia(e)}</div>
        </div>

        <form class="formulario bloque datos-empresa" novalidate>
            <h2 class="subtitulo"><i class="ti ti-building"></i> Datos</h2>
            <label>Razón social<input name="razonSocial" maxlength="${TOPES.nombre}" value="${esc(e.razonSocial)}"${des}></label>
            <label>Nombre de fantasía (opcional)<input name="fantasia" maxlength="${TOPES.fantasia}" value="${esc(e.fantasia ?? "")}"${des}></label>
            <div class="formulario__fila">
                <label>CUIT<input name="cuit" inputmode="numeric" maxlength="13" value="${esc(formatoCuit(e.cuit))}"${des}></label>
                <label>Condición frente al IVA
                    <select name="condicionIva"${des}>${["RI", "MT", "EX"].map((k) => `<option value="${k}"${k === e.condicionIva ? " selected" : ""}>${esc(CONDICIONES[k].texto)}</option>`).join("")}</select>
                </label>
            </div>
            <label>Domicilio comercial<input name="domicilio" maxlength="${TOPES.domicilio}" value="${esc(e.domicilio ?? "")}"${des}></label>
            <div class="formulario__fila formulario__fila--3">
                <label>Punto de venta<input name="puntoVenta" type="number" inputmode="numeric" min="1" max="${TOPES.puntoVenta}" step="1" value="${esc(e.puntoVenta)}"${des}></label>
                <label>Ingresos Brutos<input name="iibb" maxlength="${TOPES.iibb}" value="${esc(e.iibb ?? "")}"${des}></label>
                <label>Inicio de actividades<input name="inicioActividades" type="date" max="${esc(fechaISO(new Date()))}" value="${esc(e.inicioActividades)}"${des}></label>
            </div>
            <p class="formulario__error" role="alert" hidden></p>
            ${puede ? `<button class="boton" type="submit"><i class="ti ti-device-floppy"></i> Guardar los datos</button>` : ""}
            <p class="nota"><i class="ti ti-info-circle"></i> Si cambiás el punto de venta, la numeración de las facturas arranca de nuevo en ese punto. Si pasás a monotributo, las facturas salen C.</p>
        </form>

        <div class="bloque">
            <h2 class="subtitulo"><i class="ti ti-photo"></i> Logo y colores</h2>
            <div class="logo-acciones">
                ${logoEmpresa(e, "logo-grande")}
                ${puede ? `
                <label class="boton boton--secundario subir-logo"><i class="ti ti-upload"></i> Subir logo<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
                ${e.logo ? `<button class="boton boton--secundario" type="button" data-sacar-logo><i class="ti ti-trash"></i> Sacar</button>` : ""}` : ""}
                <button class="boton boton--secundario" type="button" data-colores><i class="ti ti-palette"></i> Elegir colores</button>
            </div>
            <p class="nota"><i class="ti ti-info-circle"></i> PNG, JPG o WEBP. Se achica solo y se guarda en este navegador.</p>
        </div>

        <div class="bloque">
            <h2 class="subtitulo"><i class="ti ti-layout-grid"></i> Qué pantallas usás</h2>
            <p class="nota"><i class="ti ti-info-circle"></i> Inicio, Facturar e IVA van siempre. Lo que apagues desaparece del menú (los datos quedan).</p>
            <div class="interruptores">
                ${Object.entries(MODULOS).map(([k, v]) => `
                <label class="interruptor"><input type="checkbox" data-modulo="${esc(k)}"${e.modulos?.[k] !== false ? " checked" : ""}${des}><span>${esc(v)}</span></label>`).join("")}
            </div>
        </div>`;

    const form = cont.querySelector(".datos-empresa");
    form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const error = form.querySelector(".formulario__error");
        error.hidden = true;
        try {
            const campos = Object.fromEntries(["razonSocial", "fantasia", "cuit", "condicionIva", "domicilio", "puntoVenta", "iibb", "inicioActividades"].map((k) => [k, form[k].value]));
            datos.actualizarEmpresa(campos, usuario);
            aviso("Datos de la empresa guardados.");
            vistaEmpresa(cont, { usuario, datos, alCambiarModulos });
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        }
    });
    // La vista previa cambia mientras se escribe (sin guardar)
    form.addEventListener("input", () => {
        const borrador = { ...e, razonSocial: form.razonSocial.value || e.razonSocial, fantasia: form.fantasia.value, domicilio: form.domicilio.value, condicionIva: form.condicionIva.value };
        cont.querySelector(".cabeza-previa").innerHTML = cabezaPrevia(borrador, form.cuit.value);
    });

    cont.querySelector(".subir-logo input")?.addEventListener("change", async (ev) => {
        const archivo = ev.target.files?.[0];
        if (!archivo) return;
        try {
            if (!/^image\/(png|jpeg|webp)$/.test(archivo.type)) throw new Error("El logo tiene que ser una imagen PNG, JPG o WEBP.");
            if (archivo.size > 15_000_000) throw new Error("La imagen es muy pesada (más de 15 MB).");
            datos.guardarLogo(await achicar(archivo), usuario);
            aviso("Logo guardado: ya sale en las facturas.");
            vistaEmpresa(cont, { usuario, datos, alCambiarModulos });
        } catch (err) {
            aviso(err, "error");
        }
    });
    cont.querySelector("[data-sacar-logo]")?.addEventListener("click", () => {
        datos.guardarLogo(null, usuario);
        vistaEmpresa(cont, { usuario, datos, alCambiarModulos });
    });
    cont.querySelector("[data-colores]").addEventListener("click", () => abrirColores(MARCA.prefijo));
    cont.querySelectorAll("[data-modulo]").forEach((c) =>
        c.addEventListener("change", () => {
            try {
                datos.cambiarModulos({ [c.dataset.modulo]: c.checked }, usuario);
                aviso(`${MODULOS[c.dataset.modulo]}: ${c.checked ? "prendida" : "apagada"}.`, "info");
                alCambiarModulos?.();
            } catch (err) {
                c.checked = !c.checked;
                aviso(err, "error");
            }
        })
    );
}

function cabezaPrevia(e, cuitEscrito) {
    return `
        <div class="factura__emisor">
            ${logoEmpresa(e, "factura__logo")}
            <div>
                <b>${esc(e.razonSocial)}</b>
                <small>${esc(e.domicilio || "")}</small>
                <small>${esc(condicionTexto(e.condicionIva))} · CUIT ${esc(cuitEscrito ?? formatoCuit(e.cuit))}</small>
            </div>
        </div>`;
}

/** Achica la imagen a LADO_LOGO px (sin deformar) y la devuelve como data:image/png o jpeg. */
function achicar(archivo) {
    return new Promise((ok, mal) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            const escala = Math.min(1, LADO_LOGO / Math.max(img.width, img.height));
            const lienzo = document.createElement("canvas");
            lienzo.width = Math.max(1, Math.round(img.width * escala));
            lienzo.height = Math.max(1, Math.round(img.height * escala));
            lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
            URL.revokeObjectURL(url);
            const png = lienzo.toDataURL("image/png");
            ok(png.length < 120_000 ? png : lienzo.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            mal(new Error("No se pudo leer la imagen."));
        };
        img.src = url;
    });
}
