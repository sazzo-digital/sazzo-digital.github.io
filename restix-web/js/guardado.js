import { crearGuardado } from "../kit/js/guardado.js?v=a22e4d6a0a";
import { aviso } from "../kit/js/ui.js?v=a22e4d6a0a";

const LISTAS = ["mesas", "cobros", "cierres", "comandas", "pedidosYa", "movimientos", "anulaciones"];
const objeto = (v) => !!v && typeof v === "object";
const texto = (v) => typeof v === "string";
const numero = (v) => Number.isFinite(v);
const renglon = (v) => objeto(v) && texto(v.id) && texto(v.itemId) && texto(v.nombre) && numero(v.precio) && numero(v.cantidad) && typeof v.enviado === "boolean";
const apertura = (v) => objeto(v) && texto(v.id) && texto(v.abiertaEn) && numero(v.personas) && texto(v.moza) && Array.isArray(v.renglones) && v.renglones.every(renglon);
const mesa = (v) => objeto(v) && texto(v.id) && texto(v.nombre) && texto(v.sector) && (v.abierta === null || apertura(v.abierta));
const itemComanda = (v) => objeto(v) && texto(v.nombre) && numero(v.cantidad);
const comanda = (v) => objeto(v) && texto(v.id) && texto(v.mesaId) && texto(v.destino) && texto(v.estado) && Array.isArray(v.items) && v.items.every(itemComanda);
const parte = (v) => objeto(v) && texto(v.medio) && numero(v.monto);
const cobro = (v) => objeto(v) && texto(v.id) && texto(v.mesa) && texto(v.en) && numero(v.total) && Array.isArray(v.partes) && v.partes.every(parte);
const pedido = (v) => objeto(v) && texto(v.id) && texto(v.cliente) && texto(v.estado) && numero(v.total) && Array.isArray(v.items) && v.items.every(itemComanda);
const cierre = (v) => objeto(v) && texto(v.id) && texto(v.hasta) && Array.isArray(v.cobrosEnHasta) && Array.isArray(v.movimientosEnHasta) && Array.isArray(v.anulacionesEnHasta);
const movimiento = (v) => objeto(v) && texto(v.id) && texto(v.en) && numero(v.monto);
const anulacion = (v) => objeto(v) && texto(v.id) && texto(v.en) && numero(v.total);
const valido = (datos) => objeto(datos) &&
    LISTAS.every((lista) => Array.isArray(datos[lista])) &&
    datos.mesas.every(mesa) && datos.comandas.every(comanda) && datos.cobros.every(cobro) && datos.pedidosYa.every(pedido) &&
    datos.cierres.every(cierre) && datos.movimientos.every(movimiento) && datos.anulaciones.every(anulacion);

function repararItems(datos) {
    if (!objeto(datos)) return false;
    let reparado = false;
    for (const lista of [datos.comandas, datos.pedidosYa]) {
        if (!Array.isArray(lista)) continue;
        for (const registro of lista) {
            if (objeto(registro) && !Array.isArray(registro.items)) {
                registro.items = [];
                reparado = true;
            }
        }
    }
    if (!Array.isArray(datos.cartaVista)) {
        datos.cartaVista = [];
        reparado = true;
    } else if (!datos.cartaVista.every(texto)) {
        datos.cartaVista = datos.cartaVista.filter(texto);
        reparado = true;
    }
    return reparado;
}

export function crearGuardadoRestix(opciones) {
    let revisar = true;
    let generados = false;
    let soloMemoria = false;
    const base = crearGuardado({ ...opciones, semilla: () => {
        generados = true;
        return opciones.semilla();
    } });
    const persistir = () => {
        soloMemoria = !base.persistir();
        return !soloMemoria;
    };
    function db() {
        let perdidos = false;
        if (revisar) {
            revisar = false;
            try {
                const texto = localStorage.getItem(base.claves.datos);
                if (texto !== null) {
                    perdidos = true;
                    const guardados = JSON.parse(texto);
                    repararItems(guardados);
                    perdidos = guardados?.version !== opciones.version || !valido(guardados);
                }
            } catch {}
        }
        const datos = base.db();
        const reparado = repararItems(datos);
        if (!valido(datos)) {
            Object.assign(datos, opciones.semilla());
            persistir();
            perdidos = true;
        } else if (reparado) {
            persistir();
        } else if (generados) {
            try {
                soloMemoria = localStorage.getItem(base.claves.datos) !== JSON.stringify(datos);
            } catch {
                soloMemoria = true;
            }
        }
        generados = false;
        if (perdidos && typeof document !== "undefined" && document.body) aviso("Los datos guardados estaban dañados o eran de otra versión. Se perdió lo guardado y se renovaron los datos de ejemplo.", "info");
        return datos;
    }
    function olvidarCache() {
        if (soloMemoria) return;
        base.olvidarCache();
        revisar = true;
    }
    function reiniciar() {
        soloMemoria = false;
        revisar = true;
        base.reiniciar();
    }
    return { ...base, db, persistir, olvidarCache, reiniciar };
}
