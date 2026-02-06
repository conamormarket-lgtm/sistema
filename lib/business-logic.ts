
import { MATRIZ_COMPOSICION, MAPEO_DESGLOSE_PRODUCTOS, TIPOS_CONDICIONES, ROLES_TABS, CONFECCION_TABS } from "./constants"
import { formatMoneyStrict, parseMontoRobust as parseMontoRobustUtils, parseFechaRobust as parseFechaRobustUtils } from "./utils"
import { mockDatabase, mockFirestore } from "./mock-firebase"

/** Obtiene timestamp en ms desde createdAt para ordenar (soporta Date, string, número ms/s/Excel, Firestore { seconds }). */
export function getCreatedAtTime(p: any): number {
    const raw = p?.createdAt
    if (raw == null) return 0
    if (raw instanceof Date) return isNaN(raw.getTime()) ? 0 : raw.getTime()
    if (typeof raw === "number") {
        if (isNaN(raw)) return 0
        if (raw > 1e12) return raw
        if (raw > 1e9) return raw * 1000
        const excel = new Date((raw - 25569) * 86400 * 1000)
        return isNaN(excel.getTime()) ? 0 : excel.getTime()
    }
    if (typeof raw === "string") {
        const d = parseFechaRobustUtils(raw)
        return d ? d.getTime() : 0
    }
    if (typeof raw === "object" && (raw.seconds != null || raw._seconds != null)) {
        const sec = raw.seconds ?? raw._seconds
        return Number(sec) * 1000
    }
    return 0
}

/** Número de pedido para orden secundario (más alto = más reciente). */
export function getNumeroPedidoParaOrden(p: any): number {
    const raw = p?.numeroPedido ?? p?.id
    if (raw == null) return 0
    const s = String(raw).replace(/\D/g, "")
    return s ? parseInt(s, 10) : 0
}

/**
 * Desglosa un ítem en sus componentes base según MATRIZ_COMPOSICION
 */
export function despacharItem(nombreItem: string, cantidadPrincipal: number, conteoDesglosado: any) {
    const composicion = MATRIZ_COMPOSICION[nombreItem]
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
        if (MAPEO_DESGLOSE_PRODUCTOS[nombreItem]) {
            if (!conteoDesglosado[nombreItem]) {
                conteoDesglosado[nombreItem] = 0
            }
            conteoDesglosado[nombreItem] += Number(cantidadPrincipal)
            cantidadComponentesTotal = Number(cantidadPrincipal)
        }
    }
    return cantidadComponentesTotal
}

/**
 * Valida colores en el texto de tallas
 */
