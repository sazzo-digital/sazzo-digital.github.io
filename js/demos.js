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
        detalle: {
            hace: [
                "Estado de cada vehículo según sus problemas: andando, con problema o en el taller",
                "Mapa con dónde se vio por última vez cada vehículo (de ejemplo)",
                "Historia de problemas de cada vehículo",
                "La administradora ve lo que hay para mirar hoy y lo último que pasó"
            ],
            tambien: [
                "Que el aviso del chofer le llegue al mecánico en otro celular, al instante",
                "Alta y baja de vehículos y de personas, con su usuario cada uno",
                "Días y horarios de cada chofer, y quién maneja qué vehículo",
                "Combustible, recorridos y fotos de cada problema",
                "Reportes por vehículo y por mes, y pasar los datos a Excel",
                "Cargar la flota desde una planilla"
            ]
        },
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
        detalle: {
            hace: [
                "Lector de códigos con la cámara del celu: el producto se suma solo al ticket",
                "Stock por proveedor, con el filtro \"Hay que pedir\" para lo que se está terminando",
                "La lista del proveedor desde un Excel, y el stock y las ventas para bajar a Excel",
                "Caja del día: lo más vendido, las últimas ventas, los últimos 7 días y el cierre",
                "Ruleta de premios de ejemplo, para una promo del kiosco"
            ],
            tambien: [
                "Cobro con Mercado Pago o QR, y lector de códigos o balanza",
                "Que la caja y el stock se vean en el celular del dueño, al instante",
                "Varias cajas o sucursales, con su usuario cada una",
                "Pedido al proveedor armado solo con lo que hay que pedir",
                "Recargas, servicios y lo que cobre tu kiosco"
            ]
        },
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
        detalle: {
            hace: [
                "Fútbol 5, Fútbol 7 y pádel, cada una con su duración y su seña",
                "El dueño anota desde la grilla los turnos que llegan por teléfono",
                "Marcar si llegaron o faltaron, y cobrar la seña",
                "Liberar un turno fijo solo por esta semana",
                "El jugador ve sus turnos y puede cancelar o volver a reservar"
            ],
            tambien: [
                "Que el turno le llegue al dueño en su celular, al instante",
                "Seña con Mercado Pago o transferencia, de verdad",
                "Botón para avisarle al grupo por WhatsApp",
                "Cantina: sumar bebidas al turno",
                "Torneos, \"falta uno\" y avisos por lluvia",
                "Varios complejos, con su usuario cada uno"
            ]
        },
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
        detalle: {
            hace: [
                "Ficha de cada cliente con sus visitas y notas",
                "Recordatorio del turno con el mensaje listo para mandar",
                "Marcar si llegó o faltó al turno",
                "Anotar un turno en un hueco libre de la agenda",
                "Buscador de clientes que perdona errores"
            ],
            tambien: [
                "Recordatorio del turno por WhatsApp, con un toque",
                "Invitar por WhatsApp a los que no vuelven, con un toque",
                "Seña al sacar turno y cobro con QR",
                "Venta de productos y comisión de cada barbero",
                "Fotos de cada corte en la ficha del cliente",
                "Varias sucursales, con su usuario cada barbero"
            ]
        },
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
        detalle: {
            hace: [
                "Al mecánico le llegan las órdenes sin precios, y dicta con la voz lo que encontró",
                "La orden pasa por aprobado, falta repuesto, terminado y entregado",
                "Historial de cada auto y de cada cliente",
                "Mensaje listo para escribirle al cliente",
                "Anular una orden sin borrarla"
            ],
            tambien: [
                "Mandar el presupuesto y el \"ya está listo\" por WhatsApp, con un toque",
                "Fotos del auto al recibirlo y del trabajo hecho",
                "Stock de repuestos que se descuenta solo",
                "Turnos para traer el auto y cuenta corriente de cada cliente",
                "Que el cliente vea en qué estado está su auto, desde su celular",
                "Varios talleres, con su usuario cada mecánico"
            ]
        },
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
        detalle: {
            hace: [
                "Catálogo con buscador que perdona errores y frascos para ver en 3D",
                "Frasco de 50 o 100 ml, o decant de 5 o 10 ml",
                "La clienta sigue su pedido desde \"Mis pedidos\"",
                "La dueña ve los pedidos nuevos y los preparados para retirar, y marca cuándo se entregó",
                "Stock de frascos y de botellas madre en ml"
            ],
            tambien: [
                "Que el pedido le llegue a la dueña por WhatsApp, con un toque",
                "Envíos a domicilio y cobro con QR o transferencia",
                "Cosmética y cuidado personal, con fotos de cada producto",
                "Venta en el mostrador con lector de códigos",
                "Vendedoras con su usuario y lo que vendió cada una",
                "Saludo de cumpleaños que sale solo, el mismo día"
            ]
        },
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
        detalle: {
            hace: [
                "Cobro dividiendo la cuenta en partes iguales",
                "La cocina marca \"Listo\" y la moza se entera",
                "Caja del turno con los cobros y el cierre de caja"
            ],
            tambien: [
                "Imprimir la comanda en la cocina y en la barra, sola",
                "Cambiar la carta y los precios cuando quieras",
                "Stock de barriles y bebidas que se descuenta con cada pinta",
                "Resúmenes del mes: lo más vendido y cuánto entró",
                "Pedidos Ya y delivery en la misma pantalla",
                "Funciona en la compu del local, aunque se corte internet"
            ]
        },
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
        detalle: {
            hace: [
                "Factura A, B o C según el cliente, y notas de crédito sobre una factura",
                "Cuentas corrientes: quién te debe, a quién le debés, cobros y pagos",
                "Libro IVA Digital (.txt) y libros en Excel para la contadora",
                "Libro diario, mayor y balance de sumas y saldos que se arman solos",
                "Tu empresa: razón social, CUIT, logo, colores y qué pantallas se usan"
            ],
            extra: {
                titulo: "Para tu contador, en la versión real",
                renglones: [
                    "Asientos a mano, con plantillas para amortizaciones, sueldos y ajustes",
                    "Correcciones con contraasiento: nada se borra ni se edita",
                    "Cierre de cada mes: nadie puede cargar nada con fecha de un mes cerrado",
                    "Cierre del ejercicio: refundición de resultados y apertura del año nuevo",
                    "Plan de cuentas a medida y estados contables (situación patrimonial y resultados)",
                    "Libros listos para rubricar y registro de quién cargó cada cosa"
                ]
            },
            tambien: [
                "Conexión real con ARCA: facturas con validez fiscal, CAE y QR de verificación",
                "Traer las compras desde \"Mis Comprobantes\" de ARCA con el archivo que da ARCA",
                "Varias empresas a la vez, para un estudio contable o un grupo de empresas",
                "Sueldos, Ingresos Brutos y convenio multilateral, retenciones y Ganancias",
                "Conciliación bancaria importando el extracto del banco",
                "Usuarios con contraseña y permisos para cada persona del equipo"
            ]
        },
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
        detalle: {
            hace: [
                "La clienta destilda lo que ya tiene y el local separa la lista, la cobra y la entrega",
                "Pedidos a proveedores armados con lo que falta, y \"Llegó: sumar al stock\"",
                "La lista del proveedor desde Excel y \"Subió un proveedor\" sin perder tu margen",
                "Caja del día con la ganancia, lo más vendido y los últimos 7 días",
                "Venta en el mostrador con buscador que perdona errores"
            ],
            tambien: [
                "Cargar la lista de un colegio desde una foto o un PDF",
                "Pasar el stock, las ventas y la ganancia a Excel",
                "Cobro con Mercado Pago o QR e impresora de tickets",
                "Avisos por WhatsApp cuando la lista está separada",
                "Tienda online con tu stock real y retiro en el local",
                "Cuenta corriente para colegios, oficinas y clientes de siempre",
                "Varias cajas o sucursales, con su usuario cada una"
            ]
        },
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
        detalle: {
            hace: [
                "Presupuesto en PDF que el cliente acepta desde su celu",
                "Lector de códigos con la cámara para vender rápido",
                "Pedidos a proveedores con lo que hay que pedir",
                "La lista del proveedor desde Excel y precios con tu margen por rubro",
                "Recordatorio para las cuentas corrientes, y la caja con lo que más plata dejó"
            ],
            tambien: [
                "Mandar el presupuesto por WhatsApp de verdad",
                "Reconocer la pieza de la foto sola",
                "Cobro con Mercado Pago o QR, balanza y lector conectados",
                "Impresora de tickets y presupuestos",
                "Listas de proveedores que llegan en PDF",
                "Tienda online con tu stock real y retiro en el local",
                "Varias cajas, sucursales o depósito, con su usuario cada una"
            ]
        },
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
        detalle: {
            hace: [
                "Pizarra de precios para la tele del local, en pantalla completa",
                "Subió la hacienda: precio sugerido de cada corte con tu margen",
                "Lector de la etiqueta de la balanza con la cámara",
                "Desposte en PDF y merma promedio por animal",
                "Caja del día con lo vendido en kilos y en plata"
            ],
            tambien: [
                "Balanza conectada: el peso entra solo, sin escribirlo",
                "Imprimir las etiquetas y el ticket en la impresora del mostrador",
                "Cobro con Mercado Pago o QR",
                "Avisos por WhatsApp cuando el pedido está listo",
                "Envíos a domicilio con el recorrido del día",
                "Tienda online con el stock real de cada corte",
                "Varias cajas o sucursales, con su usuario cada una"
            ]
        },
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
        detalle: {
            hace: [
                "El profe arma rutinas, se las asigna a cada alumno y le deja notas",
                "Rutina en PDF para imprimir o mandar",
                "Socio nuevo con apto físico y reglamento firmado con el dedo",
                "Cómo anda el gimnasio: a qué hora viene la gente y socios por plan de cuota",
                "El socio avisa que transfirió y la dueña lo confirma; los pagos se pasan a Excel"
            ],
            tambien: [
                "Cobro de la cuota con Mercado Pago o débito automático",
                "Recordatorio de la cuota por WhatsApp, solo",
                "Ingreso con QR o molinete en la puerta",
                "Videos de cada ejercicio en la rutina",
                "Varias sedes, con su usuario cada profe",
                "Venta de bebidas y suplementos en el mostrador"
            ]
        },
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
        detalle: {
            hace: [
                "Consultas de WhatsApp, del portal y del cartel en una lista, con quiénes buscan algo así",
                "Ficha de la propiedad en PDF y mapa de la zona",
                "Confirmar la visita y mandar la ficha con un mensaje listo",
                "Pagos del alquiler con recordatorio para el que no pagó",
                "Antes de que venza, preguntarle al inquilino si renueva"
            ],
            tambien: [
                "Publicar solo en los portales y traer sus consultas a una sola lista",
                "El índice oficial de cada mes, sin cargarlo a mano",
                "Liquidación al propietario y recibos de alquiler",
                "Contratos con firma digital",
                "Cobro del alquiler con Mercado Pago o transferencia, y avisos por WhatsApp",
                "Agenda de visitas en el calendario de cada agente",
                "Tasaciones y varias sucursales, con su usuario cada una"
            ]
        },
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
