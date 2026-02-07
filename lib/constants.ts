


// Email del dueño (configurable)
export const OWNER_EMAIL = "admin@sistema.com"

export const SPECIAL_PERMISSIONS = [
    "configuracion",
    "reportes",
    "exportar-datos",
    "ver-historial-completo",
    "gestionar-usuarios",
    "gestionar-roles",
]

// Datos de ejemplo
export const peruGeoData = [
    {
        departamento: "Amazonas",
        provincias: [{ provincia: "Chachapoyas", distritos: ["Chachapoyas", "Asunción", "Balsas"] }],
    },
    { departamento: "Áncash", provincias: [{ provincia: "Huaraz", distritos: ["Huaraz", "Cochabamba", "Colcabamba"] }] },
    { departamento: "Apurímac", provincias: [{ provincia: "Abancay", distritos: ["Abancay", "Chacoche", "Circa"] }] },
    { departamento: "Arequipa", provincias: [{ provincia: "Arequipa", distritos: ["Arequipa", "Cayma", "Yanahuara"] }] },
    {
        departamento: "Ayacucho",
        provincias: [{ provincia: "Huamanga", distritos: ["Ayacucho", "Acocro", "Acos Vinchos"] }],
    },
    {
        departamento: "Cajamarca",
        provincias: [{ provincia: "Cajamarca", distritos: ["Cajamarca", "Asunción", "Chetilla"] }],
    },
    {
        departamento: "Callao",
        provincias: [
            {
                provincia: "Prov. Const. del Callao",
                distritos: ["Callao", "Bellavista", "Carmen de La Legua", "La Perla", "La Punta", "Ventanilla"],
            },
        ],
    },
    { departamento: "Cusco", provincias: [{ provincia: "Cusco", distritos: ["Cusco", "Ccorca", "Poroy"] }] },
    {
        departamento: "Huancavelica",
        provincias: [{ provincia: "Huancavelica", distritos: ["Huancavelica", "Acobambilla", "Acoria"] }],
    },
    { departamento: "Huánuco", provincias: [{ provincia: "Huánuco", distritos: ["Huánuco", "Amarilis", "Chinchao"] }] },
    { departamento: "Ica", provincias: [{ provincia: "Ica", distritos: ["Ica", "La Tinguiña", "Los Aquijes"] }] },
    {
        departamento: "Junín",
        provincias: [{ provincia: "Huancayo", distritos: ["Huancayo", "Carhuacallanga", "Chacapampa"] }],
    },
    {
        departamento: "La Libertad",
        provincias: [{ provincia: "Trujillo", distritos: ["Trujillo", "El Porvenir", "Florencia de Mora"] }],
    },
    {
        departamento: "Lambayeque",
        provincias: [{ provincia: "Chiclayo", distritos: ["Chiclayo", "Cayaltí", "Chongoyape"] }],
    },
    {
        departamento: "Lima",
        provincias: [
            {
                provincia: "Lima",
                distritos: [
                    "Lima",
                    "Ancón",
                    "Ate",
                    "Barranco",
                    "Breña",
                    "Carabayllo",
                    "Chaclacayo",
                    "Chorrillos",
                    "Cieneguilla",
                    "Comas",
                    "El Agustino",
                    "Independencia",
                    "Jesús María",
                    "La Molina",
                    "La Victoria",
                    "Lince",
                    "Los Olivos",
                    "Lurigancho",
                    "Lurín",
                    "Magdalena del Mar",
                    "Miraflores",
                    "Pachacámac",
                    "Pucusana",
                    "Pueblo Libre",
                    "Puente Piedra",
                    "Punta Hermosa",
                    "Punta Negra",
                    "Rímac",
                    "San Bartolo",
                    "San Borja",
                    "San Isidro",
                    "San Juan de Lurigancho",
                    "San Juan de Miraflores",
                    "San Luis",
                    "San Martín de Porres",
                    "San Miguel",
                    "Santa Anita",
                    "Santa María del Mar",
                    "Santa Rosa",
                    "Santiago de Surco",
                    "Surquillo",
                    "Villa El Salvador",
                    "Villa María del Triunfo",
                ],
            },
            { provincia: "Barranca", distritos: ["Barranca", "Paramonga", "Pativilca"] },
            { provincia: "Cajatambo", distritos: ["Cajatambo", "Copa", "Gorgor"] },
        ],
    },
    { departamento: "Loreto", provincias: [{ provincia: "Maynas", distritos: ["Iquitos", "Alto Nanay", "Belén"] }] },
    {
        departamento: "Madre de Dios",
        provincias: [{ provincia: "Tambopata", distritos: ["Tambopata", "Inambari", "Las Piedras"] }],
    },
    {
        departamento: "Moquegua",
        provincias: [{ provincia: "Mariscal Nieto", distritos: ["Moquegua", "Carumas", "Cuchumbaya"] }],
    },
    { departamento: "Pasco", provincias: [{ provincia: "Pasco", distritos: ["Chaupimarca", "Huachón", "Huariaca"] }] },
    { departamento: "Piura", provincias: [{ provincia: "Piura", distritos: ["Piura", "Castilla", "Catacaos"] }] },
    { departamento: "Puno", provincias: [{ provincia: "Puno", distritos: ["Puno", "Acora", "Amantaní"] }] },
    {
        departamento: "San Martín",
        provincias: [{ provincia: "Moyobamba", distritos: ["Moyobamba", "Calzada", "Habana"] }],
    },
    { departamento: "Tacna", provincias: [{ provincia: "Tacna", distritos: ["Tacna", "Alto de la Alianza", "Calana"] }] },
    { departamento: "Tumbes", provincias: [{ provincia: "Tumbes", distritos: ["Tumbes", "Corrales", "La Cruz"] }] },
    {
        departamento: "Ucayali",
        provincias: [{ provincia: "Coronel Portillo", distritos: ["Callería", "Campoverde", "Iparía"] }],
    },
]
export const productOptions = [
    {
        id: "prod001",
        name: "BOX 2 POLERAS + REGALOS",
        type: "box",
        items: [{ type: "Polera", count: 2, name: "Polera" }],
        hasIndividualCustomization: true,
        price: 150,
    },
    {
        id: "prod002",
        name: "BOX CASACA + POLO + TAZA",
        type: "box",
        items: [
            { type: "Casaca", count: 1, name: "Casaca" },
            { type: "Polo", count: 1, name: "Polo" },
        ],
        hasIndividualCustomization: true,
        price: 180,
    },
    {
        id: "prod003",
        name: "BOX 2 POLOS + REGALOS",
        type: "box",
        items: [{ type: "Polo", count: 2, name: "Polo" }],
        hasIndividualCustomization: true,
        price: 100,
    },
    {
        id: "prod004",
        name: "BOX CASACA + JOGGER + POLO + REGALO",
        type: "box",
        items: [
            { type: "Casaca", count: 1, name: "Casaca" },
            { type: "Jogger", count: 1, name: "Jogger" },
            { type: "Polo", count: 1, name: "Polo" },
        ],
        hasIndividualCustomization: true,
        price: 220,
    },
    {
        id: "prod005",
        name: "BOX CROP + JOGGER + REGALO",
        type: "box",
        items: [
            { type: "Crop Top", count: 1, name: "Crop Top" },
            { type: "Jogger", count: 1, name: "Jogger" },
        ],
        hasIndividualCustomization: true,
        price: 130,
    },
    {
        id: "prod006",
        name: "BOX CHAQUETA + POLO + ROMPECABEZAS",
        type: "box",
        items: [
            { type: "Chaqueta", count: 1, name: "Chaqueta" },
            { type: "Polo", count: 1, name: "Polo" },
        ],
        hasIndividualCustomization: true,
        price: 160,
    },
    { id: "prod007", type: "garment", name: "Polera", price: 80 },
    { id: "prod008", type: "garment", name: "Casaca", price: 100 },
    { id: "prod009", type: "garment", name: "Polo", price: 50 },
    { id: "prod010", type: "garment", name: "Jogger", price: 70 },
    { id: "prod011", type: "garment", name: "Chaqueta", price: 90 },
    {
        id: "prod012",
        name: "BOX CELESTIAL",
        type: "box",
        items: [{ type: "Polera", count: 1, name: "Polera Celestial" }],
        hasIndividualCustomization: true,
        price: 155,
    },
    {
        id: "prod013",
        name: "BOX ÁNGELES",
        type: "box",
        items: [{ type: "Polo", count: 1, name: "Polo Ángeles" }],
        hasIndividualCustomization: true,
        price: 105,
    },
]
export const garmentDetails = {
    Polera: { colors: ["Negro", "Blanco", "Gris", "Azul Marino", "Rojo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    Casaca: { colors: ["Negro", "Azul Jean", "Verde Militar"], sizes: ["S", "M", "L", "XL"] },
    Polo: { colors: ["Blanco", "Negro", "Rojo", "Azul", "Verde"], sizes: ["S", "M", "L", "XL", "XXL"] },
    Jogger: { colors: ["Negro", "Gris Oscuro", "Plomo"], sizes: ["S", "M", "L", "XL"] },
    Chaqueta: { colors: ["Negro", "Beige", "Marrón"], sizes: ["S", "M", "L", "XL"] },
    "Crop Top": { colors: ["Blanco", "Negro", "Rosado", "Amarillo Pastel"], sizes: ["XS", "S", "M", "L"] },
}
export const salesChannels = [
    "Pub Facebook",
    "Pub Instagram",
    "Pub Tiktok",
    "Org Facebook",
    "Org Instagram",
    "Org Tiktok",
    "Tienda Virtual",
    "Re-Compra",
    "Recomendado",
    "Pub Google",
    "Pub Youtube",
    "Live Mañana",
    "Live Noche",
    "Otros",
]
export const productLines: Record<string, string[]> = {
    PAREJAS: ["PAR 0", "PAR 4", "PAR 6"],
    "CASACAS DE EQUIPOS": ["C.E. 01", "C.E. 02"],
    "CASACAS GEEKS": ["C.G. 01", "C.G. 02"],
    PIJAMAS: ["PJ 01", "PJ 02"],
    "POR MAYOR": ["P.M. 01", "P.M. 02"],
}
export const shippingAgencies = [
    "Shalom",
    "Olva Courier",
    "Cavassa",
    "Movil Bus",
    "Crucero Express",
    "Marvisur",
    "Sifuentes",
    "Chavín Express",
    "Vía SAC",
    "San Antonio de Padua",
    "La Perla del Altomayo",
    "Transmar",
    "Don Gollo",
    "Cueva",
    "Armonía",
    "Aquiles",
    "León de Huánuco",
    "GH Express",
    "Cruz del Sur",
    "Cruz del Norte",
    "Apocalipsis",
]
export const disenadores = ["Mercedes", "Abraham", "Huguito"]
export const operariosDefault = ["OperadorPE1", "OperadorPE2", "Raúl", "Henry", "OperadorEmp1", "OperadorEmp2"]
export const repartidores = ["RepartidorA", "RepartidorB", "Motorizado1"]
export const tiposDocumento = ["DNI", "RUC", "Pasaporte", "Carnet de Extranjería"]
export const activadores = ["Activador 1", "Activador 2", "Activador 3", "Otros"]
export const vendedores = ["Vendedor 1", "Vendedor 2", "Vendedor 3", "Vendedor 4"]
export const horarios = ["Mañana (06:00 - 12:00)", "Tarde (12:00 - 18:00)", "Noche (18:00 - 24:00)", "Madrugada (00:00 - 06:00)", "Todo el día"]
export const regalosList = ["Taza", "Llavero", "Sticker", "Tote Bag", "Gorra", "Otro Regalo"]

// Datos para Inventario de Prendas
export const initialTiposDePrendaInventario = [
    "Polera",
    "Casaca",
    "Jogger",
    "Polo",
    "Cuello R",
    "Crop",
    "Bomber",
    "Polera Temática",
    "Pijama Temática",
    "Pantalón P",
]
export const initialColoresInventario = [
    "Negro",
    "Blanco",
    "Melange 3%",
    "Melange 10%",
    "Rata Oscuro",
    "Verde Fosforecente",
    "Verde Perico",
    "Verde Botella",
    "Verde Militar",
    "Acero Pal",
    "Azul Marino",
    "Azulino",
    "Azul Cielo",
    "Bijou Blue",
    "Menta bb",
    "Celeste",
    "Morado",
    "Lila bb",
    "Rosado bb",
    "Rosado Fuerte",
    "Palo Rosa",
    "Palo Rosa Fuerte",
    "Chicle",
    "Fucsia Brillante",
    "Rojo",
    "Guinda",
    "Naranja",
    "Amarillo Brazil",
    "Amarillo Oro",
    "Mostaza",
    "Camello",
    "Kaki",
    "Beigue",
    "Perla",
    "Panda",
    "Negro/Blanco",
    "Blanco/Negro",
    "Negro/Rosado",
    "Rosado/Negro",
    "Rosado/Celeste",
    "Celeste/Rosado",
]
// Colores con hex para módulo inventario (compatible con repo conamormarket-lgtm/inventory)
export const initialColoresInventarioConHex: { name: string; hex: string }[] = [
    { name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#FFFFFF" }, { name: "Melange 3%", hex: "#E0E0E0" },
    { name: "Melange 10%", hex: "#9E9E9E" }, { name: "Rata Oscuro", hex: "#424242" }, { name: "Verde Fosforecente", hex: "#39FF14" },
    { name: "Verde Perico", hex: "#76FF03" }, { name: "Verde Botella", hex: "#1B5E20" }, { name: "Verde Militar", hex: "#556B2F" },
    { name: "Acero Pal", hex: "#B0C4DE" }, { name: "Azul Marino", hex: "#0D47A1" }, { name: "Azulino", hex: "#2962FF" },
    { name: "Azul Cielo", hex: "#4FC3F7" }, { name: "Bijou Blue", hex: "#4682B4" }, { name: "Menta bb", hex: "#B9F6CA" },
    { name: "Celeste", hex: "#81D4FA" }, { name: "Morado", hex: "#9C27B0" }, { name: "Lila bb", hex: "#E1BEE7" },
    { name: "Rosado bb", hex: "#F8BBD0" }, { name: "Rosado Fuerte", hex: "#F06292" }, { name: "Palo Rosa", hex: "#D8A1A1" },
    { name: "Palo Rosa Fuerte", hex: "#C27474" }, { name: "Chicle", hex: "#FF80AB" }, { name: "Fucsia Brillante", hex: "#D500F9" },
    { name: "Rojo", hex: "#D32F2F" }, { name: "Guinda", hex: "#880E4F" }, { name: "Naranja", hex: "#FF9800" },
    { name: "Amarillo Brazil", hex: "#FFEB3B" }, { name: "Amarillo Oro", hex: "#FFC107" }, { name: "Mostaza", hex: "#FBC02D" },
    { name: "Camello", hex: "#C19A6B" }, { name: "Kaki", hex: "#F0E68C" }, { name: "Beigue", hex: "#F5F5DC" },
    { name: "Perla", hex: "#FAFAFA" }, { name: "Panda", hex: "#E0E0E0" }, { name: "Negro/Blanco", hex: "#333333" },
    { name: "Blanco/Negro", hex: "#F5F5F5" }, { name: "Negro/Rosado", hex: "#333333" }, { name: "Rosado/Negro", hex: "#F8BBD0" },
    { name: "Rosado/Celeste", hex: "#F8BBD0" }, { name: "Celeste/Rosado", hex: "#81D4FA" },
];

export const initialTallasInventario = ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL", "XXL", "XXXL"]
export const motivosAjusteStock = [
    "Conteo Físico - Sobrante",
    "Conteo Físico - Faltante",
    "Deterioro",
    "Merma",
    "Donación",
    "Uso Interno/Muestra",
    "Devolución Proveedor",
    "Otro",
]

export const ROLES_TABS = {
    ventas: { name: "Ventas", icon: "ShoppingCart" },
    diseño: { name: "Diseño", icon: "Palette" },
    cobranza: { name: "Cobranza", icon: "DollarSign" },
    pre_estampado: { name: "Preparación", icon: "Printer" },
    estampado: { name: "Estampado", icon: "Tag" },
    empaquetado: { name: "Empaquetado", icon: "Box" },
    reparto: { name: "Reparto", icon: "Truck" },
    finalizados: { name: "Finalizados", icon: "CheckCircle2" },
}

export const CONFECCION_TABS = {
    corte: { name: "Corte", icon: "Scissors" },
    confeccion: { name: "Confección", icon: "Shirt" },
    limpieza: { name: "Limpieza", icon: "Sparkles" },
    registro: { name: "Registro", icon: "FileText" },
}

export const BASE_DATOS_TABS = {
    pedidos: "Pedidos",
    clientes: "Clientes",
    leads: "Leads",
    productos: "Productos",
}

export const INVENTARIOS_TABS = {
    prendas: { name: "Prendas", icon: "Shirt" },
    productos: { name: "Productos", icon: "PackageSearch" },
    insumos: { name: "Insumos", icon: "Wrench" },
    activos: { name: "Activos", icon: "ArchiveRestore" },
    historial: { name: "Historial Movimientos", icon: "History" },
}

export const COLOR_PALETTE = [
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#10B981" },
    { name: "Rojo", value: "#EF4444" },
    { name: "Amarillo", value: "#F59E0B" },
    { name: "Púrpura", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Cian", value: "#06B6D4" },
    { name: "Naranja", value: "#F97316" },
    { name: "Índigo", value: "#6366F1" },
    { name: "Verde Esmeralda", value: "#059669" },
    { name: "Rojo Oscuro", value: "#DC2626" },
    { name: "Amarillo Oscuro", value: "#D97706" },
    { name: "Violeta", value: "#7C3AED" },
    { name: "Fucsia", value: "#D946EF" },
    { name: "Azul Cielo", value: "#0EA5E9" },
    { name: "Ámbar", value: "#F59E0B" },
]

export const AVAILABLE_MODULES: Record<string, any> = {
    ventas: {
        name: "Ventas",
        actions: ["ver", "crear", "editar", "eliminar", "anular", "exportar", "ver-todos"],
    },
    diseño: {
        name: "Diseño",
        actions: ["ver", "asignar", "subir-archivos", "marcar-completado", "editar-notas", "ver-todos"],
    },
    cobranza: {
        name: "Cobranza",
        actions: ["ver", "validar-pago", "editar-montos", "subir-comprobantes", "marcar-validado", "ver-todos"],
    },
    inventarios: {
        name: "Inventarios",
        actions: ["ver", "agregar", "editar", "eliminar", "ajustar-stock", "ver-movimientos"],
    },
    preparacion: {
        name: "Preparación",
        actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
    },
    estampado: {
        name: "Estampado",
        actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
    },
    empaquetado: {
        name: "Empaquetado",
        actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
    },
    reparto: {
        name: "Reparto",
        actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
    },
    finalizados: {
        name: "Finalizados",
        actions: ["ver", "ver-todos"],
    },
}

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

export const AVAILABLE_ICONS = [
    "ShoppingCart", "Palette", "DollarSign", "Printer", "Tag", "Box", "Truck", "CheckCircle2",
    "Scissors", "Shirt", "Sparkles", "FileText", "User", "Settings", "Archive", "PackageSearch",
    "Wrench", "ArchiveRestore", "History", "Home", "Database", "FileSpreadsheet", "BarChart3",
    "Download", "Menu", "MoreVertical", "LogOut", "Edit", "UserPlus", "Eye", "Upload", "X",
    "FileImage", "AlertTriangle", "PlusCircle", "Save", "Search", "Trash2", "XCircle", "ImageIcon",
    "CreditCard", "Percent", "CalendarIcon", "ListOrdered", "MinusCircle", "SlidersHorizontal",
    "ChevronDown", "ChevronUp", "GripVertical", "Plus", "Pencil", "Trash", "EyeOff", "ArrowUp",
    "ArrowDown", "Move", "Video", "Megaphone", "Lightbulb", "Rocket", "Beaker", "TrendingUp",
]

export const MATRIZ_COMPOSICION: any = {}
export const MAPEO_DESGLOSE_PRODUCTOS: any = {}