export function validarColorEnTexto(textoIngresado: any) {
    if (!textoIngresado) return { valido: true }
    const textoStr = String(textoIngresado)
    if (textoStr.trim() === "") return { valido: true }

    const coloresValidos = [
        "NEGRO", "BLANCO", "ROJO", "AZUL", "VERDE", "AMARILLO", "ROSA", "MORADO",
        "NARANJA", "GRIS", "BEIGE", "CAFÉ", "MARRÓN", "DORADO", "PLATEADO",
    ]

    const items = textoStr.split("-")
    let itemsInvalidos: string[] = []

    items.forEach((item: string) => {
        const itemUpper = item.trim().toUpperCase()
        if (itemUpper.length === 0) return

        const tieneColor = coloresValidos.some((color: any) => itemUpper.includes(color))
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

/**
 * Calcula el saldo total de un pedido considerando pagos abonos
 */
export function calcularSaldoTotal(pedido: any) {
    const montoTotal = pedido.montoTotal || 0
    const adelanto = pedido.montoAdelanto || 0

    const numAbonos = mockDatabase.configuracion?.cobranzaNumAbonos || 2
    let totalPagos = 0
    for (let i = 1; i <= numAbonos; i++) {
        totalPagos += pedido.cobranza?.[`pago${i}`] || 0
    }

    return montoTotal - adelanto - totalPagos
}

/**
 * Alias para compatibilidad con código antiguo
 */
export const calcularSaldoPedido = calcularSaldoTotal

/**
 * Verifica si hay stock suficiente para un pedido
 */
export function verificarStock(pedido: any, inventarioId = 'inventarioPrendas') {
    const resultado = verificarStockConDetalle(pedido, inventarioId)
    return resultado.tieneStock
}

/**
 * Verifica stock con detalles
 */
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

    const inventario = (mockDatabase as any)[coleccionInventario] || []

    if (!inventario || inventario.length === 0) {
        return { tieneStock: false, razon: "inventario_vacio" }
    }

    let prendas: any[] = []
    if (pedido.prendas && pedido.prendas.length > 0) {
        prendas = pedido.prendas
    } else if (pedido.talla && pedido.talla.trim() !== "") {
        const partes = pedido.talla.split(' - ')
        for (const parte of partes) {
            const parteLimpia = parte.trim()
            if (!parteLimpia) continue

            const match = parteLimpia.match(/^(.+?)\s+([^(]+?)\s*\(?([^)]+)\)?$/)
            if (match) {
                prendas.push({
                    tipoPrenda: match[1].trim(),
                    color: match[2].trim(),
                    talla: (match[3] || "").trim(),
                    cantidad: 1,
                })
            } else {
                const tokens = parteLimpia.split(/\s+/)
                if (tokens.length >= 3) {
                    prendas.push({
                        tipoPrenda: tokens.slice(0, tokens.length - 2).join(' '),
                        color: tokens[tokens.length - 2],
                        talla: tokens[tokens.length - 1],
                        cantidad: 1,
                    })
                }
            }
        }
    }

    if (prendas.length === 0) return { tieneStock: false, razon: "sin_prendas" }

    for (const prenda of prendas) {
        const itemInventario = inventario.find(
            (item: any) => item.tipoPrenda?.toLowerCase() === prenda.tipoPrenda?.toLowerCase() &&
                item.color?.toLowerCase() === prenda.color?.toLowerCase() &&
                item.talla?.toLowerCase() === prenda.talla?.toLowerCase()
        )

        if (!itemInventario) return { tieneStock: false, razon: "no_encontrado" }

        const cantidadNecesaria = prenda.cantidad || 1
        if (itemInventario.cantidad < cantidadNecesaria) return { tieneStock: false, razon: "sin_stock" }
    }

    return { tieneStock: true, razon: "ok" }
}

/**
 * Reduce el stock del inventario para un pedido
 */
export function reducirStockDeInventario(pedidoId: any) {
    const pedidoIndex = mockDatabase.pedidos.findIndex((p: any) => p.id === pedidoId)
    if (pedidoIndex === -1) return { exito: false, mensaje: "Pedido no encontrado" }
    const pedido = mockDatabase.pedidos[pedidoIndex]

    // Determinar qué inventario usar (por defecto inventario de prendas)
    // Esto podría venir de configuración, por ahora hardcodeado o inferido
    const inventarioId = "inventarioPrendas"

    // Verificar stock antes de reducir
    const verificacion = verificarStockConDetalle(pedido, inventarioId)
    if (!verificacion.tieneStock) {
        return { exito: false, mensaje: `No hay stock suficiente: ${verificacion.razon}` }
    }

    // Reducir stock
    let prendas: any[] = []
    if (pedido.prendas && pedido.prendas.length > 0) {
        prendas = pedido.prendas
    } else if (pedido.talla && pedido.talla.trim() !== "") {
        // Lógica de parsing de talla (duplicada de verificarStockConDetalle, idealmente extraer)
        const partes = pedido.talla.split(' - ')
        for (const parte of partes) {
            const parteLimpia = parte.trim()
            if (!parteLimpia) continue
            const match = parteLimpia.match(/^(.+?)\s+([^(]+?)\s*\(?([^)]+)\)?$/)
            if (match) {
                prendas.push({ tipoPrenda: match[1].trim(), color: match[2].trim(), talla: (match[3] || "").trim(), cantidad: 1 })
            } else {
                const tokens = parteLimpia.split(/\s+/)
                if (tokens.length >= 3) {
                    prendas.push({ tipoPrenda: tokens.slice(0, tokens.length - 2).join(' '), color: tokens[tokens.length - 2], talla: tokens[tokens.length - 1], cantidad: 1 })
                }
            }
        }
    }

    const inventario = mockDatabase.inventarioPrendas
    const itemsActualizados: any[] = []

    for (const prenda of prendas) {
        const itemInventario = inventario.find(
            (item: any) => item.tipoPrenda?.toLowerCase() === prenda.tipoPrenda?.toLowerCase() &&
                item.color?.toLowerCase() === prenda.color?.toLowerCase() &&
                item.talla?.toLowerCase() === prenda.talla?.toLowerCase()
        )

        if (itemInventario) {
            itemInventario.cantidad -= (prenda.cantidad || 1)
            itemInventario.salidas += (prenda.cantidad || 1)
            itemsActualizados.push(itemInventario)
            // Actualizar en firestore mock
            mockFirestore.doc("inventarioPrendas", itemInventario.id).update({
                cantidad: itemInventario.cantidad,
                salidas: itemInventario.salidas
            })
        }
    }

    return { exito: true, mensaje: `Stock reducido correctamente para ${itemsActualizados.length} items.` }
}

/**
 * Evalúa una condición individual
 */
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
            return calcularSaldoTotal(pedido) <= 0
        case "hay_stock":
            return verificarStock(pedido, condicion.parametros?.inventarioId || "inventarioPrendas")
        case "no_hay_stock":
            return !verificarStock(pedido, condicion.parametros?.inventarioId || "inventarioPrendas")
        case "operador_asignado":
            const etapa = condicion.parametros?.etapaActual
            if (etapa) return !!(pedido[etapa]?.operador || pedido[etapa]?.operadorNombre)
            return ["preparacion", "estampado", "empaquetado"].some((e: any) => !!(pedido[e]?.operador || pedido[e]?.operadorNombre))
        case "repartidor_asignado":
            return !!(pedido.reparto?.repartidor || pedido.reparto?.repartidorNombre)
        case "estado_listo":
            return String(pedido[condicion.parametros?.etapaActual || "preparacion"]?.estado || "").toUpperCase() === "LISTO"
        case "estado_entregado":
            return String(pedido.reparto?.estado || "").toUpperCase() === "ENTREGADO"
        case "stock_reducido":
            return verificarStock(pedido, condicion.parametros?.inventarioId || "inventarioPrendas")
        default:
            return true
    }
}

/**
 * Evalúa un array de condiciones
 */
export function evaluarCondiciones(condiciones: any[], pedido: any) {
    if (!condiciones || condiciones.length === 0) return { cumplidas: true, condicionesFaltantes: [] }
    const faltantes: string[] = []
    for (const c of condiciones) {
        if (c.requerida && !evaluarCondicion(c, pedido)) {
            const info = TIPOS_CONDICIONES.find((t: any) => t.id === c.tipo)
            faltantes.push(info?.nombre || c.tipo)
        }
    }
    return { cumplidas: faltantes.length === 0, condicionesFaltantes: faltantes }
}

/**
 * Evalúa condiciones de entrada de una etapa
 */
export function evaluarCondicionesEntrada(etapaId: string, pedido: any) {
    const etapa = mockDatabase.etapas.find((e: any) => e.id === etapaId)
    if (!etapa || !etapa.condicionesEntrada) return { debeSaltar: false, etapaDestinoId: null }
    const salto = etapa.condicionesEntrada.find((c: any) => c.saltarAutomatico && evaluarCondicion(c, pedido))
    if (salto) return { debeSaltar: true, etapaDestinoId: salto.etapaDestinoId }
    return { debeSaltar: false, etapaDestinoId: null }
}

