import { esc } from "./ui.js?v=464e68f222";

export const MEDIOS_PAGO = { efectivo: "Efectivo", debito: "Débito", credito: "Crédito", transferencia: "Transferencia", qr: "QR" };
export const ICONOS_PAGO = { efectivo: "ti-cash", debito: "ti-credit-card", credito: "ti-credit-card-pay", transferencia: "ti-building-bank", qr: "ti-qrcode", fiado: "ti-notebook", cuenta: "ti-user-dollar" };
export const DIVIDIDO = "dividido";

const plata = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export const mediosParaCaja = (medios) => Object.entries(medios).map(([id, texto]) => ({ id, texto, icono: ICONOS_PAGO[id] ?? "ti-cash" }));

export function revisarPagos(total, pagos, permitidos = Object.keys(MEDIOS_PAGO)) {
    if (!Array.isArray(pagos) || pagos.length !== 2) throw new Error("Para dividir el pago, elegí dos medios.");
    const limpios = pagos.map((p) => {
        if (!permitidos.includes(p?.medio)) throw new Error("Elegí cómo paga cada parte.");
        const monto = Number(p.monto);
        if (!Number.isInteger(monto) || monto <= 0) throw new Error("Cada parte tiene que ser mayor a $ 0.");
        return { medio: p.medio, monto };
    });
    if (limpios[0].medio === limpios[1].medio) throw new Error("Las dos partes tienen que ser con medios distintos.");
    if (limpios[0].monto + limpios[1].monto !== total) throw new Error(`Las dos partes tienen que sumar ${plata(total)}.`);
    return limpios;
}

export function sumarPorMedio(ventas, medios) {
    const suma = Object.fromEntries(Object.keys(medios).map((k) => [k, 0]));
    ventas.forEach((v) => {
        if (v.pagos?.length) v.pagos.forEach((p) => (suma[p.medio] = (suma[p.medio] ?? 0) + p.monto));
        else suma[v.medio] = (suma[v.medio] ?? 0) + v.total;
    });
    return suma;
}

export const textoMedio = (v, medios) => (v.pagos?.length
    ? v.pagos.map((p) => `${medios[p.medio] ?? p.medio} ${plata(p.monto)}`).join(" + ")
    : medios[v.medio] ?? (v.medio === "tarjeta" ? "Tarjeta" : String(v.medio ?? "")));

export function partesIniciales(total, medios) {
    const ids = Object.keys(medios);
    const mitad = Math.floor(total / 2);
    const primero = ids.includes("efectivo") ? "efectivo" : ids[0];
    const segundo = ids.includes("debito") ? "debito" : ids.find((id) => id !== primero);
    return [{ medio: primero, monto: mitad }, { medio: segundo, monto: total - mitad }];
}

export function htmlDosMedios(partes, medios) {
    return `<div class="dos-medios">${partes.map((x, i) => `
        <div class="dos-medios__parte">
            <select data-medio-parte="${i}" aria-label="Medio de la parte ${i + 1}">${Object.entries(medios).map(([id, texto]) => `<option value="${esc(id)}"${x.medio === id ? " selected" : ""}>${esc(texto)}</option>`).join("")}</select>
            <input data-monto-parte="${i}" type="text" inputmode="numeric" maxlength="9" value="${esc(x.monto)}" aria-label="Monto de la parte ${i + 1}">
        </div>`).join("")}</div>`;
}

export function activarDosMedios(raiz, partes, total) {
    raiz.querySelectorAll("[data-medio-parte]").forEach((sel) => sel.addEventListener("change", () => (partes[Number(sel.dataset.medioParte)].medio = sel.value)));
    raiz.querySelectorAll("[data-monto-parte]").forEach((inp) => inp.addEventListener("input", () => {
        const i = Number(inp.dataset.montoParte);
        partes[i].monto = Math.min(Number(inp.value.replace(/\D/g, "")) || 0, total);
        partes[1 - i].monto = total - partes[i].monto;
        raiz.querySelector(`[data-monto-parte="${1 - i}"]`).value = String(partes[1 - i].monto);
    }));
}
