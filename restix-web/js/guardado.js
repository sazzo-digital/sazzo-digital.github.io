import { crearGuardado } from "../kit/js/guardado.js?v=7d06fec91a";
import { aviso } from "../kit/js/ui.js?v=7d06fec91a";

const LISTAS = ["mesas", "cobros", "cierres", "comandas", "pedidosYa", "movimientos", "anulaciones"];
const valido = (datos) => datos && LISTAS.every((lista) => Array.isArray(datos[lista]));

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
                    perdidos = guardados?.version !== opciones.version || !valido(guardados);
                }
            } catch {}
        }
        const datos = base.db();
        if (!valido(datos)) {
            Object.assign(datos, opciones.semilla());
            persistir();
            perdidos = true;
        } else if (generados) {
            try {
                soloMemoria = localStorage.getItem(base.claves.datos) !== JSON.stringify(datos);
            } catch {
                soloMemoria = true;
            }
        }
        generados = false;
        for (const comanda of datos.comandas) {
            if (!Array.isArray(comanda.items)) comanda.items = [];
        }
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