/**
 * Devuelve las condiciones de salida por defecto para una etapa (las mismas que aplican los tabs en "Validaciones por defecto").
 * Así el usuario las ve al editar la etapa y no hay duplicación lógica.
 */
function condicionesSalidaPorDefecto(etapaId: string, moduloPermisos: string): any[] {
    const defaults: Record<string, string[]> = {
        diseño: ["url_agregado", "tallas_agregadas"],
        preparacion: ["operador_asignado"],
        estampado: ["operador_asignado"],
        empaquetado: ["operador_asignado"],
        reparto: ["repartidor_asignado"],
    }
    const tipos = defaults[moduloPermisos]
    if (!tipos || tipos.length === 0) return []
    return tipos.map((tipo, i) => ({
        id: `condicion-${etapaId}-${tipo}-${i}`,
        tipo,
        requerida: true,
        parametros: {},
    }))
}

/**
 * Aplica condiciones de salida por defecto a etapas que aún tienen condiciones vacías (para que se muestren al editar).
 */
export function aplicarCondicionesPorDefectoEtapas() {
    if (!mockDatabase.etapas || !Array.isArray(mockDatabase.etapas)) return
    for (const etapa of mockDatabase.etapas) {
        const mod = etapa.moduloPermisos
        if (!mod) continue
        const def = condicionesSalidaPorDefecto(etapa.id, mod)
        if (def.length === 0) continue
        const actual = etapa.condicionesSalida
        if (!Array.isArray(actual) || actual.length === 0) {
            etapa.condicionesSalida = def
            if (etapa.fechaModificacion) etapa.fechaModificacion = new Date()
        }
    }
}

/**
 * Migra flujos y etapas hardcodeados a la nueva estructura
 */
export function migrateFlujosExistentes() {
    if (mockDatabase.flujos.length > 0) return

    const fecha = new Date()
    const iconMap: any = { ventas: "ShoppingCart", diseño: "Palette", cobranza: "DollarSign", pre_estampado: "Printer", estampado: "Tag", empaquetado: "Box", reparto: "Truck", finalizados: "CheckCircle2" }

    const etapasPedidos = Object.entries(ROLES_TABS).map(([key, tab], index) => {
        const id = `etapa-flujo-pedidos-${key}`
        const moduloPermisos = key === "pre_estampado" ? "preparacion" : key
        const condicionesSalida = condicionesSalidaPorDefecto(id, moduloPermisos)
        return {
            id, flujoId: "flujo-pedidos", nombre: tab.name, icono: iconMap[key] || "Box", color: "#3B82F6", orden: index,
            moduloPermisos,
            obligatoria: index === 0 || index === 7,
            tipoObligatoria: index === 0 ? "inicial" : index === 7 ? "final" : null,
            condicionesSalida, condicionesEntrada: [], fechaCreacion: fecha, fechaModificacion: fecha
        }
    })

    mockDatabase.flujos.push({
        id: "flujo-pedidos", nombre: "Flujo de Pedidos", activo: true, orden: 0, icono: "ShoppingCart", color: "#3B82F6",
        etapas: etapasPedidos.map((e: any) => e.id), fechaCreacion: fecha, fechaModificacion: fecha, creadoPor: "system"
    })
    mockDatabase.etapas.push(...etapasPedidos)
}

/**
 * Busca un ítem en el inventario
 */
export function buscarItemEnInventario(inventarioId: string, criterio: string) {
    if (!inventarioId || !criterio) return []
    let col = inventarioId
    if (col === 'inventario-prendas') col = 'inventarioPrendas'
    else if (col === 'inventario-productos') col = 'inventarioProductos'

    const items = (mockDatabase as any)[col] || []
    const clean = criterio.trim().toLowerCase()

    return items.filter((i: any) =>
        (i.codigo || i.codigoPrenda || i.codigoProducto || "").toLowerCase() === clean ||
        (i.tipoPrenda || i.tipoProducto || i.nombre || "").toLowerCase().includes(clean)
    ).map((i: any) => ({
        id: i.id,
        codigo: i.codigo || i.codigoPrenda || i.codigoProducto || "N/A",
        nombre: `${i.tipoPrenda || i.tipoProducto || i.nombre || ''} ${i.color || ''} ${i.talla || ''}`.trim(),
        costoUnitario: i.costoUnitario || i.costo || 0,
        cantidad: i.cantidad || 0
    }))
}

/**
 * Calcula el costo total de un producto
 */
export function calcularCostoProducto(producto: any) {
    if (!producto) return 0
    if (producto.tipo === 'simple') {
        const items = buscarItemEnInventario(producto.inventarioId, producto.itemInventarioId)
        return items.length > 0 ? items[0].costoUnitario : (producto.costoTotal || 0)
    }
    if (producto.tipo === 'compuesto' && producto.componentes) {
        return producto.componentes.reduce((acc: number, c: any) => {
            const items = buscarItemEnInventario(c.inventarioId, c.itemInventarioId)
            return acc + (items.length > 0 ? items[0].costoUnitario : 0) * (c.cantidad || 1)
        }, 0)
    }
    return 0
}

/**
 * Sincroniza el costo de un producto
 */
export async function sincronizarCostoProductoInventario(productoId: string, nuevoCosto: number) {
    const prod = mockDatabase.productos.find((p: any) => p.id === productoId)
    if (!prod) return
    prod.costoTotal = nuevoCosto
    prod.fechaModificacion = new Date()

    if (prod.tipo === 'simple' && prod.itemInventarioId) {
        let col = prod.inventarioId === 'inventario-prendas' ? 'inventarioPrendas' : 'inventarioProductos'
        const item = (mockDatabase as any)[col]?.find((i: any) => i.id === prod.itemInventarioId)
        if (item) {
            item.costoUnitario = nuevoCosto
            await mockFirestore.doc(col, item.id).update({ costoUnitario: nuevoCosto })
        }
    }
}

