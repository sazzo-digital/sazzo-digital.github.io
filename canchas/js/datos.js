// ============================================
// Datos de Sazzo Canchas (modo prueba, guardados en este navegador con el prefijo de la demo).
// Un complejo inventado: 3 canchas de Fútbol 5, 1 de Fútbol 7 y 1 de pádel (turnos de 90 min). Turnos de hoy a 6 días
// adelante (hoy, medio lleno; después, cada vez más libre), turnos fijos semanales y señas simuladas.
// Las reglas de horarios (no pisarse, fijos, libres) son del motor del kit (kit/turnos.js).
// Reglas del kit: exigir() en lo que modifica, topes en todo lo que se carga, nada se borra (se anula o se libera)
// y se devuelven copias. Si cambia la forma de los datos, subir VERSION_DATOS (se regeneran solos).
// ============================================
import { crearGuardado, exigir, copia, nuevoId, ahora, buscar } from "../kit/js/guardado.js?v=44e4746e73";
import { sinPasarse } from "../kit/js/topes.js?v=44e4746e73";
import { fechaLocalISO, diaLocalDe } from "../kit/js/fechas.js?v=44e4746e73";
import { aMinutos, aHora, diaSemana, proximosDias, franjas, fijosDelDia, ocupados, libres, revisarLibre, sePisan } from "../kit/js/turnos.js?v=44e4746e73";
import { MARCA, PERSONAS } from "./marca.js?v=44e4746e73";
import { MEDIOS_PAGO, DIVIDIDO, revisarPagos } from "../kit/js/pagos.js?v=44e4746e73";

export const VERSION_DATOS = 5;

export const TOPES = {
    grupo: 30, // letras del nombre del grupo
    dias: 7, // se reserva de hoy a 6 días adelante
    activosJugador: 3, // turnos por venir de un mismo jugador
    turnos: 400, // turnos en total (alguien aburrido reservando sin parar)
    fijos: 40,
    cantidad: 50,
    consumos: 40,
    partes: 22,
    ventasCantina: 500,
    pagaCon: 10_000_000
};

export const SECCIONES_CANTINA = [
    { id: "bebidas", texto: "Bebidas" },
    { id: "cervezas", texto: "Cervezas" },
    { id: "comida", texto: "Comida" },
    { id: "snacks", texto: "Snacks" }
];

export const CANTINA = [
    ["agua", "Agua 500 ml", 1_200, 24, "ti-bottle", "bebidas"],
    ["gaseosa", "Gaseosa 500 ml", 1_800, 18, "ti-bottle", "bebidas"],
    ["isotonica", "Bebida isotónica", 2_200, 12, "ti-bottle", "bebidas"],
    ["saborizada", "Agua saborizada 500 ml", 1_400, 16, "ti-bottle", "bebidas"],
    ["gaseosa-15", "Gaseosa 1,5 L", 3_200, 10, "ti-bottle", "bebidas"],
    ["hielo", "Bolsa de hielo", 1_500, 6, "ti-snowflake", "bebidas"],
    ["cerveza", "Cerveza lata", 2_300, 24, "ti-beer", "cervezas"],
    ["cerveza-litro", "Cerveza 1 L", 4_500, 12, "ti-beer", "cervezas"],
    ["cerveza-tirada", "Pinta tirada", 3_800, 40, "ti-glass-full", "cervezas"],
    ["cerveza-sin", "Cerveza sin alcohol", 2_200, 8, "ti-beer", "cervezas"],
    ["hamburguesa", "Hamburguesa completa", 5_500, 15, "ti-burger", "comida"],
    ["hamburguesa-simple", "Hamburguesa simple", 4_500, 15, "ti-burger", "comida"],
    ["pancho", "Pancho", 2_500, 20, "ti-sausage", "comida"],
    ["sandwich", "Sándwich de miga x3", 3_000, 8, "ti-bread", "comida"],
    ["pizza", "Porción de pizza", 2_800, 12, "ti-pizza", "comida"],
    ["papas", "Papas fritas", 1_800, 10, "ti-cookie", "snacks"],
    ["mani", "Maní salado", 1_200, 14, "ti-cookie", "snacks"],
    ["alfajor", "Alfajor", 1_000, 20, "ti-candy", "snacks"],
    ["chocolate", "Chocolate", 1_500, 12, "ti-candy", "snacks"],
    ["cereal", "Barra de cereal", 900, 18, "ti-cookie", "snacks"]
];

export const MEDIOS = MEDIOS_PAGO;

export function dividir(total, partes) {
    const base = Math.floor(total / partes);
    const resto = total - base * partes;
    return Array.from({ length: partes }, (_, i) => base + (i < resto ? 1 : 0));
}

