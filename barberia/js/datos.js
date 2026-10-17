// ============================================
// Datos de Sazzo Barbería (modo prueba, guardados en este navegador con el prefijo de la demo).
// Una barbería inventada: 2 barberos (Leo y Fran), 5 servicios, martes a sábado de 10 a 20, unos 25 clientes con
// visitas de los últimos 4 meses armadas a partir de hoy (así siempre hay turnos hoy y siempre hay 4 que no vuelven).
// Los horarios (no pisarse, libres) son del motor del kit (kit/turnos.js). Sin celulares: nada de datos personales.
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra (se cancela) y se
// devuelven copias. Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=6941c0942f";
import { filtrarPorTexto } from "../kit/js/buscar.js?v=6941c0942f";
import { sinPasarse } from "../kit/js/topes.js?v=6941c0942f";
import { fechaLocalISO } from "../kit/js/fechas.js?v=6941c0942f";
import { aMinutos, aHora, diaSemana, proximosDias, ocupados, libres, revisarLibre } from "../kit/js/turnos.js?v=6941c0942f";
import { MARCA } from "./marca.js?v=6941c0942f";

export const VERSION_DATOS = 2;

export const TOPES = {
    nombre: 40,
    siempre: 120, // "qué se hace siempre"
    notas: 300,
    dias: 7, // se saca turno de hoy a 6 días adelante
    porVenir: 3, // turnos por venir de un mismo cliente
    clientes: 200,
    turnos: 1500
};

export const PASO = 15; // los turnos empiezan cada 15 minutos
export const REINVITAR_DIAS = 7; // no invitar dos veces a la misma persona en una semana
export const NO_VUELVEN = [30, 45, 60];

/** Qué cliente de la lista es cada persona que entra a sacar turno. */
export const CLIENTE_DE = { "u-cliente": "c-matias" };

export const BARBEROS = [
    { id: "b-leo", nombre: "Leo" },
    { id: "b-fran", nombre: "Fran" }
];

export const SERVICIOS = [
    { id: "corte", texto: "Corte", duracion: 30, precio: 12_000 },
    { id: "corte-barba", texto: "Corte y barba", duracion: 45, precio: 16_000 },
    { id: "barba", texto: "Barba", duracion: 20, precio: 7_000 },
    { id: "nino", texto: "Corte niño", duracion: 30, precio: 9_000 },
    { id: "color", texto: "Color o platinado", duracion: 90, precio: 35_000 }
];

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Abre de martes a sábado, de 10 a 20. */
export const abreEse = (fecha) => ![0, 1].includes(diaSemana(fecha));
export const HORARIO = { abre: aMinutos("10:00"), cierra: aMinutos("20:00") };
export const horarioPara = (servicio) => ({ ...HORARIO, duracion: servicio.duracion, paso: PASO });

export function nombreFecha(fecha) {
    if (fecha === fechaLocalISO(0)) return "hoy";
    if (fecha === fechaLocalISO(1)) return "mañana";
    const [, m, d] = fecha.split("-");
    return `${DIAS[diaSemana(fecha)]} ${Number(d)}/${m}`;
}

const servicio = (id) => {
    const s = SERVICIOS.find((x) => x.id === id);
    if (!s) throw new Error("Elegí el servicio.");
    return s;
};
const barbero = (id) => {
    const b = BARBEROS.find((x) => x.id === id);
    if (!b) throw new Error("Ese barbero no existe.");
    return b;
};