/**
 * Actualiza un campo de un pedido.
 * Búsqueda robusta por id o numeroPedido (evita fallos cuando id tiene ceros a la izquierda o es número).
 */
export async function handleGuardarCampo(pedidoId: string, campo: string, valor: any, etapa: string | null = null, user: any = null) {
    const idStr = String(pedidoId || "").trim()
    const idNum = idStr.replace(/\D/g, "") ? parseInt(idStr.replace(/\D/g, ""), 10) : NaN
    const p = mockDatabase.pedidos.find((item: any) => {
        if (item.id == null && item.numeroPedido == null) return false
        if (String(item.id) === idStr || String(item.numeroPedido || "") === idStr) return true
        const itemNum = String(item.id || item.numeroPedido || "").replace(/\D/g, "")
        if (itemNum && !isNaN(idNum) && parseInt(itemNum, 10) === idNum) return true
        return false
    })
    if (!p) return

    const docId = p.id != null ? String(p.id) : String(p.numeroPedido || "")
    if (!docId) return

    let valorGuardar = valor
    if (typeof valor === "string" && (campo === "productos" || campo === "regalos" || campo === "productosRegalo")) {
        valorGuardar = parseProductosDesdeTexto(valor)
    }

    let updates: any = {}
    if (etapa) updates[etapa] = { ...p[etapa], [campo]: valorGuardar }
    else updates[campo] = valorGuardar

    updates.updatedAt = new Date()
    updates.historialModificaciones = [...(p.historialModificaciones || []), {
        timestamp: new Date(), usuarioId: user?.uid || "system", usuarioEmail: user?.email || "system",
        accion: `Actualización de ${campo}`, detalle: `Nuevo valor: ${valor}`
    }]
    await mockFirestore.doc("pedidos", docId).update(updates)
}

/**
 * Actualiza varios campos de una etapa en una sola llamada (evita que la segunda actualización sobrescriba la primera).
 */
export async function handleGuardarCamposEtapa(pedidoId: string, etapa: string, campos: Record<string, any>, user: any = null) {
    const idStr = String(pedidoId || "").trim()
    const idNum = idStr.replace(/\D/g, "") ? parseInt(idStr.replace(/\D/g, ""), 10) : NaN
    const p = mockDatabase.pedidos.find((item: any) => {
        if (item.id == null && item.numeroPedido == null) return false
        if (String(item.id) === idStr || String(item.numeroPedido || "") === idStr) return true
        const itemNum = String(item.id || item.numeroPedido || "").replace(/\D/g, "")
        return itemNum && !isNaN(idNum) && parseInt(itemNum, 10) === idNum
    })
    if (!p || !etapa) return
    const docId = p.id != null ? String(p.id) : String(p.numeroPedido || "")
    if (!docId) return

    const updates: any = {
        [etapa]: { ...(p[etapa] || {}), ...campos },
        updatedAt: new Date(),
        historialModificaciones: [...(p.historialModificaciones || []), {
            timestamp: new Date(), usuarioId: user?.uid || "system", usuarioEmail: user?.email || "system",
            accion: `Actualización de ${Object.keys(campos).join(", ")}`, detalle: `Nuevos valores: ${JSON.stringify(campos)}`,
        }],
    }
    await mockFirestore.doc("pedidos", docId).update(updates)
}

/**
 * Alias para compatibilidad con componentes que usan updateOrderField
 */
export const updateOrderField = handleGuardarCampo

// =================================================================
// FUNCIONES DE REPORTES
// =================================================================

export function calcularReporte(tipo: string, pedidos: any[], filtros: any) {
    const filtrados = pedidos.filter((p: any) => {
        if (!p.createdAt) return false
        const f = parseFechaRobust(p.createdAt)
        if (!f) return false
        const s = f.toISOString().split("T")[0]
        return (!filtros.fechaDesde || s >= filtros.fechaDesde) && (!filtros.fechaHasta || s <= filtros.fechaHasta)
    })

    switch (tipo) {
        case "top-productos": return calcularTopProductos(filtrados)
        case "top-vendedores": return calcularTopVendedores(filtrados)
        case "top-ciudades": return calcularTopCiudades(filtrados)
        case "ticket-promedio": return calcularTicketPromedio(filtrados)
        case "prendas-promedio": return calcularPrendasPromedio(filtrados)
        case "top-linea": return calcularTopLinea(filtrados)
        case "top-trabajadores": return calcularTopTrabajadores(filtrados)
        case "top-prendas": return calcularTopPrendas(filtrados)
        case "top-regalos": return calcularTopRegalos(filtrados)
        case "top-canales": return calcularTopCanales(filtrados)
        case "top-activadores": return calcularTopActivadores(filtrados)
        case "analisis-horarios": return calcularAnalisisHorarios(filtrados)
        case "tiempo-etapas": return calcularTiempoEtapas(filtrados)
        default: return { titulo: "No encontrado", datos: [], totales: {}, columnas: [] }
    }
}

export function calcularTopProductos(pedidos: any[]) {
    const map: any = {}
    let total = 0
    pedidos.forEach((p: any) => {
        p.productos?.forEach((pr: any) => {
            const found = mockDatabase.productos.find((px: any) => px.id === pr.productoId)
            const name = found?.nombre || "N/A"
            const cant = pr.cantidad || 0
            const val = cant * (found?.precios?.[0]?.valor || 0)
            if (!map[name]) map[name] = { nombre: name, cantidad: 0, monto: 0 }
            map[name].cantidad += cant
            map[name].monto += val
            total += val
        })
    })
    const datos = Object.values(map).map((p: any) => ({ ...p, porcentaje: total > 0 ? (p.monto / total) * 100 : 0 })).sort((a: any, b: any) => b.cantidad - a.cantidad)
    return { titulo: "Top Productos", datos, totales: { totalVendido: total }, columnas: ["Producto", "Cantidad", "Monto", "%"] }
}

