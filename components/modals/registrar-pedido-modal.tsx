"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, X, CheckCircle2, PlusCircle, Save } from "lucide-react"
import {
    mockDatabase,
    mockFirestore,
    formatMoney
} from '@/lib/mock-firebase'
import {
    validarColorEnTexto,
    parseMontoRobust
} from '@/lib/business-logic'
import { useAuth } from "@/contexts/auth-context"
import {
    peruGeoData,
    productLines,
    salesChannels,
    vendedores,
    activadores,
    tiposDocumento,
    regalosList,
    shippingAgencies
} from "@/lib/constants"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/form-elements"
import { ImageUpload, MultipleImageUpload } from "@/components/ui/image-upload"
import { ActionButton as Button } from "@/components/ui/action-button"

export function RegistrarPedidoModal({ isOpen, onClose, onSave, pedidoToEdit }: any) {
    const { currentUser } = useAuth()
    const [productosDisponibles, setProductosDisponibles] = useState<any[]>([])

    useEffect(() => {
        if (isOpen) {
            const unsubscribe = mockFirestore.collection("productos").onSnapshot((snapshot: any) => {
                const productosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
                const productosActivos = productosData.filter((p: any) => p.activo)
                setProductosDisponibles(productosActivos)
            })
            return () => unsubscribe()
        }
    }, [isOpen])

    // Cargar datos del pedido al abrir en modo edición (usamos el objeto pedido pasado desde Ventas)
    useEffect(() => {
        if (!isOpen) return
        if (pedidoToEdit && typeof pedidoToEdit === "object") {
            const pedido = pedidoToEdit
            isLoadingForEditRef.current = true
            setPedidoId(pedido.id)
            setIsEditMode(true)
                // Fallback: si el pedido de la lista no tiene todos los campos, tomar de mockDatabase
                const fromDb = mockDatabase.pedidos.find((x: any) => x.id === pedido.id) || pedido
                const p = { ...fromDb, ...pedido }
                const productosForm = Array.isArray(p.productos)
                    ? p.productos.map((item: any) => ({
                        id: item.id || crypto.randomUUID(),
                        productoId: item.productoId || "",
                        cantidad: item.cantidad ?? 1,
                        precioSeleccionado: item.precioSeleccionado ?? 0,
                        varianteId: item.varianteId || "",
                        imagenReferencial: item.imagenReferencial ?? null,
                    }))
                    : [{ id: crypto.randomUUID(), productoId: "", cantidad: 1, precioSeleccionado: 0, varianteId: "", imagenReferencial: null }]
                const regalosForm = Array.isArray(p.regalos)
                    ? p.regalos.map((r: any) => ({
                        id: r.id || crypto.randomUUID(),
                        regaloId: r.regaloId ?? r.productoId ?? "",
                        cantidad: r.cantidad ?? 1,
                    }))
                    : []
                const clienteDistritoReal = p.clienteDistritoReal ?? p.clienteDistrito ?? ""
                const data = {
                    ...initialFormState,
                    ...p,
                    clienteDepartamento: p.clienteDepartamento ?? "",
                    clienteProvincia: p.clienteProvincia ?? "",
                    clienteDistritoReal,
                    activador: p.activador ?? "",
                    lineaProducto: p.lineaProducto ?? "",
                    whatsappOrigen: p.whatsappOrigen ?? "",
                    talla: p.talla ?? "",
                    envioDireccionLima: p.envioDireccionLima ?? "",
                    agenciaEnvio: p.agenciaEnvio ?? "",
                    envioDepartamento: p.envioDepartamento ?? "",
                    envioProvincia: p.envioProvincia ?? "",
                    envioDistrito: p.envioDistrito ?? "",
                    productos: productosForm.length > 0 ? productosForm : initialFormState.productos,
                    regalos: regalosForm.length > 0 ? regalosForm : initialFormState.regalos,
                    montoTotal: p.montoTotal ?? 0,
                    montoAdelanto: p.montoAdelanto ?? 0,
                    montoPendiente: p.montoPendiente ?? 0,
                    montoMostacero: p.montoMostacero ?? 0,
                }
                setFormData(data)
                // Poblar listas de opciones para que los selects muestren valor y opciones
                if (data.clienteDepartamento) {
                    const dept = peruGeoData.find((d: any) => d.departamento === data.clienteDepartamento)
                    if (dept) setClienteProvinciasList(dept.provincias.map((x: any) => x.provincia))
                }
                if (data.clienteDepartamento && data.clienteProvincia) {
                    const dept = peruGeoData.find((d: any) => d.departamento === data.clienteDepartamento)
                    const prov = dept?.provincias.find((x: any) => x.provincia === data.clienteProvincia)
                    if (prov) setClienteDistritosList(prov.distritos)
                }
                if (data.envioDepartamento) {
                    const dept = peruGeoData.find((d: any) => d.departamento === data.envioDepartamento)
                    if (dept) setEnvioProvincias(dept.provincias.map((x: any) => x.provincia))
                }
                if (data.envioDepartamento && data.envioProvincia) {
                    const dept = peruGeoData.find((d: any) => d.departamento === data.envioDepartamento)
                    const prov = dept?.provincias.find((x: any) => x.provincia === data.envioProvincia)
                    if (prov) setEnvioDistritosList(prov.distritos)
                }
                if (data.lineaProducto && (productLines as any)[data.lineaProducto]) {
                    setCurrentProductLineWs((productLines as any)[data.lineaProducto])
                }
                setBusquedaCliente("")
                setClienteEncontrado(null)
                setTimeout(() => { isLoadingForEditRef.current = false }, 150)
        } else {
            setPedidoId(null)
            setIsEditMode(false)
            setFormData(initialFormState)
            setBusquedaCliente("")
            setClienteEncontrado(null)
        }
    }, [isOpen, pedidoToEdit])

    const initialFormState = {
        // Datos del Cliente
        clienteNombre: "",
        clienteApellidos: "",
        clienteContacto: "",
        clienteContactoSecundario: "",
        clienteCorreo: "",
        clienteTipoDocumento: "",
        clienteNumeroDocumento: "",
        clienteDepartamento: "",
        clienteProvincia: "",
        clienteDistritoReal: "",
        // Detalles del Pedido
        canalVenta: "",
        activador: "",
        lineaProducto: "",
        whatsappOrigen: "",
        vendedor: "",
        productos: [
            {
                id: crypto.randomUUID(),
                productoId: "",
                cantidad: 1,
                precioSeleccionado: 0,
                varianteId: "",
                imagenReferencial: null,
            },
        ],
        regalos: [
            {
                id: crypto.randomUUID(),
                regaloId: "",
                cantidad: 1,
            },
        ],
        talla: "",
        esPersonalizado: false,
        // Detalles de Entrega y Envío
        usarDatosClienteParaEnvio: true,
        envioNombres: "",
        envioApellidos: "",
        envioContacto: "",
        envioContactoSecundario: "",
        envioNombreCliente: "",
        envioTipoDocumento: "",
        envioNumeroDocumento: "",
        envioDepartamento: "",
        envioProvincia: "",
        envioDistrito: "",
        envioDireccionLima: "",
        agenciaEnvio: "",
        fechaEnvio: "",
        // Detalles de Pago
        montoAdelanto: 0,
        montoTotal: 0,
        montoPendiente: 0,
        montoMostacero: 0,
        observacion: "",
        esMostacero: false,
        esPrioridad: false,
        comprobantesPago: [],
        // Comentarios (máximo 4)
        comentarios: [],
        // Estado principal
        status: "ventas",
        estadoGeneral: "",
        // Tracking por etapa - Diseño
        diseño: {
            fechaEntrada: null,
            fechaSalida: null,
            diseñadorAsignado: null,
            diseñadorNombre: null,
            estado: "",
            urlImagen: "", // Puede tener múltiples URLs separadas por espacios
        },
        // Tracking por etapa - Cobranza
        cobranza: {
            fechaEntrada: null,
            fechaSalida: null,
            estado: "", // "Pendiente", "Abonado", "Pagado"
            pago1: 0,
            pago2: 0,
            accion: "", // "ACTIVAR PAGO C."
        },
        // Tracking por etapa - Preparación
        preparacion: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "", // "LISTO"
        },
        // Tracking por etapa - Estampado
        estampado: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "", // "LISTO"
        },
        // Tracking por etapa - Empaquetado
        empaquetado: {
            fechaEntrada: null,
            fechaSalida: null,
            operador: null,
            operadorNombre: null,
            estado: "", // "LISTO"
        },
        // Tracking por etapa - Reparto
        reparto: {
            fechaEntrada: null,
            fechaSalida: null,
            fechaFinalizado: null,
            repartidor: null,
            repartidorNombre: null,
            estado: "", // "ENTREGADO"
        },
        // Tiempos calculados (en horas)
        tiempos: {
            diseño: null,
            cobranza: null,
            preparacion: null,
            estampado: null,
            empaquetado: null,
            reparto: null,
            total: null,
        },
        // Campos adicionales del .gs
        linkWhatsapp: "",
        anadidos: "", // COL_ANADIDOS_DL (sincroniza en múltiples mesas)
        // Campos legacy (mantener para compatibilidad)
        diseñadorAsignado: null,
        responsableDiseñoManual: "",
        archivosDiseñoCliente: [],
        archivosDiseñoPropios: [],
        archivoDiseñoFinal: null,
        notasDiseño: "",
        fechaDiseñoTerminado: null,
        fechaCobranzaValidada: null,
        operadorPreEstampado: null,
        fechaPreEstampadoOk: null,
        estampadorAsignado: null,
        fechaEstampadoOk: null,
        operadorEmpaquetado: null,
        fechaEmpaquetadoOk: null,
        repartidorAsignado: null,
        instruccionesEmpaquetado: "",
    }
    const [formData, setFormData] = useState(initialFormState)
    const [errors, setErrors] = useState<Record<string, any>>({})

    const [clienteProvinciasList, setClienteProvinciasList] = useState<string[]>([])
    const [clienteDistritosList, setClienteDistritosList] = useState<string[]>([])

    const [envioProvincias, setEnvioProvincias] = useState<string[]>([])
    const [envioDistritosList, setEnvioDistritosList] = useState<string[]>([])
    const [currentProductLineWs, setCurrentProductLineWs] = useState<any[]>([])
    const [nuevoComentario, setNuevoComentario] = useState("")
    const [isEditMode, setIsEditMode] = useState(false)
    const [pedidoId, setPedidoId] = useState<any>(null)
    const [busquedaCliente, setBusquedaCliente] = useState("")
    const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)
    const isLoadingForEditRef = useRef(false)

    // Funciones para obtener opciones dinámicas de color y talla
    const getAvailableColorsForGarmentType = (tipoPrenda: any) => {
        if (!tipoPrenda) return []
        const colors = new Set(mockDatabase.inventario.filter((item: any) => item.tipoPrenda === tipoPrenda).map((item: any) => item.color))
        return Array.from(colors)
            .sort()
            .map((color: any) => ({ value: color, label: color }))
    }

    const getAvailableSizesForGarmentTypeAndColor = (tipoPrenda: any, color: any) => {
        if (!tipoPrenda || !color) return []
        const sizes = new Set(
            mockDatabase.inventario.filter((item: any) => item.tipoPrenda === tipoPrenda && item.color === color).map((item: any) => item.talla),
        )
        return Array.from(sizes)
            .sort((a: any, b: any) => {
                const numA = Number.parseInt(a)
                const numB = Number.parseInt(b)
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB
                if (!isNaN(numA)) return -1
                if (!isNaN(numB)) return 1
                return a.localeCompare(b)
            })
            .map((size: any) => ({ value: size, label: size }))
    }

    // Efectos para desplegables de dirección del CLIENTE
    useEffect(() => {
        if (isLoadingForEditRef.current) return
        if (formData.clienteDepartamento) {
            const selectedDept = peruGeoData.find((d: any) => d.departamento === formData.clienteDepartamento)
            setClienteProvinciasList(selectedDept ? selectedDept.provincias.map((p: any) => p.provincia) : [])
            setFormData((prev: any) => ({ ...prev, clienteProvincia: "", clienteDistritoReal: "" }))
            setClienteDistritosList([])
        } else {
            setClienteProvinciasList([])
            setClienteDistritosList([])
        }
    }, [formData.clienteDepartamento])

    useEffect(() => {
        if (isLoadingForEditRef.current) return
        if (formData.clienteDepartamento && formData.clienteProvincia) {
            const selectedDept = peruGeoData.find((d: any) => d.departamento === formData.clienteDepartamento)
            const selectedProv = selectedDept?.provincias.find((p: any) => p.provincia === formData.clienteProvincia)
            setClienteDistritosList(selectedProv ? selectedProv.distritos : [])
            setFormData((prev: any) => ({ ...prev, clienteDistritoReal: "" }))
        } else {
            setClienteDistritosList([])
        }
    }, [formData.clienteDepartamento, formData.clienteProvincia])

    // Efectos para desplegables de dirección de ENVÍO
    useEffect(() => {
        if (isLoadingForEditRef.current) return
        if (formData.envioDepartamento) {
            const selectedDept = peruGeoData.find((d: any) => d.departamento === formData.envioDepartamento)
            setEnvioProvincias(selectedDept ? selectedDept.provincias.map((p: any) => p.provincia) : [])
            setFormData((prev: any) => ({ ...prev, envioProvincia: "", envioDistrito: "" }))
            setEnvioDistritosList([])
        } else {
            setEnvioProvincias([])
            setEnvioDistritosList([])
        }
    }, [formData.envioDepartamento])

    useEffect(() => {
        if (isLoadingForEditRef.current) return
        if (formData.envioDepartamento && formData.envioProvincia) {
            const selectedDept = peruGeoData.find((d: any) => d.departamento === formData.envioDepartamento)
            const selectedProv = selectedDept?.provincias.find((p: any) => p.provincia === formData.envioProvincia)
            setEnvioDistritosList(selectedProv ? selectedProv.distritos : [])
            setFormData((prev: any) => ({ ...prev, envioDistrito: "" }))
        } else {
            setEnvioDistritosList([])
        }
    }, [formData.envioDepartamento, formData.envioProvincia])

    useEffect(() => {
        if (formData.lineaProducto && (productLines as any)[formData.lineaProducto]) {
            setCurrentProductLineWs((productLines as any)[formData.lineaProducto])
            if (!isLoadingForEditRef.current) setFormData((prev: any) => ({ ...prev, whatsappOrigen: "" }))
        } else {
            setCurrentProductLineWs([])
        }
    }, [formData.lineaProducto])

    useEffect(() => {
        const total = parseMontoRobust(formData.montoTotal)
        const adelanto = parseMontoRobust(formData.montoAdelanto)
        setFormData((prev: any) => ({
            ...prev,
            montoPendiente: Math.max(0, total - adelanto),
        }))
    }, [formData.montoTotal, formData.montoAdelanto])

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target

        if (name === "usarDatosClienteParaEnvio") {
            setFormData((prev: any) => ({
                ...prev,
                usarDatosClienteParaEnvio: checked,
                ...(checked && {
                    envioContacto: "",
                    envioContactoSecundario: "",
                    envioNombreCliente: "",
                    envioTipoDocumento: "",
                    envioNumeroDocumento: "",
                    envioDepartamento: "",
                    envioProvincia: "",
                    envioDistrito: "",
                    envioDireccionLima: "",
                    agenciaEnvio: "",
                }),
            }))
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }))
        }

        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: null }))
        }
    }

    const handleProductChange = (index: number, field: string, value: any) => {
        const newProductos: any[] = [...formData.productos]
        if (field === "cantidad") {
            const numValue = Number.parseInt(value)
            newProductos[index][field] = isNaN(numValue) ? 1 : numValue
        } else if (field === "productoId") {
            newProductos[index][field] = value
            // Cuando se selecciona un producto, establecer el precio activo por defecto
            const productoSeleccionado = productosDisponibles.find((p: any) => p.id === value)
            if (productoSeleccionado) {
                const precioActivo = productoSeleccionado.precios?.find((p: any) => p.activo)
                if (precioActivo) {
                    newProductos[index].precioSeleccionado = precioActivo.valor
                }
                // Resetear variante al cambiar producto
                newProductos[index].varianteId = ""
            }
        } else if (field === "precioSeleccionado") {
            newProductos[index][field] = parseMontoRobust(value) || 0
        } else if (field === "varianteId") {
            const productoSeleccionado = productosDisponibles.find((p: any) => p.id === newProductos[index].productoId)
            const precioBase = newProductos[index].precioSeleccionado || 0

            // Si había una variante anterior, restar su precio adicional
            if (newProductos[index].varianteId) {
                const varianteAnterior = productoSeleccionado?.variantes?.find((v: any) => v.id === newProductos[index].varianteId)
                if (varianteAnterior) {
                    newProductos[index].precioSeleccionado = precioBase - (varianteAnterior.precioAdicional || 0)
                }
            }

            newProductos[index][field] = value

            // Si se selecciona una nueva variante, sumar su precio adicional
            if (value && productoSeleccionado) {
                const variante = productoSeleccionado.variantes?.find((v: any) => v.id === value)
                if (variante) {
                    newProductos[index].precioSeleccionado = (newProductos[index].precioSeleccionado || precioBase) + (variante.precioAdicional || 0)
                }
            }
        } else {
            newProductos[index][field] = value
        }
        setFormData((prev: any) => ({ ...prev, productos: newProductos }))

        // Recalcular montoTotal cuando cambia un producto o su precio
        if (field === "productoId" || field === "precioSeleccionado" || field === "cantidad" || field === "varianteId") {
            calcularMontoTotal(newProductos)
        }
    }

    const calcularMontoTotal = (productosArray: any) => {
        let total = 0
        productosArray.forEach((prod: any) => {
            if (prod.productoId && prod.precioSeleccionado) {
                total += parseMontoRobust(prod.precioSeleccionado) * (parseInt(prod.cantidad) || 1)
            }
        })
        setFormData(prev => ({
            ...prev,
            montoTotal: total,
            montoPendiente: Math.max(0, total - (prev.montoAdelanto || 0)),
        }))
    }

    // Recalcular montoPendiente cuando cambia montoAdelanto
    useEffect(() => {
        if (formData.montoTotal !== undefined) {
            setFormData(prev => ({
                ...prev,
                montoPendiente: Math.max(0, (prev.montoTotal || 0) - (prev.montoAdelanto || 0)),
            }))
        }
    }, [formData.montoAdelanto, formData.montoTotal])

    const handlePrendaDetailChange = (productIndex: any, prendaIndex: any, field: any, value: any) => {
        const newProductos: any[] = [...formData.productos]
        const currentPrendaDetail = newProductos[productIndex].detallesPrenda[prendaIndex] as any
        currentPrendaDetail[field] = value

        // Si cambia el color, resetear la talla
        if (field === "color") {
            currentPrendaDetail.talla = ""
        }

        setFormData((prev: any) => ({ ...prev, productos: newProductos }))

        // Alerta de stock
        const cp = currentPrendaDetail as any
        if (cp.color && cp.talla && cp.tipoPrenda) {
            const gInv: any = ((mockDatabase.inventarioPrendas as any) || [])
            const garmentInInventory = gInv.find((item: any) =>
                item.tipoPrenda === cp.tipoPrenda &&
                item.color === cp.color &&
                item.talla === cp.talla
            )
            const stockActual = garmentInInventory ? (garmentInInventory as any).cantidad : 0

            if (stockActual === 0) {
                alert(
                    `¡Sin stock para ${currentPrendaDetail.tipoPrenda} ${currentPrendaDetail.color} Talla ${currentPrendaDetail.talla}! El pedido se puede crear, pero se validará en Cobranza.`,
                )
            } else if (stockActual > 0 && stockActual <= 5) {
                alert(
                    ` Quedan pocas unidades de ${currentPrendaDetail.tipoPrenda} ${currentPrendaDetail.color} Talla ${currentPrendaDetail.talla}: solo ${stockActual} disponibles.`,
                )
            }
        }
    }

    const addProduct = () => {
        setFormData((prev: any) => ({
            ...prev,
            productos: [
                ...prev.productos,
                {
                    id: crypto.randomUUID(),
                    productoId: "",
                    cantidad: 1,
                    precioSeleccionado: 0,
                    varianteId: "",
                    imagenReferencial: null,
                },
            ],
        }))
    }

    const removeProduct = (index: number) => {
        const newProductos = formData.productos.filter((_: any, i: number) => i !== index)
        setFormData((prev: any) => ({ ...prev, productos: newProductos }))
    }

    const addRegalo = () => {
        setFormData((prev: any) => ({
            ...prev,
            regalos: [
                ...prev.regalos,
                {
                    id: crypto.randomUUID(),
                    regaloId: "",
                    cantidad: 1,
                },
            ],
        }))
    }

    const removeRegalo = (index: number) => {
        const newRegalos = formData.regalos.filter((_: any, i: any) => i !== index)
        setFormData((prev: any) => ({ ...prev, regalos: newRegalos }))
    }

    const handleCantidadChange = (e: any, index: any, field: any) => {
        const newRegalos: any[] = [...formData.regalos]
        newRegalos[index][field] = e.target.value
        if (field === "cantidad") {
            const numValue = parseMontoRobust(e.target.value)
            newRegalos[index][field] = isNaN(numValue) ? 1 : numValue
        }
        setFormData((prev: any) => ({ ...prev, regalos: newRegalos }))
    }

    const handleCostoUnitarioChange = (e: any, index: any, field: any) => {
        const newRegalos: any[] = [...formData.regalos]
        newRegalos[index][field] = e.target.value
        if (field === "cantidad") {
            const numValue = parseMontoRobust(e.target.value)
            newRegalos[index][field] = isNaN(numValue) ? 1 : numValue
        }
        setFormData((prev: any) => ({ ...prev, regalos: newRegalos }))
    }

    const handleRegaloChange = (index: any, field: any, value: any) => {
        const newRegalos = [...formData.regalos] as any[]
        newRegalos[index][field] = value
        if (field === "cantidad") {
            const numValue = parseMontoRobust(value)
            newRegalos[index][field] = isNaN(numValue) ? 1 : numValue
        }
        setFormData((prev: any) => ({ ...prev, regalos: newRegalos }))
    }

    const handleAgregarComentario = () => {
        if (!nuevoComentario.trim()) {
            alert("Escribe un comentario.")
            return
        }
        const comentario = {
            id: crypto.randomUUID(),
            texto: nuevoComentario,
            autor: currentUser?.email || "Sistema",
            fecha: new Date().toLocaleString(),
            timestamp: new Date(),
        }
        setFormData((prev: any) => ({
            ...prev,
            comentarios: [comentario, ...prev.comentarios],
        }))
        setNuevoComentario("")
    }

    // Función para buscar cliente existente
    const buscarCliente = async () => {
        if (!busquedaCliente.trim()) {
            alert("Ingresa un DNI, número de celular u otro dato identificador")
            return
        }

        const busqueda = busquedaCliente.trim().toLowerCase()

        // Primero buscar en la colección de clientes
        let clienteEncontrado = mockDatabase.clientes.find((cliente: any) => {
            // Buscar por DNI
            if (cliente.clienteNumeroDocumento && cliente.clienteNumeroDocumento.toLowerCase().includes(busqueda)) {
                return true
            }
            // Buscar por número de contacto
            if (cliente.clienteContacto && cliente.clienteContacto.toLowerCase().includes(busqueda)) {
                return true
            }
            // Buscar por nombre completo
            const nombreCompleto = `${cliente.clienteNombre || ""} ${cliente.clienteApellidos || ""}`.toLowerCase()
            if (nombreCompleto.includes(busqueda)) {
                return true
            }
            // Buscar por correo
            if (cliente.clienteCorreo && cliente.clienteCorreo.toLowerCase().includes(busqueda)) {
                return true
            }
            return false
        })

        // Si no se encuentra en clientes, buscar en pedidos (compatibilidad)
        if (!clienteEncontrado) {
            const pedidoConCliente = mockDatabase.pedidos.find((pedido: any) => {
                if (pedido.clienteNumeroDocumento && pedido.clienteNumeroDocumento.toLowerCase().includes(busqueda)) {
                    return true
                }
                if (pedido.clienteContacto && pedido.clienteContacto.toLowerCase().includes(busqueda)) {
                    return true
                }
                const nombreCompleto = `${pedido.clienteNombre || ""} ${pedido.clienteApellidos || ""}`.toLowerCase()
                if (nombreCompleto.includes(busqueda)) {
                    return true
                }
                if (pedido.clienteCorreo && pedido.clienteCorreo.toLowerCase().includes(busqueda)) {
                    return true
                }
                return false
            })

            if (pedidoConCliente) {
                // Crear cliente desde el pedido encontrado
                clienteEncontrado = {
                    clienteNombre: pedidoConCliente.clienteNombre || "",
                    clienteApellidos: pedidoConCliente.clienteApellidos || "",
                    clienteContacto: pedidoConCliente.clienteContacto || "",
                    clienteContactoSecundario: pedidoConCliente.clienteContactoSecundario || "",
                    clienteCorreo: pedidoConCliente.clienteCorreo || "",
                    clienteTipoDocumento: pedidoConCliente.clienteTipoDocumento || "",
                    clienteNumeroDocumento: pedidoConCliente.clienteNumeroDocumento || "",
                    clienteDepartamento: pedidoConCliente.clienteDepartamento || "",
                    clienteProvincia: pedidoConCliente.clienteProvincia || "",
                    clienteDistrito: pedidoConCliente.clienteDistritoReal || "",
                    pedidosIds: [pedidoConCliente.id],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            }
        }

        if (clienteEncontrado) {
            setClienteEncontrado(clienteEncontrado)

            // Autocompletar solo los datos del cliente
            setFormData((prev: any) => ({
                ...prev,
                clienteNombre: clienteEncontrado.clienteNombre || "",
                clienteApellidos: clienteEncontrado.clienteApellidos || "",
                clienteContacto: clienteEncontrado.clienteContacto || "",
                clienteContactoSecundario: clienteEncontrado.clienteContactoSecundario || "",
                clienteCorreo: clienteEncontrado.clienteCorreo || "",
                clienteTipoDocumento: clienteEncontrado.clienteTipoDocumento || "",
                clienteNumeroDocumento: clienteEncontrado.clienteNumeroDocumento || "",
                clienteDepartamento: clienteEncontrado.clienteDepartamento || "",
                clienteProvincia: clienteEncontrado.clienteProvincia || "",
                clienteDistritoReal: clienteEncontrado.clienteDistrito || "",
            }))

            // Esperar un momento para que se actualicen los dropdowns de provincia y distrito
            setTimeout(() => {
                if (clienteEncontrado.clienteDepartamento) {
                    const selectedDept = peruGeoData.find((d: any) => d.departamento === clienteEncontrado.clienteDepartamento)
                    if (selectedDept) {
                        setClienteProvinciasList(selectedDept.provincias.map((p: any) => p.provincia))

                        if (clienteEncontrado.clienteProvincia) {
                            const selectedProv = selectedDept.provincias.find((p: any) => p.provincia === clienteEncontrado.clienteProvincia)
                            if (selectedProv) {
                                setClienteDistritosList(selectedProv.distritos)
                            }
                        }
                    }
                }
            }, 100)

            alert(`Cliente encontrado: ${clienteEncontrado.clienteNombre} ${clienteEncontrado.clienteApellidos}`)
        } else {
            alert("No se encontró ningún cliente con ese dato. Se creará un nuevo cliente al guardar el pedido.")
            setClienteEncontrado(null)
        }
    }

    const limpiarBusquedaCliente = () => {
        setBusquedaCliente("")
        setClienteEncontrado(null)
    }

    const handleFileChangeForProduct = (index: any, field: any, file: any) => {
        const newProductos: any[] = [...formData.productos]
        newProductos[index][field] = file
        setFormData((prev: any) => ({ ...prev, productos: newProductos }))
    }

    const handleComprobantesPagoChange = (files: any) => {
        setFormData((prev: any) => ({ ...prev, comprobantesPago: files }))
    }

    const validateForm = () => {
        const newErrors: any = {}
        // Datos del Cliente
        if (!formData.clienteContacto.trim()) newErrors.clienteContacto = "El contacto principal es obligatorio."
        else if (!/^\d{9,11}$/.test(formData.clienteContacto.trim()))
            newErrors.clienteContacto = "El contacto principal debe tener entre 9 y 11 dígitos."
        if (formData.clienteContactoSecundario.trim() && !/^\d{9,11}$/.test(formData.clienteContactoSecundario.trim()))
            newErrors.clienteContactoSecundario = "El contacto secundario debe tener entre 9 y 11 dígitos."
        if (!formData.clienteNombre.trim()) newErrors.clienteNombre = "El nombre del cliente es obligatorio."
        if (!formData.clienteApellidos.trim()) newErrors.clienteApellidos = "Los apellidos del cliente son obligatorios."
        const tipoDocCliente = typeof formData.clienteTipoDocumento === "object" && formData.clienteTipoDocumento != null
            ? (formData.clienteTipoDocumento.value ?? formData.clienteTipoDocumento.label ?? "")
            : (formData.clienteTipoDocumento ?? "")
        if (!String(tipoDocCliente).trim()) newErrors.clienteTipoDocumento = "El tipo de documento es obligatorio."
        if (!formData.clienteNumeroDocumento.trim())
            newErrors.clienteNumeroDocumento = "El número de documento es obligatorio."
        if (!formData.clienteDepartamento) newErrors.clienteDepartamento = "El departamento del cliente es obligatorio."
        if (!formData.clienteProvincia && clienteProvinciasList.length > 0)
            newErrors.clienteProvincia = "La provincia del cliente es obligatoria."
        if (!formData.clienteDistritoReal && clienteDistritosList.length > 0)
            newErrors.clienteDistritoReal = "El distrito del cliente es obligatorio."

        // Detalles del Pedido
        if (!formData.canalVenta) newErrors.canalVenta = "El canal de venta es obligatorio."
        if (!formData.activador) newErrors.activador = "El activador es obligatorio."
        if (!formData.lineaProducto) newErrors.lineaProducto = "La línea de producto es obligatoria."
        if (!formData.whatsappOrigen && currentProductLineWs.length > 0)
            newErrors.whatsappOrigen = "El WhatsApp de origen es obligatorio."
        if (!formData.vendedor) newErrors.vendedor = "El vendedor es obligatorio."
        if (formData.productos.every((p: any) => !p.productoId) && formData.regalos.every((r: any) => !r.regaloId)) {
            newErrors.productosGenerales = "Debe seleccionar al menos un producto o regalo."
        }

        // Detalles de Entrega y Envío
        if (!formData.usarDatosClienteParaEnvio) {
            if (!formData.envioContacto.trim()) newErrors.envioContacto = "El contacto de envío es obligatorio."
            else if (!/^\d{9,11}$/.test(formData.envioContacto.trim()))
                newErrors.envioContacto = "El contacto de envío debe tener entre 9 y 11 dígitos."
            if (formData.envioContactoSecundario.trim() && !/^\d{9,11}$/.test(formData.envioContactoSecundario.trim()))
                newErrors.envioContactoSecundario = "El contacto secundario de envío debe tener entre 9 y 11 dígitos."
            if (!formData.envioNombreCliente.trim())
                newErrors.envioNombreCliente = "El nombre del destinatario es obligatorio."
            if (!formData.envioTipoDocumento)
                newErrors.envioTipoDocumento = "El tipo de documento del destinatario es obligatorio."
            if (!formData.envioNumeroDocumento.trim())
                newErrors.envioNumeroDocumento = "El número de documento del destinatario es obligatorio."
            if (!formData.envioDepartamento) newErrors.envioDepartamento = "El departamento de envío es obligatorio."
            if (!formData.envioProvincia && envioProvincias.length > 0)
                newErrors.envioProvincia = "La provincia de envío es obligatoria."
            if (!formData.envioDistrito && envioDistritosList.length > 0)
                newErrors.envioDistrito = "El distrito de envío es obligatorio."

            const esLimaEnvio = formData.envioDepartamento === "Lima"
            if (esLimaEnvio && !formData.envioDireccionLima.trim()) {
                newErrors.envioDireccionLima = "La dirección de entrega es obligatoria cuando el envío es a Lima."
            }
            if (!esLimaEnvio && !formData.agenciaEnvio && formData.envioDepartamento) {
                newErrors.agenciaEnvio = "La agencia de envío es obligatoria cuando el envío es a Provincia."
            }
        } else {
            const esLimaCliente = formData.clienteDepartamento === "Lima"
            if (esLimaCliente && !formData.envioDireccionLima.trim()) {
                newErrors.envioDireccionLima = "La dirección de entrega es obligatoria cuando el envío es a Lima."
            }
            if (!esLimaCliente && !formData.agenciaEnvio && formData.clienteDepartamento) {
                newErrors.agenciaEnvio = "La agencia de envío es obligatoria cuando el envío es a Provincia."
            }
        }

        // Detalles de Pago
        if (formData.montoAdelanto < 0) newErrors.montoAdelanto = "El adelanto no puede ser negativo."
        if (
            parseMontoRobust(formData.montoTotal) <= 0 &&
            formData.productos.length > 0 &&
            formData.productos.some((p: any) => p.productoId)
        ) {
            newErrors.montoTotal = "El monto total debe ser mayor a cero."
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        if (!validateForm()) {
            const firstErrorKey = Object.keys(errors)[0]
            const firstErrorMessage = errors[firstErrorKey] || "Error desconocido en el formulario."
            alert(`Por favor, corrija los errores en el formulario. El primer error es: ${firstErrorMessage}`)
            return
        }

        if (!isEditMode) {
            const montoTotal = parseMontoRobust(formData.montoTotal)
            const adelanto = parseMontoRobust(formData.montoAdelanto)
            if (montoTotal > 0 && adelanto < 0.3 * montoTotal) {
                const ok = window.confirm(
                    "El cliente será clasificado como mostacero hasta que abone un monto mayor al 30% del total.\n\n¿Desea registrar el pedido?"
                )
                if (!ok) return
            }
        }

        // Buscar o crear cliente
        let clienteId = null
        if (formData.clienteNumeroDocumento && formData.clienteNumeroDocumento.trim()) {
            // Buscar cliente existente por DNI
            const clienteExistente = mockDatabase.clientes.find((c: any) => c.clienteNumeroDocumento && c.clienteNumeroDocumento.trim().toLowerCase() === formData.clienteNumeroDocumento.trim().toLowerCase()
            )

            if (clienteExistente) {
                // Actualizar cliente existente
                clienteId = clienteExistente.id
                await mockFirestore.doc("clientes", clienteId).update({
                    clienteNombre: formData.clienteNombre,
                    clienteApellidos: formData.clienteApellidos,
                    clienteContacto: formData.clienteContacto,
                    clienteContactoSecundario: formData.clienteContactoSecundario,
                    clienteCorreo: formData.clienteCorreo,
                    clienteTipoDocumento: formData.clienteTipoDocumento,
                    clienteNumeroDocumento: formData.clienteNumeroDocumento,
                    clienteDepartamento: formData.clienteDepartamento,
                    clienteProvincia: formData.clienteProvincia,
                    clienteDistrito: formData.clienteDistritoReal,
                    updatedAt: new Date(),
                    ultimoPedido: new Date(),
                    // Actualizar estadísticas
                    totalPedidos: (clienteExistente.totalPedidos || 0) + 1,
                    totalGastado: (clienteExistente.totalGastado || 0) + (parseMontoRobust(formData.montoTotal)),
                })
            } else {
                // Crear nuevo cliente
                const nuevoCliente = {
                    // Datos básicos
                    clienteNombre: formData.clienteNombre,
                    clienteApellidos: formData.clienteApellidos,
                    clienteContacto: formData.clienteContacto, // WhatsApp principal
                    clienteContactoSecundario: formData.clienteContactoSecundario,
                    clienteCorreo: formData.clienteCorreo,
                    clienteTipoDocumento: formData.clienteTipoDocumento,
                    clienteNumeroDocumento: formData.clienteNumeroDocumento,
                    // Ubicación
                    clienteDepartamento: formData.clienteDepartamento,
                    clienteProvincia: formData.clienteProvincia,
                    clienteDistrito: formData.clienteDistritoReal,
                    // Relaciones y tracking
                    pedidosIds: [],
                    leadsIds: [], // IDs de leads asociados
                    // Estadísticas
                    totalPedidos: 0,
                    totalGastado: 0,
                    ultimoPedido: new Date(),
                    primerPedido: new Date(),
                    // Metadatos
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    // Estado (para Leads)
                    esCliente: true, // true = Cliente, false = Lead
                    etapaVenta: null, // Para leads: "interesado", "cotizacion", "seguimiento", etc.
                }
                const result = await mockFirestore.collection("clientes").add(nuevoCliente)
                clienteId = result.id

                // Actualizar estadísticas del nuevo cliente
                await mockFirestore.doc("clientes", clienteId).update({
                    totalPedidos: 1,
                    totalGastado: parseMontoRobust(formData.montoTotal),
                })
            }
        }

        const processedProductos = formData.productos.map((p: any) => ({
            ...p,
            imagenProductoReferencia:
                p.imagenProductoReferencia instanceof File ? p.imagenProductoReferencia.name : p.imagenProductoReferencia,
        }))

        // Procesar productos y regalos
        const productosProcesados = formData.productos
            .filter((p: any) => p.productoId)
            .map((p: any) => ({
                productoId: p.productoId,
                cantidad: Number.parseInt(p.cantidad) || 1,
                precioSeleccionado: p.precioSeleccionado || 0,
                varianteId: p.varianteId || null,
                imagenReferencial: p.imagenReferencial,
            }))

        const regalosProcesados = formData.regalos
            .filter((r: any) => r.regaloId)
            .map((r: any) => ({
                productoId: r.regaloId,
                cantidad: Number.parseInt(r.cantidad) || 1,
            }))

        const clienteTipoDocStr = typeof formData.clienteTipoDocumento === "object" && formData.clienteTipoDocumento != null
            ? (formData.clienteTipoDocumento.value ?? formData.clienteTipoDocumento.label ?? "")
            : (formData.clienteTipoDocumento ?? "")
        const tallaResumida =
            (formData.talla && String(formData.talla).trim()) ||
            (() => {
                const tallas: string[] = []
                ;(formData.productos || []).forEach((p: any) => {
                    if (Array.isArray(p.detallesPrenda)) {
                        p.detallesPrenda.forEach((d: any) => {
                            if (d?.talla && String(d.talla).trim()) tallas.push(String(d.talla).trim())
                        })
                    } else if (p?.talla && String(p.talla).trim()) tallas.push(String(p.talla).trim())
                })
                return [...new Set(tallas)].join(", ")
            })()

        const pedidoData: any = {
            ...formData,
            talla: tallaResumida,
            clienteTipoDocumento: clienteTipoDocStr,
            productos: [...productosProcesados, ...regalosProcesados],
            montoTotal: parseMontoRobust(formData.montoTotal),
            montoAdelanto: parseMontoRobust(formData.montoAdelanto),
            montoPendiente: parseMontoRobust(formData.montoPendiente) ?? (parseMontoRobust(formData.montoTotal) - parseMontoRobust(formData.montoAdelanto) - (parseMontoRobust(formData.cobranza?.pago1) || 0) - (parseMontoRobust(formData.cobranza?.pago2) || 0)),
            montoMostacero: parseMontoRobust(formData.montoMostacero) ?? 0,
            fechaEnvio: formData.fechaEnvio || null,
            createdAt: isEditMode ? undefined : new Date(),
            updatedAt: isEditMode ? new Date() : undefined,
            userId: currentUser ? currentUser.uid : "unknown_user",
            historialModificaciones: [
                {
                    timestamp: new Date(),
                    usuarioId: currentUser ? currentUser.uid : "system",
                    usuarioEmail: currentUser ? currentUser.email : "system",
                    accion: isEditMode ? "Pedido Actualizado" : "Pedido Creado",
                    detalle: `${isEditMode ? "Pedido actualizado" : "Pedido registrado"} por ${currentUser ? currentUser.email : "sistema"}`,
                },
            ],
        }

        // Si es un nuevo pedido, inicializar tracking de diseño automáticamente
        if (!isEditMode) {
            pedidoData.importado = false
            pedidoData.status = "diseño"
            pedidoData.estadoGeneral = "En Diseño"
            pedidoData.diseño = {
                fechaEntrada: new Date(),
                fechaSalida: null,
                diseñadorAsignado: null,
                diseñadorNombre: null,
                estado: "",
                urlImagen: "",
            }
            // Inicializar otras etapas con valores por defecto
            pedidoData.cobranza = {
                fechaEntrada: null,
                fechaSalida: null,
                estado: "",
                pago1: 0,
                pago2: 0,
                accion: "",
            }
            pedidoData.preparacion = {
                fechaEntrada: null,
                fechaSalida: null,
                operador: null,
                operadorNombre: null,
                estado: "",
            }
            pedidoData.estampado = {
                fechaEntrada: null,
                fechaSalida: null,
                operador: null,
                operadorNombre: null,
                estado: "",
            }
            pedidoData.empaquetado = {
                fechaEntrada: null,
                fechaSalida: null,
                operador: null,
                operadorNombre: null,
                estado: "",
            }
            pedidoData.reparto = {
                fechaEntrada: null,
                fechaSalida: null,
                fechaFinalizado: null,
                repartidor: null,
                repartidorNombre: null,
                estado: "",
            }
            pedidoData.tiempos = {
                diseño: null,
                cobranza: null,
                preparacion: null,
                estampado: null,
                empaquetado: null,
                reparto: null,
                total: null,
            }
        }

        if (isEditMode && pedidoId) {
            pedidoData.id = pedidoId
            const existing = mockDatabase.pedidos.find((p: any) => p.id === pedidoId)
            if (existing?.importado === true) pedidoData.importado = true
            pedidoData.historialModificaciones = [...(existing?.historialModificaciones || []), ...(pedidoData.historialModificaciones || [])]
        }

        // Agregar clienteId al pedido
        if (clienteId) {
            pedidoData.clienteId = clienteId
        }

        if (formData.usarDatosClienteParaEnvio) {
            pedidoData.envioNombres = formData.clienteNombre
            pedidoData.envioApellidos = formData.clienteApellidos
            pedidoData.envioContacto = formData.clienteContacto
            pedidoData.envioContactoSecundario = formData.clienteContactoSecundario
            pedidoData.envioNombreCliente = `${formData.clienteNombre} ${formData.clienteApellidos}`.trim()
            pedidoData.envioTipoDocumento = clienteTipoDocStr
            pedidoData.envioNumeroDocumento = formData.clienteNumeroDocumento
            pedidoData.envioDepartamento = formData.clienteDepartamento
            pedidoData.envioProvincia = formData.clienteProvincia
            pedidoData.envioDistrito = formData.clienteDistritoReal
        } else {
            pedidoData.envioNombreCliente = `${formData.envioNombres} ${formData.envioApellidos}`.trim()
        }

        try {
            await onSave(pedidoData)

            // Actualizar relación cliente-pedido después de guardar
            if (clienteId && !isEditMode) {
                const cliente = mockDatabase.clientes.find((c: any) => c.id === clienteId)
                if (cliente) {
                    // Obtener el ID del pedido recién creado (el último en la lista)
                    const pedidoGuardado = mockDatabase.pedidos[mockDatabase.pedidos.length - 1]
                    if (pedidoGuardado && pedidoGuardado.id) {
                        const pedidosIdsActualizados = [...(cliente.pedidosIds || []), pedidoGuardado.id]
                        await mockFirestore.doc("clientes", clienteId).update({
                            pedidosIds: pedidosIdsActualizados,
                            ultimoPedido: new Date(),
                        })
                    }
                }
            }

            setFormData(initialFormState)
            onClose()
        } catch (error: any) {
            console.error("Error al guardar pedido:", error)
            alert("Error al guardar el pedido: " + error.message)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? ` Editando Pedido #${pedidoId}` : " Registrar Nuevo Pedido"} size="6xl">
            <form id="registrar-pedido-form" onSubmit={handleSubmit} className="space-y-6">
                <Accordion type="single" collapsible className="w-full" defaultValue="cliente">
                    {/* SECCIÓN 1: DATOS DEL CLIENTE */}
                    <AccordionItem value="cliente">
                        <AccordionTrigger className="text-lg font-bold text-blue-700 bg-blue-50 px-4 rounded-t-lg hover:bg-blue-100 transition-colors">
                            1. Datos del Cliente
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 border-blue-100 rounded-b-lg bg-white shadow-sm">
                            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Cliente Existente</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por DNI, Nombre o Celular..."
                                            value={busquedaCliente}
                                            onChange={(e) => setBusquedaCliente(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarCliente())}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                        />
                                    </div>
                                    <Button onClick={buscarCliente} iconLeft={<Search className="w-4 h-4" />}>
                                        Buscar
                                    </Button>
                                    {clienteEncontrado && (
                                        <Button variant="ghost" onClick={limpiarBusquedaCliente} iconLeft={<X className="w-4 h-4" />}>
                                            Limpiar
                                        </Button>
                                    )}
                                </div>
                                {clienteEncontrado && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span className="text-sm font-medium">
                                            Cliente seleccionado: {clienteEncontrado.clienteNombre} {clienteEncontrado.clienteApellidos}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                <Input
                                    label="Celular Principal"
                                    id="clienteContacto"
                                    name="clienteContacto"
                                    value={formData.clienteContacto}
                                    onChange={handleChange}
                                    placeholder="Ej: 999888777"
                                    required
                                    error={errors.clienteContacto}
                                />
                                <Input
                                    label="Celular Secundario (Opcional)"
                                    id="clienteContactoSecundario"
                                    name="clienteContactoSecundario"
                                    value={formData.clienteContactoSecundario}
                                    onChange={handleChange}
                                    placeholder="Ej: 999888777"
                                    error={errors.clienteContactoSecundario}
                                />
                                <Input
                                    label="Correo Electrónico (Opcional)"
                                    id="clienteCorreo"
                                    name="clienteCorreo"
                                    type="email"
                                    value={formData.clienteCorreo}
                                    onChange={handleChange}
                                    placeholder="cliente@ejemplo.com"
                                />

                                <Input
                                    label="Nombres"
                                    id="clienteNombre"
                                    name="clienteNombre"
                                    value={formData.clienteNombre}
                                    onChange={handleChange}
                                    placeholder="Nombres del cliente"
                                    required
                                    error={errors.clienteNombre}
                                />
                                <Input
                                    label="Apellidos"
                                    id="clienteApellidos"
                                    name="clienteApellidos"
                                    value={formData.clienteApellidos}
                                    onChange={handleChange}
                                    placeholder="Apellidos del cliente"
                                    required
                                    error={errors.clienteApellidos}
                                />

                                <Select
                                    label="Tipo Documento"
                                    id="clienteTipoDocumento"
                                    name="clienteTipoDocumento"
                                    value={formData.clienteTipoDocumento}
                                    onChange={handleChange}
                                    options={tiposDocumento.map((td) => ({ value: td, label: td }))}
                                    placeholder="Seleccionar tipo de documento"
                                    required
                                    error={errors.clienteTipoDocumento}
                                />
                                <Input
                                    label="Número Documento"
                                    id="clienteNumeroDocumento"
                                    name="clienteNumeroDocumento"
                                    value={formData.clienteNumeroDocumento}
                                    onChange={handleChange}
                                    placeholder="DNI / RUC"
                                    required
                                    error={errors.clienteNumeroDocumento}
                                />

                                <Select
                                    label="Departamento"
                                    id="clienteDepartamento"
                                    name="clienteDepartamento"
                                    value={formData.clienteDepartamento}
                                    onChange={handleChange}
                                    options={peruGeoData.map((d: any) => ({ value: d.departamento, label: d.departamento }))}
                                    placeholder="Seleccione Departamento"
                                    required
                                    error={errors.clienteDepartamento}
                                />
                                <Select
                                    label="Provincia"
                                    id="clienteProvincia"
                                    name="clienteProvincia"
                                    value={formData.clienteProvincia}
                                    onChange={handleChange}
                                    options={clienteProvinciasList.map((p) => ({ value: p, label: p }))}
                                    placeholder="Seleccione Provincia"
                                    required
                                    disabled={!formData.clienteDepartamento}
                                    error={errors.clienteProvincia}
                                />
                                <Select
                                    label="Distrito"
                                    id="clienteDistritoReal"
                                    name="clienteDistritoReal"
                                    value={formData.clienteDistritoReal}
                                    onChange={handleChange}
                                    options={clienteDistritosList.map((d) => ({ value: d, label: d }))}
                                    placeholder="Seleccione Distrito"
                                    required
                                    disabled={!formData.clienteProvincia}
                                    error={errors.clienteDistritoReal}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* SECCIÓN 2: DETALLES DEL PEDIDO */}
                    <AccordionItem value="pedido">
                        <AccordionTrigger className="text-lg font-bold text-blue-700 bg-blue-50 px-4 rounded-t-lg hover:bg-blue-100 transition-colors">
                            2. Detalles del Pedido
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 border-blue-100 rounded-b-lg bg-white shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <Select
                                    label="Canal de Venta"
                                    id="canalVenta"
                                    name="canalVenta"
                                    value={formData.canalVenta}
                                    onChange={handleChange}
                                    options={salesChannels.map((c) => ({ value: c, label: c }))}
                                    placeholder="Seleccionar canal de venta"
                                    required
                                    error={errors.canalVenta}
                                />
                                <Select
                                    label="Activador (Diseñador)"
                                    id="activador"
                                    name="activador"
                                    value={formData.activador}
                                    onChange={handleChange}
                                    options={activadores.map((a: any) => ({ value: typeof a === "string" ? a : (a?.nombre ?? ""), label: typeof a === "string" ? a : (a?.nombre ?? "") }))}
                                    placeholder="Seleccionar activador"
                                    required
                                    error={errors.activador}
                                />
                                <Select
                                    label="Línea de Producto"
                                    id="lineaProducto"
                                    name="lineaProducto"
                                    value={formData.lineaProducto}
                                    onChange={handleChange}
                                    options={Object.keys(productLines).map((l) => ({ value: l, label: l }))}
                                    placeholder="Seleccionar línea de producto"
                                    required
                                    error={errors.lineaProducto}
                                />
                                <Select
                                    label="WhatsApp Origen"
                                    id="whatsappOrigen"
                                    name="whatsappOrigen"
                                    value={formData.whatsappOrigen}
                                    onChange={handleChange}
                                    options={currentProductLineWs.map((ws) => ({ value: ws, label: ws }))}
                                    placeholder="Seleccionar WhatsApp origen"
                                    required
                                    error={errors.whatsappOrigen}
                                    disabled={!formData.lineaProducto}
                                />
                                <Select
                                    label="Vendedor Asignado"
                                    id="vendedor"
                                    name="vendedor"
                                    value={formData.vendedor}
                                    onChange={handleChange}
                                    options={(Array.isArray(mockDatabase.configuracion?.vendedores) ? mockDatabase.configuracion.vendedores : vendedores).map((v) => ({ value: v, label: v }))}
                                    placeholder="Seleccionar Vendedor Asignado"
                                    required
                                    error={errors.vendedor}
                                />
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        id="esPersonalizado"
                                        name="esPersonalizado"
                                        checked={formData.esPersonalizado}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="esPersonalizado" className="ml-2 block text-sm font-semibold text-slate-700">
                                        ¿Es Pedido Personalizado?
                                    </label>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* SECCIÓN 3: PRODUCTOS */}
                    <AccordionItem value="productos">
                        <AccordionTrigger className="text-lg font-bold text-blue-700 bg-blue-50 px-4 rounded-t-lg hover:bg-blue-100 transition-colors">
                            3. Productos
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 border-blue-100 rounded-b-lg bg-white shadow-sm">
                            <div className="mb-6">
                                <Input
                                    label="Detalle de prenda (Tallas y Colores)"
                                    id="talla"
                                    name="talla"
                                    value={formData.talla}
                                    onChange={handleChange}
                                    placeholder="Ej: S, M, L, XL o tallas y colores por prenda"
                                    error={errors.talla}
                                />
                            </div>

                            {/* Lista de Productos */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-800">Productos</h3>
                                    <Button size="sm" onClick={addProduct} iconLeft={<PlusCircle className="w-4 h-4" />}>
                                        Agregar Producto
                                    </Button>
                                </div>

                                {formData.productos.map((producto: any, index: any) => {
                                    const productoSeleccionado = productosDisponibles.find((p: any) => p.id === producto.productoId)
                                    return (
                                        <div key={producto.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative transition-all hover:shadow-md">
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(index)}
                                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200"
                                                title="Eliminar producto"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                {/* Selección de Producto */}
                                                <div className="md:col-span-4">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Producto</label>
                                                    <select
                                                        value={producto.productoId}
                                                        onChange={(e) => handleProductChange(index, "productoId", e.target.value)}
                                                        className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                                    >
                                                        <option value="">Seleccionar Producto</option>
                                                        {productosDisponibles.map((p: any) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Cantidad */}
                                                <div className="md:col-span-2">
                                                    <Input
                                                        label="Cantidad"
                                                        type="number"
                                                        min="1"
                                                        value={producto.cantidad}
                                                        onChange={(e: any) => handleProductChange(index, "cantidad", e.target.value)}
                                                        className="mb-0"
                                                    />
                                                </div>

                                                {/* Variantes (si el producto tiene) */}
                                                {productoSeleccionado && productoSeleccionado.variantes && productoSeleccionado.variantes.length > 0 && (
                                                    <div className="md:col-span-3">
                                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Variante</label>
                                                        <select
                                                            value={producto.varianteId}
                                                            onChange={(e) => handleProductChange(index, "varianteId", e.target.value)}
                                                            className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                                        >
                                                            <option value="">Precio Base</option>
                                                            {productoSeleccionado.variantes.map((v: any) => (
                                                                <option key={v.id} value={v.id}>
                                                                    {v.nombre} (+{formatMoney(v.precioAdicional)})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Precio Unitario (Editable) */}
                                                <div className="md:col-span-3">
                                                    <Input
                                                        label="Precio Unit."
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={producto.precioSeleccionado}
                                                        onChange={(e: any) => handleProductChange(index, "precioSeleccionado", e.target.value)}
                                                        className="mb-0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Imagen Referencial */}
                                            <div className="mt-4">
                                                <ImageUpload
                                                    label="Referencia Visual (Opcional)"
                                                    id={`imagen-prod-${index}`}
                                                    currentFile={producto.imagenReferencial}
                                                    onFileChange={(file: any) => handleFileChangeForProduct(index, "imagenReferencial", file)}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                {errors.productosGenerales && <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded">{errors.productosGenerales}</p>}
                            </div>

                            {/* Lista de Regalos */}
                            <div className="space-y-6 mt-8 pt-6 border-t border-slate-200">
                                <div className="flex justify-between items-center pb-2">
                                    <h3 className="text-lg font-semibold text-slate-800">Regalos (Opcional)</h3>
                                    <Button size="sm" variant="outline" onClick={addRegalo} iconLeft={<PlusCircle className="w-4 h-4" />}>
                                        Agregar Regalo
                                    </Button>
                                </div>

                                {formData.regalos.map((regalo: any, index: any) => (
                                    <div key={regalo.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 relative flex gap-4 items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeRegalo(index)}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1">
                                            <Select
                                                label="Regalo"
                                                value={regalo.regaloId}
                                                onChange={(e: any) => handleRegaloChange(index, "regaloId", e.target.value)}
                                                options={regalosList.map((r: any) => ({ value: r, label: r }))}
                                                placeholder="Seleccionar Regalo"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                label="Cant."
                                                type="number"
                                                min="1"
                                                value={regalo.cantidad}
                                                onChange={(e: any) => handleCantidadChange(e, index, "cantidad")}
                                                className="mb-0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* SECCIÓN 4: DATOS DE ENTREGA Y ENVÍO */}
                    <AccordionItem value="envio">
                        <AccordionTrigger className="text-lg font-bold text-blue-700 bg-blue-50 px-4 rounded-t-lg hover:bg-blue-100 transition-colors">
                            4. Datos de Entrega y Envío
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 border-blue-100 rounded-b-lg bg-white shadow-sm">
                            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="usarDatosClienteParaEnvio"
                                        name="usarDatosClienteParaEnvio"
                                        checked={formData.usarDatosClienteParaEnvio}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="usarDatosClienteParaEnvio" className="ml-2 block text-sm font-semibold text-slate-700">
                                        Usar mismos datos del Cliente para el Envío
                                    </label>
                                </div>
                            </div>

                            {!formData.usarDatosClienteParaEnvio && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 animate-in fade-in zoom-in-95 duration-200">
                                    {/* Campos de envío manuales similares a los de cliente */}
                                    <Input label="Celular Destinatario" name="envioContacto" value={formData.envioContacto} onChange={handleChange} required error={errors.envioContacto} />
                                    <Input label="Celular Secundario" name="envioContactoSecundario" value={formData.envioContactoSecundario} onChange={handleChange} error={errors.envioContactoSecundario} />
                                    <Input label="Nombres Destinatario" name="envioNombres" value={formData.envioNombres} onChange={handleChange} required />
                                    <Input label="Apellidos Destinatario" name="envioApellidos" value={formData.envioApellidos} onChange={handleChange} required />
                                    <Select label="Tipo Doc." name="envioTipoDocumento" value={formData.envioTipoDocumento} onChange={handleChange} options={tiposDocumento.map(t => ({ value: t, label: t }))} required error={errors.envioTipoDocumento} />
                                    <Input label="Num. Doc." name="envioNumeroDocumento" value={formData.envioNumeroDocumento} onChange={handleChange} required error={errors.envioNumeroDocumento} />

                                    <Select label="Departamento" name="envioDepartamento" value={formData.envioDepartamento} onChange={handleChange} options={peruGeoData.map(d => ({ value: d.departamento, label: d.departamento }))} required error={errors.envioDepartamento} />
                                    <Select label="Provincia" name="envioProvincia" value={formData.envioProvincia} onChange={handleChange} options={envioProvincias.map(p => ({ value: p, label: p }))} required disabled={!formData.envioDepartamento} error={errors.envioProvincia} />
                                    <Select label="Distrito" name="envioDistrito" value={formData.envioDistrito} onChange={handleChange} options={envioDistritosList.map(d => ({ value: d, label: d }))} required disabled={envioDistritosList.length === 0} error={errors.envioDistrito} />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mostrar Dirección de Entrega o Agencia solo cuando ya se sabe si es Lima o Provincia */}
                                {(() => {
                                    const usarCliente = formData.usarDatosClienteParaEnvio
                                    // Lima = solo por departamento; si no es Lima → Provincia → Agencia de envío
                                    const esLima = usarCliente
                                        ? formData.clienteDepartamento === "Lima"
                                        : formData.envioDepartamento === "Lima"
                                    const tengoDestino = usarCliente || !!formData.envioDepartamento
                                    if (!tengoDestino) return null
                                    return esLima ? (
                                        <Input
                                            label="Dirección de Entrega (Si es en Lima)"
                                            name="envioDireccionLima"
                                            value={formData.envioDireccionLima}
                                            onChange={handleChange}
                                            placeholder="Av. Calle Nro, Mz Lt..."
                                            required
                                            className="md:col-span-2"
                                            error={errors.envioDireccionLima}
                                        />
                                    ) : (
                                        <Select
                                            label="Agencia de Envío (Si es a Provincia)"
                                            name="agenciaEnvio"
                                            value={formData.agenciaEnvio}
                                            onChange={handleChange}
                                            options={shippingAgencies.map(a => ({ value: a, label: a }))}
                                            placeholder="Seleccionar agencia de envío"
                                            required
                                            error={errors.agenciaEnvio}
                                        />
                                    )
                                })()}

                                <Input
                                    label="Fecha Aproximada de Envío"
                                    type="date"
                                    name="fechaEnvio"
                                    value={formData.fechaEnvio}
                                    onChange={handleChange}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* SECCIÓN 5: PAGO Y FACTURACIÓN */}
                    <AccordionItem value="pago">
                        <AccordionTrigger className="text-lg font-bold text-blue-700 bg-blue-50 px-4 rounded-t-lg hover:bg-blue-100 transition-colors">
                            5. Pago y Facturación
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 border-blue-100 rounded-b-lg bg-white shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Input
                                    label="Monto Total (S/)"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="montoTotal"
                                    value={formData.montoTotal}
                                    onChange={handleChange}
                                    error={errors.montoTotal}
                                />
                                <Input
                                    label="Adelanto (S/)"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="montoAdelanto"
                                    value={formData.montoAdelanto}
                                    onChange={handleChange}
                                    required
                                    error={errors.montoAdelanto}
                                />
                                <Input
                                    label="Saldo Pendiente (S/)"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="montoPendiente"
                                    value={formData.montoPendiente}
                                    onChange={handleChange}
                                    error={errors.montoPendiente}
                                />
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                                El cliente debe aportar <strong>S/ {formatMoney(0.3 * (parseMontoRobust(formData.montoTotal) || 0))}</strong> como mínimo (30% del monto total) para que el cliente NO sea mostacero.
                            </p>

                            <MultipleImageUpload
                                label="Comprobantes de Pago Iniciales (Opcional)"
                                currentFiles={formData.comprobantesPago}
                                onFilesChange={handleComprobantesPagoChange}
                            />

                            <div className="mt-6 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <Input
                                        label="Observaciones Generales"
                                        type="textarea"
                                        name="observacion"
                                        value={formData.observacion}
                                        onChange={handleChange}
                                        placeholder="Notas importantes sobre el pedido..."
                                    />
                                    <div className="flex flex-wrap gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="esPrioridad"
                                                name="esPrioridad"
                                                checked={formData.esPrioridad}
                                                onChange={handleChange}
                                                className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <label htmlFor="esPrioridad" className="ml-2 text-sm font-bold text-red-600">
                                                ¡Es Prioridad!
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex justify-end pt-6 border-t border-slate-200 mt-6 sticky bottom-0 bg-white p-4 z-10 shadow-up">
                    <Button variant="outline" onClick={onClose} className="mr-3">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" iconLeft={<Save className="w-4 h-4" />}>
                        {isEditMode ? "Guardar Cambios" : "Registrar Pedido"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
