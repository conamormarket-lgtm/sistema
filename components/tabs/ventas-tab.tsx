
import React, { useState, useEffect, useMemo } from "react"
import { useDebounce } from "../../lib/use-debounce"
import {
    CalendarIcon,
    Search,
    ChevronDown,
    ListOrdered,
    DollarSign,
    Percent,
    CreditCard,
    Shirt,
    Archive,
    PlusCircle,
    Settings,
} from "lucide-react"

import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-firebase"
import {
    peruGeoData,
    salesChannels,
    productLines,
    vendedores,
    activadores,
    horarios,
} from "../../lib/constants"
import { getCreatedAtTime, getNumeroPedidoParaOrden } from "../../lib/business-logic"
import { parseFechaRobust, parseMontoRobust, formatMoneyStrict, cuentaComoMostaceroEnResumen } from "../../lib/utils"
import { Button } from "../ui/button"
import { Select } from "../ui/input"
import { RegistrarPedidoModal } from "@/components/modals/registrar-pedido-modal"

function VentasTabComponent() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pedidoToEdit, setPedidoToEdit] = useState<any>(null)
    const [pedidos, setPedidos] = useState<any[]>([])
    const [searchInput, setSearchInput] = useState("")
    const searchTerm = useDebounce(searchInput, 300)
    const [filters, setFilters] = useState({
        fechaDesde: "", // Sin filtro por defecto para mostrar todos
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
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; pedidoId: string | null }>({ isOpen: false, pedidoId: null })

    // Orden: más reciente primero o más antiguo primero
    const [ordenPedidos, setOrdenPedidos] = useState<"reciente" | "antiguo">("reciente")

    // Paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Límite en memoria para evitar OOM
    const MAX_PEDIDOS_EN_MEMORIA = 12000
    const [pedidosTruncadosTotal, setPedidosTruncadosTotal] = useState(0)

    // Resetear página al filtrar o cambiar orden
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchTerm, ordenPedidos])

    const { hasPermission, isMasterAdmin } = useAuth()

    // Obtener configuración de días temporales
    const diasTemporales = mockDatabase.configuracion?.ventasTemporalDias || 7

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

    const handleSavePedido = async (pedidoData: any) => {
        try {
            if (pedidoData.id) {
                const { id, ...rest } = pedidoData
                await mockFirestore.doc("pedidos", id).update(rest)
                setPedidos([...mockDatabase.pedidos])
                console.log("Pedido actualizado con éxito")
            } else {
                await mockFirestore.collection("pedidos").add(pedidoData)
                setPedidos([...mockDatabase.pedidos])
                console.log("Pedido registrado con éxito")
            }
        } catch (error: any) {
            console.error("Error al registrar/actualizar pedido: ", error)
            throw error
        }
    }

    const handleDeletePedido = async (pedidoId: string) => {
        if (!hasPermission("ventas", "eliminar")) {
            alert("No tiene permisos para eliminar pedidos.")
            return
        }
        setConfirmDelete({ isOpen: true, pedidoId })
    }

    const confirmPedidoDeletion = async () => {
        if (confirmDelete.pedidoId) {
            try {
                // @ts-ignore - delete method exists but TypeScript doesn't recognize it
                await mockFirestore.doc("pedidos", confirmDelete.pedidoId).delete()
                setPedidos([...mockDatabase.pedidos])
                console.log("Pedido eliminado con éxito")
            } catch (error: any) {
                console.error("Error al eliminar pedido: ", error)
                alert("Error al eliminar el pedido: " + error.message)
            }
        }
        setConfirmDelete({ isOpen: false, pedidoId: null })
    }

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target
        setFilters((prev: any) => {
            const newFilters = { ...prev, [name]: value }
            // Si cambia el departamento, limpiar provincia y distrito
            if (name === "departamento") {
                newFilters.provincia = ""
                newFilters.distrito = ""
            }
            // Si cambia la provincia, limpiar distrito
            if (name === "provincia") {
                newFilters.distrito = ""
            }
            return newFilters
        })
    }

    // Obtener provincias según el departamento seleccionado
    const provinciasOptions = useMemo(() => {
        if (!filters.departamento) return []
        const dept = peruGeoData.find((d: any) => d.departamento === filters.departamento)
        return dept ? dept.provincias.map((p: any) => ({ value: p.provincia, label: p.provincia })) : []
    }, [filters.departamento])

    // Obtener distritos según la provincia seleccionada
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

    // Detectar si el filtro "HOY" está activo
    const isTodayFilterActive = useMemo(() => {
        const today = new Date().toISOString().split("T")[0]
        return filters.fechaDesde === today && filters.fechaHasta === today
    }, [filters.fechaDesde, filters.fechaHasta])

    // Detectar si el filtro "MES" está activo
    const isMonthFilterActive = useMemo(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        return filters.fechaDesde === firstDay && filters.fechaHasta === lastDay
    }, [filters.fechaDesde, filters.fechaHasta])

    // Detectar si el filtro "AÑO" está activo
    const isYearFilterActive = useMemo(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
        return filters.fechaDesde === firstDay && filters.fechaHasta === lastDay
    }, [filters.fechaDesde, filters.fechaHasta])

    // Un solo useMemo: filtrar y ordenar en el mismo array (in-place) para no duplicar memoria y poder recorrer todas las páginas
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
                        case "Mañana (06:00 - 12:00)":
                            return hora >= 6 && hora < 12
                        case "Tarde (12:00 - 18:00)":
                            return hora >= 12 && hora < 18
                        case "Noche (18:00 - 24:00)":
                            return hora >= 18 && hora < 24
                        case "Madrugada (00:00 - 06:00)":
                            return hora >= 0 && hora < 6
                        case "Todo el día":
                            return true
                        default:
                            return true
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
                p.id?.toLowerCase().includes(searchTermLower)
                : true

            return (
                matchFechaDesde &&
                matchFechaHasta &&
                matchCanal &&
                matchLinea &&
                matchWhatsapp &&
                matchVendedor &&
                matchActivador &&
                matchProducto &&
                matchHorario &&
                matchDepartamento &&
                matchProvincia &&
                matchDistrito &&
                matchSearch
            )
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
    const paginatedPedidos = useMemo(() => {
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
                        count = pedido.productos.reduce((subSum: number, productoEnPedido: any) => {
                            const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                            let prendasPorUnidadDeProducto = 0
                            if (productoBase) {
                                if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                                    prendasPorUnidadDeProducto = productoBase.componentes.reduce(
                                        (count: number, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
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
                        return sum + p.productos.reduce((s: number, item: any) => s + (parseMontoRobust(item.cantidad) || 0), 0)
                    }
                    return sum + (parseMontoRobust(p.cantidad) || 0)
                },
                    0,
                ),
                icon: <Archive className="w-6 h-6 mx-auto mb-1 text-slate-600" />,
                color: "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md",
                textColor: "text-slate-700",
            },
            totalMostaceros: {
                value: relevantPedidos
                    .filter((p: any) => cuentaComoMostaceroEnResumen(p))
                    .reduce((sum: any, p: any) => sum + parseMontoRobust(p.montoTotal), 0),
                icon: <DollarSign className="w-6 h-6 mx-auto mb-1 text-amber-600" />,
                color: "bg-white border border-amber-200",
                textColor: "text-amber-700",
            },
            totalMontoReal: {
                value: Math.max(
                    0,
                    relevantPedidos.reduce((sum: any, p: any) => sum + parseMontoRobust(p.montoTotal), 0) -
                        relevantPedidos
                            .filter((p: any) => cuentaComoMostaceroEnResumen(p))
                            .reduce((sum: any, p: any) => sum + parseMontoRobust(p.montoTotal), 0)
                ),
                icon: <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-600" />,
                color: "bg-white border border-emerald-200",
                textColor: "text-emerald-700",
            },
        }
    }, [filteredAndSortedPedidos])

    // Calcular totales por línea de producto
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

            // Calcular prendas
            pedido.productos?.forEach((productoEnPedido: any) => {
                const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                let prendasPorUnidadDeProducto = 0
                if (productoBase) {
                    if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                        prendasPorUnidadDeProducto = productoBase.componentes.reduce(
                            (count: number, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
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

    // Calcular totales por vendedor
    const totalsByVendedor = useMemo(() => {
        const vendedoresMap: any = {}

        filteredAndSortedPedidos.forEach((pedido: any) => {
            const vendedor = pedido.vendedor || "Sin vendedor"
            if (!vendedoresMap[vendedor]) {
                vendedoresMap[vendedor] = {
                    vendedor: vendedor,
                    pedidos: 0,
                    vendido: 0,
                    mostaceros: 0,
                    montoReal: 0,
                    adelanto: 0,
                    pendiente: 0,
                    prendas: 0,
                    productos: 0,
                }
            }

            vendedoresMap[vendedor].pedidos += 1
            const vendidoPedido = parseMontoRobust(pedido.montoTotal)
            const esMostacero = cuentaComoMostaceroEnResumen(pedido)
            vendedoresMap[vendedor].vendido += vendidoPedido
            if (esMostacero) vendedoresMap[vendedor].mostaceros += vendidoPedido
            vendedoresMap[vendedor].montoReal = vendedoresMap[vendedor].vendido - vendedoresMap[vendedor].mostaceros
            vendedoresMap[vendedor].adelanto += parseMontoRobust(pedido.montoAdelanto)
            const total = parseMontoRobust(pedido.montoTotal)
            const adelanto = parseMontoRobust(pedido.montoAdelanto)
            const pagos = (parseMontoRobust(pedido.cobranza?.pago1)) + (parseMontoRobust(pedido.cobranza?.pago2))
            const pendiente = pedido.montoPendiente !== undefined ? parseMontoRobust(pedido.montoPendiente) : (total - adelanto - pagos)
            vendedoresMap[vendedor].pendiente += pendiente || 0

            // Calcular prendas
            pedido.productos?.forEach((productoEnPedido: any) => {
                const productoBase = mockDatabase.productos.find((p: any) => p.id === productoEnPedido.productoId)
                let prendasPorUnidadDeProducto = 0
                if (productoBase) {
                    if (productoBase.tipo === "compuesto" && productoBase.componentes) {
                        prendasPorUnidadDeProducto = productoBase.componentes.reduce(
                            (count: number, componente: any) => count + (parseMontoRobust(componente.cantidad) || 0),
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

    return (
        <div className="p-6 min-h-screen text-slate-800">
            {pedidosTruncadosTotal > 0 && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    Para evitar cierre por memoria se muestran los <strong>{MAX_PEDIDOS_EN_MEMORIA.toLocaleString()}</strong> pedidos más recientes de <strong>{pedidosTruncadosTotal.toLocaleString()}</strong>. Usa filtros para reducir la lista.
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-blue-600" /> Gestión de Ventas</h2>
                    <p className="text-sm text-slate-600 mt-1 font-medium">
                        Vista temporal de pedidos recientes (últimos {diasTemporales} días). La hoja maestra está en DATOS  Pedidos.
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasPermission("ventas", "crear") && (
                        <Button onClick={() => { setPedidoToEdit(null); setIsModalOpen(true) }} iconLeft={<PlusCircle className="w-5 h-5" />}>
                            Registrar Pedido
                        </Button>
                    )}
                    {isMasterAdmin() && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const nuevoValor = prompt(`Días que se muestran en Ventas (actual: ${diasTemporales}):`, String(diasTemporales))
                                    if (nuevoValor && !isNaN(Number(nuevoValor)) && parseInt(nuevoValor) > 0) {
                                        mockDatabase.configuracion.ventasTemporalDias = parseInt(nuevoValor)
                                        alert(`Configuración actualizada. Los cambios se aplicarán al recargar la página.`)
                                    }
                                }}
                                iconLeft={<Settings className="w-5 h-5" />}
                            >
                                Configurar Días
                            </Button>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        const pedidoPrueba = {
                                            clienteNombre: "Juan",
                                            clienteApellidos: "Pérez García",
                                            clienteContacto: "987654321",
                                            clienteCorreo: "juan.perez@example.com",
                                            clienteTipoDocumento: "DNI",
                                            clienteNumeroDocumento: "12345678",
                                            clienteDepartamento: "Lima",
                                            clienteProvincia: "Lima",
                                            clienteDistritoReal: "San Isidro",
                                            canalVenta: "WhatsApp",
                                            activador: "Facebook",
                                            lineaProducto: "Poleras",
                                            whatsappOrigen: "WhatsApp Principal",
                                            vendedor: "María González",
                                            productos: [{ id: crypto.randomUUID(), productoId: "PROD001", cantidad: 2 }],
                                            regalos: [],
                                            talla: "",
                                            esPersonalizado: true,
                                            usarDatosClienteParaEnvio: true,
                                            envioNombres: "Juan",
                                            envioApellidos: "Pérez García",
                                            envioContacto: "987654321",
                                            envioNombreCliente: "Juan Pérez García",
                                            envioTipoDocumento: "DNI",
                                            envioNumeroDocumento: "12345678",
                                            envioDepartamento: "Lima",
                                            envioProvincia: "Lima",
                                            envioDistrito: "San Isidro",
                                            envioDireccionLima: "Av. Principal 123",
                                            agenciaEnvio: "Olva Courier",
                                            montoAdelanto: 50.00,
                                            montoTotal: 150.00,
                                            montoPendiente: 100.00,
                                            observacion: "Pedido de prueba - Verificar flujo completo",
                                            importado: false,
                                            esMostacero: false,
                                            esPrioridad: false,
                                            comprobantesPago: [],
                                            comentarios: [],
                                            status: "diseño",
                                            estadoGeneral: "En Diseño",
                                            diseño: {
                                                fechaEntrada: new Date(),
                                                fechaSalida: null,
                                                diseñadorAsignado: null,
                                                diseñadorNombre: null,
                                                estado: "",
                                                urlImagen: "",
                                            },
                                            cobranza: {
                                                fechaEntrada: null,
                                                fechaSalida: null,
                                                estado: "",
                                                pago1: 0,
                                                pago2: 0,
                                                accion: "",
                                            },
                                            preparacion: {
                                                fechaEntrada: null,
                                                fechaSalida: null,
                                                operador: null,
                                                operadorNombre: null,
                                                estado: "",
                                            },
                                            estampado: {
                                                fechaEntrada: null,
                                                fechaSalida: null,
                                                operador: null,
                                                operadorNombre: null,
                                                estado: "",
                                            },
                                            empaquetado: {
                                                fechaEntrada: null,
                                                fechaSalida: null,
                                                operador: null,
                                                operadorNombre: null,
                                                estado: "",
                                            },
                                            reparto: {
                                                fechaEntrada: null,
                                                fechaSalida: null,
                                                fechaFinalizado: null,
                                                repartidor: null,
                                                repartidorNombre: null,
                                                estado: "",
                                            },
                                            tiempos: {
                                                diseño: null,
                                                cobranza: null,
                                                preparacion: null,
                                                estampado: null,
                                                empaquetado: null,
                                                reparto: null,
                                                total: null,
                                            },
                                            linkWhatsapp: "",
                                            anadidos: "",
                                            createdAt: new Date(),
                                            userId: "system",
                                            historialModificaciones: [
                                                {
                                                    timestamp: new Date(),
                                                    usuarioId: "system",
                                                    usuarioEmail: "system",
                                                    accion: "Pedido Creado",
                                                    detalle: "Pedido de prueba creado automáticamente",
                                                },
                                            ],
                                        }
                                        await mockFirestore.collection("pedidos").add(pedidoPrueba)
                                        alert(" Pedido de prueba creado exitosamente.\n\nVerifica que aparezca en:\n1. DATOS  Pedidos (Hoja Maestra)\n2. FLUJOS  Flujo de Pedidos  Diseño")
                                    } catch (error: any) {
                                        console.error("Error al crear pedido de prueba:", error)
                                        alert(" Error al crear pedido de prueba: " + error.message)
                                    }
                                }}
                                iconLeft={<PlusCircle className="w-4 h-4" />}
                            >
                                Crear Pedido Prueba
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filtros: alineados a la derecha, sin caja (como en las demás etapas) */}
            <div className="flex justify-end items-center gap-2.5 flex-wrap mb-4">
                {/* Botones de filtro rápido: HOY, MES, AÑO */}
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

                {/* Filtros de fecha compactos */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        name="fechaDesde"
                        value={filters.fechaDesde}
                        onChange={handleFilterChange}
                        className="w-36 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                    <span className="text-slate-400 text-sm font-medium">-</span>
                    <input
                        type="date"
                        name="fechaHasta"
                        value={filters.fechaHasta}
                        onChange={handleFilterChange}
                        className="w-36 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                </div>

                {/* Buscador de cliente */}
                <div className="relative min-w-[180px] max-w-xs">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        name="searchTerm"
                                value={searchInput}
                                onChange={(e: any) => setSearchInput(e.target.value)}
                        placeholder="Buscar por DNI, celular o ID pedido..."
                        className="w-full h-9 pl-10 pr-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Ordenar pedidos */}
                <select
                    value={ordenPedidos}
                    onChange={(e: any) => setOrdenPedidos(e.target.value as "reciente" | "antiguo")}
                    className="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                    <option value="reciente">Más recientes primero</option>
                    <option value="antiguo">Más antiguos primero</option>
                </select>

                {/* Botón desplegar filtros avanzados */}
                <button
                    onClick={(e: any) => {
                        e.stopPropagation()
                        setShowFilters(!showFilters)
                    }}
                    className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg transition-all duration-200 whitespace-nowrap border ${showFilters
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                    title={showFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
                >
                    <div className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                        {showFilters ? "Ocultar" : "Filtros"}
                    </span>
                </button>
            </div>

            {/* Contenido de filtros avanzados (sin caja) */}
            {showFilters && (
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Select
                                label="Canal de Venta:"
                                name="canal"
                                value={filters.canal}
                                onChange={handleFilterChange}
                                options={salesChannels.map((c: any) => ({ value: c, label: c }))}
                                placeholder="Todos los canales"
                                className="mb-0"
                            />
                            <Select
                                label="Línea de Producto:"
                                name="lineaProducto"
                                value={filters.lineaProducto}
                                onChange={handleFilterChange}
                                options={Object.keys(productLines).map((k: any) => ({ value: k, label: k }))}
                                placeholder="Todas las líneas"
                                className="mb-0"
                            />
                            <Select
                                label="Origen de WhatsApp:"
                                name="whatsappOrigen"
                                value={filters.whatsappOrigen}
                                onChange={handleFilterChange}
                                options={
                                    filters.lineaProducto && (productLines as any)[filters.lineaProducto]
                                        ? (productLines as any)[filters.lineaProducto].map((w: string) => ({ value: w, label: w }))
                                        : []
                                }
                                placeholder="Todos los WhatsApps"
                                disabled={!filters.lineaProducto}
                                className="mb-0"
                            />
                            <Select
                                label="Vendedor/a:"
                                name="vendedor"
                                value={filters.vendedor}
                                onChange={handleFilterChange}
                                options={(Array.isArray(mockDatabase.configuracion?.vendedores) ? mockDatabase.configuracion.vendedores : vendedores).map((v: any) => ({ value: v, label: v }))}
                                placeholder="Todos los vendedores"
                                className="mb-0"
                            />
                            <Select
                                label="Activador:"
                                name="activador"
                                value={filters.activador}
                                onChange={handleFilterChange}
                                options={activadores.map((a: any) => ({ value: a, label: a }))}
                                placeholder="Todos los activadores"
                                className="mb-0"
                            />
                            <Select
                                label="Producto:"
                                name="producto"
                                value={filters.producto}
                                onChange={handleFilterChange}
                                options={mockDatabase.productos.filter((p: any) => p.activo).map((p: any) => ({ value: p.id, label: p.nombre }))}
                                placeholder="Todos los productos"
                                className="mb-0"
                            />
                            <Select
                                label="Horario:"
                                name="horario"
                                value={filters.horario}
                                onChange={handleFilterChange}
                                options={horarios.map((h: any) => ({ value: h, label: h }))}
                                placeholder="Todos los horarios"
                                className="mb-0"
                            />
                            <Select
                                label="Departamento:"
                                name="departamento"
                                value={filters.departamento}
                                onChange={handleFilterChange}
                                options={peruGeoData.map((d: any) => ({ value: d.departamento, label: d.departamento }))}
                                placeholder="Todos los departamentos"
                                className="mb-0"
                            />
                            <Select
                                label="Provincia:"
                                name="provincia"
                                value={filters.provincia}
                                onChange={handleFilterChange}
                                options={provinciasOptions}
                                placeholder="Todas las provincias"
                                disabled={!filters.departamento}
                                className="mb-0"
                            />
                            <Select
                                label="Distrito:"
                                name="distrito"
                                value={filters.distrito}
                                onChange={handleFilterChange}
                                options={distritosOptions}
                                placeholder="Todos los distritos"
                                disabled={!filters.provincia}
                                className="mb-0"
                            />
                    </div>
                </div>
            )}

            {/* Totales */}
            <div className="glass-box rounded-xl border-l-4 border-l-blue-600 mb-6 overflow-hidden">
                {/* Encabezado de totales */}
                <button
                    onClick={() => setShowTotalsDetail(!showTotalsDetail)}
                    className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors duration-200"
                >
                    <h3 className="text-lg font-semibold text-slate-800">Resumen de Totales</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {Object.entries(totals).map(([key, data]: [string, any]) => (
                                <div key={key} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                    <div className="text-slate-600">{data.icon}</div>
                                    <span className="text-xs font-semibold text-slate-700">
                                        {["totalVendido", "totalAdelanto", "totalPendiente", "totalMostaceros", "totalMontoReal"].includes(key)
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

                {/* Contenido expandible con animación de barrido */}
                <div className={`resumen-sweep ${showTotalsDetail ? "is-open" : "is-closed"}`}>
                    {/* Tarjetas de totales */}
                    <div className="px-4 pb-4 flex flex-col items-center gap-6">
                        <div className="flex flex-wrap justify-center gap-4">
                            {(["totalPedidos", "totalPrendas", "totalProductos", "totalVendido"] as const).map((key) => {
                                const data = totals[key]
                                if (!data) return null
                                return (
                                    <div key={key} className={`p-5 rounded-xl shadow-sm text-center flex-shrink-0 w-52 min-h-[120px] flex flex-col justify-center items-center ${data.color} hover:shadow-md transition-shadow duration-200`}>
                                        <div className="flex justify-center mb-2">{data.icon}</div>
                                        <p className={`text-xs ${data.textColor} uppercase font-semibold tracking-wide mb-2`}>
                                            {key.replace(/([A-Z])/g, " $1").replace("total ", "").trim()}
                                        </p>
                                        <p className={`text-2xl font-bold ${data.textColor}`}>
                                            {key === "totalVendido" ? `S/ ${formatMoneyStrict(data.value)}` : data.value.toLocaleString()}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {(["totalAdelanto", "totalPendiente", "totalMostaceros", "totalMontoReal"] as const).map((key) => {
                                const data = totals[key]
                                if (!data) return null
                                return (
                                    <div key={key} className={`p-5 rounded-xl shadow-sm text-center flex-shrink-0 w-52 min-h-[120px] flex flex-col justify-center items-center ${data.color} hover:shadow-md transition-shadow duration-200`}>
                                        <div className="flex justify-center mb-2">{data.icon}</div>
                                        <p className={`text-xs ${data.textColor} uppercase font-semibold tracking-wide mb-2`}>
                                            {key.replace(/([A-Z])/g, " $1").replace("total ", "").trim()}
                                        </p>
                                        <p className={`text-2xl font-bold ${data.textColor}`}>
                                            S/ {formatMoneyStrict(data.value)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Desglose por línea de producto y vendedores */}
                    <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-6">
                        {/* Tabla por Línea de Producto */}
                        <div>
                            <h4 className="text-md font-semibold text-blue-900 mb-3">Desglose por Línea de Producto</h4>
                            <div className="overflow-x-auto">
                                <table className="resumen-table w-full border-collapse">
                                    <thead>
                                        <tr className="bg-blue-100/80 text-blue-900 font-semibold border-b border-blue-200">
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
                                        {(totalsByLinea as any[]).length > 0 ? (
                                            (totalsByLinea as any[]).map((linea: any, index: any) => (
                                                <tr key={index} className="hover:bg-blue-50/70 text-slate-800">
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
                                        {/* Fila de totales */}
                                        {(totalsByLinea as any[]).length > 0 && (
                                            <tr className="bg-blue-100/70 font-semibold border-t-2 border-blue-200 text-slate-800">
                                                <td className="px-4 py-3 text-sm text-slate-900">TOTAL</td>
                                                <td className="px-4 py-3 text-sm text-center text-slate-900">
                                                    {totals.totalPedidos.value.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-emerald-700">
                                                    S/ {formatMoneyStrict(totals.totalVendido.value)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-amber-700">
                                                    S/ {formatMoneyStrict(totals.totalAdelanto.value)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-red-700">
                                                    S/ {formatMoneyStrict(totals.totalPendiente.value)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-slate-900">
                                                    {totals.totalPrendas.value.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-slate-900">
                                                    {totals.totalProductos.value.toLocaleString()}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabla por Vendedor */}
                        <div>
                            <h4 className="text-md font-semibold text-blue-900 mb-3">Desglose por Vendedor/a</h4>
                            <div className="overflow-x-auto">
                                <table className="resumen-table w-full border-collapse">
                                    <thead>
                                        <tr className="bg-blue-100/80 text-blue-900 font-semibold border-b border-blue-200">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Vendedor/a</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">CANT</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Monto general</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Mostaceros</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Monto real</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Adelanto</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Pendiente</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Prendas</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Productos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {(totalsByVendedor as any[]).length > 0 ? (
                                            <>
                                                {(totalsByVendedor as any[]).map((vendedor: any, index: any) => (
                                                    <tr key={index} className="hover:bg-blue-50/70 text-slate-800">
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{vendedor.vendedor}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{vendedor.pedidos.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-emerald-700 font-semibold">
                                                            S/ {formatMoneyStrict(vendedor.vendido)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-amber-700 font-semibold">
                                                            S/ {formatMoneyStrict(vendedor.mostaceros)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-emerald-800 font-semibold">
                                                            S/ {formatMoneyStrict(vendedor.montoReal)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-amber-700 font-semibold">
                                                            S/ {formatMoneyStrict(vendedor.adelanto)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-red-700 font-semibold">
                                                            S/ {formatMoneyStrict(vendedor.pendiente)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{vendedor.prendas.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-slate-700">{vendedor.productos.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                                                    <td className="px-4 py-3 text-sm text-slate-900">TOTAL</td>
                                                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                                                        {(totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.pedidos, 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-emerald-700">
                                                        S/ {formatMoneyStrict((totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.vendido, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-amber-700">
                                                        S/ {formatMoneyStrict((totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.mostaceros, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-emerald-800">
                                                        S/ {formatMoneyStrict((totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.montoReal, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-amber-700">
                                                        S/ {formatMoneyStrict((totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.adelanto, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-red-700">
                                                        S/ {formatMoneyStrict((totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.pendiente, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                                                        {(totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.prendas, 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                                                        {(totalsByVendedor as any[]).reduce((s: number, v: any) => s + v.productos, 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    No hay datos para mostrar
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Listado de Pedidos */}
            <h3 className="text-xl font-bold text-slate-800 mb-4 px-1">
                Listado de Pedidos ({filteredAndSortedPedidos.length})
            </h3>
            {filteredAndSortedPedidos.length === 0 ? (
                <div className="glass-box rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">No se encontraron pedidos</h3>
                    <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
            ) : (
                <div className="glass-box rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Línea / Fecha</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Adelanto</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedPedidos.map((pedido: any) => (
                                    <tr key={pedido.id} className="hover:bg-slate-50/50 text-slate-800">
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">#{pedido.id.slice(-4)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{pedido.clienteNombre} {pedido.clienteApellidos}</div>
                                            <div className="text-xs text-slate-500">DNI: {pedido.clienteNumeroDocumento} • {pedido.clienteContacto}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {pedido.lineaProducto && <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded font-medium">{pedido.lineaProducto}</span>}
                                            <span className="text-slate-600 ml-1">{new Date(pedido.createdAt).toLocaleDateString()}</span>
                                            {pedido.vendedor && <span className="block text-xs text-amber-700 mt-0.5">Vend: {pedido.vendedor}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-900">S/ {formatMoneyStrict(parseMontoRobust(pedido.montoTotal))}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600">S/ {formatMoneyStrict(parseMontoRobust(pedido.montoAdelanto))}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setPedidoToEdit(pedido); setIsModalOpen(true); }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                                    title="Editar Pedido"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                </button>
                                                {hasPermission("ventas", "eliminar") && (
                                                    <button
                                                        onClick={() => handleDeletePedido(pedido.id)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                                                        title="Eliminar Pedido"
                                                    >
                                                        <Archive className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center mt-8 gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-lg flex items-center">
                        Página {currentPage} de {totalPages}
                    </span>
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
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Modal de confirmación (custom inline par simplicity) */}
            {confirmDelete.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass-box rounded-xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar pedido?</h3>
                        <p className="text-slate-600 mb-6">Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setConfirmDelete({ isOpen: false, pedidoId: null })}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={confirmPedidoDeletion}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <RegistrarPedidoModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setPedidoToEdit(null)
                }}
                onSave={handleSavePedido}
                pedidoToEdit={pedidoToEdit}
            />
        </div>
    )
}
export const VentasTab = React.memo(VentasTabComponent)