export function calcularTopVendedores(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        const v = p.vendedor || "N/A"
        if (!map[v]) map[v] = { vendedor: v, pedidos: 0, montoTotal: 0 }
        map[v].pedidos++
        map[v].montoTotal += (p.montoTotal || 0)
    })
    const datos = Object.values(map).map((v: any) => ({ ...v, ticketPromedio: v.pedidos > 0 ? v.montoTotal / v.pedidos : 0 })).sort((a: any, b: any) => b.montoTotal - a.montoTotal)
    return { titulo: "Top Vendedores", datos, columnas: ["Vendedor", "Pedidos", "Monto", "Promedio"] }
}

export function calcularTopCiudades(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        const c = [p.departamento, p.provincia, p.distrito].filter(Boolean).join(", ") || "N/A"
        if (!map[c]) map[c] = { ciudad: c, pedidos: 0, montoTotal: 0 }
        map[c].pedidos++
        map[c].montoTotal += (p.montoTotal || 0)
    })
    return { titulo: "Top Ciudades", datos: Object.values(map).sort((a: any, b: any) => b.montoTotal - a.montoTotal), columnas: ["Ciudad", "Pedidos", "Monto"] }
}

export function calcularTicketPromedio(pedidos: any[]) {
    const values = pedidos.map((p: any) => p.montoTotal || 0).filter((v: any) => v > 0)
    if (!values.length) return { titulo: "Ticket Promedio", datos: [], totales: {}, columnas: [] }
    const average = values.reduce((a: any, b: any) => a + b, 0) / values.length
    return { titulo: "Ticket Promedio", datos: [{ metrica: "Promedio", valor: average }], totales: { promedio: average }, columnas: ["Métrica", "Valor"] }
}

export function calcularPrendasPromedio(pedidos: any[]) {
    const prendas = pedidos.map((p: any) => (p.productos || []).reduce((acc: number, pr: any) => acc + (pr.cantidad || 0), 0))
    const avg = prendas.length ? prendas.reduce((a: any, b: any) => a + b, 0) / prendas.length : 0
    return { titulo: "Prendas Promedio", datos: [{ metrica: "Promedio", valor: avg }], totales: { promedio: avg }, columnas: ["Métrica", "Valor"] }
}

export function calcularTopLinea(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        const l = p.lineaProducto || "N/A"
        if (!map[l]) map[l] = { linea: l, pedidos: 0, montoTotal: 0 }
        map[l].pedidos++
        map[l].montoTotal += (p.montoTotal || 0)
    })
    return { titulo: "Top Líneas", datos: Object.values(map).sort((a: any, b: any) => b.montoTotal - a.montoTotal), columnas: ["Línea", "Pedidos", "Monto"] }
}

export function calcularTopTrabajadores(pedidos: any[]) {
    const map: any = {}
    const add = (name: string, stage: string) => {
        if (!name) return
        const key = `${stage}-${name}`
        if (!map[key]) map[key] = { trabajador: name, etapa: stage, pedidos: 0 }
        map[key].pedidos++
    }
    pedidos.forEach((p: any) => {
        add(p.diseño?.diseñadorNombre, "Diseño")
        add(p.preparacion?.operadorNombre, "Preparación")
        add(p.estampado?.operadorNombre, "Estampado")
        add(p.empaquetado?.operadorNombre, "Empaquetado")
        add(p.reparto?.repartidorNombre, "Reparto")
    })
    return { titulo: "Top Trabajadores", datos: Object.values(map).sort((a: any, b: any) => b.pedidos - a.pedidos), columnas: ["Trabajador", "Etapa", "Pedidos"] }
}

export function calcularTopPrendas(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        p.productos?.forEach((pr: any) => {
            const name = pr.nombre || "N/A"
            if (!map[name]) map[name] = { prenda: name, cantidad: 0 }
            map[name].cantidad += (pr.cantidad || 0)
        })
    })
    return { titulo: "Top Prendas", datos: Object.values(map).sort((a: any, b: any) => b.cantidad - a.cantidad), columnas: ["Prenda", "Cantidad"] }
}

export function calcularTopRegalos(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        p.regalos?.forEach((r: any) => {
            const name = typeof r === 'string' ? r : (r.nombre || "N/A")
            if (!map[name]) map[name] = { regalo: name, cantidad: 0 }
            map[name].cantidad += (r.cantidad || 1)
        })
    })
    return { titulo: "Top Regalos", datos: Object.values(map).sort((a: any, b: any) => b.cantidad - a.cantidad), columnas: ["Regalo", "Cantidad"] }
}

export function calcularTopCanales(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        const c = p.canalVenta || "N/A"
        if (!map[c]) map[c] = { canal: c, pedidos: 0, montoTotal: 0 }
        map[c].pedidos++
        map[c].montoTotal += (p.montoTotal || 0)
    })
    return { titulo: "Top Canales", datos: Object.values(map).sort((a: any, b: any) => b.montoTotal - a.montoTotal), columnas: ["Canal", "Pedidos", "Monto"] }
}

export function calcularTopActivadores(pedidos: any[]) {
    const map: any = {}
    pedidos.forEach((p: any) => {
        const a = p.activador || "N/A"
        if (!map[a]) map[a] = { activador: a, pedidos: 0, montoTotal: 0 }
        map[a].pedidos++
        map[a].montoTotal += (p.montoTotal || 0)
    })
    return { titulo: "Top Activadores", datos: Object.values(map).sort((a: any, b: any) => b.montoTotal - a.montoTotal), columnas: ["Activador", "Pedidos", "Monto"] }
}