export const CANCELAR_HORAS = 12; // cancelando con más anticipación, la seña se devuelve; si no, se pierde

export const TIPOS = {
    f5: { texto: "Fútbol 5", duracion: 60, precio: 45_000, sena: 15_000 },
    f7: { texto: "Fútbol 7", duracion: 60, precio: 70_000, sena: 20_000 },
    padel: { texto: "Pádel", duracion: 90, precio: 30_000, sena: 10_000 }
};

export const CANCHAS = [
    { id: "c1", nombre: "Cancha 1", tipo: "f5" },
    { id: "c2", nombre: "Cancha 2", tipo: "f5" },
    { id: "c3", nombre: "Cancha 3", tipo: "f5" },
    { id: "c4", nombre: "Cancha 4", tipo: "f7" },
    { id: "c5", nombre: "Pádel", tipo: "padel" }
];

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const SENAS = { pagada: "Seña pagada", pendiente: "Seña a cobrar", devuelta: "Seña devuelta", perdida: "Seña perdida" };

export const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** El horario de una cancha un día: de 18 a 24 en semana, de 10 a 24 sábados y domingos; turnos según su tipo. */
export function horarioDe(cancha, fecha) {
    const dia = diaSemana(fecha);
    const finde = dia === 0 || dia === 6;
    const { duracion } = TIPOS[cancha.tipo];
    return { abre: aMinutos(finde ? "10:00" : "18:00"), cierra: aMinutos("24:00"), duracion };
}

/** "hoy", "mañana" o "sábado 10/10". */
export function nombreFecha(fecha) {
    if (fecha === fechaLocalISO(0)) return "hoy";
    if (fecha === fechaLocalISO(1)) return "mañana";
    const [, m, d] = fecha.split("-");
    return `${DIAS[diaSemana(fecha)]} ${Number(d)}/${m}`;
}

