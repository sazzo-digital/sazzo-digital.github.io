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
        items: ["El chofer avisa el problema desde el celu", "El mecánico lo toma y lo sigue hasta el arreglo", "Stock de repuestos que baja con cada arreglo y cada service"],
        detalle: {
            hace: [
                "Estado de cada vehículo según sus problemas: andando, con problema o en el taller",
                "Mapa con dónde se vio por última vez cada vehículo (de ejemplo)",
                "Historia de problemas de cada vehículo",
                "La administradora ve lo que hay para mirar hoy y lo último que pasó",
                "Stock de repuestos que baja solo con cada arreglo y cada service, más ventas, salidas y entradas"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Abrí un vehículo y tocá «Hacer el service»: los repuestos bajan solos",
                    "En Repuestos anotá lo que entra, lo que vendés o lo que sale",
                    "Mirá los últimos movimientos: arreglos, services, ventas y entradas"
                ]
            },
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
        pantalla: ["Utilitario 7 · Frenos · avisó Ramón", "Diego lo tomó · En el taller", "Service · aceite −4 litros"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "kiosco",
        nombre: "Kiosco",
        enVivo: "Sofía cobra → Rubén lo ve en la caja",
        rubro: "Kioscos, almacenes y dietéticas",
        pregunta: "¿Seguís anotando los fiados en un cuaderno?",
        items: ["Caja como en el súper: escaneás el QR y se suma solo", "Fiados con tope por cliente", "Subís los precios de un proveedor en un toque"],
        detalle: {
            hace: [
                "Caja como en el súper: escaneás el QR de cada producto y se suma solo, con el total grande y el vuelto",
                "Stock por proveedor, con el filtro \"Hay que pedir\" para lo que se está terminando",
                "La lista del proveedor desde un Excel, y el stock y las ventas para bajar a Excel",
                "Caja del día: lo más vendido, las últimas ventas, los últimos 7 días y el cierre",
                "Ruleta de premios de ejemplo, para una promo del kiosco"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "En «Vender» está la caja: sumá productos de la góndola y se suman al ticket al toque, como en el súper",
                    "Con el celu, escaneá los QR de los productos (están en «Ver los QR», para otro celu o para imprimir)",
                    "Cobrá en efectivo con el vuelto en grande, con débito, crédito, QR o mitad y mitad",
                    "Atento al stock: avisa «quedan 2» antes de que se termine"
                ]
            },
            tambien: [
                "Cobro con Mercado Pago o QR, y lector de códigos o balanza",
                "Que la caja y el stock se vean en el celular del dueño, al instante",
                "Varias cajas o sucursales, con su usuario cada una",
                "Pedido al proveedor armado solo con lo que hay que pedir",
                "Recargas, servicios y lo que cobre tu kiosco"
            ]
        },
        acento: "#F5B83D",
        pantalla: ["Caja · 3 productos · $ 6.300", "Fiado de Graciela · anotado", "Bebidas Norte +15 % · 16 precios"],
        dispositivo: "compu",
        estado: "activa"
    },
    {
        id: "canchas",
        nombre: "Canchas",
        enVivo: "Fede reserva → al dueño le salta la reserva",
        rubro: "Canchas de fútbol y pádel",
        pregunta: "¿Los turnos te llegan por WhatsApp y se te pisan?",
        items: ["Grilla por cancha y por hora", "Reservas desde el celu, con seña", "Cantina: lo que piden se suma a la cuenta del turno"],
        detalle: {
            hace: [
                "Fútbol 5, Fútbol 7 y pádel, cada una con su duración y su seña",
                "El dueño anota desde la grilla los turnos que llegan por teléfono",
                "Marcar si llegaron o faltaron, y cobrar la seña",
                "Cantina: el jugador pide desde su turno y el dueño cobra la cuenta, dividida entre todos",
                "El jugador ve sus turnos y puede cancelar o volver a reservar"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Como Fede, pedí aguas o una cerveza a la cantina desde tu turno",
                    "Como Gustavo, mirá el pedido, marcalo entregado y cobrá la cuenta",
                    "Dividí la cuenta entre todos los jugadores, en partes iguales",
                    "La cantina también vende sola, con su caja y su stock"
                ]
            },
            tambien: [
                "Que el turno le llegue al dueño en su celular, al instante",
                "Seña con Mercado Pago o transferencia, de verdad",
                "Botón para avisarle al grupo por WhatsApp",
                "Torneos, \"falta uno\" y avisos por lluvia",
                "Varios complejos, con su usuario cada uno"
            ]
        },
        acento: "#4ADE80",
        pantalla: ["Fede reservó Cancha 1 · 21 h", "Cancha 1 pidió 6 aguas", "Cuenta dividida entre 10"],
        dispositivo: "celu",
        estado: "activa"
    },
    {
        id: "barberia",
        nombre: "Barbería",
        enVivo: "Matías saca turno → a Leo le aparece en la agenda",
        rubro: "Barberías, peluquerías y estética",
        pregunta: "¿Sabés qué clientes hace un mes que no vienen?",
        items: ["Turnos desde el celu", "Agenda de cada barbero, hora por hora", "Clientes que no vuelven, con mensaje para invitarlos"],
        detalle: {
            hace: [
                "Ficha de cada cliente con sus visitas y notas",
                "Recordatorio del turno con el mensaje listo para mandar",
                "Marcar si llegó o faltó al turno",
                "La agenda de cada barbero hora por hora: un toque en un hueco libre y anotás el turno",
                "Buscador de clientes que perdona errores"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Como Leo, mirá el día entero de cada barbero, hora por hora",
                    "Tocá un hueco libre y anotá el turno ahí mismo",
                    "Como Matías, mirá todos los horarios: los ocupados aparecen tachados",
                    "Tocá «Turnero en la tele»: quién se está cortando y quién sigue, en pantalla completa"
                ]
            },
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
                "Al mecánico le llegan las órdenes sin precios",
                "La orden pasa por aprobado, falta repuesto, terminado y entregado",
                "Historial de cada auto y de cada cliente",
                "Mensaje listo para escribirle al cliente",
                "Fotos del antes y después del arreglo, para mostrarle al cliente"
            ],
            tambien: [
                "Mandar el presupuesto y el \"ya está listo\" por WhatsApp, con un toque",
                "Sacar las fotos con el celu y que queden guardadas en la orden",
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
        items: ["Frascos en 3D que girás con el dedo", "\"Recomendame uno\" según el gusto de la clienta", "Decants que se descuentan de la botella madre"],
        detalle: {
            hace: [
                "Catálogo con buscador que perdona errores y frascos para ver en 3D",
                "Frasco de 50 o 100 ml, o decant de 5 o 10 ml",
                "La clienta sigue su pedido desde \"Mis pedidos\"",
                "La dueña ve los pedidos nuevos y los preparados para retirar, y marca cuándo se entregó",
                "Venta en el mostrador y cobro del pedido, con el stock de frascos y de la botella madre al día"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Abrí un perfume y tocá «Verlo en 3D»: frascos escaneados que girás con el dedo",
                    "Cada familia tiene su frasco, y el perfume toma su color",
                    "Como Carolina, cobrá un pedido y entregalo, con el vuelto calculado",
                    "Vendé en el mostrador con la caja: frascos y decants, y el stock baja solo"
                ]
            },
            tambien: [
                "Que el pedido le llegue a la dueña por WhatsApp, con un toque",
                "Envíos a domicilio y cobro con QR o transferencia",
                "Cosmética y cuidado personal, con fotos de cada producto",
                "Vendedoras con su usuario y lo que vendió cada una",
                "Saludo de cumpleaños que sale solo, el mismo día"
            ]
        },
        acento: "#E879F9",
        pantalla: ["Pedido de Julieta · 2 perfumes", "Decant 10 ml · quedan 38 ml", "Mostrador · venta cobrada"],
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
                "Caja del turno con los cobros y el cierre de caja",
                "Pedidos en la tele: lo que está en preparación y lo que ya salió",
                "Cobro en efectivo, débito, crédito, transferencia o QR"
            ],
            tambien: [
                "Imprimir la comanda en la cocina y en la barra, sola",
                "Cambiar la carta y los precios cuando quieras",
                "Stock de barriles y bebidas que se descuenta con cada pinta",
                "Resúmenes del mes: lo más vendido y cuánto entró",
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
        items: ["Facturas A, B y C con CAE de prueba", "Compras traídas de ARCA", "IVA del mes, o tu tope si sos monotributista"],
        detalle: {
            hace: [
                "Factura A, B o C y notas de crédito; si sos monotributista, cuánto te queda del tope de tu categoría",
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
                "La lista del proveedor desde Excel y \"Subir precios por proveedor\" sin perder tu margen",
                "Caja del día con la ganancia, lo más vendido y los últimos 7 días",
                "Caja como la del súper: góndola por rubro, lector de códigos y cobro con dos medios a la vez"
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
                "Caja como la del súper con lector de códigos, y cobro con dos medios a la vez",
                "Pedidos a proveedores con lo que hay que pedir",
                "La lista del proveedor desde Excel y precios con tu margen por rubro",
                "Recordatorio para las cuentas corrientes, y la caja con lo que más plata dejó"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Como Marcos, pedí como hablás y sumá la foto de lo que se rompió",
                    "Como Nahuel, entrás directo al pedido: elegís qué es lo de la foto y se lo mandás en 3 toques",
                    "Cuando lo acepta, pasalo a venta: se descuenta del stock y va a su cuenta corriente"
                ]
            },
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
                "La balanza: leer su etiqueta con la cámara, conectarla a la compu (Chrome o Edge) o mostrarla en la tele",
                "Desposte en PDF y merma promedio por animal",
                "Caja del día con lo vendido en kilos y en plata"
            ],
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Como Darío, tocá un corte y «poné carne» en la balanza simulada: el peso y el precio aparecen solos",
                    "Tocá «Mostrar en la tele»: el cliente ve el corte, el peso y cuánto sale"
                ]
            },
            tambien: [
                "La balanza conectada a la compu del mostrador, ajustada a tu modelo",
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
            extra: {
                titulo: "Para probar ya",
                renglones: [
                    "Como Vane, abrí «Entrada»: el socio muestra su QR y ves al toque si tiene la cuota al día",
                    "Como Franco, tocá «Mi QR de entrada»: es el que se muestra en la puerta",
                    "Como Mauro, tocá «Récords en la tele»: los récords del día en pantalla completa"
                ]
            },
            tambien: [
                "Cobro de la cuota con Mercado Pago o débito automático",
                "Recordatorio de la cuota por WhatsApp, solo",
                "Molinete en la puerta que se abre con el QR del socio",
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

export const SERVICIOS_HECHOS = [
    {
        id: "dos-locales",
        icono: "i-equipos",
        tipo: "Organización interna",
        titulo: "Dos locales, un mismo orden",
        para: "Que cada turno sepa qué se hizo y qué falta, sin preguntar ni dejar papelitos.",
        personas: "4 personas · 2 locales",
        items: [
            "Tareas del día y de la semana, por local y por turno",
            "Lo que no se termina pasa solo al turno siguiente",
            "Queda registrado qué se hizo, cuándo y en qué local",
            "La dueña ve informes y avisos de ambos locales"
        ],
        conexion: "Cada una desde su celu, con todo al día en el momento.",
        video: { base: "img/hechos/locales", texto: "Marcar tareas del turno y dejarle una nota al turno que sigue" }
    },
    {
        id: "flota",
        icono: "i-sistema",
        tipo: "Control de una flota",
        titulo: "Vehículos y repuestos, con cada rol conectado",
        para: "Saber el estado de cada vehículo y de los repuestos sin papeles ni llamadas.",
        personas: "Unas 60 personas · 4 roles",
        items: [
            "Estado de cada vehículo, con su historia",
            "Stock de repuestos con alertas de lo que falta",
            "Vencimientos de papeles y service por kilómetros",
            "Tareas y avisos entre administradores, supervisor, mecánicos y choferes"
        ],
        conexion: "Cada rol ve lo suyo, todo se actualiza solo y sigue andando sin señal.",
        video: { base: "img/hechos/flota", texto: "Un chofer avisa un problema y le llega al mecánico al instante" }
    }
];
