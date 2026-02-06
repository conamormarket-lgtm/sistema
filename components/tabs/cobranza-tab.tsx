
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-firebase"
import { parseMontoRobust, formatMoneyStrict, cuentaComoMostaceroEnResumen } from "../../lib/utils"
import {
    evaluarCondicionesEntrada,
    verificarStockConDetalle,
    evaluarCondiciones,
    obtenerValorColumna,
    obtenerValorCampo,
    handleGuardarCampo,
    calcularSaldoTotal
} from "../../lib/business-logic"
import { EditableCell } from "../ui/editable-cell"
import { getAnchoColumnaEtapa } from "../../lib/columnas-etapas"

function CobranzaTabComponent() {
    const { currentUser, hasPermission, isMasterAdmin } = useAuth()
    const [pedidosEnCobranza, setPedidosEnCobranza] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null)
    const [pageBySeccion, setPageBySeccion] = useState<{ [key: string]: number }>({ limaCallao: 1, provincia: 1 })
    const itemsPerPage = 10
    const [searchTerm, setSearchTerm] = useState("")
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "", // Sin filtro por defecto para mostrar todos los pedidos
        fechaHasta: "",
    })
    const [formDataExpandido, setFormDataExpandido] = useState({
        pago1: 0,
        pago2: 0,
        accion: "",
        fechaEnvio: "",
        linkWhatsapp: "",
    })

    // Obtener columnas visibles y ordenadas para esta etapa
    const columnasVisibles = useMemo(() => {
        const config = mockDatabase.columnasConfig?.cobranza || {}
        const ordenGuardado = config.orden || []

        // Obtener todas las columnas
        const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)

        // Filtrar y ordenar según configuración (en cobranza no se muestra URL del diseño ni Estado General)
        const columnasFiltradas = todasColumnas
            .filter((col: any) => col.campo !== "diseño.urlImagen")
            .filter((col: any) => col.campo !== "estadoGeneral")
            .filter((col: any) => {
                // Si hay configuración guardada, usar esa
                if (config[col.campo] !== undefined) {
                    return config[col.campo]
                }
                // Si no hay configuración, mostrar columnas básicas y de cobranza por defecto
                if (Object.keys(config).length === 0 || !config.orden) {
                    // Primera vez: mostrar columnas básicas y de cobranza
                    return col.visible === true ||
                        col.categoria === "basico" ||
                        col.categoria === "cobranza"
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

        // Si no hay columnas visibles, mostrar al menos las básicas (sin URL diseño)
        if (columnasFiltradas.length === 0) {
            return todasColumnas
                .filter((col: any) => col.campo !== "diseño.urlImagen")
                .filter((col: any) => col.campo !== "estadoGeneral")
                .filter((col: any) =>
                    col.categoria === "basico" ||
                    col.categoria === "cobranza" ||
                    col.visible === true
                ).slice(0, 15) // Limitar a 15 columnas básicas
        }

        return columnasFiltradas
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.cobranza])


    useEffect(() => {
        // Al montar, cargar lista desde la fuente de verdad de inmediato para que se muestre al abrir la pestaña
        setPedidosEnCobranza((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Cobranza"))

        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot(async (snapshot: any) => {
            const pedidos = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
            let enCobranza = pedidos.filter((p: any) => p.estadoGeneral === "En Cobranza")

            // Evaluar condiciones de entrada para cada pedido en cobranza
            const etapaCobranza = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "cobranza"
            )

            if (etapaCobranza && etapaCobranza.condicionesEntrada && etapaCobranza.condicionesEntrada.length > 0) {
                for (const pedido of enCobranza) {
                    const resultado = evaluarCondicionesEntrada(etapaCobranza.id, pedido)
                    if (resultado.debeSaltar && resultado.etapaDestinoId) {
                        // Saltar automáticamente a la etapa destino
                        const etapaDestino = mockDatabase.etapas.find((e: any) => e.id === resultado.etapaDestinoId)
                        if (etapaDestino) {
                            // Si el destino es Preparación, verificar stock para determinar el estado exacto
                            let nuevoEstado = `En ${etapaDestino.nombre}`
                            let nuevoStatus = etapaDestino.moduloPermisos || "preparacion"

                            if (etapaDestino.moduloPermisos === "preparacion") {
                                // Buscar condición de stock en las condiciones de entrada para usar el inventario correcto
                                const condicionStock = etapaCobranza.condicionesEntrada.find((c: any) =>
                                    c.tipo === "hay_stock" || c.tipo === "no_hay_stock"
                                )
                                const inventarioId = condicionStock?.parametros?.inventarioId || null

                                // Verificar si hay inventario configurado
                                if (!inventarioId || inventarioId.trim() === "") {
                                    // NO hay inventario configurado - poner en Pausa por Stock
                                    nuevoEstado = "En Pausa por Stock"
                                } else {
                                    // Hay inventario configurado - verificar stock
                                    const resultadoStock = verificarStockConDetalle(pedido, inventarioId)
                                    nuevoEstado = resultadoStock.tieneStock ? "Listo para Preparar" : "En Pausa por Stock"
                                }
                            }

                            await mockFirestore.doc("pedidos", pedido.id).update({
                                estadoGeneral: nuevoEstado,
                                status: nuevoStatus,
                                cobranza: {
                                    ...pedido.cobranza,
                                    fechaEntrada: pedido.cobranza?.fechaEntrada || new Date(),
                                    fechaSalida: new Date(),
                                    estado: "Saltado automáticamente",
                                },
                                [nuevoStatus]: {
                                    ...pedido[nuevoStatus],
                                    fechaEntrada: new Date(),
                                },
                                historialModificaciones: [
                                    ...(pedido.historialModificaciones || []),
                                    {
                                        timestamp: new Date(),
                                        usuarioId: "system",
                                        usuarioEmail: "system",
                                        accion: "Saltado automáticamente desde Cobranza",
                                        detalle: `Pedido saltado automáticamente a ${nuevoEstado} por cumplir condiciones de entrada (no debe nada${nuevoEstado.includes("Pausa") ? ", sin stock" : ", con stock"})`,
                                    },
                                ],
                                updatedAt: new Date(),
                            })
                        }
                    }
                }
            }

            // Siempre actualizar desde la fuente de verdad para evitar desfase visual (snapshot vs DB)
            setPedidosEnCobranza((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Cobranza"))
        })
        return () => unsubscribe()
    }, [])

    // Filtrar pedidos por rango de fechas y búsqueda
    const pedidosFiltrados = useMemo(() => {
        let list = pedidosEnCobranza
        if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
            list = list.filter((pedido: any) => {
                const fechaEntrada = pedido.cobranza?.fechaEntrada
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
    }, [pedidosEnCobranza, filtrosFecha, searchTerm])

    useEffect(() => {
        setPageBySeccion({ limaCallao: 1, provincia: 1 })
    }, [searchTerm, filtrosFecha.fechaDesde, filtrosFecha.fechaHasta])

    // Separar Lima/Callao vs Provincia
    const pedidosLimaCallao = useMemo(() => {
        return pedidosFiltrados.filter((p: any) => {
            const provincia = (p.envioProvincia || p.clienteProvincia || "").trim().toUpperCase()
            return provincia === "LIMA" || provincia === "CALLAO"
        })
    }, [pedidosFiltrados])

    const pedidosProvincia = useMemo(() => {
        return pedidosFiltrados.filter((p: any) => {
            const provincia = (p.envioProvincia || p.clienteProvincia || "").trim().toUpperCase()
            return provincia !== "LIMA" && provincia !== "CALLAO"
        })
    }, [pedidosFiltrados])

    // Resumen Actual
    const resumenActual = useMemo(() => {
        const totales = pedidosEnCobranza.length
        const mostaceros = pedidosEnCobranza.filter(cuentaComoMostaceroEnResumen).length
        const generales = totales - mostaceros
        const totalDeuda = pedidosEnCobranza.reduce((sum: any, p: any) => {
            const saldo = calcularSaldoTotal(p)
            return sum + (saldo > 0 ? saldo : 0)
        }, 0)
        const deudaMostaceros = pedidosEnCobranza
            .filter(cuentaComoMostaceroEnResumen)
            .reduce((sum: any, p: any) => {
                const saldo = calcularSaldoTotal(p)
                return sum + (saldo > 0 ? saldo : 0)
            }, 0)
        const deudaGenerales = totalDeuda - deudaMostaceros
        return { totales, mostaceros, generales, totalDeuda, deudaMostaceros, deudaGenerales }
    }, [pedidosEnCobranza])

    // Resumen Histórico (si no hay fechas elegidas, usar año en curso por defecto)
    const resumenHistorico = useMemo(() => {
        const hoy = new Date()
        const inicioAnio = new Date(hoy.getFullYear(), 0, 1)
        const fechaInicio = filtrosFecha.fechaDesde
            ? new Date(filtrosFecha.fechaDesde)
            : inicioAnio
        const fechaFin = filtrosFecha.fechaHasta
            ? new Date(filtrosFecha.fechaHasta + "T23:59:59")
            : new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

        const todosPedidos = mockDatabase.pedidos.filter((p: any) => {
            const fechaEntrada = p.cobranza?.fechaEntrada
            if (!fechaEntrada) return false
            const entrada = new Date(fechaEntrada)
            return entrada >= fechaInicio && entrada <= fechaFin
        })

        const totales = {
            cantidad: todosPedidos.length,
            deuda: todosPedidos.reduce((sum: any, p: any) => {
                const saldo = calcularSaldoTotal(p)
                return sum + (saldo > 0 ? saldo : 0)
            }, 0),
            pagado: todosPedidos.reduce((sum: any, p: any) => {
                const saldo = calcularSaldoTotal(p)
                return sum + (saldo <= 0 ? p.montoTotal : p.montoAdelanto + (p.cobranza?.pago1 || 0) + (p.cobranza?.pago2 || 0))
            }, 0),
            faltante: 0,
        }
        totales.faltante = totales.deuda

        return { totales }
    }, [filtrosFecha])

    const handleClickFila = (e: React.MouseEvent, pedido: any) => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) return
        handleExpandirPedido(pedido)
    }

    const handleExpandirPedido = (pedido: any) => {
        setPedidoExpandido(pedido.id)
        setFormDataExpandido({
            pago1: pedido.cobranza?.pago1 || 0,
            pago2: pedido.cobranza?.pago2 || 0,
            accion: pedido.cobranza?.accion || "",
            fechaEnvio: pedido.fechaEnvio || "",
            linkWhatsapp: pedido.linkWhatsapp || "",
        })
    }

    const handleAvanzarAPreparacion = async (pedido: any) => {
        // Buscar la etapa de cobranza
        const etapaCobranza = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "cobranza"
        )

        // Obtener el pedido actualizado con los últimos datos de cobranza
        const pedidoActualizado = {
            ...pedido,
            cobranza: {
                ...pedido.cobranza,
                pago1: formDataExpandido.pago1 || pedido.cobranza?.pago1 || 0,
                pago2: formDataExpandido.pago2 || pedido.cobranza?.pago2 || 0,
            },
        }

        // Evaluar condiciones de salida si están configuradas
        if (etapaCobranza && etapaCobranza.condicionesSalida && etapaCobranza.condicionesSalida.length > 0) {
            // Filtrar condiciones que no sean de stock (el stock se verifica después)
            const condicionesSinStock = etapaCobranza.condicionesSalida.filter((c: any) =>
                c.tipo !== "hay_stock" && c.tipo !== "no_hay_stock"
            )

            if (condicionesSinStock.length > 0) {
                const resultado = evaluarCondiciones(condicionesSinStock, pedidoActualizado)
                if (!resultado.cumplidas) {
                    alert(
                        "ACCIÓN DETENIDA: No se cumplen todas las condiciones requeridas para salir de Cobranza:\n\n" +
                        resultado.condicionesFaltantes.map((c: string) => `- ${c}`).join("\n")
                    )
                    return
                }
            }
        }

        // SIEMPRE verificar stock antes de avanzar
        let tieneStock = false
        let inventarioId = null
        let mensajeStock = ""

        // Buscar condición de stock en las condiciones de salida para obtener el inventario correcto
        if (etapaCobranza && etapaCobranza.condicionesSalida && etapaCobranza.condicionesSalida.length > 0) {
            const condicionStock = etapaCobranza.condicionesSalida.find((c: any) =>
                c.tipo === "hay_stock" || c.tipo === "no_hay_stock"
            )
            if (condicionStock) {
                inventarioId = condicionStock.parametros?.inventarioId || null
            }
        }

        // Verificar si hay inventario configurado
        if (!inventarioId || inventarioId.trim() === "") {
            // NO hay inventario configurado - poner en Pausa por Stock
            tieneStock = false
            mensajeStock = " ACCIÓN DETENIDA: No se ha configurado un inventario en las condiciones de salida de Cobranza. El pedido se ha movido a 'En Pausa por Stock'. Por favor, configure el inventario en la gestión de flujos."
        } else {
            // Hay inventario configurado - verificar stock
            const resultadoStock = verificarStockConDetalle(pedidoActualizado, inventarioId)
            tieneStock = resultadoStock.tieneStock

            if (!tieneStock) {
                if (resultadoStock.razon === "no_encontrado") {
                    mensajeStock = ` ACCIÓN DETENIDA: No se encontraron las prendas del pedido en el inventario "${inventarioId}". El pedido se ha movido a 'En Pausa por Stock'.`
                } else if (resultadoStock.razon === "sin_stock") {
                    mensajeStock = ` ACCIÓN DETENIDA: Stock insuficiente en el inventario "${inventarioId}". El pedido se ha movido a 'En Pausa por Stock'.`
                } else {
                    mensajeStock = ` ACCIÓN DETENIDA: No hay stock disponible en el inventario "${inventarioId}". El pedido se ha movido a 'En Pausa por Stock'.`
                }
            } else {
                mensajeStock = ` Hay Stock disponible en el inventario "${inventarioId}". Añadido a preparación exitosamente.`
            }
        }

        const nuevoEstado = tieneStock ? "Listo para Preparar" : "En Pausa por Stock"
        const fechaSalida = new Date()
        const fechaEntradaCobranza = pedido.cobranza?.fechaEntrada
            ? new Date(pedido.cobranza.fechaEntrada)
            : fechaSalida
        const tiempoCobranza = (fechaSalida.getTime() - fechaEntradaCobranza.getTime()) / (1000 * 60 * 60)

        const updates = {
            estadoGeneral: nuevoEstado,
            status: "preparacion",
            cobranza: {
                ...pedido.cobranza,
                fechaSalida: fechaSalida,
                estado: "Pagado",
            },
            preparacion: {
                ...pedido.preparacion,
                fechaEntrada: new Date(),
            },
            tiempos: {
                ...pedido.tiempos,
                cobranza: tiempoCobranza,
            },
            historialModificaciones: [
                ...(pedido.historialModificaciones || []),
                {
                    timestamp: new Date(),
                    usuarioId: currentUser?.uid || "system",
                    usuarioEmail: currentUser?.email || "system",
                    accion: "Avanzado a Preparación",
                    detalle: `Pedido movido a ${nuevoEstado} por ${currentUser?.email || "sistema"}`,
                },
            ],
            updatedAt: new Date(),
        }

        await mockFirestore.doc("pedidos", pedido.id).update(updates)
        alert(mensajeStock)
        setPedidoExpandido(null)
    }

    const handleAvanzarAPreparacionDirecto = async (pedido: any) => {
        // Obtener el pedido actualizado
        const pedidoActualizado = pedidosEnCobranza.find((p: any) => p.id === pedido.id) || pedido
        await handleAvanzarAPreparacion(pedidoActualizado)
    }

    const handleGuardarCambios = async () => {
        if (!pedidoExpandido) return

        try {
            const pedido = pedidosEnCobranza.find((p: any) => p.id === pedidoExpandido)
            if (!pedido) return

            const nuevoSaldo = calcularSaldoTotal({
                ...pedido,
                cobranza: {
                    ...pedido.cobranza,
                    pago1: formDataExpandido.pago1,
                    pago2: formDataExpandido.pago2,
                },
            })

            let estadoPago = "Pendiente"
            if (nuevoSaldo <= 0) {
                estadoPago = "Pagado"
            } else if (formDataExpandido.pago1 > 0 || formDataExpandido.pago2 > 0) {
                estadoPago = "Abonado"
            }

            const updates = {
                cobranza: {
                    ...pedido.cobranza,
                    pago1: formDataExpandido.pago1,
                    pago2: formDataExpandido.pago2,
                    accion: formDataExpandido.accion,
                    estado: estadoPago,
                },
                montoPendiente: nuevoSaldo,
                fechaEnvio: formDataExpandido.fechaEnvio || null,
                linkWhatsapp: formDataExpandido.linkWhatsapp,
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Cobranza Actualizada",
                        detalle: `Pagos actualizados. Nuevo saldo: S/ ${formatMoneyStrict(nuevoSaldo)}`,
                    },
                ],
                updatedAt: new Date(),
            }

            await mockFirestore.doc("pedidos", pedidoExpandido).update(updates)

            // Si el saldo es 0 o menor, preguntar si avanzar a Preparación
            if (nuevoSaldo <= 0) {
                const avanzar = confirm(
                    `El saldo para el pedido #${pedido.id} es S/ ${formatMoneyStrict(nuevoSaldo)}. ¿Deseas verificar el stock para moverlo a 'Preparación'?`
                )
                if (avanzar) {
                    // Usar el pedido actualizado con los pagos guardados
                    const pedidoActualizado = {
                        ...pedido,
                        cobranza: {
                            ...pedido.cobranza,
                            pago1: formDataExpandido.pago1,
                            pago2: formDataExpandido.pago2,
                            estado: estadoPago,
                        },
                        montoPendiente: nuevoSaldo,
                    }
                    await handleAvanzarAPreparacion(pedidoActualizado)
                }
            }

            alert("Cambios guardados exitosamente")
        } catch (error: any) {
            console.error("Error al guardar cambios:", error)
            alert("Error al guardar los cambios: " + error.message)
        }
    }

    const renderTablaPedidos = (pedidos: any[], titulo: string, seccionKey: string) => {
        const totalPages = Math.max(1, Math.ceil(pedidos.length / itemsPerPage))
        const currentPage = pageBySeccion[seccionKey] ?? 1
        const startIndex = (Math.min(currentPage, totalPages) - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const pedidosAMostrar = pedidos.slice(startIndex, endIndex)

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{titulo}</h3>
                    {pedidos.length > itemsPerPage && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, pedidos.length)} de {pedidos.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPageBySeccion(prev => ({ ...prev, [seccionKey]: Math.max(1, (prev[seccionKey] ?? 1) - 1) }))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {currentPage} de {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setPageBySeccion(prev => ({ ...prev, [seccionKey]: Math.min(totalPages, (prev[seccionKey] ?? 1) + 1) }))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="glass-box rounded-2xl border-l-4 border-l-[#408040] min-w-0 overflow-hidden">
                    <table className="resumen-table w-full table-fixed max-w-full">
                        <thead className="bg-[#408040] text-white font-semibold border-b border-green-800">
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
                                        className="px-4 py-8 text-center text-slate-500"
                                    >
                                        No hay pedidos en cobranza
                                    </td>
                                </tr>
                            ) : (
                                pedidosAMostrar.map((pedido: any) => {
                                    const saldo = calcularSaldoTotal(pedido)
                                    return (
                                        <React.Fragment key={pedido.id}>
                                            <tr
                                                className={`hover:bg-green-50/70 cursor-pointer text-slate-800 ${pedidoExpandido === pedido.id ? "bg-green-50" : ""}`}
                                                onClick={(e) => handleClickFila(e, pedido)}
                                            >
                                                {columnasVisibles.map((columna: any) => {
                                                    const valor = obtenerValorColumna(columna, pedido)
                                                    const noEditableEnCobranza = ["montoTotal", "montoAdelanto", "observacion"].includes(columna.campo)
                                                    const esEditable = columna.editable && !noEditableEnCobranza
                                                    const esEstado = columna.campo === "cobranza.estado"
                                                    const esPago = columna.campo?.startsWith("cobranza.pago")
                                                    const isProductos = columna.campo === "productos"
                                                    return (
                                                        <td
                                                            key={columna.id}
                                                            className={`px-2 py-2 text-sm text-slate-700 align-top ${getAnchoColumnaEtapa(columna.campo)} ${isProductos ? "break-words whitespace-normal" : ""}`}
                                                            onClick={esEditable ? (e: any) => e.stopPropagation() : undefined}
                                                        >
                                                            {esEditable && esPago ? (
                                                                <EditableCell
                                                                    value={obtenerValorCampo(pedido, columna.campo) || 0}
                                                                    onChange={async (valor: any) => {
                                                                        const valorNum = parseMontoRobust(valor) || 0
                                                                        const campoPago = columna.campo.split(".")[1] // "pago1", "pago2", etc.
                                                                        await handleGuardarCampo(pedido.id, campoPago, valorNum, "cobranza", currentUser)
                                                                        // Recalcular saldo y estado
                                                                        const pedidoActualizado = {
                                                                            ...pedido,
                                                                            cobranza: {
                                                                                ...pedido.cobranza,
                                                                                [campoPago]: valorNum,
                                                                            },
                                                                        }
                                                                        const nuevoSaldo = calcularSaldoTotal(pedidoActualizado)
                                                                        let nuevoEstado = "Pendiente"
                                                                        if (nuevoSaldo <= 0) {
                                                                            nuevoEstado = "Pagado"
                                                                        } else if (valorNum > 0) {
                                                                            nuevoEstado = "Abonado"
                                                                        }
                                                                        await handleGuardarCampo(pedido.id, "estado", nuevoEstado, "cobranza", currentUser)
                                                                        await handleGuardarCampo(pedido.id, "montoPendiente", nuevoSaldo, null, currentUser)
                                                                    }}
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                />
                                                            ) : esEditable && esEstado ? (
                                                                <EditableCell
                                                                    value={saldo <= 0 ? "Pagado" : (pedido.cobranza?.pago1 > 0 || pedido.cobranza?.pago2 > 0 ? "Abonado" : "Pendiente")}
                                                                    onChange={async (valor: any) => {
                                                                        await handleGuardarCampo(pedido.id, "estado", valor, "cobranza", currentUser)
                                                                        // Si se selecciona "Pagado", avanzar automáticamente
                                                                        if (valor === "Pagado") {
                                                                            const pedidoActualizado = pedidosEnCobranza.find((p: any) => p.id === pedido.id)
                                                                            if (pedidoActualizado) {
                                                                                await handleAvanzarAPreparacionDirecto(pedidoActualizado)
                                                                            }
                                                                        }
                                                                    }}
                                                                    type="select"
                                                                    options={columna.opciones || ["Pendiente", "Abonado", "Pagado"]}
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
                                                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalles de Cobranza - Pedido #{pedido.id}</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pago 1</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={formDataExpandido.pago1}
                                                                        onChange={(e: any) =>
                                                                            setFormDataExpandido((prev: any) => ({ ...prev, pago1: parseMontoRobust(e.target.value) || 0 }))
                                                                        }
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pago 2</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={formDataExpandido.pago2}
                                                                        onChange={(e: any) =>
                                                                            setFormDataExpandido((prev: any) => ({ ...prev, pago2: parseMontoRobust(e.target.value) || 0 }))
                                                                        }
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Acción Realizada</label>
                                                                    <input
                                                                        type="text"
                                                                        value={formDataExpandido.accion}
                                                                        onChange={(e: any) =>
                                                                            setFormDataExpandido((prev: any) => ({ ...prev, accion: e.target.value }))
                                                                        }
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                                        placeholder="Ej: Llamada realizada..."
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                                                                <button
                                                                    onClick={() => setPedidoExpandido(null)}
                                                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={handleGuardarCambios}
                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                                                >
                                                                    Guardar Cambios
                                                                </button>
                                                            </div>
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
            </div>
        )
    }

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-[#408040]" /> Gestión de Cobranza</h2>
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
                </div>
            </div>

            {/* Resúmenes: tarjetas centradas según cantidad */}
            <div className="flex flex-col items-center gap-6 mb-6">
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Total Pedidos</p>
                        <p className="text-2xl font-bold text-slate-900">{resumenActual.totales}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Deuda Total</p>
                        <p className="text-2xl font-bold text-red-600">S/ {formatMoneyStrict(resumenActual.totalDeuda)}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Deuda Mostaceros</p>
                        <p className="text-lg font-semibold text-slate-700">S/ {formatMoneyStrict(resumenActual.deudaMostaceros)}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Deuda General</p>
                        <p className="text-lg font-semibold text-slate-700">S/ {formatMoneyStrict(resumenActual.deudaGenerales)}</p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Total Procesados</p>
                        <p className="text-2xl font-bold text-slate-900">{resumenHistorico.totales.cantidad}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Total Cobrado</p>
                        <p className="text-2xl font-bold text-green-600">S/ {formatMoneyStrict(resumenHistorico.totales.pagado)}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">Pendiente Histórico</p>
                        <p className="text-2xl font-bold text-red-600">S/ {formatMoneyStrict(resumenHistorico.totales.deuda)}</p>
                    </div>
                </div>
            </div>

            {/* Tablas de Pedidos */}
            {renderTablaPedidos(pedidosLimaCallao, "Lima y Callao", "limaCallao")}
            {renderTablaPedidos(pedidosProvincia, "Provincias", "provincia")}
        </div>
    )
}
export const CobranzaTab = React.memo(CobranzaTabComponent)
