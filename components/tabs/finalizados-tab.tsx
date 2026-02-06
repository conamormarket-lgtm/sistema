"use client"

import React, { useState, useEffect, useMemo } from "react"
import { SlidersHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfigColumnasEtapaModal } from "@/components/modals/config-columnas-etapa-modal"
import { useAuth } from "@/contexts/auth-context"
import { mockFirestore } from "@/lib/mock-firebase"
import { parseFechaRobust, obtenerValorColumna, formatearValor } from "@/lib/business-logic"
import { mockDatabase } from "@/lib/mock-firebase"

function FinalizadosTabComponent() {
    const { isMasterAdmin } = useAuth()
    const [pedidosFinalizados, setPedidosFinalizados] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "", // Mostrar todo por defecto
        fechaHasta: "",
    })
    const [showConfigColumnas, setShowConfigColumnas] = useState(false)
    const [configVersion, setConfigVersion] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Obtener columnas visibles (usa config de reparto, mismo modal)
    const columnasVisibles = useMemo(() => {
        if (!mockDatabase.columnasPedidos || mockDatabase.columnasPedidos.length === 0) return []
        const config = mockDatabase.columnasConfig?.reparto || {}
        const ordenGuardado = config.orden || []
        const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)
        const columnasFiltradas = todasColumnas
            .filter((col: any) => {
                if (config[col.campo] !== undefined) return config[col.campo]
                if (Object.keys(config).length === 0 || !config.orden) return col.visible === true || col.categoria === "basico" || col.categoria === "reparto"
                return col.visible === true
            })
            .sort((a: any, b: any) => {
                const indexA = ordenGuardado.findIndex((c: any) => c === a.campo)
                const indexB = ordenGuardado.findIndex((c: any) => c === b.campo)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return a.orden - b.orden
            })
        return columnasFiltradas.length > 0 ? columnasFiltradas : todasColumnas.filter((c: any) => c.visible).slice(0, 15)
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.reparto, configVersion])


    useEffect(() => {
        const pedidos = mockDatabase.pedidos || []
        setPedidosFinalizados(pedidos.filter((p: any) => p.estadoGeneral === "Finalizado" || p.status === "finalizados"))
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot(() => {
            const p = mockDatabase.pedidos || []
            setPedidosFinalizados(p.filter((x: any) => x.estadoGeneral === "Finalizado" || x.status === "finalizados"))
        })
        return () => unsubscribe()
    }, [])

    const pedidosFiltrados = useMemo(() => {
        let list = pedidosFinalizados
        if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
            list = list.filter((pedido: any) => {
                const fechaRef = pedido.reparto?.fechaFinalizado || pedido.updatedAt || pedido.createdAt
                if (!fechaRef) return true
                const fecha = parseFechaRobust(fechaRef)
                if (!fecha) return true
                if (filtrosFecha.fechaDesde) {
                    const desde = parseFechaRobust(filtrosFecha.fechaDesde)
                    if (desde && fecha < desde) return false
                }
                if (filtrosFecha.fechaHasta) {
                    const hasta = parseFechaRobust(filtrosFecha.fechaHasta + "T23:59:59")
                    if (hasta && fecha > hasta) return false
                }
                return true
            })
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            list = list.filter((p: any) =>
                p.clienteNombre?.toLowerCase().includes(term) ||
                p.clienteContacto?.includes(searchTerm) ||
                String(p.id || "").toLowerCase().includes(term) ||
                String(p.numeroPedido || "").toLowerCase().includes(term)
            )
        }
        return list
    }, [pedidosFinalizados, filtrosFecha, searchTerm])

    // Paginación (reset al cambiar filtros o búsqueda)
    useEffect(() => {
        setCurrentPage(1)
    }, [filtrosFecha, searchTerm])
    const totalPages = useMemo(() => Math.max(1, Math.ceil(pedidosFiltrados.length / itemsPerPage)), [pedidosFiltrados.length, itemsPerPage])
    const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
    const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage])
    const pedidosPaginados = useMemo(() => {
        if (!pedidosFiltrados.length) return []
        return pedidosFiltrados.slice(startIndex, endIndex)
    }, [pedidosFiltrados, startIndex, endIndex])

    // Resumen Actual
    const resumenActual = useMemo(() => {
        return { total: pedidosFinalizados.length }
    }, [pedidosFinalizados])

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-lime-400" /> Finalizados</h2>
                <div className="flex gap-2 items-center flex-wrap">
                    <div className="relative min-w-[180px] max-w-xs">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e: any) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por cliente, celular o ID..."
                            className="w-full h-9 pl-10 pr-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <input
                        type="date"
                        value={filtrosFecha.fechaDesde}
                        onChange={(e: any) => setFiltrosFecha((prev: any) => ({ ...prev, fechaDesde: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                        type="date"
                        value={filtrosFecha.fechaHasta}
                        onChange={(e: any) => setFiltrosFecha((prev: any) => ({ ...prev, fechaHasta: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowConfigColumnas(!showConfigColumnas)}
                        iconLeft={<SlidersHorizontal className="w-4 h-4" />}
                        style={{ display: isMasterAdmin() ? 'inline-flex' : 'none' }}
                    >
                        Columnas
                    </Button>
                </div>
            </div>

            {/* Modal de Configuración de Columnas */}
            <ConfigColumnasEtapaModal
                isOpen={showConfigColumnas}
                onClose={() => setShowConfigColumnas(false)}
                etapaId="reparto"
                etapaNombre="Finalizados"
                onSave={() => setConfigVersion(v => v + 1)}
            />

            {/* Resumen Actual: tarjeta centrada según cantidad */}
            <div className="flex flex-col items-center gap-6 mb-6">
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">TOTAL FINALIZADOS</p>
                        <p className="text-2xl font-bold text-slate-900">{resumenActual.total}</p>
                    </div>
                </div>
            </div>

            {/* Tabla resumida */}
            <div className="glass-box rounded-2xl border-l-4 border-l-lime-400 overflow-hidden">
                <table className="resumen-table w-full">
                    <thead className="bg-lime-300 text-lime-900 font-semibold border-b border-lime-400">
                        <tr>
                            {columnasVisibles.map((columna: any) => (
                                <th
                                    key={columna.id}
                                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase"
                                >
                                    {columna.nombre}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pedidosFiltrados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columnasVisibles.length}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    No hay pedidos finalizados
                                </td>
                            </tr>
                        ) : (
                            pedidosPaginados.map((pedido: any) => (
                                <tr key={pedido.id} className="hover:bg-lime-50/80 text-slate-800">
                                    {columnasVisibles.map((columna: any) => {
                                        const valor = obtenerValorColumna(columna, pedido)
                                        const valorFormateado = formatearValor(valor, columna.tipo, columna.formato)
                                        return (
                                            <td
                                                key={columna.id}
                                                className="px-4 py-3 text-sm text-slate-700"
                                            >
                                                {valorFormateado || "-"}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {pedidosFiltrados.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4 p-4 border-t border-slate-200 bg-lime-100/60">
                        <span className="text-sm text-slate-600">
                            Mostrando {startIndex + 1}-{Math.min(endIndex, pedidosFiltrados.length)} de {pedidosFiltrados.length}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                            <span className="flex items-center px-2 text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export const FinalizadosTab = React.memo(FinalizadosTabComponent)
