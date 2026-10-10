// ============================================
// Visor 360 de Sazzo Inmobiliaria, propio y sin librerías: una foto 360 (equirectangular, 2:1) que se recorre con el
// dedo o el mouse (arrastrar mira alrededor, pellizcar o la ruedita acercan), con el teclado (flechas, + y -) y, en el
// celular, moviendo el teléfono ("Mover el celu"). Lo dibuja la placa de video (WebGL): para cada punto de la pantalla
// calcula hacia dónde mira y toma ese color de la foto. Si el navegador no tiene WebGL, se ve la foto entera para
// deslizar de costado.
//   abrirRecorrido({ url: "img/360/p1.jpg", titulo: "Depto 2 ambientes con balcón" })
// La foto se baja recién al abrirlo (~1 MB). Al cerrar se suelta todo (la placa de video, los sensores).
// ============================================
import { esc, aviso, sinMovimiento } from "../kit/js/ui.js?v=bc8d90946e";
import { alSalirDeLaPantalla } from "../kit/js/rutas.js?v=bc8d90946e";

const VERTICES = `
attribute vec2 punto;
varying vec2 lugar;
void main() {
    lugar = punto;
    gl_Position = vec4(punto, 0.0, 1.0);
}`;

const COLORES = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D foto;
uniform float aspecto;
uniform float tangente;
uniform float giro;
uniform float altura;
varying vec2 lugar;
const float PI = 3.14159265;
void main() {
    vec3 d = normalize(vec3(lugar.x * tangente * aspecto, lugar.y * tangente, -1.0));
    float ca = cos(altura), sa = sin(altura);
    d = vec3(d.x, d.y * ca - d.z * sa, d.y * sa + d.z * ca);
    float cg = cos(giro), sg = sin(giro);
    d = vec3(d.x * cg - d.z * sg, d.y, d.x * sg + d.z * cg);
    float longitud = atan(d.x, -d.z);
    float latitud = asin(clamp(d.y, -1.0, 1.0));
    gl_FragColor = texture2D(foto, vec2(longitud / (2.0 * PI) + 0.5, 0.5 - latitud / PI));
}`;

const GRADO = Math.PI / 180;
const CAMPO = { inicial: 80, minimo: 35, maximo: 100 }; // grados de alto que se ven
const ALTURA_MAXIMA = 85 * GRADO;

function compilar(gl, tipo, codigo) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, codigo);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "No se pudo preparar el visor.");
    return s;
}

/** La foto, achicada si la placa de video no acepta una tan grande (celulares viejos). */
function texturaPosible(gl, img) {
    const maximo = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (img.naturalWidth <= maximo) return img;
    const lienzo = document.createElement("canvas");
    lienzo.width = maximo;
    lienzo.height = maximo / 2;
    lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
    return lienzo;
}

export function abrirRecorrido({ url, titulo = "" }) {
    if (!/^img\/360\/[a-z0-9-]+\.jpg$/.test(url ?? "")) throw new Error("Ese recorrido no existe.");
    const ventana = document.createElement("dialog");
    ventana.className = "visor360";
    ventana.setAttribute("aria-label", `Recorrido 360 de ${titulo}`);
    const conSensor = typeof window.DeviceOrientationEvent === "function" && matchMedia("(pointer: coarse)").matches;
    ventana.innerHTML = `
        <div class="visor360__barra">
            <p class="visor360__titulo"><i class="ti ti-3d-cube-sphere" aria-hidden="true"></i> <span>${esc(titulo)}</span></p>
            <button class="boton-icono visor360__cerrar" type="button" data-cerrar aria-label="Cerrar el recorrido"><i class="ti ti-x"></i></button>
        </div>
        <div class="visor360__lugar">
            <canvas class="visor360__lienzo" tabindex="0" aria-label="Foto 360: arrastrá para mirar alrededor; con las flechas también"></canvas>
            <p class="visor360__cargando" role="status"><i class="ti ti-loader-2" aria-hidden="true"></i> Cargando el recorrido…</p>
        </div>
        <div class="visor360__pie">
            <p class="visor360__ayuda"><i class="ti ti-hand-finger" aria-hidden="true"></i> Arrastrá para mirar alrededor · pellizcá para acercar</p>
            ${conSensor ? `<button class="boton boton--secundario boton--chico" type="button" data-sensor aria-pressed="false"><i class="ti ti-device-mobile"></i> Mover el celu</button>` : ""}
        </div>`;
    document.body.append(ventana);
    if (typeof ventana.showModal === "function") ventana.showModal();
    else ventana.setAttribute("open", "");

    const lienzo = ventana.querySelector("canvas");
    const cargando = ventana.querySelector(".visor360__cargando");
    let gl = null;
    let cuadro = 0;
    let cerrado = false;
    let tocado = false; // deja de girar solo cuando la persona lo mueve
    let giro = 0;
    let altura = 0;
    let campo = CAMPO.inicial;
    let ubicacion = null; // los uniformes del dibujo
    const quitar = []; // lo que hay que soltar al cerrar

    const escuchar = (blanco, evento, fn, opciones) => {
        blanco.addEventListener(evento, fn, opciones);
        quitar.push(() => blanco.removeEventListener(evento, fn, opciones));
    };

    function cerrar() {
        if (cerrado) return;
        cerrado = true;
        cancelAnimationFrame(cuadro);
        quitar.forEach((q) => q());
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        if (ventana.open) ventana.close();
        ventana.remove();
    }
    ventana.querySelector("[data-cerrar]").addEventListener("click", cerrar);
    ventana.addEventListener("cancel", cerrar);
    ventana.addEventListener("close", cerrar);
    alSalirDeLaPantalla(cerrar);

    function dibujar() {
        cuadro = 0;
        if (cerrado || !gl) return;
        const escala = Math.min(window.devicePixelRatio || 1, 2);
        const ancho = Math.max(1, Math.round(lienzo.clientWidth * escala));
        const alto = Math.max(1, Math.round(lienzo.clientHeight * escala));
        if (lienzo.width !== ancho || lienzo.height !== alto) {
            lienzo.width = ancho;
            lienzo.height = alto;
        }
        gl.viewport(0, 0, ancho, alto);
        gl.uniform1f(ubicacion.aspecto, ancho / alto);
        gl.uniform1f(ubicacion.tangente, Math.tan((campo * GRADO) / 2));
        gl.uniform1f(ubicacion.giro, giro);
        gl.uniform1f(ubicacion.altura, altura);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // Mientras nadie lo toca, gira despacito (salvo que el celular pida menos movimiento)
        if (!tocado && !sinMovimiento()) {
            giro += 0.0018;
            pedirCuadro();
        }
    }
    const pedirCuadro = () => {
        if (!cuadro && !cerrado) cuadro = requestAnimationFrame(dibujar);
    };

    const ajustarCampo = (nuevo) => {
        campo = Math.min(CAMPO.maximo, Math.max(CAMPO.minimo, nuevo));
        pedirCuadro();
    };
    const mirar = (dGiro, dAltura) => {
        tocado = true;
        giro += dGiro;
        altura = Math.min(ALTURA_MAXIMA, Math.max(-ALTURA_MAXIMA, altura + dAltura));
        pedirCuadro();
    };

    function conectarGestos() {
        const dedos = new Map();
        let distancia = 0;
        const porPixel = () => (campo * GRADO) / Math.max(1, lienzo.clientHeight);
        escuchar(lienzo, "pointerdown", (e) => {
            lienzo.setPointerCapture?.(e.pointerId);
            dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (dedos.size === 2) {
                const [a, b] = [...dedos.values()];
                distancia = Math.hypot(a.x - b.x, a.y - b.y);
            }
        });
        escuchar(lienzo, "pointermove", (e) => {
            const antes = dedos.get(e.pointerId);
            if (!antes) return;
            dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (dedos.size === 2) {
                const [a, b] = [...dedos.values()];
                const ahora = Math.hypot(a.x - b.x, a.y - b.y);
                if (distancia > 0 && ahora > 0) ajustarCampo(campo * (distancia / ahora));
                distancia = ahora;
                tocado = true;
                return;
            }
            mirar(-(e.clientX - antes.x) * porPixel(), (e.clientY - antes.y) * porPixel());
        });
        const soltar = (e) => {
            dedos.delete(e.pointerId);
            distancia = 0;
        };
        escuchar(lienzo, "pointerup", soltar);
        escuchar(lienzo, "pointercancel", soltar);
        escuchar(lienzo, "wheel", (e) => {
            e.preventDefault();
            tocado = true;
            ajustarCampo(campo * (1 + Math.sign(e.deltaY) * 0.08));
        }, { passive: false });
        escuchar(lienzo, "keydown", (e) => {
            const paso = 5 * GRADO;
            const teclas = {
                ArrowLeft: () => mirar(-paso, 0), ArrowRight: () => mirar(paso, 0),
                ArrowUp: () => mirar(0, paso), ArrowDown: () => mirar(0, -paso),
                "+": () => ajustarCampo(campo - 5), "-": () => ajustarCampo(campo + 5)
            };
            if (teclas[e.key]) {
                e.preventDefault();
                tocado = true;
                teclas[e.key]();
            }
        });
        escuchar(window, "resize", pedirCuadro);
    }

    // "Mover el celu": el giro sigue a la brújula del teléfono y la altura a cuánto se inclina
    function conectarSensor() {
        const boton = ventana.querySelector("[data-sensor]");
        if (!boton) return;
        let prendido = false;
        let base = null;
        const alMover = (e) => {
            if (!prendido || e.alpha == null || e.beta == null) return;
            if (base === null) base = { alfa: e.alpha, giro };
            tocado = true;
            giro = base.giro + (base.alfa - e.alpha) * GRADO;
            altura = Math.min(ALTURA_MAXIMA, Math.max(-ALTURA_MAXIMA, (e.beta - 90) * GRADO));
            pedirCuadro();
        };
        escuchar(window, "deviceorientation", alMover);
        boton.addEventListener("click", async () => {
            if (!prendido && typeof DeviceOrientationEvent.requestPermission === "function") {
                try {
                    if ((await DeviceOrientationEvent.requestPermission()) !== "granted") return aviso("Sin permiso para usar el movimiento del celu.", "info");
                } catch {
                    return aviso("Este celular no deja usar el movimiento.", "info");
                }
            }
            prendido = !prendido;
            base = null;
            boton.setAttribute("aria-pressed", String(prendido));
            boton.classList.toggle("activo", prendido);
        });
    }

    function sinWebGL(img) {
        cargando.remove();
        lienzo.replaceWith(Object.assign(document.createElement("div"), { className: "visor360__plano", tabIndex: 0 }));
        const plano = ventana.querySelector(".visor360__plano");
        plano.append(img);
        img.alt = `Foto 360 de ${titulo}`;
        ventana.querySelector(".visor360__ayuda").innerHTML = '<i class="ti ti-hand-finger" aria-hidden="true"></i> Deslizá de costado para mirar la foto entera';
    }

    const img = new Image();
    img.decoding = "async";
    img.src = url;
    img.decode().then(() => {
        if (cerrado) return;
        try {
            gl = lienzo.getContext("webgl", { antialias: false, alpha: false }) || lienzo.getContext("experimental-webgl");
        } catch {
            gl = null;
        }
        if (!gl) return sinWebGL(img);
        try {
            const programa = gl.createProgram();
            gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, VERTICES));
            gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, COLORES));
            gl.linkProgram(programa);
            if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error("No se pudo preparar el visor.");
            gl.useProgram(programa);
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            const punto = gl.getAttribLocation(programa, "punto");
            gl.enableVertexAttribArray(punto);
            gl.vertexAttribPointer(punto, 2, gl.FLOAT, false, 0, 0);
            const textura = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textura);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texturaPosible(gl, img));
            ubicacion = Object.fromEntries(["aspecto", "tangente", "giro", "altura"].map((n) => [n, gl.getUniformLocation(programa, n)]));
        } catch (e) {
            console.warn(e);
            gl = null;
            return sinWebGL(img);
        }
        cargando.remove();
        conectarGestos();
        conectarSensor();
        lienzo.focus({ preventScroll: true });
        pedirCuadro();
    }).catch(() => {
        if (cerrado) return;
        cerrar();
        aviso("No se pudo cargar el recorrido. Probá de nuevo con mejor señal.", "error");
    });
    return ventana;
}
