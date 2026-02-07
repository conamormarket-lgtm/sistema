
// @ts-nocheck
// Deshabilitamos chequeo estricto temporalmente para facilitar la migración
// TODO: Habilitar chequeo estricto y corregir tipos

import { initialTiposDePrendaInventario, initialColoresInventario, initialTallasInventario } from "./constants"

export const SPECIAL_PERMISSIONS = [
    "configuracion",
    "reportes",
    "exportar-datos",
    "ver-historial-completo",
    "gestionar-usuarios",
    "gestionar-roles",
]

// Email del dueño (configurable)
export const OWNER_EMAIL = "admin@sistema.com"

export const TIPOS_CONDICIONES = [
    { id: "diseñador_asignado", nombre: "Diseñador Asignado", descripcion: "Verifica que se haya asignado un diseñador", requiereInventario: false },
    { id: "url_agregado", nombre: "URL Agregado", descripcion: "Verifica que se haya agregado la URL del diseño", requiereInventario: false },
    { id: "tallas_agregadas", nombre: "Tallas Agregadas", descripcion: "Verifica que se hayan agregado las tallas", requiereInventario: false },
    { id: "comentario", nombre: "Comentario", descripcion: "Verifica que se haya agregado un comentario", requiereInventario: false },
    { id: "no_debe_nada", nombre: "No Debe Nada", descripcion: "Verifica que el pedido no tenga deudas pendientes", requiereInventario: false },
    { id: "hay_stock", nombre: "Hay Stock", descripcion: "Verifica que haya stock disponible en el inventario", requiereInventario: true },
    { id: "no_hay_stock", nombre: "No Hay Stock", descripcion: "Verifica que NO haya stock en el inventario", requiereInventario: true },
    { id: "operador_asignado", nombre: "Operador Asignado", descripcion: "Verifica que se haya asignado un operador en la etapa", requiereInventario: false },
    { id: "repartidor_asignado", nombre: "Repartidor Asignado", descripcion: "Verifica que se haya asignado un repartidor", requiereInventario: false },
    { id: "estado_listo", nombre: "Estado LISTO", descripcion: "Verifica que el estado de la etapa sea 'LISTO'", requiereInventario: false },
    { id: "estado_entregado", nombre: "Estado ENTREGADO", descripcion: "Verifica que el estado de la etapa sea 'ENTREGADO'", requiereInventario: false },
    { id: "stock_reducido", nombre: "Stock Reducido", descripcion: "Verifica que el stock se haya reducido exitosamente del inventario", requiereInventario: true },
]

// Matriz de composición de productos (desde .gs)
export const MATRIZ_COMPOSICION = {
    "Box Coleccioón C + J + P + REGALO": { "Casaca": 1, "Jogger": 1, "Polo": 1 },
    "Box Casaca + Polo + Regalo": { "Casaca": 1, "Polo": 1 },
    "Box 2 Poleras Parejas": { "Polera": 2 },
    "Box Conjunto chica": { "Jogger": 1, "Crop": 1 },
    "Box Celestial": { "C. Luna": 2, "Anillos": 2, "Pulsera": 2 },
    "Box Joyas Personalizadas": { "Collar G": 1, "Pulsera": 2 },
    "Poleras": { "Polera": 1 },
    "Casacas": { "Casaca": 1 },
    "Gorras": { "Gorra": 1 },
    "Gorra": { "Gorra": 1 },
    "Polos": { "Polo": 1 },
    "Joggers": { "Jogger": 1 },
    "Pijamas": { "Pijama": 1 },
    "Chaqueta": { "Chaqueta": 1 },
    "Cuello Redondo": { "Cuello R.": 1 },
    "Taza P": { "Taza": 1 },
    "Collar G": { "Collar G": 1 },
    "Collares S y L": { "C. Luna": 2 },
    "Pulseras S y L": { "Pulsera": 2 },
    "Anillos S y L": { "Anillos": 2 },
    "Billetera": { "Billetera": 1 },
    "MousePad": { "Mouse P": 1 },
}

// Mapeo de desglose de productos (desde .gs)
export const MAPEO_DESGLOSE_PRODUCTOS = {
    "Polera": 100,
    "Casaca": 101,
    "Polo": 102,
    "Jogger": 103,
    "Pijama": 104,
    "Chaqueta": 105,
    "Cuello R.": 106,
    "Taza": 107,
    "Billetera": 108,
    "Collar G": 109,
    "C. Luna": 110,
    "Pulsera": 111,
    "Anillos": 112,
    "Mouse P": 113,
    "Crop": 114,
    "Gorra": 115,
}

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
            tipo: "prendas",
            activo: true,
            orden: 0,
            icono: "Shirt",
            color: "#3B82F6",
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
            orden: 1,
            icono: "PackageSearch",
            color: "#10B981",
            fechaCreacion: new Date("2024-01-01"),
            fechaModificacion: new Date("2024-01-01"),
            creadoPor: "system",
        },
        {
            id: "inventario-insumos",
            nombre: "Inventario de Insumos",
            descripcion: "Insumos y materiales",
            tipo: "insumos",
            activo: true,
            orden: 2,
            icono: "Wrench",
            color: "#F59E0B",
            fechaCreacion: new Date("2024-01-01"),
            fechaModificacion: new Date("2024-01-01"),
            creadoPor: "system",
        },
        {
            id: "inventario-activos",
            nombre: "Inventario de Activos",
            descripcion: "Activos fijos y equipos",
            tipo: "activos",
            activo: true,
            orden: 3,
            icono: "ArchiveRestore",
            color: "#8B5CF6",
            fechaCreacion: new Date("2024-01-01"),
            fechaModificacion: new Date("2024-01-01"),
            creadoPor: "system",
        },
    ],
    // Configuración por inventario (tipos/colores/tallas para prendas; editable en Gestión de Inventarios)
    configInventarioPrendas: {
        tiposPrenda: [...initialTiposDePrendaInventario],
        colores: [...initialColoresInventario],
        tallas: [...initialTallasInventario],
    },
    // Configuración de opciones por tipo (legacy; se usa configInventarioGenerico por inventario)
    configInventarioOpciones: {
        productos: [] as string[],
        insumos: [] as string[],
        activos: [] as string[],
    } as Record<string, string[]>,
    // Configuración genérica por inventario (id): qué se inventaría, tipos y características (para no-prendas y nuevos)
    configInventarioGenerico: {} as Record<string, {
        nombreItem: string
        tipos: string[]
        caracteristicas: { nombre: string; valores: string[] }[]
    }>,
    counters: {
        prendaCodigoCounter: { lastCodeNumber: 5 },
        productoCodigoCounter: { lastCodeNumber: 0 },
        pedidoCodigoCounter: { lastCodeNumber: 0 },
    },
    // Módulo Inventario (portado de conamormarket-lgtm/inventory) — datos en memoria
    inventoryStats: {
        items: [] as { type: string; color: string; size: string; quantity: number; id: string }[],
        lastUpdated: null as string | null,
    },
    inventoryHistory: [] as { id: string; timestamp: string; user: string; action: string; details: string; quantity: number; metadata: { type: string; color: string; size: string; quantity: number; originalActionType: string } }[],
    inventoryMetadata: null as { garments: string[]; colors: { name: string; hex: string }[]; sizes: string[] } | null,
    // Inventarios genéricos (no prendas): items e historial por inventarioId
    inventarioGenericoStats: {} as Record<string, { items: { id: string; tipo: string; attrs: Record<string, string>; quantity: number }[] }>,
    inventarioGenericoHistory: {} as Record<string, { id: string; timestamp: string; user: string; action: string; details: string; quantity: number; metadata: Record<string, unknown> }[]>,
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
        vendedores: ["Vendedor 1", "Vendedor 2", "Vendedor 3", "Vendedor 4"],
        operarios: ["OperadorPE1", "OperadorPE2", "Raúl", "Henry", "OperadorEmp1", "OperadorEmp2"], // Lista única para Preparación, Estampado y Empaquetado (editable en Configuración)
        repartidores: ["RepartidorA", "RepartidorB", "Motorizado1"],
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
    // Mapeos de importación
    mapeosImportacion: [],
}

/**
 * Inicializa las columnas por defecto basadas en el archivo .gs
 * Solo se ejecuta si no hay columnas ya definidas
 */
