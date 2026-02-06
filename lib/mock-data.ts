
import { OWNER_EMAIL, SPECIAL_PERMISSIONS } from "./constants"

// Simulación de base de datos en memoria
export const mockDatabase: any = {
    pedidos: [],
    inventarioPrendas: [
        {
            id: "prenda1",
            codigoPrenda: "P0001",
            tipoPrenda: "Polera",
            color: "Negro",
            talla: "M",
            cantidad: 25,
            costoUnitario: 15.5,
            entradas: 25,
            salidas: 0,
        },
        {
            id: "prenda2",
            codigoPrenda: "P0002",
            tipoPrenda: "Polera",
            color: "Blanco",
            talla: "L",
            cantidad: 30,
            costoUnitario: 15.5,
            entradas: 30,
            salidas: 0,
        },
        {
            id: "prenda3",
            codigoPrenda: "P0003",
            tipoPrenda: "Casaca",
            color: "Negro",
            talla: "M",
            cantidad: 15,
            costoUnitario: 45.0,
            entradas: 15,
            salidas: 0,
        },
        {
            id: "prenda4",
            codigoPrenda: "P0004",
            tipoPrenda: "Polo",
            color: "Azul",
            talla: "S",
            cantidad: 20,
            costoUnitario: 12.0,
            entradas: 20,
            salidas: 0,
        },
        {
            id: "prenda5",
            codigoPrenda: "P0005",
            tipoPrenda: "Jogger",
            color: "Negro",
            talla: "L",
            cantidad: 18,
            costoUnitario: 25.0,
            entradas: 18,
            salidas: 0,
        },
    ],
    inventarioProductos: [],
    categoriasProductos: [
        { id: "cat1", nombre: "Accesorios" },
        { id: "cat2", nombre: "Decoración" },
        { id: "cat3", nombre: "Papelería" },
    ],
    movimientosInventarioGlobal: [],
    // Colección de inventarios (similar a flujos)
    inventarios: [
        {
            id: "inventario-prendas",
            nombre: "Inventario de Prendas",
            descripcion: "Inventario principal de prendas de vestir",
            tipo: "prendas", // "prendas" o "productos"
            activo: true,
            fechaCreacion: new Date("2024-01-01"),
            fechaModificacion: new Date("2024-01-01"),
            creadoPor: "system",
        },
        {
            id: "inventario-productos",
            nombre: "Inventario de Productos",
            descripcion: "Inventario de productos y accesorios",
            tipo: "productos",
            activo: true,
            fechaCreacion: new Date("2024-01-01"),
            fechaModificacion: new Date("2024-01-01"),
            creadoPor: "system",
        },
    ],
    counters: {
        prendaCodigoCounter: { lastCodeNumber: 5 },
        productoCodigoCounter: { lastCodeNumber: 0 },
        pedidoCodigoCounter: { lastCodeNumber: 0 },
    },
    // Nuevas colecciones para usuarios y roles
    userProfiles: [
        {
            id: "profile-ventas",
            name: "Ventas",
            description: "Perfil para personal de ventas con permisos básicos",
            permissions: [
                { module: "ventas", actions: ["ver", "crear", "editar", "exportar"] },
            ],
            specialPermissions: [],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
        },
        {
            id: "profile-diseñador",
            name: "Diseñador",
            description: "Perfil para diseñadores con acceso a módulo de diseño",
            permissions: [
                { module: "diseño", actions: ["ver", "asignar", "subir-archivos", "marcar-completado", "editar-notas"] },
            ],
            specialPermissions: [],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
        },
        {
            id: "profile-cobranza",
            name: "Cobranza",
            description: "Perfil para personal de cobranza",
            permissions: [
                { module: "cobranza", actions: ["ver", "validar-pago", "editar-montos", "subir-comprobantes", "marcar-validado"] },
            ],
            specialPermissions: [],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
        },
    ],
    users: [
        {
            id: "user-admin-123",
            email: OWNER_EMAIL,
            name: "Dueño",
            password: "admin123", // En producción debería estar hasheado
            phone: "",
            status: "active",
            profiles: [],
            customPermissions: [],
            specialPermissions: SPECIAL_PERMISSIONS, // Admin maestro tiene todos los permisos especiales
            createdAt: new Date("2024-01-01"),
            lastLogin: new Date(),
            createdBy: "system",
        },
    ],
    clientes: [], // Colección de clientes
    leads: [], // Colección de leads (personas que no son clientes aún)
    // Flujos y etapas dinámicos
    flujos: [], // Colección de flujos de trabajo
    etapas: [], // Colección de etapas de los flujos
    // Configuración del sistema
    configuracion: {
        ventasTemporalDias: 7, // Días que se muestran en VentasTab (solo lectura temporal)
        cobranzaNumAbonos: 2, // Número de campos de abono en CobranzaTab (1-10)
        disenadores: ["Mercedes", "Abraham", "Huguito"], // Lista de diseñadores (editable en Configuración)
    },
    // Configuración de columnas visibles por pestaña (solo admin maestro puede editar)
    columnasConfig: {
        diseño: {
            // Básicas
            id: true,
            fecha: true,
            cliente: true,
            productos: true,
            diseñador: true,
            estado: true,
            fechaEntrada: true,
            acciones: true,
            // Datos del Cliente (expandidos)
            clienteNombre: false,
            clienteApellidos: false,
            clienteContacto: false,
            clienteContactoSecundario: false,
            clienteCorreo: false,
            clienteDNI: false,
            clienteDireccion: false,
            // Datos del Pedido
            canalVenta: false,
            activador: false,
            lineaProducto: false,
            whatsappOrigen: false,
            vendedor: false,
            montoTotal: false,
            // Datos de Diseño
            urlImagen: true,
            talla: true,
            notasDiseño: false,
        },
        cobranza: {
            // Básicas
            id: true,
            cliente: true,
            total: true,
            adelanto: true,
            pago1: true,
            pago2: true,
            saldo: true,
            estado: true,
            acciones: true,
            // Datos del Cliente
            clienteNombre: false,
            clienteContacto: false,
            clienteDNI: false,
            clienteDireccion: false,
            // Datos del Pedido
            canalVenta: false,
            vendedor: false,
            fechaPedido: false,
            activador: false,
            lineaProducto: false,
            // Datos de Envío
            fechaEnvio: false,
            linkWhatsapp: false,
            // Datos de Cobranza
            anadidosDL: false,
        },
        preparacion: {
            // Básicas
            id: true,
            cliente: true,
            productos: true,
            operador: true,
            estado: true,
            acciones: true,
            // Datos del Cliente
            clienteNombre: false,
            clienteContacto: false,
            // Datos del Pedido
            canalVenta: false,
            vendedor: false,
            // Específico
            anadidosDL: false,
        },
        estampado: {
            // Básicas
            id: true,
            cliente: true,
            productos: true,
            operador: true,
            estado: true,
            acciones: true,
            // Datos del Cliente
            clienteNombre: false,
            clienteContacto: false,
            // Datos del Pedido
            canalVenta: false,
            vendedor: false,
            // Específico
            anadidosDL: false,
        },
        empaquetado: {
            // Básicas
            id: true,
            cliente: true,
            productos: true,
            operador: true,
            estado: true,
            acciones: true,
            // Datos del Cliente
            clienteNombre: false,
            clienteContacto: false,
            // Datos del Pedido
            canalVenta: false,
            vendedor: false,
            // Específico
            anadidosDL: false,
        },
        reparto: {
            // Básicas
            id: true,
            cliente: true,
            destino: true,
            repartidor: true,
            estado: true,
            acciones: true,
            // Datos del Cliente
            clienteNombre: false,
            clienteContacto: false,
            clienteDNI: false,
            // Datos de Envío
            direccionCompleta: false,
            agenciaEnvio: false,
            fechaEnvio: false,
        },
        finalizados: {
            id: true,
            cliente: true,
            productos: true,
            fechaFinalizado: true,
            tiempoTotal: true,
            acciones: false,
        },
    },
    // Colección de productos creados por el dueño
    productos: [],
    // Colección de columnas dinámicas para la Hoja Maestra de Pedidos
    columnasPedidos: [],
}

