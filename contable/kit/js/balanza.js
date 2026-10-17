export const TOPE_GRAMOS_BALANZA = 1_000_000;
export const BAUDIOS = [9600, 4800, 2400, 19200];

export const puedeConectarBalanza = () => typeof navigator !== "undefined" && "serial" in navigator;

export function leerPeso(texto) {
    const t = String(texto ?? "").slice(0, 200).replace(/,/g, ".");
    if (/-\s*\d/.test(t)) return null;
    const m = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g)?/gi)].at(-1);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const unidad = (m[2] ?? "").toLowerCase();
    const gramos = unidad === "g" || (!unidad && !m[1].includes(".")) ? Math.round(n) : Math.round(n * 1000);
    return gramos <= TOPE_GRAMOS_BALANZA ? gramos : null;
}

export async function conectarBalanza({ alPeso, alFallar = () => {}, baudios = BAUDIOS[0] } = {}) {
    if (!puedeConectarBalanza()) throw new Error("Este navegador no se conecta a balanzas: usá Chrome o Edge en la compu.");
    const puerto = await navigator.serial.requestPort();
    await puerto.open({ baudRate: BAUDIOS.includes(baudios) ? baudios : BAUDIOS[0] });
    const lector = puerto.readable.getReader();
    const escritor = puerto.writable?.getWriter();
    const pedir = setInterval(() => escritor?.write(new Uint8Array([5])).catch(() => {}), 500);
    const deco = new TextDecoder();
    let seguir = true;
    let resto = "";
    (async () => {
        try {
            while (seguir) {
                const { value, done } = await lector.read();
                if (done) break;
                resto += deco.decode(value, { stream: true });
                const lineas = resto.split(/[\r\n\u0002\u0003]+/);
                resto = lineas.pop().slice(-200);
                for (const linea of lineas) {
                    const gramos = leerPeso(linea);
                    if (gramos !== null) alPeso(gramos);
                }
            }
        } catch (err) {
            if (seguir) alFallar(err);
        }
    })();
    return async () => {
        seguir = false;
        clearInterval(pedir);
        try {
            await lector.cancel();
            lector.releaseLock();
            escritor?.releaseLock();
            await puerto.close();
        } catch {
            return;
        }
    };
}
