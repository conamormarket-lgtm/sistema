
import React, { useState, useEffect, useMemo } from "react"
import { SlidersHorizontal, ChevronDown, ChevronUp, Save, CheckCircle2, X, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore, evaluarCondiciones, obtenerValorColumna, obtenerValorCampo } from "@/lib/mock-firebase"
import { Button } from "@/components/ui/button"
import { EditableCell } from "@/components/ui/editable-cell"
import { ConfigColumnasEtapaModal } from "@/components/modals/config-columnas-etapa-modal"
import { handleGuardarCampo } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { getAnchoColumnaEtapa } from "@/lib/columnas-etapas"

import { operariosDefault } from "../../lib/constants"

// Componente: EmpaquetadoTab - Gestión de pedidos en etapa de empaquetado
function EmpaquetadoTabComponent() {
    const { currentUser, hasPermission, isMasterAdmin } = useAuth()
    const [pedidosEnEmpaquetado, setPedidosEnEmpaquetado] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [searchTerm, setSearchTerm] = useState("")
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "", // Sin filtro por defecto para mostrar todos los pedidos
        fechaHasta: "",
    })
    const [formDataExpandido, setFormDataExpandido] = useState({
        operador: "",
        estado: "",
    })
    const [showConfigColumnas, setShowConfigColumnas] = useState(false)
    const [configVersion, setConfigVersion] = useState(0)

    // Obtener columnas visibles y ordenadas para esta etapa
    const columnasVisibles = useMemo(() => {
        // Asegurar que las columnas estén inicializadas
        if (!mockDatabase.columnasPedidos || mockDatabase.columnasPedidos.length === 0) {
            return []
        }

        const config = mockDatabase.columnasConfig?.empaquetado || {}
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
                // Si no hay configuración, mostrar columnas básicas y de empaquetado por defecto
                if (Object.keys(config).length === 0 || !config.orden) {
                    // Primera vez: mostrar columnas básicas y de empaquetado
                    return col.visible === true ||
                        col.categoria === "basico" ||
                        col.categoria === "empaquetado"
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
                col.categoria === "empaquetado" ||
                col.visible === true
            ).slice(0, 15) // Limitar a 15 columnas básicas
        }

        return columnasFiltradas
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.empaquetado, configVersion])

    useEffect(() => {
        setPedidosEnEmpaquetado((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Empaquetado"))
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot(() => {
            setPedidosEnEmpaquetado((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Empaquetado"))
        })
        return () => unsubscribe()
    }, [])

    // Filtrar pedidos por rango de fechas y búsqueda
    const pedidosFiltrados = useMemo(() => {
        let list = pedidosEnEmpaquetado
        if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
            list = list.filter((pedido: any) => {
                const fechaEntrada = pedido.empaquetado?.fechaEntrada
                if (!fechaEntrada) return false
                const fecha = new Date(fechaEntrada)
                if (filtrosFecha.fechaDesde && fecha < new Date(filtrosFecha.fechaDesde)) return false
                if (filtrosFecha.fechaHasta && fecha > new Date(filtrosFecha.fechaHasta + "T23:59:59")) return false
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
    }, [pedidosEnEmpaquetado, filtrosFecha, searchTerm])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filtrosFecha.fechaDesde, filtrosFecha.fechaHasta])

    const totalPages = useMemo(() => Math.max(1, Math.ceil(pedidosFiltrados.length / itemsPerPage)), [pedidosFiltrados.length, itemsPerPage])
    const startIndex = useMemo(() => (Math.min(currentPage, totalPages) - 1) * itemsPerPage, [currentPage, totalPages, itemsPerPage])
    const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage])
    const pedidosPaginados = useMemo(() => pedidosFiltrados.slice(startIndex, endIndex), [pedidosFiltrados, startIndex, endIndex])

    // Resumen Actual
    const resumenActual = useMemo(() => {
        const pendientes = pedidosEnEmpaquetado.length
        const enProceso = pedidosEnEmpaquetado.filter((p: any) => p.empaquetado?.estado !== "LISTO").length
        const sinAsignar = pedidosEnEmpaquetado.filter((p: any) => !p.empaquetado?.operadorNombre).length
        const pausado = 0 // No hay estado pausado en empaquetado
        return { pendientes, enProceso, sinAsignar, pausado }
    }, [pedidosEnEmpaquetado])

    // Resumen Histórico por Operador
    const resumenHistorico = useMemo(() => {
        const fechaInicio = filtrosFecha.fechaDesde ? new Date(filtrosFecha.fechaDesde) : new Date()
        const fechaFin = filtrosFecha.fechaHasta ? new Date(filtrosFecha.fechaHasta + "T23:59:59") : new Date()

        const todosPedidos = mockDatabase.pedidos.filter((p: any) => {
            const fechaEntrada = p.empaquetado?.fechaEntrada
            if (!fechaEntrada) return false
            const entrada = new Date(fechaEntrada)
            return entrada >= fechaInicio && entrada <= fechaFin
        })

        const porOperador: any = {}
        const listaOperadores = Array.isArray(mockDatabase.configuracion?.operarios)
            ? mockDatabase.configuracion.operarios
            : operariosDefault
        listaOperadores.forEach((operador: any) => {
            porOperador[operador] = { salida: 0, entrada: 0 }
        })
        porOperador["TERMINADOS"] = { salida: 0, entrada: 0 }
        porOperador["INGRESADOS"] = { salida: 0, entrada: 0 }

        todosPedidos.forEach((pedido: any) => {
            const operador = pedido.empaquetado?.operadorNombre || "SIN ASIGNAR"
            if (!porOperador[operador]) {
                porOperador[operador] = { salida: 0, entrada: 0 }
            }

            const fechaEntrada = pedido.empaquetado?.fechaEntrada
            if (fechaEntrada) {
                const entrada = new Date(fechaEntrada)
                if (entrada >= fechaInicio && entrada <= fechaFin) {
                    porOperador["INGRESADOS"].entrada++
                    porOperador[operador].entrada++
                }
            }

            const fechaSalida = pedido.empaquetado?.fechaSalida
            if (fechaSalida) {
                const salida = new Date(fechaSalida)
                if (salida >= fechaInicio && salida <= fechaFin) {
                    porOperador["TERMINADOS"].salida++
                    porOperador[operador].salida++
                }
            }
        })

        const resumen = Object.entries(porOperador).map(([nombre, datos]: [string, any]) => ({
            nombre,
            entrada: datos.entrada,
            salida: datos.salida,
        }))

        return resumen
    }, [filtrosFecha])

    const handleClickFila = (e: React.MouseEvent, pedido: any) => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) return
        handleExpandirPedido(pedido)
    }

    const handleExpandirPedido = (pedido: any) => {
        setPedidoExpandido(pedido.id)
        setFormDataExpandido({
            operador: pedido.empaquetado?.operador || "",
            estado: pedido.empaquetado?.estado || "",
        })
    }

    const handleGuardarCambios = async () => {
        if (!pedidoExpandido) return

        try {
            const pedido = pedidosEnEmpaquetado.find((p: any) => p.id === pedidoExpandido)
            if (!pedido) return

            const updates = {
                empaquetado: {
                    ...pedido.empaquetado,
                    operador: formDataExpandido.operador,
                    operadorNombre: formDataExpandido.operador,
                    estado: formDataExpandido.estado || "EMPAQUETADO",
                },
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Empaquetado Actualizado",
                        detalle: `Empaquetado actualizado por ${currentUser?.email || "sistema"}`,
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

    // Función directa para marcar como listo (desde tabla)
    const handleMarcarListoDirecto = async (pedido: any) => {
        const pedidoActualizado = pedidosEnEmpaquetado.find((p: any) => p.id === pedido.id) || pedido
        await handleMarcarListoConPedido(pedidoActualizado)
    }

    // Función interna para marcar como listo con un pedido específico
    const handleMarcarListoConPedido = async (pedido: any) => {
        if (!pedido) return

        // Buscar la etapa de empaquetado
        const etapaEmpaquetado = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "empaquetado"
        )

        // Evaluar condiciones de salida si están configuradas
        if (etapaEmpaquetado && etapaEmpaquetado.condicionesSalida && etapaEmpaquetado.condicionesSalida.length > 0) {
            const resultado = evaluarCondiciones(etapaEmpaquetado.condicionesSalida, pedido)
            if (!resultado.cumplidas) {
                alert(
                    "ACCIÓN DETENIDA: No se cumplen todas las condiciones requeridas para salir de Empaquetado:\n\n" +
                    resultado.condicionesFaltantes.map((c: any) => `- ${c}`).join("\n")
                )
                return
            }
        } else {
            // Validaciones por defecto (retrocompatibilidad)
            if (!pedido.empaquetado?.operador || pedido.empaquetado.operador.trim() === "") {
                alert("ACCIÓN DETENIDA: Debe asignar un operador antes de avanzar.")
                return
            }
        }

        const confirmar = confirm(`¿Estás seguro de que quieres enviar el pedido #${pedido.id} a Reparto?`)
        if (!confirmar) return

        try {
            const fechaSalida = new Date()
            const fechaEntrada = pedido.empaquetado?.fechaEntrada
                ? new Date(pedido.empaquetado.fechaEntrada)
                : fechaSalida
            const tiempoEmpaquetado = ((fechaSalida as any) - (fechaEntrada as any)) / (1000 * 60 * 60)

            const updates = {
                estadoGeneral: "En Reparto",
                status: "reparto",
                empaquetado: {
                    ...pedido.empaquetado,
                    fechaSalida: fechaSalida,
                    estado: "LISTO",
                    operador: pedido.empaquetado?.operador || formDataExpandido.operador,
                    operadorNombre: pedido.empaquetado?.operadorNombre || pedido.empaquetado?.operador || formDataExpandido.operador,
                },
                reparto: {
                    ...pedido.reparto,
                    fechaEntrada: new Date(),
                },
                tiempos: {
                    ...pedido.tiempos,
                    empaquetado: tiempoEmpaquetado,
                },
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Avanzado a Reparto",
                        detalle: `Pedido movido a Reparto por ${currentUser?.email || "sistema"}`,
                    },
                ],
                updatedAt: new Date(),
            }

            await mockFirestore.doc("pedidos", pedido.id).update(updates)
            alert(" Pedido movido a Reparto!")
            if (pedidoExpandido === pedido.id) {
                setPedidoExpandido(null)
            }
        } catch (error: any) {
            console.error("Error al marcar como listo:", error)
            alert("Error al completar el empaquetado: " + error.message)
        }
    }

    // Marcar como listo (desde modal)
    const handleMarcarListo = async () => {
        if (!pedidoExpandido) return

        const pedido = pedidosEnEmpaquetado.find((p: any) => p.id === pedidoExpandido)
        if (!pedido) return

        // Crear pedido temporal con datos del formulario
        const pedidoTemporal = {
            ...pedido,
            empaquetado: {
                ...pedido.empaquetado,
                operador: formDataExpandido.operador,
                operadorNombre: formDataExpandido.operador,
                estado: formDataExpandido.estado || "LISTO",
            },
        }

        await handleMarcarListoConPedido(pedidoTemporal)
    }

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-teal-500" /> Empaquetado</h2>
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
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">PAUSADO</p>
                        <p className="text-xl font-semibold text-red-600">{resumenActual.pausado}</p>
                    </div>
                </div>

                {/* Resumen Histórico */}
                <div className="w-full max-w-5xl glass-box rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 bg-teal-600 text-white px-4 py-2 rounded-lg">
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
                            <thead className="bg-teal-500 text-white font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">Operador</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Salida</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Entrada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {resumenHistorico.map((item: any, idx: any) => (
                                    <tr key={idx} className={item.nombre === "TERMINADOS" || item.nombre === "INGRESADOS" ? "bg-teal-50/80 font-semibold text-slate-800" : ""}>
                                        <td className="px-3 py-2 text-slate-900">{item.nombre}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.salida}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.entrada}</td>
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
                etapaId="empaquetado"
                etapaNombre="Empaquetado"
                onSave={() => setConfigVersion(v => v + 1)}
            />

            {/* Tabla resumida */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">Pedidos en Empaquetado</h3>
                    {pedidosFiltrados.length > itemsPerPage && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, pedidosFiltrados.length)} de {pedidosFiltrados.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {currentPage} de {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="glass-box rounded-2xl border-l-4 border-l-teal-500 overflow-hidden">
                    <div className="min-w-0 overflow-hidden">
                        <table className="resumen-table w-full table-fixed max-w-full">
                        <thead className="bg-teal-500 text-white font-semibold border-b border-teal-600">
                            <tr>
                                {columnasVisibles.map((columna: any) => (
                                    <th
                                        key={columna.id}
                                        className={`px-2 py-2 text-left text-xs font-semibold text-white uppercase whitespace-normal align-top ${getAnchoColumnaEtapa(columna.campo)}`}
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
                                    No hay pedidos en empaquetado
                                </td>
                            </tr>
                        ) : (
                            pedidosPaginados.map((pedido: any) => (
                                <React.Fragment key={pedido.id}>
                                    <tr
                                        className={cn(
                                            "hover:bg-teal-50/70 cursor-pointer text-slate-800",
                                            pedidoExpandido === pedido.id && "bg-teal-50"
                                        )}
                                        onClick={(e) => handleClickFila(e, pedido)}
                                    >
                                        {columnasVisibles.map((columna: any) => {
                                            const valor = obtenerValorColumna(columna, pedido)
                                            const esEditable = columna.editable
                                            const esOperador = columna.campo === "empaquetado.operador"
                                            const esEstado = columna.campo === "empaquetado.estado"
                                            const isProductos = columna.campo === "productos"
                                            const isObservacionOrUrl = columna.campo === "diseño.urlImagen" || columna.campo === "observacion"

                                            return (
                                                <td
                                                    key={columna.id}
                                                    className={`px-2 py-2 text-sm text-slate-700 align-top ${getAnchoColumnaEtapa(columna.campo)} ${isProductos ? "break-words whitespace-normal" : ""}`}
                                                    onClick={esEditable ? (e: any) => e.stopPropagation() : undefined}
                                                >
                                                    {esEditable && esOperador ? (
                                                        <EditableCell
                                                            value={pedido.empaquetado?.operador || ""}
                                                            onChange={async (valor: any) => {
                                                                await handleGuardarCampo(pedido.id, "operador", valor, "empaquetado", currentUser)
                                                                await handleGuardarCampo(pedido.id, "operadorNombre", valor, "empaquetado", currentUser)
                                                            }}
                                                            type="select"
                                                            options={Array.isArray(mockDatabase.configuracion?.operarios) ? mockDatabase.configuracion.operarios : operariosDefault}
                                                        />
                                                    ) : esEditable && esEstado ? (
                                                        <EditableCell
                                                            value={pedido.empaquetado?.estado || "EMPAQUETADO"}
                                                            onChange={async (valor: any) => {
                                                                await handleGuardarCampo(pedido.id, "estado", valor, "empaquetado", currentUser)
                                                                if (valor === "LISTO") {
                                                                    const pedidoActualizado = pedidosEnEmpaquetado.find((p: any) => p.id === pedido.id) || pedido
                                                                    await handleMarcarListoDirecto(pedidoActualizado)
                                                                }
                                                            }}
                                                            type="select"
                                                            options={columna.opciones || ["PAUSADO", "EMPAQUETADO", "LISTO"]}
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
                                                    ) : isObservacionOrUrl ? (
                                                        <span className="block truncate max-w-full" title={String(valor || "")}>{valor || "-"}</span>
                                                    ) : isProductos ? (
                                                        <span className="block break-words whitespace-normal max-w-full">{valor || "-"}</span>
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
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Empaquetado - Pedido #{pedido.id}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1">Operador</label>
                                                            <select
                                                                value={formDataExpandido.operador}
                                                                onChange={(e: any) =>
                                                                    setFormDataExpandido((prev: any) => ({ ...prev, operador: e.target.value }))
                                                                }
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                onClick={(e: any) => e.stopPropagation()}
                                                            >
                                                                <option value="">Seleccionar operador</option>
                                                                {(Array.isArray(mockDatabase.configuracion?.operarios) ? mockDatabase.configuracion.operarios : operariosDefault).map((op: any) => (
                                                                    <option key={op} value={op}>
                                                                        {op}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                                            <select
                                                                value={formDataExpandido.estado || "EMPAQUETADO"}
                                                                onChange={(e: any) =>
                                                                    setFormDataExpandido((prev: any) => ({ ...prev, estado: e.target.value }))
                                                                }
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                onClick={(e: any) => e.stopPropagation()}
                                                            >
                                                                <option value="PAUSADO">Pausado</option>
                                                                <option value="EMPAQUETADO">Empaquetado</option>
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
                                                        {formDataExpandido.estado === "LISTO" && (
                                                            <Button
                                                                variant="success"
                                                                onClick={(e: any) => {
                                                                    e.stopPropagation()
                                                                    handleMarcarListo()
                                                                }}
                                                                iconLeft={<CheckCircle2 className="w-4 h-4" />}
                                                            >
                                                                Avanzar a Reparto
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
        </div>
    )
}
export const EmpaquetadoTab = React.memo(EmpaquetadoTabComponent)