export function inicializarColumnasPorDefecto() {
    if (mockDatabase.columnasPedidos.length > 0) return

    const columnas = []

    // Función auxiliar para crear una columna
    const crearColumna = (id: any, nombre: any, campo: any, tipo: any, categoria: any, orden: any, editable = false, visible = false, opciones: any = null, formula: any = null, formato: any = null, requerido = false, esSistema = false) => {
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

export function despacharItem(nombreItem: string, cantidadPrincipal: number, conteoDesglosado: any) {
    const composicion = (MATRIZ_COMPOSICION as any)[nombreItem]
    let cantidadComponentesTotal = 0

    if (composicion) {
        for (let componente in composicion) {
            const cantidadComponente = composicion[componente] * cantidadPrincipal
            if (!conteoDesglosado[componente]) {
                conteoDesglosado[componente] = 0
            }
            conteoDesglosado[componente] += cantidadComponente
            cantidadComponentesTotal += cantidadComponente
        }
    } else {
        // Fallback: Ítem simple
        if ((MAPEO_DESGLOSE_PRODUCTOS as any)[nombreItem]) {
            if (!conteoDesglosado[nombreItem]) {
                conteoDesglosado[nombreItem] = 0
            }
            conteoDesglosado[nombreItem] += Number(cantidadPrincipal)
            cantidadComponentesTotal = Number(cantidadPrincipal)
        }
    }
    return cantidadComponentesTotal
}

export function validarColorEnTexto(textoIngresado: any) {
    if (!textoIngresado) return { valido: true }
    const textoStr = String(textoIngresado)
    if (textoStr.trim() === "") return { valido: true }

    const coloresValidos = [
        "NEGRO", "BLANCO", "ROJO", "AZUL", "VERDE", "AMARILLO", "ROSA", "MORADO",
        "NARANJA", "GRIS", "BEIGE", "CAFÉ", "MARRÓN", "DORADO", "PLATEADO",
    ]

    const items = textoStr.split("-")
    let itemsInvalidos: any[] = []

    items.forEach((item) => {
        const itemUpper = item.trim().toUpperCase()
        if (itemUpper.length === 0) return

        const tieneColor = coloresValidos.some((color) => itemUpper.includes(color))
        if (!tieneColor) {
            itemsInvalidos.push(item.trim())
        }
    })

    if (itemsInvalidos.length > 0) {
        return {
            valido: false,
            itemsFallidos: itemsInvalidos.join(" / "),
        }
    } else {
        return { valido: true }
    }
}

export function calcularSaldoPedido(pedido: any) {
    const montoTotal = pedido.montoTotal || 0
    const adelanto = pedido.montoAdelanto || 0
    const pago1 = pedido.cobranza?.pago1 || 0
    const pago2 = pedido.cobranza?.pago2 || 0
    return montoTotal - adelanto - pago1 - pago2
}

export function verificarStock(pedido: any, inventarioId = 'inventarioPrendas') {
    const resultado = verificarStockConDetalle(pedido, inventarioId)
    return resultado.tieneStock
}

export function verificarStockConDetalle(pedido: any, inventarioId = 'inventarioPrendas') {
    let coleccionInventario = inventarioId

    if (inventarioId && inventarioId.includes('-')) {
        const inventario = mockDatabase.inventarios.find((inv: any) => inv.id === inventarioId)
        if (inventario) {
            if (inventario.id === 'inventario-prendas') {
                coleccionInventario = 'inventarioPrendas'
            } else if (inventario.id === 'inventario-productos') {
                coleccionInventario = 'inventarioProductos'
            } else {
                coleccionInventario = inventario.id.replace(/-/g, '')
            }
        }
    }

    const inventario = mockDatabase[coleccionInventario] || []

    if (!inventario || inventario.length === 0) {
        console.warn(`Inventario ${inventarioId} (colección: ${coleccionInventario}) no encontrado o vacío`)
        return { tieneStock: false, razon: "inventario_vacio" }
    }

    let prendas: any[] = []

    if (pedido.prendas && pedido.prendas.length > 0) {
        prendas = pedido.prendas
    }
    else if (pedido.talla && pedido.talla.trim() !== "") {
        const partes = pedido.talla.split(' - ')
        for (const parte of partes) {
            const parteLimpia = parte.trim()
            if (!parteLimpia) continue

            const match = parteLimpia.match(/^(.+?)\s+([^(]+?)\s*\(?([^)]+)\)?$/)
            if (match) {
                const tipoPrenda = match[1].trim()
                const color = match[2].trim()
                const talla = (match[3] || "").trim()

                prendas.push({
                    tipoPrenda,
                    color,
                    talla,
                    cantidad: 1,
                })
            } else {
                const tokens = parteLimpia.split(/\s+/)
                if (tokens.length >= 3) {
                    const talla = tokens[tokens.length - 1]
                    const color = tokens[tokens.length - 2]
                    const tipoPrenda = tokens.slice(0, tokens.length - 2).join(' ')

                    prendas.push({
                        tipoPrenda,
                        color,
                        talla,
                        cantidad: 1,
                    })
                }
            }
        }
    }

    if (prendas.length === 0) {
        console.warn("No se encontraron prendas en el pedido para verificar stock")
        return { tieneStock: false, razon: "sin_prendas" }
    }

    for (const prenda of prendas) {
        const itemInventario = inventario.find(
            (item: any) => item.tipoPrenda?.toLowerCase() === prenda.tipoPrenda?.toLowerCase() &&
                item.color?.toLowerCase() === prenda.color?.toLowerCase() &&
                item.talla?.toLowerCase() === prenda.talla?.toLowerCase()
        )

        if (!itemInventario) {
            console.warn(`No se encontró en inventario: ${prenda.tipoPrenda} ${prenda.color} ${prenda.talla}`)
            return { tieneStock: false, razon: "no_encontrado" }
        }

        const cantidadNecesaria = prenda.cantidad || 1
        if (itemInventario.cantidad < cantidadNecesaria) {
            console.warn(`Stock insuficiente: ${prenda.tipoPrenda} ${prenda.color} ${prenda.talla} (necesario: ${cantidadNecesaria}, disponible: ${itemInventario.cantidad})`)
            return { tieneStock: false, razon: "sin_stock" }
        }
    }

    return { tieneStock: true, razon: "ok" }
}

export function evaluarCondicion(condicion: any, pedido: any) {
    if (!condicion || !condicion.tipo) return true

    switch (condicion.tipo) {
        case "diseñador_asignado":
            return !!(pedido.diseño?.diseñadorAsignado)
        case "url_agregado":
            return !!(pedido.diseño?.urlImagen && pedido.diseño.urlImagen.trim() !== "")
        case "tallas_agregadas":
            return !!(pedido.talla && pedido.talla.trim() !== "")
        case "comentario":
            return !!(pedido.notasDiseño && pedido.notasDiseño.trim() !== "")
        case "no_debe_nada":
            return calcularSaldoPedido(pedido) <= 0
        case "hay_stock":
            const inventarioId = condicion.parametros?.inventarioId || "inventarioPrendas"
            return verificarStock(pedido, inventarioId)
        case "no_hay_stock":
            const inventarioIdNoStock = condicion.parametros?.inventarioId || "inventarioPrendas"
            return !verificarStock(pedido, inventarioIdNoStock)
        case "operador_asignado":
            const etapaOperador = condicion.parametros?.etapaActual || null
            if (etapaOperador) {
                return !!(pedido[etapaOperador]?.operador || pedido[etapaOperador]?.operadorNombre)
            }
            const etapasConOperador = ["preparacion", "estampado", "empaquetado"]
            return etapasConOperador.some(etapa => !!(pedido[etapa]?.operador || pedido[etapa]?.operadorNombre))
        case "repartidor_asignado":
            return !!(pedido.reparto?.repartidor || pedido.reparto?.repartidorNombre)
        case "estado_listo":
            const etapaActual = condicion.parametros?.etapaActual || "preparacion"
            return String(pedido[etapaActual]?.estado || "").trim().toUpperCase() === "LISTO"
        case "estado_entregado":
            return String(pedido.reparto?.estado || "").trim().toUpperCase() === "ENTREGADO"
        case "stock_reducido":
            const inventarioIdStock = condicion.parametros?.inventarioId || "inventarioPrendas"
            return verificarStock(pedido, inventarioIdStock)
        default:
            return true
    }
}

export function evaluarCondiciones(condiciones: any, pedido: any) {
    if (!condiciones || condiciones.length === 0) {
        return { cumplidas: true, condicionesFaltantes: [] }
    }

    const condicionesFaltantes: any[] = []

    for (const condicion of condiciones) {
        if (condicion.requerida) {
            const cumple = evaluarCondicion(condicion, pedido)
            if (!cumple) {
                const tipoCondicion = TIPOS_CONDICIONES.find(t => t.id === condicion.tipo)
                condicionesFaltantes.push(tipoCondicion?.nombre || condicion.tipo)
            }
        }
    }

    return {
        cumplidas: condicionesFaltantes.length === 0,
        condicionesFaltantes
    }
}

export function evaluarCondicionesEntrada(etapaId: string, pedido: any) {
    const etapa = mockDatabase.etapas.find((e: any) => e.id === etapaId)
    if (!etapa || !etapa.condicionesEntrada || etapa.condicionesEntrada.length === 0) {
        return { debeSaltar: false, etapaDestinoId: null }
    }

    for (const condicion of etapa.condicionesEntrada) {
        if (condicion.parametros?.saltarAutomatico && condicion.parametros?.etapaDestinoId) {
            const cumple = evaluarCondicion(condicion, pedido)
            if (cumple) {
                const etapaDestino = mockDatabase.etapas.find((e: any) => e.id === condicion.parametros.etapaDestinoId)
                if (etapaDestino && etapaDestino.flujoId === etapa.flujoId) {
                    return {
                        debeSaltar: true,
                        etapaDestinoId: condicion.parametros.etapaDestinoId
                    }
                }
            }
        }
    }

    return { debeSaltar: false, etapaDestinoId: null }
}

export function reducirStockDeInventario(idPedido: any) {
    return {
        exito: true,
        mensaje: `Stock para pedido #${idPedido} registrado exitosamente.`,
    }
}

export function buscarItemEnInventario(inventarioId: string, criterio: string) {
    if (!inventarioId || !criterio) return []

    let coleccionInventario: string = inventarioId
    if (inventarioId.includes('-')) {
        const inventario = mockDatabase.inventarios.find((inv: any) => inv.id === inventarioId)
        if (inventario) {
            if (inventario.id === 'inventario-prendas') {
                coleccionInventario = 'inventarioPrendas'
            } else if (inventario.id === 'inventario-productos') {
                coleccionInventario = 'inventarioProductos'
            } else {
                coleccionInventario = inventario.id.replace(/-/g, '')
            }
        }
    }

    const inventario = (mockDatabase as any)[coleccionInventario] || []
    if (!inventario || inventario.length === 0) return []

    const criterioLower = criterio.trim().toLowerCase()

    const porCodigo = inventario.filter((item: any) =>
        item.codigoPrenda?.toLowerCase() === criterioLower ||
        item.codigoProducto?.toLowerCase() === criterioLower ||
        item.codigo?.toLowerCase() === criterioLower
    )

    if (porCodigo.length > 0) {
        return porCodigo.map((item: any) => ({
            id: item.id,
            codigo: item.codigoPrenda || item.codigoProducto || item.codigo,
            nombre: `${item.tipoPrenda || item.tipoProducto || item.nombre || ''} ${item.color || ''} ${item.talla || ''}`.trim(),
            costoUnitario: item.costoUnitario || item.costo || 0,
            tipoPrenda: item.tipoPrenda || item.tipoProducto,
            color: item.color,
            talla: item.talla,
            cantidad: item.cantidad || 0,
        }))
    }

    const porTipo = inventario.filter((item: any) => {
        const tipo = (item.tipoPrenda || item.tipoProducto || item.nombre || '').toLowerCase()
        const color = (item.color || '').toLowerCase()
        return tipo.includes(criterioLower) || color.includes(criterioLower)
    })

    return porTipo.map((item: any) => ({
        id: item.id,
        codigo: item.codigoPrenda || item.codigoProducto || item.codigo,
        nombre: `${item.tipoPrenda || item.tipoProducto || item.nombre || ''} ${item.color || ''} ${item.talla || ''}`.trim(),
        costoUnitario: item.costoUnitario || item.costo || 0,
        tipoPrenda: item.tipoPrenda || item.tipoProducto,
        color: item.color,
        talla: item.talla,
        cantidad: item.cantidad || 0,
    }))
}

export function calcularCostoProducto(producto: any) {
    if (!producto) return 0

    if (producto.tipo === 'simple') {
        if (producto.itemInventarioId && producto.inventarioId) {
            const item = buscarItemEnInventario(producto.inventarioId, producto.itemInventarioId)
            if (item.length > 0) {
                return item[0].costoUnitario || 0
            }
        }
        return producto.costoTotal || 0
    } else if (producto.tipo === 'compuesto') {
        if (!producto.componentes || producto.componentes.length === 0) return 0

        let costoTotal = 0
        for (const componente of producto.componentes) {
            const items = buscarItemEnInventario(componente.inventarioId, componente.itemInventarioId)
            if (items.length > 0) {
                const costoUnitario = items[0].costoUnitario || 0
                costoTotal += costoUnitario * (componente.cantidad || 1)
            }
        }
        return costoTotal
    }

    return 0
}

export async function sincronizarCostoProductoInventario(productoId: string, nuevoCosto: number) {
    const producto: any = mockDatabase.productos.find((p: any) => p.id === productoId)
    if (!producto) return

    producto.costoTotal = nuevoCosto
    producto.fechaModificacion = new Date()

    if (producto.tipo === 'simple') {
        if (producto.itemInventarioId && producto.inventarioId) {
            let coleccionInventario = producto.inventarioId
            if (producto.inventarioId.includes('-')) {
                const inventario = mockDatabase.inventarios.find((inv: any) => inv.id === producto.inventarioId)
                if (inventario) {
                    if (inventario.id === 'inventario-prendas') {
                        coleccionInventario = 'inventarioPrendas'
                    } else if (inventario.id === 'inventario-productos') {
                        coleccionInventario = 'inventarioProductos'
                    } else {
                        coleccionInventario = inventario.id.replace(/-/g, '')
                    }
                }
            }

            const inventario = (mockDatabase as any)[coleccionInventario] || []
            const item = inventario.find((i: any) => i.id === producto.itemInventarioId)
            if (item) {
                item.costoUnitario = nuevoCosto
                try {
                    await mockFirestore.doc(coleccionInventario, item.id).update({ costoUnitario: nuevoCosto })
                } catch (error) {
                    console.error('Error actualizando costo en inventario:', error)
                }
            }
        }
    } else if (producto.tipo === 'compuesto') {
        if (producto.componentes && producto.componentes.length > 0) {
            const costoAnterior = calcularCostoProducto({ ...producto, costoTotal: producto.costoTotal || 0 })
            const factor = costoAnterior > 0 ? nuevoCosto / costoAnterior : 1

            for (const componente of producto.componentes) {
                let coleccionInventario = componente.inventarioId
                if (componente.inventarioId.includes('-')) {
                    const inventario = mockDatabase.inventarios.find((inv: any) => inv.id === componente.inventarioId)
                    if (inventario) {
                        if (inventario.id === 'inventario-prendas') {
                            coleccionInventario = 'inventarioPrendas'
                        } else if (inventario.id === 'inventario-productos') {
                            coleccionInventario = 'inventarioProductos'
                        } else {
                            coleccionInventario = inventario.id.replace(/-/g, '')
                        }
                    }
                }

                const inventario = (mockDatabase as any)[coleccionInventario] || []
                const item = inventario.find((i: any) => i.id === componente.itemInventarioId)
                if (item) {
                    const nuevoCostoItem = (item.costoUnitario || 0) * factor
                    item.costoUnitario = nuevoCostoItem
                    try {
                        await mockFirestore.doc(coleccionInventario, item.id).update({ costoUnitario: nuevoCostoItem })
                    } catch (error) {
                        console.error('Error al actualizar costo en inventario:', error)
                    }
                }
            }
        }
    }
}

export function recalcularCostosProductosPorInventario(inventarioId: any, itemId: any) {
    const productosAfectados = mockDatabase.productos.filter((producto: any) => {
        if (producto.tipo === 'simple') {
            return producto.inventarioId === inventarioId && producto.itemInventarioId === itemId
        } else if (producto.tipo === 'compuesto') {
            return producto.componentes?.some((c: any) => c.inventarioId === inventarioId && c.itemInventarioId === itemId)
        }
        return false
    })

    for (const producto of productosAfectados) {
        const nuevoCosto = calcularCostoProducto(producto)
        producto.costoTotal = nuevoCosto
        producto.fechaModificacion = new Date()
    }
}

export function calcularTiempos(pedido: any) {
    const tiempos: any = {
        diseño: null,
        cobranza: null,
        preparacion: null,
        estampado: null,
        empaquetado: null,
        reparto: null,
        total: null,
    }

    if (pedido.diseño?.fechaEntrada && pedido.diseño?.fechaSalida) {
        const inicio = new Date(pedido.diseño.fechaEntrada) as any
        const fin = new Date(pedido.diseño.fechaSalida) as any
        tiempos.diseño = (fin - inicio) / (1000 * 60 * 60)
    }
    // ... resto de tiempos
    if (pedido.cobranza?.fechaEntrada && pedido.cobranza?.fechaSalida) {
        const inicio = new Date(pedido.cobranza.fechaEntrada) as any
        const fin = new Date(pedido.cobranza.fechaSalida) as any
        tiempos.cobranza = (fin - inicio) / (1000 * 60 * 60)
    }
    if (pedido.preparacion?.fechaEntrada && pedido.preparacion?.fechaSalida) {
        const inicio = new Date(pedido.preparacion.fechaEntrada) as any
        const fin = new Date(pedido.preparacion.fechaSalida) as any
        tiempos.preparacion = (fin - inicio) / (1000 * 60 * 60)
    }
    if (pedido.estampado?.fechaEntrada && pedido.estampado?.fechaSalida) {
        const inicio = new Date(pedido.estampado.fechaEntrada) as any
        const fin = new Date(pedido.estampado.fechaSalida) as any
        tiempos.estampado = (fin - inicio) / (1000 * 60 * 60)
    }
    if (pedido.empaquetado?.fechaEntrada && pedido.empaquetado?.fechaSalida) {
        const inicio = new Date(pedido.empaquetado.fechaEntrada) as any
        const fin = new Date(pedido.empaquetado.fechaSalida) as any
        tiempos.empaquetado = (fin - inicio) / (1000 * 60 * 60)
    }
    if (pedido.reparto?.fechaEntrada && pedido.reparto?.fechaSalida) {
        const inicio = new Date(pedido.reparto.fechaEntrada) as any
        const fin = new Date(pedido.reparto.fechaSalida) as any
        tiempos.reparto = (fin - inicio) / (1000 * 60 * 60)
    }

    const tiemposArray = Object.values(tiempos).filter((t: any) => t !== null)
    if (tiemposArray.length > 0) {
        tiempos.total = tiemposArray.reduce((sum: any, t: any) => sum + t, 0)
    }

    return tiempos
}

export const serverTimestamp = () => new Date()
export const increment = (value: number) => ({ _increment: value })

/** Para pedidos: coincide por id o numeroPedido (string o número), así update encuentra el doc aunque id sea "5457" vs 5457. */
function matchPedidoId(item: any, docId: string) {
    if (item.id == null && item.numeroPedido == null) return false
    const a = String(item.id ?? item.numeroPedido ?? "")
    const b = String(docId ?? "")
    if (a === b) return true
    const na = (a.replace(/\D/g, "") || "").trim()
    const nb = (b.replace(/\D/g, "") || "").trim()
    return na !== "" && nb !== "" && parseInt(na, 10) === parseInt(nb, 10)
}

// Listeners para notificar cambios en pedidos (diferido y debounced para no colgar en importaciones masivas)
const pedidosSnapshotListeners: Array<(snapshot: any) => void> = []
let pedidosNotifyTimeout: ReturnType<typeof setTimeout> | null = null

function notifyPedidosListeners() {
    const snapshot = createSnapshotForPath("pedidos")
    pedidosSnapshotListeners.forEach((cb) => {
        try { cb(snapshot) } catch (e) { console.error("Error en listener pedidos:", e) }
    })
}

// Listeners para notificar cambios en etapas y flujos (actualización inmediata en la UI)
const etapasSnapshotListeners: Array<(snapshot: any) => void> = []
const flujosSnapshotListeners: Array<(snapshot: any) => void> = []

function notifyEtapasListeners() {
    const snapshot = createSnapshotForPath("etapas")
    etapasSnapshotListeners.forEach((cb) => {
        try { cb(snapshot) } catch (e) { console.error("Error en listener etapas:", e) }
    })
}

function notifyFlujosListeners() {
    const snapshot = createSnapshotForPath("flujos")
    flujosSnapshotListeners.forEach((cb) => {
        try { cb(snapshot) } catch (e) { console.error("Error en listener flujos:", e) }
    })
}

function scheduleNotifyPedidos() {
    if (pedidosNotifyTimeout != null) clearTimeout(pedidosNotifyTimeout)
    pedidosNotifyTimeout = setTimeout(() => {
        pedidosNotifyTimeout = null
        notifyPedidosListeners()
    }, 0)
}

function createSnapshotForPath(pathKey: string) {
    const currentData = (mockDatabase as any)[pathKey] || []
    return {
        docs: currentData.map((item: any) => {
            try {
                const safeItem = item && typeof item === "object" ? item : {}
                return {
                    id: safeItem.id || "unknown",
                    data: () => safeItem,
                }
            } catch (error) {
                console.error("Error al procesar item en snapshot:", error, item)
                return { id: "error", data: () => ({}) }
            }
        }),
        forEach: (fn: any) => {
            try {
                currentData.forEach((item: any) => {
                    try {
                        const safeItem = item && typeof item === "object" ? item : {}
                        fn({ id: safeItem.id || "unknown", data: () => safeItem })
                    } catch (error) {
                        console.error("Error en forEach del snapshot:", error, item)
                    }
                })
            } catch (error) {
                console.error("Error en forEach del snapshot:", error)
            }
        },
    }
}

export const mockFirestore = {
    collection: (path: string) => ({
        add: async (data: any) => {
            let id = data.id || "mock_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
            const newItem = { ...data, id }
            if (!newItem.createdAt) {
                newItem.createdAt = new Date()
            }

            if (path.includes("pedidos")) {
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
                    scheduleNotifyPedidos()
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
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                mockDatabase.flujos.push(newItem)
                notifyFlujosListeners()
            } else if (path.includes("inventarios")) {
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                if (!mockDatabase.inventarios.find((inv: any) => inv.id === id)) {
                    mockDatabase.inventarios.push(newItem)
                }
            } else if (path.includes("etapas")) {
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                const existe = mockDatabase.etapas.find((e: any) => e.id === newItem.id)
                if (!existe) {
                    mockDatabase.etapas.push(newItem)
                } else {
                    const index = mockDatabase.etapas.findIndex((e: any) => e.id === newItem.id)
                    if (index >= 0) {
                        mockDatabase.etapas[index] = newItem
                    }
                }
                notifyEtapasListeners()
            } else if (path.includes("productos")) {
                if (data.id) {
                    newItem.id = data.id
                    id = data.id
                }
                mockDatabase.productos.push(newItem)
            }

            return { id }
        },
        onSnapshot: (callback: any) => {
            let pathKey = ""
            if (path.includes("pedidos")) pathKey = "pedidos"
            else if (path.includes("inventarioPrendas")) pathKey = "inventarioPrendas"
            else if (path.includes("inventarioProductos")) pathKey = "inventarioProductos"
            else if (path.includes("categoriasProductos")) pathKey = "categoriasProductos"
            else if (path.includes("movimientosInventarioGlobal")) pathKey = "movimientosInventarioGlobal"
            else if (path.includes("userProfiles")) pathKey = "userProfiles"
            else if (path.includes("users")) pathKey = "users"
            else if (path.includes("clientes")) pathKey = "clientes"
            else if (path.includes("leads")) pathKey = "leads"
            else if (path.includes("flujos")) pathKey = "flujos"
            else if (path.includes("etapas")) pathKey = "etapas"
            else if (path.includes("inventarios")) pathKey = "inventarios"
            else if (path.includes("productos")) pathKey = "productos"

            const createSnapshot = () => createSnapshotForPath(pathKey)

            if (pathKey === "pedidos") {
                pedidosSnapshotListeners.push(callback)
            } else if (pathKey === "etapas") {
                etapasSnapshotListeners.push(callback)
            } else if (pathKey === "flujos") {
                flujosSnapshotListeners.push(callback)
            }

            try {
                callback(createSnapshot())
            } catch (error) {
                console.error("Error en callback inicial de onSnapshot:", error)
            }

            const intervalId = setInterval(() => {
                try {
                    callback(createSnapshot())
                } catch (error) {
                    console.error("Error en callback periódico de onSnapshot:", error)
                }
            }, 500)

            return () => {
                clearInterval(intervalId)
                if (pathKey === "pedidos") {
                    const i = pedidosSnapshotListeners.indexOf(callback)
                    if (i >= 0) pedidosSnapshotListeners.splice(i, 1)
                } else if (pathKey === "etapas") {
                    const i = etapasSnapshotListeners.indexOf(callback)
                    if (i >= 0) etapasSnapshotListeners.splice(i, 1)
                } else if (pathKey === "flujos") {
                    const i = flujosSnapshotListeners.indexOf(callback)
                    if (i >= 0) flujosSnapshotListeners.splice(i, 1)
                }
            }
        },
    }),
    doc: (path: string, id: string) => ({
        set: async (data: any) => {
            const newItem = { id, ...data, updatedAt: new Date() }
            let collectionName = ""
            if (path.includes("inventarioPrendas")) collectionName = "inventarioPrendas"
            else if (path.includes("inventarioProductos")) collectionName = "inventarioProductos"
            else if (path.includes("movimientosInventarioGlobal")) collectionName = "movimientosInventarioGlobal"
            else if (path.includes("userProfiles")) collectionName = "userProfiles"
            else if (path.includes("users")) collectionName = "users"
            else if (path.includes("clientes")) collectionName = "clientes"

            if (collectionName) {
                const collection = (mockDatabase as any)[collectionName]
                const index = collection.findIndex((item: any) => item.id === id)
                if (index >= 0) {
                    collection[index] = { ...collection[index], ...newItem }
                } else {
                    collection.push(newItem)
                }
            }
        },
        update: async (data: any) => {
            let collectionName = ""
            if (path.includes("pedidos")) collectionName = "pedidos"
            else if (path.includes("inventarioPrendas")) collectionName = "inventarioPrendas"
            else if (path.includes("userProfiles")) collectionName = "userProfiles"
            else if (path.includes("users")) collectionName = "users"
            else if (path.includes("clientes")) collectionName = "clientes"
            else if (path.includes("leads")) collectionName = "leads"
            else if (path.includes("flujos")) collectionName = "flujos"
            else if (path.includes("etapas")) collectionName = "etapas"
            else if (path.includes("inventarios")) collectionName = "inventarios"
            else if (path.includes("productos")) collectionName = "productos"

            if (collectionName) {
                const collection = (mockDatabase as any)[collectionName]
                const index = collectionName === "pedidos"
                    ? collection.findIndex((item: any) => matchPedidoId(item, id))
                    : collection.findIndex((item: any) => item.id === id)
                if (index >= 0) {
                    const currentItem = collection[index]
                    const updatedItem = { ...currentItem, ...data, updatedAt: new Date() }

                    Object.keys(data).forEach((key) => {
                        if (data[key] && typeof data[key] === "object" && data[key]._increment !== undefined) {
                            updatedItem[key] = (currentItem[key] || 0) + data[key]._increment
                        }
                    })

                    collection[index] = updatedItem
                    if (collectionName === "pedidos") notifyPedidosListeners()
                    if (collectionName === "etapas") notifyEtapasListeners()
                    if (collectionName === "flujos") notifyFlujosListeners()
                }
            }
        },
        delete: async () => {
            let collectionName = ""
            if (path.includes("pedidos")) collectionName = "pedidos"
            else if (path.includes("inventarioPrendas")) collectionName = "inventarioPrendas"
            else if (path.includes("userProfiles")) collectionName = "userProfiles"
            else if (path.includes("users")) collectionName = "users"
            else if (path.includes("clientes")) collectionName = "clientes"
            else if (path.includes("leads")) collectionName = "leads"
            else if (path.includes("flujos")) collectionName = "flujos"
            else if (path.includes("etapas")) collectionName = "etapas"
            else if (path.includes("inventarios")) collectionName = "inventarios"
            else if (path.includes("productos")) collectionName = "productos"

            if (collectionName) {
                if (collectionName === "users" && id === "user-admin-123") return
                const pred = collectionName === "pedidos"
                    ? (item: any) => !matchPedidoId(item, id)
                    : (item: any) => item.id !== id;
                (mockDatabase as any)[collectionName] = (mockDatabase as any)[collectionName].filter(pred);
                if (collectionName === "pedidos") notifyPedidosListeners()
                if (collectionName === "etapas") notifyEtapasListeners()
                if (collectionName === "flujos") notifyFlujosListeners()
            }
        },
        get: async () => {
            let item = null
            let collectionName = ""
            if (path.includes("inventarioPrendas")) collectionName = "inventarioPrendas"
            else if (path.includes("counters")) {
                item = mockDatabase.counters[id]
            } else if (path.includes("userProfiles")) collectionName = "userProfiles"
            else if (path.includes("users")) collectionName = "users"
            else if (path.includes("clientes")) collectionName = "clientes"
            else if (path.includes("leads")) collectionName = "leads"

            if (collectionName) {
                item = (mockDatabase as any)[collectionName].find((i: any) => i.id === id)
            }

            return {
                exists: () => !!item,
                data: () => item,
            }
        },
    }),
}

// =================================================================
// FUNCIONES AUXILIARES PARA COLUMNAS DINÁMICAS
// =================================================================

/**
 * Obtiene el valor de un campo en un pedido, soportando campos anidados (ej: "diseño.estado")
 */
export function obtenerValorCampo(pedido: any, campo: string) {
    if (!campo || !pedido) return null

    const partes = campo.split(".")
    let valor = pedido

    for (const parte of partes) {
        // Soporte para arrays (ej: "productos.0.producto")
        const matchArray = parte.match(/^(\w+)\[(\d+)\]$/)
        if (matchArray) {
            const [, nombreArray, indice] = matchArray
            valor = valor?.[nombreArray]?.[parseInt(indice)]
        } else {
            valor = valor?.[parte]
        }

        if (valor === undefined || valor === null) return null
    }

    return valor
}

/**
 * Evalúa una fórmula simple con referencias a campos del pedido
 * Soporta: +, -, *, /, (), operadores básicos
 * Ejemplo: "{montoTotal} * 1.18"
 */
export function evaluarFormula(formula: string, pedido: any) {
    if (!formula || !pedido) return null

    try {
        // Reemplazar referencias a campos con sus valores
        let formulaEvaluable = formula.replace(/\{([^}]+)\}/g, (match, campo) => {
            const valor = obtenerValorCampo(pedido, campo)
            if (valor === null || valor === undefined) return "0"
            if (typeof valor === "number") return valor.toString()
            if (valor instanceof Date) return valor.getTime().toString()
            return "0"
        })

        // Evaluar la fórmula (solo operaciones matemáticas básicas)
        // Nota: En producción, usar una librería más segura para evaluar fórmulas
        const resultado = Function(`"use strict"; return (${formulaEvaluable})`)()
        return isNaN(resultado) ? null : resultado
    } catch (error) {
        console.error("Error evaluando fórmula:", error, "Fórmula:", formula)
        return null
    }
}

/**
 * Formateador manual estricto para garantizar comas en miles.
 * Usa Regex para evitar problemas de compatibilidad de locale.
 * Ejemplo: 1234.56 -> "1,234.56"
 */
export const formatMoney = (amount: any) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "0.00"
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Formatea un valor según el tipo y formato especificado
 */
export function formatearValor(valor: any, tipo: string, formato: string | null) {
    if (valor === null || valor === undefined) return "-"

    switch (tipo) {
        case "numero":
            if (formato === "currency") {
                return `S/ ${formatMoney(valor)}`
            } else if (formato === "percentage") {
                return `${Number(valor).toFixed(2)}%`
            } else if (formato === "decimal") {
                return formatMoney(valor)
            } else if (formato === "integer") {
                // Para enteros también usamos el separador de miles si es grande
                return Math.round(Number(valor)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            return Number(valor).toString()

        case "fecha":
            if (!valor) return "-"
            const fecha = valor instanceof Date ? valor : new Date(valor)
            if (isNaN(fecha.getTime())) return "-"

            if (formato === "date") {
                return fecha.toLocaleDateString("es-PE")
            } else if (formato === "datetime") {
                return fecha.toLocaleString("es-PE")
            } else if (formato === "time") {
                return fecha.toLocaleTimeString("es-PE")
            }
            return fecha.toLocaleDateString("es-PE")

        case "booleano":
            return valor ? "Sí" : "No"

        default:
            if (Array.isArray(valor)) {
                if (valor.length === 0) return "-"
                return valor.map((it: any, i: number) => {
                    if (it == null) return ""
                    if (typeof it === "string" || typeof it === "number") return String(it)
                    return (it.nombre ?? it.productoId ?? it.producto ?? (it.regaloId ?? it.id ?? `Item ${i + 1}`))
                }).filter(Boolean).join(", ") || "-"
            }
            if (typeof valor === "object" && valor !== null) return "-"
            return valor?.toString() || "-"
    }
}

/**
 * Obtiene el valor a mostrar para una columna en un pedido
 */
export function obtenerValorColumna(columna: any, pedido: any) {
    if (!columna || !pedido) return "-"

    let valor
    if (columna.tipo === "formula") {
        valor = evaluarFormula(columna.formula, pedido)
    } else {
        valor = obtenerValorCampo(pedido, columna.campo)
    }

    // Columna "Pedido" (productos): array de objetos → texto legible con nombres de producto
    if (columna.campo === "productos" && Array.isArray(valor) && valor.length > 0) {
        const partes = valor.map((p: any) => {
            const nombre = (p?.productoId && mockDatabase.productos?.find((pr: any) => pr.id === p.productoId)?.nombre) || p?.nombre || p?.productoId || "Producto"
            const cant = p?.cantidad ?? 1
            return cant > 1 ? `${nombre} x${cant}` : nombre
        })
        return partes.join(", ")
    }
    if (columna.campo === "regalos" && Array.isArray(valor) && valor.length > 0) {
        const partes = valor.map((r: any) => {
            const nombre = typeof r === "string" ? r : (r?.regaloId ?? r?.nombre ?? "Regalo")
            const cant = r?.cantidad ?? 1
            return cant > 1 ? `${nombre} x${cant}` : nombre
        })
        return partes.join(", ")
    }

    return formatearValor(valor, columna.tipo, columna.formato)
}

// =================================================================
// FUNCIONES DE IMPORTACIÓN DE BASE DE DATOS (lógica en mapeo-encabezados-importacion.ts)
// =================================================================
import { normalizarTexto as _normalizarTexto, mapearEncabezadosACampos as _mapearEncabezadosACampos } from "./mapeo-encabezados-importacion"
export const normalizarTexto = _normalizarTexto
export const mapearEncabezadosACampos = _mapearEncabezadosACampos

/**
 * Agrupa campos del sistema por categoría
 */
export function agruparCamposPorCategoria() {
    const categorias: any = {}
    const nombresCategorias: any = {
        basico: "Básico",
        cliente: "Cliente",
        pedido: "Pedido",
        diseño: "Diseño",
        cobranza: "Cobranza",
        preparacion: "Preparación",
        estampado: "Estampado",
        empaquetado: "Empaquetado",
        reparto: "Reparto",
        envio: "Envío",
        productos: "Productos",
        comentarios: "Comentarios",
        tiempos: "Tiempos",
    }

    mockDatabase.columnasPedidos.forEach((columna: any) => {
        const categoria = columna.categoria || "basico"
        if (!categorias[categoria]) {
            categorias[categoria] = {
                nombre: nombresCategorias[categoria] || categoria,
                campos: [],
            }
        }
        categorias[categoria].campos.push(columna)
    })

    // Ordenar campos dentro de cada categoría por orden
    Object.keys(categorias).forEach((cat) => {
        categorias[cat].campos.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
    })

    return categorias
}

/**
 * Normaliza y valida valores de estadoGeneral a los valores estándar del sistema
 */
export function normalizarEstadoGeneral(valor: any) {
    if (!valor || typeof valor !== "string") return null

    const valorNormalizado = valor.trim()

    // Valores estándar válidos
    const estadosValidos = [
        "En Diseño",
        "En Cobranza",
        "Listo para Preparar",
        "En Pausa por Stock",
        "En Estampado",
        "En Empaquetado",
        "En Reparto",
        "Finalizado",
        "Anulado"
    ]

    // Si ya es un valor válido, retornarlo
    if (estadosValidos.includes(valorNormalizado)) {
        return valorNormalizado
    }

    // Mapeo de variaciones comunes a valores estándar
    const mapeoVariaciones: any = {
        // Variaciones de "En Diseño"
        "diseño": "En Diseño",
        "en diseño": "En Diseño",
        "diseñando": "En Diseño",
        "pendiente diseño": "En Diseño",
        "pendiente": "En Diseño",

        // Variaciones de "En Cobranza"
        "cobranza": "En Cobranza",
        "en cobranza": "En Cobranza",
        "pendiente pago": "En Cobranza",
        "por cobrar": "En Cobranza",
        "pago pendiente": "En Cobranza",

        // Variaciones de "Listo para Preparar"
        "listo para preparar": "Listo para Preparar",
        "listo preparar": "Listo para Preparar",
        "preparar": "Listo para Preparar",
        "listo": "Listo para Preparar",
        "preparación": "Listo para Preparar",

        // Variaciones de "En Pausa por Stock"
        "pausa por stock": "En Pausa por Stock",
        "pausa stock": "En Pausa por Stock",
        "sin stock": "En Pausa por Stock",
        "falta stock": "En Pausa por Stock",
        "en pausa": "En Pausa por Stock",
        "pausa": "En Pausa por Stock",

        // Variaciones de "En Estampado"
        "estampado": "En Estampado",
        "en estampado": "En Estampado",
        "estampando": "En Estampado",

        // Variaciones de "En Empaquetado"
        "empaquetado": "En Empaquetado",
        "en empaquetado": "En Empaquetado",
        "empaquetando": "En Empaquetado",

        // Variaciones de "En Reparto"
        "reparto": "En Reparto",
        "en reparto": "En Reparto",
        "repartiendo": "En Reparto",
        "enviado": "En Reparto",
        "enviando": "En Reparto",

        // Variaciones de "Finalizado"
        "finalizado": "Finalizado",
        "completado": "Finalizado",
        "terminado": "Finalizado",
        "entregado": "Finalizado",
        "completo": "Finalizado",
        "final": "Finalizado",

        // Variaciones de "Anulado"
        "anulado": "Anulado",
        "cancelado": "Anulado",
        "eliminado": "Anulado"
    }

    // Buscar en el mapeo (normalizado a minúsculas sin acentos)
    const valorBusqueda = normalizarTexto(valorNormalizado)
    for (const [variacion, estadoValido] of Object.entries(mapeoVariaciones)) {
        if (normalizarTexto(variacion) === valorBusqueda) {
            return estadoValido
        }
    }

    // Si no se encuentra, retornar null para que se use un valor por defecto
    console.warn(`normalizarEstadoGeneral: Valor no reconocido: "${valorNormalizado}". Se usará valor por defecto.`)
    return null
}

/**
 * Parsea un monto de forma robusta detectando separadores de miles y decimales
 */
export const parseMontoRobust = (v: any) => {
    if (v === null || v === undefined || v === "") return 0

    // Si ya es un número (ej: de Excel raw:true), retornarlo directamente
    if (typeof v === "number") return isNaN(v) ? 0 : v

    let str = String(v).trim()
    if (!str) return 0

    // Si el valor viene de Excel y es 180, a veces se recibe como "180.00" o similar
    // Pero el usuario reporta que 180 se lee como 0.18.
    // Esto suele suceder si el sistema espera miles pero recibe decimales o viceversa.

    // Limpieza: solo números, puntos, comas y signo menos
    str = str.replace(/[^0-9.,-]/g, "")
    if (!str) return 0

    const hasDot = str.includes(".")
    const hasComma = str.includes(",")

    // Lógica de desambiguación basada en cultura (Perú/Latinoamérica común)
    if (hasDot && hasComma) {
        if (str.lastIndexOf(".") > str.lastIndexOf(",")) {
            // Formato USA: 1,234.56 -> 1234.56
            str = str.replace(/,/g, "")
        } else {
            // Formato ES: 1.234,56 -> 1234.56
            str = str.replace(/\./g, "").replace(/,/g, ".")
        }
    } else if (hasComma) {
        // Solo coma. Si tiene 1 o 2 decimales, es probable que sea decimal.
        if (str.match(/,\d{1,2}$/)) {
            str = str.replace(/,/g, ".")
        } else {
            // Caso miles: 1,234
            str = str.replace(/,/g, "")
        }
    } else if (hasDot) {
        // Esto suele pasar si el archivo tiene ".180" o "0.180" (separador de miles).
        if (!str.match(/\.\d{1,2}$/) && str.match(/\.\d{3}$/)) {
            str = str.replace(/\./g, "")
        }
    }

    const finalNum = parseFloat(str)
    return isNaN(finalNum) ? 0 : finalNum
}

/**
 * Parsea una fecha de forma robusta manejando formatos comunes (DD/MM/YYYY, Excel, ISO)
 */
export const parseFechaRobust = (v: any) => {
    if (!v) return null

    // Si ya es un objeto Date
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v

    // Si es un número (probablemente serial de Excel)
    if (typeof v === "number") {
        const fechaExcel = new Date((v - 25569) * 86400 * 1000)
        return isNaN(fechaExcel.getTime()) ? null : fechaExcel
    }

    const str = String(v).trim()
    if (!str) return null

    // Intentar parsear formato DD/MM/YYYY (muy común en Perú)
    const matchDMY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (matchDMY) {
        let dia = parseInt(matchDMY[1], 10)
        let mes = parseInt(matchDMY[2], 10) - 1 // JS meses son 0-11
        let año = parseInt(matchDMY[3], 10)

        if (año < 100) año += 2000 // Asumir siglo 21 para años de 2 dígitos

        const fecha = new Date(año, mes, dia)
        if (!isNaN(fecha.getTime())) return fecha
    }

    // Intentar parsear formato YYYY-MM-DD
    const matchYMD = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
    if (matchYMD) {
        const año = parseInt(matchYMD[1], 10)
        const mes = parseInt(matchYMD[2], 10) - 1
        const dia = parseInt(matchYMD[3], 10)

        const fecha = new Date(año, mes, dia)
        if (!isNaN(fecha.getTime())) return fecha
    }

    // Fallback a parser nativo (maneja ISO, formatos USA, etc.)
    const fallback = new Date(str)
    if (!isNaN(fallback.getTime())) return fallback

    return null
}

export function convertirValorSegunTipo(valor: any, tipo: string, formato: any) {
    if (valor === null || valor === undefined || valor === "") {
        if (tipo === "numero") return 0
        return null
    }

    switch (tipo) {
        case "numero":
            return parseMontoRobust(valor)
        case "fecha":
            return parseFechaRobust(valor)
        case "booleano":
            if (typeof valor === "boolean") return valor
            if (typeof valor === "string") {
                const str = valor.toLowerCase().trim()
                return str === "sí" || str === "si" || str === "yes" || str === "true" || str === "1" || str === "verdadero"
            }
            return Boolean(valor)
        case "lista":
            return String(valor)
        default:
            return String(valor)
    }
}

/**
 * Establece un valor en un objeto anidado usando una ruta (ej: "diseño.fechaEntrada" o "estadoGeneral")
 * Maneja correctamente campos directos y anidados, con validación de tipos
 */
export function establecerValorAnidado(objeto: any, ruta: string, valor: any) {
    if (!objeto || !ruta) {
        console.warn("establecerValorAnidado: objeto o ruta inválidos", { objeto, ruta, valor })
        return
    }

    const partes = ruta.split(".")
    let actual = objeto

    // Si es un campo directo (sin puntos), establecer directamente
    if (partes.length === 1) {
        // Validar que no estemos sobrescribiendo un objeto con un valor primitivo
        const campo = partes[0]
        if (actual[campo] && typeof actual[campo] === "object" && !Array.isArray(actual[campo]) && valor !== null && typeof valor !== "object") {
            console.warn(`establecerValorAnidado: Intentando sobrescribir objeto '${campo}' con valor primitivo. Valor ignorado.`, { ruta, valor, valorActual: actual[campo] })
            return
        }
        actual[campo] = valor
        return
    }

    // Para campos anidados, crear la estructura si no existe
    for (let i = 0; i < partes.length - 1; i++) {
        const parte = partes[i]

        // Si la parte actual no existe o no es un objeto, crearlo
        if (!actual[parte] || typeof actual[parte] !== "object") {
            // Validar si la siguiente parte es un número (índice de array)
            const nextPartIsNumber = !isNaN(parseInt(partes[i + 1]));

            if (nextPartIsNumber && !Array.isArray(actual[parte])) {
                actual[parte] = [];
            } else if (!actual[parte] || (typeof actual[parte] !== "object" && !Array.isArray(actual[parte]))) {
                actual[parte] = {};
            }

            // Si existe pero es un valor primitivo, no sobrescribir (excepto si estamos corrigiendo una estructura malformada)
            if (actual[parte] !== undefined && actual[parte] !== null && typeof actual[parte] !== "object") {
                console.warn(`establecerValorAnidado: No se puede crear ruta anidada '${partes.slice(0, i + 1).join(".")}' porque '${parte}' ya es un valor primitivo.`, { ruta, valor, valorActual: actual[parte] })
                return
            }
        }
        actual = actual[parte]
    }

    // Establecer el valor final
    const campoFinal = partes[partes.length - 1]
    actual[campoFinal] = valor
}

/**
 * Asegura que todas las estructuras anidadas necesarias existan en un pedido
 */
export function asegurarEstructurasAnidadas(pedido: any) {
    if (!pedido) return

    // Estructuras de etapas
    const estructurasEtapas = [
        "diseño",
        "cobranza",
        "preparacion",
        "estampado",
        "empaquetado",
        "reparto",
        "tiempos"
    ]

    estructurasEtapas.forEach(etapa => {
        if (!pedido[etapa] || typeof pedido[etapa] !== "object" || Array.isArray(pedido[etapa])) {
            pedido[etapa] = {}
        }
    })

    // Inicializar campos específicos de cada etapa si no existen
    if (!pedido.diseño.fechaEntrada) pedido.diseño.fechaEntrada = null
    if (!pedido.diseño.fechaSalida) pedido.diseño.fechaSalida = null
    if (!pedido.diseño.diseñadorAsignado) pedido.diseño.diseñadorAsignado = null
    if (!pedido.diseño.diseñadorNombre) pedido.diseño.diseñadorNombre = null
    if (!pedido.diseño.estado) pedido.diseño.estado = ""
    if (!pedido.diseño.urlImagen) pedido.diseño.urlImagen = ""

    if (!pedido.cobranza.fechaEntrada) pedido.cobranza.fechaEntrada = null
    if (!pedido.cobranza.fechaSalida) pedido.cobranza.fechaSalida = null
    if (!pedido.cobranza.estado) pedido.cobranza.estado = ""
    if (pedido.cobranza.pago1 === undefined) pedido.cobranza.pago1 = 0
    if (pedido.cobranza.pago2 === undefined) pedido.cobranza.pago2 = 0
    if (!pedido.cobranza.accion) pedido.cobranza.accion = ""

    if (!pedido.preparacion.fechaEntrada) pedido.preparacion.fechaEntrada = null
    if (!pedido.preparacion.fechaSalida) pedido.preparacion.fechaSalida = null
    if (!pedido.preparacion.operador) pedido.preparacion.operador = null
    if (!pedido.preparacion.operadorNombre) pedido.preparacion.operadorNombre = null
    if (!pedido.preparacion.estado) pedido.preparacion.estado = ""

    if (!pedido.estampado.fechaEntrada) pedido.estampado.fechaEntrada = null
    if (!pedido.estampado.fechaSalida) pedido.estampado.fechaSalida = null
    if (!pedido.estampado.operador) pedido.estampado.operador = null
    if (!pedido.estampado.operadorNombre) pedido.estampado.operadorNombre = null
    if (!pedido.estampado.estado) pedido.estampado.estado = ""

    if (!pedido.empaquetado.fechaEntrada) pedido.empaquetado.fechaEntrada = null
    if (!pedido.empaquetado.fechaSalida) pedido.empaquetado.fechaSalida = null
    if (!pedido.empaquetado.operador) pedido.empaquetado.operador = null
    if (!pedido.empaquetado.operadorNombre) pedido.empaquetado.operadorNombre = null
    if (!pedido.empaquetado.estado) pedido.empaquetado.estado = ""

    if (!pedido.reparto.fechaEntrada) pedido.reparto.fechaEntrada = null
    if (!pedido.reparto.fechaSalida) pedido.reparto.fechaSalida = null
    if (!pedido.reparto.fechaFinalizado) pedido.reparto.fechaFinalizado = null
    if (!pedido.reparto.repartidor) pedido.reparto.repartidor = null
    if (!pedido.reparto.repartidorNombre) pedido.reparto.repartidorNombre = null
    if (!pedido.reparto.estado) pedido.reparto.estado = ""

    // Asegurar arrays y campos básicos
    if (!Array.isArray(pedido.productos)) pedido.productos = []
    if (!Array.isArray(pedido.regalos)) pedido.regalos = []
    if (!Array.isArray(pedido.productosRegalo)) pedido.productosRegalo = []
    if (pedido.talla === undefined || pedido.talla === null) pedido.talla = ""
    if (!Array.isArray(pedido.comprobantesPago)) pedido.comprobantesPago = []
    if (!Array.isArray(pedido.comentarios)) pedido.comentarios = []
    if (!Array.isArray(pedido.historialModificaciones)) pedido.historialModificaciones = []
}

/**
 * Crea la estructura completa de un pedido nuevo
 */
export function crearEstructuraPedidoCompleto() {
    return {
        // Datos del Cliente
        clienteNombre: "",
        clienteApellidos: "",
        clienteContacto: "",
        clienteContactoSecundario: "",
        clienteCorreo: "",
        clienteTipoDocumento: "",
        clienteNumeroDocumento: "",
        clienteDepartamento: "",
        clienteProvincia: "",
        clienteDistritoReal: "",
        // Detalles del Pedido
        canalVenta: "",
        activador: "",
        lineaProducto: "",
        whatsappOrigen: "",
        vendedor: "",
        productos: [] as any[],
        regalos: [] as any[],
        productosRegalo: [] as any[],
        talla: "",
        esPersonalizado: false,
        // Detalles de Entrega y Envío
        usarDatosClienteParaEnvio: true,
        envioNombres: "",
        envioApellidos: "",
        envioContacto: "",
        envioContactoSecundario: "",
        envioNombreCliente: "",
        envioTipoDocumento: "",
        envioNumeroDocumento: "",
        envioDepartamento: "",
        envioProvincia: "",
        envioDistrito: "",
        envioDireccionLima: "",
        agenciaEnvio: "",
        fechaEnvio: null,
        // Detalles de Pago
        montoAdelanto: 0,
        montoTotal: 0,
        montoPendiente: 0,
        montoMostacero: 0,
        observacion: "",
        esMostacero: false,
        esPrioridad: false,
        comprobantesPago: [] as any[],
        // Comentarios
        comentarios: [] as any[],
        // Estado principal
        status: "diseño",
        estadoGeneral: "En Diseño",
        // Tracking por etapa - Diseño
        diseño: {
            fechaEntrada: null,
            fechaSalida: null,
            diseñadorAsignado: null,
            diseñadorNombre: null,
            estado: "",
            urlImagen: "",
        },
        // Tracking por etapa - Cobranza
        cobranza: {
            fechaEntrada: null,
            fechaSalida: null,
            estado: "",
            pago1: 0,
            pago2: 0,
            accion: "",
        },
        // Tracking por etapa - Preparación
        preparacion: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "",
        },
        // Tracking por etapa - Estampado
        estampado: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "",
        },
        // Tracking por etapa - Empaquetado
        empaquetado: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "",
        },
        // Tracking por etapa - Reparto
        reparto: {
            fechaEntrada: null,
            fechaSalida: null,
            fechaFinalizado: null,
            repartidor: null,
            repartidorNombre: null,
            estado: "",
        },
        // Tiempos calculados
        tiempos: {
            diseño: null,
            cobranza: null,
            preparacion: null,
            estampado: null,
            empaquetado: null,
            reparto: null,
            total: null,
        },
        // Campos adicionales
        linkWhatsapp: "",
        anadidos: "",
        // Metadatos
        createdAt: new Date(),
        updatedAt: null,
        userId: "system",
        historialModificaciones: [] as any[],
    }
}

