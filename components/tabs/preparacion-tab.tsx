"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronDown, ChevronUp, SlidersHorizontal, Save, CheckCircle2, X, Eye, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-firebase"
import { operariosDefault } from "../../lib/constants"
import {
    verificarStockConDetalle,
    evaluarCondiciones,
    reducirStockDeInventario,
    obtenerValorColumna,
    handleGuardarCampo
} from "../../lib/business-logic"
import { obtenerValorCampo } from "../../lib/mock-firebase"
import { Button } from "../ui/button"
import { EditableCell } from "../ui/editable-cell"
import { ConfigColumnasEtapaModal } from "../modals/config-columnas-etapa-modal"
import { getAnchoColumnaEtapa } from "../../lib/columnas-etapas"

function PreparacionTabComponent() {
    const { currentUser, hasPermission, isMasterAdmin } = useAuth()
    const [pedidosListos, setPedidosListos] = useState<any[]>([])
    const [pedidosEnPausa, setPedidosEnPausa] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<any>(null)
    const [pageBySeccion, setPageBySeccion] = useState<{ [key: string]: number }>({ listos: 1, pausa: 1 })
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

        const config = mockDatabase.columnasConfig?.preparacion || {}
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
                // Si no hay configuración, mostrar columnas básicas y de preparación por defecto
                if (Object.keys(config).length === 0 || !config.orden) {
                    // Primera vez: mostrar columnas básicas y de preparación
                    return col.visible === true ||
                        col.categoria === "basico" ||
                        col.categoria === "preparacion"
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
                col.categoria === "preparacion" ||
                col.visible === true
            ).slice(0, 15) // Limitar a 15 columnas básicas
        }

        return columnasFiltradas
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.preparacion, configVersion])

    // Mapa de visibilidad para acceso rápido
    const columnasVisiblesMap = useMemo(() => {
        if (Array.isArray(columnasVisibles)) {
            return columnasVisibles.reduce((acc: any, col: any) => {
                acc[col.campo] = true
                return acc
            }, {})
        }
        return {}
    }, [columnasVisibles])

    useEffect(() => {
        const pedidos = mockDatabase.pedidos || []
        setPedidosListos(pedidos.filter((p: any) => p.estadoGeneral === "Listo para Preparar"))
        setPedidosEnPausa(pedidos.filter((p: any) => p.estadoGeneral === "En Pausa por Stock"))
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot(() => {
            const p = mockDatabase.pedidos || []
            setPedidosListos(p.filter((x: any) => x.estadoGeneral === "Listo para Preparar"))
            setPedidosEnPausa(p.filter((x: any) => x.estadoGeneral === "En Pausa por Stock"))
        })
        return () => unsubscribe()
    }, [])

    // Función para revisar pedidos en pausa y moverlos a "Listo para Preparar" si tienen stock
    const revisarPedidosEnPausa = useCallback(async () => {
        // Obtener todos los pedidos en pausa directamente de la base de datos para tener los datos más actualizados
        const pedidosEnPausaActuales = mockDatabase.pedidos.filter((p: any) => p.estadoGeneral === "En Pausa por Stock")

        if (pedidosEnPausaActuales.length === 0) {
            return { actualizados: 0, pedidosIds: [], mensaje: "No hay pedidos en pausa por stock para revisar." }
        }

        // Buscar la etapa de cobranza para obtener el inventario configurado
        const etapaCobranza = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "cobranza"
        )

        let inventarioId = null
        if (etapaCobranza && etapaCobranza.condicionesSalida && etapaCobranza.condicionesSalida.length > 0) {
            const condicionStock = etapaCobranza.condicionesSalida.find((c: any) =>
                c.tipo === "hay_stock" || c.tipo === "no_hay_stock"
            )
            if (condicionStock) {
                inventarioId = condicionStock.parametros?.inventarioId || null
            }
        }

        // Si no hay inventario configurado, no hacer nada
        if (!inventarioId || inventarioId.trim() === "") {
            return { actualizados: 0, pedidosIds: [], mensaje: " No hay inventario configurado en las condiciones de salida de Cobranza. Configure el inventario en la gestión de flujos." }
        }

        let pedidosActualizados = 0
        const pedidosActualizadosIds = []

        // Revisar cada pedido en pausa
        for (const pedido of pedidosEnPausaActuales) {
            const resultadoStock = verificarStockConDetalle(pedido, inventarioId)

            // Si ahora tiene stock, moverlo a "Listo para Preparar"
            if (resultadoStock.tieneStock) {
                await mockFirestore.doc("pedidos", pedido.id).update({
                    estadoGeneral: "Listo para Preparar",
                    preparacion: {
                        ...pedido.preparacion,
                        fechaEntrada: pedido.preparacion?.fechaEntrada || new Date(),
                    },
                    historialModificaciones: [
                        ...(pedido.historialModificaciones || []),
                        {
                            timestamp: new Date(),
                            usuarioId: "system",
                            usuarioEmail: "system",
                            accion: "Movido automáticamente a Listo para Preparar",
                            detalle: `El pedido fue movido automáticamente porque ahora hay stock disponible en el inventario "${inventarioId}".`,
                        },
                    ],
                    updatedAt: new Date(),
                })
                pedidosActualizados++
                pedidosActualizadosIds.push(pedido.id)
            }
        }

        // Construir mensaje según cantidad de pedidos actualizados
        let mensaje = ""
        if (pedidosActualizados === 0) {
            mensaje = `No se encontraron pedidos con stock disponible para mover. Los pedidos en pausa aún no tienen stock en el inventario "${inventarioId}".`
        } else if (pedidosActualizados === 1) {
            mensaje = ` El pedido #${pedidosActualizadosIds[0]} fue movido a "Listo para Preparar" porque ahora tiene stock disponible en el inventario "${inventarioId}".`
        } else {
            const idsTexto = pedidosActualizadosIds.join(", #")
            mensaje = ` Se movieron ${pedidosActualizados} pedidos a "Listo para Preparar" porque ahora tienen stock disponible.\n\nPedidos actualizados: #${idsTexto}\n\nInventario: "${inventarioId}"`
        }

        return {
            actualizados: pedidosActualizados,
            pedidosIds: pedidosActualizadosIds,
            mensaje: mensaje
        }
    }, [])

    // Revisar automáticamente pedidos en pausa periódicamente
    useEffect(() => {
        let esPrimeraEjecucion = true

        // Ejecutar inmediatamente al cargar (sin alerta)
        revisarPedidosEnPausa().then(() => {
            esPrimeraEjecucion = false
        })

        // Ejecutar periódicamente cada 10 segundos para revisar cambios en el inventario
        const intervalId = setInterval(async () => {
            if (!esPrimeraEjecucion) {
                const resultado = await revisarPedidosEnPausa()
                // Solo mostrar alerta si se actualizaron pedidos
                if (resultado.actualizados > 0) {
                    alert(resultado.mensaje)
                }
            } else {
                esPrimeraEjecucion = false
            }
        }, 10000) // Cada 10 segundos

        return () => clearInterval(intervalId)
    }, [revisarPedidosEnPausa])

    // Filtrar pedidos por rango de fechas y búsqueda
    const filterByFechaYBusqueda = (list: any[], filtros: any) => {
        let out = list
        if (filtros.fechaDesde || filtros.fechaHasta) {
            out = out.filter((pedido: any) => {
                const fechaEntrada = pedido.preparacion?.fechaEntrada
                if (!fechaEntrada) return false
                const fecha = new Date(fechaEntrada)
                if (filtros.fechaDesde && fecha < new Date(filtros.fechaDesde)) return false
                if (filtros.fechaHasta && fecha > new Date(filtros.fechaHasta + "T23:59:59")) return false
                return true
            })
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            out = out.filter((p: any) =>
                p.clienteNombre?.toLowerCase().includes(term) ||
                p.clienteContacto?.includes(searchTerm) ||
                String(p.id || "").toLowerCase().includes(term) ||
                String(p.numeroPedido || "").toLowerCase().includes(term)
            )
        }
        return out
    }
    const pedidosListosFiltrados = useMemo(
        () => filterByFechaYBusqueda(pedidosListos, filtrosFecha),
        [pedidosListos, filtrosFecha, searchTerm]
    )
    const pedidosEnPausaFiltrados = useMemo(
        () => filterByFechaYBusqueda(pedidosEnPausa, filtrosFecha),
        [pedidosEnPausa, filtrosFecha, searchTerm]
    )

    useEffect(() => {
        setPageBySeccion({ listos: 1, pausa: 1 })
    }, [searchTerm, filtrosFecha.fechaDesde, filtrosFecha.fechaHasta])

    // Resumen Actual
    const resumenActual = useMemo(() => {
        const pendientes = pedidosListos.length + pedidosEnPausa.length
        const enProceso = pedidosListos.filter((p: any) => p.preparacion?.estado === "LISTO").length
        const sinAsignar = [...pedidosListos, ...pedidosEnPausa].filter((p: any) => !p.preparacion?.operadorNombre).length
        const faltaStock = pedidosEnPausa.length
        return { pendientes, enProceso, sinAsignar, faltaStock }
    }, [pedidosListos, pedidosEnPausa])

    // Resumen Histórico por Operador
    const resumenHistorico = useMemo(() => {
        const fechaInicio = filtrosFecha.fechaDesde ? new Date(filtrosFecha.fechaDesde) : new Date()
        const fechaFin = filtrosFecha.fechaHasta ? new Date(filtrosFecha.fechaHasta + "T23:59:59") : new Date()

        const todosPedidos = mockDatabase.pedidos.filter((p: any) => {
            const fechaEntrada = p.preparacion?.fechaEntrada
            if (!fechaEntrada) return false
            const entrada = new Date(fechaEntrada)
            return entrada >= fechaInicio && entrada <= fechaFin
        })

        const porOperador: any = {}
        const listaOperadores = Array.isArray(mockDatabase.configuracion?.operarios)
            ? mockDatabase.configuracion.operarios
            : operariosDefault
        listaOperadores.forEach((operador: any) => {
            porOperador[operador] = { entrada: 0, salida: 0 }
        })
        porOperador["SIN ASIGNAR"] = { entrada: 0, salida: 0 }

        todosPedidos.forEach((pedido: any) => {
            const operador = pedido.preparacion?.operadorNombre || "SIN ASIGNAR"
            if (!porOperador[operador]) {
                porOperador[operador] = { entrada: 0, salida: 0 }
            }

            const fechaEntrada = pedido.preparacion?.fechaEntrada
            if (fechaEntrada) {
                const entrada = new Date(fechaEntrada)
                if (entrada >= fechaInicio && entrada <= fechaFin) {
                    porOperador[operador].entrada++
                }
            }

            const fechaSalida = pedido.preparacion?.fechaSalida
            if (fechaSalida) {
                const salida = new Date(fechaSalida)
                if (salida >= fechaInicio && salida <= fechaFin) {
                    porOperador[operador].salida++
                }
            }
        })

        const resumen = Object.entries(porOperador).map(([nombre, datos]: [string, any]) => ({
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

    const handleGuardarConfigColumnas = () => {
        mockDatabase.columnasConfig.preparacion = columnasVisibles
        alert("Configuración de columnas guardada")
        setShowConfigColumnas(false)
    }

    const handleClickFila = (e: React.MouseEvent, pedido: any) => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) return
        handleExpandirPedido(pedido)
    }

    const handleExpandirPedido = (pedido: any) => {
        setPedidoExpandido(pedido.id)
        setFormDataExpandido({
            operador: pedido.preparacion?.operador || "",
            estado: pedido.preparacion?.estado || "",
        })
    }

    const handleGuardarCambios = async () => {
        if (!pedidoExpandido) return

        try {
            const pedido = [...pedidosListos, ...pedidosEnPausa].find((p: any) => p.id === pedidoExpandido)
            if (!pedido) return

            const updates = {
                preparacion: {
                    ...pedido.preparacion,
                    operador: formDataExpandido.operador,
                    operadorNombre: formDataExpandido.operador,
                    estado: formDataExpandido.estado || "EN PROCESO",
                },
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Preparación Actualizada",
                        detalle: `Preparación actualizada por ${currentUser?.email || "sistema"}`,
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
        // Obtener el pedido actualizado
        const pedidoActualizado = [...pedidosListos, ...pedidosEnPausa].find((p: any) => p.id === pedido.id) || pedido
        await handleMarcarListoConPedido(pedidoActualizado)
    }

    // Función interna para marcar como listo con un pedido específico
    const handleMarcarListoConPedido = async (pedido: any) => {
        if (!pedido) return

        // Buscar la etapa de preparación
        const etapaPreparacion = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "preparacion"
        )

        // Evaluar condiciones de salida si están configuradas
        if (etapaPreparacion && etapaPreparacion.condicionesSalida && etapaPreparacion.condicionesSalida.length > 0) {
            const resultado = evaluarCondiciones(etapaPreparacion.condicionesSalida, pedido)
            if (!resultado.cumplidas) {
                alert(
                    "ACCIÓN DETENIDA: No se cumplen todas las condiciones requeridas para salir de Preparación:\n\n" +
                    resultado.condicionesFaltantes.map((c: any) => `- ${c}`).join("\n")
                )
                return
            }
        } else {
            // Validaciones por defecto (retrocompatibilidad)
            if (!pedido.preparacion?.operador || pedido.preparacion.operador.trim() === "") {
                alert("ACCIÓN DETENIDA: Debe asignar un operador antes de avanzar.")
                return
            }
        }

        const confirmar = confirm(
            `¿Enviar el pedido #${pedido.id} a Estampado? Esta acción reducirá el stock del inventario de forma permanente.`
        )
        if (!confirmar) return

        try {
            // Reducir stock del inventario
            const resultadoStock = reducirStockDeInventario(pedido.id)

            if (resultadoStock.exito) {
                const fechaSalida = new Date()
                const fechaEntrada = pedido.preparacion?.fechaEntrada
                    ? new Date(pedido.preparacion.fechaEntrada)
                    : fechaSalida
                const tiempoPreparacion = ((fechaSalida as any) - (fechaEntrada as any)) / (1000 * 60 * 60)

                const updates = {
                    estadoGeneral: "En Estampado",
                    status: "estampado",
                    preparacion: {
                        ...pedido.preparacion,
                        fechaSalida: fechaSalida,
                        estado: "LISTO",
                        operador: pedido.preparacion?.operador || formDataExpandido.operador,
                        operadorNombre: pedido.preparacion?.operadorNombre || pedido.preparacion?.operador || formDataExpandido.operador,
                    },
                    estampado: {
                        ...pedido.estampado,
                        fechaEntrada: new Date(),
                    },
                    tiempos: {
                        ...pedido.tiempos,
                        preparacion: tiempoPreparacion,
                    },
                    historialModificaciones: [
                        ...(pedido.historialModificaciones || []),
                        {
                            timestamp: new Date(),
                            usuarioId: currentUser?.uid || "system",
                            usuarioEmail: currentUser?.email || "system",
                            accion: "Avanzado a Estampado",
                            detalle: `Pedido movido a Estampado por ${currentUser?.email || "sistema"}`,
                        },
                    ],
                    updatedAt: new Date(),
                }

                await mockFirestore.doc("pedidos", pedido.id).update(updates)
                alert(" ¡Éxito! " + resultadoStock.mensaje + "\nEl pedido ha sido movido a Estampado.")
                if (pedidoExpandido === pedido.id) {
                    setPedidoExpandido(null)
                }
            } else {
                alert(" ACCIÓN DETENIDA: " + resultadoStock.mensaje + "\n\nEl pedido NO ha sido movido y se mantendrá en Preparación.")
            }
        } catch (error: any) {
            console.error("Error al marcar como listo:", error)
            alert("Error al completar la preparación: " + error.message)
        }
    }

    // Marcar como listo (desde modal)
    const handleMarcarListo = async () => {
        if (!pedidoExpandido) return

        const pedido = [...pedidosListos, ...pedidosEnPausa].find((p: any) => p.id === pedidoExpandido)
        if (!pedido) return

        // Crear pedido temporal con datos del formulario
        const pedidoTemporal = {
            ...pedido,
            preparacion: {
                ...pedido.preparacion,
                operador: formDataExpandido.operador,
                operadorNombre: formDataExpandido.operador,
                estado: formDataExpandido.estado || "LISTO",
            },
        }

        await handleMarcarListoConPedido(pedidoTemporal)
    }

    const renderTablaPedidos = (pedidos: any[], titulo: any, seccionKey: any) => {
        const totalPages = Math.max(1, Math.ceil(pedidos.length / itemsPerPage))
        const currentPage = pageBySeccion[seccionKey] ?? 1
        const startIndex = (Math.min(currentPage, totalPages) - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const pedidosAMostrar = pedidos.slice(startIndex, endIndex)

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${titulo.includes("PAUSA") ? "text-red-700" : "text-green-700"}`}>
                        {titulo}
                    </h3>
                    {pedidos.length > itemsPerPage && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, pedidos.length)} de {pedidos.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPageBySeccion((prev: any) => ({ ...prev, [seccionKey]: Math.max(1, (prev[seccionKey] ?? 1) - 1) }))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {currentPage} de {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setPageBySeccion((prev: any) => ({ ...prev, [seccionKey]: Math.min(totalPages, (prev[seccionKey] ?? 1) + 1) }))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="glass-box rounded-2xl border-l-4 border-l-[#835378] min-w-0 overflow-hidden">
                    <table className="resumen-table w-full table-fixed max-w-full">
                        <thead className="bg-[#835378] text-white font-semibold border-b border-[#6B4560]">
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
                            {pedidos.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columnasVisibles.length}
                                        className="px-2 py-6 text-center text-slate-500"
                                    >
                                        No hay pedidos en preparación
                                    </td>
                                </tr>
                            ) : (
                                pedidosAMostrar.map((pedido: any) => (
                                    <React.Fragment key={pedido.id}>
                                        <tr
                                            className={`hover:bg-[#E8D4E4]/60 cursor-pointer text-slate-800 ${pedidoExpandido === pedido.id ? "bg-[#E8D4E4]/70" : ""}`}
                                            onClick={(e) => handleClickFila(e, pedido)}
                                        >
                                            {columnasVisibles.map((columna: any) => {
                                                const valor = obtenerValorColumna(columna, pedido)
                                                const esEditable = columna.editable
                                                const esOperador = columna.campo === "preparacion.operador"
                                                const esEstado = columna.campo === "preparacion.estado"
                                                const isProductos = columna.campo === "productos"
                                                return (
                                                    <td
                                                        key={columna.id}
                                                        className={`px-2 py-2 text-sm text-slate-700 align-top ${getAnchoColumnaEtapa(columna.campo)} ${isProductos ? "break-words whitespace-normal" : ""}`}
                                                        onClick={esEditable ? (e: any) => e.stopPropagation() : undefined}
                                                    >
                                                        {esEditable && esOperador ? (
                                                            <EditableCell
                                                                value={pedido.preparacion?.operador || pedido.preparacion?.operadorNombre || ""}
                                                                onChange={async (valor: any) => {
                                                                    await handleGuardarCampo(pedido.id, "operador", valor, "preparacion", currentUser)
                                                                    await handleGuardarCampo(pedido.id, "operadorNombre", valor, "preparacion", currentUser)
                                                                }}
                                                                type="select"
                                                                options={(() => {
                                                                    const lista = Array.isArray(mockDatabase.configuracion?.operarios) ? mockDatabase.configuracion.operarios : operariosDefault
                                                                    const actual = pedido.preparacion?.operador || pedido.preparacion?.operadorNombre
                                                                    if (actual && !lista.includes(actual)) return [actual, ...lista]
                                                                    return lista
                                                                })()}
                                                                placeholder="Seleccionar operador"
                                                            />
                                                        ) : esEditable && esEstado ? (
                                                            <EditableCell
                                                                value={pedido.preparacion?.estado || "EN PROCESO"}
                                                                onChange={async (valor: any) => {
                                                                    await handleGuardarCampo(pedido.id, "estado", valor, "preparacion", currentUser)
                                                                    if (valor === "LISTO") {
                                                                        const pedidoActualizado = [...pedidosListos, ...pedidosEnPausa].find((p: any) => p.id === pedido.id)
                                                                        if (pedidoActualizado) {
                                                                            await handleMarcarListoDirecto(pedidoActualizado)
                                                                        }
                                                                    }
                                                                }}
                                                                type="select"
                                                                options={columna.opciones || ["FALTA IMPRESIÓN", "EN PROCESO", "LISTO"]}
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
                                                        ) : columna.campo === "diseño.urlImagen" || columna.campo === "observacion" ? (
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
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Preparación - Pedido #{pedido.id}</h3>
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
                                                                    value={formDataExpandido.estado || "EN PROCESO"}
                                                                    onChange={(e: any) =>
                                                                        setFormDataExpandido((prev: any) => ({ ...prev, estado: e.target.value }))
                                                                    }
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                    onClick={(e: any) => e.stopPropagation()}
                                                                >
                                                                    <option value="FALTA IMPRESIÓN">Falta impresión</option>
                                                                    <option value="EN PROCESO">En proceso</option>
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
                                                                    Avanzar a Estampado
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
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-[#835378]" /> Preparación</h2>
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
                        <p className="text-sm text-slate-500">FALTA STOCK PRENDA</p>
                        <p className="text-xl font-semibold text-red-600">{resumenActual.faltaStock}</p>
                    </div>
                </div>

                {/* Resumen Histórico */}
                <div className="w-full max-w-5xl glass-box rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 bg-purple-600 text-white px-4 py-2 rounded-lg">
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
                            <thead className="bg-[#835378] text-white font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">Operador</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Entrada</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Salida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {resumenHistorico.map((item: any, idx: any) => (
                                    <tr key={idx} className={item.nombre === "TOTALES" ? "bg-[#E8D4E4]/70 font-semibold text-slate-800" : ""}>
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
                etapaId="preparacion"
                etapaNombre="Preparación"
                onSave={() => setConfigVersion(v => v + 1)}
            />

            {/* Tablas de Pedidos */}
            {renderTablaPedidos(pedidosListosFiltrados, " LISTOS PARA PREPARAR", "listos")}

            {/* Sección de Pedidos en Pausa con botón de revisión */}
            {(() => {
                const pausaTotalPages = Math.max(1, Math.ceil(pedidosEnPausaFiltrados.length / itemsPerPage))
                const pausaCurrentPage = pageBySeccion.pausa ?? 1
                const pausaStart = (Math.min(pausaCurrentPage, pausaTotalPages) - 1) * itemsPerPage
                const pausaEnd = pausaStart + itemsPerPage
                const pedidosEnPausaPaginados = pedidosEnPausaFiltrados.slice(pausaStart, pausaEnd)
                return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-red-700">
                            EN PAUSA POR STOCK
                        </h3>
                        {pedidosEnPausaFiltrados.length > itemsPerPage && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-600">
                                    Mostrando {pausaStart + 1}-{Math.min(pausaEnd, pedidosEnPausaFiltrados.length)} de {pedidosEnPausaFiltrados.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPageBySeccion((prev: any) => ({ ...prev, pausa: Math.max(1, (prev.pausa ?? 1) - 1) }))}
                                        disabled={pausaCurrentPage <= 1}
                                        className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {pausaCurrentPage} de {pausaTotalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPageBySeccion((prev: any) => ({ ...prev, pausa: Math.min(pausaTotalPages, (prev.pausa ?? 1) + 1) }))}
                                        disabled={pausaCurrentPage >= pausaTotalPages}
                                        className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        onClick={async () => {
                            const resultado = await revisarPedidosEnPausa()
                            if (resultado.actualizados > 0) {
                                alert(resultado.mensaje)
                            } else {
                                alert(resultado.mensaje)
                            }
                        }}
                        iconLeft={<RefreshCw className="w-4 h-4" />}
                        disabled={pedidosEnPausa.length === 0}
                    >
                        Revisar Stock Disponible
                    </Button>
                </div>
                {/* Renderizar tabla sin título duplicado */}
                <div className="glass-box rounded-2xl border-l-4 border-l-[#835378] overflow-hidden">
                    <table className="resumen-table w-full">
                        <thead className="bg-[#835378] text-white font-semibold border-b border-[#6B4560]">
                            <tr>
                                {(columnasVisiblesMap?.id) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">#</th>
                                )}
                                {(columnasVisiblesMap?.cliente) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Cliente</th>
                                )}
                                {(columnasVisiblesMap?.productos) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Productos</th>
                                )}
                                {(columnasVisiblesMap?.operador) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Operador</th>
                                )}
                                {(columnasVisiblesMap?.estado) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Estado</th>
                                )}
                                {(columnasVisiblesMap?.acciones) && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {pedidosEnPausaFiltrados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={Object.values(columnasVisibles || {}).filter((v: any) => v !== false).length || 6}
                                        className="px-4 py-8 text-center text-slate-500"
                                    >
                                        No hay pedidos en pausa por stock
                                    </td>
                                </tr>
                            ) : (
                                pedidosEnPausaPaginados.map((pedido: any) => (
                                    <React.Fragment key={pedido.id}>
                                        <tr
                                            className={`hover:bg-[#E8D4E4]/60 cursor-pointer text-slate-800 ${pedidoExpandido === pedido.id ? "bg-[#E8D4E4]/70" : ""}`}
                                            onClick={(e) => handleClickFila(e, pedido)}
                                        >
                                            {(columnasVisiblesMap?.id) && (
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{pedido.id}</td>
                                            )}
                                            {(columnasVisiblesMap?.cliente) && (
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {pedido.clienteNombre} {pedido.clienteApellidos}
                                                </td>
                                            )}
                                            {(columnasVisiblesMap?.productos) && (
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {pedido.productos?.slice(0, 2).map((p: any) => p.productoId).join(", ") || "-"}
                                                </td>
                                            )}
                                            {(columnasVisiblesMap?.operador) && (
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {pedido.preparacion?.operadorNombre || "Sin asignar"}
                                                </td>
                                            )}
                                            {(columnasVisiblesMap?.estado) && (
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {pedido.preparacion?.estado || "EN PROCESO"}
                                                </td>
                                            )}
                                            {(columnasVisiblesMap?.acciones) && (
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex gap-2" onClick={(e: any) => e.stopPropagation()}>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={(e: any) => {
                                                                e.stopPropagation()
                                                                handleExpandirPedido(pedido)
                                                            }}
                                                            iconLeft={<Eye className="w-4 h-4" />}
                                                        >
                                                            Ver
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
                )
            })()}
        </div>
    )
}
export const PreparacionTab = React.memo(PreparacionTabComponent)
