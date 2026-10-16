// ============================================
// La lista de demos del catálogo. Las tarjetas se arman solas desde acá (catalogo.js): para sumar, cambiar o
// retirar una demo se toca SOLO este archivo, no el HTML.
//
// Cada demo:
//   id          nombre corto, igual a su carpeta en demos-venta\demos\ (sin tildes)
//   nombre      lo que se ve en la tarjeta
//   rubro       para quién es (una línea)
//   pregunta    la pregunta que "pega" (el problema del negocio)
//   acento      color de la demo (solo en el celular dibujado de la tarjeta; el catálogo es verde Sazzo)
//   pantalla    3 renglones de ejemplo que se mueven en el celular dibujado (datos inventados)
//   dispositivo "celu" (se usa en el celular) o "compu" (en la compu se ve mejor)
//   estado      "pronto" (todavía no está: botón "Muy pronto"), "activa" (botón "Probala ahora") o "retirada"
//               (no se muestra). Nunca se borra una demo de la lista: se marca como retirada.
//               Para publicar el catálogo, solo van "activa" las demos "listas para mostrar" (docs\proceso.md).
//               (08/10: las 7 demos listas para mostrar.)
//   carpeta     solo si la carpeta de la demo no es igual al id (Restix: "restix-web"). El link se arma solo con
//               LINK_DEMOS de config.js: en la PC ../demos/<carpeta>/, publicado ./<carpeta>/.
// ============================================
export const DEMOS = [
    {
        id: "flota",
        nombre: "Flota",
        enVivo: "Ramón avisa un problema → al mecánico le llega al instante",
        rubro: "Empresas con vehículos: remiserías, fleteras, distribuidoras",
        pregunta: "¿Te enterás tarde cuando un vehículo tiene un problema?",
        items: ["El chofer avisa el problema desde el celu", "El mecánico lo toma y lo sigue hasta el arreglo", "Repuestos con aviso de \"queda poco\""],
        acento: "#34D399",
        pantalla: ["Utilitario 7 · Frenos · avisó Ramón", "Diego lo tomó · En el taller", "Pastillas · queda poco"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "kiosco",
        nombre: "Kiosco",
        enVivo: "Sofía cobra → Rubén lo ve en la caja",
        rubro: "Kioscos, almacenes y dietéticas",
        pregunta: "¿Seguís anotando los fiados en un cuaderno?",
        items: ["Venta rápida con el vuelto calculado", "Fiados con tope por cliente", "Subís los precios de un proveedor en un toque"],
        acento: "#F5B83D",
        pantalla: ["Alfajor triple · vuelto $ 5.300", "Fiado de Graciela · anotado", "Bebidas Norte +15 % · 12 precios"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "canchas",
        nombre: "Canchas",
        enVivo: "Fede reserva → al dueño le salta la reserva",
        rubro: "Canchas de fútbol y pádel",
        pregunta: "¿Los turnos te llegan por WhatsApp y se te pisan?",
        items: ["Grilla por cancha y por hora", "Turnos fijos semanales", "Reservas desde el celu, con seña"],
        acento: "#4ADE80",
        pantalla: ["Fede reservó Cancha 1 · 21 h", "Pádel · 19:30 · Libre", "Turno fijo · Oficina FC"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "barberia",
        nombre: "Barbería",
        enVivo: "Matías saca turno → a Leo le aparece en la agenda",
        rubro: "Barberías, peluquerías y estética",
        pregunta: "¿Sabés qué clientes hace un mes que no vienen?",
        items: ["Turnos desde el celu", "Agenda por barbero", "Clientes que no vuelven, con mensaje para invitarlos"],
        acento: "#60A5FA",
        pantalla: ["Matías sacó turno · 15:30", "16:15 · Libre", "Juan · 52 días sin venir"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "taller",
        nombre: "Taller",
        enVivo: "Seba termina el auto → a Raúl le avisa que está listo",
        rubro: "Talleres mecánicos",
        pregunta: "¿Te preguntan todo el día si el auto ya está listo?",
        items: ["Orden de trabajo por patente", "Presupuesto con firma del cliente y PDF", "Aviso de \"ya está listo\" y de service vencido"],
        acento: "#FB923C",
        pantalla: ["Volvió el Gol de Silvia", "Presupuesto $ 187.000", "Listo · avisado"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "perfumeria",
        nombre: "Perfumería",
        enVivo: "Julieta pide → la dueña lo recibe y le avisa que está listo",
        rubro: "Perfumerías y tiendas de cosmética",
        pregunta: "¿Te piden por mensaje y anotás todo a mano?",
        items: ["\"Recomendame uno\" según el gusto de la clienta", "Decants que se descuentan de la botella madre", "Cumpleaños del mes, con saludo listo"],
        acento: "#E879F9",
        pantalla: ["Pedido de Julieta · 2 perfumes", "Decant 10 ml · quedan 38 ml", "Cumplen este mes · 2"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "restix",
        carpeta: "restix-web",
        nombre: "Restix",
        enVivo: "La moza manda la comanda → le llega a la cocina",
        rubro: "Bares y restaurantes",
        pregunta: "¿Las comandas se pierden entre el salón y la cocina?",
        items: ["Plano de mesas del salón", "La comanda se separa sola entre cocina y barra", "Carta con QR y platos en 3D"],
        acento: "#F87171",
        pantalla: ["Mesa 4 · a la cocina", "Cocina · 2 Muzzarella · listo", "Cobrado entre 3"],
        dispositivo: "celu",
        etiqueta: "Demo para el celu · el Restix completo va en la compu del local",
        estado: "activa"
    },
    {
        id: "contable",
        nombre: "Contable",
        enVivo: "Silvina factura → el dueño y la contadora lo ven",
        rubro: "Pymes, comercios y profesionales que facturan",
        pregunta: "¿Te enterás del IVA cuando ya lo tenés que pagar?",
        items: ["Facturas A y B con CAE de prueba", "Compras traídas de ARCA", "IVA del mes y contabilidad completa"],
        acento: "#22D3EE",
        pantalla: ["Factura A · CAE autorizado", "6 compras traídas de ARCA", "IVA del mes · a pagar"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "libreria",
        nombre: "Librería",
        enVivo: "Paula pide la lista → la librería la recibe y la separa",
        rubro: "Librerías y papelerías",
        pregunta: "¿Las listas escolares te tapan el mostrador cada marzo?",
        items: ["Listas escolares pedidas desde el celu", "Escáner de códigos e ISBN", "Precio por mayor y margen por rubro"],
        acento: "#818CF8",
        pantalla: ["Lista de 1° grado · pedida por Paula", "Separada · se descontó del stock", "Papelera +15 % · tu margen intacto"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "ferreteria",
        nombre: "Ferretería",
        enVivo: "Marcos pide un presupuesto → Nahuel lo arma y se lo manda",
        rubro: "Ferreterías y corralones",
        pregunta: "¿Te piden \"lo de la foto\" y armás el presupuesto a mano?",
        items: ["Presupuestos que entienden \"cano de 1/2\"", "Venta por metro, kilo o unidad", "Cuentas corrientes para albañiles y plomeros"],
        acento: "#94A3B8",
        pantalla: ["Presupuesto de Marcos · 6 artículos", "PDF enviado · pasó a su cuenta", "Lista del proveedor +12 % · tu margen intacto"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "carniceria",
        nombre: "Carnicería",
        enVivo: "Claudia pide → Darío lo pesa y le avisa que está listo",
        rubro: "Carnicerías, pollerías y granjas",
        pregunta: "¿Sabés cuánto te deja de verdad cada media res?",
        items: ["Desposte: cargás la media res y te calcula la merma y el costo real de cada corte", "Venta por peso con etiqueta de balanza", "Pedidos con aviso de \"listo para retirar\""],
        acento: "#F472B6",
        pantalla: ["Pedido de Claudia · pesó 1,62 kg", "Media res · merma 24,1 %", "Precios nuevos · pizarra al día"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "gimnasio",
        nombre: "Gimnasio",
        enVivo: "Franco avisa que pagó → Vane lo confirma y la caja sube",
        rubro: "Gimnasios, funcional y pilates",
        pregunta: "¿Tus socios saben qué les toca hoy y vos sabés quién te debe la cuota?",
        items: ["La rutina de hoy y los récords de cada socio", "Clases con cupo y lista de espera", "Cuotas con recordatorio armado"],
        acento: "#A3E635",
        pantalla: ["Hoy te toca: Día B · Piernas", "Sentadilla 60 kg · ¡nuevo récord!", "Franco · la cuota vence en 3 días"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "inmobiliaria",
        nombre: "Inmobiliaria",
        enVivo: "Valeria pide una visita → el agente la confirma",
        rubro: "Inmobiliarias y martilleros",
        pregunta: "¿Cada mes hacés a mano la cuenta de los alquileres que aumentan?",
        items: ["Fotos y recorrido 360° de cada propiedad", "Visitas agendadas por agente", "Alquileres que vencen o aumentan, con aviso"],
        acento: "#A78BFA",
        pantalla: ["Depto 2 amb · Valeria pidió visita", "Sábado 11:00 · ficha enviada", "3 alquileres aumentan · aviso listo"],
        dispositivo: "celu",
        estado: "activa"
    }
];

export const TRABAJOS = [
    {
        id: "poppy",
        nombre: "Poppy Pastelería",
        rubro: "Pastelería para perros y gatos · Neuquén",
        link: "https://poppy-pasteleria.netlify.app/",
        items: ["Se ve bien en el celu y en la compu", "Productos, galería de trabajos y preguntas frecuentes", "Pedidos directo por WhatsApp e Instagram", "Lista para aparecer en Google"],
        capturas: [
            { src: "img/trabajos/poppy-compu.webp", ancho: 1440, alto: 900, texto: "Inicio, en la compu" },
            { src: "img/trabajos/poppy-celu.webp", ancho: 780, alto: 1688, texto: "Inicio, en el celu" },
            { src: "img/trabajos/poppy-productos.webp", ancho: 1440, alto: 900, texto: "Productos, en la compu" }
        ]
    }
];
