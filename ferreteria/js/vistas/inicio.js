// ============================================
// Inicio de Sazzo Ferretería: distinto para cada persona.
// Osvaldo y Nahuel → Vender (en el mostrador lo primero es vender) · Marcos → pedir un presupuesto.
// ============================================
import { vistaVender } from "./vender.js?v=f6723a2a8a";
import { vistaPedirPresupuesto } from "./cliente.js?v=f6723a2a8a";

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
