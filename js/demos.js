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
        rubro: "Empresas con vehículos: remiserías, fleteras, distribuidoras",
        pregunta: "¿Te enterás tarde cuando un vehículo tiene un problema?",
        acento: "#34D399",
        pantalla: ["Utilitario 7 · Frenos · avisó Ramón", "Diego lo tomó · En el taller", "Pastillas · queda poco"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "kiosco",
        nombre: "Kiosco",
        rubro: "Kioscos, almacenes y dietéticas",
        pregunta: "¿Seguís anotando los fiados en un cuaderno?",
        acento: "#F5B83D",
        pantalla: ["Alfajor triple · vuelto $ 5.300", "Fiado de Graciela · anotado", "Bebidas Norte +15 % · 12 precios"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "canchas",
        nombre: "Canchas",
        rubro: "Canchas de fútbol y pádel",
        pregunta: "¿Los turnos te llegan por WhatsApp y se te pisan?",
        acento: "#4ADE80",
        pantalla: ["Fede reservó Cancha 1 · 21 h", "Pádel · 19:30 · Libre", "Turno fijo · Oficina FC"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "barberia",
        nombre: "Barbería",
        rubro: "Barberías, peluquerías y estética",
        pregunta: "¿Sabés qué clientes hace un mes que no vienen?",
        acento: "#60A5FA",
        pantalla: ["Matías sacó turno · 15:30", "16:15 · Libre", "Juan · 52 días sin venir"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "taller",
        nombre: "Taller",
        rubro: "Talleres mecánicos",
        pregunta: "¿Te preguntan todo el día si el auto ya está listo?",
        acento: "#FB923C",
        pantalla: ["Volvió el Gol de Silvia", "Presupuesto $ 187.000", "Listo · avisado"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "perfumeria",
        nombre: "Perfumería",
        rubro: "Perfumerías y tiendas de cosmética",
        pregunta: "¿Te piden por mensaje y anotás todo a mano?",
        acento: "#E879F9",
        pantalla: ["Pedido de Julieta · 2 perfumes", "Decant 10 ml · quedan 38 ml", "Cumplen este mes · 2"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "restix",
        carpeta: "restix-web",
        nombre: "Restix",
        rubro: "Bares y restaurantes",
        pregunta: "¿Las comandas se pierden entre el salón y la cocina?",
        acento: "#F87171",
        pantalla: ["Mesa 4 · a la cocina", "Cocina · 2 Muzzarella · listo", "Cobrado entre 3"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "contable",
        nombre: "Contable",
        rubro: "Pymes, comercios y profesionales que facturan",
        pregunta: "¿Te enterás del IVA cuando ya lo tenés que pagar?",
        acento: "#22D3EE",
        pantalla: ["Factura A · CAE autorizado", "6 compras traídas de ARCA", "IVA del mes · a pagar"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "libreria",
        nombre: "Librería",
        rubro: "Librerías y papelerías",
        pregunta: "¿Las listas escolares te tapan el mostrador cada marzo?",
        acento: "#818CF8",
        pantalla: ["Lista de 1° grado · pedida por Paula", "Separada · se descontó del stock", "Papelera +15 % · tu margen intacto"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "ferreteria",
        nombre: "Ferretería",
        rubro: "Ferreterías y corralones",
        pregunta: "¿Te piden \"lo de la foto\" y armás el presupuesto a mano?",
        acento: "#94A3B8",
        pantalla: ["Presupuesto de Marcos · 6 artículos", "PDF enviado · pasó a su cuenta", "Lista del proveedor +12 % · tu margen intacto"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "carniceria",
        nombre: "Carnicería",
        rubro: "Carnicerías, pollerías y granjas",
        pregunta: "¿Sabés cuánto te deja de verdad cada media res?",
        acento: "#F472B6",
        pantalla: ["Pedido de Claudia · pesó 1,62 kg", "Media res · merma 24,1 %", "Precios nuevos · pizarra al día"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "gimnasio",
        nombre: "Gimnasio",
        rubro: "Gimnasios, funcional y pilates",
        pregunta: "¿Tus socios saben qué les toca hoy y vos sabés quién te debe la cuota?",
        acento: "#A3E635",
        pantalla: ["Hoy te toca: Día B · Piernas", "Sentadilla 60 kg · ¡nuevo récord!", "Franco · la cuota vence en 3 días"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "inmobiliaria",
        nombre: "Inmobiliaria",
        rubro: "Inmobiliarias y martilleros",
        pregunta: "¿Cada mes hacés a mano la cuenta de los alquileres que aumentan?",
        acento: "#A78BFA",
        pantalla: ["Depto 2 amb · Valeria pidió visita", "Sábado 11:00 · ficha enviada", "3 alquileres aumentan · aviso listo"],
        dispositivo: "celu",
        estado: "activa"
    }
];