/**
 * Valida y corrige campos críticos de un pedido importado
 */
export function validarPedidoImportado(pedido: any) {
    if (!pedido) return

    // Asegurar estructuras anidadas
    asegurarEstructurasAnidadas(pedido)

    // Normalizar y validar estadoGeneral
    // IMPORTANTE: Solo normalizar, NO sobrescribir si ya tiene un valor válido
    if (pedido.estadoGeneral) {
        const estadoNormalizado = normalizarEstadoGeneral(pedido.estadoGeneral)
        if (estadoNormalizado) {
            // Solo actualizar si se pudo normalizar (es decir, el valor era una variación reconocida)
            pedido.estadoGeneral = estadoNormalizado
        } else {
            // Si no se puede normalizar pero el valor parece válido, verificar si es uno de los estados válidos
            const estadosValidos = [
                "En Diseño", "En Cobranza", "Listo para Preparar", "En Pausa por Stock",
                "En Estampado", "En Empaquetado", "En Reparto", "Finalizado", "Anulado"
            ]

            // Si el valor ya es uno de los estados válidos (aunque no se normalizó), mantenerlo
            if (estadosValidos.includes(pedido.estadoGeneral)) {
                // Mantener el valor tal cual está
                console.log(`validarPedidoImportado: estadoGeneral "${pedido.estadoGeneral}" ya es válido, manteniéndolo.`)
            } else {
                // Solo si realmente no es válido, intentar inferir desde otros campos
                console.warn(`validarPedidoImportado: estadoGeneral inválido "${pedido.estadoGeneral}". Intentando inferir...`)

                // Inferir desde campos de etapas
                if (pedido.diseño?.estado === "TERMINADO" && !pedido.cobranza?.fechaEntrada) {
                    pedido.estadoGeneral = "En Cobranza"
                } else if (pedido.cobranza?.estado === "Pagado" && !pedido.preparacion?.fechaEntrada) {
                    pedido.estadoGeneral = "Listo para Preparar"
                } else if (pedido.preparacion?.estado === "LISTO" && !pedido.estampado?.fechaEntrada) {
                    pedido.estadoGeneral = "En Estampado"
                } else if (pedido.estampado?.estado === "LISTO" && !pedido.empaquetado?.fechaEntrada) {
                    pedido.estadoGeneral = "En Empaquetado"
                } else if (pedido.empaquetado?.estado === "LISTO" && !pedido.reparto?.fechaEntrada) {
                    pedido.estadoGeneral = "En Reparto"
                } else if (pedido.reparto?.estado === "ENTREGADO") {
                    pedido.estadoGeneral = "Finalizado"
                } else {
                    // Solo establecer por defecto si realmente no hay información
                    console.warn(`validarPedidoImportado: No se pudo inferir estadoGeneral, usando "En Diseño" por defecto.`)
                    pedido.estadoGeneral = "En Diseño"
                }
            }
        }
    } else {
        // Si no hay estadoGeneral, intentar inferir desde otros campos antes de usar el valor por defecto
        if (pedido.reparto?.estado === "ENTREGADO") {
            pedido.estadoGeneral = "Finalizado"
        } else if (pedido.empaquetado?.estado === "LISTO" && !pedido.reparto?.fechaEntrada) {
            pedido.estadoGeneral = "En Reparto"
        } else if (pedido.estampado?.estado === "LISTO" && !pedido.empaquetado?.fechaEntrada) {
            pedido.estadoGeneral = "En Empaquetado"
        } else if (pedido.preparacion?.estado === "LISTO" && !pedido.estampado?.fechaEntrada) {
            pedido.estadoGeneral = "En Estampado"
        } else if (pedido.cobranza?.estado === "Pagado" && !pedido.preparacion?.fechaEntrada) {
            pedido.estadoGeneral = "Listo para Preparar"
        } else if (pedido.diseño?.estado === "TERMINADO" && !pedido.cobranza?.fechaEntrada) {
            pedido.estadoGeneral = "En Cobranza"
        } else {
            // Solo si no hay información, usar valor por defecto
            pedido.estadoGeneral = "En Diseño"
        }
    }

    // Validar y normalizar status (debe coincidir con estadoGeneral)
    const estadosStatus: any = {
        "En Diseño": "diseño",
        "En Cobranza": "cobranza",
        "Listo para Preparar": "preparacion",
        "En Pausa por Stock": "preparacion",
        "En Estampado": "estampado",
        "En Empaquetado": "empaquetado",
        "En Reparto": "reparto",
        "Finalizado": "finalizado",
        "Anulado": "anulado"
    }
}
