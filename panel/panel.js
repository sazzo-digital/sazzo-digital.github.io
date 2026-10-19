{
    const guion = document.currentScript;
    const pedido = new URLSearchParams(location.search);
    const BASE = pedido.get("bot") === "local" ? "http://127.0.0.1:8787" : guion.dataset.bot || "https://bot.sazzo.com.ar";
    const CADA_LISTA = 4000;
    const CADA_CHARLA = 2500;
    const CADA_LATIDO = 25000;
    const PUSH = { clave: "/panel/push/clave", suscribir: "/panel/push/suscribir", borrar: "/panel/push/borrar" };
    const SE_VE = { disponible: "te ven en línea", ocupado: "te ven ocupado", desconectado: "te ven desconectado" };
    const RUBROS = {
        kiosco: "Kiosco", barberia: "Barbería", taller: "Taller", "restix-web": "Restix", gimnasio: "Gimnasio", canchas: "Canchas", perfumeria: "Perfumería",
        ferreteria: "Ferretería", carniceria: "Carnicería", libreria: "Librería", inmobiliaria: "Inmobiliaria", contable: "Contable", flota: "Flota", otro: "Otro rubro",
    };

    const leer = (clave, si) => {
        try {
            return JSON.parse(localStorage.getItem(clave)) ?? si;
        } catch {
            return si;
        }
    };
    const guardar = (clave, valor) => {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch {}
    };

    const $ = (selector) => document.querySelector(selector);
    const raiz = document.documentElement;
    const entrada = $(".entrada");
    const app = $(".app");
    const items = $(".lista__items");
    const mensajes = $(".charla__mensajes");
    const campo = $(".charla__form textarea");

    let clave = leer("sazzo-panel-clave", "");
    let vistos = leer("sazzo-panel-vistos", {});
    let sonido = leer("sazzo-panel-sonido", true);
    let charlas = [];
    let abierta = null;
    let ultimo = 0;
    let filtro = "todas";
    let conocidos = null;
    let sinLeer = 0;
    let relojLista = null;
    let relojCharla = null;
    let relojLatido = null;
    let relojVence = null;
    let miEstado = "invisible";
    let misMinutos = 0;
    let vence = 0;
    const cielo = $(".charla__cielo");
    const sazzito = $(".sazzito");
    const dice = $(".sazzito__dice");
    const quieto = matchMedia("(prefers-reduced-motion: reduce)");
    const SALUDOS = ["¡Hola, Esteban! 🚀", "Yo atiendo mientras tanto 💪", "¡Vamos, que hay gente esperando!"];
    let saludando = 0;
    let saludo = 0;
    let lugar = [0, 0];
    let inclina = 0;
    let leyendo = false;
    let audio = null;
    let instalar = null;
    const conAvisos = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    const tema = (claro) => {
        raiz.dataset.tema = claro ? "claro" : "oscuro";
        $("[data-cambiar-tema]").textContent = claro ? "Oscuro" : "Claro";
        try {
            localStorage.setItem("sazzo-tema", raiz.dataset.tema);
        } catch {}
    };
    try {
        tema(localStorage.getItem("sazzo-tema") === "claro");
    } catch {
        tema(false);
    }

    const hora = (fecha) => (fecha ? new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "");
    const cuando = (fecha) => {
        if (!fecha) return "";
        const minutos = Math.round((Date.now() - new Date(fecha)) / 60000);
        if (minutos < 1) return "recién";
        if (minutos < 60) return `hace ${minutos} min`;
        if (new Date(fecha).toDateString() === new Date().toDateString()) return hora(fecha);
        return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    };
    const nombre = (id) => `Visitante ${id.slice(-4)}`;
    const rubro = (c) => RUBROS[c.rubro] ?? (c.rubro ? c.rubro : "Sin rubro todavía");
    const llego = (c) => (c.demo ? `demo ${c.demo}` : "catálogo");
    const estado = (c) => (c.enPausa ? `La tenés vos${c.hasta ? ` hasta las ${hora(c.hasta)}` : ""}` : "Contesta el bot");
    const nueva = (c) => c.ultimo?.rol === "cliente" && c.ultimo.id > (vistos[c.id] ?? 0) && c.id !== abierta;

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

    const sonar = () => {
        if (!sonido) return;
        try {
            audio ??= new AudioContext();
            [880, 1320].forEach((frecuencia, i) => {
                const tono = audio.createOscillator();
                const volumen = audio.createGain();
                const arranca = audio.currentTime + i * 0.14;
                tono.frequency.value = frecuencia;
                volumen.gain.setValueAtTime(0.0001, arranca);
                volumen.gain.exponentialRampToValueAtTime(0.18, arranca + 0.02);
                volumen.gain.exponentialRampToValueAtTime(0.0001, arranca + 0.18);
                tono.connect(volumen).connect(audio.destination);
                tono.start(arranca);
                tono.stop(arranca + 0.2);
            });
        } catch {}
    };

    const titulo = () => {
        document.title = sinLeer ? `(${sinLeer}) Charlas · Sazzo` : "Charlas · Sazzo";
    };

    const red = (bien) => {
        $(".red").hidden = bien;
    };

    const insignia = (n) => {
        if (!("setAppBadge" in navigator)) return;
        (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
    };

    const pedir = async (ruta, cuerpo) => {
        const opciones = { headers: { authorization: `Bearer ${clave}` } };
        if (cuerpo) {
            opciones.method = "POST";
            opciones.headers["content-type"] = "application/json";
            opciones.body = JSON.stringify(cuerpo);
        }
        const r = await fetch(`${BASE}${ruta}`, opciones);
        if (r.status === 401) {
            salir("La clave no es correcta.");
            throw new Error("clave");
        }
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
    };

    const pintarLista = () => {
        const cuentas = { todas: charlas.length, activas: charlas.filter((c) => c.activa).length, tuyas: charlas.filter((c) => c.enPausa).length };
        document.querySelectorAll("[data-filtro]").forEach((b) => {
            b.setAttribute("aria-selected", String(b.dataset.filtro === filtro));
            b.querySelector("span").textContent = cuentas[b.dataset.filtro] || "";
        });
        insignia(charlas.filter(nueva).length);
        const lista = charlas.filter((c) => filtro === "todas" || (filtro === "activas" ? c.activa : c.enPausa)).sort((a, b) => b.activa - a.activa);
        items.replaceChildren();
        if (!lista.length) {
            const li = document.createElement("li");
            li.className = "lista__vacia";
            li.textContent = filtro === "todas" ? "Todavía no hay charlas. Cuando alguien escriba en la web, aparece acá." : "No hay charlas en este grupo.";
            items.append(li);
        }
        for (const c of lista) {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.type = "button";
            b.className = "item";
            b.classList.toggle("item--activa", c.activa);
            b.classList.toggle("item--nueva", nueva(c));
            if (c.id === abierta) b.setAttribute("aria-current", "true");
            b.innerHTML = `<span class="item__cara"></span><span class="item__texto"><span class="item__fila"><strong></strong><time></time></span><span class="item__meta"></span><span class="item__ultimo"></span></span>`;
            b.querySelector(".item__cara").textContent = rubro(c).charAt(0);
            b.querySelector("strong").textContent = nombre(c.id);
            b.querySelector("time").textContent = cuando(c.ultimo?.fecha);
            b.querySelector(".item__meta").textContent = `${rubro(c)} · ${llego(c)}${c.enPausa ? " · tuya" : ""}`;
            b.querySelector(".item__ultimo").textContent = c.ultimo ? `${c.ultimo.rol === "cliente" ? "" : "Sazzo: "}${c.ultimo.texto}` : "";
            b.addEventListener("click", () => abrir(c.id));
            li.append(b);
            items.append(li);
        }
    };

    const pintarCabecera = (c) => {
        if (!c) return;
        $(".charla__titulo").textContent = nombre(c.id);
        $(".charla__meta").textContent = `${rubro(c)} · entró por ${llego(c)}${c.activa ? " · escribió hace poco" : ""}`;
        $(".charla__estado").textContent = estado(c);
        $(".charla__estado").classList.toggle("charla__estado--tuya", c.enPausa);
        $("[data-tomar]").hidden = c.enPausa;
        $("[data-devolver]").hidden = !c.enPausa;
        const whatsapp = $(".charla__whatsapp");
        whatsapp.hidden = !c.telefono;
        if (c.telefono) {
            whatsapp.href = `https://wa.me/${c.telefono.replace(/\D/g, "")}`;
            whatsapp.textContent = `WhatsApp ${c.telefono}`;
        }
    };

    const globo = (m) => {
        const quien = m.rol === "cliente" ? "cliente" : m.tipo === "esteban" ? "esteban" : "bot";
        const div = document.createElement("div");
        div.className = `msj msj--${quien}`;
        const arriba = document.createElement("p");
        arriba.className = "msj__quien";
        arriba.textContent = `${quien === "cliente" ? "Visitante" : quien === "esteban" ? "Vos" : "Bot"} · ${hora(m.fecha)}`;
        const texto = document.createElement("p");
        texto.className = "msj__texto";
        linkear(m.texto ?? "", texto);
        div.append(arriba, texto);
        if (m.tipo === "rubros") {
            const nota = document.createElement("p");
            nota.className = "msj__nota";
            nota.textContent = "Le mostró los botones de rubro";
            div.append(nota);
        }
        mensajes.append(div);
    };

    const leerCharla = async () => {
        if (!abierta || leyendo) return;
        leyendo = true;
        const id = abierta;
        try {
            const d = await pedir(`/panel/charla?id=${encodeURIComponent(id)}&desde=${ultimo}`);
            if (id === abierta) {
                const abajo = mensajes.scrollHeight - mensajes.scrollTop - mensajes.clientHeight < 80;
                for (const m of d.mensajes ?? []) {
                    if (m.id <= ultimo) continue;
                    ultimo = m.id;
                    globo(m);
                }
                if (abajo || ultimo === 0) mensajes.scrollTop = mensajes.scrollHeight;
                const i = charlas.findIndex((c) => c.id === id);
                if (d.charla && i >= 0) charlas[i] = d.charla;
                pintarCabecera(d.charla);
                vistos[id] = Math.max(vistos[id] ?? 0, ultimo);
                guardar("sazzo-panel-vistos", vistos);
                pintarLista();
            }
            red(true);
        } catch (e) {
            if (e.message === "404") avisar("Esta charla ya no está.");
            else if (e.message !== "clave") red(false);
        }
        leyendo = false;
    };

    const leerLista = async () => {
        try {
            const d = await pedir("/panel/charlas");
            const antes = conocidos;
            conocidos = {};
            let llegaron = 0;
            for (const c of d.charlas ?? []) {
                conocidos[c.id] = c.ultimo?.id ?? 0;
                if (antes && c.ultimo?.rol === "cliente" && c.ultimo.id > (antes[c.id] ?? 0)) llegaron++;
            }
            charlas = d.charlas ?? [];
            if (llegaron) {
                sonar();
                if (document.hidden || !abierta) sinLeer += llegaron;
                titulo();
            }
            pintarLista();
            if (abierta) pintarCabecera(charlas.find((c) => c.id === abierta));
            red(true);
            return true;
        } catch (e) {
            if (e.message !== "clave") red(false);
            return false;
        }
    };

    const avisar = (texto) => {
        $(".charla__aviso").textContent = texto;
        $(".charla__aviso").hidden = !texto;
    };

    const abrir = (id, historia = true) => {
        abierta = id;
        ultimo = 0;
        avisar("");
        mensajes.replaceChildren();
        $(".charla__vacia").hidden = true;
        $(".charla__llena").hidden = false;
        app.classList.add("app--charla");
        ubicarCielo();
        pintarCabecera(charlas.find((c) => c.id === id) ?? { id, rubro: null, demo: null, enPausa: false });
        if (historia) {
            const url = new URL(location.href);
            url.searchParams.set("charla", id);
            history.pushState({ charla: id }, "", url);
        }
        if (conAvisos)
            navigator.serviceWorker.ready
                .then((r) => r.getNotifications({ tag: id }))
                .then((avisos) => avisos.forEach((a) => a.close()))
                .catch(() => {});
        clearInterval(relojCharla);
        leerCharla();
        relojCharla = setInterval(leerCharla, CADA_CHARLA);
        pintarLista();
        if (matchMedia("(min-width: 761px)").matches) campo.focus();
    };

    const cerrar = () => {
        abierta = null;
        clearInterval(relojCharla);
        app.classList.remove("app--charla");
        $(".charla__vacia").hidden = false;
        $(".charla__llena").hidden = true;
        ubicarCielo();
        pintarLista();
    };

    const accion = async (ruta, boton, cuerpo = {}) => {
        boton.disabled = true;
        avisar("");
        try {
            await pedir(ruta, { id: abierta, ...cuerpo });
            await leerLista();
            await leerCharla();
            boton.disabled = false;
            return true;
        } catch (e) {
            if (e.message !== "clave") avisar("No se pudo. Probá de nuevo en un momento.");
            boton.disabled = false;
            return false;
        }
    };

    const contarVence = () => {
        const vivo = $(".barra__vivo");
        const humano = vivo.dataset.humano;
        const falta = vence - Date.now();
        if (humano === "disponible" && vence && falta <= 0) vivo.dataset.humano = "desconectado";
        const resto = humano === "disponible" && falta > 0 ? ` · vence en ${Math.floor(falta / 60000)}:${String(Math.floor(falta / 1000) % 60).padStart(2, "0")}` : "";
        vivo.textContent = `${SE_VE[vivo.dataset.humano] ?? SE_VE.desconectado}${resto}`;
    };

    const mostrarEstado = (d) => {
        miEstado = d.estado ?? miEstado;
        if (d.hasta) vence = Date.parse(d.hasta);
        if (miEstado !== "disponible") vence = 0;
        document.querySelectorAll("[data-estado]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.estado === miEstado && (miEstado !== "disponible" || Number(b.dataset.minutos) === misMinutos))));
        $(".barra__vivo").dataset.humano = d.humano ?? "desconectado";
        contarVence();
    };

    const latir = async (estado, minutos) => {
        if (estado) {
            misMinutos = minutos || 0;
            vence = minutos ? Date.now() + minutos * 60000 : 0;
        }
        try {
            mostrarEstado(await pedir("/panel/presencia", estado ? { estado, ...(minutos ? { minutos } : {}) } : {}));
        } catch (e) {
            if (e.message !== "clave") mostrarEstado({ humano: "desconectado" });
        }
    };

    const ubicarCielo = () => {
        const llena = !$(".charla__llena").hidden;
        cielo.style.top = `${llena ? mensajes.offsetTop : 0}px`;
        cielo.style.height = llena ? `${mensajes.clientHeight}px` : "100%";
        if (quieto.matches) requestAnimationFrame(volar);
    };

    const volar = (ms) => {
        const t = ms / 1000;
        const ancho = Math.max(0, cielo.clientWidth - sazzito.offsetWidth);
        const alto = Math.max(0, cielo.clientHeight - sazzito.offsetHeight);
        const ultimoHijo = $(".charla__llena").hidden ? null : mensajes.lastElementChild;
        const ocupado = ultimoHijo ? ultimoHijo.getBoundingClientRect().bottom - cielo.getBoundingClientRect().top + 6 : 0;
        const arriba = alto - ocupado > 24 ? Math.max(0, ocupado) : 0;
        const lento = matchMedia("(max-width: 760px)").matches ? 0.55 : 1;
        if (quieto.matches) lugar = [ancho - 12, alto - 12];
        else if (t > saludando) {
            const u = t * lento;
            const antes = lugar[0];
            lugar = [ancho * (0.5 + 0.3 * Math.sin(u * 0.29) + 0.2 * Math.sin(u * 0.77 + 1.3)), arriba + (alto - arriba) * (0.5 + 0.3 * Math.sin(u * 0.43 + 2) + 0.2 * Math.sin(u * 1.05)) + Math.sin(u * 3) * 3];
            const paso = lugar[0] - antes;
            if (Math.abs(paso) > 0.15) sazzito.style.setProperty("--mira", paso < 0 ? "-1" : "1");
            inclina += (Math.max(-12, Math.min(12, paso * 6)) - inclina) * 0.08;
            sazzito.style.setProperty("--inclina", `${inclina.toFixed(2)}deg`);
        }
        sazzito.style.transform = `translate(${lugar[0]}px, ${lugar[1]}px)`;
        if (!quieto.matches) requestAnimationFrame(volar);
    };

    const saludar = () => {
        saludando = performance.now() / 1000 + 2.6;
        dice.textContent = SALUDOS[saludo++ % SALUDOS.length];
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
        return (e.target === mensajes || e.target.closest(".charla__vacia")) && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };

    const iniciar = async () => {
        entrada.hidden = true;
        app.hidden = false;
        if (!(await leerLista())) return;
        clearInterval(relojLista);
        relojLista = setInterval(leerLista, CADA_LISTA);
        clearInterval(relojLatido);
        latir();
        relojLatido = setInterval(() => latir(), CADA_LATIDO);
        clearInterval(relojVence);
        relojVence = setInterval(contarVence, 1000);
        const pedida = new URLSearchParams(location.search).get("charla");
        if (pedida) abrir(pedida, false);
    };

    const salir = (error = "") => {
        clave = "";
        try {
            localStorage.removeItem("sazzo-panel-clave");
        } catch {}
        clearInterval(relojLista);
        clearInterval(relojCharla);
        clearInterval(relojLatido);
        clearInterval(relojVence);
        insignia(0);
        app.hidden = true;
        entrada.hidden = false;
        $(".entrada__error").textContent = error;
        $(".entrada__error").hidden = !error;
        $("#clave").focus();
    };

    $(".entrada__caja").addEventListener("submit", (e) => {
        e.preventDefault();
        clave = $("#clave").value.trim();
        $("#clave").value = "";
        guardar("sazzo-panel-clave", clave);
        audio ??= new AudioContext();
        iniciar();
    });
    $("[data-salir]").addEventListener("click", async () => {
        await latir("invisible");
        if (conAvisos) {
            const suscripcion = await navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).catch(() => null);
            if (suscripcion) {
                await suscripcion.unsubscribe().catch(() => {});
                await pedir(PUSH.borrar, { endpoint: suscripcion.endpoint }).catch(() => {});
            }
        }
        salir();
        if (conAvisos) pintarAvisos();
    });
    document.querySelectorAll("[data-estado]").forEach((b) => b.addEventListener("click", () => latir(b.dataset.estado, Number(b.dataset.minutos) || 0)));
    $("[data-cambiar-tema]").addEventListener("click", () => tema(raiz.dataset.tema !== "claro"));
    $("[data-sonido]").addEventListener("click", (e) => {
        sonido = !sonido;
        guardar("sazzo-panel-sonido", sonido);
        e.currentTarget.setAttribute("aria-pressed", String(sonido));
        if (sonido) sonar();
    });
    $("[data-sonido]").setAttribute("aria-pressed", String(sonido));
    document.querySelectorAll("[data-filtro]").forEach((b) =>
        b.addEventListener("click", () => {
            filtro = b.dataset.filtro;
            pintarLista();
        }),
    );
    $("[data-tomar]").addEventListener("click", (e) => accion("/panel/tomar", e.currentTarget));
    $("[data-devolver]").addEventListener("click", (e) => accion("/panel/devolver", e.currentTarget));
    $(".charla__volver").addEventListener("click", () => {
        if (history.state?.charla) return history.back();
        const url = new URL(location.href);
        url.searchParams.delete("charla");
        history.replaceState(null, "", url);
        cerrar();
    });
    addEventListener(
        "pointerdown",
        () => {
            try {
                audio ??= new AudioContext();
                audio.resume();
            } catch {}
        },
        { once: true },
    );
    addEventListener("popstate", () => {
        const id = new URLSearchParams(location.search).get("charla");
        if (id) abrir(id, false);
        else cerrar();
    });
    campo.addEventListener("input", () => {
        campo.style.height = "auto";
        campo.style.height = `${Math.min(campo.scrollHeight, 160)}px`;
    });
    campo.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            $(".charla__form").requestSubmit();
        }
    });
    $(".charla__form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const texto = campo.value.trim();
        if (!texto) return;
        if (await accion("/panel/responder", e.submitter ?? $(".charla__form .boton"), { texto })) {
            campo.value = "";
            campo.style.height = "auto";
        }
    });
    const volver = () => {
        if (document.hidden) return;
        sinLeer = 0;
        titulo();
    };
    addEventListener("focus", volver);
    document.addEventListener("visibilitychange", volver);

    const medir = new ResizeObserver(ubicarCielo);
    medir.observe(mensajes);
    medir.observe($(".charla"));
    [mensajes, $(".charla__vacia")].forEach((zona) => {
        zona.addEventListener("click", (e) => tocaSazzito(e) && saludar());
        zona.addEventListener("mousemove", (e) => (zona.style.cursor = tocaSazzito(e) ? "pointer" : ""));
    });
    requestAnimationFrame(volar);

    const botonInstalar = $("[data-instalar]");
    addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        instalar = e;
        botonInstalar.hidden = false;
    });
    addEventListener("appinstalled", () => {
        instalar = null;
        botonInstalar.hidden = true;
    });
    botonInstalar.addEventListener("click", async () => {
        if (!instalar) return;
        instalar.prompt();
        await instalar.userChoice;
        instalar = null;
        botonInstalar.hidden = true;
    });

    const botonAvisos = $("[data-avisos]");
    const llave = (texto) => Uint8Array.from(atob(texto.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(texto.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
    const pintarAvisos = async () => {
        const registro = await navigator.serviceWorker.ready;
        const suscripcion = await registro.pushManager.getSubscription();
        const bloqueadas = Notification.permission === "denied";
        botonAvisos.textContent = bloqueadas ? "Notificaciones bloqueadas" : suscripcion ? "Notificaciones activas" : "Activar notificaciones";
        botonAvisos.title = bloqueadas ? "Se habilitan desde el candado de la barra de direcciones" : suscripcion ? "Tocá para apagarlas" : "";
        botonAvisos.dataset.activas = String(Boolean(suscripcion));
        botonAvisos.disabled = bloqueadas;
        botonAvisos.hidden = false;
    };
    const cambiarAvisos = async () => {
        botonAvisos.disabled = true;
        try {
            const registro = await navigator.serviceWorker.ready;
            const suscripcion = await registro.pushManager.getSubscription();
            if (suscripcion) {
                await suscripcion.unsubscribe();
                await pedir(PUSH.borrar, { endpoint: suscripcion.endpoint }).catch(() => {});
            } else if ((await Notification.requestPermission()) === "granted") {
                const d = await pedir(PUSH.clave);
                if (!d.clave) throw new Error("sin-clave");
                const nueva = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llave(d.clave) });
                await pedir(PUSH.suscribir, nueva.toJSON()).catch(async (e) => {
                    await nueva.unsubscribe();
                    throw e;
                });
            }
            await pintarAvisos();
        } catch (e) {
            botonAvisos.textContent = e.message === "sin-clave" ? "Todavía no están listas" : "No se pudieron activar";
            botonAvisos.disabled = false;
            setTimeout(pintarAvisos, 4000);
        }
    };
    botonAvisos.addEventListener("click", cambiarAvisos);

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
        navigator.serviceWorker.addEventListener("message", (e) => {
            if (e.data?.charla && clave) abrir(e.data.charla);
        });
        if (conAvisos) pintarAvisos();
    }

    if (clave) iniciar();
    else salir();
}
