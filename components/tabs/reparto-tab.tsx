"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
    Truck,
    SlidersHorizontal,
    Save,
    CheckCircle2,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditableCell } from "@/components/ui/editable-cell"
import { ConfigColumnasEtapaModal } from "@/components/modals/config-columnas-etapa-modal"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore } from "@/lib/mock-firebase"
import {
    parseFechaRobust,
    evaluarCondiciones,
    obtenerValorColumna,
    formatearValor,
    obtenerValorCampo
} from "@/lib/business-logic"
import { getAnchoColumnaEtapa } from "@/lib/columnas-etapas"
import { repartidores } from "@/lib/constants"
import { handleGuardarCampo } from "@/lib/actions"

function RepartoTabComponent() {
    const { currentUser, isMasterAdmin } = useAuth()
    const [pedidosEnReparto, setPedidosEnReparto] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "", // Sin filtro por defecto para mostrar todos los pedidos
        fechaHasta: "",
    })
    const [formDataExpandido, setFormDataExpandido] = useState({
        repartidor: "",
        estado: "",
    })
    const [showConfigColumnas, setShowConfigColumnas] = useState(false)
    const [configVersion, setConfigVersion] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Obtener columnas visibles y ordenadas para esta etapa
    const columnasVisibles = useMemo(() => {
        // Asegurar que las columnas estén inicializadas
        if (!mockDatabase.columnasPedidos || mockDatabase.columnasPedidos.length === 0) {
            return []
        }

        const config = mockDatabase.columnasConfig?.reparto || {}
        const ordenGuardado = config.orden || []

        // Obtener todas las columnas
        const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)

        // Filtrar y ordenar según configuración
        const columnasFiltradas = todasColumnas
            .filter((col: any) => {
                // Si hay configuración guardada, usar esa
                if (config[col.campo] !== undefined) {
                    return config[col.campo]
                }
                // Si no hay configuración, mostrar columnas básicas y de reparto por defecto
                if (Object.keys(config).length === 0 || !config.orden) {
                    // Primera vez: mostrar columnas básicas y de reparto
                    return col.visible === true ||
                        col.categoria === "basico" ||
                        col.categoria === "reparto"
                }
                // Si hay configuración pero esta columna no está, usar visible por defecto
                return col.visible === true
            })
            .sort((a: any, b: any) => {
                // Ordenar según orden guardado si existe
                const indexA = ordenGuardado.findIndex((c: any) => c === a.campo)
                const indexB = ordenGuardado.findIndex((c: any) => c === b.campo)

                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return a.orden - b.orden
            })

        // Si no hay columnas visibles, mostrar al menos las básicas
        if (columnasFiltradas.length === 0) {
            return todasColumnas.filter((col: any) =>
                col.categoria === "basico" ||
                col.categoria === "reparto" ||
                col.visible === true
            ).slice(0, 15) // Limitar a 15 columnas básicas
        }

        return columnasFiltradas
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.reparto, configVersion])

    useEffect(() => {
        setPedidosEnReparto((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Reparto"))
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot(() => {
            setPedidosEnReparto((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Reparto"))
        })
        return () => unsubscribe()
    }, [])

    // Filtrar pedidos por rango de fechas y búsqueda
    const pedidosFiltrados = useMemo(() => {
        let list = pedidosEnReparto
        if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
            list = list.filter((pedido: any) => {
                const fechaEntrada = pedido.reparto?.fechaEntrada
                if (!fechaEntrada) return false
                const fecha = parseFechaRobust(fechaEntrada)
                if (!fecha) return false
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
    }, [pedidosEnReparto, filtrosFecha, searchTerm])

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
        const pendientes = pedidosEnReparto.length
        const enProceso = pedidosEnReparto.filter((p: any) => p.reparto?.estado !== "ENTREGADO").length
        const sinAsignar = pedidosEnReparto.filter((p: any) => !p.reparto?.repartidorNombre).length
        return { pendientes, enProceso, sinAsignar }
    }, [pedidosEnReparto])

    // Resumen Histórico por Repartidor
    const resumenHistorico = useMemo(() => {
        const fechaInicio = filtrosFecha.fechaDesde ? new Date(filtrosFecha.fechaDesde) : new Date()
        const fechaFin = filtrosFecha.fechaHasta ? new Date(filtrosFecha.fechaHasta + "T23:59:59") : new Date()

        const todosPedidos = mockDatabase.pedidos.filter((p: any) => {
            const fechaEntrada = p.reparto?.fechaEntrada
            if (!fechaEntrada) return false
            const entrada = parseFechaRobust(fechaEntrada)
            return entrada && entrada >= fechaInicio && entrada <= fechaFin
        })

        const porRepartidor: any = {}
        const listaRepartidores = Array.isArray(mockDatabase.configuracion?.repartidores)
            ? mockDatabase.configuracion.repartidores
            : repartidores
        listaRepartidores.forEach((repartidor: any) => {
            porRepartidor[repartidor] = { entrada: 0, salida: 0 }
        })
        porRepartidor["SIN ASIGNAR"] = { entrada: 0, salida: 0 }

        todosPedidos.forEach((pedido: any) => {
            const repartidor = pedido.reparto?.repartidorNombre || "SIN ASIGNAR"
            if (!porRepartidor[repartidor]) {
                porRepartidor[repartidor] = { entrada: 0, salida: 0 }
            }

            const fechaEntrada = pedido.reparto?.fechaEntrada
            if (fechaEntrada) {
                const entrada = new Date(fechaEntrada)
                if (entrada >= fechaInicio && entrada <= fechaFin) {
                    porRepartidor[repartidor].entrada++
                }
            }

            const fechaSalida = pedido.reparto?.fechaSalida
            if (fechaSalida) {
                const salida = new Date(fechaSalida)
                if (salida >= fechaInicio && salida <= fechaFin) {
                    porRepartidor[repartidor].salida++
                }
            }
        })

        const resumen = Object.entries(porRepartidor).map(([nombre, datos]: [string, any]) => ({
            nombre,
            entrada: datos.entrada,
            salida: datos.salida,
        }))

        const totales = {
            nombre: "TOTALES",
            entrada: resumen.reduce((sum: any, r: any) => sum + r.entrada, 0),
            salida: resumen.reduce((sum: any, r: any) => sum + r.salida, 0),
        }

        return [totales, ...resumen]
    }, [filtrosFecha])

    const handleClickFila = (e: React.MouseEvent, pedido: any) => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) return
        handleExpandirPedido(pedido)
    }

    const handleExpandirPedido = (pedido: any) => {
        setPedidoExpandido(pedido.id)
        setFormDataExpandido({
            repartidor: pedido.reparto?.repartidor || "",
            estado: pedido.reparto?.estado || "",
        })
    }

    const handleGuardarCambios = async () => {
        if (!pedidoExpandido) return

        try {
            const pedido = pedidosEnReparto.find((p: any) => p.id === pedidoExpandido)
            if (!pedido) return

            const updates = {
                reparto: {
                    ...pedido.reparto,
                    repartidor: formDataExpandido.repartidor,
                    repartidorNombre: formDataExpandido.repartidor,
                    estado: formDataExpandido.estado || "EN REPARTO",
                },
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Reparto Actualizado",
                        detalle: `Reparto actualizado por ${currentUser?.email || "sistema"}`,
                    },
                ],
                updatedAt: new Date(),
            }

            await mockFirestore.doc("pedidos", pedidoExpandido).update(updates)
            alert("Cambios guardados exitosamente")
        } catch (error: any) {
            console.error("Error al guardar cambios:", error)
            alert("Error al guardar los cambios: " + error.message)
        }
    }

    // Función directa para marcar como entregado (desde tabla)
    const handleMarcarEntregadoDirecto = async (pedido: any) => {
        const pedidoActualizado = pedidosEnReparto.find((p: any) => p.id === pedido.id) || pedido
        await handleMarcarEntregadoConPedido(pedidoActualizado)
    }

    // Función interna para marcar como entregado con un pedido específico
    const handleMarcarEntregadoConPedido = async (pedido: any) => {
        if (!pedido) return

        // Buscar la etapa de reparto
        const etapaReparto = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "reparto"
        )

        // Evaluar condiciones de salida si están configuradas
        if (etapaReparto && etapaReparto.condicionesSalida && etapaReparto.condicionesSalida.length > 0) {
            const resultado = evaluarCondiciones(etapaReparto.condicionesSalida, pedido)
            if (!resultado.cumplidas) {
                alert(
                    "ACCIÓN DETENIDA: No se cumplen todas las condiciones requeridas para finalizar el pedido:\n\n" +
                    resultado.condicionesFaltantes.map((c: any) => `- ${c}`).join("\n")
                )
                return
            }
        } else {
            // Validaciones por defecto (retrocompatibilidad)
            if (!pedido.reparto?.repartidor || pedido.reparto.repartidor.trim() === "") {
                alert("ACCIÓN DETENIDA: Debe asignar un repartidor antes de finalizar.")
                return
            }
        }

        const confirmar = confirm(
            `¿Estás seguro de que quieres marcar el pedido #${pedido.id} como FINALIZADO? Esta es la última etapa.`
        )
        if (!confirmar) return

        try {
            const fechaFinalizado = new Date()
            const fechaEntrada = pedido.reparto?.fechaEntrada
                ? new Date(pedido.reparto.fechaEntrada)
                : fechaFinalizado
            const tiempoReparto = ((fechaFinalizado as any) - (fechaEntrada as any)) / (1000 * 60 * 60)

            // Calcular tiempo total
            const tiempos = pedido.tiempos || {}
            const tiempoTotal =
                (tiempos.diseño || 0) +
                (tiempos.cobranza || 0) +
                (tiempos.preparacion || 0) +
                (tiempos.estampado || 0) +
                (tiempos.empaquetado || 0) +
                tiempoReparto

            const updates = {
                estadoGeneral: "Finalizado",
                status: "finalizado",
                reparto: {
                    ...pedido.reparto,
                    fechaSalida: fechaFinalizado,
                    fechaFinalizado: fechaFinalizado,
                    estado: "ENTREGADO",
                    repartidor: pedido.reparto?.repartidor || formDataExpandido.repartidor,
                    repartidorNombre: pedido.reparto?.repartidorNombre || pedido.reparto?.repartidor || formDataExpandido.repartidor,
                },
                tiempos: {
                    ...tiempos,
                    reparto: tiempoReparto,
                    total: tiempoTotal,
                },
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Pedido Finalizado",
                        detalle: `Pedido marcado como finalizado por ${currentUser?.email || "sistema"}`,
                    },
                ],
                updatedAt: new Date(),
            }

            await mockFirestore.doc("pedidos", pedido.id).update(updates)
            alert(" Pedido marcado como Finalizado!")
            if (pedidoExpandido === pedido.id) {
                setPedidoExpandido(null)
            }
        } catch (error: any) {
            console.error("Error al marcar como entregado:", error)
            alert("Error al finalizar el pedido: " + error.message)
        }
    }

    // Marcar como entregado (desde modal)
    const handleMarcarEntregado = async () => {
        if (!pedidoExpandido) return

        const pedido = pedidosEnReparto.find((p: any) => p.id === pedidoExpandido)
        if (!pedido) return

        // Crear pedido temporal con datos del formulario
        const pedidoTemporal = {
            ...pedido,
            reparto: {
                ...pedido.reparto,
                repartidor: formDataExpandido.repartidor,
                repartidorNombre: formDataExpandido.repartidor,
                estado: formDataExpandido.estado || "EN REPARTO",
            },
        }

        await handleMarcarEntregadoConPedido(pedidoTemporal)
    }

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-amber-700" /> Reparto / Entrega</h2>
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

            {/* Resúmenes: tarjetas centradas según cantidad */}
            <div className="flex flex-col items-center gap-6 mb-6">
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">PENDIENTES</p>
                        <p className="text-2xl font-bold text-slate-900">{resumenActual.pendientes}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">EN PROCESO</p>
                        <p className="text-xl font-semibold text-slate-900">{resumenActual.enProceso}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">SIN ASIGNAR</p>
                        <p className="text-xl font-semibold text-slate-900">{resumenActual.sinAsignar}</p>
                    </div>
                </div>

                {/* Resumen Histórico */}
                <div className="w-full max-w-5xl glass-box rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 bg-emerald-600 text-white px-4 py-2 rounded-lg">
                            RESUMEN HISTÓRICO
                        </h3>
                        <div className="flex gap-2 text-sm">
                            <span className="text-slate-600">Fecha Inicio:</span>
                            <input
                                type="date"
                                value={filtrosFecha.fechaDesde}
                                onChange={(e: any) => setFiltrosFecha((prev: any) => ({ ...prev, fechaDesde: e.target.value }))}
                                className="px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                            <span className="text-slate-600">Fecha Fin:</span>
                            <input
                                type="date"
                                value={filtrosFecha.fechaHasta}
                                onChange={(e: any) => setFiltrosFecha((prev: any) => ({ ...prev, fechaHasta: e.target.value }))}
                                className="px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="resumen-table w-full text-sm">
                            <thead className="bg-amber-700 text-white font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">Repartidor</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Entrada</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Salida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {resumenHistorico.map((item: any, idx: any) => (
                                    <tr key={idx} className={item.nombre === "TOTALES" ? "bg-amber-50/80 font-semibold text-slate-800" : ""}>
                                        <td className="px-3 py-2 text-slate-900">{item.nombre}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.entrada}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.salida}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Configuración de Columnas */}
            <ConfigColumnasEtapaModal
                isOpen={showConfigColumnas}
                onClose={() => setShowConfigColumnas(false)}
                etapaId="reparto"
                etapaNombre="Reparto"
                onSave={() => setConfigVersion(v => v + 1)}
            />

            {/* Tabla resumida */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">Pedidos en Reparto</h3>
                    {pedidosFiltrados.length > itemsPerPage && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, pedidosFiltrados.length)} de {pedidosFiltrados.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {currentPage} de {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            <div className="glass-box rounded-2xl border-l-4 border-l-amber-700 overflow-hidden">
                <table className="resumen-table w-full">
                    <thead className="bg-amber-700 text-white font-semibold border-b border-amber-800">
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
                                    No hay pedidos en reparto
                                </td>
                            </tr>
                        ) : (
                            pedidosPaginados.map((pedido: any) => (
                                <React.Fragment key={pedido.id}>
                                    <tr
                                        className={`hover:bg-amber-50/70 cursor-pointer text-slate-800 ${pedidoExpandido === pedido.id ? "bg-amber-50" : ""}`}
                                        onClick={(e) => handleClickFila(e, pedido)}
                                    >
                                        {columnasVisibles.map((columna: any) => {
                                            const valor = obtenerValorColumna(columna, pedido)
                                            const esEditable = columna.editable
                                            const esRepartidor = columna.campo === "reparto.repartidor"
                                            const esEstado = columna.campo === "reparto.estado"

                                            return (
                                                <td
                                                    key={columna.id}
                                                    className={`px-4 py-3 text-sm text-slate-700 align-top ${getAnchoColumnaEtapa(columna.campo)} ${columna.campo === "productos" ? "break-words whitespace-normal" : ""}`}
                                                    onClick={esEditable ? (e: any) => e.stopPropagation() : undefined}
                                                >
                                                    {esEditable && esRepartidor ? (
                                                        <EditableCell
                                                            value={pedido.reparto?.repartidor || ""}
                                                            onChange={async (valor: any) => {
                                                                await handleGuardarCampo(pedido.id, "repartidor", valor, "reparto", currentUser)
                                                                await handleGuardarCampo(pedido.id, "repartidorNombre", valor, "reparto", currentUser)
                                                            }}
                                                            type="select"
                                                            options={Array.isArray(mockDatabase.configuracion?.repartidores) ? mockDatabase.configuracion.repartidores : repartidores}
                                                        />
                                                    ) : esEditable && esEstado ? (
                                                        <EditableCell
                                                            value={pedido.reparto?.estado || "EN REPARTO"}
                                                            onChange={async (valor: any) => {
                                                                await handleGuardarCampo(pedido.id, "estado", valor, "reparto", currentUser)
                                                                if (valor === "ENTREGADO") {
                                                                    const pedidoActualizado = pedidosEnReparto.find((p: any) => p.id === pedido.id) || pedido
                                                                    await handleMarcarEntregadoDirecto(pedidoActualizado)
                                                                }
                                                            }}
                                                            type="select"
                                                            options={columna.opciones || ["ALISTANDO", "EN REPARTO", "ENTREGADO", "LISTO"]}
                                                        />
                                                    ) : esEditable ? (
                                                        <EditableCell
                                                            value={obtenerValorCampo(pedido, columna.campo) || ""}
                                                            onChange={async (valor: any) => {
                                                                await handleGuardarCampo(pedido.id, columna.campo, valor, null, currentUser)
                                                            }}
                                                            type={columna.tipo === "numero" ? "number" : columna.tipo === "lista" ? "select" : "text"}
                                                            options={columna.opciones || []}
                                                        />
                                                    ) : (
                                                        <span>{valor || "-"}</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                    {pedidoExpandido === pedido.id && (
                                        <tr>
                                            <td
                                                colSpan={columnasVisibles.length}
                                                className="px-4 py-6 bg-blue-50/50"
                                            >
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Reparto - Pedido #{pedido.id}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1">Repartidor</label>
                                                            <select
                                                                value={formDataExpandido.repartidor}
                                                                onChange={(e: any) =>
                                                                    setFormDataExpandido((prev: any) => ({ ...prev, repartidor: e.target.value }))
                                                                }
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                onClick={(e: any) => e.stopPropagation()}
                                                            >
                                                                <option value="">Seleccionar repartidor</option>
                                                                {(Array.isArray(mockDatabase.configuracion?.repartidores) ? mockDatabase.configuracion.repartidores : repartidores).map((r: any) => (
                                                                    <option key={r} value={r}>
                                                                        {r}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                                            <select
                                                                value={formDataExpandido.estado || "EN REPARTO"}
                                                                onChange={(e: any) =>
                                                                    setFormDataExpandido((prev: any) => ({ ...prev, estado: e.target.value }))
                                                                }
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                onClick={(e: any) => e.stopPropagation()}
                                                            >
                                                                <option value="ALISTANDO">Alistando</option>
                                                                <option value="EN REPARTO">En reparto</option>
                                                                <option value="ENTREGADO">Entregado</option>
                                                                <option value="LISTO">Listo</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="primary"
                                                            onClick={(e: any) => {
                                                                e.stopPropagation()
                                                                handleGuardarCambios()
                                                            }}
                                                            iconLeft={<Save className="w-4 h-4" />}
                                                        >
                                                            Guardar Cambios
                                                        </Button>
                                                        {formDataExpandido.estado === "ENTREGADO" && (
                                                            <Button
                                                                variant="success"
                                                                onClick={(e: any) => {
                                                                    e.stopPropagation()
                                                                    handleMarcarEntregado()
                                                                }}
                                                                iconLeft={<CheckCircle2 className="w-4 h-4" />}
                                                            >
                                                                Marcar como Finalizado
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="secondary"
                                                            onClick={(e: any) => {
                                                                e.stopPropagation()
                                                                setPedidoExpandido(null)
                                                            }}
                                                            iconLeft={<X className="w-4 h-4" />}
                                                        >
                                                            Cerrar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            </div>
        </div>
    )
}
export const RepartoTab = React.memo(RepartoTabComponent)