/**
 * Inicializa las columnas por defecto basadas en el archivo .gs
 * Solo se ejecuta si no hay columnas ya definidas
 */
export function inicializarColumnasPorDefecto() {
    if (mockDatabase.columnasPedidos.length > 0) return

    const columnas: any[] = []

    // Función auxiliar para crear una columna
    const crearColumna = (id: any, nombre: any, campo: any, tipo: any, categoria: any, orden: any, editable: any = false, visible: any = false, opciones: any = null, formula: any = null, formato: any = null, requerido: any = false, esSistema: any = false) => {
        return {
            id,
            nombre,
            campo,
            tipo,
            categoria,
            orden,
            editable,
            visible,
            opciones: opciones || null,
            formula: formula || null,
            formato: formato || null,
            requerido,
            esSistema, // Columnas del sistema no se pueden eliminar
            fechaCreacion: new Date(),
            fechaModificacion: new Date(),
        }
    }

    let orden = 1

    // ===== COLUMNAS BÁSICAS DEL PEDIDO =====
    columnas.push(crearColumna("col-id", "N Pedido", "id", "texto", "basico", orden++, false, true, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-venta", "Fecha Venta", "createdAt", "fecha", "basico", orden++, false, true, null, null, "date", false, true))
    columnas.push(crearColumna("col-activador", "Activador", "activador", "lista", "basico", orden++, true, false, ["S", "E", "L", "G", "O"], null, null, false, true))
    columnas.push(crearColumna("col-canal-venta", "Canal Venta", "canalVenta", "texto", "basico", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-whatsapp-origen", "WhatsApp Origen", "whatsappOrigen", "texto", "basico", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-vendedor", "Vendedor", "vendedor", "texto", "basico", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-telefono", "Teléfono", "clienteContacto", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cantidad", "Cantidad", "cantidad", "numero", "basico", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-pedido", "Pedido", "productos", "texto", "basico", orden++, false, true, null, null, null, false, true))
    columnas.push(crearColumna("col-regalos", "Regalos", "regalos", "texto", "basico", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-talla", "Talla", "talla", "texto", "basico", orden++, true, true, null, null, null, false, true))
    columnas.push(crearColumna("col-productos-regalo", "Productos Regalo", "productosRegalo", "texto", "basico", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-observacion", "Observación", "observacion", "texto", "basico", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-departamento", "Cliente Departamento", "clienteDepartamento", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-distrito", "Cliente Distrito", "clienteDistrito", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-envio", "Fecha Envío", "fechaEnvio", "fecha", "envio", orden++, true, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-adelanto", "Adelanto", "montoAdelanto", "numero", "cobranza", orden++, true, false, null, null, "currency", false, true))
    columnas.push(crearColumna("col-debe", "Debe", "montoPendiente", "numero", "cobranza", orden++, false, false, null, "{montoTotal} - {montoAdelanto} - SUM({cobranza.pago1}, {cobranza.pago2})", "currency", false, true))
    columnas.push(crearColumna("col-monto-total", "Monto Total", "montoTotal", "numero", "cobranza", orden++, true, true, null, null, "currency", false, true))
    columnas.push(crearColumna("col-estado-general", "Estado General", "estadoGeneral", "lista", "basico", orden++, true, true, ["En Diseño", "En Cobranza", "Listo para Preparar", "En Pausa por Stock", "En Estampado", "En Empaquetado", "En Reparto", "Finalizado", "Anulado"], null, null, false, true))

    // ===== COLUMNAS DE DISEÑO =====
    columnas.push(crearColumna("col-fecha-entrada-diseño", "Fecha Entrada Diseño", "diseño.fechaEntrada", "fecha", "diseño", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-diseñador", "Diseñador", "diseño.diseñadorAsignado", "texto", "diseño", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-estado-diseño", "Estado Diseño", "diseño.estado", "lista", "diseño", orden++, true, false, ["Pendiente", "En Proceso", "TERMINADO"], null, null, false, true))
    columnas.push(crearColumna("col-url-diseño", "URL Diseño", "diseño.urlImagen", "texto", "diseño", orden++, true, true, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-salida-diseño", "Fecha Salida Diseño", "diseño.fechaSalida", "fecha", "diseño", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE COBRANZA =====
    columnas.push(crearColumna("col-estado-cobranza", "Estado Cobranza", "cobranza.estado", "lista", "cobranza", orden++, true, false, ["Pendiente", "Abonado", "Pagado"], null, null, false, true))
    columnas.push(crearColumna("col-pago1", "Pago 1", "cobranza.pago1", "numero", "cobranza", orden++, true, false, null, null, "currency", false, true))
    columnas.push(crearColumna("col-pago2", "Pago 2", "cobranza.pago2", "numero", "cobranza", orden++, true, false, null, null, "currency", false, true))
    columnas.push(crearColumna("col-fecha-salida-cobranza", "Fecha Salida Cobranza", "cobranza.fechaSalida", "fecha", "cobranza", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE PREPARACIÓN =====
    columnas.push(crearColumna("col-fecha-entrada-preparacion", "Fecha Entrada Preparación", "preparacion.fechaEntrada", "fecha", "preparacion", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-operador-preparacion", "Operador Preparación", "preparacion.operador", "texto", "preparacion", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-estado-preparacion", "Estado Preparación", "preparacion.estado", "lista", "preparacion", orden++, true, false, ["FALTA IMPRESIÓN", "EN PROCESO", "LISTO"], null, null, false, true))
    columnas.push(crearColumna("col-fecha-salida-preparacion", "Fecha Salida Preparación", "preparacion.fechaSalida", "fecha", "preparacion", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE ESTAMPADO =====
    columnas.push(crearColumna("col-fecha-entrada-estampado", "Fecha Entrada Estampado", "estampado.fechaEntrada", "fecha", "estampado", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-operador-estampado", "Operador Estampado", "estampado.operador", "texto", "estampado", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-estado-estampado", "Estado Estampado", "estampado.estado", "lista", "estampado", orden++, true, false, ["EN PROCESO", "EN STOP", "LISTO"], null, null, false, true))
    columnas.push(crearColumna("col-fecha-salida-estampado", "Fecha Salida Estampado", "estampado.fechaSalida", "fecha", "estampado", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE EMPAQUETADO =====
    columnas.push(crearColumna("col-fecha-entrada-empaquetado", "Fecha Entrada Empaquetado", "empaquetado.fechaEntrada", "fecha", "empaquetado", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-operador-empaquetado", "Operador Empaquetado", "empaquetado.operador", "texto", "empaquetado", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-estado-empaquetado", "Estado Empaquetado", "empaquetado.estado", "lista", "empaquetado", orden++, true, false, ["PAUSADO", "EMPAQUETADO", "LISTO"], null, null, false, true))
    columnas.push(crearColumna("col-fecha-salida-empaquetado", "Fecha Salida Empaquetado", "empaquetado.fechaSalida", "fecha", "empaquetado", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE REPARTO =====
    columnas.push(crearColumna("col-fecha-entrada-reparto", "Fecha Entrada Reparto", "reparto.fechaEntrada", "fecha", "reparto", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-repartidor-asignado", "Repartidor Asignado", "reparto.repartidor", "texto", "reparto", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-estado-reparto", "Estado Reparto", "reparto.estado", "lista", "reparto", orden++, true, false, ["ALISTANDO", "EN REPARTO", "ENTREGADO", "LISTO"], null, null, false, true))
    columnas.push(crearColumna("col-fecha-salida-reparto", "Fecha Salida Reparto", "reparto.fechaSalida", "fecha", "reparto", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-fecha-finalizado", "Fecha Finalizado", "reparto.fechaFinalizado", "fecha", "reparto", orden++, false, false, null, null, "date", false, true))

    // ===== COLUMNAS DE TIEMPOS (CALCULADAS) =====
    columnas.push(crearColumna("col-tiempo-diseño", "Tiempo Diseño", "tiempos.diseño", "numero", "tiempos", orden++, false, false, null, "IF({diseño.fechaEntrada} AND {diseño.fechaSalida}, ({diseño.fechaSalida} - {diseño.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-cobranza", "Tiempo Cobranza", "tiempos.cobranza", "numero", "tiempos", orden++, false, false, null, "IF({cobranza.fechaEntrada} AND {cobranza.fechaSalida}, ({cobranza.fechaSalida} - {cobranza.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-preparacion", "Tiempo Preparación", "tiempos.preparacion", "numero", "tiempos", orden++, false, false, null, "IF({preparacion.fechaEntrada} AND {preparacion.fechaSalida}, ({preparacion.fechaSalida} - {preparacion.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-estampado", "Tiempo Estampado", "tiempos.estampado", "numero", "tiempos", orden++, false, false, null, "IF({estampado.fechaEntrada} AND {estampado.fechaSalida}, ({estampado.fechaSalida} - {estampado.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-empaquetado", "Tiempo Empaquetado", "tiempos.empaquetado", "numero", "tiempos", orden++, false, false, null, "IF({empaquetado.fechaEntrada} AND {empaquetado.fechaSalida}, ({empaquetado.fechaSalida} - {empaquetado.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-reparto", "Tiempo Reparto", "tiempos.reparto", "numero", "tiempos", orden++, false, false, null, "IF({reparto.fechaEntrada} AND {reparto.fechaSalida}, ({reparto.fechaSalida} - {reparto.fechaEntrada}) / 24, null)", "hours", false, true))
    columnas.push(crearColumna("col-tiempo-total", "Tiempo Total", "tiempos.total", "numero", "tiempos", orden++, false, false, null, "SUM({tiempos.diseño}, {tiempos.cobranza}, {tiempos.preparacion}, {tiempos.estampado}, {tiempos.empaquetado}, {tiempos.reparto})", "hours", false, true))

    // ===== COLUMNAS DE DATOS DEL CLIENTE (EXPANDIDAS) =====
    columnas.push(crearColumna("col-cliente-correo", "Cliente Correo", "clienteCorreo", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-contacto-sec", "Cliente Contacto Secundario", "clienteContactoSecundario", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-nombres", "Cliente Nombres", "clienteNombre", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-apellidos", "Cliente Apellidos", "clienteApellidos", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-tipo-doc", "Cliente Tipo Doc", "clienteTipoDocumento", "lista", "cliente", orden++, true, false, ["DNI", "CE", "PASAPORTE", "RUC"], null, null, false, true))
    columnas.push(crearColumna("col-cliente-num-doc", "Cliente Num Doc", "clienteNumeroDocumento", "texto", "cliente", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cliente-provincia", "Cliente Provincia", "clienteProvincia", "texto", "cliente", orden++, true, false, null, null, null, false, true))

    // ===== COLUMNAS DE DETALLES DEL PEDIDO =====
    columnas.push(crearColumna("col-linea-producto", "Línea Producto", "lineaProducto", "texto", "pedido", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-es-personalizado", "Es Personalizado", "esPersonalizado", "booleano", "pedido", orden++, true, false, null, null, null, false, true))

    // ===== COLUMNAS DE ENVÍO (DESTINATARIO) =====
    columnas.push(crearColumna("col-envio-contacto", "Envío Contacto", "envioContacto", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-departamento", "Envío Departamento", "envioDepartamento", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-provincia", "Envío Provincia", "envioProvincia", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-distrito", "Envío Distrito", "envioDistrito", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-direccion", "Envío Dirección", "envioDireccion", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-agencia", "Envío Agencia", "agenciaEnvio", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-tipo-doc", "Envío Tipo Doc", "envioTipoDocumento", "lista", "envio", orden++, true, false, ["DNI", "CE", "PASAPORTE", "RUC"], null, null, false, true))
    columnas.push(crearColumna("col-envio-num-doc", "Envío Num Doc", "envioNumeroDocumento", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-nombres", "Envío Nombres", "envioNombres", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-envio-apellidos", "Envío Apellidos", "envioApellidos", "texto", "envio", orden++, true, false, null, null, null, false, true))

    // ===== COLUMNAS DE PRODUCTOS DETALLADOS =====
    columnas.push(crearColumna("col-producto-1", "Producto 1", "productos.0.producto", "texto", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cantidad-1", "Cantidad 1", "productos.0.cantidad", "numero", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-producto-2", "Producto 2", "productos.1.producto", "texto", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cantidad-2", "Cantidad 2", "productos.1.cantidad", "numero", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-producto-3", "Producto 3", "productos.2.producto", "texto", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cantidad-3", "Cantidad 3", "productos.2.cantidad", "numero", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-producto-4", "Producto 4", "productos.3.producto", "texto", "productos", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-cantidad-4", "Cantidad 4", "productos.3.cantidad", "numero", "productos", orden++, false, false, null, null, null, false, true))

    // ===== COLUMNAS DE COMENTARIOS =====
    columnas.push(crearColumna("col-autor-c1", "Autor C1", "comentarios.0.autor", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-c1", "Fecha C1", "comentarios.0.fecha", "fecha", "comentarios", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-texto-c1", "Texto C1", "comentarios.0.texto", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-autor-c2", "Autor C2", "comentarios.1.autor", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-c2", "Fecha C2", "comentarios.1.fecha", "fecha", "comentarios", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-texto-c2", "Texto C2", "comentarios.1.texto", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-autor-c3", "Autor C3", "comentarios.2.autor", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-c3", "Fecha C3", "comentarios.2.fecha", "fecha", "comentarios", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-texto-c3", "Texto C3", "comentarios.2.texto", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-autor-c4", "Autor C4", "comentarios.3.autor", "texto", "comentarios", orden++, false, false, null, null, null, false, true))
    columnas.push(crearColumna("col-fecha-c4", "Fecha C4", "comentarios.3.fecha", "fecha", "comentarios", orden++, false, false, null, null, "date", false, true))
    columnas.push(crearColumna("col-texto-c4", "Texto C4", "comentarios.3.texto", "texto", "comentarios", orden++, false, false, null, null, null, false, true))

    // ===== COLUMNAS ADICIONALES =====
    columnas.push(crearColumna("col-accion-cobranza", "Acción Cobranza", "cobranza.accion", "lista", "cobranza", orden++, true, false, ["ACTIVAR PAGO C."], null, null, false, true))
    columnas.push(crearColumna("col-link-whatsapp", "Link WhatsApp", "linkWhatsapp", "texto", "envio", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-es-mostacero", "Es Mostacero", "esMostacero", "booleano", "pedido", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-prioridad", "Prioridad", "esPrioridad", "booleano", "pedido", orden++, true, false, null, null, null, false, true))
    columnas.push(crearColumna("col-anadidos-dl", "Añadidos DL", "anadidos", "texto", "pedido", orden++, true, false, null, null, null, false, true))

    // Guardar las columnas en mockDatabase
    mockDatabase.columnasPedidos = columnas
}

// Funciones simuladas de Firebase
export const mockFirestore = {
    collection: (path: any) => ({
        add: async (data: any) => {
            // Si el data ya tiene un id, usarlo; si no, generar uno nuevo
            let id = data.id || "mock_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
            const newItem = { ...data, id }
            if (!newItem.createdAt) {
                newItem.createdAt = new Date()
            }

            if (path.includes("pedidos")) {
                // Si viene de importación con id del archivo, conservarlo; si no, generar secuencial
                const idDelArchivo = data.id != null && String(data.id).trim() !== ""
                if (!idDelArchivo) {
                    // Asegurar que el contador continúe desde el mayor número existente
                    const currentMax = (mockDatabase.pedidos || []).reduce((max: number, p: any) => {
                        const raw = String(p.numeroPedido || p.id || "").replace(/[^\d]/g, "")
                        const num = raw ? parseInt(raw, 10) : NaN
                        return isNaN(num) ? max : Math.max(max, num)
                    }, mockDatabase.counters.pedidoCodigoCounter.lastCodeNumber || 0)
                    mockDatabase.counters.pedidoCodigoCounter.lastCodeNumber = currentMax + 1
                    const numeroPedido = String(mockDatabase.counters.pedidoCodigoCounter.lastCodeNumber).padStart(6, "0")
                    newItem.numeroPedido = numeroPedido
                    newItem.id = numeroPedido
                    id = numeroPedido
                } else {
                    id = String(data.id).trim()
                    newItem.id = id
                    newItem.numeroPedido = newItem.numeroPedido || id
                }
                mockDatabase.pedidos.push(newItem)
            } else if (path.includes("inventarioPrendas")) {
                mockDatabase.inventarioPrendas.push(newItem)
            } else if (path.includes("inventarioProductos")) {
                mockDatabase.inventarioProductos.push(newItem)
            } else if (path.includes("categoriasProductos")) {
                mockDatabase.categoriasProductos.push(newItem)
            } else if (path.includes("movimientosInventarioGlobal")) {
                mockDatabase.movimientosInventarioGlobal.push(newItem)
            } else if (path.includes("userProfiles")) {
                mockDatabase.userProfiles.push(newItem)
            } else if (path.includes("users")) {
                mockDatabase.users.push(newItem)
            } else if (path.includes("clientes")) {
                mockDatabase.clientes.push(newItem)
            } else if (path.includes("leads")) {
                mockDatabase.leads.push(newItem)
            } else if (path.includes("flujos")) {
                // Si el item ya tiene un id, usarlo; si no, generar uno nuevo
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
            } else if (path.includes("inventarios")) {
                // Si el item ya tiene un id, usarlo; si no, generar uno nuevo
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                // Verificar que no exista ya
                if (!mockDatabase.inventarios.find((inv: any) => inv.id === id)) {
                    mockDatabase.inventarios.push(newItem)
                }
            } else if (path.includes("etapas")) {
                // Si el item ya tiene un id, usarlo; si no, generar uno nuevo
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                // Verificar que no exista ya para evitar duplicados
                const existe = mockDatabase.etapas.find((e: any) => e.id === newItem.id)
                if (!existe) {
                    mockDatabase.etapas.push(newItem)
                } else {
                    // Si existe, actualizar en lugar de duplicar
                    const index = mockDatabase.etapas.findIndex((e: any) => e.id === newItem.id)
                    if (index >= 0) {
                        mockDatabase.etapas[index] = newItem
                    }
                }
            } else if (path.includes("productos")) {
                // Si el item ya tiene un id, usarlo; si no, generar uno nuevo
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                mockDatabase.productos.push(newItem)
            }

            return { id }
        },
        onSnapshot: (callback: any) => {
            let data: any[] = []
            if (path.includes("pedidos")) {
                data = mockDatabase.pedidos
            } else if (path.includes("inventarioPrendas")) {
                data = mockDatabase.inventarioPrendas
            } else if (path.includes("inventarioProductos")) {
                data = mockDatabase.inventarioProductos
            } else if (path.includes("categoriasProductos")) {
                data = mockDatabase.categoriasProductos
            } else if (path.includes("movimientosInventarioGlobal")) {
                data = mockDatabase.movimientosInventarioGlobal
            } else if (path.includes("userProfiles")) {
                data = mockDatabase.userProfiles
            } else if (path.includes("users")) {
                data = mockDatabase.users
            } else if (path.includes("clientes")) {
                data = mockDatabase.clientes
            } else if (path.includes("leads")) {
                data = mockDatabase.leads
            } else if (path.includes("flujos")) {
                data = mockDatabase.flujos
            } else if (path.includes("etapas")) {
                data = mockDatabase.etapas
            } else if (path.includes("inventarios")) {
                data = mockDatabase.inventarios
            } else if (path.includes("productos")) {
                data = mockDatabase.productos
            }

            callback({
                docs: data.map((item: any) => ({
                    id: item.id,
                    data: () => item,
                })),
            })

            // Retornar función de limpieza
            return () => { }
        },
        // Añadir soporte básico para doc()
        doc: (docId: any) => ({
            update: async (data: any) => {
                let collection: any[] = []
                if (path.includes("users")) collection = mockDatabase.users
                else if (path.includes("pedidos")) collection = mockDatabase.pedidos

                const item = collection.find((i: any) => i.id === docId)
                if (item) {
                    Object.assign(item, data)
                }
            },
            delete: async () => {
                let collection: any[] = []
                if (path.includes("users")) collection = mockDatabase.users
                // ... implementar otros si es necesario
                const index = collection.findIndex(i => i.id === docId)
                if (index >= 0) collection.splice(index, 1)
            }
        })
    }),
    // Soporte directo para doc("collection", "id") fuera de collection()
    doc: (collectionName: any, docId: any) => ({
        update: async (data: any) => {
            let collection: any[] = []
            if (collectionName === "users") collection = mockDatabase.users
            else if (collectionName === "pedidos") collection = mockDatabase.pedidos
            const item = collection.find((i: any) => i.id === docId)
            if (item) {
                Object.assign(item, data)
            }
        }
    })
}