const buscarCancha = (id) => {
    const c = CANCHAS.find((x) => x.id === id);
    if (!c) throw new Error("Esa cancha no existe.");
    return c;
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

const GRUPOS = ["Amigos del club", "Los de sistemas", "Taller FC", "Cumple de Juan", "Los primos", "Inter de barrio",
    "Los rápidos", "Mixto del jueves", "Los suegros", "Ex alumnos", "La banda del 5", "Los del gym"];

// ---------- Datos de fábrica ----------
export function semilla() {
    const azar = azarFijo(11);
    const dias = proximosDias(TOPES.dias);
    const nuevoTurno = (cancha, fecha, inicio, extra = {}) => ({
        id: `t-${fecha}-${cancha.id}-${inicio}`, lugarId: cancha.id, fecha, inicio, duracion: TIPOS[cancha.tipo].duracion,
        grupo: GRUPOS[Math.floor(azar() * GRUPOS.length)], jugadorId: null, origen: azar() < 0.5 ? "app" : "telefono",
        estado: "reservado", anulado: false, sena: "pagada", precio: TIPOS[cancha.tipo].precio, montoSena: TIPOS[cancha.tipo].sena,
        creadoEn: ahora(), visto: true, ...extra
    });

    // Tres fijos: uno hoy, uno mañana (que faltó la semana pasada) y uno en 3 días (liberado esta semana)
    const fijoEn = (id, grupo, cancha, enDias, indice, extra = {}) => {
        const fecha = dias[enDias];
        const lista = franjas(horarioDe(cancha, fecha));
        return { id, lugarId: cancha.id, dia: diaSemana(fecha), inicio: lista[Math.min(indice, lista.length - 1)], duracion: TIPOS[cancha.tipo].duracion, grupo, liberadas: [], asistencia: {}, precio: TIPOS[cancha.tipo].precio, ...extra };
    };
    const fijos = [
        fijoEn("f-1", "Oficina FC", CANCHAS[3], 0, 3),
        fijoEn("f-2", "Veteranos", CANCHAS[1], 1, 2, { asistencia: { [fechaLocalISO(-6)]: "faltaron" } }),
        fijoEn("f-3", "Las del pádel", CANCHAS[4], 3, 1, { liberadas: [dias[3]] })
    ];

    // Turnos: hoy, medio lleno; mañana, menos; después, pocos. Lo que ya pasó hoy, "llegaron".
    const turnos = [];
    const minutoHoy = new Date().getHours() * 60 + new Date().getMinutes();
    dias.forEach((fecha, n) => {
        const cuanto = n === 0 ? 0.5 : n === 1 ? 0.3 : 0.12;
        for (const cancha of CANCHAS) {
            const horario = horarioDe(cancha, fecha);
            for (const inicio of libres({ lugarId: cancha.id, fecha, horario, turnos, fijos })) {
                if (azar() >= cuanto) continue;
                const pasado = n === 0 && inicio + horario.duracion <= minutoHoy;
                const pendiente = !pasado && azar() < 0.2;
                turnos.push(nuevoTurno(cancha, fecha, inicio, {
                    estado: pasado ? "llegaron" : "reservado",
                    sena: pendiente ? "pendiente" : "pagada"
                }));
            }
        }
    });
    dias.slice(0, 2).forEach((dia) => {
        const delDia = turnos.filter((t) => t.fecha === dia && t.estado === "reservado");
        if (delDia.length && !delDia.some((t) => t.sena === "pendiente")) delDia[0].sena = "pendiente";
    });
    // El turno que ya tiene Fede (para que "Mis turnos" no arranque vacío)
    const fecha = dias[3];
    const cancha = CANCHAS[0];
    const libre = libres({ lugarId: cancha.id, fecha, horario: horarioDe(cancha, fecha), turnos, fijos }).at(-2);
    if (libre !== undefined) turnos.push(nuevoTurno(cancha, fecha, libre, { id: "t-fede", grupo: "Los pibes del laburo", jugadorId: "u-jugador", origen: "app" }));
    const cantina = CANTINA.map(([id, nombre, precio, stock, icono, seccion]) => ({ id, nombre, precio, stock, icono, seccion }));
    return { turnos, fijos, cantina, ventasCantina: [] };
}

// ---------- Funciones de datos ----------

/**
 * Las funciones de datos. `prefijo` cambia en las pruebas (así no tocan los datos de la demo) y `reloj` también
 * (para probar lo que depende de la hora, como cancelar con poca anticipación).
 */
export function crearDatos(prefijo = MARCA.prefijo, { reloj = () => new Date() } = {}) {
    const guardado = crearGuardado({ prefijo, version: VERSION_DATOS, semilla, formaDeLaSemilla: true });
    const db = () => guardado.db();

    const series = {"dueno": ["sena", "llegaron", "fijo"], "cliente": ["reserva", "pedido", "cancelar"]};

    const sinSenaPendiente = () => !db().turnos.some((t) => t.sena === "pendiente" && !t.anulado);
    const sinDondePedir = (usuario) => !db().turnos.some((t) => t.jugadorId === usuario.id && !t.anulado && t.estado === "reservado" && !t.pago && !terminado(t));
    const dadosPorHecho = { sena: sinSenaPendiente, pedido: sinDondePedir };

    function pasos(usuario) {
        exigir(PERSONAS.some((p) => p.id === usuario?.id && p.rol === usuario?.rol), "Esa persona no tiene una serie.");
        return series[usuario.rol].map((id) => !!db().pasosPersonas?.[usuario.id]?.includes(id) || !!dadosPorHecho[id]?.(usuario));
    }

    function registrarPaso(usuario, id) {
        if (!series[usuario.rol].includes(id)) return;
        const hechos = db().pasosPersonas ??= {};
        const persona = hechos[usuario.id] ??= [];
        if (persona.includes(id)) return;
        persona.push(id);
        guardado.persistir();
    }

    const hoy = () => {
        const d = reloj();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const minutoActual = () => reloj().getHours() * 60 + reloj().getMinutes();
    const desdeMinuto = (fecha) => (fecha === hoy() ? minutoActual() : null);
    /** Horas que faltan para que empiece un turno. */
    const horasHasta = (t) => {
        const [a, m, d] = t.fecha.split("-").map(Number);
        return (new Date(a, m - 1, d, 0, t.inicio) - reloj()) / 3_600_000;
    };
    const esDueno = (u) => u?.rol === "dueno";
    const esJugador = (u) => u?.rol === "cliente";

    /** Un turno (o un fijo de ese día) con lo que necesita la pantalla. */
    function armar(t) {
        const cancha = buscarCancha(t.lugarId);
        const esFijo = !!t.esFijo;
        return {
            ...copia(t),
            id: esFijo ? `fijo:${t.fijoId}:${t.fecha}` : t.id,
            cancha: cancha.nombre, tipo: TIPOS[cancha.tipo].texto,
            hora: aHora(t.inicio), hasta: aHora(t.inicio + t.duracion),
            estado: esFijo ? t.asistencia?.[t.fecha] ?? "reservado" : t.estado,
            sena: esFijo ? null : t.sena,
            precio: t.precio ?? TIPOS[cancha.tipo].precio,
            esFijo, nuevo: !esFijo && !t.visto
        };
    }

    /** Busca un turno por id (también los de un fijo: "fijo:f-1:2026-10-08"). */
    function buscarTurno(id) {
        const m = /^fijo:([\w-]+):(\d{4}-\d{2}-\d{2})$/.exec(id ?? "");
        if (m) {
            const fijo = buscar(db().fijos, m[1], "Ese turno fijo no existe.");
            const del = fijosDelDia([fijo], m[2])[0];
            exigir(del, "Ese turno fijo no está ese día.");
            return { fijo, fecha: m[2], turno: del };
        }
        return { turno: buscar(db().turnos, id, "Ese turno ya no existe.") };
    }

    // ----- Para el jugador -----

    const dias = () => proximosDias(TOPES.dias).map((fecha) => ({ fecha, nombre: nombreFecha(fecha) }));

    /** Los horarios libres de cada cancha de un tipo, un día (desde ahora, si es hoy). */
    function libresDe(fecha, tipo = null) {
        return CANCHAS.filter((c) => !tipo || c.tipo === tipo).map((c) => ({
            ...c, tipoInfo: TIPOS[c.tipo],
            libres: libres({ lugarId: c.id, fecha, horario: horarioDe(c, fecha), turnos: db().turnos, fijos: db().fijos, desdeMinuto: desdeMinuto(fecha) })
        }));
    }

    function revisarGrupo(grupo) {
        const g = sinPasarse(grupo, TOPES.grupo, "el nombre del grupo");
        exigir(g, "Poné el nombre del grupo (ej: Los del martes).");
        return g;
    }

    function crearTurno(usuario, { canchaId, fecha, inicio, grupo }, extra) {
        const cancha = buscarCancha(canchaId);
        exigir(proximosDias(TOPES.dias).includes(fecha), `Se reserva de hoy a ${TOPES.dias - 1} días adelante.`);
        const g = revisarGrupo(grupo);
        revisarLibre({ lugarId: cancha.id, fecha, inicio, horario: horarioDe(cancha, fecha), turnos: db().turnos, fijos: db().fijos, desdeMinuto: desdeMinuto(fecha) });
        exigir(db().turnos.length < TOPES.turnos, `Ya hay ${TOPES.turnos} turnos. Es una demo: tocá "Empezar de cero" arriba.`);
        const t = {
            id: nuevoId("t"), lugarId: cancha.id, fecha, inicio, duracion: TIPOS[cancha.tipo].duracion, grupo: g,
            jugadorId: null, origen: "app", estado: "reservado", anulado: false, sena: "pagada",
            precio: TIPOS[cancha.tipo].precio, montoSena: TIPOS[cancha.tipo].sena, creadoEn: ahora(), visto: true, ...extra
        };
        db().turnos.push(t);
        guardado.persistir();
        return armar(t);
    }

    /** El jugador reserva y paga la seña (simulada). El dueño lo ve como "Nuevo". */
    function reservar(usuario, datosTurno) {
        exigir(esJugador(usuario), "Desde acá reservan los jugadores.");
        const activos = db().turnos.filter((t) => t.jugadorId === usuario.id && !t.anulado && t.estado === "reservado" && horasHasta(t) > 0);
        exigir(activos.length < TOPES.activosJugador, `Ya tenés ${TOPES.activosJugador} turnos por venir: es el máximo.`);
        const turno = crearTurno(usuario, datosTurno, { jugadorId: usuario.id, origen: "app", sena: "pagada", visto: false });
        registrarPaso(usuario, "reserva");
        return turno;
    }

    /** Los turnos del jugador: los que vienen (el más cercano primero) y los anteriores. */
    function misTurnos(usuario) {
        const mios = db().turnos.filter((t) => t.jugadorId === usuario?.id).map(armar);
        const vienen = mios.filter((t) => !t.anulado && t.estado === "reservado" && horasHasta(t) > -t.duracion / 60);
        return {
            vienen: vienen.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),
            anteriores: mios.filter((t) => !vienen.includes(t)).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))
        };
    }

    /** ¿Si cancela ahora, se le devuelve la seña? */
    const seDevuelve = (t) => horasHasta(t) >= CANCELAR_HORAS;

    function cancelar(usuario, id) {
        exigir(esJugador(usuario), "Solo el jugador cancela su turno desde acá.");
        const t = buscar(db().turnos, id, "Ese turno ya no existe.");
        exigir(t.jugadorId === usuario.id, "Ese turno no es tuyo.");
        exigir(!t.anulado && t.estado === "reservado", "Ese turno ya no está activo.");
        exigir(horasHasta(t) > 0, "Ese turno ya empezó.");
        exigir(!entregadoSinCobrar(t), "Ya te entregaron cosas de la cantina: para cancelar, hablá con el complejo.");
        t.sena = seDevuelve(t) ? "devuelta" : "perdida";
        t.estado = "cancelado";
        t.anulado = true;
        devolverSinEntregar(t);
        registrarPaso(usuario, "cancelar");
        guardado.persistir();
        return armar(t);
    }

    // ----- Para el dueño -----

    /** La grilla de un día: cada cancha con sus turnos (y fijos) y sus horarios libres, y el resumen del día. */
    function grilla(fecha = hoy()) {
        const columnas = CANCHAS.map((c) => {
            const horario = horarioDe(c, fecha);
            return {
                ...c, tipoInfo: TIPOS[c.tipo], horario,
                turnos: ocupados({ turnos: db().turnos, fijos: db().fijos, lugarId: c.id, fecha }).map(armar),
                // Hoy, sin los horarios que ya pasaron (si no, de noche se ofrecían "libres" que daban "Ese horario ya pasó")
                libres: libres({ lugarId: c.id, fecha, horario, turnos: db().turnos, fijos: db().fijos, desdeMinuto: desdeMinuto(fecha) }),
                total: franjas(horario).length
            };
        });
        const todos = columnas.flatMap((c) => c.turnos);
        const senaCobrada = (t) => (t.sena === "pagada" || t.sena === "perdida" ? t.montoSena ?? 0 : 0);
        const activos = todos.filter((t) => t.estado !== "faltaron");
        return {
            fecha, nombre: nombreFecha(fecha), columnas,
            desde: Math.min(...columnas.map((c) => c.horario.abre)),
            hasta: Math.max(...columnas.map((c) => c.horario.cierra)),
            resumen: {
                ocupados: todos.length,
                total: columnas.reduce((t, c) => t + c.total, 0),
                senas: todos.reduce((t, x) => t + senaCobrada(x), 0),
                aCobrar: activos.reduce((t, x) => t + x.precio - senaCobrada(x), 0),
                pendientes: todos.filter((t) => t.sena === "pendiente").length,
                cantina: cantinaDelDia(fecha)
            },
            nuevos: todos.filter((t) => t.nuevo)
        };
    }

    /** Todos los turnos nuevos (de cualquier día) que el dueño todavía no miró. */
    const nuevos = () => db().turnos.filter((t) => !t.visto && !t.anulado).map(armar).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

    function turno(id) {
        const { turno: t } = buscarTurno(id);
        return armar(t);
    }

    function marcarVisto(usuario, id) {
        exigir(esDueno(usuario), "Solo el dueño marca los turnos nuevos.");
        const { turno: t, fijo } = buscarTurno(id);
        if (!fijo && !t.visto) {
            t.visto = true;
            guardado.persistir();
        }
        return armar(t);
    }

    /** El dueño anota un turno que pidieron por teléfono (la seña queda a cobrar). */
    function anotar(usuario, datosTurno) {
        exigir(esDueno(usuario), "Solo el dueño anota turnos en la grilla.");
        return crearTurno(usuario, datosTurno, { origen: "telefono", sena: "pendiente", visto: true });
    }

    /** "Llegaron" o "Faltaron" (también para un fijo de ese día). */
    function marcar(usuario, id, estado) {
        exigir(esDueno(usuario), "Solo el dueño marca si llegaron.");
        exigir(estado === "llegaron" || estado === "faltaron", "Marcá si llegaron o si faltaron.");
        const { turno: t, fijo, fecha } = buscarTurno(id);
        if (fijo) {
            fijo.asistencia = { ...fijo.asistencia, [fecha]: estado };
        } else {
            exigir(!t.anulado, "Ese turno está liberado o cancelado.");
            t.estado = estado;
            t.visto = true;
        }
        if (estado === "llegaron") registrarPaso(usuario, "llegaron");
        guardado.persistir();
        return armar(fijo ? fijosDelDia([fijo], fecha)[0] : t);
    }

    function cobrarSena(usuario, id) {
        exigir(esDueno(usuario), "Solo el dueño cobra la seña.");
        const { turno: t, fijo } = buscarTurno(id);
        exigir(!fijo, "Los turnos fijos no llevan seña.");
        exigir(t.sena === "pendiente" && !t.anulado, "Ese turno no tiene seña a cobrar.");
        t.sena = "pagada";
        registrarPaso(usuario, "sena");
        guardado.persistir();
        return armar(t);
    }

    /** Liberar: el horario vuelve a quedar libre (la seña pagada se devuelve). Un fijo se libera solo ese día. */
    function liberar(usuario, id) {
        exigir(esDueno(usuario), "Solo el dueño libera turnos.");
        const { turno: t, fijo, fecha } = buscarTurno(id);
        exigir(!entregadoSinCobrar(fijo ? fijo.cuentas?.[fecha] : t), "Tiene cosas de la cantina entregadas sin cobrar: cobrá la cuenta antes de liberar el turno.");
        if (fijo) {
            fijo.liberadas = [...new Set([...fijo.liberadas, fecha])];
            devolverSinEntregar(fijo.cuentas?.[fecha]);
        } else {
            exigir(!t.anulado, "Ese turno ya estaba liberado.");
            t.estado = "liberado";
            t.anulado = true;
            t.visto = true;
            if (t.sena === "pagada") t.sena = "devuelta";
            devolverSinEntregar(t);
        }
        guardado.persistir();
        return true;
    }

    const entregadoSinCobrar = (c) => !c?.pago && (c?.consumos ?? []).some((k) => k.entregado);

    function devolverSinEntregar(c) {
        if (!c?.consumos?.length || c.pago) return;
        c.consumos.filter((k) => !k.entregado).forEach((k) => {
            const p = db().cantina.find((x) => x.id === k.productoId);
            if (p) p.stock += k.cantidad;
        });
        c.consumos = c.consumos.filter((k) => k.entregado);
    }

    // ----- Turnos fijos -----

    /** Los fijos con sus próximas 2 fechas (y si están liberadas) y la última vez que faltaron. */
    function listarFijos() {
        return db().fijos.map((f) => {
            const cancha = buscarCancha(f.lugarId);
            const fechas = proximosDias(14).filter((d) => diaSemana(d) === f.dia && (!f.desde || d >= f.desde)).slice(0, 2);
            const faltaron = Object.entries(f.asistencia ?? {}).filter(([, e]) => e === "faltaron").map(([d]) => d).sort().at(-1) ?? null;
            return {
                ...copia(f), cancha: cancha.nombre, tipo: TIPOS[cancha.tipo].texto, diaTexto: DIAS[f.dia], hora: aHora(f.inicio),
                proximas: fechas.map((fecha) => ({ fecha, nombre: nombreFecha(fecha), liberada: f.liberadas.includes(fecha) })),
                faltaron
            };
        }).sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7) || a.inicio - b.inicio);
    }

    function fijoQueChoca(lugarId, dia, inicio, duracion, sinId = null) {
        return db().fijos.find((x) => x.id !== sinId && x.lugarId === lugarId && x.dia === dia && inicio < x.inicio + x.duracion && x.inicio < inicio + duracion);
    }

    function liberarFijo(usuario, fijoId, fecha) {
        exigir(esDueno(usuario), "Solo el dueño libera turnos fijos.");
        const f = buscar(db().fijos, fijoId, "Ese turno fijo no existe.");
        exigir(fijosDelDia([f], fecha).length, "Ese fijo no juega ese día.");
        return liberar(usuario, `fijo:${f.id}:${fecha}`);
    }

    /** Volver a reservar una semana liberada (si nadie tomó ese horario mientras tanto). */
    function volverFijo(usuario, fijoId, fecha) {
        exigir(esDueno(usuario), "Solo el dueño cambia los turnos fijos.");
        const f = buscar(db().fijos, fijoId, "Ese turno fijo no existe.");
        exigir(f.liberadas.includes(fecha), "Esa semana no estaba liberada.");
        const pisa = db().turnos.find((t) => !t.anulado && sePisan(t, { lugarId: f.lugarId, fecha, inicio: f.inicio, duracion: f.duracion }));
        exigir(!pisa, `Ese horario ya lo reservó ${pisa?.grupo}: liberá ese turno primero.`);
        const otroFijo = fijosDelDia(db().fijos.filter((x) => x.id !== f.id), fecha, f.lugarId).find((x) => sePisan(x, { lugarId: f.lugarId, fecha, inicio: f.inicio, duracion: f.duracion }));
        exigir(!otroFijo, `Ese horario ya es fijo de ${otroFijo?.grupo}: no se puede volver.`);
        f.liberadas = f.liberadas.filter((d) => d !== fecha);
        guardado.persistir();
        return true;
    }

    /** Un fijo nuevo: el día y la hora tienen que estar libres todas las semanas que vienen. */
    function nuevoFijo(usuario, { canchaId, dia, inicio, grupo }) {
        exigir(esDueno(usuario), "Solo el dueño crea turnos fijos.");
        const cancha = buscarCancha(canchaId);
        exigir(Number.isInteger(dia) && dia >= 0 && dia <= 6, "Elegí el día de la semana.");
        const g = revisarGrupo(grupo);
        exigir(db().fijos.length < TOPES.fijos, `Ya hay ${TOPES.fijos} turnos fijos. Es una demo: tocá "Empezar de cero" arriba.`);
        // La primera semana: este mismo día si todavía no pasó la hora; si no, la semana que viene
        let fecha = proximosDias(TOPES.dias).find((d) => diaSemana(d) === dia);
        if (fecha === hoy() && Number.isInteger(inicio) && inicio < minutoActual()) fecha = fechaLocalISO(7);
        revisarLibre({ lugarId: cancha.id, fecha, inicio, horario: horarioDe(cancha, fecha), turnos: db().turnos, fijos: db().fijos, desdeMinuto: desdeMinuto(fecha) });
        const otroFijo = fijoQueChoca(cancha.id, dia, inicio, TIPOS[cancha.tipo].duracion);
        exigir(!otroFijo, `Ese horario ya es fijo de ${otroFijo?.grupo} los ${DIAS[dia]}: elegí otro.`);
        const f = { id: nuevoId("f"), lugarId: cancha.id, dia, inicio, duracion: TIPOS[cancha.tipo].duracion, grupo: g, liberadas: [], asistencia: {}, precio: TIPOS[cancha.tipo].precio, desde: fecha };
        db().fijos.push(f);
        registrarPaso(usuario, "fijo");
        guardado.persistir();
        return listarFijos().find((x) => x.id === f.id);
    }

    const cantina = () => db().cantina.map(copia);
    const terminado = (t) => horasHasta(t) <= -t.duracion / 60;
    const senaQueCuenta = (t) => (t.sena === "pagada" ? t.montoSena ?? 0 : 0);

    function lugarCuenta(id, crear = false) {
        const { turno, fijo, fecha } = buscarTurno(id);
        if (!fijo) return { c: turno, precio: turno.precio, sena: senaQueCuenta(turno), activo: !turno.anulado && turno.estado !== "faltaron", jugadorId: turno.jugadorId, cuando: turno, turno };
        if (crear) {
            fijo.cuentas ??= {};
            fijo.cuentas[fecha] ??= { consumos: [], pago: null };
        }
        return {
            c: fijo.cuentas?.[fecha] ?? { consumos: [], pago: null }, precio: fijo.precio ?? turno.precio, sena: 0,
            activo: (fijo.asistencia?.[fecha] ?? "reservado") !== "faltaron", jugadorId: null, cuando: turno, turno: null
        };
    }

    function cuenta(id) {
        const { c: t, precio, sena } = lugarCuenta(id);
        const consumos = (t.consumos ?? []).map((c) => ({ ...copia(c), subtotal: c.precio * c.cantidad }));
        const total = precio + consumos.reduce((n, c) => n + c.subtotal, 0);
        return {
            id, turno: precio, sena, consumos, total, falta: t.pago ? 0 : total - sena,
            pago: t.pago ? copia(t.pago) : null, sinEntregar: consumos.filter((c) => !c.entregado).length
        };
    }

    function revisarItems(items) {
        exigir(Array.isArray(items) && items.length, "Elegí algo de la cantina.");
        exigir(new Set(items.map((i) => i.productoId)).size === items.length, "Cada producto va una sola vez (cambiá la cantidad).");
        return items.map(({ productoId, cantidad }) => {
            const p = buscar(db().cantina, productoId, "Ese producto no está en la cantina.");
            exigir(Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= TOPES.cantidad, `La cantidad de ${p.nombre} va de 1 a ${TOPES.cantidad}.`);
            exigir(cantidad <= p.stock, p.stock ? `De ${p.nombre} quedan solo ${p.stock}.` : `No queda ${p.nombre}.`);
            return { p, cantidad };
        });
    }

    function sumarACuenta(usuario, id, items) {
        const lugar = lugarCuenta(id);
        exigir(esDueno(usuario) || (esJugador(usuario) && lugar.jugadorId === usuario.id), "Solo podés pedir para tu turno.");
        exigir(lugar.activo, "Ese turno no está activo.");
        exigir(!lugar.c.pago, "Esa cuenta ya está pagada.");
        exigir(esDueno(usuario) || !terminado(lugar.cuando), "Ese turno ya terminó.");
        const t = lugarCuenta(id, true).c;
        const lista = revisarItems(items);
        t.consumos ??= [];
        exigir(t.consumos.length + lista.length <= TOPES.consumos, `Una cuenta puede tener hasta ${TOPES.consumos} renglones.`);
        lista.forEach(({ p, cantidad }) => {
            p.stock -= cantidad;
            t.consumos.push({ id: nuevoId("k"), productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad, por: usuario.nombre, delJugador: esJugador(usuario), cuando: ahora(), entregado: esDueno(usuario) });
        });
        if (esJugador(usuario)) registrarPaso(usuario, "pedido");
        guardado.persistir();
        return cuenta(id);
    }

    function entregar(usuario, id, consumoId) {
        exigir(esDueno(usuario), "Solo el dueño marca lo entregado.");
        const t = lugarCuenta(id).c;
        const c = buscar(t.consumos ?? [], consumoId, "Ese pedido no está en la cuenta.");
        c.entregado = true;
        guardado.persistir();
        return cuenta(id);
    }

    function cobrarCuenta(usuario, id, { medio, partes = 1, pagos = null } = {}) {
        exigir(esDueno(usuario), "Solo el dueño cobra la cuenta.");
        exigir(MEDIOS[medio] || medio === DIVIDIDO, "Elegí cómo pagan.");
        exigir(Number.isInteger(partes) && partes >= 1 && partes <= TOPES.partes, `Se divide entre 1 y ${TOPES.partes}.`);
        const lugar = lugarCuenta(id);
        exigir(lugar.turno ? !lugar.turno.anulado : lugar.activo, "Ese turno está liberado o cancelado.");
        exigir(!lugar.c.pago, "Esa cuenta ya está pagada.");
        const t = lugarCuenta(id, true).c;
        const { falta } = cuenta(id);
        const partesPago = medio === DIVIDIDO ? revisarPagos(falta, pagos) : null;
        t.pago = { total: falta, medio, partes: dividir(falta, partes), cuando: ahora(), por: usuario.nombre, ...(partesPago ? { pagos: partesPago } : {}) };
        if (lugar.turno?.sena === "pendiente") {
            lugar.turno.sena = "pagada";
            registrarPaso(usuario, "sena");
        }
        (t.consumos ?? []).forEach((c) => (c.entregado = true));
        guardado.persistir();
        return cuenta(id);
    }

    function venderCantina(usuario, { items, medio, pagaCon = null, pagos = null } = {}) {
        exigir(esDueno(usuario), "Solo el dueño vende en la cantina.");
        exigir(MEDIOS[medio] || medio === DIVIDIDO, "Elegí cómo paga.");
        exigir(db().ventasCantina.length < TOPES.ventasCantina, `Ya hay ${TOPES.ventasCantina} ventas. Es una demo: tocá "Empezar de cero" arriba.`);
        const lista = revisarItems(items);
        const total = lista.reduce((n, { p, cantidad }) => n + p.precio * cantidad, 0);
        let vuelto = null;
        if (medio === "efectivo" && pagaCon !== null && pagaCon !== "") {
            exigir(Number.isInteger(pagaCon) && pagaCon >= total && pagaCon <= TOPES.pagaCon, `Con ${pesos(Number(pagaCon) || 0)} no alcanza: son ${pesos(total)}.`);
            vuelto = pagaCon - total;
        }
        const partesPago = medio === DIVIDIDO ? revisarPagos(total, pagos) : null;
        lista.forEach(({ p, cantidad }) => (p.stock -= cantidad));
        const venta = { id: nuevoId("vc"), fecha: ahora(), items: lista.map(({ p, cantidad }) => ({ productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad })), total, medio, vuelto, ...(partesPago ? { pagos: partesPago } : {}) };
        db().ventasCantina.push(venta);
        guardado.persistir();
        return copia(venta);
    }

    function cantinaDelDia(fecha = hoy()) {
        const turnos = db().turnos.filter((t) => t.fecha === fecha && t.pago).reduce((n, t) => n + (t.consumos ?? []).reduce((m, c) => m + c.precio * c.cantidad, 0), 0);
        const deFijos = db().fijos.reduce((n, f) => n + (f.cuentas?.[fecha]?.pago ? f.cuentas[fecha].consumos.reduce((m, c) => m + c.precio * c.cantidad, 0) : 0), 0);
        const sueltas = db().ventasCantina.filter((v) => diaLocalDe(v.fecha) === fecha).reduce((n, v) => n + v.total, 0);
        return turnos + deFijos + sueltas;
    }

    return {
        guardado, pasos,
        dias, libresDe, reservar, misTurnos, cancelar, seDevuelve: (id) => seDevuelve(buscar(db().turnos, id)),
        grilla, nuevos, turno, marcarVisto, anotar, marcar, cobrarSena, liberar,
        listarFijos, liberarFijo, volverFijo, nuevoFijo,
        cantina, cuenta, sumarACuenta, entregar, cobrarCuenta, venderCantina, cantinaDelDia
    };
}
