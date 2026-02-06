
"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useDebounce } from "@/lib/use-debounce"
import {
    BarChart3,
    CalendarIcon,
    ChevronDown,
    ChevronUp,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileSpreadsheet,
    ListOrdered,
    MoreVertical,
    Percent,
    PlusCircle,
    Printer,
    Search,
    Settings,
    ShoppingCart,
    Trash2,
    Upload,
    Archive,
    Shirt
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/standard-forms"
import { EditableCell } from "@/components/ui/editable-cell"
import { SummaryCard } from "@/components/ui/summary-card"
import { ImportarBaseDatosModal } from "@/components/modals/importar-base-datos-modal"
import { GestionColumnasTab } from "@/components/tabs/gestion-columnas-tab"
import { ConfirmationModal } from "@/components/ui/modal"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore } from "@/lib/mock-firebase"
import {
    peruGeoData,
    salesChannels,
    productLines,
    vendedores,
    activadores,
    horarios,
    OWNER_EMAIL
} from "@/lib/constants"
import {
    calcularReporte,
    obtenerValorColumna,
    obtenerValorCampo,
    evaluarFormula,
    formatearValor,
    parseMontoRobust,
    arrayProductosATexto,
    sanitizarTextoPedido,
    handleGuardarCampo,
    getCreatedAtTime,
    getNumeroPedidoParaOrden,
} from "@/lib/business-logic"
import { formatMoneyStrict } from "@/lib/utils"
// XLSX se importará dinámicamente o se puede usar el paquete si está disponible
import * as XLSX from "xlsx"

