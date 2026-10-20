import { esc, aviso } from "../../kit/js/ui.js?v=75a51fff75";
import { mantenerPantallaPrendida, ding } from "../../kit/js/celular.js?v=75a51fff75";
import { girarRuleta } from "../../kit/js/ruleta.js?v=75a51fff75";
import { TOPES, MEDIOS, PREMIOS, PROMO_DESDE, SECCIONES, ganaTirada, pesos, seccionDe } from "../datos.js?v=75a51fff75";
import { mediosParaCaja } from "../../kit/js/pagos.js?v=75a51fff75";
import { MARCA, NEGOCIO } from "../marca.js?v=75a51fff75";
import { guia, activarGuias } from "./comunes.js?v=75a51fff75";
import { htmlConsigna } from "../../kit/js/consigna.js?v=75a51fff75";
import { EVENTO_REINICIO } from "../../kit/js/guardado.js?v=75a51fff75";
import { abrirCaja, htmlMasDeLaCaja } from "../../kit/js/caja.js?v=75a51fff75";

export const ticket = new Map();
addEventListener(EVENTO_REINICIO, () => ticket.clear());

const BILLETES = [2_000, 5_000, 10_000, 20_000];
const ALIAS = "la.esquina.kiosco";
const ICONOS = { bebidas: "ti-bottle", alfajores: "ti-cookie", golosinas: "ti-candy", snacks: "ti-paper-bag", almacen: "ti-basket" };
const conIcono = (p) => {
    const seccion = seccionDe(p.nombre);
    return { ...p, seccion, icono: ICONOS[seccion] ?? "ti-package" };
};
const MEDIOS_CAJA = mediosParaCaja(MEDIOS);

