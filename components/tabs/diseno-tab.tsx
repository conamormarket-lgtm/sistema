
import React, { useState, useEffect, useMemo } from "react"
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-firebase"
import { disenadores as disenadoresDefault } from "../../lib/constants"

const getDisenadores = () => (Array.isArray(mockDatabase.configuracion?.disenadores) ? mockDatabase.configuracion.disenadores : disenadoresDefault)
import { parseFechaRobust } from "../../lib/utils"
import {
    validarColorEnTexto,
    evaluarCondiciones,
    calcularSaldoPedido,
    verificarStock,
    obtenerValorColumna,
    updateOrderField,
    handleGuardarCamposEtapa,
} from "../../lib/business-logic"
import { Button } from "../ui/button"
import { Modal } from "../ui/modal"
import { EditableCell } from "../ui/editable-cell"
import { ConfigColumnasEtapaModal } from "../modals/config-columnas-etapa-modal"
import { getAnchoColumnaEtapa } from "../../lib/columnas-etapas"

function DiseñoTabComponent() {
    const { currentUser, hasPermission, isMasterAdmin } = useAuth()
    const [pedidosEnDiseño, setPedidosEnDiseño] = useState<any[]>([])
    const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null)
    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "", // Sin filtro por defecto para mostrar todos los pedidos
        fechaHasta: "",
    })
    const [formDataExpandido, setFormDataExpandido] = useState({
        diseñadorAsignado: "",
        urlImagen: "",
        talla: "",
        notas: "",
    })
    const [showConfigColumnas, setShowConfigColumnas] = useState(false)
    const [configVersion, setConfigVersion] = useState(0)
    const [filtroVista, setFiltroVista] = useState<"todos" | "en_proceso" | "pendiente_sin_diseñador">("todos")
    const [filtroDiseñador, setFiltroDiseñador] = useState("")
    const [pageDiseño, setPageDiseño] = useState(1)
    const itemsPerPageDiseño = 10

    // Resetear página al cambiar filtros
    useEffect(() => {
        setPageDiseño(1)
    }, [filtroVista, filtroDiseñador, searchTerm, filtrosFecha.fechaDesde, filtrosFecha.fechaHasta])

    // Obtener columnas visibles y ordenadas para esta etapa
    const columnasVisibles = useMemo(() => {
        // Asegurar que las columnas estén inicializadas
        if (!mockDatabase.columnasPedidos || mockDatabase.columnasPedidos.length === 0) {
            return []
        }

        const config = mockDatabase.columnasConfig?.diseño || {}
        const ordenGuardado = config.orden || []

        // Obtener todas las columnas
        const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)

        // Filtrar y ordenar según configuración (en diseño no se muestra estado general)
        const columnasFiltradas = todasColumnas
            .filter((col: any) => col.campo !== "estadoGeneral")
            .filter((col: any) => {
                // Si hay configuración guardada, usar esa
                if (config[col.campo] !== undefined) {
                    return config[col.campo]
                }
                // Si no hay configuración, mostrar columnas básicas, de diseño y Es Personalizado
                if (Object.keys(config).length === 0 || !config.orden) {
                    return col.visible === true ||
                        col.categoria === "basico" ||
                        col.categoria === "diseño" ||
                        col.campo === "esPersonalizado"
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

        // Si no hay columnas visibles, mostrar al menos las básicas (sin estado general)
        if (columnasFiltradas.length === 0) {
            return todasColumnas
                .filter((col: any) => col.campo !== "estadoGeneral")
                .filter((col: any) =>
                    col.categoria === "basico" ||
                    col.categoria === "diseño" ||
                    col.campo === "esPersonalizado" ||
                    col.visible === true
                ).slice(0, 15)
        }

        return columnasFiltradas
    }, [mockDatabase.columnasPedidos, mockDatabase.columnasConfig?.diseño, configVersion])

    // Cargar pedidos en diseño (solo estado "En Diseño")
    useEffect(() => {
        setPedidosEnDiseño((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Diseño"))
        const unsubscribe = mockFirestore.collection("pedidos").onSnapshot((snapshot: any) => {
            setPedidosEnDiseño((mockDatabase.pedidos || []).filter((p: any) => p.estadoGeneral === "En Diseño"))
        })
        return () => unsubscribe()
    }, [])

    // Filtrar pedidos por rango de fechas y búsqueda
    const pedidosFiltrados = useMemo(() => {
        let list = pedidosEnDiseño
        if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
            list = list.filter((pedido: any) => {
                const fechaEntrada = pedido.diseño?.fechaEntrada
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
        // Filtro por vista: en proceso (con diseñador) o pendiente sin diseñador
        if (filtroVista === "en_proceso") {
            list = list.filter((p: any) => {
                const tieneDiseñador = !!(p.diseño?.diseñadorAsignado || p.diseño?.diseñadorNombre)
                const enProceso = (p.diseño?.estado || "") === "En Proceso"
                return tieneDiseñador && enProceso
            })
        } else if (filtroVista === "pendiente_sin_diseñador") {
            list = list.filter((p: any) => {
                const sinDiseñador = !p.diseño?.diseñadorAsignado && !p.diseño?.diseñadorNombre
                const pendiente = (p.diseño?.estado || "Pendiente") === "Pendiente" || !p.diseño?.estado
                return sinDiseñador && pendiente
            })
        }
        // Filtro por diseñador
        if (filtroDiseñador) {
            list = list.filter((p: any) => {
                const asignado = p.diseño?.diseñadorAsignado || p.diseño?.diseñadorNombre || ""
                return asignado === filtroDiseñador
            })
        }
        return list
    }, [pedidosEnDiseño, filtrosFecha, searchTerm, filtroVista, filtroDiseñador])

    // Paginación: solo los pedidos de la página actual
    const totalPagesDiseño = Math.max(1, Math.ceil(pedidosFiltrados.length / itemsPerPageDiseño))
    const pageActualDiseño = Math.min(pageDiseño, totalPagesDiseño)
    const pedidosPagina = useMemo(() => {
        const start = (pageActualDiseño - 1) * itemsPerPageDiseño
        return pedidosFiltrados.slice(start, start + itemsPerPageDiseño)
    }, [pedidosFiltrados, pageActualDiseño])

    // Pedidos marcados como prioridad (para que las diseñadoras los vean primero)
    const pedidosPrioridad = useMemo(() => pedidosEnDiseño.filter((p: any) => p.esPrioridad === true), [pedidosEnDiseño])

    // Resumen Actual
    const resumenActual = useMemo(() => {
        const pendientes = pedidosEnDiseño.length
        const sinAsignar = pedidosEnDiseño.filter((p: any) => !p.diseño?.diseñadorNombre).length
        const enProceso = pedidosEnDiseño.filter((p: any) => p.diseño?.estado !== "TERMINADO" && p.diseño?.diseñadorNombre).length
        return { pendientes, sinAsignar, enProceso }
    }, [pedidosEnDiseño])

    // Resumen Histórico por Diseñador
    const resumenHistorico = useMemo(() => {
        const hoy = new Date()
        const fechaInicio = filtrosFecha.fechaDesde ? (parseFechaRobust(filtrosFecha.fechaDesde) || new Date(hoy.getFullYear(), hoy.getMonth(), 1)) : new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        const fechaFin = filtrosFecha.fechaHasta ? (parseFechaRobust(filtrosFecha.fechaHasta + "T23:59:59") || hoy) : hoy

        // Obtener todos los pedidos que pasaron por diseño en el rango de fechas
        const todosPedidos = mockDatabase.pedidos.filter((p: any) => {
            const fechaEntrada = p.diseño?.fechaEntrada
            if (!fechaEntrada) return false
            const entrada = parseFechaRobust(fechaEntrada)
            return entrada && entrada >= fechaInicio && entrada <= fechaFin
        })

        const porDiseñador: any = {}
        getDisenadores().forEach((diseñador) => {
            porDiseñador[diseñador] = {
                entrada: 0,
                salida: 0,
                tiempoTotal: 0,
                tiempos: [],
            }
        })
        porDiseñador["SIN DISEÑO"] = {
            entrada: 0,
            salida: 0,
            tiempoTotal: 0,
            tiempos: [],
        }

        todosPedidos.forEach((pedido: any) => {
            const diseñador = pedido.diseño?.diseñadorNombre || "SIN DISEÑO"
            if (!porDiseñador[diseñador]) {
                porDiseñador[diseñador] = { entrada: 0, salida: 0, tiempoTotal: 0, tiempos: [] }
            }

            const fechaEntrada = pedido.diseño?.fechaEntrada
            if (fechaEntrada) {
                const entrada = new Date(fechaEntrada)
                if (entrada >= fechaInicio && entrada <= fechaFin) {
                    porDiseñador[diseñador].entrada++
                }
            }

            const fechaSalida = pedido.diseño?.fechaSalida
            if (fechaSalida) {
                const salida = new Date(fechaSalida)
                if (salida >= fechaInicio && salida <= fechaFin) {
                    porDiseñador[diseñador].salida++
                    if (fechaEntrada) {
                        const tiempo = (salida.getTime() - new Date(fechaEntrada).getTime()) / (1000 * 60 * 60) // horas
                        porDiseñador[diseñador].tiempos.push(tiempo)
                        porDiseñador[diseñador].tiempoTotal += tiempo
                    }
                }
            }
        })

        // Calcular promedios
        const resumen = Object.entries(porDiseñador).map(([nombre, datos]: [string, any]) => {
            const promedio = datos.tiempos.length > 0 ? datos.tiempoTotal / datos.tiempos.length : 0
            const horas = Math.floor(promedio)
            const minutos = Math.floor((promedio % 1) * 60)
            const segundos = Math.floor(((promedio % 1) * 60 % 1) * 60)
            return {
                nombre,
                entrada: datos.entrada,
                salida: datos.salida,
                tiempoPromedio: `${horas}:${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`,
            }
        })

        // Agregar totales
        const totales = {
            nombre: "TOTALES",
            entrada: resumen.reduce((sum: any, r: any) => sum + r.entrada, 0),
            salida: resumen.reduce((sum: any, r: any) => sum + r.salida, 0),
            tiempoPromedio: (() => {
                const todosTiempos = Object.values(porDiseñador).flatMap((d: any) => d.tiempos)
                const promedioTotal = todosTiempos.length > 0 ? (todosTiempos.reduce((a: any, b: any) => a + b, 0) as number) / todosTiempos.length : 0
                const horas = Math.floor(promedioTotal)
                const minutos = Math.floor((promedioTotal % 1) * 60)
                const segundos = Math.floor(((promedioTotal % 1) * 60 % 1) * 60)
                return `${horas}:${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`
            })(),
        }

        return [totales, ...resumen]
    }, [filtrosFecha])

    // Expandir pedido
    const handleClickFila = (e: React.MouseEvent, pedido: any) => {
        // Si hay texto seleccionado, no abrir el pedido (el usuario está seleccionando texto)
        const selection = window.getSelection()
        if (selection && selection.toString().trim().length > 0) {
            return
        }
        handleExpandirPedido(pedido)
    }

    const handleExpandirPedido = (pedido: any) => {
        setPedidoExpandido(pedido.id)
        setFormDataExpandido({
            diseñadorAsignado: pedido.diseño?.diseñadorAsignado || "",
            urlImagen: pedido.diseño?.urlImagen || "",
            talla: pedido.talla || "",
            notas: pedido.notasDiseño || "",
        })
        setIsModalEditarOpen(true)
    }

    // Marcar diseño como completado directamente (desde tabla)
    const handleMarcarCompletadoDirecto = async (pedido: any, datosForm: any = null) => {
        if (!pedido) return

        // Obtener datos del pedido actualizado (puede haber sido editado directamente en la tabla)
        const pedidoActualizado = pedidosEnDiseño.find((p: any) => p.id === pedido.id) || pedido
        const tieneDiseñador = !!(pedidoActualizado.diseño?.diseñadorAsignado || pedidoActualizado.diseño?.diseñadorNombre)
        const estaEnProceso = (pedidoActualizado.diseño?.estado || "") === "En Proceso"
        if (!tieneDiseñador || !estaEnProceso) {
            alert("Solo puede marcar TERMINADO si el pedido tiene diseñador asignado y está en proceso.")
            return
        }

        // Buscar la etapa de diseño actual
        const etapaDiseño = mockDatabase.etapas.find((e: any) => e.flujoId === "flujo-pedidos" && e.moduloPermisos === "diseño"
        )

        // Usar datosForm si está disponible, sino usar datos del pedido actualizado
        const urlImagen = datosForm?.urlImagen || pedidoActualizado.diseño?.urlImagen || ""
        const talla = datosForm?.talla || pedidoActualizado.talla || ""
        const diseñadorAsignado = datosForm?.diseñadorAsignado || pedidoActualizado.diseño?.diseñadorAsignado || ""
        const notas = datosForm?.notas || pedidoActualizado.notasDiseño || ""

        // Evaluar condiciones de salida si están configuradas
        if (etapaDiseño && etapaDiseño.condicionesSalida && etapaDiseño.condicionesSalida.length > 0) {
            // Crear un pedido temporal con los datos actualizados para evaluar
            const pedidoTemporal = {
                ...pedidoActualizado,
                diseño: {
                    ...pedidoActualizado.diseño,
                    diseñadorAsignado: diseñadorAsignado,
                    urlImagen: urlImagen,
                },
                talla: talla,
                notasDiseño: notas,
            }

            const resultado = evaluarCondiciones(etapaDiseño.condicionesSalida, pedidoTemporal)
            if (!resultado.cumplidas) {
                alert(
                    "ACCIÓN DETENIDA: No se cumplen todas las condiciones requeridas:\n\n" +
                    resultado.condicionesFaltantes.map((c: string) => `- ${c}`).join("\n")
                )
                return
            }
        } else {
            // Validaciones por defecto (retrocompatibilidad): al menos una URL (una por línea)
            const urls = (urlImagen || "").split(/\n/).map((s: string) => s.trim()).filter(Boolean)
            if (urls.length === 0) {
                alert("ACCIÓN DETENIDA: Falta la URL del diseño. Puedes ingresar varias URLs, una por línea.")
                return
            }

            if (!talla.trim()) {
                alert("ACCIÓN DETENIDA: Falta la información de las Tallas.")
                return
            }
        }

        const saldoDebe = calcularSaldoPedido(pedidoActualizado)
        const confirmar = saldoDebe > 0
            ? confirm("¿Estás seguro de pasar este pedido a Cobranza?")
            : confirm("El pedido no tiene deudas. ¿Verificar stock para moverlo a Preparación?")

        if (!confirmar) return

        try {
            const fechaSalida = new Date()
            const fechaEntrada = pedidoActualizado.diseño?.fechaEntrada ? new Date(pedidoActualizado.diseño.fechaEntrada) : fechaSalida
            const tiempoDiseño = (fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60) // horas

            let nuevoEstado = ""
            let nuevoStatus = ""
            let preparacionUpdate = {}
            let cobranzaUpdate = {}

            if (saldoDebe > 0) {
                nuevoEstado = "En Cobranza"
                nuevoStatus = "cobranza"
                cobranzaUpdate = {
                    fechaEntrada: new Date(),
                }
            } else {
                // Verificar stock antes de avanzar
                const tieneStock = verificarStock(pedidoActualizado)
                if (tieneStock) {
                    nuevoEstado = "Listo para Preparar"
                    nuevoStatus = "preparacion"
                    preparacionUpdate = {
                        fechaEntrada: new Date(),
                    }
                } else {
                    nuevoEstado = "En Pausa por Stock"
                    nuevoStatus = "preparacion"
                    preparacionUpdate = {
                        fechaEntrada: new Date(),
                    }
                }
            }

            const updates = {
                estadoGeneral: nuevoEstado,
                status: nuevoStatus,
                diseño: {
                    ...pedidoActualizado.diseño,
                    fechaSalida: fechaSalida,
                    estado: "TERMINADO",
                    diseñadorAsignado: diseñadorAsignado,
                    diseñadorNombre: getDisenadores().find((d: any) => d === diseñadorAsignado) || null,
                    urlImagen: urlImagen,
                },
                cobranza: {
                    ...pedidoActualizado.cobranza,
                    ...cobranzaUpdate,
                },
                preparacion: {
                    ...pedidoActualizado.preparacion,
                    ...preparacionUpdate,
                },
                tiempos: {
                    ...pedidoActualizado.tiempos,
                    diseño: tiempoDiseño,
                },
                talla: talla,
                notasDiseño: notas,
                historialModificaciones: [
                    ...(pedidoActualizado.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Diseño Completado",
                        detalle: `Diseño completado y movido a ${nuevoEstado} por ${currentUser?.email || "sistema"}`,
                    },
                ],
                updatedAt: new Date(),
            }

            await mockFirestore.doc("pedidos", pedidoActualizado.id).update(updates)
            alert(` Pedido movido a ${nuevoEstado}`)
            setPedidoExpandido(null)
            setIsModalEditarOpen(false) // Close modal if open
        } catch (error: any) {
            console.error("Error al marcar como completado:", error)
            alert("Error al completar el diseño: " + error.message)
        }
    }

    // Guardar cambios en pedido expandido
    const handleGuardarCambios = async () => {
        if (!pedidoExpandido) return

        try {
            const pedido = pedidosEnDiseño.find((p: any) => p.id === pedidoExpandido)
            if (!pedido) return

            // Validar colores en tallas
            if (formDataExpandido.talla) {
                const validacionColor = validarColorEnTexto(formDataExpandido.talla)
                if (!validacionColor.valido) {
                    const continuar = confirm(
                        ` COLOR NO RECONOCIDO O MAL ESCRITO\n\n` +
                        `El sistema detectó partes del pedido sin color válido:\n\n` +
                        ` "${validacionColor.itemsFallidos}"\n\n` +
                        `Revisa si escribiste "Neegro" en lugar de "Negro", o si el color no está en la lista de CONFIGURACIÓN.\n` +
                        `¿Deseas continuar de todas formas?`
                    )
                    if (!continuar) return
                }
            }

            const updates = {
                diseño: {
                    ...pedido.diseño,
                    diseñadorAsignado: formDataExpandido.diseñadorAsignado,
                    diseñadorNombre: getDisenadores().find((d: any) => d === formDataExpandido.diseñadorAsignado) || null,
                    urlImagen: formDataExpandido.urlImagen,
                },
                talla: formDataExpandido.talla,
                notasDiseño: formDataExpandido.notas,
                historialModificaciones: [
                    ...(pedido.historialModificaciones || []),
                    {
                        timestamp: new Date(),
                        usuarioId: currentUser?.uid || "system",
                        usuarioEmail: currentUser?.email || "system",
                        accion: "Diseño Actualizado",
                        detalle: `Diseño actualizado por ${currentUser?.email || "sistema"}`,
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

    // Marcar diseño como completado (desde modal)
    const handleMarcarCompletado = async () => {
        if (!pedidoExpandido) return

        const pedido = pedidosEnDiseño.find((p: any) => p.id === pedidoExpandido)
        if (!pedido) return

        const tieneDiseñador = !!(formDataExpandido.diseñadorAsignado || pedido.diseño?.diseñadorAsignado || pedido.diseño?.diseñadorNombre)
        const estaEnProceso = (pedido.diseño?.estado || "") === "En Proceso"
        if (!tieneDiseñador || !estaEnProceso) {
            alert("Solo puede marcar TERMINADO si el pedido tiene diseñador asignado y está en proceso.")
            return
        }

        await handleMarcarCompletadoDirecto(pedido, formDataExpandido)
    }

    return (
        <div className="p-6 min-h-screen text-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1.5 h-8 rounded-full bg-[#E89595]" /> Gestión de Diseño</h2>
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
                    <select
                        value={filtroVista}
                        onChange={(e: any) => setFiltroVista(e.target.value)}
                        className="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                        <option value="todos">Todos</option>
                        <option value="en_proceso">En proceso (con diseñador)</option>
                        <option value="pendiente_sin_diseñador">Pendiente sin diseñador</option>
                    </select>
                    <select
                        value={filtroDiseñador}
                        onChange={(e: any) => setFiltroDiseñador(e.target.value)}
                        className="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[140px]"
                    >
                        <option value="">Diseñador: Todos</option>
                        {getDisenadores().map((d: string) => (
                            <option key={d} value={d}>Diseñador: {d}</option>
                        ))}
                    </select>
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
                        <p className="text-sm text-slate-500">DIS. SIN ASIGNAR</p>
                        <p className="text-xl font-semibold text-slate-900">{resumenActual.sinAsignar}</p>
                    </div>
                    <div className="glass-box rounded-2xl p-4 text-center flex-shrink-0 w-52">
                        <p className="text-sm text-slate-500">DIS. EN PROCESO</p>
                        <p className="text-xl font-semibold text-slate-900">{resumenActual.enProceso}</p>
                    </div>
                </div>

                {/* Resumen Histórico */}
                <div className="w-full max-w-5xl glass-box rounded-2xl border-l-4 border-l-[#E89595] p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 bg-[#F4C4C4] text-[#9C3D3D] px-4 py-2 rounded-lg">
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
                            <thead className="bg-[#F4C4C4]/80 text-[#8B3A3A] font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase">Diseñador</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Entrada</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Salida</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">Tiempo Promedio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {resumenHistorico.map((item: any, idx: number) => (
                                    <tr key={idx} className={item.nombre === "TOTALES" ? "bg-[#F4C4C4]/60 font-semibold text-slate-800" : ""}>
                                        <td className="px-3 py-2 text-slate-900">{item.nombre}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.entrada}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.salida}</td>
                                        <td className="px-3 py-2 text-center text-slate-700">{item.tiempoPromedio}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Subsección: Pedidos en prioridad (debajo de Resumen Histórico) */}
                {pedidosPrioridad.length > 0 && (
                    <div className="w-full max-w-5xl rounded-xl border-2 border-amber-300 bg-amber-50/80 shadow-md overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-amber-100 border-b border-amber-200">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-amber-900">Pedidos en prioridad</h3>
                            <span className="text-sm text-amber-700">({pedidosPrioridad.length})</span>
                        </div>
                        <div className="p-3 flex flex-wrap gap-3">
                            {pedidosPrioridad.map((pedido: any) => (
                                <button
                                    key={pedido.id}
                                    type="button"
                                    onClick={(e) => handleClickFila(e, pedido)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-amber-300 bg-white hover:bg-amber-50 hover:border-amber-400 transition-colors text-left min-w-[200px]"
                                >
                                    <span className="font-bold text-slate-800">#{pedido.numeroPedido || pedido.id}</span>
                                    <span className="text-sm text-slate-600 truncate max-w-[120px]" title={pedido.clienteNombre}>
                                        {pedido.clienteNombre || "-"}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {pedido.diseño?.diseñadorAsignado || pedido.diseño?.diseñadorNombre || "Sin asignar"}
                                    </span>
                                    <span className="text-xs font-medium text-amber-700">
                                        {pedido.diseño?.estado || "Pendiente"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Configuración de Columnas */}
            <ConfigColumnasEtapaModal
                isOpen={showConfigColumnas}
                onClose={() => setShowConfigColumnas(false)}
                etapaId="diseño"
                etapaNombre="Diseño"
                onSave={() => setConfigVersion(v => v + 1)}
            />

            {/* Tabla dinámica */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">Pedidos en Diseño</h3>
                    {pedidosFiltrados.length > itemsPerPageDiseño && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Mostrando {(pageActualDiseño - 1) * itemsPerPageDiseño + 1} - {Math.min(pageActualDiseño * itemsPerPageDiseño, pedidosFiltrados.length)} de {pedidosFiltrados.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPageDiseño((p) => Math.max(1, p - 1))}
                                    disabled={pageActualDiseño <= 1}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm text-slate-600 min-w-[100px] text-center">Pág. {pageActualDiseño} de {totalPagesDiseño}</span>
                                <button
                                    type="button"
                                    onClick={() => setPageDiseño((p) => Math.min(totalPagesDiseño, p + 1))}
                                    disabled={pageActualDiseño >= totalPagesDiseño}
                                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            <div className="glass-box rounded-2xl border-l-4 border-l-[#E89595] min-w-0 overflow-hidden">
                <div className="min-w-0 overflow-hidden">
                    <table className="resumen-table w-full table-fixed max-w-full">
                    <thead className="bg-[#F4C4C4]/80 text-white font-semibold border-b border-rose-200">
                        <tr>
                            {columnasVisibles.map((columna: any) => {
                                const esColPersonalizado = columna.campo === "esPersonalizado"
                                return (
                                    <th
                                        key={columna.id}
                                        className={`px-2 py-2 text-left text-xs font-semibold text-white uppercase whitespace-normal align-top ${getAnchoColumnaEtapa(columna.campo)}${esColPersonalizado ? " w-[8rem] max-w-[8rem]" : ""}`}
                                        style={esColPersonalizado ? { minWidth: "8rem" } : undefined}
                                    >
                                        {esColPersonalizado ? <span className="inline-block">Es<br />Personalizado</span> : columna.nombre}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pedidosFiltrados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columnasVisibles.length}
                                    className="px-2 py-6 text-center text-slate-500"
                                >
                                    No hay pedidos en diseño
                                </td>
                            </tr>
                        ) : (
                            pedidosPagina.map((pedido: any) => (
                                <React.Fragment key={pedido.id}>
                                    <tr
                                        className={`hover:bg-[#F4C4C4]/50 cursor-pointer text-slate-800 ${pedidoExpandido === pedido.id ? "bg-[#F4C4C4]/60" : ""}`}
                                        onClick={(e) => handleClickFila(e, pedido)}
                                    >
                                        {columnasVisibles.map((columna: any) => {
                                            const valor = obtenerValorColumna(columna, pedido)
                                            
                                            // Campos no editables en Diseño: whatsappOrigen, vendedor, clienteContacto (teléfono)
                                            const camposNoEditablesEnDiseño = ["whatsappOrigen", "vendedor", "clienteContacto"]
                                            const esCampoNoEditableEnDiseño = camposNoEditablesEnDiseño.includes(columna.campo)
                                            const esEditable = columna.editable && !esCampoNoEditableEnDiseño

                                            // Anchos: usar getAnchoColumnaEtapa para consistencia, excepto casos especiales
                                            const anchoPersonalizado = columna.campo === "esPersonalizado" ? " w-[8rem] max-w-[8rem]" : ""
                                            const anchoClase = anchoPersonalizado || getAnchoColumnaEtapa(columna.campo)

                                            // Casos especiales: solo lectura (observación, es personalizado) o editables
                                            const esObservacion = columna.campo === "observacion"
                                            const esPersonalizado = columna.campo === "esPersonalizado"
                                            const esDiseñador = columna.campo === "diseño.diseñadorAsignado"
                                            const esUrlImagen = columna.campo === "diseño.urlImagen"
                                            const esTalla = columna.campo === "talla"
                                            const esEstado = columna.campo === "diseño.estado"

                                            return (
                                                <td
                                                    key={columna.id}
                                                    className={`px-2 py-2 text-sm text-slate-700 align-top ${anchoClase} ${columna.campo === "productos" ? "break-words whitespace-normal" : ""}`}
                                                    onClick={esEditable && !esObservacion && !esPersonalizado ? (e: any) => e.stopPropagation() : undefined}
                                                >
                                                    {(esObservacion || esPersonalizado) ? (
                                                        <span className={esPersonalizado ? "px-2" : ""}>{valor || "-"}</span>
                                                    ) : esEditable && esDiseñador ? (
                                                        <EditableCell
                                                            value={pedido.diseño?.diseñadorAsignado || ""}
                                                            onChange={async (valor: any) => {
                                                                const diseñadorNombre = valor ? (getDisenadores().find((d: any) => d === valor) || valor) : null
                                                                await handleGuardarCamposEtapa(pedido.id, "diseño", { diseñadorAsignado: valor || null, diseñadorNombre }, currentUser)
                                                            }}
                                                            type="select"
                                                            options={(() => {
                                                                const lista = getDisenadores()
                                                                const actual = pedido.diseño?.diseñadorAsignado
                                                                if (actual && !lista.includes(actual)) return [actual, ...lista]
                                                                return lista
                                                            })()}
                                                            placeholder="Seleccionar diseñador"
                                                        />
                                                    ) : esEditable && esUrlImagen ? (
                                                        <EditableCell
                                                            value={pedido.diseño?.urlImagen || ""}
                                                            onChange={async (valor: any) => {
                                                                await updateOrderField(pedido.id, "urlImagen", valor, "diseño", currentUser)
                                                            }}
                                                            type="textarea"
                                                            placeholder="Una URL por línea. Enter para más."
                                                        />
                                                    ) : esEditable && esTalla ? (
                                                        <EditableCell
                                                            value={pedido.talla || ""}
                                                            onChange={async (valor: any) => {
                                                                await updateOrderField(pedido.id, "talla", valor, null, currentUser)
                                                            }}
                                                            type="text"
                                                            placeholder="Ej: M, L, XL..."
                                                        />
                                                    ) : esEditable && esEstado ? (
                                                        (() => {
                                                            const tieneDiseñador = !!(pedido.diseño?.diseñadorAsignado || pedido.diseño?.diseñadorNombre)
                                                            const estaEnProceso = (pedido.diseño?.estado || "") === "En Proceso"
                                                            const puedeTerminar = tieneDiseñador && estaEnProceso
                                                            const opcionesEstado = !tieneDiseñador
                                                                ? ["Pendiente"]
                                                                : puedeTerminar
                                                                    ? (columna.opciones || ["Pendiente", "En Proceso", "TERMINADO"])
                                                                    : ["Pendiente", "En Proceso"]
                                                            return (
                                                                <EditableCell
                                                                    value={pedido.diseño?.estado || "Pendiente"}
                                                                    onChange={async (valor: any) => {
                                                                        if (valor === "En Proceso" && !tieneDiseñador) {
                                                                            alert("Debe asignar un diseñador antes de marcar en proceso.")
                                                                            return
                                                                        }
                                                                        if (valor === "TERMINADO" && !puedeTerminar) {
                                                                            alert("Solo puede marcar TERMINADO si tiene diseñador asignado y el pedido está en proceso.")
                                                                            return
                                                                        }
                                                                        await updateOrderField(pedido.id, "estado", valor, "diseño", currentUser)
                                                                        if (valor === "TERMINADO") {
                                                                            const pedidoActualizado = pedidosEnDiseño.find((p: any) => p.id === pedido.id)
                                                                            if (pedidoActualizado) {
                                                                                await handleMarcarCompletadoDirecto(pedidoActualizado)
                                                                            }
                                                                        }
                                                                    }}
                                                                    type="select"
                                                                    options={opcionesEstado}
                                                                />
                                                            )
                                                        })()
                                                    ) : esEditable && columna.tipo === "lista" ? (
                                                        <EditableCell
                                                            value={valor || ""}
                                                            onChange={async (valor: any) => {
                                                                await updateOrderField(pedido.id, columna.campo, valor, null, currentUser)
                                                            }}
                                                            type="select"
                                                            options={columna.opciones || []}
                                                        />
                                                    ) : esEditable ? (
                                                        <EditableCell
                                                            value={valor || ""}
                                                            onChange={async (valor: any) => {
                                                                await updateOrderField(pedido.id, columna.campo, valor, null, currentUser)
                                                            }}
                                                            type={columna.tipo === "numero" ? "number" : "text"}
                                                        />
                                                    ) : (
                                                        <span>{valor || "-"}</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
            </div>

            {/* Modal para editar pedido */}
            {isModalEditarOpen && pedidoExpandido && (
                <Modal
                    isOpen={isModalEditarOpen}
                    onClose={() => {
                        setIsModalEditarOpen(false)
                        setPedidoExpandido(null)
                    }}
                    title={`Editar Pedido #${pedidosEnDiseño.find((p: any) => p.id === pedidoExpandido)?.numeroPedido || pedidoExpandido}`}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Diseñador Asignado
                                </label>
                                <select
                                    value={formDataExpandido.diseñadorAsignado}
                                    onChange={(e: any) =>
                                        setFormDataExpandido((prev: any) => ({ ...prev, diseñadorAsignado: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {(() => {
                                        const lista = getDisenadores()
                                        const actual = formDataExpandido.diseñadorAsignado
                                        const opciones = actual && !lista.includes(actual) ? [actual, ...lista] : lista
                                        return opciones.map((d: any) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))
                                    })()}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    URL Imagen (una por línea)
                                </label>
                                <textarea
                                    value={formDataExpandido.urlImagen}
                                    onChange={(e: any) =>
                                        setFormDataExpandido((prev: any) => ({ ...prev, urlImagen: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm min-h-[80px]"
                                    placeholder="https://... (Enter para agregar más enlaces, uno por línea)"
                                    rows={3}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Talla / Detalles
                                </label>
                                <input
                                    type="text"
                                    value={formDataExpandido.talla}
                                    onChange={(e: any) =>
                                        setFormDataExpandido((prev: any) => ({ ...prev, talla: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Detalles del diseño..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notas Adicionales
                                </label>
                                <textarea
                                    value={formDataExpandido.notas}
                                    onChange={(e: any) =>
                                        setFormDataExpandido((prev: any) => ({ ...prev, notas: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-24"
                                    placeholder="Notas sobre el diseño..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="secondary"
                                onClick={() => setIsModalEditarOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGuardarCambios}
                            >
                                Guardar Cambios
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white ml-2"
                                onClick={handleMarcarCompletado}
                            >
                                Marcar Completado
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
export const DiseñoTab = React.memo(DiseñoTabComponent)
