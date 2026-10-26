// ============================================
// Inicio de Sazzo Ferretería: distinto para cada persona.
// Osvaldo y Nahuel → Vender (en el mostrador lo primero es vender) · Marcos → pedir un presupuesto.
// ============================================
import { vistaVender } from "./vender.js?v=7879dd46ff";
import { vistaPedirPresupuesto } from "./cliente.js?v=7879dd46ff";

export function vistaInicio(cont, opciones) {
    if (opciones.usuario.rol === "cliente") return vistaPedirPresupuesto(cont, opciones);
    const nuevo = opciones.datos.novedades(opciones.usuario).find((n) => n.tipo === "nuevo");
    if (nuevo) {
        history.replaceState(null, "", `#${nuevo.ruta}`);
        dispatchEvent(new HashChangeEvent("hashchange"));
        return;
    }
    return vistaVender(cont, opciones);
}