export function vistaVender(cont, { usuario, datos, irA }) {
    mantenerPantallaPrendida();
    cont.innerHTML = `
        <div class="titulo-con-accion">
            <h1 class="titulo">Vender</h1>
            <span class="negocio"><i class="ti ti-building-store" aria-hidden="true"></i>${esc(NEGOCIO)}</span>
        </div>
        <div class="recorrido-caja"></div>
        <div class="cargar" hidden></div>
        <div class="lugar-caja"></div>
        ${htmlMasDeLaCaja()}`;
    const recorrido = cont.querySelector(".recorrido-caja");
    const panelCargar = cont.querySelector(".cargar");
    const esEmpleada = usuario.rol === "empleada";

    const pintarRecorrido = (v = null) => {
        if (!esEmpleada) return;
        recorrido.innerHTML = !v
            ? htmlConsigna({ paso: 1, total: 3, accion: "Sumá la gaseosa de 1,5 L y el alfajor triple de la góndola, y cobrá con $ 10.000.", resultado: "Se suma en la pantalla grande y te calcula el vuelto solo." })
            : v.medio === "fiado"
                ? htmlConsigna({ paso: 2, total: 3, accion: "Anotá un fiado.", hecho: `quedó en la libreta${v.cliente ? ` de ${v.cliente.nombre}` : ""}`, guia: guia("u-dueno", "/stock/aumento", "Pasá a Rubén: subí los precios de un proveedor") })
                : htmlConsigna({ paso: 2, total: 3, accion: "Ahora anotá un fiado: leche y pan lactal para Graciela. Al cobrar, elegí «Fiado» y su nombre.", resultado: "Queda en su libreta, con su tope." });
        activarGuias(recorrido, irA);
    };

    const totalDe = (items) => datos.armarTicket(items).total;
    const caja = abrirCaja({
        dentro: cont.querySelector(".lugar-caja"),
        ticket,
        titulo: NEGOCIO,
        prefijo: MARCA.prefijo,
        productos: () => datos.listarProductos().map(conIcono),
        gondola: () => datos.listarProductos().map(conIcono),
        secciones: SECCIONES,
        buscar: (texto) => datos.listarProductos({ texto }).slice(0, 24).map(conIcono),
        buscarCodigo: (codigo) => {
            const p = datos.porCodigo(codigo);
            return p ? conIcono(p) : null;
        },
        medios: MEDIOS_CAJA,
        billetes: BILLETES,
        alias: ALIAS,
        imagenQR: (p) => `img/qr/${encodeURIComponent(p.codigo)}.svg`,
        clientePara: {
            medios: ["fiado"],
            lista: () => datos.listarClientes().map((c) => ({ id: c.id, texto: `${c.nombre}${c.detalle ? ` (${c.detalle})` : ""} · debe ${pesos(c.deuda)}` })),
            aviso: (id, total) => {
                const t = datos.revisarTope(id, total);
                return t.pasa
                    ? `Debería ${pesos(t.despues)} y su tope es ${pesos(t.tope)}.${usuario.rol === "dueno" ? " Si cobrás igual, lo autorizás vos." : " Lo tiene que autorizar Rubén."}`
                    : `Debe ${pesos(t.deuda)} → con esto, ${pesos(t.despues)} (tope ${pesos(t.tope)}).`;
            }
        },
        cobrar: ({ items, medio, pagaCon, pagos, clienteId }) => {
            const venta = { items, medio, pagaCon, pagos, clienteId };
            if (medio === "fiado" && clienteId && usuario.rol === "dueno" && datos.revisarTope(clienteId, totalDe(items)).pasa) {
                if (!confirm("Se pasa del tope de fiado. ¿Lo autorizás igual?")) return false;
                venta.autorizarTope = true;
            }
            return datos.vender(usuario, venta);
        },
        despues: (v, lugar) => {
            ding(MARCA.prefijo);
            if (v.cliente) lugar.insertAdjacentHTML("beforeend", `<p class="nota"><i class="ti ti-notebook"></i> ${esc(v.cliente.nombre)} debe ahora ${esc(pesos(v.cliente.deuda))}.</p>`);
            if (ganaTirada(v)) {
                lugar.insertAdjacentHTML("beforeend", `<button class="boton" type="button" data-ruleta><i class="ti ti-gift"></i> ¡Ganó una tirada de la ruleta!</button><p class="premio" aria-live="polite"></p>`);
                lugar.querySelector("[data-ruleta]").addEventListener("click", async (e) => {
                    const boton = e.currentTarget;
                    const premio = await girarRuleta({ titulo: "Ruleta de premios", texto: `Promo de ${NEGOCIO}: cada compra desde ${pesos(PROMO_DESDE)} gana una tirada.`, premios: PREMIOS });
                    if (!premio || !boton.isConnected) return;
                    boton.remove();
                    lugar.querySelector(".premio").innerHTML = `<i class="ti ti-gift" aria-hidden="true"></i> Salió: <b>${esc(premio.texto)}</b>`;
                });
            }
            pintarRecorrido(v);
        },
        alEnter: (texto) => {
            if (!/^\d{4,14}$/.test(texto)) return false;
            ofrecerCargar(texto);
            return true;
        }
    });

    function ofrecerCargar(codigo) {
        panelCargar.hidden = false;
        panelCargar.innerHTML = `
            <form class="formulario bloque" novalidate>
                <h2 class="subtitulo"><i class="ti ti-barcode"></i> El código ${esc(codigo)} no está: ¿lo cargás?</h2>
                <label>Nombre<input name="nombre" maxlength="${TOPES.nombre}" placeholder="Ej: Alfajor de maicena" required></label>
                <div class="formulario__fila">
                    <label>Precio<input name="precio" type="number" inputmode="numeric" min="1" max="${TOPES.precio}" step="1" required></label>
                    <label>¿Cuántos hay?<input name="stock" type="number" inputmode="numeric" min="1" max="${TOPES.stock}" step="1" value="1"></label>
                </div>
                <div class="acciones">
                    <button class="boton" type="submit"><i class="ti ti-plus"></i> Cargar y sumar al ticket</button>
                    <button class="boton boton--secundario" type="button" data-cancelar>Cancelar</button>
                </div>
            </form>`;
        const f = panelCargar.querySelector("form");
        f.nombre.focus();
        f.querySelector("[data-cancelar]").addEventListener("click", () => (panelCargar.hidden = true));
        f.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const p = datos.cargarProducto(usuario, { nombre: f.nombre.value, codigo, precio: Number(f.precio.value), stock: Number(f.stock.value) });
                panelCargar.hidden = true;
                aviso(`${p.nombre} cargado`);
                caja.pintar();
                caja.sumar(conIcono(p));
            } catch (err) {
                aviso(err, "error");
            }
        });
    }

    pintarRecorrido();
}