/** Números "al azar" pero siempre los mismos (así la demo arranca igual). */
function azarFijo(semillaNum) {
    let a = semillaNum;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Clientes: [id, nombre, cada cuántos días viene, hace cuántos días vino por última vez, servicio de siempre, qué se hace siempre]
const CLIENTES = [
    ["c-matias", "Matías", 21, 18, "corte-barba", "Degradé bajo, costados al 1, arriba tijera. Barba perfilada."],
    ["c-juan", "Juan", 25, 52, "corte", "Clásico con tijera, no muy corto."],
    ["c-pablo", "Pablo", 30, 61, "corte", "Rapado al 2 parejo."],
    ["c-ariel", "Ariel", 21, 48, "corte-barba", "Degradé medio, barba al 3."],
    ["c-sergio", "Sergio", 28, 75, "barba", "Barba larga, solo emprolijar. Bigote sin tocar."],
    ["c-nico", "Nico", 14, 6, "corte", "Degradé alto y línea marcada al costado."],
    ["c-tomas", "Tomás", 20, 12, "corte", "Arriba largo con tijera, costados al 2."],
    ["c-bruno", "Bruno", 18, 9, "corte-barba", "Degradé bajo. Barba candado."],
    ["c-santi", "Santi", 15, 3, "corte", "Rapado al 1 todo."],
    ["c-facu", "Facu", 21, 15, "corte", "Texturizado arriba, degradé medio."],
    ["c-gonzalo", "Gonzalo", 30, 22, "color", "Platinado. Retocar raíz."],
    ["c-eze", "Ezequiel", 24, 20, "corte-barba", "Clásico. Barba corta pareja."],
    ["c-martin", "Martín", 28, 33, "corte", "Tijera entera, natural."],
    ["c-lautaro", "Lautaro", 17, 8, "corte", "Degradé alto, arriba al 4."],
    ["c-agus", "Agustín", 21, 14, "corte", "Costados al 1 y medio, arriba tijera."],
    ["c-ivan", "Iván", 26, 37, "barba", "Barba en punta."],
    ["c-leandro", "Leandro", 20, 5, "corte-barba", "Degradé bajo, barba al 2."],
    ["c-cristian", "Cristian", 22, 19, "corte", "Rapado al 3."],
    ["c-damian", "Damián", 16, 2, "corte", "Degradé medio con diseño de línea."],
    ["c-maxi", "Maxi", 19, 11, "corte", "Arriba largo, costados al 2."],
    ["c-rodrigo", "Rodrigo", 25, 24, "corte-barba", "Clásico, barba candado."],
    ["c-joaquin", "Joaquín", 18, 10, "corte", "Texturizado, flequillo para adelante."],
    ["c-emi", "Emiliano", 23, 16, "corte", "Degradé bajo, arriba tijera."],
    ["c-dante", "Dante (nene)", 30, 26, "nino", "Corte niño: flequillo largo, no muy corto atrás."],
    ["c-benja", "Benja (nene)", 30, 7, "nino", "Corte niño: costados al 3."]
];

/** El último día abierto en o antes de una fecha (si cae lunes o domingo, va para atrás). */
function diaAbiertoAntes(dias) {
    let n = dias;
    while (!abreEse(fechaLocalISO(-n))) n++;
    return fechaLocalISO(-n);
}

export function semilla() {
    const azar = azarFijo(5);
    const turnos = [];
    const clientes = CLIENTES.map(([id, nombre, , , , siempre]) => ({ id, nombre, siempre, notas: "", invitadoEn: null, creadoEn: null }));
    const nuevoTurno = (clienteId, servicioId, fecha, extra = {}) => {
        const s = servicio(servicioId);
        const horario = horarioPara(s);
        const minutoHoy = new Date().getHours() * 60 + new Date().getMinutes();
        // El barbero de siempre (Leo un poco más) y una hora libre ese día
        const orden = azar() < 0.6 ? BARBEROS : [...BARBEROS].reverse();
        for (const b of orden) {
            const lista = libres({ lugarId: b.id, fecha, horario, turnos });
            if (!lista.length) continue;
            const inicio = lista[Math.floor(azar() * lista.length)];
            const pasado = fecha < fechaLocalISO(0) || (fecha === fechaLocalISO(0) && inicio + s.duracion <= minutoHoy);
            const t = {
                id: `t-${clienteId}-${fecha}-${inicio}`, lugarId: b.id, fecha, inicio, duracion: s.duracion, servicioId: s.id, clienteId,
                estado: pasado ? (azar() < 0.05 ? "falto" : "llego") : "reservado", anulado: false,
                origen: azar() < 0.5 ? "app" : "mano", visto: true, precio: s.precio, creadoEn: ahora(), ...extra
            };
            turnos.push(t);
            return t;
        }
        return null;
    };

    // Las visitas de cada cliente: la última hace N días y para atrás, cada tanto, hasta 4 meses
    CLIENTES.forEach(([id, , cada, ultima, servicioId]) => {
        for (let hace = ultima; hace <= 120; hace += cada + Math.round((azar() - 0.5) * 6)) {
            nuevoTurno(id, servicioId, diaAbiertoAntes(hace), { estado: "llego" });
        }
    });

    // La agenda que viene: hoy bastante llena, después cada vez menos (sin Matías ni los que se pasaron de lo que
    // suelen tardar en volver: si les tocara un turno, dejarían de aparecer en "No vuelven hace +30 días")
    const habituales = CLIENTES.filter(([id, , cada, ultima]) => id !== "c-matias" && ultima <= cada);
    proximosDias(TOPES.dias).forEach((fecha, n) => {
        if (!abreEse(fecha)) return;
        const cuantos = n === 0 ? 14 : n === 1 ? 9 : 4;
        for (let i = 0; i < cuantos; i++) {
            const [id, , , , servicioId] = habituales[Math.floor(azar() * habituales.length)];
            if (turnos.some((t) => t.clienteId === id && t.fecha === fecha)) continue;
            nuevoTurno(id, servicioId, fecha);
        }
    });
    return { clientes, turnos };
}

// ---------- Reglas (funciones puras) ----------

/** Las visitas de un cliente (las que llegó), la última, hace cuántos días y cada cuánto viene en promedio. */
export function estadisticas(turnos, clienteId, hoy = fechaLocalISO(0)) {
    const fechas = [...new Set(turnos.filter((t) => t.clienteId === clienteId && t.estado === "llego").map((t) => t.fecha))].sort();
    const dias = (a, b) => Math.round((new Date(`${b}T12:00`) - new Date(`${a}T12:00`)) / 864e5);
    const ultima = fechas.at(-1) ?? null;
    const gaps = fechas.slice(1).map((f, i) => dias(fechas[i], f));
    return {
        visitas: fechas.length,
        ultima,
        sinVenir: ultima ? dias(ultima, hoy) : null,
        cada: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null
    };
}

/** Los huecos libres de un barbero un día (de 15 minutos o más), desde `desde` si es hoy. */
export function huecos(turnosDelDia, desde = HORARIO.abre) {
    const lista = [];
    let cursor = Math.max(HORARIO.abre, Math.ceil(desde / PASO) * PASO);
    for (const t of [...turnosDelDia].sort((a, b) => a.inicio - b.inicio)) {
        if (t.inicio - cursor >= PASO) lista.push({ desde: cursor, hasta: t.inicio });
        cursor = Math.max(cursor, t.inicio + t.duracion);
    }
    if (HORARIO.cierra - cursor >= PASO) lista.push({ desde: cursor, hasta: HORARIO.cierra });
    return lista;
}

export const CELDA = 15;

export function grillaDelDia(turnosDelDia, ahoraMinuto = null) {
    const total = (HORARIO.cierra - HORARIO.abre) / CELDA;
    const turnos = turnosDelDia.filter((t) => t.estado !== "cancelado");
    const inicioDe = (i) => HORARIO.abre + i * CELDA;
    const ocupada = (i) => turnos.some((t) => t.inicio < inicioDe(i) + CELDA && t.inicio + t.duracion > inicioDe(i));
    const pasada = (i) => ahoraMinuto !== null && inicioDe(i) < ahoraMinuto;
    const items = turnos.map((t) => {
        const fila = Math.floor((t.inicio - HORARIO.abre) / CELDA);
        return { turno: t, fila, alto: Math.ceil((t.inicio + t.duracion - HORARIO.abre) / CELDA) - fila };
    });
    for (let i = 0; i < total; i += 2) {
        const libres = [i, i + 1].filter((c) => c < total && !ocupada(c));
        if (libres.length === 2 && pasada(i) === pasada(i + 1)) items.push({ libre: true, inicio: inicioDe(i), fila: i, alto: 2, pasada: pasada(i) });
        else libres.forEach((c) => items.push({ libre: true, inicio: inicioDe(c), fila: c, alto: 1, pasada: pasada(c) }));
    }
    const libresQueVienen = items.filter((x) => x.libre && !x.pasada).reduce((m, x) => m + x.alto * CELDA, 0);
    const sigue = turnos.filter((t) => t.estado === "reservado" && (ahoraMinuto === null || t.inicio >= ahoraMinuto)).sort((x, y) => x.inicio - y.inicio)[0] ?? null;
    return { filas: total, items: items.sort((x, y) => x.fila - y.fila), libres: libresQueVienen, sigue, ahora: ahoraMinuto !== null && ahoraMinuto >= HORARIO.abre && ahoraMinuto < HORARIO.cierra ? Math.floor((ahoraMinuto - HORARIO.abre) / CELDA) : null };
}

export function textoLibre(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (!minutos) return "sin horas libres";
    return `${h ? `${h} h` : ""}${h && m ? " " : ""}${m ? `${m} min` : ""} libre${minutos === 60 ? "" : "s"}`;
}

// ---------- Funciones de datos ----------

/** `prefijo` y `reloj` cambian solo en las pruebas. */
export function crearDatos(prefijo = MARCA.prefijo, { reloj = () => new Date() } = {}) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla });
    const db = () => guardado.db();
    const hoy = () => {
        const d = reloj();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const minutoActual = () => reloj().getHours() * 60 + reloj().getMinutes();
    const desdeMinuto = (fecha) => (fecha === hoy() ? minutoActual() : null);
    const empezo = (t) => t.fecha < hoy() || (t.fecha === hoy() && t.inicio <= minutoActual());
    const esBarbero = (u) => u?.rol === "barbero";
    const esCliente = (u) => u?.rol === "cliente";
    /** El cliente de la persona que entró (Matías). */
    const clienteDe = (u) => db().clientes.find((c) => c.id === CLIENTE_DE[u?.id]);

    function armar(t) {
        const s = servicio(t.servicioId);
        return {
            ...copia(t), barbero: barbero(t.lugarId).nombre, servicio: s.texto,
            cliente: db().clientes.find((c) => c.id === t.clienteId)?.nombre ?? "Cliente",
            hora: aHora(t.inicio), hasta: aHora(t.inicio + t.duracion), nuevo: !t.visto && !t.anulado
        };
    }

    const dias = () => proximosDias(TOPES.dias).map((fecha) => ({ fecha, nombre: nombreFecha(fecha), cerrado: !abreEse(fecha) }));

    /** Los horarios libres para un servicio, con un barbero o "el que esté libre": [{ inicio, barberos: [id] }]. */
    function libresPara({ servicioId, barberoId = "cualquiera", fecha }) {
        if (!abreEse(fecha)) return [];
        const s = servicio(servicioId);
        const quienes = barberoId === "cualquiera" ? BARBEROS : [barbero(barberoId)];
        const porHora = new Map();
        quienes.forEach((b) => libres({ lugarId: b.id, fecha, horario: horarioPara(s), turnos: db().turnos, desdeMinuto: desdeMinuto(fecha) })
            .forEach((inicio) => porHora.set(inicio, [...(porHora.get(inicio) ?? []), b.id])));
        return [...porHora].sort((a, b) => a[0] - b[0]).map(([inicio, barberos]) => ({ inicio, barberos }));
    }

    function horasDelDia({ servicioId, barberoId = "cualquiera", fecha }) {
        if (!abreEse(fecha)) return [];
        const s = servicio(servicioId);
        const libresAhora = new Map(libresPara({ servicioId, barberoId, fecha }).map((l) => [l.inicio, l.barberos]));
        const desde = desdeMinuto(fecha) ?? HORARIO.abre;
        const lista = [];
        for (let m = HORARIO.abre; m + s.duracion <= HORARIO.cierra; m += PASO) {
            if (m >= desde) lista.push({ inicio: m, libre: libresAhora.has(m), barberos: libresAhora.get(m) ?? [] });
        }
        return lista;
    }

    function crearTurno({ clienteId, servicioId, barberoId, fecha, inicio }, extra) {
        const s = servicio(servicioId);
        exigir(proximosDias(TOPES.dias).includes(fecha), `Se saca turno de hoy a ${TOPES.dias - 1} días adelante.`);
        exigir(abreEse(fecha), "Ese día la barbería está cerrada (abre de martes a sábado).");
        // "El que esté libre": el primero que tenga ese horario
        const quien = barberoId === "cualquiera"
            ? BARBEROS.find((b) => libres({ lugarId: b.id, fecha, horario: horarioPara(s), turnos: db().turnos, desdeMinuto: desdeMinuto(fecha) }).includes(inicio))?.id ?? BARBEROS[0].id
            : barbero(barberoId).id;
        revisarLibre({ lugarId: quien, fecha, inicio, horario: horarioPara(s), turnos: db().turnos, desdeMinuto: desdeMinuto(fecha) });
        exigir(db().turnos.length < TOPES.turnos, `Ya hay ${TOPES.turnos} turnos. Es una demo: tocá "Empezar de cero" arriba.`);
        const t = {
            id: nuevoId("t"), lugarId: quien, fecha, inicio, duracion: s.duracion, servicioId: s.id, clienteId,
            estado: "reservado", anulado: false, origen: "app", visto: true, precio: s.precio, creadoEn: ahora(), ...extra
        };
        db().turnos.push(t);
        guardado.persistir();
        return armar(t);
    }

    // ----- Para el cliente -----

    function sacarTurno(usuario, datosTurno) {
        exigir(esCliente(usuario), "Desde acá sacan turno los clientes.");
        const c = clienteDe(usuario);
        exigir(c, "No te encontramos en la lista de clientes.");
        const porVenir = db().turnos.filter((t) => t.clienteId === c.id && !t.anulado && t.estado === "reservado" && !empezo(t));
        exigir(porVenir.length < TOPES.porVenir, `Ya tenés ${TOPES.porVenir} turnos por venir: es el máximo.`);
        const dura = SERVICIOS.find((s) => s.id === datosTurno?.servicioId)?.duracion ?? 0;
        const encima = porVenir.find((t) => t.fecha === datosTurno?.fecha && t.inicio < datosTurno.inicio + dura && datosTurno.inicio < t.inicio + t.duracion);
        exigir(!encima, `Ya tenés un turno a esa hora (${aHora(encima?.inicio ?? 0)}).`);
        return crearTurno({ ...datosTurno, clienteId: c.id }, { origen: "app", visto: false });
    }

    function misTurnos(usuario) {
        const c = esCliente(usuario) ? clienteDe(usuario) : null;
        const mios = db().turnos.filter((t) => t.clienteId === c?.id).map(armar);
        const vienen = mios.filter((t) => !t.anulado && t.estado === "reservado" && t.fecha >= hoy());
        return {
            vienen: vienen.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),
            anteriores: mios.filter((t) => !vienen.includes(t)).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)).slice(0, 8)
        };
    }

    function cancelarTurno(usuario, id) {
        exigir(esCliente(usuario), "Solo el cliente cancela su turno desde acá.");
        const t = buscar(db().turnos, id, "Ese turno ya no existe.");
        exigir(t.clienteId === clienteDe(usuario)?.id, "Ese turno no es tuyo.");
        exigir(!t.anulado && t.estado === "reservado", "Ese turno ya no está activo.");
        exigir(!empezo(t), "Ese turno ya empezó.");
        t.estado = "cancelado";
        t.anulado = true;
        guardado.persistir();
        return armar(t);
    }

    // ----- Para el barbero -----

    /** La agenda de un día: cada barbero con sus turnos y sus huecos libres, la tira del día y los nuevos. */
    function agenda(fecha = hoy()) {
        const columnas = BARBEROS.map((b) => {
            const delDia = ocupados({ turnos: db().turnos, lugarId: b.id, fecha });
            return {
                ...b,
                turnos: db().turnos.filter((t) => t.lugarId === b.id && t.fecha === fecha && t.estado !== "cancelado").sort((x, y) => x.inicio - y.inicio).map(armar),
                huecos: abreEse(fecha) ? huecos(delDia, fecha === hoy() ? minutoActual() : HORARIO.abre) : []
            };
        });
        const todos = columnas.flatMap((c) => c.turnos);
        return {
            fecha, nombre: nombreFecha(fecha), cerrado: !abreEse(fecha), columnas,
            resumen: {
                turnos: todos.length,
                atendidos: todos.filter((t) => t.estado === "llego").length,
                faltazos: todos.filter((t) => t.estado === "falto").length,
                hecho: todos.filter((t) => t.estado === "llego").reduce((s, t) => s + t.precio, 0),
                porHacer: todos.filter((t) => t.estado === "reservado").reduce((s, t) => s + t.precio, 0)
            }
        };
    }

    function turnero() {
        const ahora = minutoActual();
        const primerNombre = (t) => t.cliente.split(" ")[0];
        const abierto = abreEse(hoy());
        return {
            abierto,
            barberos: agenda(hoy()).columnas.map((c) => {
                const vivos = c.turnos.filter((t) => t.estado !== "falto" && t.estado !== "cancelado");
                const enCurso = vivos.find((t) => t.inicio <= ahora && ahora < t.inicio + t.duracion);
                const sigue = vivos.find((t) => t.estado === "reservado" && t.inicio > ahora && t !== enCurso);
                return {
                    id: c.id, nombre: c.nombre,
                    ahora: enCurso ? { cliente: primerNombre(enCurso), servicio: enCurso.servicio, hasta: enCurso.hasta } : null,
                    sigue: sigue ? { cliente: primerNombre(sigue), hora: sigue.hora, servicio: sigue.servicio } : null,
                    quedan: vivos.filter((t) => t.estado === "reservado" && t.inicio > ahora).length
                };
            })
        };
    }

    const nuevos = () => db().turnos.filter((t) => !t.visto && !t.anulado).map(armar).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    const turno = (id) => armar(buscar(db().turnos, id, "Ese turno ya no existe."));

    function marcarVisto(usuario, id) {
        exigir(esBarbero(usuario), "Solo el barbero marca los turnos nuevos.");
        const t = buscar(db().turnos, id, "Ese turno ya no existe.");
        if (!t.visto) {
            t.visto = true;
            guardado.persistir();
        }
        return armar(t);
    }

    function marcar(usuario, id, estado) {
        exigir(esBarbero(usuario), "Solo el barbero marca si llegó.");
        exigir(estado === "llego" || estado === "falto", "Marcá si llegó o si faltó.");
        const t = buscar(db().turnos, id, "Ese turno ya no existe.");
        exigir(!t.anulado, "Ese turno está cancelado.");
        t.estado = estado;
        t.visto = true;
        guardado.persistir();
        return armar(t);
    }

    /** El barbero cancela un turno (el horario vuelve a quedar libre). */
    function liberarTurno(usuario, id) {
        exigir(esBarbero(usuario), "Solo el barbero libera turnos.");
        const t = buscar(db().turnos, id, "Ese turno ya no existe.");
        exigir(!t.anulado, "Ese turno ya estaba cancelado.");
        t.estado = "cancelado";
        t.anulado = true;
        t.visto = true;
        guardado.persistir();
        return armar(t);
    }

    /** El mensaje para recordarle el turno (en la demo se copia; en la versión real abre WhatsApp). */
    function recordatorio(id) {
        const t = turno(id);
        return `Hola ${t.cliente}! Te recuerdo tu turno ${nombreFecha(t.fecha)} ${t.hora} con ${t.barbero}. Si no podés venir, avisame así lo libero.`;
    }

    /** "+ Turno": el barbero anota uno a mano (un cliente de la lista o uno nuevo, solo con el nombre). */
    function anotarTurno(usuario, { clienteId = null, nombreNuevo = "", servicioId, barberoId, fecha, inicio }) {
        exigir(esBarbero(usuario), "Solo el barbero anota turnos en la agenda.");
        let id = clienteId;
        if (!id) {
            id = nuevoCliente(usuario, nombreNuevo).id;
        } else {
            buscar(db().clientes, id, "Ese cliente no existe.");
        }
        try {
            return crearTurno({ clienteId: id, servicioId, barberoId, fecha, inicio }, { origen: "mano", visto: true });
        } catch (err) {
            if (!clienteId) {
                db().clientes = db().clientes.filter((c) => c.id !== id);
                guardado.persistir();
            }
            throw err;
        }
    }

    // ----- Clientes -----

    function armarCliente(c) {
        const e = estadisticas(db().turnos, c.id, hoy());
        const proximo = db().turnos.filter((t) => t.clienteId === c.id && !t.anulado && t.estado === "reservado" && t.fecha >= hoy())
            .sort((a, b) => (a.fecha + a.inicio).localeCompare(b.fecha + b.inicio))[0];
        return { ...copia(c), ...e, proximo: proximo ? armar(proximo) : null, puedeInvitar: puedeInvitarYa(c) };
    }

    function puedeInvitarYa(c) {
        return !c.invitadoEn || (reloj() - new Date(c.invitadoEn)) / 864e5 >= REINVITAR_DIAS;
    }

    /** Lista de clientes (buscar por nombre); con `noVuelven` (días), solo los que hace más que eso no vienen y no tienen turno. */
    function listarClientes({ texto = "", noVuelven = null } = {}) {
        // El nombre perdona errores ("jorje", "matias"): lo más parecido va primero
        let lista = db().clientes.map(armarCliente);
        if (noVuelven) {
            lista = lista.filter((c) => c.sinVenir !== null && c.sinVenir > noVuelven && !c.proximo).sort((a, b) => b.sinVenir - a.sinVenir);
        } else {
            lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        }
        return filtrarPorTexto(lista, texto, (c) => c.nombre);
    }

    function cliente(id) {
        const c = armarCliente(buscar(db().clientes, id, "Ese cliente no existe."));
        c.historial = db().turnos.filter((t) => t.clienteId === id && (t.estado === "llego" || t.estado === "falto"))
            .sort((a, b) => (b.fecha + b.inicio).localeCompare(a.fecha + a.inicio)).slice(0, 12).map(armar);
        return c;
    }

    function nuevoCliente(usuario, nombre) {
        exigir(esBarbero(usuario), "Solo el barbero anota clientes.");
        const n = sinPasarse(nombre, TOPES.nombre, "el nombre");
        exigir(n, "Poné el nombre del cliente.");
        exigir(!db().clientes.some((c) => c.nombre.toLowerCase() === n.toLowerCase()), "Ya hay un cliente con ese nombre: elegilo de la lista.");
        exigir(db().clientes.length < TOPES.clientes, `Ya hay ${TOPES.clientes} clientes. Es una demo: tocá "Empezar de cero" arriba.`);
        const c = { id: nuevoId("c"), nombre: n, siempre: "", notas: "", invitadoEn: null, creadoEn: ahora() };
        db().clientes.push(c);
        guardado.persistir();
        return copia(c);
    }

    function guardarFicha(usuario, id, { siempre = "", notas = "" } = {}) {
        exigir(esBarbero(usuario), "Solo el barbero cambia la ficha.");
        const c = buscar(db().clientes, id, "Ese cliente no existe.");
        const textoSiempre = sinPasarse(siempre, TOPES.siempre, "\"qué se hace siempre\"");
        const textoNotas = sinPasarse(notas, TOPES.notas, "las notas");
        c.siempre = textoSiempre;
        c.notas = textoNotas;
        guardado.persistir();
        return armarCliente(c);
    }

    /** Invitar a uno que no vuelve: el mensaje para copiar, y queda la fecha (para no invitarlo dos veces). */
    function mensajeInvitar(usuario, id) {
        exigir(esBarbero(usuario), "Solo el barbero invita clientes.");
        const c = buscar(db().clientes, id, "Ese cliente no existe.");
        exigir(puedeInvitarYa(c), `A ${c.nombre} ya lo invitaste hace poco: esperá unos días.`);
        return { cliente: armarCliente(c), mensaje: `Hola ${c.nombre}! Hace rato que no te vemos por la barbería. ¿Te reservo un turno esta semana?` };
    }

    function invitar(usuario, id) {
        const { mensaje } = mensajeInvitar(usuario, id);
        const c = buscar(db().clientes, id);
        c.invitadoEn = reloj().toISOString();
        guardado.persistir();
        return { cliente: armarCliente(c), mensaje };
    }

    return {
        guardado,
        dias, libresPara, horasDelDia, sacarTurno, misTurnos, cancelarTurno,
        agenda, turnero, nuevos, turno, marcarVisto, marcar, liberarTurno, recordatorio, anotarTurno,
        listarClientes, cliente, nuevoCliente, guardarFicha, mensajeInvitar, invitar
    };
}