export function calcularAnalisisHorarios(pedidos: any[]) {
    const slots: any = { "Madrugada": 0, "Mañana": 0, "Tarde": 0, "Noche": 0 }
    pedidos.forEach((p: any) => {
        const h = parseFechaRobust(p.createdAt)?.getHours()
        if (h === undefined) return
        if (h < 6) slots["Madrugada"]++
        else if (h < 12) slots["Mañana"]++
        else if (h < 18) slots["Tarde"]++
        else slots["Noche"]++
    })
    const datos = Object.entries(slots).map(([horario, pedidos]: [string, any]) => ({ horario, pedidos }))
    return { titulo: "Horarios", datos, columnas: ["Horario", "Pedidos"] }
}

export function calcularTiempoEtapas(pedidos: any[]) {
    // Stub simple para tiempos
    return { titulo: "Tiempos (Próximamente)", datos: [], columnas: ["Etapa", "Promedio"] }
}

// =================================================================
// FUNCIONES AUXILIARES PARA COLUMNAS DINÁMICAS
// =================================================================

/** Construye texto de tallas desde productos/detallesPrenda cuando pedido.talla está vacío */
function tallaDesdeProductos(pedido: any): string {
    if (!pedido?.productos || !Array.isArray(pedido.productos)) return ""
    const tallas: string[] = []
    for (const pr of pedido.productos) {
        if (Array.isArray(pr.detallesPrenda)) {
            for (const d of pr.detallesPrenda) {
                if (d?.talla && String(d.talla).trim()) tallas.push(String(d.talla).trim())
            }
        } else if (pr?.talla && String(pr.talla).trim()) {
            tallas.push(String(pr.talla).trim())
        }
    }
    return [...new Set(tallas)].join(", ")
}

export function obtenerValorCampo(pedido: any, campo: string) {
    if (!campo || !pedido) return null
    const partes = campo.split(".")
    let val = pedido
    for (const p of partes) {
        const m = p.match(/^(\w+)\[(\d+)\]$/)
        if (m) val = val?.[m[1]]?.[parseInt(m[2])]
        else val = val?.[p]
        if (val === undefined || val === null) return null
    }
    // Fallback para "talla": si está vacía, intentar desde productos/detallesPrenda
    if (partes.length === 1 && partes[0] === "talla") {
        const direct = val
        if (direct === undefined || direct === null || String(direct).trim() === "")
            return tallaDesdeProductos(pedido) || null
    }
    return val
}

export function evaluarFormula(formula: string, pedido: any) {
    if (!formula || !pedido) return null
    try {
        let ev = formula.replace(/\{([^}]+)\}/g, (_: any, c: any) => {
            const v = obtenerValorCampo(pedido, c)
            return (typeof v === 'number' ? v : 0).toString()
        })
        return Function(`"use strict"; return (${ev})`)()
    } catch { return null }
}

function esArrayDeProductos(arr: any[]): boolean {
    if (arr.length === 0) return false
    const first = arr[0]
    return first != null && typeof first === "object" && ("productoId" in first || "nombre" in first || "producto" in first)
}

export function formatearValor(valor: any, tipo: string, formato?: string, campo?: string) {
    if (valor === null || valor === undefined) return "-"
    if (Array.isArray(valor)) {
        if (valor.length === 0) return "-"
        if (esArrayDeProductos(valor)) return arrayProductosATexto(valor)
        return valor.length === 1 ? "1 ítem" : `${valor.length} ítems`
    }
    switch (tipo) {
        case "numero":
            if (formato === "currency") return `S/ ${formatMoneyStrict(valor)}`
            if (formato === "percentage") return `${Number(valor).toFixed(2)}%`
            return formatMoneyStrict(valor)
        case "fecha":
            const d = parseFechaRobust(valor)
            return d ? d.toLocaleDateString("es-PE") : "-"
        case "booleano": return valor ? "Sí" : "No"
        default:
            if (campo === "id") {
                const digits = String(valor).replace(/\D/g, "")
                const num = digits ? parseInt(digits, 10) : 0
                return num ? String(num) : (valor === "" || valor == null ? "-" : String(valor))
            }
            return valor === "" ? "-" : String(valor)
    }
}

export function obtenerValorColumna(columna: any, pedido: any) {
    const val = (columna.tipo === "formula") ? evaluarFormula(columna.formula, pedido) : obtenerValorCampo(pedido, columna.campo)
    return formatearValor(val, columna.tipo, columna.formato, columna.campo)
}

// =================================================================
// FUNCIONES DE IMPORTACIÓN DE BASE DE DATOS
// =================================================================

export function normalizarTexto(t: string) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").replace(/[^\w]/g, "")
}

export function agruparCamposPorCategoria() {
    const cats: any = {}
    const names: any = { basico: "Básico", cliente: "Cliente", pedido: "Pedido", diseño: "Diseño", cobranza: "Cobranza", preparacion: "Preparación", estampado: "Estampado", empaquetado: "Empaquetado", reparto: "Reparto", envio: "Envío", productos: "Productos", comentarios: "Comentarios" }
    mockDatabase.columnasPedidos.forEach((c: any) => {
        const cat = c.categoria || "basico"
        if (!cats[cat]) cats[cat] = { nombre: names[cat] || cat, campos: [] }
        cats[cat].campos.push(c)
    })
    return cats
}

// Mapeo de encabezados de importación: lógica centralizada en mapeo-encabezados-importacion.ts
export { mapearEncabezadosACampos } from "./mapeo-encabezados-importacion"

export function normalizarEstadoGeneral(v: string) {
    const norm = normalizarTexto(v)
    const map: any = {
        diseno: "En Diseño", cobranza: "En Cobranza", listo: "Listo para Preparar", stock: "En Pausa por Stock", estampado: "En Estampado", empaquetado: "En Empaquetado", reparto: "En Reparto", finalizado: "Finalizado", anulado: "Anulado"
    }
    for (const key in map) if (norm.includes(key)) return map[key]
    return null
}

