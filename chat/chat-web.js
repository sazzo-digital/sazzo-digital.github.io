{
    const guion = document.currentScript;
    const BOT = guion.dataset.bot || "https://bot.sazzo.com.ar/web";
    const ORIGEN = guion.dataset.origen || "catalogo";
    const ESTILO = guion.dataset.estilo || "neon";
    const FLOTANTE = guion.dataset.flotante !== "no";
    const NOMBRE = guion.dataset.nombre || "";
    const PRIVACIDAD = guion.dataset.privacidad || "https://sazzo.com.ar/privacidad.html";
    const WHATSAPP = guion.dataset.whatsapp ?? "5492996210484";
    const INSTAGRAM = guion.dataset.instagram ?? "sazzo.digital";
    const MENSAJE = guion.dataset.mensaje || "Hola Sazzo! Vi las demos y quiero consultar por mi negocio.";
    const CADA = 3000;
    const CADA_PRESENCIA = 30000;
    const ESPERA = 5 * 60000;
    const GRAVEDAD = 0.21;
    const PAUSA_LIBRE = 12 * 3600000;
    let pausaBot = null;
    const VALIDO = /^[A-Za-z0-9-]{8,40}$/;
    const TEXTOS = {
        abrir: "Escribinos",
        pregunta: "¿Te ayudo a elegir tu demo?",
        cerrar: "Cerrar",
        titulo: "Sazzo",
        subtitulo: "Asistente automático · y si querés, te atiende una persona en vivo, acá mismo",
        asistente: "Bot en línea",
        disponible: `${NOMBRE || "Persona"} en línea`,
        ocupado: NOMBRE ? `${NOMBRE} ocupado` : "Persona ocupada",
        desconectado: NOMBRE ? `${NOMBRE} desconectado` : "Persona desconectada",
        hola: "¡Hola! 👋 Soy Sazzito, el asistente automático de Sazzo. Tocá tu rubro y te muestro la demo que te sirve, o escribime lo que necesitás.",
        invitaDisponible: "Chateá con Sazzito y él te deriva con nosotros en tiempo real",
        invitaOcupado: "Chateá con Sazzito: te ayuda ya y nos pasa tu consulta",
        invitaDesconectado: "Chateá con Sazzito: te ayuda las 24 h y nos deja tu consulta",
        invitaCerrar: "Cerrar el aviso",
        tema: "Cambiar claro / oscuro",
        plegar: "Plegar o desplegar la charla",
        nuevo: "Mensaje nuevo",
        saludos: ["¡Hola! Soy Sazzito 🚀", "¡Wiii! ¿Te ayudo a encontrar tu demo?", "Estoy volando, pero te leo 👀"],
        lugar: "Escribí tu consulta…",
        persona: "🙋 Hablar con una persona",
        libre: "✍️ Consulta libre",
        enVivo: "🟢 Hablar en vivo ahora",
        escribe: "escribiendo",
        muchos: "Recibimos muchos mensajes seguidos. Probá de nuevo en un rato.",
        fallo: "No pudimos mandar el mensaje. Revisá la conexión y probá de nuevo.",
        telefonoTarde: "¿No te respondimos todavía? Dejá tu WhatsApp y te escribimos.",
        telefonoYa: "¿Querés dejarnos tu WhatsApp para que te escribamos?",
        telefonoLugar: "Ej.: 299 621 0000",
        telefonoMandar: "Mandar",
        telefonoNo: "No, gracias",
        telefonoLegal: "Lo usamos solo para responderte. Más info en",
        telefonoListo: "¡Listo! Te escribimos a ese número 🙌",
        telefonoMal: "Revisá el número: tiene que tener entre 8 y 15 dígitos.",
    };

    const hoja = document.createElement("link");
    hoja.rel = "stylesheet";
    hoja.href = new URL("chat-web.css", guion.src).href;
    document.head.append(hoja);

    const leerDato = (clave) => {
        try {
            return JSON.parse(localStorage.getItem(clave));
        } catch {
            return null;
        }
    };
    const guardarDato = (clave, valor) => {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch {}
    };

    const inventar = () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join(""));
    let visitante = "";
    try {
        visitante = localStorage.getItem("sazzo-chat-visitante") ?? "";
        if (!VALIDO.test(visitante)) {
            visitante = inventar();
            localStorage.setItem("sazzo-chat-visitante", visitante);
        }
    } catch {
        visitante = inventar();
    }

    const caja = document.createElement("div");
    caja.className = `sazzo-chat sazzo-chat--${ESTILO}${FLOTANTE ? "" : " sazzo-chat--sin-boton"}`;
    caja.dataset.humano = "desconectado";
    const ponerTema = () => {
        const elegido = leerDato("sazzo-chat-tema");
        caja.dataset.tema = elegido === "claro" || elegido === "oscuro" ? elegido : document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro";
    };
    ponerTema();
    new MutationObserver(ponerTema).observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
    caja.innerHTML = `
        <button class="sazzo-chat__abrir" type="button" aria-expanded="false" aria-controls="sazzo-chat-panel"${FLOTANTE ? "" : " hidden"}>
            <svg class="sazzo-chat__globito" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>
            <span class="sazzo-chat__etiqueta">${TEXTOS.abrir}</span>
            <span class="sazzo-chat__pregunta">${TEXTOS.pregunta}</span>
            <svg class="sazzo-chat__cruz" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            <span class="sazzo-chat__chau">${TEXTOS.cerrar}</span>
            <span class="sazzo-chat__senal" aria-hidden="true"></span>
        </button>
        <p class="sazzo-chat__invita" hidden><button class="sazzo-chat__invita-texto" type="button"></button><button class="sazzo-chat__invita-cerrar" type="button" aria-label="${TEXTOS.invitaCerrar}">×</button></p>
        <div class="sazzo-chat__robot" aria-hidden="true"${FLOTANTE ? "" : " hidden"}>
            <svg viewBox="0 0 48 60">
                <path class="sr-trazo" d="M24 10V4"/>
                <circle class="sr-luz sr-antena" cx="24" cy="3.5" r="2.8"/>
                <path class="sr-trazo sr-brazo" d="M15 44l-6.5-5"/>
                <path class="sr-trazo" d="M33 44l6.5 4M20.5 51v5.5M27.5 51v5.5"/>
                <rect class="sr-pieza" x="15" y="39" width="18" height="13" rx="5"/>
                <rect class="sr-pieza" x="5" y="10" width="38" height="29" rx="12"/>
                <rect class="sr-visor" x="10" y="16" width="28" height="16" rx="8"/>
                <g class="sr-ojos"><circle class="sr-luz" cx="19" cy="23" r="2.7"/><circle class="sr-luz" cx="29" cy="23" r="2.7"/></g>
                <rect class="sr-luz sr-boca" x="21" y="27.6" width="6" height="1.9" rx="0.95"/>
            </svg>
            <span class="sazzo-chat__sombra"></span>
        </div>
        <section class="sazzo-chat__panel" id="sazzo-chat-panel" role="dialog" aria-label="Chat con Sazzo" hidden>
            <header class="sazzo-chat__cabecera">
                <svg class="sazzo-chat__iso" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#0B1210"/><path fill="none" stroke-width="10" stroke-linecap="round" stroke="#E6EFEB" d="M40.26 38.75 A13 7.5 0 1 0 29 50 A13 7.5 0 1 1 17.74 61.25"/><path fill="none" stroke="#34D399" stroke-width="9" stroke-linecap="round" d="M58 64 H82"/></svg>
                <button class="sazzo-chat__quien" type="button" aria-expanded="true" title="${TEXTOS.plegar}">
                    <span class="sazzo-chat__titulo">${TEXTOS.titulo}<span class="sazzo-chat__nuevo" hidden>${TEXTOS.nuevo}</span></span>
                    <span class="sazzo-chat__subtitulo">${TEXTOS.subtitulo}</span>
                </button>
                <button class="sazzo-chat__cerrar" type="button" aria-label="${TEXTOS.cerrar}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
                <ul class="sazzo-chat__presencia" aria-live="polite">
                    <li class="sazzo-chat__quienes sazzo-chat__quienes--bot">
                        <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="12" width="34" height="26" rx="10"/><path d="M24 12V6"/><circle cx="18" cy="25" r="2"/><circle cx="30" cy="25" r="2"/></svg>
                        <span>${TEXTOS.asistente}</span>
                    </li>
                    <li class="sazzo-chat__quienes sazzo-chat__quienes--humano">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.8 3.5-6 7-6s6.2 2.2 7 6"/></svg>
                        <span></span>
                    </li>
                </ul>
                <div class="sazzo-chat__acciones">
                    <button class="sazzo-chat__persona" type="button">${TEXTOS.persona}</button>
                    <a class="sazzo-chat__red" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}" target="_blank" rel="noopener" title="WhatsApp de Sazzo"${WHATSAPP ? "" : " hidden"}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.6 18.6z"/><path d="M9.2 8.6c.3 2.6 2.4 4.9 5.2 5.4l1-1.3-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z"/></svg>
                        <span class="sazzo-chat__oculto">WhatsApp de Sazzo</span>
                    </a>
                    <a class="sazzo-chat__red" href="https://instagram.com/${INSTAGRAM}" target="_blank" rel="noopener" title="Instagram de Sazzo"${INSTAGRAM ? "" : " hidden"}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r="0.6"/></svg>
                        <span class="sazzo-chat__oculto">Instagram de Sazzo</span>
                    </a>
                    <button class="sazzo-chat__red sazzo-chat__tema" type="button" title="${TEXTOS.tema}" aria-label="${TEXTOS.tema}">
                        <svg class="sazzo-chat__sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>
                        <svg class="sazzo-chat__luna" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
                    </button>
                </div>
            </header>
            <div class="sazzo-chat__cielo" aria-hidden="true"><svg class="sazzo-chat__marca" viewBox="0 12 240 56"><g fill="none" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path class="marca__letra" d="M34.26 28.75 A13 7.5 0 1 0 23 40 A13 7.5 0 1 1 11.74 51.25"/><circle class="marca__letra" cx="67" cy="40" r="15.4"/><path class="marca__letra" d="M82.4 25 V55"/><path class="marca__verde" d="M98 25 H124 L98 55 H124"/><path class="marca__verde" d="M140 25 H166 L140 55 H166"/><circle class="marca__letra" cx="197" cy="40" r="15.4"/></g><circle class="marca__punto" cx="197" cy="40" r="5"/></svg><div class="sazzito"><svg viewBox="0 0 48 66"><rect class="sr-pieza" x="8" y="38" width="7" height="16" rx="3.5"/><rect class="sr-pieza" x="33" y="38" width="7" height="16" rx="3.5"/><path class="sr-fuego" d="M8.5 55q3 11 6 0z"/><path class="sr-fuego" d="M33.5 55q3 11 6 0z"/><path class="sr-trazo" d="M24 10V4"/><circle class="sr-luz sr-antena" cx="24" cy="3.5" r="2.8"/><rect class="sr-pieza" x="15" y="39" width="18" height="13" rx="5"/><rect class="sr-pieza" x="5" y="10" width="38" height="29" rx="12"/><rect class="sr-visor" x="10" y="16" width="28" height="16" rx="8"/><g class="sr-ojos"><circle class="sr-luz" cx="19" cy="23" r="2.7"/><circle class="sr-luz" cx="29" cy="23" r="2.7"/></g><rect class="sr-luz sr-boca" x="21" y="27.6" width="6" height="1.9" rx="0.95"/></svg></div><p class="sazzito__dice" hidden></p></div>
            <div class="sazzo-chat__mensajes" role="log" aria-live="polite"></div>
            <form class="sazzo-chat__telefono" hidden novalidate>
                <p class="sazzo-chat__telefono-titulo"></p>
                <div class="sazzo-chat__telefono-fila">
                    <input type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="${TEXTOS.telefonoLugar}" aria-label="Tu WhatsApp">
                    <button class="sazzo-chat__telefono-mandar" type="submit">${TEXTOS.telefonoMandar}</button>
                </div>
                <button class="sazzo-chat__telefono-no" type="button">${TEXTOS.telefonoNo}</button>
                <p class="sazzo-chat__telefono-legal">${TEXTOS.telefonoLegal} <a href="${PRIVACIDAD}" target="_blank" rel="noopener">Privacidad</a>.</p>
            </form>
            <div class="sazzo-chat__rubros" hidden></div>
            <div class="sazzo-chat__rubros sazzo-chat__opciones" hidden></div>
            <p class="sazzo-chat__aviso" role="alert" hidden></p>
            <form class="sazzo-chat__form">
                <div class="sazzo-chat__fila">
                    <textarea rows="1" maxlength="500" placeholder="${TEXTOS.lugar}" aria-label="Tu mensaje"></textarea>
                    <button class="sazzo-chat__mandar" type="submit" aria-label="Mandar">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>
                    </button>
                </div>
            </form>
        </section>`;
    document.body.append(caja);

    const $ = (selector) => caja.querySelector(selector);
    const abrir = $(".sazzo-chat__abrir");
    const panel = $(".sazzo-chat__panel");
    const lista = $(".sazzo-chat__mensajes");
    const cajaRubros = $(".sazzo-chat__rubros");
    const cajaOpciones = $(".sazzo-chat__opciones");
    const aviso = $(".sazzo-chat__aviso");
    const form = $(".sazzo-chat__form");
    const campo = $(".sazzo-chat__form textarea");
    const telefono = $(".sazzo-chat__telefono");
    const botonPersona = $(".sazzo-chat__persona");
    const escribe = document.createElement("p");
    escribe.className = "sazzo-chat__globo sazzo-chat__globo--bot sazzo-chat__escribe";
    escribe.innerHTML = `${TEXTOS.escribe}<span aria-hidden="true"><i></i><i></i><i></i></span>`;

    let plegado = leerDato("sazzo-chat-plegado") === true;
    caja.classList.toggle("sazzo-chat--plegado", plegado);
    $(".sazzo-chat__quien").setAttribute("aria-expanded", String(!plegado));
    let ultimo = 0;
    let ultimoTipo = "";
    let ultimoEsteban = 0;
    let rubros = [];
    let opciones = [];
    let leyendo = false;
    let otraVez = false;
    let mandando = 0;
    let esperaBot = 0;
    let reloj = null;
    let humano = "desconectado";
    let disparador = null;
    const cielo = $(".sazzo-chat__cielo");
    const sazzito = $(".sazzito");
    const dice = $(".sazzito__dice");
    const quieto = matchMedia("(prefers-reduced-motion: reduce)");
    let vuelo = 0;
    let saludando = 0;
    let saludo = 0;
    let lugar = [0, 0];
    let rumbo = 0;
    let cuadro = 0;
    let vivido = 0;

    const bajar = () => {
        lista.scrollTop = lista.scrollHeight;
    };

    const linkear = (texto, destino) => {
        let desde = 0;
        for (const m of texto.matchAll(/https?:\/\/[^\s<>"]+/g)) {
            const url = m[0].replace(/[.,;:!?)»]+$/, "");
            destino.append(texto.slice(desde, m.index));
            const a = document.createElement("a");
            a.href = url;
            a.textContent = url.replace(/^https?:\/\//, "");
            a.target = "_blank";
            a.rel = "noopener";
            destino.append(a);
            desde = m.index + url.length;
        }
        destino.append(texto.slice(desde));
    };

    const globo = (texto, rol, clase = "") => {
        const p = document.createElement("p");
        p.className = `sazzo-chat__globo sazzo-chat__globo--${rol === "cliente" ? "vos" : "bot"} ${clase}`;
        linkear(texto, p);
        lista.append(p);
        if (escribe.isConnected) lista.append(escribe);
        bajar();
        return p;
    };

    const pintarEscribe = () => {
        const si = mandando > 0 || Date.now() < esperaBot;
        caja.classList.toggle("sazzo-chat--escribe", si);
        if (si) lista.append(escribe);
        else escribe.remove();
    };

    const presencia = (p) => {
        humano = p?.humano ?? "desconectado";
        caja.dataset.humano = humano;
        $(".sazzo-chat__quienes--humano span").textContent = TEXTOS[humano] ?? TEXTOS.desconectado;
        botonPersona.textContent = humano === "disponible" ? TEXTOS.enVivo : TEXTOS.persona;
        $(".sazzo-chat__invita-texto").textContent = humano === "disponible" ? TEXTOS.invitaDisponible : humano === "ocupado" ? TEXTOS.invitaOcupado : TEXTOS.invitaDesconectado;
    };

    const leerPresencia = async () => {
        try {
            const r = await fetch(`${BOT}/presencia`);
            if (r.ok) presencia(await r.json());
        } catch {}
    };

    const revisarTelefono = () => {
        const pidio = leerDato("sazzo-chat-persona");
        const listo = leerDato("sazzo-chat-telefono");
        const mostrarlo = Boolean(pidio) && !listo && ultimoEsteban <= pidio.id && Date.now() >= pidio.cuando + pidio.espera;
        if (mostrarlo && telefono.hidden) {
            $(".sazzo-chat__telefono-titulo").textContent = pidio.espera ? TEXTOS.telefonoTarde : TEXTOS.telefonoYa;
            lista.append(telefono);
            telefono.hidden = false;
            bajar();
        }
        if (!mostrarlo) telefono.hidden = true;
    };

    const pintarRubros = () => {
        if (!cajaRubros.children.length && rubros.length) {
            for (const r of rubros) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "sazzo-chat__rubro";
                b.textContent = r.texto;
                b.addEventListener("click", () => mandar({ rubro: r.id }, r.texto));
                cajaRubros.append(b);
            }
            const libre = document.createElement("button");
            libre.type = "button";
            libre.className = "sazzo-chat__rubro sazzo-chat__rubro--libre";
            libre.textContent = TEXTOS.libre;
            libre.addEventListener("click", () => mandar({ libre: true }, TEXTOS.libre));
            cajaRubros.append(libre);
        }
        cajaRubros.hidden = mandando > 0 || !(ultimo === 0 || ultimoTipo === "rubros");
        $(".sazzo-chat__intro")?.toggleAttribute("hidden", ultimo > 0);
        cajaOpciones.hidden = mandando > 0 || ultimoTipo !== "opciones" || !opciones.length;
    };

    const ponerOpciones = (texto) => {
        let datos = [];
        try {
            datos = JSON.parse(texto);
        } catch {}
        opciones = Array.isArray(datos) ? datos.filter((o) => typeof o === "string" && o.trim()).slice(0, 3) : [];
        cajaOpciones.replaceChildren();
        for (const o of opciones) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "sazzo-chat__rubro";
            b.textContent = o;
            b.addEventListener("click", () => mandar(o === "Prefiero hablar con una persona" ? { persona: true } : { texto: o }, o));
            cajaOpciones.append(b);
        }
    };

    const reiniciar = () => {
        if (plegado) plegar(false);
        try {
            ["sazzo-chat-visitante", "sazzo-chat-libre", "sazzo-chat-plegado", "sazzo-chat-persona", "sazzo-chat-telefono"].forEach((clave) => localStorage.removeItem(clave));
        } catch {}
        visitante = inventar();
        try {
            localStorage.setItem("sazzo-chat-visitante", visitante);
        } catch {}
        ultimo = 0;
        ultimoTipo = "";
        ultimoEsteban = 0;
        pausaBot = null;
        esperaBot = 0;
        telefono.hidden = true;
        lista.replaceChildren();
        opciones = [];
        cajaOpciones.replaceChildren();
        globo(TEXTOS.hola, "bot", "sazzo-chat__intro");
        pintarEscribe();
        pintarRubros();
    };

    const leer = async () => {
        if (leyendo) {
            otraVez = true;
            return;
        }
        leyendo = true;
        try {
            const r = await fetch(`${BOT}?visitante=${encodeURIComponent(visitante)}&desde=${ultimo}`);
            if (r.ok) {
                const d = await r.json();
                if (d.reiniciada === true) {
                    reiniciar();
                    leyendo = false;
                    return;
                }
                rubros = d.rubros ?? rubros;
                if (typeof d.pausa === "boolean") pausaBot = d.pausa;
                if (d.presencia) presencia(d.presencia);
                const primera = ultimo === 0;
                for (const m of d.mensajes ?? []) {
                    if (m.id <= ultimo) continue;
                    if (plegado && !primera && m.rol !== "cliente") $(".sazzo-chat__nuevo").hidden = false;
                    ultimo = m.id;
                    ultimoTipo = m.tipo;
                    if (m.tipo === "esteban") ultimoEsteban = m.id;
                    if (m.rol !== "cliente") esperaBot = 0;
                    if (m.tipo === "opciones") {
                        ponerOpciones(m.texto ?? "");
                        continue;
                    }
                    const pendiente = m.rol === "cliente" && lista.querySelector(".sazzo-chat__globo--pendiente");
                    if (pendiente) {
                        pendiente.classList.remove("sazzo-chat__globo--pendiente");
                        continue;
                    }
                    if (!m.texto) continue;
                    const p = globo(m.texto, m.rol, m.tipo === "esteban" ? "sazzo-chat__globo--persona" : "");
                    if (m.tipo === "esteban") {
                        const quien = document.createElement("span");
                        quien.className = "sazzo-chat__es";
                        quien.textContent = NOMBRE ? `${NOMBRE} · del equipo` : "Persona del equipo";
                        p.prepend(quien);
                    }
                }
                pintarEscribe();
                const sinOpciones = cajaOpciones.hidden;
                pintarRubros();
                if (sinOpciones && !cajaOpciones.hidden) bajar();
                revisarTelefono();
            }
        } catch {}
        leyendo = false;
        if (otraVez) {
            otraVez = false;
            leer();
        }
    };

    const avisar = (texto) => {
        aviso.textContent = texto;
        aviso.hidden = !texto;
    };

    const enviar = async (cuerpo) => {
        try {
            const r = await fetch(BOT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visitante, origen: ORIGEN, ...cuerpo }) });
            if (r.status === 429) return (await r.json().catch(() => ({}))).error || TEXTOS.muchos;
            return r.ok ? "" : TEXTOS.fallo;
        } catch {
            return TEXTOS.fallo;
        }
    };

    const mandar = async (cuerpo, texto) => {
        avisar("");
        campo.placeholder = TEXTOS.lugar;
        const pendiente = globo(texto, "cliente", "sazzo-chat__globo--pendiente");
        const conHumano = humano === "disponible";
        const enPausa = !cuerpo.libre && (pausaBot ?? (leerDato("sazzo-chat-libre") ?? 0) > Date.now());
        mandando++;
        esperaBot = enPausa ? 0 : Date.now() + 45000;
        pintarEscribe();
        pintarRubros();
        bajar();
        const error = await enviar(cuerpo);
        mandando--;
        if (error) esperaBot = 0;
        pintarEscribe();
        if (error) {
            pendiente.classList.replace("sazzo-chat__globo--pendiente", "sazzo-chat__globo--fallo");
            avisar(error);
        }
        if (cuerpo.libre && !error) guardarDato("sazzo-chat-libre", Date.now() + PAUSA_LIBRE);
        await leer();
        if (cuerpo.persona && !error) {
            guardarDato("sazzo-chat-persona", { cuando: Date.now(), espera: conHumano ? ESPERA : 0, id: ultimo });
            revisarTelefono();
        }
        pintarRubros();
    };

    const crecer = () => {
        campo.style.height = "auto";
        campo.style.height = `${Math.min(campo.scrollHeight, 132)}px`;
    };

    const ubicarCielo = () => {
        cielo.style.top = `${lista.offsetTop}px`;
        cielo.style.height = `${lista.clientHeight + (cajaRubros.hidden ? 0 : cajaRubros.offsetHeight) + (cajaOpciones.hidden ? 0 : cajaOpciones.offsetHeight)}px`;
    };

    const volar = (ms) => {
        cancelAnimationFrame(vuelo);
        if (panel.hidden || plegado) return;
        const t = ms / 1000;
        const ancho = Math.max(0, cielo.clientWidth - sazzito.offsetWidth);
        const alto = Math.max(0, cielo.clientHeight - sazzito.offsetHeight);
        const ultimoHijo = [...lista.children].filter((h) => !h.hidden).at(-1);
        const ocupado = ultimoHijo ? ultimoHijo.getBoundingClientRect().bottom - cielo.getBoundingClientRect().top + 6 : 0;
        const arriba = alto - ocupado > 24 ? Math.max(0, ocupado) : 0;
        const lento = matchMedia("(max-width: 520px)").matches ? 0.55 : 1;
        const dt = Math.min(0.1, Math.max(0, t - cuadro));
        cuadro = t;
        if (quieto.matches) lugar = [ancho - 8, alto - 8];
        else if (t > saludando) {
            vivido += dt;
            const u = vivido * lento;
            const camino = (k) => [ancho * (0.5 + 0.3 * Math.sin(k * 0.31) + 0.2 * Math.sin(k * 0.83 + 1.3)), arriba + (alto - arriba) * (0.5 + 0.3 * Math.sin(k * 0.47 + 2) + 0.2 * Math.sin(k * 1.1))];
            const [x0, y0] = camino(u - 0.05);
            const [x1, y1] = camino(u);
            const [x2, y2] = camino(u + 0.05);
            lugar = [x1, y1 + Math.sin(u * 3) * 3];
            const empujeX = (x2 - 2 * x1 + x0) / 0.0025 + (x2 - x0) / 0.1;
            const empujeY = (y2 - 2 * y1 + y0) / 0.0025 + (y2 - y0) / 0.1 - GRAVEDAD * (alto - arriba);
            let giro = (Math.atan2(empujeX, -empujeY) * 180) / Math.PI - rumbo;
            giro %= 360;
            if (giro > 180) giro -= 360;
            if (giro < -180) giro += 360;
            rumbo += giro * (1 - Math.exp(-dt * 7));
            sazzito.style.setProperty("--rumbo", `${rumbo.toFixed(1)}deg`);
        }
        sazzito.style.transform = `translate(${lugar[0]}px, ${lugar[1]}px)`;
        if (!quieto.matches) vuelo = requestAnimationFrame(volar);
    };

    const saludar = () => {
        const ahora = performance.now() / 1000;
        saludando = ahora + 2.6;
        dice.textContent = TEXTOS.saludos[saludo++ % TEXTOS.saludos.length];
        dice.hidden = false;
        dice.style.left = `${Math.max(4, Math.min(lugar[0] - 40, cielo.clientWidth - dice.offsetWidth - 4))}px`;
        dice.style.top = `${Math.max(4, lugar[1] - dice.offsetHeight - 8)}px`;
        sazzito.classList.remove("sazzito--pirueta");
        void sazzito.offsetWidth;
        sazzito.classList.add("sazzito--pirueta");
        setTimeout(() => (dice.hidden = true), 2600);
    };

    const tocaSazzito = (e) => {
        const r = sazzito.getBoundingClientRect();
        return (e.target === lista || e.target === cajaRubros) && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };

    const mostrar = (si) => {
        panel.hidden = !si;
        if (si) $(".sazzo-chat__invita").hidden = true;
        caja.classList.toggle("sazzo-chat--abierto", si);
        abrir.setAttribute("aria-expanded", String(si));
        document.querySelectorAll("[data-abrir-chat]").forEach((b) => {
            b.setAttribute("aria-expanded", String(si));
            b.setAttribute("aria-controls", "sazzo-chat-panel");
        });
        clearInterval(reloj);
        reloj = null;
        if (si) {
            ubicarCielo();
            requestAnimationFrame(volar);
            leer();
            reloj = setInterval(() => document.hidden || leer(), CADA);
            (plegado ? $(".sazzo-chat__quien") : campo).focus();
        } else (FLOTANTE ? abrir : disparador)?.focus();
    };

    globo(TEXTOS.hola, "bot", "sazzo-chat__intro");
    abrir.addEventListener("click", () => mostrar(panel.hidden));
    $(".sazzo-chat__cerrar").addEventListener("click", () => mostrar(false));
    const plegar = (si) => {
        plegado = si;
        caja.classList.toggle("sazzo-chat--plegado", si);
        $(".sazzo-chat__quien").setAttribute("aria-expanded", String(!si));
        guardarDato("sazzo-chat-plegado", si);
        if (si) return;
        $(".sazzo-chat__nuevo").hidden = true;
        ubicarCielo();
        bajar();
        requestAnimationFrame(volar);
    };
    $(".sazzo-chat__quien").addEventListener("click", () => plegar(!plegado));
    $(".sazzo-chat__iso").addEventListener("click", () => plegar(!plegado));
    document.addEventListener("click", (e) => {
        const boton = e.target.closest("[data-abrir-chat]");
        if (!boton) return;
        e.preventDefault();
        disparador = boton;
        mostrar(panel.hidden);
    });
    panel.addEventListener("keydown", (e) => {
        if (e.key === "Escape") mostrar(false);
    });
    botonPersona.addEventListener("click", () => mandar({ persona: true }, botonPersona.textContent));
    $(".sazzo-chat__tema").addEventListener("click", () => {
        caja.dataset.tema = caja.dataset.tema === "claro" ? "oscuro" : "claro";
        guardarDato("sazzo-chat-tema", caja.dataset.tema);
    });
    telefono.addEventListener("submit", async (e) => {
        e.preventDefault();
        const entrada = telefono.querySelector("input");
        const numero = entrada.value.replace(/[\s().-]/g, "");
        if (!/^\+?\d{8,15}$/.test(numero)) {
            avisar(TEXTOS.telefonoMal);
            entrada.focus();
            return;
        }
        avisar("");
        const boton = telefono.querySelector(".sazzo-chat__telefono-mandar");
        boton.disabled = true;
        const error = await enviar({ telefono: numero });
        boton.disabled = false;
        if (error) return avisar(error);
        guardarDato("sazzo-chat-telefono", "dejado");
        telefono.hidden = true;
        globo(TEXTOS.telefonoListo, "bot");
    });
    $(".sazzo-chat__telefono-no").addEventListener("click", () => {
        guardarDato("sazzo-chat-telefono", "no");
        telefono.hidden = true;
    });
    campo.addEventListener("input", crecer);
    campo.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto = campo.value.trim();
        if (!texto) return;
        campo.value = "";
        crecer();
        mandar({ texto }, texto);
    });

    const medir = new ResizeObserver(ubicarCielo);
    medir.observe(lista);
    medir.observe(cajaRubros);
    medir.observe(cajaOpciones);
    [lista, cajaRubros].forEach((zona) => {
        zona.addEventListener("click", (e) => tocaSazzito(e) && saludar());
        zona.addEventListener("mousemove", (e) => (zona.style.cursor = tocaSazzito(e) ? "pointer" : ""));
    });
    document.addEventListener("visibilitychange", () => document.hidden || requestAnimationFrame(volar));
    $(".sazzo-chat__invita-texto").addEventListener("click", () => mostrar(true));
    $(".sazzo-chat__invita-cerrar").addEventListener("click", () => {
        $(".sazzo-chat__invita").hidden = true;
        try {
            sessionStorage.setItem("sazzo-chat-invita", "no");
        } catch {}
    });
    let invitar = FLOTANTE;
    try {
        invitar = FLOTANTE && sessionStorage.getItem("sazzo-chat-invita") !== "no";
    } catch {}
    if (invitar) setTimeout(() => panel.hidden && ($(".sazzo-chat__invita").hidden = false), 2500);
    presencia(null);
    leerPresencia();
    setInterval(() => document.hidden || leerPresencia(), CADA_PRESENCIA);
}