// Función para exportar reporte a Excel
function exportarReporteExcel(reporte: any) {
    if (!reporte || reporte.datos.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    try {
        const wsData = [reporte.columnas]
        reporte.datos.forEach((fila: any) => {
            wsData.push(Object.values(fila))
        })

        if (reporte.totales && Object.keys(reporte.totales).length > 0) {
            wsData.push([])
            wsData.push(["TOTALES"])
            Object.entries(reporte.totales).forEach(([key, value]) => {
                wsData.push([key, typeof value === "number" ? (value % 1 !== 0 ? value.toFixed(2) : value) : value])
            })
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Reporte")

        const nombreArchivo = `${reporte.titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`
        XLSX.writeFile(wb, nombreArchivo)
    } catch (error: any) {
        console.error("Error al exportar a Excel:", error)
        alert("Error al exportar a Excel. Por favor, intente nuevamente.")
    }
}

// Función para imprimir
function imprimirReporte(reporte: any, tipoReporte: any) {
    if (!reporte || reporte.datos.length === 0) {
        alert("No hay datos para imprimir")
        return
    }

    const ventanaImpresion = window.open("", "_blank")
    if (!ventanaImpresion) return

    const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reporte.titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e293b; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #cbd5e1; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .totales { margin-top: 20px; font-weight: bold; }
        @media print {
          body { padding: 10px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>${reporte.titulo}</h1>
      <p>Generado el: ${new Date().toLocaleString("es-PE")}</p>
      <table>
        <thead>
          <tr>
            ${reporte.columnas.map((col: any) => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${reporte.datos.map((fila: any) => `
            <tr>
              ${Object.values(fila).map((valor: any) => `
                <td>${typeof valor === "number" ? (valor % 1 !== 0 ? valor.toFixed(2) : valor.toLocaleString()) : valor}</td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${reporte.totales && Object.keys(reporte.totales).length > 0 ? `
        <div class="totales">
          <h3>Totales</h3>
          ${Object.entries(reporte.totales).map(([key, value]: [string, any]) => `
            <p>${key}: ${typeof value === "number" ? (value % 1 !== 0 ? value.toFixed(2) : value.toLocaleString()) : value}</p>
          `).join("")}
        </div>
      ` : ""}
    </body>
    </html>
  `
    ventanaImpresion.document.write(contenido)
    ventanaImpresion.document.close()
    ventanaImpresion.focus()
    setTimeout(() => {
        ventanaImpresion.print()
    }, 250)
}

function PedidosTabComponent() {
    const { isMasterAdmin, isOwner, currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState("hoja-maestra")
    const [columnas, setColumnas] = useState<any[]>([])
    const [pedidos, setPedidos] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<any>(null)
    const [searchInput, setSearchInput] = useState("")
    const searchTerm = useDebounce(searchInput, 300)
    const [filters, setFilters] = useState({
        fechaDesde: "",
        fechaHasta: "",
        canal: "",
        lineaProducto: "",
        whatsappOrigen: "",
        vendedor: "",
        activador: "",
        producto: "",
        horario: "",
        departamento: "",
        provincia: "",
        distrito: "",
    })
    const [showFilters, setShowFilters] = useState(false)
    const [showTotalsDetail, setShowTotalsDetail] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, pedidoId: null })
    const [showImportModal, setShowImportModal] = useState(false)
    const [showReportes, setShowReportes] = useState(false)
    const [tipoReporte, setTipoReporte] = useState("top-productos")
    const [filtrosReporte, setFiltrosReporte] = useState({
        fechaDesde: "",
        fechaHasta: "",
    })
    // Orden: más reciente primero o más antiguo primero
    const [ordenPedidos, setOrdenPedidos] = useState<"reciente" | "antiguo">("reciente")

    // Paginación para mejorar rendimiento
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Límite en memoria para evitar OOM al avanzar páginas
    const MAX_PEDIDOS_EN_MEMORIA = 12000
    const [pedidosTruncadosTotal, setPedidosTruncadosTotal] = useState(0)

    // Resetear página cuando cambian los filtros o el orden
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchTerm, ordenPedidos])

    // Cargar columnas dinámicas
    useEffect(() => {
        const columnasOrdenadas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)
        setColumnas(columnasOrdenadas)
    }, [])

    useEffect(() => {
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot((snapshot: any) => {
            const pedidosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
            pedidosData.sort((a: any, b: any) => {
                const tb = getCreatedAtTime(b)
                const ta = getCreatedAtTime(a)
                if (tb !== ta) return tb - ta
                return getNumeroPedidoParaOrden(b) - getNumeroPedidoParaOrden(a)
            })
            if (pedidosData.length > MAX_PEDIDOS_EN_MEMORIA) {
                setPedidos(pedidosData.slice(0, MAX_PEDIDOS_EN_MEMORIA))
                setPedidosTruncadosTotal(pedidosData.length)
            } else {
                setPedidos(pedidosData)
                setPedidosTruncadosTotal(0)
            }
        })
        return () => unsubscribe()
    }, [])

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target
        setFilters((prev: any) => {
            const newFilters = { ...prev, [name]: value }
            if (name === "departamento") {
                newFilters.provincia = ""
                newFilters.distrito = ""
            }
            if (name === "provincia") {
                newFilters.distrito = ""
            }
            return newFilters
        })
    }

    const provinciasOptions = useMemo(() => {
        if (!filters.departamento) return []
        const dept = peruGeoData.find((d: any) => d.departamento === filters.departamento)
        return dept ? dept.provincias.map((p: any) => ({ value: p.provincia, label: p.provincia })) : []
    }, [filters.departamento])

    const distritosOptions = useMemo(() => {
        if (!filters.departamento || !filters.provincia) return []
        const dept = peruGeoData.find((d: any) => d.departamento === filters.departamento)
        if (!dept) return []
        const prov = dept.provincias.find((p: any) => p.provincia === filters.provincia)
        return prov ? prov.distritos.map((d: any) => ({ value: d, label: d })) : []
    }, [filters.departamento, filters.provincia])

    const handleSetFiltersToToday = () => {
        const today = new Date().toISOString().split("T")[0]
        setFilters((prev: any) => ({
            ...prev,
            fechaDesde: today,
            fechaHasta: today,
        }))
    }

    const handleSetFiltersToMonth = () => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        setFilters((prev: any) => ({
            ...prev,
            fechaDesde: firstDay,
            fechaHasta: lastDay,
        }))
    }

    const handleSetFiltersToYear = () => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
        setFilters((prev: any) => ({
            ...prev,
            fechaDesde: firstDay,
            fechaHasta: lastDay,
        }))
    }

    const isTodayFilterActive = useMemo(() => {
        const today = new Date().toISOString().split("T")[0]
        return filters.fechaDesde === today && filters.fechaHasta === today
    }, [filters.fechaDesde, filters.fechaHasta])

    const isMonthFilterActive = useMemo(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        return filters.fechaDesde === firstDay && filters.fechaHasta === lastDay
    }, [filters.fechaDesde, filters.fechaHasta])

    const isYearFilterActive = useMemo(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
        return filters.fechaDesde === firstDay && filters.fechaHasta === lastDay
    }, [filters.fechaDesde, filters.fechaHasta])

    // Un solo useMemo: filtrar y ordenar en el mismo array (orden in-place) para no duplicar memoria y poder recorrer todas las páginas
    const filteredAndSortedPedidos = useMemo(() => {
        if (!pedidos || !Array.isArray(pedidos)) return []
        const filtered = pedidos.filter((p: any) => {
            if (!p) return false
            const createdAtRaw = p.createdAt
            let fechaPedido = ""
            if (createdAtRaw) {
                if (createdAtRaw instanceof Date) {
                    fechaPedido = createdAtRaw.toISOString().split("T")[0]
                } else if (typeof createdAtRaw === "string") {
                    if (createdAtRaw.match(/^\d{4}-\d{2}-\d{2}/)) {
                        fechaPedido = createdAtRaw.split("T")[0]
                    } else {
                        const dmyMatch = createdAtRaw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
                        if (dmyMatch) {
                            const [_, day, month, year] = dmyMatch
                            fechaPedido = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                        }
                    }
                } else if (typeof createdAtRaw === "object" && (createdAtRaw.seconds || createdAtRaw._seconds)) {
                    const seconds = createdAtRaw.seconds || createdAtRaw._seconds
                    fechaPedido = new Date(seconds * 1000).toISOString().split("T")[0]
                }
            }
            const matchFechaDesde = filters.fechaDesde && fechaPedido ? fechaPedido >= filters.fechaDesde : true
            const matchFechaHasta = filters.fechaHasta && fechaPedido ? fechaPedido <= filters.fechaHasta : true
            const matchCanal = filters.canal ? p.canalVenta === filters.canal : true
            const matchLinea = filters.lineaProducto ? p.lineaProducto === filters.lineaProducto : true
            const matchWhatsapp = filters.whatsappOrigen ? p.whatsappOrigen === filters.whatsappOrigen : true
            const matchVendedor = filters.vendedor ? p.vendedor === filters.vendedor : true
            const matchActivador = filters.activador ? p.activador === filters.activador : true
            const matchProducto = filters.producto
                ? p.productos && p.productos.some((prod: any) => prod.productoId === filters.producto)
                : true
            const matchHorario = filters.horario
                ? (() => {
                    if (!p.createdAt) return true
                    const hora = new Date(p.createdAt).getHours()
                    switch (filters.horario) {
                        case "Mañana (06:00 - 12:00)": return hora >= 6 && hora < 12
                        case "Tarde (12:00 - 18:00)": return hora >= 12 && hora < 18
                        case "Noche (18:00 - 24:00)": return hora >= 18 && hora < 24
                        case "Madrugada (00:00 - 06:00)": return hora >= 0 && hora < 6
                        case "Todo el día": return true
                        default: return true
                    }
                })()
                : true
            const matchDepartamento = filters.departamento ? p.departamento === filters.departamento : true
            const matchProvincia = filters.provincia ? p.provincia === filters.provincia : true
            const matchDistrito = filters.distrito ? p.distrito === filters.distrito : true
            const searchTermLower = searchTerm.toLowerCase()
            const matchSearch = searchTerm
                ? p.clienteNombre?.toLowerCase().includes(searchTermLower) ||
                p.clienteContacto?.includes(searchTerm) ||
                p.numeroPedido?.toLowerCase().includes(searchTermLower) ||
                p.id?.toLowerCase().includes(searchTermLower)
                : true
            return matchFechaDesde && matchFechaHasta && matchCanal && matchLinea && matchWhatsapp &&
                matchVendedor && matchActivador && matchProducto && matchHorario &&
                matchDepartamento && matchProvincia && matchDistrito && matchSearch
        })
        filtered.sort((a: any, b: any) => {
            const ta = getCreatedAtTime(a)
            const tb = getCreatedAtTime(b)
            if (tb !== ta) return ordenPedidos === "reciente" ? tb - ta : ta - tb
            const na = getNumeroPedidoParaOrden(a)
            const nb = getNumeroPedidoParaOrden(b)
            return ordenPedidos === "reciente" ? nb - na : na - nb
        })
        return filtered
    }, [pedidos, filters, searchTerm, ordenPedidos])

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredAndSortedPedidos.length / itemsPerPage)), [filteredAndSortedPedidos.length, itemsPerPage])

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages)
    }, [totalPages, currentPage])

    const startIndex = useMemo(() => (Math.min(currentPage, totalPages) - 1) * itemsPerPage, [currentPage, totalPages, itemsPerPage])
    const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage])
    const pedidosPaginados = useMemo(() => {
        if (!filteredAndSortedPedidos.length) return []
        return filteredAndSortedPedidos.slice(startIndex, endIndex)
    }, [filteredAndSortedPedidos, startIndex, endIndex])

    const totals = useMemo(() => {
        const relevantPedidos = filteredAndSortedPedidos
        return {
            totalPedidos: {
                value: relevantPedidos.length,
                icon: <ListOrdered className="w-6 h-6 mx-auto mb-1 text-slate-600" />,
                color: "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md",
                textColor: "text-slate-700",
            },
            totalVendido: {
                value: relevantPedidos.reduce((sum: any, p: any) => sum + (parseMontoRobust(p.montoTotal)), 0),
                icon: <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-600" />,
                color: "bg-white border border-emerald-200",
                textColor: "text-emerald-700",
            },
            totalAdelanto: {
                value: relevantPedidos.reduce((sum: any, p: any) => sum + (parseMontoRobust(p.montoAdelanto)), 0),
                icon: <Percent className="w-6 h-6 mx-auto mb-1 text-amber-600" />,
                color: "bg-white border border-amber-200",
                textColor: "text-amber-700",
            },
            totalPendiente: {
                value: relevantPedidos.reduce((sum: any, p: any) => {
                    const total = parseMontoRobust(p.montoTotal)
                    const adelanto = parseMontoRobust(p.montoAdelanto)
                    const pagos = (parseMontoRobust(p.cobranza?.pago1)) + (parseMontoRobust(p.cobranza?.pago2))
                    const pendiente = p.montoPendiente !== undefined ? parseMontoRobust(p.montoPendiente) : (total - adelanto - pagos)
                    return sum + (pendiente || 0)
                }, 0),
                icon: <CreditCard className="w-6 h-6 mx-auto mb-1 text-red-600" />,
                color: "bg-white border border-red-200",
                textColor: "text-red-700",
            },
            totalPrendas: {
                value: relevantPedidos.reduce((sum: any, pedido: any) => {
                    let count = 0
                    if (pedido.productos && Array.isArray(pedido.productos) && pedido.productos.length > 0) {
                        count = pedido.productos.reduce((subSum: any, productoEnPedido: any) => {
                            const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                            let prendasPorUnidadDeProducto = 0
                            if (productoBase) {
                                if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                                    prendasPorUnidadDeProducto = productoBase.componentes.reduce((count: any, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
                                        0,
                                    )
                                } else if (productoBase.tipo === "simple") {
                                    prendasPorUnidadDeProducto = 1
                                }
                            }
                            return subSum + (parseMontoRobust(productoEnPedido.cantidad) || 0) * prendasPorUnidadDeProducto
                        }, 0)
                    } else {
                        // Fallback al campo raíz 'cantidad'
                        count = parseMontoRobust(pedido.cantidad) || 0
                    }
                    return sum + count
                }, 0),
                icon: <Shirt className="w-6 h-6 mx-auto mb-1 text-slate-600" />,
                color: "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md",
                textColor: "text-slate-700",
            },
            totalProductos: {
                value: relevantPedidos.reduce((sum: any, p: any) => {
                    if (p.productos && Array.isArray(p.productos) && p.productos.length > 0) {
                        return sum + p.productos.reduce((s: any, item: any) => s + (parseMontoRobust(item.cantidad) || 0), 0)
                    }
                    return sum + (parseMontoRobust(p.cantidad) || 0)
                },
                    0,
                ),
                icon: <Archive className="w-6 h-6 mx-auto mb-1 text-slate-600" />,
                color: "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md",
                textColor: "text-slate-700",
            },
        }
    }, [filteredAndSortedPedidos])

    const totalsByLinea = useMemo(() => {
        const lineasMap: any = {}

        filteredAndSortedPedidos.forEach((pedido: any) => {
            const linea = pedido.lineaProducto || "Sin línea"
            if (!lineasMap[linea]) {
                lineasMap[linea] = {
                    linea: linea,
                    pedidos: 0,
                    vendido: 0,
                    adelanto: 0,
                    pendiente: 0,
                    prendas: 0,
                    productos: 0,
                }
            }

            lineasMap[linea].pedidos += 1
            lineasMap[linea].vendido += parseMontoRobust(pedido.montoTotal)
            lineasMap[linea].adelanto += parseMontoRobust(pedido.montoAdelanto)
            const total = parseMontoRobust(pedido.montoTotal)
            const adelanto = parseMontoRobust(pedido.montoAdelanto)
            const pagos = (parseMontoRobust(pedido.cobranza?.pago1)) + (parseMontoRobust(pedido.cobranza?.pago2))
            const pendiente = pedido.montoPendiente !== undefined ? parseMontoRobust(pedido.montoPendiente) : (total - adelanto - pagos)
            lineasMap[linea].pendiente += pendiente || 0

            pedido.productos?.forEach((productoEnPedido: any) => {
                const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                let prendasPorUnidadDeProducto = 0
                if (productoBase) {
                    if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                        prendasPorUnidadDeProducto = productoBase.componentes.reduce((count: any, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
                            0,
                        )
                    } else if (productoBase.tipo === "simple") {
                        prendasPorUnidadDeProducto = 1
                    }
                }
                lineasMap[linea].prendas += (parseMontoRobust(productoEnPedido.cantidad) || 0) * prendasPorUnidadDeProducto
                lineasMap[linea].productos += parseMontoRobust(productoEnPedido.cantidad) || 0
            })
            if (!pedido.productos || pedido.productos.length === 0) {
                lineasMap[linea].prendas += parseMontoRobust(pedido.cantidad) || 0
                lineasMap[linea].productos += parseMontoRobust(pedido.cantidad) || 0
            }
        })

        return Object.values(lineasMap).sort((a: any, b: any) => a.linea.localeCompare(b.linea))
    }, [filteredAndSortedPedidos])

    const totalsByVendedor = useMemo(() => {
        const vendedoresMap: any = {}

        filteredAndSortedPedidos.forEach((pedido: any) => {
            const vendedor = pedido.vendedor || "Sin vendedor"
            if (!vendedoresMap[vendedor]) {
                vendedoresMap[vendedor] = {
                    vendedor: vendedor,
                    pedidos: 0,
                    vendido: 0,
                    adelanto: 0,
                    pendiente: 0,
                    prendas: 0,
                    productos: 0,
                }
            }

            vendedoresMap[vendedor].pedidos += 1
            vendedoresMap[vendedor].vendido += parseMontoRobust(pedido.montoTotal)
            vendedoresMap[vendedor].adelanto += parseMontoRobust(pedido.montoAdelanto)
            const total = parseMontoRobust(pedido.montoTotal)
            const adelanto = parseMontoRobust(pedido.montoAdelanto)
            const pagos = (parseMontoRobust(pedido.cobranza?.pago1)) + (parseMontoRobust(pedido.cobranza?.pago2))
            const pendiente = pedido.montoPendiente !== undefined ? parseMontoRobust(pedido.montoPendiente) : (total - adelanto - pagos)
            vendedoresMap[vendedor].pendiente += pendiente || 0

            pedido.productos?.forEach((productoEnPedido: any) => {
                const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                let prendasPorUnidadDeProducto = 0
                if (productoBase) {
                    if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                        prendasPorUnidadDeProducto = productoBase.componentes.reduce((count: any, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
                            0,
                        )
                    } else if (productoBase.tipo === "simple") {
                        prendasPorUnidadDeProducto = 1
                    }
                }
                vendedoresMap[vendedor].prendas += (parseMontoRobust(productoEnPedido.cantidad) || 0) * prendasPorUnidadDeProducto
                vendedoresMap[vendedor].productos += parseMontoRobust(productoEnPedido.cantidad) || 0
            })
            if (!pedido.productos || pedido.productos.length === 0) {
                vendedoresMap[vendedor].prendas += parseMontoRobust(pedido.cantidad) || 0
                vendedoresMap[vendedor].productos += parseMontoRobust(pedido.cantidad) || 0
            }
        })

        return Object.values(vendedoresMap).sort((a: any, b: any) => a.vendedor.localeCompare(b.vendedor))
    }, [filteredAndSortedPedidos])

    const handleDeletePedido = async (pedidoId: any) => {
        if (!isMasterAdmin()) {
            alert("Solo el administrador principal puede eliminar pedidos de la hoja maestra.")
            return
        }
        setConfirmDelete({ isOpen: true, pedidoId })
    }

    const confirmPedidoDeletion = async () => {
        if (confirmDelete.pedidoId) {
            try {
                // @ts-ignore - delete method exists but TypeScript doesn't recognize it
                await mockFirestore.doc("pedidos", confirmDelete.pedidoId).delete()
                console.log("Pedido eliminado con éxito")
            } catch (error: any) {
                console.error("Error al eliminar pedido: ", error)
                alert("Error al eliminar el pedido: " + error.message)
            }
        }
        setConfirmDelete({ isOpen: false, pedidoId: null })
    }

    const handleDeleteAllPedidos = async () => {
        if (!isMasterAdmin()) {
            alert("Solo el administrador principal puede eliminar pedidos de la hoja maestra.")
            return
        }

        if (window.confirm("PELIGRO: ¿Estás seguro de que deseas ELIMINAR TODOS los pedidos? Esta acción no se puede deshacer.")) {
            if (window.confirm("Confirmación final: Esto borrará permanentemente toda la base de datos de pedidos. ¿Proceder?")) {
                try {
                    // Borrar datos directamente del mock
                    mockDatabase.pedidos = []
                    alert("Todos los pedidos han sido eliminados.")
                    window.location.reload()
                } catch (error: any) {
                    console.error("Error al eliminar todos los pedidos: ", error)
                    alert("Error al eliminar: " + error.message)
                }
            }
        }
    }

    // Columnas visibles ordenadas
    const columnasVisibles = useMemo(() => {
        if (!columnas || !Array.isArray(columnas)) return []
        return columnas.filter((c: any) => c && c.visible).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
    }, [columnas])

    const handleColumnasChange = () => {
        const columnasOrdenadas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)
        setColumnas(columnasOrdenadas)
    }

    const handleMostrarTodasColumnas = () => {
        mockDatabase.columnasPedidos.forEach((c: any) => { c.visible = true })
        const columnasOrdenadas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)
        setColumnas(columnasOrdenadas)
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Hoja Maestra de Pedidos</h2>
                    <p className="text-sm text-slate-600 mt-1 font-medium">Registro completo de todos los pedidos del sistema</p>
                </div>
                <div className="flex gap-2">
                    {isOwner() && (
                        <>
                            <Button onClick={() => handleDeleteAllPedidos()} variant="danger" className="mr-2">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Borrar Todo
                            </Button>
                            <Button onClick={() => setShowImportModal(true)} variant="secondary">
                                <Upload className="w-5 h-5 mr-2" />
                                Importar Base de Datos
                            </Button>
                        </>
                    )}
                    {isMasterAdmin() && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleMostrarTodasColumnas}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Mostrar todas las columnas
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowReportes(!showReportes)}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Reportes
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Pestañas */}
            <div className="mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="glass-box">
                        <TabsTrigger value="hoja-maestra">Hoja Maestra</TabsTrigger>
                        {isOwner() && <TabsTrigger value="gestionar-columnas">Gestionar Columnas</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="hoja-maestra" className="mt-6">
                        {activeTab === "hoja-maestra" && (
                            <>
                                {pedidosTruncadosTotal > 0 && (
                                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                                        Para evitar cierre por memoria se muestran los <strong>{MAX_PEDIDOS_EN_MEMORIA.toLocaleString()}</strong> pedidos más recientes de <strong>{pedidosTruncadosTotal.toLocaleString()}</strong>. Usa filtros (fecha, canal, búsqueda) para reducir la lista.
                                    </div>
                                )}
                                {/* Filtros */}
                                <div className="glass-box rounded-xl mb-6 overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-slate-200">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleSetFiltersToToday}
                                                    className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 ${isTodayFilterActive
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                                        }`}
                                                >
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>HOY</span>
                                                </button>
                                                <button
                                                    onClick={handleSetFiltersToMonth}
                                                    className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 ${isMonthFilterActive
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                                        }`}
                                                >
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>MES</span>
                                                </button>
                                                <button
                                                    onClick={handleSetFiltersToYear}
                                                    className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 ${isYearFilterActive
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                                        }`}
                                                >
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>AÑO</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="date"
                                                    name="fechaDesde"
                                                    value={filters.fechaDesde}
                                                    onChange={handleFilterChange}
                                                    className="w-36 h-9"
                                                />
                                                <span className="text-slate-400 text-sm font-medium">-</span>
                                                <Input
                                                    type="date"
                                                    name="fechaHasta"
                                                    value={filters.fechaHasta}
                                                    onChange={handleFilterChange}
                                                    className="w-36 h-9"
                                                />
                                            </div>

                                            <div className="relative min-w-[180px] max-w-xs">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Search className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <Input
                                                    type="text"
                                                    name="searchTerm"
                                                    value={searchInput}
                                                    onChange={(e: any) => setSearchInput(e.target.value)}
                                                    placeholder="Buscar por DNI, celular o ID pedido..."
                                                    className="pl-10"
                                                />
                                            </div>

                                            <select
                                                value={ordenPedidos}
                                                onChange={(e: any) => setOrdenPedidos(e.target.value as "reciente" | "antiguo")}
                                                className="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                            >
                                                <option value="reciente">Más recientes primero</option>
                                                <option value="antiguo">Más antiguos primero</option>
                                            </select>

                                            <button
                                                onClick={(e: any) => {
                                                    e.stopPropagation()
                                                    setShowFilters(!showFilters)
                                                }}
                                                className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg transition-all duration-200 whitespace-nowrap border ${showFilters
                                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                                                    }`}
                                            >
                                                <div className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium hidden sm:inline">
                                                    {showFilters ? "Ocultar" : "Filtros"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {showFilters && (
                                        <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Canal de Venta</label>
                                                    <Select
                                                        name="canal"
                                                        value={filters.canal}
                                                        onValueChange={(val: any) => setFilters(prev => ({ ...prev, canal: val }))}
                                                    >
                                                        <option value="">Todos los canales</option>
                                                        {salesChannels.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Línea de Producto</label>
                                                    <Select
                                                        name="lineaProducto"
                                                        value={filters.lineaProducto}
                                                        onValueChange={(val: any) => setFilters(prev => ({ ...prev, lineaProducto: val }))}
                                                    >
                                                        <option value="">Todas las líneas</option>
                                                        {Object.keys(productLines).map((k: any) => <option key={k} value={k}>{k}</option>)}
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Vendedor/a</label>
                                                    <Select
                                                        name="vendedor"
                                                        value={filters.vendedor}
                                                        onValueChange={(val: any) => setFilters(prev => ({ ...prev, vendedor: val }))}
                                                    >
                                                        <option value="">Todos los vendedores</option>
                                                        {(Array.isArray(mockDatabase.configuracion?.vendedores) ? mockDatabase.configuracion.vendedores : vendedores).map((v: any) => <option key={v} value={v}>{v}</option>)}
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Activador</label>
                                                    <Select
                                                        name="activador"
                                                        value={filters.activador}
                                                        onValueChange={(val: any) => setFilters(prev => ({ ...prev, activador: val }))}
                                                    >
                                                        <option value="">Todos los activadores</option>
                                                        {activadores.map((a: any) => <option key={a} value={a}>{a}</option>)}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Totales */}
                                <div className="glass-box rounded-xl mb-6 overflow-hidden">
                                    <button
                                        onClick={() => setShowTotalsDetail(!showTotalsDetail)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors duration-200"
                                    >
                                        <h3 className="text-lg font-semibold text-slate-800">Resumen de Totales</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {Object.entries(totals).map(([key, data]: [string, any]) => (
                                                    <div key={key} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {["totalVendido", "totalAdelanto", "totalPendiente"].includes(key)
                                                                ? `S/ ${formatMoneyStrict(data.value)}`
                                                                : data.value.toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={`transition-transform duration-200 ${showTotalsDetail ? "rotate-180" : ""}`}>
                                                <ChevronDown className="w-5 h-5 text-slate-600" />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Tarjetas de totales: solo visibles al expandir Resumen de Totales */}
                                    {showTotalsDetail && (
                                    <div className="px-4 pb-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {Object.entries(totals).map(([key, data]: [string, any]) => (
                                                <SummaryCard
                                                    key={key}
                                                    title={key.replace(/([A-Z])/g, " $1").replace("total ", "").trim()}
                                                    value={["totalVendido", "totalAdelanto", "totalPendiente"].includes(key) ? `S/ ${formatMoneyStrict(data.value)}` : data.value.toLocaleString()}
                                                    icon={data.icon}
                                                    className={data.color}
                                                    textColor={data.textColor}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    )}

                                    {showTotalsDetail && (
                                        <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-6">
                                            <div>
                                                <h4 className="text-md font-semibold text-slate-800 mb-3">Desglose por Línea de Producto</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Línea de Producto</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Pedidos</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Vendido</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Adelanto</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Pendiente</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Prendas</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Productos</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            {totalsByLinea.length > 0 ? (
                                                                totalsByLinea.map((linea: any, index: any) => (
                                                                    <tr key={index} className="hover:bg-slate-50">
                                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{linea.linea}</td>
                                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{linea.pedidos.toLocaleString()}</td>
                                                                        <td className="px-4 py-3 text-sm text-center text-emerald-700 font-semibold">
                                                                            S/ {formatMoneyStrict(linea.vendido)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-center text-amber-700 font-semibold">
                                                                            S/ {formatMoneyStrict(linea.adelanto)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-center text-red-700 font-semibold">
                                                                            S/ {formatMoneyStrict(linea.pendiente)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{linea.prendas.toLocaleString()}</td>
                                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{linea.productos.toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                                                        No hay datos para mostrar
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tabla de Pedidos */}
                                <div className="glass-box p-6 rounded-2xl overflow-x-auto">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6">Todos los Pedidos</h3>
                                    <table className="min-w-full divide-y divide-indigo-100">
                                        <thead className="bg-slate-50 border-b border-indigo-100">
                                            <tr>
                                                {columnasVisibles.map((columna: any) => (
                                                    <th
                                                        key={columna.id}
                                                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                                    >
                                                        {columna.nombre}
                                                    </th>
                                                ))}
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {pedidosPaginados.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={columnasVisibles.length + 1}
                                                        className="px-4 py-8 text-center text-slate-500"
                                                    >
                                                        No hay pedidos que coincidan con los filtros actuales.
                                                    </td>
                                                </tr>
                                            ) : (
                                                pedidosPaginados.map((pedido: any) => {
                                                    const estaExpandido = pedidoExpandido === pedido.id
                                                    return (
                                                        <React.Fragment key={pedido.id}>
                                                            <tr
                                                                className={`hover:bg-slate-50 cursor-pointer ${estaExpandido ? "bg-blue-50" : ""}`}
                                                                onClick={() => setPedidoExpandido(estaExpandido ? null : pedido.id)}
                                                            >
                                                                {columnasVisibles.map((columna: any) => {
                                                                    const valorRaw = columna.tipo === "formula" ? evaluarFormula(columna.formula, pedido) : obtenerValorCampo(pedido, columna.campo)
                                                                    const valorFormateado = formatearValor(valorRaw, columna.tipo, columna.formato, columna.campo)
                                                                    const partesCampo = columna.campo.split(".")
                                                                    const campoFinal = partesCampo.length > 1 ? partesCampo[partesCampo.length - 1] : partesCampo[0]
                                                                    const etapa = partesCampo.length > 1 ? partesCampo[0] : null
                                                                    const esArrayProductos = (campoFinal === "productos" || campoFinal === "regalos" || campoFinal === "productosRegalo") && Array.isArray(valorRaw)
                                                                    const valorParaEditar = esArrayProductos ? arrayProductosATexto(valorRaw) : (valorRaw != null && valorRaw !== "" ? String(valorRaw) : (valorRaw === 0 || valorRaw === "0" ? "0" : ""))
                                                                    const textoPedidoLargo = esArrayProductos || campoFinal === "productos" || campoFinal === "regalos" || campoFinal === "productosRegalo"
                                                                    const valorMostrar = textoPedidoLargo && typeof valorParaEditar === "string" ? sanitizarTextoPedido(valorParaEditar) : valorParaEditar
                                                                    const valorFormateadoLimpio = textoPedidoLargo && typeof valorFormateado === "string" ? sanitizarTextoPedido(valorFormateado) : (valorFormateado ?? "")
                                                                    const valorDisplay = (valorFormateadoLimpio ?? valorFormateado ?? "-") !== "" ? (valorFormateadoLimpio ?? valorFormateado) : "-"

                                                                    return (
                                                                        <td
                                                                            key={columna.id}
                                                                            className={`px-4 py-3 text-sm text-slate-600 ${textoPedidoLargo ? "max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap align-top" : "whitespace-nowrap"}`}
                                                                            onClick={(e: any) => e.stopPropagation()}
                                                                            title={textoPedidoLargo && (valorMostrar || valorFormateadoLimpio) ? String(valorMostrar || valorFormateadoLimpio) : undefined}
                                                                        >
                                                                            {columna.editable ? (
                                                                                <EditableCell
                                                                                    value={valorMostrar ?? ""}
                                                                                    onChange={async (nuevoValor: any) => {
                                                                                        try {
                                                                                            let valorConvertido = nuevoValor
                                                                                            if (columna.tipo === "booleano") {
                                                                                                valorConvertido = nuevoValor === "Sí"
                                                                                            } else if (columna.tipo === "numero") {
                                                                                                valorConvertido = parseMontoRobust(nuevoValor) || 0
                                                                                            } else if (columna.tipo === "fecha") {
                                                                                                valorConvertido = new Date(nuevoValor)
                                                                                            }

                                                                                            await handleGuardarCampo(
                                                                                                pedido.id,
                                                                                                campoFinal,
                                                                                                valorConvertido,
                                                                                                etapa,
                                                                                                currentUser
                                                                                            )
                                                                                        } catch (error: any) {
                                                                                            console.error("Error al guardar campo:", error)
                                                                                            alert("Error al guardar el campo: " + error.message)
                                                                                        }
                                                                                    }}
                                                                                    type={columna.tipo === "lista" ? "select" : columna.tipo === "booleano" ? "select" : columna.tipo === "numero" ? "number" : columna.tipo === "fecha" ? "text" : "text"}
                                                                                    options={columna.tipo === "lista" ? columna.opciones : columna.tipo === "booleano" ? ["Sí", "No"] : undefined}
                                                                                />
                                                                            ) : (
                                                                                valorDisplay
                                                                            )}
                                                                        </td>
                                                                    )
                                                                })}
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" onClick={(e: any) => e.stopPropagation()}>
                                                                    <div className="flex gap-2 items-center">
                                                                        <button
                                                                            onClick={() => setPedidoExpandido(estaExpandido ? null : pedido.id)}
                                                                            className="text-slate-600 hover:text-blue-600"
                                                                        >
                                                                            {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                        {isMasterAdmin() && (
                                                                            <button
                                                                                onClick={() => handleDeletePedido(pedido.id)}
                                                                                className="text-red-500 hover:text-red-700"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {estaExpandido && (
                                                                <tr>
                                                                    <td colSpan={columnasVisibles.length + 1} className="px-4 py-6 bg-blue-50/50">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                            {mockDatabase.columnasPedidos.map((col: any) => {
                                                                                const v = obtenerValorColumna(col, pedido)
                                                                                const displayValue = v === "-" || v === null || v === undefined || v === "" ? "-" : v
                                                                                return (
                                                                                    <div key={col.id} className="bg-white p-3 rounded border border-slate-200">
                                                                                        <span className="block text-xs font-semibold text-slate-500 uppercase">{col.nombre}</span>
                                                                                        <span className="text-sm text-slate-900">{displayValue}</span>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {filteredAndSortedPedidos.length > itemsPerPage && (
                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-white p-4 rounded-lg border border-slate-200">
                                        <span className="text-sm text-slate-600">
                                            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPedidos.length)} de {filteredAndSortedPedidos.length}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                                            <span className="text-sm text-slate-600 px-1">Página {currentPage} de {totalPages}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-slate-500 whitespace-nowrap">Ir a</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={totalPages}
                                                    className="w-14 h-8 px-2 text-center text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    value={currentPage}
                                                    onChange={(e: any) => {
                                                        const v = parseInt(e.target.value, 10)
                                                        if (!Number.isNaN(v)) setCurrentPage(Math.max(1, Math.min(totalPages, v)))
                                                    }}
                                                />
                                                <span className="text-xs text-slate-500">/ {totalPages}</span>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                    {isOwner() && (
                        <TabsContent value="gestionar-columnas" className="mt-6">
                            {activeTab === "gestionar-columnas" && <GestionColumnasTab onColumnasChange={handleColumnasChange} />}
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, pedidoId: null })}
                onConfirm={confirmPedidoDeletion}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer."
            />

            <ImportarBaseDatosModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </div>
    )
}
export const PedidosTab = React.memo(PedidosTabComponent)