// Usar parseo robusto de montos/fechas de utils (soporta 1.234,56, Excel, etc.) para guardar total/adelanto/deuda correctamente
export const parseMontoRobust = parseMontoRobustUtils
export const parseFechaRobust = parseFechaRobustUtils

export function convertirValorSegunTipo(v: any, t: string, f?: any) {
    if (t === "numero") return parseMontoRobust(v)
    if (t === "fecha") return parseFechaRobust(v)
    if (t === "booleano") {
        if (v === true || v === 1) return true
        const s = String(v).toLowerCase().trim().normalize("NFD").replace(/\u0303/g, "")
        return ["si", "sí", "yes", "1", "true", "mostacero", "verdadero"].includes(s)
    }
    return String(v || "")
}

/**
 * Parsea un texto tipo "Polera, Polo x2, Gorra" a array de items { productoId, cantidad }
 * para guardar en pedido.productos, regalos o productosRegalo.
 */
export function parseProductosDesdeTexto(str: any): any[] {
    if (str == null || str === "") return []
    if (Array.isArray(str)) return str
    const s = String(str).trim()
    if (!s) return []
    const items: any[] = []
    const partes = s.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean)
    for (const parte of partes) {
        const match = parte.match(/^(.+?)\s*x\s*(\d+)\s*$/i) || parte.match(/^(.+?)\s*(\d+)\s*$/)
        const nombre = (match ? match[1].trim() : parte).trim()
        const cantidad = match ? Math.max(1, parseInt(match[2], 10)) : 1
        if (nombre) items.push({ productoId: nombre, cantidad })
    }
    return items
}

/** Elimina tabs y normaliza espacios en texto para evitar que la columna se estire */
export function sanitizarTextoPedido(str: string): string {
    if (str == null || typeof str !== "string") return ""
    return str.replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim()
}

/**
 * Convierte array de productos/regalos a texto para mostrar o editar (sin tabs, texto limpio)
 */
export function arrayProductosATexto(arr: any): string {
    if (!Array.isArray(arr) || arr.length === 0) return ""
    return arr.flatMap((it: any) => {
        let nombre = it.productoId ?? it.nombre ?? it.producto ?? ""
        if (typeof nombre === "string") nombre = sanitizarTextoPedido(nombre)
        const cant = it.cantidad ?? 1
        if (!nombre) return []
        return Array(cant).fill(nombre)
    }).join(", ")
}

export function establecerValorAnidado(obj: any, path: string, val: any) {
    const parts = path.split(".")
    let curr = obj
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]
        const existing = curr[key]
        // Si el valor actual es primitivo (string, número) o no existe, usar objeto para poder anidar
        if (existing == null || typeof existing !== "object") {
            curr[key] = {}
        }
        curr = curr[key]
    }
    curr[parts[parts.length - 1]] = val
}

export function asegurarEstructurasAnidadas(p: any) {
    if (!p) return
    ["diseño", "cobranza", "preparacion", "estampado", "empaquetado", "reparto", "tiempos"].forEach((e: any) => {
        if (!p[e] || typeof p[e] !== 'object') p[e] = {}
    })
    if (!Array.isArray(p.productos)) p.productos = []
    if (!Array.isArray(p.regalos)) p.regalos = []
    if (!Array.isArray(p.productosRegalo)) p.productosRegalo = []
    if (p.talla === undefined || p.talla === null) p.talla = ""
    if (!Array.isArray(p.comentarios)) p.comentarios = []
}

export function crearEstructuraPedidoCompleto() {
    return {
        clienteNombre: "", clienteApellidos: "", clienteContacto: "", createdAt: new Date(),
        montoTotal: 0, montoAdelanto: 0, montoPendiente: 0, montoMostacero: 0, status: "diseño", estadoGeneral: "En Diseño",
        diseño: {}, cobranza: { pago1: 0, pago2: 0 }, preparacion: {}, estampado: {}, empaquetado: {}, reparto: {}, tiempos: {},
        productos: [], regalos: [], productosRegalo: [], talla: "", comentarios: [], historialModificaciones: []
    }
}

export function validarPedidoImportado(p: any) {
    asegurarEstructurasAnidadas(p)
    p.estadoGeneral = normalizarEstadoGeneral(p.estadoGeneral) || "En Diseño"
    p.montoTotal = parseMontoRobust(p.montoTotal)
    p.montoAdelanto = parseMontoRobust(p.montoAdelanto)
    p.montoPendiente = Math.max(0, p.montoTotal - p.montoAdelanto - (p.cobranza?.pago1 || 0) - (p.cobranza?.pago2 || 0))
    if (p.montoMostacero !== undefined) p.montoMostacero = parseMontoRobust(p.montoMostacero)
    p.createdAt = parseFechaRobust(p.createdAt) || new Date()
}

/** Asegura que un valor esté en la lista de opciones de configuración; si no está, lo agrega (para importación). */
function asegurarOpcionEnLista(configKey: string, valor: any) {
    if (valor == null || String(valor).trim() === "") return
    const str = String(valor).trim()
    const config = mockDatabase.configuracion || {}
    let list = config[configKey]
    if (!Array.isArray(list)) {
        list = []
        config[configKey] = list
    }
    if (!list.includes(str)) list.push(str)
}

export async function procesarPedidoImportado(row: any, map: any, idField: string, idVal: any) {
    let p = mockDatabase.pedidos.find((x: any) => x.id === idVal)
    const exists = !!p
    if (!p) p = crearEstructuraPedidoCompleto()

    Object.entries(map).forEach(([h, conf]: [string, any]) => {
        let val = convertirValorSegunTipo(row[h], conf.tipo)
        if (conf.campo === "productos" || conf.campo === "regalos" || conf.campo === "productosRegalo") {
            if (typeof val === "string") val = parseProductosDesdeTexto(val)
            else if (!Array.isArray(val)) val = []
        }
        establecerValorAnidado(p, conf.campo, val)
    })

    if (p.diseño?.diseñadorAsignado && !p.diseño.diseñadorNombre) {
        p.diseño.diseñadorNombre = p.diseño.diseñadorAsignado
    }

    // Si vendedor/diseñador/operador/repartidor no está en las listas de opciones, agregarlo (importación)
    asegurarOpcionEnLista("vendedores", p.vendedor)
    asegurarOpcionEnLista("disenadores", p.diseño?.diseñadorAsignado ?? p.diseño?.diseñadorNombre)
    asegurarOpcionEnLista("operarios", p.preparacion?.operador ?? p.preparacion?.operadorNombre)
    asegurarOpcionEnLista("operarios", p.estampado?.operador ?? p.estampado?.operadorNombre)
    asegurarOpcionEnLista("operarios", p.empaquetado?.operador ?? p.empaquetado?.operadorNombre)
    asegurarOpcionEnLista("repartidores", p.reparto?.repartidor ?? p.reparto?.repartidorNombre)

    validarPedidoImportado(p)
    p.importado = true
    if (exists) await mockFirestore.doc("pedidos", p.id).update(p)
    else await mockFirestore.collection("pedidos").add(p)

    return { pedido: p, fueActualizado: exists }
}

export function calcularMetricasImportacion(pedidos: any[]) {
    return { total: pedidos.length, montoTotal: pedidos.reduce((a: any, b: any) => a + (b.montoTotal || 0), 0) }
}

/** Parsea solo encabezados + primera fila y dimensiones. No carga todas las filas en memoria. */
export async function parsearArchivoSoloEncabezado(file: File): Promise<{
    headers: string[]
    sampleRow: Record<string, any>
    totalRows: number
    workbook: any
    sheet: any
}> {
    const XLSX = await import("xlsx")
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet || !sheet["!ref"]) {
        return { headers: [], sampleRow: {}, totalRows: 0, workbook: wb, sheet }
    }
    const fullRange = XLSX.utils.decode_range(sheet["!ref"])
    const totalRows = fullRange.e.r + 1
    const maxCols = fullRange.e.c + 1
    // Solo leer primeras 2 filas (encabezado + ejemplo)
    const range2 = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: Math.min(1, fullRange.e.r), c: fullRange.e.c },
    })
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", range: range2 }) as any[][]
    if (!matrix || matrix.length === 0) {
        return { headers: [], sampleRow: {}, totalRows, workbook: wb, sheet }
    }
    const headersRow = matrix[0] || []
    const headers: string[] = []
    const seen = new Set<string>()
    for (let c = 0; c < maxCols; c++) {
        const raw = headersRow[c] != null ? String(headersRow[c]).trim() : ""
        let key = raw || `Columna_${c + 1}`
        while (seen.has(key)) key = `${raw || "Columna_" + (c + 1)}_${c}`
        seen.add(key)
        headers.push(key)
    }
    const sampleRow: Record<string, any> = {}
    if (matrix.length > 1) {
        const rowArr = matrix[1] || []
        for (let c = 0; c < headers.length; c++) {
            sampleRow[headers[c]] = rowArr[c] !== undefined && rowArr[c] !== null ? rowArr[c] : ""
        }
    }
    return { headers, sampleRow, totalRows, workbook: wb, sheet }
}

/** Obtiene un bloque de filas del libro ya abierto (para no duplicar el array completo en memoria). */
export async function obtenerChunkFilasDesdeWorkbook(
    sheet: any,
    headers: string[],
    startRow: number,
    chunkSize: number,
    totalRows: number
): Promise<any[]> {
    if (!sheet || !sheet["!ref"] || headers.length === 0) return []
    const XLSX = await import("xlsx")
    const fullRange = XLSX.utils.decode_range(sheet["!ref"])
    const endRow = Math.min(startRow + chunkSize, totalRows) - 1
    if (startRow > endRow) return []
    const range = XLSX.utils.encode_range({
        s: { r: startRow, c: 0 },
        e: { r: endRow, c: fullRange.e.c },
    })
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", range }) as any[][]
    if (!matrix || matrix.length === 0) return []
    const rows: any[] = []
    for (let r = 0; r < matrix.length; r++) {
        const rowArr = matrix[r] || []
        const obj: Record<string, any> = {}
        for (let c = 0; c < headers.length; c++) {
            obj[headers[c]] = rowArr[c] !== undefined && rowArr[c] !== null ? rowArr[c] : ""
        }
        rows.push(obj)
    }
    return rows
}

export async function parsearArchivoImportacion(file: File): Promise<any> {
    const XLSX = await import("xlsx")
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    // header: 1 devuelve matriz [fila][col] para no perder columnas con encabezado vacío
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][]
    if (!matrix || matrix.length === 0) return []
    const headersRow = matrix[0] || []
    const maxCols = Math.max(
        headersRow.length,
        ...matrix.slice(1).map((row: any[]) => (row && row.length) || 0)
    )
    const headers: string[] = []
    const seen = new Set<string>()
    for (let c = 0; c < maxCols; c++) {
        const raw = headersRow[c] != null ? String(headersRow[c]).trim() : ""
        let key = raw || `Columna_${c + 1}`
        while (seen.has(key)) key = `${raw || "Columna_" + (c + 1)}_${c}`
        seen.add(key)
        headers.push(key)
    }
    const rows: any[] = []
    for (let r = 1; r < matrix.length; r++) {
        const rowArr = matrix[r] || []
        const obj: any = {}
        for (let c = 0; c < headers.length; c++) {
            obj[headers[c]] = rowArr[c] !== undefined && rowArr[c] !== null ? rowArr[c] : ""
        }
        rows.push(obj)
    }
    return rows
}

